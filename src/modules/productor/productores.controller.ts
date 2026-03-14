import {
    Controller, Get, Post, Put, Patch, Delete,
    Body, Param, ParseIntPipe, UseGuards,
    HttpCode, HttpStatus, Query,
} from '@nestjs/common';
import { ProductoresService }  from './productores.service';
import { CrearProductorDto }   from './productor.dto';
import { EditarProductorDto }  from './productor.dto';
import { CambiarEstadoDto }    from './productor.dto';
import { JwtAuthGuard }        from '../auth/jwt-auth.guard';
import { PermissionGuard }     from '../auth/roles.guard';                      
import { Permissions }         from '../../common/decorators/permisos.decorator';
import { Permission }          from '../../common/enums/permissions.enum';       

@Controller('productores')
@UseGuards(JwtAuthGuard)
export class ProductoresController {

    constructor(private readonly productoresService: ProductoresService) {}

    @Get()
    async listar(@Query('todos') todos?: string) {
        const lista = todos === 'true'
            ? await this.productoresService.listarTodos()
            : await this.productoresService.listar();
        return { ok: true, data: lista };
    }

    @Get('qr/:code')
    @UseGuards(PermissionGuard)
    @Permissions(Permission.PRODUCTORES, Permission.COMPRAS)
    async buscarPorQR(@Param('code') code: string) {
        const productor = await this.productoresService.buscarPorQR(
            decodeURIComponent(code),
        );
        return {
            ok: true,
            data: {
                id_productor: productor.id_productor,
                finca:        productor.finca,
                ubicacion:    productor.ubicacion,
                estado:       productor.estado,
                codigo_qr:    productor.codigo_qr,
            },
        };
    }

    @Get(':id')
    async detalle(@Param('id', ParseIntPipe) id: number) {
        const productor = await this.productoresService.obtenerPorId(id);
        return { ok: true, data: productor };
    }

    @Get(':id/qr-imagen')
    @UseGuards(PermissionGuard)
    @Permissions(Permission.PRODUCTORES)
    async obtenerQRImagen(@Param('id', ParseIntPipe) id: number) {
        const productor = await this.productoresService.obtenerPorId(id);
        return {
            ok: true,
            data: {
                id_productor: productor.id_productor,
                finca:        productor.finca,
                codigo_qr:    productor.codigo_qr,
            },
        };
    }

    @Post()
    @UseGuards(PermissionGuard)
    @Permissions(Permission.PRODUCTORES)
    @HttpCode(HttpStatus.CREATED)
    async crear(@Body() dto: CrearProductorDto) {
        const productor = await this.productoresService.crear(dto);
        return {
            ok:      true,
            mensaje: 'Productor creado y QR generado exitosamente.',
            data:    productor,
        };
    }


    @Put(':id')
    @UseGuards(PermissionGuard)
    @Permissions(Permission.PRODUCTORES)
    async editar(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: EditarProductorDto,
    ) {
        const productor = await this.productoresService.editar(id, dto);
        return { ok: true, mensaje: 'Productor actualizado.', data: productor };
    }

    @Patch(':id/estado')
    @UseGuards(PermissionGuard)
    @Permissions(Permission.PRODUCTORES)
    async cambiarEstado(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: CambiarEstadoDto,
    ) {
        const resultado = dto.estado === 'INACTIVO'
            ? await this.productoresService.desactivar(id)
            : await this.productoresService.activar(id);
        return { ok: true, ...resultado };
    }

    @Delete(':id')
    @UseGuards(PermissionGuard)
    @Permissions(Permission.PRODUCTORES)
    async eliminar(@Param('id', ParseIntPipe) id: number) {
        const resultado = await this.productoresService.desactivar(id);
        return { ok: true, ...resultado };
    }

    @Post(':id/qr')
    @UseGuards(PermissionGuard)
    @Permissions(Permission.PRODUCTORES)
    async regenerarQR(@Param('id', ParseIntPipe) id: number) {
        const productor = await this.productoresService.regenerarQR(id);
        return {
            ok:      true,
            mensaje: 'QR regenerado exitosamente.',
            data: {
                id_productor: productor.id_productor,
                codigo_qr:    productor.codigo_qr,
            },
        };
    }
}