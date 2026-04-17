// ════════════════════════════════════════════════════════════════════════════
//  CARGA MASIVA — Agrega al final de frontend/js/app.js
//
//  Endpoints reales del backend:
//    POST /api/admin/upload-usuarios     → carga masiva de usuarios
//    POST /api/admin/upload-productores  → carga masiva de productores
//
//  Ambos reciben:  multipart/form-data  campo: "file"  (CSV, max 2 MB)
//  Ambos requieren: Authorization: Bearer <token>
//  Ambos responden: { ok: true, data: { creados: number, errores: [{fila, datos, error}] } }
// ════════════════════════════════════════════════════════════════════════════

// ── Utilidades compartidas ───────────────────────────────────────────────────

/**
 * Muestra / oculta el cuerpo de una card de carga masiva.
 * @param {string} bodyId  - id del div .cm-card-body
 * @param {string} chevronId - id del icono chevron
 */
function cm_toggle(bodyId, chevronId) {
    const body    = document.getElementById(bodyId);
    const chevron = document.getElementById(chevronId);
    if (!body) return;

    const abriendo = body.style.display === 'none' || body.style.display === '';
    body.style.display = abriendo ? 'block' : 'none';

    const header = body.previousElementSibling;
    if (header) header.classList.toggle('open', abriendo);
    if (chevron) chevron.classList.toggle('open', abriendo);
}

/**
 * Actualiza el label del input file con el nombre del archivo seleccionado.
 * @param {HTMLInputElement} input
 * @param {string} spanId
 * @param {string} labelId - clase .cm-file-label a marcar con has-file
 */
function cm_onFileChange(input, spanId, labelId) {
    const span  = document.getElementById(spanId);
    const label = document.getElementById(labelId);
    if (!span) return;

    if (input.files && input.files.length > 0) {
        span.textContent = input.files[0].name;
        if (label) label.classList.add('has-file');
    } else {
        span.textContent = 'Seleccionar archivo .csv';
        if (label) label.classList.remove('has-file');
    }
}

/**
 * Valida que haya un archivo .csv seleccionado en el input indicado.
 * Muestra alert si no cumple.
 * @param {string} inputId
 * @returns {File|null}
 */
function cm_validarArchivo(inputId) {
    const input = document.getElementById(inputId);
    if (!input || !input.files || input.files.length === 0) {
        alert('Debes seleccionar un archivo CSV primero.');
        return null;
    }
    const file = input.files[0];
    if (!file.name.toLowerCase().endsWith('.csv')) {
        alert('Solo se aceptan archivos con extensión .csv');
        return null;
    }
    return file;
}

/**
 * Renderiza el resultado de la carga masiva en el contenedor indicado.
 * @param {string} containerId
 * @param {number} creados
 * @param {Array<{fila: number, error: string}>} errores
 */
function cm_renderResultado(containerId, creados, errores) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let html = '';

    if (creados > 0) {
        html += `<div class="cm-ok">
            <i class="fi fi-rr-check"></i>
            ${creados} registro${creados !== 1 ? 's' : ''} creado${creados !== 1 ? 's' : ''} correctamente.
        </div>`;
    }

    if (errores && errores.length > 0) {
        html += `<div class="cm-errors-title">
            ❌ ${errores.length} error${errores.length !== 1 ? 'es' : ''} encontrado${errores.length !== 1 ? 's' : ''}:
        </div>`;
        html += `<div class="cm-errors-list">`;
        errores.forEach(e => {
            const fila = e.fila !== undefined ? `Fila ${e.fila}: ` : '';
            const msg  = typeof e.error === 'string'
                ? e.error
                : JSON.stringify(e.error);
            html += `<div class="cm-error-item"><strong>${fila}</strong>${msg}</div>`;
        });
        html += `</div>`;
    }

    if (creados === 0 && (!errores || errores.length === 0)) {
        html = `<div class="cm-ok">Proceso completado. No se crearon nuevos registros.</div>`;
    }

    container.innerHTML = html;
}

