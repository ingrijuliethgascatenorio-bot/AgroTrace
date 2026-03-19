import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Entrega } from './entrega.entity';
import { Venta } from '../ventas/entities/venta.entity';
import { DetalleVenta } from '../ventas/entities/detalle_venta.entity';
import { Productor } from '../productor/productores.entity';
import { Usuario } from '../users/entities/usuario.entity';
import { Producto } from '../productos/producto.entity';
import { In } from 'typeorm';
import * as bcrypt from 'bcrypt';


@Injectable()
export class OperarioService {
  constructor(
    @InjectRepository(Entrega) private entregaRepo: Repository<Entrega>,
    @InjectRepository(Venta) private ventaRepo: Repository<Venta>,
    @InjectRepository(DetalleVenta) private detalleRepo: Repository<DetalleVenta>,
    @InjectRepository(Productor) private productorRepo: Repository<Productor>,
    @InjectRepository(Usuario) private usuarioRepo: Repository<Usuario>,
    @InjectRepository(Producto) private productoRepo: Repository<Producto>,
  ) { }

  async getPerfil(idUsuario: number): Promise<any> {
    const u = await this.usuarioRepo.findOne({ where: { id_usuario: idUsuario } });
    if (!u) throw new NotFoundException('Usuario no encontrado');
    const { password: _, ...perfil } = u;
    return perfil;
  }

  async updatePerfil(idUsuario: number, body: any): Promise<any> {
    const u = await this.usuarioRepo.findOne({ where: { id_usuario: idUsuario } });
    if (!u) throw new NotFoundException('Usuario no encontrado');
    if (body.nombre) u.nombre = body.nombre;
    if (body.apellido) u.apellido = body.apellido;
    if (body.telefono) u.telefono = body.telefono;
    if (body.contrasena) u.password = await bcrypt.hash(body.contrasena, 10);
    await this.usuarioRepo.save(u);
    const { password: _, ...perfil } = u;
    return perfil;
  }

  async getProductorByCedula(cedula: string): Promise<Productor> {
    const p = await this.productorRepo.findOne({ where: { cedula } });
    if (!p) throw new NotFoundException('Productor no encontrado');
    return p;
  }

  async buscarProductores(q: string): Promise<Productor[]> {
    return this.productorRepo.createQueryBuilder('p')
      .where('p.nombre ILIKE :q OR p.cedula ILIKE :q', { q: `%${q}%` })
      .limit(10)
      .getMany();
  }

  async registrarEntregaFrontend(idOperario: number, dto: any): Promise<Entrega> {
    const productor = await this.productorRepo.findOne({ where: { cedula: dto.cedula_productor } });
    const precio = dto.precio_unitario ?? 0;
    const total = dto.peso_kg * precio;
    const entrega = this.entregaRepo.create({
      id_operario: idOperario,
      id_productor: productor?.id ?? 0,
      id_producto: dto.id_producto,
      peso_kg: dto.peso_kg,
      cantidad_unidades: 0,        // ✅ siempre 0, no depende del frontend
      precio_unitario: precio,
      total,
    });
    return this.entregaRepo.save(entrega);
  }

  async editarEntrega(id: number, dto: any): Promise<Entrega> {
    const entrega = await this.entregaRepo.findOne({ where: { id_entrega: id } });
    if (!entrega) throw new NotFoundException('Entrega no encontrada');
    if (dto.peso_kg) entrega.peso_kg = dto.peso_kg;
    if (dto.producto_id) entrega.id_producto = dto.producto_id;
    if (dto.cantidad) entrega.cantidad_unidades = dto.cantidad;
    entrega.total = entrega.peso_kg * entrega.precio_unitario;
    return this.entregaRepo.save(entrega);
  }

