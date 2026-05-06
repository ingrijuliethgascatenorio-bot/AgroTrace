import { IsString, IsEmail, IsOptional, IsIn } from 'class-validator';

export class EditarUsuarioDto {
  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  apellido?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsString()
  @IsOptional()
  cedula?: string;

  @IsString()
  @IsOptional()
  @IsIn(['ADMIN', 'OPERARIO', 'PRODUCTOR'])
  tipo_usuario?: 'ADMIN' | 'OPERARIO' | 'PRODUCTOR';

  @IsString()
  @IsOptional()
  foto_perfil?: string;
}
