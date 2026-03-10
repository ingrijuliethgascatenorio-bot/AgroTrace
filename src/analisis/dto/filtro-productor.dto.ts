/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IsOptional, IsNumberString, IsIn, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class FiltroProductorDto {
  @ApiPropertyOptional({
    description: 'ID del productor',
    example: 2,
  })
  @IsOptional()
  @IsNumberString()
  id_productor?: string;

  @ApiPropertyOptional({
    description: 'Tipo de ranking',
    enum: ['total', 'promedio', 'frecuencia'],
    example: 'total',
  })
  @IsOptional()
  @IsIn(['total', 'promedio', 'frecuencia'])
  tipo?: string;

  @ApiPropertyOptional({
    description: 'Precio por unidad',
    example: 2000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  precio?: number;

  @ApiPropertyOptional({
    description: 'Capacidad máxima',
    example: 1500,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  capacidad?: number;
}
