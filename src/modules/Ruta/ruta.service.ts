/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ruta, EstadoRuta } from './ruta.entity';
import { Entrega } from '../entregas/entregas.entity';
import { Precio } from '../Precios/precios.entity';
import { StockService } from '../stock/stock.service';

@Injectable()
export class RutasService {
  private readonly MARGEN_ASOCIACION = 0.035; // 3.5%

  constructor(
    @InjectRepository(Ruta)
    private readonly rutaRepo: Repository<Ruta>,
    @InjectRepository(Entrega)
    private readonly entregaRepo: Repository<Entrega>,
    @InjectRepository(Precio)
    private readonly precioRepo: Repository<Precio>,
    private readonly stockService: StockService,
  ) {}

  // ── LISTAR ────────────────────────────────────────────────
  async listar(): Promise<any[]> {
    const rutas = await this.rutaRepo.find({
      order: { created_at: 'DESC' },
    });
    return Promise.all(rutas.map(r => this.enrichRuta(r)));
  }

  // ── OBTENER UNA ───────────────────────────────────────────
  async findOne(id: number): Promise<any> {
    const ruta = await this.rutaRepo.findOne({ where: { id_ruta: id } });
    if (!ruta) throw new NotFoundException(`Ruta #${id} no encontrada`);
    return this.enrichRuta(ruta);
  }

  // ── CREAR RUTA ────────────────────────────────────────────
  async crear(dto: {
    id_producto?: number;
    fecha?: string;
    id_usuario?: number;
  }): Promise<any> {

    let idOperario: number | null = null;

    if (dto.id_usuario) {
      const opRes = await this.rutaRepo.manager.query(
        `SELECT id_operario FROM operario WHERE id_usuario = ${Number(dto.id_usuario)} LIMIT 1`
      );

      idOperario = opRes?.[0]?.id_operario
        ? Number(opRes[0].id_operario)
        : Number(dto.id_usuario);
    }

    const ruta: Ruta = this.rutaRepo.create({
      fecha: dto.fecha || new Date().toISOString().split('T')[0],
      estado: EstadoRuta.ABIERTA,
      id_producto: dto.id_producto ?? null,
      id_operario: idOperario,
    });

    const rutaGuardada: Ruta = await this.rutaRepo.save(ruta);

    let entregas_vinculadas = 0;

    if (dto.id_usuario) {
      entregas_vinculadas = await this.vincularEntregasPendientes(
        rutaGuardada.id_ruta,
        dto.id_usuario
      );
    }

    return {
      ...(await this.enrichRuta(rutaGuardada)),
      entregas_vinculadas,
    };
  }

  // ── VINCULAR ENTREGAS PENDIENTES ──────────────────────────
  async vincularEntregasPendientes(idRuta: number, idUsuario: number): Promise<number> {
    const uid = Number(idUsuario);

    const opRes = await this.rutaRepo.manager.query(
      `SELECT id_operario FROM operario WHERE id_usuario = ${uid} LIMIT 1`
    );

    const idOperario = opRes?.[0]?.id_operario
      ? Number(opRes[0].id_operario)
      : uid;

    const result = await this.rutaRepo.manager.query(`
      UPDATE entrega
      SET ruta_id = ${Number(idRuta)},
          estado_liquidacion = 'PENDIENTE_LIQUIDACION'
      WHERE ruta_id IS NULL
        AND (id_operario = ${idOperario} OR id_operario = ${uid})
    `);

    return result?.[1] ?? 0;
  }

