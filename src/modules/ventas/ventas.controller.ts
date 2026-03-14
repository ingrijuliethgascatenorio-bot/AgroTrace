import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { VentasService } from './ventas.service';

@Controller('ventas')
export class VentasController {
  constructor(private readonly ventasService: VentasService) {}

  @Get()
  findAll() {
    return this.ventasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ventasService.findOne(id);
  }
}
