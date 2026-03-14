
// app.js - Lógica del frontend para el módulo de análisis
const API_URL = 'http://localhost:3000/api'; // URL base de la API
const STATIC_URL = 'http://localhost:3000';
// Estado global
let charts = {
    tendencia: null,
    historial: null,
    proyeccion: null,
    tendenciaDetalle: null,
    ranking: null,
    capacidad: null
};

// Navegación
document.addEventListener("DOMContentLoaded", () => {
    const toggle = document.querySelector(".menu-toggle");
    const header = document.querySelector(".header");

    toggle.addEventListener("click", () => {
        header.classList.toggle("collapsed");
    });

    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const sectionId = btn.dataset.section;
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
            const section = document.getElementById(sectionId);
            if (section) section.classList.add('active');
        });
    });
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
/*async function cargarDashboard() {
    const productor = document.getElementById('dashboard_productor').value;
    showLoading();

    try {
        // Cargar proyección
        const proyeccionRes = await fetch(`${API_URL}/estadisticas/proyeccion?id_productor=${productor}`);
        const proyeccion = await proyeccionRes.json();

        // Cargar tendencia
        const tendenciaRes = await fetch(`${API_URL}/estadisticas/tendencia?id_productor=${productor}`);
        const tendencia = await tendenciaRes.json();

        // Actualizar métricas
        const proyeccionValor = parseFloat(proyeccion.proyeccion || 0);
        document.getElementById('metric_proyeccion').textContent = `${proyeccionValor} ${proyeccion.unidad || 'kg'}`;
        document.getElementById('metric_registros').textContent = proyeccion.registros_analizados || 0;
        document.getElementById('metric_valor').textContent = formatCurrency(proyeccionValor * 2000);

        // Badge de proyección
        const badgeProyeccion = document.getElementById('badge_proyeccion');
        if (proyeccion.advertencia) {
            badgeProyeccion.textContent = proyeccion.advertencia;
            badgeProyeccion.className = 'metric-badge badge-warning';
        } else {
            badgeProyeccion.textContent = 'Datos suficientes';
            badgeProyeccion.className = 'metric-badge badge-success';
        }

        // Métrica de tendencia
        document.getElementById('metric_tendencia').textContent = tendencia.tendencia;
        const badgeTendencia = document.getElementById('badge_tendencia');
        badgeTendencia.textContent = `${tendencia.diferencia_porcentual}%`;

        if (tendencia.tendencia === 'Creciente') {
            badgeTendencia.className = 'metric-badge badge-success';
        } else if (tendencia.tendencia === 'Decreciente') {
            badgeTendencia.className = 'metric-badge badge-danger';
        } else {
            badgeTendencia.className = 'metric-badge badge-warning';
        }

        // Gráfico de tendencia
        crearGraficoTendenciaDashboard(tendencia);

    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar el dashboard');
    } finally {
        hideLoading();
    }
}*/

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
            <p><strong>📊 Proyección:</strong> ${proyeccion.proyeccion} ${proyeccion.unidad}</p>
            ${proyeccion.advertencia ? `<p class="badge badge-warning">${proyeccion.advertencia}</p>` :
                `<p><strong>✅ Registros analizados:</strong> ${proyeccion.registros_analizados}</p>`}
        `;

        document.getElementById('tendencia_info').innerHTML = `
            <p><strong>📈 Tendencia:</strong> ${tendencia.tendencia}</p>
            <p><strong>📊 Diferencia:</strong> ${tendencia.diferencia_porcentual}%</p>
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

/* Cargar dashboard al inicio 
window.addEventListener('load', () => {
    cargarDashboard();
});*/
// ==========================================
// MÓDULO ANÁLISIS — Sub-tabs
// ==========================================

// Instancias de gráficos propias del módulo análisis
let analisisCharts = { historial: null, tendencia: null, ranking: null, planificacion: null };

function destroyAnalisisChart(name) {
    if (analisisCharts[name]) { analisisCharts[name].destroy(); analisisCharts[name] = null; }
}