  // ── CERRAR RUTA ───────────────────────────────────────────
  async cerrarRuta(id: number, dto: { flete: number }): Promise<any> {
    const ruta = await this.rutaRepo.findOne({ where: { id_ruta: id } });

    if (!ruta) throw new NotFoundException(`Ruta #${id} no encontrada`);
    if (ruta.estado === EstadoRuta.CERRADA) {
      throw new BadRequestException('La ruta ya está cerrada');
    }

    const flete = Number(dto.flete);
    if (!flete || flete <= 0) {
      throw new BadRequestException('El flete debe ser mayor que cero');
    }

    const entregasRaw: any[] = await this.entregaRepo.manager.query(
      `SELECT id_entrega, id_productor, id_producto, peso_kg FROM entrega WHERE ruta_id = ${Number(id)}`
    );

    if (!entregasRaw.length) {
      throw new BadRequestException('La ruta no tiene entregas registradas');
    }

    const total_kilos = entregasRaw.reduce(
      (sum: number, e: any) => sum + Number(e.peso_kg), 0,
    );

    if (total_kilos <= 0) {
      throw new BadRequestException('El total de kilos de la ruta es cero');
    }

    const id_producto = Number(ruta.id_producto ?? entregasRaw[0]?.id_producto ?? 0);

    if (!id_producto) {
      throw new BadRequestException('No se pudo determinar el producto de la ruta');
    }

    const precioRows: any[] = await this.rutaRepo.manager.query(
      `SELECT precio_base_kg FROM precios WHERE id_producto = ${id_producto} AND activo IS NOT FALSE ORDER BY fecha DESC LIMIT 1`
    );

    if (!precioRows.length) {
      const anyPrecio: any[] = await this.rutaRepo.manager.query(
        `SELECT precio_base_kg FROM precios WHERE id_producto = ${id_producto} ORDER BY fecha DESC LIMIT 1`
      );

      if (anyPrecio.length) {
        precioRows.push(anyPrecio[0]);
      } else {
        throw new BadRequestException(
          `No hay precio registrado para el producto #${id_producto}`,
        );
      }
    }

    const precio_base_kg = Number(precioRows[0].precio_base_kg);

    const costo_transporte_kg = flete / total_kilos;
    const precio_sin_transporte = precio_base_kg - costo_transporte_kg;
    const descuento_asociacion = precio_sin_transporte * this.MARGEN_ASOCIACION;

    const precio_final_kg = parseFloat(
      (precio_sin_transporte - descuento_asociacion).toFixed(2),
    );

    if (precio_final_kg <= 0) {
      throw new BadRequestException('El precio final no es válido');
    }

    await this.entregaRepo.manager.query(`
      UPDATE entrega
      SET precio_unitario = ${precio_final_kg},
          total = peso_kg * ${precio_final_kg},
          estado_liquidacion = 'LIQUIDADO'
      WHERE ruta_id = ${Number(id)}
    `);

    const entregasRawFull: any[] = await this.entregaRepo.manager.query(
      `SELECT * FROM entrega WHERE ruta_id = ${Number(id)}`
    );

    ruta.estado = EstadoRuta.CERRADA;
    ruta.flete = flete;
    ruta.total_kilos = total_kilos;
    ruta.precio_base_kg_snapshot = precio_base_kg;
    ruta.precio_final_kg = precio_final_kg;

    await this.rutaRepo.save(ruta);

    const kilosPorProducto = new Map<number, number>();

    for (const e of entregasRaw) {
      const pid = Number(e.id_producto);
      kilosPorProducto.set(pid, (kilosPorProducto.get(pid) || 0) + Number(e.peso_kg));
    }

    const stockActualizado: any[] = [];

    for (const [pid, kilos] of kilosPorProducto.entries()) {
      const s = await this.stockService.entradaStock(
        pid,
        kilos,
        id,
        `Cierre Ruta #${id} — ${kilos.toFixed(2)} kg`,
      );

      stockActualizado.push({
        id_producto: pid,
        kilos,
        stock_total: Number(s.kilos_disponibles),
      });
    }

    const entregasFull: any[] = await this.entregaRepo.manager.query(
      `SELECT * FROM entrega WHERE ruta_id = ${Number(id)}`
    );

    return {
      ruta: await this.enrichRuta(ruta),
      entregas_liquidadas: entregasFull.length,
      stock_actualizado: stockActualizado,
      calculo: {
        precio_base_kg,
        flete,
        total_kilos: parseFloat(total_kilos.toFixed(2)),
        costo_transporte_kg: parseFloat(costo_transporte_kg.toFixed(4)),
        precio_sin_transporte: parseFloat(precio_sin_transporte.toFixed(2)),
        descuento_asociacion: parseFloat(descuento_asociacion.toFixed(2)),
        precio_final_kg,
      },
    };
  }

