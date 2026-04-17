(function _injectStyles() {
    if (document.getElementById('agro-ux-styles')) return;
    const s = document.createElement('style');
    s.id = 'agro-ux-styles';
    s.textContent = `
/* ─── Variables ───────────────────────────────────── */
:root {
    --ux-ok:      #16a34a;
    --ux-ok-bg:   #f0fdf4;
    --ux-ok-bd:   #bbf7d0;
    --ux-err:     #dc2626;
    --ux-err-bg:  #fef2f2;
    --ux-err-bd:  #fecaca;
    --ux-warn:    #d97706;
    --ux-warn-bg: #fffbeb;
    --ux-warn-bd: #fde68a;
    --ux-info:    #2563eb;
    --ux-info-bg: #eff6ff;
    --ux-info-bd: #bfdbfe;
}

/* ─── Contenedor de toasts ────────────────────────── */
#agro-toast-wrap {
    position: fixed;
    top: 18px;
    right: 18px;
    z-index: 2147483647;
    display: flex;
    flex-direction: column;
    gap: 10px;
    pointer-events: none;
    width: min(360px, calc(100vw - 36px));
}

/* ─── Toast base ──────────────────────────────────── */
.agro-toast {
    display: flex;
    align-items: flex-start;
    gap: 11px;
    padding: 13px 14px 13px 13px;
    border-radius: 14px;
    border: 1.5px solid transparent;
    box-shadow: 0 8px 28px rgba(0,0,0,.13), 0 2px 6px rgba(0,0,0,.07);
    font-family: inherit;
    font-size: .875rem;
    line-height: 1.45;
    pointer-events: all;
    position: relative;
    overflow: hidden;
    will-change: transform, opacity;
    transform: translateX(calc(100% + 20px));
    opacity: 0;
    transition: transform .38s cubic-bezier(.34,1.56,.64,1),
                opacity .25s ease;
}
.agro-toast.agro-in  { transform: translateX(0); opacity: 1; }
.agro-toast.agro-out {
    transform: translateX(calc(100% + 20px));
    opacity: 0;
    transition: transform .24s ease-in, opacity .2s ease-in;
}

.agro-toast-ok      { background: var(--ux-ok-bg);   border-color: var(--ux-ok-bd);   color: #14532d; }
.agro-toast-error   { background: var(--ux-err-bg);  border-color: var(--ux-err-bd);  color: #7f1d1d; }
.agro-toast-warn    { background: var(--ux-warn-bg); border-color: var(--ux-warn-bd); color: #78350f; }
.agro-toast-info    { background: var(--ux-info-bg); border-color: var(--ux-info-bd); color: #1e3a5f; }
.agro-toast-loading { background: #fff; border-color: #e5e7eb; color: #374151; }

/* ─── Ícono del toast ─────────────────────────────── */
.agro-toast-ico {
    width: 32px; height: 32px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    font-size: .85rem;
    font-weight: 800;
    color: #fff;
}
.agro-toast-ok      .agro-toast-ico { background: var(--ux-ok); }
.agro-toast-error   .agro-toast-ico { background: var(--ux-err); }
.agro-toast-warn    .agro-toast-ico { background: var(--ux-warn); }
.agro-toast-info    .agro-toast-ico { background: var(--ux-info); }
.agro-toast-loading .agro-toast-ico { background: #6b7280; }

/* ─── Spinner dentro del ícono ───────────────────── */
.agro-spin {
    width: 15px; height: 15px;
    border: 2.5px solid rgba(255,255,255,.35);
    border-top-color: #fff;
    border-radius: 50%;
    animation: ux-spin .65s linear infinite;
}
@keyframes ux-spin { to { transform: rotate(360deg); } }

/* ─── Cuerpo del toast ────────────────────────────── */
.agro-toast-body { flex: 1; min-width: 0; }
.agro-toast-ttl  { font-weight: 700; font-size: .875rem; line-height: 1.3; }
.agro-toast-msg  { font-size: .80rem; opacity: .82; margin-top: 2px; white-space: pre-line; }

/* ─── Botón cerrar ────────────────────────────────── */
.agro-toast-x {
    background: none; border: none;
    cursor: pointer; color: inherit; opacity: .45;
    font-size: .95rem; padding: 1px 3px; line-height: 1;
    flex-shrink: 0; transition: opacity .15s;
}
.agro-toast-x:hover { opacity: 1; }

/* ─── Barra de progreso ──────────────────────────── */
.agro-toast-bar {
    position: absolute; bottom: 0; left: 0;
    height: 3px; border-radius: 0 0 14px 14px;
    animation: ux-bar linear forwards;
}
.agro-toast-ok    .agro-toast-bar { background: var(--ux-ok); }
.agro-toast-error .agro-toast-bar { background: var(--ux-err); }
.agro-toast-warn  .agro-toast-bar { background: var(--ux-warn); }
.agro-toast-info  .agro-toast-bar { background: var(--ux-info); }
@keyframes ux-bar { from { width: 100%; } to { width: 0; } }

/* ─── Modal de confirmación ───────────────────────── */
#agro-dlg-overlay {
    position: fixed; inset: 0; z-index: 2147483646;
    background: rgba(0,0,0,.42);
    backdrop-filter: blur(5px); -webkit-backdrop-filter: blur(5px);
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
    opacity: 0; transition: opacity .2s ease;
}
#agro-dlg-overlay.agro-in { opacity: 1; }

.agro-dlg {
    background: #fff; border-radius: 20px;
    padding: 30px 26px 22px; max-width: 390px; width: 100%;
    box-shadow: 0 24px 60px rgba(0,0,0,.17);
    text-align: center; font-family: inherit;
    transform: scale(.9) translateY(14px);
    transition: transform .3s cubic-bezier(.34,1.56,.64,1);
}
#agro-dlg-overlay.agro-in .agro-dlg { transform: scale(1) translateY(0); }

.agro-dlg-ico-wrap {
    width: 60px; height: 60px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 16px; font-size: 1.5rem;
}
.agro-dlg-danger .agro-dlg-ico-wrap { background: #fee2e2; }
.agro-dlg-warn   .agro-dlg-ico-wrap { background: #fef3c7; }
.agro-dlg-info   .agro-dlg-ico-wrap { background: #dbeafe; }

.agro-dlg-ttl {
    font-size: 1rem; font-weight: 800; color: #111827; margin-bottom: 7px;
}
.agro-dlg-msg {
    font-size: .875rem; color: #6b7280; line-height: 1.55; margin-bottom: 22px;
}
.agro-dlg-btns {
    display: flex; gap: 9px; justify-content: center;
}
.agro-dlg-btns button {
    flex: 1; max-width: 155px; padding: 10px 14px;
    border-radius: 10px; border: none;
    font-size: .86rem; font-weight: 700; cursor: pointer;
    font-family: inherit;
    transition: transform .1s ease, filter .1s ease;
}
.agro-dlg-btns button:hover  { filter: brightness(.94); transform: translateY(-1px); }
.agro-dlg-btns button:active { transform: translateY(0); }
.agro-btn-cancel  { background: #f3f4f6; color: #374151; }
.agro-btn-danger  { background: #dc2626; color: #fff; }
.agro-btn-warn    { background: #d97706; color: #fff; }
.agro-btn-primary { background: #2563eb; color: #fff; }
.agro-btn-ok      { background: #16a34a; color: #fff; }

/* ─── Estado loading en botón ─────────────────────── */
.agro-btn-loading {
    pointer-events: none !important;
    opacity: .75 !important;
    position: relative;
}
.agro-btn-loading-inner {
    display: inline-flex; align-items: center; gap: 7px; justify-content: center;
}
.agro-btn-spin {
    width: 13px; height: 13px;
    border: 2px solid rgba(255,255,255,.35);
    border-top-color: currentColor;
    border-radius: 50%;
    animation: ux-spin .6s linear infinite;
    flex-shrink: 0;
}

/* ─── Banner offline (bottom) ────────────────────── */
#agro-offline-bar {
    position: fixed; bottom: 0; left: 0; right: 0;
    z-index: 2147483640;
    background: #1f2937; color: #fff;
    font-family: inherit; font-size: .82rem; font-weight: 600;
    padding: 9px 16px;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transform: translateY(100%); transition: transform .28s ease;
}
#agro-offline-bar.agro-show { transform: translateY(0); }

/* ─── Flash verde en fila nueva de tabla ─────────── */
@keyframes ux-row-flash {
    0%   { background: #d1fae5; }
    100% { background: transparent; }
}
.agro-row-new { animation: ux-row-flash 2s ease forwards; }
`;
    document.head.appendChild(s);
})();


