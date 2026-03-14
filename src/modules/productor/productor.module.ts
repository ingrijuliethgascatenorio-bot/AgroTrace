import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProductoresController } from './productores.controller';
import { ProductoresService } from './productores.service';
import { Productor } from './productores.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Productor])],
  controllers: [ProductoresController],
  providers: [ProductoresService],
  exports: [ProductoresService],
})
export class ProductorModule {}
