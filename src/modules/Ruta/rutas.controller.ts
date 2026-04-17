/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RutasService } from './ruta.service';

@Controller('rutas')
@UseGuards(JwtAuthGuard)
export class RutasController {
  constructor(private readonly rutasService: RutasService) {}

  // GET /api/rutas — listar SOLO las rutas del operario autenticado
  // FIX: antes llamaba listar() sin pasar id_usuario → devolvía todas las rutas.
  @Get()
  listar(@Req() req: any) {
    return this.rutasService.listar(req.user.id_usuario);
  }

  // GET /api/rutas/:id
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.rutasService.findOne(id);
  }

  // GET /api/rutas/:id/entregas
  @Get(':id/entregas')
  getEntregas(@Param('id', ParseIntPipe) id: number) {
    return this.rutasService.getEntregas(id);
  }

  // POST /api/rutas — crear nueva ruta
  @Post()
  crear(
    @Req() req: any,
    @Body() body: { id_producto?: number; fecha?: string },
  ) {
    return this.rutasService.crear({
      ...body,
      id_usuario: req.user.id_usuario,
    });
  }

  // POST /api/rutas/:id/cerrar
  @Post(':id/cerrar')
  cerrar(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { flete: number },
  ) {
    return this.rutasService.cerrarRuta(id, body);
  }

  // POST /api/rutas/:id/vincular-pendientes
  @Post(':id/vincular-pendientes')
  vincularPendientes(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.rutasService
      .vincularEntregasPendientes(id, req.user.id_usuario)
      .then((n) => ({
        ok: true,
        mensaje: `${n} entrega${n !== 1 ? 's' : ''} vinculada${n !== 1 ? 's' : ''} a la ruta #${id}`,
        entregas_vinculadas: n,
      }));
  }
}
