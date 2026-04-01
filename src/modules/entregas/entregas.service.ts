import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Entrega } from './entregas.entity';

@Injectable()
export class EntregasService {
  constructor(
    @InjectRepository(Entrega)
    private readonly entregaRepo: Repository<Entrega>,
  ) {}

  /**
   * Listar todas las entregas con relaciones
   * Opcionalmente filtrar por id_productor
   */
  async findAll(filtros?: { id_productor?: number }): Promise<any[]> {
    const query = this.entregaRepo
      .createQueryBuilder('entrega')
      .leftJoinAndSelect('entrega.productor', 'productor')
      .leftJoinAndSelect('productor.usuario', 'usuario')
      .leftJoinAndSelect('entrega.producto', 'producto')
      .leftJoinAndSelect('entrega.operario', 'operario')
      .orderBy('entrega.fecha', 'DESC');

    if (filtros?.id_productor) {
      query.where('entrega.id_productor = :id_productor', {
        id_productor: filtros.id_productor,
      });
    }

    const entregas = await query.getMany();

    return entregas.map((e) => ({
      id_entrega: e.id_entrega,
      referencia: `ENT-${String(e.id_entrega).padStart(6, '0')}`,
      id_productor: e.id_productor,
      id_producto: e.id_producto,
      id_operario: e.id_operario,
      productor: e.productor
        ? {
            id_productor: e.productor.id_productor,
            nombre:
              e.productor.usuario?.nombre ||
              e.productor.usuario?.nombre ||
              'Sin nombre',
            apellido: e.productor.usuario?.apellido || '',
            cedula: e.productor.cedula,
            finca: e.productor.finca,
          }
        : null,
      producto: e.producto
        ? {
            id_producto: e.producto.id_producto,
            nombre: e.producto.nombre,
            unidad: e.producto.unidad_medida || 'kg',
          }
        : null,
      operario: e.operario
        ? {
            id_usuario: e.operario.id_usuario,
            nombre: e.operario.nombre,
            apellido: e.operario.apellido,
          }
        : null,
      peso_kg: Number(e.peso_kg),
      cantidad_unidades: Number(e.cantidad_unidades),
      precio_unitario: Number(e.precio_unitario),
      total: Number(e.total),
      fecha: e.fecha,
      estado: 'ENTREGADO',
    }));
  }

  /**
   * Obtener una entrega por ID
   */
  async findOne(id: number): Promise<any> {
    const entrega = await this.entregaRepo.findOne({
      where: { id_entrega: id },
      relations: ['productor', 'productor.usuario', 'producto', 'operario'],
    });

    if (!entrega) {
      throw new NotFoundException(`Entrega #${id} no encontrada`);
    }

    return {
      id_entrega: entrega.id_entrega,
      referencia: `ENT-${String(entrega.id_entrega).padStart(6, '0')}`,
      productor: entrega.productor,
      producto: entrega.producto,
      operario: entrega.operario,
      peso_kg: Number(entrega.peso_kg),
      cantidad_unidades: Number(entrega.cantidad_unidades),
      precio_unitario: Number(entrega.precio_unitario),
      total: Number(entrega.total),
      fecha: entrega.fecha,
      estado: 'ENTREGADO',
    };
  }

  /**
   * Registrar una nueva entrega
   */
  async crear(datos: {
    id_operario: number;
    id_productor: number;
    id_producto: number;
    peso_kg: number;
    cantidad_unidades?: number;
    precio_unitario: number;
  }): Promise<any> {
    const total = Number(datos.peso_kg) * Number(datos.precio_unitario);

    const entrega = this.entregaRepo.create({
      id_operario: datos.id_operario,
      id_productor: datos.id_productor,
      id_producto: datos.id_producto,
      peso_kg: datos.peso_kg,
      cantidad_unidades: datos.cantidad_unidades || 0,
      precio_unitario: datos.precio_unitario,
      total,
    });

    const entregaGuardada = await this.entregaRepo.save(entrega);

    // Retornar con relaciones cargadas
    return this.findOne(entregaGuardada.id_entrega);
  }

  /**
   * Obtener estadísticas de entregas
   */
  async getEstadisticas(filtros?: { id_productor?: number }): Promise<any> {
    const query = this.entregaRepo.createQueryBuilder('entrega');

    if (filtros?.id_productor) {
      query.where('entrega.id_productor = :id_productor', {
        id_productor: filtros.id_productor,
      });
    }

    const [total, sumaTotal] = await Promise.all([
      query.getCount(),
      query
        .select('SUM(entrega.total)', 'total')
        .getRawOne()
        .then((result) => parseFloat(result?.total || '0')),
    ]);

    return {
      total_entregas: total,
      monto_total: sumaTotal,
    };
  }

  /**
   * Eliminar una entrega
   */
  async eliminar(id: number): Promise<void> {
    const entrega = await this.entregaRepo.findOne({
      where: { id_entrega: id },
    });

    if (!entrega) {
      throw new NotFoundException(`Entrega #${id} no encontrada`);
    }

    await this.entregaRepo.remove(entrega);
  }

  // ── SUBIR COMPROBANTE ────────────────────────────────────────
  // Llamado desde el controller al recibir el archivo.
  // Marca la entrega como PAGADO y guarda la ruta del archivo.
  async subirComprobante(id: number, rutaArchivo: string): Promise<any> {
    const entrega = await this.entregaRepo.findOne({
      where: { id_entrega: id },
    });

    if (!entrega) {
      throw new NotFoundException(`Entrega #${id} no encontrada`);
    }

    entrega.comprobante_pago  = rutaArchivo;
    entrega.estado_pago       = 'PAGADO';
    entrega.fecha_pago        = new Date();
    entrega.estado_liquidacion = 'PAGADO';  // sincronizar ambos estados

    await this.entregaRepo.save(entrega);
    return this.findOne(id);
  }

  // ── ELIMINAR COMPROBANTE ─────────────────────────────────────
  // Borra la referencia al archivo y vuelve a PENDIENTE.
  async eliminarComprobante(id: number): Promise<any> {
    const entrega = await this.entregaRepo.findOne({
      where: { id_entrega: id },
    });

    if (!entrega) {
      throw new NotFoundException(`Entrega #${id} no encontrada`);
    }

    entrega.comprobante_pago   = null;
    entrega.estado_pago        = 'PENDIENTE';
    entrega.fecha_pago         = null;
    entrega.estado_liquidacion = 'LIQUIDADO';  // vuelve a liquidado (precio ya asignado)

    await this.entregaRepo.save(entrega);
    return this.findOne(id);
  }
}