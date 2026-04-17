/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ComerciantesService } from './comerciante.service';
import { CrearComercianteDto, EditarComercianteDto } from './comerciante.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('comerciantes')
@UseGuards(JwtAuthGuard)
export class ComerciantesController {
  constructor(private service: ComerciantesService) {}

  @Get()
  listar(@Request() req) {
    const asociacionId: number = req.asociacionId;
    return this.service.listar(asociacionId);
  }

  /**
   * GET /comerciantes/todos
   * Devuelve activos e inactivos — uso exclusivo del panel admin.
   */
  @Get('todos')
  listarTodos(@Request() req) {
    const asociacionId: number = req.asociacionId;
    return this.service.listarTodos(asociacionId);
  }

  @Post()
  crear(@Body() dto: CrearComercianteDto, @Request() req) {
    const asociacionId: number = req.asociacionId;
    return this.service.crear(dto, asociacionId);
  }

  @Put(':id')
  editar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: EditarComercianteDto,
    @Request() req,
  ) {
    const asociacionId: number = req.asociacionId;
    return this.service.editar(id, dto, asociacionId);
  }

  @Patch(':id/desactivar')
  desactivar(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const asociacionId: number = req.asociacionId;
    return this.service.desactivar(id, asociacionId);
  }

  @Patch(':id/activar')
  activar(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const asociacionId: number = req.asociacionId;
    return this.service.activar(id, asociacionId);
  }
}
