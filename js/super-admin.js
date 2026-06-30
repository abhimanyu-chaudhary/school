/* =====================================================
   SUPER-ADMIN.JS  —  System control panel logic
===================================================== */

// ── Theme (Day / Night) ───────────────────────────────
(function _restoreTheme() {
  if (localStorage.getItem('vm_theme') === 'light') {
    document.body.classList.add('light-mode');
    _vmEnableLightMode();
  }
  const btn = document.getElementById('themeToggle');
  if (btn) btn.textContent = document.body.classList.contains('light-mode') ? '🌙' : '☀️';
})();
function toggleTheme() {
  const isLight = document.body.classList.toggle('light-mode');
  const theme = isLight ? 'light' : 'dark';
  localStorage.setItem('vm_theme', theme);
  if (isLight) _vmEnableLightMode(); else _vmDisableLightMode();
  const btn = document.getElementById('themeToggle');
  if (btn) { btn.textContent = isLight ? '🌙' : '☀️'; btn.title = isLight ? 'Switch to Night Mode' : 'Switch to Day Mode'; }
  if (window.AndroidBridge) window.AndroidBridge.setTheme(theme);
}

// ── All available admin features (id must match data-section in admin.html) ──
const ALL_ADMIN_FEATURES = [
  // group, id, icon, label, required (cannot be disabled)
  { id:'dashboard',         icon:'📊', label:'Dashboard',          group:'Overview',       required:true  },
  { id:'classes',           icon:'🏫', label:'Classes',            group:'Academics'                      },
  { id:'students',          icon:'👨‍🎓', label:'Students',           group:'Academics'                      },
  { id:'teachers',          icon:'👩‍🏫', label:'Teachers',           group:'Academics'                      },
  { id:'attendance',        icon:'✅', label:'Attendance',          group:'Academics'                      },
  { id:'homework',          icon:'📚', label:'Homework',            group:'Academics'                      },
  { id:'timetable',         icon:'🗓️', label:'Timetable',          group:'Academics'                      },
  { id:'exams',             icon:'📝', label:'Exams & Marks',       group:'Academics'                      },
  { id:'curriculum',        icon:'📋', label:'Curriculum',          group:'Academics'                      },
  { id:'materials',         icon:'📂', label:'Study Materials',     group:'Academics'                      },
  { id:'qpapers',           icon:'📄', label:'Question Papers',     group:'Academics'                      },
  { id:'teacherattendance', icon:'🧑‍🏫', label:'Teacher Attendance', group:'Staff'                          },
  { id:'teachertasks',      icon:'📨', label:'Teacher Tasks',       group:'Staff'                          },
  { id:'questionbank',      icon:'🗂️', label:'Question Bank',      group:'Staff'                          },
  { id:'papergenerator',    icon:'🖨️', label:'Paper Generator',    group:'Staff'                          },
  { id:'fees',              icon:'💳', label:'Fees',               group:'Finance'                        },
  { id:'accounts',          icon:'💰', label:'Accounts',            group:'Finance'                        },
  { id:'salary',            icon:'💼', label:'Salary Receipts',     group:'Finance'                        },
  { id:'inventory',         icon:'📦', label:'Inventory',           group:'Finance'                        },
  { id:'cameras',           icon:'📹', label:'CCTV Cameras',        group:'Monitoring'                     },
  { id:'vehicles',          icon:'🚌', label:'Vehicle GPS',         group:'Monitoring'                     },
  { id:'messages',          icon:'💬', label:'Messages',            group:'Communication'                  },
  { id:'notices',           icon:'📢', label:'Notices',             group:'Communication'                  },
  { id:'leaves',            icon:'📅', label:'Leave Requests',      group:'Communication'                  },
  { id:'leaderboard',       icon:'🏆', label:'Leaderboard',         group:'Communication'                  },
  { id:'gallery',           icon:'🖼️', label:'School Gallery',      group:'Communication'                  },
  { id:'idcards',           icon:'🪪', label:'ID Cards',            group:'Reports'                        },
  { id:'reportcards',       icon:'📊', label:'Report Cards',        group:'Reports'                        },
  { id:'certificates',      icon:'🎓', label:'Certificates',        group:'Reports'                        },
  { id:'reminders',         icon:'🔔', label:'Reminders',           group:'System'                         },
  { id:'settings',          icon:'⚙️', label:'Settings',            group:'System',         required:true  },
];

// ── Open Feature Management Modal ────────────────────
function openFeaturesModal(schoolId) {
  const school   = getSchools().find(s => s.id === schoolId);
  if (!school) return;

  // Current enabled features: school.features or ALL (null = all enabled)
  const current  = Array.isArray(school.features) ? school.features : ALL_ADMIN_FEATURES.map(f => f.id);

  // Group features
  const groups   = [...new Set(ALL_ADMIN_FEATURES.map(f => f.group))];

  const groupColors = {
    'Overview':'#a78bfa', 'Academics':'#06b6d4', 'Staff':'#10b981',
    'Finance':'#f59e0b', 'Monitoring':'#ef4444', 'Communication':'#8b5cf6',
    'Reports':'#f97316', 'System':'#6b7280',
  };

  const bodyHtml = `
    <div style="margin-bottom:16px;padding:12px 14px;background:rgba(124,58,237,.08);border:1px solid rgba(124,58,237,.25);border-radius:10px;font-size:.82rem;color:rgba(255,255,255,.6);line-height:1.6;">
      🏫 <strong style="color:#a78bfa;">${school.name}</strong> — select the features to enable.<br>
      <span style="color:rgba(255,255,255,.35);font-size:.75rem;">🔒 = Always enabled (cannot be turned off)</span>
    </div>

    <!-- Select All / None -->
    <div style="display:flex;gap:8px;margin-bottom:18px;flex-wrap:wrap;">
      <button onclick="_featSelectAll(true)"  style="background:rgba(16,185,129,.12);color:#10b981;border:1px solid rgba(16,185,129,.3);border-radius:8px;padding:5px 14px;font-size:.78rem;font-weight:700;cursor:pointer;">✅ Select All</button>
      <button onclick="_featSelectAll(false)" style="background:rgba(239,68,68,.1);color:#ef4444;border:1px solid rgba(239,68,68,.3);border-radius:8px;padding:5px 14px;font-size:.78rem;font-weight:700;cursor:pointer;">❌ Deselect All</button>
      <span id="feat-count-label" style="font-size:.78rem;color:rgba(255,255,255,.4);display:flex;align-items:center;margin-left:4px;"></span>
    </div>

    ${groups.map(group => {
      const feats = ALL_ADMIN_FEATURES.filter(f => f.group === group);
      const color = groupColors[group] || '#a78bfa';
      return `
        <div style="margin-bottom:18px;">
          <div style="font-size:.7rem;font-weight:700;color:${color};text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px;display:flex;align-items:center;gap:6px;">
            <span style="display:inline-block;width:14px;height:2px;background:${color};border-radius:2px;"></span>
            ${group}
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px;">
            ${feats.map(f => {
              const checked  = current.includes(f.id);
              const disabled = f.required ? 'disabled' : '';
              return `
              <label style="display:flex;align-items:center;gap:10px;padding:9px 12px;background:rgba(255,255,255,.03);border:1px solid ${checked?'rgba(124,58,237,.35)':'rgba(255,255,255,.07)'};border-radius:9px;cursor:${f.required?'default':'pointer'};transition:border-color .15s;opacity:${f.required?.75:1};"
                     onmouseover="if(!this.querySelector('input').disabled)this.style.borderColor='rgba(124,58,237,.4)'"
                     onmouseout="if(!this.querySelector('input').disabled)this.style.borderColor=this.querySelector('input').checked?'rgba(124,58,237,.35)':'rgba(255,255,255,.07)'">
                <input type="checkbox" data-feat-id="${f.id}" ${checked?'checked':''} ${disabled}
                       onchange="_featCountUpdate(this.closest('.modal-body'))"
                       style="width:16px;height:16px;accent-color:#7c3aed;flex-shrink:0;cursor:${f.required?'default':'pointer'};">
                <span style="font-size:.8rem;">${f.icon} ${f.label}${f.required?' 🔒':''}</span>
              </label>`;
            }).join('')}
          </div>
        </div>`;
    }).join('')}
  `;

  buildModal('modal-features', `🎛️ Feature Management — ${school.name}`, bodyHtml,
    () => saveSchoolFeatures(schoolId), 'lg');

  // Initial count
  setTimeout(() => {
    const mb = document.querySelector('#modal-features .modal-body');
    if (mb) _featCountUpdate(mb);
  }, 50);

  // Select all / none helper
  window._featSelectAll = function(val) {
    const mb = document.querySelector('#modal-features .modal-body');
    if (!mb) return;
    mb.querySelectorAll('input[type=checkbox]:not(:disabled)').forEach(cb => { cb.checked = val; });
    _featCountUpdate(mb);
  };

  window._featCountUpdate = function(mb) {
    const total   = ALL_ADMIN_FEATURES.length;
    const checked = mb.querySelectorAll('input[type=checkbox]:checked').length;
    const lbl     = document.getElementById('feat-count-label');
    if (lbl) lbl.textContent = `${checked} / ${total} features enabled`;
  };
}

