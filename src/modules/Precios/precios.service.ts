import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Precio } from './precios.entity';
import {
  CrearPrecioDto,
  ActualizarEstadoPrecioDto,
  PrecioCalculadoResponse,
} from './precio.dto';

@Injectable()
export class PreciosService {
  private readonly MARGEN_ASOCIACION = 0.035; // 3.5%

  constructor(
    @InjectRepository(Precio)
    private readonly precioRepo: Repository<Precio>,
  ) {}

  // ─────────────────────────────────────────────
  // 🔥 CÁLCULO PRODUCTOR
  // ─────────────────────────────────────────────
  calcularPrecioProductor(
    precio_base_kg: number,
    precio_transporte: number,
    total_kilos: number,
  ) {
    if (total_kilos <= 0) {
      throw new BadRequestException('total_kilos debe ser mayor que cero');
    }

    const costo_transporte_kg = precio_transporte / total_kilos;
    const precio_base_neto = precio_base_kg - costo_transporte_kg;
    const precio_final_productor =
      precio_base_neto - precio_base_neto * this.MARGEN_ASOCIACION;

    return {
      costo_transporte_kg: parseFloat(costo_transporte_kg.toFixed(4)),
      precio_base_neto: parseFloat(precio_base_neto.toFixed(2)),
      precio_final_productor: parseFloat(precio_final_productor.toFixed(2)),
    };
  }

  // ─────────────────────────────────────────────
  // 🔵 PRECIO VENTA (COMERCIANTE)
  // ─────────────────────────────────────────────
  calcularPrecioVenta(precio_base_kg: number, comerciante: string): number {
    const esPrimo = (comerciante || '').trim().toUpperCase() === 'EL PRIMO';

    return esPrimo
      ? precio_base_kg
      : parseFloat((precio_base_kg + 100).toFixed(2));
  }

  // ─────────────────────────────────────────────
  // 🟢 CREAR PRECIO
  // ─────────────────────────────────────────────
  async crear(dto: CrearPrecioDto): Promise<PrecioCalculadoResponse> {
    await this.precioRepo.update(
      { id_producto: dto.id_producto, activo: true },
      { activo: false },
    );

    const calc = this.calcularPrecioProductor(
      dto.precio_base_kg,
      dto.precio_transporte,
      dto.total_kilos,
    );

    const resultado_1 = calc.costo_transporte_kg;
    const resultado_2 = calc.precio_base_neto;

    const entidad = this.precioRepo.create({
      id_producto: dto.id_producto,
      precio_base_kg: dto.precio_base_kg,
      precio_transporte: dto.precio_transporte,
      total_kilos: dto.total_kilos,
      costo_transporte_kg: calc.costo_transporte_kg,
      precio_final_kg: calc.precio_final_productor,
      margen_asociacion: this.MARGEN_ASOCIACION,
      activo: true,
    });

    const guardado = await this.precioRepo.save(entidad);

    return {
      id_precio: guardado.id_precio,
      id_producto: dto.id_producto,
      nombre_producto: guardado.producto?.nombre,

      precio_base_kg: dto.precio_base_kg,
      precio_transporte: dto.precio_transporte,
      total_kilos: dto.total_kilos,

      costo_transporte_kg: calc.costo_transporte_kg,
      resultado_1,
      resultado_2,

      precio_base_neto: calc.precio_base_neto,
      precio_final_kg: calc.precio_final_productor,

      margen_asociacion: this.MARGEN_ASOCIACION,
      comerciante: dto.comerciante,

      fecha: guardado.fecha,
      activo: guardado.activo,
    };
  }

