import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PreciosService } from './precios.service';
import { PreciosController } from './precio.controller';
import { Precio } from './precios.entity';

@Module({
  imports: [
    // Registra la entidad Precio en TypeORM
    TypeOrmModule.forFeature([Precio]),
  ],
  controllers: [PreciosController],
  providers: [PreciosService],
  // Exportar servicio para que otros módulos (ventas, compras) puedan inyectarlo
  exports: [PreciosService],
})
export class PreciosModule {}
