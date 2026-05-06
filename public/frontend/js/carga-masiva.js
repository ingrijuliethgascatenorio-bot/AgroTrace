// ════════════════════════════════════════════════════════════════════════════
//  CARGA MASIVA — AgroTrace
//
//  Endpoints del backend:
//    POST /api/admin/upload-usuarios             → carga masiva de usuarios
//    POST /api/admin/upload-productores          → carga masiva de productores
//    POST /api/admin/upload-productores-update   → actualiza finca/ubicacion
//    POST /api/admin/upload-comerciantes         → carga masiva de comerciantes
//
//  Reciben:   multipart/form-data  campo: "file"  (CSV o Excel, max 5 MB)
//  Requieren: Authorization: Bearer <token>
//  Responden: { ok: true, data: { creados|actualizados: number, errores: [...] } }
//
//  NOVEDADES v3:
//    · Módulo productores_update: actualiza finca y ubicacion por cédula
//    · cm_enviarCSV mapea data.actualizados además de data.creados
//    · cm_renderResultado muestra "actualizados" cuando corresponde
// ════════════════════════════════════════════════════════════════════════════

'use strict';

// ════════════════════════════════════════════════════════════════════════════
//  REGLAS DE VALIDACIÓN — centralizadas, reutilizables
// ════════════════════════════════════════════════════════════════════════════

