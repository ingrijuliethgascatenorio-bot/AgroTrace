import {
  Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn,
} from 'typeorm';

/**
 * Una fila por producto — acumula el total de kilos disponibles.
 * Se incrementa al cerrar ruta, se decrementa al registrar venta.
 */
@Entity('stock')
export class Stock {
  @PrimaryGeneratedColumn({ name: 'id_stock' })
  id_stock: number;

  @Column({ name: 'id_producto', unique: true })
  id_producto: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  kilos_disponibles: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  kilos_acumulados: number; // total histórico de entradas

  @UpdateDateColumn({ name: 'ultima_actualizacion' })
  ultima_actualizacion: Date;
}
