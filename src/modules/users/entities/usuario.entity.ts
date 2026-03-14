import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
} from 'typeorm';

@Entity('usuario')
export class Usuario {
    @PrimaryGeneratedColumn('increment')
    id_usuario: number;

    @Column({ type: 'varchar', length: 100 })
    nombre: string;

    @Column({ type: 'varchar', length: 100 })
    apellido: string;

    @Column({ type: 'varchar', length: 150, unique: true })
    email: string;

    @Column({ type: 'varchar', length: 255 })
    password: string;

    @Column({ type: 'varchar', length: 20, nullable: true })
    telefono: string | null;

  @Column({ type: 'varchar', length: 50, default: 'PRODUCTOR' })
tipo_usuario: 'ADMIN' | 'VENDEDOR' | 'PRODUCTOR';

    @Column({ type: 'varchar', nullable: true })
    cedula: string | null;

    @Column({ type: 'boolean', default: true })
    activo: boolean;

    @CreateDateColumn()
    fecha_registro: Date;

    @Column('text', { array: true, default: '{}' })
    permisos: string[];

    @Column({ type: 'varchar', nullable: true })
    foto_perfil: string | null;
}