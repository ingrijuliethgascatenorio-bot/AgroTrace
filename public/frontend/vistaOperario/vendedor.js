const _BASE_URL = window.location.origin;
const API_BASE = `${_BASE_URL}/api`;

// ── Guard: solo OPERARIO entra a vendedor.html ────────────────────────────────
// auth-guard.js debe cargarse ANTES que vendedor.js en el HTML:
//   <script src="../auth-guard.js"></script>
//   <script src="vendedor.js"></script>
AuthGuard.require('OPERARIO');

let html5QrCode = null;
let isCameraActive = false;
let currentProductor = null;
let currentCliente = null;
let productos = [];       // catálogo cargado desde API
let preciosActuales = []; // precios activos cargados desde /precios/actual
let comerciantes = []; // lista de comerciantes cargada al iniciar
let rutaActiva = null; // { id_ruta, fecha, estado, n_entregas } — ruta actual del operario
let rutaActivaKgTotal = 0; // suma de kg de entregas de la ruta activa (para preview de precio)
let tipoProductorActual = 'AFILIADO'; // 'AFILIADO' | 'EXTERNO'
let historialCompleto = [];      // todos los registros para filtrado
let perfilData = null;

/**
 * FILAS DINÁMICAS
 * Cada fila: { rowId, productoId, cantidad, precio }
 * rowId es único y solo crece (evita colisiones al eliminar y re-agregar)
 */
let filasCompra = [];
let filasVenta = [];
let filasEdicion = [];   // reutiliza el mismo componente en el modal
let _nextRowId = 0;
function nextRowId() { return _nextRowId++; }

// Operación abierta en el modal de edición
let operacionEnEdicion = null;

// =============================================
// 2. UTILIDADES
// =============================================

function getToken() {
  return localStorage.getItem("token") || "";
}

/**
 * Muestra una alerta coloreada dentro del contenedor indicado.
 * Las de tipo "success" desaparecen solos a los 4 s.
 */
function showAlert(message, type = "error", containerId = "alert-container") {
  const container = document.getElementById(containerId);
  if (!container) return;
  const div = document.createElement("div");
  div.className = `alert ${type === "success" ? "alert-success" : "alert-error"}`;
  div.textContent = message;
  container.innerHTML = "";
  container.appendChild(div);
  if (type === "success") setTimeout(() => { container.innerHTML = ""; }, 4000);
}

function clearAlert(containerId = "alert-container") {
  const c = document.getElementById(containerId);
  if (c) c.innerHTML = "";
}

/**
 * fetch con Authorization Bearer.
 * Lanza Error con el mensaje del servidor si el status no es ok.
 */
async function fetchWithAuth(url, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    Authorization: `Bearer ${getToken()}`,
  };
  // Prevent stale cache — always fetch fresh data from server
  const method = (options.method || 'GET').toUpperCase();
  // FIX OFFLINE: 'no-store' impedía que el SW devolviera caché sin red.
  // GET usa 'default' → el SW puede interceptar y servir del caché.
  // Mutaciones siguen sin caché para no mandar datos viejos.
  const cacheMode = method === 'GET' ? 'default' : 'no-store';
  const response = await fetch(url, { ...options, headers, cache: cacheMode });
  let data;
  try { data = await response.json(); } catch { data = null; }
  if (!response.ok) {
    const errMsg = data
      ? (Array.isArray(data.message) ? data.message.join(', ') : (data.message || data.error || JSON.stringify(data)))
      : `Error ${response.status}`;
    console.error('[API ERROR]', response.status, response.url, errMsg, data);
    throw new Error(errMsg);
  }
  return data;
}


// ── Helpers de fecha — AgroTrace Operario ────────────────────────────────────
//
// PROBLEMA: Colombia UTC-5. Entrega a las 9pm → timestamptz UTC = 2am día siguiente.
// El backend devuelve "2026-04-11T02:00:00Z" pero la fecha real en Colombia es "2026-04-10".
//
// Hay dos tipos de campos:
//   · 'YYYY-MM-DD' puro  → venta.fecha_venta, ruta.fecha  (sin desfase)
//   · ISO UTC timestamp  → entrega.fecha (@CreateDateColumn) (con desfase)
//
// parseFechaLocal maneja ambos casos correctamente.

/**
 * Convierte cualquier valor de fecha a milisegundos en hora Colombia.
 */
function parseFechaLocal(f) {
  if (!f) return 0;
  const s = String(f).trim();
  if (!s) return 0;

  // Caso A: solo 'YYYY-MM-DD' — construir como fecha local para evitar
  // que new Date('2026-04-10') la trate como UTC midnight (= 7pm del 9 en Colombia)
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d).getTime();
  }

  // Caso B: ISO timestamp UTC → extraer fecha correcta en zona Bogotá
  const ts = new Date(s);
  if (isNaN(ts.getTime())) return 0;
  const colStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(ts);
  const [y, m, d] = colStr.split('-').map(Number);
  return new Date(y, m - 1, d).getTime();
}

/**
 * Formatea cualquier valor de fecha como string legible dd/mm/aaaa en Colombia.
 */
function formatFecha(fecha) {
  if (!fecha) return '—';
  const t = parseFechaLocal(fecha);
  if (!t) return '—';
  return new Date(t).toLocaleDateString('es-CO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

function formatMoneda(valor) {
  if (valor == null || isNaN(valor)) return "$0";
  return "$" + parseFloat(valor).toLocaleString("es-CO", { minimumFractionDigits: 0 });
}

// =============================================
// 3. CATÁLOGO DE PRODUCTOS
// =============================================

/**
 * Descarga el catálogo de productos y lo guarda en `productos`.
 * Las filas dinámicas lo usan para generar los <option>.
 */
async function cargarProductos() {
  // FIX OFFLINE: si no hay red, usar caché de localStorage
  if (!navigator.onLine) {
    const cached = localStorage.getItem('cache_op_productos');
    if (cached) { try { productos = JSON.parse(cached); console.warn('[OFFLINE] Productos desde caché:', productos.length); return; } catch(_){} }
    console.warn('[OFFLINE] Sin productos en caché — selects quedarán vacíos');
    return;
  }
  try {
    const data = await fetchWithAuth(`${API_BASE}/productos`);
    productos = Array.isArray(data) ? data : data.productos || [];
    // Guardar para uso offline
    try { localStorage.setItem('cache_op_productos', JSON.stringify(productos)); } catch(_) {}
  } catch (error) {
    console.warn("Error cargando productos:", error.message);
    // Fallback a caché si la petición falla (señal intermitente)
    const cached = localStorage.getItem('cache_op_productos');
    if (cached) { try { productos = JSON.parse(cached); } catch(_){} }
  }
}

// =============================================
// 3b. PRECIOS ACTUALES (desde módulo admin)
// =============================================

/**
 * Descarga los precios activos para todos los productos.
 * Se guarda en `preciosActuales` y se usa al seleccionar producto en filas.
 */
async function cargarPreciosActuales() {
  // FIX OFFLINE: precios son críticos para el operario — siempre tener caché
  if (!navigator.onLine) {
    const cached = localStorage.getItem('cache_op_precios');
    if (cached) { try { preciosActuales = JSON.parse(cached); console.warn('[OFFLINE] Precios desde caché:', preciosActuales.length); return; } catch(_){} }
    console.warn('[OFFLINE] Sin precios en caché — precio quedará en 0');
    preciosActuales = [];
    return;
  }
  try {
    const data = await fetchWithAuth(`${API_BASE}/precios/actual`);
    preciosActuales = Array.isArray(data) ? data : [];
    // Guardar con timestamp para saber qué tan recientes son
    try {
      localStorage.setItem('cache_op_precios', JSON.stringify(preciosActuales));
      localStorage.setItem('cache_op_precios_ts', Date.now().toString());
    } catch(_) {}
  } catch (error) {
    console.warn("[PRECIOS] Error cargando precios actuales:", error.message);
    const cached = localStorage.getItem('cache_op_precios');
    if (cached) {
      try {
        preciosActuales = JSON.parse(cached);
        const ts = localStorage.getItem('cache_op_precios_ts');
        const dias = ts ? Math.round((Date.now() - Number(ts)) / 86400000) : '?';
        console.warn(`[PRECIOS] Usando caché de hace ${dias} día(s)`);
      } catch(_) { preciosActuales = []; }
    } else {
      preciosActuales = [];
    }
  }
}

/**
 * Devuelve el precio_final_productor activo para un id_producto.
 * Este es el precio que se le PAGA al productor (fórmula 3.5%).
 * SOLO se usa en COMPRAS (entregas). No aplica en ventas.
 *
 * El backend devuelve:
 *   { id_producto, precio_base_kg, precio_final_productor, costo_transporte_kg }
 * Retorna null si no hay precio definido.
 */
function prc_obtenerPrecioProducto(id_producto) {
  const idNum = parseInt(id_producto, 10);
  const encontrado = preciosActuales.find(p => p.id_producto === idNum);
  if (!encontrado) return null;
  // precio_final_productor es el campo correcto del backend nuevo
  // precio_final_kg es el campo del backend viejo — soporte ambos por compatibilidad
  const precio = encontrado.precio_final_productor ?? encontrado.precio_final_kg;
  return precio != null ? parseFloat(precio) : null;
}

/**
 * Calcula el precio de VENTA para un comerciante.
 * SOLO aplica en ventas, NUNCA en entregas/compras al productor.
 *
 * Regla:
 *   - Comerciante "EL PRIMO" → precio_venta = precio_base_kg
 *   - Cualquier otro         → precio_venta = precio_base_kg + 100
 */
function prc_obtenerPrecioVenta(id_producto, nombre_comerciante) {
  const idNum = parseInt(id_producto, 10);
  const encontrado = preciosActuales.find(p => p.id_producto === idNum);
  if (!encontrado) return null;
  const base = parseFloat(encontrado.precio_base_kg);
  const esEspecial = (nombre_comerciante || '').trim().toUpperCase() === 'EL PRIMO';
  return esEspecial ? base : base + 100;
}

// =============================================
// 4. DASHBOARD (CORREGIDO)
// =============================================

/**
 * CORRECCIÓN:
 * Antes mostraba métricas "de hoy" que no coincidían con los títulos
 * de las tarjetas. Ahora muestra totales globales coherentes:
 *   - Tarjeta Compras   → total de operaciones de compra
 *   - Tarjeta Ventas    → total de operaciones de venta
 *   - Tarjeta Productores → productores únicos con compras registradas
 */
async function cargarDashboard() {
  const token = localStorage.getItem("token");
  if (!token) { window.location.href = "../../frontend/login.html"; return; }

  try {
    // 1. Historial base (ventas + compras cerradas/sin ruta)
    const dataHistorial = await fetchWithAuth(`${API_BASE}/operario/historial`);
    const historialBase = Array.isArray(dataHistorial) ? dataHistorial : [];

    // 2. Si hay ruta activa, traer sus entregas y fusionarlas
    //    El backend de /historial puede no incluir entregas con ruta ABIERTA
    let entregasRuta = [];
    if (rutaActiva && rutaActiva.id_ruta) {
      try {
        const dataRuta = await fetchWithAuth(`${API_BASE}/rutas/${rutaActiva.id_ruta}/entregas`);
        const lista = Array.isArray(dataRuta) ? dataRuta : (dataRuta.data || []);
        // Normalizar al formato del historial para que sean comparables
        entregasRuta = lista.map(e => ({
          tipo:              "COMPRA",
          fecha:             e.fecha || e.createdAt || rutaActiva.fecha,
          id_productor:      e.id_productor,
          cedula_productor:  e.cedula_productor,
          nombre_productor:  e.nombre_productor || e.nombre_productor_externo,
          nombre_producto:   e.nombre_producto,
          peso_kg:           e.peso_kg,
          cantidad:          e.peso_kg,
          precio_unitario:   e.precio_unitario,
          total:             e.total,
          ruta_id:           rutaActiva.id_ruta,
          estado_liquidacion: e.estado_liquidacion || "PENDIENTE_LIQUIDACION",
          _de_ruta_activa:   true,   // marca para no duplicar
        }));
      } catch (eRuta) {
        console.warn("[DASHBOARD] No se pudieron cargar entregas de ruta activa:", eRuta.message);
      }
    }

    // 3. Fusionar: quitar del base los registros que ya vienen de la ruta activa
    //    (evitar duplicados si el endpoint ya los incluye)
    const idsRuta = new Set(entregasRuta.map(e => e.ruta_id + "_" + e.nombre_productor + "_" + e.peso_kg));
    const historialSinDuplicados = historialBase.filter(r => {
      if ((r.tipo || "").toUpperCase() !== "COMPRA") return true;
      const key = r.ruta_id + "_" + (r.nombre_productor || r.cedula_productor) + "_" + (r.peso_kg || r.cantidad);
      return !idsRuta.has(key);
    });

    historialCompleto = [...entregasRuta, ...historialSinDuplicados];

    // FIX OFFLINE QR: cachear productores afiliados en segundo plano
    _cachearProductoresDeHistorial(historialCompleto);

    // 4. Calcular métricas
    const compras = historialCompleto.filter(r => (r.tipo || "").toUpperCase() === "COMPRA");
    const ventas  = historialCompleto.filter(r => (r.tipo || "").toUpperCase() === "VENTA");

    const productoresUnicos = new Set(
      compras
        .map(r => r.cedula_productor || r.id_productor || r.nombre_productor)
        .filter(Boolean)
    ).size;

    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    set("dash-entregas-hoy", compras.length);
    set("dash-kilos-hoy",    ventas.length);
    set("dash-productores",  productoresUnicos > 0 ? productoresUnicos : "0");
    // FIX OFFLINE: guardar snapshot del dashboard para uso sin conexión
    try {
      localStorage.setItem('cache_op_dashboard', JSON.stringify({
        compras: compras.length,
        ventas: ventas.length,
        productores: productoresUnicos > 0 ? productoresUnicos : 0,
        ultimaOp: null, // se actualiza abajo
        ultimasOps: historialCompleto.slice(0, 5),
        ts: Date.now()
      }));
    } catch(_) {}

    // 5. Última operación: la fecha más reciente entre TODO
    const fechas = historialCompleto
      .map(r => {
        const f = r.fecha || r.fecha_venta || r.fecha_compra || r.createdAt || null;
        if (!f) return null;
        const t = parseFechaLocal(f);
        return t ? new Date(t) : null;
      })
      .filter(f => f && !isNaN(f.getTime()));

    if (fechas.length > 0) {
      const masReciente = new Date(Math.max(...fechas.map(f => f.getTime())));
      set("dash-ultima-op", masReciente.toLocaleDateString("es-CO", {
        day: "2-digit", month: "2-digit", year: "numeric"
      }));
    } else {
      set("dash-ultima-op", "Sin registros");
    }

    // 6. Últimas 5 operaciones ordenadas por fecha descendente
    const ordenadas = [...historialCompleto].sort((a, b) => {
      const fa = parseFechaLocal(a.fecha || a.fecha_venta || a.fecha_compra);
      const fb = parseFechaLocal(b.fecha || b.fecha_venta || b.fecha_compra);
      return fb - fa;
    });
    renderUltimasOps(ordenadas.slice(0, 5));

  } catch (error) {
    console.warn("Dashboard error:", error.message);
    // FIX OFFLINE: mostrar datos del caché si hay
    const cached = localStorage.getItem('cache_op_dashboard');
    if (cached) {
      try {
        const d = JSON.parse(cached);
        const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        set("dash-entregas-hoy", d.compras || "—");
        set("dash-kilos-hoy",    d.ventas  || "—");
        set("dash-productores",  d.productores || "—");
        set("dash-ultima-op",    d.ultimaOp || "Sin registros");
        if (d.ultimasOps) renderUltimasOps(d.ultimasOps);
        return;
      } catch(_) {}
    }
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set("dash-entregas-hoy", "—");
    set("dash-kilos-hoy",    "—");
    set("dash-productores",  "—");
    set("dash-ultima-op",    "Sin registros");
  }
}

function renderUltimasOps(registros) {
  const tbody = document.getElementById("ultimas-ops-body");
  if (!tbody) return;

  if (!registros || !registros.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="table-empty">No hay operaciones recientes.</td></tr>`;
    return;
  }

  const agrupados = agruparComprasPorProductor(registros);

  tbody.innerHTML = agrupados.map(r => {
    const esCompra = (r.tipo || "").toUpperCase() === "COMPRA";
    const fecha = formatFecha(r.fecha || r.fecha_venta || r.fecha_compra || r.createdAt);
    const tipo = `<span class="badge ${esCompra ? "badge-compra" : "badge-venta"}">${esCompra ? "Compra" : "Venta"}</span>`;

    const quien = esCompra
      ? (r.nombre_productor || r.nombre_productor_externo || (r.id_productor ? `Prod. #${r.id_productor}` : "—"))
      : (r.nombre || r.cliente || r.nombre_comerciante || "Cliente general");

    // Producto: lista de pills si hay múltiples
    let producto;
    if (esCompra && r._agrupado && r._productos && r._productos.length > 1) {
      producto = r._productos.map(p =>
        `<span style="display:inline-block;background:#f0fdf4;border:1px solid #bbf7d0;
          border-radius:99px;padding:1px 7px;font-size:.7rem;font-weight:600;color:#166534;margin:1px">${p.nombre}</span>`
      ).join('');
    } else if (esCompra && r._agrupado) {
      producto = r._productos?.[0]?.nombre || '—';
    } else {
      producto = r.nombre_producto || r.producto || "—";
    }

    // Peso: total del grupo
    let pesoStr;
    if (esCompra && r._agrupado) {
      const total = r._peso_total || 0;
      pesoStr = total > 0
        ? `${total.toFixed(2)} kg${r._productos?.length > 1 ? ` <span style="font-size:.7rem;color:#6b7280">(${r._productos.length} prod.)</span>` : ''}`
        : "—";
    } else {
      const pesoRaw = esCompra
        ? parseFloat(r.peso_kg || r.cantidad || r.kilos || 0)
        : parseFloat(r.cantidad_kg || r.cantidad || r.kilos || 0);
      pesoStr = pesoRaw > 0 ? pesoRaw.toFixed(2) + " kg" : "—";
    }

    // Indicador visual si es entrega de ruta activa
    const rutaTag = r._de_ruta_activa
      ? `<span style="font-size:.68rem;background:#fef3c7;color:#92400e;border-radius:99px;padding:1px 6px;font-weight:700;margin-left:4px">Ruta #${r.ruta_id}</span>`
      : "";

    return `<tr>
      <td data-label="Fecha">${fecha}</td>
      <td data-label="Tipo">${tipo}${rutaTag}</td>
      <td data-label="Productor / Cliente">${quien}</td>
      <td data-label="Producto">${producto}</td>
      <td data-label="Peso / Cant.">${pesoStr}</td>
    </tr>`;
  }).join("");
}

// =============================================
// 5. FILAS DINÁMICAS DE PRODUCTOS
// =============================================

/** Devuelve el array de estado según el tipo de formulario */
function getFilas(tipo) {
  if (tipo === "compra") return filasCompra;
  if (tipo === "venta") return filasVenta;
  return filasEdicion;
}

function setFilas(tipo, arr) {
  if (tipo === "compra") filasCompra = arr;
  else if (tipo === "venta") filasVenta = arr;
  else filasEdicion = arr;
}

/** Agrega una fila vacía y re-renderiza */
function agregarFila(tipo) {
  getFilas(tipo).push({ rowId: nextRowId(), productoId: "", cantidad: "", precio: "" });
  renderFilas(tipo);
}

/** Elimina la fila por rowId y re-renderiza */
function eliminarFila(tipo, rowId) {
  setFilas(tipo, getFilas(tipo).filter(f => f.rowId !== rowId));
  renderFilas(tipo);
}

/**
 * Genera el bloque HTML de una fila de producto.
 * Usa data-* para identificar tipo y rowId en la delegación de eventos.
 */
function crearFilaHTML(tipo, fila, numero) {
  const { rowId, productoId, cantidad, precio } = fila;

  const opcionesHTML = productos.map(p => {
    const id = p.id_producto || p.id;
    const nombre = p.nombre || p.descripcion || "Producto";
    const precioBase = p.precio_base || p.precio_kg || p.precio || 0;
    const sel = String(id) === String(productoId) ? "selected" : "";
    return `<option value="${id}" data-precio="${precioBase}" ${sel}>${nombre}</option>`;
  }).join("");

  // Opcion "Otro producto" — sin emojis
  const otroSel = productoId === 'otro' ? 'selected' : '';
  const opcionOtro = `<option value="otro" ${otroSel}>+ Otro producto (escribir nombre)</option>`;

  // Input nombre libre (visible solo cuando se elige "Otro")
  const otroVisible = productoId === 'otro' ? '' : 'display:none';
  const otroNombre = fila.otroNombre || '';

  const subtotal = Math.round((parseFloat(cantidad) || 0) * (parseFloat(precio) || 0));

  return `
    <div class="producto-fila" data-row-id="${rowId}">
      <div class="producto-fila-header">
        <span class="producto-numero">Producto ${numero}</span>
        <button type="button" class="btn-eliminar-fila"
          data-tipo="${tipo}" data-row-id="${rowId}" title="Eliminar">x</button>
      </div>
      <div class="producto-fila-body">
        <div class="form-row">
          <div class="form-field">
            <label class="label">Producto</label>
            <select class="input producto-select" data-tipo="${tipo}" data-row-id="${rowId}">
              <option value="">Seleccionar producto</option>
              ${opcionesHTML}
              ${tipo === 'compra' ? opcionOtro : ''}
            </select>
          </div>
          <div class="form-field">
            <label class="label">Cantidad (kg)</label>
            <input type="number" class="input producto-cantidad"
              data-tipo="${tipo}" data-row-id="${rowId}"
              min="0" step="0.01" placeholder="0.00" value="${cantidad}"
              inputmode="decimal" pattern="[0-9]*[.,]?[0-9]*" />
          </div>
        </div>
        <div class="form-field otro-nombre-field" style="${otroVisible};margin:6px 0 10px">
          <label class="label">Nombre del producto</label>
          <input type="text" class="input producto-otro-nombre"
            data-tipo="${tipo}" data-row-id="${rowId}"
            placeholder="Escribe el nombre del producto"
            value="${otroNombre}"
            oninput="fila_onOtroNombreInput('${tipo}', ${rowId}, this.value)" />
        </div>
        <div class="form-row">
          <div class="form-field">
            <label class="label">Precio / kg</label>
            <input type="number" class="input producto-precio"
              data-tipo="${tipo}" data-row-id="${rowId}"
              min="0" step="0.01" placeholder="0.00"
              value="${precio || ""}" readonly />
          </div>
          <div class="form-field">
            <label class="label">Subtotal</label>
            <input type="number" class="input input-total producto-subtotal"
              data-tipo="${tipo}" data-row-id="${rowId}" readonly value="${subtotal.toFixed(2)}" />
          </div>
        </div>
      </div>
    </div>`;
}

/** Re-dibuja el contenedor de filas del tipo indicado */
function renderFilas(tipo) {
  const contenedores = {
    compra: "lista-productos-compra",
    venta: "lista-productos-venta",
    edicion: "lista-productos-edicion"
  };
  const container = document.getElementById(contenedores[tipo]);
  if (!container) return;

  const filas = getFilas(tipo);
  container.innerHTML = filas.length
    ? filas.map((f, i) => crearFilaHTML(tipo, f, i + 1)).join("")
    : `<p class="no-filas-msg">Usa el botón de abajo para agregar productos.</p>`;

  actualizarTotalFormulario(tipo);
}

/** Recalcula el subtotal visual de una fila y el total general */
function calcularSubtotalFila(tipo, rowId) {
  const fila = getFilas(tipo).find(f => f.rowId === rowId);
  if (!fila) return;

  const cantidad = parseFloat(fila.cantidad) || 0;
  const precio = parseFloat(fila.precio) || 0;
  const subtotal = cantidad * precio;

  // Usar data-tipo + data-row-id para encontrar exactamente el elemento correcto
  const subEl = document.querySelector(
    `.producto-subtotal[data-tipo="${tipo}"][data-row-id="${rowId}"]`
  );
  if (subEl) subEl.value = Math.round(subtotal);

  actualizarTotalFormulario(tipo);
}

/** Suma todos los subtotales y los muestra en el total de operación */
function actualizarTotalFormulario(tipo) {
  const filas = getFilas(tipo);
  let total = 0;

  filas.forEach(f => {
    const cantidad = parseFloat(f.cantidad) || 0;
    const precio = parseFloat(f.precio) || 0;
    const sub = cantidad * precio;
    total += sub;

    // Sincronizar también el input visual del subtotal de cada fila
    const subEl = document.querySelector(
      `.producto-subtotal[data-tipo="${tipo}"][data-row-id="${f.rowId}"]`
    );
    if (subEl) subEl.value = Math.round(sub);
  });

  const ids = { compra: "total-compra", venta: "total-venta", edicion: "total-edicion" };
  const el = document.getElementById(ids[tipo]);
  if (el) el.textContent = formatMoneda(total);
}

/**
 * DELEGACIÓN DE EVENTOS para filas dinámicas.
 * Un único listener en document maneja todos los cambios de cualquier fila,
 * independientemente de cuándo fue creada o re-renderizada.
 */
function initProductFilaEvents() {
  // Cambio de producto → precio según TIPO de operación
  //   COMPRA → precio_final_productor  (lo que se le PAGA al productor, fórmula 3.5%)
  //   VENTA  → precio_venta del comerciante (EL PRIMO = base, otros = base + 100)
  //   El campo siempre es readonly: el operario solo ve el precio, no lo edita.
  document.addEventListener("change", (e) => {
    const sel = e.target.closest(".producto-select");
    if (!sel) return;
    const tipo = sel.dataset.tipo;
    const rowId = parseInt(sel.dataset.rowId, 10);

    const fila = getFilas(tipo).find(f => f.rowId === rowId);
    if (!fila) return;

    fila.productoId = sel.value;

    let precioCalculado = null;

    if (sel.value) {
      if (tipo === "venta") {
        // ── VENTA: precio según regla del comerciante ──────────
        // Leer nombre del comerciante desde currentCliente (select nativo)
        const nombreCom = (currentCliente?.nombre || "").trim().toUpperCase();
        precioCalculado = prc_obtenerPrecioVenta(sel.value, nombreCom);
      } else {
        // ── COMPRA / EDICIÓN: precio_final_productor ───────────
        precioCalculado = prc_obtenerPrecioProducto(sel.value);
        // Si el productor es EXTERNO, restar $100/kg
        if (precioCalculado !== null && tipo === 'compra' && tipoProductorActual === 'EXTERNO') {
          precioCalculado = Math.max(0, precioCalculado - 100);
        }
      }
    }

    if (precioCalculado !== null) {
      fila.precio = precioCalculado;
    } else if (sel.value) {
      fila.precio = "";
      const contenedorAlerta = tipo === "venta" ? "alert-venta" : "alert-container";
      showAlert(
        "No hay precio definido para este producto. El admin debe registrar el precio semanal en el módulo PRECIOS.",
        "error",
        contenedorAlerta
      );
    } else {
      fila.precio = "";
    }

    // Actualizar el input de precio (readonly)
    const precioInput = document.querySelector(
      `.producto-precio[data-tipo="${tipo}"][data-row-id="${rowId}"]`
    );
    if (precioInput) {
      precioInput.value = fila.precio > 0 ? Math.round(fila.precio) : "";
    }

    calcularSubtotalFila(tipo, rowId);
  });

  // Cambio de cantidad → recalcula subtotal
  document.addEventListener("input", (e) => {
    const input = e.target.closest(".producto-cantidad");
    if (!input) return;
    const tipo = input.dataset.tipo;
    const rowId = parseInt(input.dataset.rowId, 10);
    const fila = getFilas(tipo).find(f => f.rowId === rowId);
    if (fila) fila.cantidad = input.value;
    calcularSubtotalFila(tipo, rowId);
  });

  // Cambio de select producto → mostrar/ocultar campo "otro nombre"
  document.addEventListener("change", (e) => {
    const sel = e.target.closest(".producto-select");
    if (!sel) return;
    const rowId = parseInt(sel.dataset.rowId, 10);
    const tipo  = sel.dataset.tipo;
    const campoOtro = document.querySelector(`.otro-nombre-field[style*="display"]`)
      || document.querySelector(`.producto-otro-nombre[data-row-id="${rowId}"]`)?.closest('.form-field');
    // Buscar el campo otro-nombre de esta fila específica
    const inputOtro = document.querySelector(`.producto-otro-nombre[data-tipo="${tipo}"][data-row-id="${rowId}"]`);
    const fieldOtro = inputOtro?.closest('.otro-nombre-field');
    if (fieldOtro) {
      fieldOtro.style.display = sel.value === 'otro' ? '' : 'none';
      if (sel.value !== 'otro' && inputOtro) inputOtro.value = '';
    }
    // Limpiar otroNombre en el objeto fila si cambió de "otro" a algo más
    const fila2 = getFilas(tipo).find(f => f.rowId === rowId);
    if (fila2 && sel.value !== 'otro') fila2.otroNombre = '';
  });

  // Clic en eliminar fila
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-eliminar-fila");
    if (!btn) return;
    eliminarFila(btn.dataset.tipo, parseInt(btn.dataset.rowId, 10));
  });
}

