// src/modules/entregas/entregas.entity.ts  — REEMPLAZA el existente
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Productor } from '../productor/productores.entity';
import { Usuario } from '../users/entities/usuario.entity';
import { Producto } from '../productos/producto.entity';
import { Asociacion } from '../../tenant/asociacion.entity';

@Entity('entrega')
export class Entrega {
  @PrimaryGeneratedColumn()
  id_entrega: number;

  @Column()
  id_operario: number;

  @Column({ type: 'varchar', length: 10, default: 'AFILIADO' })
  tipo_productor: string;

  @Column({ nullable: true, default: null })
  id_productor: number | null;

  @Column({ type: 'varchar', length: 150, nullable: true, default: null })
  nombre_productor_externo: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true, default: null })
  telefono_productor_externo: string | null;

  @Column()
  id_producto: number;

  @Column({ type: 'varchar', length: 150, nullable: true, default: null })
  nombre_producto_otro: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  peso_kg: number;

  @Column({ type: 'int', default: 0 })
  cantidad_unidades: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    default: null,
  })
  precio_unitario: number | null;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    default: null,
  })
  total: number | null;

  @CreateDateColumn()
  fecha: Date;

  @Column({ nullable: true, default: null, name: 'ruta_id' })
  ruta_id: number | null;

  @Column({ type: 'varchar', length: 30, default: 'PENDIENTE_LIQUIDACION' })
  estado_liquidacion: string;

  @Column({ type: 'text', nullable: true, default: null })
  comprobante_pago: string | null;

  @Column({ type: 'varchar', length: 20, default: 'PENDIENTE' })
  estado_pago: string;

  @Column({ type: 'timestamp', nullable: true, default: null })
  fecha_pago: Date | null;

  // ── MULTI-TENANT ──────────────────────────────────────────
  @Column({ name: 'asociacion_id' })
  asociacion_id: number;

  @ManyToOne(() => Asociacion, { eager: false, nullable: false })
  @JoinColumn({ name: 'asociacion_id' })
  asociacion: Asociacion;

  // ── Relaciones ─────────────────────────────────────────────────────────────
  @ManyToOne(() => Productor, { eager: false })
  @JoinColumn({ name: 'id_productor' })
  productor: Productor;

  @ManyToOne(() => Usuario, { eager: false })
  @JoinColumn({ name: 'id_operario' })
  operario: Usuario;

  @ManyToOne(() => Producto, { eager: false })
  @JoinColumn({ name: 'id_producto' })
  producto: Producto;
}
