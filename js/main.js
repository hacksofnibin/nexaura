/* =====================================================
   NexAura Cookie Management & Personalization
   ===================================================== */

const NexAuraCookies = {

    // Set a cookie
    set(name, value, days = 365) {
        const d = new Date();
        d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
        document.cookie = `${name}=${encodeURIComponent(JSON.stringify(value))};expires=${d.toUTCString()};path=/;SameSite=Lax`;
    },

    // Get a cookie
    get(name) {
        const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
        if (!match) return null;
        try { return JSON.parse(decodeURIComponent(match[1])); }
        catch { return null; }
    },

    // Delete a cookie
    delete(name) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`;
    },

    // Check if user consented to cookies
    hasConsent() { return this.get('nexaura_consent') === true; },

    // Accept cookies
    acceptAll() {
        this.set('nexaura_consent', true);
        this.set('nexaura_prefs', { analytics: true, personalization: true });
        hideCookieBanner();
    },

    // Decline non-essential cookies
    declineOptional() {
        this.set('nexaura_consent', false);
        this.set('nexaura_prefs', { analytics: false, personalization: false });
        hideCookieBanner();
    },

    // Track category interest
    trackCategory(category) {
        if (!this.hasConsent()) return;
        const interests = this.get('nexaura_interests') || {};
        interests[category] = (interests[category] || 0) + 1;
        this.set('nexaura_interests', interests);
    },

    // Get user's preferred categories sorted by interest
    getPreferredCategories() {
        const interests = this.get('nexaura_interests') || {};
        return Object.entries(interests)
            .sort((a, b) => b[1] - a[1])
            .map(([cat]) => cat);
    },

    // Save user info after login
    saveUserSession(user) {
        this.set('nexaura_user', user, 30);
    },

    // Get current user
    getUser() { return this.get('nexaura_user'); },

    // Logout
    logout() { this.delete('nexaura_user'); }
};

// ── Cookie Banner Logic ──────────────────────────────
function hideCookieBanner() {
    const banner = document.getElementById('cookieBanner');
    if (banner) {
        banner.style.animation = 'slideDown 0.4s ease forwards';
        setTimeout(() => { banner.style.display = 'none'; }, 400);
    }
}

function initCookieBanner() {
    const banner = document.getElementById('cookieBanner');
    if (!banner) return;
    if (NexAuraCookies.get('nexaura_consent') !== null) {
        banner.style.display = 'none';
        return;
    }
    banner.style.display = 'flex';

    document.getElementById('cookieAccept')?.addEventListener('click', () => NexAuraCookies.acceptAll());
    document.getElementById('cookieDecline')?.addEventListener('click', () => NexAuraCookies.declineOptional());
}

// ── Navbar User State ────────────────────────────────
function updateNavForUser() {
    const user = NexAuraCookies.getUser();
    const loginBtn = document.getElementById('navLoginBtn');
    if (!loginBtn) return;

    if (user) {
        loginBtn.innerHTML = `
      <span style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#00d4ff,#8b5cf6);
        display:inline-flex;align-items:center;justify-content:center;font-size:0.8rem;font-weight:700;color:#fff;">
        ${user.name ? user.name[0].toUpperCase() : 'U'}
      </span>
      <span>${user.name || 'User'}</span>`;
        loginBtn.onclick = () => {
            if (confirm('Sign out of NexAura?')) {
                NexAuraCookies.logout();
                updateNavForUser();
            }
        };
    } else {
        loginBtn.innerHTML = `Sign In`;
        loginBtn.onclick = () => { window.location.href = 'login.html'; };
    }
}

// ── Navbar Scroll Effect ─────────────────────────────
function initNavbarScroll() {
    const nav = document.querySelector('.navbar');
    if (!nav) return;
    window.addEventListener('scroll', () => {
        nav.classList.toggle('scrolled', window.scrollY > 20);
    }, { passive: true });
}

// ── Mobile Nav Toggle ────────────────────────────────
function initMobileNav() {
    const ham = document.getElementById('hamburger');
    const mobileNav = document.getElementById('mobileNav');
    if (!ham || !mobileNav) return;
    ham.addEventListener('click', () => {
        mobileNav.classList.toggle('open');
        // animate hamburger
        const spans = ham.querySelectorAll('span');
        ham.classList.toggle('active');
    });
}

// ── Global Init ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    initLoader();
    initCookieBanner();
    updateNavForUser();
    initNavbarScroll();
    initMobileNav();
});

// ── Intro Loader Logic ───────────────────────────────
function initLoader() {
    const loader = document.getElementById('introLoader');
    if (!loader) return;

    // Only show the loader once per session
    if (sessionStorage.getItem('hasSeenLoader')) {
        loader.style.display = 'none';
        return;
    }

    // Disable scrolling while loader is active
    document.body.style.overflow = 'hidden';

    const triggerEntrance = () => {
        if (loader.classList.contains('entering')) return;

        loader.classList.add('entering');
        document.body.classList.add('entering');

        // After the fly animation (1.2s in CSS), reveal the site
        setTimeout(() => {
            document.body.classList.add('revealed');
            document.body.style.overflow = '';
            sessionStorage.setItem('hasSeenLoader', 'true');

            // Clean up loader after fade
            setTimeout(() => {
                loader.style.display = 'none';
            }, 800);
        }, 1200);
    };

    // Listen for move-down intent (Desktop & Mouse)
    window.addEventListener('wheel', (e) => {
        if (e.deltaY > 0) triggerEntrance();
    }, { passive: true });

    // Mobile swipe detection (Upward swipe = Scroll Down)
    let touchStartY = 0;
    window.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
        // Prevent default browser bounce/scroll while on loader
        if (!loader.classList.contains('entering')) {
            e.preventDefault();
        }
    }, { passive: false });

    window.addEventListener('touchend', (e) => {
        let touchEndY = e.changedTouches[0].clientY;
        // More sensitive threshold (20px)
        if (touchStartY - touchEndY > 20) {
            triggerEntrance();
        }
    }, { passive: true });

    // Immediate fallback: Any pointer (touch/mouse) down triggers entrance
    loader.addEventListener('pointerdown', triggerEntrance);

    window.addEventListener('keydown', (e) => {
        if (['ArrowDown', 'PageDown', ' '].includes(e.key)) triggerEntrance();
    });
}

// Add slideDown animation
const styleEl = document.createElement('style');
styleEl.textContent = `
  @keyframes slideDown {
    to { transform: translateY(100%); opacity: 0; }
  }
`;
document.head.appendChild(styleEl);
