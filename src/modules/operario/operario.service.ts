/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// src/modules/operario/operario.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { Entrega } from '../entregas/entregas.entity';
import { Venta } from '../ventas/ventas.entity';
import { DetalleVenta } from '../ventas/detalle_venta.entity';
import { Productor } from '../productor/productores.entity';
import { Usuario } from '../users/entities/usuario.entity';
import { Producto } from '../productos/producto.entity';
import { Comerciante } from '../comerciante/comerciante.entity';
import { StockService } from '../stock/stock.service';
import { Operario } from './operario.entity';
// ✅ FIX TIMEZONE: importar utilidades de fecha con zona horaria Colombia
import {
  fechaHoyColombia,
  generarNumeroFactura,
} from '../../common/utils/fecha.util';

@Injectable()
export class OperarioService {
  constructor(
    @InjectRepository(Entrega) private entregaRepo: Repository<Entrega>,
    @InjectRepository(Venta) private ventaRepo: Repository<Venta>,
    @InjectRepository(DetalleVenta)
    private detalleRepo: Repository<DetalleVenta>,
    @InjectRepository(Productor) private productorRepo: Repository<Productor>,
    @InjectRepository(Usuario) private usuarioRepo: Repository<Usuario>,
    @InjectRepository(Producto) private productoRepo: Repository<Producto>,
    @InjectRepository(Comerciante)
    private comercianteRepo: Repository<Comerciante>,
    private readonly stockService: StockService,
    @InjectRepository(Operario)
    private operarioRepo: Repository<Operario>,
  ) {}

  // ── Perfil ────────────────────────────────────────────────────────────────
  async getPerfil(idUsuario: number): Promise<any> {
    const u = await this.usuarioRepo.findOne({
      where: { id_usuario: idUsuario },
    });
    if (!u) throw new NotFoundException('Usuario no encontrado');
    const { password: _, ...perfil } = u;
    return perfil;
  }

  async updatePerfil(idUsuario: number, body: any): Promise<any> {
    const u = await this.usuarioRepo.findOne({
      where: { id_usuario: idUsuario },
    });
    if (!u) throw new NotFoundException('Usuario no encontrado');
    if (body.nombre) u.nombre = body.nombre;
    if (body.apellido) u.apellido = body.apellido;
    if (body.telefono) u.telefono = body.telefono;
    if (body.contrasena) u.password = await bcrypt.hash(body.contrasena, 10);
    await this.usuarioRepo.save(u);
    const { password: _, ...perfil } = u;
    return perfil;
  }

  // ── Buscar productor por cédula (QR) ─────────────────────────────────────
  async getProductorByCedula(cedula: string): Promise<any> {
    const cedulaLimpia = cedula.trim().replace(/\D/g, '');

    let p = await this.productorRepo
      .createQueryBuilder('p')
      .innerJoinAndSelect('p.usuario', 'u')
      .where('u.cedula = :cedula', { cedula: cedula.trim() })
      .getOne();

    if (!p && cedulaLimpia) {
      const todos = await this.productorRepo.find({ relations: ['usuario'] });
      p =
        todos.find(
          (prod) =>
            (prod.usuario?.cedula || '').replace(/\D/g, '') === cedulaLimpia,
        ) ?? null;
    }

    if (!p)
      throw new NotFoundException(
        `Productor no encontrado con cedula: ${cedula}`,
      );

    return {
      id_productor: p.id_productor,
      cedula: p.usuario?.cedula ?? '',
      finca: p.finca,
      ubicacion: p.ubicacion,
      nombre: p.usuario?.nombre ?? '',
      apellido: p.usuario?.apellido ?? '',
    };
  }

  // ── Buscar productores por texto ──────────────────────────────────────────
  async buscarProductores(q: string): Promise<any[]> {
    if (!q || q.trim().length < 2) return [];

    const lista = await this.productorRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.usuario', 'u')
      .where('u.cedula ILIKE :q OR u.nombre ILIKE :q OR u.apellido ILIKE :q', {
        q: `%${q}%`,
      })
      .andWhere("p.estado = 'ACTIVO'")
      .limit(10)
      .getMany();

    return lista.map((p) => ({
      id_productor: p.id_productor,
      cedula: p.usuario?.cedula ?? '',
      nombre: p.usuario?.nombre ?? '',
      apellido: p.usuario?.apellido ?? '',
      finca: p.finca ?? '',
    }));
  }

