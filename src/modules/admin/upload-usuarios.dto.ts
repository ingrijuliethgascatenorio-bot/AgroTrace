/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { TipoUsuario } from '../users/entities/usuario.entity';

export class UsuarioCsvRowDto {
  @IsNotEmpty({ message: 'nombre es requerido' })
  @IsString()
  @MaxLength(100)
  @Matches(/^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s'-]+$/i, {
    message:
      'nombre solo puede contener letras, espacios, guiones y apóstrofes',
  })
  nombre: string;

  @IsNotEmpty({ message: 'apellido es requerido' })
  @IsString()
  @MaxLength(100)
  @Matches(/^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s'-]+$/i, {
    message:
      'apellido solo puede contener letras, espacios, guiones y apóstrofes',
  })
  apellido: string;

  @IsEmail({}, { message: 'email inválido' })
  email: string;

  @IsNotEmpty({ message: 'password es requerido' })
  @IsString()
  @MinLength(6, { message: 'password debe tener mínimo 6 caracteres' })
  password: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Matches(/^[0-9+\s()-]*$/, {
    message:
      'telefono solo puede contener números, +, espacios, paréntesis y guiones',
  })
  telefono?: string;

  @IsNotEmpty({ message: 'cedula es requerida' })
  @IsString()
  @MaxLength(20)
  @Matches(/^\d+$/, { message: 'cedula solo puede contener números' })
  @Transform(({ value }) => (value ? String(value).replace(/\D/g, '') : value))
  cedula: string;

  @IsNotEmpty({ message: 'tipo_usuario es requerido' })
  @IsEnum(TipoUsuario, {
    message: 'tipo_usuario debe ser ADMIN, OPERARIO o PRODUCTOR',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toUpperCase().trim() : value,
  )
  tipo_usuario: TipoUsuario;
}

export interface UploadUsuariosResult {
  creados: number;
  errores: Array<{
    fila: number;
    datos: Partial<UsuarioCsvRowDto>;
    error: string;
  }>;
}
