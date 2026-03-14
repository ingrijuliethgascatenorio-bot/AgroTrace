import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Compra } from './compras.entity';
import { Producto } from '../productos/producto.entity';

@Entity('detalle_compra')
export class DetalleCompra {
  @PrimaryGeneratedColumn({ name: 'id_detalle_compra' })
  id_detalle_compra: number;

  @Column({ name: 'id_compra' })
  id_compra: number;

  @Column({ name: 'id_producto' })
  id_producto: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  cantidad: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'precio_unitario' })
  precio_unitario: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  subtotal: number;

  @ManyToOne(() => Compra, (c) => c.detalles)
  @JoinColumn({ name: 'id_compra' })
  compra: Compra;

  @ManyToOne(() => Producto, { eager: true })
  @JoinColumn({ name: 'id_producto' })
  producto: Producto;
}
