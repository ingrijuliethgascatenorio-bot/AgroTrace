import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ruta } from './ruta.entity';
import { Entrega } from '../entregas/entregas.entity';
import { Precio } from '../Precios/precios.entity';
import { RutasService } from './ruta.service';
import { RutasController } from './rutas.controller';
import { StockModule } from '../stock/stock.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ruta, Entrega, Precio]),
    StockModule, // ← para que RutasService pueda inyectar StockService
  ],
  controllers: [RutasController],
  providers: [RutasService],
  exports: [RutasService],
})
export class RutasModule {}
