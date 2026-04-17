/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario, TipoUsuario } from './entities/usuario.entity';
import { EditarUsuarioDto } from './usuario.dto';
import * as bcrypt from 'bcrypt';
import { Permission } from '../../common/enums/permissions.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Usuario)
    private usuariosRepository: Repository<Usuario>,
  ) {}

  async listarTodos(rol?: string) {
    const where: any = { activo: true };
    if (rol) where.tipo_usuario = rol.toUpperCase();

    const usuarios = await this.usuariosRepository.find({
      where,
      order: { fecha_registro: 'DESC' },
    });

    return usuarios.map(({ password, ...u }) => u);
  }

  async editar(
    id: number,
    dto: EditarUsuarioDto,
  ): Promise<Omit<Usuario, 'password'>> {
    const usuario = await this.usuariosRepository.findOne({
      where: { id_usuario: id, activo: true },
    });

    if (!usuario)
      throw new NotFoundException(`Usuario con ID ${id} no encontrado.`);

    if (dto.email && dto.email !== usuario.email) {
      const existe = await this.usuariosRepository.findOne({
        where: { email: dto.email },
      });
      if (existe)
        throw new ConflictException(`El email ${dto.email} ya está en uso.`);
    }

    Object.assign(usuario, dto);
    const guardado = await this.usuariosRepository.save(usuario);
    const { password, ...resultado } = guardado;
    return resultado;
  }

  async desactivar(id: number): Promise<{ mensaje: string }> {
    const usuario = await this.usuariosRepository.findOne({
      where: { id_usuario: id, activo: true },
    });

    if (!usuario)
      throw new NotFoundException(
        `Usuario con ID ${id} no encontrado o ya inactivo.`,
      );

    await this.usuariosRepository.update(id, { activo: false });
    return {
      mensaje: `Usuario ${usuario.nombre} ${usuario.apellido} desactivado correctamente.`,
    };
  }

  // ── FIX: firma actualizada — acepta cedula como 8vo parámetro ─────────────
  // FIX: tipo_usuario usa TipoUsuario enum correctamente
  async crearUsuario(
    nombre: string,
    apellido: string,
    email: string,
    passwordPlano: string,
    telefono: string | null,
    tipo_usuario: TipoUsuario, // ← enum, no string
    asociacionId: number,
    cedula?: string | null, // ← 8vo param (opcional)
  ): Promise<Usuario> {
    const usuarioExistente = await this.usuariosRepository.findOne({
      where: { email, asociacion_id: asociacionId },
    });
    if (usuarioExistente)
      throw new ConflictException(
        `El email ${email} ya está registrado en esta asociación.`,
      );

    // FIX: verificar cédula única si se proporciona
    if (cedula) {
      const cedulaExistente = await this.usuariosRepository.findOne({
        where: { cedula, asociacion_id: asociacionId },
      });
      if (cedulaExistente)
        throw new ConflictException(
          `La cédula ${cedula} ya está registrada en esta asociación.`,
        );
    }

    const passwordEncriptada = await bcrypt.hash(passwordPlano, 10);
    const permisos = this._obtenerPermisosPorDefecto(tipo_usuario);

    const nuevoUsuario = this.usuariosRepository.create({
      nombre,
      apellido,
      email,
      password: passwordEncriptada,
      telefono: telefono || null,
      cedula: cedula || null, // ← guardado en usuario
      tipo_usuario, // ← enum directo, sin cast
      permisos,
      activo: true,
      asociacion_id: asociacionId,
    });

    return this.usuariosRepository.save(nuevoUsuario);
  }

  async buscarPorEmailYAsociacion(
    email: string,
    asociacionId: number,
  ): Promise<Usuario | null> {
    return this.usuariosRepository.findOne({
      where: { email, asociacion_id: asociacionId },
    });
  }

  async buscarPorEmail(email: string): Promise<Usuario | null> {
    return this.usuariosRepository.findOne({ where: { email } });
  }

  async buscarPorId(id: number): Promise<Usuario | null> {
    return this.usuariosRepository.findOne({ where: { id_usuario: id } });
  }

  async verificarPassword(
    passwordPlana: string,
    passwordHasheada: string,
  ): Promise<boolean> {
    return bcrypt.compare(passwordPlana, passwordHasheada);
  }

  private _obtenerPermisosPorDefecto(tipo_usuario: TipoUsuario): string[] {
    switch (tipo_usuario) {
      case TipoUsuario.ADMIN:
        return Object.values(Permission);
      case TipoUsuario.OPERARIO:
        return [Permission.DASHBOARD, Permission.VENTAS];
      case TipoUsuario.PRODUCTOR:
        return [Permission.COMPRAS, Permission.PRODUCTORES];
      default:
        return [];
    }
  }
}
