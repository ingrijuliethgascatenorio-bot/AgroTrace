import {
  Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn,
} from 'typeorm';
import { Venta }    from './ventas.entity';
import { Producto } from '../productos/producto.entity';

@Entity('detalle_venta')
export class DetalleVenta {
  @PrimaryGeneratedColumn({ name: 'id_detalle_venta' })
  id_detalle_venta: number;

  @Column({ name: 'id_venta' })
  id_venta: number;

  @Column({ name: 'id_producto' })
  id_producto: number;

  // ✅ CORREGIDO: campo real es 'cantidad', no 'cantidad_kg'
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  cantidad: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'precio_unitario' })
  precio_unitario: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  subtotal: number;

  @ManyToOne(() => Venta, (v) => v.detalles)
  @JoinColumn({ name: 'id_venta' })
  venta: Venta;

  @ManyToOne(() => Producto, { eager: true })
  @JoinColumn({ name: 'id_producto' })
  producto: Producto;
}
