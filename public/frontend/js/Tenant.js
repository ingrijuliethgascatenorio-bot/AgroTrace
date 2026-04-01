// public/frontend/js/tenant.js
// ─────────────────────────────────────────────────────────────────────────────
// Utilidades multi-tenant para el frontend de AgroTrace
// El subdominio se detecta automáticamente desde window.location.hostname
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Detecta el subdominio actual.
 * 'asoc1.agrotrace.com' → 'asoc1'
 * 'localhost'           → 'dev' (modo desarrollo)
 */
function obtenerSubdominio() {
  const partes = window.location.hostname.split('.');
  if (partes.length >= 3) return partes[0];
  return 'dev'; // localhost / desarrollo
}

/**
 * Obtiene el token JWT guardado en sessionStorage.
 */
function obtenerToken() {
  return sessionStorage.getItem('agrotrace_token');
}

/**
 * Guarda el token y los datos del usuario tras login exitoso.
 */
function guardarSesion(token, usuario) {
  sessionStorage.setItem('agrotrace_token', token);
  sessionStorage.setItem('agrotrace_usuario', JSON.stringify(usuario));
}

/**
 * Cierra la sesión y redirige al login.
 */
function cerrarSesion() {
  sessionStorage.removeItem('agrotrace_token');
  sessionStorage.removeItem('agrotrace_usuario');
  window.location.href = '/frontend/index.html';
}

/**
 * Función base para todas las llamadas a la API.
 * Incluye automáticamente:
 *   - Authorization: Bearer <token>
 *   - Content-Type: application/json
 *
 * El middleware del backend ya extrae el tenant del Host header,
 * así que no necesitamos enviarlo manualmente.
 */
async function apiCall(method, endpoint, body = null) {
  const token = obtenerToken();

  const opciones = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
  };

  if (body && method !== 'GET') {
    opciones.body = JSON.stringify(body);
  }

  const response = await fetch(`/api/${endpoint}`, opciones);

  if (response.status === 401) {
    // Token expirado o inválido → redirigir al login
    cerrarSesion();
    return;
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
    throw new Error(error.message || `Error ${response.status}`);
  }

  return response.json();
}

// ─── Atajos ──────────────────────────────────────────────────────────────────
const api = {
  get:    (endpoint)        => apiCall('GET',    endpoint),
  post:   (endpoint, body)  => apiCall('POST',   endpoint, body),
  put:    (endpoint, body)  => apiCall('PUT',    endpoint, body),
  patch:  (endpoint, body)  => apiCall('PATCH',  endpoint, body),
  delete: (endpoint)        => apiCall('DELETE', endpoint),
};

// ─── Login ───────────────────────────────────────────────────────────────────
async function login(email, password) {
  try {
    const data = await api.post('auth/login', { email, password });
    guardarSesion(data.token, data.usuario);
    return data;
  } catch (err) {
    throw err;
  }
}

// ─── Mostrar info de la asociación actual ────────────────────────────────────
function mostrarInfoTenant() {
  const subdominio = obtenerSubdominio();
  const usuario = JSON.parse(sessionStorage.getItem('agrotrace_usuario') || '{}');

  const el = document.getElementById('tenant-info');
  if (el) {
    el.textContent = usuario.asociacion_id
      ? `Asociación ID: ${usuario.asociacion_id}`
      : subdominio;
  }
}

// Ejecutar al cargar la página
document.addEventListener('DOMContentLoaded', mostrarInfoTenant);