// ════════════════════════════════════════════════════════════════════════
//  TOAST — notificaciones flotantes no bloqueantes
// ════════════════════════════════════════════════════════════════════════
function _toastWrap() {
    let w = document.getElementById('agro-toast-wrap');
    if (!w) { w = document.createElement('div'); w.id = 'agro-toast-wrap'; document.body.appendChild(w); }
    return w;
}

const _TOAST_PRESETS = {
    ok:      { ttl: '¡Listo!',           ico: '✓', cls: 'agro-toast-ok',      dur: 4000 },
    error:   { ttl: 'Algo salió mal',    ico: '✕', cls: 'agro-toast-error',   dur: 6500 },
    warn:    { ttl: 'Atención',          ico: '!', cls: 'agro-toast-warn',    dur: 5000 },
    info:    { ttl: 'Información',       ico: 'i', cls: 'agro-toast-info',    dur: 4500 },
    loading: { ttl: 'Procesando...',     ico: null, cls: 'agro-toast-loading', dur: 0   },
};

/**
 * @internal
 */
function _toast(type, msg, title, dur) {
    const p  = _TOAST_PRESETS[type] || _TOAST_PRESETS.info;
    const ms = (dur !== undefined) ? dur : p.dur;
    const ttl = title || p.ttl;

    const el = document.createElement('div');
    el.className = `agro-toast ${p.cls}`;

    const icoHTML = type === 'loading'
        ? `<div class="agro-toast-ico"><div class="agro-spin"></div></div>`
        : `<div class="agro-toast-ico">${p.ico}</div>`;

    const barHTML = ms > 0
        ? `<div class="agro-toast-bar" style="animation-duration:${ms}ms"></div>`
        : '';

    el.innerHTML = `
        ${icoHTML}
        <div class="agro-toast-body">
            <div class="agro-toast-ttl">${ttl}</div>
            ${msg ? `<div class="agro-toast-msg">${msg}</div>` : ''}
        </div>
        <button class="agro-toast-x" onclick="this.closest('.agro-toast')._ux_close()">✕</button>
        ${barHTML}`;

    let timer = null;
    el._ux_close = function () {
        if (timer) clearTimeout(timer);
        el.classList.remove('agro-in');
        el.classList.add('agro-out');
        setTimeout(() => el.remove(), 280);
    };

    _toastWrap().appendChild(el);
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('agro-in')));

    if (ms > 0) timer = setTimeout(() => el._ux_close(), ms);

    return { close: () => el._ux_close() };
}

