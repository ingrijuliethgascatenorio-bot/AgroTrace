import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { HistorialTransaccion } from './historial_transacion.entity';
import { HistorialPrecio } from './historial_precio.entity';

@Injectable()
export class HistorialService {
  constructor(
    @InjectRepository(HistorialTransaccion)
    private readonly transRepo: Repository<HistorialTransaccion>,
    @InjectRepository(HistorialPrecio)
    private readonly precioRepo: Repository<HistorialPrecio>,
  ) {}

  findTransacciones(
    inicio?: string,
    fin?: string,
  ): Promise<HistorialTransaccion[]> {
    const where: any = {};
    if (inicio && fin) {
      where.fecha_transaccion = Between(
        new Date(inicio),
        new Date(fin + 'T23:59:59'),
      );
    } else if (inicio) {
      where.fecha_transaccion = MoreThanOrEqual(new Date(inicio));
    } else if (fin) {
      where.fecha_transaccion = LessThanOrEqual(new Date(fin + 'T23:59:59'));
    }
    return this.transRepo.find({ where, order: { fecha_transaccion: 'DESC' } });
  }

  findPrecios(inicio?: string, fin?: string): Promise<HistorialPrecio[]> {
    const where: any = {};
    if (inicio && fin) {
      where.fecha_cambio = Between(
        new Date(inicio),
        new Date(fin + 'T23:59:59'),
      );
    } else if (inicio) {
      where.fecha_cambio = MoreThanOrEqual(new Date(inicio));
    } else if (fin) {
      where.fecha_cambio = LessThanOrEqual(new Date(fin + 'T23:59:59'));
    }
    return this.precioRepo.find({
      where,
      relations: ['producto'],
      order: { fecha_cambio: 'DESC' },
    });
  }
}