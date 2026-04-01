import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Entrega } from '../../modules/entregas/entregas.entity';
import { Productor } from '../../modules/productor/productores.entity';

/**
 * ESTADÍSTICAS — Historial y Tendencia
 *
 * Lee de la tabla `entrega` (donde el operario registra la compra al productor).
 * precio_unitario en entrega = precio_final_productor (calculado con fórmula 3.5%).
 *
 * Devuelve nombre real del productor en todos los resultados.
 */
@Injectable()
export class EstadisticasService {
  constructor(
    @InjectRepository(Entrega)
    private readonly entregaRepo: Repository<Entrega>,
    @InjectRepository(Productor)
    private readonly productorRepo: Repository<Productor>,
  ) {}

  // ─── HISTORIAL ────────────────────────────────────────────
  /**
   * Devuelve las entregas (compras al productor) con nombre real.
   * id_productor es opcional — sin él devuelve todas.
   */
  async obtenerHistorial(
    idProductor?: number,
    inicio?: string,
    fin?: string,
  ): Promise<any[]> {
    let query = this.entregaRepo
      .createQueryBuilder('e')
      .leftJoinAndSelect('e.productor', 'productor')
      .leftJoinAndSelect('productor.usuario', 'usuario')
      .leftJoinAndSelect('e.producto', 'producto')
      .orderBy('e.fecha', 'DESC');

    if (idProductor !== undefined && !isNaN(idProductor)) {
      query = query.where('e.id_productor = :idProductor', { idProductor });
    }
    if (inicio) {
      query = query.andWhere('e.fecha >= :inicio', { inicio });
    }
    if (fin) {
      query = query.andWhere('e.fecha <= :fin', { fin: fin + ' 23:59:59' });
    }

    const entregas = await query.getMany();

    return entregas.map((e) => ({
      id_entrega:       e.id_entrega,
      fecha_produccion: e.fecha,          // alias para compatibilidad con frontend
      fecha:            e.fecha,
      cantidad:         Number(e.peso_kg), // kg como "cantidad"
      peso_kg:          Number(e.peso_kg),
      unidad:           'kg',
      lote:             `ENT-${String(e.id_entrega).padStart(6, '0')}`,
      estado:           'ENTREGADO',
      id_productor:     e.id_productor,
      id_producto:      e.id_producto,
      nombre_productor: e.productor?.usuario
        ? `${e.productor.usuario.nombre ?? ''} ${e.productor.usuario.apellido ?? ''}`.trim()
        : `Productor #${e.id_productor}`,
      cedula_productor: e.productor?.cedula ?? '',
      nombre_producto:  e.producto?.nombre ?? `Producto #${e.id_producto}`,
      precio_unitario:  Number(e.precio_unitario),  // precio_final_productor
      total:            Number(e.total),
    }));
  }

  // ─── TENDENCIA ────────────────────────────────────────────
  /**
   * Compara promedio kg de últimos 3 meses vs 3 meses anteriores.
   * id_productor es opcional — sin él calcula tendencia global.
   */
  async obtenerTendencia(idProductor?: number): Promise<any> {
    const ahora = new Date();

    const tresMesesAtras = new Date(ahora);
    tresMesesAtras.setMonth(ahora.getMonth() - 3);

    const seisMesesAtras = new Date(ahora);
    seisMesesAtras.setMonth(ahora.getMonth() - 6);

    const filtro =
      idProductor !== undefined && !isNaN(idProductor)
        ? 'e.id_productor = :idProductor'
        : '1=1';
    const params = idProductor !== undefined && !isNaN(idProductor)
      ? { idProductor }
      : {};

    // Promedio últimos 3 meses
    const resActual = await this.entregaRepo
      .createQueryBuilder('e')
      .select('AVG(e.peso_kg)', 'promedio')
      .addSelect('SUM(e.peso_kg)', 'total_kg')
      .addSelect('SUM(e.total)', 'total_dinero')
      .addSelect('COUNT(e.id_entrega)', 'n_entregas')
      .where(filtro, params)
      .andWhere('e.fecha >= :desde', { desde: tresMesesAtras })
      .getRawOne();

    // Promedio de hace 3 a 6 meses
    const resAnterior = await this.entregaRepo
      .createQueryBuilder('e')
      .select('AVG(e.peso_kg)', 'promedio')
      .addSelect('SUM(e.peso_kg)', 'total_kg')
      .where(filtro, params)
      .andWhere('e.fecha >= :desde', { desde: seisMesesAtras })
      .andWhere('e.fecha < :hasta', { hasta: tresMesesAtras })
      .getRawOne();

    const actual   = parseFloat(resActual?.promedio   || '0');
    const anterior = parseFloat(resAnterior?.promedio || '0');

    let tendencia = 'Estable';
    let diferenciaPorcentual = 0;
    if (anterior > 0) {
      diferenciaPorcentual = ((actual - anterior) / anterior) * 100;
      if (diferenciaPorcentual > 5)  tendencia = 'Creciente';
      if (diferenciaPorcentual < -5) tendencia = 'Decreciente';
    }

    return {
      promedio_actual:      actual,
      promedio_anterior:    anterior,
      total_kg_actual:      parseFloat(resActual?.total_kg    || '0'),
      total_dinero_actual:  parseFloat(resActual?.total_dinero || '0'),
      n_entregas_actual:    Number(resActual?.n_entregas || 0),
      diferencia_porcentual: diferenciaPorcentual.toFixed(2),
      tendencia,
    };
  }
}
