// src/modules/admin/Admin.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';

import { AdminController } from './Admin.controller';
import { UploadProductoresService } from './upload-productores.service';
import { UploadUsuariosService } from './upload-usuarios.service';
import { Usuario } from '../users/entities/usuario.entity';
import { Productor } from '../productor/productores.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario, Productor]),
    MulterModule.register({}),
  ],
  controllers: [AdminController],
  providers: [UploadProductoresService, UploadUsuariosService],
})
export class AdminModule {}

// ─────────────────────────────────────────────────────────────────────────────
// RECUERDA: AdminModule debe estar en los imports de app.module.ts:
//
//   import { AdminModule } from './modules/admin/admin.module';
//   ...
//   imports: [
//     ...
//     AdminModule,
//   ]
// ─────────────────────────────────────────────────────────────────────────────
