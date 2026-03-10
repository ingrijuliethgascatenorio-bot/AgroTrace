/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Produccion } from '../entities/produccion.entity';

@Injectable()
export class EstadisticasService {
  constructor(
    @InjectRepository(Produccion)
    private readonly produccionRepository: Repository<Produccion>,
  ) {}

  /**
   * 1️ Historial por productor y rango de fechas
   */
  async obtenerHistorial(idProductor: number, inicio?: string, fin?: string) {
    let query = this.produccionRepository
      .createQueryBuilder('p')
      .select([
        'p.fecha_produccion AS fecha_produccion',
        'p.cantidad AS cantidad',
        'p.unidad AS unidad',
        'p.lote AS lote',
        'p.estado AS estado',
      ])
      .where('p.id_productor = :idProductor', { idProductor });

    if (inicio) {
      query = query.andWhere('p.fecha_produccion >= :inicio', { inicio });
    }

    if (fin) {
      query = query.andWhere('p.fecha_produccion <= :fin', { fin });
    }

    const resultados = await query
      .orderBy('p.fecha_produccion', 'ASC')
      .getRawMany();

    return resultados;
  }

  /**
   * 3️ Tendencia de producción (últimos 3 meses vs 3 anteriores)
   */
  async obtenerTendencia(idProductor: number) {
    // Calcular fecha hace 3 meses
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const fechaActual = new Date();
    const fechaTresMeses = new Date();
    fechaTresMeses.setMonth(fechaTresMeses.getMonth() - 3);

    // Promedio últimos 3 meses
    const promedioActual = await this.produccionRepository
      .createQueryBuilder('p')
      .select('AVG(p.cantidad)', 'promedio')
      .where('p.id_productor = :idProductor', { idProductor })
      .andWhere('p.fecha_produccion >= :fechaTresMeses', {
        fechaTresMeses: fechaTresMeses.toISOString().split('T')[0],
      })
      .getRawOne();

    // Calcular fecha hace 6 meses
    const fechaSeisMeses = new Date();
    fechaSeisMeses.setMonth(fechaSeisMeses.getMonth() - 6);

    // Promedio de hace 3 a 6 meses
    const promedioAnterior = await this.produccionRepository
      .createQueryBuilder('p')
      .select('AVG(p.cantidad)', 'promedio')
      .where('p.id_productor = :idProductor', { idProductor })
      .andWhere('p.fecha_produccion >= :fechaSeisMeses', {
        fechaSeisMeses: fechaSeisMeses.toISOString().split('T')[0],
      })
      .andWhere('p.fecha_produccion < :fechaTresMeses', {
        fechaTresMeses: fechaTresMeses.toISOString().split('T')[0],
      })
      .getRawOne();

    const actual = parseFloat(promedioActual?.promedio || '0');
    const anterior = parseFloat(promedioAnterior?.promedio || '0');

    // Determinar tendencia
    let tendencia = 'Estable';
    let diferenciaPorcentual = 0;

    if (anterior > 0) {
      diferenciaPorcentual = ((actual - anterior) / anterior) * 100;

      if (diferenciaPorcentual > 5) {
        tendencia = 'Creciente';
      } else if (diferenciaPorcentual < -5) {
        tendencia = 'Decreciente';
      }
    }

    return {
      promedio_actual: actual,
      promedio_anterior: anterior,
      diferencia_porcentual: diferenciaPorcentual.toFixed(2),
      tendencia,
    };
  }
}
