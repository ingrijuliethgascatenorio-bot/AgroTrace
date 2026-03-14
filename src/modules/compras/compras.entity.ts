import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Productor } from '../productor/productores.entity';
import { Usuario } from '../users/entities/usuario.entity';
import { DetalleCompra } from './detalle-compra.entity';

@Entity('compra')
export class Compra {
  @PrimaryGeneratedColumn({ name: 'id_compra' })
  id_compra: number;

  @Column({ name: 'id_operario' })
  id_operario: number;

  @Column({ name: 'id_productor' })
  id_productor: number;

  @Column({ type: 'date', name: 'fecha_compra' })
  fecha_compra: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total: number;

  @Column({ default: 'pendiente' })
  estado: string;

  @Column({ nullable: true, unique: true, name: 'numero_factura' })
  numero_factura: string;

  @ManyToOne(() => Productor, { eager: false, nullable: true })
  @JoinColumn({ name: 'id_productor' })
  productor: Productor;

  @ManyToOne(() => Usuario, { eager: false, nullable: true })
  @JoinColumn({ name: 'id_operario' })
  operario: Usuario;

  @OneToMany(() => DetalleCompra, (d) => d.compra, {
    cascade: true,
    eager: true,
  })
  detalles: DetalleCompra[];
}
