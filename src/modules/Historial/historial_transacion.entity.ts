import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
@Entity('historial_transaccion')
export class HistorialTransaccion {
  @PrimaryGeneratedColumn({ name: 'id_historial' })
  id_historial: number;

  @Column({ nullable: true, name: 'id_compra' })
  id_compra: number | null;

  @Column({ nullable: true, name: 'id_venta' })
  id_venta: number | null;

  @Column({ name: 'tipo_transaccion' })
  tipo_transaccion: string;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    name: 'fecha_transaccion',
  })
  fecha_transaccion: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  monto: number;

  @Column({ nullable: true })
  estado: string;
}
