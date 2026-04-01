import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Entrega } from '../entregas/entregas.entity';

/**
 * Servicio de Compras - usa entregas como fuente unica.
 * Incluye estado_pago, comprobante_pago y estado_liquidacion.
 */
@Injectable()
export class ComprasService {
  constructor(
    @InjectRepository(Entrega)
    private readonly entregaRepo: Repository<Entrega>,
  ) {}

  async findAll(): Promise<any[]> {
    const entregas = await this.entregaRepo.find({
      relations: ['productor', 'productor.usuario', 'producto', 'operario'],
      order: { fecha: 'DESC' },
    });
    return entregas.map(e => this._map(e));
  }

  async findOne(id: number): Promise<any> {
    const e = await this.entregaRepo.findOne({
      where: { id_entrega: id },
      relations: ['productor', 'productor.usuario', 'producto', 'operario'],
    });
    if (!e) throw new Error(`Compra/Entrega #${id} no encontrada`);
    return this._map(e);
  }

  async desactivar(id: number): Promise<any> {
    const e = await this.entregaRepo.findOne({ where: { id_entrega: id } });
    if (!e) throw new Error('Compra no encontrada');
    return { ...this._map(e), activo: false };
  }

  async activar(id: number): Promise<any> {
    const e = await this.entregaRepo.findOne({ where: { id_entrega: id } });
    if (!e) throw new Error('Compra no encontrada');
    return { ...this._map(e), activo: true };
  }

  private _map(e: any): any {
    const esExterno = e.tipo_productor === 'EXTERNO' || !e.id_productor;

    const nombre = esExterno
      ? e.nombre_productor_externo || 'Externo'
      : e.productor?.usuario
        ? `${e.productor.usuario.nombre || ''} ${e.productor.usuario.apellido || ''}`.trim()
        : null;

    return {
      id_compra:                  e.id_entrega,
      id_entrega:                 e.id_entrega,
      id_operario:                e.id_operario,
      id_productor:               e.id_productor,
      fecha_compra:               e.fecha,
      fecha:                      e.fecha,
      numero_factura:             `COMP-${String(e.id_entrega).padStart(6, '0')}`,
      activo:                     true,
      estado:                     'completada',
      // Tipo de productor — expuesto para que el frontend muestre "(externo)"
      tipo_productor:             e.tipo_productor || 'AFILIADO',
      nombre_productor_externo:   e.nombre_productor_externo || null,
      telefono_productor_externo: e.telefono_productor_externo || null,
      // Nombre del operario resuelto
      nombre_operario: e.operario
        ? `${e.operario.nombre || ''} ${e.operario.apellido || ''}`.trim()
        : null,
      // Financiero
      total:              e.total != null ? Number(e.total) : null,
      peso_kg:            Number(e.peso_kg ?? 0),
      precio_unitario:    e.precio_unitario != null ? Number(e.precio_unitario) : null,
      // Comprobante y liquidacion
      estado_pago:        e.estado_pago        || 'PENDIENTE',
      comprobante_pago:   e.comprobante_pago   || null,
      fecha_pago:         e.fecha_pago         || null,
      estado_liquidacion: e.estado_liquidacion || 'PENDIENTE_LIQUIDACION',
      ruta_id:            e.ruta_id            || null,
      // Relaciones
      productor: esExterno
        ? null
        : e.productor
          ? {
              id_productor: e.productor.id_productor,
              nombre,
              apellido:     e.productor.usuario?.apellido || '',
              cedula:       e.productor.cedula,
              finca:        e.productor.finca,
              usuario:      e.productor.usuario,
            }
          : null,
      operario: e.operario
        ? {
            id_usuario: e.operario.id_usuario,
            nombre:     e.operario.nombre,
            apellido:   e.operario.apellido,
          }
        : null,
      detalles: [{
        id_detalle_compra: e.id_entrega,
        id_compra:         e.id_entrega,
        id_producto:       e.id_producto,
        cantidad:          Number(e.peso_kg ?? 0),
        peso_kg:           Number(e.peso_kg ?? 0),
        cantidad_unidades: Number(e.cantidad_unidades ?? 0),
        precio_unitario:   e.precio_unitario != null ? Number(e.precio_unitario) : null,
        subtotal:          e.total != null ? Number(e.total) : null,
        producto: e.producto
          ? {
              id_producto: e.producto.id_producto,
              nombre:      e.producto.nombre,
              unidad:      e.producto.unidad_medida || 'kg',
            }
          : null,
      }],
    };
  }
}