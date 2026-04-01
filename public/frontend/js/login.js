/* AgroTrace — Registro del Service Worker (offline global) */
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker
            .register('/public/frontend/sw.js')
            .then(r => console.log('[SW] Registrado OK. Scope:', r.scope))
            .catch(e => console.warn('[SW] Error:', e));
    });
}

const form = document.getElementById('loginForm');

form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const btnLogin = form.querySelector('.btn-login');
    const errEl = document.getElementById('login_error');

    btnLogin.disabled = true;
    btnLogin.textContent = 'Ingresando...';
    if (errEl) errEl.style.display = 'none';

    try {
        const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
            // ── Guardar sesión ──────────────────────────────
            localStorage.setItem('token', data.token);
            localStorage.setItem('usuario', JSON.stringify(data.usuario));

            // ── Redirigir según rol (tipo_usuario) ──────────
            const rol = data.usuario?.tipo_usuario;

            const rutas = {
                ADMIN: '../../frontend/index.html',
                PRODUCTOR: '../../frontend/vista_productor/productor.html',
                VENDEDOR: '../../frontend/vistaOperario/vendedor.html',
            };

            const destino = rutas[rol];

            if (destino) {
                window.location.replace(destino);
            } else {
                // Rol desconocido — limpiar y mostrar error
                localStorage.removeItem('token');
                localStorage.removeItem('usuario');
                mostrarError('Rol de usuario no reconocido. Contacta al administrador.');
                btnLogin.disabled = false;
                btnLogin.textContent = 'Ingresar';
            }

        } else {
            mostrarError(data.message || 'Correo o contraseña incorrectos.');
            btnLogin.disabled = false;
            btnLogin.textContent = 'Ingresar';
        }

    } catch (error) {
        console.error('Error de red:', error);
        mostrarError('No se pudo conectar con el servidor. Verifica tu conexión.');
        btnLogin.disabled = false;
        btnLogin.textContent = 'Ingresar';
    }
});

function mostrarError(msg) {
    // Intentar mostrar en elemento dedicado
    let errEl = document.getElementById('login_error');
    if (!errEl) {
        // Si no existe, crearlo debajo del formulario
        errEl = document.createElement('p');
        errEl.id = 'login_error';
        errEl.style.cssText = 'color:#dc2626;font-size:.85em;font-weight:600;margin-top:10px;text-align:center';
        form.appendChild(errEl);
    }
    errEl.textContent = msg;
    errEl.style.display = 'block';
}

// ── Si ya hay sesión activa al cargar el login → redirigir directo ──
(function () {
    const token = localStorage.getItem('token');
    const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');
    if (!token || !usuario) return;

    const rol = usuario.tipo_usuario;
    if (rol === 'ADMIN') {
        window.location.replace('../../frontend/index.html');
    } if (rol === 'PRODUCTOR') {
        window.location.replace('../../frontend/vista_productor/productor.html');
    } else if (rol === 'VENDEDOR') {
        window.location.replace('../../frontend/vistaOperario/vendedor.html');
    } else {
        // Rol desconocido — limpiar sesión
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
    }
})();