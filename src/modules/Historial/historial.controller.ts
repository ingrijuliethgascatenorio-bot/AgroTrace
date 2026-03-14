import { Controller, Get, Query } from '@nestjs/common';
import { HistorialService } from './historial.service';

@Controller('historial')
export class HistorialController {
  constructor(private readonly historialService: HistorialService) {}

  /** GET /historial/transacciones?inicio=2026-01-01&fin=2026-03-31 */
  @Get('transacciones')
  transacciones(@Query('inicio') inicio?: string, @Query('fin') fin?: string) {
    return this.historialService.findTransacciones(inicio, fin);
  }

  /** GET /historial/precios?inicio=2026-01-01&fin=2026-03-31 */
  @Get('precios')
  precios(@Query('inicio') inicio?: string, @Query('fin') fin?: string) {
    return this.historialService.findPrecios(inicio, fin);
  }
}
