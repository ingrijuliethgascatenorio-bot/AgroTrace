import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';

// ── DTO para crear un precio semanal ──────────────────────
export class CrearPrecioDto {
  @IsInt()
  id_producto: number;

  @IsNumber()
  @IsPositive()
  precio_base_kg: number;

  @IsNumber()
  @Min(0)
  precio_transporte: number;

  @IsNumber()
  @IsPositive()
  total_kilos: number;

  /**
   * Nombre del comerciante destino.
   * Si es "EL PRIMO", precio_final = precio_base_kg (sin descuentos).
   * Para cualquier otro → precio_final = resultado_2 + 100.
   */
  @IsString()
  comerciante: string;
}

// ── DTO para desactivar un precio ─────────────────────────
export class ActualizarEstadoPrecioDto {
  @IsBoolean()
  activo: boolean;
}

// ── Respuesta enriquecida con todos los cálculos ──────────
export interface PrecioCalculadoResponse {
  id_precio?: number;
  id_producto: number;
  nombre_producto?: string;
  precio_base_kg: number;
  precio_base_neto: number;
  precio_transporte: number;
  total_kilos: number;
  costo_transporte_kg: number;
  resultado_1: number;
  resultado_2: number;
  precio_final_kg: number;
  margen_asociacion: number;
  comerciante: string;
  fecha?: Date;
  activo?: boolean;
}
