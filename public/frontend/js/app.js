// app.js - AgroTrace
const API_URL = 'http://localhost:3000/api';
const STATIC_URL = 'http://localhost:3000';

// ── Guard: solo ADMIN y VENDEDOR entran aquí ───────────
(function () {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');
    if (!token || !usuario) {
        window.location.replace('./login.html');
        throw new Error('GUARD: sin sesión');
    }
    const rol = usuario.tipo_usuario;
    if (rol === 'PRODUCTOR' || rol === 'OPERARIO') {
        window.location.replace('./vista_productor/productor.html');
        throw new Error('GUARD: rol incorrecto');
    }
    if (rol !== 'ADMIN' && rol !== 'VENDEDOR') {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        window.location.replace('./login.html');
        throw new Error('GUARD: rol desconocido');
    }
})();

// ── Sidebar toggle ──────────────────────────────────────
const toggle = document.querySelector(".menu-toggle");
const header = document.querySelector(".sidebar");
toggle.addEventListener("click", () => {
    header.classList.toggle("collapsed");
});

// Estado global
let charts = {
    tendencia: null,
    historial: null,
    proyeccion: null,
    tendenciaDetalle: null,
    ranking: null,
    capacidad: null
};

// NAVEGACION
function mostrarSeccion(sectionId) {
    document.querySelectorAll('main .section').forEach(s => {
        s.classList.remove('active');
        s.style.display = 'none';
    });

    const el = document.getElementById(sectionId);
    if (el) {
        el.classList.add('active');
        el.style.display = 'block';
    }

    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    const btn = document.querySelector(`.nav-btn[data-section="${sectionId}"]`);
    if (btn) btn.classList.add('active');

    // Cargar datos del módulo
    if (sectionId === 'analisis') { analisis_cargarProductores(); analisis_loadProyeccion(); }
    if (sectionId === 'usuarios') usr_cargar();
    if (sectionId === 'productores') prd_cargar();
    if (sectionId === 'productos') pro_cargar();
    if (sectionId === 'compras') cmp_cargar();
    if (sectionId === 'ventas') vnt_cargar();
    if (sectionId === 'comerciantes') com_cargar();
    if (sectionId === 'historial') his_cargar();
    if (sectionId === 'dashboard') cargarDashboard();
}

document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        mostrarSeccion(btn.dataset.section);
    });
});

/* Mostrar dashboard al cargar*/
window.addEventListener('DOMContentLoaded', () => {
    // Bind sidebar toggle
    document.querySelectorAll('.menu-toggle').forEach(btn => {
        btn.addEventListener('click', e => { e.stopPropagation(); toggleSidebar(); });
    });

    // Ocultar todas menos dashboard
    document.querySelectorAll('main .section').forEach(s => {
        s.style.display = 'none';
        s.classList.remove('active');
    });
    const dash = document.getElementById('dashboard');
    if (dash) { dash.style.display = 'block'; dash.classList.add('active'); }

    // Cargar datos iniciales del dashboard
    cargarDashboard();
});

// Utilidades
function showLoading() {
    document.getElementById('loading').classList.add('show');
}

function hideLoading() {
    document.getElementById('loading').classList.remove('show');
}

function formatNumber(num) {
    return new Intl.NumberFormat('es-CO').format(num);
}

function formatCurrency(num) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(num);
}

// Destruir gráfico existente
function destroyChart(chartName) {
    if (charts[chartName]) {
        charts[chartName].destroy();
        charts[chartName] = null;
    }
}

// ==========================================
// 1️⃣ DASHBOARD GENERAL
// ==========================================
async function cargarDashboard() {
    // Saludo y fecha
    const hora = new Date().getHours();
    const saludo = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches';
    const greetEl = document.getElementById('db_greeting_text');
    if (greetEl) greetEl.textContent = saludo;

    const fechaStr = new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
    const fechaEl = document.getElementById('db_hero_fecha');
    if (fechaEl) fechaEl.textContent = fechaStr;
    const ecoFecha = document.getElementById('db_eco_fecha');
    if (ecoFecha) ecoFecha.textContent = fechaStr;

    try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        // Cargar todo en paralelo
        const [meRes, cRes, vRes, prRes, plRes] = await Promise.allSettled([
            fetch(`${API_URL}/me`, { headers }),
            fetch(`${API_URL}/compras`, { headers }),
            fetch(`${API_URL}/ventas`, { headers }),
            fetch(`${API_URL}/productos`, { headers }),
            fetch(`${API_URL}/productores?todos=true`, { headers }),
        ]);

        // Nombre usuario en hero
        if (meRes.status === 'fulfilled') {
            const me = await meRes.value.json();
            const nombre = me.nombre || me.email || '—';
            const nameEl = document.getElementById('db_hero_nombre_text');
            if (nameEl) nameEl.textContent = nombre;
            const nameEl2 = document.getElementById('db_hero_nombre_text2');
            if (nameEl2) nameEl2.textContent = nombre;
        }
        // Eco greeting sync
        const greetEl2 = document.getElementById('db_greeting_text2');
        if (greetEl2) {
            const h = new Date().getHours();
            greetEl2.textContent = h < 12 ? 'Buenos días' : h < 18 ? 'Buenas tardes' : 'Buenas noches';
        }

        const compras = cRes.status === 'fulfilled' ? await cRes.value.json() : [];
        const ventas = vRes.status === 'fulfilled' ? await vRes.value.json() : [];
        const prods = prRes.status === 'fulfilled' ? await prRes.value.json() : [];
        const prodList = plRes.status === 'fulfilled' ? await plRes.value.json() : [];

        const cArr = Array.isArray(compras) ? compras : [];
        const vArr = Array.isArray(ventas) ? ventas : [];
        const pArr = Array.isArray(prods) ? prods : [];
        const plArr = Array.isArray(prodList) ? prodList : (prodList.data || []);

        // ── Infografía derecha ──
        // Compras
        const totalC = cArr.reduce((s, c) => s + parseFloat(c.total || 0), 0);
        db_animNum('db_stat_compras', cArr.length);
        const subC = document.getElementById('db_stat_compras_monto');
        if (subC) subC.textContent = `$${totalC.toLocaleString('es-CO')} en total`;

        // Ventas
        const totalV = vArr.reduce((s, v) => s + parseFloat(v.total || 0), 0);
        db_animNum('db_stat_ventas', vArr.length);
        const subV = document.getElementById('db_stat_ventas_monto');
        if (subV) subV.textContent = `$${totalV.toLocaleString('es-CO')} en total`;

        // Productores
        const activos = plArr.filter(p => p.estado === 'ACTIVO').length;
        db_animNum('db_stat_prod', plArr.length);
        const subP = document.getElementById('db_stat_prod_sub');
        if (subP) subP.textContent = `${activos} activos · ${plArr.length - activos} inactivos`;

        // Productos
        const disponibles = pArr.filter(p => p.disponible).length;
        db_animNum('db_stat_prods', pArr.length);
        const subPr = document.getElementById('db_stat_prods_sub');
        if (subPr) subPr.textContent = `${disponibles} disponibles`;

        // Animar nodos con entrada escalonada
        document.querySelectorAll('.db-info-node').forEach((n, i) => {
            n.style.opacity = '0';
            n.style.transform = 'translateY(16px)';
            setTimeout(() => {
                n.style.transition = 'opacity .4s ease, transform .4s ease';
                n.style.opacity = '1';
                n.style.transform = 'translateY(0)';
            }, 200 + i * 120);
        });

        // Animar pasos con entrada
        document.querySelectorAll('.db-step').forEach((s, i) => {
            s.style.opacity = '0';
            s.style.transform = 'translateX(-12px)';
            setTimeout(() => {
                s.style.transition = 'opacity .35s ease, transform .35s ease, background .15s, box-shadow .15s';
                s.style.opacity = '1';
                s.style.transform = 'translateX(0)';
            }, 100 + i * 80);
        });

    } catch (e) {
        console.warn('Dashboard error:', e.message);
    }
}

function db_abrirGuia() {
    document.getElementById('db_guia_overlay').classList.add('open');
    document.getElementById('db_guia_modal').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function db_cerrarGuia() {
    document.getElementById('db_guia_overlay').classList.remove('open');
    document.getElementById('db_guia_modal').classList.remove('open');
    document.body.style.overflow = '';
}

function db_animNum(id, target) {
    const el = document.getElementById(id);
    if (!el) return;
    const dur = 900;
    const t0 = performance.now();
    const run = (now) => {
        const p = Math.min((now - t0) / dur, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * ease).toLocaleString('es-CO');
        if (p < 1) requestAnimationFrame(run);
    };
    requestAnimationFrame(run);
}


function crearGraficoTendenciaDashboard(data) {
    destroyChart('tendencia');

    const ctx = document.getElementById('chart_tendencia');
    charts.tendencia = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Período Anterior (hace 3-6 meses)', 'Período Actual (últimos 3 meses)'],
            datasets: [{
                label: 'Promedio de Producción (kg)',
                data: [data.promedio_anterior, data.promedio_actual],
                backgroundColor: [
                    'rgba(156, 163, 175, 0.7)',
                    data.tendencia === 'Creciente' ? 'rgba(16, 185, 129, 0.7)' :
                        data.tendencia === 'Decreciente' ? 'rgba(239, 68, 68, 0.7)' :
                            'rgba(245, 158, 11, 0.7)'
                ],
                borderColor: [
                    'rgb(156, 163, 175)',
                    data.tendencia === 'Creciente' ? 'rgb(16, 185, 129)' :
                        data.tendencia === 'Decreciente' ? 'rgb(239, 68, 68)' :
                            'rgb(245, 158, 11)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                title: {
                    display: true,
                    text: `Tendencia: ${data.tendencia} (${data.diferencia_porcentual}%)`,
                    font: { size: 16, weight: 'bold' }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function (value) {
                            return value + ' kg';
                        }
                    }
                }
            }
        }
    });
}

// Continúa en la parte 2...
// ... Continuación de app.js

// ==========================================
// 2️⃣ HISTORIAL
// ==========================================
async function cargarHistorial() {
    const productor = document.getElementById('historial_productor').value;
    const inicio = document.getElementById('historial_inicio').value;
    const fin = document.getElementById('historial_fin').value;

    showLoading();

    try {
        const response = await fetch(`${API_URL}/estadisticas/historial?id_productor=${productor}&inicio=${inicio}&fin=${fin}`);
        const data = await response.json();

        // Actualizar contador
        document.getElementById('historial_count').textContent = `${data.length} registros`;

        // Actualizar tabla
        const tbody = document.getElementById('tabla_historial_body');
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No hay registros en este rango de fechas</td></tr>';
        } else {
            tbody.innerHTML = data.map(item => `
                <tr>
                    <td>${item.fecha_produccion}</td>
                    <td><strong>${item.cantidad}</strong></td>
                    <td>${item.unidad}</td>
                    <td>${item.lote || 'N/A'}</td>
                    <td><span class="badge badge-info">${item.estado}</span></td>
                </tr>
            `).join('');
        }

        // Crear gráfico
        crearGraficoHistorial(data);

    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar el historial');
    } finally {
        hideLoading();
    }
}

function crearGraficoHistorial(data) {
    destroyChart('historial');

    const ctx = document.getElementById('chart_historial');
    charts.historial = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(d => d.fecha_produccion),
            datasets: [{
                label: 'Cantidad Producida (kg)',
                data: data.map(d => parseFloat(d.cantidad)),
                borderColor: 'rgb(102, 126, 234)',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 5,
                pointHoverRadius: 7,
                pointBackgroundColor: 'rgb(102, 126, 234)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return `${context.parsed.y} kg`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function (value) {
                            return value + ' kg';
                        }
                    }
                }
            }
        }
    });
}

// ==========================================
// 3️⃣ PROYECCIONES
// ==========================================
async function cargarProyeccion() {
    const productor = document.getElementById('proyeccion_productor').value;
    showLoading();

    try {
        // Proyección
        const proyeccionRes = await fetch(`${API_URL}/estadisticas/proyeccion?id_productor=${productor}`);
        const proyeccion = await proyeccionRes.json();

        // Tendencia
        const tendenciaRes = await fetch(`${API_URL}/estadisticas/tendencia?id_productor=${productor}`);
        const tendencia = await tendenciaRes.json();

        // Gráficos
        crearGraficoProyeccion(proyeccion);
        crearGraficoTendenciaDetalle(tendencia);

        // Info adicional
        document.getElementById('proyeccion_info').innerHTML = `
            <p><strong> Proyección:</strong> ${proyeccion.proyeccion} ${proyeccion.unidad}</p>
            ${proyeccion.advertencia ? `<p class="badge badge-warning">${proyeccion.advertencia}</p>` :
                `<p><strong>Registros analizados:</strong> ${proyeccion.registros_analizados}</p>`}
        `;

        document.getElementById('tendencia_info').innerHTML = `
            <p><strong> Tendencia:</strong> ${tendencia.tendencia}</p>
            <p><strong>Diferencia:</strong> ${tendencia.diferencia_porcentual}%</p>
            <p><strong>Promedio Actual:</strong> ${tendencia.promedio_actual.toFixed(2)} kg</p>
            <p><strong>Promedio Anterior:</strong> ${tendencia.promedio_anterior.toFixed(2)} kg</p>
        `;

    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar proyecciones');
    } finally {
        hideLoading();
    }
}

function crearGraficoProyeccion(data) {
    destroyChart('proyeccion');

    const proyeccionValor = parseFloat(data.proyeccion || 0);
    const promedioHistorico = proyeccionValor * 0.9; // Simulado

    const ctx = document.getElementById('chart_proyeccion');
    charts.proyeccion = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Proyección Próxima Entrega', 'Promedio Histórico'],
            datasets: [{
                data: [proyeccionValor, promedioHistorico],
                backgroundColor: [
                    'rgba(102, 126, 234, 0.8)',
                    'rgba(118, 75, 162, 0.8)'
                ],
                borderColor: ['rgb(102, 126, 234)', 'rgb(118, 75, 162)'],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return `${context.label}: ${context.parsed} kg`;
                        }
                    }
                }
            }
        }
    });
}