  // ─────────────────────────────────────────────
  // 🟡 PREVISUALIZAR (SIN GUARDAR)
  // ─────────────────────────────────────────────
  previsualizarCalculo(dto: CrearPrecioDto): PrecioCalculadoResponse {
    const calc = this.calcularPrecioProductor(
      dto.precio_base_kg,
      dto.precio_transporte,
      dto.total_kilos,
    );

    const resultado_1 = calc.costo_transporte_kg;
    const resultado_2 = calc.precio_base_neto;

    return {
      id_precio: 0,
      id_producto: dto.id_producto,
      nombre_producto: '—',

      precio_base_kg: dto.precio_base_kg,
      precio_transporte: dto.precio_transporte,
      total_kilos: dto.total_kilos,

      costo_transporte_kg: calc.costo_transporte_kg,
      resultado_1,
      resultado_2,

      precio_base_neto: calc.precio_base_neto,
      precio_final_kg: calc.precio_final_productor,

      margen_asociacion: this.MARGEN_ASOCIACION,
      comerciante: dto.comerciante,

      fecha: new Date(),
      activo: true,
    };
  }

  // ─────────────────────────────────────────────
  // 📋 LISTAR TODOS (HISTORIAL ADMIN)
  // ─────────────────────────────────────────────
  async listar(): Promise<Precio[]> {
    return this.precioRepo.find({
      order: { fecha: 'DESC' },
    });
  }

  // ─────────────────────────────────────────────
  // 🔵 PRECIO ACTIVO (OPERARIO)
  // ─────────────────────────────────────────────
  async obtenerActual(id_producto?: number) {
    // Sin id_producto → devuelve TODOS los activos (para cargarPreciosActuales del operario)
    if (!id_producto) {
      const precios = await this.precioRepo.find({
        where: { activo: true },
        order: { fecha: 'DESC' },
      });
      return precios.map(p => ({
        id_producto:            p.id_producto,
        precio_base_kg:         Number(p.precio_base_kg),
        precio_final_productor: Number(p.precio_final_kg), // pago al productor (ya con descuentos)
      }));
    }

    // Con id_producto → devuelve el precio activo de ese producto
    const precio = await this.precioRepo.findOne({
      where: { id_producto, activo: true },
      order: { fecha: 'DESC' },
    });

    if (!precio) {
      throw new NotFoundException(
        `No hay precio activo para producto ${id_producto}. El admin debe registrar el precio semanal.`,
      );
    }

    return {
      id_producto:            precio.id_producto,
      precio_base_kg:         Number(precio.precio_base_kg),
      precio_final_productor: Number(precio.precio_final_kg), // pago al productor
    };
  }

  // ─────────────────────────────────────────────
  // 🟣 USADO EN ENTREGAS
  // ─────────────────────────────────────────────
  async obtenerPrecioFinalKg(id_producto: number) {
    const precio = await this.precioRepo.findOne({
      where: { id_producto, activo: true },
      order: { fecha: 'DESC' },
    });

    if (!precio) {
      throw new NotFoundException('No hay precio configurado');
    }

    // Retorna solo el número para que el controller pueda envolverlo correctamente
    return Number(precio.precio_final_kg);
  }

  // ─────────────────────────────────────────────
  // 📅 ALERTA SEMANAL
  // ─────────────────────────────────────────────
  async hayPrecioEstaSemana() {
    const ahora = new Date();
    const dia = ahora.getDay();

    const lunes = new Date(ahora);
    lunes.setDate(ahora.getDate() - ((dia + 6) % 7));
    lunes.setHours(0, 0, 0, 0);

    const domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 6);
    domingo.setHours(23, 59, 59, 999);

    const precio = await this.precioRepo.findOne({
      where: { fecha: Between(lunes, domingo) },
    });

    return {
      hay_precio: !!precio,
      ultimo: precio?.fecha,
    };
  }

  // ─────────────────────────────────────────────
  // 🔴 ACTIVAR / DESACTIVAR
  // ─────────────────────────────────────────────
  async actualizarEstado(id: number, dto: ActualizarEstadoPrecioDto) {
    const precio = await this.precioRepo.findOne({
      where: { id_precio: id },
    });

    if (!precio) {
      throw new NotFoundException(`Precio ${id} no encontrado`);
    }

    precio.activo = dto.activo;
    return this.precioRepo.save(precio);
  }
}
