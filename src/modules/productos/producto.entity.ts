// src/modules/productos/producto.entity.ts  — REEMPLAZA el existente
import {
  Column,
  Entity,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Asociacion } from '../../tenant/asociacion.entity';

@Entity('producto')
export class Producto {
  @PrimaryGeneratedColumn({ name: 'id_producto' })
  id_producto: number;

  @Column()
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ nullable: true })
  unidad_medida: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'precio_base',
    default: 0,
  })
  precio_base: number;

  @Column({ default: true })
  disponible: boolean;

  // ── MULTI-TENANT ──────────────────────────────────────────
  @Column({ name: 'asociacion_id' })
  asociacion_id: number;

  @ManyToOne(() => Asociacion, { eager: false, nullable: false })
  @JoinColumn({ name: 'asociacion_id' })
  asociacion: Asociacion;
}
