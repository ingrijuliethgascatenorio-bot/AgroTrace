const API_URL = '/api'; // FIX: relativa — funciona en cualquier entorno

// ── Guard: solo PRODUCTOR entra a productor.html ──────────────────────────────
// auth-guard.js debe cargarse ANTES que productor.js en el HTML:
//   <script src="../auth-guard.js"></script>
//   <script src="productor.js"></script>
AuthGuard.require('PRODUCTOR');

// ── Estado global ──────────────────────────────────────
let _perfil = null;
let _historial = [];
let _panelAbierto = false;

// ── Token ──────────────────────────────────────────────
function getToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token') || '';
}
function getHeaders() {
    const t = getToken();
    return t
        ? { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` }
        : { 'Content-Type': 'application/json' };
}

// Wrapper fetch with auth + no-cache to prevent stale responses
async function apiFetch(url, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    // FIX OFFLINE: no usar 'no-store' — eso impide que el SW cachee las respuestas.
    // Usar 'default' para GET (SW puede interceptar y devolver caché si no hay red).
    // Para mutaciones (POST/PUT/PATCH/DELETE) va directo sin caché.
    const cacheMode = method === 'GET' ? 'default' : 'no-store';
    const res = await fetch(url, {
        ...options,
        headers: { ...getHeaders(), ...(options.headers || {}) },
        cache: cacheMode,
    });
    return res;
}

// ── Loading ────────────────────────────────────────────
function showLoading() { document.getElementById('prd_loading')?.classList.add('show'); }
function hideLoading() { document.getElementById('prd_loading')?.classList.remove('show'); }

// ── Formatters ─────────────────────────────────────────
function fmtCOP(n) {
    if (n == null || n === '') return '—';
    return '$' + Number(n).toLocaleString('es-CO', { minimumFractionDigits: 0 });
}
function fmtKg(n) {
    if (n == null) return '—';
    return Number(n).toLocaleString('es-CO') + ' kg';
}
function fmtFecha(f) {
    if (!f) return '—';
    const d = new Date(f);
    return isNaN(d) ? f : d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}
function saludo() {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días,';
    if (h < 18) return 'Buenas tardes,';
    return 'Buenas noches,';
}
function animarNum(id, target, suffix = '') {
    const el = document.getElementById(id);
    if (!el) return;
    const dur = 900, t0 = performance.now();
    const run = (now) => {
        const p = Math.min((now - t0) / dur, 1);
        const v = Math.round(target * (1 - Math.pow(1 - p, 3)));
        el.textContent = v.toLocaleString('es-CO') + suffix;
        if (p < 1) requestAnimationFrame(run);
    };
    requestAnimationFrame(run);
}

// ── Badge estado ───────────────────────────────────────
function badgeEstado(estado) {
    const e = (estado || 'pendiente').toLowerCase();
    const mapa = {
        pagado: 'badge-pagado',
        pendiente: 'badge-pendiente',
        procesando: 'badge-procesando',
        pagada: 'badge-pagado',
    };
    const cls = mapa[e] || 'badge-pendiente';
    const label = e.charAt(0).toUpperCase() + e.slice(1);
    return `<span class="badge ${cls}">${label}</span>`;
}

// ══════════════════════════════════════════════════════
//  NAVEGACIÓN
// ══════════════════════════════════════════════════════
function mostrarSeccion(id) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-btn[data-section]').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.bn-item[data-section]').forEach(b => b.classList.remove('active'));

    const sec = document.getElementById(id);
    if (sec) sec.classList.add('active');

    const btn = document.querySelector(`.nav-btn[data-section="${id}"]`);
    if (btn) btn.classList.add('active');

    const bnBtn = document.querySelector(`.bn-item[data-section="${id}"]`);
    if (bnBtn) bnBtn.classList.add('active');


    const titulos = {
        inicio: 'Inicio',
        historial: 'Mis entregas',
        perfil: 'Mi perfil',
        'mi-qr': 'Mi código QR',
        'mis-ingresos': 'Mis ingresos',
    };
    const tp = document.getElementById('topbar_title');
    if (tp) tp.textContent = titulos[id] || '';

    if (id === 'inicio') { cargarResumen(); cargarPreviewEntregas(); }
    if (id === 'historial') cargarHistorial();
    if (id === 'mis-ingresos' && window.ING) ING.cargar();
    if (id === 'perfil') cargarPerfil();
    if (id === 'mi-qr') cargarQR();
}

// Sidebar toggle
document.addEventListener('DOMContentLoaded', () => {
    // FIX OFFLINE: NO borrar el caché al cargar — lo necesitamos si no hay red.
    // Antes borraba cache_historial, cache_preview y cache_resumen al inicio,
    // lo que destruía el fallback offline en cada recarga.
    // (eliminado: localStorage.removeItem('cache_historial/preview/resumen'))

    // FIX OFFLINE: banner si no hay conexión al iniciar
    if (!navigator.onLine) {
        const bar = document.createElement('div');
        bar.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:9999;background:#1f2937;color:#fff;text-align:center;padding:8px 16px;font-size:.82rem;font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px';
        bar.innerHTML = '<span>📵</span><span>Sin conexión — mostrando tus datos guardados</span>';
        document.body.prepend(bar);
        window.addEventListener('online', () => {
            bar.remove();
            cargarResumen();
            cargarPreviewEntregas();
        }, { once: true });
    }
    const toggle = document.getElementById('menu_toggle');
    if (toggle) {
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            document.getElementById('sidebar').classList.toggle('collapsed');
        });
    }
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

//  1. INICIO — Resumen KPI
// ── helpers ────────────────────────────────────────────
function _arr(raw) {
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw?.data)) return raw.data;
    if (Array.isArray(raw?.entregas)) return raw.entregas;
    return [];
}
function _e(e) {
    const prod = e.nombre_producto || e.producto || e.descripcion;
    const prodNombre = typeof prod === 'object' && prod !== null
        ? (prod.nombre || prod.descripcion || JSON.stringify(prod))
        : (prod || '—');
    return {
        id_entrega: e.id_entrega || e.id_compra || e.id || null,
        fecha: e.fecha || e.fecha_entrega || e.createdAt || '',
        producto: prodNombre,
        peso: e.peso_kg ?? e.peso ?? e.cantidad_kg ?? 0,
        // null = pendiente liquidacion — NO convertir a 0
        precio: (e.precio_unitario !== undefined ? e.precio_unitario : (e.precio_kg !== undefined ? e.precio_kg : (e.precio !== undefined ? e.precio : null))),
        total: e.total !== undefined ? e.total : null,
        estado: e.estado || 'COMPLETADA',
        estado_liquidacion: e.estado_liquidacion || 'PENDIENTE_LIQUIDACION',
        estado_pago: e.estado_pago || 'PENDIENTE',
        comprobante_pago: e.comprobante_pago || null,
        ruta_precio_final: e.ruta_precio_final || null,
    };
}

// Obtiene el id_productor del usuario en sesión
// IMPORTANTE: usa _perfil (id_productor: 29), NO el usuario del localStorage (que tiene id_usuario: 23)
function getIdProductor() {
    // Solo usar _perfil — es el único lugar con id_productor real
    if (_perfil && _perfil.id_productor) return _perfil.id_productor;
    // No usar localStorage aquí: localStorage tiene id_usuario, no id_productor
    return null;
}

//  1. INICIO — Resumen KPI
async function cargarResumen() {
    ['kpi_entregas', 'kpi_kg', 'kpi_dinero', '/* kpi_ultima removed */'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = '...';
    });

    // FIX OFFLINE: mostrar caché inmediatamente si no hay red
    if (!navigator.onLine) {
        const cache = localStorage.getItem('cache_resumen');
        if (cache) {
            try {
                const d = JSON.parse(cache);
                animarNum('kpi_entregas', Number(d.total_entregas || 0));
                animarNum('kpi_kg', Number(d.total_kg || 0), ' kg');
                const elD = document.getElementById('kpi_dinero');
                if (elD) elD.textContent = fmtCOP(d.total_dinero);
                return;
            } catch(_) {}
        }
        ['kpi_entregas', 'kpi_kg', 'kpi_dinero'].forEach(id => {
            const el = document.getElementById(id); if (el) el.textContent = '—';
        });
        return;
    }
    try {
        // Intentar con el endpoint específico del productor primero
        const res = await apiFetch(`${API_URL}/productor-dashboard/resumen`);
        const raw = await res.json();
        console.log('[AgroTrace] /resumen', res.status, raw);
        if (!res.ok) throw new Error(raw.message || 'Error ' + res.status);

        const d = raw.data || raw;
        let totalEntregas = d.total_entregas ?? d.totalEntregas ?? 0;
        let totalKg = d.total_kg ?? d.totalKg ?? 0;
        let totalDinero = d.total_dinero ?? d.totalDinero ?? d.total ?? 0;
        let ultimaEntrega = d.ultima_entrega ?? d.ultimaEntrega ?? null;

        // Si el resumen viene vacío, calcular desde /entregas directamente
        if (!totalEntregas) {
            const idProductor = getIdProductor();
            if (idProductor) {
                const res2 = await apiFetch(`${API_URL}/entregas?id_productor=${idProductor}`);
                if (res2.ok) {
                    const raw2 = await res2.json();
                    const arr = _arr(raw2).map(_e);
                    console.log('[AgroTrace] /entregas fallback', arr.length, 'registros');
                    totalEntregas = arr.length;
                    totalKg = arr.reduce((s, e) => s + Number(e.peso), 0);
                    totalDinero = arr.reduce((s, e) => s + Number(e.total), 0);
                    ultimaEntrega = arr[0]?.fecha || null;
                }
            }
        }

        localStorage.setItem('cache_resumen', JSON.stringify({ total_entregas: totalEntregas, total_kg: totalKg, total_dinero: totalDinero, ultima_entrega: ultimaEntrega }));

        animarNum('kpi_entregas', Number(totalEntregas));
        animarNum('kpi_kg', Number(totalKg), ' kg');
        const elD = document.getElementById('kpi_dinero');
        if (elD) elD.textContent = fmtCOP(totalDinero);
        const elU = document.getElementById('/* kpi_ultima removed */');
        if (elU) elU.textContent = ultimaEntrega ? fmtFecha(ultimaEntrega) : 'Sin entregas';

    } catch (e) {
        console.error('[AgroTrace] Error /resumen:', e.message);
        // Intentar calcular KPIs directamente desde /entregas
        try {
            const idProductor = getIdProductor();
            if (idProductor) {
                const res3 = await apiFetch(`${API_URL}/entregas?id_productor=${idProductor}`);
                if (res3.ok) {
                    const raw3 = await res3.json();
                    const arr3 = _arr(raw3).map(_e);
                    const totalEntregas = arr3.length;
                    const totalKg = arr3.reduce((s, e) => s + Number(e.peso), 0);
                    const totalDinero = arr3.reduce((s, e) => s + Number(e.total), 0);
                    const ultimaEntrega = arr3[0]?.fecha || null;
                    animarNum('kpi_entregas', totalEntregas);
                    animarNum('kpi_kg', Math.round(totalKg), ' kg');
                    const elD = document.getElementById('kpi_dinero');
                    if (elD) elD.textContent = fmtCOP(totalDinero);
                    const elU = document.getElementById('/* kpi_ultima removed */');
                    if (elU) elU.textContent = ultimaEntrega ? fmtFecha(ultimaEntrega) : 'Sin entregas';
                    localStorage.setItem('cache_resumen', JSON.stringify({ total_entregas: totalEntregas, total_kg: totalKg, total_dinero: totalDinero, ultima_entrega: ultimaEntrega }));
                    return;
                }
            }
        } catch (_) { }
        // Último recurso: caché
        const cache = localStorage.getItem('cache_resumen');
        if (cache) {
            const d = JSON.parse(cache);
            animarNum('kpi_entregas', Number(d.total_entregas || 0));
            animarNum('kpi_kg', Number(d.total_kg || 0), ' kg');
            const elD = document.getElementById('kpi_dinero');
            if (elD) elD.textContent = fmtCOP(d.total_dinero);
            const elU = document.getElementById('/* kpi_ultima removed */');
            if (elU) elU.textContent = d.ultima_entrega ? fmtFecha(d.ultima_entrega) : 'Sin entregas';
            return;
        }
        ['kpi_entregas', 'kpi_kg', 'kpi_dinero', '/* kpi_ultima removed */'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = '—';
        });
    }
}

//  1b. Preview últimas entregas (sección inicio)
async function cargarPreviewEntregas() {
    const tbody = document.getElementById('inicio_tbody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="5" class="empty-cell">Cargando...</td></tr>';

    // FIX OFFLINE: mostrar del caché si no hay red
    if (!navigator.onLine) {
        const cache = localStorage.getItem('cache_preview');
        if (cache) {
            try {
                const arr = JSON.parse(cache);
                if (!arr.length) { tbody.innerHTML = '<tr><td colspan="5" class="empty-cell">Sin entregas registradas</td></tr>'; return; }
                tbody.innerHTML = arr.map(e => `<tr>
                    <td data-label="Fecha" style="font-size:.82em;color:var(--color-text-secondary)">${fmtFecha(e.fecha)}</td>
                    <td data-label="Producto" style="font-weight:500">${e.producto}</td>
                    <td data-label="Peso">${fmtKg(e.peso)}</td>
                    <td data-label="Total"><span style="font-weight:700;color:#166534">${fmtCOP(e.total)}</span></td>
                    <td data-label="Estado">${badgeEstado(e.estado)}</td>
                </tr>`).join('');
                return;
            } catch(_) {}
        }
        tbody.innerHTML = '<tr><td colspan="5" class="empty-cell">Sin datos guardados</td></tr>';
        return;
    }
    try {
        // Intentar endpoint específico del productor
        let arr = [];
        const res = await apiFetch(`${API_URL}/productor-dashboard/historial`);
        const raw = await res.json();
        console.log('[AgroTrace] /historial (preview)', res.status, raw);

        if (res.ok) arr = _arr(raw).map(_e);

        // Si viene vacío, usar /entregas con filtro por id_productor
        if (!arr.length) {
            const idProductor = getIdProductor();
            if (idProductor) {
                const res2 = await apiFetch(`${API_URL}/entregas?id_productor=${idProductor}`);
                if (res2.ok) {
                    const raw2 = await res2.json();
                    arr = _arr(raw2).map(_e);
                    console.log('[AgroTrace] /entregas fallback (preview)', arr.length, 'registros');
                }
            }
        }

        const vista = arr.slice(0, 5);
        localStorage.setItem('cache_preview', JSON.stringify(vista));

        if (!vista.length) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-cell">Aún no tienes entregas registradas</td></tr>';
            return;
        }
        tbody.innerHTML = vista.map(e => `<tr>
            <td data-label="Fecha" style="font-size:.82em;color:var(--color-text-secondary);white-space:nowrap">${fmtFecha(e.fecha)}</td>
            <td data-label="Producto" style="font-weight:500">${e.producto}</td>
            <td data-label="Peso">${fmtKg(e.peso)}</td>
            <td data-label="Total">
                <span style="font-weight:700;color:#166534">${fmtCOP(e.total)}</span>
                <small style="display:block;color:#9ca3af;font-size:.7rem">${fmtCOP(e.precio)}/kg neto</small>
            </td>
            <td data-label="Estado">${badgeEstado(e.estado)}</td>
        </tr>`).join('');

    } catch (err) {
        console.error('[AgroTrace] Error /historial (preview):', err.message);
        const cache = localStorage.getItem('cache_preview');
        if (!cache) { tbody.innerHTML = '<tr><td colspan="5" class="empty-cell">Sin datos</td></tr>'; return; }
        const arr = JSON.parse(cache);
        tbody.innerHTML = arr.map(e => `<tr>
            <td>${fmtFecha(e.fecha)}</td><td>${e.producto}</td>
            <td>${fmtKg(e.peso)}</td><td>${fmtCOP(e.total)}</td>
            <td>${badgeEstado(e.estado)}</td>
        </tr>`).join('');
    }
}

//  2. HISTORIAL DE ENTREGAS
async function cargarHistorial(mes = '', anio = '') {
    const tbody = document.getElementById('hist_tbody');
    const countEl = document.getElementById('hist_count');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" class="empty-cell">Cargando...</td></tr>';

    // FIX OFFLINE: mostrar caché si no hay red
    if (!navigator.onLine) {
        const cache = localStorage.getItem('cache_historial');
        if (cache) {
            try {
                _historial = JSON.parse(cache);
                if (countEl) countEl.textContent = `${_historial.length} registro${_historial.length !== 1 ? 's' : ''} (sin conexión)`;
                if (!_historial.length) { tbody.innerHTML = '<tr><td colspan="6" class="empty-cell">No hay entregas guardadas</td></tr>'; return; }
                _renderHistorialRows(tbody, _historial);
                return;
            } catch(_) {}
        }
        tbody.innerHTML = '<tr><td colspan="6" class="empty-cell">Sin conexión y sin datos guardados</td></tr>';
        return;
    }

    let url = `${API_URL}/productor-dashboard/historial`;
    const params = [];
    if (mes) params.push(`mes=${mes}`);
    if (anio) params.push(`anio=${anio}`);
    if (params.length) url += '?' + params.join('&');

    try {
        let arr = [];
        const res = await apiFetch(url);
        const raw = await res.json();
        console.log('[AgroTrace] /historial', res.status, raw);
        if (res.ok) arr = _arr(raw).map(_e);

        // Si viene vacío, usar /entregas con filtro por id_productor
        if (!arr.length) {
            const idProductor = getIdProductor();
            if (idProductor) {
                let url2 = `${API_URL}/entregas?id_productor=${idProductor}`;
                const res2 = await apiFetch(url2);
                if (res2.ok) {
                    const raw2 = await res2.json();
                    arr = _arr(raw2).map(_e);
                    console.log('[AgroTrace] /entregas fallback (historial)', arr.length, 'registros');
                    // Aplicar filtros de mes/año en cliente
                    if (mes) arr = arr.filter(e => { const d = new Date(e.fecha); return (d.getMonth() + 1) === parseInt(mes, 10); });
                    if (anio) arr = arr.filter(e => new Date(e.fecha).getFullYear() === parseInt(anio, 10));
                }
            }
        }

        _historial = arr;
        localStorage.setItem('cache_historial', JSON.stringify(_historial));
        if (countEl) countEl.textContent = `${_historial.length} registro${_historial.length !== 1 ? 's' : ''}`;

        if (!_historial.length) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-cell">No hay entregas</td></tr>';
            return;
        }
        tbody.innerHTML = _historial.map(function (e, idx) {
            var liq = e.estado_liquidacion || 'PENDIENTE_LIQUIDACION';
            var pend = (liq === 'PENDIENTE_LIQUIDACION');
            var pagado = (liq === 'PAGADO' || e.estado_pago === 'PAGADO');

            var precioTd = pend
                ? '<span style="color:#d97706;font-weight:600"> Pendiente liquidación</span>'
                : '<span style="font-weight:700">' + fmtCOP(e.precio) + '/kg</span><br><small style="color:#9ca3af;font-size:.7rem">incluye descuentos</small>';

            var totalTd = pend
                ? '<span style="color:#d97706">Pendiente</span>'
                : '<strong style="color:#166534">' + fmtCOP(e.total) + '</strong>';

            var liqBadge = pagado
                ? '<span style="background:#d1fae5;color:#065f46;border-radius:99px;padding:2px 8px;font-size:.72rem;font-weight:700"> Pagado</span>'
                : liq === 'LIQUIDADO'
                    ? '<span style="background:#dbeafe;color:#1d4ed8;border-radius:99px;padding:2px 8px;font-size:.72rem;font-weight:700">Liquidado</span>'
                    : '<span style="background:#fef3c7;color:#92400e;border-radius:99px;padding:2px 8px;font-size:.72rem;font-weight:700">Pendiente</span>';

            // Botón: si hay comprobante → ver comprobante subido por admin
            // Si liquidado sin comprobante → descargar recibo
            // Si pendiente → nada
            var accionTd;
            if (e.comprobante_pago) {
                var urlComp = e.comprobante_pago.startsWith('http')
                    ? e.comprobante_pago
                    : e.comprobante_pago;
                var urlComp = e.comprobante_pago.startsWith('http') ? e.comprobante_pago : window.location.origin + e.comprobante_pago;
                accionTd = '<a href="' + urlComp + '" target="_blank" '
                    + 'style="background:#d1fae5;color:#065f46;border:1px solid #a7f3d0;border-radius:6px;'
                    + 'padding:4px 10px;font-size:.75rem;font-weight:600;text-decoration:none">Ver comprobante</a>';
            } else if (!pend) {
                accionTd = '<button onclick="prd_descargarRecibo(' + idx + ')" '
                    + 'style="background:#f0fdf4;color:#166534;border:1px solid #bbf7d0;border-radius:6px;'
                    + 'padding:4px 10px;font-size:.75rem;cursor:pointer;font-weight:600"> Recibo</button>';
            } else {
                accionTd = '<span style="color:#d1d5db;font-size:.75rem">—</span>';
            }

            var detBtn = '<button onclick="prd_det_abrir(' + idx + ')" '
                + 'style="background:#f0fdf4;color:#166534;border:1px solid #bbf7d0;border-radius:6px;'
                + 'padding:4px 10px;font-size:.75rem;cursor:pointer;font-weight:600"><span><i class="fi fi-rr-eye"></i></span></button>';

            return '<tr>'
                + '<td data-label="Fecha">' + fmtFecha(e.fecha) + '</td>'
                + '<td data-label="Producto">' + e.producto + '</td>'
                + '<td data-label="Peso">' + fmtKg(e.peso) + '</td>'
                + '<td data-label="Precio/kg">' + precioTd + '</td>'
                + '<td data-label="Total">' + totalTd + '</td>'
                + '<td data-label="Estado">' + liqBadge + '</td>'
                + '<td data-label="Comprobante">' + accionTd + '</td>'
                + '<td data-label="Detalle">' + detBtn + '</td>'
                + '</tr>';
        }).join('');

    } catch (err) {
        console.error('[AgroTrace] Error /historial:', err.message);
        const cache = localStorage.getItem('cache_historial');
        if (!cache) { tbody.innerHTML = '<tr><td colspan="6" class="empty-cell">Sin datos</td></tr>'; return; }
        _historial = JSON.parse(cache);
        if (countEl) countEl.textContent = `${_historial.length} registro${_historial.length !== 1 ? 's' : ''}`;
        tbody.innerHTML = _historial.map(function (e, idx) {
            var liq = e.estado_liquidacion || 'PENDIENTE_LIQUIDACION';
            var pend = (liq === 'PENDIENTE_LIQUIDACION');
            var accionTd;
            if (e.comprobante_pago) {
                var urlComp = e.comprobante_pago.startsWith('http') ? e.comprobante_pago : e.comprobante_pago;
                var urlComp = e.comprobante_pago.startsWith('http') ? e.comprobante_pago : window.location.origin + e.comprobante_pago;
                accionTd = '<button onclick="compModal.abrir(\'' + urlComp + '\')" style="background:#d1fae5;color:#065f46;border:1px solid #a7f3d0;border-radius:6px;padding:4px 10px;font-size:.75rem;font-weight:600;cursor:pointer">Ver comprobante</button>';
            } else if (!pend) {
                accionTd = '<button onclick="prd_descargarRecibo(' + idx + ')" style="background:#f0fdf4;color:#166534;border:1px solid #bbf7d0;border-radius:6px;padding:4px 10px;font-size:.75rem;cursor:pointer;font-weight:600"> Recibo</button>';
            } else {
                accionTd = '—';
            }
            return '<tr>'
                + '<td data-label="Fecha">' + fmtFecha(e.fecha) + '</td>'
                + '<td data-label="Producto">' + e.producto + '</td>'
                + '<td data-label="Peso">' + fmtKg(e.peso) + '</td>'
                + '<td data-label="Precio/kg">' + (pend ? 'Pendiente' : fmtCOP(e.precio) + '/kg') + '</td>'
                + '<td data-label="Total">' + (pend ? 'Pendiente' : fmtCOP(e.total)) + '</td>'
                + '<td data-label="Estado">' + (liq === 'PAGADO' || e.estado_pago === 'PAGADO' ? 'Pagado' : liq === 'LIQUIDADO' ? 'Liquidado' : 'Pendiente') + '</td>'
                + '<td data-label="Comprobante">' + accionTd + '</td>'
                + '</tr>';
        }).join('');
    }
}

// ── Filtros por mes / año ──────────────────────────────
function aplicarFiltros() {
    const mes = document.getElementById('filt_mes')?.value || '';
    const anio = document.getElementById('filt_anio')?.value || '';
    cargarHistorial(mes, anio);
}
function limpiarFiltros() {
    const m = document.getElementById('filt_mes');
    const a = document.getElementById('filt_anio');
    if (m) m.value = '';
    if (a) a.value = '';
    cargarHistorial();
}

// ── Poblar selector de años (año actual - 5 años) ──────
function poblarAnios() {
    const sel = document.getElementById('filt_anio');
    if (!sel) return;
    const now = new Date().getFullYear();
    for (let y = now; y >= now - 5; y--) {
        const opt = document.createElement('option');
        opt.value = y; opt.textContent = y;
        sel.appendChild(opt);
    }
}

// ── Exportar a CSV / Excel ─────────────────────────────
function exportarCSV() {
    if (!_historial.length) { alert('No hay datos para exportar'); return; }
    const cols = ['Fecha', 'Producto', 'Peso (kg)', 'Precio/kg', 'Total', 'Estado'];
    const rows = _historial.map(e => [
        fmtFecha(e.fecha), e.producto, e.peso,
        e.precio_unitario, e.total, e.estado
    ]);
    const tsv = [cols, ...rows].map(r => r.join('\t')).join('\r\n');
    const blob = new Blob(['\uFEFF' + tsv], { type: 'text/tab-separated-values;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `mis-entregas-${new Date().toISOString().slice(0, 10)}.xls`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}
//  3. MI PERFIL

async function cargarPerfil() {
    // FIX OFFLINE: intentar desde localStorage primero si no hay red
    if (!navigator.onLine) {
        const guardado = localStorage.getItem('cache_perfil_productor') || localStorage.getItem('usuario');
        if (guardado) { try { pintarPerfil(JSON.parse(guardado)); } catch(_){} return; }
    }
    try {
        const res = await apiFetch(`${API_URL}/productor-dashboard/perfil`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Error');
        _perfil = data;
        // FIX OFFLINE: persistir perfil para uso sin conexión
        try { localStorage.setItem('cache_perfil_productor', JSON.stringify(data)); } catch(_) {}
        pintarPerfil(data);
    } catch (e) {
        console.error('cargarPerfil:', e);
        const guardado = localStorage.getItem('cache_perfil_productor') || localStorage.getItem('usuario');
        if (guardado) try { pintarPerfil(JSON.parse(guardado)); } catch(_) {}
    }
}

function pintarPerfil(u) {
    if (!u) return;
    const nombre = `${u.nombre || ''} ${u.apellido || ''}`.trim();
    const ini = ((u.nombre || '')[0] || '?').toUpperCase() + ((u.apellido || '')[0] || '').toUpperCase();

    const av = document.getElementById('perfil_avatar');
    if (av) av.textContent = ini;
    const pn = document.getElementById('perfil_nombre_display');
    if (pn) pn.textContent = nombre;

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val || '—'; };
    set('pf_nombre', nombre);
    set('pf_cedula', u.cedula);
    set('pf_finca', u.nombre_finca || u.finca || '—');

    const tel = document.getElementById('inp_telefono');
    if (tel) tel.value = u.telefono || '';
    const ubi = document.getElementById('inp_ubicacion');
    if (ubi) ubi.value = u.ubicacion || u.municipio || '';

    const qrAv = document.getElementById('qr_avatar');
    if (qrAv) qrAv.textContent = ((u.nombre || '')[0] || '?').toUpperCase();
    const qrN = document.getElementById('qr_nombre');
    if (qrN) qrN.textContent = nombre;
    const qrC = document.getElementById('qr_cedula');
    if (qrC) qrC.textContent = u.cedula ? `Cédula: ${u.cedula}` : '—';
}

async function guardarPerfil() {
    const msgEl = document.getElementById('perfil_msg');
    const btn = document.getElementById('btn_guardar_perfil');
    const tel = document.getElementById('inp_telefono')?.value.trim();
    const ubi = document.getElementById('inp_ubicacion')?.value.trim();

    if (!tel) {
        mostrarMsg(msgEl, 'El teléfono es obligatorio.', 'error');
        return;
    }

    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fi fi-rr-refresh"></i> Guardando...'; }

    try {
        const res = await apiFetch(`${API_URL}/productor-dashboard/perfil`, {
            method: 'PUT',
            body: JSON.stringify({ telefono: tel, ubicacion: ubi })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Error al guardar');
        mostrarMsg(msgEl, ' Perfil actualizado correctamente.', 'ok');
        if (_perfil) {
            _perfil.telefono = tel;
            _perfil.ubicacion = ubi;
        }
    } catch (e) {
        mostrarMsg(msgEl, ` ${e.message}`, 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fi fi-rr-check"></i> Guardar cambios'; }
    }
}

function mostrarMsg(el, msg, tipo) {
    if (!el) return;
    el.className = `prd-msg ${tipo}`;
    el.textContent = msg;
    setTimeout(() => { el.className = 'prd-msg'; el.textContent = ''; }, 5000);
}

//  4. MI QR
async function cargarQR() {

    const wrap = document.getElementById('qr_img_wrap');
    if (!wrap) return;

    // FIX OFFLINE: si no hay red, mostrar QR guardado
    if (!navigator.onLine) {
        _mostrarQROffline(wrap);
        return;
    }

    if (!_perfil || !_perfil.id_productor) await cargarPerfil();

    const botonDescarga = document.getElementById('qr_dl_btn');

    try {

        const res = await apiFetch(`${API_URL}/productor-dashboard/qr`);

        if (res.ok) {

            const data = await res.json();

            if (data.qr_url || data.qr_base64) {

                const src = data.qr_url || `data:image/png;base64,${data.qr_base64}`;

                wrap.innerHTML = `<img id="qr_img" src="${src}" alt="Código QR del productor">`;

                localStorage.setItem("qr_productor", src);

                if (botonDescarga) botonDescarga.href = src;

                return;
            }
        }

        usarQROffline();

    } catch {

        usarQROffline();

    }

}
function usarQROffline() {

    console.warn("Modo offline → usando QR guardado");

    const qrGuardado = localStorage.getItem("qr_productor");

    const wrap = document.getElementById('qr_img_wrap');

    if (qrGuardado && wrap) {

        wrap.innerHTML = `<img id="qr_img" src="${qrGuardado}" alt="Código QR del productor">`;

        const dl = document.getElementById('qr_dl_btn');
        if (dl) dl.href = qrGuardado;

        return;

    }

    _generarQRPublico();

}
function _generarQRPublico() {

    const cedula = _perfil?.cedula || 'SIN_CEDULA';

    const qrData = encodeURIComponent(`${cedula}`);

    const src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}&color=1b5e20&bgcolor=ffffff`;

    const wrap = document.getElementById('qr_img_wrap');

    if (wrap) {
        wrap.innerHTML = `<img id="qr_img" src="${src}" alt="Código QR del productor">`;
    }

    const dl = document.getElementById('qr_dl_btn');

    if (dl) dl.href = src;

}

// ══════════════════════════════════════════════════════════════════
//  MODAL DETALLE DE ENTREGA — igual al admin
// ══════════════════════════════════════════════════════════════════
function prd_det_abrir(idx) {
    var e = _historial[idx];
    if (!e) return;

    var modal = document.getElementById('prd_det_modal');
    if (!modal) return;
    modal.style.display = 'flex';

    var fmt = function (v) {
        return v != null
            ? '$' + Number(v).toLocaleString('es-CO')
            : '—';
    };
    var fmtFechaL = function (f) {
        return f ? new Date(f).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';
    };

    // Subtítulo — número de factura
    var num = 'COMP-' + String(e.id_entrega || '').padStart(6, '0');
    document.getElementById('prd_det_subtitulo').textContent = 'Factura: ' + num;

    // Info cards
    var liq = e.estado_liquidacion || 'PENDIENTE_LIQUIDACION';
    var pagado = (liq === 'PAGADO' || e.estado_pago === 'PAGADO');
    var estadoLabel = pagado ? 'Pagado' : liq === 'LIQUIDADO' ? 'Liquidado' : 'Pendiente';
    var estadoColor = pagado ? '#065f46' : liq === 'LIQUIDADO' ? '#1d4ed8' : '#92400e';
    var estadoBg = pagado ? '#d1fae5' : liq === 'LIQUIDADO' ? '#dbeafe' : '#fef3c7';

    var infoCard = function (label, value) {
        return '<div style="background:#f9fafb;border-radius:10px;padding:12px 14px">'
            + '<span style="font-size:.72rem;color:#9ca3af;text-transform:uppercase;font-weight:600">' + label + '</span>'
            + '<div style="font-weight:700;color:#111827;margin-top:4px;font-size:.92rem">' + value + '</div>'
            + '</div>';
    };

    document.getElementById('prd_det_info').innerHTML =
        infoCard('Productor', (window._perfil && _perfil.nombre ? _perfil.nombre + ' ' + (_perfil.apellido || '') : 'Mi entrega').trim())
        + infoCard('Fecha', fmtFechaL(e.fecha))
        + infoCard('Estado', '<span style="background:' + estadoBg + ';color:' + estadoColor + ';border-radius:99px;padding:2px 10px;font-size:.78rem;font-weight:700">' + estadoLabel + '</span>')
        + infoCard('Total', '<span style="color:#16a34a;font-size:1.05rem">' + fmt(e.total) + '</span>');

    // Fila de producto
    var peso = Number(e.peso || 0).toFixed(2);
    var tbody = '<tr>'
        + '<td style="padding:10px;border-bottom:1px solid #f3f4f6">' + e.producto + '</td>'
        + '<td style="padding:10px;text-align:right;border-bottom:1px solid #f3f4f6">' + peso + ' kg</td>'
        + '<td style="padding:10px;text-align:right;border-bottom:1px solid #f3f4f6">' + fmt(e.precio) + '</td>'
        + '<td style="padding:10px;text-align:right;border-bottom:1px solid #f3f4f6;font-weight:700">' + fmt(e.total) + '</td>'
        + '</tr>';
    document.getElementById('prd_det_tbody').innerHTML = tbody;
    document.getElementById('prd_det_total').textContent = fmt(e.total);

    // Comprobante
    var compDiv = document.getElementById('prd_det_comprobante');
    var compLink = document.getElementById('prd_det_comp_link');
    if (e.comprobante_pago && compDiv && compLink) {
        var url = e.comprobante_pago.startsWith('http')
            ? e.comprobante_pago
            : e.comprobante_pago;
        compLink.href = '#';
        compLink.onclick = function(ev) { ev.preventDefault(); compModal.abrir((e.comprobante_pago.startsWith('http') ? e.comprobante_pago : window.location.origin + e.comprobante_pago)); };
        compLink.textContent = 'Ver comprobante';
        compDiv.style.display = 'block';
    } else if (compDiv) {
        compDiv.style.display = 'none';
    }

    // Guardar para PDF
    window._prd_det_current = e;
}

function prd_det_cerrar() {
    var modal = document.getElementById('prd_det_modal');
    if (modal) modal.style.display = 'none';
}

function prd_det_descargarPDF() {
    var e = window._prd_det_current;
    if (!e) return;
    var fmt = function (v) {
        return v != null ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v) : '—';
    };
    var fecha = new Date(e.fecha).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
    var num = 'COMP-' + String(e.id_entrega || '').padStart(6, '0');
    var prod = window._perfil ? (_perfil.nombre + ' ' + (_perfil.apellido || '')).trim() : 'Productor';
    var liq = e.estado_liquidacion || 'PENDIENTE_LIQUIDACION';
    var pagado = (liq === 'PAGADO' || e.estado_pago === 'PAGADO');
    var estado = pagado ? '&#10003; Pagado' : liq === 'LIQUIDADO' ? 'Liquidado' : 'Pendiente';

    var html = '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Factura ' + num + '</title>'
        + '<style>'
        + 'body{font-family:Arial,sans-serif;max-width:580px;margin:32px auto;color:#111;padding:0 20px}'
        + '.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;padding-bottom:16px;border-bottom:3px solid #16a34a}'
        + '.logo{color:#16a34a;font-weight:800;font-size:1.4rem}'
        + '.factura-num{text-align:right;font-size:.82rem;color:#6b7280}'
        + '.factura-num strong{display:block;font-size:1rem;color:#111;margin-bottom:2px}'
        + '.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px}'
        + '.info-card{background:#f9fafb;border-radius:8px;padding:10px 12px}'
        + '.info-label{font-size:.7rem;color:#9ca3af;text-transform:uppercase;font-weight:600}'
        + '.info-val{font-weight:700;color:#111;margin-top:3px;font-size:.9rem}'
        + 'table{width:100%;border-collapse:collapse;font-size:.85rem}'
        + 'th{background:#f0fdf4;color:#166534;padding:10px;text-align:left;font-size:.72rem;text-transform:uppercase}'
        + 'th:last-child,td:last-child{text-align:right}'
        + 'td{padding:10px;border-bottom:1px solid #f3f4f6}'
        + '.total-row{font-size:1.1rem;font-weight:800;color:#16a34a;text-align:right;margin-top:12px;padding-top:12px;border-top:2px solid #d1fae5}'
        + '.badge{display:inline-block;background:#d1fae5;color:#065f46;border-radius:99px;padding:2px 10px;font-size:.75rem;font-weight:700}'
        + '.footer{margin-top:32px;font-size:.72rem;color:#9ca3af;text-align:center;border-top:1px solid #f3f4f6;padding-top:12px}'
        + '</style></head><body>'
        + '<div class="header">'
        + '<div><div class="logo">&#127807; AgroTrace</div><div style="font-size:.78rem;color:#6b7280;margin-top:2px">Comprobante de entrega</div></div>'
        + '<div class="factura-num"><strong>' + num + '</strong>' + fecha + '</div>'
        + '</div>'
        + '<div class="info-grid">'
        + '<div class="info-card"><div class="info-label">Productor</div><div class="info-val">' + prod + '</div></div>'
        + '<div class="info-card"><div class="info-label">Fecha</div><div class="info-val">' + fecha + '</div></div>'
        + '<div class="info-card"><div class="info-label">Estado</div><div class="info-val"><span class="badge">' + estado + '</span></div></div>'
        + '<div class="info-card"><div class="info-label">Total</div><div class="info-val" style="color:#16a34a">' + fmt(e.total) + '</div></div>'
        + '</div>'
        + '<table><thead><tr><th>Producto</th><th>Cantidad</th><th>P. Unitario</th><th>Subtotal</th></tr></thead><tbody>'
        + '<tr><td>' + e.producto + '</td><td>' + Number(e.peso).toFixed(2) + ' kg</td><td>' + fmt(e.precio) + '</td><td><strong>' + fmt(e.total) + '</strong></td></tr>'
        + '</tbody></table>'
        + '<div class="total-row">Total: ' + fmt(e.total) + '</div>'
        + '<div class="footer">Generado por AgroTrace &middot; ' + new Date().toLocaleDateString('es-CO') + '</div>'
        + '</body></html>';

    var win = window.open('', '_blank', 'width=640,height=750');
    if (win) { win.document.write(html); win.document.close(); setTimeout(function () { win.print(); }, 500); }
}

