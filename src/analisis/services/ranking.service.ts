/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Produccion } from '../entities/produccion.entity';

@Injectable()
export class RankingService {
  constructor(
    @InjectRepository(Produccion)
    private readonly produccionRepository: Repository<Produccion>,
  ) {}

  /**
   * 4️ Ranking de productores
   */
  async obtenerRanking(tipo: 'total' | 'promedio' | 'frecuencia' = 'total') {
    let selectField: string;

    switch (tipo) {
      case 'total':
        selectField = 'SUM(p.cantidad)';
        break;
      case 'promedio':
        selectField = 'AVG(p.cantidad)';
        break;
      case 'frecuencia':
        selectField = 'COUNT(p.id_produccion)';
        break;
      default:
        selectField = 'SUM(p.cantidad)';
    }

    const resultados = await this.produccionRepository
      .createQueryBuilder('p')
      .select('p.id_productor', 'id_productor')
      .addSelect(selectField, 'valor')
      .groupBy('p.id_productor')
      .orderBy('valor', 'DESC')
      .getRawMany();

    // Agregar posición
    return resultados.map((item, index) => ({
      posicion: index + 1,
      id_productor: item.id_productor,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      valor: parseFloat(item.valor),
    }));
  }
}