/** Guarda el nombre libre del producto "otro" en el objeto fila */
function fila_onOtroNombreInput(tipo, rowId, valor) {
  const fila = getFilas(tipo).find(f => f.rowId === rowId);
  if (fila) fila.otroNombre = valor.trim();
}

// =============================================
// 6. PRODUCTOR — COMPRA
// =============================================

/**
 * Cambia entre modo AFILIADO (QR/cédula) y EXTERNO (nombre manual).
 * Resetea el productor actual al cambiar de modo.
 */
function prod_setTipo(tipo) {
  tipoProductorActual = tipo;
  currentProductor = null;

  // Botones
  const btnAfil = document.getElementById('btn-tipo-afiliado');
  const btnExt  = document.getElementById('btn-tipo-externo');
  if (btnAfil) {
    btnAfil.className = tipo === 'AFILIADO' ? 'btn btn-primary' : 'btn btn-outline';
    btnAfil.style.flex = '1';
    btnAfil.style.fontSize = '.85rem';
  }
  if (btnExt) {
    btnExt.className = tipo === 'EXTERNO' ? 'btn btn-primary' : 'btn btn-outline';
    btnExt.style.flex = '1';
    btnExt.style.fontSize = '.85rem';
  }

  // Paneles
  const panelAfil = document.getElementById('panel-afiliado');
  const panelExt  = document.getElementById('panel-externo');
  if (panelAfil) panelAfil.style.display = tipo === 'AFILIADO' ? '' : 'none';
  if (panelExt)  panelExt.style.display  = tipo === 'EXTERNO'  ? '' : 'none';

  // Limpiar info del productor
  ['prod-nombre','prod-cedula','prod-ubicacion'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.textContent = '—'; el.classList.add('vacio'); }
  });
  const rowTipo = document.getElementById('row-tipo-productor');
  if (rowTipo) rowTipo.style.display = tipo === 'EXTERNO' ? 'flex' : 'none';

  // Limpiar campos externos
  if (tipo === 'AFILIADO') {
    const ne = document.getElementById('input-nombre-externo');
    const te = document.getElementById('input-telefono-externo');
    if (ne) ne.value = '';
    if (te) te.value = '';
  }

  // Recalcular precios en filas de compra (externo = afiliado - 100)
  filasCompra.forEach(fila => {
    if (!fila.productoId) return;
    const precioAfiliado = prc_obtenerPrecioProducto(fila.productoId);
    if (precioAfiliado === null) return;
    fila.precio = tipo === 'EXTERNO' ? Math.max(0, precioAfiliado - 100) : precioAfiliado;
    const inp = document.querySelector(`.producto-precio[data-tipo="compra"][data-row-id="${fila.rowId}"]`);
    if (inp) inp.value = Math.round(fila.precio);
    calcularSubtotalFila('compra', fila.rowId);
  });
}

/**
 * Al escribir el nombre del productor externo, actualiza el panel de info.
 */
function prod_onExternoInput() {
  const nombre    = (document.getElementById('input-nombre-externo')?.value || '').trim();
  const cedula    = (document.getElementById('input-cedula-externo')?.value || '').trim();
  const ubicacion = (document.getElementById('input-ubicacion-externo')?.value || '').trim();
  const telefono  = (document.getElementById('input-telefono-externo')?.value || '').trim();

  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) { el.textContent = val || '—'; val ? el.classList.remove('vacio') : el.classList.add('vacio'); }
  };
  set('prod-nombre',    nombre || null);
  set('prod-cedula',    cedula || 'Sin cédula');
  set('prod-ubicacion', ubicacion || null);

  // currentProductor solo guarda lo que el backend acepta
  if (nombre) {
    currentProductor = {
      tipo: 'EXTERNO',
      nombre_externo:   nombre,
      telefono_externo: telefono,
    };
  } else {
    currentProductor = null;
  }
}

function llenarDatosProductor(productor) {
  currentProductor = { ...productor, tipo: 'AFILIADO' };
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) { el.textContent = val || "—"; el.classList.remove("vacio"); }
  };
  set("prod-nombre", productor.nombre);
  set("prod-cedula", productor.cedula || productor.usuario?.cedula);
  set("prod-ubicacion", productor.finca || productor.ubicacion || productor.direccion);
  // Ocultar badge tipo para afiliados
  const rowTipo = document.getElementById('row-tipo-productor');
  if (rowTipo) rowTipo.style.display = 'none';
}

/**
 * Guarda un productor en el caché local para uso offline.
 * Doble caché: localStorage (instantáneo) + IndexedDB (persistente).
 */
function _prod_guardarCache(productor) {
  try {
    const cedula = (productor.cedula || productor.usuario?.cedula || '').toString().trim();
    if (!cedula) return;
    localStorage.setItem(`cache_op_prod_${cedula}`, JSON.stringify(productor));
    let idx = [];
    try { idx = JSON.parse(localStorage.getItem('cache_op_prod_idx') || '[]'); } catch(_) {}
    if (!idx.includes(cedula)) { idx.push(cedula); localStorage.setItem('cache_op_prod_idx', JSON.stringify(idx)); }
  } catch(_) {}
  // También en IndexedDB para mayor persistencia
  AgroDB.guardarProductorOffline(productor).catch(() => {});
}

function _prod_buscarCacheLocal(cedula) {
  try {
    const raw = localStorage.getItem(`cache_op_prod_${cedula.toString().trim()}`);
    return raw ? JSON.parse(raw) : null;
  } catch(_) { return null; }
}

async function buscarProductorPorCedula(cedula) {
  if (!cedula) { showAlert("Ingresa una cédula para buscar al productor."); return; }
  clearAlert();

  // ── SIN INTERNET: buscar en localStorage primero, luego IndexedDB ──────────
  if (!navigator.onLine) {
    // 1. Intento rápido: localStorage
    const cachedLocal = _prod_buscarCacheLocal(cedula);
    if (cachedLocal) {
      llenarDatosProductor(cachedLocal);
      showAlert("Productor cargado desde caché (sin conexión).", "success");
      return;
    }
    // 2. Intento secundario: IndexedDB
    try {
      const cachedIDB = await AgroDB.obtenerProductorOffline(cedula);
      if (cachedIDB) {
        llenarDatosProductor(cachedIDB);
        showAlert("Productor cargado desde caché (sin conexión).", "success");
        return;
      }
    } catch(_) {}
    showAlert("Sin conexión. Este productor no ha sido visto antes en este dispositivo. Conéctate al menos una vez para cachear sus datos.", "error");
    return;
  }

  // ── CON INTERNET: consulta al servidor + guardar en ambos cachés ──────────
  try {
    const data = await fetchWithAuth(
      `${API_BASE}/operario/productor/${encodeURIComponent(cedula)}`
    );
    const productor = data.productor || data;
    if (!productor) { showAlert("No se encontró productor con esa cédula."); return; }
    llenarDatosProductor(productor);
    _prod_guardarCache(productor); // persiste para uso offline futuro
    showAlert("Productor encontrado correctamente.", "success");
  } catch (error) {
    // Red falló: intentar ambos cachés antes de mostrar error
    const cachedLocal = _prod_buscarCacheLocal(cedula);
    if (cachedLocal) {
      llenarDatosProductor(cachedLocal);
      showAlert("Productor cargado desde caché (error de red).", "success");
      return;
    }
    try {
      const cachedIDB = await AgroDB.obtenerProductorOffline(cedula);
      if (cachedIDB) {
        llenarDatosProductor(cachedIDB);
        showAlert("Productor cargado desde caché (error de red).", "success");
        return;
      }
    } catch(_) {}
    showAlert(`Error al buscar productor: ${error.message}`);
  }
}

// =============================================
// 7. CLIENTE — VENTA (con select de comerciantes)
// =============================================

/**
 * Carga comerciantes desde el backend y puebla el datalist.
 * Se llama al inicializar el panel.
 */
async function cargarComerciantesVenta() {
  // FIX OFFLINE: cargar desde caché si no hay red
  if (!navigator.onLine) {
    const cached = localStorage.getItem('cache_op_comerciantes');
    if (cached) {
      try {
        comerciantes = JSON.parse(cached);
        console.warn('[OFFLINE] Comerciantes desde caché:', comerciantes.length);
        _poblarSelectComerciantes(comerciantes);
        return;
      } catch(_) {}
    }
    console.warn('[OFFLINE] Sin comerciantes en caché');
    return;
  }
  try {
    const data = await fetchWithAuth(`${API_BASE}/comerciantes`);
    comerciantes = Array.isArray(data) ? data : (data.data || []);
    // Guardar para uso offline
    try { localStorage.setItem('cache_op_comerciantes', JSON.stringify(comerciantes)); } catch(_) {}
    _poblarSelectComerciantes(comerciantes);
  } catch (e) {
    console.warn("[COMERCIANTES] Error cargando:", e.message);
    // Fallback a caché si la red falla a medias
    const cached = localStorage.getItem('cache_op_comerciantes');
    if (cached) {
      try { comerciantes = JSON.parse(cached); _poblarSelectComerciantes(comerciantes); } catch(_) {}
    }
  }
}

// Helper: llena el select de comerciantes (extraído para reusar en offline)
function _poblarSelectComerciantes(lista) {
  const sel = document.getElementById("select-comerciante");
  if (!sel) return;
  sel.innerHTML = '<option value="">-- Selecciona un comerciante --</option>';
  lista
    .filter(c => c.activo !== false)
    .forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.id_comerciante;
      opt.textContent = c.nombre;
      opt.dataset.nombre    = c.nombre;
      opt.dataset.telefono  = c.telefono  || "";
      opt.dataset.direccion = c.direccion || "";
      opt.dataset.email     = c.email || c.correo || "";
      sel.appendChild(opt);
    });
}

/**
 * Se dispara mientras el usuario escribe.
 * Actualiza el badge EL PRIMO en tiempo real.
 * También recalcula precios de filas de venta activas.
 */
function com_onInput(valor) {
  const nombre = (valor || "").trim().toUpperCase();

  // Badge EL PRIMO
  const badge = document.getElementById("badge-el-primo");
  if (badge) badge.style.display = (nombre === "EL PRIMO") ? "inline-flex" : "none";

  // Recalcular precios de filas de venta
  filasVenta.forEach(fila => {
    if (!fila.productoId) return;
    const nuevoPrecio = prc_obtenerPrecioVenta(fila.productoId, nombre);
    if (nuevoPrecio === null) return;
    fila.precio = nuevoPrecio;
    const inp = document.querySelector(
      `.producto-precio[data-tipo="venta"][data-row-id="${fila.rowId}"]`
    );
    if (inp) inp.value = Math.round(nuevoPrecio);
    calcularSubtotalFila("venta", fila.rowId);
  });

  // Preview: solo nombre, sin rellenar campos aún
  const setEl = (id, val) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = val || "—";
    val ? el.classList.remove("vacio") : el.classList.add("vacio");
  };
  setEl("cliente-nombre", valor.trim() || "Sin identificar");

  // Si el usuario borró el campo, limpiar currentCliente
  if (!valor.trim()) {
    currentCliente = null;
    _com_limpiarCampos();
    return;
  }

  // Intentar match exacto con la lista de comerciantes
  // (cubre el caso de autocompletado por teclado sin clic en el datalist)
  const matchInput = comerciantes.find(
    c => c.nombre.trim().toUpperCase() === valor.trim().toUpperCase()
  );
  if (matchInput) {
    currentCliente = {
      nombre: matchInput.nombre,
      id_comerciante: matchInput.id_comerciante,
      telefono: matchInput.telefono || "",
      direccion: matchInput.direccion || "",
      email: matchInput.email || matchInput.correo || "",
    };
  } else {
    // Provisional: nombre libre sin comerciante registrado
    currentCliente = { nombre: valor.trim(), id_comerciante: null };
  }
}

/**
 * Se dispara cuando el usuario selecciona una opción del datalist
 * o sale del campo (onchange).
 * Rellena teléfono, dirección y fija currentCliente con id_comerciante.
 */
