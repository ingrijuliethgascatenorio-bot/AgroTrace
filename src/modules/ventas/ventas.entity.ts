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
import { Comerciante } from '../comerciante/comerciante.entity';

@Entity('venta')
export class Venta {
  @PrimaryGeneratedColumn({ name: 'id_venta' })
  id_venta: number;

  @Column({ name: 'id_operario' })
  id_operario: number;

  @Column({ name: 'id_comerciante' })
  id_comerciante: number;

  @Column({ type: 'date', name: 'fecha_venta' })
  fecha_venta: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total: number;

  @Column({ default: 'pendiente' })
  estado: string;

  @Column({ nullable: true, unique: true, name: 'numero_factura' })
  numero_factura: string;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'id_operario' })
  operario: Usuario;

  @ManyToOne(() => Comerciante)
  @JoinColumn({ name: 'id_comerciante' })
  comerciante: Comerciante;

  @OneToMany(() => DetalleVenta, (d) => d.venta, {
    cascade: true,
    eager: true,
  })
  detalles: DetalleVenta[];
}
