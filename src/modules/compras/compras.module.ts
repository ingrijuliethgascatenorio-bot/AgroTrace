import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Compra } from './compras.entity';
import { DetalleCompra } from './detalle-compra.entity';
import { ComprasService } from './compras.service';
import { ComprasController } from './compra.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Compra, DetalleCompra])],
  controllers: [ComprasController],
  providers: [ComprasService],
  exports: [ComprasService],
})
export class ComprasModule {}