function prd_descargarRecibo(idx) {
    var e = _historial[idx];
    if (!e) return;
    var fmt = function (v) {
        return v != null ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v) : '—';
    };
    var fecha = new Date(e.fecha).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
    var estado = (e.estado_liquidacion === 'PAGADO' || e.estado_pago === 'PAGADO') ? '&#10003; Pagado' : 'Liquidado';
    var content = '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Recibo AgroTrace</title>'
        + '<style>body{font-family:Arial,sans-serif;max-width:520px;margin:32px auto;color:#111;padding:0 16px}'
        + '.logo{color:#16a34a;font-weight:800;font-size:1.3rem}.sub{color:#6b7280;font-size:.82rem;margin-bottom:24px}'
        + 'h2{border-bottom:2px solid #f0fdf4;padding-bottom:8px;color:#166534;font-size:1rem}'
        + 'table{width:100%;border-collapse:collapse}td{padding:8px 4px;border-bottom:1px solid #f3f4f6;font-size:.88rem}'
        + 'td:first-child{color:#6b7280;width:45%}td:last-child{font-weight:600;text-align:right}'
        + '.tr{font-size:1.1rem;font-weight:800;color:#166534;border-top:2px solid #d1fae5}'
        + '.badge{background:#d1fae5;color:#065f46;border-radius:99px;padding:2px 10px;font-size:.75rem;font-weight:700}'
        + '.foot{margin-top:24px;font-size:.75rem;color:#9ca3af;text-align:center;border-top:1px solid #f3f4f6;padding-top:12px}'
        + '</style></head><body>'
        + '<div class="logo">&#127807; AgroTrace</div><div class="sub">Comprobante de entrega</div>'
        + '<h2>Detalle de entrega</h2><table>'
        + '<tr><td>Fecha</td><td>' + fecha + '</td></tr>'
        + '<tr><td>Producto</td><td>' + e.producto + '</td></tr>'
        + '<tr><td>Peso</td><td>' + Number(e.peso).toFixed(2) + ' kg</td></tr>'
        + '<tr><td>Precio / kg</td><td>' + fmt(e.precio) + '</td></tr>'
        + '<tr class="tr"><td>TOTAL A PAGAR</td><td>' + fmt(e.total) + '</td></tr>'
        + '</table><div style="margin-top:12px">Estado: <span class="badge">' + estado + '</span></div>'
        + '<div class="foot">Generado por AgroTrace &middot; ' + new Date().toLocaleDateString('es-CO') + '</div>'
        + '</body></html>';
    var win = window.open('', '_blank', 'width=580,height=700');
    if (win) { win.document.write(content); win.document.close(); setTimeout(function () { win.print(); }, 400); }
}