  // ── Registrar entrega (compra al productor) ───────────────────────────────
  async registrarEntregaFrontend(idUsuario: number, dto: any): Promise<any> {
    const operario = await this.operarioRepo.findOne({
      where: { id_usuario: idUsuario },
    });
    if (!operario) throw new NotFoundException('Operario no encontrado');

    const idOperario = operario.id_operario;
    const peso = Number(dto.peso_kg ?? 0);
    const ruta_id = dto.ruta_id ? Number(dto.ruta_id) : null;

    if (peso <= 0)
      throw new BadRequestException('El peso debe ser mayor que cero');

    const tipoProductor = (dto.tipo_productor || 'AFILIADO').toUpperCase();
    let idProductor: number | null = null;
    let nombreExterno: string | null = null;
    let telefonoExterno: string | null = null;

    if (tipoProductor === 'EXTERNO') {
      if (!dto.nombre_productor_externo?.trim())
        throw new BadRequestException(
          'El nombre del productor externo es obligatorio',
        );
      nombreExterno = dto.nombre_productor_externo.trim();
      telefonoExterno = dto.telefono_productor_externo?.trim() || null;
    } else {
      const cedulaLimpia = (dto.cedula_productor || '')
        .trim()
        .replace(/\D/g, '');

      let productor = await this.productorRepo
        .createQueryBuilder('p')
        .innerJoinAndSelect('p.usuario', 'u')
        .where('u.cedula = :cedula', {
          cedula: (dto.cedula_productor || '').trim(),
        })
        .getOne();

      if (!productor && cedulaLimpia) {
        const todos = await this.productorRepo.find({ relations: ['usuario'] });
        productor =
          todos.find(
            (p) =>
              (p.usuario?.cedula || '').replace(/\D/g, '') === cedulaLimpia,
          ) ?? null;
      }

      if (!productor)
        throw new BadRequestException(
          `No se encontró productor con cédula: ${dto.cedula_productor}`,
        );
      idProductor = productor.id_productor;
    }

    const esOtroProducto =
      dto.id_producto === 'otro' || dto.id_producto === 0 || !dto.id_producto;
    let idProducto = 0;
    let nombreProductoOtro: string | null = null;

    if (esOtroProducto) {
      if (!dto.nombre_producto_otro?.trim())
        throw new BadRequestException(
          'Debes indicar el nombre del producto cuando seleccionas "Otro producto"',
        );
      nombreProductoOtro = dto.nombre_producto_otro.trim();
    } else {
      idProducto = Number(dto.id_producto);
    }

    let precio_unitario: number | null = null;
    let total: number | null = null;
    let estado_liquidacion = 'PENDIENTE_LIQUIDACION';

    if (!ruta_id) {
      let precio = Number(dto.precio_unitario ?? 0);
      if (precio > 0 && tipoProductor === 'EXTERNO') precio -= 100;
      precio_unitario = precio > 0 ? precio : null;
      total = precio_unitario != null ? peso * precio_unitario : null;
      estado_liquidacion =
        precio_unitario != null ? 'LIQUIDADO' : 'PENDIENTE_LIQUIDACION';
    }

    // La entidad usa @CreateDateColumn() para `fecha` — PostgreSQL la guarda en UTC
    // pero la columna es timestamptz, así que se almacena correctamente.
    // Para mostrarla en el frontend, el JS del cliente ya usa parseFechaLocal().
    const entrega = this.entregaRepo.create({
      id_operario: idOperario,
      tipo_productor: tipoProductor,
      id_productor: idProductor,
      nombre_productor_externo: nombreExterno,
      telefono_productor_externo: telefonoExterno,
      id_producto: idProducto,
      nombre_producto_otro: nombreProductoOtro,
      peso_kg: peso,
      cantidad_unidades: 0,
      precio_unitario,
      total,
      ruta_id,
      estado_liquidacion,
      estado_pago: 'PENDIENTE',
      comprobante_pago: null,
      fecha_pago: null,
    } as any);

    const guardada = await this.entregaRepo.save(entrega);

    return {
      ...guardada,
      mensaje: ruta_id
        ? `Compra registrada y vinculada a Ruta #${ruta_id}. Precio pendiente de liquidación.`
        : `Compra registrada: ${peso} kg.`,
    };
  }

  async editarEntrega(id: number, dto: any): Promise<Entrega> {
    const entrega = await this.entregaRepo.findOne({
      where: { id_entrega: id },
    });
    if (!entrega) throw new NotFoundException('Entrega no encontrada');
    if (dto.peso_kg) entrega.peso_kg = Number(dto.peso_kg);
    if (dto.producto_id) entrega.id_producto = dto.producto_id;
    if (dto.cantidad) entrega.cantidad_unidades = dto.cantidad;
    entrega.total =
      Number(entrega.peso_kg) * Number(entrega.precio_unitario ?? 0);
    return this.entregaRepo.save(entrega);
  }