function saveSchoolFeatures(schoolId) {
  const mb = document.querySelector('#modal-features .modal-body');
  if (!mb) return;

  // Collect checked features
  const enabled = [];
  mb.querySelectorAll('input[type=checkbox]').forEach(cb => {
    if (cb.checked) enabled.push(cb.dataset.featId);
  });

  // Always ensure required features are included
  ALL_ADMIN_FEATURES.filter(f => f.required).forEach(f => {
    if (!enabled.includes(f.id)) enabled.push(f.id);
  });

  // 1. Update school object in SA schools list
  updateSchool(schoolId, { features: enabled });

  // 2. Write to school-level localStorage so admin.js can read it
  const key = schoolId + '_school_features';
  localStorage.setItem(key, JSON.stringify(enabled));

  // 3. Push to MySQL so any device gets the updated feature set
  _dbPushToServer(schoolId, 'school_features', enabled);

  closeAllModals();
  toast(`✅ Features updated for this school! (${enabled.length} features enabled)`, 'success');
  renderSchools();
}

// ── Auth ──────────────────────────────────────────────
async function saLogin() {
  const username = document.getElementById('saUsername').value.trim();
  const password = document.getElementById('saPassword').value;
  const btn = document.querySelector('#saLoginScreen .btn-primary');

  if (!username || !password) { toast('Enter credentials', 'warning'); return; }

  if (btn) { btn.disabled = true; btn.textContent = '☁️ Syncing…'; }

  // Pull SA data from MySQL first (so credentials are always up-to-date)
  try { await syncSAFromServer(); } catch(e) {}

  initMultiSchool();
  const creds = getSuperAdminCreds();

  if (btn) { btn.disabled = false; btn.textContent = '🛡️ Enter Control Panel'; }

  if (username !== creds.username || password !== creds.password) {
    toast('Invalid super admin credentials', 'error', 'Access Denied');
    document.getElementById('saPassword').value = '';
    return;
  }

  sessionStorage.setItem('sa_session', '1');
  document.getElementById('saLoginScreen').style.display = 'none';
  document.getElementById('saPanelScreen').style.display = 'block';
  initSidebar();
  renderSchools();
  loadSASettingsForm();
}

function saLogout() {
  sessionStorage.removeItem('sa_session');
  window.location.reload();
}

// ── Section navigation ────────────────────────────────
function showSASection(id) {
  document.querySelectorAll('.section-content').forEach(s => {
    s.classList.remove('active');
    s.style.display = 'none';
  });
  document.querySelectorAll('[data-sa-section]').forEach(n => n.classList.remove('active'));

  const sec = document.getElementById('sa-section-' + id);
  if (sec) { sec.classList.add('active'); sec.style.display = 'block'; }

  const nav = document.querySelector(`[data-sa-section="${id}"]`);
  if (nav) nav.classList.add('active');

  const titles = { schools: 'Schools', addschool: 'Add School', settings: 'SA Settings', subscriptions: 'Subscriptions', pwdresets: 'Admin Password Resets' };
  const el = document.getElementById('saHeaderTitle');
  if (el) el.textContent = titles[id] || id;

  if (id === 'schools')       renderSchools();
  if (id === 'addschool')     clearSchoolForm();
  if (id === 'settings')      loadSASettingsForm();
  if (id === 'subscriptions') renderSubscriptions();
  if (id === 'pwdresets')     renderSAPwdResets();
}

// ══════════════════════════════════════════════════════
//  ADMIN PASSWORD RESET REQUESTS (one-click approve)
// ══════════════════════════════════════════════════════
function _saGenTempPwd(){ return 'admin' + Math.floor(1000 + Math.random()*9000); }

function renderSAPwdResets(){
  const reqs=(SA.get('admin_reset_requests')||[]).slice().reverse();
  const pending=reqs.filter(r=>r.status==='pending');
  const done=reqs.filter(r=>r.status!=='pending');
  const card=(r)=>{
    const wa=(r.phone||'').replace(/[^0-9]/g,''); const waN=wa.length===10?'91'+wa:wa;
    const waMsg=encodeURIComponent(`Hello ${r.name}, your VissionMarg ADMIN password for ${r.schoolName} has been reset. New password: ${r.newPassword||''}`);
    return `<div class="card" style="margin-bottom:10px;"><div class="card-body" style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
      <div style="flex:1;min-width:180px;">
        <div style="font-weight:700;">${(r.name||'Admin')} <span style="font-size:.72rem;color:#a78bfa;">👑 Admin</span></div>
        <div style="font-size:.78rem;color:rgba(255,255,255,.5);">🏫 ${r.schoolName||r.schoolId} · 👤 ${r.username}${r.phone?' · 📱 '+r.phone:''} · 📅 ${r.date}</div>
        ${r.status==='approved'?`<div style="margin-top:4px;font-size:.82rem;color:#10b981;">✅ New password: <strong style="font-family:monospace;background:rgba(16,185,129,.12);padding:2px 8px;border-radius:6px;">${r.newPassword}</strong></div>`:''}
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;">
        ${r.status==='pending'
          ? `<button class="btn btn-sm btn-success" onclick="approveSAPwdReset('${r.id}')">✅ Approve & Reset</button>
             <button class="btn btn-sm btn-danger" onclick="dismissSAPwdReset('${r.id}')">✕</button>`
          : `${waN?`<a class="btn btn-sm" style="background:#25D366;color:#fff;border:none;" href="https://wa.me/${waN}?text=${waMsg}" target="_blank">📲 Send</a>`:''}
             <button class="btn btn-sm btn-secondary" onclick="dismissSAPwdReset('${r.id}')">🗑 Clear</button>`}
      </div>
    </div></div>`;
  };
  const host=document.getElementById('saPwdResetsList');
  if(host) host.innerHTML=`
    ${pending.length?`<h3 style="margin:6px 0 10px;">⏳ Pending (${pending.length})</h3>${pending.map(card).join('')}`:'<div class="card"><div class="card-body" style="text-align:center;color:rgba(255,255,255,.4);padding:30px;">✅ No pending admin password requests</div></div>'}
    ${done.length?`<h3 style="margin:18px 0 10px;">✅ Recently Reset</h3>${done.slice(0,10).map(card).join('')}`:''}`;
}

async function approveSAPwdReset(id){
  const reqs=SA.get('admin_reset_requests'); const r=reqs.find(x=>x.id===id); if(!r) return;
  const np=_saGenTempPwd();
  try{
    // Fetch the school's users, reset the admin password, push back
    const res=await fetch(`${API_URL}?school_id=${encodeURIComponent(r.schoolId)}&key=users`,{cache:'no-store'});
    let users=[]; try{ const p=JSON.parse(await res.text()); if(Array.isArray(p)) users=p; }catch(e){}
    let admin=users.find(u=>u.role==='admin' && (u.username===r.username || !r.username));
    if(!admin) admin=users.find(u=>u.role==='admin');
    if(!admin){ toast('Admin account not found for this school','error'); return; }
    admin.password=np;
    await fetch(API_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({school_id:r.schoolId,key:'users',value:users})});
    // also keep local cache in sync if present
    try{ localStorage.setItem(r.schoolId+'_users', JSON.stringify(users)); }catch(e){}
    r.status='approved'; r.newPassword=np; r.username=admin.username; r.approvedAt=today();
    SA.set('admin_reset_requests',reqs);
    toast(`✅ Admin password reset — ${np}`,'success');
    renderSAPwdResets();
  }catch(e){ toast('Could not reset — check internet','error'); }
}
function dismissSAPwdReset(id){
  SA.set('admin_reset_requests',(SA.get('admin_reset_requests')||[]).filter(x=>x.id!==id));
  renderSAPwdResets();
}

// ── Subscription Helpers ──────────────────────────────
function isSubscriptionActive(school) {
  // No subscription configured → treated as always active (legacy schools)
  if (!school.subscriptionType && !school.subscriptionEnd) return true;
  if (school.subscriptionType === 'lifetime') return true;
  if (!school.subscriptionEnd) return true;
  return school.subscriptionEnd >= today();
}