/**
 * Toast — notificaciones flotantes para los 3 roles.
 *
 * Toast.ok('Entrega registrada correctamente')
 * Toast.error('No se pudo conectar')
 * Toast.warn('El precio no está actualizado')
 * Toast.info('Sincronizando...')
 * const t = Toast.loading('Cerrando ruta...')  →  t.close()
 */
const Toast = {
    ok     (msg, title, dur) { return _toast('ok',      msg, title, dur); },
    error  (msg, title, dur) { return _toast('error',   msg, title, dur); },
    warn   (msg, title, dur) { return _toast('warn',    msg, title, dur); },
    info   (msg, title, dur) { return _toast('info',    msg, title, dur); },
    loading(msg, title)      { return _toast('loading', msg, title, 0);   },
};
window.Toast = Toast;


// ════════════════════════════════════════════════════════════════════════
//  CONFIRM — modales de confirmación bonitos (reemplaza window.confirm)
// ════════════════════════════════════════════════════════════════════════
function _confirm({ type = 'danger', title, msg, okText, cancelText, onOk }) {
    const old = document.getElementById('agro-dlg-overlay');
    if (old) old.remove();

    const icons  = { danger: '🗑️', warn: '⚠️', info: 'ℹ️' };
    const okCls  = { danger: 'agro-btn-danger', warn: 'agro-btn-warn', info: 'agro-btn-primary' };
    const defOk  = { danger: 'Sí, eliminar', warn: 'Continuar', info: 'Aceptar' };

    const ov = document.createElement('div');
    ov.id = 'agro-dlg-overlay';
    ov.innerHTML = `
        <div class="agro-dlg agro-dlg-${type}">
            <div class="agro-dlg-ico-wrap">${icons[type] || '❓'}</div>
            <div class="agro-dlg-ttl">${title || '¿Seguro?'}</div>
            <div class="agro-dlg-msg">${msg}</div>
            <div class="agro-dlg-btns">
                <button class="agro-btn-cancel" id="_ux_cancel">${cancelText || 'Cancelar'}</button>
                <button class="${okCls[type]}" id="_ux_ok">${okText || defOk[type]}</button>
            </div>
        </div>`;
    document.body.appendChild(ov);
    requestAnimationFrame(() => requestAnimationFrame(() => ov.classList.add('agro-in')));

    const close = () => {
        ov.classList.remove('agro-in');
        setTimeout(() => ov.remove(), 220);
    };
    ov.addEventListener('click', e => { if (e.target === ov) close(); });
    document.getElementById('_ux_cancel').onclick = close;
    document.getElementById('_ux_ok').onclick = () => { close(); if (typeof onOk === 'function') onOk(); };
}

