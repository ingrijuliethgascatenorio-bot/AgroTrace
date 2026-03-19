import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity("entrega")
export class Entrega {
  @PrimaryGeneratedColumn()
  id_entrega: number;
  @Column()
  id_operario: number;
  @Column()
  id_productor: number;
  @Column()
  id_producto: number;
  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  peso_kg: number;
  @Column({ type: "int", default: 0 })
  cantidad_unidades: number;
  @Column({ type: "decimal", precision: 10, scale: 2 })
  precio_unitario: number;
  @Column({ type: "decimal", precision: 12, scale: 2 })
  total: number;
  @CreateDateColumn()
  fecha: Date;
}
