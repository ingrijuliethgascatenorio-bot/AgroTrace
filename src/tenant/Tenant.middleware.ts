/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// src/tenant/tenant.middleware.ts
import {
  Injectable,
  NestMiddleware,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asociacion } from './asociacion.entity';

/**
 * TenantMiddleware
 * ─────────────────────────────────────────────────────────────
 * Lee el header Host, extrae el subdominio, busca la asociación
 * en la BD y adjunta { asociacionId, subdominio } al objeto request.
 *
 * Ejemplos de Host header:
 *   asoc1.agrotrace.com  → subdominio = 'asoc1'
 *   localhost:3000        → se omite (modo desarrollo)
 *   agrotrace.com        → sin subdominio → 404
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    @InjectRepository(Asociacion)
    private readonly asociacionRepo: Repository<Asociacion>,
  ) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const host = req.hostname; // ej: 'asoc1.agrotrace.com' o 'localhost'

    // ── Modo desarrollo: sin subdominio → saltar ──────────────
    if (host === 'localhost' || host === '127.0.0.1') {
      // En desarrollo puedes forzar un tenant por variable de entorno
      const devTenantId = parseInt(process.env.DEV_TENANT_ID || '1', 10);
      (req as any).asociacionId = devTenantId;
      (req as any).subdominio = 'dev';
      return next();
    }

    // ── Extraer subdominio ────────────────────────────────────
    // 'asoc1.agrotrace.com' → partes = ['asoc1', 'agrotrace', 'com']
    const partes = host.split('.');
    if (partes.length < 3) {
      throw new NotFoundException(
        'Accede a través de tu subdominio: tuasociacion.agrotrace.com',
      );
    }
    const subdominio = partes[0].toLowerCase();

    // ── Buscar asociación ─────────────────────────────────────
    const asociacion = await this.asociacionRepo.findOne({
      where: { subdominio },
    });

    if (!asociacion) {
      throw new NotFoundException(
        `No existe una asociación registrada para el subdominio: ${subdominio}`,
      );
    }

    if (asociacion.estado !== 'ACTIVO') {
      throw new ForbiddenException(
        `La asociación "${asociacion.nombre}" está ${asociacion.estado.toLowerCase()}.`,
      );
    }

    // ── Inyectar en request ───────────────────────────────────
    (req as any).asociacionId = asociacion.id;
    (req as any).subdominio = asociacion.subdominio;

    next();
  }
}
