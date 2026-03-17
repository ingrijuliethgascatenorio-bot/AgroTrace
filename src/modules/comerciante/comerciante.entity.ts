import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

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

  @Column({ default: true })
  activo: boolean;
}
