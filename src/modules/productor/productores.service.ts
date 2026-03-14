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

  /**
   * Crea el registro en la tabla productores a partir de un usuario ya creado.
   * Llamar desde auth.service.ts cuando tipo_usuario === 'PRODUCTOR':
   *
   *   if (dto.tipo_usuario === 'PRODUCTOR') {
   *     await this.productoresService.crearDesdeUsuario(usuarioGuardado, dto);
   *   }
   */
  async crearDesdeUsuario(
    usuario: Usuario,
    dto: {
      cedula?: string;
      telefono?: string;
      finca?: string;
      ubicacion?: string;
    },
  ): Promise<Productor> {
    const cedulaLimpia = (dto.cedula || usuario.cedula || '').replace(/\D/g, '');

    // Si ya existe un productor con esa cédula no duplicar
    if (cedulaLimpia) {
      const existente = await this.productorRepo.findOne({ where: { cedula: cedulaLimpia } });
      if (existente) return existente;
    }

    const productor = this.productorRepo.create({
      cedula: cedulaLimpia || usuario.cedula || '',
      telefono: dto.telefono || usuario.telefono || '',
      finca: dto.finca || '',
      ubicacion: dto.ubicacion || '',
      id_usuario: usuario.id_usuario,
      estado: 'ACTIVO',
    });
    const guardado = await this.productorRepo.save(productor);

    // QR con cédula solo números
    const codigo_qr = await this._generarQR(guardado.id_productor);
    await this.productorRepo.update(guardado.id_productor, { codigo_qr });
    guardado.codigo_qr = codigo_qr;

    return guardado;
  }

  async listar(): Promise<Productor[]> {
    return this.productorRepo.find({
      where: { estado: 'ACTIVO' },
      relations: ['usuario'], // ← agregar esto
      order: { id_productor: 'ASC' },
    });
  }

  async listarTodos(): Promise<Productor[]> {
    return this.productorRepo.find({
      relations: ['usuario'], // ← agregar esto
      order: { id_productor: 'ASC' },
    });
  }

  async obtenerPorId(id: number): Promise<Productor> {
    const productor = await this.productorRepo.findOne({
      where: { id_productor: id },
    });

    if (!productor) {
      throw new NotFoundException(`Productor con ID ${id} no encontrado.`);
    }

    return productor;
  }

  async crear(dto: CrearProductorDto): Promise<Productor> {
    return this.dataSource.transaction(async (manager) => {
      // 1. Verificar cédula única
      await this._verificarCedulaUnica(dto.cedula);

      // 2. Crear usuario
      const hash = await bcrypt.hash(dto.password, 10);
      const usuario = manager.create(Usuario, {
        nombre: dto.nombre,
        apellido: dto.apellido,
        email: dto.email,
        password: hash,
        telefono: dto.telefono,
        cedula: dto.cedula,
        tipo_usuario: 'PRODUCTOR',
      });
      const usuarioGuardado = await manager.save(usuario);

      // 3. Crear productor vinculado
      const productor = manager.create(Productor, {
        //nombre: dto.nombre,
        cedula: dto.cedula,
        telefono: dto.telefono,
        finca: dto.finca,
        ubicacion: dto.ubicacion,
        id_usuario: usuarioGuardado.id_usuario,
        estado: 'ACTIVO',
      });
      const guardado = await manager.save(productor);

      // 4. Generar QR
      const codigo_qr = await this._generarQR(guardado.id_productor);
      await manager.update(Productor, guardado.id_productor, { codigo_qr });
      guardado.codigo_qr = codigo_qr;

      return guardado;
    });
  }

  async editar(id: number, dto: EditarProductorDto): Promise<Productor> {
    const productor = await this.obtenerPorId(id);

    if (productor.estado === 'INACTIVO') {
            throw new ForbiddenException('No se puede editar un productor inactivo.');
        }

        if (dto.cedula && dto.cedula !== productor.cedula) {
            await this._verificarCedulaUnica(dto.cedula, id);
        }

        Object.assign(productor, dto);

        return this.productorRepo.save(productor);
    }

  async desactivar(
    id: number,
  ): Promise<{ mensaje: string; productor: Productor }> {

        const productor = await this.obtenerPorId(id);

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
  ): Promise<{ mensaje: string; productor: Productor }> {
        const productor = await this.obtenerPorId(id);

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

    async buscarPorQR(qrCode: string): Promise<Productor> {
        // El QR ahora contiene solo los números de la cédula
        const cedulaLimpia = qrCode?.trim().replace(/\D/g, '');

        if (!cedulaLimpia) {
            throw new BadRequestException(
                'El código QR no contiene una cédula válida.',
            );
        }

        const productor = await this.productorRepo.findOne({
            where: { cedula: cedulaLimpia },
            relations: ['usuario'],
        });

        if (!productor) {
            throw new NotFoundException(
                `No se encontró ningún productor asociado al QR (cédula: ${cedulaLimpia}).`,
            );
        }

        if (productor.estado === 'INACTIVO') {
            throw new ForbiddenException(
                `El productor está INACTIVO y no puede registrar compras.`,
            );
        }

        return productor;
    }

    async regenerarQR(id: number): Promise<Productor> {

        const productor = await this.obtenerPorId(id);

        const codigo_qr = await this._generarQR(id);

        await this.productorRepo.update(id, { codigo_qr });

        productor.codigo_qr = codigo_qr;

        return productor;
    }

    private async _generarQR(idProductor: number): Promise<string> {
        // Obtener la cédula del productor para el QR
        const productor = await this.productorRepo.findOne({
            where: { id_productor: idProductor },
        });

        // Usar cédula limpia (solo números). Si no hay cédula, usar el id como fallback
        const contenido = productor?.cedula
            ? productor.cedula.replace(/\D/g, '')
            : String(idProductor);

        return QRCode.toDataURL(contenido, {
            errorCorrectionLevel: 'H',
            margin: 2,
            width: 300,
        });
    }

  private async _verificarCedulaUnica(
    cedula: string,
    excludeId?: number,
  ): Promise<void> {

        const donde: any = { cedula };

        if (excludeId) {
            donde.id_productor = Not(excludeId);
        }

    const existente = await this.productorRepo.findOne({ where: donde });

        if (existente) {
            throw new ConflictException(
                `Ya existe un productor registrado con la cédula ${cedula}.`,
            );
        }
    }
}