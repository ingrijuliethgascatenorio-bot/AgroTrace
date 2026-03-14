import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('producto')
export class Producto {
  @PrimaryGeneratedColumn({ name: 'id_producto' })
  id_producto: number;

  @Column()
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ nullable: true })
  unidad_medida: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'precio_base',
    default: 0,
  })
  precio_base: number;

  @Column({ default: true })
  disponible: boolean;
}