  // ── GETENTREGAS ────────────────────────────────────────────
  async getEntregas(id: number): Promise<any[]> {
    const entregas: any[] = await this.entregaRepo.manager.query(`
      SELECT
        e.id_entrega,
        e.id_productor,
        e.id_producto,
        e.peso_kg,
        e.precio_unitario,
        e.total,
        e.fecha,
        COALESCE(e.estado_liquidacion, 'PENDIENTE_LIQUIDACION') AS estado_liquidacion,
        COALESCE(e.tipo_productor, 'AFILIADO') AS tipo_productor,
        e.nombre_productor_externo,
        e.nombre_producto_otro,
        u.nombre    AS nombre_usuario,
        u.apellido  AS apellido_usuario,
        pr.cedula   AS cedula_productor,
        prod.nombre AS nombre_producto
      FROM entrega e
      LEFT JOIN productor pr  ON pr.id_productor = e.id_productor
      LEFT JOIN usuario u     ON u.id_usuario    = pr.id_usuario
      LEFT JOIN producto prod ON prod.id_producto = e.id_producto
      WHERE e.ruta_id = ${Number(id)}
      ORDER BY e.id_productor ASC, e.fecha ASC
    `);

    return entregas.map(e => {
      // Nombre del productor: afiliado o externo
      const nombreProductor = (e.tipo_productor === 'EXTERNO')
        ? (e.nombre_productor_externo || 'Productor externo')
        : (e.nombre_usuario
            ? `${e.nombre_usuario} ${e.apellido_usuario || ''}`.trim()
            : `Productor #${e.id_productor}`);

      // Nombre del producto: catalogo o nombre libre
      const nombreProducto = e.nombre_producto_otro
        ? `${e.nombre_producto_otro} (otro)`
        : (e.nombre_producto || `Producto #${e.id_producto}`);

      return {
        id_entrega:         Number(e.id_entrega),
        id_productor:       e.id_productor ? Number(e.id_productor) : null,
        id_producto:        Number(e.id_producto),
        peso_kg:            Number(e.peso_kg),
        precio_unitario:    e.precio_unitario != null ? Number(e.precio_unitario) : null,
        total:              e.total != null ? Number(e.total) : null,
        fecha:              e.fecha,
        estado_liquidacion: e.estado_liquidacion || 'PENDIENTE_LIQUIDACION',
        tipo_productor:     e.tipo_productor || 'AFILIADO',
        nombre_productor:   nombreProductor,
        cedula_productor:   e.cedula_productor || '',
        nombre_producto:    nombreProducto,
      };
    });
  }

  // ── HELPER ────────────────────────────────────────────────
  private async enrichRuta(ruta: Ruta): Promise<any> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const countRes = await this.entregaRepo.manager.query(
      `SELECT COUNT(*) AS total FROM entrega WHERE ruta_id = ${Number(ruta.id_ruta)}`
    );

    return {
      id_ruta: ruta.id_ruta,
      fecha: ruta.fecha,
      estado: ruta.estado,
      flete: ruta.flete,
      total_kilos: ruta.total_kilos,
      precio_base_kg_snapshot: ruta.precio_base_kg_snapshot,
      precio_final_kg: ruta.precio_final_kg,
      id_producto: ruta.id_producto,
      id_operario: ruta.id_operario,
      n_entregas: Number(countRes?.[0]?.total ?? 0),
      created_at: ruta.created_at,
    };
  }
}
