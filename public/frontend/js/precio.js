// ============================================================
// MÓDULO PRECIOS — AgroTrace Admin
// Agregar al final de app.js
// ============================================================

// ─── Estado interno del módulo ────────────────────────────
let _prc_lista = [];         // historial completo de precios
let _prc_productos = [];     // lista de productos disponibles
let _prc_buscar = '';        // texto de búsqueda en tabla

// ─── Alerta semanal (miércoles) ───────────────────────────
/**
 * Verifica si hoy es miércoles Y si ya se ingresaron precios esta semana.
 * Si no hay precio semanal → muestra modal de alerta.
 * Se llama al cargar la app (DOMContentLoaded).
 */
async function prc_verificarAlertaSemanal() {
    const hoy = new Date().getDay(); // 0=Dom … 3=Mié … 6=Sáb
    if (hoy !== 3) return;           // Solo actúa los miércoles

    try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
        const res = await fetch(`${API_URL}/precios/semana`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) return;

        const { hay_precio } = await res.json();

        if (!hay_precio) {
            prc_mostrarModalAlerta();
        }
    } catch (e) {
        console.warn('[PRECIOS] Error verificando semana:', e);
    }
}

/** Muestra el modal de alerta semanal */
function prc_mostrarModalAlerta() {
    const modal = document.getElementById('prc_modal_alerta');
    if (modal) modal.classList.add('show');
}

/** Cierra el modal de alerta y navega a la sección PRECIOS */
function prc_cerrarModalAlerta(irASeccion = false) {
    const modal = document.getElementById('prc_modal_alerta');
    if (modal) modal.classList.remove('show');
    if (irASeccion) mostrarSeccion('precios');
}

// ─── Cargar sección PRECIOS ───────────────────────────────
async function prc_cargar() {
    await Promise.all([prc_cargarProductos(), prc_cargarHistorial()]);
}

/** Carga los productos disponibles en el <select> del formulario */
async function prc_cargarProductos() {
    try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
        const res = await fetch(`${API_URL}/productos`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        _prc_productos = await res.json();

        const sel = document.getElementById('prc_sel_producto');
        if (!sel) return;
        sel.innerHTML = '<option value="">-- Seleccionar producto --</option>';
        _prc_productos
            .filter(p => p.disponible !== false)
            .forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.id_producto;
                opt.textContent = p.nombre;
                sel.appendChild(opt);
            });
    } catch (e) {
        console.error('[PRECIOS] Error cargando productos:', e);
    }
}

/** Carga el historial de precios y renderiza la tabla */
async function prc_cargarHistorial() {
    try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
        const res = await fetch(`${API_URL}/precios`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const datos = await res.json();
        _prc_lista = Array.isArray(datos) ? datos : [];
        prc_renderTabla();
    } catch (e) {
        console.error('[PRECIOS] Error cargando historial:', e);
    }
}

// ─── Calcular (vista previa en tiempo real) ───────────────
/**
 * Llama al endpoint POST /precios/calcular sin persistir.
 * Muestra los resultados calculados en el panel de resultados.
 */
async function prc_calcularVistaPre() {
    const dto = prc_leerFormulario();
    if (!dto) return;

    try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
        const res = await fetch(`${API_URL}/precios/calcular`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(dto)
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Error al calcular');
        }

        const calc = await res.json();
        prc_mostrarResultados(calc);
    } catch (e) {
        alert('Error al calcular: ' + e.message);
    }
}

// ─── Calcular Y guardar ───────────────────────────────────
async function prc_calcularYGuardar() {
    const dto = prc_leerFormulario();
    if (!dto) return;

    if (!confirm(`¿Guardar precio para "${dto.comerciante}"? Se desactivará el precio anterior del mismo producto.`)) return;

    showLoading();
    try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
        const res = await fetch(`${API_URL}/precios`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(dto)
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Error al guardar');
        }

        const guardado = await res.json();
        prc_mostrarResultados(guardado);
        prc_mostrarBanner('✅ Precio guardado correctamente', 'success');
        prc_limpiarFormulario();
        await prc_cargarHistorial();
    } catch (e) {
        prc_mostrarBanner('❌ ' + e.message, 'error');
    } finally {
        hideLoading();
    }
}

