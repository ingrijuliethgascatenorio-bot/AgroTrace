import {
  Controller, Get, Put, Delete, Post,
  Param, Body, Query,
  ParseIntPipe, UseGuards,
  UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { UsersService }    from './users.service';
import { EditarUsuarioDto } from './usuario.dto';
import { JwtAuthGuard }    from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../auth/roles.guard';
import { Permissions }     from '../../common/decorators/permisos.decorator';
import { Permission }      from '../../common/enums/permissions.enum';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage }     from 'multer';
import { extname }         from 'path'; // ✅ CORREGIDO: era 'path/win32' (solo Windows)

@Controller('usuarios')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @Permissions(Permission.DASHBOARD)
  listar(@Query('rol') rol?: string) {
    return this.usersService.listarTodos(rol);
  }

  @Put(':id')
  @Permissions(Permission.DASHBOARD)
  editar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: EditarUsuarioDto,
  ) {
    return this.usersService.editar(id, dto);
  }

  @Delete(':id')
  @Permissions(Permission.DASHBOARD)
  desactivar(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.desactivar(id);
  }

  @Post(':id/foto')
  @Permissions(Permission.DASHBOARD)
  @UseInterceptors(
    FileInterceptor('foto', {
      storage: diskStorage({
        destination: './public/uploads/fotos',
        filename: (req, file, cb) => {
          const nombre = `foto_${req.params.id}_${Date.now()}${extname(file.originalname)}`;
          cb(null, nombre);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
          return cb(new Error('Solo se permiten imagenes jpg, jpeg, png, webp'), false);
        }
        cb(null, true);
      },
    }),
  )
  async subirFoto(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const url = `/uploads/fotos/${file.filename}`;
    return this.usersService.editar(id, { foto_perfil: url });
  }
}
