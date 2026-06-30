/* =====================================================
   UTILS.JS  —  localStorage engine + shared helpers
   Multi-school architecture: all school data prefixed
   with schoolId (e.g. "sch001_students")

   MySQL write-through sync:
   • All DB.set() / SA.set() writes are mirrored to MySQL
     via api/kv.php (fire-and-forget, won't block UI)
   • On login, syncFromServer() pulls fresh data down
===================================================== */

// ── MySQL API endpoint (auto-detected from page origin) ──
const API_URL = window.location.origin + '/api/kv.php';

// ══════════════════════════════════════════════════════
//  PROGRESS BAR
// ══════════════════════════════════════════════════════
const Progress = (() => {
  let bar = null, fill = null, timer = null, pct = 0, active = 0;
  function _ensure() {
    if (bar) return;
    bar  = document.createElement('div'); bar.id  = 'app-progress-bar';
    fill = document.createElement('div'); fill.id = 'app-progress-fill';
    bar.appendChild(fill);
    document.body ? document.body.appendChild(bar)
      : document.addEventListener('DOMContentLoaded', () => document.body.appendChild(bar));
  }
  return {
    start() {
      _ensure(); active++;
      bar.classList.add('visible');
      pct = 12;
      fill.style.transition = 'none';
      fill.style.width = '12%';
      clearInterval(timer);
      timer = setInterval(() => {
        if (pct < 80) { pct += (80 - pct) * 0.12 + 0.5; }
        fill.style.transition = 'width .35s ease';
        fill.style.width = Math.min(pct, 80) + '%';
      }, 350);
      FaviconSpinner.start();
    },
    done() {
      active = Math.max(0, active - 1);
      if (active > 0) return;
      clearInterval(timer);
      if (!fill) return;
      fill.style.transition = 'width .25s ease';
      fill.style.width = '100%';
      setTimeout(() => {
        if (bar) bar.classList.remove('visible');
        fill.style.transition = 'none';
        fill.style.width = '0%';
      }, 350);
      FaviconSpinner.stop();
    },
    fail() {
      active = 0; clearInterval(timer);
      if (fill) { fill.style.background='#ef4444'; fill.style.width='100%'; }
      setTimeout(() => {
        if (bar)  bar.classList.remove('visible');
        if (fill) { fill.style.background=''; fill.style.width='0%'; }
      }, 600);
      FaviconSpinner.stop();
    }
  };
})();

// ══════════════════════════════════════════════════════
//  FAVICON SPINNER (canvas animation during loading)
// ══════════════════════════════════════════════════════
const FaviconSpinner = (() => {
  let canvas, ctx, link, angle = 0, raf = null, running = false;
  function _init() {
    if (canvas) return;
    canvas = document.createElement('canvas'); canvas.width = canvas.height = 32;
    ctx = canvas.getContext('2d');
    link = document.querySelector("link[rel~='icon']");
    if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
  }
  function _draw() {
    ctx.clearRect(0, 0, 32, 32);
    // bg
    ctx.beginPath(); ctx.arc(16,16,15,0,Math.PI*2);
    const g = ctx.createRadialGradient(16,12,2,16,16,15);
    g.addColorStop(0,'#2d1b69'); g.addColorStop(1,'#0d0d28');
    ctx.fillStyle = g; ctx.fill();
    // cap diamond
    ctx.beginPath(); ctx.moveTo(16,6); ctx.lineTo(26,12); ctx.lineTo(16,18); ctx.lineTo(6,12); ctx.closePath();
    ctx.fillStyle = '#a78bfa'; ctx.fill();
    // brim
    ctx.beginPath(); ctx.moveTo(10,14); ctx.lineTo(10,20); ctx.quadraticCurveTo(16,24,22,20); ctx.lineTo(22,14); ctx.lineTo(16,18); ctx.closePath();
    ctx.fillStyle = '#7c3aed'; ctx.fill();
    // spinner arc
    angle += 0.18;
    ctx.beginPath(); ctx.arc(16,16,13, angle, angle + Math.PI*1.3);
    ctx.strokeStyle = '#06b6d4'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.stroke();
    link.href = canvas.toDataURL();
  }
  return {
    start() {
      _init(); if (running) return; running = true;
      (function loop() { if (!running) return; _draw(); raf = requestAnimationFrame(loop); })();
    },
    stop() {
      running = false; cancelAnimationFrame(raf);
      if (link) link.href = 'favicon.svg';
    }
  };
})();

// ── Push one key to MySQL (fire-and-forget) ──────────
/* Debounced + coalesced server mirror.
   localStorage is the instant source of truth, so the UI NEVER waits on
   the network. Rapid writes to the same key (e.g. typing in a config
   field) collapse into a single request after a short idle, and any
   pending writes are flushed via sendBeacon when the page is closed.
   This keeps server traffic minimal even at very large scale. */
const _pushQueue  = {};   // "schoolId|key" -> { schoolId, key, value }
const _pushTimers = {};
const _PUSH_DELAY = 700;  // ms idle before a key is flushed

/* sendBeacon / keepalive fetch are capped at ~64KB. Anything bigger
   (logo, photos, website config, gallery) MUST be sent with a normal
   fetch while the page is open, or it silently never reaches the server
   and gets wiped by the next auto-sync. */
const _PUSH_BIG = 50000; // chars — above this, send immediately via normal fetch

function _flushPush(qk) {
  const item = _pushQueue[qk];
  if (!item) return;
  delete _pushQueue[qk];
  if (_pushTimers[qk]) { clearTimeout(_pushTimers[qk]); delete _pushTimers[qk]; }
  // Normal fetch (NO keepalive) — reliable for any payload size while page is open
  fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ school_id: item.schoolId, key: item.key, value: item.value }),
  }).catch(() => { /* offline — localStorage already holds the truth */ });
}

function _dbPushToServer(schoolId, key, value) {
  if (!schoolId) return;
  const qk = schoolId + '|' + key;
  _pushQueue[qk] = { schoolId, key, value };   // latest value wins
  if (_pushTimers[qk]) { clearTimeout(_pushTimers[qk]); delete _pushTimers[qk]; }
  // Big values (logo/photos/config) → flush NOW so they reliably reach the server
  let big = false;
  try { big = JSON.stringify(value).length > _PUSH_BIG; } catch (e) { big = true; }
  if (big) { _flushPush(qk); return; }
  _pushTimers[qk] = setTimeout(() => _flushPush(qk), _PUSH_DELAY);
}

/* Flush everything still pending when the tab closes/backgrounds.
   Small payloads → sendBeacon. Larger ones were already flushed
   immediately by _dbPushToServer, but if any remain we use keepalive
   fetch (best effort) only when small enough. */
function _flushAllPush() {
  Object.keys(_pushQueue).forEach(qk => {
    const item = _pushQueue[qk];
    if (!item) return;
    const payload = JSON.stringify({ school_id: item.schoolId, key: item.key, value: item.value });
    delete _pushQueue[qk];
    if (payload.length > _PUSH_BIG) {
      // Too big for beacon/keepalive — try a normal fetch (may not finish, but localStorage keeps it)
      try { fetch(API_URL, { method:'POST', headers:{'Content-Type':'application/json'}, body:payload }).catch(()=>{}); } catch(e) {}
      return;
    }
    let sent = false;
    if (navigator.sendBeacon) {
      try { sent = navigator.sendBeacon(API_URL, new Blob([payload], { type: 'application/json' })); } catch (e) {}
    }
    if (!sent) { try { fetch(API_URL, { method:'POST', headers:{'Content-Type':'application/json'}, body:payload, keepalive:true }).catch(()=>{}); } catch(e) {} }
  });
}
window.addEventListener('pagehide', () => _flushAllPush());
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') _flushAllPush(); });

// ── Pull ALL keys for a school from MySQL → localStorage ─
// Called right after successful login so any device gets fresh data
async function syncFromServer(schoolId) {
  if (!schoolId) return;
  Progress.start();
  try {
    const res = await fetch(`${API_URL}?school_id=${encodeURIComponent(schoolId)}`, { cache: 'no-store' });
    if (!res.ok) { Progress.done(); return; }
    const data = await res.json(); // { key: rawJsonString, ... }
    const pfx  = schoolId + '_';
    Object.entries(data).forEach(([k, rawJson]) => {
      // rawJson is already a serialised JSON string — store as-is
      localStorage.setItem(pfx + k, rawJson);
    });
    Progress.done();
  } catch(e) { Progress.done(); /* offline — work from localStorage cache */ }
}

// ── Pull super-admin data from MySQL → localStorage ──────
// Called when super-admin panel loads
async function syncSAFromServer() {
  Progress.start();
  try {
    const res = await fetch(`${API_URL}?school_id=__sa__`, { cache: 'no-store' });
    if (!res.ok) { Progress.done(); return; }
    const data = await res.json();
    Object.entries(data).forEach(([k, rawJson]) => {
      localStorage.setItem('_sa_' + k, rawJson);
    });
    Progress.done();
  } catch(e) { Progress.done(); /* offline */ }
}

