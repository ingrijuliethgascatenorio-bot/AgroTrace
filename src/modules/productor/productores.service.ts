/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import * as QRCode from 'qrcode';

import { Productor } from './productores.entity';
import { CrearProductorDto, EditarProductorDto } from './productor.dto';
import { DataSource } from 'typeorm';
import { Usuario } from '../users/entities/usuario.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ProductoresService {
  constructor(
    @InjectRepository(Productor)
    private readonly productorRepo: Repository<Productor>,
    private readonly dataSource: DataSource,
  ) {}

  async crearDesdeUsuario(
    usuario: Usuario,
    dto: {
      cedula?: string;
      telefono?: string;
      finca?: string;
      ubicacion?: string;
    },
    asociacionId: number, // ← NUEVO
  ): Promise<Productor> {
    const cedulaLimpia = (dto.cedula || usuario.cedula || '').replace(
      /\D/g,
      '',
    );

    if (cedulaLimpia) {
      const existente = await this.productorRepo.findOne({
        where: { cedula: cedulaLimpia, asociacion_id: asociacionId }, // ← filtro tenant
      });
      if (existente) return existente;
    }

    const productor = this.productorRepo.create({
      cedula: cedulaLimpia || usuario.cedula || '',
      telefono: dto.telefono || usuario.telefono || '',
      finca: dto.finca || '',
      ubicacion: dto.ubicacion || '',
      id_usuario: usuario.id_usuario,
      estado: 'ACTIVO',
      asociacion_id: asociacionId, // ← NUEVO
    });
    const guardado = await this.productorRepo.save(productor);

    const codigo_qr = await this._generarQR(guardado.id_productor);
    await this.productorRepo.update(guardado.id_productor, { codigo_qr });
    guardado.codigo_qr = codigo_qr;

    return guardado;
  }

  // ── MODIFICADO: filtra por asociacion_id ─────────────────────────────────
  async listar(asociacionId: number): Promise<Productor[]> {
    return this.productorRepo.find({
      where: { estado: 'ACTIVO', asociacion_id: asociacionId }, // ← filtro tenant
      relations: ['usuario'],
      order: { id_productor: 'ASC' },
    });
  }

  async listarTodos(asociacionId: number): Promise<Productor[]> {
    return this.productorRepo.find({
      where: { asociacion_id: asociacionId }, // ← filtro tenant
      relations: ['usuario'],
      order: { id_productor: 'ASC' },
    });
  }

  async obtenerPorId(id: number, asociacionId: number): Promise<Productor> {
    const productor = await this.productorRepo.findOne({
      where: { id_productor: id, asociacion_id: asociacionId }, // ← filtro tenant
    });

    if (!productor) {
      throw new NotFoundException(`Productor con ID ${id} no encontrado.`);
    }

    return productor;
  }

  // ── MODIFICADO: crea con asociacion_id ───────────────────────────────────
  async crear(
    dto: CrearProductorDto,
    asociacionId: number,
  ): Promise<Productor> {
    return this.dataSource.transaction(async (manager) => {
      await this._verificarCedulaUnica(dto.cedula, undefined, asociacionId);

      const hash = await bcrypt.hash(dto.password, 10);
      const usuario = manager.create(Usuario, {
        nombre: dto.nombre,
        apellido: dto.apellido,
        email: dto.email,
        password: hash,
        telefono: dto.telefono,
        cedula: dto.cedula,
        tipo_usuario: 'PRODUCTOR',
        asociacion_id: asociacionId, // ← NUEVO
      });
      const usuarioGuardado = await manager.save(usuario);

      const productor = manager.create(Productor, {
        cedula: dto.cedula,
        telefono: dto.telefono,
        finca: dto.finca,
        ubicacion: dto.ubicacion,
        id_usuario: usuarioGuardado.id_usuario,
        estado: 'ACTIVO',
        asociacion_id: asociacionId, // ← NUEVO
      });
      const guardado = await manager.save(productor);

      const codigo_qr = await this._generarQR(
        guardado.id_productor,
        dto.cedula,
      );
      await manager.update(Productor, guardado.id_productor, { codigo_qr });
      guardado.codigo_qr = codigo_qr;

      return guardado;
    });
  }

  async editar(
    id: number,
    dto: EditarProductorDto,
    asociacionId: number,
  ): Promise<Productor> {
    const productor = await this.obtenerPorId(id, asociacionId);

    if (productor.estado === 'INACTIVO') {
      throw new ForbiddenException('No se puede editar un productor inactivo.');
    }

    if (dto.cedula && dto.cedula !== productor.cedula) {
      await this._verificarCedulaUnica(dto.cedula, id, asociacionId);
    }

    Object.assign(productor, dto);
    return this.productorRepo.save(productor);
  }

  async desactivar(
    id: number,
    asociacionId: number,
  ): Promise<{ mensaje: string; productor: Productor }> {
    const productor = await this.obtenerPorId(id, asociacionId);

    if (productor.estado === 'INACTIVO') {
      throw new ConflictException('El productor ya está inactivo.');
    }

    await this.productorRepo.update(id, { estado: 'INACTIVO' });
    productor.estado = 'INACTIVO';

    return {
      mensaje: 'Productor desactivado. Los datos históricos se conservan.',
      productor,
    };
  }

  async activar(
    id: number,
    asociacionId: number,
  ): Promise<{ mensaje: string; productor: Productor }> {
    const productor = await this.obtenerPorId(id, asociacionId);

    if (productor.estado === 'ACTIVO') {
      throw new ConflictException('El productor ya está activo.');
    }

    await this.productorRepo.update(id, { estado: 'ACTIVO' });
    productor.estado = 'ACTIVO';

    return {
      mensaje: 'Productor reactivado exitosamente.',
      productor,
    };
  }

  async buscarPorQR(qrCode: string, asociacionId: number): Promise<Productor> {
    const cedulaLimpia = qrCode?.trim().replace(/\D/g, '');

    if (!cedulaLimpia) {
      throw new BadRequestException(
        'El código QR no contiene una cédula válida.',
      );
    }

    const productor = await this.productorRepo.findOne({
      where: { cedula: cedulaLimpia, asociacion_id: asociacionId }, // ← filtro tenant
      relations: ['usuario'],
    });

    if (!productor) {
      throw new NotFoundException(
        `No se encontró ningún productor asociado al QR (cédula: ${cedulaLimpia}).`,
      );
    }

    if (productor.estado === 'INACTIVO') {
      throw new ForbiddenException(
        'El productor está INACTIVO y no puede registrar compras.',
      );
    }

    return productor;
  }

  async regenerarQR(id: number, asociacionId: number): Promise<Productor> {
    const productor = await this.obtenerPorId(id, asociacionId);
    const codigo_qr = await this._generarQR(id);
    await this.productorRepo.update(id, { codigo_qr });
    productor.codigo_qr = codigo_qr;
    return productor;
  }

  async regenerarQRTodos(asociacionId: number): Promise<{
    actualizados: number;
    errores: { id: number; motivo: string }[];
  }> {
    const productores = await this.productorRepo.find({
      where: { asociacion_id: asociacionId }, // ← filtro tenant
    });
    let actualizados = 0;
    const errores: { id: number; motivo: string }[] = [];

    for (const productor of productores) {
      try {
        const codigo_qr = await this._generarQR(productor.id_productor);
        await this.productorRepo.update(productor.id_productor, { codigo_qr });
        actualizados++;
      } catch (e) {
        errores.push({
          id: productor.id_productor,
          motivo: e instanceof Error ? e.message : 'Error desconocido',
        });
      }
    }

    return { actualizados, errores };
  }

  private async _generarQR(
    idProductor: number,
    cedulaDirecta?: string,
  ): Promise<string> {
    let cedulaLimpia: string;

    if (cedulaDirecta) {
      cedulaLimpia = cedulaDirecta.replace(/\D/g, '');
    } else {
      const productor = await this.productorRepo.findOne({
        where: { id_productor: idProductor },
      });
      cedulaLimpia = (productor?.cedula || '').replace(/\D/g, '');
    }

    if (!cedulaLimpia) {
      throw new BadRequestException(
        `El productor #${idProductor} no tiene cedula registrada.`,
      );
    }

    return QRCode.toDataURL(cedulaLimpia, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 300,
    });
  }

  private async _verificarCedulaUnica(
    cedula: string,
    excludeId?: number,
    asociacionId?: number,
  ): Promise<void> {
    const donde: any = { cedula };

    if (excludeId) donde.id_productor = Not(excludeId);
    if (asociacionId) donde.asociacion_id = asociacionId; // ← filtro tenant

    const existente = await this.productorRepo.findOne({ where: donde });

    if (existente) {
      throw new ConflictException(
        `Ya existe un productor registrado con la cédula ${cedula}.`,
      );
    }
  }
}