function crearGraficoTendenciaDetalle(data) {
    destroyChart('tendenciaDetalle');

    const ctx = document.getElementById('chart_tendencia_detalle');
    charts.tendenciaDetalle = new Chart(ctx, {
        type: 'polarArea',
        data: {
            labels: ['Promedio Anterior', 'Promedio Actual'],
            datasets: [{
                data: [data.promedio_anterior, data.promedio_actual],
                backgroundColor: [
                    'rgba(156, 163, 175, 0.6)',
                    data.tendencia === 'Creciente' ? 'rgba(16, 185, 129, 0.6)' :
                        data.tendencia === 'Decreciente' ? 'rgba(239, 68, 68, 0.6)' :
                            'rgba(245, 158, 11, 0.6)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// ==========================================
// 4️⃣ RANKING
// ==========================================
async function cargarRanking() {
    const tipo = document.getElementById('ranking_tipo').value;
    showLoading();

    try {
        const response = await fetch(`${API_URL}/estadisticas/ranking?tipo=${tipo}`);
        const data = await response.json();

        // Actualizar tabla
        const tbody = document.getElementById('tabla_ranking_body');
        tbody.innerHTML = data.map(item => {
            let medalla = '';
            if (item.posicion === 1) medalla = '<span class="medal medal-gold">🥇</span>';
            else if (item.posicion === 2) medalla = '<span class="medal medal-silver">🥈</span>';
            else if (item.posicion === 3) medalla = '<span class="medal medal-bronze">🥉</span>';

            return `
                <tr>
                    <td><strong>${item.posicion}</strong></td>
                    <td>Productor ${item.id_productor}</td>
                    <td><strong>${formatNumber(item.valor.toFixed(2))}</strong></td>
                    <td>${medalla}</td>
                </tr>
            `;
        }).join('');

        // Crear gráfico
        crearGraficoRanking(data, tipo);

    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar el ranking');
    } finally {
        hideLoading();
    }
}

function crearGraficoRanking(data, tipo) {
    destroyChart('ranking');

    const ctx = document.getElementById('chart_ranking');

    // Colores degradados
    const colors = data.map((_, index) => {
        const hue = 220 - (index * 15);
        return `hsla(${hue}, 70%, 60%, 0.8)`;
    });

    charts.ranking = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(d => `Productor ${d.id_productor}`),
            datasets: [{
                label: tipo === 'total' ? 'Total Producido (kg)' :
                    tipo === 'promedio' ? 'Promedio (kg)' :
                        'Frecuencia de Entregas',
                data: data.map(d => d.valor),
                backgroundColor: colors,
                borderColor: colors.map(c => c.replace('0.8', '1')),
                borderWidth: 2
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return `${context.dataset.label}: ${formatNumber(context.parsed.x)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true
                }
            }
        }
    });
}

// ==========================================
// 5️⃣ PLANIFICACIÓN
// ==========================================
async function cargarPlanificacion() {
    const precio = parseFloat(document.getElementById('planificacion_precio').value);
    const capacidad = parseFloat(document.getElementById('planificacion_capacidad').value);

    if (!precio || precio <= 0) {
        alert('Ingrese un precio válido');
        return;
    }

    if (!capacidad || capacidad <= 0) {
        alert('Ingrese una capacidad válida');
        return;
    }

    showLoading();

    try {
        const response = await fetch(`${API_URL}/estadisticas/planificacion?precio=${precio}&capacidad=${capacidad}`);
        const data = await response.json();

        // Mostrar resultado
        const resultDiv = document.getElementById('planificacion_result');
        resultDiv.innerHTML = `
            <div class="result-card info">
                <div class="result-label">Total Proyectado</div>
                <div class="result-value">${formatNumber(data.total_proyectado)} kg</div>
            </div>
            <div class="result-card info">
                <div class="result-label">Valor Estimado</div>
                <div class="result-value">${formatCurrency(data.total_estimado)}</div>
            </div>
            <div class="result-card ${data.supera_capacidad ? 'danger' : 'success'}">
                <div class="result-label">Capacidad</div>
                <div class="result-value">${formatNumber(data.capacidad)} kg</div>
                <div class="result-subtitle">${data.supera_capacidad ? 'Superada' : 'Suficiente'}</div>
            </div>
        `;

        // Alerta
        resultDiv.innerHTML += `
            <div class="alert-box ${data.supera_capacidad ? 'alert-danger' : 'alert-success'}">
                <span class="alert-icon">${data.supera_capacidad ? '⚠️' : '✅'}</span>
                <span>${data.alerta}</span>
            </div>
        `;

        // Gráfico de capacidad
        crearGraficoCapacidad(data);

    } catch (error) {
        console.error('Error:', error);
        alert('Error al calcular la planificación');
    } finally {
        hideLoading();
    }
}

function crearGraficoCapacidad(data) {
    destroyChart('capacidad');

    const utilizado = Math.min(data.total_proyectado, data.capacidad);
    const disponible = Math.max(0, data.capacidad - data.total_proyectado);
    const exceso = Math.max(0, data.total_proyectado - data.capacidad);

    const ctx = document.getElementById('chart_capacidad');
    charts.capacidad = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Utilizado', 'Disponible', 'Exceso'],
            datasets: [{
                data: [utilizado, disponible, exceso],
                backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(239, 68, 68, 0.8)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return `${context.label}: ${formatNumber(context.parsed)} kg`;
                        }
                    }
                }
            }
        }
    });
}

// Dashboard carga desde DOMContentLoaded en la navegación unificada
// ==========================================
// MÓDULO ANÁLISIS — Sub-tabs
// ==========================================

// Instancias de gráficos propias del módulo análisis
let analisisCharts = { historial: null, tendencia: null, ranking: null, planificacion: null };

function destroyAnalisisChart(name) {
    if (analisisCharts[name]) { analisisCharts[name].destroy(); analisisCharts[name] = null; }
}

// Cambiar sub-pestaña
// ── Cargar productores en selects de análisis ──────────
async function analisis_cargarProductores() {
    try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
        const res = await fetch(`${API_URL}/productores?todos=true`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const data = await res.json();
        const lista = Array.isArray(data) ? data : (data.data || []);

        // Construir opciones
        const opcionTodos = '<option value="">Todos los productores</option>';
        const opciones = lista.map(p => {
            const nombre = p.usuario
                ? `${p.usuario.nombre} ${p.usuario.apellido || ''}`.trim()
                : (p.nombre || `Productor ${p.id_productor}`);
            return `<option value="${p.id_productor}">${nombre}</option>`;
        }).join('');

        // Llenar todos los selects de análisis
        ['ap_productor', 'ah_productor', 'at_productor'].forEach(id => {
            const sel = document.getElementById(id);
            if (sel) sel.innerHTML = opcionTodos + opciones;
        });
    } catch (e) {
        console.warn('No se pudieron cargar productores para análisis:', e.message);
        // Dejar con opción por defecto
        ['ap_productor', 'ah_productor', 'at_productor'].forEach(id => {
            const sel = document.getElementById(id);
            if (sel) sel.innerHTML = '<option value="">Todos los productores</option>';
        });
    }
}

function switchAnalisisTab(name, btn) {
    document.querySelectorAll('.analisis-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.an-tab').forEach(b => b.classList.remove('active'));
    document.getElementById('panel-' + name).classList.add('active');
    btn.classList.add('active');
}

// ── PROYECCIÓN ──
async function analisis_loadProyeccion() {
    const id = document.getElementById('ap_productor').value;
    const cards = document.getElementById('ap_cards');
    cards.innerHTML = '<div class="an-kpi-skeleton"></div><div class="an-kpi-skeleton"></div><div class="an-kpi-skeleton"></div><div class="an-kpi-skeleton"></div>';
    // Solo agregar id_productor si hay un productor seleccionado
    const qId = id ? `?id_productor=${id}` : '';
    try {
        const [pRes, tRes] = await Promise.all([
            fetch(`${API_URL}/estadisticas/proyeccion${qId}`),
            fetch(`${API_URL}/estadisticas/tendencia${qId}`)
        ]);
        const p = await pRes.json();
        const t = await tRes.json();
        const pVal = parseFloat(p.proyeccion || 0);
        const tTag = t.tendencia === 'Creciente' ? 'ok' : t.tendencia === 'Decreciente' ? 'danger' : 'warn';
        const pTag = p.advertencia ? 'warn' : 'ok';
        const dif = parseFloat(t.diferencia_porcentual || 0);
        cards.innerHTML = `
        <div class="an-kpi">
            <div class="an-kpi-icon green"><i class="fi fi-rr-box"></i></div>
            <span class="an-kpi-label">Próxima entrega</span>
            <span class="an-kpi-value">${pVal} <small style="font-size:.5em;color:#9ca3af">${p.unidad || 'kg'}</small></span>
            <span class="an-kpi-tag ${pTag}">${p.advertencia || `${p.registros_analizados} registros`}</span>
        </div>
        <div class="an-kpi">
            <div class="an-kpi-icon blue"><i class="fi fi-rr-arrow-trend-up"></i></div>
            <span class="an-kpi-label">Tendencia</span>
            <span class="an-kpi-value">${t.tendencia}</span>
            <span class="an-kpi-tag ${tTag}">${dif > 0 ? '+' : ''}${dif}% vs anterior</span>
        </div>
        <div class="an-kpi">
            <div class="an-kpi-icon orange"><i class="fi fi-rr-coins"></i></div>
            <span class="an-kpi-label">Valor proyectado</span>
            <span class="an-kpi-value">${formatCurrency(pVal * 2000)}</span>
            <span class="an-kpi-tag info">a $2,000/kg</span>
        </div>
        <div class="an-kpi">
            <div class="an-kpi-icon purple"><i class="fi fi-rr-target"></i></div>
            <span class="an-kpi-label">Diferencia</span>
            <span class="an-kpi-value">${dif > 0 ? '+' : ''}${dif}%</span>
            <span class="an-kpi-tag neutral">vs período anterior</span>
        </div>`;
    } catch (e) {
        cards.innerHTML = `<div class="an-kpi" style="grid-column:1/-1"><span class="an-kpi-label" style="color:#dc2626">Error: ${e.message}</span></div>`;
    }
}

// ── HISTORIAL ──
async function analisis_loadHistorial() {
    const id = document.getElementById('ah_productor').value;
    const ini = document.getElementById('ah_inicio').value;
    const fin = document.getElementById('ah_fin').value;
    showLoading();
    try {
        // Construir query solo con params presentes
        const params = new URLSearchParams();
        if (id) params.append('id_productor', id);
        if (ini) params.append('inicio', ini);
        if (fin) params.append('fin', fin);
        const res = await fetch(`${API_URL}/estadisticas/historial?${params.toString()}`);
        const data = await res.json();
        document.getElementById('ah_count').textContent = `${data.length} registros`;

        // Tabla
        const tbody = document.getElementById('ah_tbody');
        tbody.innerHTML = data.length === 0
            ? '<tr><td colspan="5" class="empty-state">Sin registros en ese período</td></tr>'
            : data.map(r => `<tr>
                <td>${r.fecha_produccion?.split('T')[0] || r.fecha_produccion}</td>
                <td><strong>${r.cantidad}</strong></td>
                <td>${r.unidad || 'kg'}</td>
                <td>${r.lote || 'N/A'}</td>
                <td><span class="badge badge-info">${r.estado || '–'}</span></td>
              </tr>`).join('');

        // Gráfico
        destroyAnalisisChart('historial');
        const ctx = document.getElementById('ah_chart').getContext('2d');
        analisisCharts.historial = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(d => d.fecha_produccion?.split('T')[0] || d.fecha_produccion),
                datasets: [{
                    label: 'Cantidad (kg)', data: data.map(d => parseFloat(d.cantidad)),
                    borderColor: 'rgb(10,174,10)', backgroundColor: 'rgba(10,174,10,0.1)',
                    borderWidth: 3, fill: true, tension: 0.4, pointRadius: 5,
                    pointBackgroundColor: 'rgb(10,174,10)', pointBorderColor: '#fff', pointBorderWidth: 2
                }]
            },
            options: { responsive: true, scales: { y: { beginAtZero: true } } }
        });
    } catch (e) {
        document.getElementById('ah_tbody').innerHTML = `<tr><td colspan="5" class="empty-state" style="color:red">Error: ${e.message}</td></tr>`;
    } finally { hideLoading(); }
}

// ── TENDENCIA ──
async function analisis_loadTendencia() {
    const id = document.getElementById('at_productor').value;
    showLoading();
    try {
        const qId = id ? `?id_productor=${id}` : '';
        const res = await fetch(`${API_URL}/estadisticas/tendencia${qId}`);
        const d = await res.json();
        const tClass = d.tendencia === 'Creciente' ? 'badge-success' : d.tendencia === 'Decreciente' ? 'badge-danger' : 'badge-warning';

        document.getElementById('at_cards').innerHTML = `
        <div class="an-kpi">
            <div class="an-kpi-icon blue"><i class="fi fi-rr-stats"></i></div>
            <span class="an-kpi-label">Tendencia</span>
            <span class="an-kpi-value">${d.tendencia}</span>
            <span class="an-kpi-tag ${d.tendencia === 'Creciente' ? 'ok' : d.tendencia === 'Decreciente' ? 'danger' : 'warn'}">${d.diferencia_porcentual}%</span>
        </div>
        <div class="an-kpi">
            <div class="an-kpi-icon green"><i class="fi fi-rr-calendar"></i></div>
            <span class="an-kpi-label">Promedio últimos 3 meses</span>
            <span class="an-kpi-value">${parseFloat(d.promedio_actual).toFixed(1)} <small style="font-size:.5em;color:#9ca3af">kg</small></span>
            <span class="an-kpi-tag info">período actual</span>
        </div>
        <div class="an-kpi">
            <div class="an-kpi-icon orange"><i class="fi fi-rr-calendar"></i></div>
            <span class="an-kpi-label">Promedio 3 meses anteriores</span>
            <span class="an-kpi-value">${parseFloat(d.promedio_anterior).toFixed(1)} <small style="font-size:.5em;color:#9ca3af">kg</small></span>
            <span class="an-kpi-tag neutral">período anterior</span>
        </div>`;

        destroyAnalisisChart('tendencia');
        const ctx = document.getElementById('at_chart').getContext('2d');
        analisisCharts.tendencia = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['3 meses anteriores', 'Últimos 3 meses'],
                datasets: [{
                    data: [parseFloat(d.promedio_anterior), parseFloat(d.promedio_actual)],
                    backgroundColor: ['rgba(156,163,175,0.7)', d.tendencia === 'Creciente' ? 'rgba(10,174,10,0.8)' : d.tendencia === 'Decreciente' ? 'rgba(239,68,68,0.8)' : 'rgba(245,158,11,0.8)'],
                    borderRadius: 8, borderWidth: 2
                }]
            },
            options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
        });
    } catch (e) {
        document.getElementById('at_cards').innerHTML = `<div class="an-kpi" style="grid-column:1/-1"><span class="an-kpi-label" style="color:#dc2626">Error: ${e.message}</span></div>`;
    } finally { hideLoading(); }
}

// ── RANKING ──
async function analisis_loadRanking() {
    const tipo = document.getElementById('ar_tipo').value;
    const labels = { total: 'Total producido', promedio: 'Promedio por entrega', frecuencia: 'Frecuencia de entregas' };
    document.getElementById('ar_tipo_label').textContent = labels[tipo];
    showLoading();
    try {
        const res = await fetch(`${API_URL}/estadisticas/ranking?tipo=${tipo}`);
        const data = await res.json();

        const tbody = document.getElementById('ar_tbody');
        tbody.innerHTML = data.map(r => {
            const medalla = r.posicion === 1 ? '🥇' : r.posicion === 2 ? '🥈' : r.posicion === 3 ? '🥉' : '';
            // Usar nombre real del backend, fallback a id si no viene
            const nombreMostrar = (r.nombre && r.nombre.trim()) ? r.nombre.trim() : `Productor ${r.id_productor}`;
            return `<tr>
                <td style="font-weight:800;color:#111827">${r.posicion}</td>
                <td style="font-weight:600">${nombreMostrar}</td>
                <td style="font-weight:700">${formatNumber(parseFloat(r.valor).toFixed(2))}</td>
                <td style="font-size:1.2em">${medalla}</td>
              </tr>`;
        }).join('') || '<tr><td colspan="4" class="empty-state">Sin datos</td></tr>';

        destroyAnalisisChart('ranking');
        const colors = data.map((_, i) => `hsla(${130 - (i * 12)},65%,45%,0.8)`);
        const ctx = document.getElementById('ar_chart').getContext('2d');
        analisisCharts.ranking = new Chart(ctx, {
            type: 'bar',
            data: {
                // Usar nombre real en el gráfico también
                labels: data.map(d => (d.nombre && d.nombre.trim()) ? d.nombre.trim() : `Productor ${d.id_productor}`),
                datasets: [{ data: data.map(d => d.valor), backgroundColor: colors, borderRadius: 6 }]
            },
            options: { indexAxis: 'y', responsive: true, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true } } }
        });
    } catch (e) {
        document.getElementById('ar_tbody').innerHTML = `<tr><td colspan="4" class="empty-state" style="color:red">Error: ${e.message}</td></tr>`;
    } finally { hideLoading(); }
}

// ── PLANIFICACIÓN ──
async function analisis_loadPlanificacion() {
    const precio = parseFloat(document.getElementById('apl_precio').value);
    const capacidad = parseFloat(document.getElementById('apl_capacidad').value);
    if (!precio || precio <= 0) { alert('Ingrese un precio válido'); return; }
    if (!capacidad || capacidad <= 0) { alert('Ingrese una capacidad válida'); return; }
    showLoading();
    try {
        const res = await fetch(`${API_URL}/estadisticas/planificacion?precio=${precio}&capacidad=${capacidad}`);
        const d = await res.json();

        document.getElementById('apl_alert').innerHTML = `
            <div class="an-alert ${d.supera_capacidad ? 'danger' : 'ok'}">
                <i class="fi fi-rr-${d.supera_capacidad ? 'triangle-warning' : 'check'}"></i>
                <span>${d.alerta}</span>
            </div>`;

        document.getElementById('apl_cards').innerHTML = `
        <div class="an-kpi">
            <div class="an-kpi-icon blue"><i class="fi fi-rr-weight"></i></div>
            <span class="an-kpi-label">Total proyectado</span>
            <span class="an-kpi-value">${formatNumber(d.total_proyectado)} <small style="font-size:.45em;color:#9ca3af">kg</small></span>
            <span class="an-kpi-tag info">suma de proyecciones</span>
        </div>
        <div class="an-kpi">
            <div class="an-kpi-icon orange"><i class="fi fi-rr-coins"></i></div>
            <span class="an-kpi-label">Valor estimado</span>
            <span class="an-kpi-value">${formatCurrency(d.total_estimado)}</span>
            <span class="an-kpi-tag info">al precio indicado</span>
        </div>
        <div class="an-kpi">
            <div class="an-kpi-icon ${d.supera_capacidad ? 'red' : 'green'}"><i class="fi fi-rr-truck-side"></i></div>
            <span class="an-kpi-label">Capacidad</span>
            <span class="an-kpi-value">${formatNumber(d.capacidad)} <small style="font-size:.45em;color:#9ca3af">kg</small></span>
            <span class="an-kpi-tag ${d.supera_capacidad ? 'danger' : 'ok'}">${d.supera_capacidad ? 'Superada' : 'Suficiente'}</span>
        </div>`;

        destroyAnalisisChart('planificacion');
        const utilizado = Math.min(d.total_proyectado, d.capacidad);
        const disponible = Math.max(0, d.capacidad - d.total_proyectado);
        const exceso = Math.max(0, d.total_proyectado - d.capacidad);
        const ctx = document.getElementById('apl_chart').getContext('2d');
        analisisCharts.planificacion = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Utilizado', 'Disponible', 'Exceso'],
                datasets: [{
                    data: [utilizado, disponible, exceso],
                    backgroundColor: ['rgba(59,130,246,0.8)', 'rgba(10,174,10,0.8)', 'rgba(239,68,68,0.8)'],
                    borderWidth: 2
                }]
            },
            options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
        });
    } catch (e) {
        document.getElementById('apl_alert').innerHTML = `<div class="an-alert danger"><i class="fi fi-rr-triangle-warning"></i><span>Error: ${e.message}</span></div>`;
    } finally { hideLoading(); }
}

// ==========================================
// ════════════════════════════════════════════════════════
//  PERFIL DE USUARIO
//  Endpoints reales del backend:
//    GET  /me                    → usuario autenticado (JWT)
//    PUT  /usuarios/:id_usuario  → editar email, telefono, tipo_usuario
// ════════════════════════════════════════════════════════

const ROL_GRADIENTS = {
    ADMIN: 'linear-gradient(135deg,#fbbf24,#d97706)',
    VENDEDOR: 'linear-gradient(135deg,#a78bfa,#7c3aed)',
    PRODUCTOR: 'linear-gradient(135deg,#0aae0a,#1b5e20)',
};
const ROL_HERO_BG = {
    ADMIN: 'linear-gradient(135deg,#fffbeb,#fef3c7)',
    VENDEDOR: 'linear-gradient(135deg,#f5f3ff,#ede9fe)',
    PRODUCTOR: 'linear-gradient(135deg,#f0fdf4,#dcfce7)',
};
const ROL_BADGE_CLASS = {
    ADMIN: 'hp-rol-ADMIN',
    VENDEDOR: 'hp-rol-VENDEDOR',
    PRODUCTOR: 'hp-rol-PRODUCTOR',
};
const ROL_LABEL = {
    ADMIN: 'Administrador', VENDEDOR: 'Vendedor', PRODUCTOR: 'Productor',
};
const PERMISO_LABEL = {
    dashboard: 'Dashboard', compras: 'Compras', ventas: 'Ventas',
    productores: 'Productores', productos: 'Productos',
    analisis: 'Análisis', historial: 'Historial', usuarios: 'Usuarios',
};

let _hp_usuario = null;  // usuario activo en memoria

// ── Obtener iniciales ──────────────────────────────────
function hp_iniciales(nombre, apellido) {
    const n = (nombre || '').trim()[0] || '';
    const a = (apellido || '').trim()[0] || '';
    return (n + a).toUpperCase() || '?';
}

// ── Cargar usuario desde el backend ───────────────────
async function hp_cargarUsuario() {
    const token = localStorage.getItem('token');

    // 1️⃣ Intentar con JWT
    if (token) {
        try {
            const res = await fetch(`${API_URL}/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const usuario = await res.json();
                _hp_usuario = usuario;
                localStorage.setItem('usuario', JSON.stringify(usuario));
                hp_pintarTodo(usuario);
                return;
            }
        } catch (e) {
            console.warn('Error al cargar perfil:', e);
        }
    }

    // 2️⃣ Fallback: leer del localStorage (guardado al hacer login)
    const guardado = localStorage.getItem('usuario');
    if (guardado) {
        try {
            const usuario = JSON.parse(guardado);
            _hp_usuario = usuario;
            hp_pintarTodo(usuario);
        } catch (e) { console.warn(e); }
    }
}

// ── Helper null-safe ──────────────────────────────────
function hp_set(id, prop, val) {
    const el = document.getElementById(id);
    if (!el) return;
    if (prop === 'text') el.textContent = val;
    else if (prop === 'value') el.value = val;
    else if (prop === 'bg') el.style.background = val;
    else if (prop === 'class') el.className = val;
    else if (prop === 'display') el.style.display = val;
    else if (prop === 'html') el.innerHTML = val;
}

// ── Pintar trigger (header) y panel ───────────────────
function hp_pintarTodo(u) {
    if (!u) return;
    const iniciales = hp_iniciales(u.nombre, u.apellido);
    const rolLabel = ROL_LABEL[u.tipo_usuario] || u.tipo_usuario;
    const gradient = ROL_GRADIENTS[u.tipo_usuario] || ROL_GRADIENTS.PRODUCTOR;
    const badgeCls = ROL_BADGE_CLASS[u.tipo_usuario] || '';
    const heroBg = ROL_HERO_BG[u.tipo_usuario] || ROL_HERO_BG.PRODUCTOR;
    const nombreCompleto = `${u.nombre || ''} ${u.apellido || ''}`.trim();

    /* ── Trigger header ── */
    hp_set('hp_avatar', 'bg', gradient);
    hp_set('hp_iniciales', 'text', iniciales);
    hp_set('hp_nombre', 'text', nombreCompleto);
    hp_set('hp_rol_badge', 'text', rolLabel);
    hp_set('hp_rol_badge', 'class', `hp-rol-badge ${badgeCls}`);

    /* ── Hero del panel ── */
    hp_set('hp_hero_bg', 'bg', heroBg);
    hp_set('hp_hero_avatar', 'bg', gradient);
    hp_set('hp_hero_iniciales', 'text', iniciales);
    hp_set('hp_hero_nombre', 'text', nombreCompleto);
    hp_set('hp_hero_cedula', 'text', u.cedula ? `CC: ${u.cedula}` : 'Sin cédula');
    hp_set('hp_hero_email_small', 'text', u.email || '');
    hp_set('hp_hero_rol_badge', 'text', rolLabel);
    hp_set('hp_hero_rol_badge', 'class', `hp-rol-badge hp-rol-badge-lg ${badgeCls}`);

    /* ── Permisos chips ── */
    // PostgreSQL devuelve los arrays como string "{dashboard,compras}" o ya como array JS
    let permisos = u.permisos || [];
    if (typeof permisos === 'string') {
        permisos = permisos.replace(/[{}]/g, '').split(',').filter(Boolean);
    }
    if (permisos.length) {
        const html = permisos.map(p =>
            `<span class="hp-chip">${PERMISO_LABEL[p.trim()] || p.trim()}</span>`
        ).join('');
        hp_set('hp_permisos_chips', 'html', html);
        hp_set('hp_permisos_wrap', 'display', 'block');
    } else {
        hp_set('hp_permisos_wrap', 'display', 'none');
    }

    /* ── Campos formulario ── */
    hp_set('hp_f_nombre', 'text', nombreCompleto);
    hp_set('hp_f_cedula', 'text', u.cedula || 'Sin cédula');
    hp_set('hp_f_email', 'value', u.email || '');
    hp_set('hp_f_telefono', 'value', u.telefono || '');
    hp_set('hp_f_tipo_label', 'text', rolLabel);

    /* Tipo usuario: oculto para ADMIN, visible (solo lectura) para los demás */
    if (u.tipo_usuario === 'ADMIN') {
        hp_set('hp_campo_tipo', 'display', 'none');
    } else {
        hp_set('hp_campo_tipo', 'display', '');
        hp_set('hp_tipo_readonly', 'display', '');
        hp_set('hp_f_tipo', 'display', 'none');
        hp_set('hp_f_tipo_label', 'text', rolLabel);
    }

    /* ── Foto de perfil guardada ── */
    if (u.foto_perfil) {
        // Construir URL completa si viene como ruta relativa /uploads/...
        const fotoUrl = u.foto_perfil.startsWith('http')
            ? u.foto_perfil
            : `${STATIC_URL}${u.foto_perfil}`;
        const imgHtml = `<img src="${fotoUrl}" alt="foto" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
        hp_set('hp_hero_avatar', 'html', imgHtml);
        hp_set('hp_avatar', 'html', imgHtml);
    }
}

// ── Toggle / Cerrar panel ──────────────────────────────
function hp_toggle() {
    const panel = document.getElementById('hp_panel');
    const overlay = document.getElementById('hp_overlay');
    const chevron = document.getElementById('hp_chevron');
    if (panel.classList.contains('abierto')) {
        hp_cerrar();
    } else {
        panel.classList.add('abierto');
        overlay.classList.add('show');
        chevron.classList.add('abierto');
    }
}
function hp_cerrar() {
    document.getElementById('hp_panel').classList.remove('abierto');
    document.getElementById('hp_overlay').classList.remove('show');
    document.getElementById('hp_chevron').classList.remove('abierto');
}

// ── Cambiar tab ────────────────────────────────────────
function hp_switchTab(tab, btn) {
    document.querySelectorAll('.hp-tab').forEach(b => b.classList.remove('hp-tab-active'));
    document.querySelectorAll('.hp-tab-body').forEach(c => c.classList.remove('hp-tab-active'));
    btn.classList.add('hp-tab-active');
    document.getElementById(`hp_tab_${tab}`)?.classList.add('hp-tab-active');
}

// ── Previsualizar y subir foto ────────────────────────
async function hp_previsualizarFoto(input) {
    const file = input.files[0];
    if (!file || !_hp_usuario) return;

    // 1️⃣ Previsualizar inmediatamente sin esperar al servidor
    const reader = new FileReader();
    reader.onload = e => {
        const src = e.target.result;
        const imgHtml = `<img src="${src}" alt="foto" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
        hp_set('hp_hero_avatar', 'html', imgHtml);
        hp_set('hp_avatar', 'html', imgHtml);
    };
    reader.readAsDataURL(file);

    // 2️⃣ Subir al servidor
    const formData = new FormData();
    formData.append('foto', file);
    const token = localStorage.getItem('token');

    try {
        const res = await fetch(`${API_URL}/usuarios/${_hp_usuario.id_usuario}/foto`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData
        });
        if (!res.ok) throw new Error('Error al subir la foto');
        const data = await res.json();

        // 3️⃣ Actualizar en memoria y localStorage para que persista
        _hp_usuario.foto_perfil = data.foto_perfil;
        localStorage.setItem('usuario', JSON.stringify(_hp_usuario));

        // 4️⃣ Mostrar la URL completa del servidor
        const fotoUrl = data.foto_perfil.startsWith('http')
            ? data.foto_perfil
            : `${STATIC_URL}${data.foto_perfil}`;
        const imgFinal = `<img src="${fotoUrl}" alt="foto" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
        hp_set('hp_hero_avatar', 'html', imgFinal);
        hp_set('hp_avatar', 'html', imgFinal);

    } catch (e) {
        console.error('Error subiendo foto:', e);
    }
}

// ── Guardar información ────────────────────────────────
async function hp_guardarInfo() {
    const msg = document.getElementById('hp_info_msg');
    if (!_hp_usuario) { msg.className = 'hp-msg error'; msg.textContent = ' No hay sesión activa.'; return; }

    const email = document.getElementById('hp_f_email').value.trim();
    const telefono = document.getElementById('hp_f_telefono').value.trim();
    const tipo = _hp_usuario.tipo_usuario === 'ADMIN'
        ? document.getElementById('hp_f_tipo').value
        : _hp_usuario.tipo_usuario;

    if (!email) { msg.className = 'hp-msg error'; msg.textContent = ' El correo es obligatorio.'; return; }

    const body = { email, telefono, tipo_usuario: tipo };
    const token = localStorage.getItem('token');

    try {
        const res = await fetch(`${API_URL}/usuarios/${_hp_usuario.id_usuario}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Error al guardar');
        }
        const actualizado = await res.json();
        _hp_usuario = { ..._hp_usuario, ...actualizado };
        hp_pintarTodo(_hp_usuario);
        msg.className = 'hp-msg ok';
        msg.textContent = 'Cambios guardados correctamente.';
    } catch (e) {
        msg.className = 'hp-msg error';
        msg.textContent = `${e.message}`;
    }
    setTimeout(() => msg.textContent = '', 3500);
}

// ── Cambiar contraseña ─────────────────────────────────
// El backend no tiene endpoint de cambio de password aún — dejamos el flujo listo
async function hp_cambiarPassword() {
    const actual = document.getElementById('hp_pass_actual').value;
    const nueva = document.getElementById('hp_pass_nueva').value;
    const confirmar = document.getElementById('hp_pass_confirmar').value;
    const msg = document.getElementById('hp_pass_msg');

    if (!actual || !nueva || !confirmar) {
        msg.className = 'hp-msg error'; msg.textContent = ' Completa todos los campos.'; return;
    }
    if (nueva !== confirmar) {
        msg.className = 'hp-msg error'; msg.textContent = ' Las contraseñas no coinciden.'; return;
    }
    if (nueva.length < 6) {
        msg.className = 'hp-msg error'; msg.textContent = ' Mínimo 6 caracteres.'; return;
    }

    // TODO: cuando el backend tenga endpoint:
    // await fetch(`${API_URL}/auth/cambiar-password`, { method:'PATCH', ... })
    msg.className = 'hp-msg ok';
    msg.textContent = ' Contraseña actualizada. (Conecta POST /auth/cambiar-password)';
    document.getElementById('hp_pass_actual').value = '';
    document.getElementById('hp_pass_nueva').value = '';
    document.getElementById('hp_pass_confirmar').value = '';
    setTimeout(() => msg.textContent = '', 3500);
}

// ── Cerrar sesión ──────────────────────────────────────
function hp_cerrarSesion() {
    if (!confirm('¿Deseas cerrar sesión?')) return;
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('usuario');
    window.location.replace('./login.html');
}

// ── Inicializar al cargar ──────────────────────────────
window.addEventListener('load', hp_cargarUsuario);

// ════════════════════════════════════════════════════════
//  MÓDULO USUARIOS
// ════════════════════════════════════════════════════════

let _usr_todos = [];   // cache todos los usuarios
let _usr_rol = '';   // filtro rol activo
let _usr_buscar = '';   // texto búsqueda

const USR_GRADIENTS = {
    ADMIN: 'linear-gradient(135deg,#fbbf24,#d97706)',
    VENDEDOR: 'linear-gradient(135deg,#a78bfa,#7c3aed)',
    PRODUCTOR: 'linear-gradient(135deg,#0aae0a,#1b5e20)',
};

// ── Cargar todos los usuarios ──────────────────────────
async function usr_cargar() {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
        const res = await fetch(`${API_URL}/usuarios`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Sin acceso');
        _usr_todos = await res.json();
        usr_renderTabla();
    } catch (e) {
        document.getElementById('usr_tbody').innerHTML =
            `<tr><td colspan="7" class="empty-state" style="color:#dc2626">Error al cargar usuarios: ${e.message}</td></tr>`;
    }
}

// ── Filtrar en tiempo real ─────────────────────────────
function usr_filtrar() {
    _usr_buscar = document.getElementById('usr_buscar').value.toLowerCase();
    usr_renderTabla();
}

function usr_setRol(rol, btn) {
    _usr_rol = rol;
    document.querySelectorAll('.usr-ftab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    usr_renderTabla();
}

// ── Renderizar tabla ───────────────────────────────────
function usr_renderTabla() {
    const tbody = document.getElementById('usr_tbody');
    const count = document.getElementById('usr_count');

    let lista = _usr_todos.filter(u => {
        const matchRol = !_usr_rol || u.tipo_usuario === _usr_rol;
        const texto = `${u.nombre} ${u.apellido} ${u.email} ${u.cedula || ''}`.toLowerCase();
        const matchBuscar = !_usr_buscar || texto.includes(_usr_buscar);
        return matchRol && matchBuscar;
    });

    count.textContent = `${lista.length} usuario${lista.length !== 1 ? 's' : ''} encontrado${lista.length !== 1 ? 's' : ''}`;

    if (!lista.length) {
        tbody.innerHTML = `<tr><td colspan="7" class="empty-state">No se encontraron usuarios</td></tr>`;
        return;
    }

    tbody.innerHTML = lista.map(u => {
        const iniciales = ((u.nombre || '')[0] || (u.nombre || '')).toUpperCase() +
            ((u.apellido || '')[0] || (u.apellido || '')).toUpperCase();
        const grad = USR_GRADIENTS[u.tipo_usuario] || USR_GRADIENTS.PRODUCTOR;
        return `
        <tr>
            <td>
                <div class="usr-user-cell">
                    <span class="usr-avatar" style="background:${grad}">${iniciales}</span>
                    <div>
                        <div class="usr-user-name">${u.nombre} ${u.apellido}</div>
                    </div>
                </div>
            </td>
            <td>${u.cedula || '—'}</td>
            <td>${u.email}</td>
            <td>${u.telefono || '—'}</td>
            <td><span class="usr-rol usr-rol-${u.tipo_usuario}">${u.tipo_usuario}</span></td>
            <td>
                <span class="usr-estado ${u.activo ? 'activo' : 'inactivo'}">
                    ${u.activo ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>
                <div style="display:flex;gap:6px;justify-content:flex-end">
                    <button class="usr-btn-action usr-btn-edit" title="Editar"
                            onclick="usr_abrirEditar(${u.id_usuario})">
                        <i class="fi fi-rr-pencil"></i>
                    </button>
                    <button class="usr-btn-del usr-btn-action"
                            title="${u.activo ? 'Desactivar' : 'Activar'}"
                            onclick="usr_desactivar(${u.id_usuario}, '${u.nombre} ${u.apellido}')">
                        <i class="fi fi-rr-trash"></i>
                    </button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

// ── Abrir panel CREAR ──────────────────────────────────
let _usr_editando = null;

function usr_abrirPanel() {
    _usr_editando = null;
    document.getElementById('usr_panel_titulo').textContent = 'Nuevo usuario';
    document.getElementById('usr_btn_guardar').innerHTML = '<i class="fi fi-rr-user-add"></i> Crear usuario';
    document.getElementById('usr_btn_guardar').disabled = false;

    // Cédula editable al crear
    document.getElementById('usr_campo_cedula').style.display = '';
    document.getElementById('usr_cedula_readonly').style.display = 'none';

    // Contraseña obligatoria al crear
    document.getElementById('usr_campo_password').style.display = '';

    // Rol editable al crear
    document.getElementById('usr_f_rol').disabled = false;

    ['usr_f_nombre', 'usr_f_apellido', 'usr_f_cedula', 'usr_f_email',
        'usr_f_telefono', 'usr_f_password'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
    document.getElementById('usr_f_rol').value = 'VENDEDOR';
    document.getElementById('usr_msg').textContent = '';
    document.getElementById('usr_msg').className = 'hp-msg';

    document.getElementById('usr_panel').classList.add('abierto');
    document.getElementById('usr_overlay').classList.add('show');
}

// ── Abrir panel EDITAR ─────────────────────────────────
function usr_abrirEditar(id) {
    const u = _usr_todos.find(x => x.id_usuario === id);
    if (!u) return;
    _usr_editando = u;

    document.getElementById('usr_panel_titulo').textContent = 'Editar usuario';
    document.getElementById('usr_btn_guardar').innerHTML = '<i class="fi fi-rr-check"></i> Guardar cambios';
    document.getElementById('usr_btn_guardar').disabled = false;

    // Cédula solo lectura al editar
    document.getElementById('usr_campo_cedula').style.display = 'none';
    document.getElementById('usr_cedula_readonly').style.display = '';
    document.getElementById('usr_cedula_val').textContent = u.cedula || '—';

    // Contraseña oculta al editar (no se cambia aquí)
    document.getElementById('usr_campo_password').style.display = 'none';

    document.getElementById('usr_f_nombre').value = u.nombre || '';
    document.getElementById('usr_f_apellido').value = u.apellido || '';
    document.getElementById('usr_f_email').value = u.email || '';
    document.getElementById('usr_f_telefono').value = u.telefono || '';
    document.getElementById('usr_f_rol').value = u.tipo_usuario || 'VENDEDOR';
    document.getElementById('usr_f_rol').disabled = false;

    document.getElementById('usr_msg').textContent = '';
    document.getElementById('usr_msg').className = 'hp-msg';

    document.getElementById('usr_panel').classList.add('abierto');
    document.getElementById('usr_overlay').classList.add('show');
}

function usr_cerrarPanel() {
    document.getElementById('usr_panel').classList.remove('abierto');
    document.getElementById('usr_overlay').classList.remove('show');
    _usr_editando = null;
}

// ── Guardar (crear o editar según _usr_editando) ───────
async function usr_guardar() {
    if (_usr_editando) {
        await usr_guardarEdicion();
    } else {
        await usr_crear();
    }
}

// ── Guardar edición ────────────────────────────────────
async function usr_guardarEdicion() {
    const msg = document.getElementById('usr_msg');
    const nombre = document.getElementById('usr_f_nombre').value.trim();
    const apellido = document.getElementById('usr_f_apellido').value.trim();
    const email = document.getElementById('usr_f_email').value.trim();
    const telefono = document.getElementById('usr_f_telefono').value.trim();
    const rol = document.getElementById('usr_f_rol').value;

    if (!nombre || !apellido || !email) {
        msg.className = 'hp-msg error';
        msg.textContent = '⚠️ Nombre, apellido y correo son obligatorios.';
        return;
    }

    const btn = document.getElementById('usr_btn_guardar');
    btn.disabled = true;
    btn.innerHTML = '<i class="fi fi-rr-spinner"></i> Guardando...';
    msg.style.display = 'none';

    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_URL}/usuarios/${_usr_editando.id_usuario}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ nombre, apellido, email, telefono, tipo_usuario: rol })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Error al guardar');

        // Actualizar caché local
        const idx = _usr_todos.findIndex(x => x.id_usuario === _usr_editando.id_usuario);
        if (idx !== -1) {
            _usr_todos[idx] = { ..._usr_todos[idx], nombre, apellido, email, telefono, tipo_usuario: rol };
        }

        msg.className = 'hp-msg ok';
        msg.style.display = 'block';
        msg.textContent = '✅ Usuario actualizado correctamente.';
        setTimeout(() => { usr_cerrarPanel(); usr_renderTabla(); }, 1200);
    } catch (e) {
        msg.className = 'hp-msg error';
        msg.style.display = 'block';
        msg.textContent = `⚠️ ${e.message}`;
        btn.disabled = false;
        btn.innerHTML = '<i class="fi fi-rr-check"></i> Guardar cambios';
    }
}

// ── Crear usuario ──────────────────────────────────────
async function usr_crear() {
    const msg = document.getElementById('usr_msg');
    const nombre = document.getElementById('usr_f_nombre').value.trim();
    const apellido = document.getElementById('usr_f_apellido').value.trim();
    const email = document.getElementById('usr_f_email').value.trim();
    const cedula = document.getElementById('usr_f_cedula').value.trim();
    const telefono = document.getElementById('usr_f_telefono').value.trim();
    const rol = document.getElementById('usr_f_rol').value;
    const password = document.getElementById('usr_f_password').value;

    // Los productores se crean desde el módulo Productores (transacción completa)
    if (rol === 'PRODUCTOR') {
        msg.className = 'hp-msg warn';
        msg.innerHTML = `Para crear un productor usa el módulo <strong>Productores</strong>.<br>
            <small>Crear desde aquí no genera el registro en la tabla de productores ni el QR.</small>
            <br><button onclick="usr_cerrarPanel();document.querySelector('[data-section=productores]').click()"
                style="margin-top:8px;padding:6px 14px;background:#0aae0a;color:#fff;border:none;
                       border-radius:8px;cursor:pointer;font-size:.8em;font-weight:700">
                Ir a Productores →
            </button>`;
        return;
    }

    if (!nombre || !apellido || !email || !password) {
        msg.className = 'hp-msg error';
        msg.textContent = ' Nombre, apellido, correo y contraseña son obligatorios.';
        return;
    }
    if (password.length < 6) {
        msg.className = 'hp-msg error';
        msg.textContent = 'La contraseña debe tener mínimo 6 caracteres.';
        return;
    }

    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ nombre, apellido, email, cedula, telefono, tipo_usuario: rol, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Error al crear usuario');

        msg.className = 'hp-msg ok';
        msg.textContent = ' Usuario creado correctamente.';
        setTimeout(() => { usr_cerrarPanel(); usr_cargar(); }, 1200);
    } catch (e) {
        msg.className = 'hp-msg error';
        msg.textContent = ` ${e.message}`;
    }
}

// ── Desactivar usuario (soft delete) ──────────────────
async function usr_desactivar(id, nombre) {
    if (!confirm(`¿Desactivar al usuario "${nombre}"?`)) return;
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_URL}/usuarios/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('No se pudo desactivar');
        // Actualizar en cache sin recargar
        const u = _usr_todos.find(x => x.id_usuario === id);
        if (u) u.activo = false;
        usr_renderTabla();
    } catch (e) {
        alert(`Error: ${e.message}`);
    }
}

// ════════════════════════════════════════════════════════
//  MÓDULO PRODUCTORES
//  GET    /api/productores?todos=true  → lista todos
//  GET    /api/productores/:id         → detalle
//  POST   /api/productores             → crear
//  PUT    /api/productores/:id         → editar (sin cédula)
//  PATCH  /api/productores/:id/estado  → activar/desactivar
// ════════════════════════════════════════════════════════

let _prd_todos = [];
let _prd_estado = '';
let _prd_buscar = '';
let _prd_editando = null;

// ── Cargar ────────────────────────────────────────────
async function prd_cargar() {
    const token = localStorage.getItem('token');

    // Si no hay token, mostrar mensaje claro
    if (!token) {
        document.getElementById('prd_tbody').innerHTML =
            `<tr><td colspan="7" class="empty-state" style="color:#dc2626"> No hay sesión activa. Inicia sesión primero.</td></tr>`;
        return;
    }

    // Mostrar botón nuevo solo si es ADMIN
    // _hp_usuario puede no estar listo aún — leer también del localStorage
    const usuarioLocal = _hp_usuario || JSON.parse(localStorage.getItem('usuario') || '{}');
    const esAdmin = usuarioLocal?.tipo_usuario === 'ADMIN';
    const btnNuevo = document.getElementById('prd_btn_nuevo');
    if (btnNuevo) btnNuevo.style.display = esAdmin ? '' : 'none';

    // Mostrar loading en tabla
    document.getElementById('prd_tbody').innerHTML =
        `<tr><td colspan="7" class="empty-state">Cargando productores...</td></tr>`;

    try {
        const res = await fetch(`${API_URL}/productores?todos=true`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || `Error ${res.status}`);
        }

        const json = await res.json();
        _prd_todos = json.data || json;

        if (!Array.isArray(_prd_todos)) {
            throw new Error('Formato de respuesta inesperado del servidor');
        }

        prd_renderTabla();
    } catch (e) {
        document.getElementById('prd_tbody').innerHTML =
            `<tr><td colspan="7" class="empty-state" style="color:#dc2626">
                 ${e.message}
                <br><small style="color:#9ca3af">Verifica que el servidor esté corriendo en ${API_URL}</small>
             </td></tr>`;
    }
}

// ── Filtrar ────────────────────────────────────────────
function prd_filtrar() {
    _prd_buscar = document.getElementById('prd_buscar').value.toLowerCase();
    prd_renderTabla();
}
function prd_setEstado(estado, btn) {
    _prd_estado = estado;
    btn.parentElement.querySelectorAll('.usr-ftab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    prd_renderTabla();
}

// ── Render tabla ───────────────────────────────────────
function prd_renderTabla() {
    const tbody = document.getElementById('prd_tbody');
    const count = document.getElementById('prd_count');
    const usuarioLocal = _hp_usuario || JSON.parse(localStorage.getItem('usuario') || '{}');
    const esAdmin = usuarioLocal?.tipo_usuario === 'ADMIN';

    let lista = _prd_todos.filter(p => {
        const matchEstado = !_prd_estado || p.estado === _prd_estado;
        const texto = `${p.nombre || ''} ${p.cedula || ''} ${p.finca || ''}`.toLowerCase();
        const matchBuscar = !_prd_buscar || texto.includes(_prd_buscar);
        return matchEstado && matchBuscar;
    });

    count.textContent = `${lista.length} productor${lista.length !== 1 ? 'es' : ''} encontrado${lista.length !== 1 ? 's' : ''}`;

    if (!lista.length) {
        tbody.innerHTML = `<tr><td colspan="8" class="empty-state">No se encontraron productores</td></tr>`;
        return;
    }

    tbody.innerHTML = lista.map(p => {
        const nombre = p.nombre || p.usuario?.nombre || '—';
        const apellido = p.usuario?.apellido || '';
        const cedula = p.cedula || p.usuario?.cedula || '—';
        const iniciales = nombre[0]?.toUpperCase() || '?';
        const activo = p.estado === 'ACTIVO';
        const qrValido = p.codigo_qr && p.codigo_qr.startsWith('data:image');
        const qrCell = qrValido
            ? `<button class="prd-qr-icon-btn" onclick="qr_ver(${p.id_productor})" title="Ver código QR">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="pointer-events:none">
                        <path d="M3 3h7v7H3V3zm2 2v3h3V5H5zm8-2h7v7h-7V3zm2 2v3h3V5h-3zM3 13h7v7H3v-7zm2 2v3h3v-3H5zm11 0h2v2h-2v-2zm-3-2h2v2h-2v-2zm0 4h2v2h-2v-2zm4-2h2v2h-2v-2zm0 4h2v2h-2v-2zm-4 0h2v2h-2v-2z"/>
                    </svg>
               </button>`
            : esAdmin
                ? `<button class="prd-qr-icon-btn" style="background:#fef3c7;border-color:#fde68a;color:#d97706"
                        onclick="prd_regenerarQR(${p.id_productor})" title="Regenerar QR">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="pointer-events:none">
                            <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46A7.93 7.93 0 0020 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74A7.93 7.93 0 004 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
                        </svg>
                   </button>`
                : `<span style="color:#d1d5db;font-size:.75em">—</span>`;
        return `
        <tr>
            <td>
                <div class="usr-user-cell">
                    <span class="usr-avatar" style="background:linear-gradient(135deg,#0aae0a,#1b5e20)">${iniciales}</span>
                    <div>
                        <div class="usr-user-name">${nombre} ${apellido}</div>
                        ${p.usuario?.email ? `<div style="font-size:.76em;color:#9ca3af">${p.usuario.email}</div>` : ''}
                    </div>
                </div>
            </td>
            <td style="font-family:monospace;font-size:.82em">${cedula}</td>
            <td>${p.finca || '—'}</td>
            <td style="font-size:.82em;color:#6b7280">${p.ubicacion || '—'}</td>
            <td>${p.telefono || p.usuario?.telefono || '—'}</td>
            <td class="prd-qr-cell">${qrCell}</td>
            <td>
                <span class="usr-estado ${activo ? 'activo' : 'inactivo'}">
                    ${activo ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>
                ${esAdmin ? `
                <div style="display:flex;gap:6px;justify-content:flex-end">
                    <button class="usr-btn-action usr-btn-edit" title="Editar"
                            onclick="prd_abrirEditar(${p.id_productor})">
                        <i class="fi fi-rr-pencil"></i>
                    </button>
                    <button class="usr-btn-action usr-btn-del"
                            onclick="prd_toggleEstado(${p.id_productor}, '${nombre}', '${p.estado}')">
                        <i class="fi fi-rr-${activo ? 'trash' : 'rotate-right'}"></i>
                    </button>
                </div>` : '—'}
            </td>
        </tr>`;
    }).join('');
}// ── Panel CREAR ────────────────────────────────────────
function prd_abrirPanel() {
    _prd_editando = null;
    document.getElementById('prd_panel_titulo').textContent = 'Nuevo productor';
    document.getElementById('prd_btn_accion').innerHTML = '<i class="fi fi-rr-user-add"></i> Crear productor';
    document.getElementById('prd_btn_accion').onclick = prd_crear;

    // Mostrar cédula editable y sección usuario
    document.getElementById('prd_f_cedula').style.display = '';
    document.getElementById('prd_cedula_readonly').style.display = 'none';
    document.getElementById('prd_campos_usuario').style.display = '';

    ['prd_f_nombre', 'prd_f_apellido', 'prd_f_cedula', 'prd_f_telefono',
        'prd_f_finca', 'prd_f_ubicacion', 'prd_f_email', 'prd_f_password'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
    document.getElementById('prd_msg').textContent = '';
    document.getElementById('prd_msg').className = 'hp-msg';

    document.getElementById('prd_panel').classList.add('abierto');
    document.getElementById('prd_overlay').classList.add('show');
}

// ── Panel EDITAR ───────────────────────────────────────
function prd_abrirEditar(id) {
    const p = _prd_todos.find(x => x.id_productor === id);
    if (!p) return;
    _prd_editando = p;

    document.getElementById('prd_panel_titulo').textContent = 'Editar productor';
    document.getElementById('prd_btn_accion').innerHTML = '<i class="fi fi-rr-check"></i> Guardar cambios';
    document.getElementById('prd_btn_accion').onclick = prd_guardarEdicion;

    document.getElementById('prd_f_cedula').style.display = 'none';
    document.getElementById('prd_cedula_readonly').style.display = '';
    document.getElementById('prd_cedula_val').textContent = p.cedula || p.usuario?.cedula || '—';

    document.getElementById('prd_campos_usuario').style.display = 'none';

    const nombre = p.usuario?.nombre || p.nombre || '';
    const apellido = p.usuario?.apellido || p.apellido || '';

    document.getElementById('prd_f_nombre').value = nombre;
    document.getElementById('prd_f_apellido').value = apellido;
    document.getElementById('prd_f_telefono').value = p.telefono || p.usuario?.telefono || '';
    document.getElementById('prd_f_finca').value = p.finca || '';
    document.getElementById('prd_f_ubicacion').value = p.ubicacion || '';

    document.getElementById('prd_msg').textContent = '';
    document.getElementById('prd_msg').className = 'hp-msg';

    document.getElementById('prd_panel').classList.add('abierto');
    document.getElementById('prd_overlay').classList.add('show');
}

function prd_cerrarPanel() {
    document.getElementById('prd_panel').classList.remove('abierto');
    document.getElementById('prd_overlay').classList.remove('show');
    _prd_editando = null;
}

// ── Crear ──────────────────────────────────────────────
async function prd_crear() {
    const msg = document.getElementById('prd_msg');
    const nombre = document.getElementById('prd_f_nombre').value.trim();
    const apellido = document.getElementById('prd_f_apellido').value.trim();
    const cedula = document.getElementById('prd_f_cedula').value.trim();
    const telefono = document.getElementById('prd_f_telefono').value.trim();
    const finca = document.getElementById('prd_f_finca').value.trim();
    const ubicacion = document.getElementById('prd_f_ubicacion').value.trim();
    const email = document.getElementById('prd_f_email').value.trim();
    const password = document.getElementById('prd_f_password').value;

    if (!nombre || !apellido || !cedula || !email || !password) {
        msg.className = 'hp-msg error';
        msg.textContent = ' Nombre, apellido, cédula, correo y contraseña son obligatorios.';
        return;
    }
    if (password.length < 6) {
        msg.className = 'hp-msg error';
        msg.textContent = ' La contraseña debe tener mínimo 6 caracteres.';
        return;
    }

    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_URL}/productores`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ nombre, apellido, cedula, telefono, finca, ubicacion, email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Error al crear productor');

        msg.className = 'hp-msg ok';
        msg.textContent = ' Productor creado correctamente.';
        setTimeout(() => { prd_cerrarPanel(); prd_cargar(); }, 1200);
    } catch (e) {
        msg.className = 'hp-msg error';
        msg.textContent = ` ${e.message}`;
    }
}

// ── Guardar edición ────────────────────────────────────
async function prd_guardarEdicion() {
    const msg = document.getElementById('prd_msg');
    if (!_prd_editando) return;

    const nombre = document.getElementById('prd_f_nombre').value.trim();
    const apellido = document.getElementById('prd_f_apellido').value.trim();
    const telefono = document.getElementById('prd_f_telefono').value.trim();
    const finca = document.getElementById('prd_f_finca').value.trim();
    const ubicacion = document.getElementById('prd_f_ubicacion').value.trim();

    if (!nombre) {
        msg.className = 'hp-msg error';
        msg.textContent = 'El nombre es obligatorio.';
        return;
    }

    const token = localStorage.getItem('token');
    try {
        // 1. Actualizar datos del productor (finca, ubicacion, telefono)
        const resPrd = await fetch(`${API_URL}/productores/${_prd_editando.id_productor}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ telefono, finca, ubicacion })
        });
        const dataPrd = await resPrd.json();
        if (!resPrd.ok) throw new Error(dataPrd.message || 'Error al guardar productor');

        // 2. Actualizar nombre y apellido en la tabla usuarios (donde viven esos datos)
        const idUsuario = _prd_editando.id_usuario || _prd_editando.usuario?.id_usuario;
        if (idUsuario) {
            const resUsr = await fetch(`${API_URL}/usuarios/${idUsuario}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ nombre, apellido, telefono })
            });
            // Si el endpoint falla no bloqueamos — solo advertimos
            if (!resUsr.ok) {
                const errUsr = await resUsr.json().catch(() => ({}));
                console.warn('No se pudo actualizar usuario:', errUsr.message);
            }
        }

        // Actualizar caché local para que la tabla refleje el cambio sin recargar
        const idx = _prd_todos.findIndex(p => p.id_productor === _prd_editando.id_productor);
        if (idx !== -1) {
            _prd_todos[idx] = {
                ..._prd_todos[idx],
                telefono, finca, ubicacion,
                usuario: {
                    ...(_prd_todos[idx].usuario || {}),
                    nombre, apellido, telefono
                }
            };
        }

        msg.className = 'hp-msg ok';
        msg.textContent = 'Productor actualizado correctamente.';
        setTimeout(() => { prd_cerrarPanel(); prd_renderTabla(); }, 1200);
    } catch (e) {
        msg.className = 'hp-msg error';
        msg.textContent = ` ${e.message}`;
    }
}

// ── Toggle activo/inactivo ─────────────────────────────
async function prd_toggleEstado(id, nombre, estadoActual) {
    const nuevoEstado = estadoActual === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    const accion = nuevoEstado === 'INACTIVO' ? 'desactivar' : 'reactivar';
    if (!confirm(`¿Deseas ${accion} al productor "${nombre}"?`)) return;

    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_URL}/productores/${id}/estado`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ estado: nuevoEstado })
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Error al cambiar estado');
        }
        const p = _prd_todos.find(x => x.id_productor === id);
        if (p) p.estado = nuevoEstado;
        prd_renderTabla();
    } catch (e) {
        alert(`Error: ${e.message}`);
    }
}

// ── Regenerar QR ────────────────────────────────────────
async function prd_regenerarQR(id) {
    const token = localStorage.getItem('token');
    const btn = event.currentTarget;
    btn.disabled = true;
    btn.style.opacity = '.5';
    try {
        const res = await fetch(`${API_URL}/productores/${id}/qr`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Error al regenerar QR');

        // Actualizar en caché y re-renderizar
        const p = _prd_todos.find(x => x.id_productor === id);
        if (p && data.data?.codigo_qr) p.codigo_qr = data.data.codigo_qr;
        prd_renderTabla();
    } catch (e) {
        alert(`Error: ${e.message}`);
        btn.disabled = false;
        btn.style.opacity = '1';
    }
}

// ════════════════════════════════════════
//  MODAL QR
// ════════════════════════════════════════
function qr_ver(id_productor) {
    const p = _prd_todos.find(x => x.id_productor == id_productor);

    if (!p) { alert('Productor no encontrado. Recarga la sección.'); return; }

    const qrValido = p.codigo_qr && p.codigo_qr.startsWith('data:image');
    if (!qrValido) {
        alert(' Este productor tiene un QR inválido o pendiente de regenerar.\n\nSolución: llama a POST /api/productores/' + p.id_productor + '/qr para regenerarlo.');
        return;
    }

    const nombre = p.usuario?.nombre || p.nombre || 'Productor';
    const apellido = p.usuario?.apellido || '';
    const cedula = p.usuario?.cedula || p.cedula || '—';
    const finca = p.finca || 'Sin finca';
    const inicial = (nombre[0] || 'P').toUpperCase();
    const nombreCompleto = `${nombre} ${apellido}`.trim();

    document.getElementById('qr_modal_inicial').textContent = inicial;
    document.getElementById('qr_modal_nombre').textContent = nombreCompleto;
    document.getElementById('modal-qr-meta').textContent = `Cédula: ${cedula}  ·  Finca: ${finca}`;
    document.getElementById('modal-qr-canvas').innerHTML =
        `<img id="qr-img" src="${p.codigo_qr}" alt="QR" style="width:240px;height:240px;border-radius:10px;border:1px solid #e5e7eb;display:block">`;

    const dl = document.getElementById('qr_modal_dl');
    dl.href = p.codigo_qr;
    dl.download = `QR_${nombreCompleto.replace(/\s+/g, '_')}.png`;

    document.getElementById('modalQRProductor').style.display = 'flex';
}

function qr_cerrar() {
    document.getElementById('modalQRProductor').style.display = 'none';
}

function qr_imprimir() {
    const img = document.getElementById('qr-img');
    if (!img) { alert('No hay QR para imprimir'); return; }
    const nombre = document.getElementById('qr_modal_nombre').textContent;
    const meta = document.getElementById('modal-qr-meta').textContent;
    const inicial = nombre[0].toUpperCase();

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>QR ${nombre}</title>
      <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:'Segoe UI',sans-serif;display:flex;align-items:center;
             justify-content:center;min-height:100vh;background:#fff}
        .card{width:320px;border:2px solid #e5e7eb;border-radius:18px;overflow:hidden}
        .top{background:linear-gradient(135deg,#0aae0a,#1b5e20);padding:20px;
             display:flex;align-items:center;gap:14px}
        .av{width:50px;height:50px;border-radius:50%;background:rgba(255,255,255,.22);
            display:flex;align-items:center;justify-content:center;
            font-size:1.4em;font-weight:900;color:#fff;flex-shrink:0}
        .n{font-size:1em;font-weight:800;color:#fff;display:block}
        .m{font-size:.75em;color:rgba(255,255,255,.82);display:block;margin-top:4px}
        .qrw{background:#f9fafb;padding:22px;display:flex;flex-direction:column;
             align-items:center;gap:10px}
        .qrw img{width:220px;height:220px;border-radius:10px;border:1px solid #e5e7eb}
        .hint{font-size:.7em;color:#9ca3af;font-weight:600}
        .brand{background:#f0fdf4;padding:8px;text-align:center;font-size:.68em;
               color:#0aae0a;font-weight:700;border-top:1px solid #dcfce7}
        @media print{body{margin:0}}
      </style></head><body>
      <div class="card">
        <div class="top">
          <div class="av">${inicial}</div>
          <div><span class="n">${nombre}</span><span class="m">${meta}</span></div>
        </div>
        <div class="qrw">
          <img src="${img.src}" alt="QR">
          <span class="hint">Escanea para identificar este productor</span>
        </div>
        <div class="brand">AgroTrace · Sistema de Trazabilidad</div>
      </div>
      <script>window.addEventListener('load',()=>{setTimeout(()=>{window.print();},300)})<\/script>
      </body></html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'width=520,height=620');
    setTimeout(() => URL.revokeObjectURL(url), 10000);
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') { qr_cerrar(); pro_cerrarPanel(); det_cerrar(); } });

// ════════════════════════════════════════
//  AVISO ROL PRODUCTOR EN PANEL USUARIOS
// ════════════════════════════════════════
function usr_chkRol(sel) {
    const msg = document.getElementById('usr_msg');
    if (sel.value === 'PRODUCTOR') {
        msg.className = 'hp-msg warn';
        msg.innerHTML = `Los productores se crean desde el módulo <strong>Productores</strong> para generar también el QR y el registro completo.<br>
            <button onclick="usr_cerrarPanel();document.querySelector('[data-section=productores]').click()"
                style="margin-top:8px;padding:6px 14px;background:#0aae0a;color:#fff;border:none;
                       border-radius:8px;cursor:pointer;font-size:.8em;font-weight:700">
                Ir a Productores →
            </button>`;
    } else {
        msg.className = 'hp-msg';
        msg.innerHTML = '';
    }
}

/// ════════════════════════════════════════
// MÓDULO PRODUCTOS
// ════════════════════════════════════════

let pro_lista = [];
let pro_buscar = "";
let pro_disponible = "";
let pro_editando = null;


// ─────────────────────────────
// API segura
// ─────────────────────────────

async function pro_api(url, options = {}) {

    const token = localStorage.getItem("token");

    const res = await fetch(url, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        ...options
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        throw new Error(data.message || "Error en la petición");
    }

    return data;
}


// ─────────────────────────────
// CARGAR PRODUCTOS
// ─────────────────────────────

async function pro_cargar() {

    try {

        const data = await pro_api(`${API_URL}/productos`);

        pro_lista = Array.isArray(data) ? data : data.data || [];

        pro_renderTabla();

    } catch (e) {

        document.getElementById("pro_tbody").innerHTML =
            `<tr>
                <td colspan="7" style="text-align:center;padding:40px;color:#ef4444">
                    ${e.message}
                </td>
            </tr>`;
    }
}


// ─────────────────────────────
// FILTROS
// ─────────────────────────────

function pro_filtrar(valor) {
    pro_buscar = valor.toLowerCase();
    pro_renderTabla();
}

function pro_setDisponible(valor, btn) {

    pro_disponible = valor;

    document
        .querySelectorAll("#productos .usr-ftab")
        .forEach(b => b.classList.remove("active"));

    btn.classList.add("active");

    pro_renderTabla();
}


// ─────────────────────────────
// RENDER TABLA
// ─────────────────────────────

function pro_renderTabla() {

    const tbody = document.getElementById("pro_tbody");
    if (!tbody) return;

    let lista = pro_lista.filter(p => {

        const texto =
            `${p.nombre || ""} ${p.descripcion || ""}`
                .toLowerCase();

        const buscarOk =
            !pro_buscar || texto.includes(pro_buscar);

        const estadoOk =
            pro_disponible === ""
                ? true
                : pro_disponible === "true"
                    ? p.disponible
                    : !p.disponible;

        return buscarOk && estadoOk;
    });


    document.getElementById("pro_count").textContent =
        `${lista.length} producto${lista.length !== 1 ? "s" : ""}`;


    if (!lista.length) {

        tbody.innerHTML =
            `<tr>
                <td colspan="7" style="text-align:center;padding:40px;color:#9ca3af">
                    No hay productos
                </td>
            </tr>`;

        return;
    }


    const fmt = n => n != null
        ? `$ ${Number(n).toLocaleString("es-CO")}`
        : "—";


    tbody.innerHTML = lista.map(p => {

        const id = Number(p.id_producto);
        const disponible = p.disponible;

        return `
        <tr>

            <td>${p.nombre}</td>

            <td>${p.descripcion || "—"}</td>

            <td>${p.unidad_medida || "—"}</td>

            <td>${fmt(p.precio_base)}</td>

            <td>
                <span class="usr-estado ${disponible ? "activo" : "inactivo"}">
                    ${disponible ? "Disponible" : "No disponible"}
                </span>
            </td>

            <td>

                <button class="usr-btn-action usr-btn-edit" onclick="pro_abrirEditar(${id})">
                    <i class="fi fi-rr-pencil"></i> 
                </button>

                <button class="usr-btn-action usr-btn-del" onclick="pro_toggleDisponible(${id}, '${p.nombre}', ${disponible})">
                    <i class="fi fi-rr-power"></i> ${disponible ? "" : "<i class='fi fi-rr-power-on'></i>"}
                </button>
            

            </td>
        </tr>`;
    }).join("");
}


// ─────────────────────────────
// PANEL PRODUCTOS — abrir / cerrar / editar
// ─────────────────────────────

function pro_abrirPanel() {
    pro_editando = null;
    document.getElementById('pro_panel_titulo').textContent = 'Nuevo producto';
    document.getElementById('pro_btn_guardar').innerHTML = '<i class="fi fi-rr-check"></i> Guardar producto';
    document.getElementById('pro_btn_guardar').disabled = false;

    ['pro_f_nombre', 'pro_f_descripcion', 'pro_f_precio_base'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    const cat = document.getElementById('pro_f_categoria');
    if (cat) cat.value = '';
    const uni = document.getElementById('pro_f_unidad');
    if (uni) uni.value = '';

    const msg = document.getElementById('pro_msg');
    if (msg) msg.style.display = 'none';

    document.getElementById('pro_overlay').classList.add('show');
    document.getElementById('pro_panel').classList.add('abierto');
}

function pro_abrirEditar(id) {
    const p = pro_lista.find(x => Number(x.id_producto) === Number(id));
    if (!p) return;
    pro_editando = id;

    document.getElementById('pro_panel_titulo').textContent = 'Editar producto';
    document.getElementById('pro_btn_guardar').innerHTML = '<i class="fi fi-rr-check"></i> Guardar cambios';
    document.getElementById('pro_btn_guardar').disabled = false;

    document.getElementById('pro_f_nombre').value = p.nombre || '';
    document.getElementById('pro_f_descripcion').value = p.descripcion || '';
    document.getElementById('pro_f_precio_base').value = p.precio_base ?? '';

    /*const cat = document.getElementById('pro_f_categoria');
    if (cat) cat.value = p.categoria || '';*/
    const uni = document.getElementById('pro_f_unidad');
    if (uni) uni.value = p.unidad_medida || '';

    const msg = document.getElementById('pro_msg');
    if (msg) msg.style.display = 'none';

    document.getElementById('pro_overlay').classList.add('show');
    document.getElementById('pro_panel').classList.add('abierto');
}

function pro_cerrarPanel() {
    document.getElementById('pro_overlay').classList.remove('show');
    document.getElementById('pro_panel').classList.remove('abierto');
    pro_editando = null;
}

// ─────────────────────────────
// GUARDAR PRODUCTO
// ─────────────────────────────

async function pro_guardar() {
    const msg = document.getElementById('pro_msg');

    const nombre = document.getElementById('pro_f_nombre').value.trim();
    if (!nombre) {
        msg.style.display = 'block';
        msg.style.background = '#fee2e2';
        msg.style.color = '#991b1b';
        msg.textContent = ' El nombre del producto es obligatorio.';
        return;
    }

    const precioBaseVal = document.getElementById('pro_f_precio_base').value;
    const precioDiaVal = document.getElementById('pro_f_precio_dia').value;

    if (precioBaseVal && Number(precioBaseVal) < 0) {
        msg.style.display = 'block';
        msg.style.background = '#fee2e2';
        msg.style.color = '#991b1b';
        msg.textContent = ' El precio no puede ser negativo.';
        return;
    }

    const body = {
        nombre,
        descripcion: document.getElementById('pro_f_descripcion').value.trim() || undefined,
        categoria: document.getElementById('pro_f_categoria').value || undefined,
        unidad_medida: document.getElementById('pro_f_unidad').value || undefined,
        precio_base: precioBaseVal !== '' ? Number(precioBaseVal) : 0,
        precio_dia: precioDiaVal !== '' ? Number(precioDiaVal) : undefined,
    };

    const btn = document.getElementById('pro_btn_guardar');
    btn.disabled = true;
    btn.innerHTML = '<i class="fi fi-rr-spinner"></i> Guardando...';
    msg.style.display = 'none';

    try {
        // Usar pro_editando !== null para que id=0 funcione igual
        if (pro_editando !== null) {
            await pro_api(`${API_URL}/productos/${pro_editando}`, {
                method: 'PUT',
                body: JSON.stringify(body)
            });
        } else {
            await pro_api(`${API_URL}/productos`, {
                method: 'POST',
                body: JSON.stringify(body)
            });
        }

        msg.style.display = 'block';
        msg.style.background = '#dcfce7';
        msg.style.color = '#166534';
        msg.textContent = pro_editando !== null
            ? ' Producto actualizado correctamente.'
            : ' Producto creado correctamente.';

        await pro_cargar();
        setTimeout(() => pro_cerrarPanel(), 1000);

    } catch (e) {
        msg.style.display = 'block';
        msg.style.background = '#fee2e2';
        msg.style.color = '#991b1b';
        msg.textContent = ` ${e.message}`;
        btn.disabled = false;
        btn.innerHTML = '<i class="fi fi-rr-check"></i> ' + (pro_editando !== null ? 'Guardar cambios' : 'Guardar producto');
    }
}


// ─────────────────────────────
// ACTIVAR / DESACTIVAR
// ─────────────────────────────

async function pro_toggleDisponible(id, nombre, actual) {

    const confirmar = confirm(
        `¿Cambiar estado del producto "${nombre}"?`
    );

    if (!confirmar) return;

    try {

        await pro_api(`${API_URL}/productos/${id}/estado`, {
            method: "PATCH",
            body: JSON.stringify({
                disponible: !actual
            })
        });

        await pro_cargar();

    } catch (e) {

        alert(e.message);
    }
}
// ── fin módulo productos ──
// ════════════════════════════════════════════════════════
//  MÓDULO COMPRAS
// ════════════════════════════════════════════════════════
let _cmp_todos = [];
let _cmp_buscar = '';
let _cmp_estado = '';

async function cmp_cargar() {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_URL}/compras`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        _cmp_todos = Array.isArray(json) ? json : (json.data || []);
        cmp_renderTabla();
    } catch (e) {
        document.getElementById('cmp_tbody').innerHTML =
            `<tr><td colspan="7" style="text-align:center;padding:40px;color:#ef4444">Error: ${e.message}</td></tr>`;
    }
}

function cmp_filtrar(val) { _cmp_buscar = val.toLowerCase(); cmp_renderTabla(); }

function cmp_setEstado(val, btn) {
    _cmp_estado = val;
    document.querySelectorAll('#compras .usr-ftab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    cmp_renderTabla();
}

function cmp_renderTabla() {
    const tbody = document.getElementById('cmp_tbody');
    if (!tbody) return;

    const lista = _cmp_todos.filter(c => {
        const txt = `${c.numero_factura || ''} ${c.productor?.nombre || ''} ${c.productor?.usuario?.nombre || ''}`.toLowerCase();
        const okBuscar = !_cmp_buscar || txt.includes(_cmp_buscar);
        const okEstado = !_cmp_estado || c.estado === _cmp_estado;
        return okBuscar && okEstado;
    });

    document.getElementById('cmp_count').textContent = `${lista.length} registro${lista.length !== 1 ? 's' : ''}`;

    if (!lista.length) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:#9ca3af">Sin registros</td></tr>`;
        return;
    }

    const fmt = n => n != null ? `$${Number(n).toLocaleString('es-CO')}` : '—';
    const fmtFecha = f => f ? new Date(f).toLocaleDateString('es-CO') : '—';

    tbody.innerHTML = lista.map(c => {
        const productor = c.productor?.usuario?.nombre
            ? `${c.productor.usuario.nombre} ${c.productor.usuario.apellido || ''}`.trim()
            : (c.productor?.nombre || '—');
        const nDetalles = c.detalles?.length ?? '—';
        return `<tr>
            <td style="font-family:monospace;font-size:.82em;font-weight:700">${c.numero_factura || '—'}</td>
            <td>${productor}</td>
            <td style="font-size:.85em;color:#6b7280">${fmtFecha(c.fecha_compra)}</td>
            <td style="text-align:center">${nDetalles}</td>
            <td style="font-weight:700;color:#111827">${fmt(c.total)}</td>
            <td><span class="badge-estado badge-${c.estado || 'pendiente'}">${c.estado || 'pendiente'}</span></td>
            <td>
                <div style="display:flex;gap:6px;justify-content:flex-end">
                    <button class="usr-btn-action usr-btn-edit" title="Ver detalle"
                            onclick="det_abrir('compra', ${c.id_compra})">
                        <i class="fi fi-rr-eye"></i>
                    </button>
                </div>
            </td>
            <td>
                <button class="usr-btn-action usr-btn-del" title="Eliminar compra"
                        onclick="cmp_desactivar(${c.id_compra})">
                    <i class="fi fi-rr-trash"></i>
                </button>
            </td>
        </tr>`;
    }).join('');
}
function cmp_desactivar(id) {
    if (!confirm('¿Confirma que desea desactivar esta compra? Esta acción se puede revertir.')) return;

    const token = localStorage.getItem('token');

    fetch(`${API_URL}/compras/${id}/desactivar`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ activo: false }) // aquí "activo" es el campo que marca si está disponible
    })
        .then(res => {
            if (!res.ok) return res.json().then(err => { throw new Error(err.message || 'Error al desactivar'); });

            // Actualizamos la lista local, filtrando o marcando como inactivo
            _cmp_todos = _cmp_todos.map(c => c.id_compra === id ? { ...c, activo: false } : c);

            cmp_renderTabla(); // renderizamos la tabla con los cambios
        })
        .catch(e => alert(`Error: ${e.message}`));
}

