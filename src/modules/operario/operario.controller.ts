import {
  Controller, Post, Put, Get,
  Body, Param, ParseIntPipe,
  UseGuards, Req, Query,
} from '@nestjs/common';
import { OperarioService }      from './operario.service';
import { JwtAuthGuard }         from '../auth/jwt-auth.guard';

@Controller('operario')
@UseGuards(JwtAuthGuard)
export class OperarioController {
  constructor(private readonly operarioService: OperarioService) {}

  @Get('perfil')
  getPerfil(@Req() req: any) {
    return this.operarioService.getPerfil(req.user.id_usuario);
  }

  @Put('perfil')
  updatePerfil(@Req() req: any, @Body() body: any) {
    return this.operarioService.updatePerfil(req.user.id_usuario, body);
  }

  @Get('productores/buscar')
  buscarProductores(@Query('q') q: string) {
    return this.operarioService.buscarProductores(q);
  }

  // ✅ CORREGIDO: este endpoint debe ir ANTES de :cedula para que NestJS
  //    no lo interprete como un parámetro de ruta
  @Get('productor/:cedula')
  getProductorByCedula(@Param('cedula') cedula: string) {
    return this.operarioService.getProductorByCedula(cedula);
  }

  @Post('registrar-entrega')
  registrarEntrega(@Req() req: any, @Body() dto: any) {
    return this.operarioService.registrarEntregaFrontend(req.user.id_usuario, dto);
  }

  @Put('editar-entrega/:id')
  editarEntrega(@Param('id', ParseIntPipe) id: number, @Body() dto: any) {
    return this.operarioService.editarEntrega(id, dto);
  }

  @Post('registrar-venta')
  registrarVenta(@Req() req: any, @Body() dto: any) {
    return this.operarioService.registrarVentaFrontend(req.user.id_usuario, dto);
  }

  @Get('historial')
  historial(@Req() req: any, @Query() params: any) {
    return this.operarioService.historialPlano(req.user.id_usuario, params);
  }
}