function getSubscriptionLabel(school) {
  if (!school.subscriptionType && !school.subscriptionEnd) {
    return { label: 'No Subscription', color: '#6b7280', bg: 'rgba(107,114,128,.12)', border: 'rgba(107,114,128,.25)' };
  }
  if (school.subscriptionType === 'lifetime') {
    return { label: '♾️ Lifetime', color: '#10b981', bg: 'rgba(16,185,129,.12)', border: 'rgba(16,185,129,.3)' };
  }
  const t = today();
  if (!school.subscriptionEnd || school.subscriptionEnd < t) {
    return { label: '❌ Expired', color: '#ef4444', bg: 'rgba(239,68,68,.12)', border: 'rgba(239,68,68,.3)' };
  }
  const diffDays = Math.ceil((new Date(school.subscriptionEnd) - new Date(t)) / 86400000);
  if (diffDays <= 7) {
    return { label: `⚠️ Expiring in ${diffDays}d`, color: '#f59e0b', bg: 'rgba(245,158,11,.12)', border: 'rgba(245,158,11,.3)' };
  }
  const typeLabel = school.subscriptionType === 'demo' ? '🔬 Demo'
    : school.subscriptionType === 'yearly' ? '📅 Yearly' : '📆 Monthly';
  return { label: `${typeLabel} · Active`, color: '#10b981', bg: 'rgba(16,185,129,.12)', border: 'rgba(16,185,129,.3)' };
}

function getDaysLeft(school) {
  if (!school.subscriptionEnd) return null;
  return Math.ceil((new Date(school.subscriptionEnd) - new Date(today())) / 86400000);
}

