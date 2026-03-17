/**
 * Consultas SQL optimizadas para el módulo productor-dashboard.
 * Se usan con DataSource.query() de TypeORM para máximo control y rendimiento.
 *
 * Tablas involucradas (nombres reales de la BD):
 *   productor  → id_productor, id_usuario, cedula, finca, ubicacion, telefono, codigo_qr, estado
 *   usuario    → id_usuario, nombre, apellido, email, tipo_usuario, activo
 *   compra     → id_compra, id_productor, fecha_compra, total, estado, numero_factura
 *   detalle_compra → id_compra, id_producto, cantidad, precio_unitario, subtotal
 *   producto   → id_producto, nombre
 */

// ── PERFIL ─────────────────────────────────────────────────────────────────
/**
 * Obtiene el perfil completo del productor uniendo productor + usuario.
 * $1 → id_usuario (extraído del token JWT)
 */
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
/**
 * Actualiza solo los campos permitidos: telefono, ubicacion, finca.
 * $1 → telefono  $2 → ubicacion  $3 → finca  $4 → id_productor
 */
export const QUERY_ACTUALIZAR_PERFIL = `
  UPDATE productor
  SET
    telefono  = COALESCE($1, telefono),
    ubicacion = COALESCE($2, ubicacion),
    finca     = COALESCE($3, finca)
  WHERE id_productor = $4
  RETURNING
    id_productor,
    id_usuario,
    cedula,
    finca,
    ubicacion,
    telefono,
    codigo_qr,
    estado
`;

// ── HISTORIAL DE ENTREGAS ──────────────────────────────────────────────────
/**
 * Devuelve las entregas del productor con detalle por producto.
 * $1 → id_productor
 * $2 → fecha inicio (opcional, puede ser NULL)
 * $3 → fecha fin    (opcional, puede ser NULL)
 *
 * Usa COALESCE para que los filtros sean opcionales:
 *   si $2 es NULL, no filtra por fecha inicio; ídem $3.
 */
export const QUERY_HISTORIAL = `
  SELECT
    c.id_compra,
    c.fecha_compra                         AS fecha,
    c.numero_factura,
    pr.nombre                              AS producto,
    dc.cantidad                            AS peso,
    dc.precio_unitario,
    dc.subtotal                            AS total,
    c.estado
  FROM compra c
  INNER JOIN detalle_compra dc ON dc.id_compra = c.id_compra
  INNER JOIN producto pr       ON pr.id_producto = dc.id_producto
  WHERE c.id_productor = $1
    AND ($2::date IS NULL OR c.fecha_compra >= $2::date)
    AND ($3::date IS NULL OR c.fecha_compra <= $3::date)
  ORDER BY c.fecha_compra DESC, c.id_compra DESC
`;

// ── RESUMEN DEL DASHBOARD ──────────────────────────────────────────────────
/**
 * Calcula en una sola consulta:
 *   total_kg       → suma de kg entregados
 *   total_dinero   → suma de dinero recibido
 *   total_entregas → cantidad de compras
 *   ultima_entrega → fecha de la compra más reciente
 * $1 → id_productor
 */
export const QUERY_RESUMEN = `
  SELECT
    COALESCE(SUM(dc.cantidad), 0)          AS total_kg,
    COALESCE(SUM(c.total), 0)              AS total_dinero,
    COUNT(DISTINCT c.id_compra)            AS total_entregas,
    MAX(c.fecha_compra)                    AS ultima_entrega
  FROM compra c
  INNER JOIN detalle_compra dc ON dc.id_compra = c.id_compra
  WHERE c.id_productor = $1
`;

// ── QR ─────────────────────────────────────────────────────────────────────
/**
 * Obtiene solo el QR y la cédula del productor.
 * $1 → id_productor
 */
export const QUERY_QR = `
  SELECT
    p.id_productor,
    p.cedula,
    p.codigo_qr
  FROM productor p
  WHERE p.id_productor = $1
  LIMIT 1
`;
