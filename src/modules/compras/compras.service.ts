/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Entrega } from '../entregas/entregas.entity';
// ✅ FIX TIMEZONE: e.fecha es @CreateDateColumn (timestamptz UTC) → convertir a Colombia
import { fechaEntregaAColombia } from '../../common/utils/fecha.util';

@Injectable()
export class ComprasService {
  constructor(
    @InjectRepository(Entrega)
    private readonly entregaRepo: Repository<Entrega>,
  ) {}

  async findAll(asociacionId?: number): Promise<any[]> {
    const qb = this.entregaRepo
      .createQueryBuilder('e')
      .leftJoinAndSelect('e.productor', 'productor')
      .leftJoinAndSelect('productor.usuario', 'productorUsuario')
      .leftJoinAndSelect('e.producto', 'producto')
      .leftJoinAndSelect('e.operario', 'operario')
      .orderBy('e.fecha', 'DESC');

    // Filtro multi-tenant si se recibe asociacionId
    if (asociacionId) {
      qb.where('e.asociacion_id = :aid', { aid: asociacionId });
    }

    const entregas = await qb.getMany();
    return entregas.map((e) => this._map(e));
  }

  async findOne(id: number): Promise<any> {
    const e = await this.entregaRepo
      .createQueryBuilder('e')
      .leftJoinAndSelect('e.productor', 'productor')
      .leftJoinAndSelect('productor.usuario', 'productorUsuario')
      .leftJoinAndSelect('e.producto', 'producto')
      .leftJoinAndSelect('e.operario', 'operario')
      .where('e.id_entrega = :id', { id })
      .getOne();

    if (!e) throw new NotFoundException(`Compra/Entrega #${id} no encontrada`);
    return this._map(e);
  }

  async desactivar(id: number): Promise<any> {
    const e = await this.entregaRepo.findOne({ where: { id_entrega: id } });
    if (!e) throw new NotFoundException('Compra no encontrada');
    return { ...this._map(e), activo: false };
  }

  async activar(id: number): Promise<any> {
    const e = await this.entregaRepo.findOne({ where: { id_entrega: id } });
    if (!e) throw new NotFoundException('Compra no encontrada');
    return { ...this._map(e), activo: true };
  }

  // ─────────────────────────────────────────────────────────────────────────
  private _map(
    e: Entrega & { operario?: any; productor?: any; producto?: any },
  ): any {
    const esExterno = e.tipo_productor === 'EXTERNO' || !e.id_productor;

    // ✅ BUG FIX: nombre del operario desde la relación cargada (no hardcodeado)
    const nombreOperario = e.operario
      ? `${e.operario.nombre || ''} ${e.operario.apellido || ''}`.trim() || null
      : null;

    const nombreProductor = esExterno
      ? e.nombre_productor_externo || 'Externo'
      : e.productor?.usuario
        ? `${e.productor.usuario.nombre || ''} ${e.productor.usuario.apellido || ''}`.trim()
        : null;

    return {
      // IDs
      id_compra: e.id_entrega,
      id_entrega: e.id_entrega,
      id_operario: e.id_operario,
      id_productor: e.id_productor,

      // ✅ FIX TIMEZONE: @CreateDateColumn guarda en UTC. Una entrega a las 9pm Colombia
      // (UTC-5) = 2am UTC del día siguiente → el frontend vería el día incorrecto.
      // fechaEntregaAColombia() convierte el timestamp UTC → 'YYYY-MM-DD' en Bogotá.
      fecha_compra: fechaEntregaAColombia(e.fecha),
      fecha: fechaEntregaAColombia(e.fecha),

      // Factura
      numero_factura: `COMP-${String(e.id_entrega).padStart(6, '0')}`,
      activo: true,
      estado: 'completada',

      // Tipo productor
      tipo_productor: e.tipo_productor || 'AFILIADO',
      nombre_productor_externo: e.nombre_productor_externo || null,
      telefono_productor_externo: e.telefono_productor_externo || null,

      // ✅ nombre_operario resuelto desde la relación (sin hardcodear)
      nombre_operario: nombreOperario,

      // Financiero
      total: e.total != null ? Number(e.total) : null,
      peso_kg: Number(e.peso_kg ?? 0),
      precio_unitario:
        e.precio_unitario != null ? Number(e.precio_unitario) : null,

      // Pago y liquidación
      estado_pago: e.estado_pago || 'PENDIENTE',
      comprobante_pago: e.comprobante_pago || null,
      fecha_pago: e.fecha_pago || null,
      estado_liquidacion: e.estado_liquidacion || 'PENDIENTE_LIQUIDACION',
      ruta_id: e.ruta_id || null,

      // Objeto productor anidado
      productor: esExterno
        ? null
        : e.productor
          ? {
              id_productor: e.productor.id_productor,
              nombre: nombreProductor,
              apellido: e.productor.usuario?.apellido || '',
              cedula: e.productor.usuario?.cedula || null, 
              finca: e.productor.finca,
              usuario: e.productor.usuario,
            }
          : null,

      // Objeto operario anidado (para que el frontend tenga fallbacks)
      operario: e.operario
        ? {
            id_usuario: e.operario.id_usuario,
            nombre: e.operario.nombre,
            apellido: e.operario.apellido,
          }
        : null,

      detalles: [
        {
          id_detalle_compra: e.id_entrega,
          id_compra: e.id_entrega,
          id_producto: e.id_producto,
          cantidad: Number(e.peso_kg ?? 0),
          peso_kg: Number(e.peso_kg ?? 0),
          cantidad_unidades: Number(e.cantidad_unidades ?? 0),
          precio_unitario:
            e.precio_unitario != null ? Number(e.precio_unitario) : null,
          subtotal: e.total != null ? Number(e.total) : null,
          producto: e.producto
            ? {
                id_producto: e.producto.id_producto,
                nombre: e.producto.nombre,
                unidad: e.producto.unidad_medida || 'kg',
              }
            : null,
        },
      ],
    };
  }
}