// ── Render Schools List ───────────────────────────────
function renderSchools() {
  const schools = getSchools();
  const t = today();

  // Count expiring within 7 days
  const expiringSoon = schools.filter(s => {
    if (!s.subscriptionEnd || s.subscriptionType === 'lifetime') return false;
    const diff = Math.ceil((new Date(s.subscriptionEnd) - new Date(t)) / 86400000);
    return diff >= 0 && diff <= 7;
  }).length;

  // Stats
  const statsEl = document.getElementById('saStats');
  if (statsEl) {
    statsEl.innerHTML = `
      <div class="sa-stat">
        <div class="stat-icon">🏫</div>
        <div class="stat-val">${schools.length}</div>
        <div class="stat-lbl">Total Schools</div>
      </div>
      <div class="sa-stat">
        <div class="stat-icon">✅</div>
        <div class="stat-val">${schools.filter(s=>!s.status||s.status==='active').length}</div>
        <div class="stat-lbl">Active Schools</div>
      </div>
      <div class="sa-stat">
        <div class="stat-icon">👨‍🎓</div>
        <div class="stat-val">${countAllStudents(schools)}</div>
        <div class="stat-lbl">Total Students</div>
      </div>
      <div class="sa-stat">
        <div class="stat-icon">👩‍🏫</div>
        <div class="stat-val">${countAllTeachers(schools)}</div>
        <div class="stat-lbl">Total Teachers</div>
      </div>
      <div class="sa-stat" style="${expiringSoon>0?'border-color:rgba(245,158,11,.4);background:rgba(245,158,11,.05);':''}">
        <div class="stat-icon">⚠️</div>
        <div class="stat-val" style="${expiringSoon>0?'color:#f59e0b;':''}">${expiringSoon}</div>
        <div class="stat-lbl">Expiring Soon</div>
      </div>`;
  }

  // Schools list
  const listEl = document.getElementById('schoolsList');
  if (!listEl) return;

  if (!schools.length) {
    listEl.innerHTML = `<div style="text-align:center;padding:40px;color:rgba(255,255,255,.35);">
      No schools registered yet. <a href="#" onclick="showSASection('addschool')" style="color:#a78bfa;">Add your first school</a>
    </div>`;
    return;
  }

  listEl.innerHTML = schools.map(school => {
    const studentCount = getSchoolStudentCount(school.id);
    const teacherCount = getSchoolTeacherCount(school.id);
    const subInfo      = getSubscriptionLabel(school);
    const daysLeft     = getDaysLeft(school);
    const isActive     = isSubscriptionActive(school);

    return `
    <div class="school-card" id="school-card-${school.id}" style="flex-wrap:wrap;gap:12px;${!isActive?'border-color:rgba(239,68,68,.3);background:rgba(239,68,68,.03);':''}">
      <div class="school-icon">🏫</div>
      <div class="school-info" style="flex:1;min-width:200px;">
        <div class="school-name">${school.name}</div>
        <div class="school-meta">ID: <code style="color:#a78bfa;background:rgba(124,58,237,.15);padding:1px 6px;border-radius:4px;">${school.id}</code> &nbsp;·&nbsp; ${studentCount} students &nbsp;·&nbsp; ${teacherCount} teachers</div>
        <div class="school-meta" style="margin-top:4px;">${school.address || 'No address set'}</div>
        <!-- Subscription badge -->
        <div style="margin-top:8px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
          <span style="padding:2px 10px;border-radius:20px;font-size:.7rem;font-weight:700;background:${subInfo.bg};color:${subInfo.color};border:1px solid ${subInfo.border};">${subInfo.label}</span>
          ${school.subscriptionEnd && school.subscriptionType !== 'lifetime'
            ? `<span style="font-size:.7rem;color:rgba(255,255,255,.3);">Expires ${formatDate(school.subscriptionEnd)}${daysLeft!==null&&daysLeft>=0?' ('+daysLeft+'d left)':daysLeft!==null&&daysLeft<0?' (overdue)':''}</span>`
            : ''}
        </div>
        <!-- Credentials box -->
        <div style="display:flex;gap:12px;margin-top:10px;flex-wrap:wrap;">
          <div style="background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.2);border-radius:8px;padding:8px 14px;font-size:.78rem;">
            <div style="color:rgba(255,255,255,.4);font-size:.68rem;text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px">Admin Username</div>
            <div style="color:#6ee7b7;font-weight:700;font-family:monospace;">${school.adminUsername || 'admin'}</div>
          </div>
          <div style="background:rgba(6,182,212,.08);border:1px solid rgba(6,182,212,.2);border-radius:8px;padding:8px 14px;font-size:.78rem;">
            <div style="color:rgba(255,255,255,.4);font-size:.68rem;text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px">Admin Password</div>
            <div style="color:#67e8f9;font-weight:700;font-family:monospace;" id="pwd-${school.id}">••••••••</div>
            <button onclick="togglePwd('${school.id}','${school.adminPassword||''}')" style="background:none;border:none;color:rgba(255,255,255,.3);cursor:pointer;font-size:.65rem;padding:0;margin-top:2px;">👁 show</button>
          </div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end;flex-shrink:0;">
        <span class="school-status ${school.status||'active'}">${school.status==='inactive'?'Inactive':'Active'}</span>
        <div class="school-actions" style="flex-direction:column;">
          <button class="btn btn-secondary btn-sm" onclick="editSchool('${school.id}')">✏️ Edit Credentials</button>
          <button class="btn btn-sm" style="background:rgba(${school.status==='inactive'?'16,185,129':'239,68,68'},.15);color:${school.status==='inactive'?'#10b981':'#ef4444'};border:1px solid ${school.status==='inactive'?'rgba(16,185,129,.3)':'rgba(239,68,68,.3)'};"
            onclick="toggleSchoolStatus('${school.id}')">${school.status==='inactive'?'✅ Activate':'🚫 Deactivate'}</button>
          <button class="btn btn-sm" style="background:rgba(6,182,212,.1);color:#06b6d4;border:1px solid rgba(6,182,212,.25);"
            onclick="loginAsSchoolAdmin('${school.id}')">🔑 Login as Admin</button>
          <button class="btn btn-sm" style="background:rgba(124,58,237,.12);color:#a78bfa;border:1px solid rgba(124,58,237,.3);"
            onclick="openSubscriptionModal('${school.id}')">💳 Subscription</button>
          <button class="btn btn-sm" style="background:rgba(6,182,212,.1);color:#06b6d4;border:1px solid rgba(6,182,212,.25);"
            onclick="openFeaturesModal('${school.id}')">🎛️ Features (${Array.isArray(school.features)?school.features.length:ALL_ADMIN_FEATURES.length}/${ALL_ADMIN_FEATURES.length})</button>
          <button class="btn btn-sm" style="background:rgba(239,68,68,.1);color:#ef4444;border:1px solid rgba(239,68,68,.3);"
            onclick="deleteSchool('${school.id}')">🗑️ Delete School</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function countAllStudents(schools) {
  return schools.reduce((sum, s) => sum + getSchoolStudentCount(s.id), 0);
}
function countAllTeachers(schools) {
  return schools.reduce((sum, s) => sum + getSchoolTeacherCount(s.id), 0);
}
function getSchoolStudentCount(schoolId) {
  try { return (JSON.parse(localStorage.getItem(schoolId + '_students') || '[]')).length; } catch { return 0; }
}
function getSchoolTeacherCount(schoolId) {
  try { return (JSON.parse(localStorage.getItem(schoolId + '_teachers') || '[]')).length; } catch { return 0; }
}

// ── Add / Edit School ─────────────────────────────────
function clearSchoolForm() {
  document.getElementById('editSchoolId').value = '';
  document.getElementById('addSchoolName').value = '';
  document.getElementById('addSchoolTagline').value = '';
  document.getElementById('addSchoolAddress').value = '';
  document.getElementById('addAdminUser').value = '';
  document.getElementById('addAdminPwd').value = '';
  document.getElementById('addSchoolTitle').textContent = 'Add New School';

  // Auto-generate ID
  const schools = getSchools();
  const nextNum = String(schools.length + 1).padStart(3, '0');
  document.getElementById('addSchoolId').value = 'sch' + nextNum;
  document.getElementById('addSchoolId').readOnly = false;
}

function editSchool(schoolId) {
  const school = getSchools().find(s => s.id === schoolId);
  if (!school) return;

  showSASection('addschool');

  document.getElementById('editSchoolId').value = school.id;
  document.getElementById('addSchoolName').value = school.name;
  document.getElementById('addSchoolTagline').value = school.tagline || '';
  document.getElementById('addSchoolAddress').value = school.address || '';
  document.getElementById('addSchoolId').value = school.id;
  document.getElementById('addSchoolId').readOnly = true;
  document.getElementById('addAdminUser').value = school.adminUsername || '';
  document.getElementById('addAdminPwd').value = school.adminPassword || '';
  document.getElementById('addSchoolTitle').textContent = 'Edit School';
}

function saveSchool() {
  const editId    = document.getElementById('editSchoolId').value;
  const name      = document.getElementById('addSchoolName').value.trim();
  const tagline   = document.getElementById('addSchoolTagline').value.trim();
  const address   = document.getElementById('addSchoolAddress').value.trim();
  const schoolId  = document.getElementById('addSchoolId').value.trim().replace(/[^a-zA-Z0-9_-]/g,'');
  const adminUser = document.getElementById('addAdminUser').value.trim();
  const adminPwd  = document.getElementById('addAdminPwd').value;

  if (!name)      { toast('School name is required', 'warning'); return; }
  if (!schoolId)  { toast('School ID is required', 'warning'); return; }
  if (!adminUser) { toast('Admin username is required', 'warning'); return; }
  if (!adminPwd)  { toast('Admin password is required', 'warning'); return; }

  const schools = getSchools();

  if (editId) {
    // Update SA record (schools list)
    updateSchool(editId, { name, tagline, address, adminUsername: adminUser, adminPassword: adminPwd });
    // Update admin user in localStorage + MySQL
    _syncAdminUser(editId, adminUser, adminPwd, name);
    // Update school settings in localStorage + MySQL
    const settingsKey = editId + '_school_settings';
    try {
      const s = JSON.parse(localStorage.getItem(settingsKey) || '{}');
      const updated = { ...s, schoolName: name, schoolTagline: tagline, schoolAddress: address };
      localStorage.setItem(settingsKey, JSON.stringify(updated));
      // ✅ Push updated settings to MySQL
      _dbPushToServer(editId, 'school_settings', updated);
    } catch(e) {}

    toast('School updated successfully!', 'success');
  } else {
    // Check ID not taken
    if (schools.find(s => s.id === schoolId)) {
      toast('School ID already exists. Choose a different ID.', 'error');
      return;
    }

    const newSchool = {
      id: schoolId, name, tagline, address,
      adminUsername: adminUser, adminPassword: adminPwd,
      createdAt: today(), status: 'active'
    };
    addSchool(newSchool);
    // Initialize empty school data in localStorage
    _initFreshSchool(schoolId, name, tagline, address);
    // Create admin user in localStorage + MySQL
    _syncAdminUser(schoolId, adminUser, adminPwd, name);
    // ✅ Push ALL school data to MySQL so any device can sync and login
    _pushSchoolToMySQL(schoolId);

    toast(`School "${name}" added successfully! Data synced to server.`, 'success');
  }

  showSASection('schools');
}

function _syncAdminUser(schoolId, adminUser, adminPwd, schoolName) {
  const usersKey = schoolId + '_users';
  try {
    let users = JSON.parse(localStorage.getItem(usersKey) || '[]');
    const idx = users.findIndex(u => u.role === 'admin');
    if (idx !== -1) {
      users[idx] = { ...users[idx], username: adminUser, password: adminPwd, schoolId };
    } else {
      users.push({
        id: 'admin_' + schoolId, name: schoolName || 'Administrator',
        username: adminUser, password: adminPwd,
        role: 'admin', schoolId: schoolId
      });
    }
    localStorage.setItem(usersKey, JSON.stringify(users));
    // ✅ Push users to MySQL so any device can login
    _dbPushToServer(schoolId, 'users', users);
  } catch(e) {}
}

function toggleSchoolStatus(schoolId) {
  const school = getSchools().find(s => s.id === schoolId);
  if (!school) return;
  const newStatus = school.status === 'inactive' ? 'active' : 'inactive';
  updateSchool(schoolId, { status: newStatus });
  toast(`School ${newStatus === 'active' ? 'activated' : 'deactivated'}`, newStatus === 'active' ? 'success' : 'warning');
  renderSchools();
}

function deleteSchool(schoolId) {
  const school = getSchools().find(s => s.id === schoolId);
  if (!school) return;

  buildModal('modal-delete-school', `🗑️ Delete School — ${school.name}`, `
    <div style="background:rgba(239,68,68,.08);border:1.5px solid rgba(239,68,68,.3);border-radius:12px;padding:18px 20px;margin-bottom:18px;">
      <div style="font-size:1.1rem;margin-bottom:10px;">⚠️ <strong style="color:#ef4444;">Warning: This action is permanent!</strong></div>
      <div style="font-size:13px;color:rgba(255,255,255,.65);line-height:1.8;">
        You are about to permanently delete:<br>
        <strong style="color:#fff;font-size:14px;">${school.name}</strong>
        <span style="color:rgba(255,255,255,.4);font-size:12px;margin-left:6px;">(ID: ${school.id})</span><br><br>
        This will delete:<br>
        • All student records, marks, fees, attendance<br>
        • All teacher records and permissions<br>
        • All notices, homework, timetables, gallery<br>
        • School settings and all stored data<br><br>
        <strong style="color:#ef4444;">This cannot be undone!</strong>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Type the School ID to confirm: <code style="color:#a78bfa;background:rgba(124,58,237,.15);padding:2px 8px;border-radius:4px;">${school.id}</code></label>
      <input class="form-control" id="del-confirm-id" placeholder="Type school ID here..." autocomplete="off">
    </div>`,
    () => _confirmDeleteSchool(schoolId),
    'md'
  );
}

function _confirmDeleteSchool(schoolId) {
  const school    = getSchools().find(s => s.id === schoolId);
  if (!school) return;
  const typedId   = (document.getElementById('del-confirm-id')?.value || '').trim();
  if (typedId !== schoolId) {
    toast(`❌ School ID mismatch. Type "${schoolId}" exactly to confirm.`, 'error');
    return;
  }

  // Remove from schools list
  const updated = getSchools().filter(s => s.id !== schoolId);
  SA.set('schools', updated);

  // Wipe all localStorage keys belonging to this school
  const prefix = schoolId + '_';
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(prefix)) keysToRemove.push(k);
  }
  keysToRemove.forEach(k => localStorage.removeItem(k));

  closeAllModals();
  toast(`🗑️ "${school.name}" has been permanently deleted.`, 'info');
  renderSchools();
}

function loginAsSchoolAdmin(schoolId) {
  const school = getSchools().find(s => s.id === schoolId);
  if (!school) return;

  const user = {
    id: 'admin_' + schoolId, name: 'Administrator',
    username: school.adminUsername, role: 'admin',
    schoolId: schoolId, schoolName: school.name
  };
  setCurrentUser(user);

  // Sync feature list to school-level localStorage before navigating
  if (Array.isArray(school.features)) {
    localStorage.setItem(schoolId + '_school_features', JSON.stringify(school.features));
  }

  toast(`Logging in as admin for "${school.name}"...`, 'info');
  setTimeout(() => { window.location.href = 'admin.html'; }, 800);
}

// ── SA Credentials ────────────────────────────────────
function loadSASettingsForm() {
  const creds = getSuperAdminCreds();
  const nameEl = document.getElementById('saDisplayName');
  if (nameEl) nameEl.value = SA.get('saDisplayName') || '';
  document.getElementById('saNewUser').value = creds.username;
  document.getElementById('saOldPwd').value  = '';
  document.getElementById('saNewPwd').value  = '';
  document.getElementById('saConfirmPwd').value = '';
}

function saveSACreds() {
  const displayName = (document.getElementById('saDisplayName')?.value || '').trim();
  const newUser     = document.getElementById('saNewUser').value.trim();
  const oldPwd      = document.getElementById('saOldPwd').value;
  const newPwd      = document.getElementById('saNewPwd').value;
  const confirmPwd  = document.getElementById('saConfirmPwd').value;

  if (!newUser) { toast('Username cannot be empty', 'warning'); return; }

  const creds = getSuperAdminCreds();
  if (oldPwd !== creds.password) { toast('Current password is incorrect', 'error'); return; }
  if (newPwd && newPwd !== confirmPwd) { toast('New passwords do not match', 'error'); return; }

  // Save display name separately
  if (displayName) SA.set('saDisplayName', displayName);

  SA.set('creds', {
    username: newUser,
    password: newPwd || creds.password
  });
  toast('✅ Settings saved successfully!', 'success');
  loadSASettingsForm();
}

// Helper — returns super admin's real name for receipts etc.
function _saName() {
  return SA.get('saDisplayName') || getSuperAdminCreds().username || 'Super Admin';
}

// ── Boot ──────────────────────────────────────────────
(async function boot() {
  initSidebar();

  // ── CRITICAL ORDER ──────────────────────────────────
  // 1. Sync from MySQL FIRST → localStorage gets real school data
  // 2. THEN initMultiSchool() → sees existing schools, skips defaults
  // This prevents initMultiSchool() from overwriting MySQL schools
  // with the default "Excellence Academy" on a fresh browser/device.
  await syncSAFromServer().catch(() => {});
  initMultiSchool();

  if (sessionStorage.getItem('sa_session')) {
    document.getElementById('saLoginScreen').style.display = 'none';
    document.getElementById('saPanelScreen').style.display = 'block';
    renderSchools();
    loadSASettingsForm();
    return;
  }

  // Enter key for login
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && document.getElementById('saLoginScreen').style.display !== 'none') {
      saLogin();
    }
  });
})();

// ── Toggle password visibility ────────────────────────
function togglePwd(schoolId, pwd) {
  const el = document.getElementById('pwd-' + schoolId);
  if (!el) return;
  el.textContent = el.textContent.includes('•') ? pwd : '••••••••';
}

// ── Subscription Management ───────────────────────────

function renderSubscriptions() {
  const schools = getSchools();
  const el = document.getElementById('subscriptionsList');
  if (!el) return;

  if (!schools.length) {
    el.innerHTML = `<div style="text-align:center;padding:40px;color:rgba(255,255,255,.35);">No schools registered yet.</div>`;
    return;
  }

  el.innerHTML = schools.map(school => {
    const subInfo  = getSubscriptionLabel(school);
    const daysLeft = getDaysLeft(school);
    const history  = school.paymentHistory || [];
    const totalPaid = history.reduce((s, h) => s + Number(h.amount || 0), 0);

    return `
    <div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:20px 22px;margin-bottom:16px;">
      <!-- School header row -->
      <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-bottom:14px;">
        <div style="width:42px;height:42px;border-radius:12px;background:linear-gradient(135deg,#7c3aed,#06b6d4);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">🏫</div>
        <div style="flex:1;min-width:150px;">
          <div style="font-weight:700;color:#fff;font-size:1rem;">${school.name}</div>
          <div style="font-size:.74rem;color:rgba(255,255,255,.4);margin-top:2px;">ID: <code style="color:#a78bfa;">${school.id}</code></div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;">
          <span style="padding:3px 12px;border-radius:20px;font-size:.72rem;font-weight:700;background:${subInfo.bg};color:${subInfo.color};border:1px solid ${subInfo.border};">${subInfo.label}</span>
          ${school.subscriptionEnd && school.subscriptionType !== 'lifetime'
            ? `<div style="font-size:.7rem;color:rgba(255,255,255,.35);">Expires: ${formatDate(school.subscriptionEnd)}${daysLeft !== null ? ` · ${daysLeft >= 0 ? daysLeft + 'd left' : 'Overdue ' + Math.abs(daysLeft) + 'd'}` : ''}</div>`
            : ''}
          ${school.subscriptionType === 'demo' && school.demoDays ? `<div style="font-size:.7rem;color:rgba(255,255,255,.3);">Demo: ${school.demoDays}-day trial</div>` : ''}
        </div>
        <button class="btn btn-primary btn-sm" onclick="openSubscriptionModal('${school.id}')">💳 Manage</button>
      </div>

      <!-- Sub details row -->
      <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:${history.length ? '14px' : '0'};">
        <div style="background:rgba(255,255,255,.04);border-radius:10px;padding:10px 14px;flex:1;min-width:120px;">
          <div style="font-size:.68rem;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Type</div>
          <div style="font-size:.88rem;font-weight:600;color:#fff;">${school.subscriptionType ? school.subscriptionType.charAt(0).toUpperCase()+school.subscriptionType.slice(1) : 'None'}</div>
        </div>
        <div style="background:rgba(255,255,255,.04);border-radius:10px;padding:10px 14px;flex:1;min-width:120px;">
          <div style="font-size:.68rem;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Start Date</div>
          <div style="font-size:.88rem;font-weight:600;color:#fff;">${school.subscriptionStart ? formatDate(school.subscriptionStart) : '—'}</div>
        </div>
        <div style="background:rgba(255,255,255,.04);border-radius:10px;padding:10px 14px;flex:1;min-width:120px;">
          <div style="font-size:.68rem;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">End Date</div>
          <div style="font-size:.88rem;font-weight:600;color:${school.subscriptionType==='lifetime'?'#10b981':'#fff'};">${school.subscriptionType === 'lifetime' ? 'Never' : school.subscriptionEnd ? formatDate(school.subscriptionEnd) : '—'}</div>
        </div>
        <div style="background:rgba(16,185,129,.06);border:1px solid rgba(16,185,129,.15);border-radius:10px;padding:10px 14px;flex:1;min-width:120px;">
          <div style="font-size:.68rem;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Total Paid</div>
          <div style="font-size:.88rem;font-weight:700;color:#10b981;">₹${totalPaid.toLocaleString()}</div>
        </div>
      </div>

      <!-- Payment History -->
      ${history.length ? `
      <div>
        <div style="font-size:.72rem;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;">📋 Payment History (${history.length})</div>
        <div style="overflow-x:auto;border-radius:10px;border:1px solid rgba(255,255,255,.06);">
          <table style="width:100%;border-collapse:collapse;font-size:.78rem;">
            <thead>
              <tr style="background:rgba(255,255,255,.04);">
                <th style="text-align:left;padding:8px 12px;color:rgba(255,255,255,.35);font-weight:600;white-space:nowrap;">Date</th>
                <th style="text-align:left;padding:8px 12px;color:rgba(255,255,255,.35);font-weight:600;">MRP</th>
                <th style="text-align:left;padding:8px 12px;color:rgba(255,255,255,.35);font-weight:600;">Paid</th>
                <th style="text-align:left;padding:8px 12px;color:rgba(255,255,255,.35);font-weight:600;">Discount</th>
                <th style="text-align:left;padding:8px 12px;color:rgba(255,255,255,.35);font-weight:600;">Method</th>
                <th style="text-align:left;padding:8px 12px;color:rgba(255,255,255,.35);font-weight:600;">Period</th>
                <th style="text-align:left;padding:8px 12px;color:rgba(255,255,255,.35);font-weight:600;">Note</th>
                <th style="text-align:center;padding:8px 12px;color:rgba(255,255,255,.35);font-weight:600;">Receipt</th>
              </tr>
            </thead>
            <tbody>
              ${history.map((h,idx) => {
                const mrp  = Number(h.originalPrice||h.amount);
                const paid = Number(h.amount);
                const disc = mrp>paid ? Math.round((mrp-paid)/mrp*1000)/10 : 0;
                return `
              <tr style="border-top:1px solid rgba(255,255,255,.04);">
                <td style="padding:8px 12px;color:rgba(255,255,255,.6);white-space:nowrap;">${formatDate(h.date)}</td>
                <td style="padding:8px 12px;color:rgba(255,255,255,.45);">₹${mrp.toLocaleString()}</td>
                <td style="padding:8px 12px;color:#10b981;font-weight:700;">₹${paid.toLocaleString()}</td>
                <td style="padding:8px 12px;">
                  ${disc>0
                    ? `<span style="background:rgba(16,185,129,.12);color:#10b981;border-radius:12px;padding:2px 8px;font-weight:700;font-size:.72rem;">${disc}% off</span>`
                    : `<span style="color:rgba(255,255,255,.25);">—</span>`}
                </td>
                <td style="padding:8px 12px;color:rgba(255,255,255,.6);">${h.method||'—'}</td>
                <td style="padding:8px 12px;color:rgba(255,255,255,.6);">${h.period||'—'}</td>
                <td style="padding:8px 12px;color:rgba(255,255,255,.4);">${h.note||'—'}</td>
                <td style="padding:8px 12px;text-align:center;">
                  <button onclick="printSubReceipt('${school.id}',${idx})"
                    style="background:rgba(99,102,241,.15);color:#a78bfa;border:1px solid rgba(99,102,241,.3);border-radius:6px;padding:4px 10px;cursor:pointer;font-size:.72rem;font-weight:700;white-space:nowrap;">
                    🧾 Receipt
                  </button>
                </td>
              </tr>`;}).join('')}
            </tbody>
          </table>
        </div>
      </div>` : `<div style="font-size:.78rem;color:rgba(255,255,255,.25);padding:4px 0;">No payment records yet.</div>`}
    </div>`;
  }).join('');
}

function openSubscriptionModal(schoolId) {
  const school = getSchools().find(s => s.id === schoolId);
  if (!school) return;

  const subInfo = getSubscriptionLabel(school);
  const t = today();

  buildModal('modal-subscription', `💳 Subscription — ${school.name}`, `
    <!-- Current status banner -->
    <div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:14px 16px;margin-bottom:20px;">
      <div style="font-size:.72rem;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;">Current Status</div>
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
        <span style="padding:3px 12px;border-radius:20px;font-size:.74rem;font-weight:700;background:${subInfo.bg};color:${subInfo.color};border:1px solid ${subInfo.border};">${subInfo.label}</span>
        ${school.subscriptionEnd && school.subscriptionType !== 'lifetime'
          ? `<span style="font-size:.78rem;color:rgba(255,255,255,.4);">Expires: <strong style="color:#fff;">${formatDate(school.subscriptionEnd)}</strong></span>` : ''}
        ${school.subscriptionType === 'lifetime' ? `<span style="font-size:.78rem;color:#10b981;">Never expires</span>` : ''}
      </div>
    </div>

    <div style="font-weight:600;color:rgba(255,255,255,.7);font-size:.85rem;margin-bottom:14px;">🔄 Set / Renew Subscription</div>

    <div class="form-group">
      <label class="form-label">Subscription Type *</label>
      <select class="form-control" id="sub-type" onchange="_subTypeChange()">
        <option value="">— Select Type —</option>
        <option value="monthly"  ${school.subscriptionType==='monthly'  ?'selected':''}>📆 Monthly (1 month)</option>
        <option value="yearly"   ${school.subscriptionType==='yearly'   ?'selected':''}>📅 Yearly (12 months)</option>
        <option value="demo"     ${school.subscriptionType==='demo'     ?'selected':''}>🔬 Demo / Trial</option>
        <option value="lifetime" ${school.subscriptionType==='lifetime' ?'selected':''}>♾️ Lifetime</option>
      </select>
    </div>

    <div id="sub-demo-days-row" class="form-group" style="display:${school.subscriptionType==='demo'?'block':'none'};">
      <label class="form-label">Trial Duration</label>
      <select class="form-control" id="sub-demo-days" onchange="_subTypeChange()">
        <option value="2"  ${school.demoDays==2 ?'selected':''}>2 Days</option>
        <option value="7"  ${school.demoDays==7 ?'selected':''}>7 Days</option>
        <option value="14" ${school.demoDays==14?'selected':''}>14 Days</option>
        <option value="30" ${school.demoDays==30?'selected':''}>30 Days</option>
      </select>
    </div>

    <div class="form-grid-2">
      <div class="form-group">
        <label class="form-label">Start Date</label>
        <input class="form-control" type="date" id="sub-start" value="${t}" oninput="_subTypeChange()">
      </div>
      <div class="form-group">
        <label class="form-label">End Date <span style="font-size:.72rem;color:rgba(255,255,255,.35);">(auto-calculated)</span></label>
        <input class="form-control" type="date" id="sub-end" value="${school.subscriptionEnd||''}">
      </div>
    </div>

    <div id="sub-lifetime-note" style="display:${school.subscriptionType==='lifetime'?'block':'none'};font-size:.78rem;color:#10b981;padding:8px 12px;background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.2);border-radius:8px;margin-bottom:12px;">
      ♾️ Lifetime subscription — never expires. No end date required.
    </div>

    <hr style="border-color:rgba(255,255,255,.08);margin:18px 0;">
    <div style="font-weight:600;color:rgba(255,255,255,.7);font-size:.85rem;margin-bottom:14px;">💰 Record Payment <span style="font-weight:400;color:rgba(255,255,255,.35);font-size:.78rem;">(optional — needed for receipt)</span></div>

    <div class="form-grid-2">
      <div class="form-group">
        <label class="form-label">Original Price / MRP (₹) <span style="color:#94a3b8;font-size:.72rem;">(your list price)</span></label>
        <input class="form-control" type="number" id="sub-original-price" placeholder="e.g. 12000" min="0" oninput="_subDiscountPreview()">
      </div>
      <div class="form-group">
        <label class="form-label">Amount Paid (₹) <span style="color:#94a3b8;font-size:.72rem;">(actual received)</span></label>
        <input class="form-control" type="number" id="sub-amount" placeholder="0" min="0" oninput="_subDiscountPreview()">
      </div>
    </div>

    <div id="sub-discount-preview" style="display:none;margin-bottom:14px;border-radius:10px;padding:12px 16px;background:rgba(99,102,241,.08);border:1px solid rgba(99,102,241,.2);">
      <div style="display:flex;gap:20px;flex-wrap:wrap;align-items:center;">
        <div style="text-align:center;">
          <div style="font-size:.68rem;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px;">MRP</div>
          <div id="sdp-mrp" style="font-size:1rem;font-weight:700;color:rgba(255,255,255,.5);text-decoration:line-through;"></div>
        </div>
        <div style="font-size:1.4rem;color:rgba(255,255,255,.2);">→</div>
        <div style="text-align:center;">
          <div style="font-size:.68rem;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px;">Amount Paid</div>
          <div id="sdp-paid" style="font-size:1.1rem;font-weight:800;color:#10b981;"></div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:.68rem;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px;">Discount Given</div>
          <div id="sdp-disc" style="font-size:1rem;font-weight:800;color:#f59e0b;"></div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:.68rem;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px;">You Save</div>
          <div id="sdp-save" style="font-size:1rem;font-weight:700;color:#a78bfa;"></div>
        </div>
      </div>
    </div>

    <div class="form-grid-2">
      <div class="form-group">
        <label class="form-label">Payment Method</label>
        <select class="form-control" id="sub-method">
          <option value="">— Select —</option>
          <option>Cash</option>
          <option>Bank Transfer</option>
          <option>UPI</option>
          <option>Cheque</option>
          <option>Online</option>
          <option>Other</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Transaction / Reference No.</label>
        <input class="form-control" id="sub-txn" placeholder="e.g. Txn #123456, Cheque #789">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Note / Remarks</label>
      <input class="form-control" id="sub-note" placeholder="e.g. Renewal for 2026-27, Annual package">
    </div>`,
    () => saveSubscription(schoolId), 'lg');

  // Auto-calculate end date based on type + start
  window._subTypeChange = function () {
    const type     = document.getElementById('sub-type').value;
    const start    = document.getElementById('sub-start').value;
    const demoDays = parseInt(document.getElementById('sub-demo-days').value) || 7;

    document.getElementById('sub-demo-days-row').style.display   = (type === 'demo')     ? 'block' : 'none';
    document.getElementById('sub-lifetime-note').style.display   = (type === 'lifetime') ? 'block' : 'none';
    const endEl = document.getElementById('sub-end');

    if (type === 'lifetime') { endEl.value = ''; endEl.disabled = true; return; }
    endEl.disabled = false;
    if (!start || !type) return;

    const d = new Date(start);
    if      (type === 'monthly') d.setMonth(d.getMonth() + 1);
    else if (type === 'yearly')  d.setFullYear(d.getFullYear() + 1);
    else if (type === 'demo')    d.setDate(d.getDate() + demoDays);
    endEl.value = d.toISOString().split('T')[0];
  };

  // Prime the end-date calculation for the current selection
  setTimeout(() => { if (window._subTypeChange) window._subTypeChange(); }, 80);

  // Live discount preview
  window._subDiscountPreview = function() {
    const mrp  = Number(document.getElementById('sub-original-price')?.value) || 0;
    const paid = Number(document.getElementById('sub-amount')?.value)          || 0;
    const box  = document.getElementById('sub-discount-preview');
    if (!box) return;
    if (!mrp && !paid) { box.style.display = 'none'; return; }
    const effectiveMrp  = mrp || paid;
    const disc          = effectiveMrp > paid && mrp ? ((effectiveMrp-paid)/effectiveMrp*100) : 0;
    const save          = effectiveMrp - paid;
    box.style.display   = 'block';
    document.getElementById('sdp-mrp').textContent  = '₹' + effectiveMrp.toLocaleString();
    document.getElementById('sdp-paid').textContent = '₹' + paid.toLocaleString();
    document.getElementById('sdp-disc').textContent = disc > 0 ? Math.round(disc*10)/10 + '% OFF' : 'No discount';
    document.getElementById('sdp-save').textContent = save > 0 ? '₹' + save.toLocaleString() : '—';
  };
}

function _nextReceiptNo() {
  const n    = (SA.get('receiptCounter') || 0) + 1;
  SA.set('receiptCounter', n);
  return `VMT-${new Date().getFullYear()}-${String(n).padStart(4,'0')}`;
}

function saveSubscription(schoolId) {
  const type          = (document.getElementById('sub-type').value || '').trim();
  const start         = document.getElementById('sub-start').value;
  const demoDays      = parseInt(document.getElementById('sub-demo-days').value) || 7;
  const originalPrice = Number(document.getElementById('sub-original-price')?.value) || 0;
  const amount        = Number(document.getElementById('sub-amount').value) || 0;
  const method        = document.getElementById('sub-method').value;
  const txnNo         = (document.getElementById('sub-txn')?.value || '').trim();
  const note          = document.getElementById('sub-note').value.trim();

  const endEl = document.getElementById('sub-end');
  const end   = (endEl && !endEl.disabled) ? endEl.value : '';

  if (!type)                       { toast('Please select a subscription type', 'warning'); return; }
  if (type !== 'lifetime' && !end) { toast('Please set an end date', 'warning'); return; }

  const school = getSchools().find(s => s.id === schoolId);
  if (!school) return;

  const updates = {
    subscriptionType:  type,
    subscriptionStart: start || today(),
    subscriptionEnd:   type === 'lifetime' ? '' : end,
    status: 'active'
  };
  if (type === 'demo') updates.demoDays = demoDays;

  // Record payment if amount entered
  if (amount > 0) {
    const history   = Array.isArray(school.paymentHistory) ? school.paymentHistory : [];
    const periodMap = { monthly:'Monthly', yearly:'Yearly', demo:'Demo / Trial', lifetime:'Lifetime' };
    history.push({
      id:            'pay_' + Date.now(),
      receiptNo:     _nextReceiptNo(),
      originalPrice: originalPrice || amount,   // MRP; fallback to paid if not entered
      amount,
      date:          today(),
      method:        method || 'Cash',
      txnNo,
      period:        periodMap[type] || type,
      note,
      recordedBy:    _saName(),
      schoolId,
      subscriptionStart: start || today(),
      subscriptionEnd:   type === 'lifetime' ? '' : end
    });
    updates.paymentHistory = history;
  }

  updateSchool(schoolId, updates);
  closeAllModals();
  toast(`✅ Subscription saved for "${school.name}"`, 'success');
  renderSubscriptions();
  renderSchools();
}

// ── Subscription Receipt Printer ─────────────────────
function printSubReceipt(schoolId, payIdx) {
  const school  = getSchools().find(s => s.id === schoolId);
  if (!school) return;
  const history = school.paymentHistory || [];
  const pay     = history[payIdx];
  if (!pay) { toast('Payment record not found', 'error'); return; }

  const mrp       = Number(pay.originalPrice || pay.amount);
  const paid      = Number(pay.amount);
  const discAmt   = mrp - paid;
  const discPct   = mrp > paid ? Math.round((discAmt / mrp) * 1000) / 10 : 0;
  const balance   = Math.max(0, mrp - paid);
  const receiptNo = pay.receiptNo || ('VMT-' + new Date(pay.date || today()).getFullYear() + '-' + String(payIdx+1).padStart(4,'0'));

  // Validity range
  const subStart = pay.subscriptionStart || school.subscriptionStart || pay.date || today();
  const subEnd   = pay.subscriptionEnd   || school.subscriptionEnd   || '';
  const typeMap  = { monthly:'Monthly Subscription', yearly:'Yearly Subscription', demo:'Demo / Trial', lifetime:'Lifetime Subscription' };
  const planName = typeMap[school.subscriptionType] || (pay.period || 'Subscription');

  // Duration in days
  let durationText = '—';
  if (subStart && subEnd) {
    const days = Math.ceil((new Date(subEnd) - new Date(subStart)) / 86400000);
    durationText = days + ' Days';
  } else if (school.subscriptionType === 'lifetime') {
    durationText = 'Lifetime (No Expiry)';
  }

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
    *{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:'Inter',sans-serif;background:#f8fafc;color:#1e293b;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
    .receipt{max-width:720px;margin:30px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 30px rgba(0,0,0,.1);}
    /* Header */
    .r-header{background:linear-gradient(135deg,#0f172a 0%,#1e3a8a 60%,#0ea5e9 100%);padding:32px 40px;display:flex;align-items:flex-start;justify-content:space-between;gap:20px;}
    .r-logo-area{display:flex;align-items:center;gap:14px;}
    .r-logo-icon{width:50px;height:50px;background:linear-gradient(135deg,#6366f1,#0ea5e9);border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;}
    .r-company-name{font-size:18px;font-weight:800;color:#fff;letter-spacing:-.2px;}
    .r-company-tag{font-size:10px;color:rgba(255,255,255,.5);margin-top:2px;font-weight:500;}
    .r-title-block{text-align:right;}
    .r-doc-title{font-size:20px;font-weight:800;color:#fff;letter-spacing:.04em;text-transform:uppercase;}
    .r-receipt-no{font-size:12px;color:rgba(255,255,255,.6);margin-top:5px;}
    .r-receipt-date{font-size:12px;color:rgba(255,255,255,.5);margin-top:2px;}
    .r-paid-badge{display:inline-block;background:rgba(16,185,129,.25);border:1.5px solid rgba(16,185,129,.5);color:#6ee7b7;padding:4px 14px;border-radius:20px;font-size:11px;font-weight:800;letter-spacing:.06em;margin-top:10px;}
    /* Bill To / Provider */
    .r-parties{display:grid;grid-template-columns:1fr 1fr;gap:0;border-bottom:1px solid #e2e8f0;}
    .r-party{padding:24px 28px;}
    .r-party:first-child{border-right:1px solid #e2e8f0;}
    .r-party-label{font-size:9px;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:.1em;margin-bottom:10px;}
    .r-party-name{font-size:16px;font-weight:800;color:#0f172a;margin-bottom:6px;}
    .r-party-detail{font-size:12px;color:#64748b;line-height:1.8;}
    .r-party-detail strong{color:#334155;font-weight:600;}
    /* Service */
    .r-section{padding:22px 28px;border-bottom:1px solid #e2e8f0;}
    .r-section-title{font-size:9px;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:.1em;margin-bottom:14px;}
    .r-service-table{width:100%;border-collapse:collapse;}
    .r-service-table td{padding:6px 0;font-size:12.5px;vertical-align:top;}
    .r-service-table td:first-child{color:#64748b;width:160px;font-weight:500;}
    .r-service-table td:last-child{color:#1e293b;font-weight:600;}
    /* Pricing */
    .r-pricing{padding:22px 28px;border-bottom:1px solid #e2e8f0;background:#fafbfc;}
    .r-price-row{display:flex;justify-content:space-between;align-items:center;padding:8px 0;font-size:13px;}
    .r-price-row.divider{border-top:1px dashed #e2e8f0;margin-top:4px;padding-top:12px;}
    .r-price-row.total-row{background:linear-gradient(90deg,rgba(79,70,229,.06),rgba(14,165,233,.06));border-radius:10px;padding:12px 14px;margin:8px 0;border:1px solid rgba(79,70,229,.12);}
    .r-price-row.total-row .r-price-label{font-weight:800;color:#1e293b;font-size:14px;}
    .r-price-row.total-row .r-price-val{font-weight:900;color:#4f46e5;font-size:16px;}
    .r-price-label{color:#475569;font-weight:500;}
    .r-price-val{font-weight:700;color:#1e293b;}
    .r-price-val.green{color:#059669;}
    .r-price-val.red{color:#dc2626;}
    .r-price-val.strike{text-decoration:line-through;color:#94a3b8;font-weight:400;}
    .r-disc-badge{display:inline-block;background:#d1fae5;color:#059669;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700;margin-left:8px;}
    .r-balance-nil{display:inline-block;background:#dbeafe;color:#1d4ed8;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700;}
    /* Payment */
    .r-payment-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;padding:20px 28px;border-bottom:1px solid #e2e8f0;}
    .r-pay-item-label{font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px;}
    .r-pay-item-val{font-size:13px;font-weight:700;color:#1e293b;}
    /* Footer */
    .r-footer{padding:22px 28px 28px;}
    .r-footer-top{background:linear-gradient(90deg,rgba(16,185,129,.08),rgba(6,182,212,.06));border:1px solid rgba(16,185,129,.2);border-radius:12px;padding:14px 18px;display:flex;align-items:center;gap:12px;margin-bottom:18px;}
    .r-footer-top-icon{font-size:22px;}
    .r-footer-top-text{font-size:13px;font-weight:700;color:#065f46;}
    .r-footer-top-sub{font-size:11px;color:#064e3b;margin-top:2px;font-weight:400;}
    .r-footer-note{font-size:10.5px;color:#94a3b8;line-height:1.7;margin-bottom:18px;}
    .r-sig-row{display:flex;justify-content:space-between;align-items:flex-end;padding-top:16px;border-top:1px solid #e2e8f0;}
    .r-sig-left{font-size:11px;color:#94a3b8;}
    .r-sig-right{text-align:right;}
    .r-sig-line{border-top:1.5px solid #334155;width:180px;margin-bottom:6px;}
    .r-sig-name{font-size:12px;font-weight:700;color:#1e293b;}
    .r-sig-title{font-size:10px;color:#64748b;}
    @media print{body{background:#fff;}.receipt{box-shadow:none;border-radius:0;margin:0;max-width:100%;}}
  `;

  const fmtMoney = n => '₹' + Number(n).toLocaleString('en-IN', {minimumFractionDigits:2, maximumFractionDigits:2});
  const fmtDate  = d => { if(!d) return '—'; try{ return new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'}); } catch{ return d; } };

  const html = `
  <div class="receipt">
    <!-- Header -->
    <div class="r-header">
      <div class="r-logo-area">
        <div class="r-logo-icon">🎯</div>
        <div>
          <div class="r-company-name">VissionMarg Technology</div>
          <div class="r-company-tag">Empowering Schools with Smart Technology</div>
        </div>
      </div>
      <div class="r-title-block">
        <div class="r-doc-title">Subscription Receipt</div>
        <div class="r-receipt-no">Receipt No: <strong style="color:#fff;">${receiptNo}</strong></div>
        <div class="r-receipt-date">Date: ${fmtDate(pay.date || today())}</div>
        <div class="r-paid-badge">✅ PAID</div>
      </div>
    </div>

    <!-- Billed To / Service Provider -->
    <div class="r-parties">
      <div class="r-party">
        <div class="r-party-label">Billed To</div>
        <div class="r-party-name">${school.name}</div>
        <div class="r-party-detail">
          <strong>School ID:</strong> ${school.id}<br>
          ${school.address ? `<strong>Address:</strong> ${school.address}<br>` : ''}
          <strong>Admin User:</strong> ${school.adminUsername || 'admin'}<br>
          <strong>Plan:</strong> ${planName}
        </div>
      </div>
      <div class="r-party">
        <div class="r-party-label">Service Provider</div>
        <div class="r-party-name">VissionMarg Technology</div>
        <div class="r-party-detail">
          <strong>Founder:</strong> Abhishek Patel<br>
          <strong>Mobile / WhatsApp:</strong> +91 9128600175<br>
          <strong>Email:</strong> abhishek.patel0076@gmail.com<br>
          <strong>Sector:</strong> Education Technology (EdTech)
        </div>
      </div>
    </div>

    <!-- Service Details -->
    <div class="r-section">
      <div class="r-section-title">📋 Service Details</div>
      <table class="r-service-table">
        <tr><td>Service Name</td><td>School Management System</td></tr>
        <tr><td>Subscription Plan</td><td>${planName}</td></tr>
        <tr><td>Valid From</td><td>${fmtDate(subStart)}</td></tr>
        <tr><td>Valid Till</td><td>${school.subscriptionType === 'lifetime' ? '<span style="color:#059669;font-weight:700;">Lifetime — Never Expires ♾️</span>' : fmtDate(subEnd)}</td></tr>
        <tr><td>Duration</td><td>${durationText}</td></tr>
        ${pay.recordedBy ? `<tr><td>Processed By</td><td>${pay.recordedBy}</td></tr>` : ''}
      </table>
    </div>

    <!-- Pricing Summary -->
    <div class="r-pricing">
      <div class="r-section-title">💰 Pricing Summary</div>

      <div class="r-price-row">
        <span class="r-price-label">List Price (MRP)</span>
        <span class="r-price-val strike">${fmtMoney(mrp)}</span>
      </div>

      ${discAmt > 0 ? `
      <div class="r-price-row">
        <span class="r-price-label">
          Discount Given
          <span class="r-disc-badge">${discPct}% OFF</span>
        </span>
        <span class="r-price-val" style="color:#dc2626;">- ${fmtMoney(discAmt)}</span>
      </div>` : ''}

      <div class="r-price-row total-row">
        <span class="r-price-label">Amount Paid</span>
        <span class="r-price-val">${fmtMoney(paid)}</span>
      </div>

      <div class="r-price-row divider">
        <span class="r-price-label">Balance Due</span>
        <span class="r-price-val ${balance === 0 ? 'green' : 'red'}">
          ${balance === 0
            ? '<span class="r-balance-nil">✅ NIL — Fully Paid</span>'
            : fmtMoney(balance)}
        </span>
      </div>
    </div>

    <!-- Payment Details -->
    <div class="r-payment-grid">
      <div>
        <div class="r-pay-item-label">Payment Method</div>
        <div class="r-pay-item-val">${pay.method || '—'}</div>
      </div>
      <div>
        <div class="r-pay-item-label">Transaction / Ref. No.</div>
        <div class="r-pay-item-val">${pay.txnNo || pay.note || '—'}</div>
      </div>
      <div>
        <div class="r-pay-item-label">Payment Date</div>
        <div class="r-pay-item-val">${fmtDate(pay.date || today())}</div>
      </div>
    </div>

    <!-- Footer -->
    <div class="r-footer">
      <div class="r-footer-top">
        <div class="r-footer-top-icon">🎉</div>
        <div>
          <div class="r-footer-top-text">Payment Successfully Received — Thank You!</div>
          <div class="r-footer-top-sub">Thank you for choosing VissionMarg Technology. We look forward to serving ${school.name}.</div>
        </div>
      </div>
      <div class="r-footer-note">
        • This is a computer-generated receipt and is legally valid without a physical signature.<br>
        • For any queries regarding this receipt, contact us at <strong>+91 9128600175</strong> or <strong>abhishek.patel0076@gmail.com</strong>.<br>
        • Subscription validity is subject to continued active status. For support, renewal, or upgrades, contact VissionMarg Technology directly.
      </div>
      <div class="r-sig-row">
        <div class="r-sig-left">
          Receipt No: <strong>${receiptNo}</strong><br>
          Generated: ${fmtDate(today())}
        </div>
        <div class="r-sig-right">
          <div class="r-sig-line"></div>
          <div class="r-sig-name">Abhishek Patel</div>
          <div class="r-sig-title">Founder & Tech Head — VissionMarg Technology</div>
        </div>
      </div>
    </div>
  </div>`;

  printHtml(html, `Receipt ${receiptNo} — ${school.name}`, css);
}

// ── Quick credential change modal from schools list ───
function quickChangeCreds(schoolId) {
  const school = getSchools().find(s => s.id === schoolId);
  if (!school) return;
  buildModal('modal-quick-creds', `🔑 Change Credentials — ${school.name}`, `
    <div class="form-group"><label class="form-label">Admin Username *</label>
      <input class="form-control" id="qc-user" value="${school.adminUsername||'admin'}"></div>
    <div class="form-group"><label class="form-label">New Password *</label>
      <input type="password" class="form-control" id="qc-pwd" placeholder="New password"></div>
    <div class="form-group"><label class="form-label">Confirm Password *</label>
      <input type="password" class="form-control" id="qc-pwd2" placeholder="Confirm password"></div>`,
    () => {
      const user = document.getElementById('qc-user').value.trim();
      const p1   = document.getElementById('qc-pwd').value;
      const p2   = document.getElementById('qc-pwd2').value;
      if (!user) { toast('Username required', 'warning'); return; }
      if (p1 && p1 !== p2) { toast('Passwords do not match', 'error'); return; }
      updateSchool(schoolId, { adminUsername: user, adminPassword: p1 || school.adminPassword });
      _syncAdminUser(schoolId, user, p1 || school.adminPassword, school.name);
      closeAllModals();
      toast('Credentials updated!', 'success');
      renderSchools();
    });
}
