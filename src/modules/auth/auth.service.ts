// src/modules/auth/auth.service.ts  — REEMPLAZA el archivo existente
import { Injectable, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { Usuario } from '../users/entities/usuario.entity';
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

  // ── REGISTRO ─────────────────────────────────────────────────────────────
  async register(
    registerDto: RegisterDto,
    asociacionId: number, // ← recibido del middleware
  ): Promise<{ usuario: Omit<Usuario, 'password'>; token: string }> {
    const usuario = await this.usersService.crearUsuario(
      registerDto.nombre,
      registerDto.apellido,
      registerDto.email,
      registerDto.password,
      registerDto.telefono || null,
      registerDto.tipo_usuario,
      asociacionId, // ← pasa al servicio de usuarios
    );

    if (registerDto.tipo_usuario === 'PRODUCTOR') {
      if (!registerDto.cedula) {
        throw new BadRequestException(
          'La cédula es obligatoria para productores',
        );
      }

      const cedulaSoloNumeros = registerDto.cedula.replace(/\D/g, '');

      const qr = await QRCode.toDataURL(cedulaSoloNumeros, {
        errorCorrectionLevel: 'H',
        margin: 2,
        width: 300,
      });

      const productor = this.productorRepository.create({
        cedula: cedulaSoloNumeros,
        telefono: registerDto.telefono || null,
        ubicacion: (registerDto as any).ubicacion || null,
        estado: 'ACTIVO',
        codigo_qr: qr,
        id_usuario: usuario.id_usuario,
        asociacion_id: asociacionId, // ← NUEVO
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
    asociacionId: number, // ← recibido del middleware
  ): Promise<{ usuario: Omit<Usuario, 'password'>; token: string }> {
    const { email, password } = loginDto;

    console.log('>>> asociacionId recibido:', asociacionId); // ← AGREGAR
    console.log('>>> email:', email); // ← AGREGAR

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
      asociacion_id: usuario.asociacion_id, // 🔥 CLAVE
    };
    return this.jwtService.sign(payload);
  }
}
