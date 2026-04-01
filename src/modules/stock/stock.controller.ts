import {
  Controller, Get, Query, UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { StockService } from './stock.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('stock')
@UseGuards(JwtAuthGuard)
export class StockController {
  constructor(private readonly stockService: StockService) {}

  // GET /api/stock — lista stock de todos los productos
  @Get()
  listar() {
    return this.stockService.listarStock();
  }

  // GET /api/stock/movimientos?id_producto=X&tipo=ENTRADA|SALIDA
  @Get('movimientos')
  movimientos(
    @Query('id_producto') id?: string,
    @Query('tipo') tipo?: string,
  ) {
    const id_producto = id ? parseInt(id, 10) : undefined;
    return this.stockService.listarMovimientos(id_producto, tipo);
  }
}
