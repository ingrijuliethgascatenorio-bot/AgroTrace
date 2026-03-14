const form = document.getElementById("loginForm");

form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const email    = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const btnLogin = form.querySelector('.btn-login');

    btnLogin.disabled     = true;
    btnLogin.textContent  = 'Ingresando...';

    try {
        const response = await fetch("http://localhost:3000/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            // ── Guardar token y usuario completo ──
            localStorage.setItem("token",   data.token);
            localStorage.setItem("usuario", JSON.stringify(data.usuario));

            // ── Redirigir según rol ──
            const tipo = data.usuario.tipo_usuario;

            if      (tipo === 'ADMIN')    window.location.href = "./index.html";
            else if (tipo === 'VENDEDOR') window.location.href = "./vendedor.html";
            else if (tipo === 'PRODUCTOR') window.location.href = "./productor.html";
            else     window.location.href = "./login.html";

        } else {
            alert(data.message || "Credenciales incorrectas");
            btnLogin.disabled    = false;
            btnLogin.textContent = 'Ingresar';
        }

    } catch (error) {
        console.error(error);
        alert("No se pudo conectar con el servidor");
        btnLogin.disabled    = false;
        btnLogin.textContent = 'Ingresar';
    }
});
