/**
 * Consultas SQL para el módulo productor-dashboard.
 * ACTUALIZADO: soporta modelo de precio dinámico por ruta.
 *
 * estados_liquidacion:
 *   PENDIENTE_LIQUIDACION → kilos registrados, sin precio aún
 *   LIQUIDADO             → precio asignado al cerrar ruta
 *   PAGADO                → comprobante subido
 */

// ── PERFIL ─────────────────────────────────────────────────────────────────
export const QUERY_PERFIL = `
  SELECT
    p.id_productor,
    p.id_usuario,
    u.nombre,
    u.apellido,
    p.cedula,
    p.finca,
    p.ubicacion,
    p.telefono,
    p.codigo_qr,
    p.estado
  FROM productor p
  INNER JOIN usuario u ON u.id_usuario = p.id_usuario
  WHERE p.id_usuario = $1
    AND p.estado = 'ACTIVO'
  LIMIT 1
`;

// ── ACTUALIZAR PERFIL ──────────────────────────────────────────────────────
export const QUERY_ACTUALIZAR_PERFIL = `
  UPDATE productor
  SET
    telefono  = COALESCE($1, telefono),
    ubicacion = COALESCE($2, ubicacion),
    finca     = COALESCE($3, finca)
  WHERE id_productor = $4
  RETURNING
    id_productor, id_usuario, cedula,
    finca, ubicacion, telefono, codigo_qr, estado
`;

// ── HISTORIAL DE ENTREGAS ──────────────────────────────────────────────────
/**
 * Incluye estado_liquidacion, ruta_id, comprobante_pago.
 * precio_unitario y total pueden ser NULL (pendientes de liquidación).
 * $1 → id_productor
 * $2 → fecha inicio (NULL = sin filtro)
 * $3 → fecha fin    (NULL = sin filtro)
 */
export const QUERY_HISTORIAL = `
  SELECT
    e.id_entrega                                              AS id_compra,
    e.fecha::date                                             AS fecha,
    pr.nombre                                                 AS producto,
    e.peso_kg                                                 AS peso,
    e.precio_unitario,
    e.total,
    COALESCE(e.estado_liquidacion, 'PENDIENTE_LIQUIDACION')   AS estado_liquidacion,
    COALESCE(e.estado_pago, 'PENDIENTE')                      AS estado_pago,
    e.comprobante_pago,
    e.ruta_id,
    r.estado                                                  AS ruta_estado,
    r.precio_final_kg                                         AS ruta_precio_final
  FROM entrega e
  INNER JOIN producto pr ON pr.id_producto = e.id_producto
  LEFT  JOIN ruta r      ON r.id_ruta = e.ruta_id
  WHERE e.id_productor = $1
    AND ($2::date IS NULL OR e.fecha::date >= $2::date)
    AND ($3::date IS NULL OR e.fecha::date <= $3::date)
  ORDER BY e.fecha DESC, e.id_entrega DESC
`;

// ── RESUMEN DEL DASHBOARD ──────────────────────────────────────────────────
/**
 * KPIs del productor.
 * total_dinero solo suma entregas LIQUIDADAS/PAGADAS.
 * $1 → id_productor
 */
export const QUERY_RESUMEN = `
  SELECT
    COALESCE(SUM(e.peso_kg), 0)                                        AS total_kg,
    COALESCE(SUM(CASE
      WHEN e.estado_liquidacion IN ('LIQUIDADO','PAGADO') THEN e.total
      ELSE 0
    END), 0)                                                           AS total_dinero,
    COUNT(*)                                                           AS total_entregas,
    COUNT(CASE WHEN e.estado_liquidacion = 'PENDIENTE_LIQUIDACION' THEN 1 END) AS pendientes_liquidacion,
    COUNT(CASE WHEN e.estado_liquidacion = 'LIQUIDADO'             THEN 1 END) AS liquidadas,
    COUNT(CASE WHEN e.estado_liquidacion = 'PAGADO'                THEN 1 END) AS pagadas,
    MAX(e.fecha)                                                       AS ultima_entrega
  FROM entrega e
  WHERE e.id_productor = $1
`;

// ── QR ─────────────────────────────────────────────────────────────────────
export const QUERY_QR = `
  SELECT p.id_productor, p.cedula, p.codigo_qr
  FROM productor p
  WHERE p.id_productor = $1
  LIMIT 1
`;
