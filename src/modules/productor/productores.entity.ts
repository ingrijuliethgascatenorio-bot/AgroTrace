// src/modules/productor/productores.entity.ts  — REEMPLAZA el existente
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Usuario } from '../users/entities/usuario.entity';
import { Asociacion } from '../../tenant/asociacion.entity';

@Entity('productor')
export class Productor {
  @PrimaryGeneratedColumn()
  id_productor: number;

  @Column({ nullable: true })
  cedula: string;

  @Column({ nullable: true })
  telefono?: string;

  @Column({ nullable: true })
  finca: string;

  @Column({ nullable: true })
  ubicacion: string;

  @Column({ default: 'ACTIVO' })
  estado: string;

  @Column({ type: 'text', nullable: true })
  codigo_qr?: string;

  @Column({ nullable: true })
  id_usuario: number;

  @ManyToOne(() => Usuario, { nullable: true, eager: false })
  @JoinColumn({ name: 'id_usuario' })
  usuario: Usuario;

  // ── MULTI-TENANT ──────────────────────────────────────────
  @Column({ name: 'asociacion_id' })
  asociacion_id: number;

  @ManyToOne(() => Asociacion, { eager: false, nullable: false })
  @JoinColumn({ name: 'asociacion_id' })
  asociacion: Asociacion;
}
