/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
// src/modules/auth/jwt.strategy.ts  — REEMPLAZA el archivo existente
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../users/users.service';

export interface JwtPayload {
  id_usuario: number;
  tipo_usuario: string;
  email: string;
  permisos: string[];
  asociacion_id: number; // ← NUEVO campo multi-tenant
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'secret_agrotrace_2024',
      passReqToCallback: true, // ← necesario para leer req.asociacionId
    });
  }

  async validate(
    req: any,
    payload: JwtPayload,
  ): Promise<Omit<any, 'password'>> {
    // 1. El usuario debe existir y estar activo
    const usuario = await this.usersService.buscarPorId(payload.id_usuario);
    if (!usuario || !usuario.activo) {
      throw new UnauthorizedException('Sesión inválida o usuario inactivo');
    }

    // 2. El token debe pertenecer a la misma asociación que el subdominio
    const tenantIdDelSubdominio: number = req.asociacionId;
    if (
      tenantIdDelSubdominio &&
      payload.asociacion_id !== tenantIdDelSubdominio
    ) {
      throw new UnauthorizedException('No tienes acceso a esta asociación');
    }

    const { password: _, ...user } = usuario;
    return { ...user, asociacion_id: payload.asociacion_id };
  }
}
