// src/modules/admin/upload-usuarios.service.ts
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import * as bcrypt from 'bcrypt';
import { parse } from 'csv-parse/sync';

import { Usuario, TipoUsuario } from '../users/entities/usuario.entity';
import { Permission } from '../../common/enums/permissions.enum';
import { UsuarioCsvRowDto, UploadUsuariosResult } from './upload-usuarios.dto';

/**
 * UploadUsuariosService
 *
 * Carga masiva de usuarios (ADMIN / OPERARIO / PRODUCTOR) desde CSV.
 * - Cada fila se procesa en su propia transacción: un error en una fila
 *   no aborta las demás.
 * - Valida email único + cédula única POR ASOCIACIÓN.
 * - Hashea passwords con bcrypt (costo 10).
 * - Asigna permisos por defecto según tipo_usuario.
 *
 * NOTA: si tipo_usuario es PRODUCTOR, solo crea el registro en la tabla
 * `usuario`. El registro en la tabla `productor` (finca, ubicacion, QR)
 * debe crearse mediante el endpoint /admin/upload-productores o
 * manualmente desde el panel.
 */
@Injectable()
export class UploadUsuariosService {
  private readonly logger = new Logger(UploadUsuariosService.name);

  constructor(private readonly dataSource: DataSource) {}

  // ─────────────────────────────────────────────────────────────────────────
  async procesarCSV(
    buffer: Buffer,
    asociacionId: number,
  ): Promise<UploadUsuariosResult> {
    // 1. Parsear CSV
    const filas = this._parsearCSV(buffer);

    if (filas.length === 0) {
      throw new BadRequestException(
        'El CSV está vacío o no tiene datos válidos.',
      );
    }

    if (filas.length > 500) {
      throw new BadRequestException(
        'El CSV supera el límite de 500 filas por carga. Divídelo en archivos más pequeños.',
      );
    }

    const resultado: UploadUsuariosResult = { creados: 0, errores: [] };

    // 2. Procesar cada fila de forma independiente
    for (let i = 0; i < filas.length; i++) {
      const numeroFila = i + 2; // +2 porque fila 1 es el encabezado
      const fila = filas[i];

      try {
        await this._procesarFila(fila, asociacionId);
        resultado.creados++;
      } catch (error) {
        const mensaje =
          error instanceof Error ? error.message : 'Error desconocido';

        resultado.errores.push({
          fila: numeroFila,
          datos: {
            nombre: fila.nombre,
            apellido: fila.apellido,
            email: fila.email,
            cedula: fila.cedula,
            tipo_usuario: fila.tipo_usuario as TipoUsuario,
          },
          error: mensaje,
        });

        this.logger.warn(`Fila ${numeroFila} omitida: ${mensaje}`);
      }
    }

    this.logger.log(
      `Carga masiva usuarios asociación #${asociacionId}: ` +
        `${resultado.creados} creados, ${resultado.errores.length} errores`,
    );

    return resultado;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Procesa UNA fila en su propia transacción
  // ─────────────────────────────────────────────────────────────────────────
  private async _procesarFila(
    filaRaw: Record<string, string>,
    asociacionId: number,
  ): Promise<void> {
    // Transformar y validar con class-validator
    const dto = plainToInstance(UsuarioCsvRowDto, filaRaw);
    const erroresValidacion = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: false,
    });

    if (erroresValidacion.length > 0) {
      const mensajes = erroresValidacion
        .map((e) => Object.values(e.constraints || {}).join(', '))
        .join(' | ');
      throw new Error(`Validación fallida: ${mensajes}`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // ── Verificar email único en esta asociación ──────────────────────────
      const emailExiste = await queryRunner.manager.findOne(Usuario, {
        where: {
          email: dto.email.toLowerCase().trim(),
          asociacion_id: asociacionId,
        },
      });
      if (emailExiste) {
        throw new Error(
          `El email "${dto.email}" ya está registrado en esta asociación.`,
        );
      }

      // ── Verificar cédula única en esta asociación (si se proporciona) ─────
      if (dto.cedula) {
        const cedulaExiste = await queryRunner.manager.findOne(Usuario, {
          where: { cedula: dto.cedula, asociacion_id: asociacionId },
        });
        if (cedulaExiste) {
          throw new Error(
            `La cédula "${dto.cedula}" ya está registrada en esta asociación.`,
          );
        }
      }

      // ── Crear Usuario ─────────────────────────────────────────────────────
      const passwordHash = await bcrypt.hash(dto.password, 10);
      const permisos = this._obtenerPermisosPorDefecto(dto.tipo_usuario);

      const usuario = queryRunner.manager.create(Usuario, {
        nombre: dto.nombre.trim(),
        apellido: dto.apellido.trim(),
        email: dto.email.toLowerCase().trim(),
        password: passwordHash,
        telefono: dto.telefono?.trim() || null,
        cedula: dto.cedula || null,
        tipo_usuario: dto.tipo_usuario,
        activo: true,
        permisos,
        asociacion_id: asociacionId,
      });

      await queryRunner.manager.save(Usuario, usuario);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Permisos por defecto según rol
  // ─────────────────────────────────────────────────────────────────────────
  private _obtenerPermisosPorDefecto(tipo_usuario: TipoUsuario): string[] {
    switch (tipo_usuario) {
      case TipoUsuario.ADMIN:
        return Object.values(Permission);
      case TipoUsuario.OPERARIO:
        return [Permission.DASHBOARD, Permission.VENTAS];
      case TipoUsuario.PRODUCTOR:
        return [Permission.COMPRAS, Permission.PRODUCTORES];
      default:
        return [];
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Parsear CSV a array de objetos planos
  // ─────────────────────────────────────────────────────────────────────────
  private _parsearCSV(buffer: Buffer): Record<string, string>[] {
    try {
      // ── Detectar si es Excel por magic bytes ──────────────────────────────
      // XLSX: comienza con PK (50 4B) — es un ZIP
      // XLS:  comienza con D0 CF 11 E0
      const esXlsx = buffer[0] === 0x50 && buffer[1] === 0x4b;
      const esXls = buffer[0] === 0xd0 && buffer[1] === 0xcf;

      if (esXlsx || esXls) {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const XLSX = require('xlsx') as typeof import('xlsx');
        const wb = XLSX.read(buffer, {
          type: 'buffer',
          cellText: true,
          raw: false,
        });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const csvStr = XLSX.utils.sheet_to_csv(ws, {
          blankrows: false,
          rawNumbers: false,
        });
        buffer = Buffer.from(csvStr, 'utf-8');
      }

      const registros = parse(buffer, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true,
        cast: false,
        relax_quotes: true,
        relax_column_count: true,
      }) as Record<string, string>[];

      return registros;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error desconocido';
      throw new BadRequestException(`Error al parsear el archivo: ${msg}`);
    }
  }
}
