// src/modules/comerciante/comerciante.entity.ts  — REEMPLAZA el existente
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Asociacion } from '../../tenant/asociacion.entity';

@Entity('comerciante')
export class Comerciante {
  @PrimaryGeneratedColumn()
  id_comerciante: number;

  @Column({ length: 100 })
  nombre: string;

  @Column({ length: 20 })
  telefono: string;

  @Column({ length: 150, nullable: true })
  direccion: string;

  @Column({ length: 150, nullable: true, default: null })
  email: string | null;

  @Column({ default: true })
  activo: boolean;

  // ── MULTI-TENANT ──────────────────────────────────────────
  @Column({ name: 'asociacion_id' })
  asociacion_id: number;

  @ManyToOne(() => Asociacion, { eager: false, nullable: false })
  @JoinColumn({ name: 'asociacion_id' })
  asociacion: Asociacion;
}
