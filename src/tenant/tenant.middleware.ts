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
    const path = req.path;

    // ── Excluir recursos estáticos (cualquier ruta que no empiece con /api) y /api/auth/login ──
    if (!path.startsWith('/api') || path === '/api/auth/login') {
      return next();
    }

    const host = req.hostname; // ej: 'asoc1.agrotrace.julieth.site' o 'localhost'

    // ── Modo desarrollo / ngrok ───────────────────────────────
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host.includes('ngrok-free.dev')
    ) {
      const devTenantId = parseInt(process.env.DEV_TENANT_ID || '1', 10);

      (req as any).asociacionId = devTenantId;
      (req as any).subdominio = 'dev';

      console.log(`Modo DEV activo para host: ${host}`);

      return next();
    }

    // ── Extraer subdominio ────────────────────────────────────
    const partes = host.split('.');
    if (partes.length < 3) {
      // No hay subdominio de tenant (ej. dominio de nivel superior directo), procedemos sin inyectar tenant
      return next();
    }
    const subdominio = partes[0].toLowerCase();

    // Si el subdominio es 'www' o 'agrotrace' (el host principal), omitimos la validación en el middleware
    if (subdominio === 'www' || subdominio === 'agrotrace') {
      return next();
    }

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
