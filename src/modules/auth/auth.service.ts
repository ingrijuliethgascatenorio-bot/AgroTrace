// src/modules/auth/auth.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { Usuario, TipoUsuario } from '../users/entities/usuario.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Productor } from '../productor/productores.entity';
import * as QRCode from 'qrcode';

// ── Control de intentos fallidos de login ─────────────────────────────────────
// Clave: `${email}:${asociacionId}` → { intentos, bloqueadoHasta }
// Se guarda en memoria; se limpia automáticamente al desbloquear.
// Si el proceso reinicia, los contadores se resetean (comportamiento aceptable).

const MAX_INTENTOS = 5;
const BLOQUEO_MS   = 15 * 60 * 1000; // 15 minutos

interface EntradaIntentos {
  intentos: number;
  bloqueadoHasta: number | null; // timestamp ms, o null si no está bloqueado
}

const _intentosFallidos = new Map<string, EntradaIntentos>();

function _claveIntentos(email: string, asociacionId: number): string {
  return `${email.toLowerCase()}:${asociacionId}`;
}

function _obtenerEntrada(clave: string): EntradaIntentos {
  return _intentosFallidos.get(clave) ?? { intentos: 0, bloqueadoHasta: null };
}

function _registrarFallo(clave: string): EntradaIntentos {
  const entrada = _obtenerEntrada(clave);
  const nuevosIntentos = entrada.intentos + 1;

  const actualizada: EntradaIntentos = {
    intentos: nuevosIntentos,
    bloqueadoHasta:
      nuevosIntentos >= MAX_INTENTOS
        ? Date.now() + BLOQUEO_MS
        : null,
  };

  _intentosFallidos.set(clave, actualizada);
  return actualizada;
}

function _limpiarIntentos(clave: string): void {
  _intentosFallidos.delete(clave);
}

// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,

    @InjectRepository(Productor)
    private readonly productorRepository: Repository<Productor>,
  ) {}

  // ── REGISTRO ──────────────────────────────────────────────────────────────
  async register(
    registerDto: RegisterDto,
    asociacionId: number,
  ): Promise<{ usuario: Omit<Usuario, 'password'>; token: string }> {
    // FIX: crearUsuario ahora acepta 8 argumentos (cedula es el 8vo)
    const usuario = await this.usersService.crearUsuario(
      registerDto.nombre,
      registerDto.apellido,
      registerDto.email,
      registerDto.password,
      registerDto.telefono || null,
      registerDto.tipo_usuario as TipoUsuario, // cast seguro desde DTO
      asociacionId,
      registerDto.cedula || null, // ← 8vo arg: cedula en usuario
    );

    // Solo crear Productor si el rol es PRODUCTOR
    if (registerDto.tipo_usuario === TipoUsuario.PRODUCTOR) {
      if (!usuario.cedula) {
        throw new BadRequestException(
          'La cédula es obligatoria para productores',
        );
      }

      // QR generado con la cédula del usuario (limpia, solo dígitos)
      const cedulaLimpia = usuario.cedula.replace(/\D/g, '');
      const qr = await QRCode.toDataURL(cedulaLimpia, {
        errorCorrectionLevel: 'H',
        margin: 2,
        width: 300,
      });

      // FIX: no se pasan cedula/telefono al productor — viven en usuario
      const productor = this.productorRepository.create({
        ubicacion: (registerDto as any).ubicacion || null,
        finca: (registerDto as any).finca || null,
        estado: 'ACTIVO',
        codigo_qr: qr,
        id_usuario: usuario.id_usuario, // FK explícita
        asociacion_id: asociacionId,
      });

      await this.productorRepository.save(productor);
    }

    const token = this._firmarToken(usuario);
    const { password: _pwd, ...usuarioSinPassword } = usuario;

    return { usuario: usuarioSinPassword, token };
  }

  // ── LOGIN ─────────────────────────────────────────────────────────────────
  async login(
    loginDto: LoginDto,
    asociacionId: number,
  ): Promise<{ usuario: Omit<Usuario, 'password'>; token: string }> {
    const { email, password } = loginDto;

    // ── Buscar usuario ─────────────────────────────────────────────────────
    let usuario: Usuario | null = null;
    if (asociacionId) {
      usuario = await this.usersService.buscarPorEmailYAsociacion(
        email,
        asociacionId,
      );
    } else {
      usuario = await this.usersService.buscarPorEmail(email);
    }

    const actualAsociacionId = usuario ? usuario.asociacion_id : (asociacionId || 0);
    const clave = _claveIntentos(email, actualAsociacionId);
    const entrada = _obtenerEntrada(clave);

    // ── Verificar si está bloqueado ────────────────────────────────────────
    if (entrada.bloqueadoHasta !== null) {
      const ahora = Date.now();
      if (ahora < entrada.bloqueadoHasta) {
        const horaDesbloqueo = new Date(entrada.bloqueadoHasta).toLocaleTimeString(
          'es-CO',
          { hour: '2-digit', minute: '2-digit', hour12: true },
        );
        throw new BadRequestException(
          `Cuenta bloqueada hasta las ${horaDesbloqueo} por demasiados intentos fallidos.`,
        );
      } else {
        // El bloqueo expiró — limpiar
        _limpiarIntentos(clave);
      }
    }

    if (!usuario) {
      const actualizada = _registrarFallo(clave);
      throw new BadRequestException(
        _mensajeCredencialesInvalidas(actualizada),
      );
    }

    // ── Verificar contraseña ───────────────────────────────────────────────
    const passwordValida = await this.usersService.verificarPassword(
      password,
      usuario.password,
    );

    if (!passwordValida) {
      const actualizada = _registrarFallo(clave);
      throw new BadRequestException(
        _mensajeCredencialesInvalidas(actualizada),
      );
    }

    // ── Login exitoso — limpiar contador ──────────────────────────────────
    _limpiarIntentos(clave);

    const token = this._firmarToken(usuario);
    const { password: _pwd, ...usuarioSinPassword } = usuario;

    return { usuario: usuarioSinPassword, token };
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  private _firmarToken(usuario: Usuario): string {
    const payload = {
      id_usuario: usuario.id_usuario,
      tipo_usuario: usuario.tipo_usuario,
      email: usuario.email,
      permisos: usuario.permisos,
      asociacion_id: usuario.asociacion_id,
    };

    // FIX OFFLINE: OPERARIO y PRODUCTOR trabajan en fincas sin internet
    // durante días/semanas. Con JWT de 1 día quedan bloqueados en campo.
    // ADMIN siempre tiene internet (oficina) — mantiene 1 día.
    const rolSinInternet = ['OPERARIO', 'PRODUCTOR'].includes(
      usuario.tipo_usuario,
    );
    const expiresIn = rolSinInternet
      ? 60 * 60 * 24 * 30 // 30 días para OPERARIO y PRODUCTOR
      : 60 * 60 * 24 * 1; // 1 día solo para ADMIN

    return this.jwtService.sign(payload, { expiresIn });
  }
}

// ── Helpers privados del módulo ───────────────────────────────────────────────

function _mensajeCredencialesInvalidas(entrada: EntradaIntentos): string {
  const intentosRestantes = MAX_INTENTOS - entrada.intentos;

  if (entrada.bloqueadoHasta !== null) {
    // Recién se alcanzó el límite — incluir la hora de desbloqueo
    const horaDesbloqueo = new Date(entrada.bloqueadoHasta).toLocaleTimeString(
      'es-CO',
      { hour: '2-digit', minute: '2-digit', hour12: true },
    );
    return `Cuenta bloqueada hasta las ${horaDesbloqueo} por demasiados intentos fallidos.`;
  }

  if (intentosRestantes <= 2) {
    return (
      `Correo o contraseña incorrectos. ` +
      `Te quedan ${intentosRestantes} intento${intentosRestantes !== 1 ? 's' : ''}.`
    );
  }

  return 'Correo o contraseña incorrectos.';
}
