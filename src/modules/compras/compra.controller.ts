import { Controller, Get, Patch, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ComprasService } from './compras.service';
import { Compra }         from './compras.entity';
import { JwtAuthGuard }   from '../auth/jwt-auth.guard';

@Controller('compras')
@UseGuards(JwtAuthGuard)
export class ComprasController {
  constructor(private readonly comprasService: ComprasService) {}

  @Get()
  findAll(): Promise<Compra[]> {
    return this.comprasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Compra> {
    return this.comprasService.findOne(id);
  }

  @Patch(':id/desactivar')
  desactivar(@Param('id', ParseIntPipe) id: number): Promise<Compra> {
    return this.comprasService.desactivar(id);
  }

  @Patch(':id/activar')
  activar(@Param('id', ParseIntPipe) id: number): Promise<Compra> {
    return this.comprasService.activar(id);
  }
}
