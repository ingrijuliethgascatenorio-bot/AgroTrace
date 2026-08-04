/* AgroTrace — login.js */

const _BASE_URL = window.location.origin;
const API = `${_BASE_URL}/api`;

// ── Si ya hay sesión activa al cargar el login → redirigir a la vista correcta ──
(function redirigirSiYaAutenticado() {
    const usuario = AuthGuard.obtenerUsuario();
    if (!usuario) return;

    const rutas = {
        ADMIN:     '/frontend/index.html',
        OPERARIO:  '/frontend/vistaOperario/vendedor.html',
        PRODUCTOR: '/frontend/vista_productor/productor.html',
    };
    const destino = rutas[usuario.tipo_usuario];
    if (destino) {
        window.location.replace(destino);
    } else {
        AuthGuard.cerrarSesion(false);
    }
})();

const form = document.getElementById('loginForm');

// ── Control de intentos en el cliente ────────────────────────────────────────
// Se sincroniza con la respuesta del servidor; el servidor es la fuente de verdad.
const MAX_INTENTOS_LOCAL  = 5;
const BLOQUEO_MS_LOCAL    = 15 * 60 * 1000; // 15 minutos
const STORAGE_KEY_INTENTOS = 'login_intentos';
const STORAGE_KEY_BLOQUEO  = 'login_bloqueado_hasta';

function _obtenerIntentosLocales() {
    return parseInt(localStorage.getItem(STORAGE_KEY_INTENTOS) || '0', 10);
}

function _obtenerBloqueadoHasta() {
    const val = localStorage.getItem(STORAGE_KEY_BLOQUEO);
    return val ? parseInt(val, 10) : null;
}

function _incrementarIntentosLocales() {
    const nuevos = _obtenerIntentosLocales() + 1;
    localStorage.setItem(STORAGE_KEY_INTENTOS, String(nuevos));
    if (nuevos >= MAX_INTENTOS_LOCAL) {
        localStorage.setItem(STORAGE_KEY_BLOQUEO, String(Date.now() + BLOQUEO_MS_LOCAL));
    }
    return nuevos;
}

function _limpiarIntentosLocales() {
    localStorage.removeItem(STORAGE_KEY_INTENTOS);
    localStorage.removeItem(STORAGE_KEY_BLOQUEO);
}

/** Devuelve los segundos restantes de bloqueo local, o 0 si no está bloqueado. */
function _segundosBloqueoLocal() {
    const bloqueadoHasta = _obtenerBloqueadoHasta();
    if (!bloqueadoHasta) return 0;
    const restantes = bloqueadoHasta - Date.now();
    return restantes > 0 ? Math.ceil(restantes / 1000) : 0;
}

/** Formatea segundos como "X min Y s" o "X min". */
function _formatearTiempo(segundos) {
    const min = Math.floor(segundos / 60);
    const seg = segundos % 60;
    if (min > 0 && seg > 0) return `${min} min ${seg} s`;
    if (min > 0)            return `${min} min`;
    return `${seg} s`;
}

// ── Temporizador de bloqueo en pantalla ──────────────────────────────────────
let _intervaloContador = null;

function _horaDesbloqueo() {
    const bloqueadoHasta = _obtenerBloqueadoHasta();
    if (!bloqueadoHasta) return null;
    return new Date(bloqueadoHasta).toLocaleTimeString('es-CO', {
        hour: '2-digit', minute: '2-digit', hour12: true,
    });
}

function _iniciarContadorBloqueo(segundosIniciales) {
    const btnLogin = form.querySelector('.btn-login');

    btnLogin.disabled    = true;
    btnLogin.textContent = 'Cuenta bloqueada';

    function _tick() {
        const restantes = _segundosBloqueoLocal();
        if (restantes <= 0) {
            clearInterval(_intervaloContador);
            _intervaloContador = null;
            _limpiarIntentosLocales();
            btnLogin.disabled    = false;
            btnLogin.textContent = 'Ingresar';
            mostrarError('Ya puedes intentar de nuevo.', 'info');
        }
    }

    _tick();
    _intervaloContador = setInterval(_tick, 1000);
}

// ── Verificar bloqueo al cargar la página ────────────────────────────────────
(function verificarBloqueoAlCargar() {
    const segundos = _segundosBloqueoLocal();
    if (segundos > 0) {
        const hora = _horaDesbloqueo();
        mostrarError(
            `Cuenta bloqueada hasta las ${hora} por demasiados intentos fallidos.`,
        );
        _iniciarContadorBloqueo(segundos);
    }
})();

