/* ═══════════════════════════════════════════════════════════════
   PWA.JS — VissionMarg School Management System
   Handles:
   1. Service Worker registration + update detection
   2. Dynamic manifest per school (logo + name + theme)
   3. Install banner (Android) + iOS instructions
   4. Network status bar
   5. School branding persistence across sessions
═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const PWA_SCHOOL_KEY = 'pwa_school_branding'; /* localStorage key */

  /* ══════════════════════════════════════════════════════════
     1. SERVICE WORKER REGISTRATION
  ══════════════════════════════════════════════════════════ */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .then(reg => {
          console.log('[PWA] Service Worker registered ✓ scope:', reg.scope);

          /* Check for pending update */
          reg.addEventListener('updatefound', () => {
            const worker = reg.installing;
            worker.addEventListener('statechange', () => {
              if (worker.state === 'installed' && navigator.serviceWorker.controller) {
                /* New version available */
                _showUpdateBanner(reg);
              }
            });
          });

          /* Periodic update check every 30 min */
          setInterval(() => reg.update(), 30 * 60 * 1000);
        })
        .catch(err => console.warn('[PWA] SW registration failed:', err));

      /* Reload page when new SW takes control */
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (window._pwaReloading) return;
        window._pwaReloading = true;
        window.location.reload();
      });
    });
  }

  /* ══════════════════════════════════════════════════════════
     2. DYNAMIC MANIFEST — School branding per login
  ══════════════════════════════════════════════════════════ */

  /* Read school branding saved after login */
  function _getSchoolBranding() {
    try {
      const saved = localStorage.getItem(PWA_SCHOOL_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}

    /* Fallback: try to read from current session */
    try {
      const user = JSON.parse(sessionStorage.getItem('school_user'));
      if (user?.schoolId) {
        const settings = JSON.parse(
          localStorage.getItem(user.schoolId + '_school_settings') || '{}'
        );
        return {
          id:         user.schoolId,
          name:       settings.schoolName  || user.schoolName || 'School SMS',
          logo:       settings.schoolLogo  || null,
          themeColor: settings.themeColor  || '#7C3AED',
          tagline:    settings.schoolTagline || '',
        };
      }
    } catch {}
    return null;
  }

  /* Save branding to localStorage so it persists across sessions */
  function _saveSchoolBranding(schoolId) {
    try {
      const settings = JSON.parse(
        localStorage.getItem(schoolId + '_school_settings') || '{}'
      );
      const schools = JSON.parse(localStorage.getItem('_sa_schools') || '[]');
      const school  = schools.find(s => s.id === schoolId) || {};

      const branding = {
        id:         schoolId,
        name:       settings.schoolName   || school.name || 'School SMS',
        logo:       settings.schoolLogo  || null,
        themeColor: settings.themeColor   || '#7C3AED',
        tagline:    settings.schoolTagline || school.tagline || '',
        savedAt:    Date.now(),
      };
      localStorage.setItem(PWA_SCHOOL_KEY, JSON.stringify(branding));
      return branding;
    } catch { return null; }
  }

  /* Build and inject dynamic manifest link */
  async function _updateManifest(branding) {
    if (!branding) {
      /* Use static manifest.json */
      _ensureManifestLink('/manifest.json');
      return;
    }

    const shortName = branding.name.split(' ').slice(0, 3).join(' ');

    /* Build icon list */
    let icons = [];
    if (branding.logo && branding.logo.startsWith('data:')) {
      /* School uploaded a logo — use it as the PWA icon! */
      /* Convert base64 → Blob → blob: URL for the icon */
      try {
        const iconBlobUrl = await _base64ToBlobUrl(branding.logo);
        icons = [
          { src: iconBlobUrl, sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: iconBlobUrl, sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ];
      } catch {
        icons = _defaultIcons();
      }
    } else {
      icons = _defaultIcons();
    }

    const manifest = {
      name:             branding.name,
      short_name:       shortName,
      description:      `${branding.name} — School Management System`,
      start_url:        '/?source=pwa&school=' + encodeURIComponent(branding.id),
      display:          'standalone',
      background_color: '#0D0D1A',
      theme_color:      branding.themeColor || '#7C3AED',
      orientation:      'portrait-primary',
      scope:            '/',
      icons:            icons,
      shortcuts: [
        { name: 'Admin Panel',   short_name: 'Admin',   url: '/admin.html',   icons: [{ src: '/icons/icon-96.png', sizes: '96x96' }] },
        { name: 'Teacher Panel', short_name: 'Teacher', url: '/teacher.html', icons: [{ src: '/icons/icon-96.png', sizes: '96x96' }] },
      ],
    };

    /* Create Blob URL for the manifest */
    const blob    = new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' });
    const blobUrl = URL.createObjectURL(blob);

    /* Revoke old blob URL to prevent memory leak */
    const oldLink = document.querySelector('link[rel="manifest"]');
    if (oldLink?.href?.startsWith('blob:')) URL.revokeObjectURL(oldLink.href);

    _ensureManifestLink(blobUrl);
    _updateThemeColor(branding.themeColor);
    _updateAppleTouchIcon(branding.logo);

    console.log('[PWA] Dynamic manifest set for:', branding.name);
  }

  function _ensureManifestLink(href) {
    let link = document.querySelector('link[rel="manifest"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'manifest';
      document.head.appendChild(link);
    }
    link.href = href;
  }

  function _updateThemeColor(color) {
    if (!color) return;
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    meta.content = color;
    /* Also update status bar color on iOS */
    let meta2 = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (meta2) meta2.content = 'black-translucent';
  }

  function _updateAppleTouchIcon(logoBase64) {
    if (!logoBase64) return;
    let link = document.querySelector('link[rel="apple-touch-icon"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'apple-touch-icon';
      document.head.appendChild(link);
    }
    link.href = logoBase64;
  }

  function _defaultIcons() {
    return [
      { src: '/icons/icon-72.png',           sizes: '72x72',   type: 'image/png' },
      { src: '/icons/icon-96.png',           sizes: '96x96',   type: 'image/png' },
      { src: '/icons/icon-128.png',          sizes: '128x128', type: 'image/png' },
      { src: '/icons/icon-144.png',          sizes: '144x144', type: 'image/png' },
      { src: '/icons/icon-152.png',          sizes: '152x152', type: 'image/png' },
      { src: '/icons/icon-192.png',          sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png',          sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ];
  }

  async function _base64ToBlobUrl(dataUrl) {
    const res  = await fetch(dataUrl);
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  }

  /* Initialize manifest on page load */
  window.addEventListener('DOMContentLoaded', () => {
    const branding = _getSchoolBranding();
    _updateManifest(branding);
  });

  /* ── Public API ─────────────────────────────────────────
     Called from admin.js after login / settings save
  ──────────────────────────────────────────────────────── */

  /* Call this after successful school login */
  window.pwaOnLogin = function (schoolId) {
    const branding = _saveSchoolBranding(schoolId);
    _updateManifest(branding);
    console.log('[PWA] Branding updated for school:', schoolId);
  };

  /* Call this after admin saves school settings (logo/name change) */
  window.pwaRefreshBranding = function (schoolId) {
    if (!schoolId) {
      try {
        schoolId = JSON.parse(sessionStorage.getItem('school_user'))?.schoolId;
      } catch {}
    }
    if (!schoolId) return;
    const branding = _saveSchoolBranding(schoolId);
    _updateManifest(branding);
    if (typeof toast === 'function') toast('✅ App branding updated!', 'success');
  };

  /* Call on logout to reset to default */
  window.pwaOnLogout = function () {
    localStorage.removeItem(PWA_SCHOOL_KEY);
    _ensureManifestLink('/manifest.json');
    _updateThemeColor('#7C3AED');
  };

  /* ══════════════════════════════════════════════════════════
     3. INSTALL BANNER
  ══════════════════════════════════════════════════════════ */
  let _deferredPrompt = null;
  let _installBannerShown = false;

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    _deferredPrompt = e;
    /* Show banner after 3 seconds (don't be aggressive) */
    setTimeout(_showInstallBanner, 3000);
  });

  window.addEventListener('appinstalled', () => {
    _deferredPrompt = null;
    _hideInstallBanner();
    localStorage.setItem('pwa_installed', '1');
    console.log('[PWA] App installed successfully ✓');
  });

  function _showInstallBanner() {
    /* Don't show if already installed / running standalone / already dismissed today */
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    if (localStorage.getItem('pwa_installed')) return;
    if (_installBannerShown) return;

    const dismissed = localStorage.getItem('pwa_banner_dismissed');
    if (dismissed && Date.now() - parseInt(dismissed) < 3 * 24 * 60 * 60 * 1000) return; /* 3 days */

    _installBannerShown = true;

    const branding = _getSchoolBranding();
    const appName  = branding?.name || 'School SMS';
    const logoSrc  = branding?.logo || '/icons/icon-72.png';
    const color    = branding?.themeColor || '#7C3AED';

    const banner = document.createElement('div');
    banner.id    = 'pwa-install-banner';
    banner.innerHTML = `
      <style>
        #pwa-install-banner {
          position:fixed;bottom:0;left:0;right:0;z-index:999999;
          animation: pwaSlideUp .35s cubic-bezier(.4,0,.2,1);
        }
        @keyframes pwaSlideUp {
          from { transform:translateY(100%); opacity:0; }
          to   { transform:translateY(0);    opacity:1; }
        }
        #pwa-install-banner .pwa-banner-inner {
          background:linear-gradient(135deg,#1e1b4b 0%,#1e1b4b 60%,#164e63 100%);
          border-top:1px solid rgba(124,58,237,.35);
          padding:14px 16px 14px;
          display:flex;align-items:center;gap:12px;
          box-shadow:0 -8px 32px rgba(0,0,0,.55);
        }
        #pwa-install-banner img.pwa-icon {
          width:48px;height:48px;border-radius:12px;
          flex-shrink:0;object-fit:cover;
          box-shadow:0 2px 8px rgba(0,0,0,.4);
        }
        #pwa-install-banner .pwa-text { flex:1;min-width:0; }
        #pwa-install-banner .pwa-text b {
          display:block;color:#fff;font-size:.88rem;font-weight:700;
          white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
        }
        #pwa-install-banner .pwa-text small {
          color:rgba(255,255,255,.45);font-size:.72rem;
        }
        #pwa-install-banner .pwa-btn-install {
          background:linear-gradient(135deg,${color},#06b6d4);
          color:#fff;border:none;padding:10px 18px;border-radius:10px;
          font-weight:700;font-size:.82rem;cursor:pointer;
          flex-shrink:0;white-space:nowrap;
          box-shadow:0 2px 12px rgba(124,58,237,.4);
          transition:opacity .15s;
        }
        #pwa-install-banner .pwa-btn-install:active { opacity:.8; }
        #pwa-install-banner .pwa-btn-close {
          background:none;border:none;color:rgba(255,255,255,.35);
          font-size:20px;cursor:pointer;padding:4px;flex-shrink:0;line-height:1;
          transition:color .15s;
        }
        #pwa-install-banner .pwa-btn-close:hover { color:rgba(255,255,255,.7); }
      </style>
      <div class="pwa-banner-inner">
        <img class="pwa-icon" src="${logoSrc}"
             onerror="this.src='/icons/icon-72.png'" alt="App Icon">
        <div class="pwa-text">
          <b>${appName}</b>
          <small>📲 Install app for quick access</small>
        </div>
        <button class="pwa-btn-install" onclick="window.pwaInstall()">Install</button>
        <button class="pwa-btn-close"   onclick="window.pwaDismissBanner()">✕</button>
      </div>
    `;
    document.body.appendChild(banner);
  }

  function _hideInstallBanner() {
    const b = document.getElementById('pwa-install-banner');
    if (b) b.remove();
  }

  window.pwaInstall = async function () {
    if (_deferredPrompt) {
      _deferredPrompt.prompt();
      const { outcome } = await _deferredPrompt.userChoice;
      _deferredPrompt = null;
      _hideInstallBanner();
      if (outcome === 'accepted') {
        console.log('[PWA] User accepted install prompt');
      }
    } else {
      /* iOS / browsers without beforeinstallprompt */
      _showiOSGuide();
    }
  };

  window.pwaDismissBanner = function () {
    localStorage.setItem('pwa_banner_dismissed', Date.now().toString());
    _hideInstallBanner();
  };

  function _showiOSGuide() {
    const isIOS    = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    if (isIOS && isSafari) {
      _showGuideModal(
        '📱 Install on iPhone / iPad',
        `<ol style="padding-left:20px;line-height:2;color:rgba(255,255,255,.8);font-size:.88rem;">
           <li>Tap the <b>Share</b> button <span style="font-size:1.1em">⬆️</span> at the bottom of Safari</li>
           <li>Scroll down and tap <b>"Add to Home Screen"</b></li>
           <li>Tap <b>Add</b> — done! 🎉</li>
         </ol>`
      );
    } else {
      _showGuideModal(
        '📲 Install App',
        `<p style="color:rgba(255,255,255,.7);font-size:.88rem;line-height:1.7;">
           Open this website in <b>Google Chrome</b> on your Android phone, then:
         </p>
         <ol style="padding-left:20px;line-height:2;color:rgba(255,255,255,.8);font-size:.88rem;margin-top:8px;">
           <li>Tap the <b>menu (⋮)</b> in Chrome</li>
           <li>Select <b>"Add to Home screen"</b></li>
           <li>Tap <b>Add</b> — done! 🎉</li>
         </ol>`
      );
    }
  }

  function _showGuideModal(title, bodyHtml) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position:fixed;inset:0;z-index:9999999;
      background:rgba(0,0,0,.7);backdrop-filter:blur(6px);
      display:flex;align-items:center;justify-content:center;padding:24px;
    `;
    overlay.innerHTML = `
      <div style="
        background:#1a1333;border:1px solid rgba(124,58,237,.3);
        border-radius:20px;padding:28px;max-width:360px;width:100%;
        box-shadow:0 24px 60px rgba(0,0,0,.6);
      ">
        <h3 style="color:#fff;font-size:1.05rem;font-weight:700;margin-bottom:16px;">${title}</h3>
        ${bodyHtml}
        <button onclick="this.closest('div[style]').remove()" style="
          width:100%;margin-top:20px;padding:12px;
          background:linear-gradient(135deg,#7c3aed,#06b6d4);
          color:#fff;border:none;border-radius:12px;
          font-weight:600;font-size:.9rem;cursor:pointer;
        ">Got it ✓</button>
      </div>
    `;
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
  }

  /* ══════════════════════════════════════════════════════════
     4. UPDATE BANNER
  ══════════════════════════════════════════════════════════ */
  function _showUpdateBanner(reg) {
    if (document.getElementById('pwa-update-banner')) return;
    const bar = document.createElement('div');
    bar.id    = 'pwa-update-banner';
    bar.style.cssText = `
      position:fixed;top:0;left:0;right:0;z-index:999998;
      background:linear-gradient(90deg,#065f46,#047857);
      border-bottom:1px solid rgba(16,185,129,.3);
      display:flex;align-items:center;gap:10px;
      padding:10px 16px;font-size:.8rem;
      box-shadow:0 4px 16px rgba(0,0,0,.3);
      animation:pwaSlideDown .3s ease;
    `;
    bar.innerHTML = `
      <style>@keyframes pwaSlideDown{from{transform:translateY(-100%)}to{transform:translateY(0)}}</style>
      <span style="color:#fff;flex:1;">🔄 New update available — refresh to get latest features</span>
      <button onclick="window.pwaApplyUpdate()" style="
        background:rgba(255,255,255,.2);color:#fff;border:1px solid rgba(255,255,255,.3);
        padding:5px 14px;border-radius:8px;font-size:.78rem;cursor:pointer;font-weight:600;
      ">Refresh Now</button>
      <button onclick="this.closest('#pwa-update-banner').remove()" style="
        background:none;border:none;color:rgba(255,255,255,.5);cursor:pointer;font-size:18px;
      ">✕</button>
    `;
    document.body.prepend(bar);

    window.pwaApplyUpdate = function () {
      reg.waiting?.postMessage({ type: 'SKIP_WAITING' });
    };
  }

  /* ══════════════════════════════════════════════════════════
     5. NETWORK STATUS BAR
  ══════════════════════════════════════════════════════════ */
  function _updateNetworkStatus() {
    const existing = document.getElementById('pwa-offline-bar');
    if (!navigator.onLine) {
      if (!existing) {
        const bar = document.createElement('div');
        bar.id    = 'pwa-offline-bar';
        bar.style.cssText = `
          position:fixed;top:0;left:0;right:0;z-index:999997;
          background:#dc2626;color:#fff;
          text-align:center;padding:7px 16px;
          font-size:.75rem;font-weight:600;letter-spacing:.02em;
          box-shadow:0 2px 8px rgba(220,38,38,.4);
        `;
        bar.textContent = '⚠️  No internet connection — working offline';
        document.body.prepend(bar);
      }
    } else {
      if (existing) {
        existing.style.background = '#059669';
        existing.textContent = '✅ Back online';
        setTimeout(() => existing.remove(), 2000);
      }
    }
  }

  window.addEventListener('online',  _updateNetworkStatus);
  window.addEventListener('offline', _updateNetworkStatus);

  /* ══════════════════════════════════════════════════════════
     6. iOS STANDALONE DETECTION
  ══════════════════════════════════════════════════════════ */
  if (window.navigator.standalone === true) {
    document.documentElement.classList.add('pwa-ios-standalone');
  }
  if (window.matchMedia('(display-mode: standalone)').matches) {
    document.documentElement.classList.add('pwa-standalone');
  }

})();
