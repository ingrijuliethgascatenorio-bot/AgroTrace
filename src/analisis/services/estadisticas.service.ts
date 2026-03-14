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
   * 1️ Historial — id_productor es opcional
   *    Si no viene, retorna todos los registros (útil para vista general)
   */
  async obtenerHistorial(idProductor?: number, inicio?: string, fin?: string) {
    let query = this.produccionRepository
      .createQueryBuilder('p')
      .select([
        'p.fecha_produccion AS fecha_produccion',
        'p.cantidad AS cantidad',
        'p.unidad AS unidad',
        'p.lote AS lote',
        'p.estado AS estado',
      ]);

    // Filtrar por productor solo si viene un id válido
    if (idProductor !== undefined && !isNaN(idProductor)) {
      query = query.where('p.id_productor = :idProductor', { idProductor });
    }

    if (inicio) {
      query = query.andWhere('p.fecha_produccion >= :inicio', { inicio });
    }

    if (fin) {
      query = query.andWhere('p.fecha_produccion <= :fin', { fin });
    }

    return await query.orderBy('p.fecha_produccion', 'ASC').getRawMany();
  }

  /**
   * 3️ Tendencia — id_productor es opcional
   *    Si no viene, calcula la tendencia global de todos los productores
   */
  async obtenerTendencia(idProductor?: number) {
    const fechaTresMeses = new Date();
    fechaTresMeses.setMonth(fechaTresMeses.getMonth() - 3);

    const fechaSeisMeses = new Date();
    fechaSeisMeses.setMonth(fechaSeisMeses.getMonth() - 6);

    const tresMesesStr = fechaTresMeses.toISOString().split('T')[0];
    const seisMesesStr = fechaSeisMeses.toISOString().split('T')[0];

    const filtroProductor =
      idProductor !== undefined && !isNaN(idProductor)
        ? 'p.id_productor = :idProductor'
        : '1=1'; // sin filtro

    const params =
      idProductor !== undefined && !isNaN(idProductor) ? { idProductor } : {};

    // Promedio últimos 3 meses
    const promedioActual = await this.produccionRepository
      .createQueryBuilder('p')
      .select('AVG(p.cantidad)', 'promedio')
      .where(filtroProductor, params)
      .andWhere('p.fecha_produccion >= :fechaTresMeses', {
        fechaTresMeses: tresMesesStr,
      })
      .getRawOne();

    // Promedio de hace 3 a 6 meses
    const promedioAnterior = await this.produccionRepository
      .createQueryBuilder('p')
      .select('AVG(p.cantidad)', 'promedio')
      .where(filtroProductor, params)
      .andWhere('p.fecha_produccion >= :fechaSeisMeses', {
        fechaSeisMeses: seisMesesStr,
      })
      .andWhere('p.fecha_produccion < :fechaTresMeses', {
        fechaTresMeses: tresMesesStr,
      })
      .getRawOne();

    const actual = parseFloat(promedioActual?.promedio || '0');
    const anterior = parseFloat(promedioAnterior?.promedio || '0');

    let tendencia = 'Estable';
    let diferenciaPorcentual = 0;

    if (anterior > 0) {
      diferenciaPorcentual = ((actual - anterior) / anterior) * 100;
      if (diferenciaPorcentual > 5) tendencia = 'Creciente';
      if (diferenciaPorcentual < -5) tendencia = 'Decreciente';
    }

    return {
      promedio_actual: actual,
      promedio_anterior: anterior,
      diferencia_porcentual: diferenciaPorcentual.toFixed(2),
      tendencia,
    };
  }
}