/**
 * Lógica central de envío al backend (igual para usuarios y productores).
 * @param {object} opts
 */
async function cm_enviarCSV({
    inputId,
    btnId,
    loaderId,
    resultId,
    endpoint,        // ruta relativa, ej: '/admin/upload-usuarios'
    onSuccess,       // callback(creados) → para refrescar tabla
}) {
    const file = cm_validarArchivo(inputId);
    if (!file) return;

    const btn    = document.getElementById(btnId);
    const loader = document.getElementById(loaderId);
    const result = document.getElementById(resultId);

    // Reset UI
    btn.disabled = true;
    loader.style.display = 'flex';
    result.innerHTML = '';

    const token    = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);

    try {
        const res = await fetch(`${API_URL}${endpoint}`, {
            method:  'POST',
            headers: { Authorization: `Bearer ${token}` },
            // NO establecer Content-Type — fetch lo hace automáticamente con boundary
            body:    formData,
        });

        const json = await res.json().catch(() => ({}));

        if (!res.ok) {
            // Error HTTP (400, 401, 403, 500, etc.)
            const msg = json.message
                || (Array.isArray(json.message) ? json.message.join(', ') : null)
                || `Error del servidor (HTTP ${res.status})`;

            result.innerHTML = `<div class="cm-errors-list">
                <div class="cm-error-item"><strong>Error: </strong>${msg}</div>
            </div>`;
            return;
        }

        // Respuesta exitosa: { ok: true, data: { creados, errores } }
        const data = json.data || json;
        const creados = typeof data.creados === 'number' ? data.creados : 0;
        const errores = Array.isArray(data.errores) ? data.errores : [];

        cm_renderResultado(resultId, creados, errores);

        if (creados > 0 && typeof onSuccess === 'function') {
            onSuccess(creados);
        }

    } catch (e) {
        result.innerHTML = `<div class="cm-errors-list">
            <div class="cm-error-item"><strong>Error de red: </strong>${e.message}</div>
        </div>`;
    } finally {
        btn.disabled = false;
        loader.style.display = 'none';
    }
}

// ── CARGA MASIVA DE USUARIOS ─────────────────────────────────────────────────
// Endpoint: POST /api/admin/upload-usuarios
// CSV:      nombre,apellido,email,password,telefono,cedula,tipo_usuario
// ────────────────────────────────────────────────────────────────────────────
function cm_subirUsuarios() {
    cm_enviarCSV({
        inputId:  'cm_usr_file',
        btnId:    'cm_usr_btn',
        loaderId: 'cm_usr_loader',
        resultId: 'cm_usr_result',
        endpoint: '/admin/upload-usuarios',
        onSuccess: () => usr_cargar(),
    });
}

// ── CARGA MASIVA DE PRODUCTORES ──────────────────────────────────────────────
// Endpoint: POST /api/admin/upload-productores
// CSV:      nombre,apellido,email,password,telefono,cedula,finca,ubicacion
// Crea:     Usuario (con cedula y telefono) + Productor (finca, ubicacion, QR)
// ────────────────────────────────────────────────────────────────────────────
function cm_subirProductores() {
    cm_enviarCSV({
        inputId:  'cm_prod_file',
        btnId:    'cm_prod_btn',
        loaderId: 'cm_prod_loader',
        resultId: 'cm_prod_result',
        endpoint: '/admin/upload-productores',
        onSuccess: () => prd_cargar(),
    });
}

// ── CARGA MASIVA DE COMERCIANTES ─────────────────────────────────────────────
// Endpoint: POST /api/admin/upload-comerciantes
// CSV:      nombre,telefono,direccion,email
// ────────────────────────────────────────────────────────────────────────────
function cm_subirComerciantes() {
    cm_enviarCSV({
        inputId:  'cm_com_file',
        btnId:    'cm_com_btn',
        loaderId: 'cm_com_loader',
        resultId: 'cm_com_result',
        endpoint: '/admin/upload-comerciantes',
        onSuccess: () => { if (typeof com_cargar === 'function') com_cargar(); },
    });
}