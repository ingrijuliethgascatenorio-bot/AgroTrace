/* ═══════════════════════════════════════════════════════
   AgroTrace — Módulo MIS INGRESOS (productor)
   Endpoints usados:
     GET /api/productor-dashboard/historial?inicio=&fin=
   ═══════════════════════════════════════════════════════ */

const ING = (() => {

  const API = '/api/productor-dashboard';

  let _periodo  = 'mes';   // semana | mes | anio | todo
  let _entregas = [];      // cache del período actual
  let _chartKg     = null;
  let _chartDinero = null;

  // ── Helpers de fecha ──────────────────────────────────
  function _hoy() {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date());
  }

  function _rango(periodo) {
    const hoy   = new Date(_hoy());
    const pad   = n => String(n).padStart(2, '0');
    const fmt   = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
    const fin   = fmt(hoy);

    if (periodo === 'semana') {
      const ini = new Date(hoy);
      ini.setDate(hoy.getDate() - 6);
      return { inicio: fmt(ini), fin };
    }
    if (periodo === 'mes') {
      const ini = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      return { inicio: fmt(ini), fin };
    }
    if (periodo === 'anio') {
      return { inicio: `${hoy.getFullYear()}-01-01`, fin };
    }
    return { inicio: null, fin: null }; // todo
  }

  // ── Formato moneda ────────────────────────────────────
  function _cop(n) {
    if (n == null) return '—';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP', maximumFractionDigits: 0
    }).format(n);
  }

  function _kg(n) {
    if (n == null) return '—';
    return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 }).format(n) + ' kg';
  }

  // ── Fetch historial ───────────────────────────────────
  async function _fetchHistorial(inicio, fin) {
    const token = localStorage.getItem('token') || '';
    let url = `${API}/historial`;
    const params = [];
    if (inicio) params.push(`inicio=${inicio}`);
    if (fin)    params.push(`fin=${fin}`);
    if (params.length) url += '?' + params.join('&');

    // FIX OFFLINE: usar 'default' (no 'no-store') para que el SW sirva del caché
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'default'
    });
    if (!res.ok) throw new Error('Error al cargar historial');
    return res.json();
  }

  // ── Calcular KPIs del período ─────────────────────────
  function _calcKPIs(entregas) {
    let dinero    = 0;
    let kg        = 0;
    let pendKg    = 0;
    let count     = entregas.length;

    for (const e of entregas) {
      kg += Number(e.peso ?? 0);
      if (e.estado_liquidacion === 'LIQUIDADO' || e.estado_liquidacion === 'PAGADO') {
        dinero += Number(e.total ?? 0);
      }
      if (e.estado_liquidacion === 'PENDIENTE_LIQUIDACION') {
        pendKg += Number(e.peso ?? 0);
      }
    }
    return { dinero, kg, count, pendKg };
  }

  // ── Agrupar por mes para gráficas ─────────────────────
  function _agruparPorMes(entregas) {
    const meses = {};
    const nombresCortos = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

    for (const e of entregas) {
      // Tomar solo YYYY-MM-DD para evitar problemas de zona horaria y formatos mixtos
      const s   = String(e.fecha).slice(0, 10);
      const [y, mo, dy] = s.split('-').map(Number);
      if (!y || !mo) continue;
      const key = `${y}-${String(mo).padStart(2,'0')}`;
      if (!meses[key]) meses[key] = { label: nombresCortos[mo - 1], kg: 0, dinero: 0 };
      meses[key].kg     += Number(e.peso ?? 0);
      if (e.estado_liquidacion === 'LIQUIDADO' || e.estado_liquidacion === 'PAGADO') {
        meses[key].dinero += Number(e.total ?? 0);
      }
    }

    const keys = Object.keys(meses).sort();
    return {
      labels: keys.map(k => meses[k].label),
      kg:     keys.map(k => meses[k].kg),
      dinero: keys.map(k => meses[k].dinero),
    };
  }

  // ── Renderizar KPIs ───────────────────────────────────
  function _renderKPIs(kpis, periodo) {
    const labels = {
      semana: 'esta semana', mes: 'este mes', anio: 'este año', todo: 'en total'
    };
    const sub = labels[periodo] || '';

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

    set('ing_dinero',       _cop(kpis.dinero));
    set('ing_dinero_sub',   `Dinero recibido ${sub}`);
    set('ing_kg',           _kg(kpis.kg));
    set('ing_kg_sub',       `Kilos entregados ${sub}`);
    set('ing_entregas',     kpis.count);
    set('ing_entregas_sub', `entregas ${sub}`);
    set('ing_pend_kg',      _kg(kpis.pendKg));
  }

  // ── Renderizar tabla detalle ──────────────────────────
  function _renderTabla(entregas) {
    const tbody = document.getElementById('ing_tbody');
    const count = document.getElementById('ing_count');
    if (!tbody) return;

    if (count) count.textContent = `${entregas.length} registro${entregas.length !== 1 ? 's' : ''}`;

    if (!entregas.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-cell">Sin entregas en este período</td></tr>';
      return;
    }

    const fmtFecha = f => {
      if (!f) return '—';
      // Usar parseFechaLocal si existe (maneja ISO UTC y YYYY-MM-DD)
      if (typeof parseFechaLocal === 'function') {
        const t = parseFechaLocal(f);
        if (t) return new Date(t).toLocaleDateString('es-CO', {
          day: '2-digit', month: 'short', year: 'numeric', timeZone: 'America/Bogota'
        });
      }
      // Fallback: tomar los primeros 10 chars (YYYY-MM-DD) y construir local
      const s = String(f).slice(0, 10);
      const [y, m, d] = s.split('-').map(Number);
      if (!y || !m || !d) return '—';
      return new Date(y, m - 1, d).toLocaleDateString('es-CO', {
        day: '2-digit', month: 'short', year: 'numeric'
      });
    };

    const badge = e => {
      if (e.estado_liquidacion === 'PAGADO')    return '<span class="ing-badge ing-badge--pago">Pagado</span>';
      if (e.estado_liquidacion === 'LIQUIDADO') return '<span class="ing-badge ing-badge--liq">Liquidado</span>';
      return '<span class="ing-badge ing-badge--pend">Pendiente</span>';
    };

    tbody.innerHTML = entregas.map(e => `
      <tr>
        <td data-label="Fecha" style="white-space:nowrap;font-size:.83rem;color:#6b7280">${fmtFecha(e.fecha)}</td>
        <td data-label="Producto" style="font-weight:500">${e.producto ?? '—'}</td>
        <td data-label="Kilos" style="text-align:right;font-weight:600">${_kg(e.peso)}</td>
        <td data-label="Precio/kg" style="text-align:right;font-size:.85rem;color:#6b7280">${e.precio_unitario != null ? _cop(e.precio_unitario) + '/kg' : '—'}</td>
        <td data-label="Total" style="text-align:right;font-weight:700;color:#16a34a">${e.total != null ? _cop(e.total) : '—'}</td>
        <td data-label="Estado">${badge(e)}</td>
      </tr>`).join('');
  }

  // ── Dibujar gráficas ──────────────────────────────────
  function _renderCharts(datos) {
    // Gráfica KG
    const ctxKg = document.getElementById('ing_chart_kg');
    if (ctxKg) {
      if (_chartKg) _chartKg.destroy();
      _chartKg = new Chart(ctxKg, {
        type: 'bar',
        data: {
          labels: datos.labels,
          datasets: [{
            label: 'kg entregados',
            data: datos.kg,
            backgroundColor: 'rgba(22, 163, 74, 0.75)',
            borderColor: '#16a34a',
            borderWidth: 1.5,
            borderRadius: 6,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { callback: v => v + ' kg', font: { size: 11 } },
              grid: { color: '#f3f4f6' }
            },
            x: { ticks: { font: { size: 12 } }, grid: { display: false } }
          }
        }
      });
    }

    // Gráfica DINERO
    const ctxD = document.getElementById('ing_chart_dinero');
    if (ctxD) {
      if (_chartDinero) _chartDinero.destroy();
      _chartDinero = new Chart(ctxD, {
        type: 'bar',
        data: {
          labels: datos.labels,
          datasets: [{
            label: 'dinero recibido',
            data: datos.dinero,
            backgroundColor: 'rgba(234, 179, 8, 0.75)',
            borderColor: '#ca8a04',
            borderWidth: 1.5,
            borderRadius: 6,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: v => new Intl.NumberFormat('es-CO', {
                  style: 'currency', currency: 'COP', maximumFractionDigits: 0
                }).format(v),
                font: { size: 10 }
              },
              grid: { color: '#f3f4f6' }
            },
            x: { ticks: { font: { size: 12 } }, grid: { display: false } }
          }
        }
      });
    }
  }

  // ── Cargar todo el módulo ─────────────────────────────
  async function cargar(periodo) {
    _periodo = periodo || _periodo;

    // Actualizar tabs
    document.querySelectorAll('.ing-tab').forEach(b => {
      b.classList.toggle('active', b.dataset.periodo === _periodo);
    });

    // Label de chart
    const chartLabels = {
      semana: 'Últimos 7 días', mes: 'Este mes', anio: 'Este año', todo: 'Todo el historial'
    };
    const cl = document.getElementById('ing_chart_label');
    if (cl) cl.textContent = chartLabels[_periodo] || '';

    // Scroll al inicio de la sección para mostrar los filtros y KPIs
    const secEl = document.getElementById('mis-ingresos');
    if (secEl) secEl.scrollTop = 0;
    // También scroll del contenedor principal si existe
    const mainContainer = document.querySelector('.main-container, main, .content-area');
    if (mainContainer) mainContainer.scrollTop = 0;

    // Skeleton
    const tbody = document.getElementById('ing_tbody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="empty-cell">Cargando...</td></tr>';

    // KPIs skeleton
    ['ing_dinero','ing_kg','ing_entregas','ing_pend_kg'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = '—';
    });

    try {
      const { inicio, fin } = _rango(_periodo);
      _entregas = await _fetchHistorial(inicio, fin);
      // FIX OFFLINE: guardar siempre el historial más reciente
      try { localStorage.setItem('cache_ing_entregas', JSON.stringify(_entregas)); } catch(_) {}

      const kpis  = _calcKPIs(_entregas);
      const datos = _agruparPorMes(_entregas);

      _renderKPIs(kpis, _periodo);
      _renderTabla(_entregas);
      _renderCharts(datos);
      // Quitar aviso offline si estaba visible
      document.getElementById('ing_offline_aviso')?.remove();

    } catch (e) {
      console.error('[ING]', e);

      // FIX OFFLINE: mostrar datos cacheados si no hay red
      const cached = localStorage.getItem('cache_ing_entregas');
      if (cached) {
        try {
          const entregasCache = JSON.parse(cached);
          // Filtrar por período si es posible
          const { inicio, fin } = _rango(_periodo);
          const filtradas = inicio
            ? entregasCache.filter(e => {
                const f = String(e.fecha || '').slice(0, 10);
                return (!inicio || f >= inicio) && (!fin || f <= fin);
              })
            : entregasCache;

          _entregas = filtradas;
          const kpis  = _calcKPIs(_entregas);
          const datos = _agruparPorMes(_entregas);
          _renderKPIs(kpis, _periodo);
          _renderTabla(_entregas);
          _renderCharts(datos);

          // Aviso de datos offline
          const avisoId = 'ing_offline_aviso';
          if (!document.getElementById(avisoId)) {
            const aviso = document.createElement('div');
            aviso.id = avisoId;
            aviso.style.cssText = 'background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:8px 12px;font-size:.8rem;color:#92400e;font-weight:600;margin-bottom:8px';
            aviso.textContent = '📵 Sin conexión — mostrando datos guardados. Se actualizarán al recuperar señal.';
            const seccion = document.getElementById('mis-ingresos');
            if (seccion) seccion.insertBefore(aviso, seccion.firstChild);
            window.addEventListener('online', () => { aviso.remove(); ING.cargar(_periodo); }, { once: true });
          }
          return;
        } catch(_) {}
      }

      if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="empty-cell" style="color:#dc2626">Sin conexión y sin datos guardados.</td></tr>';
    }
  }


  // ── Precarga silenciosa en segundo plano ────────────────────
  // Se ejecuta al cargar la página sin tocar la UI.
  // Cuando el productor navega a la sección los datos ya están listos.
  let _precargado = false;

  async function cargarSilencioso() {
    if (_precargado) return;

    // FIX OFFLINE: si no hay red, cargar desde localStorage
    if (!navigator.onLine) {
      const cached = localStorage.getItem('cache_ing_entregas');
      if (cached) {
        try {
          _entregas = JSON.parse(cached);
          _precargado = true;
          console.warn('[ING] Ingresos desde caché offline:', _entregas.length, 'entregas');
        } catch(_) {}
      }
      return;
    }

    try {
      const { inicio, fin } = _rango('mes');
      _entregas = await _fetchHistorial(inicio, fin);
      // FIX OFFLINE: persistir para uso sin conexión
      try { localStorage.setItem('cache_ing_entregas', JSON.stringify(_entregas)); } catch(_) {}
      _precargado = true;
    } catch (e) {
      // Silencioso — intentar desde caché si falló la red
      const cached = localStorage.getItem('cache_ing_entregas');
      if (cached) {
        try { _entregas = JSON.parse(cached); _precargado = true; } catch(_) {}
      }
    }
  }

  // ── Bind tabs ─────────────────────────────────────────
  function init() {
    document.querySelectorAll('.ing-tab').forEach(btn => {
      btn.addEventListener('click', () => cargar(btn.dataset.periodo));
    });
  }

  return { cargar, init, cargarSilencioso };
})();

window.ING = ING;