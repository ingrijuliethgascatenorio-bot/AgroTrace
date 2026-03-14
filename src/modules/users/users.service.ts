import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from './entities/usuario.entity';
import { EditarUsuarioDto } from './usuario.dto';
import * as bcrypt from 'bcrypt';
import { Permission } from '../../common/enums/permissions.enum';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(Usuario)
        private usuariosRepository: Repository<Usuario>,
    ) {}

    // ← Solo activos, con cédula, filtro por rol opcional
    async listarTodos(rol?: string) {
        const where: any = { activo: true };
        if (rol) where.tipo_usuario = rol.toUpperCase();

        const usuarios = await this.usuariosRepository.find({
            where,
            order: { fecha_registro: 'DESC' },
        });

        return usuarios.map(({ password, ...u }) => u);
    }

    async editar(id: number, dto: EditarUsuarioDto): Promise<Omit<Usuario, 'password'>> {
        const usuario = await this.usuariosRepository.findOne({
            where: { id_usuario: id, activo: true },
        });

        if (!usuario) throw new NotFoundException(`Usuario con ID ${id} no encontrado.`);

        // Verificar email único si se está cambiando
        if (dto.email && dto.email !== usuario.email) {
            const existe = await this.usuariosRepository.findOne({
                where: { email: dto.email },
            });
            if (existe) throw new ConflictException(`El email ${dto.email} ya está en uso.`);
        }

        Object.assign(usuario, dto);
        const guardado = await this.usuariosRepository.save(usuario);
        const { password, ...resultado } = guardado;
        return resultado;
    }

    // Soft delete — solo marca activo = false
    async desactivar(id: number): Promise<{ mensaje: string }> {
        const usuario = await this.usuariosRepository.findOne({
            where: { id_usuario: id, activo: true },
        });

        if (!usuario) throw new NotFoundException(`Usuario con ID ${id} no encontrado o ya inactivo.`);

        await this.usuariosRepository.update(id, { activo: false });
        return { mensaje: `Usuario ${usuario.nombre} ${usuario.apellido} desactivado correctamente.` };
    }

    // ── Métodos existentes sin cambios ──────────────────────────────
    private obtenerPermisosPorDefecto(tipo_usuario: 'ADMIN' | 'VENDEDOR' | 'PRODUCTOR'): string[] {
        switch (tipo_usuario) {
            case 'ADMIN':    return Object.values(Permission);
            case 'VENDEDOR': return [Permission.DASHBOARD, Permission.VENTAS];
            case 'PRODUCTOR': return [Permission.COMPRAS, Permission.PRODUCTORES];
            default: return [];
        }
    }

    async crearUsuario(
        nombre: string, apellido: string, email: string,
        passwordPlano: string, telefono: string | null,
        tipo_usuario: 'ADMIN' | 'VENDEDOR' | 'PRODUCTOR',
    ): Promise<Usuario> {
        const usuarioExistente = await this.usuariosRepository.findOne({ where: { email } });
        if (usuarioExistente) throw new ConflictException(`El email ${email} ya está registrado.`);

        const passwordEncriptada = await bcrypt.hash(passwordPlano, 10);
        const permisos = this.obtenerPermisosPorDefecto(tipo_usuario);

        const nuevoUsuario = this.usuariosRepository.create({
            nombre, apellido, email,
            password: passwordEncriptada,
            telefono: telefono || null,
            tipo_usuario, permisos, activo: true,
        });
        return this.usuariosRepository.save(nuevoUsuario);
    }

    async buscarPorEmail(email: string): Promise<Usuario | null> {
        return this.usuariosRepository.findOne({ where: { email } });
    }

    async buscarPorId(id: number): Promise<Usuario | null> {
        return this.usuariosRepository.findOne({ where: { id_usuario: id } });
    }

    async verificarPassword(passwordPlana: string, passwordHasheada: string): Promise<boolean> {
        return bcrypt.compare(passwordPlana, passwordHasheada);
    }
}