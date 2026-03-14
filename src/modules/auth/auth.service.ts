/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// src/modules/auth/auth.service.ts
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

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    @InjectRepository(Productor)
    private readonly productorRepository: Repository<Productor>,
  ) {}

  async register(
    registerDto: RegisterDto,
  ): Promise<{ usuario: Omit<Usuario, 'password'>; token: string }> {
    const usuario = await this.usersService.crearUsuario(
      registerDto.nombre,
      registerDto.apellido,
      registerDto.email,
      registerDto.password,
      registerDto.telefono || null,
      registerDto.tipo_usuario,
    );

    // Si el usuario es PRODUCTOR creamos el productor automáticamente
    if (registerDto.tipo_usuario === 'PRODUCTOR') {
      if (!registerDto.cedula) {
        throw new BadRequestException(
          'La cédula es obligatoria para productores',
        );
      }

      const qr = await QRCode.toDataURL(registerDto.cedula);

      const productor = this.productorRepository.create({
        //nombre: registerDto.nombre,
        cedula: registerDto.cedula,
        telefono: registerDto.telefono,
        estado: 'ACTIVO',
        codigo_qr: qr,
      });

      await this.productorRepository.save(productor);
    }

    const payload = {
      id_usuario: usuario.id_usuario,
      tipo_usuario: usuario.tipo_usuario,
      email: usuario.email,
      permisos: usuario.permisos,
    };

    const token = this.jwtService.sign(payload);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _pwd, ...usuarioSinPassword } = usuario;

    return { usuario: usuarioSinPassword, token };
  }

  async login(
    loginDto: LoginDto,
  ): Promise<{ usuario: Omit<Usuario, 'password'>; token: string }> {
    const { email, password } = loginDto;

    const usuario = await this.usersService.buscarPorEmail(email);

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

    const payload = {
      id_usuario: usuario.id_usuario,
      tipo_usuario: usuario.tipo_usuario,
      email: usuario.email,
      permisos: usuario.permisos,
    };

    const token = this.jwtService.sign(payload);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _pwd, ...usuarioSinPassword } = usuario;

    return { usuario: usuarioSinPassword, token };
  }
}
