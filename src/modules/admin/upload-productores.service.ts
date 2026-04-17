// src/modules/admin/services/upload-productores.service.ts
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import * as bcrypt from 'bcrypt';
import * as QRCode from 'qrcode';
import { parse } from 'csv-parse/sync';

import { Usuario, TipoUsuario } from '../users/entities/usuario.entity';
import { Productor } from '../productor/productores.entity';
import {
  ProductorCsvRowDto,
  UploadProductoresResult,
} from './upload-productores.dto';
import { Permission } from '../../common/enums/permissions.enum';

/**
 * UploadProductoresService
 *
 * Carga masiva de productores desde un CSV.
 * - Cada fila se procesa en su propia transacción para que un error
 *   en una fila no aborte las demás.
 * - Usa QueryRunner para control explícito de transacciones.
 * - Hashea passwords con bcrypt (costo 10).
 * - Valida email único + cédula única POR ASOCIACIÓN.
 * - Genera QR automáticamente.
 */
@Injectable()
export class UploadProductoresService {
  private readonly logger = new Logger(UploadProductoresService.name);

  constructor(private readonly dataSource: DataSource) {}

  // ─────────────────────────────────────────────────────────────────────────
  async procesarCSV(
    buffer: Buffer,
    asociacionId: number,
  ): Promise<UploadProductoresResult> {
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

    const resultado: UploadProductoresResult = { creados: 0, errores: [] };

    // 2. Procesar cada fila de forma independiente
    for (let i = 0; i < filas.length; i++) {
      const numeroFila = i + 2; // +2 porque la fila 1 es el encabezado
      const fila = filas[i];

      try {
        await this._procesarFila(fila, asociacionId, numeroFila);
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
          },
          error: mensaje,
        });

        this.logger.warn(`Fila ${numeroFila} omitida: ${mensaje}`);
      }
    }

    this.logger.log(
      `Carga masiva asociación #${asociacionId}: ` +
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
    numeroFila: number,
  ): Promise<void> {
    // 2a. Transformar y validar con class-validator
    const dto = plainToInstance(ProductorCsvRowDto, filaRaw);
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

    // 2b. Transacción por fila
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // ── Verificar email único en esta asociación ──────────────────────────
      const emailExiste = await queryRunner.manager.findOne(Usuario, {
        where: { email: dto.email, asociacion_id: asociacionId },
      });
      if (emailExiste) {
        throw new Error(
          `El email "${dto.email}" ya está registrado en esta asociación.`,
        );
      }

      // ── Verificar cédula única en esta asociación ─────────────────────────
      const cedulaExisteEnUsuario = await queryRunner.manager.findOne(Usuario, {
        where: { cedula: dto.cedula, asociacion_id: asociacionId },
      });
      if (cedulaExisteEnUsuario) {
        throw new Error(
          `La cédula "${dto.cedula}" ya está registrada en esta asociación.`,
        );
      }

      // ── Crear Usuario ─────────────────────────────────────────────────────
      const passwordHash = await bcrypt.hash(dto.password, 10);

      const usuario = queryRunner.manager.create(Usuario, {
        nombre: dto.nombre.trim(),
        apellido: dto.apellido.trim(),
        email: dto.email.toLowerCase().trim(),
        password: passwordHash,
        telefono: dto.telefono?.trim() || null,
        cedula: dto.cedula, // ya limpia por @Transform
        tipo_usuario: TipoUsuario.PRODUCTOR,
        activo: true,
        permisos: [Permission.COMPRAS, Permission.PRODUCTORES],
        asociacion_id: asociacionId,
      });

      const usuarioGuardado = await queryRunner.manager.save(Usuario, usuario);

      // ── Crear Productor ───────────────────────────────────────────────────
      const productor = queryRunner.manager.create(Productor, {
        finca: dto.finca?.trim() || null,
        ubicacion: dto.ubicacion?.trim() || null,
        tipo_certificacion: dto.tipo_certificacion?.trim() || null,
        estado: 'ACTIVO',
        id_usuario: usuarioGuardado.id_usuario,
        asociacion_id: asociacionId,
      });

      const productorGuardado = await queryRunner.manager.save(
        Productor,
        productor,
      );

      // ── Generar QR (basado en la cédula) ──────────────────────────────────
      const codigo_qr = await QRCode.toDataURL(dto.cedula, {
        errorCorrectionLevel: 'H',
        margin: 2,
        width: 300,
      });

      await queryRunner.manager.update(
        Productor,
        productorGuardado.id_productor,
        { codigo_qr },
      );

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error; // se propaga al loop principal
    } finally {
      await queryRunner.release();
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Parsear CSV a array de objetos planos
  // ─────────────────────────────────────────────────────────────────────────
  private _parsearCSV(buffer: Buffer): Record<string, string>[] {
    try {
      const registros = parse(buffer, {
        columns: true, // primera fila = nombres de columnas
        skip_empty_lines: true,
        trim: true,
        bom: true, // maneja archivos exportados desde Excel (UTF-8 BOM)
        cast: false, // todo como string, validamos con class-validator
        relax_quotes: true,
        relax_column_count: true,
      }) as Record<string, string>[];

      return registros;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error desconocido';
      throw new BadRequestException(`Error al parsear el CSV: ${msg}`);
    }
  }
}
