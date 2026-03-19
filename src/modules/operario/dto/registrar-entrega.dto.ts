import { IsNumber, IsPositive, IsOptional, Min } from "class-validator";

export class RegistrarEntregaDto {
  @IsNumber() id_productor: number;
  @IsNumber() id_producto: number;
  @IsNumber() @Min(0) peso_kg: number;
  @IsOptional() @IsNumber() @Min(0) cantidad_unidades?: number;
  @IsNumber() @IsPositive() precio_unitario: number;
}
