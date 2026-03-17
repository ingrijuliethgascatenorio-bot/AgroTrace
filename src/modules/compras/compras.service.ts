import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Compra } from './compras.entity';

@Injectable()
export class ComprasService {
  constructor(
    @InjectRepository(Compra)
    private readonly compraRepo: Repository<Compra>,
  ) {}

  // Listar todas las compras activas
  findAll(): Promise<Compra[]> {
    return this.compraRepo.find({
      where: { activo: true }, // solo compras activas
      relations: [
        'productor',
        'productor.usuario',
        'detalles',
        'detalles.producto',
      ],
      order: { id_compra: 'DESC' },
    });
  }

  // Buscar una compra por ID
  async findOne(id: number): Promise<Compra> {
    const compra = await this.compraRepo.findOne({
      where: { id_compra: id },
      relations: [
        'productor',
        'productor.usuario',
        'detalles',
        'detalles.producto',
      ],
    });
    if (!compra) throw new NotFoundException(`Compra #${id} no encontrada`);
    return compra;
  }

  // Soft delete (desactivar)
  async desactivar(id: number): Promise<Compra> {
    const compra = await this.compraRepo.findOne({ where: { id_compra: id } });
    if (!compra) throw new NotFoundException('Compra no encontrada');
    compra.activo = false;
    return this.compraRepo.save(compra);
  }

  // Restaurar compra (activar)
  async activar(id: number): Promise<Compra> {
    const compra = await this.compraRepo.findOne({ where: { id_compra: id } });
    if (!compra) throw new NotFoundException('Compra no encontrada');
    compra.activo = true;
    return this.compraRepo.save(compra);
  }
}