// ── Submit del formulario ─────────────────────────────────────────────────────
form.addEventListener('submit', async function (e) {
    e.preventDefault();

    // Verificar bloqueo local antes de hacer la petición
    const segundosBloqueo = _segundosBloqueoLocal();
    if (segundosBloqueo > 0) {
        const hora = _horaDesbloqueo();
        mostrarError(
            `Cuenta bloqueada hasta las ${hora} por demasiados intentos fallidos.`,
        );
        if (!_intervaloContador) _iniciarContadorBloqueo(segundosBloqueo);
        return;
    }

    const email    = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const btnLogin = form.querySelector('.btn-login');
    const errEl    = document.getElementById('login_error');

    btnLogin.disabled    = true;
    btnLogin.textContent = 'Ingresando...';
    if (errEl) errEl.style.display = 'none';

    try {
        const response = await fetch(`${API}/auth/login`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
            // ── Éxito ──────────────────────────────────────────────────────
            _limpiarIntentosLocales();

            localStorage.setItem('token', data.token);
            localStorage.setItem('usuario', JSON.stringify(data.usuario));

            const rol = data.usuario?.tipo_usuario;

            const rutas = {
                ADMIN:     '/frontend/index.html',
                OPERARIO:  '/frontend/vistaOperario/vendedor.html',
                PRODUCTOR: '/frontend/vista_productor/productor.html',
            };

            const destino = rutas[rol];

            if (destino) {
                window.location.replace(destino);
            } else {
                AuthGuard.cerrarSesion(false);
                mostrarError('Rol de usuario no reconocido. Contacta al administrador.');
                btnLogin.disabled    = false;
                btnLogin.textContent = 'Ingresar';
            }

        } else {
            // ── Fallo ──────────────────────────────────────────────────────
            const mensaje = data.message || 'Correo o contraseña incorrectos.';

            // Si el servidor indica bloqueo, sincronizar estado local
            const esBloqueoPorServidor = mensaje.toLowerCase().includes('bloqueada');

            if (esBloqueoPorServidor) {
                // Forzar bloqueo local si el servidor lo dice (p.ej. tras reinicio del proceso)
                if (!_obtenerBloqueadoHasta()) {
                    localStorage.setItem(STORAGE_KEY_INTENTOS, String(MAX_INTENTOS_LOCAL));
                    localStorage.setItem(STORAGE_KEY_BLOQUEO, String(Date.now() + BLOQUEO_MS_LOCAL));
                }
                const hora = _horaDesbloqueo();
                mostrarError(
                    hora
                        ? `Cuenta bloqueada hasta las ${hora} por demasiados intentos fallidos.`
                        : mensaje,
                );
                _iniciarContadorBloqueo(_segundosBloqueoLocal());
            } else {
                _incrementarIntentosLocales();
                const nuevosIntentos = _obtenerIntentosLocales();
                const nuevoBloqueo   = _segundosBloqueoLocal();

                if (nuevoBloqueo > 0) {
                    const hora = _horaDesbloqueo();
                    mostrarError(
                        `Cuenta bloqueada hasta las ${hora} por demasiados intentos fallidos.`,
                    );
                    _iniciarContadorBloqueo(nuevoBloqueo);
                } else {
                    const restantes = MAX_INTENTOS_LOCAL - nuevosIntentos;
                    if (restantes <= 2) {
                        mostrarError(
                            `${mensaje} Te quedan ${restantes} intento${restantes !== 1 ? 's' : ''}.`,
                        );
                    } else {
                        mostrarError(mensaje);
                    }
                    btnLogin.disabled    = false;
                    btnLogin.textContent = 'Ingresar';
                }
            }
        }

    } catch (error) {
        console.error('Error de red:', error);
        mostrarError('No se pudo conectar con el servidor. Verifica tu conexión.');
        btnLogin.disabled    = false;
        btnLogin.textContent = 'Ingresar';
    }
});

function mostrarError(msg, tipo) {
    let errEl = document.getElementById('login_error');
    if (!errEl) {
        errEl = document.createElement('p');
        errEl.id = 'login_error';
        errEl.style.cssText = 'font-size:.85em;font-weight:600;margin-top:10px;text-align:center';
        form.appendChild(errEl);
    }

    if (tipo === 'info') {
        errEl.style.background = '#dcfce7';
        errEl.style.color      = '#166534';
        errEl.style.padding    = '10px 14px';
        errEl.style.borderRadius = '8px';
        errEl.style.marginBottom = '10px';
    } else {
        errEl.style.background = '#fee2e2';
        errEl.style.color      = '#991b1b';
        errEl.style.padding    = '10px 14px';
        errEl.style.borderRadius = '8px';
        errEl.style.marginBottom = '10px';
    }

    errEl.textContent   = msg;
    errEl.style.display = 'block';
}