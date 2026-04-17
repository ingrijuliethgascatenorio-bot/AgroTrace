/* AgroTrace — login.js */

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

form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const email    = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const btnLogin = form.querySelector('.btn-login');
    const errEl    = document.getElementById('login_error');

    btnLogin.disabled    = true;
    btnLogin.textContent = 'Ingresando...';
    if (errEl) errEl.style.display = 'none';

    try {
        const response = await fetch('/api/auth/login', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
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
            mostrarError(data.message || 'Correo o contraseña incorrectos.');
            btnLogin.disabled    = false;
            btnLogin.textContent = 'Ingresar';
        }

    } catch (error) {
        console.error('Error de red:', error);
        mostrarError('No se pudo conectar con el servidor. Verifica tu conexión.');
        btnLogin.disabled    = false;
        btnLogin.textContent = 'Ingresar';
    }
});

function mostrarError(msg) {
    let errEl = document.getElementById('login_error');
    if (!errEl) {
        errEl = document.createElement('p');
        errEl.id = 'login_error';
        errEl.style.cssText = 'color:#dc2626;font-size:.85em;font-weight:600;margin-top:10px;text-align:center';
        form.appendChild(errEl);
    }
    errEl.textContent   = msg;
    errEl.style.display = 'block';
}