import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, ILike } from 'typeorm';
import { Compra } from './compras.entity';

@Injectable()
export class ComprasService {
  constructor(
    @InjectRepository(Compra)
    private readonly compraRepo: Repository<Compra>,
  ) {}

  findAll(): Promise<Compra[]> {
    return this.compraRepo.find({
      relations: [
        'productor',
        'productor.usuario',
        'detalles',
        'detalles.producto',
      ],
      order: { id_compra: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Compra> {
    const c = await this.compraRepo.findOne({
      where: { id_compra: id },
      relations: [
        'productor',
        'productor.usuario',
        'detalles',
        'detalles.producto',
      ],
    });
    if (!c) throw new NotFoundException(`Compra #${id} no encontrada`);
    return c;
  }
}
