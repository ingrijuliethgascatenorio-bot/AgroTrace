/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// src/modules/productor/productores.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, DataSource } from 'typeorm';
import * as QRCode from 'qrcode';
import * as bcrypt from 'bcrypt';

import { Productor } from './productores.entity';
import { CrearProductorDto, EditarProductorDto } from './productor.dto';
import { Usuario, TipoUsuario } from '../users/entities/usuario.entity';

@Injectable()
export class ProductoresService {
  constructor(
    @InjectRepository(Productor)
    private readonly productorRepo: Repository<Productor>,
    private readonly dataSource: DataSource,
  ) {}

  // ── crearDesdeUsuario ─────────────────────────────────────────────────────
  // FIX: eliminados cedula/telefono del create() de Productor
  // FIX: buscar por usuario.cedula en lugar de productor.cedula
  async crearDesdeUsuario(
    usuario: Usuario,
    dto: { finca?: string; ubicacion?: string },
    asociacionId: number,
  ): Promise<Productor> {
    // Verificar si ya existe un productor para este usuario
    const existente = await this.productorRepo.findOne({
      where: { id_usuario: usuario.id_usuario, asociacion_id: asociacionId },
      relations: ['usuario'],
    });
    if (existente) return existente;

    const productor = this.productorRepo.create({
      finca: dto.finca || null,
      ubicacion: dto.ubicacion || null,
      id_usuario: usuario.id_usuario,
      estado: 'ACTIVO',
      asociacion_id: asociacionId,
    });

    // FIX: save() devuelve una instancia, no un array — usar guardado directo
    const guardado = await this.productorRepo.save(productor);

    // QR usa cedula del usuario (no del productor)
    const codigo_qr = await this._generarQRPorUsuario(usuario);
    await this.productorRepo.update(guardado.id_productor, { codigo_qr });
    guardado.codigo_qr = codigo_qr;

    return guardado;
  }

  // ── listar ────────────────────────────────────────────────────────────────
  async listar(asociacionId: number): Promise<Productor[]> {
    return this.productorRepo.find({
      where: { estado: 'ACTIVO', asociacion_id: asociacionId },
      relations: ['usuario'],
      order: { id_productor: 'ASC' },
    });
  }

  // ── sincronizarProductores ──────────────────────────────────────────────────
  // Crea filas en tabla `productor` para usuarios PRODUCTOR que no tienen una.
  async sincronizarProductores(asociacionId: number): Promise<{
    creados: number;
    yaExistian: number;
    detalle: { id_usuario: number; nombre: string }[];
  }> {
    const usuariosRepo = this.dataSource.getRepository(Usuario);

    // 1. Traer todos los usuarios PRODUCTOR de la asociacion
    const usuariosProductor = await usuariosRepo.find({
      where: { tipo_usuario: TipoUsuario.PRODUCTOR, asociacion_id: asociacionId },
    });

    // 2. Traer los id_usuario que ya tienen fila en productor
    const productoresExistentes = await this.productorRepo.find({
      where: { asociacion_id: asociacionId },
      select: ["id_usuario"],
    });
    const idsConProductor = new Set(productoresExistentes.map(p => p.id_usuario));

    // 3. Filtrar los que les falta fila
    const sinFila = usuariosProductor.filter(u => !idsConProductor.has(u.id_usuario));

    const detalle: { id_usuario: number; nombre: string }[] = [];

    for (const usuario of sinFila) {
      const productor = this.productorRepo.create({
        id_usuario: usuario.id_usuario,
        estado: usuario.activo ? "ACTIVO" : "INACTIVO",
        asociacion_id: asociacionId,
        finca: null,
        ubicacion: null,
      });
      const guardado = await this.productorRepo.save(productor);

      // Generar QR si tiene cedula
      try {
        const codigo_qr = await this._generarQRPorUsuario(usuario);
        await this.productorRepo.update(guardado.id_productor, { codigo_qr });
      } catch (_) { /* sin cedula, sin QR */ }

      detalle.push({ id_usuario: usuario.id_usuario, nombre: `${usuario.nombre} ${usuario.apellido}` });
    }

    return { creados: sinFila.length, yaExistian: idsConProductor.size, detalle };
  }

