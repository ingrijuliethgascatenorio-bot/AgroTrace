import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Usuario } from '../users/entities/usuario.entity';
import { DetalleVenta } from './detalle_venta.entity';

@Entity('venta')
export class Venta {
  @PrimaryGeneratedColumn({ name: 'id_venta' })
  id_venta: number;

  @Column({ name: 'id_operario' })
  id_operario: number;

  @Column({ type: 'date', name: 'fecha_venta' })
  fecha_venta: string;

  @Column({ length: 150 })
  cliente: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total: number;

  @Column({ default: 'pendiente' })
  estado: string;

  @Column({ nullable: true, unique: true, name: 'numero_factura' })
  numero_factura: string;

  @ManyToOne(() => Usuario, { eager: false, nullable: true })
  @JoinColumn({ name: 'id_operario' })
  operario: Usuario;

  @OneToMany(() => DetalleVenta, (d) => d.venta, { cascade: true, eager: true })
  detalles: DetalleVenta[];
}
