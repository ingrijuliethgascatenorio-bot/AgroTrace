import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Comerciante } from './comerciante.entity';
import { ComerciantesService } from './comerciante.service';
import { ComerciantesController } from './comerciante.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Comerciante])],
  controllers: [ComerciantesController],
  providers: [ComerciantesService],
})
export class ComerciantesModule {}
