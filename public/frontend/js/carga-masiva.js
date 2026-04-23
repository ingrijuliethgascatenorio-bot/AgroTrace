// ════════════════════════════════════════════════════════════════════════════
//  CARGA MASIVA — AgroTrace
//
//  Endpoints del backend (sin cambios):
//    POST /api/admin/upload-usuarios      → carga masiva de usuarios
//    POST /api/admin/upload-productores   → carga masiva de productores
//    POST /api/admin/upload-comerciantes  → carga masiva de comerciantes
//
//  Reciben:   multipart/form-data  campo: "file"  (CSV, max 2 MB)
//  Requieren: Authorization: Bearer <token>
//  Responden: { ok: true, data: { creados: number, errores: [{fila, datos, error}] } }
//
//  NOVEDADES v2:
//    · Validación estricta en el FRONTEND antes de enviar (una sola función)
//    · Soporte CSV (.csv) y Excel (.xlsx / .xls) — Excel se convierte a CSV en memoria
//    · Plantillas descargables (CSV y Excel) para cada módulo
// ════════════════════════════════════════════════════════════════════════════

'use strict';

// ════════════════════════════════════════════════════════════════════════════
//  REGLAS DE VALIDACIÓN — centralizadas, reutilizables
// ════════════════════════════════════════════════════════════════════════════

