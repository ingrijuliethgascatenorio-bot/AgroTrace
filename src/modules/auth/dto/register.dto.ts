import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  IsEnum,
  IsOptional,
} from 'class-validator';

export class RegisterDto {

  @IsNotEmpty({ message: 'El nombre es requerido' })
  @IsString()
  @MaxLength(100)
  nombre: string;

  @IsNotEmpty({ message: 'El apellido es requerido' })
  @IsString()
  @MaxLength(100)
  apellido: string;

  @IsNotEmpty({ message: 'El email es requerido' })
  @IsEmail({}, { message: 'El email debe ser válido' })
  email: string;

  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  @MaxLength(255)
  password: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  telefono?: string;

  // 👇 NUEVO
  @IsOptional()
  @IsString()
  @MaxLength(20)
  cedula?: string;

  // 👇 NUEVO
  @IsOptional()
  @IsString()
  @MaxLength(255)
  ubicacion?: string;

  @IsNotEmpty({ message: 'El tipo de usuario es requerido' })
  @IsEnum(['ADMIN', 'OPERARIO', 'PRODUCTOR'], {
    message: 'El tipo_usuario debe ser ADMIN, OPERARIO o PRODUCTOR',
  })
  tipo_usuario: 'ADMIN' | 'OPERARIO' | 'PRODUCTOR';
}