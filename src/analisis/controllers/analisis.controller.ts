/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Controller, Get, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { EstadisticasService } from '../services/estadisticas.service';
import { ProyeccionesService } from '../services/proyecciones.service';
import { RankingService } from '../services/ranking.service';
import { FiltroFechaDto } from '../dto/filtro-fecha.dto';
import { FiltroProductorDto } from '../dto/filtro-productor.dto';

@ApiTags('Estadísticas y Proyecciones')
@Controller('estadisticas')
export class AnalisisController {
  constructor(
    private readonly estadisticasService: EstadisticasService,
    private readonly proyeccionesService: ProyeccionesService,
    private readonly rankingService: RankingService,
  ) {}

  /**
   * Historial por productor y rango de fechas
   */
  @Get('historial')
  @ApiOperation({
    summary: 'Historial de producción por productor y fechas',
  })
  @ApiQuery({ name: 'id_productor', required: true, type: Number })
  @ApiQuery({ name: 'inicio', required: false, type: String })
  @ApiQuery({ name: 'fin', required: false, type: String })
  async obtenerHistorial(@Query() filtros: FiltroFechaDto) {
    const idProductor = parseInt(filtros.id_productor);
    return await this.estadisticasService.obtenerHistorial(
      idProductor,
      filtros.inicio,
      filtros.fin,
    );
  }

  /**
   * Proyección de producción
   */
  @Get('proyeccion')
  @ApiOperation({ summary: 'Proyección basada en últimas 5 entregas' })
  @ApiQuery({ name: 'id_productor', required: true, type: Number })
  async obtenerProyeccion(
    @Query('id_productor', ParseIntPipe) idProductor: number,
  ) {
    return await this.proyeccionesService.obtenerProyeccion(idProductor);
  }

  /**
   * 3️⃣ Tendencia de producción
   */
  @Get('tendencia')
  @ApiOperation({ summary: 'Tendencia (últimos 3 meses vs 3 anteriores)' })
  @ApiQuery({ name: 'id_productor', required: true, type: Number })
  async obtenerTendencia(
    @Query('id_productor', ParseIntPipe) idProductor: number,
  ) {
    return await this.estadisticasService.obtenerTendencia(idProductor);
  }

  /**
   * 4️⃣ Ranking de productores
   */
  @Get('ranking')
  @ApiOperation({
    summary: 'Ranking de productores por total/promedio/frecuencia',
  })
  @ApiQuery({
    name: 'tipo',
    required: false,
    enum: ['total', 'promedio', 'frecuencia'],
  })
  async obtenerRanking(@Query() filtros: FiltroProductorDto) {
    const tipo = (filtros.tipo || 'total') as
      | 'total'
      | 'promedio'
      | 'frecuencia';
    return await this.rankingService.obtenerRanking(tipo);
  }

  /**
   * 5️⃣ Planificación de ruta
   */
  @Get('planificacion')
  @ApiOperation({ summary: 'Planificación de ruta con proyección total' })
  @ApiQuery({ name: 'precio', required: true, type: Number })
  @ApiQuery({ name: 'capacidad', required: true, type: Number })
  async planificarRuta(@Query() filtros: FiltroProductorDto) {
    return await this.proyeccionesService.planificarRuta(
      filtros.precio,
      filtros.capacidad,
    );
  }
}
