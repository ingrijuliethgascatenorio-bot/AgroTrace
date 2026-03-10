/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Produccion } from '../entities/produccion.entity';

@Injectable()
export class ProyeccionesService {
  constructor(
    @InjectRepository(Produccion)
    private readonly produccionRepository: Repository<Produccion>,
  ) {}

  /**
   * 2️ Proyección de producción (promedio últimas 5 entregas)
   */
  async obtenerProyeccion(idProductor: number) {
    const ultimas5 = await this.produccionRepository
      .createQueryBuilder('p')
      .select('p.cantidad', 'cantidad')
      .addSelect('p.unidad', 'unidad')
      .where('p.id_productor = :idProductor', { idProductor })
      .orderBy('p.fecha_produccion', 'DESC')
      .limit(5)
      .getRawMany();

    if (ultimas5.length < 3) {
      return {
        proyeccion: 0,
        unidad: 'kg',
        advertencia: 'Datos insuficientes para proyección (mínimo 3 registros)',
      };
    }

    const totalCantidad = ultimas5.reduce(
      (sum, item) => sum + parseFloat(item.cantidad),
      0,
    );
    const promedio = totalCantidad / ultimas5.length;

    return {
      proyeccion: promedio.toFixed(2),
      unidad: ultimas5[0].unidad,
      registros_analizados: ultimas5.length,
    };
  }

  /**
   * 5️⃣ Planificación de ruta (proyección total + estimación)
   */
  async planificarRuta(precio: number, capacidad: number) {
    if (!precio || precio <= 0) {
      throw new BadRequestException('El precio debe ser mayor a 0');
    }

    if (!capacidad || capacidad <= 0) {
      throw new BadRequestException('La capacidad debe ser mayor a 0');
    }

    // Obtener todos los productores únicos
    const productores = await this.produccionRepository
      .createQueryBuilder('p')
      .select('DISTINCT p.id_productor', 'id_productor')
      .getRawMany();

    let totalProyectado = 0;

    // Calcular proyección para cada productor
    for (const prod of productores) {
      const proyeccion = await this.obtenerProyeccion(prod.id_productor);

      const valor = Number(proyeccion.proyeccion);

      if (valor > 0 && !proyeccion.advertencia) {
        totalProyectado += valor;
      }
    }

    const totalEstimado = totalProyectado * precio;
    const superaCapacidad = totalProyectado > capacidad;

    return {
      total_proyectado: parseFloat(totalProyectado.toFixed(2)),
      total_estimado: parseFloat(totalEstimado.toFixed(2)),
      capacidad,
      supera_capacidad: superaCapacidad,
      alerta: superaCapacidad
        ? `⚠️ Se supera la capacidad en ${(totalProyectado - capacidad).toFixed(2)} kg`
        : '✅ Capacidad suficiente',
    };
  }
}