// Cambiar sub-pestaña
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
    try {
        const [pRes, tRes] = await Promise.all([
            fetch(`${API_URL}/estadisticas/proyeccion?id_productor=${id}`),
            fetch(`${API_URL}/estadisticas/tendencia?id_productor=${id}`)
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
        const res = await fetch(`${API_URL}/estadisticas/historial?id_productor=${id}&inicio=${ini}&fin=${fin}`);
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
        const res = await fetch(`${API_URL}/estadisticas/tendencia?id_productor=${id}`);
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
            return `<tr>
                <td style="font-weight:800;color:#111827">${r.posicion}</td>
                <td>Productor ${r.id_productor}</td>
                <td style="font-weight:700">${formatNumber(r.valor.toFixed(2))}</td>
                <td style="font-size:1.2em">${medalla}</td>
              </tr>`;
        }).join('') || '<tr><td colspan="4" class="empty-state">Sin datos</td></tr>';

        destroyAnalisisChart('ranking');
        const colors = data.map((_, i) => `hsla(${130 - (i * 12)},65%,45%,0.8)`);
        const ctx = document.getElementById('ar_chart').getContext('2d');
        analisisCharts.ranking = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(d => `Productor ${d.id_productor}`),
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

// Cargar proyección cuando se abre la sección análisis
document.querySelectorAll('.nav-btn').forEach(btn => {
    if (btn.dataset.section === 'analisis') {
        btn.addEventListener('click', () => analisis_loadProyeccion());
    }
});

// ==========================================
// SLIDER DE MÉTRICAS — Dashboard
/*
let sliderIndex = 0;
const SLIDER_TOTAL = 4;
let sliderTimer = null;

function sliderGoTo(index) {
    sliderIndex = (index + SLIDER_TOTAL) % SLIDER_TOTAL;
    document.getElementById('sliderTrack').style.transform = `translateX(-${sliderIndex * 100}%)`;
    document.querySelectorAll('.sdot').forEach((d, i) => d.classList.toggle('active', i === sliderIndex));
}

function sliderMove(dir) {
    sliderGoTo(sliderIndex + dir);
    resetSliderTimer();
}

function resetSliderTimer() {
    clearInterval(sliderTimer);
    sliderTimer = setInterval(() => sliderGoTo(sliderIndex + 1), 4000);
}

// Iniciar auto-play cuando carga
window.addEventListener('load', () => {
    resetSliderTimer();

    // Swipe táctil
    const track = document.getElementById('sliderTrack');
    let startX = 0;
    track.addEventListener('touchstart', e => { startX = e.touches[0].clientX; });
    track.addEventListener('touchend', e => {
        const diff = startX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 40) sliderMove(diff > 0 ? 1 : -1);
    });
});
*/
// ════════════════════════════════════════════════════════
//  PERFIL DE USUARIO
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
    if (!_hp_usuario) { msg.className = 'hp-msg error'; msg.textContent = '⚠️ No hay sesión activa.'; return; }

    const email = document.getElementById('hp_f_email').value.trim();
    const telefono = document.getElementById('hp_f_telefono').value.trim();
    const tipo = _hp_usuario.tipo_usuario === 'ADMIN'
        ? document.getElementById('hp_f_tipo').value
        : _hp_usuario.tipo_usuario;

    if (!email) { msg.className = 'hp-msg error'; msg.textContent = '⚠️ El correo es obligatorio.'; return; }

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
        msg.textContent = '✅ Cambios guardados correctamente.';
    } catch (e) {
        msg.className = 'hp-msg error';
        msg.textContent = `⚠️ ${e.message}`;
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
        msg.className = 'hp-msg error'; msg.textContent = '⚠️ Completa todos los campos.'; return;
    }
    if (nueva !== confirmar) {
        msg.className = 'hp-msg error'; msg.textContent = '⚠️ Las contraseñas no coinciden.'; return;
    }
    if (nueva.length < 6) {
        msg.className = 'hp-msg error'; msg.textContent = '⚠️ Mínimo 6 caracteres.'; return;
    }

    // TODO: cuando el backend tenga endpoint:
    // await fetch(`${API_URL}/auth/cambiar-password`, { method:'PATCH', ... })
    msg.className = 'hp-msg ok';
    msg.textContent = '✅ Contraseña actualizada. (Conecta POST /auth/cambiar-password)';
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
    window.location.href = '/login';   // ajusta a tu ruta de login
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
                <button class="usr-btn-del" title="Desactivar usuario"
                        onclick="usr_desactivar(${u.id_usuario}, '${u.nombre} ${u.apellido}')">
                    <i class="fi fi-rr-trash"></i>
                </button>
            </td>
        </tr>`;
    }).join('');
}

// ── Abrir / cerrar panel ───────────────────────────────
function usr_abrirPanel() {
    // Limpiar campos
    ['usr_f_nombre', 'usr_f_apellido', 'usr_f_email',
        'usr_f_cedula', 'usr_f_telefono', 'usr_f_password'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
    document.getElementById('usr_f_rol').value = 'PRODUCTOR';
    document.getElementById('usr_msg').textContent = '';
    document.getElementById('usr_msg').className = 'hp-msg';

    document.getElementById('usr_panel').classList.add('abierto');
    document.getElementById('usr_overlay').classList.add('show');
}
function usr_cerrarPanel() {
    document.getElementById('usr_panel').classList.remove('abierto');
    document.getElementById('usr_overlay').classList.remove('show');
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

    if (!nombre || !apellido || !email || !password) {
        msg.className = 'hp-msg error';
        msg.textContent = '⚠️ Nombre, apellido, correo y contraseña son obligatorios.';
        return;
    }
    if (password.length < 6) {
        msg.className = 'hp-msg error';
        msg.textContent = '⚠️ La contraseña debe tener mínimo 6 caracteres.';
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
        msg.textContent = '✅ Usuario creado correctamente.';
        setTimeout(() => {
            usr_cerrarPanel();
            usr_cargar();
        }, 1200);
    } catch (e) {
        msg.className = 'hp-msg error';
        msg.textContent = `⚠️ ${e.message}`;
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

// ── Cargar al navegar a usuarios ──────────────────────
document.querySelectorAll('.nav-btn').forEach(btn => {
    if (btn.dataset.section === 'usuarios') {
        btn.addEventListener('click', usr_cargar);
    }
}); let productoresGlobal = []; // Guardamos los datos completos de la API

// ==========================================
//  FUNCION PARA CARGAR PRODUCTORES
// ==========================================
async function prd_cargarLista() {
    showLoading();

    try {
        // Llamada a tu API con el token
        const token = localStorage.getItem('token'); // o donde tengas guardado el JWT
        const res = await fetch(`${API_URL}/productores?todos=true`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('No se pudieron cargar los productores');

        const data = await res.json();

        if (!data.ok || !data.data) throw new Error('No hay datos de productores');

        const productores = data.data;

        console.log('Productores recibidos:', productores);

        // tbody
        const tbody = document.getElementById('tabla_productores_body');
        if (!tbody) throw new Error('No existe el tbody de Productores');

        if (productores.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="empty-state">No hay productores registrados</td></tr>`;
        } else {
            tbody.innerHTML = productores.map(p => `
                <tr>
                    <td>${p.id_productor}</td>
                    <td>${p.nombre || ''}</td>
                    <td>${p.cedula || ''}</td>
                    <td>${p.telefono || ''}</td>
                    <td>${p.finca || ''}</td>
                    <td>
                        <span class="badge ${p.estado === 'ACTIVO' ? 'badge-success' : 'badge-danger'}">
                            ${p.estado}
                        </span>
                    </td>
                </tr>
            `).join('');
        }

        // Actualizar info de paginación
        document.getElementById('prd_showing').textContent = productores.length;
        document.getElementById('prd_total').textContent = productores.length;

        console.log('Productores cargados correctamente');

    } catch (error) {
        console.error('Error al cargar productores:', error);
        alert('Error al cargar los productores: ' + error.message);
    } finally {
        hideLoading();
    }
}

// Llamar a la función cuando se muestre la sección
document.querySelector('[data-section="productores"]')?.addEventListener('click', prd_cargarLista);
// ==========================================
// FILTRO DE PRODUCTORES
// ==========================================
function prd_filtrar() {
    const input = document.getElementById('prd_buscar').value.toLowerCase().trim();

    const filtrados = productoresGlobal.filter(p => {
        return (
            (p.nombre || p.usuario?.nombre || '').toLowerCase().includes(input) ||
            p.cedula.toLowerCase().includes(input) ||
            p.finca.toLowerCase().includes(input) ||
            p.ubicacion.toLowerCase().includes(input)
        );
    });

    actualizarTabla(filtrados);
    actualizarStats(filtrados);
}

// ==========================================
//document.getElementById('prd_buscar').addEventListener('input', prd_filtrar);
