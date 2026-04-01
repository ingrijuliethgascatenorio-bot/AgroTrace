import { Module }         from '@nestjs/common';
import { TypeOrmModule }  from '@nestjs/typeorm';

import { OperarioController } from './operario.controller';
import { OperarioService }    from './operario.service';
import { Entrega }            from '../entregas/entregas.entity'; // updated entity
import { Venta }              from '../ventas/ventas.entity';
import { DetalleVenta }       from '../ventas/detalle_venta.entity';
import { Productor }          from '../productor/productores.entity';
import { Producto }           from '../productos/producto.entity';
import { Usuario }            from '../users/entities/usuario.entity';
import { Ruta }               from '../Ruta/ruta.entity';
import { PreciosModule }      from '../Precios/precio.module';
import { StockModule }        from '../stock/stock.module';
import { EmailModule }        from '../email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Entrega, Venta, DetalleVenta, Productor, Usuario, Producto, Ruta,
    ]),
    PreciosModule,
    StockModule,
    EmailModule,
  ],
  controllers: [OperarioController],
  providers: [OperarioService],
  exports: [OperarioService],
})
export class OperarioModule {}