  async registrarVentaFrontend(idOperario: number, dto: any): Promise<Venta> {
    const venta = this.ventaRepo.create({
      id_operario: idOperario,
      cliente: dto.nombre || 'Cliente general',
      fecha_venta: new Date().toISOString().split('T')[0],
      total: 0,
      estado: 'pendiente',
    });
    const ventaGuardada = await this.ventaRepo.save(venta);
    const detalle = this.detalleRepo.create({
      id_venta: ventaGuardada.id_venta,
      id_producto: dto.producto_id,
      cantidad_kg: dto.cantidad,
      cantidad_unidades: 0,
      precio_unitario: dto.precio_unitario ?? 0,
      subtotal: dto.cantidad * (dto.precio_unitario ?? 0),
    });
    await this.detalleRepo.save(detalle);
    ventaGuardada.total = detalle.subtotal;
    await this.ventaRepo.save(ventaGuardada);
    return this.ventaRepo.findOne({ where: { id_venta: ventaGuardada.id_venta } }) as Promise<Venta>;
  }

async historialPlano(idOperario: number, params: any): Promise<any[]> {
  const entregas = await this.entregaRepo.find({
    where: { id_operario: idOperario },
    order: { fecha: 'DESC' },
  });

  const ventas = await this.ventaRepo.find({
    where: { id_operario: idOperario },
    order: { fecha_venta: 'DESC' },
  });

  // ✅ Detalles de ventas con producto eager
  const ventaIds = ventas.map(v => v.id_venta).filter(id => id > 0);
  const detalles = ventaIds.length
    ? await this.detalleRepo.find({ where: { id_venta: In(ventaIds) } })
    : [];

  console.log('detalles encontrados:', detalles.length);
  console.log('primer detalle:', detalles[0]);

  // Mapa ventaId → primer detalle
  const detallesMap = new Map<number, typeof detalles[0]>();
  detalles.forEach(d => {
    if (!detallesMap.has(d.id_venta)) detallesMap.set(d.id_venta, d);
  });

  // Para las compras, buscar productores y productos manualmente
  const productoIds  = [...new Set(entregas.map(e => e.id_producto).filter(id => id > 0))];
  const productorIds = [...new Set(entregas.map(e => e.id_productor).filter(id => id > 0))];

  const [productosData, productoresData] = await Promise.all([
    productoIds.length  ? this.productoRepo.findBy({ id_producto: In(productoIds) }) : [],
    productorIds.length ? this.productorRepo.findBy({ id: In(productorIds) })         : [],
  ]);

  const productosMap   = new Map(productosData.map(p => [p.id_producto, p] as [number, typeof p]));
  const productoresMap = new Map(productoresData.map(p => [p.id, p]        as [number, typeof p]));

  const filasEntregas = entregas.map(e => ({
    id:               e.id_entrega,
    id_entrega:       e.id_entrega,
    fecha:            e.fecha,
    peso_kg:          e.peso_kg,
    precio_unitario:  e.precio_unitario,
    total:            e.total,
    id_producto:      e.id_producto,
    id_productor:     e.id_productor,
    nombre_producto:  productosMap.get(e.id_producto)?.nombre    || (e.id_producto  > 0 ? `Prod. #${e.id_producto}`  : 'Sin producto'),
    nombre_productor: productoresMap.get(e.id_productor)?.nombre || (e.id_productor > 0 ? `Prod. #${e.id_productor}` : 'Sin productor'),
    cedula_productor: productoresMap.get(e.id_productor)?.cedula || '',
    tipo:             'COMPRA',
  }));

  const filasVentas = ventas.map(v => {
    const detalle = detallesMap.get(v.id_venta);
    return {
      id:              v.id_venta,
      id_venta:        v.id_venta,
      fecha:           v.fecha_venta,
      nombre:          v.cliente,
      total:           v.total,
      nombre_producto: detalle?.producto?.nombre || '—',  // ✅ eager
      cantidad_kg:     detalle ? Number(detalle.cantidad_kg || 0) : 0,
      tipo:            'VENTA',
    };
  });

  return [...filasEntregas, ...filasVentas].sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  );
}
}