  async listarTodos(asociacionId: number): Promise<Productor[]> {
    return this.productorRepo.find({
      where: { asociacion_id: asociacionId },
      relations: ['usuario'],
      order: { id_productor: 'ASC' },
    });
  }

  async obtenerPorId(id: number, asociacionId: number): Promise<Productor> {
    const productor = await this.productorRepo.findOne({
      where: { id_productor: id, asociacion_id: asociacionId },
      relations: ['usuario'],
    });
    if (!productor)
      throw new NotFoundException(`Productor con ID ${id} no encontrado.`);
    return productor;
  }

  // ── crear ─────────────────────────────────────────────────────────────────
  // FIX: cedula/telefono van en Usuario, NO en Productor
  // FIX: tipo_usuario usa TipoUsuario.PRODUCTOR (enum)
  // FIX: manager.create() devuelve instancia única — corregido el tipo
  async crear(
    dto: CrearProductorDto,
    asociacionId: number,
  ): Promise<Productor> {
    return this.dataSource.transaction(async (manager) => {
      // Verificar cedula única en usuario (no en productor)
      await this._verificarCedulaUnicaEnUsuario(dto.cedula, asociacionId);

      const hash = await bcrypt.hash(dto.password, 10);
      const usuario = manager.create(Usuario, {
        nombre: dto.nombre,
        apellido: dto.apellido,
        email: dto.email,
        password: hash,
        telefono: dto.telefono || null,
        cedula: dto.cedula || null, // ← cedula SOLO en usuario
        tipo_usuario: TipoUsuario.PRODUCTOR, // ← enum correcto
        activo: true,
        asociacion_id: asociacionId,
      });

      const usuarioGuardado = await manager.save(Usuario, usuario);

      // FIX: Productor sin cedula ni telefono
      const productor = manager.create(Productor, {
        finca: dto.finca || null,
        ubicacion: dto.ubicacion || null,
        id_usuario: usuarioGuardado.id_usuario,
        estado: 'ACTIVO',
        asociacion_id: asociacionId,
      });

      // FIX: save() devuelve Productor, no Productor[]
      const guardado: Productor = await manager.save(Productor, productor);

      // QR con la cedula del usuario recién creado
      const cedulaLimpia = (dto.cedula || '').replace(/\D/g, '');
      if (cedulaLimpia) {
        const codigo_qr = await QRCode.toDataURL(cedulaLimpia, {
          errorCorrectionLevel: 'H',
          margin: 2,
          width: 300,
        });
        await manager.update(Productor, guardado.id_productor, { codigo_qr });
        guardado.codigo_qr = codigo_qr;
      }

      guardado.usuario = usuarioGuardado;
      return guardado;
    });
  }

  // ── editar ────────────────────────────────────────────────────────────────
  // FIX: cedula ya no existe en productor — se edita en usuario si se necesita
  async editar(
    id: number,
    dto: EditarProductorDto,
    asociacionId: number,
  ): Promise<Productor> {
    const productor = await this.obtenerPorId(id, asociacionId);

    if (productor.estado === 'INACTIVO')
      throw new ForbiddenException('No se puede editar un productor inactivo.');

    // Solo se editan campos propios del productor
    if (dto.finca !== undefined) productor.finca = dto.finca;
    if (dto.ubicacion !== undefined) productor.ubicacion = dto.ubicacion;
    if ((dto as any).tipo_certificacion !== undefined)
      productor.tipo_certificacion = (dto as any).tipo_certificacion;

    return this.productorRepo.save(productor);
  }

  // ── desactivar / activar ──────────────────────────────────────────────────
  async desactivar(
    id: number,
    asociacionId: number,
  ): Promise<{ mensaje: string; productor: Productor }> {
    const productor = await this.obtenerPorId(id, asociacionId);
    if (productor.estado === 'INACTIVO')
      throw new ConflictException('El productor ya está inactivo.');

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
    if (productor.estado === 'ACTIVO')
      throw new ConflictException('El productor ya está activo.');

    await this.productorRepo.update(id, { estado: 'ACTIVO' });
    productor.estado = 'ACTIVO';
    return { mensaje: 'Productor reactivado exitosamente.', productor };
  }