/**
 * Confirm — reemplaza window.confirm() con modales accesibles.
 *
 * // Eliminar / desactivar (rojo)
 * Confirm.danger('¿Desactivar a "Carlos"?', () => usr_desactivar(id))
 *
 * // Acción importante (amarillo)
 * Confirm.warn('¿Regenerar todos los QR?', () => prd_regenerarTodosQR())
 *
 * // Acción neutral (azul)
 * Confirm.info('¿Iniciar ruta de hoy?', () => rut_crearRuta())
 */
const Confirm = {
    danger(msg, onOk, opts = {}) { _confirm({ type: 'danger', msg, onOk, ...opts }); },
    warn  (msg, onOk, opts = {}) { _confirm({ type: 'warn',   msg, onOk, ...opts }); },
    info  (msg, onOk, opts = {}) { _confirm({ type: 'info',   msg, onOk, ...opts }); },
};
window.Confirm = Confirm;


// ════════════════════════════════════════════════════════════════════════
//  BTN — estados de botón: loading · reset · ok
// ════════════════════════════════════════════════════════════════════════
const Btn = {
    /**
     * Pone el botón en estado cargando (spinner + disabled).
     * Guarda el HTML original para restaurarlo con Btn.reset().
     *
     * Btn.loading(btn, 'Guardando...')
     */
    loading(el, msg) {
        if (!el) return;
        el.dataset._uxHtml = el.innerHTML;
        el.dataset._uxDis  = String(el.disabled);
        el.innerHTML = `<span class="agro-btn-loading-inner">
            <span class="agro-btn-spin"></span>
            ${msg || 'Procesando...'}
        </span>`;
        el.disabled = true;
        el.classList.add('agro-btn-loading');
    },

    /**
     * Restaura el botón a su estado original.
     * Btn.reset(btn)
     */
    reset(el) {
        if (!el) return;
        if (el.dataset._uxHtml !== undefined) {
            el.innerHTML = el.dataset._uxHtml;
            delete el.dataset._uxHtml;
        }
        el.disabled = el.dataset._uxDis === 'true';
        delete el.dataset._uxDis;
        el.classList.remove('agro-btn-loading');
    },

    /**
     * Flash verde en el botón por 1.5s, luego restaura.
     * Btn.ok(btn, '¡Guardado!')
     */
    ok(el, msg) {
        if (!el) return;
        const prev = el.innerHTML;
        const wasDisabled = el.disabled;
        el.innerHTML = `<span class="agro-btn-loading-inner">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12"/>
            </svg>
            ${msg || '¡Listo!'}
        </span>`;
        el.disabled = true;
        const origBg = el.style.background;
        el.style.background = '#16a34a';
        setTimeout(() => {
            el.innerHTML = prev;
            el.disabled  = wasDisabled;
            el.style.background = origBg;
        }, 1600);
    },
};
window.Btn = Btn;


