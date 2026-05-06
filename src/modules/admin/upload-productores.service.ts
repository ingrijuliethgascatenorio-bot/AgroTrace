// src/modules/admin/upload-productores.service.ts
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
  ProductorUpdateCsvRowDto,
  UploadProductoresResult,
  UploadProductoresUpdateResult,
} from './upload-productores.dto';
import { Permission } from '../../common/enums/permissions.enum';

/**
 * UploadProductoresService
 *
 * procesarCSV()              → Carga masiva COMPLETA: crea usuario + productor + QR.
 * actualizarFincaUbicacion() → Recibe cedula + finca + ubicacion.
 *                              - Si el productor YA existe → actualiza finca y ubicacion.
 *                              - Si el productor NO existe → lo CREA con QR usando la cédula.
 *                              El usuario debe existir previamente en la tabla usuario.
 */
@Injectable()
export class UploadProductoresService {
  private readonly logger = new Logger(UploadProductoresService.name);

  constructor(private readonly dataSource: DataSource) {}

  // ─────────────────────────────────────────────────────────────────────────
  //  CREACIÓN MASIVA COMPLETA (usuario + productor + QR)
  // ─────────────────────────────────────────────────────────────────────────
  async procesarCSV(
    buffer: Buffer,
    asociacionId: number,
  ): Promise<UploadProductoresResult> {
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

    for (let i = 0; i < filas.length; i++) {
      const numeroFila = i + 2;
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
  //  ACTUALIZAR O CREAR finca + ubicacion + QR
  //
  //  Flujo por fila:
  //    1. Busca el usuario por cédula (debe existir en tabla usuario)
  //    2. Si ya tiene fila en productor → actualiza finca y ubicacion + regenera QR
  //    3. Si NO tiene fila en productor → la CREA con finca, ubicacion y QR
  // ─────────────────────────────────────────────────────────────────────────
  async actualizarFincaUbicacion(
    buffer: Buffer,
    asociacionId: number,
  ): Promise<UploadProductoresUpdateResult> {
    const filas = this._parsearCSV(buffer);

    if (filas.length === 0) {
      throw new BadRequestException(
        'El CSV está vacío o no tiene datos válidos.',
      );
    }
    if (filas.length > 500) {
      throw new BadRequestException(
        'El CSV supera el límite de 500 filas por carga.',
      );
    }

    const resultado: UploadProductoresUpdateResult = {
      actualizados: 0,
      errores: [],
    };

    for (let i = 0; i < filas.length; i++) {
      const numeroFila = i + 2;
      const fila = filas[i];

      try {
        // 1. Validar DTO
        const dto = plainToInstance(ProductorUpdateCsvRowDto, fila);
        const erroresValidacion = await validate(dto, { whitelist: true });

        if (erroresValidacion.length > 0) {
          const mensajes = erroresValidacion
            .map((e) => Object.values(e.constraints || {}).join(', '))
            .join(' | ');
          throw new Error(`Validación fallida: ${mensajes}`);
        }

        // 2. Buscar usuario por cédula en esta asociación
        const usuario = await this.dataSource.manager.findOne(Usuario, {
          where: { cedula: dto.cedula, asociacion_id: asociacionId },
        });

        if (!usuario) {
          throw new Error(
            `No existe usuario con cédula "${dto.cedula}" en esta asociación.`,
          );
        }

        // 3. Generar QR con la cédula
        const codigo_qr = await QRCode.toDataURL(dto.cedula, {
          errorCorrectionLevel: 'H',
          margin: 2,
          width: 300,
        });

        // 4. Buscar si ya tiene fila en productor
        const productorExistente = await this.dataSource.manager.findOne(
          Productor,
          {
            where: { id_usuario: usuario.id_usuario },
          },
        );

        if (productorExistente) {
          // ── Ya existe → actualizar finca, ubicacion y QR ───────────────────
          await this.dataSource.manager.update(
            Productor,
            { id_productor: productorExistente.id_productor },
            {
              ...(dto.finca?.trim() && { finca: dto.finca.trim() }),
              ...(dto.ubicacion?.trim() && { ubicacion: dto.ubicacion.trim() }),
              codigo_qr,
            },
          );
          this.logger.log(`Productor actualizado — cédula ${dto.cedula}`);
        } else {
          // ── No existe → CREAR fila en productor con QR ────────────────────
          const nuevoProductor = this.dataSource.manager.create(Productor, {
            finca: dto.finca?.trim() || null,
            ubicacion: dto.ubicacion?.trim() || null,
            estado: 'ACTIVO',
            codigo_qr,
            id_usuario: usuario.id_usuario,
            asociacion_id: asociacionId,
          });
          await this.dataSource.manager.save(Productor, nuevoProductor);
          this.logger.log(`Productor creado — cédula ${dto.cedula}`);
        }

        resultado.actualizados++;
      } catch (error) {
        const mensaje =
          error instanceof Error ? error.message : 'Error desconocido';
        resultado.errores.push({
          fila: numeroFila,
          cedula: String(fila.cedula ?? ''),
          error: mensaje,
        });
        this.logger.warn(`Fila ${numeroFila} omitida: ${mensaje}`);
      }
    }

    this.logger.log(
      `Actualización masiva asociación #${asociacionId}: ` +
        `${resultado.actualizados} procesados, ${resultado.errores.length} errores`,
    );

    return resultado;
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  Procesa UNA fila de creación COMPLETA en su propia transacción
  // ─────────────────────────────────────────────────────────────────────────
  private async _procesarFila(
    filaRaw: Record<string, string>,
    asociacionId: number,
    numeroFila: number,
  ): Promise<void> {
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

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Verificar email único
      const emailExiste = await queryRunner.manager.findOne(Usuario, {
        where: { email: dto.email, asociacion_id: asociacionId },
      });
      if (emailExiste) {
        throw new Error(
          `El email "${dto.email}" ya está registrado en esta asociación.`,
        );
      }

      // Verificar cédula única
      const cedulaExiste = await queryRunner.manager.findOne(Usuario, {
        where: { cedula: dto.cedula, asociacion_id: asociacionId },
      });
      if (cedulaExiste) {
        throw new Error(
          `La cédula "${dto.cedula}" ya está registrada en esta asociación.`,
        );
      }

      // Crear Usuario
      const passwordHash = await bcrypt.hash(dto.password, 10);
      const usuario = queryRunner.manager.create(Usuario, {
        nombre: dto.nombre.trim(),
        apellido: dto.apellido.trim(),
        email: dto.email.toLowerCase().trim(),
        password: passwordHash,
        telefono: dto.telefono?.trim() || null,
        cedula: dto.cedula,
        tipo_usuario: TipoUsuario.PRODUCTOR,
        activo: true,
        permisos: [Permission.COMPRAS, Permission.PRODUCTORES],
        asociacion_id: asociacionId,
      });

      const usuarioGuardado = await queryRunner.manager.save(Usuario, usuario);

      // Crear Productor
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

      // Generar QR con la cédula
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
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  Parsear CSV / Excel a array de objetos planos
  // ─────────────────────────────────────────────────────────────────────────
  private _parsearCSV(buffer: Buffer): Record<string, string>[] {
    try {
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
