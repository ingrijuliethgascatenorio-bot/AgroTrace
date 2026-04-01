import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { EntregasService } from './entregas.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

// ── Carpeta destino (se crea automáticamente si no existe) ──────────────
const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', 'comprobantes');
if (!existsSync(UPLOAD_DIR)) {
  mkdirSync(UPLOAD_DIR, { recursive: true });
  console.log(`[COMPROBANTES] Carpeta creada: ${UPLOAD_DIR}`);
}

// ── Tipos permitidos ────────────────────────────────────────────────────
const TIPOS_PERMITIDOS = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];
const MIME_PERMITIDOS = [
  'application/pdf',
  'image/jpg',
  'image/jpeg',
  'image/png',
  'image/webp',
];

@Controller('entregas')
@UseGuards(JwtAuthGuard)
export class EntregasController {
  constructor(private readonly entregasService: EntregasService) {}

  // GET /api/entregas
  @Get()
  async findAll(@Query('id_productor') id_productor?: string) {
    const filtros = id_productor
      ? { id_productor: parseInt(id_productor, 10) }
      : undefined;
    const entregas = await this.entregasService.findAll(filtros);
    return { ok: true, data: entregas };
  }

  // GET /api/entregas/estadisticas/resumen
  @Get('estadisticas/resumen')
  async getEstadisticas(@Query('id_productor') id_productor?: string) {
    const filtros = id_productor
      ? { id_productor: parseInt(id_productor, 10) }
      : undefined;
    const stats = await this.entregasService.getEstadisticas(filtros);
    return { ok: true, data: stats };
  }

  // GET /api/entregas/:id
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const entrega = await this.entregasService.findOne(id);
    return { ok: true, data: entrega };
  }

  // POST /api/entregas
  @Post()
  async crear(@Req() req: any, @Body() body: any) {
    const entrega = await this.entregasService.crear({
      id_operario:       req.user.id_usuario,
      id_productor:      body.id_productor,
      id_producto:       body.id_producto,
      peso_kg:           body.peso_kg,
      cantidad_unidades: body.cantidad_unidades,
      precio_unitario:   body.precio_unitario,
    });
    return { ok: true, data: entrega, mensaje: 'Entrega registrada exitosamente' };
  }

  // ────────────────────────────────────────────────────────────────────────
  // POST /api/entregas/:id/comprobante
  // Admin sube PDF o imagen del comprobante de pago.
  // Al subir → estado_pago = PAGADO, estado_liquidacion = PAGADO
  // ────────────────────────────────────────────────────────────────────────
  @Post(':id/comprobante')
  @UseInterceptors(
    FileInterceptor('comprobante', {
      storage: diskStorage({
        // Destination: usa la carpeta ya creada arriba
        destination: (_req, _file, cb) => {
          cb(null, UPLOAD_DIR);
        },
        filename: (req, file, cb) => {
          const ext = extname(file.originalname).toLowerCase();
          const nombre = `comp_${req.params.id}_${Date.now()}${ext}`;
          cb(null, nombre);
        },
      }),

      limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB

      // ── fileFilter corregido ─────────────────────────────────────────
      // Verifica extensión Y mimetype por separado para mayor compatibilidad
      fileFilter: (_req, file, cb) => {
        const ext  = extname(file.originalname).toLowerCase();
        const mime = (file.mimetype || '').toLowerCase();

        const extOk  = TIPOS_PERMITIDOS.includes(ext);
        const mimeOk = MIME_PERMITIDOS.some(m => mime.includes(m.split('/')[1]));

        if (!extOk && !mimeOk) {
          return cb(
            new HttpException(
              `Tipo de archivo no permitido: ${ext || mime}. Usa PDF, JPG, JPEG, PNG o WEBP.`,
              HttpStatus.BAD_REQUEST,
            ),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async subirComprobante(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new HttpException(
        'No se recibio ningun archivo. Verifica que el campo se llame "comprobante".',
        HttpStatus.BAD_REQUEST,
      );
    }

    const rutaArchivo = `/uploads/comprobantes/${file.filename}`;
    const entrega     = await this.entregasService.subirComprobante(id, rutaArchivo);

    return {
      ok:      true,
      mensaje: 'Comprobante subido. Entrega marcada como PAGADA.',
      archivo: rutaArchivo,
      data:    entrega,
    };
  }

  // DELETE /api/entregas/:id/comprobante
  @Delete(':id/comprobante')
  async eliminarComprobante(@Param('id', ParseIntPipe) id: number) {
    const entrega = await this.entregasService.eliminarComprobante(id);
    return {
      ok:      true,
      mensaje: 'Comprobante eliminado. Estado vuelve a PENDIENTE.',
      data:    entrega,
    };
  }

  // DELETE /api/entregas/:id
  @Delete(':id')
  async eliminar(@Param('id', ParseIntPipe) id: number) {
    await this.entregasService.eliminar(id);
    return { ok: true, mensaje: 'Entrega eliminada' };
  }
}