function descargarQR(e) {
    if (e) e.preventDefault();

    const img = document.getElementById("qr_img");

    if (!img) {
        alert("No hay QR disponible");
        return;
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const image = new Image();
    image.crossOrigin = "anonymous";

    image.onload = function () {

        canvas.width = image.width;
        canvas.height = image.height;

        ctx.drawImage(image, 0, 0);

        canvas.toBlob(function (blob) {

            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);

            link.href = url;
            link.download = "mi-qr-agrotrace.png";

            document.body.appendChild(link);
            link.click();

            document.body.removeChild(link);
            URL.revokeObjectURL(url);

        }, "image/png");

    };

    image.src = img.src;

}
function qr_imprimir() {
    const img = document.getElementById('qr_img');
    if (!img) { alert('No hay QR para imprimir'); return; }
    const nombre = document.getElementById('qr_nombre')?.textContent || '';
    const cedula = document.getElementById('qr_cedula')?.textContent || '';
    const w = window.open('', '_blank', 'width=420,height=560');
    w.document.write(`<!DOCTYPE html><html><head><title>Mi QR — AgroTrace</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
            * { margin:0;padding:0;box-sizing:border-box; }
            body { display:flex;flex-direction:column;align-items:center;justify-content:center;
                   min-height:100vh;font-family:'Inter',sans-serif;background:#f4f6f9;padding:24px; }
            .card { background:white;border-radius:20px;overflow:hidden;
                    box-shadow:0 8px 32px rgba(0,0,0,.12);width:300px; }
            .hdr  { background:linear-gradient(135deg,#1b5e20,#2e7d32);padding:18px;
                    display:flex;align-items:center;gap:12px; }
            .hdr-av { width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,.2);
                      display:flex;align-items:center;justify-content:center;
                      font-size:1.2em;font-weight:900;color:white;border:2px solid rgba(255,255,255,.3); }
            .hdr-nom { font-size:.92em;font-weight:900;color:white;display:block; }
            .hdr-ced { font-size:.72em;color:rgba(255,255,255,.75); }
            .body    { padding:22px;display:flex;flex-direction:column;align-items:center;gap:10px; }
            img      { width:200px;height:200px;border-radius:10px;border:1px solid #e5e7eb; }
            .foot    { background:#e8f5e9;padding:9px;text-align:center;
                       font-size:.67em;color:#1b5e20;font-weight:800;
                       border-top:1px solid #a5d6a7; }
        </style></head><body>
        <div class="card">
            <div class="hdr">
                <div class="hdr-av">🌱</div>
                <div>
                    <span class="hdr-nom">${nombre}</span>
                    <span class="hdr-ced">${cedula}</span>
                </div>
            </div>
            <div class="body"><img src="${img.src}" alt="QR"></div>
            <div class="foot">🌱 AgroTrace · Sistema de Trazabilidad Agrícola</div>
        </div>
        <script>window.addEventListener('load',()=>{setTimeout(()=>window.print(),400)})<\/script>
        </body></html>`);
    w.document.close();
}

