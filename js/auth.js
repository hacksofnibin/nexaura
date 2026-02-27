/* =====================================================
   NexAura – Auth & Login Handling
   ===================================================== */

function initLoginPage() {
    const tabs = document.querySelectorAll('.auth-tab');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');

    // Tab switching
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const target = tab.dataset.tab;
            if (loginForm) loginForm.style.display = target === 'login' ? 'block' : 'none';
            if (signupForm) signupForm.style.display = target === 'signup' ? 'block' : 'none';
        });
    });

    // Social Login Buttons
    document.getElementById('googleLogin')?.addEventListener('click', () => {
        simulateSocialLogin('Google', 'https://accounts.google.com');
    });

    document.getElementById('linkedinLogin')?.addEventListener('click', () => {
        simulateSocialLogin('LinkedIn', 'https://linkedin.com/login');
    });

    document.getElementById('githubLogin')?.addEventListener('click', () => {
        simulateSocialLogin('GitHub', 'https://github.com/login');
    });

    // Email Login
    loginForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        if (!email || !password) return;
        handleLogin({ name: email.split('@')[0], email, provider: 'email' });
    });

    // Sign Up
    signupForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        if (!name || !email || !password) return;
        handleLogin({ name, email, provider: 'email' });
    });
}

function simulateSocialLogin(provider, url) {
    // Show loading state
    showAuthLoading(`Connecting to ${provider}...`);
    // In a real app, redirect to OAuth — here we simulate success
    setTimeout(() => {
        const mockUser = {
            name: `${provider} User`,
            email: `user@${provider.toLowerCase()}.com`,
            provider: provider.toLowerCase(),
            avatar: null
        };
        handleLogin(mockUser);
    }, 1500);
}

function handleLogin(user) {
    if (typeof NexAuraCookies !== 'undefined') {
        NexAuraCookies.saveUserSession(user);
        NexAuraCookies.set('nexaura_consent', true); // auto-consent on login
    }
    showAuthSuccess(user.name);
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1200);
}

function showAuthLoading(msg) {
    const btn = document.querySelector('.form-submit');
    if (btn) {
        btn.disabled = true;
        btn.textContent = msg;
        btn.style.opacity = '0.7';
    }
    // Also show overlay
    const overlay = document.getElementById('authLoadingOverlay');
    if (overlay) {
        overlay.querySelector('p').textContent = msg;
        overlay.style.display = 'flex';
    }
}

function showAuthSuccess(name) {
    const overlay = document.getElementById('authLoadingOverlay');
    if (overlay) {
        overlay.innerHTML = `
      <div style="text-align:center">
        <div style="font-size:3rem;margin-bottom:12px">✅</div>
        <h3 style="font-size:1.2rem;margin-bottom:6px">Welcome, ${name}!</h3>
        <p style="color:var(--text-muted);font-size:0.875rem">Redirecting to NexAura...</p>
      </div>`;
        overlay.style.display = 'flex';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Only run on login page
    if (document.getElementById('loginPage')) {
        initLoginPage();
        // Redirect if already logged in
        if (typeof NexAuraCookies !== 'undefined' && NexAuraCookies.getUser()) {
            window.location.href = 'index.html';
        }
    }
});