// ════════════════════════════════════════════════════════════════════════
//  LOADING — spinner global de pantalla completa
//  Compatible con el spinner existente (#loading / #prd_loading)
// ════════════════════════════════════════════════════════════════════════
const Loading = {
    /**
     * Muestra el spinner global. Acepta mensaje personalizado.
     * Loading.show('Cerrando ruta...')
     */
    show(msg) {
        // Admin usa #loading
        const el = document.getElementById('loading');
        if (el) {
            const p = el.querySelector('p');
            if (p && msg) p.textContent = msg;
            el.classList.add('show');
        }
        // Productor usa #prd_loading
        const prd = document.getElementById('prd_loading');
        if (prd) prd.classList.add('show');
    },
    /** Oculta el spinner global. */
    hide() {
        const el = document.getElementById('loading');
        if (el) {
            el.classList.remove('show');
            const p = el.querySelector('p');
            if (p) p.textContent = 'Cargando...';
        }
        const prd = document.getElementById('prd_loading');
        if (prd) prd.classList.remove('show');
    },
};
window.Loading = Loading;

// Compatibilidad total con showLoading/hideLoading existentes
if (typeof window.showLoading !== 'function') window.showLoading = (m) => Loading.show(m);
if (typeof window.hideLoading !== 'function') window.hideLoading = ()  => Loading.hide();


// ════════════════════════════════════════════════════════════════════════
//  ERR — convierte errores técnicos en mensajes amigables
// ════════════════════════════════════════════════════════════════════════
const _ERR_MAP = [
    [/failed to fetch|network|net::/i,          'Sin conexión. Verifica tu internet e intenta de nuevo.'],
    [/401|unauthorized|no autorizado/i,          'Tu sesión expiró. Vuelve a iniciar sesión.'],
    [/403|forbidden|sin permiso/i,               'No tienes permisos para hacer esto.'],
    [/404|not found/i,                           'No se encontró el recurso solicitado.'],
    [/409|conflict|duplicate|ya existe/i,        'Ya existe un registro con esos datos.'],
    [/413|too large|demasiado grande/i,           'El archivo es demasiado grande.'],
    [/422|unprocessable/i,                       'Los datos enviados no son válidos.'],
    [/500|internal server/i,                     'Error del servidor. Intenta en un momento.'],
    [/503|unavailable/i,                         'Servidor no disponible. Intenta más tarde.'],
    [/timeout|timed out/i,                       'La operación tardó demasiado. Intenta de nuevo.'],
    [/token|jwt|expirado/i,                      'Tu sesión expiró. Vuelve a iniciar sesión.'],
    [/precio.*negativo|flete.*alto/i,            'El flete es muy alto — el precio final sería negativo.'],
    [/no tiene entregas/i,                       'Esta ruta no tiene entregas registradas.'],
    [/precio activo/i,                           'No hay precio configurado. El admin debe registrar los precios.'],
];

