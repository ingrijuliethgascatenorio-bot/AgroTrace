import { IsString, IsNotEmpty, IsOptional, IsEmail } from 'class-validator';

export class CrearProductorDto {
  // Campos de tabla productor
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  cedula: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsString()
  @IsOptional()
  finca?: string;

  @IsString()
  @IsOptional()
  ubicacion?: string;

  // Campos para crear el usuario asociado
  @IsString()
  @IsNotEmpty()
  apellido: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class EditarProductorDto {
  @IsString() @IsOptional() nombre?: string;
  @IsString() @IsOptional() cedula?: string;
  @IsString() @IsOptional() telefono?: string;
  @IsString() @IsOptional() finca?: string;
  @IsString() @IsOptional() ubicacion?: string;
}

export class CambiarEstadoDto {
  @IsString()
  @IsNotEmpty()
  estado: 'ACTIVO' | 'INACTIVO';
}
