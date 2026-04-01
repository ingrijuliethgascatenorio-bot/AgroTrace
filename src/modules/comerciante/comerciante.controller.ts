import {
  Controller, Get, Post, Put, Patch,
  Param, Body, ParseIntPipe, UseGuards,
} from '@nestjs/common';
import { ComerciantesService }                  from './comerciante.service';
import { CrearComercianteDto, EditarComercianteDto } from './comerciante.dto';
import { JwtAuthGuard }                         from '../auth/jwt-auth.guard'; // ✅ faltaba

@Controller('comerciantes')
@UseGuards(JwtAuthGuard)
export class ComerciantesController {
  constructor(private service: ComerciantesService) {}

  @Get()
  listar() { return this.service.listar(); }

  @Post()
  crear(@Body() dto: CrearComercianteDto) { return this.service.crear(dto); }

  @Put(':id')
  editar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: EditarComercianteDto,
  ) { return this.service.editar(id, dto); }

  @Patch(':id/desactivar')
  desactivar(@Param('id', ParseIntPipe) id: number) { return this.service.desactivar(id); }

  @Patch(':id/activar')
  activar(@Param('id', ParseIntPipe) id: number) { return this.service.activar(id); }
}