function com_onSelect(valor) {
  if (!valor.trim()) { limpiarFormCliente(); return; }

  const match = comerciantes.find(
    c => c.nombre.trim().toUpperCase() === valor.trim().toUpperCase()
  );

  if (match) {
    // Rellenar campos automáticamente
    const tel = document.getElementById("input-telefono-venta");
    const dir = document.getElementById("input-direccion-venta");
    if (tel) tel.value = match.telefono || "";
    if (dir) dir.value = match.direccion || "";

    // Actualizar preview
    const setEl = (id, val) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.textContent = val || "—";
      val ? el.classList.remove("vacio") : el.classList.add("vacio");
    };
    setEl("cliente-nombre", match.nombre);
    setEl("cliente-telefono", match.telefono || "—");
    const esEspecial = match.nombre.trim().toUpperCase() === "EL PRIMO";
    setEl("cliente-precio-tipo",
      esEspecial ? "Precio base (EL PRIMO)" : "Precio base + $100/kg"
    );

    currentCliente = {
      nombre: match.nombre,
      id_comerciante: match.id_comerciante,
      telefono: match.telefono || "",
      direccion: match.direccion || "",
      email: match.email || match.correo || "",
    };

    // Recalcular precios con el nombre definitivo
    com_onInput(match.nombre);
  }
}

/**
 * Handler para el <select> nativo de comerciantes.
 * Lee id_comerciante directamente del value del <option> — sin ambigüedad.
 */
function com_onSelectId(selectEl) {
  const opt = selectEl.options[selectEl.selectedIndex];
  if (!opt || !opt.value) {
    limpiarFormCliente();
    return;
  }

  const idComerciante = parseInt(opt.value, 10);
  const nombre    = opt.dataset.nombre    || opt.textContent.trim();
  const telefono  = opt.dataset.telefono  || "";
  const direccion = opt.dataset.direccion || "";
  const email     = opt.dataset.email     || "";

  // Rellenar campos de sólo lectura
  const tel = document.getElementById("input-telefono-venta");
  const dir = document.getElementById("input-direccion-venta");
  if (tel) tel.value = telefono;
  if (dir) dir.value = direccion;

  // Actualizar preview
  const setEl = (id, val) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = val || "—";
    val ? el.classList.remove("vacio") : el.classList.add("vacio");
  };
  setEl("cliente-nombre", nombre);
  setEl("cliente-telefono", telefono || "—");
  const esEspecial = nombre.trim().toUpperCase() === "EL PRIMO";
  setEl("cliente-precio-tipo", esEspecial ? "Precio base (EL PRIMO)" : "Precio base + $100/kg");

  // Badge EL PRIMO
  const badge = document.getElementById("badge-el-primo");
  if (badge) badge.style.display = esEspecial ? "inline-flex" : "none";

  // currentCliente con id_comerciante GARANTIZADO
  currentCliente = {
    nombre,
    id_comerciante: idComerciante,
    telefono,
    direccion,
    email,
  };

  // Recalcular precios de filas de venta
  com_onInput(nombre);
}

/** Limpia campos de solo lectura */
function _com_limpiarCampos() {
  ["input-telefono-venta", "input-direccion-venta"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  const setEl = (id, val) => {
    const el = document.getElementById(id);
    if (el) { el.textContent = val; el.classList.add("vacio"); }
  };
  setEl("cliente-nombre", "Sin identificar");
  setEl("cliente-telefono", "—");
  setEl("cliente-precio-tipo", "—");
}

function limpiarFormCliente() {
  currentCliente = null;
  // Resetear el select
  const sel = document.getElementById("select-comerciante");
  if (sel) sel.value = "";
  _com_limpiarCampos();
  const badge = document.getElementById("badge-el-primo");
  if (badge) badge.style.display = "none";
}

function initClienteVentaListeners() {
  // Garantizar que el badge esté oculto y el select sin selección al cargar.
  const sel = document.getElementById("select-comerciante");
  if (sel && !sel.value) {
    const badge = document.getElementById("badge-el-primo");
    if (badge) badge.style.display = "none";
  }
}

// =============================================
// 8. ESCANER QR
// =============================================

// Estado del escaner
let _lastScannedCedula = '';
let _scanCooldown = false;

/**
 * Inicia el escaner de QR usando Html5QrcodeScanner (alto nivel).
 * Compatible con la mayoria de navegadores moviles sin necesitar
 * manejo manual de constraints de camara.
 */
function startScanner() {
  if (isCameraActive) return;
  if (!getToken()) { showAlert("No hay token de sesion."); return; }

  const btnActivar    = document.getElementById("btn-activar-camara");
  const btnDesactivar = document.getElementById("btn-desactivar-camara");
  const container     = document.getElementById("qr-reader");

  if (!container) {
    showAlert("Error interno: contenedor del escaner no encontrado.");
    return;
  }

  // Limpiar instancia anterior
  if (html5QrCode) {
    try { html5QrCode.clear(); } catch (_) {}
    html5QrCode = null;
  }
  container.innerHTML = "";

  try {
    // Html5QrcodeScanner maneja internamente la seleccion de camara,
    // los permisos y el renderizado del visor — mucho mas robusto que
    // la API de bajo nivel en moviles.
    html5QrCode = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: { width: 220, height: 220 },
        rememberLastUsedCamera: true,
        showTorchButtonIfSupported: true,
        aspectRatio: 1.0,
        videoConstraints: {
          facingMode: "environment",  // camara trasera, sin "exact" para maxima compatibilidad
        },
      },
      /* verbose= */ false
    );

    html5QrCode.render(
      // Exito: se leyo un QR
      (decoded) => {
        if (_scanCooldown) return;
        const cedula = decoded.trim().replace(/\D/g, '') || decoded.trim();
        if (!cedula || cedula === _lastScannedCedula) return;

        _lastScannedCedula = cedula;
        _scanCooldown = true;
        setTimeout(() => { _scanCooldown = false; }, 2500);

        const inputCedula = document.getElementById("input-cedula");
        if (inputCedula) inputCedula.value = cedula;

        // Detener escaner automaticamente tras leer exitosamente
        try { html5QrCode.clear(); } catch (_) {}
        html5QrCode = null;
        isCameraActive = false;
        if (btnActivar)    btnActivar.disabled    = false;
        if (btnDesactivar) btnDesactivar.disabled = true;

        buscarProductorPorCedula(cedula);
        showAlert("QR leido correctamente. Buscando productor...", "success");
      },
      // Error de frame (ignorar — ocurre constantemente cuando no hay QR en camara)
      (_err) => {}
    );

    isCameraActive = true;
    if (btnActivar)    btnActivar.disabled    = true;
    if (btnDesactivar) btnDesactivar.disabled = false;
    showAlert("Camara activada. Apunta al codigo QR del productor.", "success");

  } catch (err) {
    isCameraActive = false;
    if (html5QrCode) {
      try { html5QrCode.clear(); } catch (_) {}
      html5QrCode = null;
    }
    if (btnActivar)    btnActivar.disabled    = false;
    if (btnDesactivar) btnDesactivar.disabled = true;
    showAlert("No se pudo activar la camara: " + (err.message || err));
    console.error("[ESCANER]", err);
  }
}

function stopScanner() {
  const btnActivar    = document.getElementById("btn-activar-camara");
  const btnDesactivar = document.getElementById("btn-desactivar-camara");

  if (html5QrCode) {
    try { html5QrCode.clear(); } catch (_) {}
    html5QrCode = null;
  }

  isCameraActive = false;
  _lastScannedCedula = '';
  _scanCooldown = false;

  const container = document.getElementById("qr-reader");
  if (container) container.innerHTML = "";

  if (btnActivar)    btnActivar.disabled    = false;
  if (btnDesactivar) btnDesactivar.disabled = true;
  showAlert("Camara desactivada.", "success");
}


// =============================================
// TOAST DE CONFIRMACIÓN — Compra / Venta
// =============================================

/**
 * Muestra un toast elegante de operación exitosa.
 * tipo: "compra" | "venta"
 */
function showToastRegistro(tipo) {
  const anterior = document.getElementById("toast-registro");
  if (anterior) anterior.remove();

  const esVenta = tipo === "venta";
  const icono = esVenta ? "fi-rr-check-circle" : "fi-rr-shopping-cart";
  const titulo = esVenta ? "¡Venta registrada!" : "¡Compra registrada!";
  const subtitulo = esVenta
    ? "La venta quedó guardada en el sistema"
    : "La compra quedó guardada correctamente";
  const color = esVenta ? "#2563eb" : "#16a34a";
  const bg = esVenta ? "#eff6ff" : "#f0fdf4";
  const borde = esVenta ? "#bfdbfe" : "#bbf7d0";

  const toast = document.createElement("div");
  toast.id = "toast-registro";
  toast.innerHTML = `
    <div style="display:flex;align-items:center;gap:12px">
      <div style="width:40px;height:40px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;flex-shrink:0">
        <i class="fi ${icono}" style="color:#fff;font-size:1.1rem;line-height:1;display:flex"></i>
      </div>
      <div>
        <div style="font-weight:800;font-size:.95rem;color:#111827">${titulo}</div>
        <div style="font-size:.78rem;color:#6b7280;margin-top:1px">${subtitulo}</div>
      </div>
      <button onclick="this.parentElement.parentElement.remove()"
        style="margin-left:auto;background:none;border:none;cursor:pointer;color:#9ca3af;font-size:1.1rem;padding:4px;line-height:1">✕</button>
    </div>`;

  Object.assign(toast.style, {
    position: "fixed",
    bottom: "88px",
    right: "16px",
    zIndex: "99999",
    background: bg,
    border: "1.5px solid " + borde,
    borderRadius: "14px",
    padding: "14px 16px",
    boxShadow: "0 8px 32px rgba(0,0,0,.14)",
    maxWidth: "320px",
    width: "calc(100vw - 32px)",
    transform: "translateY(20px)",
    opacity: "0",
    transition: "transform .3s cubic-bezier(.34,1.56,.64,1), opacity .25s ease"
  });

  document.body.appendChild(toast);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast.style.transform = "translateY(0)";
      toast.style.opacity = "1";
    });
  });

  setTimeout(() => {
    toast.style.transform = "translateY(20px)";
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// =============================================
// REFRESH SILENCIOSO — sin recargar la página
// Se llama tras cualquier acción (compra, venta,
// cerrar ruta, editar, sincronizar).
// Actualiza solo lo que cambió, en paralelo.
// =============================================

/**
 * Actualiza el historial, dashboard y (si hay ruta activa) la tabla de
 * entregas — todo en paralelo, sin recargar la página ni parpadear la UI.
 *
 * @param {object} opts
 *   vincular  {boolean} — llamar vincular-pendientes antes de cargar entregas
 *   entregas  {boolean} — refrescar tabla de entregas de la ruta activa
 *   dashboard {boolean} — refrescar métricas y últimas ops
 *   historial {boolean} — refrescar historial completo
 *   rutas     {boolean} — refrescar historial de rutas cerradas (ligero)
 */
async function _refrescarTrasAccion({
  vincular  = false,
  entregas  = true,
  dashboard = true,
  historial = false,
  rutas     = false,
} = {}) {
  const tareas = [];

  // 1. Vincular entregas pendientes a la ruta activa
  if (vincular && rutaActiva?.id_ruta && !rutaActiva._offline) {
    tareas.push(
      fetchWithAuth(`${API_BASE}/rutas/${rutaActiva.id_ruta}/vincular-pendientes`, {
        method: 'POST'
      }).catch(() => {})
    );
  }

  // 2. Refrescar tabla de entregas de la ruta activa (en sección Rutas)
  if (entregas && rutaActiva?.id_ruta && !rutaActiva._offline) {
    // Esperar el vincular antes de cargar (si aplica)
    if (vincular) {
      try {
        await fetchWithAuth(`${API_BASE}/rutas/${rutaActiva.id_ruta}/vincular-pendientes`, {
          method: 'POST'
        });
      } catch(_) {}
    }
    tareas.push(rut_cargarEntregas(rutaActiva.id_ruta).catch(() => {}));
  }

  // 3. Refrescar dashboard (métricas + últimas ops)
  if (dashboard) {
    tareas.push(cargarDashboard().catch(() => {}));
  }

  // 4. Refrescar historial de operaciones
  if (historial) {
    tareas.push(cargarHistorial().catch(() => {}));
  }

  // 5. Refrescar historial de rutas cerradas (sin rut_cargarRutas completo)
  if (rutas) {
    tareas.push(
      fetchWithAuth(`${API_BASE}/rutas`)
        .then(data => {
          const lista = Array.isArray(data) ? data : (data.data || []);
          // Actualizar rutaActiva si cambió (ej: cerrar ruta)
          const activa = lista.find(r => r.estado === 'ABIERTA') || null;
          if (!rutaActiva || activa?.id_ruta !== rutaActiva?.id_ruta) {
            rutaActiva = activa;
            rut_actualizarPanel();
          }
          rut_renderHistorial(lista);
        })
        .catch(() => {})
    );
  }

  await Promise.allSettled(tareas);
}


async function registrarEntrega(event) {
  event.preventDefault();
  clearAlert();

  // ── Validar productor según tipo ─────────────────────────────────────
  if (tipoProductorActual === 'EXTERNO') {
    const nombreExt = document.getElementById('input-nombre-externo')?.value?.trim();
    const telefonoExt = document.getElementById('input-telefono-externo')?.value?.trim() || '';

    if (!nombreExt) {
      showAlert("Ingresa el nombre del productor externo.", "error");
      return;
    }

    // Cédula y ubicación son informativos — no bloquean el registro
    // porque la entidad Entrega del backend no tiene esas columnas para externos
    currentProductor = {
      tipo: 'EXTERNO',
      nombre_externo: nombreExt,
      telefono_externo: telefonoExt,
    };
  } else {
    if (!currentProductor?.cedula) {
      showAlert("Primero selecciona un productor (escanea QR o busca por cédula).");
      return;
    }
  }

  if (filasCompra.length === 0) {
    showAlert("Agrega al menos un producto a la compra.");
    return;
  }

  for (const fila of filasCompra) {
    if (!fila.productoId) { showAlert("Selecciona un producto en todas las filas."); return; }
    if (fila.productoId === 'otro' && !fila.otroNombre) {
      showAlert("Escribe el nombre del producto en la fila marcada como 'Otro producto'."); return;
    }
    if (!fila.cantidad || parseFloat(fila.cantidad) <= 0) {
      showAlert("Ingresa cantidades válidas en todos los productos."); return;
    }
    if (!rutaActiva && (!fila.precio || parseFloat(fila.precio) <= 0)) {
      showAlert("El precio no está definido. El admin debe registrar los precios en el módulo PRECIOS.");
      return;
    }
  }

  const btn = document.getElementById("btn-registrar-entrega");
  btn.disabled = true;
  btn.textContent = "Registrando...";

  try {
    const payloads = filasCompra.map(fila => {
      const base = {
        tipo_productor: tipoProductorActual,
        id_producto: fila.productoId === 'otro' ? 'otro' : parseInt(fila.productoId, 10),
        nombre_producto_otro: fila.productoId === 'otro' ? (fila.otroNombre || '') : null,
        peso_kg: parseFloat(fila.cantidad),
        precio_unitario: parseFloat(fila.precio),
        ruta_id: rutaActiva ? rutaActiva.id_ruta : null,
        id_usuario: perfilData?.id_usuario || perfilData?.id || null, // ID del operario que registra
        nombre_operario: perfilData ? [perfilData.nombre, perfilData.apellido].filter(Boolean).join(' ') || null : null, // Nombre completo del operario
      };
      if (tipoProductorActual === 'EXTERNO') {
        // Solo los campos que el backend (Entrega entity) soporta:
        // nombre_productor_externo y telefono_productor_externo
        base.nombre_productor_externo  = currentProductor.nombre_externo;
        base.telefono_productor_externo = currentProductor.telefono_externo || null;
      } else {
        base.cedula_productor = currentProductor.cedula;
      }
      return base;
    });

    if (!navigator.onLine) {
      for (const p of payloads) await AgroSync.encolarCompra(p);
      showToastRegistro("compra");
    } else {
      let exitosasC = 0;
      for (const p of payloads) {
        try {
          await fetchWithAuth(`${API_BASE}/operario/registrar-entrega`, {
            method: "POST",
            body: JSON.stringify(p)
          });
          exitosasC++;
        } catch (err) {
          if (!navigator.onLine || err.name === "TypeError") {
            await AgroSync.encolarCompra(p);
            showAlert("Sin conexión. Compra guardada localmente.", "success");
          } else {
            throw err;
          }
        }
      }
      if (exitosasC > 0) {
        showToastRegistro("compra");
        // Actualizar silenciosamente: vincular + entregas + dashboard, en paralelo
        _refrescarTrasAccion({ vincular: true, entregas: true, dashboard: true }).catch(() => {});
      }
    }

    // Limpiar formulario
    filasCompra = [];
    renderFilas("compra");
    currentProductor = null;
    tipoProductorActual = 'AFILIADO';
    prod_setTipo('AFILIADO');

    const cedInput = document.getElementById("input-cedula");
    if (cedInput) cedInput.value = "";
    const nombreExtInput = document.getElementById("input-nombre-externo");
    if (nombreExtInput) nombreExtInput.value = "";
    const cedulaExtInput = document.getElementById("input-cedula-externo");
    if (cedulaExtInput) cedulaExtInput.value = "";
    const ubicacionExtInput = document.getElementById("input-ubicacion-externo");
    if (ubicacionExtInput) ubicacionExtInput.value = "";
    const telExtInput = document.getElementById("input-telefono-externo");
    if (telExtInput) telExtInput.value = "";
    ["prod-nombre", "prod-cedula", "prod-ubicacion"].forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.textContent = "—"; el.classList.add("vacio"); }
    });

  } catch (error) {
    const msg = error.message || 'Error desconocido';
    showAlert(`Error al registrar la compra: ${msg}`, "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Registrar compra";
  }
}

// =============================================
// 10. REGISTRAR VENTA — adaptado al backend
// =============================================
async function registrarVenta(event) {
  event.preventDefault();
  clearAlert("alert-venta");

  if (!currentCliente) {
    showAlert("Completa al menos el nombre del cliente.", "error", "alert-venta");
    return;
  }
  if (filasVenta.length === 0) {
    showAlert("Agrega al menos un producto a la venta.", "error", "alert-venta");
    return;
  }

  for (const fila of filasVenta) {
    if (!fila.productoId) { showAlert("Selecciona un producto en todas las filas.", "error", "alert-venta"); return; }
    if (!fila.cantidad || parseFloat(fila.cantidad) <= 0) { showAlert("Ingresa cantidades válidas.", "error", "alert-venta"); return; }
    if (!fila.precio || parseFloat(fila.precio) <= 0) {
      showAlert("El precio de uno o más productos no está definido. El admin debe registrar los precios de la semana en el módulo PRECIOS.", "error", "alert-venta");
      return;
    }
  }

  const btn = document.getElementById("btn-registrar-venta");
  btn.disabled = true;
  btn.textContent = "Registrando...";

  try {
    // ── UN SOLO payload con TODOS los productos — genera 1 venta y 1 factura ──
    const payloadVenta = {
      id_comerciante: currentCliente?.id_comerciante ?? null,
      cliente: currentCliente?.nombre || "Sin comerciante",
      id_usuario: perfilData?.id_usuario || perfilData?.id || null,
      nombre_operario: perfilData ? [perfilData.nombre, perfilData.apellido].filter(Boolean).join(' ') || null : null,
      detalles: filasVenta.map(fila => ({
        id_producto: parseInt(fila.productoId, 10),
        cantidad: parseFloat(fila.cantidad),
        precio_unitario: parseFloat(fila.precio),
      })),
    };

    if (!navigator.onLine) {
      await AgroSync.encolarVenta(payloadVenta);
      showToastRegistro("venta");
    } else {
      let ultimaVentaId = null;
      let exitosasV = 0;

      try {
        const respuesta = await fetchWithAuth(`${API_BASE}/operario/registrar-venta`, {
          method: "POST",
          body: JSON.stringify(payloadVenta)
        });
        // Guardar el id de la venta registrada para la factura
        if (respuesta) {
          ultimaVentaId = respuesta.id_venta || respuesta.id || respuesta.data?.id_venta || null;
        }
        exitosasV = 1;
      } catch (err) {
        if (!navigator.onLine || err.name === "TypeError") {
          await AgroSync.encolarVenta(payloadVenta);
          showAlert("Sin conexión. Venta guardada localmente.", "success", "alert-venta");
        } else {
          throw err;
        }
      }

      if (exitosasV > 0) {
        // Capturar datos de la venta antes de limpiar el formulario
        const resumenVenta = {
          id_venta: ultimaVentaId,
          cliente: currentCliente?.nombre || "Sin comerciante",
          email: currentCliente?.email || currentCliente?.correo || "",
          id_comerciante: currentCliente?.id_comerciante ?? null,
          productos: filasVenta.map(f => {
            const prod = productos.find(p => String(p.id_producto || p.id) === String(f.productoId));
            return {
              nombre: prod?.nombre || `Producto #${f.productoId}`,
              cantidad: parseFloat(f.cantidad),
              precio: parseFloat(f.precio),
              subtotal: parseFloat(f.cantidad) * parseFloat(f.precio)
            };
          }),
          total: filasVenta.reduce((s, f) => s + parseFloat(f.cantidad) * parseFloat(f.precio), 0),
          fecha: new Date().toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" })
        };

        // Limpiar formulario ANTES de abrir el modal
        filasVenta = [];
        renderFilas("venta");
        limpiarFormCliente();
        // Actualizar dashboard silenciosamente (sin recargar)
        _refrescarTrasAccion({ vincular: false, entregas: false, dashboard: true }).catch(() => {});

        // Mostrar toast de éxito
        showToastRegistro("venta");

        // Mostrar primero el modal de confirmación de envío de factura
        setTimeout(() => abrirModalConfirmacionFactura(resumenVenta), 400);
        return; // salir aqui para no repetir el limpiar de abajo
      }
    }

    // Limpiar formulario (caso sin internet)
    filasVenta = [];
    renderFilas("venta");
    limpiarFormCliente();
    _refrescarTrasAccion({ vincular: false, entregas: false, dashboard: true }).catch(() => {});

  } catch (error) {
    showAlert(`Error al registrar la venta: ${error.message}`, "error", "alert-venta");
  } finally {
    btn.disabled = false;
    btn.textContent = "Registrar venta";
  }
}

