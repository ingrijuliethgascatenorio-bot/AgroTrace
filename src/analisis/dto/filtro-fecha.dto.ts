import { IsOptional, IsDateString, IsNumberString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FiltroFechaDto {
  @ApiPropertyOptional({
    description: 'ID del productor',
    example: 2,
  })
  @IsOptional()
  @IsNumberString()
  id_productor?: string;

  @ApiPropertyOptional({
    description: 'Fecha inicio (YYYY-MM-DD)',
    example: '2026-01-01',
  })
  @IsOptional()
  @IsDateString()
  inicio?: string;

  @ApiPropertyOptional({
    description: 'Fecha fin (YYYY-MM-DD)',
    example: '2026-03-01',
  })
  @IsOptional()
  @IsDateString()
  fin?: string;
}
