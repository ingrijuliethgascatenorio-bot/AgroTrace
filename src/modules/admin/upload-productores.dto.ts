// src/modules/admin/dto/upload-productores.dto.ts
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
 * DTO que valida cada fila del CSV.
 * Se usa en el servicio después de parsear el CSV.
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
  @Transform(({ value }) => String(value).replace(/\D/g, '')) // limpia puntos y espacios
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
 * Resultado devuelto al cliente.
 */
export interface UploadProductoresResult {
  creados: number;
  errores: Array<{
    fila: number;
    datos: Partial<ProductorCsvRowDto>;
    error: string;
  }>;
}
