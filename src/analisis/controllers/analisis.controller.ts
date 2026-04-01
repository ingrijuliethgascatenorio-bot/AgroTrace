import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../modules/auth/jwt-auth.guard';
import { EstadisticasService } from '../services/estadisticas.service';
import { ProyeccionesService } from '../services/proyecciones.service';
import { RankingService }      from '../services/ranking.service';

@UseGuards(JwtAuthGuard)
@Controller('estadisticas')
export class AnalisisController {
  constructor(
    private readonly estadisticasService: EstadisticasService,
    private readonly proyeccionesService: ProyeccionesService,
    private readonly rankingService:      RankingService,
  ) {}

  // GET /estadisticas/historial?id_productor=&inicio=&fin=
  @Get('historial')
  obtenerHistorial(
    @Query('id_productor') id_productor?: string,
    @Query('inicio')       inicio?: string,
    @Query('fin')          fin?: string,
  ) {
    const idFinal = id_productor && id_productor.trim() !== ''
      ? parseInt(id_productor, 10) : undefined;
    return this.estadisticasService.obtenerHistorial(
      idFinal !== undefined && !isNaN(idFinal) ? idFinal : undefined,
      inicio,
      fin,
    );
  }

  // GET /estadisticas/proyeccion?id_productor=
  @Get('proyeccion')
  obtenerProyeccion(@Query('id_productor') id_productor?: string) {
    const idFinal = id_productor && id_productor.trim() !== ''
      ? parseInt(id_productor, 10) : undefined;
    return this.proyeccionesService.obtenerProyeccion(
      idFinal !== undefined && !isNaN(idFinal) ? idFinal : undefined,
    );
  }

  // GET /estadisticas/tendencia?id_productor=
  @Get('tendencia')
  obtenerTendencia(@Query('id_productor') id_productor?: string) {
    const idFinal = id_productor && id_productor.trim() !== ''
      ? parseInt(id_productor, 10) : undefined;
    return this.estadisticasService.obtenerTendencia(
      idFinal !== undefined && !isNaN(idFinal) ? idFinal : undefined,
    );
  }

  // GET /estadisticas/ranking?tipo=total&inicio=&fin=
  @Get('ranking')
  obtenerRanking(
    @Query('tipo')   tipo?: string,
    @Query('inicio') inicio?: string,
    @Query('fin')    fin?: string,
  ) {
    const tipoFinal = (tipo || 'total') as 'total' | 'promedio' | 'frecuencia';
    return this.rankingService.obtenerRanking(tipoFinal, inicio, fin);
  }

  // GET /estadisticas/planificacion?precio=&capacidad=
  @Get('planificacion')
  planificarRuta(
    @Query('precio')    precio?: string,
    @Query('capacidad') capacidad?: string,
  ) {
    return this.proyeccionesService.planificarRuta(
      parseFloat(precio ?? '0'),
      parseFloat(capacidad ?? '0'),
    );
  }
}
