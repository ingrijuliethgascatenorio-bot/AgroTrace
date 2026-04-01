// src/tenant/asociacion.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('asociaciones')
export class Asociacion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 150 })
  nombre: string;

  /** 'asoc1' extraído de asoc1.agrotrace.com */
  @Column({ type: 'varchar', length: 60, unique: true })
  subdominio: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  email_contacto: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  telefono: string | null;

  @Column({ type: 'text', nullable: true })
  direccion: string | null;

  @Column({ type: 'text', nullable: true })
  logo_url: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  fecha_creacion: Date;

  @Column({ type: 'varchar', length: 20, default: 'ACTIVO' })
  estado: 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO';
}
