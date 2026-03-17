import {
  Controller,
  Get,
  Put,
  Body,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiQuery,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../../../modules/auth/jwt-auth.guard';
import { ProductorDashboardService } from '../services/productor-dashboard.service';
import { ActualizarPerfilDto } from '../dto/actualizar-perfil.dto';
import { FiltroFechasDto } from '../dto/filtro-fechas.dto';

@ApiTags('Productor Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('productor-dashboard')
export class ProductorDashboardController {
  constructor(private readonly dashboardService: ProductorDashboardService) {}

  // ── GET /productor-dashboard/perfil ──────────────────────────────────────
  @Get('perfil')
  @ApiOperation({
    summary: 'Obtener perfil del productor autenticado',
    description:
      'Devuelve nombre, apellido, cédula, finca, ubicacion, telefono y codigo_qr del productor. ' +
      'El ID se obtiene automáticamente desde el token JWT.',
  })
  @ApiOkResponse({
    description: 'Perfil del productor retornado correctamente.',
  })
  @ApiUnauthorizedResponse({ description: 'Token JWT inválido o ausente.' })
  @ApiNotFoundResponse({
    description: 'No se encontró productor activo para este usuario.',
  })
  async getPerfil(@Request() req: any) {
    const idUsuario: number = req.user.id_usuario ?? req.user.sub;
    return this.dashboardService.obtenerPerfil(idUsuario);
  }

  // ── PUT /productor-dashboard/perfil ──────────────────────────────────────
  @Put('perfil')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar perfil del productor',
    description:
      'Solo permite modificar telefono, ubicacion y finca. ' +
      'Nombre, apellido y cédula no pueden ser cambiados desde este endpoint.',
  })
  @ApiOkResponse({ description: 'Perfil actualizado correctamente.' })
  @ApiUnauthorizedResponse({ description: 'Token JWT inválido o ausente.' })
  @ApiNotFoundResponse({
    description: 'No se encontró productor activo para este usuario.',
  })
  async actualizarPerfil(
    @Request() req: any,
    @Body() dto: ActualizarPerfilDto,
  ) {
    const idUsuario: number = req.user.id_usuario ?? req.user.sub;
    return this.dashboardService.actualizarPerfil(idUsuario, dto);
  }

  // ── GET /productor-dashboard/historial ───────────────────────────────────
  @Get('historial')
  @ApiOperation({
    summary: 'Historial de entregas del productor autenticado',
    description:
      'Devuelve las compras registradas a nombre del productor con detalle de ' +
      'producto, peso (kg), precio unitario y total. Filtrable por rango de fechas.',
  })
  @ApiQuery({ name: 'inicio', required: false, example: '2026-01-01', description: 'Fecha inicio YYYY-MM-DD' })
  @ApiQuery({ name: 'fin',    required: false, example: '2026-12-31', description: 'Fecha fin YYYY-MM-DD' })
  @ApiOkResponse({ description: 'Historial retornado correctamente.' })
  @ApiUnauthorizedResponse({ description: 'Token JWT inválido o ausente.' })
  async getHistorial(
    @Request() req: any,
    @Query() filtros: FiltroFechasDto,
  ) {
    const idUsuario: number = req.user.id_usuario ?? req.user.sub;
    return this.dashboardService.obtenerHistorial(idUsuario, filtros);
  }

  // ── GET /productor-dashboard/resumen ─────────────────────────────────────
  @Get('resumen')
  @ApiOperation({
    summary: 'Resumen estadístico del productor',
    description:
      'Devuelve total_kg entregados, total_dinero recibido, ' +
      'total_entregas realizadas y fecha de la ultima_entrega.',
  })
  @ApiOkResponse({ description: 'Resumen calculado correctamente.' })
  @ApiUnauthorizedResponse({ description: 'Token JWT inválido o ausente.' })
  async getResumen(@Request() req: any) {
    const idUsuario: number = req.user.id_usuario ?? req.user.sub;
    return this.dashboardService.obtenerResumen(idUsuario);
  }

  // ── GET /productor-dashboard/qr ──────────────────────────────────────────
  @Get('qr')
  @ApiOperation({
    summary: 'Obtener código QR del productor',
    description:
      'Devuelve el QR almacenado (base64 data URL) del productor autenticado.',
  })
  @ApiOkResponse({ description: 'QR retornado correctamente.' })
  @ApiUnauthorizedResponse({ description: 'Token JWT inválido o ausente.' })
  @ApiNotFoundResponse({ description: 'No se encontró QR para este productor.' })
  async getQr(@Request() req: any) {
    const idUsuario: number = req.user.id_usuario ?? req.user.sub;
    return this.dashboardService.obtenerQr(idUsuario);
  }
}
