import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AnalisisController } from './controllers/analisis.controller';
import { EstadisticasService } from './services/estadisticas.service';
import { ProyeccionesService } from './services/proyecciones.service';
import { RankingService }      from './services/ranking.service';

// Entidades que usan los servicios (tabla entrega, no produccion)
import { Entrega }   from '../modules/entregas/entregas.entity';
import { Productor } from '../modules/productor/productores.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Entrega,    // tabla real de compras al productor
      Productor,  // para nombres reales en ranking / historial
    ]),
  ],
  controllers: [AnalisisController],
  providers:   [EstadisticasService, ProyeccionesService, RankingService],
  exports:     [EstadisticasService, ProyeccionesService, RankingService],
})
export class AnalisisModule {}
