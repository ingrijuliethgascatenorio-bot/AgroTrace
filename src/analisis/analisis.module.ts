import { Module } from '@nestjs/common';
import { AnalisisController } from './controllers/analisis.controller';
import { EstadisticasService } from './services/estadisticas.service';
import { RankingService } from './services/ranking.service';
import { ProyeccionesService } from './services/proyecciones.service';

@Module({
  controllers: [AnalisisController],
  providers: [EstadisticasService, RankingService, ProyeccionesService],
})
export class AnalisisModule {}