// ── Background auto-refresh: re-sync every 2 min while page open ──
function _startAutoSync() {
  const sid = (() => { try { return JSON.parse(sessionStorage.getItem('school_user'))?.schoolId || null; } catch { return null; } })();
  if (!sid) return;
  setInterval(async () => {
    try {
      const res = await fetch(`${API_URL}?school_id=${encodeURIComponent(sid)}`, { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      const pfx = sid + '_';
      Object.entries(data).forEach(([k, v]) => localStorage.setItem(pfx + k, v));
    } catch {}
  }, 120000); // every 2 minutes
}
document.addEventListener('DOMContentLoaded', _startAutoSync);

// ── Global (super-admin, non-prefixed) store ──────────
const SA = {
  get(key)      { try { return JSON.parse(localStorage.getItem('_sa_'+key))||[] }  catch { return [] } },
  getObj(key)   { try { return JSON.parse(localStorage.getItem('_sa_'+key))||{} }  catch { return {} } },
  set(key, val) {
    localStorage.setItem('_sa_'+key, JSON.stringify(val));
    _dbPushToServer('__sa__', key, val);   // mirror to MySQL
  },
};

// ── School-prefixed DB ────────────────────────────────
const DB = {
  _pfx() {
    try {
      const u = JSON.parse(sessionStorage.getItem('school_user'));
      return (u && u.schoolId) ? u.schoolId + '_' : '';
    } catch { return ''; }
  },
  _schoolId() {
    try {
      const u = JSON.parse(sessionStorage.getItem('school_user'));
      return (u && u.schoolId) ? u.schoolId : null;
    } catch { return null; }
  },
  get(key)         { try { return JSON.parse(localStorage.getItem(this._pfx()+key))||[] }  catch { return [] } },
  getObj(key)      { try { return JSON.parse(localStorage.getItem(this._pfx()+key))||{} }  catch { return {} } },
  set(key, val)    {
    localStorage.setItem(this._pfx()+key, JSON.stringify(val));
    const sid = this._schoolId();
    if (sid) _dbPushToServer(sid, key, val);  // mirror to MySQL
  },
  push(key, item)  { const a=this.get(key); a.push(item); this.set(key,a); return item },
  update(key, id, data) {
    const a=this.get(key), i=a.findIndex(x=>x.id===id);
    if(i!==-1){a[i]={...a[i],...data};this.set(key,a);return a[i]}
    return null;
  },
  delete(key, id)  { this.set(key, this.get(key).filter(x=>x.id!==id)) },
  find(key, id)    { return this.get(key).find(x=>x.id===id)||null },
  where(key, f, v) { return this.get(key).filter(x=>x[f]===v) },
};

// ── IDs & Dates ───────────────────────────────────────
function genId(p='id') { return `${p}_${Date.now()}_${Math.random().toString(36).slice(2,7)}` }
function today()       { return new Date().toISOString().split('T')[0] }
function esc(v){ return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'});
}

// ── Auth ──────────────────────────────────────────────
// SESSION_KEY in sessionStorage (cleared when WebView/browser is closed)
// PERSIST_KEY in localStorage  (survives app restart — 30-day TTL)
const _SESSION_KEY = 'school_user';
const _PERSIST_KEY = '_persistent_session';
const _SESSION_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days in ms

function getCurrentUser() {
  try { return JSON.parse(sessionStorage.getItem(_SESSION_KEY)) || null } catch { return null }
}

function setCurrentUser(u) {
  const json = JSON.stringify(u);
  sessionStorage.setItem(_SESSION_KEY, json);
  // Persist to localStorage (survives tab/PWA restart)
  try { localStorage.setItem(_PERSIST_KEY, JSON.stringify({ ...u, _savedAt: Date.now() })); } catch(e) {}
  // Persist to Android native SharedPreferences (survives app process kill)
  try { if (window.AndroidBridge) window.AndroidBridge.saveSession(json); } catch(e) {}
}

function logout() {
  sessionStorage.removeItem(_SESSION_KEY);
  try { localStorage.removeItem(_PERSIST_KEY); } catch(e) {}
  // Clear Android native session + saved URL so next launch shows login
  try { if (window.AndroidBridge) window.AndroidBridge.clearSession(); } catch(e) {}
  window.location.href = 'index.html';
}
function requireAuth(role) {
  const u = getCurrentUser();
  if (!u) { window.location.href='index.html'; return null }
  if (role && u.role !== role) { window.location.href='index.html'; return null }
  return u;
}

/**
 * Returns the enabled feature list for the current school, or null if all features enabled.
 * null = no restriction (all features visible).
 * array = only these features are enabled for this school.
 */
function getSchoolFeatures() {
  try {
    const u = getCurrentUser();
    if (!u || !u.schoolId) return null;
    const raw = localStorage.getItem(u.schoolId + '_school_features');
    if (!raw) return null;
    const features = JSON.parse(raw);
    if (!Array.isArray(features) || !features.length) return null;
    return features;
  } catch { return null; }
}

// ── Teacher Permissions ───────────────────────────────
const DEFAULT_TEACHER_PERMS = {
  attendance:true, homework:true, timetable:true, exams:true,
  materials:true,  qpapers:true,  notices:true,   leaves:true, leaderboard:true,
};
function getTeacherPermsFor(teacherId) {
  const all = DB.getObj('teacher_permissions');
  return { ...DEFAULT_TEACHER_PERMS, ...(all[teacherId]||{}) };
}
function setTeacherPermsFor(teacherId, perms) {
  const all = DB.getObj('teacher_permissions');
  all[teacherId] = { ...DEFAULT_TEACHER_PERMS, ...perms };
  DB.set('teacher_permissions', all);
}
function getTeacherPerms(teacherId) { return teacherId ? getTeacherPermsFor(teacherId) : { ...DEFAULT_TEACHER_PERMS }; }

// ── Settings ──────────────────────────────────────────
function getSettings() { return DB.getObj('school_settings') }
function updateSettings(data) { DB.set('school_settings', { ...getSettings(), ...data }) }

// ── Grade ─────────────────────────────────────────────
function getGrade(pct) {
  if (pct>=90) return {grade:'A+',color:'#10b981',label:'Outstanding'};
  if (pct>=80) return {grade:'A', color:'#10b981',label:'Excellent'};
  if (pct>=70) return {grade:'B+',color:'#06b6d4',label:'Very Good'};
  if (pct>=60) return {grade:'B', color:'#06b6d4',label:'Good'};
  if (pct>=50) return {grade:'C', color:'#f59e0b',label:'Average'};
  if (pct>=33) return {grade:'D', color:'#f97316',label:'Below Average'};
  return {grade:'F',color:'#ef4444',label:'Fail'};
}

// ── Toast ─────────────────────────────────────────────
function toast(msg, type='info', title='') {
  const icons={success:'✅',error:'❌',warning:'⚠️',info:'ℹ️'};
  let box=document.getElementById('toast-container');
  if (!box) { box=document.createElement('div'); box.id='toast-container'; document.body.appendChild(box) }
  const t=document.createElement('div');
  t.className=`toast ${type}`;
  t.innerHTML=`<div class="toast-icon">${icons[type]}</div><div>${title?`<div class="toast-title">${title}</div>`:''}<div class="toast-text">${msg}</div></div>`;
  box.appendChild(t);
  setTimeout(()=>{ t.classList.add('removing'); setTimeout(()=>t.remove(),280) }, 3500);
}

// ── Modal ─────────────────────────────────────────────
function openModal(id)  { const m=document.getElementById(id); if(m){m.classList.add('open');document.body.style.overflow='hidden'} }
function closeModal(id) { const m=document.getElementById(id); if(m){m.classList.remove('open');document.body.style.overflow=''} }
function closeAllModals() { document.querySelectorAll('.modal-overlay.open').forEach(m=>m.classList.remove('open')); document.body.style.overflow='' }

// ── Persistent session restore ────────────────────────────────────────────
// Runs SYNCHRONOUSLY when utils.js loads — before requireAuth(), before any
// page script.  Three sources tried in order of reliability:
//
//  1. sessionStorage  — still alive (same WebView session, e.g. tab switch)
//  2. AndroidBridge   — Android SharedPreferences, never cleared by OS
//  3. localStorage    — web/PWA fallback with 30-day TTL
//
// This guarantees the user stays logged in after the app is closed/killed.
(function _restorePersistentSession() {
  try {
    // 1. Already in sessionStorage — nothing to do
    if (sessionStorage.getItem(_SESSION_KEY)) return;

    let userJson = null;

    // 2. Try Android native storage first (most reliable on the app)
    if (window.AndroidBridge) {
      try {
        const raw = window.AndroidBridge.getSession();
        if (raw && raw.length > 2) userJson = raw;
      } catch(e) {}
    }

    // 3. Fall back to localStorage (PWA / web browser)
    if (!userJson) {
      const raw = localStorage.getItem(_PERSIST_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && saved.schoolId) {
          const age = Date.now() - (saved._savedAt || 0);
          if (age > _SESSION_TTL) {
            localStorage.removeItem(_PERSIST_KEY);
          } else {
            const { _savedAt, ...u } = saved;
            userJson = JSON.stringify(u);
          }
        }
      }
    }

    if (!userJson) return;

    // Validate before restoring
    const user = JSON.parse(userJson);
    if (!user || !user.schoolId || !user.role) return;

    // Restore into sessionStorage so getCurrentUser() / requireAuth() work
    sessionStorage.setItem(_SESSION_KEY, JSON.stringify(user));

    // Also refresh localStorage TTL on each successful restore
    try {
      localStorage.setItem(_PERSIST_KEY, JSON.stringify({ ...user, _savedAt: Date.now() }));
    } catch(e) {}
  } catch(e) {}
})();
document.addEventListener('click', e => { if (e.target.classList.contains('modal-overlay')) closeAllModals(); });
function confirmAction(msg) { return window.confirm(msg) }

// ── Sidebar toggle ────────────────────────────────────
function initSidebar() {
  const sidebar = document.getElementById('sidebar');
  const toggle  = document.getElementById('sidebarToggle');
  if (!sidebar || !toggle) return;

  /* Create backdrop once */
  let backdrop = document.getElementById('sidebar-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.id        = 'sidebar-backdrop';
    backdrop.className = 'sidebar-backdrop';
    document.body.appendChild(backdrop);
  }
  // Start with pointer-events off so it never accidentally blocks content
  backdrop.style.pointerEvents = 'none';

  const isMobile = () => window.innerWidth <= 768;

  /* ── touchmove blocker ───────────────────────────────
     Prevents the BODY from scrolling while sidebar is open.
     We allow touches that originate inside the sidebar so
     the nav itself can still scroll.
     Using this instead of position:fixed on body because
     position:fixed destroys z-index stacking on mobile browsers. */
  const _blockScroll = (e) => {
    if (sidebar.contains(e.target)) return; // let sidebar scroll freely
    e.preventDefault();                     // block everything else
  };

  /* ── Open ─────────────────────────────────────────── */
  const openMobile = () => {
    if (sidebar.classList.contains('mobile-open')) return;
    // Activate will-change just before animating (GPU layer)
    sidebar.style.willChange = 'transform';
    sidebar.classList.add('mobile-open');
    backdrop.classList.add('show');
    // Backdrop receives pointer events only when visible
    backdrop.style.pointerEvents = 'auto';
    document.body.classList.add('sidebar-open');
    document.addEventListener('touchmove', _blockScroll, { passive: false });
    toggle.setAttribute('aria-expanded', 'true');
  };

  /* ── Close ────────────────────────────────────────── */
  const closeMobile = () => {
    if (!sidebar.classList.contains('mobile-open')) return;
    sidebar.classList.remove('mobile-open');
    backdrop.classList.remove('show');
    // Disable backdrop pointer events so it never blocks content clicks
    backdrop.style.pointerEvents = 'none';
    document.body.classList.remove('sidebar-open');
    document.removeEventListener('touchmove', _blockScroll);
    toggle.setAttribute('aria-expanded', 'false');
    // Release GPU layer after animation finishes
    setTimeout(() => { sidebar.style.willChange = 'auto'; }, 350);
  };

  /* ── Hamburger button ──────────────────────────────
     Mobile: slide the sidebar in/out.
     Desktop: collapse/expand the sidebar (icon-only ↔ full). */
  toggle.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isMobile()) {
      sidebar.classList.contains('mobile-open') ? closeMobile() : openMobile();
    } else {
      sidebar.classList.toggle('collapsed');
      try { localStorage.setItem('vm_sidebar_collapsed', sidebar.classList.contains('collapsed') ? '1' : '0'); } catch(e) {}
    }
  });

  /* Restore collapsed state on desktop */
  try {
    if (!isMobile() && localStorage.getItem('vm_sidebar_collapsed') === '1') sidebar.classList.add('collapsed');
  } catch(e) {}

  /* ── Tap backdrop → close ────────────────────────── */
  backdrop.addEventListener('click', closeMobile);
  backdrop.addEventListener('touchend', (e) => {
    e.preventDefault();
    closeMobile();
  }, { passive: false });

  /* ── Swipe sidebar LEFT → close ─────────────────── */
  let _tx = 0, _ty = 0;
  sidebar.addEventListener('touchstart', (e) => {
    _tx = e.touches[0].clientX;
    _ty = e.touches[0].clientY;
  }, { passive: true });
  sidebar.addEventListener('touchend', (e) => {
    if (!isMobile()) return;
    const dx = _tx - e.changedTouches[0].clientX;
    const dy = Math.abs(_ty - e.changedTouches[0].clientY);
    if (dx > 55 && dx > dy * 1.5) closeMobile(); // horizontal swipe only
  }, { passive: true });

  /* ── Nav item click → close ─────────────────────── */
  sidebar.querySelectorAll('.nav-item').forEach(n => {
    n.addEventListener('click', () => { if (isMobile()) closeMobile(); });
  });

  /* ── Resize to desktop → reset everything ───────── */
  window.addEventListener('resize', () => {
    if (!isMobile()) {
      sidebar.classList.remove('mobile-open');
      backdrop.classList.remove('show');
      document.body.classList.remove('sidebar-open');
      document.removeEventListener('touchmove', _blockScroll);
    }
  });
}

