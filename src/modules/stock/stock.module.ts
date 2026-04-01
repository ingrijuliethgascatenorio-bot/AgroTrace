import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Stock } from './stock.entity';
import { StockMovimiento } from './stock-movimiento.entity';
import { StockService } from './stock.service';
import { StockController } from './stock.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Stock, StockMovimiento])],
  controllers: [StockController],
  providers: [StockService],
  exports: [StockService], // exportado para Ruta y Ventas
})
export class StockModule {}
