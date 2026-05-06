// src/modules/admin/upload-productores.dto.ts
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * DTO que valida cada fila del CSV de creación.
 */
export class ProductorCsvRowDto {
  @IsNotEmpty({ message: 'nombre es requerido' })
  @IsString()
  @MaxLength(100)
  nombre: string;

  @IsNotEmpty({ message: 'apellido es requerido' })
  @IsString()
  @MaxLength(100)
  apellido: string;

  @IsEmail({}, { message: 'email inválido' })
  email: string;

  @IsNotEmpty({ message: 'password es requerido' })
  @IsString()
  @MinLength(6, { message: 'password debe tener mínimo 6 caracteres' })
  password: string;

  @IsNotEmpty({ message: 'cedula es requerida' })
  @IsString()
  @MaxLength(20)
  @Transform(({ value }) => String(value).replace(/\D/g, ''))
  cedula: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  telefono?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  finca?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  ubicacion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  tipo_certificacion?: string;
}

/**
 * Resultado devuelto al cliente tras la creación masiva.
 */
export interface UploadProductoresResult {
  creados: number;
  errores: Array<{
    fila: number;
    datos: Partial<ProductorCsvRowDto>;
    error: string;
  }>;
}

/**
 * DTO que valida cada fila del CSV de actualización (solo finca/ubicación).
 */
export class ProductorUpdateCsvRowDto {
  @IsNotEmpty({ message: 'cedula es requerida' })
  @IsString()
  @MaxLength(20)
  @Transform(({ value }) => String(value).replace(/\D/g, ''))
  cedula: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  finca?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  ubicacion?: string;
}

/**
 * Resultado devuelto al cliente tras la actualización masiva.
 */
export interface UploadProductoresUpdateResult {
  actualizados: number;
  errores: Array<{
    fila: number;
    cedula: string;
    error: string;
  }>;
}
