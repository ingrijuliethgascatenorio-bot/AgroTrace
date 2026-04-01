import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Entrega } from '../../modules/entregas/entregas.entity';
import { Productor } from '../../modules/productor/productores.entity';

/**
 * PROYECCIONES — lee de la tabla `entrega`.
 *
 * Proyección basada en promedio de últimas N entregas (peso_kg).
 * precio_unitario en entrega = precio_final_productor (no el precio de venta).
 */
@Injectable()
export class ProyeccionesService {
  constructor(
    @InjectRepository(Entrega)
    private readonly entregaRepo: Repository<Entrega>,
    @InjectRepository(Productor)
    private readonly productorRepo: Repository<Productor>,
  ) {}

  // ─── PROYECCIÓN POR PRODUCTOR ─────────────────────────────
  async obtenerProyeccion(idProductor?: number): Promise<any> {
    let query = this.entregaRepo
      .createQueryBuilder('e')
      .select('e.peso_kg', 'peso_kg')
      .orderBy('e.fecha', 'DESC')
      .limit(5);

    if (idProductor !== undefined && !isNaN(idProductor)) {
      query = query.where('e.id_productor = :idProductor', { idProductor });
    }

    const ultimas5 = await query.getRawMany();

    if (ultimas5.length < 3) {
      return {
        proyeccion:  0,
        unidad:      'kg',
        advertencia: 'Datos insuficientes para proyección (mínimo 3 registros)',
      };
    }

    const total   = ultimas5.reduce((s, e) => s + parseFloat(e.peso_kg), 0);
    const promedio = total / ultimas5.length;

    return {
      proyeccion:           parseFloat(promedio.toFixed(2)),
      unidad:               'kg',
      registros_analizados: ultimas5.length,
    };
  }

  // ─── PLANIFICACIÓN DE RUTA ────────────────────────────────
  async planificarRuta(precio: number, capacidad: number): Promise<any> {
    if (!precio || precio <= 0)
      throw new BadRequestException('El precio debe ser mayor a 0');
    if (!capacidad || capacidad <= 0)
      throw new BadRequestException('La capacidad debe ser mayor a 0');

    // Obtener productores únicos con entregas
    const productoresRaw = await this.entregaRepo
      .createQueryBuilder('e')
      .select('DISTINCT e.id_productor', 'id_productor')
      .getRawMany();

    let totalProyectado = 0;
    for (const prod of productoresRaw) {
      const proy = await this.obtenerProyeccion(prod.id_productor);
      const valor = Number(proy.proyeccion);
      if (valor > 0 && !proy.advertencia) {
        totalProyectado += valor;
      }
    }

    const totalEstimado    = totalProyectado * precio;
    const superaCapacidad  = totalProyectado > capacidad;

    return {
      total_proyectado: parseFloat(totalProyectado.toFixed(2)),
      total_estimado:   parseFloat(totalEstimado.toFixed(2)),
      capacidad,
      supera_capacidad: superaCapacidad,
      alerta: superaCapacidad
        ? `⚠️ Se supera la capacidad en ${(totalProyectado - capacidad).toFixed(2)} kg`
        : '✅ Capacidad suficiente',
    };
  }
}