const CM_REGLAS = {
    // Solo letras con tildes/ñ y espacios internos. Sin dígitos ni símbolos.
    nombre:    /^[A-ZÁÉÍÓÚÜÑa-záéíóúüñ][A-ZÁÉÍÓÚÜÑa-záéíóúüñ ]{0,58}[A-ZÁÉÍÓÚÜÑa-záéíóúüñ]$/,
    // Email estándar
    email:     /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
    // Cédula colombiana: 5–12 dígitos
    cedula:    /^\d{5,12}$/,
    // Teléfono colombiano: 10 dígitos, inicia en 3 o 6 (con prefijo +57 opcional)
    telefono:  /^(\+?57)?[36]\d{8}$/,
    // Password segura: mín 8 chars, 1 mayúscula, 1 número, 1 símbolo especial
    password:  /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/,
    // Finca: letras, números, espacios, guiones
    finca:     /^[A-ZÁÉÍÓÚÜÑa-záéíóúüñ0-9][A-ZÁÉÍÓÚÜÑa-záéíóúüñ0-9 \-]{0,78}$/,
    // Ubicación: letras, números, espacios, comas, guiones, puntos
    ubicacion: /^[A-ZÁÉÍÓÚÜÑa-záéíóúüñ0-9][A-ZÁÉÍÓÚÜÑa-záéíóúüñ0-9 ,.\-]{0,118}$/,
    // Nombre de comerciante/empresa: letras, números, espacios, &, guiones, puntos
    nombre_com:/^[A-ZÁÉÍÓÚÜÑa-záéíóúüñ0-9][A-ZÁÉÍÓÚÜÑa-záéíóúüñ0-9 &.\-]{0,98}$/,
    // Dirección: letras, números, #, guiones, puntos, comas
    direccion: /^[A-ZÁÉÍÓÚÜÑa-záéíóúüñ0-9#][A-ZÁÉÍÓÚÜÑa-záéíóúüñ0-9 #,.\-]{0,118}$/,
};

// Roles válidos para usuarios
const CM_ROLES = ['ADMIN', 'OPERARIO', 'PRODUCTOR'];

// ════════════════════════════════════════════════════════════════════════════
//  ESQUEMAS DE COLUMNAS — uno por módulo
//
//  Cada campo:
//    key      → nombre exacto de columna en CSV/Excel
//    label    → etiqueta legible para mensajes de error
//    regla    → clave de CM_REGLAS | 'enum'
//    enum     → valores permitidos (cuando regla === 'enum')
//    noEmail  → true: rechaza si contiene '@'  (nombres/apellidos)
//    noNum    → true: rechaza si contiene dígito (nombres/apellidos)
// ════════════════════════════════════════════════════════════════════════════

const CM_ESQUEMAS = {
    usuarios: [
        { key: 'nombre',       label: 'Nombre',         regla: 'nombre',   noEmail: true, noNum: true },
        { key: 'apellido',     label: 'Apellido',        regla: 'nombre',   noEmail: true, noNum: true },
        { key: 'email',        label: 'Correo',          regla: 'email'   },
        { key: 'password',     label: 'Contraseña',      regla: 'password' },
        { key: 'telefono',     label: 'Teléfono',        regla: 'telefono' },
        { key: 'cedula',       label: 'Cédula',          regla: 'cedula'  },
        { key: 'tipo_usuario', label: 'Tipo de usuario', regla: 'enum', enum: CM_ROLES },
    ],
    productores: [
        { key: 'nombre',    label: 'Nombre',    regla: 'nombre',   noEmail: true, noNum: true },
        { key: 'apellido',  label: 'Apellido',  regla: 'nombre',   noEmail: true, noNum: true },
        { key: 'email',     label: 'Correo',    regla: 'email'   },
        { key: 'password',  label: 'Contraseña',regla: 'password' },
        { key: 'telefono',  label: 'Teléfono',  regla: 'telefono' },
        { key: 'cedula',    label: 'Cédula',    regla: 'cedula'  },
        { key: 'finca',     label: 'Finca',     regla: 'finca'   },
        { key: 'ubicacion', label: 'Ubicación', regla: 'ubicacion'},
    ],
    comerciantes: [
        { key: 'nombre',    label: 'Nombre',    regla: 'nombre_com' },
        { key: 'telefono',  label: 'Teléfono',  regla: 'telefono'  },
        { key: 'direccion', label: 'Dirección', regla: 'direccion' },
        { key: 'email',     label: 'Correo',    regla: 'email'     },
    ],
};

// ════════════════════════════════════════════════════════════════════════════
//  ▶  FUNCIÓN CENTRAL DE VALIDACIÓN  ◀
//
//  Una sola función para todos los módulos.
//  Recibe: filas parseadas [{_n, col: val, ...}] + esquema del módulo.
//  Devuelve: array de strings con todos los errores. Vacío = todo OK.
// ════════════════════════════════════════════════════════════════════════════

function cm_validar(filas, esquema) {
    const errores = [];

    // — Paso 1: detectar cédulas duplicadas dentro del archivo —
    const cedulasSeen = new Map();
    filas.forEach(fila => {
        const ced = String(fila.cedula ?? '').trim();
        if (!ced) return;
        if (cedulasSeen.has(ced)) {
            errores.push(`Fila ${fila._n}: cédula "${ced}" duplicada (ya aparece en fila ${cedulasSeen.get(ced)}).`);
        } else {
            cedulasSeen.set(ced, fila._n);
        }
    });

    // — Paso 2: validar cada fila campo por campo —
    filas.forEach(fila => {
        const n = fila._n;

        for (const campo of esquema) {
            const val = String(fila[campo.key] ?? '').trim();

            // Obligatoriedad
            if (!val) {
                errores.push(`Fila ${n} · ${campo.label}: campo vacío.`);
                continue;
            }

            // Protecciones específicas para nombre y apellido
            if (campo.noEmail && val.includes('@')) {
                errores.push(`Fila ${n} · ${campo.label}: no puede ser un correo ("${val}"). Escribe solo el nombre.`);
                continue;
            }
            if (campo.noNum && /\d/.test(val)) {
                errores.push(`Fila ${n} · ${campo.label}: no puede contener números ("${val}"). Solo letras y espacios.`);
                continue;
            }

            // Enum (lista cerrada)
            if (campo.regla === 'enum') {
                if (!campo.enum.includes(val.toUpperCase())) {
                    errores.push(`Fila ${n} · ${campo.label}: "${val}" no es válido. Permitidos: ${campo.enum.join(', ')}.`);
                }
                continue;
            }

            // Regex
            const re = CM_REGLAS[campo.regla];
            if (re && !re.test(val)) {
                errores.push(`Fila ${n} · ${campo.label}: "${val}" — ${_cm_ayuda(campo.regla)}`);
            }
        }
    });

    return errores;
}

/** Mensajes de ayuda por regla */
function _cm_ayuda(regla) {
    return ({
        nombre:    'solo letras y espacios (ej: Maria Fernanda).',
        email:     'formato de correo inválido (ej: usuario@dominio.com).',
        cedula:    'solo dígitos, entre 5 y 12 (ej: 10345678).',
        telefono:  '10 dígitos iniciando en 3 o 6 (ej: 3101234567).',
        password:  'mínimo 8 caracteres, 1 mayúscula, 1 número y 1 símbolo especial.',
        finca:     'letras, números y guiones (ej: Finca El Paraíso).',
        ubicacion: 'letras, números, comas y guiones (ej: Vereda El Centro, Caquetá).',
        nombre_com:'letras, números, espacios y guiones.',
        direccion: 'letras, números, #, guiones y comas (ej: Cra 5 #12-34).',
    })[regla] || 'formato inválido.';
}

// ════════════════════════════════════════════════════════════════════════════
//  PARSERS — CSV y Excel → filas con _n (número de fila original)
// ════════════════════════════════════════════════════════════════════════════

/** Parsea texto CSV (soporta coma y punto y coma). Retorna {filas, encabezados, error}. */
function _cm_parsearCSV(texto) {
    const sep   = (texto.split('\n')[0] || '').indexOf(';') !== -1 ? ';' : ',';
    const lines = texto.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return { error: 'El archivo no tiene filas de datos.' };

    const encabezados = _cm_splitLinea(lines[0], sep).map(h => h.toLowerCase().trim());
    const filas = [];

    for (let i = 1; i < lines.length; i++) {
        const cols = _cm_splitLinea(lines[i], sep);
        if (cols.every(c => !c.trim())) continue; // fila en blanco
        const obj = { _n: i + 1 };
        encabezados.forEach((h, idx) => { obj[h] = (cols[idx] ?? '').trim(); });
        filas.push(obj);
    }
    return { filas, encabezados, error: null };
}

/** Divide línea CSV respetando campos entre comillas dobles. */
function _cm_splitLinea(line, sep) {
    const res = []; let cur = ''; let q = false;
    for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') { if (q && line[i+1] === '"') { cur += '"'; i++; } else q = !q; }
        else if (c === sep && !q) { res.push(cur); cur = ''; }
        else cur += c;
    }
    res.push(cur);
    return res;
}