  // ── Registrar venta ───────────────────────────────────────────────────────
  async registrarVentaFrontend(idUsuario: number, dto: any): Promise<Venta> {
    const idComerciante = Number(dto.id_comerciante ?? 0) || null;

    const operario = await this.operarioRepo.findOne({
      where: { id_usuario: idUsuario },
    });
    if (!operario) throw new NotFoundException('Operario no encontrado');

    const idOperario = operario.id_operario;

    let nombreCliente = (dto.cliente || '').trim();

    // Obtener nombre del comerciante desde BD si hay id_comerciante
    if (idComerciante) {
      const comerciante = await this.comercianteRepo.findOne({
        where: { id_comerciante: idComerciante },
      });
      if (comerciante) {
        if (!nombreCliente) nombreCliente = comerciante.nombre;
      }
    }

    // ✅ FIX TIMEZONE: usar fecha Colombia — no UTC
    const fechaVenta = fechaHoyColombia(); // 'YYYY-MM-DD' en hora Bogotá
    const numero_factura = generarNumeroFactura(); // 'FV-YYYYMMDD-XXXX' en hora Bogotá

    const detallesDto: any[] = Array.isArray(dto.detalles)
      ? dto.detalles
      : [
          {
            id_producto: dto.producto_id,
            cantidad: Number(dto.cantidad ?? 0),
            precio_unitario: dto.precio_unitario,
          },
        ];

    // Validar stock antes de guardar
    for (const d of detallesDto) {
      const kilos = Number(d.cantidad ?? d.cantidad_kg ?? 0);
      const id_prod = Number(d.id_producto);
      if (kilos <= 0) continue;

      const stockInfo = await this.stockService.getStockProducto(id_prod);
      const disponible = Math.max(0, Number(stockInfo?.kilos_disponibles ?? 0));

      if (disponible <= 0 || disponible < kilos) {
        const prod = await this.productoRepo.findOne({
          where: { id_producto: id_prod },
        });
        throw new BadRequestException(
          `No hay stock disponible${prod ? ' para ' + prod.nombre : ''}. ` +
            `Disponible: ${disponible.toFixed(2)} kg — Solicitado: ${kilos.toFixed(2)} kg.`,
        );
      }
    }

    const ventaGuardada: Venta = await this.ventaRepo.save(
      Object.assign(new Venta(), {
        id_operario: idOperario,
        id_comerciante: idComerciante,
        fecha_venta: fechaVenta,
        total: 0,
        estado: 'pendiente',
        cliente: nombreCliente || 'Sin comerciante',
        numero_factura,
      }),
    );

    let totalVenta = 0;

    for (const d of detallesDto) {
      const cantidad = Number(d.cantidad ?? d.cantidad_kg ?? 0);
      const precio_unitario = Number(d.precio_unitario ?? 0);
      const subtotal = cantidad * precio_unitario;
      totalVenta += subtotal;

      const detalle = this.detalleRepo.create({
        id_venta: ventaGuardada.id_venta,
        id_producto: d.id_producto,
        cantidad,
        precio_unitario,
        subtotal,
      });
      await this.detalleRepo.save(detalle);

      try {
        await this.stockService.salidaStock(
          Number(d.id_producto),
          cantidad,
          ventaGuardada.id_venta,
          `Venta #${ventaGuardada.id_venta} — ${cantidad} kg`,
        );
      } catch (stockErr) {
        await this.ventaRepo.delete({ id_venta: ventaGuardada.id_venta });
        throw stockErr;
      }
    }

    await this.ventaRepo.update(ventaGuardada.id_venta, { total: totalVenta });
    ventaGuardada.total = totalVenta;

    // ── El correo NO se envía aquí. ──────────────────────────────────────────
    // El operario decide desde el modal de factura en el frontend si quiere
    // enviar o no. El envío se hace vía PATCH /api/ventas/:id/estado con
    // { estado: "COMPLETADA", email_factura: "correo@..." }
    // ────────────────────────────────────────────────────────────────────────

    return ventaGuardada;
  }

