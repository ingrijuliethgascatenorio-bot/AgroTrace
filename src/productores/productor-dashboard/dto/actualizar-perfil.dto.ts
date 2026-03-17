import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ActualizarPerfilDto {
  @ApiPropertyOptional({
    description: 'Número de teléfono de contacto',
    example: '3201234567',
    maxLength: 50,
  })
  @IsOptional()
  @IsString({ message: 'El teléfono debe ser un texto' })
  @MaxLength(50, { message: 'El teléfono no puede superar 50 caracteres' })
  telefono?: string;

  @ApiPropertyOptional({
    description: 'Ubicación o dirección de la finca',
    example: 'Florencia - Caquetá, vereda La Unión',
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: 'La ubicación debe ser un texto' })
  @MaxLength(255, { message: 'La ubicación no puede superar 255 caracteres' })
  ubicacion?: string;

  @ApiPropertyOptional({
    description: 'Nombre de la finca',
    example: 'Finca La Esperanza',
    maxLength: 150,
  })
  @IsOptional()
  @IsString({ message: 'El nombre de la finca debe ser un texto' })
  @MaxLength(150, { message: 'El nombre de la finca no puede superar 150 caracteres' })
  finca?: string;
}
