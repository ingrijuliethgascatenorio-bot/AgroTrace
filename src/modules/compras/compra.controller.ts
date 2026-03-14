import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ComprasService } from './compras.service';

@Controller('compras')
export class ComprasController {
  constructor(private readonly comprasService: ComprasService) {}

  @Get()
  findAll() {
    return this.comprasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.comprasService.findOne(id);
  }
}