// ── Section renderer registry ─────────────────────────
window._sectionRenderers = {};

// ── activateNav ───────────────────────────────────────
function activateNav(sectionId) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const navItem = document.querySelector(`.nav-item[data-section="${sectionId}"]`);
  if (navItem) navItem.classList.add('active');

  // Explicitly set display to override any inline styles
  document.querySelectorAll('.section-content').forEach(s => {
    s.classList.remove('active');
    s.style.display = 'none';
  });
  const section = document.getElementById(`section-${sectionId}`);
  if (section) { section.classList.add('active'); section.style.display = 'block'; }

  const titleEl = document.getElementById('headerTitle');
  if (titleEl && navItem) titleEl.textContent = navItem.querySelector('.nav-label')?.textContent || '';

  // If navigating away from fees, stop the auto-refresh poll
  if (sectionId !== 'fees' && window._feeAutoRefresh) {
    clearInterval(window._feeAutoRefresh);
    window._feeAutoRefresh = null;
  }
  // Stop QR camera scanner when navigating away
  if (window._vmQRStop) window._vmQRStop();
  // Stop Paper Creator OCR camera when navigating away
  if (window._pcCleanup) window._pcCleanup();
  // Destroy Leaflet map + stop live GPS when leaving vehicles section
  if (sectionId !== 'vehicles' && window._destroyVehicleMap) window._destroyVehicleMap();
  // Destroy bus tracker map when leaving bustracker section
  if (sectionId !== 'bustracker' && window._destroyBusMap) window._destroyBusMap();
  // Reset gallery to albums-grid view when navigating back to gallery
  if (sectionId === 'gallery') window._galCurrentAlbum = null;

  if (window._sectionRenderers[sectionId]) window._sectionRenderers[sectionId]();

  // After section renders, re-apply light mode inline styles if active
  if (document.body.classList.contains('light-mode')) {
    requestAnimationFrame(function() { _applyLightModeDOM(); });
  }
}

function initNav() {
  document.querySelectorAll('.nav-item').forEach(nav => {
    nav.addEventListener('click', () => { const s=nav.dataset.section; if(s) activateNav(s) });
  });
}

// ── Print helper ──────────────────────────────────────
function printHtml(html, title='Print', extraCss='') {
  const w=window.open('','_blank','width=900,height=700');
  w.document.write(`<!DOCTYPE html><html><head><title>${title}</title>
  <style>
  *{box-sizing:border-box}
  body{font-family:Arial,sans-serif;padding:24px;color:#000;background:#fff;font-size:12pt}
  h1,h2{color:#6d28d9}table{width:100%;border-collapse:collapse}
  th,td{border:1px solid #ddd;padding:9px 12px}th{background:#f0e6ff}
  .no-print{display:none}@media print{.no-print{display:none}}
  ${extraCss}
  </style>
  </head><body>${html}
  <script>window.onload=()=>{window.print();setTimeout(()=>window.close(),900)}<\/script></body></html>`);
  w.document.close();
}

// ── File → base64 ─────────────────────────────────────
function fileToBase64(file) {
  return new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(file) });
}

// ── Generic modal builder ─────────────────────────────
function buildModal(id, title, bodyHtml, saveFn, size='') {
  const root=document.getElementById('modals-root');
  if (!root) return;
  root.innerHTML=`
    <div class="modal-overlay" id="${id}">
      <div class="modal ${size}">
        <div class="modal-header">
          <h3>${title}</h3>
          <button class="modal-close" onclick="closeModal('${id}')">✕</button>
        </div>
        <div class="modal-body">${bodyHtml}</div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeModal('${id}')">Cancel</button>
          <button class="btn btn-primary" id="modal-save-btn">💾 Save</button>
        </div>
      </div>
    </div>`;
  document.getElementById('modal-save-btn').onclick = saveFn;
  openModal(id);
}

// ── CSV Parser ────────────────────────────────────────
function parseCSV(text) {
  const lines = text.trim().split('\n').map(l => l.trim()).filter(l => l);
  if (!lines.length) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g,'').toLowerCase());
  return lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.trim().replace(/^["']|["']$/g,''));
    const obj = {};
    headers.forEach((h,i) => { obj[h] = vals[i]||''; });
    return obj;
  });
}

// ── Super Admin Utilities ─────────────────────────────
function getSuperAdminCreds() {
  return SA.getObj('creds') && SA.getObj('creds').username
    ? SA.getObj('creds')
    : { username:'superadmin', password:'super@123' };
}
function getSchools() { return SA.get('schools'); }
function addSchool(school) {
  const schools = SA.get('schools');
  schools.push(school);
  SA.set('schools', schools);
}
function updateSchool(id, data) {
  const schools = SA.get('schools');
  const i = schools.findIndex(s => s.id === id);
  if (i !== -1) { schools[i] = { ...schools[i], ...data }; SA.set('schools', schools); }
}

// ── Multi-school migration / init ─────────────────────
// ⚠️  IMPORTANT: This function uses localStorage.setItem() DIRECTLY — never SA.set()
//     SA.set() pushes to MySQL. We must NOT push default/init data to MySQL
//     because that would overwrite real school data added by the admin.
//     Only user-triggered actions (addSchool, updateSchool, etc.) push to MySQL.
function initMultiSchool() {
  // Read meta directly from localStorage (not SA.getObj which could trigger push)
  let meta = {};
  try { meta = JSON.parse(localStorage.getItem('_sa_meta')) || {}; } catch(e) {}

  // Already initialized on this device — skip
  if (meta.initialized) return;

  // Check if MySQL sync already loaded real schools into localStorage
  // If yes → don't overwrite with defaults, just mark initialized
  let existingSchools = [];
  try { existingSchools = JSON.parse(localStorage.getItem('_sa_schools')) || []; } catch(e) {}
  if (existingSchools.length > 0) {
    // Schools already synced from MySQL — just mark initialized and stop
    localStorage.setItem('_sa_meta', JSON.stringify({ ...meta, initialized: true }));
    return;
  }

  const SCHOOL_ID = 'sch001';
  const DATA_KEYS = [
    'students','teachers','classes','users','attendance','homework',
    'timetable','exams','marks','notices','leaves','materials','qpapers',
    'question_papers','curriculum','fees','fee_transactions','accounts',
    'salary_receipts','school_settings','teacher_permissions',
  ];

  if (localStorage.getItem('school_initialized')) {
    // Migrate old single-school data
    DATA_KEYS.forEach(key => {
      const raw = localStorage.getItem(key);
      if (raw && !localStorage.getItem(SCHOOL_ID + '_' + key)) {
        localStorage.setItem(SCHOOL_ID + '_' + key, raw);
      }
    });
    const usersKey = SCHOOL_ID + '_users';
    try {
      const users = JSON.parse(localStorage.getItem(usersKey) || '[]');
      const updated = users.map(u => u.schoolId ? u : { ...u, schoolId: SCHOOL_ID });
      localStorage.setItem(usersKey, JSON.stringify(updated));
    } catch(e) {}

    const settings = JSON.parse(localStorage.getItem('school_settings') || '{}');
    // Write directly to localStorage — NOT SA.set() — to avoid MySQL push
    localStorage.setItem('_sa_schools', JSON.stringify([{
      id: SCHOOL_ID, name: settings.schoolName || 'Excellence Academy',
      tagline: settings.schoolTagline || 'Knowledge · Integrity · Excellence',
      address: settings.schoolAddress || '', adminUsername: 'admin',
      adminPassword: 'admin123', createdAt: today(), status: 'active'
    }]));
  } else {
    // Truly fresh install — set defaults in localStorage ONLY (not MySQL)
    localStorage.setItem('_sa_schools', JSON.stringify([{
      id: SCHOOL_ID, name: 'Excellence Academy',
      tagline: 'Knowledge · Integrity · Excellence',
      address: '123 Education Road, Knowledge City',
      adminUsername: 'admin', adminPassword: 'admin123',
      createdAt: today(), status: 'active'
    }]));
    _initSchoolData(SCHOOL_ID);
  }

  // Mark initialized directly in localStorage — NOT SA.set()
  localStorage.setItem('_sa_meta', JSON.stringify({ ...meta, initialized: true }));
}