/**
 * Convierte un archivo Excel a un File CSV usando SheetJS.
 * Retorna Promise<{csvFile: File|null, error: string|null}>
 */
function _cm_excelACSV(archivo) {
    return new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = e => {
            try {
                const wb  = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
                const ws  = wb.Sheets[wb.SheetNames[0]];
                const csv = XLSX.utils.sheet_to_csv(ws, { blankrows: false });
                const csvFile = new File(
                    [csv],
                    archivo.name.replace(/\.(xlsx|xls)$/i, '.csv'),
                    { type: 'text/csv' }
                );
                resolve({ csvFile, error: null });
            } catch (err) {
                resolve({ csvFile: null, error: `No se pudo leer el Excel: ${err.message}` });
            }
        };
        reader.onerror = () => resolve({ csvFile: null, error: 'Error al leer el archivo.' });
        reader.readAsArrayBuffer(archivo);
    });
}

// ════════════════════════════════════════════════════════════════════════════
//  PLANTILLAS — datos de cada módulo
// ════════════════════════════════════════════════════════════════════════════

const CM_PLANTILLAS = {
    usuarios: {
        encabezados: ['nombre','apellido','email','password','telefono','cedula','tipo_usuario'],
        ejemplo:     ['Juan Carlos','Pérez López','juanc@correo.com','Admin@2024','3201234567','10987654','OPERARIO'],
        instrucciones: [
            ['Campo','Regla','Ejemplo'],
            ['nombre',      'Solo letras y espacios. Sin números ni @.',       'Juan Carlos'],
            ['apellido',    'Solo letras y espacios. Sin números ni @.',       'Pérez López'],
            ['email',       'Correo electrónico válido.',                      'juanc@correo.com'],
            ['password',    'Mín 8 chars, 1 mayúscula, 1 número, 1 símbolo.', 'Admin@2024'],
            ['telefono',    '10 dígitos, inicia en 3 o 6.',                   '3201234567'],
            ['cedula',      'Solo dígitos, entre 5 y 12 caracteres.',         '10987654'],
            ['tipo_usuario','Exactamente: ADMIN, OPERARIO o PRODUCTOR.',      'OPERARIO'],
        ],
    },
    productores: {
        encabezados: ['nombre','apellido','email','password','telefono','cedula','finca','ubicacion'],
        ejemplo:     ['Maria Fernanda','Ríos Gómez','mariaf@correo.com','Pass@2024','3101234567','10345678','Finca El Paraíso','Vereda El Centro, Florencia'],
        instrucciones: [
            ['Campo','Regla','Ejemplo'],
            ['nombre',    'Solo letras y espacios. Sin números ni @.',       'Maria Fernanda'],
            ['apellido',  'Solo letras y espacios. Sin números ni @.',       'Ríos Gómez'],
            ['email',     'Correo electrónico válido.',                      'mariaf@correo.com'],
            ['password',  'Mín 8 chars, 1 mayúscula, 1 número, 1 símbolo.', 'Pass@2024'],
            ['telefono',  '10 dígitos, inicia en 3 o 6.',                   '3101234567'],
            ['cedula',    'Solo dígitos, entre 5 y 12 caracteres.',         '10345678'],
            ['finca',     'Letras, números y guiones.',                      'Finca El Paraíso'],
            ['ubicacion', 'Letras, números, comas y guiones.',               'Vereda El Centro, Florencia'],
        ],
    },
    comerciantes: {
        encabezados: ['nombre','telefono','direccion','email'],
        ejemplo:     ['Comercializadora El Buen Precio','3154567890','Cra 5 #12-34, Florencia','comercio@correo.com'],
        instrucciones: [
            ['Campo','Regla','Ejemplo'],
            ['nombre',    'Letras, números, espacios y guiones.',      'Comercializadora El Buen Precio'],
            ['telefono',  '10 dígitos, inicia en 3 o 6.',             '3154567890'],
            ['direccion', 'Letras, números, #, guiones y comas.',     'Cra 5 #12-34, Florencia'],
            ['email',     'Correo electrónico válido.',                'comercio@correo.com'],
        ],
    },
};

