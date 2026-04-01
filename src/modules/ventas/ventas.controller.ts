import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { VentasService } from './ventas.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
@Controller('ventas')
@UseGuards(JwtAuthGuard)
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

  // PATCH /api/ventas/:id/estado  — marcar completada, pendiente, anulada
  @Patch(':id/estado')
  cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { estado: string },
  ) {
    return this.ventasService.cambiarEstado(id, body.estado);
  }
}
