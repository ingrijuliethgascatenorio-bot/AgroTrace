/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { Entrega } from '../entregas/entregas.entity';
import { Venta } from '../ventas/ventas.entity';
import { DetalleVenta } from '../ventas/detalle_venta.entity';
import { Productor } from '../productor/productores.entity';
import { Usuario } from '../users/entities/usuario.entity';
import { Producto } from '../productos/producto.entity';
import { StockService } from '../stock/stock.service';
import { EmailService } from '../email/email.service';

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
    private readonly stockService: StockService,
    private readonly emailService: EmailService,
  ) {}

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

  async getProductorByCedula(cedula: string): Promise<any> {
    // Limpiar: el QR codifica solo digitos, pero la BD puede tener
    // la cedula con puntos o espacios (ej: "1.234.567" o "1 234 567")
    // Buscar primero exacto, luego por digitos normalizados
    const cedulaLimpia = cedula.trim().replace(/\D/g, '');

    let p = await this.productorRepo.findOne({
      where: { cedula: cedula.trim() },
      relations: ['usuario'],
    });

    // Si no encontro con cedula exacta, buscar normalizando digitos
    if (!p && cedulaLimpia) {
      const todos = await this.productorRepo.find({ relations: ['usuario'] });
      p =
        todos.find(
          (prod) => (prod.cedula || '').replace(/\D/g, '') === cedulaLimpia,
        ) ?? null;
    }

    if (!p)
      throw new NotFoundException(
        `Productor no encontrado con cedula: ${cedula}`,
      );

    return {
      id_productor: p.id_productor,
      cedula: p.cedula,
      finca: p.finca,
      ubicacion: p.ubicacion,
      nombre: p.usuario?.nombre ?? '',
      apellido: p.usuario?.apellido ?? '',
    };
  }

  async buscarProductores(q: string): Promise<any[]> {
    if (!q || q.trim().length < 2) return [];
    const lista = await this.productorRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.usuario', 'u')
      .where('p.cedula ILIKE :q OR u.nombre ILIKE :q OR u.apellido ILIKE :q', {
        q: `%${q}%`,
      })
      .andWhere("p.estado = 'ACTIVO'")
      .limit(10)
      .getMany();
    return lista.map((p) => ({
      id_productor: p.id_productor,
      cedula: p.cedula,
      nombre: p.usuario?.nombre ?? '',
      apellido: p.usuario?.apellido ?? '',
      finca: p.finca ?? '',
    }));
  }

  async registrarEntregaFrontend(idUsuario: number, dto: any): Promise<any> {
    // Buscar el id_operario real en la tabla operario usando id_usuario del JWT
    const opRowEntrega = await this.entregaRepo.manager.query(
      `SELECT id_operario FROM operario WHERE id_usuario = ${Number(idUsuario)} LIMIT 1`,
    );
    if (!opRowEntrega?.[0]) {
      throw new BadRequestException(
        'El usuario no tiene un perfil de operario asignado. Verifica la tabla operario.',
      );
    }
    const idOperario = Number(opRowEntrega[0].id_operario);

    const peso = Number(dto.peso_kg ?? 0);
    const ruta_id = dto.ruta_id ? Number(dto.ruta_id) : null;

    if (peso <= 0)
      throw new BadRequestException('El peso debe ser mayor que cero');

    // ── Determinar tipo de productor ─────────────────────────────────────
    const tipoProductor = (dto.tipo_productor || 'AFILIADO').toUpperCase();
    let idProductor: number | null = null;
    let nombreExterno: string | null = null;
    let telefonoExterno: string | null = null;

    if (tipoProductor === 'EXTERNO') {
      if (!dto.nombre_productor_externo?.trim()) {
        throw new BadRequestException(
          'El nombre del productor externo es obligatorio',
        );
      }
      nombreExterno = dto.nombre_productor_externo.trim();
      telefonoExterno = dto.telefono_productor_externo?.trim() || null;
    } else {
      // Afiliado: buscar por cédula
      const cedulaLimpia = (dto.cedula_productor || '')
        .trim()
        .replace(/\D/g, '');
      let productor = await this.productorRepo.findOne({
        where: { cedula: dto.cedula_productor },
      });
      if (!productor && cedulaLimpia) {
        const todos = await this.productorRepo.find();
        productor =
          todos.find(
            (p) => (p.cedula || '').replace(/\D/g, '') === cedulaLimpia,
          ) ?? null;
      }
      if (!productor) {
        throw new BadRequestException(
          `No se encontro productor con cedula: ${dto.cedula_productor}`,
        );
      }
      idProductor = productor.id_productor;
    }

    // ── Determinar id_producto y nombre_otro ─────────────────────────────
    const esOtroProducto =
      dto.id_producto === 'otro' || dto.id_producto === 0 || !dto.id_producto;
    let idProducto: number = 0;
    let nombreProductoOtro: string | null = null;

    if (esOtroProducto) {
      if (!dto.nombre_producto_otro?.trim()) {
        throw new BadRequestException(
          'Debes indicar el nombre del producto cuando seleccionas "Otro producto"',
        );
      }
      nombreProductoOtro = dto.nombre_producto_otro.trim();
      idProducto = 0; // 0 = "otro" — sin FK a catálogo
    } else {
      idProducto = Number(dto.id_producto);
    }

    // ── Calcular precio ──────────────────────────────────────────────────
    // Con ruta_id → precio NULL (se calcula al cerrar ruta)
    // Sin ruta_id → usar precio del dto; si es externo restar 100
    let precio_unitario: number | null = null;
    let total: number | null = null;
    let estado_liquidacion = 'PENDIENTE_LIQUIDACION';

    if (!ruta_id) {
      let precio = Number(dto.precio_unitario ?? 0);
      if (precio > 0 && tipoProductor === 'EXTERNO') {
        precio = precio - 100; // Regla: externo paga $100/kg menos
      }
      precio_unitario = precio > 0 ? precio : null;
      total = precio_unitario != null ? peso * precio_unitario : null;
      estado_liquidacion =
        precio_unitario != null ? 'LIQUIDADO' : 'PENDIENTE_LIQUIDACION';
    }

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

    const guardada = (await this.entregaRepo.save(
      entrega,
    )) as unknown as Entrega;

    const nombreProductoDisplay = nombreProductoOtro
      ? `${nombreProductoOtro} (otro)`
      : `Producto #${idProducto}`;
    const nombreProductorDisplay =
      tipoProductor === 'EXTERNO'
        ? `${nombreExterno} (externo)`
        : `Productor #${idProductor}`;

    // ── ENVIAR FACTURA POR CORREO AL PRODUCTOR ───────────────────────────
    // Solo se envía si el productor es AFILIADO y tiene email registrado.
    // Si falla el correo, NO bloquea ni revierte la entrega guardada.
    try {
      const hoyEntrega = new Date();
      const fechaFormateada = hoyEntrega.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const numeroFactura = `COMP-${String(guardada.id_entrega).padStart(6, '0')}`;

      // Resolver email y nombre completo del productor afiliado
      let emailProductor = '';
      let nombreProductorCompleto = nombreProductorDisplay;

      if (tipoProductor === 'AFILIADO' && idProductor) {
        const productorConUsuario = await this.productorRepo.findOne({
          where: { id_productor: idProductor },
          relations: ['usuario'],
        });
        emailProductor = productorConUsuario?.usuario?.email ?? '';
        if (productorConUsuario?.usuario) {
          nombreProductorCompleto =
            `${productorConUsuario.usuario.nombre} ${productorConUsuario.usuario.apellido || ''}`.trim();
        }
      }

      // Resolver nombre del producto desde catálogo (si no es "otro")
      let nombreProductoFinal = nombreProductoOtro ?? '';
      if (!nombreProductoOtro && idProducto > 0) {
        const prod = await this.productoRepo.findOne({
          where: { id_producto: idProducto },
        });
        nombreProductoFinal = prod?.nombre ?? `Producto #${idProducto}`;
      }

      // Resolver nombre del operario para el pie de la factura
      const operario = await this.usuarioRepo.findOne({
        where: { id_usuario: idOperario },
      });
      const nombreOperario = operario
        ? `${operario.nombre} ${operario.apellido || ''}`.trim()
        : undefined;

      // Enviar sin await — el .catch() absorbe cualquier error silenciosamente
      this.emailService
        .enviarFactura({
          numero_factura: numeroFactura,
          fecha: fechaFormateada,
          nombre_cliente: nombreProductorCompleto,
          email_cliente: emailProductor, // si está vacío, EmailService lo ignora
          detalles: [
            {
              producto: nombreProductoFinal,
              cantidad_kg: peso,
              precio_kg: precio_unitario ?? 0,
              subtotal: total ?? 0,
            },
          ],
          total: total ?? 0,
          nombre_operario: nombreOperario,
        })
        .catch(() => {
          // Error de correo no debe afectar la respuesta al cliente
        });
    } catch {
      // Bloque try externo por si alguna consulta auxiliar falla inesperadamente
      // La entrega ya fue guardada, así que simplemente continuamos
    }
    // ────────────────────────────────────────────────────────────────────

    return {
      ...guardada,
      mensaje: ruta_id
        ? `Compra registrada: ${peso} kg de ${nombreProductoDisplay} — ${nombreProductorDisplay} — vinculada a Ruta #${ruta_id}. Precio pendiente de liquidación.`
        : `Compra registrada: ${peso} kg de ${nombreProductoDisplay} — ${nombreProductorDisplay}.`,
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
    entrega.total = Number(entrega.peso_kg) * Number(entrega.precio_unitario);
    return this.entregaRepo.save(entrega);
  }

  async registrarVentaFrontend(idUsuario: number, dto: any): Promise<Venta> {
    const idComerciante = Number(dto.id_comerciante ?? 0) || null;

    // Buscar el id_operario real en la tabla operario usando id_usuario del JWT
    const opRow = await this.ventaRepo.manager.query(
      `SELECT id_operario FROM operario WHERE id_usuario = ${Number(idUsuario)} LIMIT 1`,
    );
    if (!opRow?.[0]) {
      throw new BadRequestException(
        'El usuario no tiene un perfil de operario asignado. Verifica la tabla operario.',
      );
    }
    const idOperario = Number(opRow[0].id_operario);

    // Nombre y email del comerciante
    let nombreCliente = (dto.cliente || '').trim();
    let emailCliente = '';
    if (idComerciante) {
      // Buscar por id_comerciante (cuando el operario seleccionó del datalist)
      const rows = await this.ventaRepo.manager.query(
        `SELECT nombre, email FROM comerciante WHERE id_comerciante = ${Number(idComerciante)} LIMIT 1`,
      );
      if (rows?.[0]) {
        if (!nombreCliente) nombreCliente = rows[0].nombre || '';
        emailCliente = rows[0].email || '';
      }
    } else if (nombreCliente) {
      // Buscar por nombre cuando el operario escribió a mano sin seleccionar del datalist
      const rows = await this.ventaRepo.manager.query(
        `SELECT nombre, email FROM comerciante WHERE UPPER(nombre) = UPPER($1) LIMIT 1`,
        [nombreCliente],
      );
      if (rows?.[0]) {
        emailCliente = rows[0].email || '';
      }
    }

    // Generar numero_factura
    const hoy = new Date();
    const yyyymmdd =
      hoy.getFullYear().toString() +
      String(hoy.getMonth() + 1).padStart(2, '0') +
      String(hoy.getDate()).padStart(2, '0');
    const numero_factura = `FV-${yyyymmdd}-${Math.floor(Math.random() * 9000) + 1000}`;

    const detallesDto: any[] = Array.isArray(dto.detalles)
      ? dto.detalles
      : [
          {
            id_producto: dto.producto_id,
            cantidad: Number(dto.cantidad ?? 0),
            precio_unitario: dto.precio_unitario,
          },
        ];

    // ── VALIDACION DE STOCK ANTES DE GUARDAR (doble proteccion) ──────────
    // Si CUALQUIER producto no tiene stock suficiente → bloquear TODA la venta
    for (const d of detallesDto) {
      const kilos = Number(d.cantidad ?? d.cantidad_kg ?? 0);
      const id_prod = Number(d.id_producto);
      if (kilos <= 0) continue; // sin cantidad → no validar

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

    // Guardar venta solo si pasó todas las validaciones
    const venta = this.ventaRepo.create({
      id_operario: idOperario,
      id_comerciante: idComerciante,
      fecha_venta: hoy.toISOString().split('T')[0],
      total: 0,
      estado: 'pendiente',
      cliente: nombreCliente || 'Sin comerciante',
      numero_factura,
    });
    const ventaGuardada = await this.ventaRepo.save(venta);

    let totalVenta = 0;
    const facturaDetalles: any[] = [];

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

      // Descontar del stock (con transaccion interna)
      try {
        await this.stockService.salidaStock(
          Number(d.id_producto),
          cantidad,
          ventaGuardada.id_venta,
          `Venta #${ventaGuardada.id_venta} — ${cantidad} kg`,
        );
      } catch (stockErr) {
        // Rollback manual: eliminar venta si el stock falla
        await this.ventaRepo.delete({ id_venta: ventaGuardada.id_venta });
        throw stockErr;
      }

      const prod = await this.productoRepo.findOne({
        where: { id_producto: d.id_producto },
      });
      facturaDetalles.push({
        producto: prod?.nombre || `Producto #${d.id_producto}`,
        cantidad_kg: cantidad,
        precio_kg: precio_unitario,
        subtotal,
      });
    }

    ventaGuardada.total = totalVenta;
    await this.ventaRepo.save(ventaGuardada);

    // Enviar factura por correo (no bloquea si falla)
    const operario = await this.usuarioRepo.findOne({
      where: { id_usuario: idUsuario },
    });
    this.emailService
      .enviarFactura({
        numero_factura,
        fecha: hoy.toLocaleDateString('es-CO', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        nombre_cliente: nombreCliente || 'Sin comerciante',
        email_cliente: emailCliente,
        detalles: facturaDetalles,
        total: totalVenta,
        nombre_operario: operario
          ? `${operario.nombre} ${operario.apellido || ''}`.trim()
          : undefined,
      })
      .catch(() => {});

    return this.ventaRepo.findOne({
      where: { id_venta: ventaGuardada.id_venta },
      relations: ['detalles', 'detalles.producto'],
    }) as Promise<Venta>;
  }

  async historialPlano(idUsuario: number, params: any): Promise<any[]> {
    const uid = Number(idUsuario);

    // Obtener id_operario real desde tabla operario
    const opRes = await this.entregaRepo.manager.query(
      `SELECT id_operario FROM operario WHERE id_usuario = ${uid} LIMIT 1`,
    );
    const idOperario = opRes?.[0]?.id_operario
      ? Number(opRes[0].id_operario)
      : uid;

    // ── SQL directo para entregas — incluye TODOS los campos nuevos ──────
    // Busca por id_operario real Y por id_usuario como fallback
    const entregas: any[] = await this.entregaRepo.manager.query(`
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
        e.fecha,
        e.ruta_id,
        COALESCE(e.estado_liquidacion, 'PENDIENTE_LIQUIDACION') AS estado_liquidacion,
        COALESCE(e.estado_pago, 'PENDIENTE') AS estado_pago,
        pr.nombre    AS nombre_productor_raw,
        pr.apellido  AS apellido_productor,
        prod.cedula  AS cedula_productor,
        prod.finca   AS finca,
        producto.nombre AS nombre_producto
      FROM entrega e
      LEFT JOIN productor prod ON prod.id_productor = e.id_productor
      LEFT JOIN usuario pr     ON pr.id_usuario = prod.id_usuario
      LEFT JOIN producto       ON producto.id_producto = e.id_producto
      WHERE e.id_operario = ${idOperario}
         OR e.id_operario = ${uid}
      ORDER BY e.fecha DESC, e.id_entrega DESC
    `);

    // ── SQL directo para ventas ───────────────────────────────────────────
    const ventas: any[] = await this.entregaRepo.manager.query(`
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
      WHERE v.id_operario = ${idOperario}
         OR v.id_operario = ${uid}
      ORDER BY v.fecha_venta DESC, v.id_venta DESC
    `);

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
      // Nombre del producto: catálogo o "otro"
      nombre_producto: e.nombre_producto_otro
        ? `${e.nombre_producto_otro} (otro)`
        : e.nombre_producto || `Producto #${e.id_producto}`,
      // Nombre del productor: afiliado o externo
      nombre_productor:
        e.tipo_productor === 'EXTERNO'
          ? `${e.nombre_productor_externo || 'Externo'} (externo)`
          : `${e.nombre_productor_raw || ''} ${e.apellido_productor || ''}`.trim() ||
            `Productor #${e.id_productor}`,
      cedula_productor: e.cedula_productor || '',
      tipo: 'COMPRA',
    }));

    // Deduplicar (puede haber duplicados si id_operario = id_usuario coinciden)
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
      total: Number(v.total ?? 0),
      nombre_producto: v.nombre_producto || '—',
      cantidad_kg: Number(v.cantidad ?? 0),
      precio_unitario: Number(v.precio_venta ?? 0),
      cliente: v.cliente || '',
      tipo: 'VENTA',
    }));

    // Deduplicar ventas
    const vistosV = new Set<number>();
    const filasVentasUnicas = filasVentas.filter((v) => {
      if (vistosV.has(v.id_venta)) return false;
      vistosV.add(v.id_venta);
      return true;
    });

    return [...filasEntregasUnicas, ...filasVentasUnicas].sort(
      (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
    );
  }
}
