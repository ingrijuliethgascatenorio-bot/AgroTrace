// src/modules/operario/operario.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { Usuario } from '../users/entities/usuario.entity';

@Entity('operario')
export class Operario {
  @PrimaryGeneratedColumn()
  id_operario: number;

  // 🔗 Relación con usuario (LOGIN)
  @ManyToOne(() => Usuario, { eager: true })
  @JoinColumn({ name: 'id_usuario' })
  usuario: Usuario;

  @Column()
  id_usuario: number;
}
