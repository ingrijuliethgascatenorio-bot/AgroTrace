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

    const usuario = await this.usersService.buscarPorEmailYAsociacion(
      email,
      asociacionId,
    );

    if (!usuario) {
      throw new BadRequestException('Email o contraseña incorrectos');
    }

    const passwordValida = await this.usersService.verificarPassword(
      password,
      usuario.password,
    );

    if (!passwordValida) {
      throw new BadRequestException('Email o contraseña incorrectos');
    }

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
    return this.jwtService.sign(payload);
  }
}
