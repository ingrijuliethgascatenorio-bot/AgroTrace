import { IsString, IsOptional, IsArray, ValidateNested, IsNumber, IsPositive, Min } from "class-validator";
import { Type } from "class-transformer";

export class DetalleVentaDto {
  @IsNumber() id_producto: number;
  @IsNumber() @Min(0) cantidad_kg: number;
  @IsOptional() @IsNumber() @Min(0) cantidad_unidades?: number;
  @IsNumber() @IsPositive() precio_unitario: number;
}

export class RegistrarVentaDto {
  @IsOptional() @IsString() cliente?: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => DetalleVentaDto) detalles: DetalleVentaDto[];
}
