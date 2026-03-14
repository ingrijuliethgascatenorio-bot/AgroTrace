import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Usuario } from '../users/entities/usuario.entity';

@Entity()
export class Productor {

    @PrimaryGeneratedColumn()
    id_productor: number;

   /* @Column()
    nombre: string;*/

    @Column({ nullable: true })
    cedula: string;

    @Column({ nullable: true })
    telefono?: string;

    @Column({ nullable: true })
    finca: string;

    @Column({ nullable: true })
    ubicacion: string;

    @Column({ default: 'ACTIVO' })
    estado: string;

    @Column({ type: 'text', nullable: true })
    codigo_qr?: string;

    // ← Nueva relación
    @Column({ nullable: true })
    id_usuario: number;

    @ManyToOne(() => Usuario, { nullable: true, eager: false })
    @JoinColumn({ name: 'id_usuario' })
    usuario: Usuario;
}
