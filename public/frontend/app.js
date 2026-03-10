
const toggle = document.querySelector(".menu-toggle");
const header = document.querySelector(".header");

toggle.addEventListener("click", () => {
    header.classList.toggle("collapsed");
});

// app.js - Lógica del frontend para el módulo de análisis
const API_URL = 'http://localhost:3000/api';

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
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        // Actualizar botones activos
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Mostrar sección correspondiente
        const section = btn.dataset.section;
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        document.getElementById(section).classList.add('active');
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
async function cargarDashboard() {
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

// Cargar dashboard al inicio
window.addEventListener('load', () => {
    cargarDashboard();
});
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
    document.querySelectorAll('.analisis-tab').forEach(b => b.classList.remove('active'));
    document.getElementById('panel-' + name).classList.add('active');
    btn.classList.add('active');
}

// ── PROYECCIÓN ──
async function analisis_loadProyeccion() {
    const id = document.getElementById('ap_productor').value;
    const cards = document.getElementById('ap_cards');
    cards.innerHTML = '<div class="metric-card"><div class="metric-content"><p class="metric-label">Cargando...</p></div></div>';
    try {
        const [pRes, tRes] = await Promise.all([
            fetch(`${API_URL}/estadisticas/proyeccion?id_productor=${id}`),
            fetch(`${API_URL}/estadisticas/tendencia?id_productor=${id}`)
        ]);
        const p = await pRes.json();
        const t = await tRes.json();
        const pVal = parseFloat(p.proyeccion || 0);

        const tBadgeClass = t.tendencia === 'Creciente' ? 'badge-success' : t.tendencia === 'Decreciente' ? 'badge-danger' : 'badge-warning';
        const pBadgeClass = p.advertencia ? 'badge-warning' : 'badge-success';

        cards.innerHTML = `
        <div class="metric-card">
            <div class="metric-icon">📦</div>
            <div class="metric-content">
                <p class="metric-label">Próxima Entrega</p>
                <h3 class="metric-value">${pVal} ${p.unidad || 'kg'}</h3>
                <span class="metric-badge ${pBadgeClass}">${p.advertencia || `${p.registros_analizados} registros`}</span>
            </div>
        </div>
        <div class="metric-card">
            <div class="metric-icon">📈</div>
            <div class="metric-content">
                <p class="metric-label">Tendencia</p>
                <h3 class="metric-value">${t.tendencia}</h3>
                <span class="metric-badge ${tBadgeClass}">${t.diferencia_porcentual}%</span>
            </div>
        </div>
        <div class="metric-card">
            <div class="metric-icon">💰</div>
            <div class="metric-content">
                <p class="metric-label">Valor Proyectado</p>
                <h3 class="metric-value">${formatCurrency(pVal * 2000)}</h3>
                <span class="metric-badge badge-info">a $2000/kg</span>
            </div>
        </div>
        <div class="metric-card">
            <div class="metric-icon">🎯</div>
            <div class="metric-content">
                <p class="metric-label">Diferencia Tendencia</p>
                <h3 class="metric-value">${t.diferencia_porcentual}%</h3>
                <span class="metric-badge badge-info">vs. período anterior</span>
            </div>
        </div>`;
    } catch(e) {
        cards.innerHTML = `<div class="metric-card"><div class="metric-content"><p class="metric-label" style="color:red">Error: ${e.message}</p></div></div>`;
    }
}

// ── HISTORIAL ──
async function analisis_loadHistorial() {
    const id  = document.getElementById('ah_productor').value;
    const ini = document.getElementById('ah_inicio').value;
    const fin = document.getElementById('ah_fin').value;
    showLoading();
    try {
        const res  = await fetch(`${API_URL}/estadisticas/historial?id_productor=${id}&inicio=${ini}&fin=${fin}`);
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
                datasets: [{ label: 'Cantidad (kg)', data: data.map(d => parseFloat(d.cantidad)),
                    borderColor: 'rgb(10,174,10)', backgroundColor: 'rgba(10,174,10,0.1)',
                    borderWidth: 3, fill: true, tension: 0.4, pointRadius: 5,
                    pointBackgroundColor: 'rgb(10,174,10)', pointBorderColor:'#fff', pointBorderWidth:2 }]
            },
            options: { responsive:true, scales:{ y:{ beginAtZero:true } } }
        });
    } catch(e) {
        document.getElementById('ah_tbody').innerHTML = `<tr><td colspan="5" class="empty-state" style="color:red">Error: ${e.message}</td></tr>`;
    } finally { hideLoading(); }
}

