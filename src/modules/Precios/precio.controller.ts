import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { PreciosService } from './precios.service';
import { ActualizarEstadoPrecioDto, CrearPrecioDto } from './precio.dto';

// Solo ADMIN puede gestionar precios
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('precios')
export class PreciosController {
  constructor(private readonly preciosService: PreciosService) {}

  // ── POST /precios ──────────────────────────────────────
  // Crear y guardar precio semanal (con cálculo automático)
  @Post()
  crear(@Body() dto: CrearPrecioDto) {
    return this.preciosService.crear(dto);
  }

  // ── POST /precios/calcular ─────────────────────────────
  // Solo calcular, sin persistir (útil para vista previa en UI)
  @Post('calcular')
  calcular(@Body() dto: CrearPrecioDto) {
    return this.preciosService.previsualizarCalculo(dto);
  }

  // ── GET /precios ───────────────────────────────────────
  // Listar todos los precios (historial)
  @Get()
  listar() {
    return this.preciosService.listar();
  }

  // ── GET /precios/actual ────────────────────────────────
  // Precio activo actual (todos o filtrado por producto)
  @Get('actual')
  obtenerActual(@Query('id_producto') id_producto?: string) {
    const idNum = id_producto ? parseInt(id_producto) : undefined;
    return this.preciosService.obtenerActual(idNum);
  }

  // ── GET /precios/semana ────────────────────────────────
  // Verifica si ya se ingresaron precios esta semana (para alerta miércoles)
  @Get('semana')
  verificarSemana() {
    return this.preciosService.hayPrecioEstaSemana();
  }

  // ── GET /precios/precio-kg/:id_producto ───────────────
  // Devuelve solo el precio_final_kg activo de un producto
  // → Usado por módulos de ventas y compras
  @Get('precio-kg/:id_producto')
  obtenerPrecioKg(@Param('id_producto', ParseIntPipe) id: number) {
    return this.preciosService
      .obtenerPrecioFinalKg(id)
      .then((precio) => ({ id_producto: id, precio_final_kg: precio }));
  }

  // ── PATCH /precios/:id/estado ──────────────────────────
  // Activar o desactivar un precio
  @Patch(':id/estado')
  actualizarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarEstadoPrecioDto,
  ) {
    return this.preciosService.actualizarEstado(id, dto);
  }
  @Get('final/:id')
  obtenerPrecioFinal(@Param('id') id: number) {
  return this.preciosService.obtenerPrecioFinalKg(Number(id));
  }
}