// =============================================
// MODAL CONFIRMACIÓN ENVÍO FACTURA
// =============================================

/**
 * Modal pequeño que aparece justo después de registrar la venta.
 * Pregunta al operario si desea enviar la factura por correo.
 *  - "Enviar"    → abre el modal completo de factura (abrirModalFactura)
 *  - "Presencial / Cancelar" → cierra sin enviar nada
 */
function abrirModalConfirmacionFactura(venta) {
  // Reutilizar el modal si ya existe, o crearlo dinámicamente
  let modal = document.getElementById("modal-confirm-factura");

  if (!modal) {
    modal = document.createElement("div");
    modal.id = "modal-confirm-factura";
    modal.style.cssText = `
      display:none;position:fixed;inset:0;z-index:9999;
      background:rgba(0,0,0,.45);
      align-items:center;justify-content:center;padding:16px;
    `;
    modal.innerHTML = `
      <div id="confirm-factura-card" style="
        background:#fff;border-radius:16px;
        box-shadow:0 8px 40px rgba(0,0,0,.18);
        padding:28px 24px 20px;max-width:360px;width:100%;
        transform:translateY(20px) scale(.97);opacity:0;
        transition:transform .25s ease,opacity .25s ease;
      ">
        <!-- Icono y título -->
        <div style="text-align:center;margin-bottom:18px">
          <div style="width:52px;height:52px;background:#f0fdf4;border-radius:50%;
                      display:flex;align-items:center;justify-content:center;margin:0 auto 12px">
            <i class="fi fi-rr-envelope" style="color:#16a34a;font-size:1.4rem;display:flex"></i>
          </div>
          <h3 style="margin:0 0 6px;font-size:1.05rem;font-weight:800;color:#111827">
            ¿Enviar factura al comerciante?
          </h3>
          <p id="confirm-factura-cliente" style="margin:0;font-size:.85rem;color:#6b7280;font-weight:600"></p>
        </div>

        <!-- Correo actual -->
        <div id="confirm-factura-email-wrap" style="
          background:#f0fdf4;border-radius:10px;padding:10px 14px;
          margin-bottom:16px;display:flex;align-items:center;gap:10px;
        ">
          <i class="fi fi-rr-at" style="color:#16a34a;font-size:1rem;flex-shrink:0;display:flex"></i>
          <div style="min-width:0">
            <div style="font-size:.7rem;color:#9ca3af;font-weight:700;text-transform:uppercase">
              Correo del comerciante
            </div>
            <div id="confirm-factura-email-txt" style="font-size:.9rem;font-weight:700;color:#111827;
              white-space:nowrap;overflow:hidden;text-overflow:ellipsis"></div>
          </div>
        </div>

        <!-- Aviso sin correo -->
        <div id="confirm-factura-sin-email" style="display:none;
          background:#fef3c7;border-radius:10px;padding:10px 14px;margin-bottom:16px;
          font-size:.8rem;color:#92400e;font-weight:600">
          <i class="fi fi-rr-triangle-warning" style="margin-right:5px"></i>
          Este comerciante no tiene correo registrado.
          <br>Puedes escribirlo manualmente o seleccionar <strong>Presencial</strong>.
        </div>

        <!-- Input email manual -->
        <div id="confirm-factura-input-wrap" style="margin-bottom:16px">
          <input type="email" id="confirm-factura-input" placeholder="correo@comerciante.com"
            style="width:100%;box-sizing:border-box;border:1.5px solid #d1d5db;border-radius:8px;
                   padding:10px 12px;font-size:.88rem;outline:none;transition:border-color .2s"
            onfocus="this.style.borderColor='#16a34a'"
            onblur="this.style.borderColor='#d1d5db'"
            onkeydown="if(event.key==='Enter'){event.preventDefault();_confirmFacturaEnviar()}" />
          <div id="confirm-factura-error" style="font-size:.75rem;color:#dc2626;margin-top:4px;min-height:16px"></div>
        </div>

        <!-- Botones -->
        <div style="display:flex;gap:10px">
          <button onclick="_confirmFacturaCancelar()"
            style="flex:1;background:#f3f4f6;color:#374151;border:none;border-radius:8px;
                   padding:11px 0;font-size:.9rem;font-weight:700;cursor:pointer;
                   transition:background .15s"
            onmouseover="this.style.background='#e5e7eb'"
            onmouseout="this.style.background='#f3f4f6'">
            <i class="fi fi-rr-handshake" style="margin-right:5px;vertical-align:middle;display:inline-flex"></i>
            Presencial
          </button>
          <button onclick="_confirmFacturaEnviar()"
            id="confirm-factura-btn-enviar"
            style="flex:1;background:#16a34a;color:#fff;border:none;border-radius:8px;
                   padding:11px 0;font-size:.9rem;font-weight:700;cursor:pointer;
                   transition:background .15s"
            onmouseover="this.style.background='#15803d'"
            onmouseout="this.style.background='#16a34a'">
            <i class="fi fi-rr-paper-plane" style="margin-right:5px;vertical-align:middle;display:inline-flex"></i>
            Enviar factura
          </button>
        </div>

        <!-- Estado del envío -->
        <div id="confirm-factura-estado" style="
          margin-top:12px;text-align:center;font-size:.8rem;font-weight:600;min-height:18px
        "></div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  // Guardar la venta en el modal para usarla al enviar
  modal._ventaData = venta;

  // Rellenar datos del comerciante
  const email = (venta.email || "").trim();
  document.getElementById("confirm-factura-cliente").textContent =
    venta.cliente || "Comerciante";

  if (email) {
    document.getElementById("confirm-factura-email-wrap").style.display = "flex";
    document.getElementById("confirm-factura-email-txt").textContent = email;
    document.getElementById("confirm-factura-sin-email").style.display = "none";
    document.getElementById("confirm-factura-input").value = email;
  } else {
    document.getElementById("confirm-factura-email-wrap").style.display = "none";
    document.getElementById("confirm-factura-sin-email").style.display = "";
    document.getElementById("confirm-factura-input").value = "";
  }

  document.getElementById("confirm-factura-error").textContent = "";
  document.getElementById("confirm-factura-estado").textContent = "";
  const btnEnviar = document.getElementById("confirm-factura-btn-enviar");
  if (btnEnviar) { btnEnviar.disabled = false; btnEnviar.textContent = ""; btnEnviar.innerHTML = '<i class="fi fi-rr-paper-plane" style="margin-right:5px;vertical-align:middle;display:inline-flex"></i> Enviar factura'; }

  // Mostrar modal con animación
  modal.style.display = "flex";
  requestAnimationFrame(() => {
    const card = document.getElementById("confirm-factura-card");
    if (card) { card.style.transform = "translateY(0) scale(1)"; card.style.opacity = "1"; }
  });
}

function _confirmFacturaCancelar() {
  const modal = document.getElementById("modal-confirm-factura");
  if (!modal) return;
  const card = document.getElementById("confirm-factura-card");
  if (card) { card.style.transform = "translateY(20px) scale(.97)"; card.style.opacity = "0"; }
  setTimeout(() => { if (modal) modal.style.display = "none"; }, 250);
}

async function _confirmFacturaEnviar() {
  const modal = document.getElementById("modal-confirm-factura");
  if (!modal) return;

  const email = (document.getElementById("confirm-factura-input")?.value || "").trim();
  const errorEl = document.getElementById("confirm-factura-error");
  const estadoEl = document.getElementById("confirm-factura-estado");
  const btnEnviar = document.getElementById("confirm-factura-btn-enviar");
  const venta = modal._ventaData;

  // Validar email
  if (!email) {
    if (errorEl) { errorEl.textContent = "Ingresa un correo para enviar la factura."; }
    document.getElementById("confirm-factura-input")?.focus();
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    if (errorEl) { errorEl.textContent = "El formato del correo no es válido."; }
    return;
  }
  if (errorEl) errorEl.textContent = "";

  const idVenta = venta?.id_venta || "";

  if (!idVenta) {
    // Offline — solo confirmación visual
    if (estadoEl) { estadoEl.textContent = "✓ Se enviará al sincronizar."; estadoEl.style.color = "#16a34a"; }
    if (btnEnviar) { btnEnviar.disabled = true; btnEnviar.innerHTML = "Enviado ✓"; }
    setTimeout(_confirmFacturaCancelar, 1800);
    return;
  }

  if (btnEnviar) { btnEnviar.disabled = true; btnEnviar.innerHTML = "Enviando..."; }
  if (estadoEl) estadoEl.textContent = "";

  try {
    const res = await fetch(`${API_BASE}/ventas/${idVenta}/estado`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`
      },
      body: JSON.stringify({ estado: "COMPLETADA", email_factura: email })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || `Error ${res.status}`);
    }

    if (estadoEl) { estadoEl.textContent = `✓ Factura enviada a ${email}`; estadoEl.style.color = "#16a34a"; }
    if (btnEnviar) { btnEnviar.innerHTML = "Enviado ✓"; }
    setTimeout(_confirmFacturaCancelar, 2000);

  } catch (e) {
    if (estadoEl) { estadoEl.textContent = `Error: ${e.message}`; estadoEl.style.color = "#dc2626"; }
    if (btnEnviar) { btnEnviar.disabled = false; btnEnviar.innerHTML = '<i class="fi fi-rr-paper-plane" style="margin-right:5px;vertical-align:middle;display:inline-flex"></i> Reintentar'; }
  }
}

// =============================================
// MODAL FACTURA ELECTRÓNICA
// =============================================

/**
 * Abre el modal de factura electrónica al terminar una venta.
 * Muestra el resumen y permite al operario decidir si enviar el correo.
 */
function abrirModalFactura(venta) {
  const modal = document.getElementById("modal-factura");
  if (!modal) return;

  const fmt = n => "$" + parseFloat(n || 0).toLocaleString("es-CO", { minimumFractionDigits: 0 });
  const emailDisponible = !!(venta.email || "").trim();

  // Número de factura provisional (ID o fecha)
  const numFactura = venta.id_venta
    ? String(venta.id_venta).padStart(6, "0")
    : new Date().getTime().toString().slice(-6);

  // Filas de productos
  const filasHTML = (venta.productos || []).map(p => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #f0f4f0;font-size:.88rem;color:#374151">${p.nombre}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f0f4f0;text-align:center;font-size:.88rem;color:#6b7280">${parseFloat(p.cantidad).toFixed(2)} kg</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f0f4f0;text-align:right;font-size:.88rem;color:#6b7280">${fmt(p.precio)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f0f4f0;text-align:right;font-size:.88rem;font-weight:700;color:#166534">${fmt(p.subtotal)}</td>
    </tr>`).join("");

  document.getElementById("factura-numero").textContent = `#${numFactura}`;
  document.getElementById("factura-fecha").textContent = venta.fecha;
  document.getElementById("factura-cliente").textContent = venta.cliente;
  document.getElementById("factura-productos").innerHTML = filasHTML;
  document.getElementById("factura-total").textContent = fmt(venta.total);

  // Sección email
  const secEmail = document.getElementById("factura-sec-email");
  const inputEmail = document.getElementById("factura-input-email");
  const btnEnviar = document.getElementById("factura-btn-enviar");
  const msgSinEmail = document.getElementById("factura-msg-sin-email");

  if (emailDisponible) {
    if (inputEmail) inputEmail.value = venta.email;
    if (secEmail) secEmail.style.display = "";
    if (msgSinEmail) msgSinEmail.style.display = "none";
    if (btnEnviar) {
      btnEnviar.disabled = false;
      btnEnviar.textContent = "Enviar factura al correo";
    }
  } else {
    if (secEmail) secEmail.style.display = "";
    if (inputEmail) inputEmail.value = "";
    if (inputEmail) inputEmail.placeholder = "Escribe el correo del comerciante";
    if (msgSinEmail) msgSinEmail.style.display = "";
    if (btnEnviar) {
      btnEnviar.disabled = false;
      btnEnviar.textContent = "Enviar factura al correo";
    }
  }

  // Guardar id venta para envío
  modal.dataset.idVenta = venta.id_venta || "";
  modal.dataset.emailOriginal = venta.email || "";

  // Estado del botón enviar
  document.getElementById("factura-estado-envio").textContent = "";

  // Mostrar modal con animación
  modal.style.display = "flex";
  requestAnimationFrame(() => modal.classList.add("factura-visible"));
}

function cerrarModalFactura() {
  const modal = document.getElementById("modal-factura");
  if (!modal) return;
  modal.classList.remove("factura-visible");
  setTimeout(() => { modal.style.display = "none"; }, 280);
}

async function enviarFacturaPorCorreo() {
  const modal = document.getElementById("modal-factura");
  const inputEmail = document.getElementById("factura-input-email");
  const btnEnviar = document.getElementById("factura-btn-enviar");
  const estadoEl = document.getElementById("factura-estado-envio");

  const email = (inputEmail?.value || "").trim();
  const idVenta = modal?.dataset.idVenta || "";

  if (!email) {
    estadoEl.textContent = "Ingresa un correo válido para continuar.";
    estadoEl.style.color = "#dc2626";
    inputEmail?.focus();
    return;
  }

  // Validación simple de formato email
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    estadoEl.textContent = "El formato del correo no es válido.";
    estadoEl.style.color = "#dc2626";
    return;
  }

  if (!idVenta) {
    // Sin id de venta: solo confirmación visual (offline o sin respuesta del servidor)
    estadoEl.textContent = "✓ Factura marcada para envío al sincronizar.";
    estadoEl.style.color = "#16a34a";
    if (btnEnviar) { btnEnviar.disabled = true; btnEnviar.textContent = "Enviado ✓"; }
    return;
  }

  if (btnEnviar) { btnEnviar.disabled = true; btnEnviar.textContent = "Enviando..."; }
  estadoEl.textContent = "";

  try {
    const token = localStorage.getItem("token") || "";
    const res = await fetch(`${API_BASE}/ventas/${idVenta}/estado`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ estado: "COMPLETADA", email_factura: email })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || errData.error || `Error ${res.status}`);
    }

    estadoEl.textContent = `✓ Factura enviada a ${email}`;
    estadoEl.style.color = "#16a34a";
    if (btnEnviar) { btnEnviar.textContent = "Enviado ✓"; }

  } catch (e) {
    estadoEl.textContent = `No se pudo enviar: ${e.message}`;
    estadoEl.style.color = "#dc2626";
    if (btnEnviar) { btnEnviar.disabled = false; btnEnviar.textContent = "Reintentar"; }
  }
}

// ─────────────────────────────────────────────────────────
// CACHE MASIVO DE PRODUCTORES
// Extrae productores afiliados de cualquier lista de registros
// y los guarda en localStorage + IndexedDB para uso offline con QR.
// Corre en segundo plano con setTimeout — nunca bloquea la UI.
// ─────────────────────────────────────────────────────────
function _cachearProductoresDeHistorial(registros) {
  if (!Array.isArray(registros)) return;
  setTimeout(() => {
    const vistos = new Set();
    for (const r of registros) {
      const cedula = r.cedula_productor || r.cedula;
      if (!cedula) continue;
      const key = String(cedula);
      if (vistos.has(key)) continue;
      vistos.add(key);
      if (_prod_buscarCacheLocal(key)) continue; // ya en caché, no reescribir
      const nombre = r.nombre_productor || r.nombre || '';
      if (!nombre) continue; // sin nombre no sirve
      _prod_guardarCache({
        cedula:    key,
        nombre,
        finca:     r.finca || r.ubicacion || r.direccion || '',
        direccion: r.direccion || '',
      });
    }
  }, 0);
}

// =============================================
// 11. HISTORIAL
// =============================================

async function cargarHistorial() {
  const token = localStorage.getItem("token");
  if (!token) { window.location.href = "../../frontend/login.html"; return; }

  const tbody = document.getElementById("historial-body");
  if (tbody) tbody.innerHTML = `<tr><td colspan="7" class="table-empty">Cargando...</td></tr>`;

  try {
    // 1. Historial base desde el endpoint principal
    const data = await fetchWithAuth(`${API_BASE}/operario/historial`);
    const historialBase = Array.isArray(data) ? data : [];

    // 2. Fusionar entregas de ruta activa (el backend puede excluirlas hasta cerrar la ruta)
    let entregasRuta = [];
    if (rutaActiva && rutaActiva.id_ruta) {
      try {
        const dataRuta = await fetchWithAuth(`${API_BASE}/rutas/${rutaActiva.id_ruta}/entregas`);
        const lista = Array.isArray(dataRuta) ? dataRuta : (dataRuta.data || []);
        entregasRuta = lista.map(e => ({
          tipo:              "COMPRA",
          fecha:             e.fecha || e.createdAt || rutaActiva.fecha,
          id_productor:      e.id_productor,
          cedula_productor:  e.cedula_productor,
          nombre_productor:  e.nombre_productor || e.nombre_productor_externo,
          nombre_producto:   e.nombre_producto,
          peso_kg:           e.peso_kg,
          cantidad:          e.peso_kg,
          precio_unitario:   e.precio_unitario,
          total:             e.total,
          ruta_id:           rutaActiva.id_ruta,
          id_entrega:        e.id_entrega || e.id,
          estado_liquidacion: e.estado_liquidacion || "PENDIENTE_LIQUIDACION",
          _de_ruta_activa:   true,
        }));
      } catch (eRuta) {
        console.warn("[HISTORIAL] No se pudieron cargar entregas de ruta activa:", eRuta.message);
      }
    }

    // 3. Evitar duplicados: si el historialBase ya trae la entrega, no agregar de nuevo
    const idsEnBase = new Set(
      historialBase
        .filter(r => (r.tipo || "").toUpperCase() === "COMPRA" && r.ruta_id)
        .map(r => String(r.ruta_id) + "_" + String(r.id_entrega || ""))
        .filter(k => !k.endsWith("_"))
    );
    const entregasSinDuplicar = entregasRuta.filter(e => {
      const key = String(e.ruta_id) + "_" + String(e.id_entrega || "");
      return !idsEnBase.has(key);
    });

    // 4. Combinar y ordenar por fecha descendente
    const todos = [...entregasSinDuplicar, ...historialBase].sort((a, b) => {
      const fa = parseFechaLocal(a.fecha || a.fecha_venta || a.fecha_compra);
      const fb = parseFechaLocal(b.fecha || b.fecha_venta || b.fecha_compra);
      return fb - fa;
    });

    historialCompleto = todos;
    renderHistorial(historialCompleto);
    // FIX OFFLINE: persistir historial para consulta sin conexión
    try { localStorage.setItem('cache_op_historial', JSON.stringify(historialCompleto.slice(0, 200))); } catch(_) {}
    // FIX OFFLINE QR: cachear productores afiliados en segundo plano
    _cachearProductoresDeHistorial(todos);
  } catch (error) {
    // FIX OFFLINE: mostrar historial cacheado si no hay red
    const cached = localStorage.getItem('cache_op_historial');
    if (cached) {
      try {
        historialCompleto = JSON.parse(cached);
        renderHistorial(historialCompleto);
        console.warn('[OFFLINE] Historial desde caché:', historialCompleto.length, 'registros');
        return;
      } catch(_) {}
    }
    if (tbody) tbody.innerHTML = `<tr><td colspan="7" class="table-empty">Sin conexión — ${error.message}</td></tr>`;
  }
  // Aplicar filtros UX después de cargar el historial
  _hist_page = 0;
  hist_aplicarFiltros();
}

/**
 * Agrupa compras del mismo productor en la misma fecha en un único objeto.
 * Las ventas se dejan tal cual (ya vienen agrupadas por venta).
 * Devuelve un array mixto de registros agrupados para renderizar.
 */