function _initSchoolData(schoolId) {
  const pfx = schoolId + '_';
  if (localStorage.getItem(pfx + 'school_initialized')) return;

  localStorage.setItem(pfx + 'school_settings', JSON.stringify({
    schoolName: 'Excellence Academy',
    schoolTagline: 'Knowledge · Integrity · Excellence',
    schoolAddress: '123 Education Road, Knowledge City - 400001',
    schoolPhone: '+91 9876543210',
    schoolEmail: 'info@excellenceacademy.edu.in',
    academicYear: '2024-25',
    currency: '₹',
  }));
  localStorage.setItem(pfx + 'teacher_permissions', JSON.stringify({}));

  const classes = [
    {id:'cls_001',name:'Class 6A',section:'A',grade:'6'},
    {id:'cls_002',name:'Class 7B',section:'B',grade:'7'},
    {id:'cls_003',name:'Class 8C',section:'C',grade:'8'},
  ];
  localStorage.setItem(pfx + 'classes', JSON.stringify(classes));

  const t1 = {id:'usr_teacher_001',role:'teacher',schoolId:schoolId,username:'teacher1',password:'teacher123',
    name:'Mrs. Priya Sharma',email:'priya@school.com',phone:'9988776655',
    subject:'Mathematics',qualification:'M.Sc. Mathematics',experience:'8 years',
    salary:45000,joinDate:'2020-06-01',address:'New Delhi',status:'active'};
  localStorage.setItem(pfx + 'teachers', JSON.stringify([t1]));

  const students = [
    {id:'usr_std_001',role:'student',schoolId:schoolId,username:'std001',password:'std123',name:'Aarav Singh',
     rollNo:'001',classId:'cls_001',fatherName:'Rajesh Singh',motherName:'Sunita Singh',
     dob:'2012-05-14',gender:'Male',phone:'9876543001',email:'aarav@student.com',
     address:'Delhi',feeTotal:12000,feePaid:8000,status:'active',joinDate:'2023-04-01'},
    {id:'usr_std_002',role:'student',schoolId:schoolId,username:'std002',password:'std123',name:'Diya Patel',
     rollNo:'002',classId:'cls_001',fatherName:'Amit Patel',motherName:'Neha Patel',
     dob:'2012-08-22',gender:'Female',phone:'9876543002',email:'diya@student.com',
     address:'Mumbai',feeTotal:12000,feePaid:12000,status:'active',joinDate:'2023-04-01'},
    {id:'usr_std_003',role:'student',schoolId:schoolId,username:'std003',password:'std123',name:'Karan Mehta',
     rollNo:'003',classId:'cls_002',fatherName:'Suresh Mehta',motherName:'Kavita Mehta',
     dob:'2011-03-30',gender:'Male',phone:'9876543003',email:'karan@student.com',
     address:'Ahmedabad',feeTotal:14000,feePaid:7000,status:'active',joinDate:'2023-04-01'},
  ];
  localStorage.setItem(pfx + 'students', JSON.stringify(students));

  const adminUser = {id:'usr_admin_001',role:'admin',schoolId:schoolId,username:'admin',password:'admin123',
    name:'School Administrator',email:'admin@school.com',phone:'9876543210'};
  localStorage.setItem(pfx + 'users', JSON.stringify([adminUser, t1, ...students]));

  localStorage.setItem(pfx + 'notices', JSON.stringify([
    {id:'ntc_001',title:'Annual Day Celebration',
     body:'Annual Day will be celebrated on 15th May 2025. All students must participate.',
     audience:'all',type:'general',date:today(),postedBy:'School Admin'},
    {id:'ntc_002',title:'Fee Submission Reminder',
     body:'Please submit your fees before 30th April to avoid late charges.',
     audience:'students',type:'info',date:today(),postedBy:'School Admin'},
  ]));

  const days=['Monday','Tuesday','Wednesday','Thursday','Friday'];
  const slots=['9:00-9:45','9:45-10:30','10:30-11:15','11:15-12:00','12:00-12:45','1:30-2:15','2:15-3:00'];
  const subs=['Mathematics','Science','English','Hindi','Social Studies','Computer','Art'];
  const tt=[];
  days.forEach(day=>slots.forEach((slot,i)=>{
    tt.push({id:genId('tt'),classId:'cls_001',day,slot,
      subject:i===4?'BREAK':subs[i%subs.length],teacher:i===4?'':'Mrs. Priya Sharma',isBreak:i===4});
  }));
  localStorage.setItem(pfx + 'timetable', JSON.stringify(tt));

  localStorage.setItem(pfx + 'exams', JSON.stringify([
    {id:'exam_001',name:'Unit Test 1',classId:'cls_001',subject:'Mathematics',maxMarks:100,date:'2025-04-10',type:'unit_test'},
    {id:'exam_002',name:'Mid Term',classId:'cls_001',subject:'Science',maxMarks:100,date:'2025-04-15',type:'mid_term'},
  ]));
  localStorage.setItem(pfx + 'marks', JSON.stringify([
    {id:'mrk_001',examId:'exam_001',studentId:'usr_std_001',obtained:78},
    {id:'mrk_002',examId:'exam_001',studentId:'usr_std_002',obtained:92},
    {id:'mrk_003',examId:'exam_002',studentId:'usr_std_001',obtained:85},
    {id:'mrk_004',examId:'exam_002',studentId:'usr_std_002',obtained:88},
  ]));
  localStorage.setItem(pfx + 'homework', JSON.stringify([
    {id:'hw_001',classId:'cls_001',subject:'Mathematics',title:'Chapter 5 Practice',
     description:'Solve Q1-Q15 from Ch. 5',dueDate:'2025-04-30',assignedBy:'Mrs. Priya Sharma',assignedOn:today()},
  ]));
  localStorage.setItem(pfx + 'fees', JSON.stringify([
    {id:'fee_001',studentId:'usr_std_001',feeType:'Tuition Fee',description:'Term 1',amount:6000,dueDate:'2025-04-30',status:'paid',paidDate:'2025-04-05'},
    {id:'fee_002',studentId:'usr_std_001',feeType:'Annual Fee',description:'Annual',amount:3000,dueDate:'2025-04-30',status:'pending'},
    {id:'fee_003',studentId:'usr_std_002',feeType:'Tuition Fee',description:'Term 1',amount:6000,dueDate:'2025-04-30',status:'paid',paidDate:'2025-04-03'},
    {id:'fee_004',studentId:'usr_std_002',feeType:'Annual Fee',description:'Annual',amount:3000,dueDate:'2025-04-30',status:'paid',paidDate:'2025-04-03'},
    {id:'fee_005',studentId:'usr_std_003',feeType:'Tuition Fee',description:'Term 1',amount:7000,dueDate:'2025-04-30',status:'pending'},
  ]));
  localStorage.setItem(pfx + 'fee_transactions', JSON.stringify([
    {id:'ft_001',studentId:'usr_std_001',amount:8000,method:'Cash',date:'2025-04-01',receiptNo:'RCP-001',note:'Term 1'},
    {id:'ft_002',studentId:'usr_std_002',amount:12000,method:'Online',date:'2025-04-01',receiptNo:'RCP-002',note:'Full Year'},
  ]));
  localStorage.setItem(pfx + 'accounts', JSON.stringify([
    {id:'acc_001',type:'income',category:'Fee',amount:27000,description:'Student fee collection',date:'2025-04-01'},
    {id:'acc_002',type:'expense',category:'Salary',amount:45000,description:'Teacher salary – April',date:'2025-04-05'},
  ]));
  localStorage.setItem(pfx + 'attendance', JSON.stringify([]));
  localStorage.setItem(pfx + 'leaves', JSON.stringify([
    {id:'lv_001',type:'student',studentId:'usr_std_001',classId:'cls_001',reason:'Fever',
     fromDate:'2025-04-22',toDate:'2025-04-23',status:'pending',appliedOn:today()},
  ]));
  localStorage.setItem(pfx + 'materials', JSON.stringify([]));
  localStorage.setItem(pfx + 'question_papers', JSON.stringify([]));
  localStorage.setItem(pfx + 'curriculum', JSON.stringify([]));
  localStorage.setItem(pfx + 'salary_receipts', JSON.stringify([
    {id:'sr_001',teacherId:'usr_teacher_001',month:'April 2025',
     basicSalary:45000,allowances:5000,deductions:2000,netSalary:48000,
     paidOn:today(),paidBy:'School Admin'},
  ]));
  localStorage.setItem(pfx + 'teacher_attendance', JSON.stringify([]));
  localStorage.setItem(pfx + 'teacher_tasks', JSON.stringify([]));
  localStorage.setItem(pfx + 'question_bank', JSON.stringify([]));
  localStorage.setItem(pfx + 'school_initialized', '1');
  localStorage.setItem(pfx + 'fee_payment_proofs', JSON.stringify([]));
  localStorage.setItem('school_initialized', '1'); // backward compat flag
}

// ── Fresh empty school (used for newly created schools — no demo data) ────────
function _initFreshSchool(schoolId, name, tagline, address) {
  const pfx = schoolId + '_';
  const settings = {
    schoolName:    name    || 'New School',
    schoolTagline: tagline || 'Excellence in Education',
    schoolAddress: address || '',
    schoolPhone:   '',
    schoolEmail:   '',
    academicYear:  '2024-25',
    currency:      '₹',
  };
  localStorage.setItem(pfx + 'school_settings', JSON.stringify(settings));

  // Empty stores — no demo data
  const EMPTY_KEYS = [
    'classes','students','teachers','users','attendance','homework',
    'timetable','exams','marks','notices','leaves','materials','qpapers',
    'question_papers','curriculum','fees','fee_transactions','accounts',
    'salary_receipts','question_bank','teacher_tasks','teacher_attendance',
    'cameras','vehicles','school_messages',
  ];
  EMPTY_KEYS.forEach(k => {
    if (!localStorage.getItem(pfx + k))
      localStorage.setItem(pfx + k, JSON.stringify([]));
  });
  localStorage.setItem(pfx + 'teacher_permissions', JSON.stringify({}));
  localStorage.setItem(pfx + 'school_initialized', '1');
}

// ── Push ALL data for a school to MySQL ───────────────
// Called after school creation so any device can sync and login
function _pushSchoolToMySQL(schoolId) {
  const pfx  = schoolId + '_';
  const KEYS = [
    'school_settings','users','classes','students','teachers',
    'attendance','homework','timetable','exams','marks','notices',
    'leaves','materials','question_papers','curriculum','fees',
    'fee_transactions','accounts','salary_receipts','question_bank',
    'teacher_tasks','teacher_attendance','teacher_permissions',
    'cameras','vehicles','school_messages',
  ];
  KEYS.forEach(k => {
    const raw = localStorage.getItem(pfx + k);
    if (raw !== null) {
      try { _dbPushToServer(schoolId, k, JSON.parse(raw)); } catch(e) {}
    }
  });
}

// Run multi-school initialization on every page load
initMultiSchool();

