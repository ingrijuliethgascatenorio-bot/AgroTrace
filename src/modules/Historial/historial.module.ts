import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HistorialTransaccion } from './historial_transacion.entity';
import { HistorialPrecio } from './historial_precio.entity';
import { HistorialService } from './historial.service';
import { HistorialController } from './historial.controller';

@Module({
  imports: [TypeOrmModule.forFeature([HistorialTransaccion, HistorialPrecio])],
  controllers: [HistorialController],
  providers: [HistorialService],
  exports: [HistorialService],
})
export class HistorialModule {}
