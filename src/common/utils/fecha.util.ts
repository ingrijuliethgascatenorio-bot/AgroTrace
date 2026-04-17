// src/common/utils/fecha.util.ts
/**
 * Utilidades de fecha para AgroTrace.
 *
 * PROBLEMA RAÍZ:
 *   `new Date().toISOString()` devuelve la fecha en UTC.
 *   Colombia está en UTC-5, así que entre las 19:00 y las 23:59 hora local
 *   toISOString() ya muestra el día SIGUIENTE.
 *   Resultado: una venta registrada a las 9pm del 10 aparece guardada como día 11.
 *
 * SOLUCIÓN:
 *   Todas las fechas se calculan usando la zona horaria de Colombia (America/Bogota)
 *   mediante `Intl.DateTimeFormat`, que internamente aplica el offset correcto.
 */

const ZONA_COLOMBIA = 'America/Bogota';

/**
 * Devuelve la fecha ACTUAL en Colombia como string 'YYYY-MM-DD'.
 * Usar en lugar de: new Date().toISOString().split('T')[0]
 *
 * @example
 *   fecha_venta: fechaHoyColombia()  // '2026-04-10'
 */
export function fechaHoyColombia(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA_COLOMBIA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  // en-CA produce formato YYYY-MM-DD directamente — sin manipulación extra.
}

/**
 * Devuelve el número de factura basado en la fecha Colombia + número aleatorio.
 * Usar en lugar de: `FV-${yyyymmdd}-${random}` con toISOString.
 *
 * @example
 *   const numero_factura = generarNumeroFactura(); // 'FV-20260410-4823'
 */
export function generarNumeroFactura(): string {
  // Obtener partes de la fecha en Colombia
  const fmt = new Intl.DateTimeFormat('es-CO', {
    timeZone: ZONA_COLOMBIA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const partes = fmt.formatToParts(new Date());
  const get = (tipo: string) =>
    partes.find((p) => p.type === tipo)?.value ?? '00';
  const yyyymmdd = `${get('year')}${get('month')}${get('day')}`;
  const aleatorio = Math.floor(Math.random() * 9000) + 1000;
  return `FV-${yyyymmdd}-${aleatorio}`;
}

/**
 * Convierte un timestamp UTC (Date | string ISO) → 'YYYY-MM-DD' en hora Colombia.
 *
 * Usar cuando el campo viene de @CreateDateColumn() que PostgreSQL almacena en UTC.
 * Sin esta conversión, registros creados después de las 7pm Colombia aparecen
 * con la fecha del día siguiente porque UTC ya marcó la medianoche.
 *
 * @param fecha  Date object, ISO string ("2026-04-11T02:00:00.000Z") o date string ("2026-04-10")
 * @returns      'YYYY-MM-DD' en hora Bogotá, o '' si el valor es nulo/inválido
 *
 * @example

 */
export function fechaEntregaAColombia(
  fecha: Date | string | null | undefined,
): string {
  if (!fecha) return '';

  // Si ya es solo YYYY-MM-DD → sin componente de hora, sin desfase UTC. Devolver directo.
  if (typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha.trim())) {
    return fecha.trim();
  }

  const d = fecha instanceof Date ? fecha : new Date(fecha);
  if (isNaN(d.getTime())) return '';

  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA_COLOMBIA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

/**
 * Devuelve la fecha Colombia formateada en español para mostrar en la factura.
 * Ej: "10 de abril de 2026"
 */
export function fechaHoyLegible(): string {
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: ZONA_COLOMBIA,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());
}
