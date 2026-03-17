const API_URL = 'http://localhost:3000/api';

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
    };
    const tp = document.getElementById('topbar_title');
    if (tp) tp.textContent = titulos[id] || '';

    if (id === 'inicio') { cargarResumen(); cargarPreviewEntregas(); }
    if (id === 'historial') cargarHistorial();
    if (id === 'perfil') cargarPerfil();
    if (id === 'mi-qr') cargarQR();
}

// Sidebar toggle
document.addEventListener('DOMContentLoaded', () => {
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
async function cargarResumen() {
    ['kpi_entregas', 'kpi_kg', 'kpi_dinero', 'kpi_ultima'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = '...';
    });

    try {
        const res = await fetch(`${API_URL}/productor-dashboard/resumen`, { headers: getHeaders() });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Error al cargar resumen');

        localStorage.setItem("cache_resumen", JSON.stringify(data));

        animarNum('kpi_entregas', Number(data.total_entregas || 0));
        animarNum('kpi_kg', Number(data.total_kg || 0), ' kg');

        const elD = document.getElementById('kpi_dinero');
        if (elD) elD.textContent = fmtCOP(data.total_dinero);

        const elU = document.getElementById('kpi_ultima');
        if (elU) elU.textContent = data.ultima_entrega ? fmtFecha(data.ultima_entrega) : 'Sin entregas';

    } catch (e) {

        console.warn("Modo offline → usando cache resumen");

        const cache = localStorage.getItem("cache_resumen");

        if (cache) {

            const data = JSON.parse(cache);

            animarNum('kpi_entregas', Number(data.total_entregas || 0));
            animarNum('kpi_kg', Number(data.total_kg || 0), ' kg');

            const elD = document.getElementById('kpi_dinero');
            if (elD) elD.textContent = fmtCOP(data.total_dinero);

            const elU = document.getElementById('kpi_ultima');
            if (elU) elU.textContent = data.ultima_entrega
                ? fmtFecha(data.ultima_entrega)
                : 'Sin entregas';

            return;
        }

        ['kpi_entregas', 'kpi_kg', 'kpi_dinero', 'kpi_ultima'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = '—';
        });

    }
}
async function cargarPreviewEntregas() {

    const tbody = document.getElementById('inicio_tbody');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="5" class="empty-cell">Cargando...</td></tr>`;

    try {

        const res = await fetch(`${API_URL}/productor-dashboard/historial`, { headers: getHeaders() });

        const data = await res.json();

        const arr = Array.isArray(data) ? data.slice(0, 5) : [];

        // OFFLINE: guardar cache
        localStorage.setItem("cache_preview", JSON.stringify(arr));

        if (!arr.length) {

            tbody.innerHTML = `<tr><td colspan="5" class="empty-cell">Aún no tienes entregas registradas</td></tr>`;

            return;

        }

        tbody.innerHTML = arr.map(e => `
            <tr>
                <td style="font-size:.82em;color:var(--gray-500);white-space:nowrap">${fmtFecha(e.fecha)}</td>
                <td style="font-weight:700">${e.producto || '—'}</td>
                <td>${fmtKg(e.peso)}</td>
                <td style="font-weight:800;color:#166534">${fmtCOP(e.total)}</td>
                <td>${badgeEstado(e.estado)}</td>
            </tr>
        `).join('');

    } catch (e) {

        console.warn("Modo offline → usando preview cache");

        const cache = localStorage.getItem("cache_preview");

        if (!cache) {

            tbody.innerHTML = `<tr><td colspan="5" class="empty-cell">Sin datos offline</td></tr>`;

            return;

        }

        const arr = JSON.parse(cache);

        tbody.innerHTML = arr.map(e => `
            <tr>
                <td>${fmtFecha(e.fecha)}</td>
                <td>${e.producto || '—'}</td>
                <td>${fmtKg(e.peso)}</td>
                <td>${fmtCOP(e.total)}</td>
                <td>${badgeEstado(e.estado)}</td>
            </tr>
        `).join('');

    }

}
//  2. HISTORIAL DE ENTREGAS
async function cargarHistorial(mes = '', anio = '') {

    const tbody = document.getElementById('hist_tbody');
    const countEl = document.getElementById('hist_count');

    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="6" class="empty-cell">Cargando...</td></tr>`;

    let url = `${API_URL}/productor-dashboard/historial`;

    const params = [];

    if (mes) params.push(`mes=${mes}`);
    if (anio) params.push(`anio=${anio}`);

    if (params.length) url += '?' + params.join('&');

    try {

        const res = await fetch(url, { headers: getHeaders() });

        const data = await res.json();

        if (!res.ok) throw new Error(data.message || 'Error');

        _historial = Array.isArray(data) ? data : [];

        localStorage.setItem("cache_historial", JSON.stringify(_historial));

        if (countEl) {

            countEl.textContent = `${_historial.length} registro${_historial.length !== 1 ? 's' : ''}`;

        }

        if (!_historial.length) {

            tbody.innerHTML = `<tr><td colspan="6" class="empty-cell">No hay entregas</td></tr>`;

            return;

        }

        tbody.innerHTML = _historial.map(e => `
            <tr>
                <td>${fmtFecha(e.fecha)}</td>
                <td>${e.producto || '—'}</td>
                <td>${fmtKg(e.peso)}</td>
                <td>${fmtCOP(e.precio_unitario)}/kg</td>
                <td>${fmtCOP(e.total)}</td>
                <td>${badgeEstado(e.estado)}</td>
            </tr>
        `).join('');

    } catch (e) {

        console.warn("Modo offline → usando historial cache");

        const cache = localStorage.getItem("cache_historial");

        if (!cache) {

            tbody.innerHTML = `<tr><td colspan="6" class="empty-cell">Sin datos offline</td></tr>`;

            return;

        }

        _historial = JSON.parse(cache);

        tbody.innerHTML = _historial.map(e => `
            <tr>
                <td>${fmtFecha(e.fecha)}</td>
                <td>${e.producto || '—'}</td>
                <td>${fmtKg(e.peso)}</td>
                <td>${fmtCOP(e.precio_unitario)}/kg</td>
                <td>${fmtCOP(e.total)}</td>
                <td>${badgeEstado(e.estado)}</td>
            </tr>
        `).join('');

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
    try {
        const res = await fetch(`${API_URL}/productor-dashboard/perfil`, { headers: getHeaders() });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Error');
        _perfil = data;
        pintarPerfil(data);
    } catch (e) {
        console.error('cargarPerfil:', e);
        const guardado = localStorage.getItem('usuario');
        if (guardado) pintarPerfil(JSON.parse(guardado));
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
        const res = await fetch(`${API_URL}/productor-dashboard/perfil`, {
            method: 'PUT',
            headers: getHeaders(),
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

    if (!_perfil) await cargarPerfil();

    const botonDescarga = document.getElementById('qr_dl_btn');

    try {

        const res = await fetch(`${API_URL}/productor-dashboard/qr`, { headers: getHeaders() });

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
    if (!getToken()) { window.location.href = '/public/frontend/login.html'; return; }

    try {
        const res = await fetch(`${API_URL}/me`, { headers: getHeaders() });
        if (res.ok) {
            const u = await res.json();
            pintarHeader(u);
            if (!_perfil) _perfil = u;
        } else {
            const guardado = localStorage.getItem('usuario');
            if (guardado) pintarHeader(JSON.parse(guardado));
        }
    } catch {
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

    _perfil = _perfil || u;
}

function cerrarSesion() {
    if (!confirm('¿Deseas cerrar sesión?')) return;

    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('usuario');

    window.location.replace('../../login.html');
}

window.addEventListener('DOMContentLoaded', () => {

    if (!getToken()) { window.location.href = '../../login.html'; return; }

    document.querySelectorAll('.nav-btn[data-section]').forEach(btn => {
        btn.addEventListener('click', () => mostrarSeccion(btn.dataset.section));
    });

    document.querySelectorAll('.bn-item[data-section]').forEach(btn => {
        btn.addEventListener('click', () => mostrarSeccion(btn.dataset.section));
    });


    const greet = document.getElementById('hero_saludo');
    if (greet) greet.textContent = saludo();

    poblarAnios();


    // Cargar datos del header
    cargarUsuarioHeader();

    // Cargar sección inicial
    mostrarSeccion('inicio');
});
if ("serviceWorker" in navigator) {

    window.addEventListener("load", () => {

        navigator.serviceWorker.register("/public/frontend/serviceWorker.js")
            .then(() => console.log("Service Worker registrado"))
            .catch(err => console.error("Error registrando Service Worker:", err));

    });

}
let deferredPrompt;

const btnInstalar = document.getElementById("btnInstalarApp");

window.addEventListener("beforeinstallprompt", (e) => {

    // Evita que Chrome muestre su botón automático
    e.preventDefault();

    deferredPrompt = e;

    // Mostrar nuestro botón
    btnInstalar.style.display = "block";

});

btnInstalar.addEventListener("click", async () => {

    if (!deferredPrompt) return;

    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {

        console.log("Usuario instaló la app");

    } else {

        console.log("Usuario canceló instalación");

    }

    deferredPrompt = null;

});