//  HEADER — Cargar usuario
async function cargarUsuarioHeader() {
    // AuthGuard.require('PRODUCTOR') al inicio del archivo ya garantiza sesión válida.
    // Esta verificación extra cubre el caso de que el token expire MIENTRAS el usuario
    // está en la página (ej: sesión larga sin recargar).
    if (!getToken()) { window.location.replace('../../login.html'); return; }

    try {
        const res = await apiFetch(`${API_URL}/productor-dashboard/perfil`);
        const u = await res.json();
        console.log('[AgroTrace] /perfil status:', res.status, '| data:', u);
        if (res.ok) {
            // Guardar perfil globalmente — getIdProductor() lo usa
            _perfil = u;
            pintarHeader(u);
        } else {
            console.warn('[AgroTrace] /perfil falló, usando localStorage');
            const guardado = localStorage.getItem('usuario');
            if (guardado) pintarHeader(JSON.parse(guardado));
        }
    } catch (err) {
        console.error('[AgroTrace] Error en /perfil:', err.message);
        const guardado = localStorage.getItem('usuario');
        if (guardado) pintarHeader(JSON.parse(guardado));
    }
}

function pintarHeader(u) {
    if (!u) return;
    const nombre = `${u.nombre || ''} ${u.apellido || ''}`.trim();
    const ini = ((u.nombre || '')[0] || '?').toUpperCase() + ((u.apellido || '')[0] || '').toUpperCase();

    const av = document.getElementById('hp_avatar');
    if (av) av.textContent = ini;
    const nm = document.getElementById('hp_nombre');
    if (nm) nm.textContent = nombre;

    const heroN = document.getElementById('hero_nombre');
    if (heroN) heroN.textContent = u.nombre || nombre;

    // FIX: siempre actualizar _perfil con datos reales del servidor
    // antes: "_perfil = _perfil || u" nunca sobreescribía si _perfil ya existía
    _perfil = u;

    // FIX: pintar también los campos de perfil/QR para que estén disponibles
    // sin necesidad de que el usuario navegue a la sección "Mi Perfil"
    pintarPerfil(u);
}

function cerrarSesion() {
    AuthGuard.cerrarSesion(true);
}

window.addEventListener('DOMContentLoaded', () => {

    const token = getToken();
    const usuarioRaw = localStorage.getItem('usuario');
    console.log('[AgroTrace] token:', token ? token.substring(0, 30) + '...' : 'NO HAY TOKEN');
    console.log('[AgroTrace] usuario en localStorage:', usuarioRaw ? JSON.parse(usuarioRaw) : 'VACÍO');

    if (!token) { window.location.href = '../../login.html'; return; }

    document.querySelectorAll('.nav-btn[data-section]').forEach(btn => {
        btn.addEventListener('click', () => mostrarSeccion(btn.dataset.section));
    });

    document.querySelectorAll('.bn-item[data-section]').forEach(btn => {
        btn.addEventListener('click', () => mostrarSeccion(btn.dataset.section));
    });


    const greet = document.getElementById('hero_saludo');
    if (greet) greet.textContent = saludo();

    poblarAnios();


    // Cargar perfil primero (necesario para obtener id_productor), luego mostrar sección
    cargarUsuarioHeader().then(() => mostrarSeccion('inicio'));
});