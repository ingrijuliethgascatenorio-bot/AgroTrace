import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Comerciante } from './comerciante.entity';
import { CrearComercianteDto, EditarComercianteDto } from './comerciante.dto';

@Injectable()
export class ComerciantesService {
  constructor(
    @InjectRepository(Comerciante)
    private comercianteRepo: Repository<Comerciante>,
  ) {}

  listar(): Promise<Comerciante[]> {
    return this.comercianteRepo.find({
      order: { id_comerciante: 'DESC' },
    });
  }

  async obtener(id: number): Promise<Comerciante> {
    const comerciante = await this.comercianteRepo.findOne({
      where: { id_comerciante: id },
    });

    if (!comerciante) {
      throw new NotFoundException('Comerciante no encontrado');
    }

    return comerciante;
  }

  crear(dto: CrearComercianteDto): Promise<Comerciante> {
    const comerciante = this.comercianteRepo.create(dto);
    return this.comercianteRepo.save(comerciante);
  }

  async editar(id: number, dto: EditarComercianteDto) {
    const comerciante = await this.obtener(id);

    Object.assign(comerciante, dto);

    return this.comercianteRepo.save(comerciante);
  }

  async desactivar(id: number) {
    const comerciante = await this.obtener(id);

    comerciante.activo = false;

    return this.comercianteRepo.save(comerciante);
  }

  async activar(id: number) {
    const comerciante = await this.obtener(id);

    comerciante.activo = true;

    return this.comercianteRepo.save(comerciante);
  }
}