// ── TENDENCIA ──
async function analisis_loadTendencia() {
    const id = document.getElementById('at_productor').value;
    showLoading();
    try {
        const res = await fetch(`${API_URL}/estadisticas/tendencia?id_productor=${id}`);
        const d   = await res.json();
        const tClass = d.tendencia === 'Creciente' ? 'badge-success' : d.tendencia === 'Decreciente' ? 'badge-danger' : 'badge-warning';

        document.getElementById('at_cards').innerHTML = `
        <div class="metric-card">
            <div class="metric-icon">📊</div>
            <div class="metric-content">
                <p class="metric-label">Tendencia</p>
                <h3 class="metric-value">${d.tendencia}</h3>
                <span class="metric-badge ${tClass}">${d.diferencia_porcentual}%</span>
            </div>
        </div>
        <div class="metric-card">
            <div class="metric-icon">🗓️</div>
            <div class="metric-content">
                <p class="metric-label">Promedio últimos 3 meses</p>
                <h3 class="metric-value">${parseFloat(d.promedio_actual).toFixed(1)} kg</h3>
            </div>
        </div>
        <div class="metric-card">
            <div class="metric-icon">📅</div>
            <div class="metric-content">
                <p class="metric-label">Promedio 3 meses anteriores</p>
                <h3 class="metric-value">${parseFloat(d.promedio_anterior).toFixed(1)} kg</h3>
            </div>
        </div>`;

        destroyAnalisisChart('tendencia');
        const ctx = document.getElementById('at_chart').getContext('2d');
        analisisCharts.tendencia = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['3 meses anteriores', 'Últimos 3 meses'],
                datasets: [{ data: [parseFloat(d.promedio_anterior), parseFloat(d.promedio_actual)],
                    backgroundColor: ['rgba(156,163,175,0.7)', d.tendencia==='Creciente'?'rgba(10,174,10,0.8)':d.tendencia==='Decreciente'?'rgba(239,68,68,0.8)':'rgba(245,158,11,0.8)'],
                    borderRadius: 8, borderWidth:2 }]
            },
            options: { responsive:true, plugins:{ legend:{display:false} }, scales:{ y:{ beginAtZero:true } } }
        });
    } catch(e) {
        document.getElementById('at_cards').innerHTML = `<div class="metric-card"><div class="metric-content"><p style="color:red">Error: ${e.message}</p></div></div>`;
    } finally { hideLoading(); }
}

// ── RANKING ──
async function analisis_loadRanking() {
    const tipo = document.getElementById('ar_tipo').value;
    const labels = { total:'Total producido', promedio:'Promedio por entrega', frecuencia:'Frecuencia de entregas' };
    document.getElementById('ar_tipo_label').textContent = labels[tipo];
    showLoading();
    try {
        const res  = await fetch(`${API_URL}/estadisticas/ranking?tipo=${tipo}`);
        const data = await res.json();

        const tbody = document.getElementById('ar_tbody');
        tbody.innerHTML = data.map(r => {
            const medalla = r.posicion===1?'🥇':r.posicion===2?'🥈':r.posicion===3?'🥉':'';
            return `<tr>
                <td><strong>${r.posicion}</strong></td>
                <td>Productor ${r.id_productor}</td>
                <td><strong>${formatNumber(r.valor.toFixed(2))}</strong></td>
                <td>${medalla}</td>
              </tr>`;
        }).join('') || '<tr><td colspan="4" class="empty-state">Sin datos</td></tr>';

        destroyAnalisisChart('ranking');
        const colors = data.map((_,i) => `hsla(${130-(i*12)},65%,45%,0.8)`);
        const ctx = document.getElementById('ar_chart').getContext('2d');
        analisisCharts.ranking = new Chart(ctx, {
            type:'bar',
            data:{ labels:data.map(d=>`Productor ${d.id_productor}`),
                   datasets:[{ data:data.map(d=>d.valor), backgroundColor:colors, borderRadius:6 }] },
            options:{ indexAxis:'y', responsive:true, plugins:{legend:{display:false}}, scales:{x:{beginAtZero:true}} }
        });
    } catch(e) {
        document.getElementById('ar_tbody').innerHTML = `<tr><td colspan="4" class="empty-state" style="color:red">Error: ${e.message}</td></tr>`;
    } finally { hideLoading(); }
}

// ── PLANIFICACIÓN ──
async function analisis_loadPlanificacion() {
    const precio    = parseFloat(document.getElementById('apl_precio').value);
    const capacidad = parseFloat(document.getElementById('apl_capacidad').value);
    if (!precio || precio <= 0)    { alert('Ingrese un precio válido'); return; }
    if (!capacidad || capacidad<=0){ alert('Ingrese una capacidad válida'); return; }
    showLoading();
    try {
        const res = await fetch(`${API_URL}/estadisticas/planificacion?precio=${precio}&capacidad=${capacidad}`);
        const d   = await res.json();

        document.getElementById('apl_alert').innerHTML = `
            <div class="alert-box ${d.supera_capacidad?'alert-danger':'alert-success'}">
                <span class="alert-icon">${d.supera_capacidad?'⚠️':'✅'}</span>
                <span>${d.alerta}</span>
            </div>`;

        document.getElementById('apl_cards').innerHTML = `
            <div class="result-card info">
                <div class="result-label">Total Proyectado</div>
                <div class="result-value">${formatNumber(d.total_proyectado)} kg</div>
            </div>
            <div class="result-card info">
                <div class="result-label">Valor Estimado</div>
                <div class="result-value">${formatCurrency(d.total_estimado)}</div>
            </div>
            <div class="result-card ${d.supera_capacidad?'danger':'success'}">
                <div class="result-label">Capacidad</div>
                <div class="result-value">${formatNumber(d.capacidad)} kg</div>
                <div class="result-subtitle">${d.supera_capacidad?'Superada':'Suficiente'}</div>
            </div>`;

        destroyAnalisisChart('planificacion');
        const utilizado = Math.min(d.total_proyectado, d.capacidad);
        const disponible = Math.max(0, d.capacidad - d.total_proyectado);
        const exceso = Math.max(0, d.total_proyectado - d.capacidad);
        const ctx = document.getElementById('apl_chart').getContext('2d');
        analisisCharts.planificacion = new Chart(ctx, {
            type:'doughnut',
            data:{ labels:['Utilizado','Disponible','Exceso'],
                   datasets:[{ data:[utilizado,disponible,exceso],
                     backgroundColor:['rgba(59,130,246,0.8)','rgba(10,174,10,0.8)','rgba(239,68,68,0.8)'],
                     borderWidth:2 }] },
            options:{ responsive:true, plugins:{ legend:{position:'bottom'} } }
        });
    } catch(e) {
        document.getElementById('apl_alert').innerHTML = `<div class="alert-box alert-danger"><span>❌ Error: ${e.message}</span></div>`;
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
// ==========================================
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
