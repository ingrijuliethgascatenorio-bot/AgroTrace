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
import {
  UploadProductoresResult,
  UploadProductoresUpdateResult,
} from './upload-productores.dto';

import { UploadUsuariosService } from './upload-usuarios.service';
import { UploadUsuariosResult } from './upload-usuarios.dto';

/** Configuración reutilizable para el interceptor de archivos CSV / Excel */
const csvFileInterceptor = () =>
  FileInterceptor('file', {
    storage: memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024, // 5 MB máximo
      files: 1,
    },
    fileFilter: (_req, file, cb) => {
      const mimeValido = [
        'text/csv',
        'text/plain',
        'application/csv',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'application/octet-stream',
        'application/zip',
      ].includes(file.mimetype);

      const nombreLower = file.originalname.toLowerCase();
      const extValida =
        nombreLower.endsWith('.csv') ||
        nombreLower.endsWith('.xlsx') ||
        nombreLower.endsWith('.xls');

      if (mimeValido || extValida) {
        cb(null, true);
      } else {
        cb(
          new BadRequestException(
            `Solo se aceptan archivos .csv, .xlsx o .xls. Tipo recibido: ${file.mimetype}`,
          ),
          false,
        );
      }
    },
  });

/**
 * AdminController
 *
 * POST /admin/upload-productores         → carga masiva (crea usuario + productor + QR)
 * POST /admin/upload-productores-update  → actualización masiva (solo finca y ubicacion)
 * POST /admin/upload-usuarios            → carga masiva de usuarios
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

  // ── POST /admin/upload-productores-update ──────────────────────────────
  @Post('upload-productores-update')
  @Permissions(Permission.PRODUCTORES)
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(csvFileInterceptor())
  async uploadProductoresUpdate(
    @UploadedFile() file: Express.Multer.File,
    @Tenant() asociacionId: number,
  ): Promise<{ ok: boolean; data: UploadProductoresUpdateResult }> {
    if (!file) {
      throw new BadRequestException(
        'No se recibió ningún archivo. ' +
          'Asegúrate de enviar el campo "file" como multipart/form-data.',
      );
    }

    const resultado =
      await this.uploadProductoresService.actualizarFincaUbicacion(
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