/**
 * Convierte un Error en mensaje entendible para el usuario.
 * Toast.error(Err.friendly(e))
 */
const Err = {
    friendly(e) {
        const raw = (e?.message || String(e || '')).toLowerCase();
        for (const [pat, txt] of _ERR_MAP) {
            if (pat.test(raw)) return txt;
        }
        const orig = e?.message || String(e || '');
        // Si el mensaje del backend es corto y legible, usarlo directamente
        if (orig.length < 130 && !orig.includes('\n') && !orig.includes('    at ')) return orig;
        return 'Ocurrió un error inesperado. Intenta de nuevo.';
    },
};
window.Err = Err;


// ════════════════════════════════════════════════════════════════════════
//  OFFLINE BANNER — detecta pérdida de conexión (útil para operario)
// ════════════════════════════════════════════════════════════════════════
(function _offlineBanner() {
    let bar = document.getElementById('agro-offline-bar');
    if (!bar) {
        bar = document.createElement('div');
        bar.id = 'agro-offline-bar';
        bar.innerHTML = `
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <line x1="1" y1="1" x2="23" y2="23"/>
                <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/>
                <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/>
                <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/>
                <path d="M10.71 5.05A16 16 0 0 1 22.56 9"/>
                <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
                <line x1="12" y1="20" x2="12.01" y2="20"/>
            </svg>
            Sin conexión — Los datos pueden no estar al día`;
        document.body.appendChild(bar);
    }
    window.addEventListener('offline', () => bar.classList.add('agro-show'));
    window.addEventListener('online',  () => {
        bar.classList.remove('agro-show');
        Toast.ok('¡Conexión restablecida!', 'En línea 🌐', 3000);
    });
})();


// ════════════════════════════════════════════════════════════════════════
//  PARCHEO AUTOMÁTICO — intercepta alert() nativo
//  Solo lo convierte en Toast. No toca window.confirm (síncrono).
// ════════════════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', function _patchAlert() {
    const _origAlert = window.alert.bind(window);
    window.alert = function (msg) {
        if (!msg) return;
        const m = String(msg);
        if (/error|falló|fallo|no se pudo|no hay|no puede|❌|bloqueó/i.test(m))     Toast.error(m);
        else if (/advertencia|atención|alto|⚠️/i.test(m))                           Toast.warn(m);
        else if (/correcto|guardado|creado|actualizado|regenerado|completo|✅/i.test(m)) Toast.ok(m);
        else                                                                          Toast.info(m);
    };

    // Captura global de promesas sin manejar
    window.addEventListener('unhandledrejection', function (e) {
        const guard = String(e.reason || '').includes('GUARD');
        if (!guard) {
            console.error('[AgroUX] Unhandled rejection:', e.reason);
            Toast.error(Err.friendly(e.reason), 'Error no capturado');
        }
        e.preventDefault();
    });

}, { once: true });


// ════════════════════════════════════════════════════════════════════════
//  TABLA FLASH — resalta la fila nueva en verde
// ════════════════════════════════════════════════════════════════════════
/**
 * Añade flash verde a la primera fila del tbody.
 * Llámalo después de re-renderizar la tabla.
 * tableFlashNew('cmp_tbody')
 */
function tableFlashNew(tbodyId) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    const row = tbody.querySelector('tr');
    if (!row) return;
    row.classList.remove('agro-row-new');
    requestAnimationFrame(() => requestAnimationFrame(() => row.classList.add('agro-row-new')));
}
window.tableFlashNew = tableFlashNew;

console.log('%c🌱 AgroTrace UX v2.0 cargado', 'color:#16a34a;font-weight:700');