import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum EstadoRuta {
  ABIERTA = 'ABIERTA',
  CERRADA = 'CERRADA',
}

@Entity('ruta')
export class Ruta {
  @PrimaryGeneratedColumn()
  id_ruta: number;

  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  fecha: string;

  @Column({ type: 'varchar', length: 20, default: EstadoRuta.ABIERTA })
  estado: string;

  /** Flete total de la ruta (se ingresa al cerrar) */
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    default: null,
  })
  flete: number | null;

  /** Suma de kilos de todas las entregas (calculada al cerrar) */
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    default: null,
  })
  total_kilos: number | null;

  /** Captura del precio_base_kg al momento del cierre */
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    default: null,
  })
  precio_base_kg_snapshot: number | null;

  /**
   * Precio final calculado al cerrar:
   * P_f = P_b - (P_b * 0.035) - (flete / total_kilos)
   */
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    default: null,
  })
  precio_final_kg: number | null;

  /** Producto principal de la ruta */
  @Column({ nullable: true, default: null })
  id_producto: number | null;

  /** Operario que realizó la ruta (id_usuario del operario logueado) */
  @Column({ nullable: true, default: null })
  id_operario: number | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  // Nota: NO se declara @OneToMany hacia Entrega para evitar dependencia circular.
  // Las entregas de una ruta se consultan via entregaRepo.find({ where: { ruta_id } })
}
