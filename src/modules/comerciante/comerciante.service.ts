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

  /** Lista solo los comerciantes ACTIVOS del tenant — para el operario (select de ventas) */
  listar(asociacionId: number): Promise<Comerciante[]> {
    return this.comercianteRepo.find({
      where: { asociacion_id: asociacionId, activo: true },
      order: { nombre: 'ASC' },
    });
  }

  /** Lista activos e inactivos del tenant — para el panel admin */
  listarTodos(asociacionId: number): Promise<Comerciante[]> {
    return this.comercianteRepo.find({
      where: { asociacion_id: asociacionId },
      order: { nombre: 'ASC' },
    });
  }

  async obtener(id: number, asociacionId: number): Promise<Comerciante> {
    const comerciante = await this.comercianteRepo.findOne({
      where: { id_comerciante: id, asociacion_id: asociacionId },
    });

    if (!comerciante) {
      throw new NotFoundException('Comerciante no encontrado');
    }

    return comerciante;
  }

  crear(dto: CrearComercianteDto, asociacionId: number): Promise<Comerciante> {
    const comerciante = this.comercianteRepo.create({
      ...dto,
      asociacion_id: asociacionId,
    });
    return this.comercianteRepo.save(comerciante);
  }

  async editar(id: number, dto: EditarComercianteDto, asociacionId: number) {
    const comerciante = await this.obtener(id, asociacionId);
    Object.assign(comerciante, dto);
    return this.comercianteRepo.save(comerciante);
  }

  async desactivar(id: number, asociacionId: number) {
    const comerciante = await this.obtener(id, asociacionId);
    comerciante.activo = false;
    return this.comercianteRepo.save(comerciante);
  }

  async activar(id: number, asociacionId: number) {
    const comerciante = await this.obtener(id, asociacionId);
    comerciante.activo = true;
    return this.comercianteRepo.save(comerciante);
  }
}
