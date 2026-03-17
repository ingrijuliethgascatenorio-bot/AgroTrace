import { Controller, Get, Patch, Param, ParseIntPipe } from '@nestjs/common';
import { ComprasService } from './compras.service';
import { Compra } from './compras.entity';
@Controller('compras')
export class ComprasController {
  constructor(private readonly comprasService: ComprasService) {}

  // Listar todas las compras activas
  @Get()
  findAll(): Promise<Compra[]> {
    return this.comprasService.findAll();
  }

  // Buscar compra por ID
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Compra> {
    return this.comprasService.findOne(id);
  }
  // PATCH /compras/:id/desactivar
  @Patch(':id/desactivar')
  desactivar(@Param('id', ParseIntPipe) id: number): Promise<Compra> {
    return this.comprasService.desactivar(id);
  }

  // PATCH /compras/:id/activar
  @Patch(':id/activar')
  activar(@Param('id', ParseIntPipe) id: number): Promise<Compra> {
    return this.comprasService.activar(id);
  }
}
