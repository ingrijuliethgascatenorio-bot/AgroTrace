import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Producto } from '../productos/producto.entity';

@Entity('historial_precio')
export class HistorialPrecio {
  @PrimaryGeneratedColumn({ name: 'id_historial_precio' })
  id_historial_precio: number;

  @Column({ name: 'id_producto' })
  id_producto: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  precio: number;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    name: 'fecha_cambio',
  })
  fecha_cambio: Date;

  @Column({ nullable: true, length: 255 })
  motivo: string;

  @ManyToOne(() => Producto, { eager: true })
  @JoinColumn({ name: 'id_producto' })
  producto: Producto;
}
