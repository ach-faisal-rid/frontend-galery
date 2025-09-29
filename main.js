// Add JS here
// Use API_BASE and apiFetch from app-config.js (app-config.js must be loaded before this script)
console.log('Using API base (main.js):', window.API_BASE);
// Cek apakah token ada di localStorage saat halaman dimuat
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (token) {
    // Redirect ke halaman dashboard jika token ditemukan
    window.location.href = 'dashboard.html';
    }

    // Setup form toggling
    setupFormToggling();
});

// Setup form toggling between login and register
function setupFormToggling() {
    const showLoginBtn = document.getElementById('show-login');
    const showRegisterBtn = document.getElementById('show-register');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const authTitle = document.getElementById('auth-title');

    if (showLoginBtn) showLoginBtn.addEventListener('click', () => {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        showLoginBtn.classList.add('active');
        showRegisterBtn.classList.remove('active');
        authTitle.textContent = 'Login';
    });

    if (showRegisterBtn) showRegisterBtn.addEventListener('click', () => {
        registerForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
        showRegisterBtn.classList.add('active');
        showLoginBtn.classList.remove('active');
        authTitle.textContent = 'Register';
    });
}

// Login form handler
const loginFormEl = document.getElementById('login-form');
if (loginFormEl) {
    loginFormEl.addEventListener('submit', async function (e) {
    e.preventDefault();

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const messageDiv = document.getElementById('login-message');

    try {
        const response = await apiFetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            const errorData = await response.json();
            messageDiv.innerHTML = `<div style="color: red;">${errorData.message || 'Login gagal'}</div>`;
            return;
        }

        const data = await response.json();

        if (data.token) {
            localStorage.setItem('token', data.token);
            messageDiv.innerHTML = '<div style="color: green;">Login berhasil! Mengalihkan...</div>';

            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        } else {
            messageDiv.innerHTML = '<div style="color: red;">Login gagal</div>';
        }
    } catch (error) {
        messageDiv.innerHTML = '<div style="color: red;">Terjadi kesalahan koneksi</div>';
        console.error('Error:', error);
    }
});
}
// Registration form handler
const registerFormEl = document.getElementById('register-form');
if (registerFormEl) {
    registerFormEl.addEventListener('submit', async function (e) {
    e.preventDefault();

    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const messageDiv = document.getElementById('register-message');

    try {
        const response = await apiFetch('/auth/registrasi', {
            method: 'POST',
            body: JSON.stringify({ name, email, password })
        });

        if (!response.ok) {
            const errorData = await response.json();
            messageDiv.innerHTML = `<div style="color: red;">${errorData.message || 'Registrasi gagal'}</div>`;
            return;
        }

        const data = await response.json();

        if (data.message === 'Registrasi berhasil') {
            messageDiv.innerHTML = '<div style="color: green;">Registrasi berhasil! Silakan login.</div>';

            // Clear form
            document.getElementById('register-name').value = '';
            document.getElementById('register-email').value = '';
            document.getElementById('register-password').value = '';

            // Switch to login form after 2 seconds
            setTimeout(() => {
                document.getElementById('show-login').click();
                messageDiv.innerHTML = '';
            }, 2000);
        } else {
            messageDiv.innerHTML = '<div style="color: red;">Registrasi gagal</div>';
        }
    } catch (error) {
        messageDiv.innerHTML = '<div style="color: red;">Terjadi kesalahan koneksi</div>';
        console.error('Error:', error);
    }
});
}
