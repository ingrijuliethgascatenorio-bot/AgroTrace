import { IsString, IsOptional, IsBoolean, Length } from 'class-validator';

export class CrearComercianteDto {
  @IsString()
  @Length(2, 100)
  nombre: string;

  @IsString()
  @Length(7, 20)
  telefono: string;

  @IsOptional()
  @IsString()
  @Length(0, 150)
  direccion?: string;
}

export class EditarComercianteDto {
  @IsOptional()
  @IsString()
  @Length(2, 100)
  nombre?: string;

  @IsOptional()
  @IsString()
  @Length(7, 20)
  telefono?: string;

  @IsOptional()
  @IsString()
  @Length(0, 150)
  direccion?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
