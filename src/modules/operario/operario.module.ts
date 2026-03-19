import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { OperarioController } from "./operario.controller";
import { OperarioService } from "./operario.service";
import { Entrega } from "./entrega.entity";
import { Venta } from "../ventas/entities/venta.entity";
import { DetalleVenta } from "../ventas/entities/detalle_venta.entity";
import { Productor } from "../productor/productores.entity";
import { Producto } from '../productos/producto.entity';
import { Usuario } from "../users/entities/usuario.entity";


@Module({
  imports: [
    TypeOrmModule.forFeature([Entrega, Venta, DetalleVenta, Productor, Usuario, Producto])
  ],
  controllers: [OperarioController],
  providers: [OperarioService],
})
export class OperarioModule {}