  // ── buscarPorQR ───────────────────────────────────────────────────────────
  // FIX: busca por usuario.cedula usando join, no por productor.cedula
  async buscarPorQR(qrCode: string, asociacionId: number): Promise<Productor> {
    const cedulaLimpia = qrCode?.trim().replace(/\D/g, '');

    if (!cedulaLimpia)
      throw new BadRequestException(
        'El código QR no contiene una cédula válida.',
      );

    // FIX: la cédula está en usuario, no en productor → usar JOIN
    const productor = await this.productorRepo
      .createQueryBuilder('p')
      .innerJoinAndSelect('p.usuario', 'u')
      .where('p.asociacion_id = :aid', { aid: asociacionId })
      .andWhere("p.estado = 'ACTIVO'")
      .andWhere('REGEXP_REPLACE(u.cedula, :re, :repl) = :cedula', {
        re: '[^0-9]',
        repl: '',
        cedula: cedulaLimpia,
      })
      .getOne();

    if (!productor)
      throw new NotFoundException(
        `No se encontró productor con QR (cédula: ${cedulaLimpia}).`,
      );

    if (productor.estado === 'INACTIVO')
      throw new ForbiddenException('El productor está INACTIVO.');

    return productor;
  }

  // ── regenerarQR ───────────────────────────────────────────────────────────
  // FIX: QR usa productor.usuario.cedula
  async regenerarQR(id: number, asociacionId: number): Promise<Productor> {
    const productor = await this.obtenerPorId(id, asociacionId);
    // obtenerPorId ya carga relations: ['usuario']
    const codigo_qr = await this._generarQRPorUsuario(productor.usuario);
    await this.productorRepo.update(id, { codigo_qr });
    productor.codigo_qr = codigo_qr;
    return productor;
  }

  async regenerarQRTodos(asociacionId: number): Promise<{
    actualizados: number;
    errores: { id: number; motivo: string }[];
  }> {
    const productores = await this.productorRepo.find({
      where: { asociacion_id: asociacionId },
      relations: ['usuario'],
    });

    let actualizados = 0;
    const errores: { id: number; motivo: string }[] = [];

    for (const p of productores) {
      try {
        const codigo_qr = await this._generarQRPorUsuario(p.usuario);
        await this.productorRepo.update(p.id_productor, { codigo_qr });
        actualizados++;
      } catch (e) {
        errores.push({
          id: p.id_productor,
          motivo: e instanceof Error ? e.message : 'Error desconocido',
        });
      }
    }

    return { actualizados, errores };
  }

  // ── Helpers privados ──────────────────────────────────────────────────────

  /**
   * Genera QR con la cédula del Usuario asociado.
   * Lanza BadRequestException si no tiene cédula.
   */
  private async _generarQRPorUsuario(usuario: Usuario): Promise<string> {
    const cedulaLimpia = (usuario?.cedula || '').replace(/\D/g, '');

    if (!cedulaLimpia)
      throw new BadRequestException(
        `El usuario #${usuario?.id_usuario} no tiene cédula registrada.`,
      );

    return QRCode.toDataURL(cedulaLimpia, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 300,
    });
  }

  /**
   * Verifica que la cédula no exista ya en la tabla usuario
   * dentro de la misma asociación.
   */
  private async _verificarCedulaUnicaEnUsuario(
    cedula: string,
    asociacionId: number,
    excludeUsuarioId?: number,
  ): Promise<void> {
    if (!cedula) return;

    const qb = this.dataSource
      .getRepository(Usuario)
      .createQueryBuilder('u')
      .where('u.cedula = :cedula', { cedula })
      .andWhere('u.asociacion_id = :aid', { aid: asociacionId });

    if (excludeUsuarioId) {
      qb.andWhere('u.id_usuario != :uid', { uid: excludeUsuarioId });
    }

    const existente = await qb.getOne();
    if (existente)
      throw new ConflictException(
        `Ya existe un productor registrado con la cédula ${cedula}.`,
      );
  }
}