import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Venta }            from './ventas.entity';
import { DetalleVenta }     from './detalle_venta.entity';
import { VentasService }    from './ventas.service';
import { VentasController } from './ventas.controller';
import { EmailModule }      from '../email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Venta, DetalleVenta]),
    EmailModule,   // ← necesario para inyectar EmailService en VentasService
  ],
  controllers: [VentasController],
  providers: [VentasService],
  exports: [VentasService],
})
export class VentasModule {}
