import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ProductosService } from './producto.service';
import {
  CreateProductoDto,
  UpdateProductoDto,
  UpdateEstadoProductoDto,
} from './producto.dto';
// import { JwtAuthGuard } from '../auth/jwt-auth.guard';   // ← descomentar cuando esté listo
// import { RolesGuard }   from '../auth/roles.guard';
// import { Roles }        from '../auth/roles.decorator';

/**
 * ProductosController
 *
 * Endpoints:
 *   GET    /productos              → todos los productos
 *   GET    /productos/disponibles  → solo disponibles
 *   GET    /productos/categorias   → lista de categorías
 *   GET    /productos/:id          → uno por ID
 *   POST   /productos              → crear
 *   PUT    /productos/:id          → editar completo
 *   PATCH  /productos/:id/estado   → soft delete / reactivar
 *   DELETE /productos/:id          → eliminar permanente (solo ADMIN)
 */
@Controller('productos')
// @UseGuards(JwtAuthGuard, RolesGuard)   // ← habilitar cuando el guard esté listo
export class ProductosController {
  constructor(private readonly productosService: ProductosService) {}

  // ─── READ ─────────────────────────────────────

  @Get()
  findAll() {
    return this.productosService.findAll();
  }

  @Get('disponibles')
  findDisponibles() {
    return this.productosService.findDisponibles();
  }

  @Get('categorias')
  getCategorias() {
    return this.productosService.getCategorias();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productosService.findOne(id);
  }

  // ─── CREATE ───────────────────────────────────

  @Post()
  @HttpCode(HttpStatus.CREATED)
  // @Roles('ADMIN')
  create(@Body() dto: CreateProductoDto) {
    return this.productosService.create(dto);
  }

  // ─── UPDATE ───────────────────────────────────

  @Put(':id')
  // @Roles('ADMIN')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductoDto,
  ) {
    return this.productosService.update(id, dto);
  }

  /**
   * PATCH /productos/:id/estado
   * Soft Delete: { disponible: false } desactiva el producto.
   * Reactivar:   { disponible: true  }
   */
  @Patch(':id/estado')
  // @Roles('ADMIN')
  updateEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEstadoProductoDto,
  ) {
    return this.productosService.updateEstado(id, dto);
  }

  // ─── DELETE ───────────────────────────────────

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  // @Roles('ADMIN')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productosService.remove(id);
  }
}