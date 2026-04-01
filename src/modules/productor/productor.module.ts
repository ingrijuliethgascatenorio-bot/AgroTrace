import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProductoresController } from './productores.controller';
import { ProductoresService }    from './productores.service';
import { Productor }             from './productores.entity';
import { Usuario }               from '../users/entities/usuario.entity'; // ✅ necesario para transacción

@Module({
  imports: [TypeOrmModule.forFeature([Productor, Usuario])],
  controllers: [ProductoresController],
  providers:   [ProductoresService],
  exports:     [ProductoresService],
})
export class ProductorModule {}
