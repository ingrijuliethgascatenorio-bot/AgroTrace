import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Venta } from './ventas.entity';

@Injectable()
export class VentasService {
  constructor(
    @InjectRepository(Venta)
    private readonly ventaRepo: Repository<Venta>,
  ) {}

  findAll(): Promise<Venta[]> {
    return this.ventaRepo.find({
      relations: ['detalles', 'detalles.producto', 'comerciante'],
      order: { id_venta: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Venta> {
    const v = await this.ventaRepo.findOne({
      where: { id_venta: id },
      relations: ['detalles', 'detalles.producto'],
    });
    if (!v) throw new NotFoundException(`Venta #${id} no encontrada`);
    return v;
  }
}