/** Descarga la plantilla en formato CSV. */
function cm_descargarPlantillaCSV(modulo) {
    const p = CM_PLANTILLAS[modulo];
    if (!p) return;
    const csv  = [p.encabezados, p.ejemplo].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a    = Object.assign(document.createElement('a'), {
        href: URL.createObjectURL(blob),
        download: `plantilla_${modulo}_${_cm_hoy()}.csv`,
    });
    a.click();
    URL.revokeObjectURL(a.href);
}

/** Descarga la plantilla en formato Excel (.xlsx) con hoja de instrucciones. */
function cm_descargarPlantillaExcel(modulo) {
    if (!window.XLSX) { _cm_cargarXLSX(() => cm_descargarPlantillaExcel(modulo)); return; }
    const p = CM_PLANTILLAS[modulo];
    if (!p) return;
    const wb = XLSX.utils.book_new();

    // Hoja 1 — Datos (encabezado + fila de ejemplo)
    const wsDatos = XLSX.utils.aoa_to_sheet([p.encabezados, p.ejemplo]);
    wsDatos['!cols'] = p.encabezados.map((h, i) => ({
        wch: Math.max(h.length, String(p.ejemplo[i] ?? '').length, 14),
    }));
    XLSX.utils.book_append_sheet(wb, wsDatos, 'Datos');

    // Hoja 2 — Instrucciones
    const wsInstr = XLSX.utils.aoa_to_sheet(p.instrucciones);
    wsInstr['!cols'] = [{ wch: 14 }, { wch: 46 }, { wch: 32 }];
    XLSX.utils.book_append_sheet(wb, wsInstr, 'Instrucciones');

    XLSX.writeFile(wb, `plantilla_${modulo}_${_cm_hoy()}.xlsx`);
}

