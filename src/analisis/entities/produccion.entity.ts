import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
@Entity('produccion')
export class Produccion {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  id_productor: number;
  @Column()
  fecha: Date;
  @Column()
  cantidad: number;
}
