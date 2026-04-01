import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { HistorialService } from './historial.service';
import { JwtAuthGuard }     from '../auth/jwt-auth.guard'; // ✅ CORREGIDO: faltaba guard

@Controller('historial')
@UseGuards(JwtAuthGuard)
export class HistorialController {
  constructor(private readonly historialService: HistorialService) {}

  @Get('transacciones')
  transacciones(@Query('inicio') inicio?: string, @Query('fin') fin?: string) {
    return this.historialService.findTransacciones(inicio, fin);
  }

  @Get('precios')
  precios(@Query('inicio') inicio?: string, @Query('fin') fin?: string) {
    return this.historialService.findPrecios(inicio, fin);
  }
}
