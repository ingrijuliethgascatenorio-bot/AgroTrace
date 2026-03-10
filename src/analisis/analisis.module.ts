import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Produccion } from './entities/produccion.entity';
import { AnalisisController } from './controllers/analisis.controller';
import { EstadisticasService } from './services/estadisticas.service';
import { ProyeccionesService } from './services/proyecciones.service';
import { RankingService } from './services/ranking.service';

@Module({
  imports: [TypeOrmModule.forFeature([Produccion])],
  controllers: [AnalisisController],
  providers: [EstadisticasService, ProyeccionesService, RankingService],
  exports: [EstadisticasService, ProyeccionesService, RankingService],
})
export class AnalisisModule {}
