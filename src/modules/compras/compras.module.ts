import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Entrega } from '../entregas/entregas.entity';
import { ComprasService } from './compras.service';
import { ComprasController } from './compra.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Entrega])],
  controllers: [ComprasController],
  providers: [ComprasService],
  exports: [ComprasService],
})
export class ComprasModule {}