function agruparComprasPorProductor(registros) {
  const resultado = [];
  // Map: clave "productor_fecha" → índice en resultado
  const mapaCompras = new Map();

  for (const r of registros) {
    const esCompra = (r.tipo || "").toUpperCase() === "COMPRA";

    if (!esCompra) {
      // Las ventas van directo sin agrupar
      resultado.push({ ...r, _agrupado: false });
      continue;
    }

    // Clave de agrupación: productor + fecha (día)
    const nombreProductor = r.nombre_productor || r.nombre_productor_externo || r.cedula_productor || (r.id_productor ? `prod_${r.id_productor}` : 'sin_prod');
    const fechaStr = (r.fecha || r.fecha_compra || r.createdAt || '').split('T')[0];
    const clave = `${nombreProductor}__${fechaStr}`;

    if (mapaCompras.has(clave)) {
      // Ya existe un grupo — agregar este producto al array de productos
      const grupo = resultado[mapaCompras.get(clave)];
      const peso = parseFloat(r.peso_kg || r.cantidad || r.kilos || 0);
      const precioU = parseFloat(r.precio_unitario || 0);
      const subtotal = parseFloat(r.total || 0) || (peso * precioU);

      grupo._productos.push({
        nombre:   r.nombre_producto || r.producto || '—',
        peso_kg:  peso,
        precio_u: precioU,
        subtotal: subtotal,
        idx_original: r._idx_original,
        estado_liquidacion: r.estado_liquidacion,
        ruta_id: r.ruta_id,
      });
      grupo._peso_total += peso;
      grupo._total_suma += subtotal;

      // El estado del grupo es el "peor" estado (si alguno está pendiente, todo pendiente)
      const liqGrupo = grupo.estado_liquidacion || 'PENDIENTE_LIQUIDACION';
      const liqNuevo = r.estado_liquidacion || 'PENDIENTE_LIQUIDACION';
      if (liqNuevo === 'PENDIENTE_LIQUIDACION') grupo.estado_liquidacion = 'PENDIENTE_LIQUIDACION';
      else if (liqNuevo === 'LIQUIDADO' && liqGrupo === 'PAGADO') grupo.estado_liquidacion = 'LIQUIDADO';

    } else {
      // Primer registro de este productor en esta fecha
      const peso = parseFloat(r.peso_kg || r.cantidad || r.kilos || 0);
      const precioU = parseFloat(r.precio_unitario || 0);
      const subtotal = parseFloat(r.total || 0) || (peso * precioU);

      const grupo = {
        ...r,
        _agrupado: true,
        _peso_total: peso,
        _total_suma: subtotal,
        _productos: [{
          nombre:   r.nombre_producto || r.producto || '—',
          peso_kg:  peso,
          precio_u: precioU,
          subtotal: subtotal,
          idx_original: r._idx_original,
          estado_liquidacion: r.estado_liquidacion,
          ruta_id: r.ruta_id,
        }],
      };
      mapaCompras.set(clave, resultado.length);
      resultado.push(grupo);
    }
  }

  return resultado;
}

/**
 * Dibuja la tabla del historial.
 * El índice `idx` se pasa al botón Editar para localizar el registro en el array global.
 * Las compras del mismo productor en la misma fecha se agrupan en una sola fila.
 */
// =============================================
// 11. HISTORIAL — corregido
// =============================================
function renderHistorial(registros) {
  const tbody = document.getElementById("historial-body");
  if (!tbody) return;

  if (!registros?.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="table-empty">Sin registros.</td></tr>`;
    return;
  }

  // Marcar índice original antes de agrupar para poder abrir el modal de edición
  const conIndice = registros.map((r, idx) => ({ ...r, _idx_original: idx }));
  const agrupados = agruparComprasPorProductor(conIndice);

  tbody.innerHTML = agrupados.map((r) => {
    const esCompra = (r.tipo || "").toUpperCase() === "COMPRA";
    const badgeClass = esCompra ? "badge-compra" : "badge-venta";
    const badgeTexto = esCompra ? "Compra" : "Venta";
    const fecha = formatFecha(r.fecha || r.fecha_venta || r.fecha_compra || r.createdAt);

    const quien = esCompra
      ? (r.nombre_productor || r.nombre_productor_externo || (r.id_productor ? `Prod. #${r.id_productor}` : "Sin productor"))
      : (r.nombre || r.cliente || r.nombre_comerciante || "Cliente general");

    // ── Columna Producto ──────────────────────────────────────────
    let productoCol;
    if (esCompra && r._agrupado && r._productos && r._productos.length > 1) {
      // Múltiples productos: mostrar lista compacta con pills
      const pillsHTML = r._productos.map(p =>
        `<span style="display:inline-flex;align-items:center;gap:4px;background:#f0fdf4;border:1px solid #bbf7d0;
          border-radius:99px;padding:2px 8px;font-size:.72rem;font-weight:600;color:#166534;margin:2px 2px 2px 0;white-space:nowrap">
          ${p.nombre}
          <span style="color:#6b7280;font-weight:400">${p.peso_kg > 0 ? p.peso_kg.toFixed(2) + ' kg' : ''}</span>
        </span>`
      ).join('');
      productoCol = `<div style="display:flex;flex-wrap:wrap;gap:2px;align-items:center">${pillsHTML}</div>`;
    } else if (esCompra && r._agrupado && r._productos?.length === 1) {
      productoCol = r._productos[0].nombre;
    } else {
      // Venta o compra sin agrupar
      productoCol = r.nombre_producto || r.producto || "—";
    }

    // ── Columna Peso / Cantidad ───────────────────────────────────
    let volumen;
    if (esCompra && r._agrupado) {
      const total = r._peso_total || 0;
      volumen = total > 0 ? total.toFixed(2) + " kg" : "—";
      if (r._productos && r._productos.length > 1) {
        volumen = `<strong>${total.toFixed(2)} kg</strong><br><span style="font-size:.72rem;color:#6b7280">${r._productos.length} productos</span>`;
      }
    } else {
      const pesoRaw = esCompra
        ? parseFloat(r.peso_kg || r.cantidad || r.kilos || 0)
        : parseFloat(r.cantidad_kg || r.cantidad || r.kilos || 0);
      volumen = pesoRaw > 0 ? pesoRaw.toFixed(2) + " kg" : "—";
    }

    // ── Columna Total ─────────────────────────────────────────────
    let totalCol;
    if (!esCompra) {
      totalCol = `<strong>${formatMoneda(r.total)}</strong>`;
    } else {
      // Para compras agrupadas usar la suma calculada
      const totalNum = r._agrupado ? r._total_suma : (parseFloat(r.total) || 0);
      const liq = r.estado_liquidacion || 'PENDIENTE_LIQUIDACION';
      if (totalNum > 0) {
        totalCol = `<strong>${formatMoneda(totalNum)}</strong>`;
      } else if (liq === 'LIQUIDADO' || liq === 'PAGADO') {
        totalCol = `<strong>${formatMoneda(totalNum)}</strong>`;
      } else {
        totalCol = `<span style="color:#d97706;font-size:.8rem;font-weight:600">
          Pendiente${r.ruta_id ? '<br><span style="font-size:.72rem;color:#9ca3af">Ruta #' + r.ruta_id + '</span>' : ''}
        </span>`;
      }
    }

    // ── Columna Estado (solo compras) ─────────────────────────────
    let estadoCol = '';
    if (esCompra) {
      const liq = r.estado_liquidacion || 'PENDIENTE_LIQUIDACION';
      const liqColor = liq === 'PAGADO'
        ? 'background:#d1fae5;color:#065f46'
        : liq === 'LIQUIDADO'
          ? 'background:#dbeafe;color:#1d4ed8'
          : 'background:#fef3c7;color:#92400e';
      const liqLabel = liq === 'PAGADO' ? 'Pagado'
        : liq === 'LIQUIDADO' ? 'Liquidado' : 'Pendiente';
      estadoCol = `<span style="${liqColor};border-radius:99px;padding:2px 8px;font-size:.7rem;font-weight:700">${liqLabel}</span>`;
    }

    // ── Columna Acciones ──────────────────────────────────────────
    // Para grupos con múltiples productos, el botón edita el primer registro
    const idxEditar = r._idx_original ?? (r._productos?.[0]?.idx_original ?? 0);
    const accionCol = `<button class="btn btn-secondary btn-editar-op"
      onclick="abrirModalEdicion(${idxEditar})"
      title="Editar esta operación">Editar</button>`;

    return `
      <tr>
        <td data-label="Fecha">${fecha}</td>
        <td data-label="Tipo"><span class="badge ${badgeClass}">${badgeTexto}</span></td>
        <td data-label="Productor / Cliente">${quien}</td>
        <td data-label="Producto">${productoCol}</td>
        <td data-label="Peso / Cant.">${volumen}</td>
        <td data-label="Total">${totalCol}</td>
        <td data-label="Estado">${estadoCol}</td>
        <td data-label="Acciones">${accionCol}</td>
      </tr>`;
  }).join("");
}

// =============================================
// 12. GUARDAR EDICIÓN — endpoint y payload corregidos
// =============================================
function filtrarHistorial() {
  const fecha  = document.getElementById("hist-fecha")?.value || "";
  const cedula = (document.getElementById("hist-cedula")?.value || "").toLowerCase().trim();
  const tipo   = (document.getElementById("hist-tipo")?.value || "").toUpperCase();

  let filtrado = historialCompleto;

  if (fecha) {
    // ✅ FIX TIMEZONE: NO usar .split("T")[0] porque para timestamps UTC toma
    // la fecha UTC, no Colombia. parseFechaLocal() convierte correctamente.
    // El input type="date" devuelve 'YYYY-MM-DD' local → parseFechaLocal lo trata bien.
    const tsFiltroDia = parseFechaLocal(fecha);
    filtrado = filtrado.filter(r => {
      const f = r.fecha || r.fecha_venta || r.fecha_compra || r.createdAt || '';
      return parseFechaLocal(f) === tsFiltroDia;
    });
  }

  if (cedula) {
    filtrado = filtrado.filter(r =>
      (r.cedula_productor || r.cedula || "").toLowerCase().includes(cedula) ||
      (r.nombre_productor || r.nombre_productor_externo || r.nombre || r.cliente || r.nombre_comerciante || "").toLowerCase().includes(cedula)
    );
  }

  if (tipo) filtrado = filtrado.filter(r => (r.tipo || "").toUpperCase() === tipo);

  renderHistorial(filtrado);
}

function limpiarFiltros() {
  ["hist-fecha", "hist-cedula"].forEach(id => { const el = document.getElementById(id); if (el) el.value = ""; });
  const tipoEl = document.getElementById("hist-tipo");
  if (tipoEl) tipoEl.value = "";
  renderHistorial(historialCompleto);
}

// =============================================
// 12. MODAL DE EDICIÓN DE OPERACIÓN
// =============================================

/**
 * Abre el modal relleno con los datos del registro seleccionado.
 * idx: posición en historialCompleto (usado para obtener el objeto completo).
 */
function abrirModalEdicion(idx) {
  const operacion = historialCompleto[idx];
  if (!operacion) return;

  operacionEnEdicion = operacion;
  const esCompra = (operacion.tipo || "").toUpperCase() === "COMPRA";

  // Título
  document.getElementById("modal-titulo").textContent = esCompra ? "Editar Compra" : "Editar Venta";

  // Tipo (readonly) y fecha
  document.getElementById("modal-tipo").value = esCompra ? "Compra" : "Venta";
  const rawFecha = operacion.fecha || operacion.fecha_venta || "";
  document.getElementById("modal-fecha").value = rawFecha.toString().split("T")[0];

  // Mostrar sección correspondiente
  document.getElementById("modal-grupo-productor").style.display = esCompra ? "block" : "none";
  document.getElementById("modal-grupo-cliente").style.display = esCompra ? "none" : "block";

  if (esCompra) {
    document.getElementById("modal-productor-nombre").value = operacion.nombre_productor || operacion.productor || "";
    document.getElementById("modal-productor-cedula").value = operacion.cedula_productor || "";
  } else {
    document.getElementById("modal-cliente-nombre").value = operacion.nombre || operacion.cliente || "";
    document.getElementById("modal-cliente-cedula").value = operacion.cedula || "";
  }

  // Inicializar filas del modal
  // Soporta tanto operaciones con array de productos como con producto único
  const productosOp = Array.isArray(operacion.productos) && operacion.productos.length
    ? operacion.productos
    : [{
      id_producto: operacion.id_producto,
      cantidad: operacion.peso || operacion.cantidad || 0,
      precio_unitario: operacion.precio_unitario || 0
    }];

  filasEdicion = productosOp.map(p => ({
    rowId: nextRowId(),
    productoId: String(p.id_producto || ""),
    cantidad: String(p.cantidad || p.peso_kg || 0),
    precio: String(p.precio_unitario || 0)
  }));

  renderFilas("edicion");
  clearDrawerAlert("modal-alert");

  // Abrir como drawer lateral derecho
  document.getElementById("modal-overlay")?.classList.add("active");
  document.getElementById("modal-edicion").classList.add("active");
  document.body.style.overflow = "hidden";
}

function cerrarModalEdicion() {
  document.getElementById("modal-overlay")?.classList.remove("active");
  document.getElementById("modal-edicion").classList.remove("active");
  document.body.style.overflow = "auto";
  operacionEnEdicion = null;
  filasEdicion = [];
}

/**
 * Construye el payload actualizado y lo envía al servidor.
 * PUT /operario/operacion/:id
 */
