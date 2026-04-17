// src/modules/compras/compras.entity.ts
/**
 * NOTA: En la arquitectura actual, Compra es una "vista" sobre Entrega.
 * ComprasService mapea Entrega → shape de compra. Esta entidad existe
 * por compatibilidad con el módulo de compras, pero si en el futuro
 * se decide separar completamente, se puede materializar.
 *
 * BUG CORREGIDO: el campo id_operario apuntaba a Usuario pero el nombre
 * de la relación era "operario" sin estar correctamente tipado.
 * Se agrega la columna asociacion_id para consistencia multi-tenant.
 */
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Productor } from '../productor/productores.entity';
import { Usuario } from '../users/entities/usuario.entity';
import { DetalleCompra } from './detalle-compra.entity';
import { Asociacion } from '../../tenant/asociacion.entity';

@Entity('compra')
@Index('IDX_compra_asociacion', ['asociacion_id'])
@Index('IDX_compra_operario', ['id_operario'])
@Index('IDX_compra_productor', ['id_productor'])
export class Compra {
  @PrimaryGeneratedColumn({ name: 'id_compra' })
  id_compra: number;

  // FK explícita + relación nombrada con claridad
  @Column({ name: 'id_operario', nullable: false })
  id_operario: number;

  @Column({ name: 'id_productor', nullable: true })
  id_productor: number | null;

  @Column({ type: 'date', name: 'fecha_compra' })
  fecha_compra: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total: number;

  @Column({ type: 'varchar', length: 20, default: 'pendiente' })
  estado: string;

  @Column({ nullable: true, unique: true, name: 'numero_factura' })
  numero_factura: string | null;

  @Column({ default: true })
  activo: boolean;

  // ── Relaciones ─────────────────────────────────────────────────────────────
  @ManyToOne(() => Productor, { eager: false, nullable: true })
  @JoinColumn({ name: 'id_productor' })
  productor: Productor;

  /**
   * BUG FIX: la relación se llama "operario" (el usuario que registró la compra).
   * En ComprasService._map() se expone como nombre_operario correctamente.
   * En el frontend: c.nombre_operario || c.operario?.nombre — ya funciona.
   */
  @ManyToOne(() => Usuario, { eager: false, nullable: false })
  @JoinColumn({ name: 'id_operario' })
  operario: Usuario;

  @OneToMany(() => DetalleCompra, (d) => d.compra, {
    cascade: true,
    eager: true,
  })
  detalles: DetalleCompra[];

  // ── MULTI-TENANT ──────────────────────────────────────────────────────────
  @Column({ name: 'asociacion_id', nullable: true })
  asociacion_id: number | null;

  @ManyToOne(() => Asociacion, { eager: false, nullable: true })
  @JoinColumn({ name: 'asociacion_id' })
  asociacion: Asociacion | null;
}