const CM_REGLAS = {
    nombre:    /^[A-ZÁÉÍÓÚÜÑa-záéíóúüñ][A-ZÁÉÍÓÚÜÑa-záéíóúüñ ]{0,58}[A-ZÁÉÍÓÚÜÑa-záéíóúüñ]$/,
    email:     /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
    cedula:    /^\d{5,12}$/,
    telefono:  /^(\+?57)?[36]\d{9}$/,
    password:  /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/,
    finca:     /^[A-ZÁÉÍÓÚÜÑa-záéíóúüñ0-9][A-ZÁÉÍÓÚÜÑa-záéíóúüñ0-9 \-]{0,78}$/,
    ubicacion: /^[A-ZÁÉÍÓÚÜÑa-záéíóúüñ0-9][A-ZÁÉÍÓÚÜÑa-záéíóúüñ0-9 ,.\-]{0,118}$/,
    nombre_com:/^[A-ZÁÉÍÓÚÜÑa-záéíóúüñ0-9][A-ZÁÉÍÓÚÜÑa-záéíóúüñ0-9 &.\-]{0,98}$/,
    direccion: /^[A-ZÁÉÍÓÚÜÑa-záéíóúüñ0-9#][A-ZÁÉÍÓÚÜÑa-záéíóúüñ0-9 #,.\-]{0,118}$/,
};

const CM_ROLES = ['ADMIN', 'OPERARIO', 'PRODUCTOR'];

// ════════════════════════════════════════════════════════════════════════════
//  ESQUEMAS DE COLUMNAS — uno por módulo
// ════════════════════════════════════════════════════════════════════════════

const CM_ESQUEMAS = {
    usuarios: [
        { key: 'nombre',       label: 'Nombre',         regla: 'nombre',   noEmail: true, noNum: true },
        { key: 'apellido',     label: 'Apellido',        regla: 'nombre',   noEmail: true, noNum: true },
        { key: 'email',        label: 'Correo',          regla: 'email'   },
        { key: 'password',     label: 'Contraseña',      regla: 'password' },
        { key: 'telefono',     label: 'Teléfono',        regla: 'telefono', optional: true },
        { key: 'cedula',       label: 'Cédula',          regla: 'cedula'  },
        { key: 'tipo_usuario', label: 'Tipo de usuario', regla: 'enum', enum: CM_ROLES },
    ],
    productores: [
        { key: 'nombre',    label: 'Nombre',    regla: 'nombre',   noEmail: true, noNum: true },
        { key: 'apellido',  label: 'Apellido',  regla: 'nombre',   noEmail: true, noNum: true },
        { key: 'email',     label: 'Correo',    regla: 'email'   },
        { key: 'password',  label: 'Contraseña',regla: 'password' },
        { key: 'telefono',  label: 'Teléfono',  regla: 'telefono', optional: true },
        { key: 'cedula',    label: 'Cédula',    regla: 'cedula'  },
        { key: 'finca',     label: 'Finca',     regla: 'finca'   },
        { key: 'ubicacion', label: 'Ubicación', regla: 'ubicacion'},
    ],
    // ── Módulo de actualización: solo cédula, finca y ubicacion ──────────────
    productores_update: [
        { key: 'cedula',    label: 'Cédula',    regla: 'cedula'   },
        { key: 'finca',     label: 'Finca',     regla: 'finca',    optional: true },
        { key: 'ubicacion', label: 'Ubicación', regla: 'ubicacion',optional: true },
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
// ════════════════════════════════════════════════════════════════════════════

function cm_validar(filas, esquema) {
    const errores = [];

    // Paso 1: cédulas duplicadas dentro del archivo
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

    // Paso 2: validar cada fila campo por campo
    filas.forEach(fila => {
        const n = fila._n;

        for (const campo of esquema) {
            const val = String(fila[campo.key] ?? '').trim().replace(/^['"]+|['"]+$/g, '').trim();

            if (!val) {
                if (campo.optional) continue;
                errores.push(`Fila ${n} · ${campo.label}: campo vacío.`);
                continue;
            }

            if (campo.noEmail && val.includes('@')) {
                errores.push(`Fila ${n} · ${campo.label}: no puede ser un correo ("${val}"). Escribe solo el nombre.`);
                continue;
            }
            if (campo.noNum && /\d/.test(val)) {
                errores.push(`Fila ${n} · ${campo.label}: no puede contener números ("${val}"). Solo letras y espacios.`);
                continue;
            }

            if (campo.regla === 'enum') {
                if (!campo.enum.includes(val.toUpperCase())) {
                    errores.push(`Fila ${n} · ${campo.label}: "${val}" no es válido. Permitidos: ${campo.enum.join(', ')}.`);
                }
                continue;
            }

            const re = CM_REGLAS[campo.regla];
            if (re && !re.test(val)) {
                errores.push(`Fila ${n} · ${campo.label}: "${val}" — ${_cm_ayuda(campo.regla)}`);
            }
        }
    });

    return errores;
}

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
//  PARSERS — CSV y Excel → filas con _n
// ════════════════════════════════════════════════════════════════════════════

function _cm_parsearCSV(texto) {
    const sep   = (texto.split('\n')[0] || '').indexOf(';') !== -1 ? ';' : ',';
    const lines = texto.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return { error: 'El archivo no tiene filas de datos.' };

    const encabezados = _cm_splitLinea(lines[0], sep).map(h => h.toLowerCase().trim());
    const filas = [];

    for (let i = 1; i < lines.length; i++) {
        const cols = _cm_splitLinea(lines[i], sep);
        if (cols.every(c => !c.trim())) continue;
        const obj = { _n: i + 1 };
        encabezados.forEach((h, idx) => { obj[h] = (cols[idx] ?? '').trim(); });
        filas.push(obj);
    }
    return { filas, encabezados, error: null };
}

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

function _cm_excelACSV(archivo) {
    return new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = e => {
            try {
                const wb  = XLSX.read(new Uint8Array(e.target.result), { type: 'array', cellText: true, raw: false });
                const ws  = wb.Sheets[wb.SheetNames[0]];
                const csv = XLSX.utils.sheet_to_csv(ws, { blankrows: false, rawNumbers: false });
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
    // ── Plantilla de actualización ───────────────────────────────────────────
    productores_update: {
        encabezados: ['cedula','finca','ubicacion'],
        ejemplo:     ['10345678','Finca El Paraíso','Vereda El Centro, Florencia, Caquetá'],
        instrucciones: [
            ['Campo',     'Regla',                                   'Ejemplo'],
            ['cedula',    'Solo dígitos, entre 5 y 12 caracteres.',  '10345678'],
            ['finca',     'Letras, números y guiones.',              'Finca El Paraíso'],
            ['ubicacion', 'Letras, números, comas y guiones.',       'Vereda El Centro, Florencia, Caquetá'],
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

function cm_descargarPlantillaExcel(modulo) {
    if (!window.XLSX) { _cm_cargarXLSX(() => cm_descargarPlantillaExcel(modulo)); return; }
    const p = CM_PLANTILLAS[modulo];
    if (!p) return;
    const wb = XLSX.utils.book_new();

    const wsDatos = XLSX.utils.aoa_to_sheet([p.encabezados, p.ejemplo]);
    wsDatos['!cols'] = p.encabezados.map((h, i) => ({
        wch: Math.max(h.length, String(p.ejemplo[i] ?? '').length, 14),
    }));
    XLSX.utils.book_append_sheet(wb, wsDatos, 'Datos');

    const wsInstr = XLSX.utils.aoa_to_sheet(p.instrucciones);
    wsInstr['!cols'] = [{ wch: 14 }, { wch: 46 }, { wch: 32 }];
    XLSX.utils.book_append_sheet(wb, wsInstr, 'Instrucciones');

    XLSX.writeFile(wb, `plantilla_${modulo}_${_cm_hoy()}.xlsx`);
}

// ════════════════════════════════════════════════════════════════════════════
//  UI — utilidades compartidas
// ════════════════════════════════════════════════════════════════════════════

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

        if (esExcel && !window.XLSX) _cm_cargarXLSX();
    } else {
        span.textContent = 'Seleccionar archivo .csv o .xlsx';
        if (label) label.classList.remove('has-file', 'is-excel', 'is-csv', 'is-invalid');
    }
}

function cm_renderResultado(containerId, creados, errores, esUpdate = false) {
    const container = document.getElementById(containerId);
    if (!container) return;
    let html = '';

    if (creados > 0) {
        const verbo = esUpdate ? 'actualizado' : 'creado';
        html += `<div class="cm-ok">
            <i class="fi fi-rr-check"></i>
            ${creados} registro${creados !== 1 ? 's' : ''} ${verbo}${creados !== 1 ? 's' : ''} correctamente.
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
        const msg = esUpdate ? 'No se actualizó ningún registro.' : 'No se crearon nuevos registros.';
        html = `<div class="cm-ok">Proceso completado. ${msg}</div>`;
    }
    container.innerHTML = html;
}

// ════════════════════════════════════════════════════════════════════════════
//  NÚCLEO — validar en frontend y enviar al backend
// ════════════════════════════════════════════════════════════════════════════

async function cm_enviarCSV({ inputId, btnId, loaderId, resultId, endpoint, modulo, onSuccess }) {
    const inputEl   = document.getElementById(inputId);
    const btnEl     = document.getElementById(btnId);
    const loaderEl  = document.getElementById(loaderId);
    const resultEl  = document.getElementById(resultId);

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

    btnEl.disabled         = true;
    loaderEl.style.display = 'flex';
    resultEl.innerHTML     = '';

    try {
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

        const textoCSV = await csvFile.text();
        const { filas, encabezados, error: parseError } = _cm_parsearCSV(textoCSV);

        if (parseError)    { resultEl.innerHTML = _cm_htmlError(parseError); return; }
        if (!filas.length) { resultEl.innerHTML = _cm_htmlError('El archivo está vacío o no tiene filas de datos.'); return; }

        const esquema        = CM_ESQUEMAS[modulo] || [];
        // Verificar que existan TODAS las columnas del esquema (opcionales o no)
        const colsRequeridas = esquema.map(c => c.key);
        const colsFaltantes  = colsRequeridas.filter(c => !encabezados.includes(c));

        if (colsFaltantes.length) {
            resultEl.innerHTML = _cm_htmlError(
                `Columnas faltantes: <strong>${colsFaltantes.join(', ')}</strong><br>` +
                `El archivo tiene: <code>${encabezados.join(', ')}</code>`
            );
            return;
        }

        const erroresFrontend = cm_validar(filas, esquema);

        if (erroresFrontend.length) {
            resultEl.innerHTML = _cm_htmlErroresLista(erroresFrontend, filas.length);
            return;
        }

        const token    = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
        const formData = new FormData();
        formData.append('file', csvFile);

        const res = await fetch(`${API_URL}${endpoint}`, {
            method:  'POST',
            headers: { Authorization: `Bearer ${token}` },
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

        const data     = json.data || json;
        // Soporta tanto data.creados (crear) como data.actualizados (update)
        const cantidad = typeof data.creados     === 'number' ? data.creados
                       : typeof data.actualizados === 'number' ? data.actualizados
                       : 0;
        const errores  = Array.isArray(data.errores) ? data.errores : [];
        const esUpdate = modulo === 'productores_update';

        cm_renderResultado(resultId, cantidad, errores, esUpdate);

        if (cantidad > 0 && typeof onSuccess === 'function') onSuccess(cantidad);

    } catch (err) {
        resultEl.innerHTML = _cm_htmlError(`Error de red: ${err.message}`);
    } finally {
        btnEl.disabled         = false;
        loaderEl.style.display = 'none';
    }
}

// ════════════════════════════════════════════════════════════════════════════
//  FUNCIONES PÚBLICAS — una por módulo
// ════════════════════════════════════════════════════════════════════════════

// POST /api/admin/upload-usuarios
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

// POST /api/admin/upload-productores  (crea usuario + productor + QR)
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

// POST /api/admin/upload-productores-update  (actualiza finca y ubicacion por cédula)
function cm_actualizarProductores() {
    cm_enviarCSV({
        inputId:  'cm_prd_upd_file',
        btnId:    'cm_prd_upd_btn',
        loaderId: 'cm_prd_upd_loader',
        resultId: 'cm_prd_upd_result',
        endpoint: '/admin/upload-productores-update',
        modulo:   'productores_update',
        onSuccess: () => prd_cargar(),
    });
}

// POST /api/admin/upload-comerciantes
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

function _cm_cargarXLSX(cb) {
    if (window.XLSX) { cb && cb(); return; }
    const s  = document.createElement('script');
    s.src    = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
    s.onload  = () => { cb && cb(); };
    s.onerror = () => console.error('[CM] No se pudo cargar SheetJS.');
    document.head.appendChild(s);
}

function _cm_hoy() {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date());
}