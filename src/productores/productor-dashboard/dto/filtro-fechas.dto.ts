import { IsOptional, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FiltroFechasDto {
  @ApiPropertyOptional({
    description: 'Fecha de inicio del rango (YYYY-MM-DD)',
    example: '2026-01-01',
  })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha de inicio debe tener formato YYYY-MM-DD' })
  inicio?: string;

  @ApiPropertyOptional({
    description: 'Fecha de fin del rango (YYYY-MM-DD)',
    example: '2026-12-31',
  })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha de fin debe tener formato YYYY-MM-DD' })
  fin?: string;
}