// ══════════════════════════════════════════════════════
//  PAYMENT MODAL — Shared across admin + student panels
//  _submitPaymentProof stays in student.js (needs CU)
// ══════════════════════════════════════════════════════
// ── Simple mobile-first payment modal ────────────────
// Flow: Pay Now → UPI App → Come back → Tap "Done, I've Paid" → School confirms
window._showPaymentModal = function(fee) {
  var s   = getSettings();
  var pc  = s.paymentConfig || {};
  var cur = s.currency || '₹';
  var isPreview = fee.id === '__preview__';
  var amt = parseFloat(fee.amount || 0);
  var feeId = fee.id || '';

  // Build UPI deep link (opens PhonePe / GPay / Paytm / any UPI app)
  var upiLink = '';
  if (pc.upiId) {
    upiLink = 'upi://pay?pa=' + encodeURIComponent(pc.upiId)
            + '&pn=' + encodeURIComponent(pc.upiName || s.schoolName || 'School')
            + (amt > 0 ? '&am=' + amt : '')
            + '&cu=INR'
            + '&tn=' + encodeURIComponent(fee.feeType || 'School Fee');
  }

  var existing = document.getElementById('_pay_modal_overlay');
  if (existing) existing.remove();

  var overlay = document.createElement('div');
  overlay.id = '_pay_modal_overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.65);'
    + 'display:flex;align-items:flex-end;justify-content:center;animation:_pFadeIn .2s ease;';

  // Show amount badge prominently
  var amtHtml = amt > 0
    ? '<div style="font-size:2.4rem;font-weight:900;color:#fff;line-height:1;margin:6px 0 2px;">'
      + cur + amt.toLocaleString()
      + '</div><div style="font-size:.75rem;color:rgba(255,255,255,.45);">' + (fee.feeType||'School Fee') + (fee.description?' · '+fee.description:'') + '</div>'
    : '<div style="font-size:1rem;font-weight:700;color:#fff;">' + (fee.feeType||'School Fee') + '</div>';

  // Build UPI open button
  var upiBtn = upiLink
    ? '<a href="' + upiLink + '" id="_pay_upi_btn" style="display:flex;align-items:center;justify-content:center;gap:10px;'
      + 'background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;border-radius:18px;'
      + 'padding:18px 24px;font-weight:900;font-size:1.1rem;text-decoration:none;'
      + 'box-shadow:0 6px 24px rgba(124,58,237,.5);margin-bottom:10px;width:100%;box-sizing:border-box;"'
      + ' onclick="_payOpenedUpi(\'' + feeId + '\')">'
      + '<span style="font-size:1.5rem;">📱</span>'
      + '<span>Pay ' + (amt>0?cur+amt.toLocaleString():'') + ' via UPI</span>'
      + '</a>'
      + '<div style="text-align:center;font-size:.72rem;color:rgba(255,255,255,.3);margin-bottom:20px;">'
      + 'Opens PhonePe · GPay · Paytm · BHIM · any UPI app</div>'
    : '';

  // UPI ID copy row (shown always if UPI exists)
  var upiIdRow = pc.upiId
    ? '<div style="display:flex;align-items:center;justify-content:space-between;'
      + 'background:rgba(255,255,255,.07);border-radius:12px;padding:10px 14px;margin-bottom:14px;">'
      + '<div><div style="font-size:.65rem;color:rgba(255,255,255,.4);margin-bottom:2px;">UPI ID</div>'
      + '<div style="font-size:.95rem;font-weight:700;color:#fff;font-family:monospace;">' + pc.upiId + '</div></div>'
      + '<button onclick="_payCopy(\'' + pc.upiId.replace(/'/g,"\\'") + '\',\'UPI ID\')" '
      + 'style="background:rgba(124,58,237,.25);color:#a78bfa;border:1px solid rgba(124,58,237,.4);'
      + 'border-radius:9px;padding:7px 14px;font-size:.8rem;font-weight:700;white-space:nowrap;">📋 Copy</button>'
      + '</div>'
    : '';

  // QR code (if admin uploaded one)
  var qrHtml = pc.qrCode
    ? '<div style="display:flex;justify-content:center;margin-bottom:16px;">'
      + '<div style="background:#fff;padding:10px;border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,.4);display:inline-block;">'
      + '<img src="' + pc.qrCode + '" style="width:180px;height:180px;object-fit:contain;display:block;">'
      + '</div></div>'
      + '<div style="text-align:center;font-size:.75rem;color:rgba(255,255,255,.3);margin-bottom:14px;">Scan with any UPI app</div>'
    : '';

  // Bank details (compact, collapsible via toggle)
  var bankHtml = '';
  if (pc.accNo) {
    var bankRows = [['Account Name',pc.accName],['Account No.',pc.accNo],['IFSC',pc.ifsc],['Bank',pc.bankName]]
      .filter(function(r){return r[1];})
      .map(function(r){
        return '<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.05);">'
          + '<div><div style="font-size:.65rem;color:rgba(255,255,255,.35);">' + r[0] + '</div>'
          + '<div style="font-size:.88rem;font-weight:700;color:#fff;">' + r[1] + '</div></div>'
          + '<button onclick="_payCopy(\'' + String(r[1]).replace(/'/g,"\\'") + '\',\'' + r[0] + '\')" '
          + 'style="background:rgba(6,182,212,.15);color:#06b6d4;border:1px solid rgba(6,182,212,.3);'
          + 'border-radius:7px;padding:5px 10px;font-size:.7rem;font-weight:700;">📋</button>'
          + '</div>';
      }).join('');
    if (bankRows) {
      bankHtml = '<details style="margin-bottom:14px;"><summary style="color:rgba(255,255,255,.4);font-size:.8rem;cursor:pointer;list-style:none;padding:8px 0;">'
        + '🏦 Pay via Bank Transfer instead ▸</summary>'
        + '<div style="background:rgba(6,182,212,.05);border:1px solid rgba(6,182,212,.15);border-radius:12px;padding:12px 14px;margin-top:8px;">'
        + bankRows + '</div></details>';
    }
  }

  // "Done, I've Paid" button — the main action after paying
  var doneBtn = !isPreview
    ? '<div id="_pay_step2" style="display:none;">'
      + '<div style="font-size:.72rem;color:rgba(255,255,255,.4);text-align:center;margin-bottom:12px;">Payment done in your UPI app?</div>'
      + '<button onclick="_submitPaymentProof(\'' + feeId + '\',\'done\')" '
      + 'style="width:100%;background:linear-gradient(135deg,#10b981,#059669);color:#fff;border:none;'
      + 'border-radius:18px;padding:18px;font-weight:900;font-size:1.1rem;cursor:pointer;'
      + 'box-shadow:0 6px 24px rgba(16,185,129,.45);display:flex;align-items:center;justify-content:center;gap:10px;">'
      + '<span style="font-size:1.4rem;">✅</span><span>Done! I\'ve Paid</span>'
      + '</button>'
      + '<div style="text-align:center;font-size:.7rem;color:rgba(255,255,255,.25);margin-top:8px;">School will confirm your payment shortly</div>'
      + '</div>'
      + '<button id="_pay_ipaid_trigger" onclick="_payShowDone()" '
      + 'style="width:100%;background:rgba(16,185,129,.12);color:#10b981;border:1.5px solid rgba(16,185,129,.3);'
      + 'border-radius:18px;padding:16px;font-weight:800;font-size:1rem;cursor:pointer;margin-top:4px;">'
      + '✅ I\'ve Paid — Tap Here'
      + '</button>'
    : '<div style="text-align:center;padding:12px;color:rgba(255,255,255,.3);font-size:.8rem;font-style:italic;">'
      + 'Students will tap "I\'ve Paid" here after paying</div>';

  overlay.innerHTML = '<style>'
    + '@keyframes _pFadeIn{from{opacity:0}to{opacity:1}}'
    + '@keyframes _pSlideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}'
    + '#_pay_box{animation:_pSlideUp .28s cubic-bezier(.22,1,.36,1);}'
    + '</style>'
    + '<div id="_pay_box" style="background:#111827;border-radius:28px 28px 0 0;width:100%;max-width:480px;'
    + 'max-height:90vh;overflow-y:auto;border-top:2px solid rgba(124,58,237,.5);'
    + 'box-shadow:0 -24px 60px rgba(0,0,0,.7);padding:0 0 32px;">'

    // Handle + close
    + '<div style="display:flex;justify-content:space-between;align-items:center;padding:14px 20px 0;">'
    + '<div style="width:40px;height:4px;background:rgba(255,255,255,.15);border-radius:4px;margin:auto;"></div>'
    + '</div>'
    + '<div style="display:flex;justify-content:flex-end;padding:0 16px;">'
    + '<button onclick="document.getElementById(\'_pay_modal_overlay\').remove()" '
    + 'style="background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.1);color:rgba(255,255,255,.5);'
    + 'border-radius:50%;width:30px;height:30px;font-size:14px;cursor:pointer;line-height:1;">✕</button>'
    + '</div>'

    // Amount display
    + '<div style="text-align:center;padding:8px 24px 20px;border-bottom:1px solid rgba(255,255,255,.06);">'
    + amtHtml
    + '</div>'

    // Payment options
    + '<div style="padding:20px 20px 0;">'
    + qrHtml
    + upiBtn
    + upiIdRow
    + bankHtml
    + (pc.note ? '<div style="background:rgba(245,158,11,.07);border:1px solid rgba(245,158,11,.18);border-radius:10px;padding:10px 14px;font-size:.8rem;color:rgba(255,255,255,.55);margin-bottom:16px;">📝 ' + pc.note + '</div>' : '')
    + doneBtn
    + '</div>'
    + '</div>';

  document.body.appendChild(overlay);
  overlay.addEventListener('click', function(e){ if(e.target===overlay) overlay.remove(); });
};

// After tapping UPI button → show the "I've Paid" confirm button
window._payOpenedUpi = function(feeId) {
  setTimeout(function() {
    var step2 = document.getElementById('_pay_step2');
    var trigger = document.getElementById('_pay_ipaid_trigger');
    if (step2) step2.style.display = 'block';
    if (trigger) trigger.style.display = 'none';
  }, 800);
};

window._payShowDone = function() {
  var step2   = document.getElementById('_pay_step2');
  var trigger = document.getElementById('_pay_ipaid_trigger');
  if (step2) step2.style.display = 'block';
  if (trigger) trigger.style.display = 'none';
};

window._payCopy = function(text, label) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function(){ toast('📋 ' + label + ' copied!', 'success'); });
  } else {
    var ta = document.createElement('textarea');
    ta.value = text; ta.style.cssText = 'position:fixed;opacity:0;';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); toast('📋 ' + label + ' copied!', 'success'); } catch(e){}
    ta.remove();
  }
};

