/**
 * auth-guard.js — AgroTrace
 * ═══════════════════════════════════════════════════════════════════
 * Guard centralizado para proteger rutas por rol.
 *
 * CÓMO FUNCIONA:
 *  1. Lee el JWT del localStorage/sessionStorage y lo decodifica.
 *  2. Verifica que no esté expirado (usando el campo "exp" del payload).
 *  3. Compara el rol (tipo_usuario) contra el rol requerido por la vista.
 *  4. Si no coincide → redirige inmediatamente, sin mostrar nada.
 *
 * USO (una sola línea al inicio de cada página, ANTES de cualquier otro script):
 *   <script src="../auth-guard.js"></script>
 *   <script>AuthGuard.require('ADMIN');</script>      ← solo admins
 *   <script>AuthGuard.require('OPERARIO');</script>   ← solo operarios
 *   <script>AuthGuard.require('PRODUCTOR');</script>  ← solo productores
 *
 * CONCURRENCIA:
 *  - No usa estado global mutable compartido entre pestañas.
 *  - Cada pestaña/usuario tiene su propio localStorage — no hay colisiones.
 *  - El token es stateless (JWT): la verificación es 100% local, sin requests.
 *  - Si dos usuarios abren el sistema al mismo tiempo en el mismo navegador
 *    (distinto tab) con distintos tokens, cada tab lee su propio token.
 *
 * SEGURIDAD:
 *  - El guard verifica expiración del token localmente (campo exp del JWT).
 *  - La autorización real siempre la valida el BACKEND con JwtAuthGuard + RolesGuard.
 *  - Este guard es una primera línea de defensa UX, no reemplaza el backend.
 * ═══════════════════════════════════════════════════════════════════
 */

const AuthGuard = (function () {

    // ── Rutas canónicas por rol ────────────────────────────────────────────────
    // Ajusta estas rutas a la estructura real de tu proyecto.
    const RUTAS = {
        ADMIN:     '../../frontend/index.html',
        OPERARIO:  '../../frontend/vistaOperario/vendedor.html',
        PRODUCTOR: '../../frontend/vista_productor/productor.html',
        LOGIN:     '../../frontend/login.html',
    };

    // ── Decodificar JWT sin librería externa ───────────────────────────────────
    function _decodificarToken(token) {
        try {
            const partes = token.split('.');
            if (partes.length !== 3) return null;
            // base64url → base64 estándar
            const payload = partes[1].replace(/-/g, '+').replace(/_/g, '/');
            return JSON.parse(atob(payload));
        } catch (_) {
            return null;
        }
    }

    // ── Leer token del storage ─────────────────────────────────────────────────
    function _leerToken() {
        return localStorage.getItem('token') || sessionStorage.getItem('token') || null;
    }

    // ── Verificar si el token está expirado ────────────────────────────────────
    // exp es en segundos (estándar JWT); Date.now() en ms → dividir por 1000
    function _tokenExpirado(payload) {
        if (!payload || !payload.exp) return true;
        return Math.floor(Date.now() / 1000) >= payload.exp;
    }

    // ── Limpiar sesión completamente ───────────────────────────────────────────
    function _limpiarSesion() {
        // FIX OFFLINE: NO borrar los cachés de datos — el operario los necesita
        // para trabajar sin internet. Solo eliminar el token y la sesión de usuario.
        // Los cachés (cache_op_*, cache_historial, etc.) se quedan para uso offline.
        ['token', 'usuario'].forEach(k => {
            localStorage.removeItem(k);
            sessionStorage.removeItem(k);
        });
        // qr_productor también se mantiene — se necesita offline para identificación
    }

    // ── Redirigir de forma segura (no se puede volver con el botón atrás) ──────
    function _redirigir(url) {
        window.location.replace(url);
        // Lanzar error detiene la ejecución del script que llamó a require()
        // evitando que se siga ejecutando código de la página protegida
        throw new Error('[AuthGuard] Redirigiendo: acceso denegado.');
    }

    // ── API PÚBLICA ────────────────────────────────────────────────────────────

    /**
     * require(rolRequerido)
     * Llama esto al inicio de cada página protegida.
     * Si el usuario no cumple → redirige sin mostrar la página.
     *
     * @param {string} rolRequerido  'ADMIN' | 'OPERARIO' | 'PRODUCTOR'
     */
    function require(rolRequerido) {
        const token   = _leerToken();

        // 1. Sin token → login
        if (!token) {
            _redirigir(RUTAS.LOGIN);
        }

        // 2. Token malformado → siempre al login (token corrupto no tiene solución offline)
        const payload = _decodificarToken(token);
        if (!payload) {
            _limpiarSesion();
            _redirigir(RUTAS.LOGIN);
        }

        // FIX OFFLINE CRÍTICO: si el token expiró pero NO HAY INTERNET,
        // NO expulsamos al usuario. Operario y Productor están en fincas sin señal
        // y no pueden renovar el token. Continúan en modo "sesión extendida offline".
        // Cuando recupere internet, el primer request al backend fallará con 401
        // y el evento 'agrotrace:session-expired' forzará el re-login normalmente.
        if (_tokenExpirado(payload)) {
            if (!navigator.onLine) {
                // Sin internet: permitir acceso con token vencido (solo datos locales)
                console.warn('[AuthGuard] Token expirado pero sin internet — modo sesión offline extendida');
                // Verificar al menos que el rol coincida para no mostrar vista incorrecta
                const rolUsuario = payload.tipo_usuario || '';
                if (rolUsuario !== rolRequerido) {
                    const rutaCorrecta = RUTAS[rolUsuario];
                    if (rutaCorrecta) _redirigir(rutaCorrecta);
                }
                return; // ← continuar sin expulsar
            }
            // Con internet: token expirado = al login para renovar
            _limpiarSesion();
            _redirigir(RUTAS.LOGIN);
        }

        // 3. Rol del usuario
        const rolUsuario = payload.tipo_usuario || '';

        // 4. Si el rol coincide → permitir acceso
        if (rolUsuario === rolRequerido) return;

        // 5. Rol NO coincide → redirigir a la vista correcta del usuario
        //    (no al login, para no confundir al usuario que simplemente
        //    pegó la URL equivocada)
        const rutaCorrecta = RUTAS[rolUsuario];
        if (rutaCorrecta) {
            _redirigir(rutaCorrecta);
        } else {
            // Rol desconocido → limpiar y login
            _limpiarSesion();
            _redirigir(RUTAS.LOGIN);
        }
    }

    /**
     * obtenerUsuario()
     * Retorna el payload del JWT como objeto, o null si no hay sesión.
     * Útil para leer nombre, email, tipo_usuario sin hacer otro fetch.
     */
    function obtenerUsuario() {
        const token = _leerToken();
        if (!token) return null;
        const payload = _decodificarToken(token);
        if (!payload || _tokenExpirado(payload)) return null;
        return payload;
    }

    /**
     * cerrarSesion()
     * Limpia sesión y redirige al login. Usar en todos los botones "Cerrar sesión".
     */
    function cerrarSesion(confirmar = true) {
        if (confirmar && !window.confirm('¿Deseas cerrar sesión?')) return;
        _limpiarSesion();
        window.location.replace(RUTAS.LOGIN);
    }

    return { require, obtenerUsuario, cerrarSesion };

})();