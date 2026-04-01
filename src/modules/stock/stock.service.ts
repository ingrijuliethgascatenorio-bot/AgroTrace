import {
  Injectable,
  BadRequestException,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Stock } from './stock.entity';
import { StockMovimiento } from './stock-movimiento.entity';

@Injectable()
export class StockService {
  constructor(
    @InjectRepository(Stock)
    private readonly stockRepo: Repository<Stock>,
    @InjectRepository(StockMovimiento)
    private readonly movRepo: Repository<StockMovimiento>,
    private readonly dataSource: DataSource,
  ) {}

  // ── Obtener stock de un producto ──────────────────────────────────────
  async getStockProducto(id_producto: number): Promise<Stock | null> {
    return this.stockRepo.findOne({ where: { id_producto } });
  }

  // ── Listar todo el stock (con nombre del producto) ────────────────────
  async listarStock(): Promise<any[]> {
    const rows: any[] = await this.dataSource.query(`
      SELECT
        s.id_stock,
        s.id_producto,
        p.nombre         AS producto,
        p.unidad_medida  AS unidad,
        s.kilos_disponibles,
        s.kilos_acumulados,
        s.ultima_actualizacion
      FROM stock s
      INNER JOIN producto p ON p.id_producto = s.id_producto
      ORDER BY p.nombre
    `);
    return rows.map(r => ({
      ...r,
      kilos_disponibles: Number(r.kilos_disponibles),
      kilos_acumulados:  Number(r.kilos_acumulados),
    }));
  }

  // ── Entrada de stock (al cerrar ruta) ─────────────────────────────────
  async entradaStock(
    id_producto: number,
    kilos: number,
    id_ruta: number,
    descripcion?: string,
  ): Promise<Stock> {
    return this.dataSource.transaction(async (manager) => {
      // Buscar o crear fila de stock
      let stock = await manager.findOne(Stock, { where: { id_producto } });
      if (!stock) {
        stock = manager.create(Stock, {
          id_producto,
          kilos_disponibles: 0,
          kilos_acumulados: 0,
        });
      }
      stock.kilos_disponibles = Number(stock.kilos_disponibles) + kilos;
      stock.kilos_acumulados  = Number(stock.kilos_acumulados)  + kilos;
      await manager.save(Stock, stock);

      // Registrar movimiento
      const mov = manager.create(StockMovimiento, {
        id_producto,
        tipo: 'ENTRADA',
        kilos,
        referencia_id:   id_ruta,
        referencia_tipo: 'RUTA',
        descripcion: descripcion || `Cierre de Ruta #${id_ruta} — ${kilos} kg`,
      });
      await manager.save(StockMovimiento, mov);

      return stock;
    });
  }

  // ── Salida de stock (al registrar venta) ──────────────────────────────
  async salidaStock(
    id_producto: number,
    kilos: number,
    id_venta: number,
    descripcion?: string,
  ): Promise<Stock> {
    // Validacion de kilos solicitados
    if (!kilos || kilos <= 0) {
      throw new BadRequestException('La cantidad de kilos debe ser mayor que cero.');
    }

    return this.dataSource.transaction(async (manager) => {
      const stock = await manager.findOne(Stock, { where: { id_producto } });

      // Sin stock registrado = sin stock disponible
      if (!stock) {
        throw new BadRequestException('No hay stock disponible');
      }

      const disponibles = Math.max(0, Number(stock.kilos_disponibles));

      // DOBLE PROTECCION: stock === 0 o stock < cantidad
      if (disponibles <= 0) {
        throw new BadRequestException('No hay stock disponible');
      }
      if (disponibles < kilos) {
        throw new BadRequestException(
          `No hay stock disponible. Stock actual: ${disponibles.toFixed(2)} kg — Solicitado: ${kilos.toFixed(2)} kg.`,
        );
      }

      // Calculo seguro: nunca negativo
      const nuevo = parseFloat((disponibles - kilos).toFixed(2));
      if (nuevo < 0) {
        throw new BadRequestException('No hay stock disponible');
      }

      stock.kilos_disponibles = nuevo;
      await manager.save(Stock, stock);

      const mov = manager.create(StockMovimiento, {
        id_producto,
        tipo: 'SALIDA',
        kilos,
        referencia_id:   id_venta,
        referencia_tipo: 'VENTA',
        descripcion: descripcion || `Venta #${id_venta} — ${kilos} kg`,
      });
      await manager.save(StockMovimiento, mov);

      return stock;
    });
  }

  // ── Historial de movimientos ──────────────────────────────────────────
  async listarMovimientos(id_producto?: number, tipo?: string): Promise<any[]> {
    const where: string[] = [];
    if (id_producto) where.push(`m.id_producto = ${Number(id_producto)}`);
    if (tipo && ['ENTRADA','SALIDA'].includes(tipo.toUpperCase()))
      where.push(`m.tipo = '${tipo.toUpperCase()}'`);
    const whereStr = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const rows: any[] = await this.dataSource.query(`
      SELECT
        m.id_movimiento,
        m.tipo,
        m.kilos,
        m.referencia_id,
        m.referencia_tipo,
        m.descripcion,
        m.fecha,
        p.nombre AS producto
      FROM stock_movimiento m
      INNER JOIN producto p ON p.id_producto = m.id_producto
      ${whereStr}
      ORDER BY m.fecha DESC
      LIMIT 200
    `);
    return rows.map(r => ({ ...r, kilos: Number(r.kilos) }));
  }
}