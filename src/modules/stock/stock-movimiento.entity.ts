import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
} from 'typeorm';

export type TipoMovimiento = 'ENTRADA' | 'SALIDA';

/**
 * Registro de cada entrada (cierre de ruta) y salida (venta) del stock.
 */
@Entity('stock_movimiento')
export class StockMovimiento {
  @PrimaryGeneratedColumn({ name: 'id_movimiento' })
  id_movimiento: number;

  @Column({ name: 'id_producto' })
  id_producto: number;

  @Column({ type: 'varchar', length: 10 })
  tipo: TipoMovimiento; // 'ENTRADA' | 'SALIDA'

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  kilos: number;

  /** id_ruta para entradas, id_venta para salidas */
  @Column({ name: 'referencia_id', nullable: true })
  referencia_id: number | null;

  @Column({ name: 'referencia_tipo', length: 20, nullable: true })
  referencia_tipo: string | null; // 'RUTA' | 'VENTA'

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  @CreateDateColumn({ name: 'fecha' })
  fecha: Date;
}
