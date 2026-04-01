import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Producto } from '../productos/producto.entity';

@Entity('precios')
export class Precio {
  @PrimaryGeneratedColumn({ name: 'id_precio' })
  id_precio: number;

  // ── Relación con producto ──────────────────────────────
  @Column({ name: 'id_producto' })
  id_producto: number;

  @ManyToOne(() => Producto, { eager: true, nullable: true })
  @JoinColumn({ name: 'id_producto' })
  producto: Producto;

  // ── Datos de entrada (ingresados por el admin) ─────────
  @Column({
    name: 'precio_base_kg',
    type: 'decimal',
    precision: 12,
    scale: 2,
    comment: 'Precio base por kg que ingresa el admin',
  })
  precio_base_kg: number;

  @Column({
    name: 'precio_transporte',
    type: 'decimal',
    precision: 12,
    scale: 2,
    comment: 'Costo total de transporte del lote',
  })
  precio_transporte: number;

  @Column({
    name: 'total_kilos',
    type: 'decimal',
    precision: 12,
    scale: 2,
    comment: 'Total de kilos del lote transportado',
  })
  total_kilos: number;

  // ── Campos calculados (generados por el servicio) ──────
  @Column({
    name: 'costo_transporte_kg',
    type: 'decimal',
    precision: 12,
    scale: 4,
    comment: 'precio_transporte / total_kilos',
  })
  costo_transporte_kg: number;

  @Column({
    name: 'precio_final_kg',
    type: 'decimal',
    precision: 12,
    scale: 2,
    comment: 'Precio final por kg según regla de negocio',
  })
  precio_final_kg: number;

  @Column({
    name: 'margen_asociacion',
    type: 'decimal',
    precision: 5,
    scale: 4,
    default: 0.035,
    comment: 'Margen de la asociación (3.5% = 0.035)',
  })
  margen_asociacion: number;

  // ── Metadatos ──────────────────────────────────────────
  @CreateDateColumn({ name: 'fecha', type: 'timestamp' })
  fecha: Date;

  @Column({ default: true })
  activo: boolean;
}
