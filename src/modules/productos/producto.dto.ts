import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  MaxLength,
  Min,
} from 'class-validator';

// Si no tienes @nestjs/mapped-types instalado usa esta versión manual:

export class CreateProductoDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre del producto es obligatorio' })
  @MaxLength(150)
  nombre: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  categoria?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  unidad_medida?: string;

  @IsOptional()
  @IsNumber({}, { message: 'El precio base debe ser un número' })
  @Min(0, { message: 'El precio no puede ser negativo' })
  precio_base?: number;

  @IsOptional()
  @IsNumber()
  precio_dia?: number;

  @IsOptional()
  @IsNumber()
  id_productor?: number;
}

// En lugar de PartialType lo escribimos manual para evitar la dependencia
export class UpdateProductoDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  nombre?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  categoria?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  unidad_medida?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  precio_base?: number;

  @IsOptional()
  @IsNumber()
  precio_dia?: number;

  @IsOptional()
  @IsNumber()
  id_productor?: number;
}

export class UpdateEstadoProductoDto {
  @IsBoolean({ message: 'El campo disponible debe ser booleano' })
  disponible: boolean;
}
