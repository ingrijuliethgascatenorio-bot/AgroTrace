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

@Entity('entrega')
export class Entrega {
  @PrimaryGeneratedColumn()
  id_entrega: number;

  @Column()
  id_operario: number;

  @Column()
  id_productor: number;

  @Column()
  id_producto: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  peso_kg: number;

  @Column({ type: 'int', default: 0 })
  cantidad_unidades: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  precio_unitario: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total: number;

  @CreateDateColumn()
  fecha: Date;

  // ── Comprobante de pago ────────────────────────────────────────────────
  /** Ruta del archivo subido. Ej: /uploads/comprobantes/comp_12_1234567890.pdf */
  @Column({ type: 'text', nullable: true, default: null })
  comprobante_pago: string | null;

  /** 'PENDIENTE' = sin comprobante | 'PAGADO' = comprobante subido */
  @Column({ type: 'varchar', length: 20, default: 'PENDIENTE' })
  estado_pago: string;

  /** Fecha en que se subio el comprobante */
  @Column({ type: 'timestamp', nullable: true, default: null })
  fecha_pago: Date | null;

  // ── Relaciones ─────────────────────────────────────────────────────────
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