// ════════════════════════════════════════════════════════
//  MÓDULO VENTAS
// ════════════════════════════════════════════════════════
let _vnt_todos = [];
let _vnt_buscar = '';
let _vnt_estado = '';

async function vnt_cargar() {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_URL}/ventas`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        _vnt_todos = Array.isArray(json) ? json : (json.data || []);
        vnt_renderTabla();
    } catch (e) {
        document.getElementById('vnt_tbody').innerHTML =
            `<tr><td colspan="7" style="text-align:center;padding:40px;color:#ef4444">Error: ${e.message}</td></tr>`;
    }
}

function vnt_filtrar(val) { _vnt_buscar = val.toLowerCase(); vnt_renderTabla(); }

function vnt_setEstado(val, btn) {
    _vnt_estado = val;
    document.querySelectorAll('#ventas .usr-ftab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    vnt_renderTabla();
}

function vnt_renderTabla() {
    const tbody = document.getElementById('vnt_tbody');
    if (!tbody) return;

    const lista = _vnt_todos.filter(v => {
        const txt = `${v.numero_factura || ''} ${v.cliente || ''}`.toLowerCase();
        const okBuscar = !_vnt_buscar || txt.includes(_vnt_buscar);
        const okEstado = !_vnt_estado || v.estado === _vnt_estado;
        return okBuscar && okEstado;
    });

    document.getElementById('vnt_count').textContent = `${lista.length} registro${lista.length !== 1 ? 's' : ''}`;

    if (!lista.length) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:#9ca3af">Sin registros</td></tr>`;
        return;
    }

    const fmt = n => n != null ? `$${Number(n).toLocaleString('es-CO')}` : '—';
    const fmtFecha = f => f ? new Date(f).toLocaleDateString('es-CO') : '—';

    tbody.innerHTML = lista.map(v => {
        const nDetalles = v.detalles?.length ?? '—';
        return `<tr>
            <td style="font-family:monospace;font-size:.82em;font-weight:700">${v.numero_factura || '—'}</td>
            <td>${v.comerciante?.nombre ?? '-'}</td>
            <td style="font-size:.85em;color:#6b7280">${fmtFecha(v.fecha_venta)}</td>
            <td style="text-align:center">${nDetalles}</td>
            <td style="font-weight:700;color:#111827">${fmt(v.total)}</td>
            <td><span class="badge-estado badge-${v.estado || 'pendiente'}">${v.estado || 'pendiente'}</span></td>
            <td>
                <div style="display:flex;gap:6px;justify-content:flex-end margin-right:-18px">
                    <button class="usr-btn-action usr-btn-edit" title="Ver detalle"
                            onclick="det_abrir('venta', ${v.id_venta})">
                        <i class="fi fi-rr-eye"></i>
                    </button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

// ════════════════════════════════════════════════════════
//  MODAL DETALLE COMPRA / VENTA
// ════════════════════════════════════════════════════════
async function det_abrir(tipo, id) {
    const token = localStorage.getItem('token');
    const modal = document.getElementById('det_modal');
    modal.style.display = 'flex';

    document.getElementById('det_titulo').textContent = tipo === 'compra' ? 'Detalle de Compra' : ' Detalle de Venta';
    document.getElementById('det_subtitulo').textContent = 'Cargando...';
    document.getElementById('det_info').innerHTML = '';
    document.getElementById('det_tbody').innerHTML = '<tr><td colspan="4" style="padding:20px;text-align:center;color:#9ca3af">Cargando...</td></tr>';
    document.getElementById('det_total').textContent = '';

    try {
        const url = tipo === 'compra' ? `${API_URL}/compras/${id}` : `${API_URL}/ventas/${id}`;
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        const json = await res.json();
        const d = json.data || json;

        const fmt = n => n != null ? `$${Number(n).toLocaleString('es-CO')}` : '—';
        const fmtFecha = f => f ? new Date(f).toLocaleDateString('es-CO') : '—';

        document.getElementById('det_subtitulo').textContent = `Factura: ${d.numero_factura || '—'}`;

        // Info cards
        let infoHTML = '';
        if (tipo === 'compra') {
            const prod = d.productor?.usuario?.nombre
                ? `${d.productor.usuario.nombre} ${d.productor.usuario.apellido || ''}`.trim()
                : (d.productor?.nombre || '—');
            infoHTML = `
                <div class="det-info-item"><span class="det-info-label">Productor</span><span class="det-info-value">${prod}</span></div>
                <div class="det-info-item"><span class="det-info-label">Fecha compra</span><span class="det-info-value">${fmtFecha(d.fecha_compra)}</span></div>
                <div class="det-info-item"><span class="det-info-label">Estado</span><span class="det-info-value"><span class="badge-estado badge-${d.estado || 'pendiente'}">${d.estado || 'pendiente'}</span></span></div>
                <div class="det-info-item"><span class="det-info-label">Total</span><span class="det-info-value" style="color:#0aae0a">${fmt(d.total)}</span></div>`;
        } else {
            infoHTML = `
                <div class="det-info-item"><span class="det-info-label">Cliente</span><span class="det-info-value">${d.cliente || '—'}</span></div>
                <div class="det-info-item"><span class="det-info-label">Fecha venta</span><span class="det-info-value">${fmtFecha(d.fecha_venta)}</span></div>
                <div class="det-info-item"><span class="det-info-label">Estado</span><span class="det-info-value"><span class="badge-estado badge-${d.estado || 'pendiente'}">${d.estado || 'pendiente'}</span></span></div>
                <div class="det-info-item"><span class="det-info-label">Total</span><span class="det-info-value" style="color:#0aae0a">${fmt(d.total)}</span></div>`;
        }
        document.getElementById('det_info').innerHTML = infoHTML;

        // Detalles
        const detalles = d.detalles || [];
        if (!detalles.length) {
            document.getElementById('det_tbody').innerHTML =
                '<tr><td colspan="4" style="padding:20px;text-align:center;color:#9ca3af">Sin productos registrados</td></tr>';
        } else {
            document.getElementById('det_tbody').innerHTML = detalles.map(item => `
                <tr>
                    <td style="padding:8px 10px;border-bottom:1px solid #f3f4f6">${item.producto?.nombre || '—'}</td>
                    <td style="padding:8px 10px;text-align:right;border-bottom:1px solid #f3f4f6">${item.cantidad} ${item.producto?.unidad_medida || ''}</td>
                    <td style="padding:8px 10px;text-align:right;border-bottom:1px solid #f3f4f6">${fmt(item.precio_unitario)}</td>
                    <td style="padding:8px 10px;text-align:right;border-bottom:1px solid #f3f4f6;font-weight:700">${fmt(item.subtotal)}</td>
                </tr>`).join('');
        }
        document.getElementById('det_total').textContent = fmt(d.total);

    } catch (e) {
        document.getElementById('det_subtitulo').textContent = 'Error al cargar';
        document.getElementById('det_tbody').innerHTML =
            `<tr><td colspan="4" style="padding:20px;text-align:center;color:#ef4444">${e.message}</td></tr>`;
    }
}

function det_cerrar() {
    document.getElementById('det_modal').style.display = 'none';
}

// ════════════════════════════════════════════════════════
//  MÓDULO HISTORIAL
// ════════════════════════════════════════════════════════
let _his_tabActual = 'transacciones';
let _his_transacciones = [];
let _his_precios = [];
let _his_buscar = '';

async function his_cargar() {
    const token = localStorage.getItem('token');

    // Fechas
    const inicio = document.getElementById('his_fecha_inicio')?.value || '';
    const fin = document.getElementById('his_fecha_fin')?.value || '';
    const params = new URLSearchParams();
    if (inicio) params.append('inicio', inicio);
    if (fin) params.append('fin', fin);
    const qs = params.toString() ? '?' + params.toString() : '';

    try {
        if (_his_tabActual === 'transacciones') {
            const res = await fetch(`${API_URL}/historial/transacciones${qs}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const json = await res.json();
            _his_transacciones = Array.isArray(json) ? json : (json.data || []);
            his_renderTransacciones();
        } else {
            const res = await fetch(`${API_URL}/historial/precios${qs}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const json = await res.json();
            _his_precios = Array.isArray(json) ? json : (json.data || []);
            his_renderPrecios();
        }
    } catch (e) {
        const id = _his_tabActual === 'transacciones' ? 'his_tbody_trans' : 'his_tbody_precios';
        document.getElementById(id).innerHTML =
            `<tr><td colspan="7" style="text-align:center;padding:40px;color:#ef4444">Error: ${e.message}</td></tr>`;
    }
}

function his_filtrar(val) { _his_buscar = val.toLowerCase(); his_renderActual(); }

function his_setTab(tab, btn) {
    _his_tabActual = tab;
    _his_buscar = '';
    document.getElementById('his_search').value = '';
    document.querySelectorAll('.his-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('his_tab_transacciones').style.display = tab === 'transacciones' ? '' : 'none';
    document.getElementById('his_tab_precios').style.display = tab === 'precios' ? '' : 'none';
    his_cargar();
}

function his_renderActual() {
    if (_his_tabActual === 'transacciones') his_renderTransacciones();
    else his_renderPrecios();
}

function his_renderTransacciones() {
    const tbody = document.getElementById('his_tbody_trans');
    if (!tbody) return;

    const lista = _his_transacciones.filter(t => {
        const txt = `${t.tipo_transaccion || ''} ${t.estado || ''}`.toLowerCase();
        return !_his_buscar || txt.includes(_his_buscar);
    });

    document.getElementById('his_count').textContent = `${lista.length} registro${lista.length !== 1 ? 's' : ''}`;

    if (!lista.length) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:#9ca3af">Sin registros</td></tr>`;
        return;
    }

    const fmt = n => n != null ? `$${Number(n).toLocaleString('es-CO')}` : '—';

    tbody.innerHTML = lista.map(t => `<tr>
        <td style="font-weight:700;color:#111827">#${t.id_historial}</td>
        <td><span class="badge-estado badge-${t.tipo_transaccion === 'compra' ? 'compra' : 'venta'}">${t.tipo_transaccion}</span></td>
        <td style="font-size:.84em;color:#6b7280">${t.fecha_transaccion ? new Date(t.fecha_transaccion).toLocaleString('es-CO') : '—'}</td>
        <td style="font-weight:700">${fmt(t.monto)}</td>
        <td><span class="badge-estado badge-${t.estado || 'pendiente'}">${t.estado || '—'}</span></td>
        <td style="font-size:.82em;color:#6b7280">${t.id_compra ? '#' + t.id_compra : '—'}</td>
        <td style="font-size:.82em;color:#6b7280">${t.id_venta ? '#' + t.id_venta : '—'}</td>
    </tr>`).join('');
}

function his_renderPrecios() {
    const tbody = document.getElementById('his_tbody_precios');
    if (!tbody) return;

    const lista = _his_precios.filter(p => {
        const txt = `${p.producto?.nombre || ''} ${p.motivo || ''}`.toLowerCase();
        return !_his_buscar || txt.includes(_his_buscar);
    });

    document.getElementById('his_count').textContent = `${lista.length} registro${lista.length !== 1 ? 's' : ''}`;

    if (!lista.length) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:40px;color:#9ca3af">Sin registros</td></tr>`;
        return;
    }

    const fmt = n => n != null ? `$${Number(n).toLocaleString('es-CO')}` : '—';

    tbody.innerHTML = lista.map(p => `<tr>
        <td style="font-weight:700;color:#111827">#${p.id_historial_precio}</td>
        <td>${p.producto?.nombre || '—'}</td>
        <td style="font-weight:700;color:#0aae0a">${fmt(p.precio)}</td>
        <td style="font-size:.84em;color:#6b7280">${p.fecha_cambio ? new Date(p.fecha_cambio).toLocaleString('es-CO') : '—'}</td>
        <td style="font-size:.84em;color:#6b7280">${p.motivo || '—'}</td>
    </tr>`).join('');
}

