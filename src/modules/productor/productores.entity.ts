// src/modules/productor/productores.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Usuario } from '../users/entities/usuario.entity';
import { Asociacion } from '../../tenant/asociacion.entity';

/**
 * CORRECCIÓN PRINCIPAL: la relación con Usuario es OneToOne, no ManyToOne.
 * Un usuario PRODUCTOR tiene exactamente un perfil de productor.
 * Usar ManyToOne era incorrecto conceptualmente y permitía
 * que varios productores apuntaran al mismo usuario.
 *
 * DECISIÓN: cedula y telefono se eliminan de aquí.
 * → cedula: vive SOLO en usuario.entity (ÚNICO, indexado)
 * → telefono: vive SOLO en usuario.entity
 * → En ProductorService.crear() ya se guarda la cédula en el usuario.
 *
 * Si en consultas necesitas la cédula del productor:
 *   productor.usuario.cedula
 *
 * DECISIÓN: tipo_certificacion se agrega (estaba en el diseño original
 * pero no estaba implementado en la entidad).
 */
@Entity('productor')
@Index('UQ_productor_usuario', ['id_usuario'], { unique: true })
export class Productor {
  @PrimaryGeneratedColumn()
  id_productor: number;

  @Column({ type: 'varchar', length: 150, nullable: true })
  finca: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  ubicacion: string | null;

  /**
   * tipo_certificacion: campo propio del productor, no del usuario.
   * Ej: 'ORGANICO', 'CONVENCIONAL', 'FAIRTRADE', null
   */
  @Column({ type: 'varchar', length: 50, nullable: true })
  tipo_certificacion: string | null;

  @Column({ type: 'varchar', length: 10, default: 'ACTIVO' })
  estado: string;

  /** QR generado a partir de la cédula del usuario */
  @Column({ type: 'text', nullable: true })
  codigo_qr: string | null;

  // ── Relación OneToOne con Usuario ─────────────────────────────────────────
  /**
   * id_usuario es la FK. @JoinColumn va en el lado que tiene la FK (este).
   * La relación es nullable: false porque un productor SIEMPRE tiene usuario.
   */
  @Column({ name: 'id_usuario', nullable: false })
  id_usuario: number;

  @OneToOne(() => Usuario, { eager: false, nullable: false })
  @JoinColumn({ name: 'id_usuario' })
  usuario: Usuario;

  // ── MULTI-TENANT ──────────────────────────────────────────────────────────
  @Column({ name: 'asociacion_id' })
  asociacion_id: number;

  @ManyToOne(() => Asociacion, { eager: false, nullable: false })
  @JoinColumn({ name: 'asociacion_id' })
  asociacion: Asociacion;
}