// ════════════════════════════════════════════════════════════════════════════
//  UI — utilidades compartidas (igual que la versión original)
// ════════════════════════════════════════════════════════════════════════════

/** Muestra / oculta el cuerpo de una card de carga masiva. */
function cm_toggle(bodyId, chevronId) {
    const body    = document.getElementById(bodyId);
    const chevron = document.getElementById(chevronId);
    if (!body) return;
    const abriendo = body.style.display === 'none' || body.style.display === '';
    body.style.display = abriendo ? 'block' : 'none';
    const header = body.previousElementSibling;
    if (header)  header.classList.toggle('open', abriendo);
    if (chevron) chevron.classList.toggle('open', abriendo);
}

/** Actualiza el label del input file al seleccionar un archivo. */
function cm_onFileChange(input, spanId, labelId) {
    const span  = document.getElementById(spanId);
    const label = document.getElementById(labelId);
    if (!span) return;

    if (input.files && input.files.length > 0) {
        const nombre  = input.files[0].name;
        const esExcel = /\.(xlsx|xls)$/i.test(nombre);
        const esCSV   = /\.csv$/i.test(nombre);

        span.textContent = nombre.length > 34 ? '…' + nombre.slice(-31) : nombre;

        if (label) {
            label.classList.remove('has-file', 'is-excel', 'is-csv', 'is-invalid');
            label.classList.add('has-file');
            if (esExcel)    label.classList.add('is-excel');
            else if (esCSV) label.classList.add('is-csv');
            else            label.classList.add('is-invalid');
        }

        // Pre-cargar SheetJS si es Excel (para no tener retraso al subir)
        if (esExcel && !window.XLSX) _cm_cargarXLSX();
    } else {
        span.textContent = 'Seleccionar archivo .csv o .xlsx';
        if (label) label.classList.remove('has-file', 'is-excel', 'is-csv', 'is-invalid');
    }
}

