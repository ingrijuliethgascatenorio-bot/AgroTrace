import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Producto } from './producto.entity';
import { ProductosService } from './producto.service';
import { ProductosController } from './producto.controller';

/**
 * ProductosModule
 * Registra la entidad, servicio y controlador de productos.
 * Para usarlo: importarlo en AppModule.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Producto])],
  controllers: [ProductosController],
  providers: [ProductosService],
  exports: [ProductosService],
})
export class ProductosModule {}