// Safe onclick wrapper — avoids JSON double-quote conflict inside onclick=""
// Usage in onclick: _payFeeOnline('fee_001')
window._payFeeOnline = function(feeId) {
  const fee = DB.get('fees').find(function(f){ return f.id === feeId; });
  if (fee) {
    window._showPaymentModal(fee);
  } else {
    // Fallback: open modal with just the ID
    window._showPaymentModal({ id: feeId, feeType: 'School Fee', amount: 0, description: '' });
  }
};

// ══════════════════════════════════════════════════════
//  LIGHT MODE  —  Three-layer fix
//  Layer 1: Inline <style> in every HTML file (never cached)
//  Layer 2: JS-injected <style> (bypasses CSS file cache)
//  Layer 3: Direct element.style DOM manipulation (highest priority)
//           + MutationObserver for dynamically rendered sections
// ══════════════════════════════════════════════════════

/* ─── Layer 3 helper: directly set inline styles on elements ─── */
// Uses setProperty for reliable vendor-prefix support in WebView
const _VM_LIGHT_STYLES = {
  '.stat-card':     { background:'#ffffff', 'box-shadow':'0 2px 16px rgba(100,116,139,.12)', border:'1px solid rgba(100,116,139,.14)' },
  '.card':          { background:'#ffffff', 'box-shadow':'0 2px 12px rgba(100,116,139,.10)', border:'1px solid rgba(100,116,139,.14)' },
  '.app-header':    { background:'#ffffff', 'box-shadow':'0 1px 12px rgba(100,116,139,.10)' },
  '.sidebar':       { background:'#ffffff', 'box-shadow':'2px 0 16px rgba(100,116,139,.10)' },
  '.modal':         { background:'#ffffff' },
  '.toast':         { background:'#ffffff' },
  '.q-action':      { background:'#ffffff' },
  '.orb':           { display:'none' },
  '.material-item': { background:'#ffffff' },
  '.login-box':     { background:'#ffffff' },
  '.role-card':     { background:'#f8faff' },
  '.tabs':          { background:'#f1f5fb' },
};

function _vmKillBackdrop(el) {
  el.style.setProperty('backdrop-filter', 'none', 'important');
  el.style.setProperty('-webkit-backdrop-filter', 'none', 'important');
}

function _applyLightModeDOM(root) {
  root = root || document;
  // Apply per-selector styles
  Object.entries(_VM_LIGHT_STYLES).forEach(function(entry) {
    var sel = entry[0], styles = entry[1];
    root.querySelectorAll(sel).forEach(function(el) {
      Object.keys(styles).forEach(function(prop) {
        el.style.setProperty(prop, styles[prop], 'important');
      });
      _vmKillBackdrop(el);
    });
  });
  // Belt-and-suspenders: kill backdrop-filter on EVERY element
  root.querySelectorAll('*').forEach(function(el) {
    _vmKillBackdrop(el);
  });
}

function _removeLightModeDOM(root) {
  root = root || document;
  var allSelectors = Object.keys(_VM_LIGHT_STYLES).join(',');
  root.querySelectorAll(allSelectors).forEach(function(el) {
    ['background','box-shadow','border','display'].forEach(function(p) {
      el.style.removeProperty(p);
    });
    el.style.removeProperty('backdrop-filter');
    el.style.removeProperty('-webkit-backdrop-filter');
  });
  root.querySelectorAll('*').forEach(function(el) {
    el.style.removeProperty('backdrop-filter');
    el.style.removeProperty('-webkit-backdrop-filter');
  });
}

let _vmObserver = null;
function _vmStartObserver() {
  if (_vmObserver) return;
  _vmObserver = new MutationObserver(function(mutations) {
    if (!document.body.classList.contains('light-mode')) return;
    mutations.forEach(function(m) {
      m.addedNodes.forEach(function(node) {
        if (node.nodeType !== 1) return;
        // Apply to newly added node and its descendants
        _applyLightModeDOM(node.parentElement || node);
      });
    });
  });
  _vmObserver.observe(document.body, { childList: true, subtree: true });
}
function _vmStopObserver() {
  if (_vmObserver) { _vmObserver.disconnect(); _vmObserver = null; }
}

/* ─── Layer 2: JS-injected <style> (bypasses CSS file cache) ─── */
function _vmInjectLightCSS() {
  if (document.getElementById('_vm_light')) return; // already injected
  const s = document.createElement('style');
  s.id = '_vm_light';
  s.textContent = `
/* ── Kill all backdrop-filter: blurs dark orb behind cards ── */
body.light-mode .orb { display:none!important }
body.light-mode * { backdrop-filter:none!important; -webkit-backdrop-filter:none!important }
body.light-mode .modal-overlay {
  backdrop-filter:blur(6px)!important;
  -webkit-backdrop-filter:blur(6px)!important
}
/* ── Background ── */
body.light-mode { background:#f1f5fb!important; color:#1e293b!important }
/* ── Stat Cards ── */
body.light-mode .stat-card {
  background:#ffffff!important;
  border:1px solid rgba(100,116,139,.14)!important;
  box-shadow:0 2px 16px rgba(100,116,139,.12),0 1px 4px rgba(100,116,139,.06)!important
}
body.light-mode .stat-value { color:#1e293b!important }
body.light-mode .stat-label { color:rgba(30,41,59,.60)!important }
/* ── Cards ── */
body.light-mode .card {
  background:#ffffff!important;
  border:1px solid rgba(100,116,139,.14)!important;
  box-shadow:0 2px 12px rgba(100,116,139,.10)!important
}
body.light-mode .card-header {
  background:rgba(124,58,237,.03)!important;
  border-bottom-color:rgba(100,116,139,.12)!important
}
body.light-mode .card-header h3,
body.light-mode .page-header h2 { color:#1e293b!important }
/* ── Header ── */
body.light-mode .app-header {
  background:#ffffff!important;
  border-bottom:1px solid rgba(100,116,139,.12)!important;
  box-shadow:0 1px 12px rgba(100,116,139,.10)!important
}
body.light-mode .header-title { color:#1e293b!important }
/* ── Sidebar ── */
body.light-mode .sidebar {
  background:#ffffff!important;
  border-right:1px solid rgba(100,116,139,.14)!important;
  box-shadow:2px 0 16px rgba(100,116,139,.10)!important
}
body.light-mode .nav-item { color:rgba(30,41,59,.62)!important }
body.light-mode .nav-item:hover { background:rgba(124,58,237,.08)!important; color:#4c1d95!important }
body.light-mode .nav-item.active {
  background:rgba(124,58,237,.12)!important;
  color:#5b21b6!important;
  box-shadow:inset 3px 0 0 #7c3aed!important
}
body.light-mode .nav-section-label { color:rgba(30,41,59,.38)!important }
body.light-mode .user-name { color:#1e293b!important }
/* ── Modal & Toast ── */
body.light-mode .modal {
  background:#ffffff!important;
  border:1px solid rgba(100,116,139,.16)!important;
  box-shadow:0 24px 64px rgba(15,23,42,.18)!important
}
body.light-mode .modal-header { background:rgba(124,58,237,.03)!important; border-bottom-color:rgba(100,116,139,.12)!important }
body.light-mode .modal-header h3 { color:#1e293b!important }
body.light-mode .modal-footer { border-top-color:rgba(100,116,139,.12)!important }
body.light-mode .toast {
  background:#ffffff!important;
  border:1px solid rgba(100,116,139,.16)!important;
  box-shadow:0 8px 32px rgba(15,23,42,.12)!important
}
body.light-mode .toast-title { color:#1e293b!important }
body.light-mode .toast-text  { color:rgba(30,41,59,.65)!important }
/* ── Quick Actions ── */
body.light-mode .q-action {
  background:#ffffff!important;
  border:1px solid rgba(100,116,139,.14)!important;
  box-shadow:0 2px 10px rgba(100,116,139,.08)!important
}
body.light-mode .q-action .qa-label { color:rgba(30,41,59,.65)!important }
/* ── Tables ── */
body.light-mode thead th {
  background:rgba(124,58,237,.05)!important;
  color:rgba(30,41,59,.52)!important;
  border-bottom-color:rgba(100,116,139,.14)!important
}
body.light-mode tbody tr { border-bottom-color:rgba(100,116,139,.10)!important }
body.light-mode tbody tr:hover { background:rgba(124,58,237,.04)!important }
body.light-mode tbody td { color:rgba(30,41,59,.70)!important }
body.light-mode tbody td strong { color:#1e293b!important }
/* ── Form Controls ── */
body.light-mode .form-control {
  background:#ffffff!important;
  color:#1e293b!important;
  border-color:rgba(100,116,139,.22)!important
}
body.light-mode .form-control::placeholder { color:rgba(30,41,59,.35)!important }
body.light-mode .search-box {
  background:#ffffff!important;
  border-color:rgba(100,116,139,.20)!important
}
body.light-mode .search-box input { color:#1e293b!important }
body.light-mode .form-label { color:rgba(30,41,59,.65)!important }
/* ── Buttons ── */
body.light-mode .btn-secondary {
  background:#ffffff!important;
  color:#334155!important;
  border-color:rgba(100,116,139,.22)!important
}
body.light-mode .btn-icon {
  background:#ffffff!important;
  color:#334155!important;
  border-color:rgba(100,116,139,.20)!important
}
/* ── Attendance ── */
body.light-mode .att-student {
  background:#ffffff!important;
  border-color:rgba(100,116,139,.18)!important
}
body.light-mode .att-name { color:#1e293b!important }
body.light-mode .att-student.present { background:rgba(16,185,129,.08)!important; border-color:rgba(16,185,129,.30)!important }
body.light-mode .att-student.absent  { background:rgba(239,68,68,.08)!important;  border-color:rgba(239,68,68,.30)!important }
body.light-mode .att-student.late    { background:rgba(245,158,11,.08)!important; border-color:rgba(245,158,11,.30)!important }
/* ── Tabs & Chips ── */
body.light-mode .tabs { background:#f1f5fb!important; border-color:rgba(100,116,139,.16)!important }
body.light-mode .tab  { color:rgba(30,41,59,.60)!important }
body.light-mode .chip { background:#f1f5fb!important; color:rgba(30,41,59,.68)!important }
/* ── Study Materials ── */
body.light-mode .material-item { background:#ffffff!important; border-color:rgba(100,116,139,.14)!important }
body.light-mode .qa-item,body.light-mode .lib-qa-item { background:#f8faff!important }
body.light-mode .qa-q,body.light-mode .lib-qa-q { color:#1e293b!important }
body.light-mode .qa-a,body.light-mode .lib-qa-a { color:#6d28d9!important }
/* ── Login Box ── */
body.light-mode .login-box {
  background:#ffffff!important;
  border-color:rgba(124,58,237,.15)!important;
  box-shadow:0 20px 60px rgba(124,58,237,.10)!important
}
body.light-mode .role-card { background:#f8faff!important; border-color:rgba(100,116,139,.18)!important }
body.light-mode .role-card.active { background:rgba(124,58,237,.10)!important; border-color:#7c3aed!important }
body.light-mode .role-card .r-name { color:rgba(30,41,59,.62)!important }
/* ── Progress bar track ── */
body.light-mode .progress { background:rgba(0,0,0,.07)!important }
/* ── Badges ── */
body.light-mode .badge-gray { background:#f1f5fb!important; color:rgba(30,41,59,.68)!important; border-color:rgba(100,116,139,.18)!important }
/* ── Scrollbar ── */
body.light-mode ::-webkit-scrollbar-track { background:#e6edf8!important }
body.light-mode ::-webkit-scrollbar-thumb { background:rgba(100,116,139,.30)!important }
`;
  document.head.appendChild(s);
}

