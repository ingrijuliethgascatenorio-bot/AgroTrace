// src/modules/ventas/ventas.controller.ts
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

  /**
   * PATCH /api/ventas/:id/estado
   *
   * Body esperado:
   *   { estado: string; email_factura?: string }
   *
   * - `estado`        — nuevo estado de la venta (ej: "COMPLETADA", "pendiente")
   * - `email_factura` — (opcional) correo al que el operario quiere enviar la factura.
   *                     Si viene vacío o ausente, el servicio usa el email del comerciante
   *                     registrado en BD. Si no hay ninguno, no se envía correo.
   */
  @Patch(':id/estado')
  cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { estado: string; email_factura?: string },
  ) {
    return this.ventasService.cambiarEstado(id, body);
  }
}
