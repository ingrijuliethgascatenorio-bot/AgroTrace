// src/modules/users/entities/usuario.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Asociacion } from '../../../tenant/asociacion.entity';
import { Exclude } from 'class-transformer';

/**
 * ENUM centralizado — fuente única de verdad para roles.
 * Exportarlo permite reutilizarlo en DTOs, guards y servicios
 * sin repetir strings mágicos.
 */
export enum TipoUsuario {
  ADMIN = 'ADMIN',
  OPERARIO = 'OPERARIO',
  PRODUCTOR = 'PRODUCTOR',
}

/**
 * DECISIÓN DE DISEÑO: permisos como array de strings en PostgreSQL.
 *
 * ✅ Mantener: el modelo multi-tenant actual es sencillo y funciona.
 *    Si en el futuro se requieren permisos granulares por recurso
 *    (ej: "compras:read", "compras:write"), migrar a una tabla
 *    separada `usuario_permiso`. Por ahora, el array es suficiente.
 *
 * DECISIÓN DE DISEÑO: asociacion_id en usuarios.
 *
 * ✅ Correcto: el usuario pertenece a una asociación. Esto permite
 *    que el mismo email exista en dos asociaciones distintas
 *    (índice UNIQUE sobre email + asociacion_id).
 *    La cédula también va SOLO aquí — en ProductorEntity no se
 *    duplica (ver comentario en esa entidad).
 */
@Entity('usuario')
// Email único POR ASOCIACIÓN (no global) → soporta multi-tenant
@Index('UQ_usuario_email_asociacion', ['email', 'asociacion_id'], {
  unique: true,
})
// Cédula única POR ASOCIACIÓN (solo si tiene valor)
@Index('UQ_usuario_cedula_asociacion', ['cedula', 'asociacion_id'], {
  unique: true,
  where: '"cedula" IS NOT NULL',
})
export class Usuario {
  @PrimaryGeneratedColumn('increment')
  id_usuario: number;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'varchar', length: 100 })
  apellido: string;

  @Column({ type: 'varchar', length: 150 })
  email: string;

  /**
   * @Exclude() impide que el password se serialice en respuestas HTTP
   * cuando el controller usa ClassSerializerInterceptor.
   * En los servicios donde se necesita comparar el hash,
   * se accede directamente a la propiedad del objeto en memoria.
   */
  @Exclude()
  @Column({ type: 'varchar', length: 255 })
  password: string;

  /** Solo en usuarios — NO en productores */
  @Column({ type: 'varchar', length: 20, nullable: true })
  telefono: string | null;

  /** Solo en usuarios — elimina la duplicación con productores */
  @Column({ type: 'varchar', length: 20, nullable: true })
  cedula: string | null;

  @Column({
    type: 'enum',
    enum: TipoUsuario,
    default: TipoUsuario.PRODUCTOR,
  })
  tipo_usuario: TipoUsuario;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @CreateDateColumn({ name: 'fecha_registro' })
  fecha_registro: Date;

  /**
   * Permisos como array de strings PostgreSQL.
   * Se asignan por defecto según tipo_usuario en UsersService.
   */
  @Column('text', { array: true, default: '{}' })
  permisos: string[];

  @Column({ type: 'varchar', nullable: true })
  foto_perfil: string | null;

  // ── MULTI-TENANT ──────────────────────────────────────────────────────────
  @Column({ name: 'asociacion_id' })
  asociacion_id: number;

  @ManyToOne(() => Asociacion, { eager: false, nullable: false })
  @JoinColumn({ name: 'asociacion_id' })
  asociacion: Asociacion;

  // ── Relación inversa (opcional, lazy si se necesita) ──────────────────────
  // Si se requiere acceder a productor desde usuario, descomentar:
  // @OneToOne(() => Productor, (p) => p.usuario)
  // productor: Productor;
}