function _vmRemoveLightCSS() {
  const el = document.getElementById('_vm_light');
  if (el) el.remove();
}

/* ─── Master enable / disable (call these everywhere) ─── */
function _vmEnableLightMode() {
  _vmInjectLightCSS();           // Layer 2: injected <style>
  // Layer 3: run DOM manipulation after a short delay so rendered content is present
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      _applyLightModeDOM();
      _vmStartObserver();
    });
  } else {
    _applyLightModeDOM();
    _vmStartObserver();
  }
}

function _vmDisableLightMode() {
  _vmRemoveLightCSS();           // Layer 2: remove injected <style>
  _removeLightModeDOM();         // Layer 3: remove inline overrides
  _vmStopObserver();             // Stop watching for new nodes
}

// Auto-apply on load
(function() {
  if (localStorage.getItem('vm_theme') === 'light') _vmEnableLightMode();
})();

// ══════════════════════════════════════════════════════
//  CHAT SYSTEM  (shared across admin / teacher / student)
//
//  Data key: 'chat_threads'
//  Thread: { id, p:[{id,name,role}x2], msgs:[{id,from,fromName,text,time,readBy:[]}], lastMsg, lastTime }
//  Roles: 'admin' | 'teacher' | 'parent'
// ══════════════════════════════════════════════════════
var _CHAT_DB = 'chat_threads';

function _chatAll()          { return DB.get(_CHAT_DB) || []; }
function _chatSave(threads)  { DB.set(_CHAT_DB, threads); }
function _chatGetById(tid)   { return _chatAll().find(function(t){ return t.id===tid; }); }

function _chatMyThreads(myId) {
  return _chatAll()
    .filter(function(t){ return t.p && t.p.some(function(p){ return p.id===myId; }); })
    .sort(function(a,b){ return (b.lastTime||'').localeCompare(a.lastTime||''); });
}

function _chatBetween(id1, id2) {
  return _chatAll().find(function(t){
    if (!t.p || t.p.length<2) return false;
    var ids = t.p.map(function(p){ return p.id; });
    return ids.indexOf(id1)>-1 && ids.indexOf(id2)>-1;
  });
}

function _chatCreate(u1, u2) {
  var ex = _chatBetween(u1.id, u2.id);
  if (ex) return ex;
  var t = { id:genId('ct'), p:[u1,u2], msgs:[], lastMsg:'', lastTime:'' };
  var all = _chatAll(); all.push(t); _chatSave(all);
  return t;
}

function _chatAddMsg(threadId, sender, text) {
  var all = _chatAll();
  var idx = -1;
  for (var i=0;i<all.length;i++) { if (all[i].id===threadId){ idx=i; break; } }
  if (idx===-1) return null;
  var msg = { id:genId('cm'), from:sender.id, fromName:sender.name, text:text.trim(), time:new Date().toISOString(), readBy:[sender.id] };
  all[idx].msgs.push(msg);
  all[idx].lastMsg  = text.trim();
  all[idx].lastTime = msg.time;
  _chatSave(all);
  return msg;
}

function _chatMarkRead(threadId, myId) {
  var all = _chatAll(), idx=-1;
  for (var i=0;i<all.length;i++){if(all[i].id===threadId){idx=i;break;}}
  if (idx===-1) return;
  var changed=false;
  all[idx].msgs.forEach(function(m){
    if (m.from!==myId && (m.readBy||[]).indexOf(myId)===-1){ (m.readBy=m.readBy||[]).push(myId); changed=true; }
  });
  if (changed) _chatSave(all);
}

function _chatUnread(myId) {
  return _chatMyThreads(myId).reduce(function(n,t){
    return n + t.msgs.filter(function(m){ return m.from!==myId && (m.readBy||[]).indexOf(myId)===-1; }).length;
  }, 0);
}

function _chatFmtTime(iso) {
  if (!iso) return '';
  try {
    var d=new Date(iso), now=new Date(), diff=now-d;
    if (isNaN(diff)) return '';
    if (diff<60000)      return 'Just now';
    if (diff<3600000)    return Math.floor(diff/60000)+'m ago';
    if (diff<86400000)   return d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
    if (diff<604800000)  return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()];
    return d.toLocaleDateString([],{day:'2-digit',month:'short'});
  } catch(e){ return ''; }
}

// Render all bubble messages for a thread
function _chatMsgsHtml(thread, myId) {
  if (!thread || !thread.msgs || !thread.msgs.length) return (
    '<div style="flex:1;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:8px;color:var(--text-3)">' +
    '<div style="font-size:3rem">💬</div><div style="font-size:13px">No messages yet — say hi!</div></div>'
  );
  var lastDate='';
  return thread.msgs.map(function(m){
    var mine = m.from===myId;
    var d=new Date(m.time);
    var ds=isNaN(d)?'':d.toLocaleDateString([],{weekday:'short',day:'numeric',month:'short'});
    var divider='';
    if (ds && ds!==lastDate){ lastDate=ds;
      divider='<div style="text-align:center;margin:14px 0 10px;font-size:11px;color:var(--text-3)">'+
               '<span style="background:rgba(255,255,255,.07);padding:3px 14px;border-radius:999px">'+ds+'</span></div>';
    }
    var ts=isNaN(d)?'':d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
    var txt=m.text.replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
    return divider+
      '<div style="display:flex;flex-direction:column;align-items:'+(mine?'flex-end':'flex-start')+';margin-bottom:10px">'+
        (!mine?'<div style="font-size:10px;color:var(--text-3);margin-bottom:3px;padding:0 4px">'+m.fromName+'</div>':'')+
        '<div style="max-width:72%;padding:10px 14px;word-break:break-word;font-size:14px;line-height:1.5;'+
             'border-radius:'+(mine?'18px 18px 4px 18px':'18px 18px 18px 4px')+';'+
             'background:'+(mine?'linear-gradient(135deg,rgba(124,58,237,.5),rgba(99,102,241,.4))':'rgba(255,255,255,.07)')+';'+
             'border:1px solid '+(mine?'rgba(124,58,237,.4)':'rgba(255,255,255,.1)')+'">'+txt+'</div>'+
        '<div style="font-size:10px;color:var(--text-3);margin-top:3px;padding:0 4px">'+ts+'</div>'+
      '</div>';
  }).join('');
}

// Build one sidebar thread item
function _chatThreadItem(thread, myId, activeId, clickFn) {
  var other = thread.p.find(function(p){ return p.id!==myId; }) || thread.p[0];
  var unread = thread.msgs.filter(function(m){ return m.from!==myId && (m.readBy||[]).indexOf(myId)===-1; }).length;
  var active = thread.id===activeId;
  var colors=['#7c3aed','#06b6d4','#10b981','#f59e0b','#ec4899','#ef4444'];
  var col=colors[(other.name||'?').charCodeAt(0)%colors.length];
  var roleLabel={'admin':'👑 Admin','teacher':'👩‍🏫 Teacher','parent':'👨‍👩‍👦 Parent'}[other.role]||other.role;
  return '<div id="_vc_item_'+thread.id+'" onclick="'+clickFn+'(\''+thread.id+'\')" '+
    'style="display:flex;align-items:center;gap:10px;padding:12px 14px;cursor:pointer;border-bottom:1px solid rgba(255,255,255,.05);transition:background .15s;'+
    (active?'background:rgba(124,58,237,.18);':'background:transparent;')+'" '+
    'onmouseover="if(this.id!==\'_vc_item_'+thread.id+'\'||\''+thread.id+'\'!==\''+activeId+'\')this.style.background=\'rgba(255,255,255,.04)\'" '+
    'onmouseout="this.style.background=\''+(active?'rgba(124,58,237,.18)':'transparent')+'\'">' +
      '<div style="width:42px;height:42px;border-radius:50%;background:'+col+';display:flex;align-items:center;justify-content:center;font-weight:700;font-size:1.05rem;color:#fff;flex-shrink:0;position:relative">'+
        (other.name||'?')[0].toUpperCase()+
        (unread>0?'<span style="position:absolute;top:-2px;right:-2px;background:#ef4444;color:#fff;border-radius:999px;font-size:9px;padding:1px 5px;font-weight:700">'+unread+'</span>':'')+
      '</div>'+
      '<div style="flex:1;min-width:0">'+
        '<div style="display:flex;justify-content:space-between;align-items:center;gap:4px">'+
          '<div style="font-weight:'+(unread?'700':'600')+';font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+(other.name||'?')+'</div>'+
          '<div style="font-size:10px;color:var(--text-3);flex-shrink:0" id="_vc_time_'+thread.id+'">'+_chatFmtTime(thread.lastTime)+'</div>'+
        '</div>'+
        '<div style="font-size:11px;color:var(--text-3);margin-top:1px">'+roleLabel+'</div>'+
        '<div style="font-size:12px;color:var(--text-3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:1px" id="_vc_prev_'+thread.id+'">'+
          (thread.lastMsg?thread.lastMsg.slice(0,50):'No messages yet')+'</div>'+
      '</div>'+
  '</div>';
}

// Global send function — called from onclick, no full re-render
window._vmChatSend = function(threadId, myId, myName, myRole, inputId) {
  var inp=document.getElementById(inputId);
  if (!inp) return;
  var text=inp.value.trim();
  if (!text) return;
  _chatAddMsg(threadId, {id:myId, name:myName, role:myRole}, text);
  _chatMarkRead(threadId, myId);
  inp.value=''; inp.style.height='auto'; inp.focus();
  // Update messages pane
  var thread=_chatGetById(threadId);
  var msgsEl=document.getElementById('_vc_msgs');
  if (msgsEl && thread){ msgsEl.innerHTML=_chatMsgsHtml(thread,myId); msgsEl.scrollTop=msgsEl.scrollHeight; }
  // Update sidebar preview + time
  var prevEl=document.getElementById('_vc_prev_'+threadId);
  if (prevEl) prevEl.textContent=text.slice(0,50);
  var timeEl=document.getElementById('_vc_time_'+threadId);
  if (timeEl) timeEl.textContent='Just now';
  // Update nav badges
  ['admin-msg-badge','tch-msg-badge','std-msg-badge'].forEach(function(bid){
    var b=document.getElementById(bid);
    if (b){ var n=_chatUnread(myId); b.style.display=n?'inline':'none'; b.textContent=n; }
  });
};

