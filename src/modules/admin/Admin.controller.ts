// src/modules/admin/Admin.controller.ts
import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../auth/roles.guard';
import { Permissions } from '../../common/decorators/permisos.decorator';
import { Permission } from '../../common/enums/permissions.enum';
import { Tenant } from '../../common/decorators/Tenant.descorador';

import { UploadProductoresService } from './upload-productores.service';
import { UploadProductoresResult } from './upload-productores.dto';

import { UploadUsuariosService } from './upload-usuarios.service';
import { UploadUsuariosResult } from './upload-usuarios.dto';

/** Configuración reutilizable para el interceptor de archivos CSV */
const csvFileInterceptor = () =>
  FileInterceptor('file', {
    storage: memoryStorage(),
    limits: {
      fileSize: 2 * 1024 * 1024, // 2 MB máximo
      files: 1,
    },
    fileFilter: (_req, file, cb) => {
      const mimeValido = [
        'text/csv',
        'text/plain',
        'application/csv',
        'application/vnd.ms-excel',
      ].includes(file.mimetype);

      const extValida = file.originalname.toLowerCase().endsWith('.csv');

      if (mimeValido || extValida) {
        cb(null, true);
      } else {
        cb(
          new BadRequestException(
            `Solo se aceptan archivos .csv. Tipo recibido: ${file.mimetype}`,
          ),
          false,
        );
      }
    },
  });

/**
 * AdminController
 *
 * POST /admin/upload-productores  → carga masiva de productores (crea usuario + productor + QR)
 * POST /admin/upload-usuarios     → carga masiva de usuarios (ADMIN / OPERARIO / PRODUCTOR)
 *
 * Ambos endpoints:
 * - Requieren JWT válido
 * - Reciben multipart/form-data con campo "file" (CSV, max 2 MB)
 * - Responden: { ok: true, data: { creados: number, errores: [...] } }
 */
@Controller('admin')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class AdminController {
  constructor(
    private readonly uploadProductoresService: UploadProductoresService,
    private readonly uploadUsuariosService: UploadUsuariosService,
  ) {}

  // ── POST /admin/upload-productores ─────────────────────────────────────
  @Post('upload-productores')
  @Permissions(Permission.PRODUCTORES)
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(csvFileInterceptor())
  async uploadProductores(
    @UploadedFile() file: Express.Multer.File,
    @Tenant() asociacionId: number,
  ): Promise<{ ok: boolean; data: UploadProductoresResult }> {
    if (!file) {
      throw new BadRequestException(
        'No se recibió ningún archivo. ' +
          'Asegúrate de enviar el campo "file" como multipart/form-data.',
      );
    }

    const resultado = await this.uploadProductoresService.procesarCSV(
      file.buffer,
      asociacionId,
    );

    return { ok: true, data: resultado };
  }

  // ── POST /admin/upload-usuarios ────────────────────────────────────────
  @Post('upload-usuarios')
  @Permissions(Permission.USUARIOS)
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(csvFileInterceptor())
  async uploadUsuarios(
    @UploadedFile() file: Express.Multer.File,
    @Tenant() asociacionId: number,
  ): Promise<{ ok: boolean; data: UploadUsuariosResult }> {
    if (!file) {
      throw new BadRequestException(
        'No se recibió ningún archivo. ' +
          'Asegúrate de enviar el campo "file" como multipart/form-data.',
      );
    }

    const resultado = await this.uploadUsuariosService.procesarCSV(
      file.buffer,
      asociacionId,
    );

    return { ok: true, data: resultado };
  }
}
