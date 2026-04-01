// src/modules/ventas/ventas.entity.ts  — REEMPLAZA el existente
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
import { Asociacion } from '../../tenant/asociacion.entity';

@Entity('venta')
export class Venta {
  @PrimaryGeneratedColumn({ name: 'id_venta' })
  id_venta: number;

  @Column({ name: 'id_operario' })
  id_operario: number;

  @Column({ name: 'id_comerciante', nullable: true })
  id_comerciante: number | null;

  @Column({ type: 'date', name: 'fecha_venta' })
  fecha_venta: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  total: number;

  @Column({ default: 'pendiente' })
  estado: string;

  @Column({ nullable: true, unique: true, name: 'numero_factura' })
  numero_factura: string;

  @Column({ nullable: true, default: '' })
  cliente: string;

  // ── MULTI-TENANT ──────────────────────────────────────────
  @Column({ name: 'asociacion_id' })
  asociacion_id: number;

  @ManyToOne(() => Asociacion, { eager: false, nullable: false })
  @JoinColumn({ name: 'asociacion_id' })
  asociacion: Asociacion;

  // ── Relaciones ────────────────────────────────────────────
  @ManyToOne(() => Usuario, { nullable: true, eager: false })
  @JoinColumn({ name: 'id_operario' })
  operario: Usuario;

  @ManyToOne(() => Comerciante, { nullable: true, eager: false })
  @JoinColumn({ name: 'id_comerciante' })
  comerciante: Comerciante;

  @OneToMany(() => DetalleVenta, (d) => d.venta, { cascade: true, eager: true })
  detalles: DetalleVenta[];
}