// Auto-grow textarea
window._vmChatResize = function(el) {
  el.style.height='auto';
  el.style.height=Math.min(el.scrollHeight,120)+'px';
};

// ══════════════════════════════════════════════════════
//  MOBILE KEYBOARD — FIELD VISIBLE ABOVE KEYBOARD
//
//  Jab bhi koi input/textarea/select/contenteditable
//  focus hota hai, field keyboard ke upar aa jata hai.
//
//  Algorithm:
//    visualViewport.height = keyboard ke upar jo area
//    dikh raha hai uski height.
//    Agar field ka bottom us height se neeche hai to
//    page ko utna scroll karo ki field 24px upar aa jaye.
// ══════════════════════════════════════════════════════
(function _vmKbdFix() {
  // Only on touch devices
  if (!('ontouchstart' in window) && !(navigator.maxTouchPoints > 0)) return;

  var _focused = null; // currently focused element

  // Check if element is an editable field
  function _isField(el) {
    if (!el) return false;
    var t = el.tagName;
    return t==='INPUT' || t==='TEXTAREA' || t==='SELECT' || el.contentEditable==='true';
  }

  // Core scroll logic — bring el above keyboard with 24px gap
  function _bringAboveKeyboard(el) {
    if (!el || document.activeElement !== el) return;

    if (window.visualViewport) {
      var vp    = window.visualViewport;
      var rect  = el.getBoundingClientRect();

      // vpBottom = bottom edge of the visible area (above keyboard)
      var vpBottom = vp.offsetTop + vp.height;

      if (rect.bottom > vpBottom - 16) {
        // Field is hidden under keyboard → scroll page down by exact amount
        var scrollAmount = rect.bottom - vpBottom + 32; // 32px padding above keyboard
        window.scrollBy({ top: scrollAmount, behavior: 'smooth' });
      } else if (rect.top < 56) {
        // Field is behind header → scroll up a bit
        window.scrollBy({ top: rect.top - 64, behavior: 'smooth' });
      }
    } else {
      // Older browsers — simple scrollIntoView
      try {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } catch(e) {}
    }
  }

  // ── Hook 1: visualViewport resize ──
  // Fires every time keyboard opens, closes, or resizes.
  // Most reliable trigger on Android Chrome & iOS Safari 13+.
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', function() {
      var el = _focused || document.activeElement;
      if (_isField(el)) {
        // Let keyboard fully animate (100ms is enough for most devices)
        setTimeout(function() { _bringAboveKeyboard(el); }, 100);
      }
    });
  }

  // ── Hook 2: focusin ──
  // Fires when user taps any field. We schedule two attempts:
  //  • 350ms — catches most Android keyboards
  //  • 650ms — catches slow iOS keyboards
  document.addEventListener('focusin', function(e) {
    var el = e.target;
    if (!_isField(el)) return;
    _focused = el;
    setTimeout(function() { _bringAboveKeyboard(el); }, 350);
    setTimeout(function() { _bringAboveKeyboard(el); }, 650);
  }, true);

  // Clear focused reference on blur
  document.addEventListener('focusout', function() {
    setTimeout(function() {
      if (!_isField(document.activeElement)) _focused = null;
    }, 200);
  }, true);

  // ── Hook 3: touchend on labels / clickable wrappers ──
  // Some custom UI components (modal, glass-card rows) intercept
  // touch so focusin fires late. This catches those cases.
  document.addEventListener('touchend', function(e) {
    var el = e.target;
    if (_isField(el)) {
      setTimeout(function() {
        if (document.activeElement === el) _bringAboveKeyboard(el);
      }, 400);
    }
  }, { passive: true });
})();

// ══════════════════════════════════════════════════════
//  QR CODE UTILITIES  (shared across admin / teacher / student)
//  QR data format:
//    Students → "VM:STU:<studentId>"
//    Teachers → "VM:TCH:<teacherId>"
//  Generation requires: qrcodejs CDN (qrcode.min.js)
//  Scanning  requires:  jsQR CDN    (jsQR.js)
// ══════════════════════════════════════════════════════

/**
 * Generate a QR code into a DOM element by ID.
 * @param {string} divId  - element id to render into
 * @param {string} data   - QR payload string (e.g. "VM:STU:usr_std_001")
 * @param {number} [size] - pixel size (default 80)
 */
function _vmGenQR(divId, data, size) {
  size = size || 80;
  var el = document.getElementById(divId);
  if (!el) return;
  el.innerHTML = '';
  if (!window.QRCode) {
    // Library not loaded yet — show fallback ID text
    el.style.cssText = 'font-size:.55rem;color:#64748b;word-break:break-all;line-height:1.3;padding:4px;';
    el.textContent = data.slice(-10);
    return;
  }
  try {
    new QRCode(el, {
      text:           data,
      width:          size,
      height:         size,
      colorDark:      '#000000',
      colorLight:     '#ffffff',
      correctLevel:   QRCode.CorrectLevel.M,
    });
  } catch(e) {
    el.textContent = data.slice(-10);
  }
}

// ══════════════════════════════════════════════════════
//  QR Camera Scanner — robust, throttled, audio beep
// ══════════════════════════════════════════════════════

// ── Beep sound via Web Audio API ─────────────────────
window._vmQRBeep = function(type) {
  // type: 'success' | 'error' | 'warn'
  try {
    var AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    var ctx  = new AudioCtx();
    var osc  = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'error') {
      // two low descending tones
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    } else if (type === 'warn') {
      // single mid tone
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.18);
    } else {
      // success — two rising tones: beep-beep ✅
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1200, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.28);
    }
    // Auto-close context after playback to free resources
    setTimeout(function(){ try { ctx.close(); } catch(e){} }, 500);
  } catch(e) {}
  // Also vibrate on mobile
  try { if (navigator.vibrate) navigator.vibrate(type === 'success' ? [40,30,40] : [80]); } catch(e){}
};

// ── Stop camera + scanning loop ───────────────────────
window._vmQRStop = function() {
  if (window._vmQRTimer) { clearTimeout(window._vmQRTimer); window._vmQRTimer = null; }
  var video = document.getElementById('_vmQRVideo');
  if (video && video._vmStream) {
    try { video._vmStream.getTracks().forEach(function(t){ t.stop(); }); } catch(e){}
    video._vmStream = null;
  }
  // Stop scan-line animation
  var line = document.getElementById('_qrScanLine');
  if (line) line.style.animationPlayState = 'paused';
};

/**
 * Start camera QR scanning.
 * Calls onScan(data) whenever a new QR code is detected.
 * Throttled to one decode every 350 ms — safe on mobile.
 * Debounces same QR for 2 s to prevent double-marking.
 */
window._vmQRStart = function(onScan) {
  var video  = document.getElementById('_vmQRVideo');
  var canvas = document.getElementById('_vmQRCanvas');
  var statusEl = document.getElementById('_qrStatus');
  function setStatus(html, col) {
    if (statusEl) statusEl.innerHTML = '<span style="color:' + (col||'rgba(255,255,255,.5)') + ';">' + html + '</span>';
  }

  if (!video || !canvas) { toast('Scanner DOM element not found — please reload the page', 'error'); return; }

  if (!window.jsQR) {
    setStatus('⚠️ QR library failed to load — check your internet connection and reload the page', '#f59e0b');
    toast('jsQR library missing — reload the page', 'error');
    return;
  }

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    setStatus('❌ Camera is not supported in this browser/device', '#ef4444');
    toast('Camera not supported on this device/browser', 'error');
    return;
  }

  window._vmQRStop();  // stop any existing stream first
  setStatus('📷 Starting camera…', '#a78bfa');

  function startWithStream(stream) {
    video._vmStream = stream;
    video.srcObject = stream;
    video.setAttribute('playsinline', 'true');
    video.setAttribute('autoplay', 'true');
    video.muted = true;

    var playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(function() { /* autoplay policy — ignored, video may still play */ });
    }

    setStatus('📷 Camera running — hold the ID card QR code inside the square', '#a78bfa');

    // Start scan-line animation
    var line = document.getElementById('_qrScanLine');
    if (line) line.style.animationPlayState = 'running';

    var lastData = '';
    var lastTime = 0;
    var ctx = canvas.getContext('2d');
    var _scanning = true;

    function scanFrame() {
      if (!document.getElementById('_vmQRVideo') || !video._vmStream) {
        _scanning = false; return;
      }
      if (!_scanning) return;

      // Only decode when video has actual frame data
      if (video.readyState >= 2 && video.videoWidth > 0) {
        canvas.width  = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        var imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        var code = null;
        try {
          code = window.jsQR(imgData.data, imgData.width, imgData.height, { inversionAttempts: 'attemptBoth' });
        } catch(e) {}

        if (code && code.data) {
          var now = Date.now();
          if (code.data !== lastData || now - lastTime > 2000) {
            lastData = code.data;
            lastTime = now;
            // Flash scan frame green
            var frame = document.getElementById('_qrFrame');
            if (frame) {
              frame.style.borderColor = '#10b981';
              frame.style.boxShadow   = '0 0 0 4px rgba(16,185,129,.35)';
              setTimeout(function(){
                if (frame) { frame.style.borderColor = 'rgba(124,58,237,.6)'; frame.style.boxShadow = 'none'; }
              }, 600);
            }
            onScan(code.data);
          }
        }
      }

      // Schedule next scan after 350 ms — throttled for mobile performance
      window._vmQRTimer = setTimeout(scanFrame, 350);
    }

    // Wait for first frame before starting decode loop
    video.addEventListener('canplay', function onCanPlay() {
      video.removeEventListener('canplay', onCanPlay);
      scanFrame();
    });
    // Fallback: start after 800ms even if canplay never fires
    window._vmQRTimer = setTimeout(scanFrame, 800);
  }

  // Try back (environment) camera first; fall back to any camera
  navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false })
    .then(startWithStream)
    .catch(function() {
      navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(startWithStream)
        .catch(function(err) {
          var msg = (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')
            ? '❌ Camera permission denied — allow camera in browser settings'
            : '❌ Camera error: ' + (err.message || err.name || err);
          setStatus(msg, '#ef4444');
          toast(msg, 'error');
        });
    });
};