  // ── Historial plano (SQL directo) ─────────────────────────────────────────
  async historialPlano(idUsuario: number, params: any): Promise<any[]> {
    const operario = await this.operarioRepo.findOne({
      where: { id_usuario: idUsuario },
    });
    if (!operario) throw new NotFoundException('Operario no encontrado');

    const uid = operario.id_operario;

    // ✅ FIX TIMEZONE: AT TIME ZONE convierte el timestamp UTC almacenado
    // por @CreateDateColumn a hora Colombia antes de extraer la fecha.
    // Sin esto, una entrega a las 9pm Colombia (= 2am UTC del día siguiente)
    // aparecería con fecha del día siguiente.
    const entregas: any[] = await this.entregaRepo.manager.query(
      `
      SELECT
        e.id_entrega,
        e.id_productor,
        e.id_producto,
        e.tipo_productor,
        e.nombre_productor_externo,
        e.telefono_productor_externo,
        e.nombre_producto_otro,
        e.peso_kg,
        e.precio_unitario,
        e.total,
        (e.fecha AT TIME ZONE 'America/Bogota')::date AS fecha,
        e.ruta_id,
        COALESCE(e.estado_liquidacion, 'PENDIENTE_LIQUIDACION') AS estado_liquidacion,
        COALESCE(e.estado_pago, 'PENDIENTE')                    AS estado_pago,
        u.nombre    AS nombre_productor_raw,
        u.apellido  AS apellido_productor,
        u.cedula    AS cedula_productor,
        prod.finca  AS finca,
        producto.nombre AS nombre_producto
      FROM entrega e
      LEFT JOIN productor prod ON prod.id_productor = e.id_productor
      LEFT JOIN usuario   u    ON u.id_usuario = prod.id_usuario
      LEFT JOIN producto       ON producto.id_producto = e.id_producto
      WHERE e.id_operario = $1
      ORDER BY fecha DESC, e.id_entrega DESC
    `,
      [uid],
    );

    const ventas: any[] = await this.entregaRepo.manager.query(
      `
      SELECT
        v.id_venta,
        v.fecha_venta AS fecha,
        v.total,
        v.cliente,
        dv.cantidad,
        dv.precio_unitario AS precio_venta,
        p.nombre AS nombre_producto
      FROM venta v
      LEFT JOIN detalle_venta dv ON dv.id_venta = v.id_venta
      LEFT JOIN producto p       ON p.id_producto = dv.id_producto
      WHERE v.id_operario = $1
      ORDER BY v.fecha_venta DESC, v.id_venta DESC
    `,
      [uid],
    );

    const filasEntregas = entregas.map((e) => ({
      id: Number(e.id_entrega),
      id_entrega: Number(e.id_entrega),
      fecha: e.fecha,
      peso_kg: Number(e.peso_kg ?? 0),
      precio_unitario:
        e.precio_unitario != null ? Number(e.precio_unitario) : null,
      total: e.total != null ? Number(e.total) : null,
      id_producto: Number(e.id_producto),
      id_productor: e.id_productor ? Number(e.id_productor) : null,
      ruta_id: e.ruta_id ? Number(e.ruta_id) : null,
      estado_liquidacion: e.estado_liquidacion || 'PENDIENTE_LIQUIDACION',
      tipo_productor: e.tipo_productor || 'AFILIADO',
      nombre_producto: e.nombre_producto_otro
        ? `${e.nombre_producto_otro} (otro)`
        : e.nombre_producto || `Producto #${e.id_producto}`,
      nombre_productor:
        e.tipo_productor === 'EXTERNO'
          ? `${e.nombre_productor_externo || 'Externo'} (externo)`
          : `${e.nombre_productor_raw || ''} ${e.apellido_productor || ''}`.trim() ||
            `Productor #${e.id_productor}`,
      cedula_productor: e.cedula_productor || '',
      tipo: 'COMPRA',
    }));

    const vistos = new Set<number>();
    const filasEntregasUnicas = filasEntregas.filter((e) => {
      if (vistos.has(e.id_entrega)) return false;
      vistos.add(e.id_entrega);
      return true;
    });

    const filasVentas = ventas.map((v) => ({
      id: Number(v.id_venta),
      id_venta: Number(v.id_venta),
      fecha: v.fecha,
      total: v.total != null ? Number(v.total) : null,
      cliente: v.cliente || '',
      cantidad: Number(v.cantidad ?? 0),
      precio_venta: v.precio_venta != null ? Number(v.precio_venta) : null,
      nombre_producto: v.nombre_producto || `Producto #${v.id_venta}`,
      tipo: 'VENTA',
    }));

    // ✅ FIX SORT: normalizar antes de comparar.
    // filasEntregas tienen fecha 'YYYY-MM-DD' (ya convertida por AT TIME ZONE en SQL).
    // filasVentas tienen fecha_venta 'YYYY-MM-DD' (type:'date' en la entidad).
    // new Date('YYYY-MM-DD') en JS la interpreta como UTC midnight, lo que en
    // Colombia (UTC-5) sería las 7pm del día anterior → comparación incorrecta.
    // Solución: parsear cada parte manualmente para construir fecha local.
    const parsearFechaLocal = (f: string | null | undefined): number => {
      if (!f) return 0;
      const s = String(f).substring(0, 10); // tomar solo YYYY-MM-DD
      const [y, m, d] = s.split('-').map(Number);
      if (y && m && d) return new Date(y, m - 1, d).getTime();
      return new Date(f).getTime();
    };

    return [...filasEntregasUnicas, ...filasVentas].sort(
      (a, b) => parsearFechaLocal(b.fecha) - parsearFechaLocal(a.fecha),
    );
  }
}