// ── Exportar Excel ──────────────────────────────────────
function his_exportarExcel() {
    const datos = _his_tabActual === 'transacciones' ? _his_transacciones : _his_precios;
    if (!datos.length) { alert('No hay datos para exportar'); return; }

    // Usamos TSV (tab-separated) con BOM UTF-8 → Excel abre cada columna separada correctamente
    const TAB = '\t';
    const NL = '\r\n';
    const esc = v => {
        const s = String(v ?? '');
        // Si contiene tab o salto de línea, encerramos en comillas
        return s.includes('\t') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const fmtFecha = d => d ? new Date(d).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }) : '';
    const fmtMonto = n => n != null ? Number(n).toLocaleString('es-CO', { minimumFractionDigits: 2 }) : '';

    let filas = [];

    if (_his_tabActual === 'transacciones') {
        filas.push(['ID', 'Tipo', 'Fecha', 'Monto ($)', 'Estado', 'ID Compra', 'ID Venta']);
        datos.forEach(t => filas.push([
            t.id_historial,
            t.tipo_transaccion || '',
            fmtFecha(t.fecha_transaccion),
            fmtMonto(t.monto),
            t.estado || '',
            t.id_compra || '',
            t.id_venta || ''
        ]));
    } else {
        filas.push(['ID', 'Producto', 'Precio ($)', 'Fecha Cambio', 'Motivo']);
        datos.forEach(p => filas.push([
            p.id_historial_precio,
            p.producto?.nombre || '',
            fmtMonto(p.precio),
            fmtFecha(p.fecha_cambio),
            p.motivo || ''
        ]));
    }

    const tsv = filas.map(r => r.map(esc).join(TAB)).join(NL);
    const blob = new Blob(['\uFEFF' + tsv], { type: 'text/tab-separated-values;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historial_${_his_tabActual}_${new Date().toISOString().slice(0, 10)}.xls`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
}

// ── Exportar PDF ────────────────────────────────────────
function his_exportarPDF() {
    const datos = _his_tabActual === 'transacciones' ? _his_transacciones : _his_precios;
    if (!datos.length) { alert('No hay datos para exportar'); return; }

    const fmt = n => n != null ? `$${Number(n).toLocaleString('es-CO')}` : '—';
    const titulo = _his_tabActual === 'transacciones' ? 'Historial de Transacciones' : 'Historial de Precios';
    const fecha = new Date().toLocaleDateString('es-CO', { dateStyle: 'long' });

    let filas = '';
    let cabecera = '';
    if (_his_tabActual === 'transacciones') {
        cabecera = '<tr><th>ID</th><th>Tipo</th><th>Fecha</th><th>Monto</th><th>Estado</th><th>Compra</th><th>Venta</th></tr>';
        filas = datos.map(t => `<tr>
            <td>#${t.id_historial}</td><td>${t.tipo_transaccion}</td>
            <td>${t.fecha_transaccion ? new Date(t.fecha_transaccion).toLocaleString('es-CO') : '—'}</td>
            <td>${fmt(t.monto)}</td><td>${t.estado || '—'}</td>
            <td>${t.id_compra ? '#' + t.id_compra : '—'}</td><td>${t.id_venta ? '#' + t.id_venta : '—'}</td>
        </tr>`).join('');
    } else {
        cabecera = '<tr><th>ID</th><th>Producto</th><th>Precio</th><th>Fecha</th><th>Motivo</th></tr>';
        filas = datos.map(p => `<tr>
            <td>#${p.id_historial_precio}</td><td>${p.producto?.nombre || '—'}</td>
            <td>${fmt(p.precio)}</td>
            <td>${p.fecha_cambio ? new Date(p.fecha_cambio).toLocaleString('es-CO') : '—'}</td>
            <td>${p.motivo || '—'}</td>
        </tr>`).join('');
    }

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${titulo}</title>
    <style>
        body{font-family:'Segoe UI',sans-serif;color:#111827;margin:40px}
        h1{font-size:1.4em;font-weight:900;color:#0aae0a;margin-bottom:4px}
        .sub{font-size:.85em;color:#6b7280;margin-bottom:24px}
        table{width:100%;border-collapse:collapse;font-size:.82em}
        th{background:#f0fdf4;color:#166534;padding:8px 10px;text-align:left;
           border-bottom:2px solid #dcfce7;font-weight:700}
        td{padding:7px 10px;border-bottom:1px solid #f3f4f6}
        tr:hover td{background:#fafafa}
        .footer{margin-top:24px;font-size:.72em;color:#9ca3af;text-align:right}
        @media print{body{margin:20px}.footer{position:fixed;bottom:0;right:20px}}
    </style></head><body>
    <h1><i class="fi fi-sc-seedling"></i> AgroTrace — ${titulo}</h1>
    <div class="sub">Generado el ${fecha} · ${datos.length} registros</div>
    <table><thead>${cabecera}</thead><tbody>${filas}</tbody></table>
    <div class="footer">AgroTrace · Sistema de Trazabilidad de Plátano</div>
    <script>window.addEventListener('load',()=>{setTimeout(()=>window.print(),400)})<\/script>
    </body></html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'width=900,height=700');
    setTimeout(() => URL.revokeObjectURL(url), 15000);
}

/* GALERÍA — métricas eliminadas por diseño (solo título + descripción) */


/* ══════════════════════════════════════════
   GALERÍA — Cargar métricas reales con animación
══════════════════════════════════════════ */
(function () {

    function countUp(id, target, suffix, dur) {
        const el = document.getElementById(id);
        if (!el) return;
        // Limpiar y poner estructura correcta
        el.innerHTML = '<span class="dbg-num-val">0</span>' + (suffix ? `<span class="dbg-num-suf">${suffix}</span>` : '');
        const valEl = el.querySelector('.dbg-num-val');
        const t0 = performance.now();
        (function run(now) {
            const p = Math.min((now - t0) / dur, 1);
            const v = Math.round(target * (1 - Math.pow(1 - p, 3)));
            valEl.textContent = v.toLocaleString('es-CO');
            if (p < 1) requestAnimationFrame(run);
        })(performance.now());
    }

    async function dbg_load() {
        const token = localStorage.getItem('token') || '';
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const [vR, cR, prR, plR] = await Promise.allSettled([
            fetch(`${window.API_URL}/ventas`, { headers }),
            fetch(`${window.API_URL}/compras`, { headers }),
            fetch(`${window.API_URL}/productos`, { headers }),
            fetch(`${window.API_URL}/productores?todos=true`, { headers }),
            fetch(`${window.API_URL}/comerciantes?todos=true`, { headers }) // opcional, si quieres contar comerciantes también
        ]);

        const vArr = vR.status === 'fulfilled' ? await vR.value.json() : [];
        const cArr = cR.status === 'fulfilled' ? await cR.value.json() : [];
        const prArr = prR.status === 'fulfilled' ? await prR.value.json() : [];
        const plRaw = plR.status === 'fulfilled' ? await plR.value.json() : [];
        const plArr = Array.isArray(plRaw) ? plRaw : (plRaw.data || []);

        const activos = plArr.filter(p => p.estado === 'ACTIVO').length;
        const pct = plArr.length ? Math.round(activos / plArr.length * 100) : 100;

        const vals = {
            ventas: [vArr.length, '', 1400],
            compras: [cArr.length, '', 1400],
            productos: [prArr.length, '', 1300],
            productores: [plArr.length, '', 1300],
            analisis: [pct, '%', 1600],
            reportes: [vArr.length + cArr.length, '', 1500],
        };

        // Animar los 2 ids de cada métrica (original + clon)
        Object.entries(vals).forEach(([metric, [val, suf, dur]]) => {
            countUp(`dbg_${metric}_1`, val, suf, dur);
            countUp(`dbg_${metric}_2`, val, suf, dur);
        });
    }

    const _orig = window.cargarDashboard;
    if (typeof _orig === 'function') {
        window.cargarDashboard = async function () {
            await _orig.apply(this, arguments);
            dbg_load();
        };
    } else {
        document.addEventListener('DOMContentLoaded', dbg_load);
    }
})();
/* =========================================
   CONTADOR EN VIVO DASHBOARD AGROTRACE
   Actualiza métricas automáticamente
========================================= */

async function actualizarMetricasDashboard() {

    try {

        const token = localStorage.getItem("token");

        const [comprasRes, ventasRes, productosRes, productoresRes] = await Promise.all([
            fetch(`${API_URL}/compras`, { headers: { Authorization: `Bearer ${token}` } }),
            fetch(`${API_URL}/ventas`, { headers: { Authorization: `Bearer ${token}` } }),
            fetch(`${API_URL}/productos`, { headers: { Authorization: `Bearer ${token}` } }),
            fetch(`${API_URL}/productores?todos=true`, { headers: { Authorization: `Bearer ${token}` } })
        ]);

        const compras = await comprasRes.json();
        const ventas = await ventasRes.json();
        const productos = await productosRes.json();
        const productores = await productoresRes.json();

        const cArr = Array.isArray(compras) ? compras : [];
        const vArr = Array.isArray(ventas) ? ventas : [];
        const pArr = Array.isArray(productos) ? productos : [];
        const plArr = Array.isArray(productores) ? productores : (productores.data || []);

        const metricas = {
            ventas: vArr.length,
            compras: cArr.length,
            productos: pArr.length,
            productores: plArr.length,
            reportes: vArr.length + cArr.length,
            analisis: 100
        };

        document.querySelectorAll(".dbg-num").forEach(el => {

            const tipo = el.dataset.metric;

            if (metricas[tipo] !== undefined) {

                const nuevoValor = metricas[tipo];
                animarNumero(el, nuevoValor);

            }

        });

    } catch (error) {
        console.error("Error actualizando métricas:", error);
    }

}


/* =========================================
   ANIMACIÓN DEL CONTADOR
========================================= */

function animarNumero(elemento, valorFinal) {

    const valorActual = parseInt(elemento.textContent) || 0;
    const incremento = Math.ceil((valorFinal - valorActual) / 20);

    let contador = valorActual;

    const intervalo = setInterval(() => {

        contador += incremento;

        if (
            (incremento > 0 && contador >= valorFinal) ||
            (incremento < 0 && contador <= valorFinal)
        ) {
            contador = valorFinal;
            clearInterval(intervalo);
        }

        elemento.textContent = contador;

    }, 30);

}


/* =========================================
   ACTUALIZACIÓN AUTOMÁTICA
========================================= */

actualizarMetricasDashboard();

/* refresca cada 5 segundos */
setInterval(actualizarMetricasDashboard, 5000);

// ════════════════════════════════════════════════════════
//  UTILIDAD GLOBAL — Exportar PDF (igual que historial)
// ════════════════════════════════════════════════════════
function _generarPDF(titulo, cabecera, filas, totalHTML) {
    const fecha = new Date().toLocaleDateString('es-CO', { dateStyle: 'long' });
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${titulo}</title>
    <style>
        body{font-family:'Segoe UI',sans-serif;color:#111827;margin:40px}
        h1{font-size:1.4em;font-weight:900;color:#0aae0a;margin-bottom:4px}
        .sub{font-size:.85em;color:#6b7280;margin-bottom:24px}
        table{width:100%;border-collapse:collapse;font-size:.82em}
        th{background:#f0fdf4;color:#166534;padding:8px 10px;text-align:left;border-bottom:2px solid #dcfce7;font-weight:700}
        td{padding:7px 10px;border-bottom:1px solid #f3f4f6}
        tr:hover td{background:#fafafa}
        .total{text-align:right;margin-top:16px;font-size:1em;font-weight:800;color:#111827}
        .footer{margin-top:24px;font-size:.72em;color:#9ca3af;text-align:right}
        @media print{body{margin:20px}.footer{position:fixed;bottom:0;right:20px}}
    </style></head><body>
    <h1>🌱 AgroTrace — ${titulo}</h1>
    <div class="sub">Generado el ${fecha} · ${filas.length} registros</div>
    <table><thead>${cabecera}</thead><tbody>${filas.map(r => `<tr>${r.map(c => `<td>${c ?? '—'}</td>`).join('')}</tr>`).join('')}</tbody></table>
    ${totalHTML ? `<div class="total">${totalHTML}</div>` : ''}
    <div class="footer">AgroTrace · Sistema de Trazabilidad</div>
    <script>window.addEventListener('load',()=>{setTimeout(()=>window.print(),400)})<\/script>
    </body></html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'width=900,height=700');
    setTimeout(() => URL.revokeObjectURL(url), 15000);
}

// ════════════════════════════════════════════════════════
//  UTILIDAD GLOBAL — Exportar Excel con SheetJS real
// ════════════════════════════════════════════════════════
function _generarExcel(nombreArchivo, nombreHoja, encabezados, filas) {
    // Cargar SheetJS dinámicamente si no está disponible
    function _doExport() {
        const XLSX = window.XLSX;
        const wsData = [encabezados, ...filas];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        // Ancho de columnas automático
        ws['!cols'] = encabezados.map((h, i) => ({
            wch: Math.max(h.length, ...filas.map(r => String(r[i] ?? '').length), 10)
        }));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, nombreHoja);
        XLSX.writeFile(wb, `${nombreArchivo}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    }
    if (window.XLSX) {
        _doExport();
    } else {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
        s.onload = _doExport;
        document.head.appendChild(s);
    }
}

// ════════════════════════════════════════════════════════
//  CORRECCIÓN: his_exportarExcel usa SheetJS real
// ════════════════════════════════════════════════════════
function his_exportarExcel() {
    const datos = _his_tabActual === 'transacciones' ? _his_transacciones : _his_precios;
    if (!datos.length) { alert('No hay datos para exportar'); return; }
    const fmtF = d => d ? new Date(d).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }) : '';
    const fmtM = n => n != null ? Number(n).toLocaleString('es-CO', { minimumFractionDigits: 2 }) : '';
    let encabezados, filas;
    if (_his_tabActual === 'transacciones') {
        encabezados = ['ID', 'Tipo', 'Fecha', 'Monto ($)', 'Estado', 'ID Compra', 'ID Venta'];
        filas = datos.map(t => [t.id_historial, t.tipo_transaccion || '', fmtF(t.fecha_transaccion), fmtM(t.monto), t.estado || '', t.id_compra || '', t.id_venta || '']);
    } else {
        encabezados = ['ID', 'Producto', 'Precio ($)', 'Fecha Cambio', 'Motivo'];
        filas = datos.map(p => [p.id_historial_precio, p.producto?.nombre || '', fmtM(p.precio), fmtF(p.fecha_cambio), p.motivo || '']);
    }
    _generarExcel(`historial_${_his_tabActual}`, 'Historial', encabezados, filas);
}

// ════════════════════════════════════════════════════════
//  MÓDULO REPORTES
// ════════════════════════════════════════════════════════
let _rep_tab = 'entregas';
let _rep_data = { entregas: [], compras: [], ventas: [], desfase: [] };

function rep_setTab(tab, btn) {
    _rep_tab = tab;
    document.querySelectorAll('#reportes .an-tab').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    ['entregas', 'compras', 'ventas', 'desfase'].forEach(t => {
        const p = document.getElementById(`rep_panel_${t}`);
        if (p) p.classList.toggle('active', t === tab);
    });
    // Cargar productores/productos en filtros si es primera vez
    if (tab === 'entregas') rep_cargarFiltros();
}

async function rep_cargarFiltros() {
    const token = localStorage.getItem('token') || '';
    const h = token ? { Authorization: `Bearer ${token}` } : {};
    try {
        const [prdRes, proRes] = await Promise.all([
            fetch(`${API_URL}/productores?todos=true`, { headers: h }),
            fetch(`${API_URL}/productos`, { headers: h })
        ]);
        const productores = await prdRes.json();
        const productos = await proRes.json();
        const prdArr = Array.isArray(productores) ? productores : (productores.data || []);
        const proArr = Array.isArray(productos) ? productos : (productos.data || []);

        const selPrd = document.getElementById('rep_ent_productor');
        prdArr.forEach(p => {
            const nombre = p.usuario ? `${p.usuario.nombre} ${p.usuario.apellido || ''}`.trim() : (p.nombre || `#${p.id_productor}`);
            selPrd.innerHTML += `<option value="${p.id_productor}">${nombre}</option>`;
        });
        const selPro = document.getElementById('rep_ent_producto');
        proArr.forEach(p => {
            selPro.innerHTML += `<option value="${p.id_producto}">${p.nombre}</option>`;
        });
    } catch (e) { console.warn('rep_cargarFiltros:', e.message); }
}

async function rep_cargarEntregas() {
    const token = localStorage.getItem('token') || '';
    const inicio = document.getElementById('rep_ent_inicio').value;
    const fin = document.getElementById('rep_ent_fin').value;
    const idPrd = document.getElementById('rep_ent_productor').value;
    const idPro = document.getElementById('rep_ent_producto').value;
    let qs = [];
    if (inicio) qs.push(`inicio=${inicio}`);
    if (fin) qs.push(`fin=${fin}`);
    if (idPrd) qs.push(`id_productor=${idPrd}`);

    const tbody = document.getElementById('rep_ent_tbody');
    const countEl = document.getElementById('rep_ent_count');
    tbody.innerHTML = `<tr><td colspan="6" class="empty-state">Cargando...</td></tr>`;
    showLoading();
    try {
        const res = await fetch(`${API_URL}/compras${qs.length ? '?' + qs.join('&') : ''}`, { headers: { Authorization: `Bearer ${token}` } });
        const json = await res.json();
        let compras = Array.isArray(json) ? json : (json.data || []);

        // Desplegar por detalle (cada línea = 1 producto de la compra)
        let rows = [];
        compras.forEach(c => {
            const productor = c.productor?.usuario
                ? `${c.productor.usuario.nombre} ${c.productor.usuario.apellido || ''}`.trim()
                : (c.productor?.nombre || '—');
            const fecha = c.fecha_compra ? new Date(c.fecha_compra).toLocaleDateString('es-CO') : '—';
            const detalles = c.detalles || [];
            if (!detalles.length) {
                rows.push({ productor, producto: '—', peso: '—', precio: '—', total: c.total || 0, fecha });
            } else {
                detalles.forEach(det => {
                    if (idPro && String(det.producto?.id_producto) !== String(idPro)) return;
                    rows.push({
                        productor,
                        producto: det.producto?.nombre || '—',
                        peso: det.cantidad,
                        precio: det.precio_unitario,
                        total: det.subtotal || (det.cantidad * det.precio_unitario),
                        fecha
                    });
                });
            }
        });

        _rep_data.entregas = rows;
        countEl.textContent = `${rows.length} registro${rows.length !== 1 ? 's' : ''}`;
        const fmt = n => n != null ? `$${Number(n).toLocaleString('es-CO')}` : '—';
        if (!rows.length) {
            tbody.innerHTML = `<tr><td colspan="6" class="empty-state">No hay datos para los filtros seleccionados</td></tr>`;
            document.getElementById('rep_ent_total').textContent = '';
        } else {
            tbody.innerHTML = rows.map(r => `<tr>
                <td>${r.productor}</td><td>${r.producto}</td>
                <td>${r.peso} kg</td><td>${fmt(r.precio)}</td>
                <td style="font-weight:700">${fmt(r.total)}</td><td>${r.fecha}</td>
            </tr>`).join('');
            const totalGen = rows.reduce((s, r) => s + parseFloat(r.total || 0), 0);
            document.getElementById('rep_ent_total').textContent = `Total general: ${fmt(totalGen)}`;
        }
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="6" class="empty-state" style="color:#ef4444">${e.message}</td></tr>`;
    } finally { hideLoading(); }
}

async function rep_cargarCompras() {
    const token = localStorage.getItem('token') || '';
    const inicio = document.getElementById('rep_cmp_inicio').value;
    const fin = document.getElementById('rep_cmp_fin').value;
    let qs = [];
    if (inicio) qs.push(`inicio=${inicio}`);
    if (fin) qs.push(`fin=${fin}`);

    const tbody = document.getElementById('rep_cmp_tbody');
    tbody.innerHTML = `<tr><td colspan="3" class="empty-state">Cargando...</td></tr>`;
    showLoading();
    try {
        const res = await fetch(`${API_URL}/compras${qs.length ? '?' + qs.join('&') : ''}`, { headers: { Authorization: `Bearer ${token}` } });
        const json = await res.json();
        const compras = Array.isArray(json) ? json : (json.data || []);

        // Agrupar por producto
        const mapa = {};
        compras.forEach(c => {
            (c.detalles || []).forEach(det => {
                const key = det.producto?.nombre || 'Sin nombre';
                if (!mapa[key]) mapa[key] = { producto: key, kg: 0, total: 0 };
                mapa[key].kg += parseFloat(det.cantidad || 0);
                mapa[key].total += parseFloat(det.subtotal || det.cantidad * det.precio_unitario || 0);
            });
        });
        const rows = Object.values(mapa);
        _rep_data.compras = rows;
        document.getElementById('rep_cmp_count').textContent = `${rows.length} producto${rows.length !== 1 ? 's' : ''}`;
        const fmt = n => `$${Number(n).toLocaleString('es-CO')}`;
        if (!rows.length) {
            tbody.innerHTML = `<tr><td colspan="3" class="empty-state">No hay datos para los filtros seleccionados</td></tr>`;
        } else {
            tbody.innerHTML = rows.map(r => `<tr>
                <td>${r.producto}</td>
                <td>${Number(r.kg).toLocaleString('es-CO')} kg</td>
                <td style="font-weight:700">${fmt(r.total)}</td>
            </tr>`).join('');
            const totalGen = rows.reduce((s, r) => s + r.total, 0);
            document.getElementById('rep_cmp_total').textContent = `Total general: ${fmt(totalGen)}`;
        }
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="3" class="empty-state" style="color:#ef4444">${e.message}</td></tr>`;
    } finally { hideLoading(); }
}

async function rep_cargarVentas() {
    const token = localStorage.getItem('token') || '';
    const inicio = document.getElementById('rep_vnt_inicio').value;
    const fin = document.getElementById('rep_vnt_fin').value;
    let qs = [];
    if (inicio) qs.push(`inicio=${inicio}`);
    if (fin) qs.push(`fin=${fin}`);

    const tbody = document.getElementById('rep_vnt_tbody');
    tbody.innerHTML = `<tr><td colspan="5" class="empty-state">Cargando...</td></tr>`;
    showLoading();
    try {
        const res = await fetch(`${API_URL}/ventas${qs.length ? '?' + qs.join('&') : ''}`, { headers: { Authorization: `Bearer ${token}` } });
        const json = await res.json();
        const ventas = Array.isArray(json) ? json : (json.data || []);

        let rows = [];
        ventas.forEach(v => {
            const comerciante = v.cliente || '—';
            const fecha = v.fecha_venta ? new Date(v.fecha_venta).toLocaleDateString('es-CO') : '—';
            (v.detalles || []).forEach(det => {
                rows.push({
                    comerciante,
                    producto: det.producto?.nombre || '—',
                    cantidad: det.cantidad,
                    total: det.subtotal || det.cantidad * det.precio_unitario,
                    fecha
                });
            });
            if (!(v.detalles || []).length) {
                rows.push({ comerciante, producto: '—', cantidad: '—', total: v.total || 0, fecha });
            }
        });
        _rep_data.ventas = rows;
        document.getElementById('rep_vnt_count').textContent = `${rows.length} registro${rows.length !== 1 ? 's' : ''}`;
        const fmt = n => n != null ? `$${Number(n).toLocaleString('es-CO')}` : '—';
        if (!rows.length) {
            tbody.innerHTML = `<tr><td colspan="5" class="empty-state">No hay datos para los filtros seleccionados</td></tr>`;
        } else {
            tbody.innerHTML = rows.map(r => `<tr>
                <td>${r.comerciante}</td><td>${r.producto}</td>
                <td>${r.cantidad}</td><td style="font-weight:700">${fmt(r.total)}</td><td>${r.fecha}</td>
            </tr>`).join('');
            const totalGen = rows.reduce((s, r) => s + parseFloat(r.total || 0), 0);
            document.getElementById('rep_vnt_total').textContent = `Total general: ${fmt(totalGen)}`;
        }
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="5" class="empty-state" style="color:#ef4444">${e.message}</td></tr>`;
    } finally { hideLoading(); }
}

async function rep_cargarDesfase() {
    const token = localStorage.getItem('token') || '';
    const inicio = document.getElementById('rep_des_inicio').value;
    const fin = document.getElementById('rep_des_fin').value;
    let qs = [];
    if (inicio) qs.push(`inicio=${inicio}`);
    if (fin) qs.push(`fin=${fin}`);
    const qStr = qs.length ? '?' + qs.join('&') : '';

    const tbody = document.getElementById('rep_des_tbody');
    tbody.innerHTML = `<tr><td colspan="4" class="empty-state">Cargando...</td></tr>`;
    showLoading();
    try {
        const [cRes, vRes] = await Promise.all([
            fetch(`${API_URL}/compras${qStr}`, { headers: { Authorization: `Bearer ${token}` } }),
            fetch(`${API_URL}/ventas${qStr}`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        const compras = await cRes.json();
        const ventas = await vRes.json();
        const cArr = Array.isArray(compras) ? compras : (compras.data || []);
        const vArr = Array.isArray(ventas) ? ventas : (ventas.data || []);

        const mapaC = {}, mapaV = {};
        cArr.forEach(c => (c.detalles || []).forEach(det => {
            const k = det.producto?.nombre || 'Sin nombre';
            mapaC[k] = (mapaC[k] || 0) + parseFloat(det.cantidad || 0);
        }));
        vArr.forEach(v => (v.detalles || []).forEach(det => {
            const k = det.producto?.nombre || 'Sin nombre';
            mapaV[k] = (mapaV[k] || 0) + parseFloat(det.cantidad || 0);
        }));

        const productos = [...new Set([...Object.keys(mapaC), ...Object.keys(mapaV)])];
        const rows = productos.map(p => ({
            producto: p,
            comprado: mapaC[p] || 0,
            vendido: mapaV[p] || 0,
            diferencia: (mapaC[p] || 0) - (mapaV[p] || 0)
        }));
        _rep_data.desfase = rows;
        document.getElementById('rep_des_count').textContent = `${rows.length} producto${rows.length !== 1 ? 's' : ''}`;
        const fmtN = n => `${Number(n).toLocaleString('es-CO')} kg`;
        if (!rows.length) {
            tbody.innerHTML = `<tr><td colspan="4" class="empty-state">No hay datos para los filtros seleccionados</td></tr>`;
        } else {
            tbody.innerHTML = rows.map(r => {
                const color = r.diferencia < 0 ? '#dc2626' : r.diferencia === 0 ? '#6b7280' : '#16a34a';
                return `<tr>
                    <td>${r.producto}</td>
                    <td>${fmtN(r.comprado)}</td>
                    <td>${fmtN(r.vendido)}</td>
                    <td style="font-weight:700;color:${color}">${r.diferencia >= 0 ? '+' : ''}${fmtN(r.diferencia)}</td>
                </tr>`;
            }).join('');
        }
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="4" class="empty-state" style="color:#ef4444">${e.message}</td></tr>`;
    } finally { hideLoading(); }
}

// ── Exportar reportes ──────────────────────────────────
function rep_exportarPDF(tab) {
    const data = _rep_data[tab];
    if (!data || !data.length) { alert('Primero genera el reporte'); return; }
    const cfgs = {
        entregas: {
            titulo: 'Reporte de Entregas por Productor',
            cab: '<tr><th>Productor</th><th>Producto</th><th>Peso (kg)</th><th>Precio/kg</th><th>Total</th><th>Fecha</th></tr>',
            fila: r => [r.productor, r.producto, r.peso + ' kg', r.precio != null ? '$' + Number(r.precio).toLocaleString('es-CO') : '—', r.total != null ? '$' + Number(r.total).toLocaleString('es-CO') : '—', r.fecha],
            total: () => { const t = data.reduce((s, r) => s + parseFloat(r.total || 0), 0); return `Total general: $${t.toLocaleString('es-CO')}`; }
        },
        compras: {
            titulo: 'Reporte de Compras',
            cab: '<tr><th>Producto</th><th>Total comprado (kg)</th><th>Total pagado</th></tr>',
            fila: r => [r.producto, Number(r.kg).toLocaleString('es-CO') + ' kg', '$' + Number(r.total).toLocaleString('es-CO')],
            total: () => { const t = data.reduce((s, r) => s + r.total, 0); return `Total general: $${t.toLocaleString('es-CO')}`; }
        },
        ventas: {
            titulo: 'Reporte de Ventas',
            cab: '<tr><th>Comerciante</th><th>Producto</th><th>Cantidad</th><th>Total vendido</th><th>Fecha</th></tr>',
            fila: r => [r.comerciante, r.producto, r.cantidad, r.total != null ? '$' + Number(r.total).toLocaleString('es-CO') : '—', r.fecha],
            total: () => { const t = data.reduce((s, r) => s + parseFloat(r.total || 0), 0); return `Total general: $${t.toLocaleString('es-CO')}`; }
        },
        desfase: {
            titulo: 'Comparación Compras vs Ventas',
            cab: '<tr><th>Producto</th><th>Total comprado (kg)</th><th>Total vendido (kg)</th><th>Diferencia</th></tr>',
            fila: r => [r.producto, Number(r.comprado).toLocaleString('es-CO') + ' kg', Number(r.vendido).toLocaleString('es-CO') + ' kg', (r.diferencia >= 0 ? '+' : '') + Number(r.diferencia).toLocaleString('es-CO') + ' kg'],
            total: null
        }
    };
    const cfg = cfgs[tab];
    _generarPDF(cfg.titulo, cfg.cab, data.map(cfg.fila), cfg.total ? cfg.total() : '');
}

function rep_exportarExcel(tab) {
    const data = _rep_data[tab];
    if (!data || !data.length) { alert('Primero genera el reporte'); return; }
    const cfgs = {
        entregas: {
            nombre: 'reporte_entregas', hoja: 'Entregas',
            cols: ['Productor', 'Producto', 'Peso (kg)', 'Precio/kg', 'Total', 'Fecha'],
            fila: r => [r.productor, r.producto, r.peso, r.precio, r.total, r.fecha]
        },
        compras: {
            nombre: 'reporte_compras', hoja: 'Compras',
            cols: ['Producto', 'Total comprado (kg)', 'Total pagado'],
            fila: r => [r.producto, r.kg, r.total]
        },
        ventas: {
            nombre: 'reporte_ventas', hoja: 'Ventas',
            cols: ['Comerciante', 'Producto', 'Cantidad', 'Total vendido', 'Fecha'],
            fila: r => [r.comerciante, r.producto, r.cantidad, r.total, r.fecha]
        },
        desfase: {
            nombre: 'reporte_desfase', hoja: 'Compras vs Ventas',
            cols: ['Producto', 'Total comprado (kg)', 'Total vendido (kg)', 'Diferencia'],
            fila: r => [r.producto, r.comprado, r.vendido, r.diferencia]
        }
    };
    const cfg = cfgs[tab];
    _generarExcel(cfg.nombre, cfg.hoja, cfg.cols, data.map(cfg.fila));
}

// Cargar filtros automáticamente al entrar a reportes
const _origMostrarSeccion = window.mostrarSeccion || mostrarSeccion;

// ════════════════════════════════════════════════════════
//  PDF EN DETALLE DE COMPRA / VENTA
// ════════════════════════════════════════════════════════
let _det_tipo_actual = '';
let _det_data_actual = null;

// Parche a det_abrir para guardar los datos globalmente
const _orig_det_abrir = det_abrir;
window.det_abrir = async function (tipo, id) {
    _det_tipo_actual = tipo;
    _det_data_actual = null;
    await _orig_det_abrir(tipo, id);
    // Recuperar datos desde el DOM después de que cargó
};

function det_descargarPDF() {
    const titulo = document.getElementById('det_titulo').textContent;
    const subtitulo = document.getElementById('det_subtitulo').textContent;
    const total = document.getElementById('det_total').textContent;
    // Leer info
    const infoItems = document.querySelectorAll('#det_info .det-info-item');
    let infoHTML = '<table style="width:100%;margin-bottom:20px;font-size:.85em"><tbody>';
    infoItems.forEach(item => {
        const label = item.querySelector('.det-info-label')?.textContent || '';
        const value = item.querySelector('.det-info-value')?.textContent || '';
        infoHTML += `<tr><td style="font-weight:700;padding:4px 8px;color:#374151;width:40%">${label}</td><td style="padding:4px 8px">${value}</td></tr>`;
    });
    infoHTML += '</tbody></table>';
    // Leer tabla de productos
    const thEls = document.querySelectorAll('#det_modal table thead th');
    const ths = Array.from(thEls).map(th => th.textContent.trim()).filter(Boolean);
    const rows = Array.from(document.querySelectorAll('#det_tbody tr')).map(tr =>
        Array.from(tr.querySelectorAll('td')).map(td => td.textContent.trim())
    );
    const cabecera = `<tr>${ths.map(h => `<th>${h}</th>`).join('')}</tr>`;
    const fecha = new Date().toLocaleDateString('es-CO', { dateStyle: 'long' });
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${titulo}</title>
    <style>
        body{font-family:'Segoe UI',sans-serif;color:#111827;margin:40px}
        h1{font-size:1.4em;font-weight:900;color:#0aae0a;margin-bottom:2px}
        .sub{font-size:.85em;color:#6b7280;margin-bottom:16px}
        table{width:100%;border-collapse:collapse;font-size:.82em}
        th{background:#f0fdf4;color:#166534;padding:8px 10px;text-align:left;border-bottom:2px solid #dcfce7;font-weight:700}
        td{padding:7px 10px;border-bottom:1px solid #f3f4f6}
        .total-row{text-align:right;margin-top:14px;font-size:1.05em;font-weight:800}
        .footer{margin-top:24px;font-size:.72em;color:#9ca3af;text-align:right}
        @media print{body{margin:20px}.footer{position:fixed;bottom:0;right:20px}}
    </style></head><body>
    <h1>🌱 AgroTrace — ${titulo}</h1>
    <div class="sub">${subtitulo} · Generado el ${fecha}</div>
    ${infoHTML}
    <table><thead>${cabecera}</thead><tbody>
    ${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}
    </tbody></table>
    <div class="total-row">Total: <span style="color:#0aae0a">${total}</span></div>
    <div class="footer">AgroTrace · Sistema de Trazabilidad</div>
    <script>window.addEventListener('load',()=>{setTimeout(()=>window.print(),400)})<\/script>
    </body></html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'width=900,height=700');
    setTimeout(() => URL.revokeObjectURL(url), 15000);
}

// ════════════════════════════════════════════════════════
//  RANKING — Filtro por fechas + Exportar PDF y Excel
// ════════════════════════════════════════════════════════
let _ranking_data = [];

// Reemplazar analisis_loadRanking para incluir fechas
const _orig_loadRanking = analisis_loadRanking;
window.analisis_loadRanking = async function () {
    const tipo = document.getElementById('ar_tipo').value;
    const inicio = document.getElementById('ar_inicio')?.value || '';
    const fin = document.getElementById('ar_fin')?.value || '';
    const labels = { total: 'Total producido', promedio: 'Promedio por entrega', frecuencia: 'Frecuencia de entregas' };
    document.getElementById('ar_tipo_label').textContent = labels[tipo];
    showLoading();
    try {
        let qs = [`tipo=${tipo}`];
        if (inicio) qs.push(`inicio=${inicio}`);
        if (fin) qs.push(`fin=${fin}`);
        const res = await fetch(`${API_URL}/estadisticas/ranking?${qs.join('&')}`);
        const data = await res.json();
        _ranking_data = Array.isArray(data) ? data : [];

        const tbody = document.getElementById('ar_tbody');
        if (!_ranking_data.length) {
            tbody.innerHTML = '<tr><td colspan="4" class="empty-state">No hay datos para el período seleccionado</td></tr>';
            destroyAnalisisChart('ranking');
        } else {
            tbody.innerHTML = _ranking_data.map(r => {
                const medalla = r.posicion === 1 ? '🥇' : r.posicion === 2 ? '🥈' : r.posicion === 3 ? '🥉' : '';
                const nombre = (r.nombre && r.nombre.trim()) ? r.nombre.trim() : `Productor ${r.id_productor}`;
                return `<tr>
                    <td style="font-weight:800;color:#111827">${r.posicion}</td>
                    <td style="font-weight:600">${nombre}</td>
                    <td style="font-weight:700">${formatNumber(parseFloat(r.valor).toFixed(2))}</td>
                    <td style="font-size:1.2em">${medalla}</td>
                </tr>`;
            }).join('');
            destroyAnalisisChart('ranking');
            const colors = _ranking_data.map((_, i) => `hsla(${130 - (i * 12)},65%,45%,0.8)`);
            const ctx = document.getElementById('ar_chart').getContext('2d');
            analisisCharts.ranking = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: _ranking_data.map(d => (d.nombre && d.nombre.trim()) ? d.nombre.trim() : `Productor ${d.id_productor}`),
                    datasets: [{ data: _ranking_data.map(d => d.valor), backgroundColor: colors, borderRadius: 6 }]
                },
                options: { indexAxis: 'y', responsive: true, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true } } }
            });
        }
    } catch (e) {
        document.getElementById('ar_tbody').innerHTML = `<tr><td colspan="4" class="empty-state" style="color:red">Error: ${e.message}</td></tr>`;
    } finally { hideLoading(); }
};

function ranking_exportarPDF() {
    if (!_ranking_data.length) { alert('Primero genera el ranking'); return; }
    const tipo = document.getElementById('ar_tipo').value;
    const inicio = document.getElementById('ar_inicio')?.value || '';
    const fin = document.getElementById('ar_fin')?.value || '';
    const labels = { total: 'Total producido', promedio: 'Promedio por entrega', frecuencia: 'Frecuencia de entregas' };
    const titulo = `Ranking de Productores — ${labels[tipo]}`;
    const periodo = (inicio || fin) ? ` · Período: ${inicio || 'inicio'} → ${fin || 'hoy'}` : '';
    const cab = '<tr><th>#</th><th>Productor</th><th>Valor</th><th></th></tr>';
    const filas = _ranking_data.map(r => {
        const medalla = r.posicion === 1 ? '🥇' : r.posicion === 2 ? '🥈' : r.posicion === 3 ? '🥉' : '';
        const nombre = (r.nombre && r.nombre.trim()) ? r.nombre.trim() : `Productor ${r.id_productor}`;
        return [r.posicion, nombre, formatNumber(parseFloat(r.valor).toFixed(2)), medalla];
    });
    _generarPDF(titulo + periodo, cab, filas, '');
}

function ranking_exportarExcel() {
    if (!_ranking_data.length) { alert('Primero genera el ranking'); return; }
    const tipo = document.getElementById('ar_tipo').value;
    const labels = { total: 'Total producido', promedio: 'Promedio por entrega', frecuencia: 'Frecuencia de entregas' };
    const cols = ['Posición', 'Productor', labels[tipo]];
    const filas = _ranking_data.map(r => [
        r.posicion,
        (r.nombre && r.nombre.trim()) ? r.nombre.trim() : `Productor ${r.id_productor}`,
        parseFloat(r.valor)
    ]);
    _generarExcel(`ranking_${tipo}`, 'Ranking', cols, filas);
}

// ════════════════════════════════════════════════════════
//  ACTIVIDADES RECIENTES EN DASHBOARD
// ════════════════════════════════════════════════════════
async function db_cargarActividades() {
    const token = localStorage.getItem('token') || '';
    const h = token ? { Authorization: `Bearer ${token}` } : {};
    const tbody = document.getElementById('db_actividades_tbody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="4" class="empty-state">Cargando...</td></tr>';
    try {
        const [cRes, vRes, prdRes, prRes] = await Promise.allSettled([
            fetch(`${API_URL}/compras`, { headers: h }),
            fetch(`${API_URL}/ventas`, { headers: h }),
            fetch(`${API_URL}/productores?todos=true`, { headers: h }),
            fetch(`${API_URL}/productos`, { headers: h }),
        ]);
        const compras = cRes.status === 'fulfilled' ? await cRes.value.json() : [];
        const ventas = vRes.status === 'fulfilled' ? await vRes.value.json() : [];
        const productores = prdRes.status === 'fulfilled' ? await prdRes.value.json() : [];
        const productos = prRes.status === 'fulfilled' ? await prRes.value.json() : [];

        const cArr = (Array.isArray(compras) ? compras : compras.data || []).slice(0, 10);
        const vArr = (Array.isArray(ventas) ? ventas : ventas.data || []).slice(0, 10);
        const prdArr = (Array.isArray(productores) ? productores : productores.data || []).slice(0, 5);
        const proArr = (Array.isArray(productos) ? productos : productos.data || []).slice(0, 5);

        let actividades = [];

        cArr.forEach(c => {
            const productor = c.productor?.usuario
                ? `${c.productor.usuario.nombre} ${c.productor.usuario.apellido || ''}`.trim()
                : (c.productor?.nombre || '—');
            actividades.push({
                fecha: c.fecha_compra || c.createdAt,
                tipo: 'Compra',
                color: '#16a34a',
                usuario: productor,
                desc: `Compra #${c.numero_factura || c.id_compra} · $${Number(c.total || 0).toLocaleString('es-CO')}`
            });
        });
        vArr.forEach(v => actividades.push({
            fecha: v.fecha_venta || v.createdAt,
            tipo: 'Venta',
            color: '#2563eb',
            usuario: v.cliente || '—',
            desc: `Venta #${v.numero_factura || v.id_venta} · $${Number(v.total || 0).toLocaleString('es-CO')}`
        }));
        prdArr.forEach(p => {
            const nombre = p.usuario ? `${p.usuario.nombre} ${p.usuario.apellido || ''}`.trim() : (p.nombre || '—');
            actividades.push({
                fecha: p.createdAt,
                tipo: 'Productor',
                color: '#9333ea',
                usuario: 'Admin',
                desc: `Productor registrado: ${nombre}`
            });
        });
        proArr.forEach(p => actividades.push({
            fecha: p.createdAt,
            tipo: 'Producto',
            color: '#d97706',
            usuario: 'Admin',
            desc: `Producto: ${p.nombre} · $${Number(p.precio_dia || p.precio_base || 0).toLocaleString('es-CO')}/kg`
        }));

        // Ordenar por fecha desc, tomar 20
        actividades = actividades
            .filter(a => a.fecha)
            .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
            .slice(0, 20);

        if (!actividades.length) {
            tbody.innerHTML = '<tr><td colspan="4" class="empty-state">No hay actividades recientes</td></tr>';
            return;
        }
        tbody.innerHTML = actividades.map(a => {
            const fechaStr = new Date(a.fecha).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
            return `<tr>
                <td style="white-space:nowrap;font-size:.82em;color:#6b7280">${fechaStr}</td>
                <td><span style="background:${a.color}18;color:${a.color};padding:2px 8px;border-radius:20px;font-size:.78em;font-weight:700">${a.tipo}</span></td>
                <td style="font-size:.85em">${a.usuario}</td>
                <td style="font-size:.85em;color:#374151">${a.desc}</td>
            </tr>`;
        }).join('');
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="4" class="empty-state" style="color:#ef4444">${e.message}</td></tr>`;
    }
}

// Cargar actividades cuando se muestra el dashboard
(function () {
    const _origMS = mostrarSeccion;
    window.mostrarSeccion = function (sectionId) {
        _origMS(sectionId);
        if (sectionId === 'dashboard') db_cargarActividades();
        if (sectionId === 'reportes') rep_cargarFiltros();
    };
    // También carga al inicio
    window.addEventListener('DOMContentLoaded', () => {
        setTimeout(db_cargarActividades, 1500);
    });
})();
// =============================
// COMERCIANTES
// =============================

let _com_todos = [];
let _com_filtrados = [];
let _com_editando = null;


// CARGAR COMERCIANTES
async function com_cargar() {

    const token = localStorage.getItem("token");

    try {

        const res = await fetch(`${API_URL}/comerciantes`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!res.ok) throw new Error("Error cargando comerciantes");

        _com_todos = await res.json();
        _com_filtrados = [..._com_todos];

        document.getElementById("com_count").innerText =
            `${_com_filtrados.length} registros`;

        com_render();


    } catch (e) {

        alert(e.message);

    }

}



// RENDER TABLA
function com_render() {

    const tbody = document.getElementById("com_tbody");

    if (!_com_filtrados.length) {

        tbody.innerHTML =
            `<tr>
            <td colspan="6" class="empty-state">
            No hay comerciantes
            </td>
        </tr>`;

        return;
    }

    tbody.innerHTML = _com_filtrados.map(c => `

        <tr>

        <td>${c.id_comerciante}</td>

        <td>${c.nombre}</td>

        <td>${c.telefono}</td>

        <td>${c.direccion || '-'}</td>

        <td>
            ${c.activo
            ? '<span class="badge-success">Activo</span>'
            : '<span class="badge-danger">Inactivo</span>'}
        </td>

        <td>

            <button class="usr-btn-action"
            onclick="com_editar(${c.id_comerciante})"
            title="Editar">

            <i class="fi fi-rr-edit"></i>
            </button>

            <button class="usr-btn-action usr-btn-del"
            onclick="com_desactivar(${c.id_comerciante})"
            title="Desactivar">

            <i class="fi fi-rr-trash"></i>
            </button>

        </td>

        </tr>

    `).join('');

}



// BUSCAR
function com_filtrar(texto) {

    texto = texto.toLowerCase();

    _com_filtrados = _com_todos.filter(c =>

        c.nombre.toLowerCase().includes(texto) ||
        c.telefono.includes(texto)

    );

    document.getElementById("com_count").innerText =
        `${_com_filtrados.length} registros`;

    com_render();

}



// ABRIR FORMULARIO
function com_abrirPanel() {

    _com_editando = null;

    document.getElementById("com_nombre").value = "";
    document.getElementById("com_telefono").value = "";
    document.getElementById("com_direccion").value = "";

    document.getElementById("com_panel").classList.add("open");

}



// EDITAR
function com_editar(id) {

    const c = _com_todos.find(x => x.id_comerciante === id);

    if (!c) return;

    _com_editando = id;

    document.getElementById("com_nombre").value = c.nombre;
    document.getElementById("com_telefono").value = c.telefono;
    document.getElementById("com_direccion").value = c.direccion || "";

    document.getElementById("com_panel").classList.add("open");

}



// GUARDAR
async function com_guardar() {

    const nombre = document.getElementById("com_nombre").value.trim();
    const telefono = document.getElementById("com_telefono").value.trim();
    const direccion = document.getElementById("com_direccion").value.trim();

    if (!nombre || !telefono) {

        alert("Nombre y teléfono son obligatorios");
        return;

    }

    const token = localStorage.getItem("token");

    const data = {
        nombre,
        telefono,
        direccion
    };

    try {

        let res;

        if (_com_editando) {

            res = await fetch(`${API_URL}/comerciantes/${_com_editando}`, {

                method: "PUT",

                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },

                body: JSON.stringify(data)

            });

        } else {

            res = await fetch(`${API_URL}/comerciantes`, {

                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },

                body: JSON.stringify(data)

            });

        }

        if (!res.ok) {

            const err = await res.json();
            throw new Error(err.message || "Error guardando");

        }

        document.getElementById("com_panel").classList.remove("open");

        com_cargar();

    } catch (e) {

        alert(e.message);

    }

}



// DESACTIVAR
async function com_desactivar(id) {

    if (!confirm("¿Desactivar comerciante?")) return;

    const token = localStorage.getItem("token");

    try {

        const res = await fetch(`${API_URL}/comerciantes/${id}`, {

            method: "PATCH",

            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },

            body: JSON.stringify({ activo: false })

        });

        if (!res.ok) {

            const err = await res.json();
            throw new Error(err.message);

        }

        com_cargar();

    } catch (e) {

        alert(e.message);

    }

}



function com_abrirPanel() {

    document
        .getElementById("com_panel")
        .classList.add("open");

    document
        .getElementById("com_overlay")
        .classList.add("show");

}

function com_cerrarPanel() {

    document
        .getElementById("com_panel")
        .classList.remove("open");

    document
        .getElementById("com_overlay")
        .classList.remove("show");

}