/** Renderiza el resultado del backend en el contenedor (igual que versión original). */
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
        </div><div class="cm-errors-list">`;
        errores.forEach(e => {
            const fila = e.fila !== undefined ? `Fila ${e.fila}: ` : '';
            const msg  = typeof e.error === 'string' ? e.error : JSON.stringify(e.error);
            html += `<div class="cm-error-item"><strong>${fila}</strong>${msg}</div>`;
        });
        html += '</div>';
    }
    if (creados === 0 && (!errores || errores.length === 0)) {
        html = '<div class="cm-ok">Proceso completado. No se crearon nuevos registros.</div>';
    }
    container.innerHTML = html;
}

// ════════════════════════════════════════════════════════════════════════════
//  NÚCLEO — validar en frontend y enviar al backend como multipart/form-data
// ════════════════════════════════════════════════════════════════════════════

/**
 * Valida el archivo localmente y, si pasa, lo sube al backend.
 * Soporta CSV y Excel. El Excel se convierte a CSV en memoria antes de enviarse.
 *
 * @param {object} opts
 *   inputId   {string}    id del <input type="file">
 *   btnId     {string}    id del botón de subida
 *   loaderId  {string}    id del spinner loader
 *   resultId  {string}    id del div de resultados
 *   endpoint  {string}    ruta relativa, ej: '/admin/upload-usuarios'
 *   modulo    {string}    clave de CM_ESQUEMAS para validar
 *   onSuccess {Function}  callback() tras creación exitosa
 */
async function cm_enviarCSV({ inputId, btnId, loaderId, resultId, endpoint, modulo, onSuccess }) {
    const inputEl   = document.getElementById(inputId);
    const btnEl     = document.getElementById(btnId);
    const loaderEl  = document.getElementById(loaderId);
    const resultEl  = document.getElementById(resultId);

    // — Verificar que hay archivo —
    if (!inputEl?.files?.length) {
        resultEl.innerHTML = _cm_htmlError('Selecciona un archivo CSV o Excel primero.');
        return;
    }

    const archivo = inputEl.files[0];
    const esExcel = /\.(xlsx|xls)$/i.test(archivo.name);
    const esCSV   = /\.csv$/i.test(archivo.name);

    if (!esCSV && !esExcel) {
        resultEl.innerHTML = _cm_htmlError('Solo se aceptan archivos .csv, .xlsx o .xls');
        return;
    }

    // — Bloquear UI —
    btnEl.disabled         = true;
    loaderEl.style.display = 'flex';
    resultEl.innerHTML     = '';

    try {
        // — Obtener File CSV (convirtiendo si es Excel) —
        let csvFile;

        if (esExcel) {
            if (!window.XLSX) {
                resultEl.innerHTML = _cm_htmlError('SheetJS no está listo. Recarga la página e intenta de nuevo.');
                return;
            }
            const { csvFile: cf, error } = await _cm_excelACSV(archivo);
            if (error) { resultEl.innerHTML = _cm_htmlError(error); return; }
            csvFile = cf;
        } else {
            csvFile = archivo;
        }

        // — Parsear CSV para validar en el frontend —
        const textoCSV = await csvFile.text();
        const { filas, encabezados, error: parseError } = _cm_parsearCSV(textoCSV);

        if (parseError)   { resultEl.innerHTML = _cm_htmlError(parseError); return; }
        if (!filas.length){ resultEl.innerHTML = _cm_htmlError('El archivo está vacío o no tiene filas de datos.'); return; }

        // — Verificar columnas requeridas —
        const esquema        = CM_ESQUEMAS[modulo] || [];
        const colsRequeridas = esquema.map(c => c.key);
        const colsFaltantes  = colsRequeridas.filter(c => !encabezados.includes(c));

        if (colsFaltantes.length) {
            resultEl.innerHTML = _cm_htmlError(
                `Columnas faltantes: <strong>${colsFaltantes.join(', ')}</strong><br>` +
                `El archivo tiene: <code>${encabezados.join(', ')}</code>`
            );
            return;
        }

        // — VALIDACIÓN ESTRICTA (una sola función para todos los módulos) —
        const erroresFrontend = cm_validar(filas, esquema);

        if (erroresFrontend.length) {
            resultEl.innerHTML = _cm_htmlErroresLista(erroresFrontend, filas.length);
            return;
        }

        // — Todo válido: enviar al backend como multipart/form-data —
        const token    = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
        const formData = new FormData();
        formData.append('file', csvFile);

        const res = await fetch(`${API_URL}${endpoint}`, {
            method:  'POST',
            headers: { Authorization: `Bearer ${token}` },
            // ⚠️ NO poner Content-Type: fetch lo establece solo con el boundary correcto
            body:    formData,
        });

        const json = await res.json().catch(() => ({}));

        if (!res.ok) {
            const msg = json.message
                || (Array.isArray(json.errors) ? json.errors.join(', ') : null)
                || `Error del servidor (HTTP ${res.status})`;
            resultEl.innerHTML = _cm_htmlError(`Error del servidor: ${msg}`);
            return;
        }

        // — Mostrar resultado del backend —
        const data    = json.data || json;
        const creados = typeof data.creados === 'number' ? data.creados : 0;
        const errores = Array.isArray(data.errores) ? data.errores : [];

        cm_renderResultado(resultId, creados, errores);

        if (creados > 0 && typeof onSuccess === 'function') onSuccess(creados);

    } catch (err) {
        resultEl.innerHTML = _cm_htmlError(`Error de red: ${err.message}`);
    } finally {
        btnEl.disabled         = false;
        loaderEl.style.display = 'none';
    }
}

// ════════════════════════════════════════════════════════════════════════════
//  FUNCIONES PÚBLICAS — una por módulo (misma firma que la versión original)
// ════════════════════════════════════════════════════════════════════════════

// Endpoint: POST /api/admin/upload-usuarios
// CSV/Excel: nombre,apellido,email,password,telefono,cedula,tipo_usuario
function cm_subirUsuarios() {
    cm_enviarCSV({
        inputId:  'cm_usr_file',
        btnId:    'cm_usr_btn',
        loaderId: 'cm_usr_loader',
        resultId: 'cm_usr_result',
        endpoint: '/admin/upload-usuarios',
        modulo:   'usuarios',
        onSuccess: () => usr_cargar(),
    });
}

// Endpoint: POST /api/admin/upload-productores
// CSV/Excel: nombre,apellido,email,password,telefono,cedula,finca,ubicacion
// Crea: Usuario + Productor + QR automáticamente
function cm_subirProductores() {
    cm_enviarCSV({
        inputId:  'cm_prod_file',
        btnId:    'cm_prod_btn',
        loaderId: 'cm_prod_loader',
        resultId: 'cm_prod_result',
        endpoint: '/admin/upload-productores',
        modulo:   'productores',
        onSuccess: () => prd_cargar(),
    });
}

// Endpoint: POST /api/admin/upload-comerciantes
// CSV/Excel: nombre,telefono,direccion,email
function cm_subirComerciantes() {
    cm_enviarCSV({
        inputId:  'cm_com_file',
        btnId:    'cm_com_btn',
        loaderId: 'cm_com_loader',
        resultId: 'cm_com_result',
        endpoint: '/admin/upload-comerciantes',
        modulo:   'comerciantes',
        onSuccess: () => { if (typeof com_cargar === 'function') com_cargar(); },
    });
}

// ════════════════════════════════════════════════════════════════════════════
//  HELPERS INTERNOS
// ════════════════════════════════════════════════════════════════════════════

function _cm_htmlError(msg) {
    return `<div class="cm-errors-list">
        <div class="cm-error-item"><strong>❌ Error: </strong>${msg}</div>
    </div>`;
}

function _cm_htmlErroresLista(errores, totalFilas) {
    const MAX = 25;
    const ver = errores.slice(0, MAX);
    const mas = errores.length - MAX;
    return `
        <div class="cm-errors-title">
            ❌ Validación fallida — ${errores.length} error(es) en ${totalFilas} fila(s).
            <small style="font-weight:400;display:block;margin-top:2px">
                Corrige el archivo y vuelve a subirlo.
                <strong>No se envió ningún dato al servidor.</strong>
            </small>
        </div>
        <div class="cm-errors-list">
            ${ver.map(e => `<div class="cm-error-item">${e}</div>`).join('')}
            ${mas > 0
                ? `<div class="cm-error-item" style="color:#9ca3af;font-style:italic">… y ${mas} error(es) más. Revisa el archivo completo.</div>`
                : ''}
        </div>`;
}

/** Carga SheetJS dinámicamente solo si no está disponible. */
function _cm_cargarXLSX(cb) {
    if (window.XLSX) { cb && cb(); return; }
    const s  = document.createElement('script');
    s.src    = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
    s.onload  = () => { cb && cb(); };
    s.onerror = () => console.error('[CM] No se pudo cargar SheetJS.');
    document.head.appendChild(s);
}

/** Fecha actual en formato YYYY-MM-DD hora Colombia. */
function _cm_hoy() {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date());
}