// ─── Leer formulario ──────────────────────────────────────
function prc_leerFormulario() {
    const id_producto     = parseInt(document.getElementById('prc_sel_producto')?.value || '0');
    const precio_base_kg  = parseFloat(document.getElementById('prc_inp_precio_base')?.value || '0');
    const precio_transporte = parseFloat(document.getElementById('prc_inp_transporte')?.value || '0');
    const total_kilos     = parseFloat(document.getElementById('prc_inp_kilos')?.value || '0');
    const comerciante     = (document.getElementById('prc_inp_comerciante')?.value || '').trim();

    if (!id_producto) {
        alert('Selecciona un producto.');
        return null;
    }
    if (!precio_base_kg || precio_base_kg <= 0) {
        alert('Ingresa un precio base válido.');
        return null;
    }
    if (!total_kilos || total_kilos <= 0) {
        alert('Ingresa el total de kilos (mayor que 0).');
        return null;
    }
    if (!comerciante) {
        alert('Ingresa el nombre del comerciante.');
        return null;
    }

    return { id_producto, precio_base_kg, precio_transporte, total_kilos, comerciante };
}

// ─── Mostrar resultados calculados ────────────────────────
function prc_mostrarResultados(calc) {
    const panel = document.getElementById('prc_resultados');
    if (!panel) return;

    panel.style.display = 'block';

    const set = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    };

    set('prc_res_costo_kg',    formatCurrency(calc.costo_transporte_kg));
    set('prc_res_resultado1',  formatCurrency(calc.resultado_1));
    set('prc_res_resultado2',  formatCurrency(calc.resultado_2));
    set('prc_res_precio_final', formatCurrency(calc.precio_final_kg));
    set('prc_res_margen',      (calc.margen_asociacion * 100).toFixed(1) + '%');
    set('prc_res_comerciante', calc.comerciante);

    // Indicador visual: si es EL PRIMO → sin descuento
    const badge = document.getElementById('prc_res_badge_comerciante');
    if (badge) {
        if (calc.comerciante === 'EL PRIMO') {
            badge.textContent = '⭐ Precio especial';
            badge.className = 'prc-badge prc-badge--especial';
        } else {
            badge.textContent = 'Precio estándar';
            badge.className = 'prc-badge prc-badge--normal';
        }
    }
}

// ─── Renderizar tabla de historial ────────────────────────
function prc_renderTabla() {
    const tbody = document.getElementById('prc_tbody');
    if (!tbody) return;

    const filtrados = _prc_lista.filter(p => {
        if (!_prc_buscar) return true;
        const nombre = p.producto?.nombre || '';
        return nombre.toLowerCase().includes(_prc_buscar);
    });

    if (!filtrados.length) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" style="text-align:center; color:var(--color-muted); padding:2rem">
              Sin registros de precios
            </td>
          </tr>`;
        return;
    }

    tbody.innerHTML = filtrados.map(p => {
        const fecha = p.fecha ? new Date(p.fecha).toLocaleDateString('es-CO', {
            day: '2-digit', month: 'short', year: 'numeric'
        }) : '—';

        const estadoBadge = p.activo
            ? '<span class="badge badge-success">Activo</span>'
            : '<span class="badge badge-muted">Inactivo</span>';

        return `
          <tr>
            <td><strong>${p.producto?.nombre || '#' + p.id_producto}</strong></td>
            <td>${formatCurrency(p.precio_base_kg)}</td>
            <td>${formatCurrency(p.precio_transporte)}</td>
            <td>${formatCurrency(p.costo_transporte_kg)}</td>
            <td><strong style="color:var(--color-primary)">${formatCurrency(p.precio_final_kg)}</strong></td>
            <td>${fecha}</td>
            <td>${estadoBadge}</td>
          </tr>`;
    }).join('');
}

function prc_filtrar(val) {
    _prc_buscar = val.toLowerCase();
    prc_renderTabla();
}

// ─── Utilidades UI ────────────────────────────────────────
function prc_limpiarFormulario() {
    ['prc_sel_producto', 'prc_inp_precio_base', 'prc_inp_transporte',
        'prc_inp_kilos', 'prc_inp_comerciante'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    const panel = document.getElementById('prc_resultados');
    if (panel) panel.style.display = 'none';
}

function prc_mostrarBanner(msg, tipo = 'success') {
    const el = document.getElementById('prc_banner');
    if (!el) return;
    el.textContent = msg;
    el.className = `prc-banner prc-banner--${tipo} show`;
    setTimeout(() => el.classList.remove('show'), 4000);
}

// ─── Hook en mostrarSeccion ───────────────────────────────
// Intercepta la navegación para cargar datos al entrar a 'precios'
(function () {
    const _orig = window.mostrarSeccion || mostrarSeccion;
    window.mostrarSeccion = function (sectionId) {
        _orig(sectionId);
        if (sectionId === 'precios') prc_cargar();
    };
})();

// ─── Init: verificar alerta semanal al cargar la página ───
document.addEventListener('DOMContentLoaded', () => {
    prc_verificarAlertaSemanal();
});