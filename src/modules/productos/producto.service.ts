import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Producto } from './producto.entity';
import {
  CreateProductoDto,
  UpdateProductoDto,
  UpdateEstadoProductoDto,
} from './producto.dto';

@Injectable()
export class ProductosService {
  constructor(
    @InjectRepository(Producto)
    private readonly productoRepo: Repository<Producto>,
  ) {}

  findAll(): Promise<Producto[]> {
    return this.productoRepo.find({ order: { id_producto: 'DESC' } });
  }

  findDisponibles(): Promise<Producto[]> {
    return this.productoRepo.find({ where: { disponible: true } });
  }

  getCategorias(): Promise<{ categoria: string }[]> {
    return this.productoRepo
      .createQueryBuilder('p')
      .select('DISTINCT p.categoria', 'categoria')
      .where('p.categoria IS NOT NULL')
      .getRawMany();
  }

  async findOne(id: number): Promise<Producto> {
    const p = await this.productoRepo.findOne({ where: { id_producto: id } });
    if (!p) throw new NotFoundException(`Producto #${id} no encontrado`);
    return p;
  }

  async create(dto: CreateProductoDto): Promise<Producto> {
    const p = this.productoRepo.create(dto);
    return this.productoRepo.save(p);
  }

  async update(id: number, dto: UpdateProductoDto): Promise<Producto> {
    const p = await this.findOne(id);
    Object.assign(p, dto);
    return this.productoRepo.save(p);
  }

  async updateEstado(id: number, dto: UpdateEstadoProductoDto): Promise<Producto> {
    await this.findOne(id);
    await this.productoRepo.update(id, { disponible: dto.disponible });
    return this.findOne(id);
  }

  async remove(id: number): Promise<{ mensaje: string }> {
    await this.findOne(id);
    await this.productoRepo.delete(id);
    return { mensaje: `Producto #${id} eliminado.` };
  }
}
