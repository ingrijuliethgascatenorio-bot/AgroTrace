import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Entrega } from '../../modules/entregas/entregas.entity';
import { Productor } from '../../modules/productor/productores.entity';

/**
 * RANKING — lee de la tabla `entrega` (no produccion).
 *
 * Métricas disponibles:
 *   total      → suma de peso_kg por productor
 *   promedio   → promedio de peso_kg por productor
 *   frecuencia → número de entregas por productor
 *
 * Devuelve nombre real del productor (nombre + apellido del usuario).
 *
 * NOTA: precio_unitario en entrega = precio_final_productor (calculado por backend).
 *       No aplica fórmula de ventas aquí.
 */
@Injectable()
export class RankingService {
  constructor(
    @InjectRepository(Entrega)
    private readonly entregaRepo: Repository<Entrega>,
    @InjectRepository(Productor)
    private readonly productorRepo: Repository<Productor>,
  ) {}

  async obtenerRanking(
    tipo: 'total' | 'promedio' | 'frecuencia' = 'total',
    inicio?: string,
    fin?: string,
  ): Promise<any[]> {
    // ── Seleccionar métrica ──────────────────────────────────
    let valorExpr: string;
    switch (tipo) {
      case 'total':
        valorExpr = 'SUM(e.peso_kg)';
        break;
      case 'promedio':
        valorExpr = 'AVG(e.peso_kg)';
        break;
      case 'frecuencia':
        valorExpr = 'COUNT(e.id_entrega)';
        break;
      default:
        valorExpr = 'SUM(e.peso_kg)';
    }

    // ── Query principal sobre entrega ───────────────────────
    let query = this.entregaRepo
      .createQueryBuilder('e')
      .select('e.id_productor', 'id_productor')
      .addSelect(valorExpr, 'valor')
      .addSelect('SUM(e.total)', 'total_pagado') // suma de lo pagado al productor
      .addSelect('COUNT(e.id_entrega)', 'n_entregas')
      .groupBy('e.id_productor')
      .orderBy('valor', 'DESC');

    if (inicio) {
      query = query.andWhere('e.fecha >= :inicio', { inicio });
    }
    if (fin) {
      query = query.andWhere('e.fecha <= :fin', { fin: fin + ' 23:59:59' });
    }

    const resultados = await query.getRawMany();

    if (!resultados.length) return [];

    // ── Cargar nombres de productores en batch ──────────────
    const ids = resultados.map((r) => Number(r.id_productor));
    const productores = await this.productorRepo.find({
      where: ids.map((id) => ({ id_productor: id })),
      relations: ['usuario'],
    });
    const prodMap = new Map<number, Productor>(
      productores.map((p) => [p.id_productor, p]),
    );

    // ── Ensamblar resultado con nombre real ─────────────────
    return resultados.map((item, index) => {
      const prod = prodMap.get(Number(item.id_productor));
      const nombre = prod?.usuario
        ? `${prod.usuario.nombre ?? ''} ${prod.usuario.apellido ?? ''}`.trim()
        : `Productor #${item.id_productor}`;

      return {
        posicion: index + 1,
        id_productor: Number(item.id_productor),
        nombre,
        cedula: prod?.usuario.cedula ?? '',
        finca: prod?.finca ?? '',
        valor: parseFloat(Number(item.valor).toFixed(2)),
        total_pagado: parseFloat(Number(item.total_pagado).toFixed(2)),
        n_entregas: Number(item.n_entregas),
      };
    });
  }
}