async function guardarEdicionOperacion() {
  if (!operacionEnEdicion) return;
  clearDrawerAlert("modal-alert");

  if (filasEdicion.length === 0) {
    showDrawerAlert("Agrega al menos un producto.", "error", "modal-alert"); return;
  }
  for (const f of filasEdicion) {
    if (!f.productoId) { showDrawerAlert("Selecciona un producto en todas las filas.", "error", "modal-alert"); return; }
    if (!f.cantidad || parseFloat(f.cantidad) <= 0) { showDrawerAlert("Ingresa cantidades válidas.", "error", "modal-alert"); return; }
  }

  const btn = document.getElementById("btn-guardar-edicion");
  btn.disabled = true;
  btn.textContent = "Guardando...";

  try {
    const esCompra = (operacionEnEdicion.tipo || "").toUpperCase() === "COMPRA";
    const fecha = document.getElementById("modal-fecha").value;

    const productosPayload = filasEdicion.map(f => ({
      id_producto: parseInt(f.productoId, 10),
      peso_kg: parseFloat(f.cantidad),
      precio_unitario: Math.round(parseFloat(f.precio)),   // entero, sin decimales
      subtotal: Math.round(parseFloat(f.cantidad) * parseFloat(f.precio))
    }));
    const total = productosPayload.reduce((s, p) => s + p.subtotal, 0);

    // Payload que espera el backend /operario/editar-entrega/:id
    const payload = {
      fecha,
      peso_kg: productosPayload[0]?.peso_kg,
      precio_unitario: productosPayload[0]?.precio_unitario,
      total: Math.round(total),
      productos: productosPayload,
      ...(!esCompra && {
        nombre: document.getElementById("modal-cliente-nombre").value.trim(),
        cedula_cliente: document.getElementById("modal-cliente-cedula").value.trim()
      })
    };

    // ID de la entrega (el backend usa id_entrega)
    const opId = operacionEnEdicion.id_entrega || operacionEnEdicion.id
      || operacionEnEdicion.id_operacion || operacionEnEdicion.id_venta;

    if (!opId) {
      showDrawerAlert("No se pudo identificar la operación a editar.", "error", "modal-alert");
      return;
    }

    await fetchWithAuth(`${API_BASE}/operario/editar-entrega/${opId}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    });

    showDrawerAlert("Operación actualizada correctamente.", "success", "modal-alert");
    setTimeout(() => {
      cerrarModalEdicion();
      _refrescarTrasAccion({ vincular: false, entregas: true, dashboard: true, historial: true }).catch(() => {});
    }, 1500);
  } catch (error) {
    showDrawerAlert(`Error: ${error.message}`, "error", "modal-alert");
  } finally {
    btn.disabled = false;
    btn.textContent = "Guardar cambios";
  }
}

// Helper: muestra alertas dentro del modal o drawer
function showDrawerAlert(msg, type, containerId = "drawer-alert-perfil") {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.textContent = msg;
  el.className = `drawer-alert active ${type}`;
  if (type === "success") setTimeout(() => el.classList.remove("active"), 3000);
}

function clearDrawerAlert(containerId = "drawer-alert-perfil") {
  const el = document.getElementById(containerId);
  if (el) el.className = "drawer-alert";
}

// =============================================
// 13. PERFIL DE USUARIO
// =============================================

async function cargarPerfil() {
  // FIX OFFLINE: si no hay red, mostrar perfil del caché
  if (!navigator.onLine) {
    const cached = localStorage.getItem('cache_op_perfil');
    if (cached) {
      try {
        perfilData = JSON.parse(cached);
        renderPerfil(perfilData);
        console.warn('[OFFLINE] Perfil desde caché');
        return;
      } catch(_) {}
    }
    // Fallback al usuario del login
    const usuarioLogin = localStorage.getItem('usuario');
    if (usuarioLogin) {
      try { perfilData = JSON.parse(usuarioLogin); renderPerfil(perfilData); } catch(_) {}
    }
    return;
  }
  try {
    const data = await fetchWithAuth(`${API_BASE}/operario/perfil`);
    console.log('[PERFIL DEBUG] Datos recibidos del backend:', data);
    perfilData = data;
    // FIX OFFLINE: guardar perfil para uso sin conexión
    try { localStorage.setItem('cache_op_perfil', JSON.stringify(data)); } catch(_) {}
    renderPerfil(data);
  } catch (error) {
    console.warn("No se pudo cargar el perfil:", error.message);
    // Fallback a caché si hay señal intermitente
    const cached = localStorage.getItem('cache_op_perfil') || localStorage.getItem('usuario');
    if (cached) { try { perfilData = JSON.parse(cached); renderPerfil(perfilData); } catch(_) {} }
  }
}

function renderPerfil(data) {
  if (!data) return;

  // Intentar obtener el nombre de diferentes campos posibles
  const nombre = data.nombre || data.nombre_usuario || data.first_name || "";
  const apellido = data.apellido || data.apellido_usuario || data.last_name || "";
  const nombreCompleto = apellido ? `${nombre} ${apellido}` : nombre;

  // Si aún no hay nombre, intentar extraerlo del email
  const nombreFinal = nombre || (data.email || data.correo || "").split('@')[0] || "Usuario";

  // Campos de sinc (ocultos, usados para leer después)
  const setHidden = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val || "—";
  };
  setHidden("perfil-nombre", nombre);
  setHidden("perfil-apellido", apellido);
  setHidden("perfil-email", data.email || data.correo);
  setHidden("perfil-telefono", data.telefono);
  setHidden("perfil-cedula", data.cedula);
  setHidden("perfil-rol", data.rol || data.role || "Operario");

  // Topbar
  const topbarName = document.getElementById("topbar-user-name");
  if (topbarName) topbarName.textContent = nombreFinal;
  const topbarAvatar = document.getElementById("topbar-avatar");
  if (topbarAvatar) topbarAvatar.textContent = (nombreFinal || "U")[0].toUpperCase();
  const topbarRole = document.getElementById("topbar-user-role");
  if (topbarRole) topbarRole.textContent = data.rol || data.role || "Operario";

  // Drawer header
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val || "—"; };
  set("drawer-nombre", nombreCompleto);
  set("drawer-cedula-badge", data.cedula);
  set("drawer-rol-badge", (data.rol || data.role || "OPERARIO").toUpperCase());
  set("drawer-email-badge", data.email || data.correo);

  // Campos readonly del tab Info
  const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || "—"; };
  setVal("drawer-field-nombre", nombreCompleto);
  setVal("drawer-field-cedula", data.cedula);
  setVal("drawer-field-email", data.email || data.correo);
  setVal("drawer-field-telefono", data.telefono);
  setVal("drawer-field-rol", data.rol || data.role || "Operario");

  // Restaurar foto guardada localmente
  const fotoKey = `foto_perfil_${data.id_usuario || data.id}`;
  const foto = localStorage.getItem(fotoKey);
  const fotoEl = document.getElementById("drawer-photo");
  if (fotoEl && foto) fotoEl.src = foto;
}

function openDrawer() {
  document.getElementById("drawer-overlay")?.classList.add("active");
  document.getElementById("drawer")?.classList.add("active");
  document.body.style.overflow = "hidden";
  mostrarVistaReadonly();     // siempre empieza en modo lectura
  activarTabDrawer("info");   // siempre empieza en tab Info
}

function closeDrawer() {
  document.getElementById("drawer-overlay")?.classList.remove("active");
  document.getElementById("drawer")?.classList.remove("active");
  document.body.style.overflow = "auto";
}

/** Activa el tab indicado y muestra su panel */
function activarTabDrawer(tabNombre) {
  document.querySelectorAll(".drawer-tab").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tab === tabNombre);
  });
  document.querySelectorAll(".tab-pane").forEach(pane => {
    pane.style.display = pane.id === `tab-${tabNombre}` ? "block" : "none";
  });
}

/** Muestra los campos en modo solo lectura */
function mostrarVistaReadonly() {
  document.getElementById("perfil-vista-readonly").style.display = "block";
  document.getElementById("perfil-vista-edicion").style.display = "none";
}

/** Abre el formulario de edición del perfil */
function mostrarVistaEdicion() {
  document.getElementById("perfil-vista-readonly").style.display = "none";
  document.getElementById("perfil-vista-edicion").style.display = "block";
  rellenarFormEdicion();
}

/** Llena el formulario de edición con los valores actuales */
function rellenarFormEdicion() {
  const d = perfilData || {};
  const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val === "—" ? "" : (val || ""); };
  setVal("edit-nombre", d.nombre);
  setVal("edit-apellido", d.apellido);
  setVal("edit-email", d.email || d.correo);
  setVal("edit-telefono", d.telefono);
  setVal("edit-cedula", d.cedula);       // readonly en el HTML
  setVal("edit-rol", d.rol || d.role || "Operario"); // readonly en el HTML
  clearDrawerAlert("drawer-alert-perfil");
}

/**
 * Guarda los cambios del perfil en la API.
 * Cédula y rol no se envían (son solo lectura).
 */
async function guardarPerfil(event) {
  event.preventDefault();
  clearDrawerAlert("drawer-alert-perfil");

  const nombre = document.getElementById("edit-nombre")?.value.trim();
  const apellido = document.getElementById("edit-apellido")?.value.trim();
  const email = document.getElementById("edit-email")?.value.trim();
  const telefono = document.getElementById("edit-telefono")?.value.trim();

  if (!nombre) {
    showDrawerAlert("El nombre es obligatorio.", "error", "drawer-alert-perfil"); return;
  }

  try {
    const body = { nombre };
    if (apellido) body.apellido = apellido;
    if (email) body.email = email;
    if (telefono) body.telefono = telefono;

    const data = await fetchWithAuth(`${API_BASE}/operario/perfil`, {
      method: "PUT",
      body: JSON.stringify(body)
    });

    perfilData = { ...perfilData, ...data };
    renderPerfil(perfilData);
    showDrawerAlert("Perfil actualizado correctamente.", "success", "drawer-alert-perfil");
    setTimeout(() => mostrarVistaReadonly(), 1500);
  } catch (error) {
    showDrawerAlert(`Error: ${error.message}`, "error", "drawer-alert-perfil");
  }
}

// =============================================
// 14. SEGURIDAD — CAMBIO DE CONTRASEÑA
// =============================================

/**
 * Valida las tres contraseñas y envía al backend.
 * Endpoint esperado: POST /operario/cambiar-contrasena
 */
async function cambiarContrasena(event) {
  event.preventDefault();
  clearDrawerAlert("drawer-alert-password");

  const actual = document.getElementById("edit-password-actual")?.value;
  const nueva = document.getElementById("edit-nueva-password")?.value;
  const confirmar = document.getElementById("edit-confirmar-password")?.value;

  if (!actual || !nueva || !confirmar) {
    showDrawerAlert("Completa todos los campos.", "error", "drawer-alert-password"); return;
  }
  if (nueva.length < 8) {
    showDrawerAlert("La nueva contraseña debe tener al menos 8 caracteres.", "error", "drawer-alert-password"); return;
  }
  if (nueva !== confirmar) {
    showDrawerAlert("Las contraseñas nuevas no coinciden.", "error", "drawer-alert-password"); return;
  }

  const btn = document.getElementById("btn-cambiar-password");
  btn.disabled = true;
  btn.textContent = "Guardando...";

  try {
    // El backend actualiza la contraseña via PUT /operario/perfil
    // con el campo 'contrasena' (operario.service.ts → updatePerfil)
    await fetchWithAuth(`${API_BASE}/operario/perfil`, {
      method: "PUT",
      body: JSON.stringify({ contrasena: nueva })
    });

    showDrawerAlert("Contraseña cambiada correctamente.", "success", "drawer-alert-password");
    document.getElementById("form-cambiar-password").reset();
    document.getElementById("password-strength-bar").style.display = "none";
  } catch (error) {
    showDrawerAlert(`Error: ${error.message}`, "error", "drawer-alert-password");
  } finally {
    btn.disabled = false;
    btn.textContent = "Cambiar contraseña";
  }
}

/**
 * Indicador visual de fortaleza de contraseña.
 * Criterios: longitud, mayúsculas, números, caracteres especiales.
 */
function evaluarFortaleza(password) {
  const bar = document.getElementById("password-strength-bar");
  const fill = document.getElementById("strength-fill");
  const label = document.getElementById("strength-label");
  if (!bar || !fill || !label) return;

  if (!password) { bar.style.display = "none"; return; }
  bar.style.display = "flex";

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels = [
    { pct: "20%", color: "#ef4444", text: "Muy débil" },
    { pct: "40%", color: "#f97316", text: "Débil" },
    { pct: "60%", color: "#eab308", text: "Regular" },
    { pct: "80%", color: "#22c55e", text: "Fuerte" },
    { pct: "100%", color: "#16a34a", text: "Muy fuerte" }
  ];
  const level = levels[Math.min(score, 4)];
  fill.style.width = level.pct;
  fill.style.background = level.color;
  label.textContent = level.text;
  label.style.color = level.color;
}

// =============================================
// 15. FOTO DE PERFIL
// =============================================

function cambiarFotoPerfil(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const base64 = e.target.result;
    const fotoKey = `foto_perfil_${perfilData?.id_usuario || perfilData?.id || "user"}`;
    localStorage.setItem(fotoKey, base64);
    const el = document.getElementById("drawer-photo");
    if (el) el.src = base64;
  };
  reader.readAsDataURL(file);
}

// =============================================
// 16. LOGOUT
// =============================================

function logout() { handleLogout(); }
function handleLogout() {
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");
  window.location.href = "../../frontend/login.html";
}

// =============================================
// 17. SIDEBAR TOGGLE
// =============================================

function initSidebarToggle() {
  const sidebar = document.getElementById("sidebar");
  const btnToggle = document.getElementById("btn-toggle-sidebar");
  if (!sidebar || !btnToggle) return;

  // Restaurar estado previo
  if (localStorage.getItem("sidebar-collapsed") === "true") {
    sidebar.classList.add("collapsed");
  }
  btnToggle.addEventListener("click", () => {
    const collapsed = sidebar.classList.toggle("collapsed");
    localStorage.setItem("sidebar-collapsed", collapsed);
  });
}

// =============================================
// 18. EVENT LISTENERS
// =============================================

function initEventListeners() {
  initSidebarToggle();
  initProductFilaEvents(); // delegación de eventos para filas dinámicas

  // --- Cámara ---
  document.getElementById("btn-activar-camara")?.addEventListener("click", startScanner);
  document.getElementById("btn-desactivar-camara")?.addEventListener("click", stopScanner);

  // --- Buscar productor ---
  document.getElementById("btn-buscar-productor")?.addEventListener("click", () => {
    const inputCed = document.getElementById("input-cedula");
    const cedBuscar = (inputCed?.value || '').trim().replace(/\D/g, '') || (inputCed?.value || '').trim();
    buscarProductorPorCedula(cedBuscar);
  });
  document.getElementById("input-cedula")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); buscarProductorPorCedula(document.getElementById("input-cedula").value.trim()); }
  });

  // --- Botones agregar producto ---
  document.getElementById("btn-agregar-compra")?.addEventListener("click", () => agregarFila("compra"));
  document.getElementById("btn-agregar-venta")?.addEventListener("click", () => agregarFila("venta"));
  document.getElementById("btn-agregar-edicion")?.addEventListener("click", () => agregarFila("edicion"));

  // --- Formularios de registro ---
  document.getElementById("form-entrega")?.addEventListener("submit", registrarEntrega);
  document.getElementById("form-venta")?.addEventListener("submit", registrarVenta);

  // --- Cliente (actualización en tiempo real) ---
  initClienteVentaListeners();

  // --- Historial ---
  document.getElementById("btn-filtrar-historial")?.addEventListener("click", filtrarHistorial);
  document.getElementById("btn-limpiar-historial")?.addEventListener("click", limpiarFiltros);
  document.getElementById("hist-cedula")?.addEventListener("input", filtrarHistorial);
  document.getElementById("hist-tipo")?.addEventListener("change", filtrarHistorial);

  // --- Drawer ---
  document.querySelector(".topbar-user")?.addEventListener("click", openDrawer);
  document.getElementById("drawer-close")?.addEventListener("click", closeDrawer);
  document.getElementById("drawer-overlay")?.addEventListener("click", (e) => {
    if (e.target.id === "drawer-overlay") closeDrawer();
  });

  // --- Tabs del drawer ---
  document.querySelectorAll(".drawer-tab").forEach(btn => {
    btn.addEventListener("click", () => activarTabDrawer(btn.dataset.tab));
  });

  // --- Edición de perfil ---
  document.getElementById("btn-editar-perfil")?.addEventListener("click", mostrarVistaEdicion);
  document.getElementById("btn-cancelar-edicion")?.addEventListener("click", mostrarVistaReadonly);
  document.getElementById("form-editar-perfil")?.addEventListener("submit", guardarPerfil);

  // --- Seguridad ---
  document.getElementById("form-cambiar-password")?.addEventListener("submit", cambiarContrasena);
  document.getElementById("edit-nueva-password")?.addEventListener("input", (e) => evaluarFortaleza(e.target.value));

  // --- Foto de perfil ---
  document.getElementById("drawer-photo-btn")?.addEventListener("click", () => {
    document.getElementById("input-foto-perfil")?.click();
  });
  document.getElementById("input-foto-perfil")?.addEventListener("change", cambiarFotoPerfil);

  // --- Modal de edición ---
  document.getElementById("modal-close")?.addEventListener("click", cerrarModalEdicion);
  document.getElementById("btn-cancelar-modal")?.addEventListener("click", cerrarModalEdicion);
  document.getElementById("btn-guardar-edicion")?.addEventListener("click", guardarEdicionOperacion);
  document.getElementById("modal-overlay")?.addEventListener("click", cerrarModalEdicion);

  // --- Logout (sidebar y drawer) ---
  document.getElementById("btn-logout")?.addEventListener("click", handleLogout);
  document.getElementById("drawer-btn-logout")?.addEventListener("click", handleLogout);

  // --- Escape: cierra modal o drawer ---
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (document.getElementById("modal-edicion")?.classList.contains("active")) {
      cerrarModalEdicion();
    } else if (document.getElementById("drawer")?.classList.contains("active")) {
      closeDrawer();
    }
  });

  // --- Navegación entre secciones ---
  document.querySelectorAll(".nav-item").forEach(item => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const sectionId = item.getAttribute("href").substring(1);
      const section = document.getElementById(sectionId);
      if (!section) return;

      document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
      document.querySelectorAll(".content-section").forEach(s => s.classList.remove("active"));
      item.classList.add("active");
      section.classList.add("active");

      const titles = {
        "section-dashboard": "Dashboard",
        "section-escanear": "Registrar compra",
        "section-venta": "Registrar venta",
        "section-rutas": "Mis rutas",
        "section-stock": "Stock",
        "section-historial": "Historial"
      };
      const topbarTitle = document.getElementById("topbar-title");
      if (topbarTitle) topbarTitle.textContent = titles[sectionId] || "Dashboard";

      // Cargar datos al entrar a la sección
      if (sectionId === "section-historial" && historialCompleto.length === 0) cargarHistorial();
      if (sectionId === "section-rutas") rut_cargarRutas();
      if (sectionId === "section-stock") stk_op_cargar();
      if (sectionId === "section-dashboard") cargarDashboard();
    });
  });
}


// =============================================
// RUTAS — Gestión desde el operario
// =============================================

/**
 * Carga todas las rutas del día y determina si hay una activa (ABIERTA).
 * Actualiza el panel de estado y el historial.
 */
async function rut_cargarRutas() {
  try {
    const data = await fetchWithAuth(`${API_BASE}/rutas`);
    const rutas = Array.isArray(data) ? data : (data.data || []);

    // Ruta activa = la más reciente que esté ABIERTA
    rutaActiva = rutas.find(r => r.estado === 'ABIERTA') || null;

    // Si hay ruta activa real en servidor, limpiar la offline guardada localmente
    if (rutaActiva && !rutaActiva._offline) {
      localStorage.removeItem('cache_ruta_offline_activa');
    }

    // Si hay ruta activa, vincular automaticamente entregas sin ruta
    if (rutaActiva) {
      fetchWithAuth(`${API_BASE}/rutas/${rutaActiva.id_ruta}/vincular-pendientes`, {
        method: 'POST'
      }).catch(() => { }); // silencioso — no bloquear la carga
    }

    rut_actualizarPanel();
    rut_renderHistorial(rutas);
    // Persistir rutas en IndexedDB para uso sin conexión
    try {
      for (const r of rutas) {
        await AgroDB.guardarRutaOffline(r);
      }
    } catch(_) {}

    // Si hay ruta activa del servidor, cargar sus entregas
    if (rutaActiva) {
      rut_cargarEntregas(rutaActiva.id_ruta);
    } else {
      const tbody = document.getElementById('rut-entregas-tbody');
      if (tbody) tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;color:#9ca3af">Sin ruta activa</td></tr>';
      const sub = document.getElementById('rut-entregas-subtitle');
      if (sub) sub.textContent = 'Inicia una ruta para ver las entregas';
    }
  } catch (e) {
    console.warn('[RUTAS] Error cargando:', e.message);

    // OFFLINE FALLBACK 1: ruta creada offline y guardada en localStorage
    try {
      const rawOffline = localStorage.getItem('cache_ruta_offline_activa');
      if (rawOffline) {
        const rutaOffline = JSON.parse(rawOffline);
        if (rutaOffline && rutaOffline.estado === 'ABIERTA') {
          rutaActiva = rutaOffline;
          rut_actualizarPanel();
          // Tabla de entregas vacía (las entregas offline se guardan en IndexedDB como compras pendientes)
          const tbody = document.getElementById('rut-entregas-tbody');
          if (tbody) tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;color:#9ca3af">Ruta offline — las entregas se mostrarán al reconectarte.</td></tr>';
          const sub = document.getElementById('rut-entregas-subtitle');
          if (sub) sub.textContent = 'Ruta sin conexión activa';
          console.warn('[OFFLINE] Ruta desde localStorage:', rutaOffline.id_ruta);
          return;
        }
      }
    } catch(_) {}

    // OFFLINE FALLBACK 2: rutas del caché de IndexedDB
    try {
      const rutasOffline = await AgroDB.obtenerRutasOffline();
      if (rutasOffline && rutasOffline.length) {
        rutaActiva = rutasOffline.find(r => r.estado === 'ABIERTA') || null;
        rut_actualizarPanel();
        rut_renderHistorial(rutasOffline);
        console.warn('[OFFLINE] Rutas desde IndexedDB:', rutasOffline.length);
        if (rutaActiva) {
          const tbody = document.getElementById('rut-entregas-tbody');
          if (tbody) tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;color:#9ca3af">Ruta offline — las entregas se mostrarán al reconectarte.</td></tr>';
        }
      }
    } catch(_) {}
  }
}

function rut_actualizarPanel() {
  const panel = document.getElementById('rut-estado-panel');
  const btnNueva = document.getElementById('btn-nueva-ruta');
  const btnCerrar = document.getElementById('btn-cerrar-ruta');
  const cardActiva = document.getElementById('rut-card-activa');
  const cardEntregas = document.getElementById('rut-card-entregas');
  if (!panel) return;

  const sinRuta = document.getElementById('rut-sin-ruta');

  // Asegurarse de que el modal de cierre esté oculto al actualizar el panel
  const modalCierre = document.getElementById('rut-modal-cierre');
  if (modalCierre && !rutaActiva) modalCierre.style.display = 'none';

  if (rutaActiva) {
    if (cardActiva)   cardActiva.style.display   = '';
    if (cardEntregas) cardEntregas.style.display  = '';
    if (sinRuta)      sinRuta.style.display        = 'none';
    panel.innerHTML = `
      <div style="background:#d1fae5;border-radius:10px;padding:14px 16px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-weight:800;color:#065f46;font-size:1rem">Ruta #${rutaActiva.id_ruta} — ABIERTA</span>
          <span style="background:#10b981;color:#fff;padding:2px 10px;border-radius:99px;font-size:.75rem;font-weight:700">ACTIVA</span>
        </div>
        <div style="font-size:.85rem;color:#047857">
          Fecha: ${rutaActiva.fecha || 'Hoy'}<br>
          Entregas registradas: <strong>${rutaActiva.n_entregas ?? 0}</strong>
        </div>
        <p style="margin:8px 0 0;font-size:.8rem;color:#065f46;background:#a7f3d0;padding:8px;border-radius:6px">
          Las entregas que registres en Compras quedarán vinculadas a esta ruta.
          Al terminar el recorrido, cierra la ruta con el flete.
        </p>
      </div>`;
    if (btnNueva)  btnNueva.style.display  = 'none';
    if (btnCerrar) btnCerrar.style.display = 'block';
  } else {
    // Sin ruta activa: ocultar tarjetas, ocultar botón cerrar, ocultar modal
    if (cardActiva)   cardActiva.style.display   = 'none';
    if (cardEntregas) cardEntregas.style.display  = 'none';
    if (sinRuta)      sinRuta.style.display        = '';
    if (btnCerrar)   btnCerrar.style.display       = 'none';
    if (btnNueva)    btnNueva.style.display         = '';
    if (panel)       panel.innerHTML               = '';
    if (modalCierre) modalCierre.style.display     = 'none';
  }
}

// ── Estado de paginación para entregas de ruta activa ──────────────────────
let _rut_ent_todas = [];
let _rut_ent_page  = 0;
const RUT_ENT_PER_PAGE = 8;

function rut_ent_renderPagina() {
  const tbody = document.getElementById('rut-entregas-tbody');
  if (!tbody) return;

  const total    = _rut_ent_todas.length;
  const totalPag = Math.max(1, Math.ceil(total / RUT_ENT_PER_PAGE));
  if (_rut_ent_page >= totalPag) _rut_ent_page = totalPag - 1;
  const slice = _rut_ent_todas.slice(
    _rut_ent_page * RUT_ENT_PER_PAGE,
    (_rut_ent_page + 1) * RUT_ENT_PER_PAGE
  );

  // La ruta está abierta → precio y subtotal SIEMPRE son "Pendiente"
  // (se calculan al cerrar la ruta con el flete, nunca antes)
  tbody.innerHTML = slice.map(e => `
    <tr style="border-bottom:1px solid #f3f4f6">
      <td data-label="Productor" style="padding:8px;font-size:.88rem;font-weight:600">
        ${e.nombre_productor || e.nombre_productor_externo || ('Prod. #' + e.id_productor)}
      </td>
      <td data-label="Producto" style="padding:8px;font-size:.88rem">
        ${e.nombre_producto || ('Prod. #' + e.id_producto)}
      </td>
      <td data-label="Kg" style="padding:8px;text-align:left;font-weight:700;font-size:.88rem;color:#166534">
        ${Number(e.peso_kg || 0).toFixed(2)} kg
      </td>
      <td data-label="Precio/kg" style="padding:8px;text-align:left;font-size:.82rem">
        <span style="color:#d97706;font-weight:600;font-size:.78rem">Pendiente<br>
          <span style="color:#9ca3af;font-size:.7rem;font-weight:400">Se calcula al cerrar</span>
        </span>
      </td>
      <td data-label="Subtotal" style="padding:8px;text-align:left;font-size:.82rem">
        <span style="color:#d97706;font-weight:600;font-size:.78rem">—</span>
      </td>
    </tr>`).join('');

  // Paginación
  const pag  = document.getElementById('rut-ent-pagination');
  const info = document.getElementById('rut-ent-info');
  const prev = document.getElementById('rut-ent-prev');
  const next = document.getElementById('rut-ent-next');
  if (pag)  pag.style.display  = totalPag > 1 ? 'flex' : 'none';
  if (info) info.textContent   = `Página ${_rut_ent_page + 1} de ${totalPag}`;
  if (prev) prev.disabled      = _rut_ent_page === 0;
  if (next) next.disabled      = _rut_ent_page >= totalPag - 1;
}

function rut_ent_paginar(dir) {
  _rut_ent_page += dir;
  rut_ent_renderPagina();
}

async function rut_cargarEntregas(id_ruta) {
  const subtitle = document.getElementById('rut-entregas-subtitle');
  const tbody    = document.getElementById('rut-entregas-tbody');
  if (!tbody) return;

  try {
    const data    = await fetchWithAuth(`${API_BASE}/rutas/${id_ruta}/entregas`);
    const entregas = Array.isArray(data) ? data : (data.data || []);

    // Acumular kg totales para preview de precio al cerrar ruta
    rutaActivaKgTotal = entregas.reduce((sum, e) => sum + Number(e.peso_kg || 0), 0);

    if (subtitle) subtitle.textContent =
      `${entregas.length} entrega${entregas.length !== 1 ? 's' : ''} registradas — ${rutaActivaKgTotal.toFixed(2)} kg totales`;

    if (!entregas.length) {
      if (subtitle) subtitle.textContent = 'Sin entregas registradas en esta ruta';
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;color:#9ca3af">Registra compras para verlas aquí</td></tr>';
      const pag = document.getElementById('rut-ent-pagination');
      if (pag) pag.style.display = 'none';
      return;
    }

    _rut_ent_todas = entregas;
    _rut_ent_page  = 0;
    rut_ent_renderPagina();

    // FIX OFFLINE QR: cachear cada productor afiliado de la ruta
    // para que su QR funcione sin internet en la próxima salida
    for (const e of entregas) {
      if (!e.cedula_productor) continue;
      if (_prod_buscarCacheLocal(e.cedula_productor)) continue;
      _prod_guardarCache({
        cedula:    String(e.cedula_productor),
        nombre:    e.nombre_productor || '',
        finca:     e.finca || e.ubicacion || '',
        direccion: e.direccion || '',
        ...(e.productor || {}),
      });
    }

  } catch (e) {
    console.warn('[RUTAS] Error cargando entregas:', e.message);
  }
}

function rut_renderHistorial(rutas) {
  // Alimentar estado UX de paginacion (fusionado del wrapper)
  _rut_todas = (rutas || []).filter(r => r.estado === 'CERRADA');
  rut_aplicarFiltro();

  const tbody = document.getElementById('rut-historial-tbody');
  if (!tbody) return;

  const cerradas = _rut_todas;
  if (!cerradas.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:#9ca3af">Sin rutas cerradas</td></tr>';
    return;
  }

  const fmt = n => n != null ? `$${Number(n).toLocaleString('es-CO')}` : '—';
  tbody.innerHTML = cerradas.map(r => `
    <tr style="border-bottom:1px solid #f3f4f6;cursor:pointer"
        onclick="rut_verEntregasRuta(${r.id_ruta}, '${r.fecha || ''}')">
      <td data-label="FECHA" style="padding:8px;font-size:.85em;color:#6b7280">${r.fecha || '—'}</td>
      <td data-label="ENTREGA" style="padding:8px;text-align:left">${r.n_entregas ?? '—'}</td>
      <td data-label="KILOS" style="padding:8px;text-align:left">${r.total_kilos != null ? Number(r.total_kilos).toLocaleString('es-CO') + ' kg' : '—'}</td>
      <td data-label="PRECIO" style="padding:8px;text-align:left;font-weight:700;color:#15803d">${r.precio_final_kg != null ? fmt(r.precio_final_kg) + '/kg' : '—'}</td>
      <td data-label="ESTADO" style="padding:8px;text-align:left">
        <span style="font-size:.75rem;padding:2px 8px;border-radius:99px;background:#d1fae5;color:#065f46;font-weight:700">CERRADA</span>
      </td>
      <td data-label="DETALLE" style="padding:8px;text-align:left">
        <button style="font-size:.75rem;padding:3px 8px;border-radius:6px;background:#f0fdf4;color:#166534;border:1px solid #bbf7d0;cursor:pointer"
                onclick="event.stopPropagation();rut_verEntregasRuta(${r.id_ruta}, '${r.fecha || ''}')">
          Ver entregas
        </button>
      </td>
    </tr>`).join('');
}

async function rut_verEntregasRuta(id_ruta, fecha) {
  try {
    const data = await fetchWithAuth(`${API_BASE}/rutas/${id_ruta}/entregas`);
    const entregas = Array.isArray(data) ? data : (data.data || []);
    const fmt = n => n != null ? '$' + Number(n).toLocaleString('es-CO') : '—';
    const fmtKg = n => n != null ? Number(n).toFixed(2) + ' kg' : '—';

    if (!entregas.length) {
      showAlert('Esta ruta no tiene entregas registradas.', 'error');
      return;
    }

    // Agrupar entregas por productor para el PDF detallado
    const porProductor = {};
    for (const e of entregas) {
      const key = e.id_productor || ('ext_' + (e.nombre_productor || 'desconocido'));
      if (!porProductor[key]) {
        porProductor[key] = {
          nombre: e.nombre_productor || 'Sin nombre',
          cedula: e.cedula_productor || '—',
          productos: [],
          totalProductor: 0,
        };
      }
      const subtotal = Number(e.total) || 0;
      porProductor[key].productos.push({
        nombre: e.nombre_producto || ('Producto #' + e.id_producto),
        cantidad: Number(e.peso_kg) || 0,
        precio_kg: e.precio_unitario != null ? Number(e.precio_unitario) : null,
        subtotal,
      });
      porProductor[key].totalProductor += subtotal;
    }

    const totalGeneral = entregas.reduce((s, e) => s + (Number(e.total) || 0), 0);

    // Construir filas HTML por productor
    const bloquesProductores = Object.values(porProductor).map(prod => {
      const filasProductos = prod.productos.map(p => `
        <tr>
          <td style="padding:6px 8px;padding-left:24px;color:#374151">${p.nombre}</td>
          <td style="padding:6px 8px;text-align:center">${fmtKg(p.cantidad)}</td>
          <td style="padding:6px 8px;text-align:right">${p.precio_kg != null ? fmt(p.precio_kg) + '/kg' : 'Pendiente'}</td>
          <td style="padding:6px 8px;text-align:right;font-weight:600">${p.subtotal > 0 ? fmt(p.subtotal) : '—'}</td>
        </tr>`).join('');

      return `
        <tr style="background:#f0fdf4">
          <td colspan="2" style="padding:8px;font-weight:700;color:#166534">
            ${prod.nombre}
            <span style="font-weight:400;color:#6b7280;font-size:.88em"> — Cedula: ${prod.cedula}</span>
          </td>
          <td colspan="2" style="padding:8px;text-align:right;font-weight:700;color:#15803d">
            ${prod.totalProductor > 0 ? fmt(prod.totalProductor) : '—'}
          </td>
        </tr>
        ${filasProductos}`;
    }).join('');

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Ruta de Recoleccion #${id_ruta}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #111; padding: 24px; max-width: 720px; margin: 0 auto; }
    h1 { font-size: 1.2rem; color: #166534; margin-bottom: 4px; }
    .meta { color: #6b7280; font-size: .88rem; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    thead tr { background: #166534; color: #fff; }
    thead th { padding: 8px; text-align: left; font-size: .85rem; font-weight: 600; }
    thead th:not(:first-child) { text-align: right; }
    thead th:nth-child(2) { text-align: center; }
    tbody tr:nth-child(even):not([style*="background"]) { background: #f9fafb; }
    td { border-bottom: 1px solid #e5e7eb; font-size: .88rem; }
    .total-row { background: #166534 !important; color: #fff; }
    .total-row td { padding: 10px 8px; font-weight: 800; font-size: 1rem; border: none; }
    @media print {
      body { padding: 12px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <h1>Ruta de Recoleccion #${id_ruta}</h1>
  <p class="meta">Fecha: ${fecha || 'Sin fecha'} &nbsp;|&nbsp; ${entregas.length} entrega(s) registrada(s)</p>

  <table>
    <thead>
      <tr>
        <th>Productor / Producto</th>
        <th style="text-align:center">Cantidad</th>
        <th style="text-align:right">Precio/kg</th>
        <th style="text-align:right">Subtotal</th>
      </tr>
    </thead>
    <tbody>
      ${bloquesProductores}
      <tr class="total-row">
        <td colspan="3">TOTAL GENERAL</td>
        <td style="text-align:right">${fmt(totalGeneral)}</td>
      </tr>
    </tbody>
  </table>

  <p class="no-print" style="margin-top:20px;text-align:center">
    <button onclick="window.print()" style="background:#166534;color:#fff;border:none;padding:10px 28px;border-radius:6px;font-size:1rem;cursor:pointer;font-weight:600">
      Imprimir / Guardar PDF
    </button>
    <button onclick="window.close()" style="background:#f3f4f6;color:#374151;border:1px solid #d1d5db;padding:10px 20px;border-radius:6px;font-size:1rem;cursor:pointer;margin-left:8px">
      Cerrar
    </button>
  </p>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=760,height=600');
    if (!win) { showAlert('El navegador bloqueo la ventana emergente. Permite las ventanas emergentes para este sitio.', 'error'); return; }
    win.document.write(html);
    win.document.close();

  } catch (e) {
    showAlert('Error al cargar entregas: ' + e.message, 'error');
  }
}

async function rut_crearRuta() {
  if (!confirm('¿Iniciar una nueva ruta de recolección para hoy?')) return;

  // ── SIN INTERNET: crear ruta local en IndexedDB y localStorage ─────────────
  if (!navigator.onLine) {
    const rutaOfflineId = 'OFFLINE-' + Date.now();
    const rutaOffline = {
      id:          rutaOfflineId,   // clave IndexedDB
      id_ruta:     rutaOfflineId,   // usado por toda la UI
      estado:      'ABIERTA',
      fecha:       new Date().toISOString().split('T')[0],
      n_entregas:  0,
      _offline:    true,
      timestamp:   Date.now()
    };
    await AgroDB.guardarRutaOffline(rutaOffline);
    // Persistir también en localStorage para que rut_cargarRutas lo encuentre
    try { localStorage.setItem('cache_ruta_offline_activa', JSON.stringify(rutaOffline)); } catch(_) {}

    rutaActiva = rutaOffline;
    rut_actualizarPanel();
    // Mostrar panel de entregas vacío
    const tbody = document.getElementById('rut-entregas-tbody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;color:#9ca3af">Sin entregas aún — registra compras para vincularlas.</td></tr>';
    const pag = document.getElementById('rut-ent-pagination');
    if (pag) pag.style.display = 'none';
    showAlert('Ruta iniciada sin conexión. Se sincronizará al recuperar señal.', 'success');

    // Cuando recupere red: crear en servidor y vincular
    window.addEventListener('online', async function _syncRuta() {
      window.removeEventListener('online', _syncRuta);
      try {
        await fetchWithAuth(`${API_BASE}/rutas`, { method: 'POST', body: JSON.stringify({}) });
        localStorage.removeItem('cache_ruta_offline_activa');
        await rut_cargarRutas();
        if (rutaActiva && !rutaActiva._offline) {
          await fetchWithAuth(`${API_BASE}/rutas/${rutaActiva.id_ruta}/vincular-pendientes`, {
            method: 'POST'
          }).catch(() => {});
          rut_cargarEntregas(rutaActiva.id_ruta);
          showAlert('Ruta sincronizada con el servidor. Compras vinculadas.', 'success');
        }
      } catch(e) { console.warn('[RUTA OFFLINE SYNC]', e.message); }
    }, { once: true });
    return;
  }

  // ── CON INTERNET: flujo normal ────────────────────────────────────────────
  showAlert('Creando ruta...', 'success');
  try {
    await fetchWithAuth(`${API_BASE}/rutas`, { method: 'POST', body: JSON.stringify({}) });
    await rut_cargarRutas();
    if (rutaActiva) {
      try {
        const res = await fetchWithAuth(`${API_BASE}/rutas/${rutaActiva.id_ruta}/vincular-pendientes`, {
          method: 'POST'
        });
        const vinculadas = res?.vinculadas ?? res?.count ?? 0;
        if (vinculadas > 0) {
          showAlert(`Ruta iniciada. ${vinculadas} compra(s) previas vinculadas automáticamente.`, 'success');
        } else {
          showAlert('Ruta iniciada. Ahora registra las entregas normalmente.', 'success');
        }
        rut_cargarEntregas(rutaActiva.id_ruta);
      } catch (_) {
        showAlert('Ruta iniciada. Ahora registra las entregas normalmente.', 'success');
      }
    } else {
      showAlert('Ruta iniciada. Ahora registra las entregas normalmente.', 'success');
    }
  } catch (e) {
    showAlert('Error al crear ruta: ' + e.message, 'error');
  }
}

function rut_previsualizarPrecio() {
  const flete = parseFloat(document.getElementById('rut-input-flete').value) || 0;
  const preview = document.getElementById('rut-preview-precio');
  if (!preview) return;

  const idProducto = rutaActiva?.id_producto;
  const precioInfo = idProducto
    ? (preciosActuales || []).find(p => p.id_producto == idProducto)
    : (preciosActuales?.[0]);
  const precioBase = precioInfo?.precio_base_kg ?? null;
  const totalKg = rutaActivaKgTotal > 0 ? rutaActivaKgTotal : null;

  if (!flete || flete <= 0) { preview.style.display = 'none'; return; }

  if (!precioBase) {
    preview.style.display = 'block';
    preview.style.background = '#fef3c7';
    preview.style.color = '#92400e';
    preview.textContent = 'Sin precio base configurado — el admin debe registrar el precio semanal.';
    return;
  }

  if (!totalKg) {
    preview.style.display = 'block';
    preview.style.background = '#eff6ff';
    preview.style.color = '#1e40af';
    preview.textContent = `Precio base: $${Number(precioBase).toLocaleString('es-CO')}/kg — aún no hay entregas en esta ruta.`;
    return;
  }

  const costoTransporte   = flete / totalKg;
  const precioSinTransp   = Number(precioBase) - costoTransporte;
  const descuento         = precioSinTransp * 0.035;
  const precioFinal       = precioSinTransp - descuento;
  const precioExterno     = Math.max(0, precioFinal - 100);

  if (precioFinal <= 0) {
    preview.style.display = 'block';
    preview.style.background = '#fee2e2';
    preview.style.color = '#991b1b';
    preview.innerHTML =
      `Advertencia: Flete demasiado alto — precio quedaría en $${precioFinal.toFixed(0)}/kg<br>` +
      `<span style="font-size:.78rem;font-weight:400">` +
      `Flete ÷ ${totalKg.toFixed(1)} kg = $${costoTransporte.toFixed(0)}/kg de transporte, ` +
      `base $${Number(precioBase).toLocaleString('es-CO')}. Reduce el flete.</span>`;
  } else {
    preview.style.display = 'block';
    preview.style.background = '#d1fae5';
    preview.style.color = '#065f46';
    preview.innerHTML =
      `Precio afiliado: <strong>$${Math.round(precioFinal).toLocaleString('es-CO')}/kg</strong> &nbsp;|&nbsp; ` +
      `Externo: <strong>$${Math.round(precioExterno).toLocaleString('es-CO')}/kg</strong><br>` +
      `<span style="font-size:.78rem;font-weight:400">` +
      `${totalKg.toFixed(1)} kg — Total est. afiliados: $${Math.round(totalKg * precioFinal).toLocaleString('es-CO')}</span>`;
  }
}

function rut_abrirModalCierre() {
  if (!rutaActiva) {
    showAlert('No hay ninguna ruta activa para cerrar.', 'error');
    return;
  }
  const modal = document.getElementById('rut-modal-cierre');
  if (modal) {
    modal.style.display = 'flex';
    document.getElementById('rut-input-flete').value = '';
    document.getElementById('rut-modal-resultado').style.display = 'none';
    const preview = document.getElementById('rut-preview-precio');
    if (preview) preview.style.display = 'none';
  }
}

function rut_cerrarModal() {
  const modal = document.getElementById('rut-modal-cierre');
  if (modal) modal.style.display = 'none';
}

async function rut_confirmarCierre() {
  const flete = parseFloat(document.getElementById('rut-input-flete').value);
  if (!flete || flete <= 0) {
    showAlert('Ingresa un valor de flete válido.', 'error');
    return;
  }
  if (!rutaActiva) {
    showAlert('No hay ruta activa.', 'error');
    return;
  }

  const btn = document.querySelector('#rut-modal-cierre .btn-primary');
  if (btn) { btn.disabled = true; btn.textContent = 'Calculando...'; }

  try {
    const res = await fetchWithAuth(`${API_BASE}/rutas/${rutaActiva.id_ruta}/cerrar`, {
      method: 'POST',
      body: JSON.stringify({ flete })
    });

    const r = res.ruta || res;
    const calc = res.calculo || {};
    const fmt = n => n != null ? `$${Number(n).toLocaleString('es-CO')}` : '—';

    const resultado = document.getElementById('rut-modal-resultado');
    resultado.style.display = 'block';
    resultado.innerHTML = `
      <strong>Ruta cerrada exitosamente</strong><br>
      Entregas liquidadas: <strong>${res.entregas_liquidadas}</strong><br>
      Total kg: <strong>${calc.total_kilos} kg</strong><br>
      Flete: <strong>${fmt(calc.flete)}</strong><br>
      Precio base: <strong>${fmt(calc.precio_base_kg)}/kg</strong><br>
      Precio final: <strong style="color:#15803d;font-size:1.1rem">${fmt(r.precio_final_kg)}/kg</strong><br>
      <em style="font-size:.78rem">${calc.formula || ''}</em>`;

    // Actualizar UI localmente de inmediato — sin esperar el fetch
    rutaActiva = null;
    rut_actualizarPanel();
    // Refrescar historial de rutas y dashboard en background
    _refrescarTrasAccion({ vincular: false, entregas: false, dashboard: true, rutas: true }).catch(() => {});

    setTimeout(() => rut_cerrarModal(), 4000);
  } catch (e) {
    const msg = e.message || 'Error desconocido';
    // Mensajes amigables para errores comunes
    if (msg.includes('no tiene entregas')) {
      showAlert('Esta ruta no tiene entregas registradas. Registra compras vinculadas a esta ruta antes de cerrarla.', 'error');
    } else if (msg.includes('precio activo')) {
      showAlert('No hay precio configurado para el producto. El admin debe registrar el precio en el módulo PRECIOS.', 'error');
    } else if (msg.includes('precio final calculado')) {
      showAlert('El flete es muy alto — el precio final sería negativo. Verifica el valor del flete.', 'error');
    } else {
      showAlert('Error al cerrar ruta: ' + msg, 'error');
    }
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Calcular y cerrar'; }
  }
}

// =============================================
// 19. INICIALIZACIÓN
// =============================================

function init() {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "../../frontend/login.html";
    return;
  }

  initEventListeners();

  // FIX OFFLINE: si no hay red, mostrar banner y cargar desde caché
  if (!navigator.onLine) {
    const bar = document.createElement('div');
    bar.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:9999;background:#1f2937;color:#fff;text-align:center;padding:8px;font-size:.82rem;font-weight:600';
    bar.textContent = '📵 Sin conexión — mostrando datos guardados. Las compras se guardarán y sincronizarán al recuperar señal.';
    document.body.prepend(bar);
    window.addEventListener('online', () => bar.remove(), { once: true });
  }

  cargarProductos();           // catálogo de productos (con caché offline)
  cargarPreciosActuales();     // precios activos (con caché offline)
  cargarComerciantesVenta();   // comerciantes (con caché offline)
  rut_cargarRutas();           // rutas (con IndexedDB offline)

  // Mobile nav — Stock
  const mnavStock = document.getElementById('mnav-stock');
  if (mnavStock) {
    mnavStock.addEventListener('click', () => {
      document.querySelectorAll('.mobile-nav-item').forEach(b => b.classList.remove('active'));
      mnavStock.classList.add('active');
      document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
      const sec = document.getElementById('section-stock');
      if (sec) sec.classList.add('active');
      stk_op_cargar();
    });
  }
  cargarDashboard();
  cargarPerfil();
}

document.addEventListener("DOMContentLoaded", init);

// ── AUTO-REFRESH DE RUTAS EN SEGUNDO PLANO ────────────────────────────────────
// Cada 30s refresca silenciosamente la ruta activa y sus entregas
// para que el operario vea cambios sin recargar la página.
setInterval(() => {
  if (!navigator.onLine) return;
  rut_cargarRutas().catch(() => {});
}, 30_000);

// Recargar historial cuando AgroSync sincronice datos offline
window.addEventListener("agrotrace:sincronizado", () => {
  cargarHistorial();
  cargarDashboard();
  cargarPreciosActuales();  // refrescar precios tras sincronización
});
//  MENÚ USUARIO
let panelAbierto = false;

function togglePanelUsuario() {

  const menu = document.getElementById('hp_menu');
  const chevron = document.getElementById('hp_chevron');

  panelAbierto = !panelAbierto;

  menu.classList.toggle('show', panelAbierto);
  chevron?.classList.toggle('abierto', panelAbierto);
}
document.addEventListener('click', (e) => {

  if (
    panelAbierto &&
    !e.target.closest('.hp-trigger') &&
    !e.target.closest('.hp-menu')
  ) {

    panelAbierto = false;

    document.getElementById('hp_menu')?.classList.remove('show');
    document.getElementById('hp_chevron')?.classList.remove('abierto');
  }

});


// ════════════════════════════════════════════════════════════════════════
//  STOCK — Vista Operario (solo lectura)
// ════════════════════════════════════════════════════════════════════════

let _stk_op_datos = [];

async function stk_op_cargar() {
  try {
    const data = await fetchWithAuth(`${API_BASE}/stock`);
    _stk_op_datos = Array.isArray(data) ? data : [];
    stk_op_renderCards();
    await stk_op_cargarMovimientos();
  } catch (e) {
    console.error('[STOCK-OP]', e.message);
    showAlert('Error al cargar stock: ' + e.message, 'error');
  }
}

function stk_op_renderCards() {
  const container = document.getElementById('stk_op_cards');
  if (!container) return;

  if (!_stk_op_datos.length) {
    container.innerHTML = '<p style="color:#9ca3af;font-size:.85rem;grid-column:1/-1">Sin datos de stock disponibles.</p>';
    return;
  }

  const fmt = n => new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(Number(n ?? 0));

  container.innerHTML = _stk_op_datos.map(s => {
    const kilos = Math.max(0, Number(s.kilos_disponibles ?? 0));
    const color = kilos <= 0 ? '#dc2626' : kilos < 50 ? '#d97706' : '#16a34a';
    const bg = kilos <= 0 ? '#fee2e2' : kilos < 50 ? '#fef3c7' : '#f0fdf4';
    const label = kilos <= 0 ? ' Sin stock' : kilos < 50 ? ' Stock bajo' : ' Disponible';

    return '<div style="background:' + bg + ';border-radius:12px;padding:16px;text-align:center">'
      + '<div style="font-size:.95rem;color:' + color + ';font-weight:700;text-transform:uppercase;margin-bottom:6px">' + (s.producto || '—') + '</div>'
      + '<div style="font-size:2.4rem;font-weight:800;color:' + color + '">' + fmt(kilos) + '</div>'
      + '<div style="font-size:.9rem;color:' + color + ';margin-top:2px;font-weight:600">kg disponibles</div>'
      + '<div style="font-size:.82rem;margin-top:6px;font-weight:700;color:' + color + '">' + label + '</div>'
      + '</div>';
  }).join('');
}

async function stk_op_cargarMovimientos() {
  try {
    const movs = await fetchWithAuth(`${API_BASE}/stock/movimientos`);
    // Alimentar estado UX para pills/filtros (fusionado del wrapper)
    _stk_movs_todos = Array.isArray(movs) ? movs : [];
    stk_aplicarFiltro();

    // Tabla legacy (primeros 20)
    const tbody = document.getElementById('stk_op_tbody');
    if (!tbody) return;
    const lista = _stk_movs_todos.slice(0, 20);

    if (!lista.length) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;color:#9ca3af">Sin movimientos recientes</td></tr>';
      return;
    }

    const fmt = n => new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(Number(n ?? 0)) + ' kg';
    const fmtF = f => f ? new Date(f).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

    tbody.innerHTML = lista.map(m => {
      var entrada = m.tipo === 'ENTRADA';
      return '<tr style="border-bottom:1px solid #f3f4f6">'
        + '<td data-label="FECHA" style="padding:10px 10px;font-size:.88rem;color:#6b7280">' + fmtF(m.fecha) + '</td>'
        + '<td data-label="TIPO" style="padding:10px 10px"><span style="background:' + (entrada ? '#d1fae5' : '#fee2e2') + ';color:' + (entrada ? '#065f46' : '#dc2626') + ';border-radius:99px;padding:3px 10px;font-size:.8rem;font-weight:700">' + (entrada ? 'Entrada' : 'Salida') + '</span></td>'
        + '<td data-label="PRODUCTO" style="padding:10px 10px;font-weight:700;font-size:.9rem">' + (m.producto || '—') + '</td>'
        + '<td data-label="KILOS" style="padding:10px 10px;text-align:right;font-weight:800;font-size:.95rem;color:' + (entrada ? '#16a34a' : '#dc2626') + '">' + (entrada ? '+' : '-') + fmt(m.kilos) + '</td>'
        + '<td data-label="ORIGEN" style="padding:10px 10px;font-size:.85rem;color:#6b7280">' + (m.referencia_tipo || '—') + ' #' + (m.referencia_id || '—') + '</td>'
        + '</tr>';
    }).join('');
  } catch (e) {
    const tbodyErr = document.getElementById('stk_op_tbody');
    if (tbodyErr) tbodyErr.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;color:#9ca3af">Error al cargar movimientos</td></tr>';
    const grid = document.getElementById('stk-mov-cards');
    if (grid) grid.innerHTML = '<p style="color:#9ca3af;text-align:center;padding:20px 0">Error al cargar movimientos</p>';
  }
}

// Polling 30s cuando sección stock está activa
setInterval(function () {
  var sec = document.getElementById('section-stock');
  if (sec && sec.classList.contains('active')) stk_op_cargar();
}, 30000);

// ══════════════════════════════════════════════════════════════
// UX MÓDULOS — Historial · Rutas · Stock (Mobile-first)
// ══════════════════════════════════════════════════════════════

// ────────────────────────────────────────
// HISTORIAL — estado
// ────────────────────────────────────────
let _hist_filtrado = [];
let _hist_page = 0;
const HIST_PER_PAGE = 12;

let _hist_tipo = '';
let _hist_periodo = 'todo';
let _hist_desde = null;
let _hist_hasta = null;
let _hist_busqueda = '';

// Inicializar pills del historial
function hist_initPills() {
  // Pills tipo
  document.querySelectorAll('#hist-pills-tipo .ux-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#hist-pills-tipo .ux-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      _hist_tipo = btn.dataset.tipo;
      _hist_page = 0;
      hist_aplicarFiltros();
    });
  });

  // Pills período
  document.querySelectorAll('#hist-pills-periodo .ux-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#hist-pills-periodo .ux-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      _hist_periodo = btn.dataset.periodo;
      const customEl = document.getElementById('hist-custom-dates');
      if (customEl) customEl.style.display = _hist_periodo === 'custom' ? 'flex' : 'none';
      if (_hist_periodo !== 'custom') {
        _hist_desde = null;
        _hist_hasta = null;
        _hist_page = 0;
        hist_aplicarFiltros();
      }
    });
  });

  // Buscador
  const searchInput = document.getElementById('hist-cedula');
  const clearBtn = document.getElementById('hist-search-clear');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      _hist_busqueda = searchInput.value.trim().toLowerCase();
      if (clearBtn) clearBtn.style.display = _hist_busqueda ? 'flex' : 'none';
      _hist_page = 0;
      hist_aplicarFiltros();
    });
  }
}

function hist_limpiarBusqueda() {
  const inp = document.getElementById('hist-cedula');
  const btn = document.getElementById('hist-search-clear');
  if (inp) inp.value = '';
  if (btn) btn.style.display = 'none';
  _hist_busqueda = '';
  _hist_page = 0;
  hist_aplicarFiltros();
}

function hist_aplicarFechaCustom() {
  _hist_desde = document.getElementById('hist-fecha-desde')?.value || null;
  _hist_hasta = document.getElementById('hist-fecha-hasta')?.value || null;
  _hist_page = 0;
  hist_aplicarFiltros();
}

function hist_getFechaRango() {
  const hoy = new Date();
  hoy.setHours(23, 59, 59, 999);
  if (_hist_periodo === 'todo') return { desde: null, hasta: null };
  if (_hist_periodo === 'custom') return { desde: _hist_desde, hasta: _hist_hasta };
  const desde = new Date();
  desde.setHours(0, 0, 0, 0);
  if (_hist_periodo === 'semana') desde.setDate(hoy.getDate() - 6);
  if (_hist_periodo === 'mes') desde.setDate(1);
  if (_hist_periodo === 'anio') { desde.setMonth(0); desde.setDate(1); }
  return { desde: desde.toISOString().split('T')[0], hasta: hoy.toISOString().split('T')[0] };
}

function hist_aplicarFiltros() {
  let datos = historialCompleto || [];

  // Filtro tipo
  if (_hist_tipo) datos = datos.filter(r => (r.tipo || '').toUpperCase() === _hist_tipo);

  // Filtro período
  const { desde, hasta } = hist_getFechaRango();
  if (desde || hasta) {
    datos = datos.filter(r => {
      const f = (r.fecha || r.fecha_venta || r.fecha_compra || r.createdAt || '').split('T')[0];
      if (desde && f < desde) return false;
      if (hasta && f > hasta) return false;
      return true;
    });
  }

  // Filtro búsqueda
  if (_hist_busqueda) {
    datos = datos.filter(r =>
      (r.cedula_productor || r.cedula || '').toLowerCase().includes(_hist_busqueda) ||
      (r.nombre_productor || r.nombre_productor_externo || r.nombre || r.cliente || r.nombre_comerciante || '').toLowerCase().includes(_hist_busqueda)
    );
  }

  _hist_filtrado = datos;
  const label = document.getElementById('hist-count-label');
  if (label) label.textContent = `${datos.length} registro${datos.length !== 1 ? 's' : ''}`;
  hist_renderPagina();
}

function hist_renderPagina() {
  const total = _hist_filtrado.length;
  const totalPag = Math.max(1, Math.ceil(total / HIST_PER_PAGE));
  if (_hist_page >= totalPag) _hist_page = totalPag - 1;
  const slice = _hist_filtrado.slice(_hist_page * HIST_PER_PAGE, (_hist_page + 1) * HIST_PER_PAGE);

  // Reutilizar renderHistorial existente
  renderHistorial(slice);

  // Paginación
  const pag = document.getElementById('hist-pagination');
  const info = document.getElementById('hist-page-info');
  const prev = document.getElementById('hist-prev');
  const next = document.getElementById('hist-next');
  if (pag) pag.style.display = totalPag > 1 ? 'flex' : 'none';
  if (info) info.textContent = `${_hist_page + 1} / ${totalPag}`;
  if (prev) prev.disabled = _hist_page === 0;
  if (next) next.disabled = _hist_page >= totalPag - 1;
}

function hist_paginar(dir) {
  _hist_page += dir;
  hist_renderPagina();
  document.getElementById('section-historial')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// renderHistorial no necesita wrapper (eliminado)

// ────────────────────────────────────────
// RUTAS — paginación + tarjetas + filtro
// ────────────────────────────────────────
let _rut_todas = [];
let _rut_filtradas = [];
let _rut_page = 0;
let _rut_periodo = 'todo';
const RUT_PER_PAGE = 12;

function rut_initPills() {
  document.querySelectorAll('#rut-pills-periodo .ux-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#rut-pills-periodo .ux-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      _rut_periodo = btn.dataset.rperiodo;
      _rut_page = 0;
      rut_aplicarFiltro();
    });
  });
}

function rut_getFechaRango() {
  const hoy = new Date(); hoy.setHours(23,59,59,999);
  if (_rut_periodo === 'todo') return { desde: null, hasta: null };
  const desde = new Date(); desde.setHours(0,0,0,0);
  if (_rut_periodo === 'semana') desde.setDate(hoy.getDate() - 6);
  if (_rut_periodo === 'mes')    { desde.setDate(1); }
  if (_rut_periodo === 'anio')   { desde.setMonth(0); desde.setDate(1); }
  return { desde: desde.toISOString().split('T')[0], hasta: hoy.toISOString().split('T')[0] };
}

function rut_aplicarFiltro() {
  const { desde, hasta } = rut_getFechaRango();
  _rut_filtradas = _rut_todas.filter(r => {
    if (!desde && !hasta) return true;
    const f = (r.fecha || '').split('T')[0];
    if (desde && f < desde) return false;
    if (hasta && f > hasta) return false;
    return true;
  });
  _rut_page = 0;
  rut_renderPagina();
}

function rut_renderPagina() {
  const total = _rut_filtradas.length;
  const totalPag = Math.max(1, Math.ceil(total / RUT_PER_PAGE));
  if (_rut_page >= totalPag) _rut_page = totalPag - 1;
  const slice = _rut_filtradas.slice(_rut_page * RUT_PER_PAGE, (_rut_page + 1) * RUT_PER_PAGE);

  // Contador
  const countLabel = document.getElementById('rut-count-label');
  if (countLabel) countLabel.textContent = `${total} ruta${total !== 1 ? 's' : ''}`;

  // Tbody con data-label (mismo patrón que historial)
  const tbody = document.getElementById('rut-historial-tbody');
  if (tbody) {
    if (!slice.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="table-empty">Sin rutas en este período</td></tr>';
    } else {
      const fmt = n => n != null ? '$' + Number(n).toLocaleString('es-CO') : '—';
      const fmtKg = n => n != null ? Number(n).toLocaleString('es-CO') + ' kg' : '—';
      tbody.innerHTML = slice.map(r => `
        <tr style="cursor:pointer" onclick="rut_verEntregasRuta(${r.id_ruta},'${r.fecha||''}')">
          <td data-label="Fecha">${r.fecha || '—'}</td>
          <td data-label="Entregas">${r.n_entregas ?? '—'}</td>
          <td data-label="Kg totales"><strong style="color:#15803d">${fmtKg(r.total_kilos)}</strong></td>
          <td data-label="Precio/kg">${r.precio_final_kg != null ? '<strong>' + fmt(r.precio_final_kg) + '/kg</strong>' : '<span style="color:#d97706;font-size:.8rem;font-weight:600">Pendiente</span>'}</td>
          <td data-label="Estado"><span style="background:#d1fae5;color:#065f46;border-radius:99px;padding:2px 10px;font-size:.72rem;font-weight:700">CERRADA</span></td>
          <td data-label="Acciones">
            <button class="btn btn-secondary" style="font-size:.75rem;padding:4px 12px"
              onclick="event.stopPropagation();rut_verEntregasRuta(${r.id_ruta},'${r.fecha||''}')">Ver</button>
          </td>
        </tr>`).join('');
    }
  }

  // Paginación
  const pag = document.getElementById('rut-pagination');
  const info = document.getElementById('rut-page-info');
  const prev = document.getElementById('rut-prev');
  const next = document.getElementById('rut-next');
  if (pag) pag.style.display = totalPag > 1 ? 'flex' : 'none';
  if (info) info.textContent = `${_rut_page + 1} / ${totalPag}`;
  if (prev) prev.disabled = _rut_page === 0;
  if (next) next.disabled = _rut_page >= totalPag - 1;
}

function rut_paginar(dir) {
  _rut_page += dir;
  rut_renderPagina();
}

// rut_renderHistorial wrapper eliminado

// ────────────────────────────────────────
// STOCK — submenu + paginación
// ────────────────────────────────────────
let _stk_movs_todos = [];
let _stk_movs_filtrados = [];
let _stk_page = 0;
let _stk_tab = 'disponible'; // 'disponible' | 'entrada' | 'salida'
let _stk_periodo = 'todo';
let _stk_desde = null;
let _stk_hasta = null;
const STK_PER_PAGE = 12;

function stk_initPills() {
  // Pills tipo (Todos/Entradas/Salidas)
  document.querySelectorAll('#stk-pills .ux-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#stk-pills .ux-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      _stk_tab = btn.dataset.stab;
      _stk_page = 0;
      stk_aplicarFiltro();
    });
  });

  // Pills período
  document.querySelectorAll('#stk-pills-periodo .ux-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#stk-pills-periodo .ux-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      _stk_periodo = btn.dataset.speriodo;
      const customEl = document.getElementById('stk-custom-dates');
      if (customEl) customEl.style.display = _stk_periodo === 'custom' ? 'flex' : 'none';
      if (_stk_periodo !== 'custom') {
        _stk_desde = null; _stk_hasta = null;
        _stk_page = 0;
        stk_aplicarFiltro();
      }
    });
  });
}

function stk_aplicarFechaCustom() {
  _stk_desde = document.getElementById('stk-fecha-desde')?.value || null;
  _stk_hasta = document.getElementById('stk-fecha-hasta')?.value || null;
  _stk_page = 0;
  stk_aplicarFiltro();
}

function stk_aplicarFiltro() {
  // 'disponible' en el nuevo diseño = mostrar todos los movimientos
  let datos = _stk_tab === 'disponible'
    ? _stk_movs_todos.slice()
    : _stk_movs_todos.filter(m =>
        _stk_tab === 'entrada' ? m.tipo === 'ENTRADA' : m.tipo !== 'ENTRADA'
      );

  // Período
  const hoy = new Date(); hoy.setHours(23,59,59,999);
  let desde = null, hasta = null;
  if (_stk_periodo === 'custom') { desde = _stk_desde; hasta = _stk_hasta; }
  else if (_stk_periodo !== 'todo') {
    const d = new Date(); d.setHours(0,0,0,0);
    if (_stk_periodo === 'semana') d.setDate(hoy.getDate() - 6);
    if (_stk_periodo === 'mes')    d.setDate(1);
    if (_stk_periodo === 'anio')   { d.setMonth(0); d.setDate(1); }
    desde = d.toISOString().split('T')[0];
    hasta = hoy.toISOString().split('T')[0];
  }
  if (desde || hasta) {
    datos = datos.filter(m => {
      const f = (m.fecha || '').split('T')[0];
      if (desde && f < desde) return false;
      if (hasta && f > hasta) return false;
      return true;
    });
  }

  _stk_movs_filtrados = datos;
  const label = document.getElementById('stk-count-label');
  if (label) label.textContent = `${datos.length} movimiento${datos.length !== 1 ? 's' : ''}`;
  stk_renderPagina();
}

function stk_renderPagina() {
  const total = _stk_movs_filtrados.length;
  const totalPag = Math.max(1, Math.ceil(total / STK_PER_PAGE));
  if (_stk_page >= totalPag) _stk_page = totalPag - 1;
  const slice = _stk_movs_filtrados.slice(_stk_page * STK_PER_PAGE, (_stk_page + 1) * STK_PER_PAGE);

  const tbody = document.getElementById('stk-mov-tbody');
  if (tbody) {
    const fmtF = f => f ? new Date(f).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
    const fmtK = n => new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(Number(n ?? 0));
    if (!slice.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="table-empty">Sin movimientos en este período</td></tr>';
    } else {
      tbody.innerHTML = slice.map(m => {
        const entrada = m.tipo === 'ENTRADA';
        const tipoBadge = entrada
          ? '<span style="background:#d1fae5;color:#065f46;border-radius:99px;padding:2px 10px;font-size:.72rem;font-weight:700">Entrada</span>'
          : '<span style="background:#fee2e2;color:#dc2626;border-radius:99px;padding:2px 10px;font-size:.72rem;font-weight:700">Salida</span>';
        const kgColor = entrada ? '#16a34a' : '#dc2626';
        const kgPrefix = entrada ? '+' : '-';
        return `<tr>
          <td data-label="Fecha">${fmtF(m.fecha)}</td>
          <td data-label="Tipo">${tipoBadge}</td>
          <td data-label="Producto">${m.producto || '—'}</td>
          <td data-label="Kilos"><strong style="color:${kgColor}">${kgPrefix}${fmtK(m.kilos)} kg</strong></td>
          <td data-label="Origen">${m.referencia_tipo || '—'} #${m.referencia_id || '—'}</td>
        </tr>`;
      }).join('');
    }
  }

  const pag = document.getElementById('stk-pagination');
  const info = document.getElementById('stk-page-info');
  const prev = document.getElementById('stk-prev');
  const next = document.getElementById('stk-next');
  if (pag) pag.style.display = totalPag > 1 ? 'flex' : 'none';
  if (info) info.textContent = `${_stk_page + 1} / ${totalPag}`;
  if (prev) prev.disabled = _stk_page === 0;
  if (next) next.disabled = _stk_page >= totalPag - 1;
}

function stk_paginar(dir) {
  _stk_page += dir;
  stk_renderPagina();
}

// stk_op_cargarMovimientos wrapper eliminado

// ────────────────────────────────────────
// INIT — arrancar todos los pills al cargar
// ────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  // Pequeño delay para que el DOM esté listo
  setTimeout(() => {
    hist_initPills();
    rut_initPills();
    stk_initPills();
  }, 300);
});

// NOTA: el post-procesado de hist_aplicarFiltros fue movido
// directamente al final de cargarHistorial() para evitar recursión infinita.

// ─────────────────────────────────────────────────────────
// LISTENER SYNC — al terminar AgroSync, refrescar la vista
// de la ruta activa sin que el operario recargue la app.
// ─────────────────────────────────────────────────────────
window.addEventListener('agrotrace:synced', async (e) => {
  const { comprasOk = 0, ventasOk = 0 } = e.detail || {};
  if (comprasOk + ventasOk === 0) return;

  try {
    await _refrescarTrasAccion({
      vincular:  comprasOk > 0,
      entregas:  comprasOk > 0,
      dashboard: true,
      historial: false,
      rutas:     false,
    });
  } catch (err) {
    console.warn('[SYNC LISTENER] Error al refrescar vista:', err);
  }
});