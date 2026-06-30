/* =====================================================
   ADMIN.JS  —  Complete Admin Panel
===================================================== */

// ── Auth ──────────────────────────────────────────────
const CU = requireAuth('admin');
if (!CU) throw new Error('Not authenticated');
document.getElementById('adminName').textContent   = CU.name;
document.getElementById('adminAvatar').textContent = CU.name[0].toUpperCase();

// ── Theme (Day / Night) ───────────────────────────────
(function _restoreTheme() {
  if (localStorage.getItem('vm_theme') === 'light') {
    document.body.classList.add('light-mode');
    _vmEnableLightMode();
  }
  _syncThemeIcon();
})();

function _syncThemeIcon() {
  const btn = document.getElementById('themeToggle');
  if (!btn) return;
  const isLight = document.body.classList.contains('light-mode');
  btn.textContent = isLight ? '🌙' : '☀️';
  btn.title = isLight ? 'Switch to Night Mode' : 'Switch to Day Mode';
}

function toggleTheme() {
  const isLight = document.body.classList.toggle('light-mode');
  const theme = isLight ? 'light' : 'dark';
  localStorage.setItem('vm_theme', theme);
  if (isLight) _vmEnableLightMode(); else _vmDisableLightMode();
  _syncThemeIcon();
  showToast(isLight ? '☀️ Day mode on' : '🌙 Night mode on', 'info', 1800);
  if (window.AndroidBridge) window.AndroidBridge.setTheme(theme);
}

// ── Build section containers ──────────────────────────
(function buildSections() {
  const ids = ['dashboard','classes','students','teachers','attendance','homework',
               'timetable','exams','curriculum','materials','qpapers',
               'teacherattendance','teachertasks','questionbank','papergenerator',
               'cameras','vehicles','messages',
               'fees','accounts','salary','idcards','reportcards',
               'inventory','notices','leaves','leaderboard','gallery',
               'certificates','reminders','settings','assignments','website','birthdays','calendar','examinsights','communication','pwdresets','help','session','growth'];
  document.getElementById('pageBody').innerHTML =
    ids.map(s=>`<div class="section-content" id="section-${s}"></div>`).join('');
})();

// ── Register renderers (no function-override needed) ──
window._sectionRenderers = {
  dashboard:          renderDashboard,
  classes:            renderClasses,
  students:           ()=>renderStudents(''),
  teachers:           renderTeachers,
  attendance:         renderAttendance,
  homework:           renderHomework,
  timetable:          renderTimetable,
  exams:              renderExams,
  curriculum:         renderCurriculum,
  materials:          renderMaterials,
  qpapers:            renderQPapers,
  teacherattendance:  renderTeacherAttendance,
  teachertasks:       renderTeacherTasks,
  questionbank:       renderQuestionBank,
  papergenerator:     renderPaperGenerator,
  cameras:            renderCameras,
  vehicles:           renderVehicles,
  messages:           ()=>renderAdminMessages(),
  fees:               renderFees,
  accounts:           renderAccounts,
  salary:             renderSalary,
  idcards:            renderIDCards,
  reportcards:        renderReportCards,
  inventory:          renderInventory,
  notices:            renderNotices,
  leaves:             renderLeaves,
  leaderboard:        renderLeaderboard,
  gallery:            renderGallery,
  certificates:       renderCertificates,
  reminders:          renderReminders,
  settings:           renderSettings,
  assignments:        renderAdminAssignments,
  website:            ()=>renderWebsiteBuilder(),
  birthdays:          renderBirthdays,
  calendar:           ()=>vmCalMount('section-calendar',{editable:true}),
  examinsights:       renderExamInsights,
  communication:      renderCommunication,
  pwdresets:          renderPwdResets,
  help:               renderHelp,
  session:            renderSession,
  growth:             renderGrowth,
};

initSidebar();
initNav();

// ── Feature Visibility (controlled by Super Admin) ────
// Super admin sets which features each school can access.
// Features not in the list are hidden from sidebar + locked in content area.
(function _applyFeatureVisibility() {
  const features = getSchoolFeatures(); // null = all features enabled

  // Build a locked-section renderer for disabled features
  function _lockedRenderer(sectionId) {
    return function() {
      const el = document.getElementById('section-' + sectionId);
      if (!el) return;
      el.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;
                    min-height:320px;gap:16px;color:rgba(255,255,255,.3);text-align:center;padding:32px;">
          <div style="font-size:4rem;opacity:.6;">🔒</div>
          <div style="font-size:1.1rem;font-weight:700;color:rgba(255,255,255,.5);">Feature Not Available</div>
          <div style="font-size:.85rem;max-width:280px;line-height:1.7;">
            This feature is not enabled for your school.<br>
            Please contact your administrator.
          </div>
        </div>`;
    };
  }

  if (!features) return; // null → all enabled, nothing to hide

  // Always keep these visible regardless of feature list
  const ALWAYS_ON = ['dashboard', 'settings', 'pwdresets', 'help', 'session', 'growth'];

  // 1. Hide sidebar nav items that are not enabled
  document.querySelectorAll('.nav-item[data-section]').forEach(el => {
    const sec = el.dataset.section;
    if (!ALWAYS_ON.includes(sec) && !features.includes(sec)) {
      el.style.display = 'none';
    }
  });

  // 2. Hide section-label dividers that have no visible children
  document.querySelectorAll('.sidebar-nav .nav-section-label').forEach(label => {
    let sibling = label.nextElementSibling;
    let hasVisible = false;
    while (sibling && !sibling.classList.contains('nav-section-label')) {
      if (sibling.classList.contains('nav-item') && sibling.style.display !== 'none') {
        hasVisible = true;
        break;
      }
      sibling = sibling.nextElementSibling;
    }
    if (!hasVisible) label.style.display = 'none';
  });

  // 3. Lock renderers for disabled sections (shows locked UI if accessed directly)
  Object.keys(window._sectionRenderers).forEach(key => {
    if (!ALWAYS_ON.includes(key) && !features.includes(key)) {
      window._sectionRenderers[key] = _lockedRenderer(key);
    }
  });
})();

// ── Dynamic sidebar school name + page title ──────────
(function _initSchoolBranding(){
  const s = getSettings();
  const name = s.schoolName || '';
  const logo = s.schoolLogo || '';
  const ay   = s.academicYear || '';
  if (name) {
    const nameEl = document.getElementById('sidebarSchoolName');
    if (nameEl) nameEl.textContent = name;
    document.title = 'Admin Panel — ' + name;
  }
  if (logo) {
    const markEl = document.getElementById('sidebarLogoMark');
    if (markEl) markEl.innerHTML = `<img src="${logo}" style="width:32px;height:32px;border-radius:6px;object-fit:contain;background:#fff;padding:2px">`;
  }
  _updateSidebarSession(ay);
})();

function _updateSidebarSession(ay){
  const el = document.getElementById('sidebarSessionYear');
  if (!el) return;
  if (ay) { el.textContent = '📅 Session ' + ay; el.style.display = ''; }
  else     { el.style.display = 'none'; }
}

// ══════════════════════════════════════════════════════
//  DASHBOARD
// ══════════════════════════════════════════════════════
function renderDashboard() {
  const students = DB.get('students');
  const teachers = DB.get('teachers');
  const classes  = DB.get('classes');
  const accounts = DB.get('accounts');
  const notices  = DB.get('notices');
  const leaves   = DB.get('leaves').filter(l=>l.status==='pending');
  const s        = getSettings();
  const cur      = s.currency||'₹';
  const income   = accounts.filter(a=>a.type==='income').reduce((t,a)=>t+Number(a.amount),0);
  const expense  = accounts.filter(a=>a.type==='expense').reduce((t,a)=>t+Number(a.amount),0);
  const totalFee = students.reduce((t,x)=>t+Number(x.feeTotal||0),0);
  const paidFee  = students.reduce((t,x)=>t+Number(x.feePaid||0),0);

  const el = document.getElementById('section-dashboard');
  el.innerHTML = `
  <div class="page-header">
    <div><h2>Dashboard</h2><div class="breadcrumb">Welcome back, <span>${CU.name}</span>${s.schoolName?` &nbsp;·&nbsp; ${s.schoolName}`:''}</div></div>
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
      ${s.academicYear?`<span style="background:linear-gradient(135deg,rgba(124,58,237,.2),rgba(124,58,237,.08));color:#a78bfa;border:1px solid rgba(124,58,237,.25);border-radius:20px;padding:5px 14px;font-size:12px;font-weight:700;letter-spacing:.3px;">📅 Session ${s.academicYear}</span>`:''}
      <span class="chip">🗓️ ${formatDate(today())}</span>
    </div>
  </div>

  <div class="stats-grid">
    <div class="stat-card purple" style="cursor:pointer" onclick="activateNav('students')">
      <div class="stat-icon">👨‍🎓</div><div class="stat-value">${students.length}</div><div class="stat-label">Total Students</div>
    </div>
    <div class="stat-card cyan" style="cursor:pointer" onclick="activateNav('teachers')">
      <div class="stat-icon">👩‍🏫</div><div class="stat-value">${teachers.length}</div><div class="stat-label">Total Teachers</div>
    </div>
    <div class="stat-card pink" style="cursor:pointer" onclick="activateNav('classes')">
      <div class="stat-icon">🏫</div><div class="stat-value">${classes.length}</div><div class="stat-label">Total Classes</div>
    </div>
    <div class="stat-card green" style="cursor:pointer" onclick="activateNav('fees')">
      <div class="stat-icon">💰</div><div class="stat-value">${cur}${(paidFee/1000).toFixed(1)}K</div><div class="stat-label">Fees Collected</div>
    </div>
    ${s.hideFinancialDashboard
      ? `<div class="stat-card" style="cursor:pointer;border:2px dashed var(--border);opacity:.6" onclick="toggleFinancialView()">
          <div class="stat-icon">🙈</div><div class="stat-value" style="font-size:1rem">Hidden</div><div class="stat-label">Income · Click to show</div>
         </div>
         <div class="stat-card" style="cursor:pointer;border:2px dashed var(--border);opacity:.6" onclick="toggleFinancialView()">
          <div class="stat-icon">🙈</div><div class="stat-value" style="font-size:1rem">Hidden</div><div class="stat-label">Expense · Click to show</div>
         </div>`
      : `<div class="stat-card yellow" style="cursor:pointer" onclick="activateNav('accounts')">
          <div class="stat-icon">📈</div><div class="stat-value">${cur}${(income/1000).toFixed(1)}K</div><div class="stat-label">Total Income</div>
         </div>
         <div class="stat-card orange" style="cursor:pointer" onclick="activateNav('accounts')">
          <div class="stat-icon">📉</div><div class="stat-value">${cur}${(expense/1000).toFixed(1)}K</div><div class="stat-label">Total Expenses</div>
         </div>`}
  </div>

  <!-- Financial visibility quick toggle -->
  <div style="display:flex;justify-content:flex-end;margin-top:-12px;margin-bottom:16px">
    <button onclick="toggleFinancialView()" style="background:${s.hideFinancialDashboard?'rgba(239,68,68,.12)':'rgba(100,116,139,.1)'};color:${s.hideFinancialDashboard?'#ef4444':'#64748b'};border:1px solid ${s.hideFinancialDashboard?'rgba(239,68,68,.3)':'var(--border)'};border-radius:20px;padding:4px 14px;font-size:11px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:5px;">
      ${s.hideFinancialDashboard?'🙈 Income/Expense Hidden — Click to Show':'👁️ Hide Income/Expense'}
    </button>
  </div>

  <div class="quick-actions">
    ${(function(){
      const _ft = getSchoolFeatures();
      return [['➕','Add Student','students'],['➕','Add Teacher','teachers'],['🏫','New Class','classes'],
         ['✅','Attendance','attendance'],['📝','Exams','exams'],['💳','Fees','fees'],
         ['📢','Notices','notices'],['📊','Reports','reportcards'],['🏆','Leaderboard','leaderboard']]
        .filter(([,, sec]) => !_ft || _ft.includes(sec))
        .map(([ic,lb,sec])=>`<div class="q-action" onclick="activateNav('${sec}')"><div class="qa-icon">${ic}</div><div class="qa-label">${lb}</div></div>`)
        .join('');
    })()}
  </div>

  <div class="grid-2 mb-24">
    <div class="card">
      <div class="card-header"><h3>📢 Recent Notices</h3>
        <button class="btn btn-sm btn-primary" onclick="activateNav('notices')">View All</button></div>
      <div class="card-body">
        ${notices.slice(-4).reverse().map(n=>`
          <div class="notice-card ${n.type}" style="margin-bottom:10px">
            <div class="notice-title">${n.title}</div>
            <div class="notice-meta"><span>📅 ${formatDate(n.date)}</span>
              <span class="badge ${n.type==='urgent'?'badge-red':n.type==='info'?'badge-cyan':'badge-purple'}">${n.type}</span>
            </div>
          </div>`).join('')||'<div class="empty-state"><div class="e-icon">📢</div><p>No notices yet</p></div>'}
      </div>
    </div>
    <div class="card">
      <div class="card-header"><h3>📅 Pending Leaves (${leaves.length})</h3>
        <button class="btn btn-sm btn-primary" onclick="activateNav('leaves')">Manage</button></div>
      <div class="card-body">
        ${leaves.slice(0,4).map(l=>{
          const isTeacher = l.type==='teacher';
          const person = isTeacher ? DB.find('teachers',l.teacherId) : DB.find('students',l.studentId);
          const label  = isTeacher ? '👩‍🏫 Teacher' : '👨‍🎓 Student';
          const avatar = person ? person.name[0] : (isTeacher?'T':'S');
          const color  = isTeacher ? 'rgba(124,58,237,.25)' : 'rgba(59,130,246,.2)';
          return `<div style="padding:12px;background:var(--glass);border-radius:10px;margin-bottom:8px">
            <div class="d-flex align-center gap-8 mb-8">
              <div class="avatar-sm" style="background:${color}">${avatar}</div>
              <div><div class="fw-6">${person?person.name:'Unknown'} <span style="font-size:10px;opacity:.6">${label}</span></div>
                <div class="text-xs text-muted">${formatDate(l.fromDate)} – ${formatDate(l.toDate)}</div></div>
            </div>
            <div class="text-sm text-2 mb-8">${l.reason}</div>
            <div class="d-flex gap-8">
              <button class="btn btn-sm btn-success" onclick="approveLeave('${l.id}','approved')">✅ Approve</button>
              <button class="btn btn-sm btn-danger"  onclick="approveLeave('${l.id}','rejected')">❌ Reject</button>
            </div>
          </div>`;
        }).join('')||'<div class="empty-state"><div class="e-icon">✅</div><p>No pending leaves</p></div>'}
      </div>
    </div>
  </div>

  <div class="card">
    <div class="card-header"><h3>💰 Fee Collection Overview</h3></div>
    <div class="card-body">
      <div class="fee-status">
        <div class="fee-box paid"><div class="fee-amount">${cur}${paidFee.toLocaleString()}</div><div class="fee-lbl">Collected</div></div>
        <div class="fee-box due"><div class="fee-amount">${cur}${(totalFee-paidFee).toLocaleString()}</div><div class="fee-lbl">Pending</div></div>
        <div class="fee-box total"><div class="fee-amount">${cur}${totalFee.toLocaleString()}</div><div class="fee-lbl">Total</div></div>
      </div>
      <div class="progress mt-8" style="height:10px">
        <div class="progress-bar green" style="width:${totalFee?Math.round(paidFee/totalFee*100):0}%"></div>
      </div>
      <div class="text-sm text-muted mt-8">${totalFee?Math.round(paidFee/totalFee*100):0}% collected</div>
    </div>
  </div>

  <!-- ── Analytics widgets (customizable) ── -->
  <div class="d-flex align-center justify-between mb-12" style="margin-top:24px;flex-wrap:wrap;gap:8px;">
    <h3 style="margin:0;">📊 Analytics Dashboard</h3>
    <button class="btn btn-secondary btn-sm" onclick="openDashCustomize()">⚙️ Customize Widgets</button>
  </div>
  <div id="dash-widgets" class="grid-2"></div>`;

  _dashRenderWidgets();
}

// ══════════════════════════════════════════════════════
//  CUSTOMIZABLE DASHBOARD WIDGETS
// ══════════════════════════════════════════════════════
const DASH_PAL = ['#7c3aed','#06b6d4','#10b981','#f59e0b','#ef4444','#3b82f6','#ec4899','#14b8a6','#a855f7','#f97316'];

const ADMIN_WIDGETS = [
  { id:'attendanceTrend', title:'📈 Attendance Trend (last 7 days)', chart:true },
  { id:'studentsByClass', title:'🏫 Students by Class',             chart:true },
  { id:'feeDoughnut',     title:'💰 Fee Collection',                chart:true },
  { id:'incomeExpense',   title:'📊 Income vs Expense',             chart:true },
  { id:'genderDonut',     title:'👥 Gender Distribution',           chart:true },
  { id:'examPerf',        title:'📝 Recent Exam Averages',          chart:true },
  { id:'topPerformers',   title:'🏆 Top 5 Performers',              chart:false },
];

function _dashGetWidgets(){
  const cfg = DB.getObj('dash_cfg');
  if (Array.isArray(cfg.adminWidgets)) return cfg.adminWidgets;
  return ADMIN_WIDGETS.map(w=>w.id); // default: all on
}
function _dashToggle(id){
  const cur = _dashGetWidgets();
  const next = cur.includes(id) ? cur.filter(x=>x!==id) : [...cur, id];
  DB.set('dash_cfg', { ...DB.getObj('dash_cfg'), adminWidgets: next });
  renderDashboard();
}
function openDashCustomize(){
  const enabled=_dashGetWidgets();
  buildModal('dash-cust','⚙️ Customize Dashboard', `
    <p style="color:var(--text-3);font-size:.85rem;margin-bottom:12px;">Choose which analytics widgets appear on your dashboard. Toggle on/off any time.</p>
    ${ADMIN_WIDGETS.map(w=>`
      <label style="display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid var(--border);border-radius:10px;margin-bottom:8px;cursor:pointer;">
        <input type="checkbox" data-dw="${w.id}" ${enabled.includes(w.id)?'checked':''}>
        <span style="font-weight:600;">${w.title}</span>
      </label>`).join('')}
  `, saveDashCustomize);
}
function saveDashCustomize(){
  const next=[...document.querySelectorAll('#dash-cust [data-dw]')].filter(c=>c.checked).map(c=>c.dataset.dw);
  DB.set('dash_cfg', { ...DB.getObj('dash_cfg'), adminWidgets: next });
  closeAllModals(); toast('✅ Dashboard updated','success'); renderDashboard();
}

function _dashChart(id,cfg){
  if(!window.Chart) return;
  const el=document.getElementById(id); if(!el) return;
  if(!window._dashCharts) window._dashCharts={};
  if(window._dashCharts[id]){ try{window._dashCharts[id].destroy();}catch(e){} }
  window._dashCharts[id]=new Chart(el,cfg);
}
function _dashBaseOpts(extra){
  return Object.assign({
    responsive:true, maintainAspectRatio:false,
    plugins:{ legend:{ labels:{ color:'#94a3b8', font:{size:11} } } },
    scales:{ x:{ ticks:{color:'#94a3b8'}, grid:{display:false} },
             y:{ ticks:{color:'#94a3b8'}, grid:{color:'rgba(148,163,184,.12)'} } }
  }, extra||{});
}

function _dashRenderWidgets(){
  const host=document.getElementById('dash-widgets'); if(!host) return;
  const enabled=_dashGetWidgets();
  const defs=ADMIN_WIDGETS.filter(w=>enabled.includes(w.id));
  if(!defs.length){ host.innerHTML='<div class="empty-state" style="grid-column:1/-1"><div class="e-icon">📊</div><p>No widgets selected — click "Customize Widgets" to add.</p></div>'; return; }
  host.innerHTML=defs.map(w=>`
    <div class="card" style="margin-bottom:16px;">
      <div class="card-header"><h3 style="font-size:.95rem;">${w.title}</h3>
        <button class="btn-icon" title="Remove from dashboard" onclick="_dashToggle('${w.id}')">✕</button></div>
      <div class="card-body" style="position:relative;${w.chart?'height:260px;':''}">
        ${w.chart?`<canvas id="dw-${w.id}"></canvas>`:`<div id="dw-${w.id}"></div>`}
      </div>
    </div>`).join('');
  (window._loadChartJs?window._loadChartJs():Promise.resolve()).then(()=>{
    defs.forEach(w=>{ try{ _dashWidgetRender(w.id); }catch(e){} });
  });
}

function _dashWidgetRender(id){
  const students=DB.get('students'), classes=DB.get('classes'), s=getSettings(), cur=s.currency||'₹';
  if(id==='attendanceTrend'){
    const att=DB.get('attendance');
    const dates=[...new Set(att.map(a=>a.date))].sort().slice(-7);
    const labels=dates.map(d=>formatDate(d).replace(/ \d{4}$/,''));
    const data=dates.map(d=>{const day=att.filter(a=>a.date===d);const p=day.filter(a=>a.status==='present').length;return day.length?Math.round(p/day.length*100):0;});
    _dashChart('dw-'+id,{type:'line',data:{labels,datasets:[{label:'% Present',data,borderColor:'#10b981',backgroundColor:'rgba(16,185,129,.15)',fill:true,tension:.4,borderWidth:3,pointBackgroundColor:'#10b981',pointRadius:4}]},options:_dashBaseOpts({scales:{x:{ticks:{color:'#94a3b8'},grid:{display:false}},y:{min:0,max:100,ticks:{color:'#94a3b8',callback:v=>v+'%'},grid:{color:'rgba(148,163,184,.12)'}}}})});
  }
  else if(id==='studentsByClass'){
    const labels=classes.map(c=>c.name);
    const data=classes.map(c=>students.filter(x=>x.classId===c.id).length);
    _dashChart('dw-'+id,{type:'bar',data:{labels,datasets:[{label:'Students',data,backgroundColor:labels.map((_,i)=>DASH_PAL[i%DASH_PAL.length]),borderRadius:8,borderSkipped:false}]},options:_dashBaseOpts({plugins:{legend:{display:false}}})});
  }
  else if(id==='feeDoughnut'){
    const paid=students.reduce((t,x)=>t+Number(x.feePaid||0),0);
    const pending=Math.max(0,students.reduce((t,x)=>t+Number(x.feeTotal||0),0)-paid);
    _dashChart('dw-'+id,{type:'doughnut',data:{labels:['Collected','Pending'],datasets:[{data:[paid,pending],backgroundColor:['#10b981','#ef4444'],borderWidth:0}]},options:{responsive:true,maintainAspectRatio:false,cutout:'68%',plugins:{legend:{position:'bottom',labels:{color:'#94a3b8'}},tooltip:{callbacks:{label:c=>c.label+': '+cur+Number(c.raw).toLocaleString()}}}}});
  }
  else if(id==='incomeExpense'){
    const acc=DB.get('accounts');
    const inc=acc.filter(a=>a.type==='income').reduce((t,a)=>t+Number(a.amount),0);
    const exp=acc.filter(a=>a.type==='expense').reduce((t,a)=>t+Number(a.amount),0);
    _dashChart('dw-'+id,{type:'bar',data:{labels:['Income','Expense'],datasets:[{data:[inc,exp],backgroundColor:['#10b981','#f59e0b'],borderRadius:8,borderSkipped:false}]},options:_dashBaseOpts({plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>cur+Number(c.raw).toLocaleString()}}}})});
  }
  else if(id==='genderDonut'){
    const g=k=>students.filter(s=>(s.gender||'').toLowerCase()===k).length;
    _dashChart('dw-'+id,{type:'doughnut',data:{labels:['Male','Female','Other'],datasets:[{data:[g('male'),g('female'),students.length-g('male')-g('female')],backgroundColor:['#3b82f6','#ec4899','#a855f7'],borderWidth:0}]},options:{responsive:true,maintainAspectRatio:false,cutout:'68%',plugins:{legend:{position:'bottom',labels:{color:'#94a3b8'}}}}});
  }
  else if(id==='examPerf'){
    const exams=DB.get('exams'), marks=DB.get('marks');
    const names=[...new Set(exams.map(e=>e.name))].slice(-6);
    const labels=names, data=names.map(nm=>{
      const exs=exams.filter(e=>e.name===nm); let o=0,m=0;
      exs.forEach(e=>{ marks.filter(x=>x.examId===e.id).forEach(x=>{o+=Number(x.obtained);m+=Number(e.maxMarks);}); });
      return m?Math.round(o/m*100):0;
    });
    _dashChart('dw-'+id,{type:'bar',data:{labels,datasets:[{label:'Avg %',data,backgroundColor:'rgba(124,58,237,.7)',borderRadius:8,borderSkipped:false}]},options:_dashBaseOpts({plugins:{legend:{display:false}},scales:{x:{ticks:{color:'#94a3b8'},grid:{display:false}},y:{min:0,max:100,ticks:{color:'#94a3b8',callback:v=>v+'%'},grid:{color:'rgba(148,163,184,.12)'}}}})});
  }
  else if(id==='topPerformers'){
    const exams=DB.get('exams'), marks=DB.get('marks');
    const scored=students.map(st=>{
      let o=0,m=0; exams.filter(e=>e.classId===st.classId).forEach(e=>{const mk=marks.find(x=>x.examId===e.id&&x.studentId===st.id); if(mk){o+=Number(mk.obtained);m+=Number(e.maxMarks);}});
      return {name:st.name, cls:(classes.find(c=>c.id===st.classId)||{}).name||'', pct:m?Math.round(o/m*100):null};
    }).filter(x=>x.pct!=null).sort((a,b)=>b.pct-a.pct).slice(0,5);
    const host=document.getElementById('dw-'+id);
    if(host) host.innerHTML = scored.length?scored.map((r,i)=>`
      <div style="display:flex;align-items:center;gap:12px;padding:10px 4px;border-bottom:1px solid var(--border);">
        <div style="width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;color:#fff;background:${['#f59e0b','#94a3b8','#b45309','#7c3aed','#06b6d4'][i]};">${i+1}</div>
        <div style="flex:1;"><div style="font-weight:700;">${esc(r.name)}</div><div style="font-size:.75rem;color:var(--text-3);">${esc(r.cls)}</div></div>
        <div style="font-weight:800;color:#10b981;">${r.pct}%</div>
      </div>`).join(''):'<div class="empty-state"><p>No exam data yet</p></div>';
  }
}

function toggleFinancialView(){
  const s = getSettings();
  const hide = !s.hideFinancialDashboard;
  updateSettings({ hideFinancialDashboard: hide });
  toast(hide ? '🙈 Income/Expense hidden from dashboard' : '👁️ Income/Expense visible on dashboard', 'info');
  renderDashboard();
}

// ══════════════════════════════════════════════════════
//  CLASSES
// ══════════════════════════════════════════════════════
function renderClasses() {
  const classes  = DB.get('classes');
  const students = DB.get('students');

  document.getElementById('section-classes').innerHTML = `
  <style>
    #_clsGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;}
    @media(max-width:900px){#_clsGrid{grid-template-columns:repeat(2,1fr);}}
    @media(max-width:560px){#_clsGrid{grid-template-columns:1fr;}}

    .cls-card{
      background:var(--glass);border:1px solid var(--border);
      border-radius:16px;transition:box-shadow .2s,border-color .2s;
      cursor:default;user-select:none;
    }
    .cls-card.drag-active{
      opacity:.35;border:2px dashed rgba(124,58,237,.5);
    }
    .cls-card.drag-over{
      border-color:#a78bfa;box-shadow:0 0 0 2px rgba(124,58,237,.35);
    }
    .cls-drag-handle{
      cursor:grab;padding:4px 6px;border-radius:6px;
      color:rgba(255,255,255,.25);font-size:1.1rem;line-height:1;
      transition:color .15s,background .15s;touch-action:none;
    }
    .cls-drag-handle:hover{color:rgba(255,255,255,.6);background:rgba(255,255,255,.07);}
    .cls-drag-handle:active{cursor:grabbing;}

    /* Floating clone while dragging */
    #_clsDragClone{
      position:fixed;pointer-events:none;z-index:9999;
      box-shadow:0 16px 40px rgba(0,0,0,.55);border-radius:16px;
      border:2px solid rgba(124,58,237,.7);opacity:.92;
      transition:none;
    }
    /* Drop placeholder gap */
    .cls-placeholder{
      border-radius:16px;background:rgba(124,58,237,.06);
      border:2px dashed rgba(124,58,237,.4);
      transition:height .15s;
    }
  </style>

  <div class="page-header">
    <div>
      <h2>🏫 Classes</h2>
      <div class="breadcrumb">Manage all classes &nbsp;·&nbsp; <span style="color:rgba(255,255,255,.35);font-size:.78rem;">⠿ drag to change order</span></div>
    </div>
    <button class="btn btn-primary" onclick="openClassModal()">➕ Add Class</button>
  </div>

  <div id="_clsGrid">
    ${classes.length ? classes.map(c => {
      const cnt = students.filter(s => s.classId === c.id).length;
      return `
      <div class="cls-card" data-class-id="${c.id}">
        <div style="padding:16px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
            <div style="display:flex;align-items:center;gap:10px;">
              <!-- Drag handle -->
              <div class="cls-drag-handle" title="Drag to reorder">⠿</div>
              <div style="width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#7c3aed,#06b6d4);display:flex;align-items:center;justify-content:center;font-size:1.3rem;flex-shrink:0;">🏫</div>
            </div>
            <div style="display:flex;gap:6px;">
              <button class="btn-icon" onclick="openClassModal('${c.id}')">✏️</button>
              <button class="btn-icon" onclick="deleteClass('${c.id}')">🗑️</button>
            </div>
          </div>
          <div class="fw-7 text-lg mb-4">${c.name}</div>
          <div class="text-sm text-2 mb-12">${c.grade ? `Grade ${c.grade} &nbsp;·&nbsp; ` : ''}Section ${c.section}</div>
          <span class="badge badge-purple">👨‍🎓 ${cnt} Students</span>
        </div>
      </div>`;
    }).join('') : '<div class="empty-state" style="grid-column:1/-1"><div class="e-icon">🏫</div><h3>No classes yet</h3></div>'}
  </div>`;

  _initClassDrag();
}

// ── Drag-and-drop reorder for class cards ─────────────
function _initClassDrag() {
  const grid = document.getElementById('_clsGrid');
  if (!grid || grid.querySelectorAll('[data-class-id]').length < 2) return;

  let dragging    = null;   // the real card being dragged
  let clone       = null;   // floating visual clone
  let placeholder = null;   // empty slot showing drop target
  let offsetX = 0, offsetY = 0;
  let cardW = 0, cardH = 0;

  function cardAt(x, y) {
    // Find which real card the pointer is over (exclude hidden dragging card)
    const cards = [...grid.querySelectorAll('[data-class-id]')]
      .filter(c => c !== dragging && !c.classList.contains('cls-placeholder'));
    for (const card of cards) {
      const r = card.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return card;
    }
    return null;
  }

  function onPointerDown(e) {
    // Only trigger from drag handle
    if (!e.target.closest('.cls-drag-handle')) return;
    e.preventDefault();

    dragging = e.currentTarget;
    const rect = dragging.getBoundingClientRect();
    cardW = rect.width; cardH = rect.height;
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    // Floating clone
    clone = dragging.cloneNode(true);
    clone.id = '_clsDragClone';
    clone.style.width  = cardW + 'px';
    clone.style.height = cardH + 'px';
    clone.style.left   = rect.left + 'px';
    clone.style.top    = rect.top  + 'px';
    document.body.appendChild(clone);

    // Placeholder same size as card
    placeholder = document.createElement('div');
    placeholder.className = 'cls-placeholder';
    placeholder.style.height = cardH + 'px';
    grid.insertBefore(placeholder, dragging);
    dragging.classList.add('drag-active');
    dragging.style.display = 'none';

    document.addEventListener('pointermove', onPointerMove, { passive: false });
    document.addEventListener('pointerup',   onPointerUp);
    document.addEventListener('pointercancel', onPointerUp);
  }

  function onPointerMove(e) {
    if (!clone) return;
    e.preventDefault();

    // Move clone
    clone.style.left = (e.clientX - offsetX) + 'px';
    clone.style.top  = (e.clientY - offsetY) + 'px';

    // Find card under centre of clone
    const cx = e.clientX - offsetX + cardW / 2;
    const cy = e.clientY - offsetY + cardH / 2;
    const over = cardAt(cx, cy);

    if (over) {
      const r = over.getBoundingClientRect();
      const mid = r.top + r.height / 2;
      if (cy < mid) {
        grid.insertBefore(placeholder, over);
      } else {
        grid.insertBefore(placeholder, over.nextSibling);
      }
    }
  }

  function onPointerUp() {
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup',   onPointerUp);
    document.removeEventListener('pointercancel', onPointerUp);

    if (!dragging || !placeholder) { _cleanDrag(); return; }

    // Insert real card where placeholder is
    grid.insertBefore(dragging, placeholder);
    dragging.style.display = '';
    dragging.classList.remove('drag-active');
    placeholder.remove();
    if (clone) clone.remove();

    // Persist new order
    const newOrder = [...grid.querySelectorAll('[data-class-id]')]
      .map(el => el.dataset.classId);
    const all = DB.get('classes');
    const reordered = newOrder.map(id => all.find(c => c.id === id)).filter(Boolean);
    // Append any classes missing from DOM (safety net)
    all.forEach(c => { if (!reordered.find(r => r.id === c.id)) reordered.push(c); });
    DB.set('classes', reordered);
    toast('✅ Class order saved!', 'success');

    dragging = null; clone = null; placeholder = null;
  }

  function _cleanDrag() {
    if (dragging) { dragging.style.display = ''; dragging.classList.remove('drag-active'); }
    if (placeholder) placeholder.remove();
    if (clone) clone.remove();
    dragging = null; clone = null; placeholder = null;
  }

  // Attach pointerdown to each card
  grid.querySelectorAll('[data-class-id]').forEach(card => {
    card.addEventListener('pointerdown', onPointerDown, { passive: false });
  });
}

function openClassModal(id=null) {
  const c=id?DB.find('classes',id):null;
  buildModal('modal-class', id?'Edit Class':'Add Class', `
    <div class="form-group"><label class="form-label">Class Name *</label>
      <input class="form-control" id="cls-name" placeholder="e.g. Class 6A" value="${c?c.name:''}"></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Grade <span style="color:var(--text-3);font-weight:400;font-size:11px">(optional)</span></label>
        <input class="form-control" id="cls-grade" placeholder="6" value="${c?c.grade:''}"></div>
      <div class="form-group"><label class="form-label">Section *</label>
        <input class="form-control" id="cls-section" placeholder="A" value="${c?c.section:''}"></div>
    </div>`, ()=>saveClass(id));
}
function saveClass(id) {
  const name=val('cls-name'),grade=val('cls-grade'),section=val('cls-section');
  if (!name||!section){toast('Class Name and Section are required','warning');return}
  if (id) DB.update('classes',id,{name,grade,section});
  else    DB.push('classes',{id:genId('cls'),name,grade,section});
  toast(id?'Class updated':'Class added','success');
  closeAllModals(); renderClasses();
}
function deleteClass(id) {
  if (!confirmAction('Delete this class? Students in this class won\'t have a class assigned.')) return;
  DB.delete('classes',id); toast('Class deleted','success'); renderClasses();
}

// ══════════════════════════════════════════════════════
//  STUDENTS
// ══════════════════════════════════════════════════════
function renderStudents(filter='') {
  const students = DB.get('students');
  const classes  = DB.get('classes');
  const list = filter
    ? students.filter(s=>s.name.toLowerCase().includes(filter.toLowerCase())||s.rollNo.includes(filter))
    : students;

  const pending = (DB.get('pendingAdmissions')||[]);

  document.getElementById('section-students').innerHTML = `
  <div class="page-header">
    <div>
      <h2>👨‍🎓 Students</h2>
      <div class="breadcrumb">Total: <span>${students.length}</span> students</div>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      <button class="btn btn-secondary" onclick="downloadStudentTemplate()">📄 Excel Template</button>
      <button class="btn btn-secondary" onclick="exportStudentsExcel()">📥 Export Excel</button>
      <button class="btn btn-secondary" onclick="openBulkUploadModal()">📤 Import Excel</button>
      <button class="btn btn-secondary" onclick="printAdmissionForm()">🖨️ Print Form</button>
      <button class="btn btn-secondary" onclick="openOnlineAdmissionPanel()">🔗 Online Admission</button>
      <button class="btn btn-primary"   onclick="openStudentModal()">➕ Add Student</button>
    </div>
  </div>

  ${pending.length ? `
  <!-- ── Pending Approvals Banner ─────────────────── -->
  <div style="background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.3);border-radius:14px;padding:14px 18px;margin-bottom:18px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
    <div style="display:flex;align-items:center;gap:10px;">
      <span style="font-size:1.5rem;">⏳</span>
      <div>
        <div style="font-weight:700;color:#f59e0b;">${pending.length} Pending Admission${pending.length>1?'s':''}</div>
        <div style="font-size:.78rem;color:rgba(255,255,255,.4);">Received from online form — approve or reject</div>
      </div>
    </div>
    <button class="btn btn-sm" style="background:rgba(245,158,11,.15);color:#f59e0b;border:1px solid rgba(245,158,11,.3);" onclick="renderPendingAdmissions()">📋 Review Karein</button>
  </div>` : ''}

  <div class="toolbar">
    <div class="search-box"><span class="s-icon">🔍</span>
      <input placeholder="Search name or roll no…" value="${filter}" oninput="renderStudents(this.value)">
    </div>
    <select class="form-control" style="width:auto" onchange="renderStudents('');filterStudentsByClass(this.value)">
      <option value="">All Classes</option>
      ${classes.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}
    </select>
  </div>
  <div class="card"><div class="table-wrap"><table>
    <thead><tr><th>#</th><th>Name</th><th>Roll</th><th>Class</th><th>Father</th><th>Phone</th><th>Fee</th><th>Actions</th></tr></thead>
    <tbody>
      ${list.map((s,i)=>{
        const cls=classes.find(c=>c.id===s.classId);
        const pct=s.feeTotal?Math.round(s.feePaid/s.feeTotal*100):0;
        return `<tr>
          <td>${i+1}</td>
          <td><div class="d-flex align-center gap-8"><div class="avatar-sm" style="overflow:hidden">${s.photo?`<img src="${s.photo}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`:`<span>${s.name[0]}</span>`}</div><strong>${s.name}</strong></div></td>
          <td>${s.rollNo}</td><td>${cls?cls.name:'—'}</td>
          <td>${s.fatherName||'—'}</td><td>${s.phone||'—'}</td>
          <td><span class="badge ${pct>=100?'badge-green':pct>=50?'badge-yellow':'badge-red'}">${pct}%</span></td>
          <td><div class="d-flex gap-8">
            <button class="btn btn-sm btn-cyan"   onclick="openStudentModal('${s.id}')">✏️</button>
            <button class="btn btn-sm btn-danger"  onclick="deleteStudent('${s.id}')">🗑️</button>
          </div></td>
        </tr>`;
      }).join('')||'<tr><td colspan="8" class="text-center text-muted" style="padding:40px">No students found</td></tr>'}
    </tbody>
  </table></div></div>`;
}

function filterStudentsByClass(classId) {
  const students = classId ? DB.where('students','classId',classId) : DB.get('students');
  const classes  = DB.get('classes');
  const tbody    = document.querySelector('#section-students tbody');
  if (!tbody) return;
  tbody.innerHTML = students.map((s,i)=>{
    const cls=classes.find(c=>c.id===s.classId);
    const pct=s.feeTotal?Math.round(s.feePaid/s.feeTotal*100):0;
    return `<tr>
      <td>${i+1}</td>
      <td><div class="d-flex align-center gap-8"><div class="avatar-sm" style="overflow:hidden">${s.photo?`<img src="${s.photo}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`:`<span>${s.name[0]}</span>`}</div><strong>${s.name}</strong></div></td>
      <td>${s.rollNo}</td><td>${cls?cls.name:'—'}</td>
      <td>${s.fatherName||'—'}</td><td>${s.phone||'—'}</td>
      <td><span class="badge ${pct>=100?'badge-green':pct>=50?'badge-yellow':'badge-red'}">${pct}%</span></td>
      <td><div class="d-flex gap-8">
        <button class="btn btn-sm btn-cyan"  onclick="openStudentModal('${s.id}')">✏️</button>
        <button class="btn btn-sm btn-danger" onclick="deleteStudent('${s.id}')">🗑️</button>
      </div></td>
    </tr>`;
  }).join('')||'<tr><td colspan="8" class="text-center text-muted" style="padding:40px">No students in this class</td></tr>';
}

// ── Photo compress helper ─────────────────────────────
function handleStudentPhoto(input) {
  const file = input.files[0];
  if (!file) return;
  const statusEl  = document.getElementById('std-photo-status');
  const previewEl = document.getElementById('std-photo-preview');
  statusEl.textContent = '⏳ Compressing...';

  const MAX_BYTES = 200 * 1024; // 200 KB
  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      // Start with full quality and shrink until under 200KB
      const canvas = document.createElement('canvas');
      let w = img.width, h = img.height;

      // Max dimension 800px to help with size
      const MAX_DIM = 800;
      if (w > MAX_DIM || h > MAX_DIM) {
        if (w > h) { h = Math.round(h * MAX_DIM / w); w = MAX_DIM; }
        else        { w = Math.round(w * MAX_DIM / h); h = MAX_DIM; }
      }
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);

      let quality = 0.92;
      let dataUrl = canvas.toDataURL('image/jpeg', quality);

      // Iteratively reduce quality until under 200KB
      while (dataUrl.length * 0.75 > MAX_BYTES && quality > 0.1) {
        quality -= 0.08;
        dataUrl = canvas.toDataURL('image/jpeg', Math.max(quality, 0.1));
      }

      // If still too big, shrink dimensions
      while (dataUrl.length * 0.75 > MAX_BYTES && (w > 200 || h > 200)) {
        w = Math.round(w * 0.8); h = Math.round(h * 0.8);
        canvas.width = w; canvas.height = h;
        ctx.drawImage(img, 0, 0, w, h);
        dataUrl = canvas.toDataURL('image/jpeg', 0.7);
      }

      window._stdPhotoData = dataUrl;
      const kb = Math.round(dataUrl.length * 0.75 / 1024);
      previewEl.innerHTML = `<img src="${dataUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
      statusEl.innerHTML  = `<span style="color:#16a34a">✅ ${kb} KB — Ready</span>`;
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function openStudentModal(id=null) {
  window._stdPhotoData = null;
  const s=id?DB.find('students',id):null;
  const classes=DB.get('classes');
  buildModal('modal-student', id?'Edit Student':'Add Student', `
    <!-- Photo Upload -->
    <div style="display:flex;flex-direction:column;align-items:center;gap:10px;margin-bottom:18px;padding:16px;background:var(--bg-2,#f8f9fa);border-radius:14px;border:2px dashed var(--border,#e2e8f0)">
      <div id="std-photo-preview" style="width:90px;height:90px;border-radius:50%;background:linear-gradient(135deg,#7c3aed,#06b6d4);display:flex;align-items:center;justify-content:center;font-size:2rem;overflow:hidden;box-shadow:0 4px 14px rgba(124,58,237,.25);cursor:pointer" onclick="document.getElementById('std-photo-input').click()">
        ${s&&s.photo?`<img src="${s.photo}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`:'📷'}
      </div>
      <div style="text-align:center">
        <div style="font-size:13px;font-weight:600;color:var(--text-1)">Student Photo</div>
        <div style="font-size:11px;color:var(--text-3)">Auto-compressed to 200KB</div>
      </div>
      <input type="file" id="std-photo-input" accept="image/*" style="display:none" onchange="handleStudentPhoto(this)">
      <button type="button" class="btn btn-secondary" style="padding:6px 14px;font-size:12px" onclick="document.getElementById('std-photo-input').click()">📷 Upload Photo</button>
      <div id="std-photo-status" style="font-size:11px;color:var(--text-3)"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Full Name *</label>
        <input class="form-control" id="std-name" placeholder="Full name" value="${s?s.name:''}"></div>
      <div class="form-group"><label class="form-label">Roll Number *</label>
        <input class="form-control" type="number" inputmode="numeric" id="std-roll" placeholder="001" value="${s?s.rollNo:''}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Class *</label>
        <select class="form-control" id="std-class">
          <option value="">Select class</option>
          ${classes.map(c=>`<option value="${c.id}" ${s&&s.classId===c.id?'selected':''}>${c.name}</option>`).join('')}
        </select></div>
      <div class="form-group"><label class="form-label">Gender</label>
        <select class="form-control" id="std-gender">
          ${['Male','Female','Other'].map(g=>`<option ${s&&s.gender===g?'selected':''}>${g}</option>`).join('')}
        </select></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Date of Birth</label>
        <input class="form-control" type="date" id="std-dob" value="${s?s.dob:''}"></div>
      <div class="form-group"><label class="form-label">Phone</label>
        <input class="form-control" type="tel" inputmode="tel" id="std-phone" placeholder="Parent phone" value="${s?s.phone:''}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Father's Name</label>
        <input class="form-control" id="std-father" placeholder="Father name" value="${s?s.fatherName:''}"></div>
      <div class="form-group"><label class="form-label">Mother's Name</label>
        <input class="form-control" id="std-mother" placeholder="Mother name" value="${s?s.motherName:''}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Admission / Scholar No</label>
        <input class="form-control" id="std-adm" placeholder="e.g. 1735" value="${s?(s.admissionNo||''):''}"></div>
      <div class="form-group"><label class="form-label">Aadhaar No</label>
        <input class="form-control" id="std-aadhaar" placeholder="12-digit Aadhaar" value="${s?(s.aadhaar||''):''}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Blood Group</label>
        <input class="form-control" id="std-blood" placeholder="e.g. B+" value="${s?(s.bloodGroup||''):''}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Login Username *</label>
        <input class="form-control" id="std-user" placeholder="username" value="${s?s.username:''}"></div>
      <div class="form-group"><label class="form-label">Login Password *</label>
        <input class="form-control" id="std-pass" placeholder="password" value="${s?s.password:''}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Total Fee (₹)</label>
        <input class="form-control" type="number" id="std-fee-total" value="${s?s.feeTotal:12000}"></div>
      <div class="form-group"><label class="form-label">Fee Paid (₹)</label>
        <input class="form-control" type="number" id="std-fee-paid" value="${s?s.feePaid:0}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">🚌 School Vehicle / Bus</label>
        <select class="form-control" id="std-vehicle">
          <option value="">No vehicle (walks/private)</option>
          ${(DB.get('vehicles')||[]).map(v=>`<option value="${v.id}" ${s&&s.vehicleId===v.id?'selected':''}>${v.name} (${v.number||'—'}) — ${v.route||'No route'}</option>`).join('')}
        </select>
        <div style="font-size:11px;color:var(--text-3);margin-top:4px">Parents will see this vehicle live in their Bus Tracker</div></div>
      <div class="form-group"><label class="form-label">Address</label>
        <input class="form-control" id="std-addr" placeholder="Address" value="${s?s.address:''}"></div>
    </div>`,
    ()=>saveStudent(id), 'modal-lg');
}
function saveStudent(id) {
  const name=val('std-name'),rollNo=val('std-roll'),classId=val('std-class'),gender=val('std-gender');
  const dob=val('std-dob'),phone=val('std-phone'),fatherName=val('std-father'),motherName=val('std-mother');
  const username=val('std-user'),password=val('std-pass'),address=val('std-addr');
  const admissionNo=val('std-adm'),aadhaar=val('std-aadhaar'),bloodGroup=val('std-blood');
  const feeTotal=Number(document.getElementById('std-fee-total').value)||0;
  const feePaid =Number(document.getElementById('std-fee-paid').value)||0;
  const photo = window._stdPhotoData || (id && DB.find('students',id)?.photo) || '';
  const vehicleId = val('std-vehicle') || '';
  if (!name||!rollNo||!classId||!username||!password){toast('Fill required fields','warning');return}
  const data={name,rollNo,classId,gender,dob,phone,fatherName,motherName,admissionNo,aadhaar,bloodGroup,username,password,address,feeTotal,feePaid,photo,vehicleId,role:'student',status:'active'};
  if (id) {
    DB.update('students',id,data); DB.update('users',id,data);
    toast('Student updated','success');
  } else {
    const nid=genId('usr_std');
    DB.push('students',{id:nid,...data,joinDate:today()});
    DB.push('users',   {id:nid,...data,joinDate:today()});
    toast(`Student added! Login: ${username} / ${password}`,'success');
  }
  window._stdPhotoData = null;
  closeAllModals(); renderStudents('');
}
function deleteStudent(id) {
  if (!confirmAction('Delete this student? All their data will be removed.')) return;
  DB.delete('students',id); DB.delete('users',id);
  toast('Student deleted','success'); renderStudents('');
}

// ══════════════════════════════════════════════════════
//  ADMISSION FORM — Print / Download
// ══════════════════════════════════════════════════════
function printAdmissionForm() {
  const s  = getSettings();
  const classes = DB.get('classes');
  const schoolName = s.schoolName || 'VissionMarg School';
  const logo = s.schoolLogo || '';
  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) { toast('Popup blocked — please allow popups in your browser', 'warning'); return; }
  win.document.write(`<!DOCTYPE html><html><head>
  <meta charset="UTF-8">
  <title>Admission Form — ${schoolName}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:'Segoe UI',Arial,sans-serif;font-size:13px;color:#111;background:#fff;padding:30px;}
    .page{max-width:750px;margin:0 auto;border:2px solid #333;padding:24px 28px;}
    .header{display:flex;align-items:center;gap:16px;border-bottom:3px double #333;padding-bottom:14px;margin-bottom:18px;}
    .logo{width:70px;height:70px;object-fit:contain;}
    .logo-placeholder{width:70px;height:70px;border:2px solid #555;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:28px;background:#f0f0f0;}
    .school-name{font-size:22px;font-weight:800;color:#1a1a3e;line-height:1.2;}
    .form-title{font-size:15px;font-weight:700;text-align:center;letter-spacing:1px;text-transform:uppercase;margin-bottom:18px;color:#333;border:1px solid #999;padding:6px;}
    .section-title{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;background:#eee;padding:5px 10px;margin:14px 0 10px;border-left:4px solid #333;}
    .row{display:flex;gap:16px;margin-bottom:10px;}
    .field{flex:1;}
    .field.w2{flex:2;}
    .field label{display:block;font-size:10px;font-weight:700;text-transform:uppercase;color:#555;margin-bottom:3px;letter-spacing:.3px;}
    .field .line{border-bottom:1px solid #555;min-height:22px;width:100%;}
    .photo-box{width:100px;height:120px;border:1px solid #555;display:flex;align-items:center;justify-content:center;font-size:10px;color:#888;text-align:center;margin-left:auto;flex-shrink:0;}
    .checkbox-row{display:flex;gap:20px;margin-bottom:10px;flex-wrap:wrap;}
    .checkbox-item{display:flex;align-items:center;gap:6px;font-size:12px;}
    .cb{width:13px;height:13px;border:1px solid #555;display:inline-block;flex-shrink:0;}
    .declaration{font-size:10.5px;color:#333;line-height:1.7;margin-top:16px;border-top:1px dashed #999;padding-top:12px;}
    .sig-row{display:flex;justify-content:space-between;margin-top:28px;}
    .sig-box{text-align:center;width:180px;}
    .sig-line{border-top:1px solid #555;margin-top:40px;padding-top:5px;font-size:10px;color:#555;}
    .class-list{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;}
    .cls-item{padding:3px 10px;border:1px solid #555;border-radius:3px;font-size:11px;display:flex;align-items:center;gap:5px;}
    .office-use{background:#f5f5f5;border:1px solid #bbb;padding:10px 14px;margin-top:16px;}
    .office-title{font-size:11px;font-weight:700;text-transform:uppercase;color:#555;margin-bottom:8px;}
    @media print{body{padding:0;}.page{border:none;padding:10px;}}
  </style>
  </head><body>
  <div class="page">
    <!-- Header -->
    <div class="header">
      <div>${logo ? `<img class="logo" src="${logo}">` : '<div class="logo-placeholder">🏫</div>'}</div>
      <div style="flex:1;">
        <div class="school-name">${schoolName}</div>
        <div style="font-size:12px;color:#555;margin-top:4px;">${s.address||''} ${s.phone?'· Ph: '+s.phone:''}</div>
      </div>
      <div style="text-align:right;font-size:11px;color:#555;">
        Form No: ___________<br>Date: ___________
      </div>
    </div>

    <div class="form-title">Student Admission Form — Academic Year ${s.academicYear||new Date().getFullYear()}</div>

    <!-- Photo + Basic Info -->
    <div style="display:flex;gap:16px;align-items:flex-start;">
      <div style="flex:1;">
        <div class="section-title">Student Information</div>
        <div class="row">
          <div class="field w2"><label>Full Name *</label><div class="line"></div></div>
          <div class="field"><label>Date of Birth *</label><div class="line"></div></div>
        </div>
        <div class="row">
          <div class="field"><label>Gender *</label>
            <div class="checkbox-row" style="margin:4px 0 0;">
              <div class="checkbox-item"><div class="cb"></div> Male</div>
              <div class="checkbox-item"><div class="cb"></div> Female</div>
              <div class="checkbox-item"><div class="cb"></div> Other</div>
            </div>
          </div>
          <div class="field"><label>Blood Group</label><div class="line"></div></div>
          <div class="field"><label>Aadhar No.</label><div class="line"></div></div>
        </div>
        <div class="row">
          <div class="field"><label>Previous School</label><div class="line"></div></div>
          <div class="field"><label>Last Class Passed</label><div class="line"></div></div>
        </div>
      </div>
      <div class="photo-box">Paste<br>Passport<br>Size<br>Photo<br>Here</div>
    </div>

    <!-- Admission Class -->
    <div class="section-title">Admission for Class</div>
    <div class="class-list">
      ${classes.map(c=>`<div class="cls-item"><div class="cb"></div> ${c.name}</div>`).join('')}
    </div>

    <!-- Parent / Guardian Info -->
    <div class="section-title">Parent / Guardian Information</div>
    <div class="row">
      <div class="field w2"><label>Father's Full Name *</label><div class="line"></div></div>
      <div class="field"><label>Occupation</label><div class="line"></div></div>
    </div>
    <div class="row">
      <div class="field w2"><label>Mother's Full Name</label><div class="line"></div></div>
      <div class="field"><label>Occupation</label><div class="line"></div></div>
    </div>
    <div class="row">
      <div class="field"><label>Mobile Number *</label><div class="line"></div></div>
      <div class="field"><label>WhatsApp Number</label><div class="line"></div></div>
      <div class="field"><label>Email</label><div class="line"></div></div>
    </div>
    <div class="row">
      <div class="field w2"><label>Annual Income</label><div class="line"></div></div>
      <div class="field"><label>Religion / Category</label><div class="line"></div></div>
    </div>

    <!-- Address -->
    <div class="section-title">Address</div>
    <div class="row">
      <div class="field w2"><label>Full Address</label><div class="line"></div><div class="line" style="margin-top:6px;"></div></div>
      <div class="field"><label>PIN Code</label><div class="line"></div></div>
    </div>
    <div class="row">
      <div class="field"><label>City / Town</label><div class="line"></div></div>
      <div class="field"><label>State</label><div class="line"></div></div>
    </div>

    <!-- Emergency Contact -->
    <div class="section-title">Emergency Contact</div>
    <div class="row">
      <div class="field w2"><label>Contact Person Name</label><div class="line"></div></div>
      <div class="field"><label>Relation</label><div class="line"></div></div>
      <div class="field"><label>Phone</label><div class="line"></div></div>
    </div>

    <!-- Medical Info -->
    <div class="section-title">Medical Information (Optional)</div>
    <div class="row">
      <div class="field w2"><label>Any known allergy / medical condition</label><div class="line"></div></div>
      <div class="field"><label>Doctor's Contact</label><div class="line"></div></div>
    </div>

    <!-- Documents -->
    <div class="section-title">Documents Submitted (✔ jo laye ho)</div>
    <div class="checkbox-row">
      ${['Birth Certificate','Aadhar Card','Previous TC','Mark Sheet','Passport Photo (4)','Caste Certificate','Address Proof'].map(d=>`<div class="checkbox-item"><div class="cb"></div> ${d}</div>`).join('')}
    </div>

    <!-- Declaration -->
    <div class="declaration">
      <strong>Declaration:</strong> I hereby declare that all information provided above is correct to the best of my knowledge.
      I agree to abide by all the rules and regulations of the school.
    </div>

    <!-- Office Use -->
    <div class="office-use">
      <div class="office-title">For Office Use Only</div>
      <div class="row">
        <div class="field"><label>Roll Number Allotted</label><div class="line"></div></div>
        <div class="field"><label>Class Allotted</label><div class="line"></div></div>
        <div class="field"><label>Admission Date</label><div class="line"></div></div>
        <div class="field"><label>Fee Received (₹)</label><div class="line"></div></div>
      </div>
      <div class="row">
        <div class="field"><label>Username</label><div class="line"></div></div>
        <div class="field"><label>Password</label><div class="line"></div></div>
        <div class="field w2"><label>Remarks</label><div class="line"></div></div>
      </div>
    </div>

    <!-- Signatures -->
    <div class="sig-row">
      <div class="sig-box"><div class="sig-line">Parent / Guardian Signature</div></div>
      <div class="sig-box"><div class="sig-line">Student Signature</div></div>
      <div class="sig-box"><div class="sig-line">Principal Signature & Stamp</div></div>
    </div>
  </div>
  <script>window.onload=function(){window.print();}</script>
  </body></html>`);
  win.document.close();
}

// ══════════════════════════════════════════════════════
//  ONLINE ADMISSION — Link + Pending Approvals
// ══════════════════════════════════════════════════════
function openOnlineAdmissionPanel() {
  const schoolId = DB._schoolId() || 'sch001';
  const base = window.location.origin + window.location.pathname.replace('admin.html','').replace(/\/[^\/]*$/, '/');
  const link = (window.location.origin + window.location.pathname).replace('admin.html','') + 'admission.html?s=' + encodeURIComponent(schoolId);

  buildModal('modal-admission-link', '🔗 Online Admission Link', `
    <div style="text-align:center;padding:8px 0 18px;">
      <div style="font-size:3rem;margin-bottom:10px;">🔗</div>
      <div style="font-weight:700;font-size:1rem;color:var(--text1);margin-bottom:6px;">Share this link with parents</div>
      <div style="font-size:.8rem;color:rgba(255,255,255,.4);margin-bottom:18px;">Parents fill the form via this link — student is added once you approve</div>
    </div>

    <!-- Link box -->
    <div style="background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:10px;padding:12px 14px;display:flex;align-items:center;gap:10px;margin-bottom:16px;">
      <div id="_admLink" style="flex:1;font-size:.78rem;color:#a78bfa;word-break:break-all;font-family:monospace;">${link}</div>
      <button class="btn btn-sm btn-primary" onclick="_copyAdmLink('${link.replace(/'/g,'\\\'')}')" style="flex-shrink:0;">📋 Copy</button>
    </div>

    <!-- QR Code for the link -->
    <div style="text-align:center;margin-bottom:18px;">
      <div style="font-size:.78rem;color:rgba(255,255,255,.35);margin-bottom:8px;">Or scan this QR code</div>
      <div id="_admQRBox" style="display:inline-block;background:#fff;padding:10px;border-radius:10px;"></div>
    </div>

    <!-- Share options -->
    <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-bottom:18px;">
      <button class="btn btn-secondary" onclick="window.open('https://wa.me/?text='+encodeURIComponent('Admission Form Link: ${link}'),'_blank')">💬 WhatsApp</button>
      <button class="btn btn-secondary" onclick="window.open('${link}','_blank')">🌐 Open Link</button>
    </div>

    <hr style="border-color:rgba(255,255,255,.08);margin:0 0 14px;">
    <div style="font-size:.78rem;color:rgba(255,255,255,.35);line-height:1.7;">
      ✅ Parent fills the form → it appears in <strong>Pending Admissions</strong> → you approve → student is added
    </div>
  `, null, 'modal-sm');

  // Generate QR after modal opens
  setTimeout(() => {
    const box = document.getElementById('_admQRBox');
    if (box && window.QRCode) {
      box.innerHTML = '';
      new QRCode(box, { text: link, width: 140, height: 140, colorDark:'#000', colorLight:'#fff', correctLevel: QRCode.CorrectLevel.M });
    }
  }, 150);
}

window._copyAdmLink = function(link) {
  navigator.clipboard.writeText(link).then(() => toast('✅ Link copied!', 'success'))
    .catch(() => {
      const el = document.createElement('textarea');
      el.value = link; document.body.appendChild(el);
      el.select(); document.execCommand('copy'); document.body.removeChild(el);
      toast('✅ Link copied!', 'success');
    });
};

// ── Pending Admissions Review ─────────────────────────
function renderPendingAdmissions() {
  const pending = DB.get('pendingAdmissions') || [];
  const classes = DB.get('classes');

  buildModal('modal-pending-admissions', `⏳ Pending Admissions (${pending.length})`, `
    ${!pending.length ? '<div class="empty-state" style="padding:40px;"><div class="e-icon">📭</div><p>No pending admissions</p></div>' :
    pending.map((p, i) => `
    <div style="background:var(--glass);border:1px solid var(--border);border-radius:12px;padding:14px;margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;flex-wrap:wrap;gap:8px;">
        <div>
          <div style="font-weight:700;font-size:.95rem;">${p.name}</div>
          <div style="font-size:.75rem;color:rgba(255,255,255,.4);">Submitted: ${new Date(p.submittedAt||Date.now()).toLocaleString('en-IN')}</div>
        </div>
        <span style="font-size:.7rem;padding:3px 10px;border-radius:20px;background:rgba(245,158,11,.15);color:#f59e0b;font-weight:700;">⏳ Pending</span>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 16px;font-size:.78rem;color:rgba(255,255,255,.6);margin-bottom:12px;">
        <div>👤 DOB: ${p.dob||'—'}</div>
        <div>⚧ Gender: ${p.gender||'—'}</div>
        <div>👨 Father: ${p.fatherName||'—'}</div>
        <div>👩 Mother: ${p.motherName||'—'}</div>
        <div>📞 Phone: ${p.phone||'—'}</div>
        <div>📧 Email: ${p.email||'—'}</div>
        <div style="grid-column:1/-1;">🏠 Address: ${p.address||'—'}</div>
        <div>🏫 Applied for: ${p.applyClass||'—'}</div>
        <div>🏥 Medical: ${p.medical||'—'}</div>
      </div>

      <!-- Assign class + approve -->
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
        <select id="_paClass_${i}" class="form-control" style="flex:1;min-width:130px;font-size:.82rem;">
          <option value="">-- Select class --</option>
          ${classes.map(c=>`<option value="${c.id}" ${p.applyClassId===c.id?'selected':''}>${c.name}</option>`).join('')}
        </select>
        <input id="_paRoll_${i}" class="form-control" placeholder="Roll No" style="width:90px;font-size:.82rem;" value="${p.suggestedRoll||''}">
        <button class="btn btn-sm btn-success" onclick="approveAdmission('${p.id||i}',${i})">✅ Approve</button>
        <button class="btn btn-sm btn-danger"  onclick="rejectAdmission('${p.id||i}',${i})">❌ Reject</button>
      </div>
    </div>`).join('')}
  `, null, 'modal-lg');
}

window.approveAdmission = function(pid, idx) {
  const pending = DB.get('pendingAdmissions') || [];
  const p = pending[idx];
  if (!p) { toast('Record not found', 'error'); return; }

  const classId = document.getElementById('_paClass_' + idx)?.value;
  const rollNo  = document.getElementById('_paRoll_'  + idx)?.value || '';
  if (!classId) { toast('Please select a class first', 'warning'); return; }

  // Build student object from pending data
  const nid = genId('usr_std');
  const username = (p.name||'student').toLowerCase().replace(/\s+/g,'') + Math.floor(Math.random()*900+100);
  const password = 'admit' + Math.floor(Math.random()*9000+1000);

  const data = {
    id: nid, role: 'student', status: 'active',
    name: p.name, rollNo, classId, gender: p.gender||'',
    dob: p.dob||'', phone: p.phone||'', email: p.email||'',
    fatherName: p.fatherName||'', motherName: p.motherName||'',
    address: p.address||'', medical: p.medical||'',
    username, password, feeTotal: 0, feePaid: 0, photo: '',
    joinDate: today()
  };
  DB.push('students', data);
  DB.push('users',    data);

  // Remove from pending
  const newPending = pending.filter((_,i) => i !== idx);
  DB.set('pendingAdmissions', newPending);

  const cls = DB.find('classes', classId);
  toast(`✅ ${p.name} — ${cls?cls.name:'class'} added successfully! Login: ${username} / ${password}`, 'success');
  closeAllModals();
  renderStudents('');
};

window.rejectAdmission = function(pid, idx) {
  if (!confirmAction('Reject this admission?')) return;
  const pending = DB.get('pendingAdmissions') || [];
  DB.set('pendingAdmissions', pending.filter((_,i) => i !== idx));
  toast('Admission reject kar diya', 'info');
  closeAllModals();
  renderStudents('');
};

// ══════════════════════════════════════════════════════
//  TEACHERS
// ══════════════════════════════════════════════════════
function renderTeachers() {
  const teachers=DB.get('teachers');
  const classes=DB.get('classes');
  document.getElementById('section-teachers').innerHTML = `
  <div class="page-header">
    <div><h2>Teachers</h2><div class="breadcrumb">Total: <span>${teachers.length}</span></div></div>
    <button class="btn btn-primary" onclick="openTeacherModal()">➕ Add Teacher</button>
  </div>
  <div class="card"><div class="table-wrap"><table>
    <thead><tr><th>#</th><th>Name</th><th>Subject</th><th>Assigned Classes</th><th>Phone</th><th>Salary</th><th>Actions</th></tr></thead>
    <tbody>
      ${teachers.map((t,i)=>{
        const tClasses=classes.filter(c=>c.teacherId===t.id);
        const perms=getTeacherPermsFor(t.id);
        const enabledCount=Object.values(perms).filter(Boolean).length;
        return `<tr>
          <td>${i+1}</td>
          <td><div class="d-flex align-center gap-8"><div class="avatar-sm">${t.name[0]}</div><div><strong>${t.name}</strong><div style="font-size:11px;color:var(--text-3)">${t.subject||''}</div></div></div></td>
          <td>${t.subject||'—'}</td>
          <td>${tClasses.length?tClasses.map(c=>`<span class="badge badge-purple" style="margin:2px">${c.name}</span>`).join(''):'<span style="color:var(--text-3)">None</span>'}</td>
          <td>${t.phone||'—'}</td>
          <td>₹${Number(t.salary||0).toLocaleString()}</td>
          <td><div class="d-flex gap-8" style="flex-wrap:wrap">
            <button class="btn btn-sm btn-cyan"  onclick="openTeacherModal('${t.id}')">✏️ Edit</button>
            <button class="btn btn-sm" style="background:rgba(124,58,237,.2);color:#a78bfa;border:1px solid rgba(124,58,237,.3)" onclick="openTeacherAccessModal('${t.id}')">🔐 Access (${enabledCount}/9)</button>
            <button class="btn btn-sm btn-pink"  onclick="quickSalaryReceipt('${t.id}')">💼 Salary</button>
            <button class="btn btn-sm btn-danger" onclick="deleteTeacher('${t.id}')">🗑️</button>
          </div></td>
        </tr>`;
      }).join('')||'<tr><td colspan="7" class="text-center text-muted" style="padding:40px">No teachers yet</td></tr>'}
    </tbody>
  </table></div></div>`;
}
function openTeacherModal(id=null) {
  const t=id?DB.find('teachers',id):null;
  buildModal('modal-teacher', id?'Edit Teacher':'Add Teacher', `
    <div class="form-row">
      <div class="form-group"><label class="form-label">Full Name *</label>
        <input class="form-control" id="tch-name" placeholder="Full name" value="${t?t.name:''}"></div>
      <div class="form-group"><label class="form-label">Subject *</label>
        <input class="form-control" id="tch-subject" placeholder="e.g. Mathematics" value="${t?t.subject:''}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Qualification</label>
        <input class="form-control" id="tch-qual" placeholder="e.g. M.Sc." value="${t?t.qualification:''}"></div>
      <div class="form-group"><label class="form-label">Experience</label>
        <input class="form-control" id="tch-exp" placeholder="e.g. 5 years" value="${t?t.experience:''}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Phone</label>
        <input class="form-control" type="tel" inputmode="tel" id="tch-phone" placeholder="Phone" value="${t?t.phone:''}"></div>
      <div class="form-group"><label class="form-label">Email</label>
        <input class="form-control" type="email" inputmode="email" id="tch-email" placeholder="Email" value="${t?t.email:''}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Monthly Salary (₹)</label>
        <input class="form-control" type="number" id="tch-salary" value="${t?t.salary:30000}"></div>
      <div class="form-group"><label class="form-label">Join Date</label>
        <input class="form-control" type="date" id="tch-join" value="${t?t.joinDate:today()}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Login Username *</label>
        <input class="form-control" id="tch-user" placeholder="username" value="${t?t.username:''}"></div>
      <div class="form-group"><label class="form-label">Login Password *</label>
        <input class="form-control" id="tch-pass" placeholder="password" value="${t?t.password:''}"></div>
    </div>
    <div class="form-group"><label class="form-label">Address</label>
      <input class="form-control" id="tch-addr" placeholder="Address" value="${t?t.address:''}"></div>`,
    ()=>saveTeacher(id), 'modal-lg');
}
function saveTeacher(id) {
  const name=val('tch-name'),subject=val('tch-subject'),qualification=val('tch-qual'),experience=val('tch-exp');
  const phone=val('tch-phone'),email=val('tch-email'),address=val('tch-addr'),joinDate=val('tch-join');
  const username=val('tch-user'),password=val('tch-pass');
  const salary=Number(document.getElementById('tch-salary').value)||0;
  if (!name||!subject||!username||!password){toast('Fill required fields','warning');return}
  const data={name,subject,qualification,experience,phone,email,address,joinDate,username,password,salary,role:'teacher',status:'active'};
  if (id) {
    DB.update('teachers',id,data); DB.update('users',id,data);
    toast('Teacher updated','success');
  } else {
    const nid=genId('usr_teacher');
    DB.push('teachers',{id:nid,...data});
    DB.push('users',   {id:nid,...data});
    toast(`Teacher added! Login: ${username} / ${password}`,'success');
  }
  closeAllModals(); renderTeachers();
}
function deleteTeacher(id) {
  if (!confirmAction('Delete this teacher?')) return;
  DB.delete('teachers',id); DB.delete('users',id);
  toast('Teacher deleted','success'); renderTeachers();
}

function openTeacherAccessModal(teacherId) {
  const t = DB.find('teachers', teacherId);
  if (!t) return;
  const perms = getTeacherPermsFor(teacherId);
  const classes = DB.get('classes');
  const assignedClassIds = classes.filter(c=>c.teacherId===teacherId).map(c=>c.id);

  const PERM_LABELS = {
    attendance:'✅ Attendance', homework:'📚 Homework', timetable:'🗓️ Timetable',
    exams:'📝 Exams & Marks', materials:'📂 Study Materials', qpapers:'📄 Question Papers',
    notices:'📢 Notices', leaves:'📅 Leave Requests', leaderboard:'🏆 Leaderboard',
    fees:'💳 Fee Management', accounts:'💰 Accounts / Finance'
  };

  buildModal('modal-teacher-access', `🔐 Access Control — ${t.name}`, `
    <div style="margin-bottom:20px">
      <h4 style="color:var(--cyan);margin-bottom:12px">Feature Permissions</h4>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        ${Object.entries(PERM_LABELS).map(([key,label])=>`
          <label style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--glass);border-radius:10px;border:1px solid var(--border);cursor:pointer" ${key==='accounts'?'id="tp_accounts_wrap"':''}>
            <input type="checkbox" id="tp_${key}" ${perms[key]?'checked':''} style="width:16px;height:16px;cursor:pointer" ${key==='accounts'?'onchange="_toggleFinSummaryOpt()"':''}>
            <span style="font-size:14px">${label}</span>
          </label>`).join('')}
      </div>

      <!-- Financial summary sub-option (only when accounts is enabled) -->
      <div id="tp_fin_summary_wrap" style="margin-top:10px;padding:12px 16px;background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.25);border-radius:10px;display:${perms.accounts?'flex':'none'};align-items:center;gap:10px">
        <input type="checkbox" id="tp_canViewFinancialSummary" ${perms.canViewFinancialSummary?'checked':''} style="width:16px;height:16px;cursor:pointer">
        <div>
          <div style="font-size:13px;font-weight:700;color:#b45309">📊 Can view Total Income / Expense summary</div>
          <div style="font-size:11px;color:#92400e;margin-top:2px">If OFF — teacher can manage fees & accounts but CANNOT see overall income/expense totals (recommended)</div>
        </div>
      </div>

      <div style="margin-top:10px;display:flex;gap:8px">
        <button class="btn btn-sm btn-secondary" onclick="setAllTeacherPerms(true)">✅ Enable All</button>
        <button class="btn btn-sm btn-secondary" onclick="setAllTeacherPerms(false)">❌ Disable All</button>
      </div>
    </div>
    <hr style="border-color:var(--border);margin:16px 0">
    <div>
      <h4 style="color:var(--cyan);margin-bottom:12px">Assign Classes</h4>
      <p style="color:var(--text-3);font-size:13px;margin-bottom:12px">Select classes this teacher will manage:</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        ${classes.length ? classes.map(c=>`
          <label style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--glass);border-radius:10px;border:1px solid ${assignedClassIds.includes(c.id)?'var(--purple)':'var(--border)'};cursor:pointer">
            <input type="checkbox" id="cls_${c.id}" ${assignedClassIds.includes(c.id)?'checked':''} style="width:16px;height:16px;cursor:pointer">
            <div>
              <div style="font-weight:600;font-size:14px">${c.name}</div>
              <div style="font-size:11px;color:var(--text-3)">${DB.get('students').filter(s=>s.classId===c.id).length} students</div>
            </div>
          </label>`).join('') : '<p class="text-muted">No classes created yet.</p>'}
      </div>
    </div>`,
    () => saveTeacherAccess(teacherId), 'modal-lg');
}

function _toggleFinSummaryOpt(){
  const accEl=document.getElementById('tp_accounts');
  const wrap=document.getElementById('tp_fin_summary_wrap');
  if(wrap) wrap.style.display=accEl&&accEl.checked?'flex':'none';
}

function setAllTeacherPerms(value) {
  ['attendance','homework','timetable','exams','materials','qpapers','notices','leaves','leaderboard','fees','accounts']
    .forEach(k=>{ const el=document.getElementById('tp_'+k); if(el) el.checked=value; });
  _toggleFinSummaryOpt();
}

function saveTeacherAccess(teacherId) {
  const PERM_KEYS = ['attendance','homework','timetable','exams','materials','qpapers','notices','leaves','leaderboard','fees','accounts','canViewFinancialSummary'];
  const newPerms = {};
  PERM_KEYS.forEach(k=>{ const el=document.getElementById('tp_'+k); if(el) newPerms[k]=el.checked; });
  setTeacherPermsFor(teacherId, newPerms);

  // Update class assignments — unassign from this teacher first, then assign selected
  const allClasses = DB.get('classes');
  const updated = allClasses.map(c=>{
    const checkbox = document.getElementById('cls_'+c.id);
    if (!checkbox) return c;
    if (checkbox.checked) return {...c, teacherId};
    if (c.teacherId === teacherId) return {...c, teacherId:''};
    return c;
  });
  DB.set('classes', updated);

  closeAllModals();
  toast(`Access updated for ${DB.find('teachers',teacherId)?.name}`, 'success');
  renderTeachers();
}

// ══════════════════════════════════════════════════════
//  ATTENDANCE — COMPLETE REDESIGN
// ══════════════════════════════════════════════════════
let _attState = { classId:'', date:today(), marks:{}, tab:'mark', search:'', editDate:today() };

function renderAttendance() {
  const classes = DB.get('classes');
  if (!_attState.classId && classes[0]) _attState.classId = classes[0].id;
  const showSave = _attState.tab === 'mark';
  document.getElementById('section-attendance').innerHTML = `
  <div class="page-header">
    <div><h2>📋 Student Attendance</h2></div>
    <div class="d-flex gap-8">
      <button class="btn" style="background:#10b981;color:#fff;border:none;" onclick="faceOpenScanner({mode:'student',classId:_attState.classId,date:_attState.date,title:(DB.find('classes',_attState.classId)||{}).name||''})">📷 Face Attendance</button>
      <button class="btn btn-secondary" onclick="printAttendanceSheet()">🖨️ Print</button>
      ${showSave?`<button class="btn btn-success" onclick="saveAttendance()">💾 Save</button>`:''}
    </div>
  </div>
  <!-- Tab switcher -->
  <div class="att-tab-bar">
    <button class="att-tab ${_attState.tab==='mark'?'active':''}"    onclick="_attState.tab='mark';renderAttendance()">✏️ Mark Today</button>
    <button class="att-tab ${_attState.tab==='qrscan'?'active':''}"  onclick="_attState.tab='qrscan';if(!_attState.qrScanned)_attState.qrScanned={};renderAttendance()">📷 QR Scan</button>
    <button class="att-tab ${_attState.tab==='edit'?'active':''}"    onclick="_attState.tab='edit';renderAttendance()">🖊️ Edit Past</button>
    <button class="att-tab ${_attState.tab==='report'?'active':''}"  onclick="_attState.tab='report';renderAttendance()">📊 Class Report</button>
    <button class="att-tab ${_attState.tab==='student'?'active':''}" onclick="_attState.tab='student';renderAttendance()">👤 Student Report</button>
  </div>
  <!-- Filters row -->
  <div class="d-flex gap-10 mb-16" style="flex-wrap:wrap;align-items:center;">
    <select class="form-control" style="min-width:160px;flex:1;max-width:220px"
      onchange="_attState.classId=this.value;_attState.marks={};renderAttendance()">
      ${classes.map(c=>`<option value="${c.id}" ${c.id===_attState.classId?'selected':''}>${c.name}</option>`).join('')}
    </select>
    ${_attState.tab==='mark'||_attState.tab==='edit'?`
    <input type="date" class="form-control" style="min-width:155px;flex:1;max-width:200px"
      value="${_attState.tab==='edit'?_attState.editDate:_attState.date}"
      onchange="${_attState.tab==='edit'?'_attState.editDate':'_attState.date'}=this.value;${_attState.tab==='mark'?'_attState.marks={};':''}renderAttendance()">
    `:``}
    <div class="search-box" style="flex:2;min-width:180px;max-width:280px">
      <span class="s-icon">🔍</span>
      <input placeholder="Search student…" value="${_attState.search||''}"
        oninput="_attState.search=this.value;_renderAttBody()">
    </div>
  </div>
  <div id="att-body"></div>`;
  _renderAttBody();
}

function _renderAttBody() {
  const el = document.getElementById('att-body');
  if (!el) return;
  if      (_attState.tab === 'mark')    el.innerHTML = _buildMarkTab();
  else if (_attState.tab === 'qrscan')  el.innerHTML = _buildQRScanTab();
  else if (_attState.tab === 'edit')    el.innerHTML = _buildEditTab();
  else if (_attState.tab === 'report')  el.innerHTML = _buildReportTab();
  else                                  el.innerHTML = _buildStudentReportTab();
}

/* ── MARK TODAY — list view, like teacher attendance ── */
function _buildMarkTab() {
  const allStudents = DB.where('students','classId',_attState.classId);
  const search   = (_attState.search||'').toLowerCase();
  const students = search ? allStudents.filter(s=>s.name.toLowerCase().includes(search)||String(s.rollNo).includes(search)) : allStudents;
  const saved    = DB.get('attendance').filter(a=>a.classId===_attState.classId && a.date===_attState.date);
  const savedMap = {};
  saved.forEach(a=>{ savedMap[a.studentId]=a.status; if(!_attState.marks[a.studentId]) _attState.marks[a.studentId]=a.status; });

  let pCount=0, aCount=0, lCount=0, uCount=0;
  allStudents.forEach(s=>{
    const st=_attState.marks[s.id]||savedMap[s.id]||'';
    if(st==='present')pCount++; else if(st==='absent')aCount++; else if(st==='late')lCount++; else uCount++;
  });
  const pct = Math.round(pCount/(allStudents.length||1)*100);

  return `
  <div class="att-stats-strip">
    <div class="att-stat-chip green"><span class="stat-num" id="att-cnt-p">${pCount}</span><span class="stat-lbl">✅ Present</span></div>
    <div class="att-stat-chip red">  <span class="stat-num" id="att-cnt-a">${aCount}</span><span class="stat-lbl">❌ Absent</span></div>
    <div class="att-stat-chip yellow"><span class="stat-num" id="att-cnt-l">${lCount}</span><span class="stat-lbl">🕐 Late</span></div>
    <div class="att-stat-chip blue"> <span class="stat-num" id="att-cnt-u">${uCount}</span><span class="stat-lbl">⬜ Unmarked</span></div>
    <div class="att-stat-chip purple"><span class="stat-num" id="att-cnt-pct">${pct}%</span><span class="stat-lbl">📈 Rate</span></div>
  </div>
  <div class="att-bulk-bar">
    <span style="font-weight:600;font-size:.85rem;color:var(--text2);">Mark All:</span>
    <button class="btn btn-sm btn-success" onclick="markAllAtt('present')">✅ Present</button>
    <button class="btn btn-sm btn-danger"  onclick="markAllAtt('absent')">❌ Absent</button>
    <button class="btn btn-sm" style="background:rgba(245,158,11,.15);color:var(--yellow);border:1px solid rgba(245,158,11,.3);" onclick="markAllAtt('late')">🕐 Late</button>
    <button class="btn btn-sm btn-secondary" onclick="markUnmarkedAbsent()" style="margin-left:auto;">⚠️ Mark Unmarked → Absent</button>
  </div>
  <!-- List view — same style as teacher attendance -->
  <div style="display:flex;flex-direction:column;gap:8px;" id="attList">
    ${students.length ? students.map((s,i)=>{
      const st = _attState.marks[s.id]||savedMap[s.id]||'';
      return `<div class="tatt-card ${st}" id="att-${s.id}">
        <div style="width:32px;text-align:center;font-size:.75rem;color:var(--text2);flex-shrink:0;">${s.rollNo||i+1}</div>
        <div class="att-card-avatar" style="width:38px;height:38px;font-size:.9rem;flex-shrink:0;">${s.name[0].toUpperCase()}</div>
        <div class="tatt-card-info">
          <div class="tatt-card-name">${s.name}</div>
          <div class="tatt-card-sub">${DB.find('classes',s.classId)?.name||''}</div>
        </div>
        <div class="tatt-card-btns">
          <button class="tatt-btn p ${st==='present'?'active-p':''}" onclick="setAtt('${s.id}','present')">✅ P</button>
          <button class="tatt-btn a ${st==='absent'?'active-a':''}"  onclick="setAtt('${s.id}','absent')">❌ A</button>
          <button class="tatt-btn l ${st==='late'?'active-l':''}"    onclick="setAtt('${s.id}','late')">🕐 L</button>
        </div>
      </div>`;
    }).join('') : '<div class="empty-state"><div class="e-icon">👨‍🎓</div><p>No students found</p></div>'}
  </div>`;
}

/* ── EDIT PAST ATTENDANCE ── */
function _buildEditTab() {
  const allStudents = DB.where('students','classId',_attState.classId);
  const search   = (_attState.search||'').toLowerCase();
  const students = search ? allStudents.filter(s=>s.name.toLowerCase().includes(search)||String(s.rollNo).includes(search)) : allStudents;
  const saved    = DB.get('attendance').filter(a=>a.classId===_attState.classId && a.date===_attState.editDate);
  const savedMap = {};
  saved.forEach(a=>{ savedMap[a.studentId]=a.status; });

  // Init edit marks from saved
  if (!_attState._editMarks) _attState._editMarks = {};
  if (!_attState._editMarks[_attState.editDate]) {
    _attState._editMarks[_attState.editDate] = {};
    saved.forEach(a=>{ _attState._editMarks[_attState.editDate][a.studentId]=a.status; });
  }
  const editMarks = _attState._editMarks[_attState.editDate] || {};

  const hasSaved = saved.length > 0;
  let pCount=0,aCount=0,lCount=0;
  students.forEach(s=>{ const st=editMarks[s.id]||savedMap[s.id]||''; if(st==='present')pCount++; else if(st==='absent')aCount++; else if(st==='late')lCount++; });

  return `
  <div class="card mb-12" style="padding:14px 18px;border-left:3px solid ${hasSaved?'var(--green)':'var(--yellow)'};">
    <div class="d-flex align-center gap-12">
      <div style="font-size:1.4rem">${hasSaved?'✅':'⚠️'}</div>
      <div>
        <div style="font-weight:600;">${hasSaved?`Attendance found for ${formatDate(_attState.editDate)}`:`No attendance saved for ${formatDate(_attState.editDate)}`}</div>
        <div style="font-size:.78rem;color:var(--text2);">${hasSaved?`${pCount} Present · ${aCount} Absent · ${lCount} Late — Edit and save changes`:'Select a different date or mark attendance from "Mark Today" tab'}</div>
      </div>
      ${hasSaved?`<button class="btn btn-sm btn-success" style="margin-left:auto;" onclick="saveEditedAtt()">💾 Save Changes</button>`:''}
    </div>
  </div>
  <div style="display:flex;flex-direction:column;gap:8px;">
    ${students.length ? students.map((s,i)=>{
      const st = editMarks[s.id]||savedMap[s.id]||'';
      return `<div class="tatt-card ${st}" id="edit-att-${s.id}">
        <div style="width:32px;text-align:center;font-size:.75rem;color:var(--text2);flex-shrink:0;">${s.rollNo||i+1}</div>
        <div class="att-card-avatar" style="width:38px;height:38px;font-size:.9rem;flex-shrink:0;">${s.name[0].toUpperCase()}</div>
        <div class="tatt-card-info">
          <div class="tatt-card-name">${s.name}</div>
          <div class="tatt-card-sub">${st?`Currently: ${st.charAt(0).toUpperCase()+st.slice(1)}`:'Not marked'}</div>
        </div>
        <div class="tatt-card-btns">
          <button class="tatt-btn p ${st==='present'?'active-p':''}" onclick="setEditAtt('${s.id}','present')">✅ P</button>
          <button class="tatt-btn a ${st==='absent'?'active-a':''}"  onclick="setEditAtt('${s.id}','absent')">❌ A</button>
          <button class="tatt-btn l ${st==='late'?'active-l':''}"    onclick="setEditAtt('${s.id}','late')">🕐 L</button>
        </div>
      </div>`;
    }).join('') : '<div class="empty-state"><div class="e-icon">👨‍🎓</div><p>No students</p></div>'}
  </div>`;
}

function setEditAtt(sid, status) {
  if (!_attState._editMarks) _attState._editMarks = {};
  if (!_attState._editMarks[_attState.editDate]) _attState._editMarks[_attState.editDate] = {};
  _attState._editMarks[_attState.editDate][sid] = status;
  const el = document.getElementById('edit-att-'+sid);
  if (!el) return;
  el.className = 'tatt-card ' + status;
  el.querySelectorAll('.tatt-btn').forEach(b=>{
    b.classList.remove('active-p','active-a','active-l');
    if(b.classList.contains('p')&&status==='present') b.classList.add('active-p');
    if(b.classList.contains('a')&&status==='absent')  b.classList.add('active-a');
    if(b.classList.contains('l')&&status==='late')    b.classList.add('active-l');
  });
  const sub = el.querySelector('.tatt-card-sub');
  if (sub) sub.textContent = 'Currently: '+status.charAt(0).toUpperCase()+status.slice(1);
}

function saveEditedAtt() {
  const editMarks = (_attState._editMarks||{})[_attState.editDate]||{};
  if (!Object.keys(editMarks).length) { toast('No changes to save','warning'); return; }
  const classId = _attState.classId;
  const date    = _attState.editDate;
  const students = DB.where('students','classId',classId);
  const rest = DB.get('attendance').filter(a=>!(a.classId===classId&&a.date===date));
  students.forEach(s=>{
    const st = editMarks[s.id];
    if (st) rest.push({ id:genId('att'), classId, studentId:s.id, date, status:st });
  });
  DB.set('attendance', rest);
  if (_attState._editMarks) delete _attState._editMarks[date];
  toast(`Attendance updated for ${formatDate(date)}!`, 'success');
  renderAttendance();
}

function _buildReportTab() {
  const classes = DB.get('classes');
  const allAtt  = DB.get('attendance');
  if (!allAtt.length) return '<div class="empty-state"><div class="e-icon">📊</div><p>No attendance data yet. Start marking daily attendance.</p></div>';
  return `<div class="card">
    <div class="card-header"><h3>📊 Class-wise Attendance Summary</h3></div>
    <div class="table-wrap"><table>
      <thead><tr><th>Class</th><th>Students</th><th>Days Recorded</th><th>Avg Present%</th><th>Avg Absent%</th></tr></thead>
      <tbody>
        ${classes.map(c=>{
          const students = DB.where('students','classId',c.id);
          const cAtt = allAtt.filter(a=>a.classId===c.id);
          const days = [...new Set(cAtt.map(a=>a.date))].length;
          const p    = cAtt.filter(a=>a.status==='present').length;
          const tot  = cAtt.length || 1;
          const pPct = Math.round(p/tot*100);
          return `<tr>
            <td><strong>${c.name}</strong></td>
            <td>${students.length}</td>
            <td>${days}</td>
            <td><span class="badge badge-green">${pPct}%</span></td>
            <td><span class="badge badge-red">${100-pPct}%</span></td>
          </tr>`;
        }).join('')}
      </tbody>
    </table></div>
  </div>
  <div class="card mt-16">
    <div class="card-header"><h3>📅 Last 10 Days — ${DB.find('classes',_attState.classId)?.name||'Selected Class'}</h3></div>
    <div class="table-wrap">
      ${_attDayWiseTable()}
    </div>
  </div>`;
}

function _attDayWiseTable() {
  const allAtt = DB.get('attendance').filter(a=>a.classId===_attState.classId);
  const days   = [...new Set(allAtt.map(a=>a.date))].sort().slice(-10).reverse();
  const students = DB.where('students','classId',_attState.classId);
  if (!days.length) return '<div class="empty-state"><div class="e-icon">📅</div><p>No data for this class</p></div>';
  return `<table>
    <thead><tr><th>Date</th><th>Present</th><th>Absent</th><th>Late</th><th>Rate</th></tr></thead>
    <tbody>
      ${days.map(d=>{
        const recs = allAtt.filter(a=>a.date===d);
        const p=recs.filter(a=>a.status==='present').length;
        const ab=recs.filter(a=>a.status==='absent').length;
        const l=recs.filter(a=>a.status==='late').length;
        const tot=students.length||1;
        return `<tr>
          <td>${formatDate(d)}</td>
          <td class="text-green">${p}</td>
          <td class="text-red">${ab}</td>
          <td style="color:var(--yellow)">${l}</td>
          <td><span class="badge badge-green">${Math.round(p/tot*100)}%</span></td>
        </tr>`;
      }).join('')}
    </tbody>
  </table>`;
}

function _buildStudentReportTab() {
  const allAtt = DB.get('attendance').filter(a=>a.classId===_attState.classId);
  const students = DB.where('students','classId',_attState.classId);
  const search   = (_attState.search||'').toLowerCase();
  const filtered = search ? students.filter(s=>s.name.toLowerCase().includes(search)) : students;
  if (!students.length) return '<div class="empty-state"><div class="e-icon">👤</div><p>No students in this class</p></div>';
  const totalDays = [...new Set(allAtt.map(a=>a.date))].length;
  return `<div class="card">
    <div class="card-header"><h3>👤 Student-wise Report — ${DB.find('classes',_attState.classId)?.name||''}</h3></div>
    <div class="table-wrap"><table>
      <thead><tr><th>Roll</th><th>Student</th><th>Present</th><th>Absent</th><th>Late</th><th>Attendance%</th></tr></thead>
      <tbody>
        ${filtered.map(s=>{
          const sAtt = allAtt.filter(a=>a.studentId===s.id);
          const p  = sAtt.filter(a=>a.status==='present').length;
          const ab = sAtt.filter(a=>a.status==='absent').length;
          const l  = sAtt.filter(a=>a.status==='late').length;
          const tot= sAtt.length||1;
          const pct= Math.round(p/tot*100);
          const cls= pct>=75?'badge-green':pct>=50?'badge-yellow':'badge-red';
          return `<tr>
            <td>${s.rollNo||'—'}</td>
            <td><strong>${s.name}</strong></td>
            <td class="text-green">${p}</td>
            <td class="text-red">${ab}</td>
            <td style="color:var(--yellow)">${l}</td>
            <td><span class="badge ${cls}">${pct}%</span></td>
          </tr>`;
        }).join('')}
      </tbody>
    </table></div>
  </div>`;
}

// ── QR SCAN TAB ───────────────────────────────────────
function _buildQRScanTab() {
  const students = DB.where('students','classId',_attState.classId);
  const scanned  = _attState.qrScanned || {};

  const scannedHtml = Object.entries(scanned).map(([id, info])=>{
    const st = DB.find('students', id);
    return st ? `<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:rgba(16,185,129,.1);border:1px solid rgba(16,185,129,.25);border-radius:10px;margin-bottom:7px;">
      <div style="width:34px;height:34px;background:rgba(16,185,129,.2);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0;">✅</div>
      <div style="flex:1;min-width:0;">
        <div style="font-weight:700;color:#10b981;font-size:.9rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${st.name}</div>
        <div style="font-size:.7rem;color:rgba(255,255,255,.35);">Roll ${st.rollNo||'—'} · ${info.time}</div>
      </div>
    </div>` : '';
  }).join('');

  return `
  <style>
    #_vmQRGrid{display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:start;}
    @media(max-width:680px){#_vmQRGrid{grid-template-columns:1fr;}}

    /* Scan line sweep animation */
    @keyframes _qrSweep{0%{top:8px;opacity:1}49%{opacity:1}50%{top:calc(100% - 8px);opacity:1}51%{opacity:0}100%{top:8px;opacity:0}}
    #_qrScanLine{
      position:absolute;left:8px;right:8px;height:2px;
      background:linear-gradient(90deg,transparent,#a78bfa,#7c3aed,#a78bfa,transparent);
      border-radius:2px;box-shadow:0 0 8px #a78bfa;
      animation:_qrSweep 2s linear infinite;
      animation-play-state:paused;
      pointer-events:none;
    }

    /* Green flash on successful scan */
    @keyframes _qrFlash{0%{opacity:0}30%{opacity:1}100%{opacity:0}}
    #_qrSuccessFlash{
      position:absolute;inset:0;background:rgba(16,185,129,.25);
      border-radius:14px;pointer-events:none;opacity:0;
    }

    /* Frame border transition */
    #_qrFrame{transition:border-color .2s,box-shadow .2s;}
  </style>

  <div id="_vmQRGrid">

    <!-- ── Camera panel ── -->
    <div class="card" style="padding:16px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
        <h4 style="color:var(--text1);margin:0;">📷 QR Scanner</h4>
        <span style="font-size:.72rem;color:rgba(255,255,255,.3);">Scan the ID card QR code</span>
      </div>

      <!-- Camera viewport -->
      <div style="position:relative;background:#0a0a14;border-radius:14px;overflow:hidden;aspect-ratio:4/3;margin-bottom:12px;border:1px solid rgba(255,255,255,.08);">
        <video id="_vmQRVideo" style="width:100%;height:100%;object-fit:cover;display:block;" playsinline muted autoplay></video>
        <canvas id="_vmQRCanvas" style="display:none;"></canvas>

        <!-- Success flash overlay -->
        <div id="_qrSuccessFlash"></div>

        <!-- Dark vignette + scan frame -->
        <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;">
          <div style="position:relative;width:62%;max-width:200px;aspect-ratio:1;">
            <!-- Dimmed outer -->
            <div style="position:absolute;inset:-2000px;background:rgba(0,0,0,.42);"></div>
            <!-- Frame border -->
            <div id="_qrFrame" style="position:absolute;inset:0;border:2.5px solid rgba(124,58,237,.7);border-radius:12px;"></div>
            <!-- Corner accents -->
            <div style="position:absolute;top:-2px;left:-2px;width:22px;height:22px;border-top:3px solid #a78bfa;border-left:3px solid #a78bfa;border-radius:8px 0 0 0;"></div>
            <div style="position:absolute;top:-2px;right:-2px;width:22px;height:22px;border-top:3px solid #a78bfa;border-right:3px solid #a78bfa;border-radius:0 8px 0 0;"></div>
            <div style="position:absolute;bottom:-2px;left:-2px;width:22px;height:22px;border-bottom:3px solid #a78bfa;border-left:3px solid #a78bfa;border-radius:0 0 0 8px;"></div>
            <div style="position:absolute;bottom:-2px;right:-2px;width:22px;height:22px;border-bottom:3px solid #a78bfa;border-right:3px solid #a78bfa;border-radius:0 0 8px 0;"></div>
            <!-- Sweep line -->
            <div id="_qrScanLine"></div>
          </div>
        </div>

        <!-- Camera off placeholder -->
        <div id="_qrCamOff" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:rgba(255,255,255,.25);font-size:.85rem;">
          <div style="font-size:2.5rem;opacity:.4;">📷</div>
          <div>Camera is off</div>
        </div>
      </div>

      <!-- Status bar -->
      <div id="_qrStatus" style="min-height:28px;font-size:.82rem;text-align:center;margin-bottom:14px;padding:6px 10px;background:rgba(255,255,255,.04);border-radius:8px;line-height:1.4;">
        <span style="color:rgba(255,255,255,.4);">▶️ Press Start Camera</span>
      </div>

      <!-- Action buttons -->
      <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-bottom:14px;">
        <button class="btn btn-primary" style="flex:1;min-width:120px;" onclick="_qrStartScan()">▶️ Start Camera</button>
        <button class="btn btn-secondary" style="flex:1;min-width:100px;" onclick="_qrStopScan()">⏹ Stop</button>
        <button class="btn btn-success" style="flex:1;min-width:120px;" onclick="_saveQRAttendance()">💾 Save Attendance</button>
      </div>

      <!-- Tips -->
      <div style="padding:10px 14px;background:rgba(124,58,237,.06);border:1px solid rgba(124,58,237,.18);border-radius:10px;font-size:.74rem;color:rgba(255,255,255,.38);line-height:1.7;">
        💡 <strong style="color:rgba(255,255,255,.55);">Tips:</strong>
        Hold QR card 15–25 cm away · Needs good lighting ·
        Har scan par <strong>beep</strong> + <strong>green flash</strong> aayega ·
        Students not scanned will be marked Absent
      </div>
    </div>

    <!-- ── Scanned list ── -->
    <div class="card" style="padding:16px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:8px;">
        <h4 style="color:var(--text1);margin:0;">
          ✅ Present: <span id="_qrCount" style="color:#10b981;">${Object.keys(scanned).length}</span>
          <span style="font-weight:400;color:rgba(255,255,255,.35);font-size:.82rem;"> / ${students.length}</span>
        </h4>
        <button class="btn btn-sm btn-danger" onclick="_attState.qrScanned={};_attState.marks={};_renderAttBody()">🗑 Clear</button>
      </div>

      <!-- Progress bar -->
      <div style="height:6px;background:rgba(255,255,255,.08);border-radius:3px;margin-bottom:14px;overflow:hidden;">
        <div id="_qrProgress" style="height:100%;background:linear-gradient(90deg,#10b981,#34d399);border-radius:3px;transition:width .4s;width:${students.length?Math.round(Object.keys(scanned).length/students.length*100):0}%;"></div>
      </div>

      <div id="_qrList" style="max-height:380px;overflow-y:auto;">
        ${scannedHtml || '<div data-qr-empty="1" style="text-align:center;padding:40px 16px;color:rgba(255,255,255,.2);font-size:.85rem;line-height:2;">📭<br>No scans yet<br><span style="font-size:.78rem;">Start the camera and show an ID card</span></div>'}
      </div>
    </div>
  </div>`;
}

// ── Start / Stop helpers called from QR tab buttons ───
window._qrStartScan = function() {
  var camOff = document.getElementById('_qrCamOff');
  if (camOff) camOff.style.display = 'none';
  window._vmQRStart(window._onAdminQRScan);
};
window._qrStopScan = function() {
  window._vmQRStop();
  var statusEl = document.getElementById('_qrStatus');
  if (statusEl) statusEl.innerHTML = '<span style="color:rgba(255,255,255,.4);">⏹ Camera stopped — press Start again</span>';
  var line = document.getElementById('_qrScanLine');
  if (line) line.style.animationPlayState = 'paused';
  var camOff = document.getElementById('_qrCamOff');
  if (camOff) camOff.style.display = 'flex';
};

// Called by QR scanner when code detected — marks student present in-place
window._onAdminQRScan = function(data) {
  var statusEl = document.getElementById('_qrStatus');
  function setStatus(html) { if (statusEl) statusEl.innerHTML = html; }

  // ── validate QR format ─────────────────────────────
  var studentId;
  if (data.startsWith('VM:STU:')) {
    studentId = data.slice(7);               // format: VM:STU:<id>
  } else {
    window._vmQRBeep('warn');
    setStatus('<span style="color:#f59e0b;">⚠️ Not a valid student QR code — use the ID card QR</span>');
    return;
  }

  var student = DB.find('students', studentId);
  if (!student) {
    window._vmQRBeep('error');
    setStatus('<span style="color:#ef4444;">❌ Student not found in database (ID: ' + studentId.slice(-8) + ')</span>');
    return;
  }

  // ── auto-set class if none selected ───────────────
  if (!_attState.classId) {
    _attState.classId = student.classId;
    var clsSel = document.querySelector('[onchange*="_attState.classId"]');
    if (clsSel) clsSel.value = student.classId;
  }

  // ── class mismatch check ──────────────────────────
  if (student.classId !== _attState.classId) {
    window._vmQRBeep('warn');
    var wrongCls = DB.find('classes', student.classId);
    var selCls   = DB.find('classes', _attState.classId);
    setStatus('<span style="color:#f59e0b;">⚠️ <strong>' + student.name + '</strong> — ' +
      'is from ' + (wrongCls ? wrongCls.name : 'another class') + '. ' +
      'You have selected <strong>' + (selCls ? selCls.name : 'a different class') + '</strong>.</span>');
    return;
  }

  // ── already scanned ───────────────────────────────
  if (!_attState.qrScanned) _attState.qrScanned = {};
  if (_attState.qrScanned[studentId]) {
    window._vmQRBeep('warn');
    setStatus('<span style="color:#06b6d4;">ℹ️ <strong>' + student.name + '</strong> — already marked ✅</span>');
    return;
  }

  // ── SUCCESS — mark present ────────────────────────
  var timeStr = new Date().toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' });
  _attState.qrScanned[studentId] = { time: timeStr, status: 'present' };
  _attState.marks[studentId]     = 'present';

  // Beep + vibrate
  window._vmQRBeep('success');

  // Green flash on camera viewport
  var flash = document.getElementById('_qrSuccessFlash');
  if (flash) {
    flash.style.transition = 'none';
    flash.style.opacity    = '1';
    setTimeout(function(){ if (flash) { flash.style.transition = 'opacity .5s'; flash.style.opacity = '0'; } }, 80);
  }

  var total   = DB.where('students','classId',_attState.classId).length;
  var present = Object.keys(_attState.qrScanned).length;

  setStatus('<span style="color:#10b981;font-weight:700;font-size:.88rem;">✅ ' + student.name +
    ' — Present (' + timeStr + ')' +
    ' &nbsp;<span style="font-weight:400;color:rgba(255,255,255,.45);">' + present + '/' + total + ' scanned</span></span>');

  // Prepend to list (no full re-render — camera keeps running)
  var listEl = document.getElementById('_qrList');
  if (listEl) {
    var empty = listEl.querySelector('[data-qr-empty]');
    if (empty) empty.remove();

    var item = document.createElement('div');
    item.style.cssText = 'display:flex;align-items:center;gap:10px;padding:10px 12px;background:rgba(16,185,129,.1);border:1px solid rgba(16,185,129,.25);border-radius:10px;margin-bottom:7px;animation:_qrItemIn .3s ease;';
    item.innerHTML =
      '<div style="width:34px;height:34px;background:rgba(16,185,129,.2);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0;">✅</div>' +
      '<div style="flex:1;min-width:0;">' +
        '<div style="font-weight:700;color:#10b981;font-size:.9rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + student.name + '</div>' +
        '<div style="font-size:.7rem;color:rgba(255,255,255,.35);">Roll ' + (student.rollNo||'—') + ' · ' + timeStr + '</div>' +
      '</div>';
    listEl.insertBefore(item, listEl.firstChild);
  }

  // Update count + progress bar
  var countEl = document.getElementById('_qrCount');
  if (countEl) countEl.textContent = present;

  var prog = document.getElementById('_qrProgress');
  if (prog && total) prog.style.width = Math.round(present / total * 100) + '%';

  // All students scanned → auto-prompt save
  if (present >= total && total > 0) {
    setTimeout(function(){
      if (confirm('🎉 All ' + total + ' students scanned! Save attendance now?')) {
        window._saveQRAttendance();
      }
    }, 400);
  }
};

// Item slide-in animation
(function(){
  if (document.getElementById('_qrItemAnim')) return;
  var s = document.createElement('style');
  s.id = '_qrItemAnim';
  s.textContent = '@keyframes _qrItemIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}';
  document.head.appendChild(s);
})();

// Save QR attendance — non-scanned students marked absent
window._saveQRAttendance = function() {
  var scanned  = _attState.qrScanned || {};
  var students = DB.where('students','classId', _attState.classId);
  if (!students.length) { toast('No students in this class', 'warning'); return; }
  if (!Object.keys(scanned).length) { toast('No students scanned yet — scan QR cards first', 'warning'); return; }

  // Auto-mark non-scanned as absent
  students.forEach(function(s) {
    if (!_attState.marks[s.id]) _attState.marks[s.id] = 'absent';
  });

  window._vmQRStop();

  var rest = DB.get('attendance').filter(function(a) {
    return !(a.classId === _attState.classId && a.date === _attState.date);
  });
  students.forEach(function(s) {
    rest.push({ id:genId('att'), classId:_attState.classId, studentId:s.id, date:_attState.date, status:_attState.marks[s.id]||'absent' });
  });
  DB.set('attendance', rest);

  var pCnt = Object.keys(scanned).length;
  toast('✅ Attendance saved! ' + pCnt + ' present, ' + (students.length - pCnt) + ' absent.', 'success');
  _attState.marks = {};
  _attState.qrScanned = {};
  _attState.tab = 'mark';
  renderAttendance();
};

function setAtt(sid, status) {
  _attState.marks[sid] = status;
  const el = document.getElementById('att-'+sid);
  if (!el) return;
  // tatt-card (list view) style
  el.className = 'tatt-card ' + status;
  el.querySelectorAll('.tatt-btn').forEach(b=>{
    b.classList.remove('active-p','active-a','active-l');
    if(b.classList.contains('p')&&status==='present') b.classList.add('active-p');
    if(b.classList.contains('a')&&status==='absent')  b.classList.add('active-a');
    if(b.classList.contains('l')&&status==='late')    b.classList.add('active-l');
  });
  _updateAttStats();
}
function _updateAttStats() {
  const students = DB.where('students','classId',_attState.classId);
  const saved    = DB.get('attendance').filter(a=>a.classId===_attState.classId && a.date===_attState.date);
  const savedMap = {}; saved.forEach(a=>{ savedMap[a.studentId]=a.status; });
  let p=0,ab=0,l=0,u=0;
  students.forEach(s=>{
    const st = _attState.marks[s.id]||savedMap[s.id]||'';
    if(st==='present')p++; else if(st==='absent')ab++; else if(st==='late')l++; else u++;
  });
  const tot=students.length||1;
  const upd=(id,v)=>{ const el=document.getElementById(id); if(el) el.textContent=v; };
  upd('att-cnt-p',p); upd('att-cnt-a',ab); upd('att-cnt-l',l); upd('att-cnt-u',u);
  upd('att-cnt-pct', Math.round(p/tot*100)+'%');
}
function markAllAtt(status) {
  const search = (_attState.search||'').toLowerCase();
  const students = DB.where('students','classId',_attState.classId);
  const filtered = search ? students.filter(s=>s.name.toLowerCase().includes(search)||String(s.rollNo).includes(search)) : students;
  filtered.forEach(s=>setAtt(s.id,status));
}
function markUnmarkedAbsent() {
  const saved    = DB.get('attendance').filter(a=>a.classId===_attState.classId && a.date===_attState.date);
  const savedMap = {}; saved.forEach(a=>{ savedMap[a.studentId]=a.status; });
  DB.where('students','classId',_attState.classId).forEach(s=>{
    if (!_attState.marks[s.id] && !savedMap[s.id]) setAtt(s.id,'absent');
  });
}
function saveAttendance() {
  const {classId,date,marks}=_attState;
  if (!classId){toast('Select a class','warning');return}
  const students=DB.where('students','classId',classId);
  if (!Object.keys(marks).length) { toast('Mark attendance first','warning'); return; }
  const rest=DB.get('attendance').filter(a=>!(a.classId===classId&&a.date===date));
  students.forEach(s=>{
    rest.push({id:genId('att'),classId,studentId:s.id,date,status:marks[s.id]||'absent'});
  });
  DB.set('attendance',rest);
  _attState.marks={};
  toast(`Attendance saved! ${students.length} students recorded.`,'success');
  _renderAttBody();
}
// legacy alias (used by printAttendanceSheet)
function attSummaryHtml() { return _buildReportTab(); }

// ══════════════════════════════════════════════════════
//  HOMEWORK
// ══════════════════════════════════════════════════════
function renderHomework() {
  const hw=DB.get('homework'), classes=DB.get('classes');
  const todayStr=today();

  // ── Group homework by assignedOn date (newest first) ──
  const byDate = {};
  hw.forEach(h=>{
    const d = h.assignedOn || h.dueDate || todayStr;
    if(!byDate[d]) byDate[d]=[];
    byDate[d].push(h);
  });
  const sortedDates = Object.keys(byDate).sort((a,b)=>b.localeCompare(a));

  // ── Build date-grouped accordion ──
  const dateGroups = sortedDates.map((date,di)=>{
    const isToday = date===todayStr;
    const isYesterday = date===_hwDateShift(-1);
    const label = isToday?'Today':isYesterday?'Yesterday':formatDate(date);
    const items = byDate[date];
    const active = di===0; // first group open by default

    const cards = items.map(h=>{
      const cls=classes.find(c=>c.id===h.classId);
      const overdue=h.dueDate<todayStr;
      return `<div style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:14px;overflow:hidden;display:flex;flex-direction:column;">
        ${h.photo?`<div style="position:relative">
          <img src="${h.photo}" style="width:100%;max-height:180px;object-fit:cover;display:block;cursor:pointer" onclick="this.requestFullscreen&&this.requestFullscreen()">
          <button onclick="deleteHWPhoto('${h.id}')" title="Remove photo"
            style="position:absolute;top:8px;right:8px;background:rgba(239,68,68,.9);color:#fff;border:none;border-radius:8px;padding:4px 10px;font-size:11px;cursor:pointer;">🗑️ Photo</button>
        </div>`:''}
        <div style="padding:14px;flex:1;display:flex;flex-direction:column;gap:8px;">
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px;">
            <span class="badge badge-purple">${h.subject}</span>
            <span class="badge ${overdue?'badge-red':'badge-green'}" style="font-size:11px;">${overdue?'⚠️ Overdue':'✅ Active'}</span>
          </div>
          <div style="font-weight:700;font-size:14px;color:#fff;">${h.title}</div>
          ${h.description?`<div style="font-size:13px;color:rgba(255,255,255,.65);line-height:1.5;">${h.description}</div>`:''}
          <div style="display:flex;justify-content:space-between;font-size:11.5px;color:rgba(255,255,255,.45);flex-wrap:wrap;gap:4px;">
            <span>🏫 ${cls?cls.name:'—'}</span>
            <span>📅 Due: ${formatDate(h.dueDate)}</span>
          </div>
          <div style="font-size:11px;color:rgba(255,255,255,.35);">By: ${h.assignedBy||'Admin'}</div>
          <div style="display:flex;gap:8px;margin-top:4px;">
            ${!h.photo?`<button class="btn btn-sm btn-secondary" style="flex:1" onclick="openHWPhotoUpload('${h.id}')">📷 Add Photo</button>`:''}
            <button class="btn btn-sm btn-danger" style="${!h.photo?'':'flex:1'}" onclick="deleteHW('${h.id}')">🗑️ Delete</button>
          </div>
        </div>
      </div>`;
    }).join('');

    return `<div style="border:1.5px solid ${isToday?'rgba(124,58,237,.4)':'var(--border,#e2e8f0)'};border-radius:16px;overflow:hidden;margin-bottom:12px;background:${isToday?'rgba(124,58,237,.04)':'var(--bg-2)'}">
      <!-- Accordion header -->
      <div onclick="_hwToggle(this)" style="display:flex;align-items:center;justify-content:space-between;padding:14px 18px;cursor:pointer;user-select:none;gap:12px;">
        <div style="display:flex;align-items:center;gap:12px;flex:1;min-width:0;">
          <span style="font-size:1.35rem;">${isToday?'📅':'📆'}</span>
          <div>
            <div style="font-weight:700;font-size:15px;color:#fff;">${label} <span style="font-size:11px;color:rgba(255,255,255,.4);font-weight:400;">(${formatDate(date)})</span></div>
            <div style="font-size:12px;color:rgba(255,255,255,.45);margin-top:1px;">${items.length} homework assignment${items.length>1?'s':''}</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
          ${isToday?'<span style="background:rgba(124,58,237,.15);color:#7c3aed;font-size:10px;font-weight:700;padding:2px 10px;border-radius:20px;border:1px solid rgba(124,58,237,.25);">TODAY</span>':''}
          <span style="background:var(--bg-3,#e9ecef);border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:15px;transition:transform .25s;" class="_hw_chevron">${active?'▲':'▼'}</span>
        </div>
      </div>
      <!-- Accordion body -->
      <div class="_hw_body" style="display:${active?'block':'none'};padding:0 16px 16px;">
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px;">
          ${cards}
        </div>
      </div>
    </div>`;
  }).join('');

  document.getElementById('section-homework').innerHTML = `
  <div class="page-header">
    <div>
      <h2>📚 Homework</h2>
      <div class="breadcrumb">Total: <span>${hw.length}</span> &nbsp;·&nbsp; Dates: <span>${sortedDates.length}</span></div>
    </div>
    <button class="btn btn-primary" onclick="openHWModal()">➕ Assign Homework</button>
  </div>

  ${hw.length===0
    ?'<div class="empty-state"><div class="e-icon">📚</div><h3>No homework assigned yet</h3><p>Click "Assign Homework" to get started</p></div>'
    :dateGroups}

  <input type="file" id="hw-photo-existing-input" accept="image/*" style="display:none" onchange="handleHWExistingPhoto(this)">`;
}

function _hwToggle(header) {
  const body    = header.nextElementSibling;
  const chevron = header.querySelector('._hw_chevron');
  const open    = body.style.display==='block';
  body.style.display    = open?'none':'block';
  chevron.textContent   = open?'▼':'▲';
}

function _hwDateShift(days) {
  const d=new Date(); d.setDate(d.getDate()+days);
  return d.toISOString().split('T')[0];
}

// ── Homework Photo Helpers ────────────────────────────
let _hwPhotoData = null;
let _hwPhotoTargetId = null;

function handleHWPhoto(input) {
  const file = input.files[0]; if (!file) return;
  const statusEl  = document.getElementById('hw-photo-status');
  const previewEl = document.getElementById('hw-photo-preview');
  statusEl.textContent = '⏳ Compressing...';
  const MAX_BYTES = 200 * 1024;
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let w=img.width, h=img.height, MAX_DIM=800;
      if (w>MAX_DIM||h>MAX_DIM){ if(w>h){h=Math.round(h*MAX_DIM/w);w=MAX_DIM;}else{w=Math.round(w*MAX_DIM/h);h=MAX_DIM;} }
      canvas.width=w; canvas.height=h;
      const ctx=canvas.getContext('2d'); ctx.drawImage(img,0,0,w,h);
      let quality=0.92, dataUrl=canvas.toDataURL('image/jpeg',quality);
      while(dataUrl.length*0.75>MAX_BYTES&&quality>0.1){quality-=0.08;dataUrl=canvas.toDataURL('image/jpeg',Math.max(quality,0.1));}
      while(dataUrl.length*0.75>MAX_BYTES&&(w>200||h>200)){w=Math.round(w*0.8);h=Math.round(h*0.8);canvas.width=w;canvas.height=h;ctx.drawImage(img,0,0,w,h);dataUrl=canvas.toDataURL('image/jpeg',0.7);}
      _hwPhotoData=dataUrl;
      const kb=Math.round(dataUrl.length*0.75/1024);
      previewEl.innerHTML=`<img src="${dataUrl}" style="width:100%;max-height:200px;object-fit:cover;border-radius:10px">`;
      statusEl.innerHTML=`<span style="color:#16a34a">✅ ${kb} KB — Ready</span>`;
    };
    img.src=e.target.result;
  };
  reader.readAsDataURL(file);
}

function openHWPhotoUpload(id) {
  _hwPhotoTargetId = id;
  const inp = document.getElementById('hw-photo-existing-input');
  inp.value=''; inp.click();
}

function handleHWExistingPhoto(input) {
  const file = input.files[0]; if (!file) return;
  const MAX_BYTES = 200*1024;
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let w=img.width, h=img.height, MAX_DIM=800;
      if (w>MAX_DIM||h>MAX_DIM){ if(w>h){h=Math.round(h*MAX_DIM/w);w=MAX_DIM;}else{w=Math.round(w*MAX_DIM/h);h=MAX_DIM;} }
      canvas.width=w; canvas.height=h;
      const ctx=canvas.getContext('2d'); ctx.drawImage(img,0,0,w,h);
      let quality=0.92, dataUrl=canvas.toDataURL('image/jpeg',quality);
      while(dataUrl.length*0.75>MAX_BYTES&&quality>0.1){quality-=0.08;dataUrl=canvas.toDataURL('image/jpeg',Math.max(quality,0.1));}
      while(dataUrl.length*0.75>MAX_BYTES&&(w>200||h>200)){w=Math.round(w*0.8);h=Math.round(h*0.8);canvas.width=w;canvas.height=h;ctx.drawImage(img,0,0,w,h);dataUrl=canvas.toDataURL('image/jpeg',0.7);}
      const kb=Math.round(dataUrl.length*0.75/1024);
      DB.update('homework',_hwPhotoTargetId,{photo:dataUrl});
      toast(`Photo added! (${kb} KB)`,'success');
      _hwPhotoTargetId=null; renderHomework();
    };
    img.src=e.target.result;
  };
  reader.readAsDataURL(file);
}

function deleteHWPhoto(id) {
  if (!confirmAction('Remove this photo from homework?')) return;
  DB.update('homework',id,{photo:''});
  toast('Photo removed','success'); renderHomework();
}

function openHWModal() {
  _hwPhotoData = null;
  const classes=DB.get('classes');
  buildModal('modal-hw','Assign Homework',`
    <!-- Photo Upload -->
    <div style="background:var(--bg-2,#f8f9fa);border-radius:12px;border:2px dashed var(--border,#e2e8f0);padding:14px;margin-bottom:16px">
      <div style="font-size:13px;font-weight:600;color:var(--text-1);margin-bottom:8px">📷 Blackboard / Reference Photo <span style="font-weight:400;font-size:11px;color:var(--text-3)">(optional)</span></div>
      <div id="hw-photo-preview" style="width:100%;min-height:80px;border-radius:10px;background:var(--bg-3,#e9ecef);display:flex;align-items:center;justify-content:center;font-size:2rem;overflow:hidden;margin-bottom:8px;cursor:pointer" onclick="document.getElementById('hw-photo-input').click()">
        📸
      </div>
      <div style="display:flex;align-items:center;gap:10px">
        <button type="button" class="btn btn-secondary" style="padding:6px 14px;font-size:12px" onclick="document.getElementById('hw-photo-input').click()">📷 Upload Photo</button>
        <div id="hw-photo-status" style="font-size:11px;color:var(--text-3)">Tap to upload blackboard photo</div>
      </div>
      <input type="file" id="hw-photo-input" accept="image/*" style="display:none" onchange="handleHWPhoto(this)">
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Class *</label>
        <select class="form-control" id="hw-class">
          <option value="">Select</option>
          ${classes.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}
        </select></div>
      <div class="form-group"><label class="form-label">Subject *</label>
        <input class="form-control" id="hw-subject" placeholder="Subject"></div>
    </div>
    <div class="form-group"><label class="form-label">Title *</label>
      <input class="form-control" id="hw-title" placeholder="Homework title"></div>
    <div class="form-group"><label class="form-label">Description</label>
      <textarea class="form-control" id="hw-desc" rows="3" placeholder="Details…"></textarea></div>
    <div class="form-group"><label class="form-label">Due Date *</label>
      <input class="form-control" type="date" id="hw-due"></div>`,
    saveHW, 'modal-lg');
}
function saveHW() {
  const classId=val('hw-class'),subject=val('hw-subject'),title=val('hw-title'),dueDate=val('hw-due');
  const description=document.getElementById('hw-desc').value.trim();
  const photo = _hwPhotoData||'';
  if (!classId||!subject||!title||!dueDate){toast('Fill required fields','warning');return}
  DB.push('homework',{id:genId('hw'),classId,subject,title,description,photo,dueDate,assignedBy:CU.name,assignedOn:today()});
  _hwPhotoData=null;
  toast('Homework assigned!','success'); closeAllModals(); renderHomework();
}
function deleteHW(id){if(!confirmAction('Delete this homework?'))return;DB.delete('homework',id);renderHomework()}

// ══════════════════════════════════════════════════════
//  TIMETABLE  (Fully Customizable)
// ══════════════════════════════════════════════════════
let _ttClass = '';
const ALL_DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

function getTTSettings() {
  const s = (DB.get('ttSettings')||[])[0] || {};
  return {
    days:  s.days  || ['Monday','Tuesday','Wednesday','Thursday','Friday'],
    slots: s.slots || ['9:00–9:45','9:45–10:30','10:30–11:15','11:15–12:00','12:00–12:45','1:30–2:15','2:15–3:00']
  };
}

function renderTimetable() {
  const classes=DB.get('classes');
  if (!_ttClass && classes[0]) _ttClass=classes[0].id;
  const tt=DB.get('timetable').filter(t=>t.classId===_ttClass);
  const {days,slots}=getTTSettings();
  document.getElementById('section-timetable').innerHTML = `
  <div class="page-header">
    <div><h2>Timetable</h2><div class="breadcrumb">Click any cell to add/edit</div></div>
    <div class="d-flex gap-8">
      <button class="btn btn-secondary" onclick="openTTConfigModal()">⚙️ Configure</button>
      <button class="btn" style="background:linear-gradient(135deg,#7c3aed,#3b82f6);color:#fff;border:none;font-weight:700;" onclick="ttMagicGenerate()">🪄 Magic AI Generate</button>
      <button class="btn btn-primary" onclick="openTTModal()">➕ Add Entry</button>
    </div>
  </div>
  <div class="d-flex align-center gap-12 mb-20" style="flex-wrap:wrap;">
    <select class="form-control" style="width:200px" onchange="_ttClass=this.value;renderTimetable()">
      ${classes.map(c=>`<option value="${c.id}" ${c.id===_ttClass?'selected':''}>${c.name}</option>`).join('')}
    </select>
    <div style="font-size:12px;color:var(--text-3)">📅 ${days.length} days &nbsp;·&nbsp; ⏰ ${slots.length} periods</div>
    ${tt.length?'':`<span style="font-size:12px;color:#a78bfa;background:rgba(124,58,237,.12);border:1px solid rgba(124,58,237,.3);border-radius:8px;padding:4px 10px;">✨ Tip: Click "Magic AI Generate" to auto-create the full schedule</span>`}
  </div>
  <div class="card" style="overflow-x:auto"><div class="card-body" style="padding:0">
    <table class="tt-table" style="width:100%;border-collapse:collapse;min-width:${200+days.length*120}px">
      <thead><tr>
        <th style="padding:12px 14px;text-align:left;font-size:12px;color:var(--text-3);font-weight:700;background:var(--bg-2);white-space:nowrap;border-bottom:2px solid var(--border)">⏰ Period</th>
        ${days.map(d=>`<th style="padding:12px 10px;text-align:center;font-size:12px;font-weight:700;color:var(--text-1);background:var(--bg-2);border-bottom:2px solid var(--border);white-space:nowrap">${d}</th>`).join('')}
      </tr></thead>
      <tbody>
        ${slots.map((slot,si)=>`<tr style="border-bottom:1px solid var(--border)">
          <td style="padding:10px 14px;font-size:.75rem;color:var(--text-3);font-weight:700;white-space:nowrap;background:var(--bg-2);border-right:1px solid var(--border)">${slot}</td>
          ${days.map(day=>{
            const cell=tt.find(t=>t.day===day&&t.slot===slot);
            if (cell&&cell.isBreak) return `<td style="padding:6px;text-align:center"><div style="background:linear-gradient(135deg,#f59e0b22,#f9731622);border:1.5px dashed #f59e0b;border-radius:10px;padding:10px 4px;color:#b45309;font-size:12px;font-weight:600">☕ Break</div></td>`;
            if (cell) return `<td style="padding:6px"><div onclick="openTTModal('${day}','${slot}')" style="background:linear-gradient(135deg,#7c3aed22,#06b6d422);border:1.5px solid #7c3aed44;border-radius:10px;padding:10px 8px;cursor:pointer;transition:all .2s" onmouseover="this.style.background='linear-gradient(135deg,#7c3aed33,#06b6d433)'" onmouseout="this.style.background='linear-gradient(135deg,#7c3aed22,#06b6d422)'"><div style="font-weight:700;font-size:13px;color:var(--text-1)">${cell.subject}</div>${cell.teacher?`<div style="font-size:11px;color:var(--text-3);margin-top:2px">👩‍🏫 ${cell.teacher}</div>`:''}</div></td>`;
            return `<td style="padding:6px"><div onclick="openTTModal('${day}','${slot}')" style="border:1.5px dashed var(--border);border-radius:10px;padding:10px 8px;cursor:pointer;transition:all .2s;min-height:50px;display:flex;align-items:center;justify-content:center" onmouseover="this.style.borderColor='#7c3aed';this.style.background='var(--bg-2)'" onmouseout="this.style.borderColor='var(--border)';this.style.background=''"><span style="color:var(--text-3);font-size:12px">+ Add</span></div></td>`;
          }).join('')}
        </tr>`).join('')}
      </tbody>
    </table>
  </div></div>`;
}

// ── AI Timetable generator ──────────────────────────
function _ttSubjectsForClass(classId){
  const subs=[];
  const seen=new Set();
  const add=s=>{ s=(s||'').trim(); if(s&&!seen.has(s.toLowerCase())){seen.add(s.toLowerCase());subs.push(s);} };
  // 1) from exams defined for this class
  DB.get('exams').filter(e=>e.classId===classId).forEach(e=>add(e.subject));
  // 2) from teachers' subjects (ensures a teacher exists)
  DB.get('teachers').forEach(t=>add(t.subject));
  // 3) sensible defaults if still empty
  if(!subs.length) ['English','Mathematics','Science','Social Studies','Hindi','Computer','G.K.','EVS'].forEach(add);
  return subs;
}
function _ttTeacherFor(subject){
  const sub=(subject||'').toLowerCase();
  const t=DB.get('teachers').find(t=>{
    const ts=(t.subject||'').toLowerCase();
    return ts && (ts===sub || ts.includes(sub) || sub.includes(ts));
  });
  return t?t.name:'';
}
function ttMagicGenerate(){
  const cls=DB.find('classes',_ttClass);
  if(!cls){ toast('Select a class first','warning'); return; }
  if(!confirmAction(`🪄 AI will generate a fresh weekly timetable for ${cls.name}. Existing entries for this class will be replaced (breaks are kept). Continue?`)) return;

  const {days,slots}=getTTSettings();
  const subjects=_ttSubjectsForClass(_ttClass);
  if(!subjects.length){ toast('Add subjects (exams) or teachers first','warning'); return; }

  // keep existing breaks
  const existing=DB.get('timetable').filter(t=>t.classId===_ttClass);
  const breakSet={}; existing.forEach(t=>{ if(t.isBreak) breakSet[t.day+'|'+t.slot]=true; });
  const rest=DB.get('timetable').filter(t=>t.classId!==_ttClass);

  const out=[];
  days.forEach((day,di)=>{
    // rotate the subject order per day so the week looks varied
    const rot=di%subjects.length;
    const queue=subjects.slice(rot).concat(subjects.slice(0,rot));
    let qi=0, last='';
    slots.forEach(slot=>{
      if(breakSet[day+'|'+slot]){ out.push({id:genId('tt'),classId:_ttClass,day,slot,isBreak:true}); return; }
      let pick=queue[qi%queue.length];
      if(pick===last && queue.length>1){ qi++; pick=queue[qi%queue.length]; } // no consecutive repeat
      qi++; last=pick;
      out.push({id:genId('tt'),classId:_ttClass,day,slot,subject:pick,teacher:_ttTeacherFor(pick)});
    });
  });

  DB.set('timetable', rest.concat(out));
  toast('✨ AI timetable generated! Review & edit any cell — it\'s already saved.','success');
  renderTimetable();
}

function openTTConfigModal() {
  const {days,slots}=getTTSettings();
  buildModal('modal-tt-config','⚙️ Configure Timetable',`
    <div class="form-group">
      <label class="form-label" style="margin-bottom:10px">📅 School Days</label>
      <div style="display:flex;flex-wrap:wrap;gap:8px">
        ${ALL_DAYS.map(d=>{
          const active=days.includes(d);
          return `<label id="ttday-lbl-${d}" style="display:flex;align-items:center;gap:6px;cursor:pointer;padding:8px 14px;border-radius:10px;border:2px solid ${active?'#7c3aed':'var(--border)'};background:${active?'#7c3aed':'transparent'};transition:all .2s;user-select:none">
            <input type="checkbox" id="ttday-${d}" ${active?'checked':''} style="display:none"
              onchange="const l=document.getElementById('ttday-lbl-${d}');l.style.background=this.checked?'#7c3aed':'transparent';l.style.borderColor=this.checked?'#7c3aed':'var(--border)';l.querySelector('span').style.color=this.checked?'#fff':'var(--text-1)'">
            <span style="font-size:13px;font-weight:700;color:${active?'#fff':'var(--text-1)'}">${d.slice(0,3)}</span>
          </label>`;
        }).join('')}
      </div>
    </div>
    <div class="form-group" style="margin-top:20px">
      <label class="form-label" style="margin-bottom:10px">⏰ Time Slots / Periods</label>
      <div id="tt-slots-list" style="display:flex;flex-direction:column;gap:8px">
        ${slots.map(slot=>`<div class="tt-slot-row" style="display:flex;align-items:center;gap:8px">
          <span style="color:var(--text-3);font-size:13px;width:20px;text-align:center">⏱</span>
          <input class="form-control tt-slot-input" value="${slot}" style="flex:1" placeholder="e.g. 9:00–9:45">
          <button type="button" onclick="this.parentElement.remove()" style="background:#ef4444;color:#fff;border:none;border-radius:8px;padding:6px 10px;cursor:pointer;font-size:13px;flex-shrink:0">🗑</button>
        </div>`).join('')}
      </div>
      <button type="button" onclick="addTTSlotRow()" style="margin-top:10px;width:100%;padding:10px;border:2px dashed var(--border);background:transparent;border-radius:10px;cursor:pointer;color:var(--text-2);font-size:13px;font-weight:600;transition:all .2s" onmouseover="this.style.borderColor='#7c3aed';this.style.color='#7c3aed'" onmouseout="this.style.borderColor='var(--border)';this.style.color='var(--text-2)'">+ Add Time Slot</button>
    </div>
    <div style="background:#fef3c7;border-radius:10px;padding:10px 14px;font-size:12px;color:#92400e;margin-top:12px">
      💡 Time format: <strong>9:00–9:45</strong> or <strong>9:00-9:45</strong> or any label like <strong>Period 1</strong>
    </div>`, saveTTConfig);
}

function addTTSlotRow() {
  const list=document.getElementById('tt-slots-list');
  const div=document.createElement('div');
  div.className='tt-slot-row';
  div.style.cssText='display:flex;align-items:center;gap:8px';
  div.innerHTML=`<span style="color:var(--text-3);font-size:13px;width:20px;text-align:center">⏱</span>
    <input class="form-control tt-slot-input" style="flex:1" placeholder="e.g. 10:30–11:15">
    <button type="button" onclick="this.parentElement.remove()" style="background:#ef4444;color:#fff;border:none;border-radius:8px;padding:6px 10px;cursor:pointer;font-size:13px;flex-shrink:0">🗑</button>`;
  list.appendChild(div);
  div.querySelector('input').focus();
}

function saveTTConfig() {
  const days=ALL_DAYS.filter(d=>document.getElementById(`ttday-${d}`)?.checked);
  const slots=[...document.querySelectorAll('.tt-slot-input')].map(i=>i.value.trim()).filter(Boolean);
  if (!days.length){toast('At least 1 day required','warning');return}
  if (!slots.length){toast('At least 1 time slot required','warning');return}
  const existing=(DB.get('ttSettings')||[])[0];
  if (existing) DB.set('ttSettings',[{...existing,days,slots}]);
  else          DB.set('ttSettings',[{id:'tts',days,slots}]);
  toast('Timetable configured!','success'); closeAllModals(); renderTimetable();
}

function openTTModal(preDay='',preSlot='') {
  const classes=DB.get('classes'),teachers=DB.get('teachers');
  const {days,slots}=getTTSettings();
  // Check if existing entry
  const existing=preDay&&preSlot?DB.get('timetable').find(t=>t.classId===_ttClass&&t.day===preDay&&t.slot===preSlot):null;
  buildModal('modal-tt', preDay?`${preDay} — ${preSlot}`:'Add Entry',`
    <div class="form-row">
      <div class="form-group"><label class="form-label">Class</label>
        <select class="form-control" id="tt-class">
          ${classes.map(c=>`<option value="${c.id}" ${c.id===_ttClass?'selected':''}>${c.name}</option>`).join('')}
        </select></div>
      <div class="form-group"><label class="form-label">Day</label>
        <select class="form-control" id="tt-day">
          ${days.map(d=>`<option value="${d}" ${d===preDay?'selected':''}>${d}</option>`).join('')}
        </select></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Period / Time Slot</label>
        <select class="form-control" id="tt-slot">
          ${slots.map(s=>`<option value="${s}" ${s===preSlot?'selected':''}>${s}</option>`).join('')}
        </select></div>
      <div class="form-group"><label class="form-label">Subject</label>
        <input class="form-control" id="tt-subject" placeholder="Subject name" value="${existing?existing.subject||'':''}"></div>
    </div>
    <div class="form-group"><label class="form-label">Teacher</label>
      <select class="form-control" id="tt-teacher">
        <option value="">— Select teacher —</option>
        ${teachers.map(t=>`<option value="${t.name}" ${existing&&existing.teacher===t.name?'selected':''}>${t.name}${t.subject?` (${t.subject})`:''}</option>`).join('')}
      </select></div>
    <div class="form-group">
      <label style="display:flex;align-items:center;gap:10px;cursor:pointer">
        <label class="toggle"><input type="checkbox" id="tt-break" ${existing&&existing.isBreak?'checked':''}><div class="toggle-slider"></div></label>
        <span style="font-size:14px">☕ Mark as Break / Free Period</span>
      </label>
    </div>
    ${existing?`<button type="button" onclick="clearTTCell()" class="btn btn-danger" style="width:100%">🗑️ Clear This Cell</button>`:''}`,
    saveTT);
}
function clearTTCell() {
  const classId=val('tt-class'),day=val('tt-day'),slot=val('tt-slot');
  DB.set('timetable',DB.get('timetable').filter(t=>!(t.classId===classId&&t.day===day&&t.slot===slot)));
  toast('Cell cleared','success'); closeAllModals(); renderTimetable();
}
function saveTT() {
  const classId=val('tt-class'),day=val('tt-day'),slot=val('tt-slot');
  const subject=val('tt-subject'),teacher=val('tt-teacher');
  const isBreak=document.getElementById('tt-break').checked;
  if (!isBreak&&!subject){toast('Enter subject name','warning');return}
  const rest=DB.get('timetable').filter(t=>!(t.classId===classId&&t.day===day&&t.slot===slot));
  rest.push({id:genId('tt'),classId,day,slot,subject:isBreak?'BREAK':subject,teacher,isBreak});
  DB.set('timetable',rest);
  toast('Timetable updated!','success'); closeAllModals(); renderTimetable();
}

// ══════════════════════════════════════════════════════
//  EXAMS & MARKS
// ══════════════════════════════════════════════════════
// ── Exams state ──────────────────────────────────────
let _exTab='list', _exFilterClass='', _exEntryClass='', _exEntryType='';
let _admitClass='', _admitExam='', _admitVenue='', _admitInstr='';

function renderExams(){
  const classes=DB.get('classes');
  if(!_exFilterClass&&classes[0]) _exFilterClass=classes[0].id;
  if(!_exEntryClass&&classes[0]) _exEntryClass=classes[0].id;
  document.getElementById('section-exams').innerHTML=`
  <div class="page-header">
    <div><h2>Exams &amp; Marks</h2></div>
    <button class="btn btn-primary" onclick="openExamModal()">➕ Add Exam / Subject</button>
  </div>
  <div class="d-flex gap-8 mb-20" style="border-bottom:1px solid var(--border);padding-bottom:0;flex-wrap:wrap;">
    <button class="tab-btn${_exTab==='list'?' active':''}"  style="padding:10px 20px;border:none;background:none;cursor:pointer;font-weight:600;border-bottom:${_exTab==='list'? '3px solid #7c3aed':'3px solid transparent'};color:${_exTab==='list'? '#7c3aed':'var(--text-2)'}" onclick="_exTab='list';renderExams()">📋 Manage Exams</button>
    <button class="tab-btn${_exTab==='entry'?' active':''}" style="padding:10px 20px;border:none;background:none;cursor:pointer;font-weight:600;border-bottom:${_exTab==='entry'?'3px solid #7c3aed':'3px solid transparent'};color:${_exTab==='entry'?'#7c3aed':'var(--text-2)'}" onclick="_exTab='entry';renderExams()">📝 Enter Marks</button>
    <button class="tab-btn${_exTab==='schedule'?' active':''}" style="padding:10px 20px;border:none;background:none;cursor:pointer;font-weight:600;border-bottom:${_exTab==='schedule'?'3px solid #10b981':'3px solid transparent'};color:${_exTab==='schedule'?'#10b981':'var(--text-2)'}" onclick="_exTab='schedule';renderExams()">📅 Exam Schedule</button>
    <button class="tab-btn${_exTab==='admit'?' active':''}" style="padding:10px 20px;border:none;background:none;cursor:pointer;font-weight:600;border-bottom:${_exTab==='admit'?'3px solid #f59e0b':'3px solid transparent'};color:${_exTab==='admit'?'#f59e0b':'var(--text-2)'}" onclick="_exTab='admit';renderExams()">🎫 Admit Cards</button>
  </div>
  ${_exTab==='list'?_exListHtml(classes):_exTab==='admit'?_exAdmitHtml(classes):_exTab==='schedule'?_exScheduleHtml(classes):_exEntryHtml(classes)}`;
}

function _exListHtml(classes){
  const exams=DB.get('exams');
  // Group by class + exam name
  const classMap={};
  classes.forEach(c=>{ classMap[c.id]=c; });
  // Filter controls
  const filtered=_exFilterClass?exams.filter(e=>e.classId===_exFilterClass):exams;
  // Group by exam name
  const groups={};
  filtered.slice().reverse().forEach(e=>{
    const key=e.classId+'||'+e.name;
    if(!groups[key]) groups[key]={name:e.name,classId:e.classId,date:e.date,exams:[]};
    groups[key].exams.push(e);
  });
  const groupList=Object.values(groups);
  return `
  <div class="d-flex gap-12 mb-16" style="flex-wrap:wrap;align-items:center">
    <select class="form-control" style="width:200px" onchange="_exFilterClass=this.value;renderExams()">
      <option value="">All Classes</option>
      ${classes.map(c=>`<option value="${c.id}" ${c.id===_exFilterClass?'selected':''}>${c.name}</option>`).join('')}
    </select>
    <span class="text-xs text-muted">${filtered.length} subject exam(s) in ${groupList.length} exam group(s)</span>
  </div>
  ${groupList.length?groupList.map(g=>{
    const cls=classMap[g.classId];
    const totalStudents=DB.where('students','classId',g.classId).length;
    const allMarks=DB.get('marks');
    return `<div class="card mb-16">
      <div class="card-header" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
        <div>
          <h3 style="margin:0">📋 ${g.name}</h3>
          <span class="text-xs text-muted">${cls?cls.name:'—'} &nbsp;·&nbsp; ${formatDate(g.date)}</span>
        </div>
        <button class="btn btn-sm btn-primary" onclick="_exTab='entry';_exEntryClass='${g.classId}';_exEntryType='${g.name}';renderExams()">📝 Enter Marks</button>
      </div>
      <div class="table-wrap"><table>
        <thead><tr><th>Subject</th><th>Max Marks</th><th>Marks Entered</th><th>Pending</th><th>Action</th></tr></thead>
        <tbody>
          ${g.exams.map(e=>{
            const entered=allMarks.filter(m=>m.examId===e.id).length;
            const pending=totalStudents-entered;
            return `<tr>
              <td><strong>${e.subject}</strong></td>
              <td>${e.maxMarks}</td>
              <td><span class="badge ${entered===totalStudents&&totalStudents>0?'badge-green':'badge-yellow'}">${entered}/${totalStudents}</span></td>
              <td>${pending>0?`<span class="badge badge-red">${pending} left</span>`:'<span class="badge badge-green">✅ Done</span>'}</td>
              <td><button class="btn btn-sm btn-danger" onclick="deleteExam('${e.id}')">🗑️</button></td>
            </tr>`;
          }).join('')}
        </tbody>
      </table></div>
    </div>`;
  }).join(''):`<div class="empty-state"><div class="e-icon">📋</div><h3>No Exams Yet</h3><p>Click "Add Exam / Subject" to create exam entries per subject</p></div>`}`;
}

function _exEntryHtml(classes){
  const allExams=DB.get('exams').filter(e=>e.classId===_exEntryClass);
  const examTypes=[...new Set(allExams.map(e=>e.name))].sort();
  if(!_exEntryType&&examTypes[0]) _exEntryType=examTypes[0];
  const typeExams=allExams.filter(e=>e.name===_exEntryType).sort((a,b)=>a.subject.localeCompare(b.subject));
  const students=DB.where('students','classId',_exEntryClass).sort((a,b)=>(a.rollNo||'').toString().localeCompare((b.rollNo||'').toString(),undefined,{numeric:true}));
  const allMarks=DB.get('marks');
  const maxTotal=typeExams.reduce((t,e)=>t+e.maxMarks,0);
  return `
  <div class="d-flex gap-12 mb-16" style="flex-wrap:wrap;align-items:flex-end">
    <div>
      <label class="form-label" style="font-size:.78rem;margin-bottom:4px;display:block">Class</label>
      <select class="form-control" style="width:180px" onchange="_exEntryClass=this.value;_exEntryType='';renderExams()">
        ${classes.map(c=>`<option value="${c.id}" ${c.id===_exEntryClass?'selected':''}>${c.name}</option>`).join('')}
      </select>
    </div>
    <div>
      <label class="form-label" style="font-size:.78rem;margin-bottom:4px;display:block">Exam Type</label>
      <select class="form-control" style="width:200px" onchange="_exEntryType=this.value;renderExams()">
        ${examTypes.length?examTypes.map(t=>`<option value="${t}" ${t===_exEntryType?'selected':''}>${t}</option>`).join(''):'<option value="">No exams found</option>'}
      </select>
    </div>
    ${_exEntryType?`<div style="align-self:flex-end"><span class="badge badge-purple">${typeExams.length} subject(s) · Total ${maxTotal} marks</span></div>`:''}
  </div>
  ${typeExams.length&&students.length?`
  <div class="card">
    <div class="card-header" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
      <div>
        <h3 style="margin:0">📝 ${_exEntryType} — Mark Sheet</h3>
        <span class="text-xs text-muted">${students.length} students · ${typeExams.length} subjects</span>
      </div>
      <button class="btn btn-primary" onclick="saveBulkMarks()">💾 Save All Marks</button>
    </div>
    <div style="overflow-x:auto">
      <table style="min-width:500px;border-collapse:collapse;width:100%">
        <thead>
          <tr style="background:#6d28d9;color:#fff">
            <th style="padding:10px 12px;text-align:left;position:sticky;left:0;background:#6d28d9;z-index:2;min-width:36px">#</th>
            <th style="padding:10px 12px;text-align:left;position:sticky;left:36px;background:#6d28d9;z-index:2;min-width:140px">Student</th>
            ${typeExams.map(e=>`<th style="padding:10px 12px;text-align:center;min-width:110px">${e.subject}<br><span style="font-weight:400;font-size:.72rem;opacity:.85">Max: ${e.maxMarks}</span></th>`).join('')}
            <th style="padding:10px 12px;text-align:center;min-width:90px">Total<br><span style="font-weight:400;font-size:.72rem;opacity:.85">/${maxTotal}</span></th>
            <th style="padding:10px 12px;text-align:center;min-width:70px">%</th>
          </tr>
        </thead>
        <tbody>
          ${students.map((s,si)=>{
            const sMarks=typeExams.map(e=>allMarks.find(mk=>mk.examId===e.id&&mk.studentId===s.id));
            const rowTotal=sMarks.reduce((t,m)=>t+(m?m.obtained:0),0);
            const rowPct=maxTotal?Math.round(rowTotal/maxTotal*100):0;
            const g=getGrade(rowPct);
            const hasAny=sMarks.some(m=>m);
            return `<tr style="border-bottom:1px solid var(--border)">
              <td style="padding:8px 12px;font-weight:600;text-align:center;position:sticky;left:0;background:var(--bg-1);z-index:1">${s.rollNo||si+1}</td>
              <td style="padding:8px 12px;font-weight:600;position:sticky;left:36px;background:var(--bg-1);z-index:1;white-space:nowrap">
                <div style="display:flex;align-items:center;gap:8px">
                  ${s.photo?`<img src="${s.photo}" style="width:28px;height:28px;border-radius:50%;object-fit:cover">`:`<div style="width:28px;height:28px;border-radius:50%;background:#6d28d9;color:#fff;font-size:.75rem;display:flex;align-items:center;justify-content:center;flex-shrink:0">${s.name[0]}</div>`}
                  ${s.name}
                </div>
              </td>
              ${typeExams.map((e,ei)=>{
                const m=sMarks[ei];
                return `<td style="padding:6px 8px;text-align:center">
                  <input type="number" style="width:85px;padding:6px 8px;text-align:center;border:1.5px solid var(--border);border-radius:8px;background:var(--glass);color:var(--text-1);font-size:.9rem"
                    id="bm-${e.id}-${s.id}" value="${m!==undefined&&m?m.obtained:''}" min="0" max="${e.maxMarks}" placeholder="—"
                    oninput="_exUpdateRow('${s.id}',[${typeExams.map(e=>`'${e.id}'`).join(',')}],[${typeExams.map(e=>e.maxMarks).join(',')}])">
                </td>`;
              }).join('')}
              <td style="padding:8px 12px;text-align:center;font-weight:700" id="rt-${s.id}">${hasAny?rowTotal:'—'}</td>
              <td style="padding:8px 12px;text-align:center;font-weight:700;color:${g.color}" id="rp-${s.id}">${hasAny?rowPct+'%':'—'}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
    <div style="padding:14px 20px;border-top:1px solid var(--border);display:flex;align-items:center;gap:16px;flex-wrap:wrap">
      <button class="btn btn-primary" onclick="saveBulkMarks()">💾 Save All Marks</button>
      <span class="text-xs text-muted">Changes are not auto-saved — click Save when done</span>
    </div>
  </div>`
  :(!examTypes.length
    ?`<div class="empty-state"><div class="e-icon">📋</div><h3>No Exams for This Class</h3><p>Go to "Manage Exams" tab and add exam subjects first</p><button class="btn btn-primary mt-16" onclick="_exTab='list';renderExams()">📋 Manage Exams</button></div>`
    :`<div class="empty-state"><div class="e-icon">📝</div><h3>Select Exam Type</h3><p>Choose a class and exam type above to enter marks</p></div>`)}`;
}

function _exUpdateRow(studentId,examIds,maxMarks){
  let total=0,maxT=0,hasAny=false;
  examIds.forEach((eid,i)=>{
    const el=document.getElementById(`bm-${eid}-${studentId}`);
    maxT+=maxMarks[i];
    if(el&&el.value!==''){total+=Number(el.value);hasAny=true;}
  });
  const rt=document.getElementById(`rt-${studentId}`);
  const rp=document.getElementById(`rp-${studentId}`);
  if(rt) rt.textContent=hasAny?total:'—';
  if(rp){
    const pct=maxT?Math.round(total/maxT*100):0;
    const g=getGrade(pct);
    rp.textContent=hasAny?pct+'%':'—';
    rp.style.color=hasAny?g.color:'';
  }
}

function saveBulkMarks(){
  const typeExams=DB.get('exams').filter(e=>e.classId===_exEntryClass&&e.name===_exEntryType);
  const students=DB.where('students','classId',_exEntryClass);
  // Remove old marks for these exams, rebuild
  const rest=DB.get('marks').filter(m=>!typeExams.find(e=>e.id===m.examId));
  let count=0;
  typeExams.forEach(e=>{
    students.forEach(s=>{
      const el=document.getElementById(`bm-${e.id}-${s.id}`);
      if(el&&el.value!==''){rest.push({id:genId('mrk'),examId:e.id,studentId:s.id,obtained:Math.min(Number(el.value),e.maxMarks)});count++;}
    });
  });
  DB.set('marks',rest);
  toast(`✅ Saved ${count} mark entries!`,'success');
  renderExams();
}

// ══════════════════════════════════════════════════════
//  ADMIT CARDS
// ══════════════════════════════════════════════════════
// Persistent, admin-editable admit-card configuration
function _admitCfgDefaults() {
  const s = getSettings();
  return {
    schoolCode:  s.schoolCode || s.affiliationNo || '',
    examTime:    '9 AM TO 12 PM',
    roomNo:      'ROOM - 1',
    medium:      'ENGLISH',
    shift:       'Shift 1',
    dueFee:      '0',
    instructions:[
      'Carry your admit card: No student can enter the examination hall without it.',
      'Verify details: Ensure your name, roll number and other information are correct.',
      'Arrive early: Reach the exam center at least 30 minutes before the exam begins.',
      'No electronic devices: Mobile phones, calculators, and smartwatches are prohibited.',
      'Stationery: Bring your pens, pencils, and erasers.',
      'Follow the dress code, if applicable.'
    ].join('\n')
  };
}
function _admitCfg() {
  return Object.assign(_admitCfgDefaults(), DB.get('admit_config') || {});
}
function _admitCfgSave() {
  const ids = ['schoolCode','examTime','roomNo','medium','shift','dueFee','instructions'];
  const cfg = {};
  ids.forEach(id => { const el = document.getElementById('ac-' + id); if (el) cfg[id] = el.value; });
  DB.set('admit_config', cfg);
}

function _exAdmitHtml(classes) {
  const exams    = DB.get('exams');
  const settings = getSettings();
  const cfg      = _admitCfg();

  // Unique exam names for selector
  const examNames = [...new Set(exams.map(e=>e.name))].sort();

  // Auto-select first class & exam
  if (!_admitClass && classes[0]) _admitClass = classes[0].id;
  if (!_admitExam  && examNames[0]) _admitExam = examNames[0];

  // Subjects for selected class + exam
  const subjects = exams.filter(e => e.classId===_admitClass && e.name===_admitExam)
    .sort((a,b)=>(a.date||'').localeCompare(b.date||''));
  const students = DB.where('students','classId',_admitClass)
    .sort((a,b)=>String(a.rollNo||'').localeCompare(String(b.rollNo||''),undefined,{numeric:true}));

  if (!examNames.length) return `<div class="empty-state"><div class="e-icon">🎫</div><h3>No Exams Found</h3><p>Add exams in "Manage Exams" tab first, then come back to generate admit cards.</p></div>`;

  return `
  <!-- Config bar -->
  <div class="card mb-20" style="padding:20px 24px;">
    <div style="font-weight:700;font-size:1rem;margin-bottom:6px;color:var(--text1);">🎫 Admit Card Settings</div>
    <div style="font-size:.78rem;color:var(--text-3);margin-bottom:16px;">All fields below print on every card. Edit anything and it auto-saves.</div>

    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:14px;margin-bottom:16px;">
      <div class="form-group" style="margin:0;">
        <label class="form-label">Class *</label>
        <select class="form-control" onchange="_admitClass=this.value;_admitExam='';renderExams()">
          ${classes.map(c=>`<option value="${c.id}" ${c.id===_admitClass?'selected':''}>${c.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-group" style="margin:0;">
        <label class="form-label">Exam Name *</label>
        <select class="form-control" onchange="_admitExam=this.value;renderExams()">
          ${examNames.map(n=>`<option value="${n}" ${n===_admitExam?'selected':''}>${n}</option>`).join('')}
        </select>
      </div>
      <div class="form-group" style="margin:0;">
        <label class="form-label">School Code</label>
        <input class="form-control" id="ac-schoolCode" placeholder="e.g. 212456" value="${esc(cfg.schoolCode)}" oninput="_admitCfgSave()">
      </div>
      <div class="form-group" style="margin:0;">
        <label class="form-label">Exam Time</label>
        <input class="form-control" id="ac-examTime" placeholder="9 AM TO 12 PM" value="${esc(cfg.examTime)}" oninput="_admitCfgSave()">
      </div>
      <div class="form-group" style="margin:0;">
        <label class="form-label">Room No</label>
        <input class="form-control" id="ac-roomNo" placeholder="ROOM - 1" value="${esc(cfg.roomNo)}" oninput="_admitCfgSave()">
      </div>
      <div class="form-group" style="margin:0;">
        <label class="form-label">Medium</label>
        <input class="form-control" id="ac-medium" placeholder="ENGLISH" value="${esc(cfg.medium)}" oninput="_admitCfgSave()">
      </div>
      <div class="form-group" style="margin:0;">
        <label class="form-label">Shift</label>
        <input class="form-control" id="ac-shift" placeholder="Shift 1" value="${esc(cfg.shift)}" oninput="_admitCfgSave()">
      </div>
      <div class="form-group" style="margin:0;">
        <label class="form-label">Due Fee</label>
        <input class="form-control" id="ac-dueFee" placeholder="0" value="${esc(cfg.dueFee)}" oninput="_admitCfgSave()">
      </div>
    </div>

    <div class="form-group" style="margin:0 0 16px;">
      <label class="form-label">Instructions for Students <span class="text-muted">(one per line — prints as bullet list)</span></label>
      <textarea class="form-control" id="ac-instructions" rows="6" oninput="_admitCfgSave()" style="font-size:.85rem;line-height:1.6;">${esc(cfg.instructions)}</textarea>
    </div>

    <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
      <button class="btn btn-primary" onclick="_admitCfgSave();printAllAdmitCards()">
        🖨️ Print All (${students.length}) Admit Cards
      </button>
      ${subjects.length?'':`<span style="font-size:.8rem;color:#f59e0b;">⚠️ No subjects found for this class + exam combination</span>`}
    </div>
  </div>

  <!-- Preview strip -->
  ${subjects.length && students.length ? `
  <div class="card mb-16" style="padding:16px 20px;">
    <div style="font-weight:700;margin-bottom:8px;">📋 Exam Schedule — ${_admitExam} · ${DB.find('classes',_admitClass)?.name||''}</div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Date</th><th>Day</th><th>Subject</th><th>Max Marks</th></tr></thead>
        <tbody>
          ${subjects.map(e=>`<tr>
            <td>${formatDate(e.date)||'—'}</td>
            <td>${getDayName(e.date)||'—'}</td>
            <td><strong>${e.subject}</strong></td>
            <td>${e.maxMarks||100}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>

  <!-- Student list with print buttons -->
  <div class="card">
    <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
      <h3>👥 Students (${students.length})</h3>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Roll</th><th>Student Name</th><th>Father's Name</th><th>Action</th></tr></thead>
        <tbody>
          ${students.map((st,i)=>`<tr>
            <td>${st.rollNo||'—'}</td>
            <td><strong>${st.name}</strong></td>
            <td>${st.fatherName||'—'}</td>
            <td>
              <button class="btn btn-sm" style="background:rgba(245,158,11,.15);color:#f59e0b;border:1px solid rgba(245,158,11,.3);"
                onclick="_admitCfgSave();printSingleAdmitCard('${st.id}')">
                🎫 Print Card
              </button>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>` : `<div class="empty-state"><div class="e-icon">🎫</div><h3>${!subjects.length?'No subjects in this exam for the selected class':'No students in this class'}</h3><p>${!subjects.length?'Add exam subjects in "Manage Exams" tab first.':'Add students to this class first.'}</p></div>`}`;
}

// ── Admit Card Print (single) ─────────────────────────
function printSingleAdmitCard(studentId) {
  const st = DB.find('students', studentId);
  if (!st) return;
  const html = _buildAdmitCardHtml(st);
  if (!html) return;
  _printAdmitWindow([html]);
}

// ── Admit Card Print (all students in class) ──────────
function printAllAdmitCards() {
  const students = DB.where('students','classId',_admitClass)
    .sort((a,b)=>String(a.rollNo||'').localeCompare(String(b.rollNo||''),undefined,{numeric:true}));
  if (!students.length) { toast('No students in this class','warning'); return; }
  const subjects = DB.get('exams').filter(e=>e.classId===_admitClass&&e.name===_admitExam);
  if (!subjects.length) { toast('No exam subjects found. Add them in "Manage Exams" first.','warning'); return; }

  const cards = students.map(st => _buildAdmitCardHtml(st)).filter(Boolean);
  if (!cards.length) { toast('Could not generate cards','error'); return; }
  _printAdmitWindow(cards);
}

// ── Build one admit card HTML (matches standard Indian school admit card) ──
function _buildAdmitCardHtml(st) {
  const s        = getSettings();
  const cfg      = _admitCfg();
  const school   = s.schoolName    || 'School Name';
  const addr     = s.schoolAddress || '';
  const phone    = s.schoolPhone   || '';
  const logo     = s.schoolLogo    || '';
  const ay       = s.academicYear  || '';
  const cls      = DB.find('classes', st.classId);
  const subjects = DB.get('exams')
    .filter(e => e.classId === _admitClass && e.name === _admitExam)
    .sort((a,b)=>(a.date||'').localeCompare(b.date||''));

  if (!subjects.length) return null;

  // Seat number = student's position in the class roster (by roll no)
  const roster = DB.where('students','classId',_admitClass)
    .sort((a,b)=>String(a.rollNo||'').localeCompare(String(b.rollNo||''),undefined,{numeric:true}));
  const seatNo = roster.findIndex(x => x.id === st.id) + 1;

  const scholarNo = st.admissionNo || st.scholarNo || st.rollNo || '—';

  // Top info cells
  const infoCells = [
    ['Roll No',   st.rollNo || '—'],
    ['Class',     cls ? cls.name : '—'],
    ['Scholar No',scholarNo],
    ['Time',      cfg.examTime || '—'],
    ['Room No',   cfg.roomNo || '—'],
    ['Seat No',   seatNo || '—'],
    ['Medium',    cfg.medium || '—'],
    ['Due Fee',   cfg.dueFee || '0'],
  ];

  const instructions = (cfg.instructions || '').split('\n').map(l=>l.trim()).filter(Boolean);

  const subjectRows = subjects.map(e => `
    <tr>
      <td style="padding:5px 8px;border:1px solid #94a3b8;text-align:center;">${e.date?formatDate(e.date):'—'}</td>
      <td style="padding:5px 8px;border:1px solid #94a3b8;text-align:center;">${cfg.examTime||'—'}</td>
      <td style="padding:5px 8px;border:1px solid #94a3b8;text-align:center;">${getDayName(e.date)||'—'}</td>
      <td style="padding:5px 8px;border:1px solid #94a3b8;font-weight:600;">${e.subject}</td>
      <td style="padding:5px 8px;border:1px solid #94a3b8;text-align:center;">${cfg.shift||'—'}</td>
      <td style="padding:5px 8px;border:1px solid #94a3b8;width:120px;"></td>
      <td style="padding:5px 8px;border:1px solid #94a3b8;width:120px;"></td>
    </tr>`).join('');

  return `
  <div style="width:720px;margin:0 auto;border:3px solid #1e3a8a;font-family:Arial,Helvetica,sans-serif;background:#fff;color:#111;font-size:13px;position:relative;">

    <!-- Side accent bars -->
    <div style="position:absolute;left:0;top:0;bottom:0;width:8px;background:#1e3a8a;"></div>
    <div style="position:absolute;right:0;top:0;bottom:0;width:8px;background:#1e3a8a;"></div>

    <div style="padding:14px 24px;">

      <!-- ADMIT CARD pill -->
      <div style="text-align:center;margin-bottom:8px;">
        <span style="display:inline-block;background:#2196f3;color:#fff;font-size:1.5rem;font-weight:800;padding:6px 48px;border-radius:30px;letter-spacing:.5px;">Admit Card</span>
      </div>

      <!-- School code -->
      <div style="text-align:right;font-size:.8rem;font-weight:700;color:#111;margin-bottom:2px;">School Code :- ${esc(cfg.schoolCode||'—')}</div>

      <!-- School header -->
      <div style="display:flex;align-items:center;gap:16px;border-bottom:2px solid #111;padding-bottom:10px;margin-bottom:8px;">
        ${logo?`<img src="${logo}" style="width:64px;height:64px;object-fit:contain;flex-shrink:0;">`
              :`<div style="width:64px;height:64px;border-radius:6px;background:#e5e7eb;display:flex;align-items:center;justify-content:center;font-size:2rem;flex-shrink:0;">🏫</div>`}
        <div style="flex:1;text-align:center;">
          <div style="font-size:1.7rem;font-weight:900;color:#c0392b;letter-spacing:.5px;line-height:1.1;">${esc(school)}</div>
          ${addr?`<div style="font-size:.95rem;font-weight:700;color:#1f2937;margin-top:4px;">${esc(addr)}</div>`:''}
          ${phone?`<div style="font-size:.78rem;color:#374151;margin-top:1px;">📞 ${esc(phone)}</div>`:''}
        </div>
        <div style="width:64px;flex-shrink:0;"></div>
      </div>

      <!-- ADMIT CARD + Exam title -->
      <div style="text-align:center;border:1.5px solid #111;border-bottom:none;padding:5px 0;font-weight:800;font-size:.95rem;letter-spacing:.05em;">ADMIT CARD</div>
      <div style="text-align:center;border:1.5px solid #111;padding:5px 0;font-weight:800;font-size:.92rem;background:#f3f4f6;">${esc(_admitExam)} (${esc(ay||'—')})</div>

      <!-- Top info table -->
      <table style="width:100%;border-collapse:collapse;margin-top:0;font-size:12px;">
        <tr style="background:#f3f4f6;">
          ${infoCells.map(([k])=>`<th style="padding:6px 6px;border:1px solid #111;font-weight:800;text-align:center;">${k}</th>`).join('')}
        </tr>
        <tr>
          ${infoCells.map(([k,v])=>`<td style="padding:8px 6px;border:1px solid #111;text-align:center;font-weight:700;">${v}${k==='Due Fee'?'<div style="font-size:.6rem;font-weight:400;color:#6b7280;">(Current)</div>':''}</td>`).join('')}
        </tr>
      </table>

      <!-- Student details + photo -->
      <div style="display:flex;gap:16px;margin-top:12px;align-items:flex-start;">
        <div style="flex:1;font-size:13.5px;line-height:2;">
          <div><strong>Student Name :</strong> ${esc((st.name||'').toUpperCase())}</div>
          <div><strong>Father's Name :</strong> ${esc((st.fatherName||'—').toUpperCase())}</div>
          <div><strong>Mother's Name :</strong> ${esc((st.motherName||'—').toUpperCase())}</div>
        </div>
        <div style="text-align:center;flex-shrink:0;">
          ${st.photo
            ? `<img src="${st.photo}" style="width:84px;height:96px;object-fit:cover;border:1px solid #94a3b8;">`
            : `<div style="width:84px;height:96px;border:1px solid #94a3b8;background:#f3f4f6;display:flex;align-items:center;justify-content:center;font-size:2rem;color:#9ca3af;">${(st.name||'?')[0].toUpperCase()}</div>`}
          <div style="border-top:1px solid #111;margin-top:24px;padding-top:3px;font-size:.72rem;font-weight:800;">PRINCIPAL</div>
        </div>
      </div>

      <!-- Schedule table -->
      <table style="width:100%;border-collapse:collapse;margin-top:10px;font-size:12px;">
        <thead>
          <tr style="background:#e5e7eb;">
            <th style="padding:6px 8px;border:1px solid #94a3b8;">Date</th>
            <th style="padding:6px 8px;border:1px solid #94a3b8;">Time</th>
            <th style="padding:6px 8px;border:1px solid #94a3b8;">Day</th>
            <th style="padding:6px 8px;border:1px solid #94a3b8;">Subject</th>
            <th style="padding:6px 8px;border:1px solid #94a3b8;">Shift</th>
            <th style="padding:6px 8px;border:1px solid #94a3b8;">Student Signature</th>
            <th style="padding:6px 8px;border:1px solid #94a3b8;">Invigilator Signature</th>
          </tr>
        </thead>
        <tbody>${subjectRows}</tbody>
      </table>

      <!-- Instructions -->
      <div style="margin-top:12px;">
        <div style="font-weight:700;font-size:.85rem;margin-bottom:4px;">Instructions for Students: Admit Card Guidelines</div>
        <ul style="margin:0;padding-left:22px;font-size:.8rem;line-height:1.7;color:#1f2937;">
          ${instructions.map(l=>`<li>${esc(l)}</li>`).join('')}
        </ul>
      </div>

    </div>
  </div>`;
}

// ── Open print window with admit cards ────────────────
function _printAdmitWindow(cards) {
  const w = window.open('','_blank','width=900,height=700');
  if (!w) { toast('Please allow popups to print admit cards','warning'); return; }
  w.document.write(`<!DOCTYPE html><html><head>
    <title>Admit Cards — ${_admitExam}</title>
    <style>
      *{box-sizing:border-box;margin:0;padding:0;}
      body{background:#e5e7eb;padding:24px;font-family:'Segoe UI',Arial,sans-serif;}
      .card-wrap{display:flex;flex-direction:column;align-items:center;gap:28px;margin-bottom:32px;}
      @media print{
        body{background:#fff;padding:8px;}
        .card-wrap{gap:20px;}
        .no-print{display:none!important;}
        div{page-break-inside:avoid;}
      }
      .no-print{display:flex;gap:12px;justify-content:center;margin-bottom:20px;flex-wrap:wrap;}
      button{padding:10px 24px;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;border:none;}
      .btn-p{background:#7c3aed;color:#fff;}
      .btn-c{background:#e2e8f0;color:#334155;}
    </style>
  </head><body>
    <div class="no-print">
      <button class="btn-p" onclick="window.print()">🖨️ Print All Cards</button>
      <button class="btn-c" onclick="window.close()">✕ Close</button>
    </div>
    <div class="card-wrap">
      ${cards.map(c=>`<div style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.12);">${c}</div>`).join('')}
    </div>
  </body></html>`);
  w.document.close();
}

function openExamModal(){
  const classes=DB.get('classes');
  // Collect existing exam names for datalist suggestions
  const existingNames=[...new Set(DB.get('exams').map(e=>e.name))];
  buildModal('modal-exam','Add Exam Subject',`
    <div class="alert" style="background:rgba(124,58,237,.1);border:1px solid rgba(124,58,237,.3);border-radius:10px;padding:10px 14px;margin-bottom:14px;font-size:.85rem">
      💡 Each exam subject is added separately. Use the <strong>same Exam Name</strong> (e.g. "Mid Term") for all subjects of the same exam so they group together.
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Exam Name * <span class="text-muted">(e.g. Mid Term)</span></label>
        <input class="form-control" id="ex-name" placeholder="Mid Term / Unit Test 1 / Annual" list="ex-name-list">
        <datalist id="ex-name-list">${existingNames.map(n=>`<option value="${n}">`).join('')}</datalist>
      </div>
      <div class="form-group"><label class="form-label">Class *</label>
        <select class="form-control" id="ex-class">
          <option value="">Select Class</option>
          ${classes.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Subject *</label>
        <input class="form-control" id="ex-subject" placeholder="e.g. Mathematics"></div>
      <div class="form-group"><label class="form-label">Max Marks</label>
        <input class="form-control" type="number" id="ex-max" value="100" min="1"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Exam Date</label>
        <input class="form-control" type="date" id="ex-date" value="${today()}"></div>
      <div class="form-group"><label class="form-label">Type</label>
        <select class="form-control" id="ex-type">
          ${['unit_test','weekly_test','mid_term','final_exam','assignment'].map(t=>`<option value="${t}">${t.replace(/_/g,' ')}</option>`).join('')}
        </select>
      </div>
    </div>`,saveExam,'modal-lg');
}
function saveExam(){
  const name=val('ex-name'),classId=val('ex-class'),subject=val('ex-subject');
  const maxMarks=Number(document.getElementById('ex-max').value)||100;
  const date=val('ex-date'),type=val('ex-type');
  if(!name||!classId||!subject){toast('Fill required fields','warning');return;}
  // Prevent duplicate subject in same exam+class
  const dup=DB.get('exams').find(e=>e.classId===classId&&e.name===name&&e.subject.toLowerCase()===subject.toLowerCase());
  if(dup){toast('This subject already exists in that exam!','warning');return;}
  DB.push('exams',{id:genId('exam'),name,classId,type,subject,maxMarks,date});
  toast(`✅ ${subject} added to "${name}"!`,'success'); closeAllModals(); renderExams();
}
function deleteExam(id){if(!confirmAction('Delete this exam subject and all its marks?'))return;const e=DB.find('exams',id);if(e){DB.set('marks',DB.get('marks').filter(m=>m.examId!==id));}DB.delete('exams',id);renderExams();}

// kept for backward compatibility (teacher.js may call this)
function openMarksModal(examId){_exTab='entry';const e=DB.find('exams',examId);if(e){_exEntryClass=e.classId;_exEntryType=e.name;}renderExams();}
function saveMarks(){}  // no-op, replaced by saveBulkMarks

// ══════════════════════════════════════════════════════
//  CURRICULUM
// ══════════════════════════════════════════════════════
function renderCurriculum() {
  const cur=DB.get('curriculum'),classes=DB.get('classes');
  const libClasses = ['NUR','KG','1','2','3','4','5','6','7','8','9','10'];
  document.getElementById('section-curriculum').innerHTML = `
  <div class="page-header">
    <div><h2>Curriculum & Syllabus</h2></div>
    <button class="btn btn-primary" onclick="openCurModal()">➕ Add Syllabus</button>
  </div>

  <!-- ── Quick Add from Library ──────────────────── -->
  <div class="card mb-16" style="border:1.5px solid rgba(124,58,237,.3);background:rgba(124,58,237,.05);">
    <div class="card-header" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
      <div>
        <h3>⚡ Quick Add from Predefined Library</h3>
        <span class="text-xs text-muted">Pick class + subject → one click adds all chapters to your curriculum</span>
      </div>
    </div>
    <div class="card-body">
      <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end;">
        <div class="form-group" style="margin:0;min-width:160px">
          <label class="form-label">Class</label>
          <select class="form-control" id="cur-lib-class" onchange="curLibLoadSubjects()" style="padding:8px 12px;">
            <option value="">Select Class</option>
            ${libClasses.map(c=>`<option value="${c}">${c==='NUR'?'Nursery':c==='KG'?'Kindergarten':'Class '+c}</option>`).join('')}
          </select>
        </div>
        <div class="form-group" style="margin:0;min-width:180px">
          <label class="form-label">Subject</label>
          <select class="form-control" id="cur-lib-subject" style="padding:8px 12px;">
            <option value="">Select Subject</option>
          </select>
        </div>
        <div class="form-group" style="margin:0;min-width:180px">
          <label class="form-label">Month / Session</label>
          <input class="form-control" id="cur-lib-month" placeholder="e.g. April 2025 – March 2026" style="padding:8px 12px;">
        </div>
        <div style="display:flex;gap:8px;margin-bottom:1px;">
          <button class="btn btn-primary" onclick="curLibAddAll()">⚡ Add All Chapters</button>
          <button class="btn btn-secondary" onclick="curLibPreview()" style="white-space:nowrap">👁️ Preview</button>
        </div>
      </div>
      <div id="cur-lib-preview" style="margin-top:14px;"></div>
    </div>
  </div>

  <!-- ── My Curriculum Table ──────────────────────── -->
  <div class="card"><div class="table-wrap"><table>
    <thead><tr><th>Class</th><th>Subject</th><th>Month</th><th>Topics</th><th>Status</th><th>Actions</th></tr></thead>
    <tbody>
      ${cur.map(c=>{
        const cls=classes.find(cl=>cl.id===c.classId);
        return `<tr>
          <td>${cls?cls.name:c.classLabel||'—'}</td>
          <td><span class="badge badge-purple">${c.subject}</span></td>
          <td>${c.month}</td><td>${c.topics}</td>
          <td><select class="form-control" style="width:auto;font-size:.8rem" onchange="updateCurStatus('${c.id}',this.value)">
            ${['pending','ongoing','completed'].map(st=>`<option value="${st}" ${st===c.status?'selected':''}>${st}</option>`).join('')}
          </select></td>
          <td><button class="btn btn-sm btn-danger" onclick="deleteCur('${c.id}')">🗑️</button></td>
        </tr>`;
      }).join('')||'<tr><td colspan="6" class="text-center text-muted" style="padding:40px">No curriculum added yet. Use Quick Add above!</td></tr>'}
    </tbody>
  </table></div></div>`;
}

function curLibLoadSubjects() {
  const cn = document.getElementById('cur-lib-class').value;
  const el = document.getElementById('cur-lib-subject');
  document.getElementById('cur-lib-preview').innerHTML = '';
  if (!cn || typeof getCurriculumSubjects !== 'function') { el.innerHTML='<option value="">Select Subject</option>'; return; }
  const subs = getCurriculumSubjects(cn);
  el.innerHTML = '<option value="">Select Subject</option>' + subs.map(s=>`<option value="${s}">${s}</option>`).join('');
}

function curLibPreview() {
  const cn  = document.getElementById('cur-lib-class').value;
  const sub = document.getElementById('cur-lib-subject').value;
  const el  = document.getElementById('cur-lib-preview');
  if (!cn || !sub) { toast('Select class and subject first','warning'); return; }
  if (typeof getCurriculumChapters !== 'function') { el.innerHTML='<p class="text-muted">Curriculum library not loaded.</p>'; return; }
  const chs = getCurriculumChapters(cn, sub);
  if (!chs.length) { el.innerHTML='<p class="text-muted">No chapters found.</p>'; return; }
  el.innerHTML = `<div style="margin-top:4px;font-size:.82rem;color:var(--text2);margin-bottom:8px;">${chs.length} chapters will be added:</div>
    <div style="display:flex;flex-wrap:wrap;gap:6px;">
      ${chs.map(ch=>`<span style="padding:4px 10px;border-radius:20px;background:rgba(124,58,237,.12);color:#a78bfa;border:1px solid rgba(124,58,237,.25);font-size:.78rem;">📖 ${ch.chapter}</span>`).join('')}
    </div>`;
}

function curLibAddAll() {
  const cn    = document.getElementById('cur-lib-class').value;
  const sub   = document.getElementById('cur-lib-subject').value;
  const month = document.getElementById('cur-lib-month').value.trim() || 'Annual';
  if (!cn || !sub) { toast('Select class and subject first','warning'); return; }
  if (typeof getCurriculumChapters !== 'function') { toast('Curriculum library not loaded','warning'); return; }
  const chs = getCurriculumChapters(cn, sub);
  if (!chs.length) { toast('No chapters found for this class/subject','warning'); return; }
  const clsLabel = cn==='NUR'?'Nursery':cn==='KG'?'Kindergarten':'Class '+cn;
  let added = 0;
  chs.forEach(ch => {
    const topics = (ch.topics||[]).join(', ') || ch.chapter;
    DB.push('curriculum', {
      id:       genId('cur'),
      classId:  '',             // no specific class DB entry for NUR/KG library classes
      classLabel: clsLabel,
      subject:  sub,
      month:    month,
      topics:   `${ch.chapter}: ${topics}`,
      status:   'pending'
    });
    added++;
  });
  toast(`✅ ${added} chapters added to curriculum!`, 'success');
  renderCurriculum();
}
function openCurModal() {
  const classes=DB.get('classes');
  buildModal('modal-cur','Add Curriculum',`
    <div class="form-row">
      <div class="form-group"><label class="form-label">Class *</label>
        <select class="form-control" id="cur-class">
          <option value="">Select</option>
          ${classes.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}
        </select></div>
      <div class="form-group"><label class="form-label">Subject *</label>
        <input class="form-control" id="cur-subject" placeholder="Subject"></div>
    </div>
    <div class="form-group"><label class="form-label">Month *</label>
      <input class="form-control" id="cur-month" placeholder="e.g. April 2025"></div>
    <div class="form-group"><label class="form-label">Topics *</label>
      <textarea class="form-control" id="cur-topics" rows="3" placeholder="List topics…"></textarea></div>`,
    saveCur);
}
function saveCur(){
  const classId=val('cur-class'),subject=val('cur-subject'),month=val('cur-month');
  const topics=document.getElementById('cur-topics').value.trim();
  if(!classId||!subject||!month||!topics){toast('Fill all fields','warning');return}
  DB.push('curriculum',{id:genId('cur'),classId,subject,month,topics,status:'pending'});
  toast('Curriculum added!','success'); closeAllModals(); renderCurriculum();
}
function updateCurStatus(id,status){DB.update('curriculum',id,{status});toast('Status updated','success')}
function deleteCur(id){if(!confirmAction('Delete?'))return;DB.delete('curriculum',id);renderCurriculum()}

// ══════════════════════════════════════════════════════
//  STUDY MATERIALS
// ══════════════════════════════════════════════════════
function renderMaterials() {
  const mats=DB.get('materials'),classes=DB.get('classes');
  document.getElementById('section-materials').innerHTML = `
  <div class="page-header">
    <div><h2>Study Material</h2></div>
    <button class="btn btn-primary" onclick="openMatModal()">➕ Upload Material</button>
  </div>

  <!-- ── Curriculum Library ─────────────────────── -->
  <div class="card mb-24">
    <div class="card-header" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
      <div>
        <h3>📚 Curriculum Library</h3>
        <span class="text-xs text-muted">Pre-defined chapters: NUR, KG, Class 1–10 · Short, Long & MCQ questions per chapter</span>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <select class="form-control" id="lib-class" onchange="loadLibSubjects()" style="width:140px;padding:8px 12px;">
          <option value="">Select Class</option>
          ${['NUR','KG','1','2','3','4','5','6','7','8','9','10'].map(c=>`<option value="${c}">${c==='NUR'?'Nursery':c==='KG'?'Kindergarten':'Class '+c}</option>`).join('')}
        </select>
        <select class="form-control" id="lib-subject" onchange="loadLibChapters()" style="width:160px;padding:8px 12px;">
          <option value="">Select Subject</option>
        </select>
      </div>
    </div>
    <div class="card-body" id="lib-content">
      <div style="text-align:center;padding:32px;color:rgba(255,255,255,.3);">
        Select a class and subject to browse chapters and Q&A
      </div>
    </div>
  </div>

  <!-- ── Uploaded Materials ─────────────────────── -->
  <div class="card">
    <div class="card-header"><h3>📂 Uploaded Materials</h3></div>
    <div class="card-body" style="padding:16px;">
  ${mats.length?mats.slice().reverse().map(m=>{
    const cls=classes.find(c=>c.id===m.classId);
    const ext=(m.fileType||'').toLowerCase();
    const icon={'pdf':'📄','doc':'📝','docx':'📝','jpg':'🖼️','png':'🖼️','zip':'🗜️','ppt':'📊','pptx':'📊'}[ext]||'📁';
    const mc=ext==='pdf'?'mat-pdf':['doc','docx'].includes(ext)?'mat-doc':['jpg','png'].includes(ext)?'mat-img':'mat-other';
    return `<div class="material-item">
      <div class="material-icon ${mc}">${icon}</div>
      <div class="material-info">
        <div class="material-name">${m.title}</div>
        <div class="material-meta">${cls?cls.name:'—'} · ${m.subject} · ${m.size||''} · ${formatDate(m.uploadedOn)}</div>
        <div class="material-meta">👤 ${m.uploadedBy}</div>
      </div>
      <div class="d-flex gap-8">
        ${m.url?`<a href="${m.url}" download class="btn btn-sm btn-cyan">⬇️ Download</a>`:'<span class="text-muted text-xs">No file</span>'}
        <button class="btn btn-sm btn-danger" onclick="deleteMat('${m.id}')">🗑️</button>
      </div>
    </div>`;
  }).join(''):'<div class="empty-state"><div class="e-icon">📂</div><h3>No materials uploaded</h3></div>'}
    </div>
  </div>`;
}

function loadLibSubjects() {
  const classNum = document.getElementById('lib-class').value;
  const subSel = document.getElementById('lib-subject');
  document.getElementById('lib-content').innerHTML = '<div style="text-align:center;padding:32px;color:rgba(255,255,255,.3);">Select a subject to browse chapters</div>';
  if (!classNum || typeof getCurriculumSubjects !== 'function') { subSel.innerHTML='<option value="">Select Subject</option>'; return; }
  const subjects = getCurriculumSubjects(classNum);
  subSel.innerHTML = '<option value="">Select Subject</option>' + subjects.map(s=>`<option value="${s}">${s}</option>`).join('');
}

function loadLibChapters() {
  const classNum = document.getElementById('lib-class').value;
  const subject  = document.getElementById('lib-subject').value;
  const el       = document.getElementById('lib-content');
  if (!classNum || !subject) { el.innerHTML='<div style="text-align:center;padding:32px;color:rgba(255,255,255,.3);">Select class and subject</div>'; return; }
  if (typeof getCurriculumChapters !== 'function') { el.innerHTML='<p class="text-muted">Curriculum data not loaded.</p>'; return; }
  const chapters = getCurriculumChapters(classNum, subject);
  if (!chapters.length) { el.innerHTML='<div style="text-align:center;padding:32px;color:rgba(255,255,255,.3);">No chapters found for this selection.</div>'; return; }

  el.innerHTML = chapters.map((ch, ci) => {
    // Support both old format {qa:[]} and new format {short:[],long:[],mcq:[],qa:[]}
    const shortQA = ch.short || ch.qa || [];
    const longQA  = ch.long  || [];
    const mcqQA   = ch.mcq   || [];
    const totalQ  = shortQA.length + longQA.length + mcqQA.length;
    return `
    <div style="margin-bottom:16px;border:1px solid rgba(255,255,255,.08);border-radius:12px;overflow:hidden;">
      <div onclick="toggleLibChapter('lib-ch-${ci}')" class="lib-chapter-header">
        <div>
          <span style="font-weight:700;font-size:.95rem;">📖 ${ch.chapter}</span>
          <div style="font-size:.73rem;color:rgba(255,255,255,.4);margin-top:3px;">${(ch.topics||[]).join(' · ')}</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <span class="badge" style="background:rgba(124,58,237,.2);color:#a78bfa;font-size:.7rem">${totalQ} Q</span>
          <span style="font-size:1rem;transition:.2s;" id="lib-ch-arrow-${ci}">▼</span>
        </div>
      </div>
      <div id="lib-ch-${ci}" style="display:none;">
        <div class="lib-chapter-body">
          <!-- Q&A Tabs -->
          <div class="qa-tab-bar">
            ${shortQA.length?`<button class="qa-tab short" onclick="libShowQATab(${ci},'short',this)">📝 Short (${shortQA.length})</button>`:''}
            ${longQA.length ?`<button class="qa-tab long"  onclick="libShowQATab(${ci},'long',this)">📄 Long (${longQA.length})</button>`:''}
            ${mcqQA.length  ?`<button class="qa-tab mcq"   onclick="libShowQATab(${ci},'mcq',this)">❓ MCQ (${mcqQA.length})</button>`:''}
          </div>
          <!-- Short Q&A -->
          ${shortQA.length?`<div id="lib-qa-${ci}-short">
            ${shortQA.map((item,qi)=>`
              <div class="qa-item short">
                <div class="qa-q">Q${qi+1}. ${item.q}</div>
                <div class="qa-a">✅ ${item.a}</div>
              </div>`).join('')}
            <button class="btn btn-sm" style="background:rgba(6,182,212,.15);color:#06b6d4;border:1px solid rgba(6,182,212,.3);margin-top:8px;"
              onclick="addChapterToQBank('${classNum}','${subject}','${ci}','short')">➕ Add Short Q to Bank</button>
          </div>`:''}
          <!-- Long Q&A -->
          ${longQA.length?`<div id="lib-qa-${ci}-long" style="display:none">
            ${longQA.map((item,qi)=>`
              <div class="qa-item long">
                <div class="qa-q">Q${qi+1}. ${item.q}</div>
                <div class="qa-a">✅ ${item.a}</div>
              </div>`).join('')}
            <button class="btn btn-sm" style="background:rgba(16,185,129,.15);color:var(--green);border:1px solid rgba(16,185,129,.3);margin-top:8px;"
              onclick="addChapterToQBank('${classNum}','${subject}','${ci}','long')">➕ Add Long Q to Bank</button>
          </div>`:''}
          <!-- MCQ -->
          ${mcqQA.length?`<div id="lib-qa-${ci}-mcq" style="display:none">
            ${mcqQA.map((item,qi)=>`
              <div class="qa-item mcq">
                <div class="qa-q">Q${qi+1}. ${item.q}</div>
                <div class="qa-opts">
                  ${(item.options||[]).map((o,oi)=>`<div class="qa-opt ${item.answer===String.fromCharCode(65+oi)?'correct':''}">${String.fromCharCode(65+oi)}) ${o}</div>`).join('')}
                </div>
                <div class="qa-a" style="margin-top:6px;">✅ Correct: ${item.answer||'—'}</div>
              </div>`).join('')}
            <button class="btn btn-sm" style="background:rgba(245,158,11,.15);color:var(--yellow);border:1px solid rgba(245,158,11,.3);margin-top:8px;"
              onclick="addChapterToQBank('${classNum}','${subject}','${ci}','mcq')">➕ Add MCQ to Bank</button>
          </div>`:''}
          <!-- Add All -->
          <div style="margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,.06);">
            <button class="btn btn-sm btn-primary" onclick="addChapterToQBank('${classNum}','${subject}','${ci}','all')">⚡ Add All to Question Bank</button>
          </div>
        </div>
      </div>
    </div>`;
  }).join('');

  // Auto-show first tab
  setTimeout(()=>{
    chapters.forEach((ch,ci)=>{
      const firstTab = document.querySelector(`#lib-ch-${ci} .qa-tab`);
      if (firstTab) firstTab.click();
    });
  }, 50);
}

function libShowQATab(ci, type, btn) {
  // hide all tab panes for this chapter
  ['short','long','mcq'].forEach(t=>{
    const el = document.getElementById(`lib-qa-${ci}-${t}`);
    if (el) el.style.display = 'none';
  });
  // show clicked
  const el = document.getElementById(`lib-qa-${ci}-${type}`);
  if (el) el.style.display = '';
  // update tab active state
  const bar = btn.closest('.qa-tab-bar');
  if (bar) bar.querySelectorAll('.qa-tab').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
}

function toggleLibChapter(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const arrow = document.getElementById(id.replace('lib-ch-','lib-ch-arrow-'));
  const isOpen = el.style.display !== 'none';
  el.style.display = isOpen ? 'none' : 'block';
  if (arrow) arrow.textContent = isOpen ? '▼' : '▲';
}

function addChapterToQBank(classNum, subject, chapterIdx, qtype='all') {
  if (typeof getCurriculumChapters !== 'function') { toast('Curriculum data unavailable','warning'); return; }
  const chapters = getCurriculumChapters(classNum, subject);
  const ch = chapters[parseInt(chapterIdx)];
  if (!ch) return;
  let bank = DB.get('question_bank');
  let added = 0;

  function _addItems(items, type, marksEach) {
    (items||[]).forEach(item => {
      if (!bank.find(q => q.question === item.q)) {
        const newQ = {
          id: genId('qb'), subject,
          grade: classNum,
          chapter: ch.chapter, type, marks: marksEach,
          question: item.q, answer: item.a || (item.options ? String.fromCharCode(64 + (item.options.indexOf(item.answer)+1)) : ''),
          options: type==='mcq' ? (item.options||[]) : [],
          addedOn: today()
        };
        bank.push(newQ);
        added++;
      }
    });
  }

  if (qtype === 'short' || qtype === 'all') _addItems(ch.short || ch.qa || [], 'short', 2);
  if (qtype === 'long'  || qtype === 'all') _addItems(ch.long  || [], 'long', 5);
  if (qtype === 'mcq'   || qtype === 'all') {
    (ch.mcq||[]).forEach(item => {
      if (!bank.find(q => q.question === item.q)) {
        bank.push({ id:genId('qb'), subject, grade:classNum, chapter:ch.chapter,
          type:'mcq', marks:1, question:item.q, answer:item.answer||'A',
          options:item.options||[], addedOn:today() });
        added++;
      }
    });
  }

  DB.set('question_bank', bank);
  toast(`Added ${added} questions to Question Bank!`, added > 0 ? 'success' : 'info');
}
function openMatModal(){
  const classes=DB.get('classes');
  buildModal('modal-mat','Upload Study Material',`
    <div class="form-row">
      <div class="form-group"><label class="form-label">Class *</label>
        <select class="form-control" id="mat-class">
          <option value="">Select</option>
          ${classes.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}
        </select></div>
      <div class="form-group"><label class="form-label">Subject *</label>
        <input class="form-control" id="mat-subject" placeholder="Subject"></div>
    </div>
    <div class="form-group"><label class="form-label">Title *</label>
      <input class="form-control" id="mat-title" placeholder="Material title"></div>
    <div class="form-group"><label class="form-label">Upload File</label>
      <input type="file" class="form-control" id="mat-file" accept=".pdf,.doc,.docx,.jpg,.png,.zip,.ppt,.pptx"></div>`,
    saveMat);
}
async function saveMat(){
  const classId=val('mat-class'),subject=val('mat-subject'),title=val('mat-title');
  if(!classId||!subject||!title){toast('Fill required fields','warning');return}
  const fi=document.getElementById('mat-file');
  let url='',fileType='',size='';
  if(fi.files[0]){const f=fi.files[0];fileType=f.name.split('.').pop();size=(f.size/1048576).toFixed(2)+' MB';try{url=await fileToBase64(f)}catch(e){}}
  DB.push('materials',{id:genId('mat'),classId,subject,title,fileType,size,url,uploadedBy:CU.name,uploadedOn:today()});
  toast('Material uploaded!','success'); closeAllModals(); renderMaterials();
}
function deleteMat(id){if(!confirmAction('Delete?'))return;DB.delete('materials',id);renderMaterials()}

// ══════════════════════════════════════════════════════
//  QUESTION PAPERS  — with Create Paper + Drafts tabs
// ══════════════════════════════════════════════════════
let _qpTab = 'list'; // 'list' | 'create' | 'drafts'

function renderQPapers() {
  const qp       = DB.get('question_papers');
  const drafts   = DB.get('paper_drafts') || [];
  const classes  = DB.get('classes');
  const uploaded = qp.filter(q=>!q.isGenerated);
  const generated= qp.filter(q=>q.isGenerated);
  const el = document.getElementById('section-qpapers');
  if (!el) return;

  const tabBar =
    '<div class="att-tab-bar mb-16">'+
    [{key:'list',label:'📄 All Papers ('+qp.length+')'},{key:'create',label:'✏️ Create Paper'},{key:'drafts',label:'💾 Drafts ('+drafts.length+')'}]
    .map(function(t){ return '<button class="att-tab '+(_qpTab===t.key?'active':'')+'" onclick="_qpTab=\''+t.key+'\';renderQPapers()">'+t.label+'</button>'; }).join('')+
    '</div>';

  const header =
    '<div class="page-header" style="margin-bottom:16px">'+
      '<div><h2>Question Papers</h2><div class="breadcrumb">Create, upload &amp; manage question papers</div></div>'+
      '<div class="d-flex gap-8" style="flex-wrap:wrap">'+
        '<button class="btn btn-secondary" onclick="_qpTab=\'create\';renderQPapers()">✏️ Create Paper</button>'+
        '<button class="btn btn-primary" onclick="openQPModal()">➕ Upload Paper</button>'+
      '</div>'+
    '</div>';

  if (_qpTab === 'create') {
    // Set full HTML with placeholder, then fill placeholder via _pcRenderMain
    el.innerHTML = header + tabBar + '<div id="qp-creator-wrap"></div>';
    if (typeof _pcRenderMain === 'function') _pcRenderMain('qp-creator-wrap', true);
    else document.getElementById('qp-creator-wrap').innerHTML='<div style="padding:40px;text-align:center;color:var(--text-3)">⏳ Paper Creator loading…</div>';
    return;
  }

  if (_qpTab === 'drafts') {
    el.innerHTML = header + tabBar + _qpDraftsHtml(DB.get('paper_drafts')||[]);
    return;
  }

  // 'list' tab — set complete HTML in one shot
  el.innerHTML = header + tabBar +
    // Generated papers
    (generated.length?
      '<div class="card mb-20">'+
        '<div class="card-header" style="display:flex;align-items:center;justify-content:space-between">'+
          '<h3>⚡ Generated Papers <span style="font-size:12px;font-weight:400;color:var(--text-3)">(from Paper Generator)</span></h3>'+
          '<span class="badge badge-purple">'+generated.length+' papers</span>'+
        '</div>'+
        '<div class="card-body" style="padding:12px;display:flex;flex-direction:column;gap:10px">'+
          generated.slice().reverse().map(function(q){
            const cls=classes.find(c=>c.id===q.classId);
            return '<div class="material-item" style="background:rgba(124,58,237,.04);border:1px solid rgba(124,58,237,.15);border-radius:12px;padding:14px 16px">'+
              '<div class="material-icon" style="background:linear-gradient(135deg,#7c3aed,#06b6d4);border-radius:12px;width:44px;height:44px;display:flex;align-items:center;justify-content:center;font-size:1.4rem">⚡</div>'+
              '<div class="material-info">'+
                '<div class="material-name">'+q.title+'</div>'+
                '<div class="material-meta">'+(cls?cls.name:'—')+' · '+(q.subject||'—')+' · '+(q.selCount||0)+' questions · '+formatDate(q.uploadedOn)+'</div>'+
                '<div class="material-meta">👤 '+q.uploadedBy+' &nbsp;·&nbsp; Template: '+(q.template||'classic')+'</div>'+
              '</div>'+
              '<div class="d-flex gap-8">'+
                '<button class="btn btn-sm btn-cyan" onclick="viewGeneratedQP(\''+q.id+'\')">👁️ View / Print</button>'+
                '<button class="btn btn-sm btn-danger" onclick="deleteQP(\''+q.id+'\')">🗑️</button>'+
              '</div>'+
            '</div>';
          }).join('')+
        '</div>'+
      '</div>':''
    )+
    // Uploaded papers
    '<div class="card">'+
      '<div class="card-header" style="display:flex;align-items:center;justify-content:space-between">'+
        '<h3>📄 Uploaded Papers</h3>'+
        '<span class="badge badge-cyan">'+uploaded.length+' papers</span>'+
      '</div>'+
      '<div class="card-body" style="padding:12px">'+
        (uploaded.length ? uploaded.slice().reverse().map(function(q){
          const cls=classes.find(c=>c.id===q.classId);
          return '<div class="material-item">'+
            '<div class="material-icon mat-pdf">📄</div>'+
            '<div class="material-info">'+
              '<div class="material-name">'+q.title+'</div>'+
              '<div class="material-meta">'+(cls?cls.name:'—')+' · '+q.subject+' · '+formatDate(q.uploadedOn)+'</div>'+
              '<div class="material-meta">👤 '+q.uploadedBy+'</div>'+
            '</div>'+
            '<div class="d-flex gap-8">'+
              (q.url?'<a href="'+q.url+'" download class="btn btn-sm btn-cyan">⬇️ Download</a>':'<span class="text-muted text-xs">No file</span>')+
              '<button class="btn btn-sm btn-danger" onclick="deleteQP(\''+q.id+'\')">🗑️</button>'+
            '</div>'+
          '</div>';
        }).join('') :
        '<div class="empty-state" style="margin:20px 0"><div class="e-icon">📄</div><h3>No uploaded papers yet</h3></div>')+
      '</div>'+
    '</div>'+
    '</div>';
}

// Drafts list HTML (shared between qpapers and papergenerator)
function _qpDraftsHtml(drafts) {
  if (!drafts || !drafts.length) return (
    '<div style="text-align:center;padding:60px 20px;color:var(--text-3)">'+
      '<div style="font-size:3rem;margin-bottom:12px">💾</div>'+
      '<div style="font-size:15px;font-weight:600;color:var(--text);margin-bottom:8px">No Saved Drafts</div>'+
      '<div style="font-size:13px;margin-bottom:20px">While creating a paper in the "✏️ Create Paper" tab, press the "💾 Save Draft" button</div>'+
      '<button class="btn btn-primary" onclick="_qpTab=\'create\';renderQPapers()">✏️ Start Creating a Paper</button>'+
    '</div>'
  );
  return (
    '<div style="font-size:13px;color:var(--text-2);margin-bottom:14px">'+drafts.length+' saved draft'+(drafts.length!==1?'s':'')+' — click Continue to resume editing</div>'+
    '<div style="display:flex;flex-direction:column;gap:10px">'+
    drafts.slice().reverse().map(function(d){
      return (
        '<div style="background:var(--glass);border:1.5px solid var(--border);border-radius:12px;padding:14px 18px;display:flex;align-items:center;gap:14px;flex-wrap:wrap">'+
          '<div style="font-size:2rem;flex-shrink:0">📄</div>'+
          '<div style="flex:1;min-width:0">'+
            '<div style="font-weight:700;font-size:14px">'+d.name+'</div>'+
            '<div style="font-size:12px;color:var(--text-3);margin-top:2px">'+
              (d.subject||'—')+' · '+(d.grade||'—')+' · '+(d.exam||'—')+
              ' &nbsp;·&nbsp; By '+d.savedBy+
              ' &nbsp;·&nbsp; '+(d.savedAt?new Date(d.savedAt).toLocaleDateString([],{day:'numeric',month:'short',year:'numeric'}):'')
            +'</div>'+
          '</div>'+
          '<div style="display:flex;gap:6px;flex-wrap:wrap;flex-shrink:0">'+
            '<button class="btn btn-sm btn-primary" onclick="_qpTab=\'create\';renderQPapers();setTimeout(function(){_pcLoadDraft(\''+d.id+'\',\'qp-creator-wrap\',true);},100)">▶️ Continue Editing</button>'+
            '<button class="btn btn-sm btn-danger" onclick="_pcDeleteDraft(\''+d.id+'\',\'section-qpapers\');_qpTab=\'drafts\';renderQPapers()">🗑️</button>'+
          '</div>'+
        '</div>'
      );
    }).join('')+
    '</div>'
  );
}

function viewGeneratedQP(id) {
  const qp = DB.find('question_papers', id);
  if (!qp || !qp.generatedHtml) { toast('Paper not found','warning'); return; }
  printHtml(qp.generatedHtml, qp.title, `body{margin:20px 30px;} @page{margin:15mm 20mm;}`);
}
function openQPModal(){
  const classes=DB.get('classes');
  buildModal('modal-qp','Upload Question Paper',`
    <div class="form-row">
      <div class="form-group"><label class="form-label">Class *</label>
        <select class="form-control" id="qp-class">
          <option value="">Select</option>
          ${classes.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}
        </select></div>
      <div class="form-group"><label class="form-label">Subject *</label>
        <input class="form-control" id="qp-subject" placeholder="Subject"></div>
    </div>
    <div class="form-group"><label class="form-label">Title *</label>
      <input class="form-control" id="qp-title" placeholder="Paper title"></div>
    <div class="form-group"><label class="form-label">Upload File</label>
      <input type="file" class="form-control" id="qp-file"></div>`,
    saveQP);
}
async function saveQP(){
  const classId=val('qp-class'),subject=val('qp-subject'),title=val('qp-title');
  if(!classId||!subject||!title){toast('Fill required fields','warning');return}
  const fi=document.getElementById('qp-file');
  let url='';
  if(fi.files[0]){try{url=await fileToBase64(fi.files[0])}catch(e){}}
  DB.push('question_papers',{id:genId('qp'),classId,subject,title,url,uploadedBy:CU.name,uploadedOn:today()});
  toast('Question paper uploaded!','success'); closeAllModals(); renderQPapers();
}
function deleteQP(id){if(!confirmAction('Delete?'))return;DB.delete('question_papers',id);renderQPapers()}



// ══════════════════════════════════════════════════════
//  FEES — Simple Monthly Fee Management
// ══════════════════════════════════════════════════════
let _feeState = { classId: null, month: '' };

function renderFees() {
  if (!_feeState.month) _feeState.month = today().slice(0,7);
  if (_feeState.classId) { _renderFeeClass(_feeState.classId); return; }
  _renderFeeClassList();
}

// ── Pending Payment Approvals block (shown at top of fee section) ─────────
function _feeApprovalsHtml() {
  const proofs = (DB.get('fee_payment_proofs')||[]).filter(p=>p.status==='pending');
  if (!proofs.length) return '';
  const cur = (getSettings().currency)||'₹';
  const rows = proofs.map(p=>{
    const stu = DB.find('students', p.studentId);
    const fee = (DB.get('fees')||[]).find(f=>f.id===p.feeId);
    const cls = stu ? DB.find('classes', stu.classId) : null;
    const amt = fee ? Number(fee.amount||0) : Number(p.amount||0);
    return `<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;
              padding:14px;background:rgba(245,158,11,.06);border:1.5px solid rgba(245,158,11,.25);
              border-radius:12px;margin-bottom:8px;">
      <div>
        <div style="font-weight:700;color:#fff;font-size:14px;">👤 ${stu?.name||p.studentName||'Student'}</div>
        <div style="font-size:11px;color:rgba(255,255,255,.4);margin-top:2px;">
          ${cls?cls.name+' · ':''}<strong style="color:rgba(255,255,255,.55)">${fee?.feeType||p.feeType||'Fee'}</strong>
          · Submitted: ${(p.submittedAt||'').slice(0,10)||today()}
          ${p.txnId?`<br>🔢 TXN: <span style="color:#f59e0b">${p.txnId}</span>`:''}
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
        ${amt>0?`<span style="font-size:18px;font-weight:800;color:#f59e0b;">${cur}${amt.toLocaleString()}</span>`:''}
        <button onclick="approvePaymentProof('${p.id}')"
          style="background:linear-gradient(135deg,#10b981,#059669);color:#fff;border:none;
                 border-radius:9px;padding:9px 18px;cursor:pointer;font-weight:800;font-size:13px;">
          ✅ Approve</button>
        <button onclick="rejectPaymentProof('${p.id}')"
          style="background:rgba(239,68,68,.1);color:#ef4444;border:1px solid rgba(239,68,68,.25);
                 border-radius:9px;padding:9px 13px;cursor:pointer;font-weight:700;font-size:12px;">
          ❌ Reject</button>
      </div>
    </div>`;
  }).join('');
  return `<div style="background:rgba(245,158,11,.08);border:1.5px solid rgba(245,158,11,.3);
            border-radius:14px;padding:16px;margin-bottom:20px;">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
      <span style="font-size:20px;">⏳</span>
      <div>
        <div style="font-weight:800;color:#f59e0b;font-size:15px;">Payment Approvals Pending (${proofs.length})</div>
        <div style="font-size:11px;color:rgba(255,255,255,.4);">Students have submitted UPI payment proof — verify &amp; approve</div>
      </div>
    </div>
    ${rows}
  </div>`;
}

function _renderFeeClassList() {
  const classes  = DB.get('classes') || [];
  const students = DB.get('students') || [];
  const fees     = DB.get('fees') || [];
  const cur      = (getSettings().currency) || '₹';
  const struct   = DB.get('feeStructure') || [];
  const MON      = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const monthSet = new Set([...(fees.map(f=>(f.dueDate||f.createdAt||today()).slice(0,7))), today().slice(0,7)]);
  const allMonths = [...monthSet].sort();
  if (!allMonths.includes(_feeState.month)) _feeState.month = allMonths[allMonths.length-1];
  const sel = _feeState.month;
  const [sy,sm] = sel.split('-');
  const selLabel = MON[+sm-1]+' '+sy;
  const selFees  = fees.filter(f=>(f.dueDate||f.createdAt||'').slice(0,7)===sel);
  const totAmt  = selFees.reduce((a,f)=>a+Number(f.amount||0),0);
  const colAmt  = selFees.filter(f=>f.status==='paid').reduce((a,f)=>a+Number(f.amount||0),0);
  const penAmt  = totAmt - colAmt;
  const penCnt  = selFees.filter(f=>f.status!=='paid').length;

  const pills = allMonths.map(m=>{
    const [y,mn]=m.split('-'), act=m===sel;
    return `<button onclick="_feeState.month='${m}';renderFees()"
      style="flex-shrink:0;padding:7px 16px;border-radius:20px;cursor:pointer;white-space:nowrap;
             border:2px solid ${act?'#7c3aed':'rgba(255,255,255,.1)'};
             background:${act?'rgba(124,58,237,.25)':'transparent'};
             color:${act?'#c4b5fd':'rgba(255,255,255,.5)'};font-size:13px;font-weight:${act?700:500};">
      ${MON[+mn-1]} ${y}</button>`;
  }).join('');

  const cards = classes.map(cls=>{
    const stu  = students.filter(s=>s.classId===cls.id);
    const cf   = selFees.filter(f=>stu.some(s=>s.id===f.studentId));
    const paid = cf.filter(f=>f.status==='paid').length;
    const pend = cf.filter(f=>f.status!=='paid').length;
    const coll = cf.filter(f=>f.status==='paid').reduce((a,f)=>a+Number(f.amount||0),0);
    const tot  = cf.reduce((a,f)=>a+Number(f.amount||0),0);
    const pct  = tot ? Math.round(coll/tot*100) : 0;
    const mfee = struct.find(s=>s.classId===cls.id);
    return `<div onclick="_feeState.classId='${cls.id}';renderFees()"
      style="background:rgba(255,255,255,.04);border:1.5px solid rgba(255,255,255,.08);border-radius:16px;
             padding:20px;cursor:pointer;transition:all .18s;"
      onmouseover="this.style.background='rgba(124,58,237,.1)';this.style.borderColor='rgba(124,58,237,.35)'"
      onmouseout="this.style.background='rgba(255,255,255,.04)';this.style.borderColor='rgba(255,255,255,.08)'">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;">
        <div style="font-weight:800;font-size:16px;color:#fff;">🏫 ${cls.name}</div>
        <span style="color:rgba(255,255,255,.3);font-size:20px;">›</span>
      </div>
      <div style="font-size:12px;color:rgba(255,255,255,.4);margin-bottom:10px;">
        ${stu.length} students &nbsp;·&nbsp;
        Monthly: <strong style="color:${mfee?'#a78bfa':'rgba(255,255,255,.25)'}">
          ${mfee ? cur+Number(mfee.amount).toLocaleString() : 'Not set'}</strong>
      </div>
      ${tot>0
        ? `<div style="background:rgba(255,255,255,.07);border-radius:999px;height:5px;overflow:hidden;margin-bottom:7px;">
             <div style="height:100%;width:${pct}%;background:${pct>=80?'#10b981':pct>=40?'#f59e0b':'#ef4444'};border-radius:999px;"></div>
           </div>
           <div style="display:flex;justify-content:space-between;font-size:12px;">
             <span style="color:#10b981;">✅ ${paid} paid</span>
             <span style="color:${pend?'#ef4444':'rgba(255,255,255,.3)'};">⏳ ${pend} pending</span>
           </div>`
        : `<div style="font-size:12px;color:rgba(255,255,255,.25);">No invoices — click to add</div>`}
    </div>`;
  }).join('');

  const pc = (getSettings().paymentConfig)||{};
  const upiSetup = pc.enabled && pc.upiId;

  document.getElementById('section-fees').innerHTML = `
  <div class="page-header">
    <div>
      <h2>💳 Fee Management</h2>
      <div style="font-size:13px;color:rgba(255,255,255,.45);margin-top:2px;">${selLabel} — Select a class to manage students</div>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      <button class="btn btn-primary" onclick="feeSetupMonthly()" style="font-weight:700;">⚙️ Set Monthly Fee</button>
      <button onclick="feeRemindAllGlobal()"
        style="background:rgba(245,158,11,.15);color:#f59e0b;border:1px solid rgba(245,158,11,.3);
               border-radius:8px;padding:8px 16px;font-size:13px;font-weight:700;cursor:pointer;">
        🔔 Remind All Students</button>
      <button onclick="activateNav('settings')"
        style="background:${upiSetup?'rgba(16,185,129,.12)':'rgba(124,58,237,.12)'};
               color:${upiSetup?'#10b981':'#a78bfa'};
               border:1px solid ${upiSetup?'rgba(16,185,129,.3)':'rgba(124,58,237,.3)'};
               border-radius:8px;padding:8px 14px;font-size:12px;cursor:pointer;">
        ${upiSetup?'✅ UPI Active':'📲 Setup UPI Payment'}</button>
    </div>
  </div>

  ${_feeApprovalsHtml()}

  <div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:6px;margin-bottom:18px;scrollbar-width:none;">${pills}</div>

  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px;">
    <div style="background:rgba(16,185,129,.1);border:1px solid rgba(16,185,129,.2);border-radius:12px;padding:14px;text-align:center;">
      <div style="font-size:20px;font-weight:800;color:#10b981;">${cur}${colAmt.toLocaleString()}</div>
      <div style="font-size:11px;color:rgba(255,255,255,.4);margin-top:3px;">✅ Collected</div>
    </div>
    <div style="background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.2);border-radius:12px;padding:14px;text-align:center;">
      <div style="font-size:20px;font-weight:800;color:#ef4444;">${cur}${penAmt.toLocaleString()}</div>
      <div style="font-size:11px;color:rgba(255,255,255,.4);margin-top:3px;">⏳ Pending (${penCnt})</div>
    </div>
    <div style="background:rgba(124,58,237,.1);border:1px solid rgba(124,58,237,.2);border-radius:12px;padding:14px;text-align:center;">
      <div style="font-size:20px;font-weight:800;color:#a78bfa;">${cur}${totAmt.toLocaleString()}</div>
      <div style="font-size:11px;color:rgba(255,255,255,.4);margin-top:3px;">📋 Total</div>
    </div>
  </div>

  ${classes.length===0
    ? `<div class="empty-state"><div class="e-icon">🏫</div><h3>No classes yet</h3></div>`
    : `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px;">${cards}</div>`}`;
}

function _renderFeeClass(classId) {
  const cls      = DB.find('classes', classId) || {name:'Class'};
  const students = (DB.get('students')||[]).filter(s=>s.classId===classId)
                     .sort((a,b)=>String(a.rollNo||0).localeCompare(String(b.rollNo||0),undefined,{numeric:true}));
  const fees     = DB.get('fees') || [];
  const cur      = (getSettings().currency)||'₹';
  const struct   = DB.get('feeStructure') || [];
  const mfee     = struct.find(s=>s.classId===classId);
  const MON      = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const sel      = _feeState.month;
  const [sy,sm]  = sel.split('-');
  const mLabel   = MON[+sm-1]+' '+sy;

  const rows = students.map((st,i)=>{
    const sf      = fees.filter(f=>f.studentId===st.id && (f.dueDate||f.createdAt||'').slice(0,7)===sel);
    const pending = sf.filter(f=>f.status!=='paid');
    const penAmt  = pending.reduce((a,f)=>a+Number(f.amount||0),0);
    const hasInv  = sf.length > 0;

    const feeItems = sf.map(f=>`
      <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:3px;">
        <span style="font-size:12px;color:rgba(255,255,255,.55);">${f.feeType}</span>
        <span style="font-weight:700;color:${f.status==='paid'?'#10b981':'#ef4444'};font-size:13px;">
          ${cur}${Number(f.amount||0).toLocaleString()}</span>
        ${f.status==='paid'
          ? `<span style="background:rgba(16,185,129,.15);color:#10b981;font-size:10px;padding:1px 7px;border-radius:10px;">✅ Paid</span>
             <button onclick="feePrintRcp('${f.id}')"
               style="background:rgba(124,58,237,.15);color:#a78bfa;border:1px solid rgba(124,58,237,.3);
                      border-radius:5px;padding:1px 8px;font-size:10px;cursor:pointer;">🖨️</button>`
          : `<span style="background:rgba(239,68,68,.12);color:#ef4444;font-size:10px;padding:1px 7px;border-radius:10px;">⏳ Due</span>
             <button onclick="feeMarkPaid('${f.id}')"
               style="background:rgba(16,185,129,.2);color:#10b981;border:1px solid rgba(16,185,129,.3);
                      border-radius:5px;padding:1px 9px;font-size:11px;font-weight:700;cursor:pointer;">✓ Paid</button>
             <button onclick="feeDelInv('${f.id}')"
               style="background:rgba(239,68,68,.1);color:#ef4444;border:1px solid rgba(239,68,68,.2);
                      border-radius:5px;padding:1px 6px;font-size:10px;cursor:pointer;">🗑️</button>`}
      </div>`).join('');

    return `<tr style="border-top:1px solid rgba(255,255,255,.05);">
      <td style="padding:12px;color:rgba(255,255,255,.35);font-size:12px;width:36px;">${st.rollNo||i+1}</td>
      <td style="padding:12px;">
        <div style="font-weight:600;color:#fff;font-size:14px;">${st.name}</div>
        ${st.phone ? `<div style="font-size:10px;color:rgba(255,255,255,.3);">📱 ${st.phone}</div>` : ''}
      </td>
      <td style="padding:12px;">${hasInv ? feeItems : `<span style="font-size:12px;color:rgba(255,255,255,.25);">No invoice</span>`}</td>
      <td style="padding:12px;text-align:right;min-width:80px;">
        ${penAmt>0
          ? `<div style="font-weight:800;color:#ef4444;">${cur}${penAmt.toLocaleString()}</div>
             <div style="font-size:10px;color:rgba(255,255,255,.3);">pending</div>`
          : hasInv ? `<div style="color:#10b981;font-weight:700;font-size:13px;">✅ Clear</div>` : ''}
      </td>
      <td style="padding:12px;text-align:right;">
        <div style="display:flex;gap:5px;flex-wrap:wrap;justify-content:flex-end;">
          ${!hasInv ? `<button onclick="feeAddMonthly('${st.id}','${classId}')"
            style="background:rgba(124,58,237,.2);color:#a78bfa;border:1px solid rgba(124,58,237,.3);
                   border-radius:7px;padding:5px 11px;font-size:12px;font-weight:700;cursor:pointer;">+ Invoice</button>` : ''}
          <button onclick="feeAddCharge('${st.id}')"
            style="background:rgba(255,255,255,.07);color:rgba(255,255,255,.6);border:1px solid rgba(255,255,255,.12);
                   border-radius:7px;padding:5px 11px;font-size:12px;cursor:pointer;">+ Charge</button>
          <button onclick="openFeeStatement('${st.id}')"
            style="background:rgba(29,78,216,.18);color:#93c5fd;border:1px solid rgba(29,78,216,.35);
                   border-radius:7px;padding:5px 11px;font-size:12px;font-weight:700;cursor:pointer;">📄 Statement</button>
          ${penAmt>0 ? `<button onclick="feeRemind1('${st.id}')"
            style="background:rgba(245,158,11,.1);color:#f59e0b;border:1px solid rgba(245,158,11,.25);
                   border-radius:7px;padding:5px 9px;font-size:11px;cursor:pointer;">🔔</button>` : ''}
        </div>
      </td>
    </tr>`;
  }).join('');

  const cf     = fees.filter(f=>students.some(s=>s.id===f.studentId)&&(f.dueDate||f.createdAt||'').slice(0,7)===sel);
  const colAmt = cf.filter(f=>f.status==='paid').reduce((a,f)=>a+Number(f.amount||0),0);
  const penAmt2= cf.filter(f=>f.status!=='paid').reduce((a,f)=>a+Number(f.amount||0),0);
  const penCnt = cf.filter(f=>f.status!=='paid').length;

  document.getElementById('section-fees').innerHTML = `
  <div class="page-header">
    <div>
      <button onclick="_feeState.classId=null;renderFees()"
        style="background:rgba(255,255,255,.07);color:rgba(255,255,255,.7);border:1px solid rgba(255,255,255,.12);
               border-radius:7px;padding:5px 13px;font-size:13px;cursor:pointer;margin-bottom:8px;">← All Classes</button>
      <h2>🏫 ${cls.name} — ${mLabel}</h2>
      <div style="font-size:12px;color:rgba(255,255,255,.4);margin-top:2px;">
        ${students.length} students &nbsp;·&nbsp;
        Monthly fee: <strong style="color:${mfee?'#a78bfa':'#ef4444'}">
          ${mfee ? cur+Number(mfee.amount).toLocaleString() : 'Not set'}</strong>
        ${!mfee ? ` <button onclick="feeSetupMonthly('${classId}')"
          style="background:rgba(124,58,237,.2);color:#a78bfa;border:1px solid rgba(124,58,237,.3);
                 border-radius:5px;padding:1px 8px;font-size:11px;cursor:pointer;">⚙️ Set now</button>` : ''}
      </div>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      <button onclick="feeSetupMonthly('${classId}')"
        style="background:rgba(255,255,255,.07);color:rgba(255,255,255,.7);border:1px solid rgba(255,255,255,.12);
               border-radius:8px;padding:8px 14px;font-size:13px;cursor:pointer;">⚙️ Setup Fee</button>
      <button onclick="feeBulkGen('${classId}')"
        style="background:rgba(16,185,129,.15);color:#10b981;border:1px solid rgba(16,185,129,.3);
               border-radius:8px;padding:8px 14px;font-size:13px;font-weight:700;cursor:pointer;">⚡ Generate All</button>
      ${penCnt ? `<button onclick="feeRemindClass('${classId}')"
        style="background:rgba(245,158,11,.15);color:#f59e0b;border:1px solid rgba(245,158,11,.3);
               border-radius:8px;padding:8px 14px;font-size:13px;font-weight:700;cursor:pointer;">
        🔔 Remind Pending (${penCnt})</button>` : ''}
    </div>
  </div>

  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:18px;">
    <div style="background:rgba(16,185,129,.1);border:1px solid rgba(16,185,129,.2);border-radius:12px;padding:14px;text-align:center;">
      <div style="font-size:20px;font-weight:800;color:#10b981;">${cur}${colAmt.toLocaleString()}</div>
      <div style="font-size:11px;color:rgba(255,255,255,.4);margin-top:2px;">✅ Collected</div>
    </div>
    <div style="background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.2);border-radius:12px;padding:14px;text-align:center;">
      <div style="font-size:20px;font-weight:800;color:#ef4444;">${cur}${penAmt2.toLocaleString()}</div>
      <div style="font-size:11px;color:rgba(255,255,255,.4);margin-top:2px;">⏳ Pending</div>
    </div>
    <div style="background:rgba(124,58,237,.1);border:1px solid rgba(124,58,237,.2);border-radius:12px;padding:14px;text-align:center;">
      <div style="font-size:20px;font-weight:800;color:#a78bfa;">${students.length}</div>
      <div style="font-size:11px;color:rgba(255,255,255,.4);margin-top:2px;">Total Students</div>
    </div>
  </div>

  <div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:14px;overflow:hidden;">
    ${students.length===0
      ? `<div style="padding:36px;text-align:center;color:rgba(255,255,255,.3);">No students in this class.</div>`
      : `<div style="overflow-x:auto;">
           <table style="width:100%;border-collapse:collapse;min-width:580px;">
             <thead>
               <tr style="background:rgba(124,58,237,.1);">
                 <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;color:rgba(255,255,255,.4);text-transform:uppercase;">#</th>
                 <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;color:rgba(255,255,255,.4);text-transform:uppercase;">Student</th>
                 <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;color:rgba(255,255,255,.4);text-transform:uppercase;">Fee Details</th>
                 <th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:700;color:rgba(255,255,255,.4);text-transform:uppercase;">Balance</th>
                 <th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:700;color:rgba(255,255,255,.4);text-transform:uppercase;">Actions</th>
               </tr>
             </thead>
             <tbody>${rows}</tbody>
           </table>
         </div>`}
  </div>`;
}

function feeSetupMonthly(focusClassId) {
  const classes = DB.get('classes') || [];
  const struct  = DB.get('feeStructure') || [];
  const cur     = (getSettings().currency)||'₹';
  const trs = classes.map(cls=>{
    const item = struct.find(s=>s.classId===cls.id);
    return `<tr style="border-top:1px solid rgba(255,255,255,.06);">
      <td style="padding:12px 16px;font-weight:600;color:#fff;">${cls.name}</td>
      <td style="padding:10px 16px;">
        <input type="number" id="mf_${cls.id}" class="form-control" placeholder="e.g. 1500"
          value="${item?item.amount:''}" min="0" style="max-width:150px;">
      </td>
    </tr>`;
  }).join('');
  buildModal('modal-fee-setup','⚙️ Set Monthly Fee per Class',
    `<div style="background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.2);border-radius:10px;padding:10px 14px;margin-bottom:14px;font-size:13px;color:rgba(255,255,255,.65);">
       💡 Enter monthly fee for each class. Then click <strong>"⚡ Generate All"</strong> inside a class to auto-create invoices for all students in one click.
     </div>
     <table style="width:100%;border-collapse:collapse;">
       <thead><tr style="background:rgba(124,58,237,.1);">
         <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:700;color:rgba(255,255,255,.4);text-transform:uppercase;">Class</th>
         <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:700;color:rgba(255,255,255,.4);text-transform:uppercase;">Monthly Amount (${cur})</th>
       </tr></thead>
       <tbody>${trs}</tbody>
     </table>`,
  ()=>{
    const struct2 = DB.get('feeStructure') || [];
    classes.forEach(cls=>{
      const v=parseFloat(document.getElementById('mf_'+cls.id)?.value)||0;
      const i=struct2.findIndex(s=>s.classId===cls.id);
      if(v>0){ if(i>=0) struct2[i].amount=v; else struct2.push({id:genId('fs'),classId:cls.id,amount:v,createdAt:today()}); }
      else if(i>=0) struct2.splice(i,1);
    });
    DB.set('feeStructure',struct2); toast('✅ Monthly fees saved!','success'); closeAllModals(); renderFees();
  },'modal-lg');
}

function feeAddMonthly(studentId, classId) {
  const st   = DB.find('students', studentId);
  const mfee = (DB.get('feeStructure')||[]).find(s=>s.classId===classId);
  const cur  = (getSettings().currency)||'₹';
  const MON  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const sel  = _feeState.month;
  const [sy,sm] = sel.split('-');
  buildModal('modal-fee-inv','📋 Create Invoice',
    `<div style="background:rgba(124,58,237,.08);border:1px solid rgba(124,58,237,.2);border-radius:8px;padding:10px 14px;margin-bottom:12px;font-size:13px;color:rgba(255,255,255,.6);">
       👤 <strong style="color:#fff">${st?st.name:'Student'}</strong> &nbsp;·&nbsp;
       Month: <strong style="color:#a78bfa">${MON[+sm-1]} ${sy}</strong>
     </div>
     <div class="form-row">
       <div class="form-group"><label class="form-label">Fee Type</label>
         <select class="form-control" id="inv-type">
           <option>Monthly Fee</option><option>Tuition Fee</option>
           <option>Transport Fee</option><option>Exam Fee</option><option>Other</option>
         </select>
       </div>
       <div class="form-group"><label class="form-label">Amount (${cur}) *</label>
         <input class="form-control" type="number" id="inv-amt" value="${mfee?mfee.amount:''}" placeholder="Amount" min="1">
       </div>
     </div>
     <div class="form-group"><label class="form-label">Due Date</label>
       <input class="form-control" type="date" id="inv-due" value="${sy}-${sm}-01">
     </div>`,
  ()=>{
    const feeType = document.getElementById('inv-type')?.value||'Monthly Fee';
    const amount  = parseFloat(document.getElementById('inv-amt')?.value)||0;
    const dueDate = document.getElementById('inv-due')?.value||sel+'-01';
    if(!amount){ toast('Enter amount','warning'); return; }
    const ex = DB.get('fees')||[];
    ex.push({id:genId('fee'),studentId,feeType,amount,dueDate,status:'pending',createdAt:today()});
    DB.set('fees',ex); toast('✅ Invoice created!','success'); closeAllModals(); renderFees();
  },'modal-md');
}

function feeAddCharge(studentId) {
  const st  = DB.find('students', studentId);
  const cur = (getSettings().currency)||'₹';
  const sel = _feeState.month;
  const [sy,sm] = sel.split('-');
  buildModal('modal-fee-charge','➕ Add Extra Charge',
    `<div style="font-size:13px;color:rgba(255,255,255,.55);margin-bottom:12px;">
       👤 <strong style="color:#fff">${st?st.name:'Student'}</strong>
     </div>
     <div class="form-row">
       <div class="form-group"><label class="form-label">Charge Type *</label>
         <select class="form-control" id="ch-type"
           onchange="document.getElementById('ch-custom').style.display=this.value==='Other'?'block':'none'">
           <option>Tuition Fee</option><option>Transport Fee</option><option>Book Fee</option>
           <option>Exam Fee</option><option>Library Fee</option><option>Lab Fee</option>
           <option>Sports Fee</option><option>Late Fee</option><option>Other</option>
         </select>
       </div>
       <div class="form-group"><label class="form-label">Amount (${cur}) *</label>
         <input class="form-control" type="number" id="ch-amt" placeholder="e.g. 500" min="1">
       </div>
     </div>
     <div id="ch-custom" style="display:none;" class="form-group">
       <label class="form-label">Custom Name</label>
       <input class="form-control" id="ch-name" placeholder="e.g. Trip Fee, Fine">
     </div>
     <div class="form-group"><label class="form-label">Note (optional)</label>
       <input class="form-control" id="ch-note" placeholder="Reason / description">
     </div>`,
  ()=>{
    const typeRaw = document.getElementById('ch-type')?.value||'Other';
    const feeType = typeRaw==='Other'?(document.getElementById('ch-name')?.value.trim()||'Extra Charge'):typeRaw;
    const amount  = parseFloat(document.getElementById('ch-amt')?.value)||0;
    const note    = document.getElementById('ch-note')?.value.trim()||'';
    if(!amount){ toast('Enter amount','warning'); return; }
    const ex = DB.get('fees')||[];
    ex.push({id:genId('fee'),studentId,feeType,amount,dueDate:`${sy}-${sm}-15`,description:note,status:'pending',isExtra:true,createdAt:today()});
    DB.set('fees',ex); toast(`✅ "${feeType}" added!`,'success'); closeAllModals(); renderFees();
  },'modal-md');
}

function feeBulkGen(classId) {
  const mfee     = (DB.get('feeStructure')||[]).find(s=>s.classId===classId);
  const cls      = DB.find('classes', classId);
  const cur      = (getSettings().currency)||'₹';
  if(!mfee||!mfee.amount){
    toast(`Monthly fee not set for ${cls?cls.name:'this class'}. Click ⚙️ Setup Fee first.`,'warning'); return;
  }
  const sel      = _feeState.month;
  const [sy,sm]  = sel.split('-');
  const students = (DB.get('students')||[]).filter(s=>s.classId===classId);
  const existing = DB.get('fees')||[];
  const newFees  = [];
  let skip = 0;
  students.forEach(st=>{
    const dup = existing.some(f=>f.studentId===st.id&&f.feeType==='Monthly Fee'&&(f.dueDate||'').slice(0,7)===sel);
    if(dup){ skip++; return; }
    newFees.push({id:genId('fee'),studentId:st.id,feeType:'Monthly Fee',amount:mfee.amount,dueDate:`${sy}-${sm}-01`,status:'pending',createdAt:today()});
  });
  if(!newFees.length){ toast(`Already generated! (${skip} existed)`,'info'); return; }
  DB.set('fees',[...existing,...newFees]);
  toast(`✅ ${newFees.length} invoice${newFees.length>1?'s':''} created (${cur}${mfee.amount.toLocaleString()} each)!${skip?` ${skip} already existed.`:''}`,'success');
  renderFees();
}


// Internal: build reminder in format student.js expects
function _mkFeeReminder(studentId, dueAmount, month) {
  const s   = getSettings();
  const cur = s.currency || 'Rs.';
  const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const parts = (month || today().slice(0,7)).split('-');
  const y = parts[0], m = parts[1];
  const dueDate = y + '-' + m + '-10';
  return {
    id: genId('rm'),
    status: 'active',
    targetType: 'student',
    targetId: studentId,
    studentId: studentId,
    dueDate: dueDate,
    dueAmount: dueAmount,
    month: month,
    customMsg: 'Please pay your ' + MON[+m-1] + ' ' + y + ' school fee of ' + cur + Number(dueAmount).toLocaleString() + '.\nKindly pay by ' + dueDate + ' to avoid late charges.',
    sentAt: today(),
    sentBy: (window.CU && window.CU.name) || 'Admin',
    schoolId: DB._schoolId()
  };
}

function feeRemind1(studentId) {
  const st  = DB.find('students', studentId);
  const sel = _feeState.month;
  const fees = (DB.get('fees') || []).filter(function(f) {
    return f.studentId === studentId && f.status !== 'paid' && (f.dueDate || '').slice(0, 7) === sel;
  });
  const due = fees.reduce(function(a, f) { return a + Number(f.amount || 0); }, 0);
  if (!fees.length) { toast('No pending fees for this student', 'info'); return; }
  const existing = (DB.get('fee_reminders') || []).filter(function(r) {
    return !(r.studentId === studentId && r.month === sel && r.status === 'active');
  });
  DB.set('fee_reminders', existing.concat([_mkFeeReminder(studentId, due, sel)]));
  toast('Reminder sent to ' + (st ? st.name : 'student') + '!', 'success');
}

function feeRemindClass(classId) {
  const students = (DB.get('students') || []).filter(function(s) { return s.classId === classId; });
  const fees     = DB.get('fees') || [];
  const sel      = _feeState.month;
  const existing = DB.get('fee_reminders') || [];
  const newRems  = [];
  var cnt = 0;
  students.forEach(function(st) {
    var pend = fees.filter(function(f) {
      return f.studentId === st.id && f.status !== 'paid' && (f.dueDate || '').slice(0, 7) === sel;
    });
    if (!pend.length) return;
    var due = pend.reduce(function(a, f) { return a + Number(f.amount || 0); }, 0);
    newRems.push(_mkFeeReminder(st.id, due, sel));
    cnt++;
  });
  if (!cnt) { toast('No pending fees this month!', 'info'); return; }
  var stuIds = students.map(function(s) { return s.id; });
  var filtered = existing.filter(function(r) {
    return !(stuIds.indexOf(r.studentId) >= 0 && r.month === sel && r.status === 'active');
  });
  DB.set('fee_reminders', filtered.concat(newRems));
  toast(cnt + ' reminder' + (cnt > 1 ? 's' : '') + ' sent!', 'success');
  renderFees();
}

// One-click: remind ALL students who have any pending fee this month
function feeRemindAllGlobal() {
  const sel   = _feeState.month;
  const fees  = (DB.get('fees') || []).filter(function(f) {
    return f.status !== 'paid' && (f.dueDate || '').slice(0, 7) === sel;
  });
  const MON   = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const parts = sel.split('-'), sy = parts[0], sm = parts[1];
  const mLabel = MON[+sm-1] + ' ' + sy;
  if (!fees.length) { toast('No pending fees for ' + mLabel + '!', 'info'); return; }
  const by = {};
  fees.forEach(function(f) { by[f.studentId] = (by[f.studentId] || 0) + Number(f.amount || 0); });
  const cnt   = Object.keys(by).length;
  const cur   = (getSettings().currency) || 'Rs.';
  const total = Object.values(by).reduce(function(a, b) { return a + b; }, 0);
  const existing = (DB.get('fee_reminders') || []).filter(function(r) {
    return !(r.month === sel && r.status === 'active');
  });
  const newRems = Object.keys(by).map(function(sid) { return _mkFeeReminder(sid, by[sid], sel); });
  DB.set('fee_reminders', existing.concat(newRems));
  toast('Reminders sent to ' + cnt + ' student' + (cnt > 1 ? 's' : '') + ' for ' + mLabel + '! Total due: ' + cur + total.toLocaleString(), 'success');
  renderFees();
}

function feeRemindAll(month) {
  var prev = _feeState.month;
  _feeState.month = month;
  feeRemindAllGlobal();
  _feeState.month = prev;
}

function feeRemindAll(month) {
  const fees = (DB.get('fees')||[]).filter(f=>f.status!=='paid'&&(f.dueDate||'').slice(0,7)===month);
  if(!fees.length){ toast('No pending fees this month! 🎉','success'); return; }
  const by = {};
  fees.forEach(f=>{ by[f.studentId]=(by[f.studentId]||0)+Number(f.amount||0); });
  Object.entries(by).forEach(([sid,due])=>{
    DB.push('fee_reminders',{id:genId('rm'),studentId:sid,dueAmount:due,sentAt:today(),sentBy:window.CU?.name||'Admin'});
  });
  toast(`✅ ${Object.keys(by).length} reminder${Object.keys(by).length>1?'s':''} logged!`,'success');
  renderFees();
}

function feeMarkPaid(feeId) {
  const fee = (DB.get('fees')||[]).find(f=>f.id===feeId); if(!fee) return;
  DB.update('fees',feeId,{status:'paid',paidDate:today()});
  const n = (DB.get('fee_transactions')||[]).length+1;
  const rcpNo = 'RCP-'+String(n).padStart(4,'0');
  DB.push('fee_transactions',{id:genId('ft'),studentId:fee.studentId,feeId,amount:fee.amount,feeType:fee.feeType,method:'Cash',date:today(),receiptNo:rcpNo});
  toast('✅ Marked paid! Receipt: '+rcpNo,'success'); renderFees();
}

function feeDelInv(feeId) {
  if(!confirmAction('Delete this invoice?')) return;
  DB.set('fees',(DB.get('fees')||[]).filter(f=>f.id!==feeId)); toast('Invoice deleted','info'); renderFees();
}

function feePrintRcp(feeId) {
  const fee = (DB.get('fees')||[]).find(f=>f.id===feeId); if(!fee) return toast('Not found','error');
  const txn = (DB.get('fee_transactions')||[]).find(t=>t.feeId===feeId);
  const st  = DB.find('students',fee.studentId);
  const cls = st ? DB.find('classes',st.classId) : null;
  const s   = getSettings(); const cur = s.currency||'₹';
  const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const [fy,fm] = (fee.dueDate||today()).slice(0,7).split('-');
  const rcpNo = txn?.receiptNo||('RCP-'+Date.now().toString().slice(-6));
  const logo  = s.schoolLogo ? `<img src="${s.schoolLogo}" style="height:40px;background:#fff;padding:3px;border-radius:6px;margin-bottom:6px;"><br>` : '<div style="font-size:2rem;margin-bottom:4px">🎓</div>';
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Receipt</title>
<style>*{box-sizing:border-box}body{font-family:'Segoe UI',sans-serif;margin:0;background:#f8f9fa;display:flex;justify-content:center;padding:30px}
.r{max-width:380px;width:100%;border:2px solid #7c3aed;border-radius:16px;overflow:hidden}
.h{background:linear-gradient(135deg,#1e1b4b,#7c3aed);color:#fff;padding:20px 22px;text-align:center}
.b{padding:20px 22px;background:#fff}
.row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:14px}
.lbl{color:#64748b}.val{font-weight:600;color:#1e293b}
.tot{background:#f0fdf4;border-radius:8px;padding:12px;margin-top:12px;display:flex;justify-content:space-between;align-items:center}
@media print{body{padding:0;background:#fff}.r{border:none;border-radius:0}}</style></head>
<body><div class="r">
<div class="h">${logo}<div style="font-size:17px;font-weight:800">${s.schoolName||'School'}</div>
${s.schoolAddress?`<div style="font-size:11px;opacity:.65;margin-top:2px">${s.schoolAddress}</div>`:''}
<div style="margin-top:8px;font-size:12px;background:rgba(255,255,255,.15);padding:3px 12px;border-radius:20px;display:inline-block">Receipt: ${rcpNo}</div></div>
<div class="b">
<div class="row"><span class="lbl">Student</span><span class="val">${st?st.name:'—'}</span></div>
<div class="row"><span class="lbl">Class</span><span class="val">${cls?cls.name:'—'}</span></div>
<div class="row"><span class="lbl">Fee Type</span><span class="val">${fee.feeType||'Monthly Fee'}</span></div>
<div class="row"><span class="lbl">Month</span><span class="val">${MON[+fm-1]+' '+fy}</span></div>
<div class="row"><span class="lbl">Paid On</span><span class="val">${fee.paidDate||today()}</span></div>
<div class="row"><span class="lbl">Mode</span><span class="val">${txn?.method||'Cash'}</span></div>
<div class="tot"><span style="font-weight:700;color:#059669">Amount Paid</span>
<span style="font-weight:800;color:#059669;font-size:20px">${cur}${Number(fee.amount||0).toLocaleString()}</span></div>
<div style="text-align:center;margin-top:10px;padding:8px;background:#f0fdf4;border-radius:8px;color:#059669;font-weight:700;font-size:13px">✅ Payment Received — Thank You!</div>
<div style="text-align:center;margin-top:8px;font-size:10px;color:#94a3b8">${s.schoolName||'School'} · ${today()}</div>
</div></div><script>window.onload=()=>window.print()<\/script></body></html>`;
  const w = window.open('','_blank','width=460,height=660');
  if(w){ w.document.write(html); w.document.close(); }
}

// Legacy aliases so old calls do not break
function markFeeInvoicePaid(id)         { feeMarkPaid(id); }
function deleteFeeInvoice(id)            { feeDelInv(id); }
function _feeMgrMarkPaid(id)             { feeMarkPaid(id); }
function _feeMgrPrintReceipt(id)         { feePrintRcp(id); }
function openFeeModal()                  {}
function openCreateFeeInvoice()          { feeSetupMonthly(); }
function openFeeReminderModal(s,c)       { c ? feeRemindClass(c) : s ? feeRemind1(s) : feeRemindAll(_feeState.month); }
function openCreateFeeInvoiceFor(s,c)    { feeAddMonthly(s,c); }
function openCreateFeeInvoiceForClass(c) { feeBulkGen(c); }
function _feeUpdateDue(){}
function _feeTotalPreview(){}
function saveFee(){}
function saveCreateFeeInvoice(){}
function _invUpdateStudentList(){}
function _rmTargetChange(){}
function _rmPreset(){}
function saveFeeReminder(){}
function dismissFeeReminder(){}
function deleteFeeReminder(id) {
  if(!confirmAction('Delete?')) return;
  DB.set('fee_reminders',(DB.get('fee_reminders')||[]).filter(r=>r.id!==id));
  toast('Deleted','info');
}

// ══════════════════════════════════════════════════════
//  ACCOUNTS
// ══════════════════════════════════════════════════════
function renderAccounts(){
  const accs=DB.get('accounts'),s=getSettings(),cur=s.currency||'₹';
  const income =accs.filter(a=>a.type==='income').reduce((t,a)=>t+Number(a.amount),0);
  const expense=accs.filter(a=>a.type==='expense').reduce((t,a)=>t+Number(a.amount),0);
  document.getElementById('section-accounts').innerHTML=`
  <div class="page-header">
    <div><h2>Accounts</h2></div>
    <button class="btn btn-primary" onclick="openAccModal()">➕ Add Transaction</button>
  </div>
  <div class="stats-grid" style="grid-template-columns:repeat(3,1fr)">
    <div class="stat-card green"><div class="stat-icon">📈</div><div class="stat-value">${cur}${income.toLocaleString()}</div><div class="stat-label">Total Income</div></div>
    <div class="stat-card orange"><div class="stat-icon">📉</div><div class="stat-value">${cur}${expense.toLocaleString()}</div><div class="stat-label">Total Expense</div></div>
    <div class="stat-card ${income-expense>=0?'cyan':'pink'}">
      <div class="stat-icon">💰</div>
      <div class="stat-value">${cur}${Math.abs(income-expense).toLocaleString()}</div>
      <div class="stat-label">${income-expense>=0?'Net Profit':'Net Loss'}</div>
    </div>
  </div>
  <div class="card"><div class="table-wrap"><table>
    <thead><tr><th>Type</th><th>Category</th><th>Amount</th><th>Description</th><th>Date</th><th>Actions</th></tr></thead>
    <tbody>
      ${accs.slice().reverse().map(a=>`<tr>
        <td><span class="badge ${a.type==='income'?'badge-green':'badge-red'}">${a.type==='income'?'📈 Income':'📉 Expense'}</span></td>
        <td>${a.category}</td>
        <td class="${a.type==='income'?'text-green':'text-red'} fw-6">${cur}${Number(a.amount).toLocaleString()}</td>
        <td>${a.description}</td><td>${formatDate(a.date)}</td>
        <td><button class="btn btn-sm btn-danger" onclick="deleteAcc('${a.id}')">🗑️</button></td>
      </tr>`).join('')}
    </tbody>
  </table></div></div>`;
}
function openAccModal(){
  buildModal('modal-acc','Add Transaction',`
    <div class="form-group"><label class="form-label">Type *</label>
      <select class="form-control" id="acc-type">
        <option value="income">📈 Income</option>
        <option value="expense">📉 Expense</option>
      </select></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Category *</label>
        <input class="form-control" id="acc-cat" placeholder="e.g. Fee, Salary"></div>
      <div class="form-group"><label class="form-label">Amount (₹) *</label>
        <input class="form-control" type="number" id="acc-amt" placeholder="0"></div>
    </div>
    <div class="form-group"><label class="form-label">Description</label>
      <input class="form-control" id="acc-desc" placeholder="Details"></div>
    <div class="form-group"><label class="form-label">Date</label>
      <input class="form-control" type="date" id="acc-date" value="${today()}"></div>`,
    saveAcc);
}
function saveAcc(){
  const type=val('acc-type'),category=val('acc-cat'),description=val('acc-desc'),date=val('acc-date');
  const amount=Number(document.getElementById('acc-amt').value);
  if(!category||!amount){toast('Fill required fields','warning');return}
  DB.push('accounts',{id:genId('acc'),type,category,amount,description,date});
  toast('Transaction added!','success'); closeAllModals(); renderAccounts();
}
function deleteAcc(id){if(!confirmAction('Delete?'))return;DB.delete('accounts',id);renderAccounts()}

// ══════════════════════════════════════════════════════
//  SALARY RECEIPTS
// ══════════════════════════════════════════════════════
function renderSalary(){
  const receipts=DB.get('salary_receipts');
  document.getElementById('section-salary').innerHTML=`
  <div class="page-header">
    <div><h2>Salary Receipts</h2></div>
    <button class="btn btn-primary" onclick="openSalaryModal()">💼 Generate Receipt</button>
  </div>
  <div class="card"><div class="table-wrap"><table>
    <thead><tr><th>Teacher</th><th>Month</th><th>Basic</th><th>Allowances</th><th>Deductions</th><th>Net Salary</th><th>Paid On</th><th>Action</th></tr></thead>
    <tbody>
      ${receipts.slice().reverse().map(r=>{
        const t=DB.find('teachers',r.teacherId);
        return `<tr>
          <td><strong>${t?t.name:'—'}</strong></td>
          <td>${r.month}</td>
          <td>₹${Number(r.basicSalary).toLocaleString()}</td>
          <td class="text-green">+₹${Number(r.allowances).toLocaleString()}</td>
          <td class="text-red">-₹${Number(r.deductions).toLocaleString()}</td>
          <td class="text-green fw-7">₹${Number(r.netSalary).toLocaleString()}</td>
          <td>${formatDate(r.paidOn)}</td>
          <td><button class="btn btn-sm btn-cyan" onclick="printSalaryReceipt('${r.id}')">🖨️ Print</button></td>
        </tr>`;
      }).join('')||'<tr><td colspan="8" class="text-center text-muted" style="padding:40px">No receipts yet</td></tr>'}
    </tbody>
  </table></div></div>`;
}
function openSalaryModal(preId=''){
  const teachers=DB.get('teachers');
  buildModal('modal-salary','Generate Salary Receipt',`
    <div class="form-group"><label class="form-label">Teacher *</label>
      <select class="form-control" id="sal-tch" onchange="autoFillSal(this.value)">
        <option value="">Select teacher</option>
        ${teachers.map(t=>`<option value="${t.id}" ${t.id===preId?'selected':''}>${t.name} (${t.subject})</option>`).join('')}
      </select></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Month *</label>
        <input class="form-control" id="sal-month" placeholder="e.g. April 2025" value="April 2025"></div>
      <div class="form-group"><label class="form-label">Basic Salary (₹)</label>
        <input class="form-control" type="number" id="sal-basic" value="0"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Allowances (₹)</label>
        <input class="form-control" type="number" id="sal-allow" value="0"></div>
      <div class="form-group"><label class="form-label">Deductions (₹)</label>
        <input class="form-control" type="number" id="sal-deduct" value="0"></div>
    </div>
    <div class="form-group"><label class="form-label">Payment Date</label>
      <input class="form-control" type="date" id="sal-date" value="${today()}"></div>`,
    saveSalary);
  if(preId) setTimeout(()=>{document.getElementById('sal-tch').value=preId;autoFillSal(preId)},50);
}
function autoFillSal(tId){
  const t=DB.find('teachers',tId);
  if(t) document.getElementById('sal-basic').value=t.salary||0;
}
function saveSalary(){
  const teacherId=val('sal-tch'),month=val('sal-month'),paidOn=val('sal-date');
  const basic=Number(document.getElementById('sal-basic').value)||0;
  const allow=Number(document.getElementById('sal-allow').value)||0;
  const deduct=Number(document.getElementById('sal-deduct').value)||0;
  const net=basic+allow-deduct;
  if(!teacherId||!month){toast('Fill required fields','warning');return}
  const t=DB.find('teachers',teacherId);
  DB.push('salary_receipts',{id:genId('sr'),teacherId,month,basicSalary:basic,allowances:allow,deductions:deduct,netSalary:net,paidOn,paidBy:CU.name});
  DB.push('accounts',{id:genId('acc'),type:'expense',category:'Salary',amount:net,description:`Salary – ${t?t.name:''} – ${month}`,date:paidOn});
  toast('Salary receipt generated!','success'); closeAllModals(); renderSalary();
}
function quickSalaryReceipt(tId){ openSalaryModal(tId) }

function printSalaryReceipt(id){
  const r=DB.find('salary_receipts',id);
  const t=DB.find('teachers',r.teacherId);
  const s=getSettings();
  printHtml(`
    <div style="text-align:center;border-bottom:3px solid #6d28d9;padding-bottom:16px;margin-bottom:20px">
      <h1>SALARY RECEIPT</h1><h2>${s.schoolName||'School'}</h2>${s.schoolAddress?`<p>${s.schoolAddress}</p>`:''}</div>
    <table>
      <tr><td><b>Teacher</b></td><td>${t?t.name:'—'}</td><td><b>Subject</b></td><td>${t?t.subject:''}</td></tr>
      <tr><td><b>Month</b></td><td>${r.month}</td><td><b>Payment Date</b></td><td>${formatDate(r.paidOn)}</td></tr>
      <tr><td><b>Basic Salary</b></td><td>₹${r.basicSalary.toLocaleString()}</td>
          <td><b>Allowances</b></td><td style="color:green">+₹${r.allowances.toLocaleString()}</td></tr>
      <tr><td><b>Deductions</b></td><td style="color:red">-₹${r.deductions.toLocaleString()}</td>
          <td><b>Net Salary</b></td><td style="color:green;font-weight:bold">₹${r.netSalary.toLocaleString()}</td></tr>
    </table>
    <p style="margin-top:40px;text-align:right"><b>Authorized Signature: _________________</b></p>`,
    'Salary Receipt');
}

// ══════════════════════════════════════════════════════
//  ID CARDS
// ══════════════════════════════════════════════════════
let _idClass='';
let _idTheme = 'royal';

function renderIDCards(){
  const classes=DB.get('classes'),s=getSettings();
  if(!_idClass&&classes[0]) _idClass=classes[0].id;
  if(!window._idSel) window._idSel='p1';
  const students=DB.where('students','classId',_idClass);
  const themes = Object.keys(ID_THEMES);
  document.getElementById('section-idcards').innerHTML=`
  <div class="page-header">
    <div><h2>🪪 ID Cards</h2><div class="text-sm text-muted">Professional student ID cards · ${themes.length} premium designs</div></div>
    <button class="btn btn-primary" onclick="printAllIDCards()">🖨️ Print All Cards</button>
  </div>

  <div style="margin-bottom:18px;">
    <select class="form-control" style="width:200px;margin-bottom:14px;" onchange="_idClass=this.value;renderIDCards()">
      ${classes.map(c=>`<option value="${c.id}" ${c.id===_idClass?'selected':''}>${c.name}</option>`).join('')}
    </select>
    <div style="font-size:.74rem;color:#a78bfa;font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px;">⭐ Professional Designs (lanyard style)</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;">
      ${Object.keys(ID_LAYOUTS).map(k=>`<button onclick="window._idSel='${k}';idCardSetSel('${k}');renderIDCards()" style="padding:5px 14px;border-radius:20px;border:2px solid ${window._idSel===k?'#fff':'rgba(255,255,255,.15)'};background:linear-gradient(135deg,${ID_LAYOUTS[k].c1},${ID_LAYOUTS[k].c2});cursor:pointer;font-size:.76rem;color:#fff;font-weight:700;${window._idSel===k?'box-shadow:0 0 0 2px #a78bfa;':''}">${ID_LAYOUTS[k].label}</button>`).join('')}
    </div>
    <div style="font-size:.74rem;color:rgba(255,255,255,.4);font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px;">Classic Color Designs</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      ${themes.map(th=>`<button onclick="window._idSel='${th}';idCardSetSel('${th}');renderIDCards()" title="${ID_THEMES[th].label}" style="padding:5px 14px;border-radius:20px;border:2px solid ${window._idSel===th?'#fff':'rgba(255,255,255,.15)'};background:${ID_THEMES[th].grad};cursor:pointer;font-size:.76rem;color:#fff;font-weight:700;${window._idSel===th?'box-shadow:0 0 0 2px #a78bfa;':''}">${ID_THEMES[th].label}</button>`).join('')}
    </div>
  </div>

  <div id="id-cards-container" style="display:flex;flex-wrap:wrap;gap:24px;padding:4px;">
    ${students.map(st=>`
      <div style="display:flex;flex-direction:column;align-items:center;gap:8px">
        ${buildIDCard(st,classes,s)}
        <div style="display:flex;gap:6px">
          <button onclick="printSingleIDCard('${st.id}')" style="padding:5px 14px;border-radius:8px;border:1px solid rgba(124,58,237,.4);background:rgba(124,58,237,.15);color:#a78bfa;cursor:pointer;font-size:.78rem;font-weight:600">🖨️ Print</button>
          <button onclick="downloadSingleIDCard('${st.id}')" style="padding:5px 14px;border-radius:8px;border:1px solid rgba(6,182,212,.4);background:rgba(6,182,212,.15);color:#67e8f9;cursor:pointer;font-size:.78rem;font-weight:600">⬇️ Download</button>
        </div>
      </div>`).join('')
      || '<div class="empty-state"><div class="e-icon">🪪</div><h3>No students in this class</h3></div>'}
  </div>`;
  // Generate QR codes into card placeholders after DOM is ready
  setTimeout(function() {
    students.forEach(function(st) {
      _vmGenQR('qra-' + st.id, 'VM:STU:' + st.id, 68);
    });
  }, 120);
}

// Generate QR code as a base64 PNG data-URL (off-screen, sync)
function _genQRDataUrl(text, size) {
  if (!window.QRCode) return null;
  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:'+size+'px;height:'+size+'px;';
  document.body.appendChild(wrap);
  try {
    new QRCode(wrap, {
      text: text, width: size, height: size,
      colorDark:'#000000', colorLight:'#ffffff',
      correctLevel: QRCode.CorrectLevel.M
    });
    const canvas = wrap.querySelector('canvas');
    const dataUrl = canvas ? canvas.toDataURL('image/png') : null;
    document.body.removeChild(wrap);
    return dataUrl;
  } catch(e) {
    try { document.body.removeChild(wrap); } catch(_){}
    return null;
  }
}

// embedQR=true  → embed QR as <img src="data:..."> (for print/download windows)
// embedQR=false → use DOM placeholder <div id="qra-..."> (for on-screen display, filled later by _vmGenQR)

function printAllIDCards(){
  const classes=DB.get('classes'), s=getSettings();
  const students=DB.where('students','classId',_idClass);
  const cards = students.map(st=>buildIDCard(st,classes,s,true)).join(''); // embedQR=true
  printHtml(`<style>
    body{margin:0;padding:16px;background:#f8fafc;}
    @media print{body{padding:4px;} div{break-inside:avoid;}}
  </style>
  <div style="display:flex;flex-wrap:wrap;gap:20px;justify-content:flex-start;align-items:flex-start;">
    ${cards}
  </div>`, 'ID Cards — ' + (s.schoolName||''));
}

function printSingleIDCard(studentId){
  const classes=DB.get('classes'), s=getSettings();
  const st=DB.find('students',studentId);
  if(!st) return;
  const card=buildIDCard(st,classes,s,true); // embedQR=true → QR visible in print
  printHtml(`<style>
    body{margin:0;padding:40px;background:#f1f5f9;display:flex;justify-content:center;align-items:flex-start;}
    @media print{body{padding:20px;background:#fff;}}
  </style>${card}`, 'ID Card — '+st.name);
}

function downloadSingleIDCard(studentId){
  const classes=DB.get('classes'), s=getSettings();
  const st=DB.find('students',studentId);
  if(!st) return;
  const card=buildIDCard(st,classes,s,true); // embedQR=true → QR in downloaded card
  const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>ID Card — ${st.name}</title>
  <style>body{margin:0;padding:40px;background:#f1f5f9;display:flex;justify-content:center;}
  @media print{body{padding:10px;background:#fff;} @page{size:A6;margin:10mm;}}</style>
  </head><body>${card}
  <script>window.onload=()=>{window.print();}<\/script></body></html>`;
  const w=window.open('','_blank');
  if(w){w.document.write(html);w.document.close();}
}

// ══════════════════════════════════════════════════════
//  REPORT CARDS
// ══════════════════════════════════════════════════════
let _rcClass='', _rcExamType='';

function _rcAttendancePct(studentId, classId){
  const att=DB.get('attendance').filter(a=>a.classId===classId&&a.studentId===studentId);
  if(!att.length) return null;
  return Math.round(att.filter(a=>a.status==='present').length/att.length*100);
}

function renderReportCards(){
  const classes=DB.get('classes');
  if(!_rcClass&&classes[0]) _rcClass=classes[0].id;
  const allClassExams=DB.get('exams').filter(e=>e.classId===_rcClass);
  // Unique exam type names
  const examTypes=[...new Set(allClassExams.map(e=>e.name))].sort();
  if(!_rcExamType&&examTypes[0]) _rcExamType=examTypes[0];
  // Exams for selected type
  const typeExams=allClassExams.filter(e=>e.name===_rcExamType);
  const maxTotal=typeExams.reduce((t,e)=>t+e.maxMarks,0);
  const students=DB.where('students','classId',_rcClass);
  const cfg=rcGetConfig();
  document.getElementById('section-reportcards').innerHTML=`
  <div class="page-header">
    <div><h2>Report Cards</h2></div>
    <button class="btn btn-secondary" onclick="openReportSettings()">⚙️ Report Settings</button>
  </div>

  <!-- Template picker -->
  <div class="card mb-20" style="padding:18px 22px;">
    <div style="font-weight:700;font-size:1rem;margin-bottom:4px;">🎨 Choose Report Card Design</div>
    <div style="font-size:.78rem;color:var(--text-3);margin-bottom:14px;">Pick one design. It applies to printing AND to what parents see in their app. The chosen design is highlighted.</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:12px;">
      ${RC_TEMPLATES.map(t=>`
        <div onclick="rcPickTemplate('${t.id}')" style="cursor:pointer;border:2px solid ${cfg.template===t.id?t.accent:'var(--border)'};border-radius:12px;overflow:hidden;background:var(--glass);transition:all .15s;${cfg.template===t.id?'box-shadow:0 0 0 3px '+t.accent+'33;':''}">
          <div style="height:56px;background:linear-gradient(135deg,${t.accent},${t.accent}aa);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;letter-spacing:.5px;position:relative;">
            ${cfg.template===t.id?'<span style="position:absolute;top:6px;right:8px;background:#fff;color:'+t.accent+';border-radius:20px;font-size:.62rem;padding:1px 8px;font-weight:800;">✓ ACTIVE</span>':''}
            <span style="font-size:.78rem;">${t.name}</span>
          </div>
          <div style="padding:8px 10px;">
            <div style="font-size:.66rem;color:${t.accent};font-weight:700;text-transform:uppercase;letter-spacing:.04em;">${t.tag}</div>
            <div style="font-size:.72rem;color:var(--text-3);line-height:1.4;margin-top:3px;">${t.desc}</div>
          </div>
        </div>`).join('')}
    </div>
  </div>

  <div class="d-flex align-center gap-12 mb-24" style="flex-wrap:wrap">
    <div>
      <label class="form-label" style="margin-bottom:4px;display:block;font-size:.8rem">Class</label>
      <select class="form-control" style="width:180px" onchange="_rcClass=this.value;_rcExamType='';renderReportCards()">
        ${classes.map(c=>`<option value="${c.id}" ${c.id===_rcClass?'selected':''}>${c.name}</option>`).join('')}
      </select>
    </div>
    <div>
      <label class="form-label" style="margin-bottom:4px;display:block;font-size:.8rem">Exam Type</label>
      <select class="form-control" style="width:200px" onchange="_rcExamType=this.value;renderReportCards()">
        ${examTypes.length?examTypes.map(t=>`<option value="${t}" ${t===_rcExamType?'selected':''}>${t}</option>`).join(''):'<option value="">No exams found</option>'}
      </select>
    </div>
    <div>
      <label class="form-label" style="margin-bottom:4px;display:block;font-size:.8rem">Publish to Parents</label>
      <select class="form-control" style="width:200px" onchange="rcSetConfig({publishedExam:this.value});toast('✅ Published — parents now see '+(this.value||'all exams'),'success')">
        <option value="" ${cfg.publishedExam===''?'selected':''}>All exams (consolidated)</option>
        ${examTypes.map(t=>`<option value="${t}" ${t===cfg.publishedExam?'selected':''}>${t}</option>`).join('')}
      </select>
    </div>
    ${_rcExamType?`<div style="align-self:flex-end"><span class="badge badge-purple">📋 ${typeExams.length} subject(s) · Max ${maxTotal} marks</span></div>`:''}
  </div>
  ${!examTypes.length?'<div class="empty-state"><div class="e-icon">📊</div><h3>No Exams Found</h3><p>Add exams for this class first</p></div>':
  '<div class="grid-3">'+
    (students.map(st=>{
      const marks=DB.get('marks').filter(m=>m.studentId===st.id);
      const typeMarks=marks.filter(m=>typeExams.find(e=>e.id===m.examId));
      const total=typeMarks.reduce((t,m)=>t+m.obtained,0);
      const pct=maxTotal?Math.round(total/maxTotal*100):0;
      const g=getGrade(pct);
      const attPct=_rcAttendancePct(st.id,_rcClass);
      return `<div class="card">
        <div class="card-body text-center">
          <div class="avatar-sm" style="width:50px;height:50px;font-size:1.1rem;margin:0 auto 12px">${st.photo?`<img src="${st.photo}" style="width:50px;height:50px;border-radius:50%;object-fit:cover">`:st.name[0]}</div>
          <div class="fw-7 mb-4">${st.name}</div>
          <div class="text-sm text-2 mb-4">Roll: ${st.rollNo}</div>
          <div class="text-xs text-muted mb-12">📋 ${_rcExamType}</div>
          <div style="font-size:2rem;font-weight:800;color:${g.color}">${g.grade}</div>
          <div style="color:${g.color};font-size:.82rem">${g.label}</div>
          <div class="text-xs text-muted mt-8">${pct}% &nbsp;|&nbsp; ${total}/${maxTotal} marks</div>
          ${attPct!==null?`<div class="text-xs mt-4" style="color:${attPct>=75?'#059669':'#dc2626'}">🏫 Attendance: ${attPct}%</div>`:''}
          <div class="progress mt-8"><div class="progress-bar ${pct>=70?'green':pct>=50?'cyan':'red'}" style="width:${pct}%"></div></div>
          <div class="d-flex gap-6 mt-12" style="justify-content:center;flex-wrap:wrap">
            <button class="btn btn-sm" style="background:rgba(124,58,237,.12);color:#7c3aed;border:1px solid rgba(124,58,237,.3)" onclick="openReportEditor('${st.id}','${_rcExamType}')">✏️ Edit Details</button>
            <button class="btn btn-sm btn-primary" onclick="printReportCard('${st.id}','${_rcExamType}')">🖨️ Print</button>
          </div>
        </div>
      </div>`;
    }).join('')||'<div class="empty-state" style="grid-column:1/-1"><div class="e-icon">👥</div><p>No students found in this class</p></div>')+
  '</div>'}`;
}

function rcPickTemplate(tid){
  rcSetConfig({template:tid});
  const t=RC_TEMPLATES.find(x=>x.id===tid);
  toast(`🎨 "${t?t.name:tid}" selected — parents will see this design`,'success');
  renderReportCards();
}

function printReportCard(studentId, examType){
  const data=rcBuildData(studentId, examType);
  if(!data){toast('Student data not found','error');return;}
  const tid=rcGetConfig().template;
  rcPrintCard(rcRenderCard(tid, data), `Report Card — ${data.st.name||''}`);
}

// ── Global report settings (areas, toggles, grader) ──
function openReportSettings(){
  const cfg=rcGetConfig();
  buildModal('rc-settings','⚙️ Report Card Settings',`
    <div class="form-group"><label class="form-label">Co-Scholastic Areas <span class="text-muted">(comma separated)</span></label>
      <input class="form-control" id="rcs-cosch" value="${esc((cfg.coScholastic||[]).join(', '))}"></div>
    <div class="form-group"><label class="form-label">Discipline Areas <span class="text-muted">(comma separated)</span></label>
      <input class="form-control" id="rcs-disc" value="${esc((cfg.discipline||[]).join(', '))}"></div>
    <div class="form-group"><label class="form-label">Default Class Teacher Remark</label>
      <input class="form-control" id="rcs-remark" value="${esc(cfg.defaultRemark||'')}"></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Show Rank</label>
        <select class="form-control" id="rcs-rank"><option value="1" ${cfg.showRank?'selected':''}>Yes</option><option value="0" ${!cfg.showRank?'selected':''}>No</option></select></div>
      <div class="form-group"><label class="form-label">Show QR Verification</label>
        <select class="form-control" id="rcs-qr"><option value="1" ${cfg.showQR?'selected':''}>Yes</option><option value="0" ${!cfg.showQR?'selected':''}>No</option></select></div>
    </div>
    <div class="alert" style="background:rgba(124,58,237,.08);border:1px solid rgba(124,58,237,.25);border-radius:8px;padding:10px 12px;font-size:.82rem">
      💡 These apply to every report card. Per-student grades & remarks are set from each student's <strong>✏️ Edit Details</strong> button. QR codes let anyone scan and view the verified report card.
    </div>`, saveReportSettings);
}
function saveReportSettings(){
  const split=v=>v.split(',').map(x=>x.trim()).filter(Boolean);
  rcSetConfig({
    coScholastic: split(val('rcs-cosch')),
    discipline:   split(val('rcs-disc')),
    defaultRemark: val('rcs-remark'),
    showRank: val('rcs-rank')==='1',
    showQR:   val('rcs-qr')==='1',
  });
  toast('✅ Report settings saved','success'); closeAllModals(); renderReportCards();
}

// ── Per-student editor (remark, co-scholastic & discipline grades, rank override) ──
function openReportEditor(studentId, examType){
  const cfg=rcGetConfig();
  const ov=rcGetOverride(studentId, examType||cfg.publishedExam||'');
  const st=DB.find('students',studentId);
  const sg=ov.scholasticGrades||{}, dg=ov.disciplineGrades||{};
  const gradeOpts=['','A','B','C','A+','A1','A2','B1','B2','C1','C2','D','E'];
  const sel=(cur)=>gradeOpts.map(o=>`<option value="${o}" ${o===cur?'selected':''}>${o||'—'}</option>`).join('');
  buildModal('rc-editor',`✏️ Report Details — ${st?st.name:''}`,`
    <div class="form-group"><label class="form-label">Class Teacher's Remark</label>
      <textarea class="form-control" id="rce-remark" rows="2">${esc(ov.remark||cfg.defaultRemark||'')}</textarea></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Rank (manual override)</label>
        <input class="form-control" type="number" id="rce-rank" placeholder="auto" value="${ov.rank||''}"></div>
      <div class="form-group"><label class="form-label">Out of (total students)</label>
        <input class="form-control" type="number" id="rce-rankout" placeholder="auto" value="${ov.outOf||''}"></div>
    </div>
    <div class="form-group"><label class="form-label">Promoted to Class <span class="text-muted">(shown on pre-primary cards)</span></label>
      <input class="form-control" id="rce-promoted" placeholder="e.g. Class 2" value="${esc(ov.promotedTo||'')}"></div>
    <div style="font-weight:700;margin:6px 0 4px;font-size:.9rem">Co-Scholastic Grades</div>
    ${(cfg.coScholastic||[]).map((a,i)=>`<div class="d-flex gap-8 align-center mb-6"><div style="flex:1;font-size:.85rem">${esc(a)}</div>
      <select class="form-control" style="width:90px" data-cosch="${esc(a)}">${sel(sg[a]||'')}</select></div>`).join('')}
    <div style="font-weight:700;margin:10px 0 4px;font-size:.9rem">Discipline Grades</div>
    ${(cfg.discipline||[]).map((a,i)=>`<div class="d-flex gap-8 align-center mb-6"><div style="flex:1;font-size:.85rem">${esc(a)}</div>
      <select class="form-control" style="width:90px" data-disc="${esc(a)}">${sel(dg[a]||'')}</select></div>`).join('')}
  `, ()=>saveReportEditor(studentId, examType||cfg.publishedExam||''), 'modal-lg');
}
function saveReportEditor(studentId, examType){
  const scholasticGrades={}, disciplineGrades={};
  document.querySelectorAll('#rc-editor [data-cosch]').forEach(s=>{ if(s.value) scholasticGrades[s.dataset.cosch]=s.value; });
  document.querySelectorAll('#rc-editor [data-disc]').forEach(s=>{ if(s.value) disciplineGrades[s.dataset.disc]=s.value; });
  const rank=Number(val('rce-rank'))||'', outOf=Number(val('rce-rankout'))||'';
  rcSetOverride(studentId, examType, {
    remark: val('rce-remark'), scholasticGrades, disciplineGrades,
    rank: rank||undefined, outOf: outOf||undefined,
    promotedTo: val('rce-promoted')||undefined,
  });
  toast('✅ Report details saved — visible to parents too','success'); closeAllModals();
}

// ══════════════════════════════════════════════════════
//  NOTICES
// ══════════════════════════════════════════════════════
function renderNotices(){
  const notices=DB.get('notices');
  document.getElementById('section-notices').innerHTML=`
  <div class="page-header">
    <div><h2>Notices</h2></div>
    <button class="btn btn-primary" onclick="openNoticeModal()">➕ Post Notice</button>
  </div>
  ${notices.length?notices.slice().reverse().map(n=>`
    <div class="notice-card ${n.type}">
      <div class="d-flex align-center justify-between mb-8">
        <div class="notice-title">${n.title}</div>
        <div class="d-flex gap-8 align-center">
          <span class="badge ${n.type==='urgent'?'badge-red':n.type==='info'?'badge-cyan':'badge-purple'}">${n.type}</span>
          <span class="badge ${n.audience==='all'?'badge-gray':n.audience==='students'?'badge-cyan':'badge-purple'}">📣 ${n.audience}</span>
          <button class="btn-icon" title="Send to parents via WhatsApp/SMS" onclick="openMsgComposer({text:${JSON.stringify('📢 '+n.title+'\n\n'+n.body+'\n\n— {school}')}})">📲</button>
          <button class="btn-icon" onclick="deleteNotice('${n.id}')">🗑️</button>
        </div>
      </div>
      <div class="notice-body">${n.body}</div>
      <div class="notice-meta"><span>📅 ${formatDate(n.date)}</span><span>👤 ${n.postedBy}</span></div>
    </div>`).join(''):'<div class="empty-state"><div class="e-icon">📢</div><h3>No notices yet</h3></div>'}`;
}
function openNoticeModal(){
  buildModal('modal-notice','Post Notice',`
    <div class="form-group"><label class="form-label">Title *</label>
      <input class="form-control" id="ntc-title" placeholder="Notice title"></div>
    <div class="form-group"><label class="form-label">Content *</label>
      <textarea class="form-control" id="ntc-body" rows="4" placeholder="Notice content…"></textarea></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Type</label>
        <select class="form-control" id="ntc-type">
          <option value="general">General</option>
          <option value="urgent">Urgent</option>
          <option value="info">Information</option>
        </select></div>
      <div class="form-group"><label class="form-label">Audience</label>
        <select class="form-control" id="ntc-audience">
          <option value="all">All (Students + Teachers)</option>
          <option value="students">Students Only</option>
          <option value="teachers">Teachers Only</option>
        </select></div>
    </div>`, saveNotice);
}
function saveNotice(){
  const title=val('ntc-title'),body=document.getElementById('ntc-body').value.trim();
  const type=val('ntc-type'),audience=val('ntc-audience');
  if(!title||!body){toast('Fill required fields','warning');return}
  DB.push('notices',{id:genId('ntc'),title,body,type,audience,date:today(),postedBy:CU.name});
  toast('Notice posted!','success'); closeAllModals(); renderNotices();
}
function deleteNotice(id){if(!confirmAction('Delete notice?'))return;DB.delete('notices',id);renderNotices()}

// ══════════════════════════════════════════════════════
//  LEAVES
// ══════════════════════════════════════════════════════
// ── leave state ──────────────────────────────────────
let _lvTab='student', _lvFilter='pending';

function renderLeaves(){
  const all         = DB.get('leaves');
  const stuPending  = all.filter(l=>l.type!=='teacher'&&l.status==='pending').length;
  const tchPending  = all.filter(l=>l.type==='teacher' &&l.status==='pending').length;

  document.getElementById('section-leaves').innerHTML=`
  <div class="page-header"><div><h2>Leave Requests</h2></div></div>

  <!-- Type toggle -->
  <div style="display:flex;gap:10px;margin-bottom:18px;flex-wrap:wrap">
    <button onclick="_lvSetTab('student')" style="padding:10px 22px;border-radius:10px;border:2px solid ${_lvTab==='student'?'#7c3aed':'var(--border)'};background:${_lvTab==='student'?'rgba(124,58,237,.15)':'var(--glass)'};color:${_lvTab==='student'?'#a78bfa':'var(--text-2)'};font-weight:700;cursor:pointer;position:relative">
      👨‍🎓 Student Leaves
      ${stuPending?`<span style="position:absolute;top:-6px;right:-6px;background:#f59e0b;color:#fff;border-radius:50%;width:18px;height:18px;font-size:10px;display:flex;align-items:center;justify-content:center;font-weight:800">${stuPending}</span>`:''}
    </button>
    <button onclick="_lvSetTab('teacher')" style="padding:10px 22px;border-radius:10px;border:2px solid ${_lvTab==='teacher'?'#7c3aed':'var(--border)'};background:${_lvTab==='teacher'?'rgba(124,58,237,.15)':'var(--glass)'};color:${_lvTab==='teacher'?'#a78bfa':'var(--text-2)'};font-weight:700;cursor:pointer;position:relative">
      👩‍🏫 Teacher Leaves
      ${tchPending?`<span style="position:absolute;top:-6px;right:-6px;background:#f59e0b;color:#fff;border-radius:50%;width:18px;height:18px;font-size:10px;display:flex;align-items:center;justify-content:center;font-weight:800">${tchPending}</span>`:''}
    </button>
  </div>

  <!-- Status filter -->
  <div class="tabs mb-16">
    <button class="tab ${_lvFilter==='pending'?'active':''}"  onclick="_lvSetFilter(this,'pending')">⏳ Pending</button>
    <button class="tab ${_lvFilter==='approved'?'active':''}" onclick="_lvSetFilter(this,'approved')">✅ Approved</button>
    <button class="tab ${_lvFilter==='rejected'?'active':''}" onclick="_lvSetFilter(this,'rejected')">❌ Rejected</button>
    <button class="tab ${_lvFilter==='all'?'active':''}"      onclick="_lvSetFilter(this,'all')">📋 All</button>
  </div>

  <div id="leaves-list">${_leaveListHtml()}</div>`;
}

function _lvSetTab(tab){
  _lvTab=tab; _lvFilter='pending'; renderLeaves();
}
function _lvSetFilter(btn,f){
  document.querySelectorAll('.tabs .tab').forEach(t=>t.classList.remove('active'));
  btn.classList.add('active');
  _lvFilter=f;
  document.getElementById('leaves-list').innerHTML=_leaveListHtml();
}

function _leaveListHtml(){
  const all=DB.get('leaves');
  const list=all.filter(l=>{
    const isTeacher=(l.type==='teacher');
    const matchTab = _lvTab==='teacher' ? isTeacher : !isTeacher;
    const matchFilter = _lvFilter==='all' || l.status===_lvFilter;
    return matchTab && matchFilter;
  });

  if(!list.length) return '<div class="empty-state"><div class="e-icon">📅</div><p>No leave requests found</p></div>';

  return list.map(l=>{
    // ── Student leave card ──
    if(l.type!=='teacher'){
      const st  = DB.find('students',l.studentId);
      const cls = st ? DB.find('classes',st.classId) : null;
      const date= l.appliedOn||l.applyDate||'';
      return `<div class="leave-card" style="margin-bottom:10px;flex-direction:column;gap:8px">
        <div class="d-flex align-center justify-between">
          <div class="d-flex align-center gap-8">
            <div class="avatar-sm" style="width:40px;height:40px;flex-shrink:0;background:rgba(59,130,246,.2);color:#3b82f6">${st?st.name[0]:'?'}</div>
            <div>
              <div class="fw-6">${st?st.name:'Unknown Student'}</div>
              <div class="text-xs text-muted">${cls?cls.name:''} &nbsp;·&nbsp; Roll: ${st?st.rollNo:'—'}</div>
            </div>
          </div>
          <span class="badge ${l.status==='pending'?'badge-yellow':l.status==='approved'?'badge-green':'badge-red'}">${l.status}</span>
        </div>
        <div class="text-sm text-2">📝 ${l.reason}</div>
        <div class="text-xs text-muted">📅 ${formatDate(l.fromDate)} – ${formatDate(l.toDate)} &nbsp;·&nbsp; Applied: ${date?formatDate(date):'—'}${l.resolvedBy?` &nbsp;·&nbsp; ${l.status==='approved'?'✅':'❌'} by ${l.resolvedBy}`:''}</div>
        ${l.status==='pending'?`<div class="d-flex gap-8">
          <button class="btn btn-sm btn-success" onclick="approveLeave('${l.id}','approved')">✅ Approve</button>
          <button class="btn btn-sm btn-danger"  onclick="approveLeave('${l.id}','rejected')">❌ Reject</button>
        </div>`:''}
      </div>`;
    }
    // ── Teacher leave card ──
    const tc  = DB.find('teachers',l.teacherId);
    const date= l.appliedOn||l.applyDate||'';
    return `<div class="leave-card" style="margin-bottom:10px;flex-direction:column;gap:8px">
      <div class="d-flex align-center justify-between">
        <div class="d-flex align-center gap-8">
          <div class="avatar-sm" style="width:40px;height:40px;flex-shrink:0;background:rgba(124,58,237,.2);color:#a78bfa">${tc?tc.name[0]:'T'}</div>
          <div>
            <div class="fw-6">${tc?tc.name:'Unknown Teacher'}</div>
            <div class="text-xs text-muted">${tc&&tc.subject?tc.subject:''} &nbsp;·&nbsp; 👩‍🏫 Teacher</div>
          </div>
        </div>
        <span class="badge ${l.status==='pending'?'badge-yellow':l.status==='approved'?'badge-green':'badge-red'}">${l.status}</span>
      </div>
      <div class="text-sm text-2">📝 ${l.reason}</div>
      <div class="text-xs text-muted">📅 ${formatDate(l.fromDate)} – ${formatDate(l.toDate)} &nbsp;·&nbsp; Applied: ${date?formatDate(date):'—'}${l.resolvedBy?` &nbsp;·&nbsp; ${l.status==='approved'?'✅':'❌'} by ${l.resolvedBy}`:''}</div>
      ${l.status==='pending'?`<div class="d-flex gap-8">
        <button class="btn btn-sm btn-success" onclick="approveLeave('${l.id}','approved')">✅ Approve</button>
        <button class="btn btn-sm btn-danger"  onclick="approveLeave('${l.id}','rejected')">❌ Reject</button>
      </div>`:''}
    </div>`;
  }).join('');
}

// kept for backward compat — old filterLeave calls
function filterLeave(btn,f){ _lvSetFilter(btn,f); }

function approveLeave(id,status){
  DB.update('leaves',id,{status,resolvedBy:CU.name,resolvedOn:today()});
  toast(`Leave ${status}!`,status==='approved'?'success':'info');
  renderLeaves(); renderDashboard();
}

// ══════════════════════════════════════════════════════
//  LEADERBOARD
// ══════════════════════════════════════════════════════
let _lbClass='', _lbExamType='__all__';
function renderLeaderboard(){
  const classes=DB.get('classes');
  if(!_lbClass&&classes[0]) _lbClass=classes[0].id;
  const allClassExams=DB.get('exams').filter(e=>e.classId===_lbClass);
  const examTypes=[...new Set(allClassExams.map(e=>e.name))].sort();
  const exams=_lbExamType==='__all__'?allClassExams:allClassExams.filter(e=>e.name===_lbExamType);
  const students=DB.where('students','classId',_lbClass);
  const marks=DB.get('marks');
  const maxT=exams.reduce((t,e)=>t+e.maxMarks,0);
  const ranked=students.map(s=>{
    const total=marks.filter(m=>m.studentId===s.id&&exams.find(e=>e.id===m.examId)).reduce((t,m)=>t+m.obtained,0);
    return {...s,total,pct:maxT?Math.round(total/maxT*100):0};
  }).sort((a,b)=>b.pct-a.pct);

  document.getElementById('section-leaderboard').innerHTML=`
  <div class="page-header"><div><h2>Leaderboard</h2></div></div>
  <div class="d-flex gap-12 mb-24" style="flex-wrap:wrap;align-items:flex-end">
    <div>
      <label class="form-label" style="font-size:.78rem;margin-bottom:4px;display:block">Class</label>
      <select class="form-control" style="width:180px" onchange="_lbClass=this.value;_lbExamType='__all__';renderLeaderboard()">
        ${classes.map(c=>`<option value="${c.id}" ${c.id===_lbClass?'selected':''}>${c.name}</option>`).join('')}
      </select>
    </div>
    <div>
      <label class="form-label" style="font-size:.78rem;margin-bottom:4px;display:block">Exam Filter</label>
      <select class="form-control" style="width:200px" onchange="_lbExamType=this.value;renderLeaderboard()">
        <option value="__all__" ${_lbExamType==='__all__'?'selected':''}>🏆 All Exams (Combined)</option>
        ${examTypes.map(t=>`<option value="${t}" ${t===_lbExamType?'selected':''}>${t}</option>`).join('')}
      </select>
    </div>
    <div style="align-self:flex-end">
      <span class="badge badge-purple">${_lbExamType==='__all__'?'All exams combined':_lbExamType} · Total ${maxT} marks</span>
    </div>
  </div>
  ${ranked.length&&maxT>0?`
  <div class="card mb-24"><div class="card-body">
    <div style="text-align:center;margin-bottom:16px;font-weight:700;color:var(--text-2)">${_lbExamType==='__all__'?'Overall Rankings':'Rankings — '+_lbExamType}</div>
    <div class="leader-podium">
      ${ranked[1]?`<div class="podium-item second"><div class="podium-rank">🥈</div><div class="podium-avatar">${ranked[1].name[0]}</div><div class="podium-name">${ranked[1].name}</div><div class="podium-score">${ranked[1].pct}%</div><div class="podium-block"></div></div>`:''}
      ${ranked[0]?`<div class="podium-item first"><div class="podium-rank">🥇</div><div class="podium-avatar">${ranked[0].name[0]}</div><div class="podium-name">${ranked[0].name}</div><div class="podium-score">${ranked[0].pct}%</div><div class="podium-block"></div></div>`:''}
      ${ranked[2]?`<div class="podium-item third"><div class="podium-rank">🥉</div><div class="podium-avatar">${ranked[2].name[0]}</div><div class="podium-name">${ranked[2].name}</div><div class="podium-score">${ranked[2].pct}%</div><div class="podium-block"></div></div>`:''}
    </div>
  </div></div>
  <div class="card"><div class="table-wrap"><table>
    <thead><tr><th>Rank</th><th>Student</th><th>Roll</th><th>Score</th><th>Percentage</th><th>Grade</th></tr></thead>
    <tbody>
      ${ranked.map((s,i)=>{
        const g=getGrade(s.pct);
        return `<tr ${i<3?`style="background:${i===0?'rgba(250,204,21,.08)':i===1?'rgba(156,163,175,.08)':'rgba(180,120,60,.08)'}"`:''}>
          <td><strong style="font-size:1.1rem">${i===0?'🥇':i===1?'🥈':i===2?'🥉':'<span style="color:var(--text-3)">#'+(i+1)+'</span>'}</strong></td>
          <td><div class="d-flex align-center gap-8">${s.photo?`<img src="${s.photo}" style="width:32px;height:32px;border-radius:50%;object-fit:cover">`:`<div class="avatar-sm" style="width:32px;height:32px;font-size:.85rem">${s.name[0]}</div>`}<strong>${s.name}</strong></div></td>
          <td>${s.rollNo}</td>
          <td><strong>${s.total}</strong>/${maxT}</td>
          <td><div class="d-flex align-center gap-8"><span style="font-weight:600">${s.pct}%</span>
            <div class="progress" style="width:80px"><div class="progress-bar ${s.pct>=70?'green':s.pct>=50?'cyan':'red'}" style="width:${s.pct}%"></div></div>
          </div></td>
          <td style="color:${g.color};font-weight:700">${g.grade}</td>
        </tr>`;
      }).join('')}
    </tbody>
  </table></div></div>`
  :(maxT===0
    ?'<div class="empty-state"><div class="e-icon">📊</div><h3>No Exam Data</h3><p>Add exams and enter marks first</p></div>'
    :'<div class="empty-state"><div class="e-icon">🏆</div><h3>No Marks Entered</h3><p>Enter student marks to see rankings</p></div>')}`;
}

// ══════════════════════════════════════════════════════
//  SCHOOL GALLERY  — Admin
// ══════════════════════════════════════════════════════
// ── Gallery state ──
window._galCurrentAlbum = null; // null = albums view, id = inside album


function renderGallery(){
  if(window._galView==='videos'){ _galRenderVideosAdmin(); return; }
  if(window._galCurrentAlbum) { _galRenderAlbumView(window._galCurrentAlbum); return; }
  _galRenderAlbumsGrid();
}
function _galTabBar(active){
  const t=(id,ic,l)=>`<button class="att-tab ${active===id?'active':''}" onclick="window._galView='${id==='videos'?'videos':''}';window._galCurrentAlbum=null;renderGallery()">${ic} ${l}</button>`;
  return `<div class="att-tab-bar" style="margin-bottom:16px;">${t('albums','📁','Photo Albums')}${t('videos','🎬','Videos')}</div>`;
}
function _galRenderVideosAdmin(){
  GV.onChange=renderGallery;
  document.getElementById('section-gallery').innerHTML=`
  <div class="page-header">
    <div><h2>🖼️ School Gallery</h2><p class="page-sub">Activity videos — parents can watch, share & open</p></div>
    <button class="btn btn-primary" onclick="GV.openAdd()">🎬 Add Video</button>
  </div>
  ${_galTabBar('videos')}
  ${GV.listHtml(true)}`;
}

/* ── Albums Grid View ─────────────────────────────────── */
function _galRenderAlbumsGrid(){
  const albums  = DB.get('galleryAlbums') || [];
  const gallery = DB.get('gallery') || [];
  const totalPhotos = gallery.length;

  // Build album cards
  const albumCards = albums.map(alb=>{
    const photos = gallery.filter(p=>p.albumId===alb.id).sort((a,b)=>b.createdAt-a.createdAt);
    const cover  = alb.coverPhoto || (photos[0]?.photo) || '';
    const cnt    = photos.length;
    return `<div onclick="galOpenAlbum('${alb.id}')"
      style="background:var(--bg-2);border:1.5px solid var(--border);border-radius:16px;overflow:hidden;cursor:pointer;
             transition:transform .18s,box-shadow .18s;position:relative;"
      onmouseover="this.style.transform='translateY(-3px)';this.style.boxShadow='0 8px 30px rgba(0,0,0,.15)'"
      onmouseout="this.style.transform='';this.style.boxShadow=''">
      <!-- Folder cover -->
      <div style="height:145px;position:relative;overflow:hidden;background:linear-gradient(135deg,rgba(124,58,237,.18),rgba(6,182,212,.12));">
        ${cover
          ?`<img src="${cover}" style="width:100%;height:100%;object-fit:cover;display:block;">`
          :`<div style="height:100%;display:flex;align-items:center;justify-content:center;font-size:3.2rem;">📁</div>`}
        <div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.55) 0%,transparent 60%);"></div>
        <div style="position:absolute;bottom:8px;left:12px;color:#fff;font-weight:700;font-size:13.5px;text-shadow:0 1px 4px rgba(0,0,0,.8);">${cnt} photo${cnt!==1?'s':''}</div>
      </div>
      <!-- Info -->
      <div style="padding:12px 14px;">
        <div style="font-weight:700;font-size:14px;margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${alb.name}</div>
        ${alb.description?`<div style="font-size:12px;color:var(--text-3);line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${alb.description}</div>`:''}
        <div style="font-size:11px;color:var(--text-3);margin-top:6px;">📅 ${formatDate(alb.date||alb.createdAt||today())}</div>
      </div>
      <!-- Delete album btn -->
      <button onclick="event.stopPropagation();galDeleteAlbum('${alb.id}')"
        style="position:absolute;top:8px;right:8px;background:rgba(239,68,68,.85);color:#fff;border:none;border-radius:8px;
               padding:4px 9px;font-size:11px;cursor:pointer;backdrop-filter:blur(4px);">🗑️</button>
    </div>`;
  }).join('');

  // Uncategorized photos (no albumId)
  const uncatPhotos = gallery.filter(p=>!p.albumId);
  const uncatCard = uncatPhotos.length ? `
    <div onclick="galOpenAlbum('__uncat')"
      style="background:var(--bg-2);border:1.5px dashed var(--border);border-radius:16px;overflow:hidden;cursor:pointer;
             transition:transform .18s,box-shadow .18s;"
      onmouseover="this.style.transform='translateY(-3px)';this.style.boxShadow='0 8px 30px rgba(0,0,0,.15)'"
      onmouseout="this.style.transform='';this.style.boxShadow=''">
      <div style="height:145px;background:linear-gradient(135deg,rgba(100,116,139,.1),rgba(100,116,139,.05));display:flex;align-items:center;justify-content:center;">
        <div style="text-align:center;">
          <div style="font-size:2.8rem;">📂</div>
          <div style="font-size:12px;color:var(--text-3);margin-top:4px;">${uncatPhotos.length} photo${uncatPhotos.length!==1?'s':''}</div>
        </div>
      </div>
      <div style="padding:12px 14px;">
        <div style="font-weight:700;font-size:14px;">Uncategorized Photos</div>
        <div style="font-size:12px;color:var(--text-3);margin-top:2px;">Photos without an album</div>
      </div>
    </div>` : '';

  document.getElementById('section-gallery').innerHTML=`
  <div class="page-header">
    <div>
      <h2>🖼️ School Gallery</h2>
      <p class="page-sub">Activity-wise photo albums — ${albums.length} album${albums.length!==1?'s':''} · ${totalPhotos} total photo${totalPhotos!==1?'s':''}</p>
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;">
      <button class="btn btn-secondary" onclick="openCreateAlbumModal()">📁 New Album</button>
      <button class="btn btn-primary"   onclick="openGalleryUpload()">📷 Upload Photos</button>
    </div>
  </div>

  ${_galTabBar('albums')}

  ${albums.length===0 && uncatPhotos.length===0
    ?`<div class="empty-state">
        <div class="e-icon">🖼️</div>
        <h3>No Albums Yet</h3>
        <p>Create an album for each activity (Sports Day, Republic Day, etc.) and upload photos to keep them organized.</p>
        <button class="btn btn-primary" style="margin-top:14px;" onclick="openCreateAlbumModal()">📁 Create First Album</button>
      </div>`
    :`<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:18px;">
        ${albumCards}${uncatCard}
      </div>`}`;
}

/* ── Album Detail View ────────────────────────────────── */
function galOpenAlbum(albumId){
  window._galCurrentAlbum = albumId;
  _galRenderAlbumView(albumId);
}

function _galRenderAlbumView(albumId){
  const gallery = (DB.get('gallery')||[]).sort((a,b)=>b.createdAt-a.createdAt);
  let photos, albumName, albumDesc;

  if(albumId==='__uncat'){
    photos    = gallery.filter(p=>!p.albumId);
    albumName = 'Uncategorized Photos';
    albumDesc = 'Photos without an album';
  } else {
    const albums = DB.get('galleryAlbums')||[];
    const alb    = albums.find(a=>a.id===albumId);
    if(!alb){ window._galCurrentAlbum=null; renderGallery(); return; }
    photos    = gallery.filter(p=>p.albumId===albumId);
    albumName = alb.name;
    albumDesc = alb.description||'';
  }

  window._galleryPhotos = photos;

  const photoCards = photos.map((p,idx)=>`
    <div style="background:var(--bg-2);border:1px solid var(--border);border-radius:12px;overflow:hidden;">
      <div style="position:relative;cursor:pointer;" onclick="viewGalleryPhoto(${idx})">
        <img src="${p.photo}" style="width:100%;height:160px;object-fit:cover;display:block;" loading="lazy">
        <div style="position:absolute;inset:0;background:rgba(0,0,0,0);transition:.2s" onmouseover="this.style.background='rgba(0,0,0,.2)'" onmouseout="this.style.background=''">
        </div>
        <div style="position:absolute;bottom:6px;right:8px;background:rgba(0,0,0,.6);color:#fff;border-radius:5px;padding:2px 7px;font-size:10px;">🔍 View</div>
      </div>
      <div style="padding:10px 12px;">
        <div style="font-weight:600;font-size:13px;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${p.title||albumName}</div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px;">
          <span style="font-size:10.5px;color:var(--text-3);">📅 ${formatDate(p.date)}</span>
          <button onclick="deleteGalleryPhoto('${p.id}')" style="background:#fee2e2;color:#ef4444;border:none;border-radius:6px;padding:3px 9px;cursor:pointer;font-size:11px;font-weight:600;">🗑️</button>
        </div>
      </div>
    </div>`).join('');

  document.getElementById('section-gallery').innerHTML=`
  <div class="page-header">
    <div>
      <button class="btn btn-secondary" onclick="galBackToAlbums()" style="margin-bottom:8px;font-size:13px;">← Back to Albums</button>
      <h2>📁 ${albumName}</h2>
      ${albumDesc?`<p class="page-sub">${albumDesc}</p>`:''}
      <div class="breadcrumb">${photos.length} photo${photos.length!==1?'s':''}</div>
    </div>
    <button class="btn btn-primary" onclick="openGalleryUpload('${albumId}')">📷 Add Photos Here</button>
  </div>

  ${photos.length===0
    ?`<div class="empty-state"><div class="e-icon">📷</div><h3>No Photos in this Album</h3>
       <p>Click "Add Photos Here" to upload photos to <strong>${albumName}</strong></p></div>`
    :`<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px;">${photoCards}</div>`}`;
}

function galBackToAlbums(){
  window._galCurrentAlbum = null;
  renderGallery();
}

function galDeleteAlbum(albumId){
  if(!confirmAction('Delete this album? Photos inside will become uncategorized.')) return;
  // remove albumId from photos
  const gallery = DB.get('gallery')||[];
  gallery.forEach(p=>{ if(p.albumId===albumId) p.albumId=null; });
  DB.set('gallery',gallery);
  const albums = (DB.get('galleryAlbums')||[]).filter(a=>a.id!==albumId);
  DB.set('galleryAlbums',albums);
  toast('Album deleted. Photos moved to Uncategorized.','info');
  renderGallery();
}

/* ── Create Album Modal ───────────────────────────────── */
function openCreateAlbumModal(){
  buildModal('galAlbumModal','📁 Create New Album',`
    <div class="form-group"><label class="form-label">Album Name (Activity) *</label>
      <input id="gal-alb-name" class="form-control" placeholder="e.g. Annual Sports Day 2026, Republic Day Function, Science Fair"></div>
    <div class="form-group"><label class="form-label">Description <span style="font-weight:400;color:var(--text-3);font-size:11px;">(optional)</span></label>
      <textarea id="gal-alb-desc" class="form-control" rows="2" placeholder="Short description of this activity or event..."></textarea></div>
    <div class="form-group"><label class="form-label">Event Date</label>
      <input id="gal-alb-date" type="date" class="form-control" value="${today()}"></div>`,
  ()=>{
    const name=(document.getElementById('gal-alb-name')?.value||'').trim();
    if(!name){toast('Album name is required','warning');return;}
    const desc=(document.getElementById('gal-alb-desc')?.value||'').trim();
    const date=document.getElementById('gal-alb-date')?.value||today();
    const albums=DB.get('galleryAlbums')||[];
    const newAlb={id:genId('alb'),name,description:desc,date,coverPhoto:'',createdAt:Date.now()};
    albums.push(newAlb);
    DB.set('galleryAlbums',albums);
    toast(`📁 Album "${name}" created!`,'success');
    closeAllModals();
    // Auto-open the new album for photo upload
    window._galCurrentAlbum=newAlb.id;
    renderGallery();
  },'modal-md');
}

// ── Gallery Lightbox Viewer ───────────────────────────
function viewGalleryPhoto(startIndex) {
  const photos = window._galleryPhotos || [];
  if (!photos.length) return;
  let cur = startIndex;

  function _render(idx) {
    const p = photos[idx];
    if (!p) return;
    const box = document.getElementById('_gal_lightbox');
    if (!box) return;
    box.querySelector('#_gal_img').src = p.photo;
    box.querySelector('#_gal_title').textContent = p.title || '';
    box.querySelector('#_gal_meta').textContent  = `${formatDate(p.date)}  ·  ${p.uploaderName || ''}`;
    box.querySelector('#_gal_counter').textContent = `${idx + 1} / ${photos.length}`;
    box.querySelector('#_gal_prev').style.opacity = idx === 0 ? '.3' : '1';
    box.querySelector('#_gal_next').style.opacity = idx === photos.length - 1 ? '.3' : '1';
  }

  // Build overlay if not existing
  let lb = document.getElementById('_gal_lightbox');
  if (!lb) {
    lb = document.createElement('div');
    lb.id = '_gal_lightbox';
    lb.style.cssText = `position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.94);
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);`;
    lb.innerHTML = `
      <!-- Close -->
      <button id="_gal_close" style="position:absolute;top:16px;right:20px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);
        color:#fff;border-radius:50%;width:40px;height:40px;font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:2;">✕</button>

      <!-- Counter -->
      <div id="_gal_counter" style="position:absolute;top:20px;left:50%;transform:translateX(-50%);
        color:rgba(255,255,255,.5);font-size:13px;font-weight:600;letter-spacing:.04em;"></div>

      <!-- Download -->
      <a id="_gal_dl" download style="position:absolute;top:16px;left:20px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);
        color:#fff;border-radius:8px;padding:7px 14px;font-size:12px;font-weight:700;text-decoration:none;cursor:pointer;">⬇️ Download</a>

      <!-- Image wrapper -->
      <div style="position:relative;max-width:92vw;max-height:72vh;display:flex;align-items:center;gap:16px;">
        <!-- Prev -->
        <button id="_gal_prev" onclick="_galNav(-1)" style="background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.18);
          color:#fff;border-radius:50%;width:44px;height:44px;font-size:22px;cursor:pointer;flex-shrink:0;transition:opacity .2s;">‹</button>

        <!-- Main image -->
        <img id="_gal_img" style="max-width:78vw;max-height:68vh;object-fit:contain;border-radius:12px;
          box-shadow:0 20px 60px rgba(0,0,0,.7);transition:opacity .2s;" src="">

        <!-- Next -->
        <button id="_gal_next" onclick="_galNav(1)" style="background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.18);
          color:#fff;border-radius:50%;width:44px;height:44px;font-size:22px;cursor:pointer;flex-shrink:0;transition:opacity .2s;">›</button>
      </div>

      <!-- Caption -->
      <div style="margin-top:18px;text-align:center;max-width:80vw;">
        <div id="_gal_title" style="color:#fff;font-weight:700;font-size:1rem;margin-bottom:4px;"></div>
        <div id="_gal_meta"  style="color:rgba(255,255,255,.4);font-size:.8rem;"></div>
      </div>`;
    document.body.appendChild(lb);

    // Close on backdrop click
    lb.addEventListener('click', e => { if (e.target === lb) _galClose(); });
    lb.querySelector('#_gal_close').addEventListener('click', _galClose);

    // Keyboard nav
    document.addEventListener('keydown', _galKey);
  }

  lb.style.display = 'flex';
  _render(cur);

  // Keep download link in sync
  function _updateDl() {
    const p = photos[cur];
    const dl = document.getElementById('_gal_dl');
    if (dl && p) { dl.href = p.photo; dl.download = (p.title || 'photo') + '.jpg'; }
  }
  _updateDl();

  window._galNav = function(dir) {
    const nx = cur + dir;
    if (nx < 0 || nx >= photos.length) return;
    const img = document.getElementById('_gal_img');
    img.style.opacity = '0';
    setTimeout(() => {
      cur = nx;
      _render(cur);
      _updateDl();
      img.style.opacity = '1';
    }, 150);
  };
}

function _galClose() {
  const lb = document.getElementById('_gal_lightbox');
  if (lb) lb.style.display = 'none';
  document.removeEventListener('keydown', _galKey);
}

function _galKey(e) {
  if (e.key === 'ArrowRight') window._galNav && window._galNav(1);
  if (e.key === 'ArrowLeft')  window._galNav && window._galNav(-1);
  if (e.key === 'Escape')     _galClose();
}

let _galBulkQueue = [];

function openGalleryUpload(presetAlbumId){
  _galBulkQueue = [];
  const classes = DB.get('classes');
  const albums  = DB.get('galleryAlbums')||[];
  const body=`
    <div class="form-group">
      <label class="form-label">📁 Select Album *</label>
      <select id="gal-album-sel" class="form-control">
        <option value="">— Select Album —</option>
        ${albums.map(a=>`<option value="${a.id}" ${a.id===(presetAlbumId||window._galCurrentAlbum)?'selected':''}>${a.name} (${formatDate(a.date||today())})</option>`).join('')}
        <option value="__new">➕ Create New Album…</option>
      </select>
    </div>
    <div id="gal-new-alb-row" style="display:none;" class="form-group">
      <input id="gal-new-alb-name" class="form-control" placeholder="New album name (e.g. Annual Day 2026)">
    </div>
    <div class="form-group">
      <label class="form-label">📌 Photo Caption <span style="color:#94a3b8;font-size:11px;">(optional — used as photo title)</span></label>
      <input id="gal-title" class="form-control" placeholder="e.g. Prize Distribution, Group Photo">
    </div>
    <div class="form-group">
      <label class="form-label">📝 Description <span style="color:#94a3b8;font-size:12px;">(optional)</span></label>
      <textarea id="gal-desc" class="form-control" rows="2" placeholder="Briefly describe this event or activity..."></textarea>
    </div>
    <div class="form-group">
      <label class="form-label">📅 Event Date</label>
      <input id="gal-date" type="date" class="form-control" value="${today()}">
    </div>
    <div class="form-group">
      <label class="form-label">👁️ Visible To</label>
      <select id="gal-vis" class="form-control" onchange="galVisChange()">
        <option value="all">🌐 All Parents &amp; Students</option>
        <option value="class">🏫 Specific Class Only</option>
        <option value="student">👤 Specific Student Only</option>
      </select>
    </div>
    <div id="gal-class-row" style="display:none;" class="form-group">
      <label class="form-label">Select Class</label>
      <select id="gal-classId" class="form-control" onchange="galClassChange()">
        <option value="">-- Select Class --</option>
        ${classes.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}
      </select>
    </div>
    <div id="gal-student-row" style="display:none;" class="form-group">
      <label class="form-label">Select Student</label>
      <select id="gal-studentId" class="form-control">
        <option value="">-- Select class first --</option>
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">📷 Select Photos
        <span style="color:#94a3b8;font-size:11px;font-weight:400;margin-left:4px;">Max 50 photos · Each auto-compressed to ≤200 KB</span>
      </label>
      <input id="gal-photo-input" type="file" accept="image/*" multiple class="form-control"
             onchange="galBulkFilesSelected(this)" style="cursor:pointer;">
      <div style="color:#64748b;font-size:11.5px;margin-top:5px;">
        💡 Hold <strong>Ctrl</strong> (Windows) or <strong>Cmd</strong> (Mac) to select multiple photos at once
      </div>
    </div>
    <div id="gal-bulk-progress" style="display:none;margin-bottom:14px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:7px;">
        <span id="gal-progress-label" style="font-size:12px;color:#64748b;font-weight:600;">⏳ Compressing photos...</span>
        <span id="gal-progress-count" style="font-size:12px;color:#64748b;font-weight:700;">0 / 0</span>
      </div>
      <div style="background:#f1f5f9;border-radius:20px;height:8px;overflow:hidden;">
        <div id="gal-progress-bar" style="height:100%;background:linear-gradient(90deg,#6366f1,#0ea5e9);border-radius:20px;width:0%;transition:width .35s ease;"></div>
      </div>
    </div>
    <div id="gal-thumb-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(88px,1fr));gap:8px;margin-bottom:10px;"></div>
    <div id="gal-bulk-summary" style="display:none;">
      <div style="background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.25);border-radius:10px;padding:11px 16px;font-size:13px;color:#059669;font-weight:700;">
        ✅ <span id="gal-ready-count">0</span> photos ready to upload — click <strong>Save</strong> to upload all at once
      </div>
    </div>`;
  buildModal('galUploadModal','📷 Upload Photos to Album (Max 50)',body,saveGalleryPhoto,'lg');
  // Wire new-album toggle
  setTimeout(()=>{
    const sel=document.getElementById('gal-album-sel');
    const row=document.getElementById('gal-new-alb-row');
    if(sel&&row) sel.addEventListener('change',()=>{row.style.display=sel.value==='__new'?'block':'none';});
  },80);
}

function galVisChange(){
  const v=document.getElementById('gal-vis')?.value;
  document.getElementById('gal-class-row').style.display   =(v==='class'||v==='student')?'':'none';
  document.getElementById('gal-student-row').style.display =(v==='student')?'':'none';
}

function galClassChange(){
  const classId=document.getElementById('gal-classId')?.value;
  const studs=classId?DB.get('students').filter(s=>s.classId===classId):[];
  const sel=document.getElementById('gal-studentId'); if(!sel) return;
  sel.innerHTML=studs.length
    ?studs.map(s=>`<option value="${s.id}">${s.name} (Roll: ${s.rollNo||'-'})</option>`).join('')
    :'<option value="">No students in this class</option>';
}

function galBulkFilesSelected(input){
  let files = Array.from(input.files);
  if(!files.length) return;
  if(files.length > 50){
    toast(`⚠️ Maximum 50 photos allowed. First 50 selected (${files.length} chosen).`,'warning');
    files = files.slice(0,50);
  }
  _galBulkQueue = files.map(f=>({name:f.name, file:f, compressed:null, status:'pending'}));
  document.getElementById('gal-bulk-progress').style.display='block';
  document.getElementById('gal-bulk-summary').style.display='none';
  _galUpdateBulkUI();
  // Compress sequentially
  let idx=0;
  function next(){
    if(idx>=_galBulkQueue.length){ _galBulkAllDone(); return; }
    _galBulkQueue[idx].status='compressing';
    _galUpdateBulkUI();
    _compressGalleryImg(_galBulkQueue[idx].file, compressed=>{
      _galBulkQueue[idx].compressed=compressed;
      _galBulkQueue[idx].status='done';
      idx++; _galUpdateBulkUI(); next();
    });
  }
  next();
}

function _galUpdateBulkUI(){
  const total = _galBulkQueue.length;
  const done  = _galBulkQueue.filter(q=>q.status==='done').length;
  const pct   = total ? Math.round(done/total*100) : 0;
  const bar   = document.getElementById('gal-progress-bar');
  const label = document.getElementById('gal-progress-label');
  const count = document.getElementById('gal-progress-count');
  const grid  = document.getElementById('gal-thumb-grid');
  if(bar)   bar.style.width   = pct+'%';
  if(count) count.textContent = `${done} / ${total}`;
  if(label) label.textContent = done===total&&total>0 ? '✅ All photos compressed!' : `⏳ Compressing... (${done}/${total})`;
  if(grid){
    grid.innerHTML = _galBulkQueue.map(q=>{
      const borderCol = q.status==='done'?'#10b981':q.status==='compressing'?'#f59e0b':'#e2e8f0';
      const icon      = q.status==='done'?'✅':q.status==='compressing'?'⏳':'📷';
      const shortName = q.name.length>14 ? q.name.slice(0,12)+'…' : q.name;
      return `<div style="border-radius:8px;overflow:hidden;border:2px solid ${borderCol};position:relative;">
        ${q.compressed
          ? `<img src="${q.compressed}" style="width:100%;height:78px;object-fit:cover;display:block;">`
          : `<div style="height:78px;background:#f8fafc;display:flex;align-items:center;justify-content:center;font-size:24px;">${icon}</div>`}
        <div style="position:absolute;top:3px;right:4px;font-size:12px;line-height:1;text-shadow:0 1px 3px rgba(0,0,0,.5);">${icon}</div>
        <div style="font-size:8.5px;color:#64748b;padding:3px 5px;background:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${shortName}</div>
      </div>`;
    }).join('');
  }
}

function _galBulkAllDone(){
  const ready = _galBulkQueue.filter(q=>q.status==='done').length;
  const countEl = document.getElementById('gal-ready-count');
  const summEl  = document.getElementById('gal-bulk-summary');
  if(countEl) countEl.textContent = ready;
  if(summEl)  summEl.style.display='block';
  toast(`✅ ${ready} photo(s) compressed and ready to upload!`,'success');
}

function _compressGalleryImg(file,cb){
  const reader=new FileReader();
  reader.onload=e=>{
    const img=new Image();
    img.onload=()=>{
      const canvas=document.createElement('canvas');
      let w=img.width, h=img.height;
      const maxD=1200;
      if(w>maxD||h>maxD){ if(w>h){h=Math.round(h*maxD/w);w=maxD;}else{w=Math.round(w*maxD/h);h=maxD;} }
      canvas.width=w; canvas.height=h;
      canvas.getContext('2d').drawImage(img,0,0,w,h);
      let q=0.88, result=canvas.toDataURL('image/jpeg',q);
      // Iteratively reduce quality until under 200 KB
      while(result.length>200*1024*(4/3) && q>0.2){ q=Math.max(0.2,q-0.06); result=canvas.toDataURL('image/jpeg',q); }
      cb(result);
    };
    img.src=e.target.result;
  };
  reader.readAsDataURL(file);
}

function saveGalleryPhoto(){
  const readyPhotos=_galBulkQueue.filter(q=>q.status==='done'&&q.compressed);
  if(!readyPhotos.length){ toast('Please select photos and wait for compression to finish','warning'); return; }
  const stillCompressing=_galBulkQueue.some(q=>q.status==='compressing');
  if(stillCompressing){ toast('⏳ Photos are still compressing, please wait...','warning'); return; }

  // ── Resolve album ──
  let albumId = (document.getElementById('gal-album-sel')?.value||'').trim();
  const albums = DB.get('galleryAlbums')||[];
  if(albumId==='__new'){
    const newName=(document.getElementById('gal-new-alb-name')?.value||'').trim();
    if(!newName){toast('Please enter a name for the new album','warning');return;}
    const newAlb={id:genId('alb'),name:newName,description:'',date:today(),coverPhoto:'',createdAt:Date.now()};
    albums.push(newAlb);
    DB.set('galleryAlbums',albums);
    albumId=newAlb.id;
    toast(`📁 New album "${newName}" created!`,'info');
  }
  if(!albumId){ toast('Please select or create an album first','warning'); return; }

  const vis       = document.getElementById('gal-vis')?.value||'all';
  const classId   = vis!=='all'     ?(document.getElementById('gal-classId')?.value  ||''):'';
  const studentId = vis==='student' ?(document.getElementById('gal-studentId')?.value||''):'';
  if(vis==='class'   &&!classId)   { toast('Please select a class','warning');   return; }
  if(vis==='student' &&!studentId) { toast('Please select a student','warning'); return; }
  const caption = (document.getElementById('gal-title')?.value||'').trim();
  const desc    = (document.getElementById('gal-desc')?.value||'').trim();
  const date    = document.getElementById('gal-date')?.value||today();
  const albName = albums.find(a=>a.id===albumId)?.name||'';

  const gallery = DB.get('gallery');
  const baseTs  = Date.now();
  readyPhotos.forEach((q,i)=>{
    const p={
      id:          genId('gal'),
      albumId,
      title:       caption || (readyPhotos.length>1?`${albName} (${i+1}/${readyPhotos.length})`:albName),
      description: desc,
      photo:       q.compressed,
      uploadedBy:  'admin',
      uploaderName: CU.name||'Admin',
      date,
      visibility:  vis,
      classId:     classId||null,
      studentId:   studentId||null,
      createdAt:   baseTs+i
    };
    gallery.push(p);
    // Set cover photo if album has none
    const alb=albums.find(a=>a.id===albumId);
    if(alb&&!alb.coverPhoto){alb.coverPhoto=p.photo; DB.set('galleryAlbums',albums);}
  });
  DB.set('gallery',gallery);
  _galBulkQueue=[];
  document.getElementById('galUploadModal')?.remove();
  toast(`📸 ${readyPhotos.length} photo(s) uploaded to "${albName}"!`,'success');
  // Navigate into the album we just uploaded to
  window._galCurrentAlbum=albumId;
  renderGallery();
}

function deleteGalleryPhoto(id){
  if(!confirmAction('Delete this photo? This cannot be undone.')) return;
  DB.set('gallery',(DB.get('gallery')||[]).filter(p=>p.id!==id));
  toast('Photo deleted','info');
  // Stay in current album if inside one
  renderGallery();
}

// ══════════════════════════════════════════════════════
//  INVENTORY MANAGEMENT
// ══════════════════════════════════════════════════════
let _invTab = 'items'; // items | stock | distributions | pending

function renderInventory(){
  const items  = DB.get('inv_items');
  const stocks = DB.get('inv_stock');
  const dists  = DB.get('inv_dist');
  const students = DB.get('students');
  const classes  = DB.get('classes');

  // ── Stats ──
  const totalValue    = items.reduce((s,it)=>{ const stock=_invAvailable(it.id,stocks,dists); return s+(stock*Number(it.price||0)); },0);
  const totalDistVal  = dists.reduce((s,d)=>s+Number(d.totalPrice||0),0);
  const totalItems    = items.length;
  const pendingCount  = _invPendingCount(items,dists,students);

  document.getElementById('section-inventory').innerHTML=`
  <div class="page-header">
    <div><h2>📦 Inventory Management</h2><p class="page-sub">Manage books, uniforms &amp; school supplies — track stock and distribution</p></div>
    <button class="btn btn-primary" onclick="openAddItemModal()">➕ Add Item</button>
  </div>

  <!-- Stats -->
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:14px;margin-bottom:22px;">
    <div class="card" style="padding:16px;text-align:center;">
      <div style="font-size:26px;font-weight:800;color:#7c3aed;">${totalItems}</div>
      <div style="color:#64748b;font-size:12px;margin-top:3px;">Total Items</div>
    </div>
    <div class="card" style="padding:16px;text-align:center;">
      <div style="font-size:26px;font-weight:800;color:#0ea5e9;">₹${totalValue.toLocaleString()}</div>
      <div style="color:#64748b;font-size:12px;margin-top:3px;">Stock Value</div>
    </div>
    <div class="card" style="padding:16px;text-align:center;">
      <div style="font-size:26px;font-weight:800;color:#10b981;">₹${totalDistVal.toLocaleString()}</div>
      <div style="color:#64748b;font-size:12px;margin-top:3px;">Distributed Value</div>
    </div>
    <div class="card" style="padding:16px;text-align:center;">
      <div style="font-size:26px;font-weight:800;color:#f59e0b;">${pendingCount}</div>
      <div style="color:#64748b;font-size:12px;margin-top:3px;">Pending Distribution</div>
    </div>
  </div>

  <!-- Tabs -->
  <div style="display:flex;gap:8px;margin-bottom:18px;flex-wrap:wrap;">
    ${[['items','📋 Items','items'],['stock','📥 Stock In','stock'],['distributions','📤 Distributions','distributions'],['pending','⏳ Pending','pending']].map(([id,label])=>`
      <button onclick="_invTab='${id}';renderInventory()"
        style="padding:8px 18px;border-radius:8px;border:1.5px solid ${_invTab===id?'#7c3aed':'rgba(255,255,255,.1)'};background:${_invTab===id?'rgba(124,58,237,.2)':'rgba(255,255,255,.04)'};color:${_invTab===id?'#a78bfa':'rgba(255,255,255,.5)'};font-weight:${_invTab===id?'700':'500'};font-size:13px;cursor:pointer;">
        ${label}
      </button>`).join('')}
  </div>

  <!-- Tab content -->
  <div id="inv-tab-content">
    ${_invTab==='items'         ? _invItemsTab(items,stocks,dists,classes)        : ''}
    ${_invTab==='stock'         ? _invStockTab(items,stocks)                       : ''}
    ${_invTab==='distributions' ? _invDistsTab(items,dists,students,classes)       : ''}
    ${_invTab==='pending'       ? _invPendingTab(items,dists,students,classes)     : ''}
  </div>`;
}

// ── Helpers ──────────────────────────────────────────
function _invTotalStock(itemId, stocks){
  return stocks.filter(s=>s.itemId===itemId).reduce((s,x)=>s+Number(x.qty||0),0);
}
function _invDistributed(itemId, dists){
  return dists.filter(d=>d.itemId===itemId).reduce((s,x)=>s+Number(x.qty||0),0);
}
function _invAvailable(itemId, stocks, dists){
  return Math.max(0, _invTotalStock(itemId,stocks) - _invDistributed(itemId,dists));
}
function _invPendingCount(items, dists, students){
  // Count students who haven't received at least one item
  let count=0;
  items.forEach(it=>{
    if(!it.targetClassIds||!it.targetClassIds.length) return;
    const targetStudents = students.filter(s=>it.targetClassIds.includes(s.classId));
    const received = new Set(dists.filter(d=>d.itemId===it.id).map(d=>d.studentId));
    count += targetStudents.filter(s=>!received.has(s.id)).length;
  });
  return count;
}

// ── Tab: Items ────────────────────────────────────────
function _invItemsTab(items, stocks, dists, classes){
  if(!items.length) return `<div class="card"><div class="card-body">
    <div class="empty-state"><div class="e-icon">📦</div><h3>No Items Yet</h3><p>Click "Add Item" to add books or uniforms.</p></div>
  </div></div>`;

  const catIcon = {book:'📚', uniform:'👕', stationery:'✏️', other:'📦'};
  return `<div class="card">
    <div class="card-header"><h3>📋 All Inventory Items (${items.length})</h3></div>
    <div class="card-body" style="padding:0;overflow-x:auto;">
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead>
          <tr style="background:rgba(124,58,237,.08);border-bottom:1px solid rgba(255,255,255,.08);">
            <th style="padding:12px 16px;text-align:left;color:#64748b;font-weight:600;">Item</th>
            <th style="padding:12px 16px;text-align:left;color:#64748b;font-weight:600;">Category</th>
            <th style="padding:12px 16px;text-align:left;color:#64748b;font-weight:600;">Classes</th>
            <th style="padding:12px 12px;text-align:center;color:#64748b;font-weight:600;">Price</th>
            <th style="padding:12px 12px;text-align:center;color:#64748b;font-weight:600;">Total Stock</th>
            <th style="padding:12px 12px;text-align:center;color:#64748b;font-weight:600;">Distributed</th>
            <th style="padding:12px 12px;text-align:center;color:#64748b;font-weight:600;">Available</th>
            <th style="padding:12px 12px;text-align:center;color:#64748b;font-weight:600;">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(it=>{
            const tot  = _invTotalStock(it.id,stocks);
            const dist = _invDistributed(it.id,dists);
            const avail= Math.max(0, tot-dist);
            const clsNames = it.targetClassIds?.length
              ? classes.filter(c=>it.targetClassIds.includes(c.id)).map(c=>c.name).join(', ')
              : '<span style="color:#94a3b8;">All Classes</span>';
            const availColor = avail===0?'#ef4444': avail<5?'#f59e0b':'#10b981';
            return `<tr style="border-bottom:1px solid rgba(255,255,255,.05);">
              <td style="padding:12px 16px;">
                <div style="font-weight:700;color:#1e293b;">${catIcon[it.category]||'📦'} ${it.name}</div>
                ${it.description?`<div style="font-size:11px;color:#64748b;margin-top:2px;">${it.description}</div>`:''}
              </td>
              <td style="padding:12px 16px;">
                <span style="background:rgba(124,58,237,.1);color:#7c3aed;border-radius:20px;padding:2px 10px;font-size:11px;font-weight:700;text-transform:capitalize;">${it.category||'other'}</span>
              </td>
              <td style="padding:12px 16px;font-size:12px;color:#475569;">${clsNames}</td>
              <td style="padding:12px;text-align:center;font-weight:700;color:#1e293b;">₹${Number(it.price||0).toLocaleString()}</td>
              <td style="padding:12px;text-align:center;font-weight:700;color:#475569;">${tot}</td>
              <td style="padding:12px;text-align:center;font-weight:700;color:#0ea5e9;">${dist}</td>
              <td style="padding:12px;text-align:center;">
                <span style="font-weight:800;color:${availColor};">${avail}</span>
              </td>
              <td style="padding:12px;text-align:center;">
                <div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;">
                  <button onclick="openAddStockModal('${it.id}')" style="background:rgba(16,185,129,.12);color:#10b981;border:1px solid rgba(16,185,129,.3);border-radius:6px;padding:4px 10px;font-size:11px;font-weight:700;cursor:pointer;">📥 Stock</button>
                  <button onclick="openGiveItemModal('${it.id}')" style="background:rgba(14,165,233,.1);color:#0ea5e9;border:1px solid rgba(14,165,233,.3);border-radius:6px;padding:4px 10px;font-size:11px;font-weight:700;cursor:pointer;">📤 Give</button>
                  <button onclick="editInvItem('${it.id}')" style="background:rgba(255,255,255,.06);color:rgba(255,255,255,.5);border:1px solid rgba(255,255,255,.1);border-radius:6px;padding:4px 8px;font-size:11px;cursor:pointer;">✏️</button>
                  <button onclick="deleteInvItem('${it.id}')" style="background:rgba(239,68,68,.08);color:#ef4444;border:1px solid rgba(239,68,68,.2);border-radius:6px;padding:4px 8px;font-size:11px;cursor:pointer;">🗑️</button>
                </div>
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

// ── Tab: Stock In ─────────────────────────────────────
function _invStockTab(items, stocks){
  const sorted = [...stocks].sort((a,b)=>b.createdAt-a.createdAt);
  return `
  <div style="display:flex;justify-content:flex-end;margin-bottom:14px;">
    <button class="btn btn-primary btn-sm" onclick="openAddStockModal('')">📥 Add Stock</button>
  </div>
  <div class="card">
    <div class="card-header"><h3>📥 Stock History (${stocks.length} entries)</h3></div>
    <div class="card-body" style="padding:0;overflow-x:auto;">
      ${!stocks.length?'<div class="empty-state"><div class="e-icon">📥</div><h3>No Stock Recorded</h3><p>Add stock when you receive items.</p></div>':`
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead>
          <tr style="background:rgba(16,185,129,.06);border-bottom:1px solid rgba(255,255,255,.08);">
            <th style="padding:11px 16px;text-align:left;color:#64748b;font-weight:600;">Date</th>
            <th style="padding:11px 16px;text-align:left;color:#64748b;font-weight:600;">Item</th>
            <th style="padding:11px 12px;text-align:center;color:#64748b;font-weight:600;">Qty Added</th>
            <th style="padding:11px 16px;text-align:left;color:#64748b;font-weight:600;">Supplier</th>
            <th style="padding:11px 16px;text-align:left;color:#64748b;font-weight:600;">Note</th>
            <th style="padding:11px 12px;text-align:center;color:#64748b;font-weight:600;">By</th>
          </tr>
        </thead>
        <tbody>
          ${sorted.map(s=>{
            const it = items.find(x=>x.id===s.itemId);
            return `<tr style="border-bottom:1px solid rgba(255,255,255,.05);">
              <td style="padding:10px 16px;color:#64748b;">${formatDate(s.date)}</td>
              <td style="padding:10px 16px;font-weight:600;color:#1e293b;">${it?it.name:'Unknown Item'}</td>
              <td style="padding:10px 12px;text-align:center;font-weight:800;color:#10b981;">+${s.qty}</td>
              <td style="padding:10px 16px;color:#64748b;">${s.supplier||'—'}</td>
              <td style="padding:10px 16px;color:#94a3b8;font-size:12px;">${s.note||'—'}</td>
              <td style="padding:10px 12px;text-align:center;color:#64748b;font-size:12px;">${s.addedBy||'Admin'}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>`}
    </div>
  </div>`;
}

// ── Tab: Distributions ────────────────────────────────
function _invDistsTab(items, dists, students, classes){
  const sorted = [...dists].sort((a,b)=>b.createdAt-a.createdAt);
  return `
  <div style="display:flex;justify-content:flex-end;margin-bottom:14px;">
    <button class="btn btn-primary btn-sm" onclick="openGiveItemModal('')">📤 Give Item to Student</button>
  </div>
  <div class="card">
    <div class="card-header"><h3>📤 Distribution History (${dists.length} records)</h3></div>
    <div class="card-body" style="padding:0;overflow-x:auto;">
      ${!dists.length?'<div class="empty-state"><div class="e-icon">📤</div><h3>No Distributions Yet</h3><p>Give items to students and receipts will appear here.</p></div>':`
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead>
          <tr style="background:rgba(14,165,233,.06);border-bottom:1px solid rgba(255,255,255,.08);">
            <th style="padding:11px 16px;text-align:left;color:#64748b;font-weight:600;">Date</th>
            <th style="padding:11px 16px;text-align:left;color:#64748b;font-weight:600;">Student</th>
            <th style="padding:11px 16px;text-align:left;color:#64748b;font-weight:600;">Class</th>
            <th style="padding:11px 16px;text-align:left;color:#64748b;font-weight:600;">Item(s)</th>
            <th style="padding:11px 12px;text-align:center;color:#64748b;font-weight:600;">Qty</th>
            <th style="padding:11px 12px;text-align:center;color:#64748b;font-weight:600;">Total</th>
            <th style="padding:11px 12px;text-align:center;color:#64748b;font-weight:600;">Receipt</th>
          </tr>
        </thead>
        <tbody>
          ${sorted.map((d,i)=>{
            const stu  = students.find(s=>s.id===d.studentId);
            const cls  = stu ? classes.find(c=>c.id===stu.classId) : null;
            const it   = items.find(x=>x.id===d.itemId);
            return `<tr style="border-bottom:1px solid rgba(255,255,255,.05);">
              <td style="padding:10px 16px;color:#64748b;">${formatDate(d.date)}</td>
              <td style="padding:10px 16px;font-weight:700;color:#1e293b;">${stu?.name||'—'}</td>
              <td style="padding:10px 16px;color:#64748b;font-size:12px;">${cls?.name||'—'}</td>
              <td style="padding:10px 16px;color:#475569;">${it?.name||'—'}</td>
              <td style="padding:10px 12px;text-align:center;font-weight:700;color:#475569;">${d.qty}</td>
              <td style="padding:10px 12px;text-align:center;font-weight:700;color:#10b981;">₹${Number(d.totalPrice||0).toLocaleString()}</td>
              <td style="padding:10px 12px;text-align:center;">
                <button onclick="printInvReceipt('${d.id}')" style="background:rgba(99,102,241,.12);color:#a78bfa;border:1px solid rgba(99,102,241,.3);border-radius:6px;padding:4px 10px;font-size:11px;font-weight:700;cursor:pointer;">🧾 Receipt</button>
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>`}
    </div>
  </div>`;
}

// ── Tab: Pending ──────────────────────────────────────
function _invPendingTab(items, dists, students, classes){
  const targetItems = items.filter(it=>it.targetClassIds && it.targetClassIds.length);
  if(!targetItems.length) return `<div class="card"><div class="card-body">
    <div class="empty-state"><div class="e-icon">✅</div><h3>No Target Classes Set</h3>
    <p>Edit items and assign target classes to track pending distribution.</p></div></div></div>`;

  let html = '';
  targetItems.forEach(it=>{
    const targetStudents = students.filter(s=>it.targetClassIds.includes(s.classId));
    const received = new Set(dists.filter(d=>d.itemId===it.id).map(d=>d.studentId));
    const pending  = targetStudents.filter(s=>!received.has(s.id));
    const done     = targetStudents.filter(s=>received.has(s.id));
    if(!targetStudents.length) return;

    html += `
    <div class="card" style="margin-bottom:16px;">
      <div class="card-header" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
        <h3>📦 ${it.name} <span style="font-size:12px;color:#64748b;font-weight:400;">₹${Number(it.price).toLocaleString()} · ${it.category}</span></h3>
        <div style="display:flex;gap:10px;align-items:center;">
          <span style="background:rgba(239,68,68,.1);color:#ef4444;border-radius:20px;padding:3px 12px;font-size:12px;font-weight:700;">⏳ ${pending.length} Pending</span>
          <span style="background:rgba(16,185,129,.1);color:#10b981;border-radius:20px;padding:3px 12px;font-size:12px;font-weight:700;">✅ ${done.length} Done</span>
        </div>
      </div>
      <div class="card-body" style="padding:0;">
        ${pending.length===0
          ? '<div style="padding:16px;text-align:center;color:#10b981;font-weight:700;">🎉 All students have received this item!</div>'
          : `<div style="padding:12px 16px;font-size:11.5px;color:#64748b;font-weight:600;border-bottom:1px solid rgba(255,255,255,.06);">PENDING — ${pending.length} students not yet received:</div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:0;">
              ${pending.map(s=>{
                const cls=classes.find(c=>c.id===s.classId);
                return `<div style="padding:10px 16px;border-bottom:1px solid rgba(255,255,255,.04);display:flex;align-items:center;justify-content:space-between;">
                  <div>
                    <div style="font-weight:600;color:#1e293b;font-size:13px;">${s.name}</div>
                    <div style="font-size:11px;color:#64748b;">${cls?.name||''} · Roll: ${s.rollNo||'—'}</div>
                  </div>
                  <button onclick="openGiveItemModal('${it.id}','${s.id}')"
                    style="background:rgba(14,165,233,.1);color:#0ea5e9;border:1px solid rgba(14,165,233,.3);border-radius:6px;padding:3px 9px;font-size:11px;font-weight:700;cursor:pointer;flex-shrink:0;">
                    📤 Give
                  </button>
                </div>`;
              }).join('')}
            </div>`}
      </div>
    </div>`;
  });
  return html || '<div class="card"><div class="card-body"><div class="empty-state"><div class="e-icon">✅</div><h3>All Distributed!</h3></div></div></div>';
}

// ── Add / Edit Item Modal ──────────────────────────────
function openAddItemModal(editId=''){
  const classes = DB.get('classes');
  const item    = editId ? DB.get('inv_items').find(x=>x.id===editId) : null;
  const checked = (id)=> item?.targetClassIds?.includes(id) ? 'checked' : '';

  buildModal('invItemModal', editId?'✏️ Edit Item':'📦 Add New Item', `
    <div class="form-grid-2">
      <div class="form-group" style="grid-column:1/-1;">
        <label class="form-label">Item Name *</label>
        <input class="form-control" id="inv-name" value="${item?.name||''}" placeholder="e.g. Class 6 English Book, School Shirt (M)">
      </div>
      <div class="form-group">
        <label class="form-label">Category *</label>
        <select class="form-control" id="inv-cat">
          <option value="book"       ${item?.category==='book'      ?'selected':''}>📚 Book</option>
          <option value="uniform"    ${item?.category==='uniform'   ?'selected':''}>👕 Uniform</option>
          <option value="stationery" ${item?.category==='stationery'?'selected':''}>✏️ Stationery</option>
          <option value="other"      ${item?.category==='other'     ?'selected':''}>📦 Other</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Price per Unit (₹) *</label>
        <input class="form-control" type="number" id="inv-price" value="${item?.price||''}" placeholder="e.g. 150" min="0">
      </div>
      <div class="form-group" style="grid-column:1/-1;">
        <label class="form-label">Description <span style="color:#94a3b8;font-size:11px;">(optional)</span></label>
        <input class="form-control" id="inv-desc" value="${item?.description||''}" placeholder="e.g. NCERT Textbook, Blue Shirt Full Sleeve">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">🏫 Target Classes <span style="color:#94a3b8;font-size:11px;">(select classes this item is meant for — used for pending tracking)</span></label>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px;padding:12px;background:rgba(255,255,255,.03);border-radius:8px;border:1px solid rgba(255,255,255,.08);">
        ${classes.map(c=>`
          <label style="display:flex;align-items:center;gap:7px;font-size:13px;cursor:pointer;color:rgba(255,255,255,.7);">
            <input type="checkbox" id="inv-cls-${c.id}" ${checked(c.id)} style="accent-color:#7c3aed;width:15px;height:15px;">
            ${c.name}
          </label>`).join('')}
        ${!classes.length?'<div style="color:#94a3b8;font-size:12px;">No classes created yet.</div>':''}
      </div>
    </div>
    ${!editId?`
    <hr style="border-color:rgba(255,255,255,.08);margin:16px 0;">
    <div class="form-group">
      <label class="form-label">📥 Initial Stock Quantity <span style="color:#94a3b8;font-size:11px;">(optional — can add more later)</span></label>
      <input class="form-control" type="number" id="inv-init-stock" placeholder="e.g. 100" min="0">
    </div>`:''}
  `, ()=>saveInvItem(editId, classes), 'lg');
}

function saveInvItem(editId, classes){
  const name  = (document.getElementById('inv-name')?.value||'').trim();
  const price = Number(document.getElementById('inv-price')?.value||0);
  const cat   = document.getElementById('inv-cat')?.value||'other';
  const desc  = (document.getElementById('inv-desc')?.value||'').trim();
  if(!name)  { toast('Item name is required','warning'); return; }
  if(!price) { toast('Price is required','warning'); return; }

  const targetClassIds = classes.filter(c=>document.getElementById('inv-cls-'+c.id)?.checked).map(c=>c.id);

  if(editId){
    DB.update('inv_items', editId, {name,price,category:cat,description:desc,targetClassIds});
    closeAllModals();
    toast('✅ Item updated!','success');
  } else {
    const initStock = Number(document.getElementById('inv-init-stock')?.value||0);
    const id = genId('inv');
    DB.push('inv_items',{id,name,price,category:cat,description:desc,targetClassIds,createdAt:Date.now()});
    if(initStock>0){
      DB.push('inv_stock',{id:genId('stk'),itemId:id,qty:initStock,date:today(),supplier:'',note:'Initial stock',addedBy:CU.name,createdAt:Date.now()});
    }
    closeAllModals();
    toast(`📦 "${name}" added to inventory!`,'success');
  }
  renderInventory();
}

function editInvItem(id){ openAddItemModal(id); }

function deleteInvItem(id){
  const it = DB.get('inv_items').find(x=>x.id===id);
  if(!it) return;
  if(!confirm(`Delete "${it.name}" from inventory?\n\nAll stock and distribution records will also be removed.`)) return;
  DB.set('inv_items',  DB.get('inv_items').filter(x=>x.id!==id));
  DB.set('inv_stock',  DB.get('inv_stock').filter(x=>x.itemId!==id));
  DB.set('inv_dist',   DB.get('inv_dist').filter(x=>x.itemId!==id));
  toast('🗑️ Item deleted','info');
  renderInventory();
}

// ── Add Stock Modal ───────────────────────────────────
function openAddStockModal(preItemId=''){
  const items = DB.get('inv_items');
  if(!items.length){ toast('Add at least one item first','warning'); return; }
  buildModal('invStockModal','📥 Add Stock', `
    <div class="form-group">
      <label class="form-label">Item *</label>
      <select class="form-control" id="stk-item">
        <option value="">— Select Item —</option>
        ${items.map(it=>`<option value="${it.id}" ${it.id===preItemId?'selected':''}>${it.name} (₹${it.price})</option>`).join('')}
      </select>
    </div>
    <div class="form-grid-2">
      <div class="form-group">
        <label class="form-label">Quantity Received *</label>
        <input class="form-control" type="number" id="stk-qty" placeholder="e.g. 50" min="1">
      </div>
      <div class="form-group">
        <label class="form-label">Date Received</label>
        <input class="form-control" type="date" id="stk-date" value="${today()}">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Supplier / Source <span style="color:#94a3b8;font-size:11px;">(optional)</span></label>
      <input class="form-control" id="stk-supplier" placeholder="e.g. ABC Books Pvt. Ltd.">
    </div>
    <div class="form-group">
      <label class="form-label">Note <span style="color:#94a3b8;font-size:11px;">(optional)</span></label>
      <input class="form-control" id="stk-note" placeholder="e.g. Academic Year 2026-27 stock">
    </div>
  `, saveInvStock);
}

function saveInvStock(){
  const itemId   = document.getElementById('stk-item')?.value;
  const qty      = Number(document.getElementById('stk-qty')?.value||0);
  const date     = document.getElementById('stk-date')?.value||today();
  const supplier = (document.getElementById('stk-supplier')?.value||'').trim();
  const note     = (document.getElementById('stk-note')?.value||'').trim();
  if(!itemId){ toast('Please select an item','warning'); return; }
  if(!qty||qty<1){ toast('Quantity must be at least 1','warning'); return; }
  DB.push('inv_stock',{id:genId('stk'),itemId,qty,date,supplier,note,addedBy:CU.name,createdAt:Date.now()});
  closeAllModals();
  const it=DB.get('inv_items').find(x=>x.id===itemId);
  toast(`📥 ${qty} units of "${it?.name}" added to stock!`,'success');
  _invTab='stock';
  renderInventory();
}

// ── Give Item to Student Modal ────────────────────────
function openGiveItemModal(preItemId='', preStudentId=''){
  const items    = DB.get('inv_items');
  const stocks   = DB.get('inv_stock');
  const dists    = DB.get('inv_dist');
  const students = DB.get('students');
  const classes  = DB.get('classes');
  if(!items.length){ toast('Add at least one item first','warning'); return; }

  buildModal('invGiveModal','📤 Give Item to Student', `
    <div class="form-group">
      <label class="form-label">📦 Item *</label>
      <select class="form-control" id="giv-item" onchange="_invGiveItemChange()">
        <option value="">— Select Item —</option>
        ${items.map(it=>{
          const avail = _invAvailable(it.id,stocks,dists);
          return `<option value="${it.id}" ${it.id===preItemId?'selected':''}>${it.name} — ₹${Number(it.price).toLocaleString()} (${avail} available)</option>`;
        }).join('')}
      </select>
      <div id="giv-stock-info" style="margin-top:6px;font-size:12px;color:#64748b;"></div>
    </div>
    <div class="form-group">
      <label class="form-label">🏫 Class</label>
      <select class="form-control" id="giv-class" onchange="_invGiveClassChange()">
        <option value="">— Select Class —</option>
        ${classes.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">👤 Student *</label>
      <select class="form-control" id="giv-student" onchange="_invGiveStudentChange()">
        <option value="">— Select Class First —</option>
      </select>
      <div id="giv-already-note" style="display:none;margin-top:6px;padding:7px 12px;background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.3);border-radius:8px;font-size:12px;color:#f59e0b;font-weight:600;">
        ⚠️ This student has already received this item!
      </div>
    </div>
    <div class="form-grid-2">
      <div class="form-group">
        <label class="form-label">Quantity *</label>
        <input class="form-control" type="number" id="giv-qty" value="1" min="1" oninput="_invGiveTotalPreview()">
      </div>
      <div class="form-group">
        <label class="form-label">Price per Unit (₹)</label>
        <input class="form-control" type="number" id="giv-price" placeholder="Auto from item" min="0" oninput="_invGiveTotalPreview()">
      </div>
    </div>
    <div id="giv-total-preview" style="display:none;background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.2);border-radius:8px;padding:10px 14px;margin-bottom:12px;font-size:13px;color:#10b981;font-weight:700;"></div>
    <div class="form-group">
      <label class="form-label">📅 Date</label>
      <input class="form-control" type="date" id="giv-date" value="${today()}">
    </div>
    <div class="form-group">
      <label class="form-label">Note <span style="color:#94a3b8;font-size:11px;">(optional)</span></label>
      <input class="form-control" id="giv-note" placeholder="e.g. Paid in cash, Given during assembly">
    </div>
  `, saveInvGive, 'lg');

  // Pre-fill if called from pending tab
  if(preItemId){
    setTimeout(()=>{
      const sel=document.getElementById('giv-item');
      if(sel){ sel.value=preItemId; _invGiveItemChange(); }
      if(preStudentId){
        const stu=students.find(s=>s.id===preStudentId);
        if(stu){
          const clsSel=document.getElementById('giv-class');
          if(clsSel){ clsSel.value=stu.classId; _invGiveClassChange(preStudentId); }
        }
      }
    },80);
  }
}

window._invGiveItemChange=function(){
  const items  = DB.get('inv_items');
  const stocks = DB.get('inv_stock');
  const dists  = DB.get('inv_dist');
  const itemId = document.getElementById('giv-item')?.value;
  const it     = items.find(x=>x.id===itemId);
  const info   = document.getElementById('giv-stock-info');
  const priceEl= document.getElementById('giv-price');
  if(it){ if(priceEl) priceEl.value=it.price||0;
    const avail=_invAvailable(it.id,stocks,dists);
    if(info) info.innerHTML=`<span style="color:${avail>0?'#10b981':'#ef4444'};font-weight:700;">${avail} units available in stock</span>`;
  } else { if(info) info.textContent=''; }
  _invGiveTotalPreview();
};
window._invGiveClassChange=function(preStudentId=''){
  const classId=document.getElementById('giv-class')?.value;
  const students=classId?DB.get('students').filter(s=>s.classId===classId):[];
  const sel=document.getElementById('giv-student');
  if(sel) sel.innerHTML=students.length
    ?students.map(s=>`<option value="${s.id}" ${s.id===preStudentId?'selected':''}>${s.name} (Roll: ${s.rollNo||'—'})</option>`).join('')
    :'<option value="">No students in this class</option>';
  _invGiveStudentChange();
};
window._invGiveStudentChange=function(){
  const itemId=document.getElementById('giv-item')?.value;
  const stuId=document.getElementById('giv-student')?.value;
  const note=document.getElementById('giv-already-note');
  if(note) note.style.display='none';
  if(!itemId||!stuId) return;
  const alreadyGiven=DB.get('inv_dist').some(d=>d.itemId===itemId&&d.studentId===stuId);
  if(note&&alreadyGiven) note.style.display='block';
};
window._invGiveTotalPreview=function(){
  const qty=Number(document.getElementById('giv-qty')?.value||1);
  const price=Number(document.getElementById('giv-price')?.value||0);
  const prev=document.getElementById('giv-total-preview');
  if(prev&&qty&&price){
    prev.style.display='block';
    prev.textContent=`Total: ₹${price.toLocaleString()} × ${qty} = ₹${(price*qty).toLocaleString()}`;
  } else if(prev){ prev.style.display='none'; }
};

function saveInvGive(){
  const itemId  =document.getElementById('giv-item')?.value;
  const stuId   =document.getElementById('giv-student')?.value;
  const qty     =Number(document.getElementById('giv-qty')?.value||0);
  const unitPrice=Number(document.getElementById('giv-price')?.value||0);
  const date    =document.getElementById('giv-date')?.value||today();
  const note    =(document.getElementById('giv-note')?.value||'').trim();
  if(!itemId)  { toast('Please select an item','warning');   return; }
  if(!stuId)   { toast('Please select a student','warning'); return; }
  if(!qty||qty<1){ toast('Quantity must be at least 1','warning'); return; }

  // Stock check
  const stocks=DB.get('inv_stock'), dists=DB.get('inv_dist');
  const avail=_invAvailable(itemId,stocks,dists);
  if(qty>avail){ toast(`❌ Only ${avail} units available in stock!`,'error'); return; }

  const items=DB.get('inv_items');
  const it=items.find(x=>x.id===itemId);
  const stu=DB.get('students').find(s=>s.id===stuId);

  // Generate receipt number
  const rNo = 'INV-'+new Date().getFullYear()+'-'+String(DB.get('inv_dist').length+1).padStart(4,'0');

  const distRecord = {
    id: genId('dst'), receiptNo:rNo,
    itemId, studentId:stuId,
    qty, unitPrice, totalPrice:qty*unitPrice,
    date, note,
    givenBy:CU.name,
    itemName:it?.name||'',
    studentName:stu?.name||'',
    createdAt:Date.now()
  };
  DB.push('inv_dist', distRecord);
  closeAllModals();
  toast(`✅ "${it?.name}" given to ${stu?.name}!`,'success');
  // Auto-print receipt
  printInvReceipt(distRecord.id);
  _invTab='distributions';
  renderInventory();
}

// ── Print Inventory Receipt ───────────────────────────
function printInvReceipt(distId){
  const d   = DB.get('inv_dist').find(x=>x.id===distId);
  if(!d)    { toast('Record not found','error'); return; }
  const stu = DB.get('students').find(s=>s.id===d.studentId)||{};
  const cls = DB.get('classes').find(c=>c.id===stu.classId)||{};
  const it  = DB.get('inv_items').find(x=>x.id===d.itemId)||{};
  const s   = getSettings();
  const catIcon={book:'📚',uniform:'👕',stationery:'✏️',other:'📦'};
  const fmtMoney=n=>'₹'+Number(n||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});
  const fmtDate=dt=>{try{return new Date(dt).toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'});}catch{return dt||'';} };

  const css=`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
    *{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:'Inter',sans-serif;background:#f8fafc;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
    .wrap{max-width:560px;margin:30px auto;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.1);}
    .hdr{background:linear-gradient(135deg,#0f172a,#1e3a8a 60%,#0ea5e9);padding:26px 32px;display:flex;justify-content:space-between;align-items:flex-start;}
    .hdr-left .school{font-size:17px;font-weight:800;color:#fff;}
    .hdr-left .sub{font-size:10px;color:rgba(255,255,255,.5);margin-top:2px;}
    .hdr-right{text-align:right;}
    .hdr-right .doc{font-size:14px;font-weight:800;color:#fff;text-transform:uppercase;letter-spacing:.06em;}
    .hdr-right .rno{font-size:11px;color:rgba(255,255,255,.55);margin-top:4px;}
    .hdr-right .rdate{font-size:11px;color:rgba(255,255,255,.45);margin-top:2px;}
    .body{padding:24px 32px;}
    .sec-label{font-size:9px;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:.1em;margin-bottom:10px;}
    .two-col{display:grid;grid-template-columns:1fr 1fr;gap:0;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin-bottom:18px;}
    .col{padding:16px 18px;}
    .col:first-child{border-right:1px solid #e2e8f0;}
    .col-name{font-size:15px;font-weight:800;color:#0f172a;margin-bottom:6px;}
    .col-det{font-size:11.5px;color:#64748b;line-height:1.9;}
    .col-det strong{color:#334155;}
    .item-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px 18px;margin-bottom:18px;}
    .item-row{display:flex;justify-content:space-between;align-items:center;padding:6px 0;font-size:13px;}
    .item-row:not(:last-child){border-bottom:1px dashed #e2e8f0;}
    .item-label{color:#64748b;}
    .item-val{font-weight:700;color:#1e293b;}
    .total-box{background:linear-gradient(90deg,rgba(79,70,229,.06),rgba(14,165,233,.06));border:1px solid rgba(79,70,229,.12);border-radius:10px;padding:14px 18px;display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;}
    .total-label{font-size:13px;font-weight:700;color:#334155;}
    .total-val{font-size:20px;font-weight:900;color:#4f46e5;}
    .paid-badge{background:#d1fae5;color:#065f46;border-radius:20px;padding:4px 14px;font-size:11px;font-weight:800;letter-spacing:.04em;}
    .footer-note{font-size:10px;color:#94a3b8;line-height:1.7;padding-top:16px;border-top:1px solid #e2e8f0;}
    .sig-row{display:flex;justify-content:space-between;align-items:flex-end;margin-top:20px;padding-top:14px;border-top:1px solid #e2e8f0;}
    .sig-left{font-size:10px;color:#94a3b8;}
    .sig-right{text-align:right;}
    .sig-line{border-top:1.5px solid #334155;width:150px;margin-bottom:5px;}
    .sig-name{font-size:12px;font-weight:700;color:#1e293b;}
    .sig-title{font-size:10px;color:#64748b;}
    @media print{body{background:#fff;}.wrap{box-shadow:none;border-radius:0;margin:0;max-width:100%;}}
  `;

  const html=`<div class="wrap">
    <div class="hdr">
      <div class="hdr-left">
        <div class="school">🏫 ${s.schoolName||'School Name'}</div>
        <div class="sub">Inventory Distribution Receipt</div>
      </div>
      <div class="hdr-right">
        <div class="doc">Receipt</div>
        <div class="rno"># ${d.receiptNo||d.id}</div>
        <div class="rdate">📅 ${fmtDate(d.date)}</div>
      </div>
    </div>
    <div class="body">
      <!-- Student & Item info -->
      <div class="two-col">
        <div class="col">
          <div class="sec-label">Student Details</div>
          <div class="col-name">${stu.name||'—'}</div>
          <div class="col-det">
            <strong>Class:</strong> ${cls.name||'—'}<br>
            <strong>Roll No:</strong> ${stu.rollNo||'—'}<br>
            <strong>Adm No:</strong> ${stu.admNo||'—'}
          </div>
        </div>
        <div class="col">
          <div class="sec-label">Item Details</div>
          <div class="col-name">${catIcon[it.category]||'📦'} ${it.name||d.itemName||'—'}</div>
          <div class="col-det">
            <strong>Category:</strong> ${it.category||'—'}<br>
            <strong>Given By:</strong> ${d.givenBy||'Admin'}<br>
            <strong>Date:</strong> ${fmtDate(d.date)}
          </div>
        </div>
      </div>

      <!-- Pricing -->
      <div class="sec-label" style="margin-bottom:10px;">Pricing Breakdown</div>
      <div class="item-box">
        <div class="item-row"><span class="item-label">Item Name</span><span class="item-val">${it.name||d.itemName}</span></div>
        <div class="item-row"><span class="item-label">Unit Price</span><span class="item-val">${fmtMoney(d.unitPrice)}</span></div>
        <div class="item-row"><span class="item-label">Quantity</span><span class="item-val">${d.qty} unit(s)</span></div>
      </div>
      <div class="total-box">
        <div>
          <div class="total-label">Total Amount</div>
          <div style="font-size:11px;color:#64748b;margin-top:2px;">${d.qty} × ${fmtMoney(d.unitPrice)}</div>
        </div>
        <div style="text-align:right;">
          <div class="total-val">${fmtMoney(d.totalPrice)}</div>
          <span class="paid-badge">✅ RECEIVED</span>
        </div>
      </div>

      ${d.note?`<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px 14px;font-size:12px;color:#64748b;margin-bottom:16px;"><strong>Note:</strong> ${d.note}</div>`:''}

      <div class="footer-note">
        • This is an official inventory distribution receipt issued by ${s.schoolName||'the school'}.<br>
        • Please retain this receipt for your records.<br>
        • For any queries, contact the school administration.
      </div>

      <div class="sig-row">
        <div class="sig-left">Receipt No: <strong>${d.receiptNo||d.id}</strong><br>Generated: ${fmtDate(today())}</div>
        <div class="sig-right">
          <div class="sig-line"></div>
          <div class="sig-name">${d.givenBy||'Administrator'}</div>
          <div class="sig-title">Authorized Signatory — ${s.schoolName||'School'}</div>
        </div>
      </div>
    </div>
  </div>`;

  printHtml(html, `Inventory Receipt ${d.receiptNo||''} — ${stu.name||''}`, css);
}

// ══════════════════════════════════════════════════════
//  SETTINGS  (includes Teacher Permissions)
// ══════════════════════════════════════════════════════
function renderSettings(){
  const s=getSettings();
  document.getElementById('section-settings').innerHTML=`
  <div class="page-header"><div><h2>Settings</h2></div></div>

  <div class="card mb-24">
    <div class="card-header"><h3>🎚️ Customize Menu</h3></div>
    <div class="card-body" style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
      <div style="font-size:.86rem;color:var(--text-2);max-width:520px;">Show only the features you use and ⭐ pin your favorites to the top of the sidebar. Keep your menu simple and easy to use.</div>
      <button class="btn btn-primary" onclick="openSidebarCustomize()">🎚️ Customize Sidebar Menu</button>
    </div>
  </div>

  <div class="card mb-24">
    <div class="card-header"><h3>🏫 School Information</h3></div>
    <div class="card-body">
      <div class="form-row">
        <div class="form-group"><label class="form-label">School Name</label>
          <input class="form-control" id="set-name" value="${s.schoolName||''}"></div>
        <div class="form-group"><label class="form-label">Tagline</label>
          <input class="form-control" id="set-tag" value="${s.schoolTagline||''}"></div>
      </div>
      <div class="form-group"><label class="form-label">Address</label>
        <input class="form-control" id="set-addr" value="${s.schoolAddress||''}"></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Phone</label>
          <input class="form-control" id="set-phone" value="${s.schoolPhone||''}"></div>
        <div class="form-group"><label class="form-label">Email</label>
          <input class="form-control" id="set-email" value="${s.schoolEmail||''}"></div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">📅 Session Year <span style="color:#94a3b8;font-weight:400;font-size:11px;">(e.g. 2025-2026)</span></label>
          <div style="display:flex;gap:8px;align-items:center;">
            <input class="form-control" id="set-ay" value="${s.academicYear||''}" placeholder="e.g. 2025-2026" style="flex:1;">
            <button type="button" class="btn btn-sm" style="white-space:nowrap;background:rgba(124,58,237,.15);color:#a78bfa;border:1px solid rgba(124,58,237,.3);" onclick="setQuickSession()">⚡ Quick Set</button>
          </div>
          <div style="margin-top:6px;font-size:11px;color:#64748b;">This year will appear on report cards, ID cards, salary receipts &amp; across the app.</div>
          ${s.academicYear?`<div style="margin-top:6px;display:inline-flex;align-items:center;gap:6px;background:rgba(16,185,129,.12);color:#059669;border-radius:20px;padding:4px 12px;font-size:11px;font-weight:600;">✅ Current Session: <strong>${s.academicYear}</strong></div>`:''}
        </div>
        <div class="form-group"><label class="form-label">Currency Symbol</label>
          <input class="form-control" id="set-cur" value="${s.currency||'₹'}"></div>
      </div>
      <div class="form-group">
        <label class="form-label">School Logo <span class="text-muted" style="font-weight:400">(used in report cards &amp; question papers)</span></label>
        <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-bottom:10px">
          <div id="set-logo-preview">
            ${s.schoolLogo
              ?`<img src="${s.schoolLogo}" style="height:72px;border-radius:8px;border:2px solid var(--border);object-fit:contain;background:#fff;padding:4px">`
              :`<div style="width:72px;height:72px;border-radius:8px;border:2px dashed var(--border);display:flex;align-items:center;justify-content:center;font-size:1.6rem">🏫</div>`}
          </div>
          <div style="display:flex;flex-direction:column;gap:8px">
            <input type="file" id="set-logo-input" accept="image/*" style="display:none" onchange="handleSchoolLogo(this)">
            <button class="btn btn-sm" onclick="document.getElementById('set-logo-input').click()">📷 Upload Logo</button>
            ${s.schoolLogo?`<button class="btn btn-sm btn-danger" onclick="removeSchoolLogo()">🗑️ Remove Logo</button>`:''}
          </div>
        </div>
        <div class="text-xs text-muted">Recommended: PNG/JPG, max 200KB. Will be auto-compressed.</div>
      </div>
      <button class="btn btn-primary" onclick="saveSettings()">💾 Save Settings</button>
    </div>
  </div>

  <!-- ══ PAYMENT SETTINGS ══ -->
  <div class="card mb-24">
    <div class="card-header">
      <h3>💳 Payment Settings</h3>
      <span class="text-xs text-muted">Parents will see these details to pay fees via UPI / Bank Transfer</span>
    </div>
    <div class="card-body">
      ${(()=>{
        const pc = s.paymentConfig || {};
        return `
        <!-- Enable toggle -->
        <div style="display:flex;align-items:center;gap:12px;padding:14px 18px;background:rgba(16,185,129,.06);border:1px solid rgba(16,185,129,.2);border-radius:12px;margin-bottom:18px;">
          <label style="display:flex;align-items:center;gap:12px;cursor:pointer;flex:1;" onclick="document.getElementById('pay-enabled').click();togglePaymentPreview();return false;">
            <div style="position:relative;width:50px;height:28px;flex-shrink:0;">
              <input type="checkbox" id="pay-enabled" ${pc.enabled?'checked':''}
                style="opacity:0;width:0;height:0;position:absolute;" onclick="event.stopPropagation()">
              <div id="pay-toggle-track"
                style="position:absolute;inset:0;background:${pc.enabled?'#10b981':'rgba(255,255,255,.15)'};border-radius:14px;cursor:pointer;transition:background .25s;box-shadow:inset 0 1px 3px rgba(0,0,0,.3);">
                <div id="pay-toggle-ball" style="position:absolute;top:4px;left:${pc.enabled?'26':'4'}px;width:20px;height:20px;background:#fff;border-radius:50%;transition:left .25s;box-shadow:0 1px 4px rgba(0,0,0,.35);"></div>
              </div>
            </div>
            <div>
              <span style="font-weight:700;color:#fff;font-size:.95rem;">Online Payment Collection</span>
              <div style="font-size:.75rem;color:rgba(255,255,255,.5);margin-top:2px;">Students/Parents can pay fees online via UPI or Bank Transfer</div>
            </div>
          </label>
          <span id="pay-status-badge" style="font-size:.75rem;padding:4px 12px;border-radius:20px;font-weight:700;white-space:nowrap;
            background:${pc.enabled?'rgba(16,185,129,.15)':'rgba(100,116,139,.1)'};
            color:${pc.enabled?'#10b981':'#64748b'};
            border:1px solid ${pc.enabled?'rgba(16,185,129,.3)':'rgba(100,116,139,.2)'};">
            ${pc.enabled?'🟢 Active':'⚫ Inactive'}
          </span>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
          <!-- LEFT: UPI -->
          <div>
            <div style="font-weight:700;color:rgba(255,255,255,.7);font-size:.8rem;text-transform:uppercase;letter-spacing:.06em;margin-bottom:12px;">📱 UPI Details</div>
            <div class="form-group">
              <label class="form-label">UPI ID <span style="color:#94a3b8;font-size:11px;">(e.g. school@paytm, 9876543210@upi)</span></label>
              <input class="form-control" id="pay-upi" placeholder="yourschool@paytm" value="${pc.upiId||''}">
            </div>
            <div class="form-group">
              <label class="form-label">UPI Name <span style="color:#94a3b8;font-size:11px;">(name shown to parents)</span></label>
              <input class="form-control" id="pay-upiname" placeholder="${s.schoolName||'School Name'}" value="${pc.upiName||s.schoolName||''}">
            </div>
            <div class="form-group">
              <label class="form-label">QR Code Image <span style="color:#94a3b8;font-size:11px;">(screenshot from your UPI app)</span></label>
              ${pc.qrCode
                ? `<div style="margin-bottom:8px;"><img src="${pc.qrCode}" style="width:120px;height:120px;border-radius:10px;object-fit:contain;background:#fff;padding:6px;border:2px solid rgba(124,58,237,.3);">
                   <button onclick="clearPayQR()" style="display:block;margin-top:6px;background:rgba(239,68,68,.1);color:#ef4444;border:1px solid rgba(239,68,68,.25);border-radius:7px;padding:4px 12px;cursor:pointer;font-size:.75rem;">🗑️ Remove QR</button></div>`
                : ''}
              <input type="file" id="pay-qr-input" accept="image/*" style="display:none" onchange="handlePayQRUpload(this)">
              <button class="btn btn-sm" onclick="document.getElementById('pay-qr-input').click()">📷 ${pc.qrCode?'Change':'Upload'} QR Code</button>
            </div>
          </div>

          <!-- RIGHT: Bank -->
          <div>
            <div style="font-weight:700;color:rgba(255,255,255,.7);font-size:.8rem;text-transform:uppercase;letter-spacing:.06em;margin-bottom:12px;">🏦 Bank Account Details</div>
            <div class="form-group">
              <label class="form-label">Account Holder Name</label>
              <input class="form-control" id="pay-accname" placeholder="School's account name" value="${pc.accName||''}">
            </div>
            <div class="form-group">
              <label class="form-label">Account Number</label>
              <input class="form-control" id="pay-accno" placeholder="e.g. 1234567890" value="${pc.accNo||''}">
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
              <div class="form-group">
                <label class="form-label">IFSC Code</label>
                <input class="form-control" id="pay-ifsc" placeholder="e.g. SBIN0001234" value="${pc.ifsc||''}">
              </div>
              <div class="form-group">
                <label class="form-label">Bank Name</label>
                <input class="form-control" id="pay-bank" placeholder="e.g. State Bank" value="${pc.bankName||''}">
              </div>
            </div>
          </div>
        </div>

        <div class="form-group" style="margin-top:6px;">
          <label class="form-label">📝 Payment Instructions <span style="color:#94a3b8;font-size:11px;">(shown to parents)</span></label>
          <textarea class="form-control" id="pay-note" rows="2"
            placeholder="e.g. After payment please submit the screenshot to school office or upload here.">${pc.note||''}</textarea>
        </div>

        <div style="margin-top:16px;">
          ${pc.enabled && (pc.upiId||pc.accNo) ? `
          <div style="background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.25);border-radius:10px;padding:10px 14px;margin-bottom:12px;font-size:.82rem;color:#10b981;font-weight:600;">
            ✅ Online payment is LIVE — Students see a "💳 Pay Now" button on their fee page.
          </div>` : pc.enabled && !(pc.upiId||pc.accNo) ? `
          <div style="background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.25);border-radius:10px;padding:10px 14px;margin-bottom:12px;font-size:.82rem;color:#ef4444;font-weight:600;">
            ⚠️ Payment is enabled but no UPI ID or Bank Account is entered. Please add at least one payment method.
          </div>` : `
          <div style="background:rgba(100,116,139,.08);border:1px solid rgba(100,116,139,.2);border-radius:10px;padding:10px 14px;margin-bottom:12px;font-size:.82rem;color:#94a3b8;">
            ℹ️ Online payment is OFF. Students see "🏫 Pay at school" on fee page.
          </div>`}
          <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
            <button class="btn btn-primary" onclick="savePaymentSettings()">💾 Save Payment Settings</button>
            ${(pc.upiId||pc.accNo)?`<button class="btn btn-sm" style="background:rgba(124,58,237,.12);color:#a78bfa;border:1px solid rgba(124,58,237,.3);" onclick="previewPaymentModal()">👁️ Preview (Student View)</button>`:''}
          </div>
        </div>`;
      })()}
    </div>
  </div>

  <!-- ══ PAYMENT PROOFS (submitted by students) ══ -->
  ${(()=>{
    const proofs = DB.get('fee_payment_proofs').filter(p=>p.status==='pending');
    if (!proofs.length) return '';
    return `<div id="fee-proofs-section" class="card mb-24" style="border-color:rgba(245,158,11,.35);">
      <div class="card-header" style="border-bottom-color:rgba(245,158,11,.15);">
        <h3 style="color:#f59e0b;">⏳ Payment Proofs Pending (${proofs.length})</h3>
        <span class="text-xs text-muted">Review & verify these payments submitted by students/parents</span>
      </div>
      <div class="card-body">
        <div style="font-size:13px;color:rgba(255,255,255,.4);margin-bottom:12px;">
          Student has paid via UPI. Verify in your UPI app and approve.
        </div>
        ${proofs.map(p=>{
          const stu = DB.find('students', p.studentId);
          const fee = DB.get('fees').find(f=>f.id===p.feeId);
          const cur = getSettings().currency||'₹';
          const amt = fee ? parseFloat(fee.amount||0) : parseFloat(p.amount||0);
          const cls = DB.find('classes', stu?.classId);
          const submittedDate = p.submittedAt ? formatDate(p.submittedAt.split('T')[0]) : today();
          return `<div style="background:rgba(16,185,129,.04);border:1.5px solid rgba(16,185,129,.2);border-radius:14px;padding:16px;margin-bottom:12px;">
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
              <div>
                <div style="font-weight:800;font-size:1rem;color:#fff;">👤 ${stu?.name||p.studentName||'Student'}</div>
                <div style="font-size:.8rem;color:rgba(255,255,255,.45);margin-top:2px;">${cls?cls.name+' &nbsp;·&nbsp; ':''} Submitted on ${submittedDate}</div>
              </div>
              ${amt>0?`<div style="font-size:1.4rem;font-weight:900;color:#10b981;">${cur}${amt.toLocaleString()}</div>`:''}
            </div>
            <div style="font-size:.82rem;color:rgba(255,255,255,.5);margin:8px 0 14px;">
              Fee: <strong style="color:rgba(255,255,255,.75);">${fee?.feeType||p.feeType||'School Fee'}${fee?.description?' — '+fee.description:''}</strong>
              &nbsp;·&nbsp; Paid via UPI
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <button onclick="approvePaymentProof('${p.id}')"
                style="flex:1;background:linear-gradient(135deg,#10b981,#059669);color:#fff;border:none;border-radius:10px;
                padding:11px 18px;cursor:pointer;font-weight:800;font-size:.9rem;">
                ✅ Approve — Mark as Paid
              </button>
              <button onclick="rejectPaymentProof('${p.id}')"
                style="background:rgba(239,68,68,.1);color:#ef4444;border:1px solid rgba(239,68,68,.25);
                border-radius:10px;padding:11px 16px;cursor:pointer;font-weight:700;font-size:.85rem;">
                ❌ Reject
              </button>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>`;
  })()}

  <div class="card mb-24">
    <div class="card-header"><h3>🌐 Language / भाषा / اللغة</h3><span class="text-xs text-muted">Choose display language for this device</span></div>
    <div class="card-body">
      ${typeof langSelectorHtml === 'function' ? langSelectorHtml() : '<p class="text-muted">Language system loading…</p>'}
    </div>
  </div>

  <div class="card mb-24">
    <div class="card-header"><h3>🚪 Gate Entry / Exit Alerts</h3><span class="text-xs text-muted">Parents get an auto notification when school opens & closes</span></div>
    <div class="card-body">
      ${(()=>{ const g=s.gateConfig||{}; return `
      <div class="form-row">
        <div class="form-group"><label class="form-label">School Open (Entry) Time</label>
          <input class="form-control" type="time" id="gate-open" value="${g.openTime||'08:00'}"></div>
        <div class="form-group"><label class="form-label">School Close (Exit) Time</label>
          <input class="form-control" type="time" id="gate-close" value="${g.closeTime||'14:00'}"></div>
      </div>
      <label style="display:flex;align-items:center;gap:10px;cursor:pointer;margin:6px 0 12px;">
        <input type="checkbox" id="gate-enabled" ${g.enabled?'checked':''} style="width:18px;height:18px;">
        <span>Enable automatic Entry/Exit alerts for parents</span>
      </label>
      <button class="btn btn-primary" onclick="saveGateConfig()">💾 Save Gate Settings</button>
      <div style="font-size:.78rem;color:var(--text-3);margin-top:10px;line-height:1.6;">
        ℹ️ When a student is marked <b>present</b>, parents see “Entered school” at the open time and “Left school / heading home” at the close time — as an in-app + phone notification. 100% free, no SMS/API needed.
      </div>`; })()}
    </div>
  </div>

  <div class="card mb-24">
    <div class="card-header">
      <h3>👩‍🏫 Teacher Access & Class Assignment</h3>
      <span class="text-xs text-muted">Per-teacher permissions and class assignment</span>
    </div>
    <div class="card-body">
      ${(()=>{
        const teachers=DB.get('teachers');
        const classes=DB.get('classes');
        if(!teachers.length) return '<p class="text-muted">No teachers added yet.</p>';
        return teachers.map(t=>{
          const perms=getTeacherPermsFor(t.id);
          const tClasses=classes.filter(c=>c.teacherId===t.id);
          const enabled=Object.values(perms).filter(Boolean).length;
          return `<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;background:var(--glass);border-radius:12px;border:1px solid var(--border);margin-bottom:10px">
            <div style="display:flex;align-items:center;gap:12px">
              <div class="avatar-sm">${t.name[0]}</div>
              <div>
                <div style="font-weight:600">${t.name}</div>
                <div style="font-size:12px;color:var(--text-3)">${t.subject||''} · ${enabled}/11 features · Classes: ${tClasses.length?tClasses.map(c=>c.name).join(', '):'None'}</div>
              </div>
            </div>
            <button class="btn btn-sm" style="background:rgba(124,58,237,.2);color:#a78bfa;border:1px solid rgba(124,58,237,.3)" onclick="openTeacherAccessModal('${t.id}')">🔐 Manage Access</button>
          </div>`;
        }).join('');
      })()}
    </div>
  </div>

  <div class="card mb-24">
    <div class="card-header"><h3>🔐 Change Credentials</h3><span class="text-xs text-muted">Change login username/password for any user</span></div>
    <div class="card-body">
      <div class="form-row" style="margin-bottom:14px">
        <div class="form-group">
          <label class="form-label">Select User *</label>
          <select class="form-control" id="set-cred-user" onchange="prefillCredFields()">
            <option value="">-- Select --</option>
            ${(()=>{
              const all = DB.get('users');
              return all.map(u=>`<option value="${u.id}">${u.name} (${u.role})</option>`).join('');
            })()}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">New Username</label>
          <input type="text" class="form-control" id="set-cred-uname" placeholder="New username">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">New Password</label>
          <input type="password" class="form-control" id="set-pwd" placeholder="New password (blank = no change)"></div>
        <div class="form-group"><label class="form-label">Confirm Password</label>
          <input type="password" class="form-control" id="set-pwd2" placeholder="Confirm password"></div>
      </div>
      <button class="btn btn-warning" onclick="changeUserCreds()">🔑 Update Credentials</button>
    </div>
  </div>

  <div class="card mb-24">
    <div class="card-header">
      <h3>🗄️ Master Backup &amp; Restore</h3>
      <span class="text-xs text-muted">Safely export all school data or restore from a previous backup</span>
    </div>
    <div class="card-body">
      <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:20px">

        <!-- Download card -->
        <div style="flex:1;min-width:220px;padding:20px;background:rgba(16,185,129,.06);border:1.5px solid rgba(16,185,129,.25);border-radius:14px">
          <div style="font-size:2.2rem;margin-bottom:8px">💾</div>
          <div style="font-weight:700;font-size:15px;color:#10b981;margin-bottom:4px">Download Backup</div>
          <div style="font-size:12px;color:#64748b;margin-bottom:14px;line-height:1.6">Exports ALL data — students, marks, fees, attendance, staff, timetable, notices, gallery and settings — as a single JSON file.</div>
          <button class="btn" style="background:rgba(16,185,129,.2);color:#059669;border:1px solid rgba(16,185,129,.3);font-weight:700" onclick="downloadMasterBackup()">💾 Download Backup Now</button>
        </div>

        <!-- Restore card -->
        <div style="flex:1;min-width:220px;padding:20px;background:rgba(59,130,246,.06);border:1.5px solid rgba(59,130,246,.25);border-radius:14px">
          <div style="font-size:2.2rem;margin-bottom:8px">📂</div>
          <div style="font-weight:700;font-size:15px;color:#3b82f6;margin-bottom:4px">Restore from Backup</div>
          <div style="font-size:12px;color:#64748b;margin-bottom:14px;line-height:1.6">Upload a backup JSON file to restore all school data. Current data will be completely replaced by the backup.</div>
          <input type="file" id="restore-backup-input" accept=".json" style="display:none" onchange="restoreMasterBackup(this)">
          <button class="btn" style="background:rgba(59,130,246,.2);color:#2563eb;border:1px solid rgba(59,130,246,.3);font-weight:700" onclick="document.getElementById('restore-backup-input').click()">📂 Upload &amp; Restore</button>
        </div>
      </div>

      <!-- Tips box -->
      <div style="background:rgba(245,158,11,.07);border:1px solid rgba(245,158,11,.25);border-radius:10px;padding:14px 16px">
        <div style="font-size:13px;font-weight:700;color:#b45309;margin-bottom:6px">💡 Backup Tips</div>
        <ul style="font-size:12px;color:#64748b;margin:0;padding-left:18px;line-height:2">
          <li>Take a backup at the <strong>end of each month</strong> and especially before bulk data entry.</li>
          <li>Store the backup file in Google Drive / your device — it's your data insurance.</li>
          <li>Restore only from a file you downloaded from <strong>this app</strong> — do not edit it manually.</li>
          <li>After restore, the page will auto-reload to apply all data.</li>
        </ul>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="card-header"><h3>⚠️ Danger Zone</h3></div>
    <div class="card-body">
      <div class="alert alert-danger">This will permanently delete ALL school data. Cannot be undone!</div>
      <button class="btn btn-danger" onclick="resetAllData()">🗑️ Reset All Data</button>
    </div>
  </div>`;
}

function saveSettings(){
  updateSettings({
    schoolName:    val('set-name'),
    schoolTagline: val('set-tag'),
    schoolAddress: val('set-addr'),
    schoolPhone:   val('set-phone'),
    schoolEmail:   val('set-email'),
    academicYear:  val('set-ay'),
    currency:      val('set-cur'),
  });
  // Update sidebar branding live
  const newName = val('set-name');
  if (newName) {
    const nameEl = document.getElementById('sidebarSchoolName');
    if (nameEl) nameEl.textContent = newName;
    document.title = 'Admin Panel — ' + newName;
  }
  // Live update session year badge in sidebar
  _updateSidebarSession(val('set-ay'));
  toast('✅ Settings saved! Session year updated.','success');
  // Update PWA manifest with new school name/branding
  if (window.pwaRefreshBranding) window.pwaRefreshBranding(CU.schoolId);
  // Sync name/contact to the global school directory (login dropdown reads this)
  _syncSchoolDirectory();
  // Re-render settings so current session badge refreshes
  renderSettings();
}

function saveGateConfig(){
  const openTime=val('gate-open')||'08:00';
  const closeTime=val('gate-close')||'14:00';
  const enabled=document.getElementById('gate-enabled')?.checked||false;
  updateSettings({ gateConfig:{ enabled, openTime, closeTime } });
  toast('✅ Gate alert settings saved','success');
}

// Push the school's name/contact to the central directory so the LOGIN
// dropdown (and anywhere else) shows the updated name everywhere.
// Reads the authoritative server copy first, updates only THIS school's
// entry, then saves back — and keeps logo out of the list to stay light.
function _syncSchoolDirectory(){
  const sid = (DB._schoolId && DB._schoolId()); if(!sid) return;
  const s = getSettings();
  fetch(API_URL + '?school_id=__sa__&key=schools', { cache:'no-store' })
    .then(r=>r.text())
    .then(txt=>{
      let arr=[]; try{ const p=JSON.parse(txt); if(Array.isArray(p)) arr=p; }catch(e){}
      const i=arr.findIndex(x=>x.id===sid);
      if(i===-1) return; // directory entries are created by super-admin only
      arr[i] = { ...arr[i],
        name:    s.schoolName    || arr[i].name,
        tagline: s.schoolTagline || arr[i].tagline || '',
        address: s.schoolAddress || arr[i].address || '',
        phone:   s.schoolPhone   || arr[i].phone   || '' };
      fetch(API_URL, { method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ school_id:'__sa__', key:'schools', value:arr }) }).catch(()=>{});
      try { localStorage.setItem('_sa_schools', JSON.stringify(arr)); } catch(e){}
    }).catch(()=>{});
}

// ══════════════════════════════════════════════════════
//  MASTER BACKUP & RESTORE
// ══════════════════════════════════════════════════════
function downloadMasterBackup(){
  const pfx  = DB._pfx();
  const s    = getSettings();
  const data = {};
  for(let i=0;i<localStorage.length;i++){
    const k=localStorage.key(i);
    if(k.startsWith(pfx)) data[k]=localStorage.getItem(k);
  }
  // Count records for summary
  const students = DB.get('students').length;
  const teachers = DB.get('teachers').length;
  const marks    = DB.get('marks').length;
  const fee      = DB.get('fees')||[];

  const backup={
    _meta:{
      createdAt   : new Date().toISOString(),
      schoolName  : s.schoolName||'School',
      academicYear: s.academicYear||'',
      appVersion  : '2.0',
      summary     : { students, teachers, marks }
    },
    data
  };
  const json=JSON.stringify(backup,null,2);
  const blob=new Blob([json],{type:'application/json'});
  const url =URL.createObjectURL(blob);
  const a   =document.createElement('a');
  const fname=`backup_${(s.schoolName||'school').replace(/[^a-z0-9]/gi,'_')}_${today()}.json`;
  a.href=url; a.download=fname; a.click();
  URL.revokeObjectURL(url);
  toast(`✅ Backup downloaded! (${students} students, ${teachers} teachers)`, 'success');
}

function restoreMasterBackup(input){
  const file=input.files[0];
  if(!file){ return; }
  const reader=new FileReader();
  reader.onload=function(ev){
    try{
      const backup=JSON.parse(ev.target.result);
      if(!backup.data||typeof backup.data!=='object') throw new Error('Invalid backup format');
      const meta=backup._meta||{};
      const confirmed=confirm(
        `⚠️ Restore Backup?\n\n`+
        `School: ${meta.schoolName||'Unknown'}\n`+
        `Created: ${meta.createdAt?meta.createdAt.slice(0,10):'Unknown'}\n`+
        `Session: ${meta.academicYear||'—'}\n`+
        `Students: ${meta.summary?.students||'?'} | Teachers: ${meta.summary?.teachers||'?'}\n\n`+
        `This will REPLACE current data. Are you sure?`
      );
      if(!confirmed){ input.value=''; return; }
      // Restore all keys
      Object.entries(backup.data).forEach(([k,v])=>localStorage.setItem(k,v));
      toast('✅ Data restored successfully! Reloading page...','success');
      setTimeout(()=>location.reload(), 1500);
    }catch(e){
      toast('❌ Invalid backup file: '+e.message,'error');
      input.value='';
    }
  };
  reader.readAsText(file);
}

function setQuickSession(){
  const now = new Date();
  const y1  = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear()-1; // April = new session
  const y2  = y1 + 1;
  const suggested = `${y1}-${y2}`;
  const el = document.getElementById('set-ay');
  if (el) {
    el.value = suggested;
    el.focus();
    el.style.borderColor = '#7c3aed';
    setTimeout(()=>{ el.style.borderColor=''; }, 1500);
    toast(`⚡ Session set to ${suggested} — click Save to confirm`, 'info');
  }
}
function handleSchoolLogo(input){
  const file=input.files[0]; if(!file) return;
  const MAX=150*1024;                 // target ≤150KB
  toast('⏳ Compressing logo…','info');
  const reader=new FileReader();
  reader.onerror=()=>toast('Could not read that image','error');
  reader.onload=function(ev){
    const img=new Image();
    img.onerror=()=>toast('That file is not a valid image','error');
    img.onload=function(){
      try{
        // 1) Pre-scale the longest side down to 512px FIRST.
        //    This makes even a 10MB photo compress instantly without freezing.
        let w=img.width, h=img.height; const CAP=512;
        if(w>CAP||h>CAP){ if(w>=h){ h=Math.round(h*CAP/w); w=CAP; } else { w=Math.round(w*CAP/h); h=CAP; } }
        const drawPNG=()=>{ const c=document.createElement('canvas'); c.width=w; c.height=h; c.getContext('2d').drawImage(img,0,0,w,h); return c.toDataURL('image/png'); };
        // 2) PNG (keeps transparency); shrink dimensions until under target.
        let d=drawPNG(), guard=0;
        while(d.length*0.75>MAX && (w>96||h>96) && guard++<14){ w=Math.round(w*0.82); h=Math.round(h*0.82); d=drawPNG(); }
        // 3) Still too big (photo-style logo)? Fall back to JPEG on white bg — much smaller.
        if(d.length*0.75>MAX){
          let q=0.85; const drawJPG=()=>{ const c=document.createElement('canvas'); c.width=w; c.height=h; const ctx=c.getContext('2d'); ctx.fillStyle='#fff'; ctx.fillRect(0,0,w,h); ctx.drawImage(img,0,0,w,h); return c.toDataURL('image/jpeg',q); };
          d=drawJPG(); let g2=0;
          while(d.length*0.75>MAX && q>0.3 && g2++<8){ q-=0.1; d=drawJPG(); }
        }
        updateSettings({schoolLogo:d});   // shared key → mirrors to server → shows everywhere
        const prev=document.getElementById('set-logo-preview');
        if(prev) prev.innerHTML=`<img src="${d}" style="height:72px;border-radius:8px;border:2px solid var(--border);object-fit:contain;background:#fff;padding:4px">`;
        const markEl=document.getElementById('sidebarLogoMark');
        if(markEl) markEl.innerHTML=`<img src="${d}" style="width:32px;height:32px;border-radius:6px;object-fit:contain;background:#fff;padding:2px">`;
        if(window.pwaRefreshBranding) window.pwaRefreshBranding(CU.schoolId);
        toast('✅ Logo uploaded & saved everywhere!','success');
        renderSettings();
      }catch(e){ toast('Logo too large to process — try a smaller image','error'); }
    };
    img.src=ev.target.result;
  };
  reader.readAsDataURL(file);
}
function removeSchoolLogo(){
  if(!confirm('Remove school logo?')) return;
  updateSettings({schoolLogo:''});
  if (window.pwaRefreshBranding) window.pwaRefreshBranding(CU.schoolId);
  toast('Logo removed','info');
  renderSettings();
}
function prefillCredFields() {
  const uid = val('set-cred-user');
  if (!uid) return;
  const user = DB.find('users', uid);
  if (user) document.getElementById('set-cred-uname').value = user.username || '';
}

function changeUserCreds() {
  const uid    = val('set-cred-user');
  const uname  = val('set-cred-uname');
  const p1     = document.getElementById('set-pwd').value;
  const p2     = document.getElementById('set-pwd2').value;
  if (!uid)   { toast('Select a user', 'warning'); return; }
  if (!uname) { toast('Username cannot be empty', 'warning'); return; }
  if (p1 && p1 !== p2) { toast('Passwords do not match', 'error'); return; }

  const upd = { username: uname };
  if (p1) upd.password = p1;

  // Update in users store
  DB.update('users', uid, upd);

  // Also update in role-specific store (students / teachers)
  const user = DB.find('users', uid);
  if (user) {
    if (user.role === 'student') DB.update('students', uid, upd);
    if (user.role === 'teacher') DB.update('teachers', uid, upd);
  }

  // If it's the current admin, update session
  if (uid === CU.id) setCurrentUser({ ...CU, ...upd });

  toast('Credentials updated!', 'success');
}

function changeAdminPwd(){
  const p1=document.getElementById('set-pwd').value;
  const p2=document.getElementById('set-pwd2').value;
  if(!p1||p1!==p2){toast('Passwords do not match','error');return}
  DB.update('users', CU.id, {password:p1});
  toast('Password changed!','success');
}
function resetAllData(){
  if(!confirmAction('RESET ALL DATA? This is PERMANENT and cannot be undone!')) return;
  localStorage.clear(); sessionStorage.clear();
  toast('All data cleared. Redirecting…','info');
  setTimeout(()=>window.location.href='index.html',1500);
}

// ── Tiny helper ───────────────────────────────────────
function val(id){ const el=document.getElementById(id); return el?el.value.trim():'' }

// ══════════════════════════════════════════════════════
//  BULK STUDENT UPLOAD
// ══════════════════════════════════════════════════════
function openBulkUploadModal() {
  const classes = DB.get('classes');
  buildModal('modal-bulk-upload', '📤 Import Students from Excel', `
    <div style="margin-bottom:14px;padding:14px;background:rgba(6,182,212,.08);border:1px solid rgba(6,182,212,.2);border-radius:10px;font-size:.8rem;color:rgba(255,255,255,.6);">
      <strong style="color:#67e8f9">Columns:</strong> Name, Roll No, Class Name, Gender, DOB, Father Name, Mother Name, Phone, Admission No, Aadhaar, Blood Group, Address, Username, Password, Total Fee, Fee Paid<br>
      <em style="font-size:.76rem">First row = header (skipped). Class name must match exactly (e.g. "Class 1 A"). Re-importing updates students by Username. Save your Excel as <strong>CSV</strong> before uploading.</em>
    </div>
    <button type="button" class="btn btn-sm btn-secondary" style="margin-bottom:14px;" onclick="downloadStudentTemplate()">📄 Download Excel Template</button>
    <div class="form-group">
      <label class="form-label">Default Class (if not in CSV)</label>
      <select class="form-control" id="bulk-default-class">
        <option value="">-- None --</option>
        ${classes.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Upload CSV File</label>
      <input type="file" class="form-control" id="bulk-csv-file" accept=".csv,.txt">
    </div>
    <div class="form-group">
      <label class="form-label">Or paste CSV text directly</label>
      <textarea class="form-control" id="bulk-csv-text" rows="6" placeholder="Name,Roll No,Class Name,Father Name,Phone,Username,Password&#10;John Doe,001,Class 6A,James Doe,9876543210,john001,pass123"></textarea>
    </div>
    <div id="bulk-preview"></div>`,
    doBulkUpload, 'modal-lg');

  document.getElementById('bulk-csv-file').onchange = function() {
    const file = this.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      document.getElementById('bulk-csv-text').value = e.target.result;
      previewBulkCSV();
    };
    reader.readAsText(file);
  };
}

function previewBulkCSV() {
  const text = document.getElementById('bulk-csv-text').value;
  if (!text.trim()) return;
  const rows = parseCSV(text);
  const prev = document.getElementById('bulk-preview');
  if (!rows.length) { prev.innerHTML = '<p class="text-muted">No data rows found.</p>'; return; }
  prev.innerHTML = `<div style="margin-top:12px;padding:10px 14px;background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.2);border-radius:8px;font-size:.82rem;color:#6ee7b7;">
    ✅ ${rows.length} students detected in CSV</div>`;
}

function doBulkUpload() {
  const text = document.getElementById('bulk-csv-text').value.trim();
  const defaultClass = document.getElementById('bulk-default-class').value;
  if (!text) { toast('No CSV data provided', 'warning'); return; }

  const rows = parseCSV(text);
  if (!rows.length) { toast('No valid data rows found', 'warning'); return; }

  const classes = DB.get('classes');
  const students = DB.get('students');
  const byUser = {}; students.forEach(s=>{ if(s.username) byUser[String(s.username).toLowerCase()]=s; });
  let added = 0, updated = 0, skipped = 0;

  rows.forEach(row => {
    const name     = row['name'] || row['full name'] || row['student name'] || '';
    const rollNo   = row['roll no'] || row['roll'] || row['roll number'] || '';
    const clsName  = row['class name'] || row['class'] || '';
    const gender   = row['gender'] || 'Male';
    const dob      = row['dob'] || row['date of birth'] || '';
    const father   = row['father name'] || row['father'] || '';
    const mother   = row['mother name'] || row['mother'] || '';
    const phone    = row['phone'] || row['mobile'] || '';
    const admissionNo = row['admission no'] || row['admission'] || row['adm no'] || row['scholar no'] || '';
    const aadhaar  = row['aadhaar'] || row['aadhar'] || '';
    const bloodGroup = row['blood group'] || row['blood'] || '';
    const address  = row['address'] || '';
    const username = row['username'] || row['user'] || '';
    const password = row['password'] || row['pass'] || 'pass123';
    const feeTotal = Number(row['total fee'] || row['fee total'] || 12000) || 12000;
    const feePaid  = Number(row['fee paid'] || 0) || 0;

    if (!name || !rollNo) { skipped++; return; }

    let classId = defaultClass;
    if (clsName) {
      const found = classes.find(c => c.name.toLowerCase() === clsName.toLowerCase());
      if (found) classId = found.id;
    }

    const uname = (username || rollNo).toString();
    const fields = { name, rollNo, classId:classId||'', gender, dob, fatherName:father, motherName:mother,
      phone, admissionNo, aadhaar, bloodGroup, address, username:uname, password,
      role:'student', status:'active', feeTotal, feePaid };

    const existing = byUser[uname.toLowerCase()];
    if (existing) {                       // re-import → update the same student
      DB.update('students', existing.id, fields);
      DB.update('users',    existing.id, fields);
      updated++;
    } else {
      const nid = genId('usr_std');
      const data = { id:nid, ...fields, joinDate:today() };
      DB.push('students', data);
      DB.push('users', data);
      byUser[uname.toLowerCase()] = data;
      added++;
    }
  });

  closeAllModals();
  toast(`✅ Import done — Added: ${added}, Updated: ${updated}, Skipped: ${skipped}`, (added+updated) > 0 ? 'success' : 'warning');
  renderStudents('');
}

// ── Excel-compatible columns (header order shared by export, template & import) ──
const STUDENT_XLS_COLS = ['Name','Roll No','Class Name','Gender','DOB','Father Name','Mother Name','Phone','Admission No','Aadhaar','Blood Group','Address','Username','Password','Total Fee','Fee Paid'];
function _csvCell(v){ return String(v==null?'':v).replace(/[",\r\n]/g,' ').trim(); }
function _downloadCSV(filename, lines){
  const csv = '﻿' + lines.join('\r\n');   // BOM so Excel reads UTF-8 (Hindi names) correctly
  const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download=filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
}
function exportStudentsExcel(){
  const students = DB.get('students');
  if(!students.length){ toast('No students to export yet','warning'); return; }
  const cmap={}; DB.get('classes').forEach(c=>cmap[c.id]=c.name);
  const lines = [ STUDENT_XLS_COLS.join(',') ];
  students.forEach(s=>{
    lines.push([s.name,s.rollNo,cmap[s.classId]||'',s.gender||'',s.dob||'',s.fatherName||'',s.motherName||'',
      s.phone||'',s.admissionNo||'',s.aadhaar||'',s.bloodGroup||'',s.address||'',s.username||'',s.password||'',
      s.feeTotal||'',s.feePaid||''].map(_csvCell).join(','));
  });
  const sName=(getSettings().schoolName||'school').replace(/[^a-z0-9]/gi,'_');
  _downloadCSV(`Students_${sName}_${today()}.csv`, lines);
  toast(`📥 Exported ${students.length} students (opens in Excel)`,'success');
}
function downloadStudentTemplate(){
  const ex1=['Aarav Sharma','1','Class 1 A','Male','2018-05-10','Rajesh Sharma','Sunita Sharma','9876543210','1001','','B+','Delhi','aarav1','pass123','12000','0'];
  const ex2=['Diya Verma','2','Class 1 A','Female','2018-08-22','Amit Verma','Pooja Verma','9876500000','1002','','O+','Mumbai','diya2','pass123','12000','0'];
  _downloadCSV('Student_Import_Template.csv', [ STUDENT_XLS_COLS.join(','), ex1.map(_csvCell).join(','), ex2.map(_csvCell).join(',') ]);
  toast('📄 Template downloaded — fill it & use "Import Excel"','success');
}

// ══════════════════════════════════════════════════════
//  PRINT ATTENDANCE SHEET
// ══════════════════════════════════════════════════════
function printAttendanceSheet() {
  const cls = DB.find('classes', _attState.classId);
  const students = DB.where('students', 'classId', _attState.classId);
  const saved = DB.get('attendance').filter(a => a.classId === _attState.classId && a.date === _attState.date);
  const savedMap = {};
  saved.forEach(a => { savedMap[a.studentId] = a.status; });

  const rows = students.map((s, i) => {
    const status = _attState.marks[s.id] || savedMap[s.id] || '—';
    const badge = status === 'present' ? '✅ Present' : status === 'absent' ? '❌ Absent' : status === 'late' ? '⏰ Late' : '—';
    return `<tr><td>${i+1}</td><td>${s.name}</td><td>${s.rollNo}</td><td>${badge}</td><td style="width:120px"></td></tr>`;
  }).join('');

  const s = getSettings();
  printHtml(`
    <div style="text-align:center;margin-bottom:20px">
      <h2 style="margin:0">${s.schoolName||'School'}</h2>
      <h3 style="margin:4px 0;color:#555">Attendance Sheet</h3>
      <p>Class: <strong>${cls?cls.name:'—'}</strong> &nbsp;|&nbsp; Date: <strong>${formatDate(_attState.date)}</strong></p>
    </div>
    <table>
      <thead><tr><th>#</th><th>Student Name</th><th>Roll No</th><th>Status</th><th>Signature</th></tr></thead>
      <tbody>${rows||'<tr><td colspan="5" style="text-align:center">No students</td></tr>'}</tbody>
    </table>
    <div style="margin-top:30px;display:flex;justify-content:space-between">
      <div>Total Present: <strong>${saved.filter(a=>a.status==='present').length}</strong></div>
      <div>Total Absent: <strong>${saved.filter(a=>a.status==='absent').length}</strong></div>
      <div>Teacher Signature: _______________</div>
    </div>`, 'Attendance Sheet');
}

// ══════════════════════════════════════════════════════
//  TEACHER ATTENDANCE — REDESIGNED
// ══════════════════════════════════════════════════════
let _tchAttDate = today();
const _tchAttMarks = {};

function renderTeacherAttendance() {
  const teachers = DB.get('teachers');
  const saved    = DB.get('teacher_attendance') || [];
  const dayRec   = saved.filter(a => a.date === _tchAttDate);
  const savedMap = {};
  dayRec.forEach(a => { savedMap[a.teacherId] = a.status; if (!_tchAttMarks[a.teacherId]) _tchAttMarks[a.teacherId]=a.status; });

  let tp=0,ta=0,tl=0,tu=0;
  teachers.forEach(t=>{ const st=_tchAttMarks[t.id]||savedMap[t.id]||''; if(st==='present')tp++; else if(st==='absent')ta++; else if(st==='late')tl++; else tu++; });

  document.getElementById('section-teacherattendance').innerHTML = `
  <div class="page-header">
    <div><h2>👩‍🏫 Teacher Attendance</h2></div>
    <div class="d-flex gap-8">
      <button class="btn" style="background:#10b981;color:#fff;border:none;" onclick="faceOpenScanner({mode:'teacher',date:_tchAttDate,title:'Teachers'})">📷 Face Attendance</button>
      <button class="btn btn-secondary" onclick="printTeacherAttSheet()">🖨️ Print</button>
      <button class="btn btn-success" onclick="saveTeacherAtt()">💾 Save</button>
    </div>
  </div>
  <!-- Date + bulk actions -->
  <div class="d-flex gap-10 mb-16" style="flex-wrap:wrap;align-items:center;">
    <input type="date" class="form-control" style="width:190px" value="${_tchAttDate}"
      onchange="_tchAttDate=this.value;Object.keys(_tchAttMarks).forEach(k=>delete _tchAttMarks[k]);renderTeacherAttendance()">
    <button class="btn btn-sm btn-success" onclick="markAllTchAtt('present')">✅ All Present</button>
    <button class="btn btn-sm btn-danger"  onclick="markAllTchAtt('absent')">❌ All Absent</button>
    <button class="btn btn-sm" style="background:rgba(245,158,11,.15);color:var(--yellow);border:1px solid rgba(245,158,11,.3);" onclick="markAllTchAtt('late')">🕐 All Late</button>
  </div>
  <!-- Stats strip -->
  <div class="att-stats-strip mb-16">
    <div class="att-stat-chip green"><span class="stat-num" id="tch-p">${tp}</span><span class="stat-lbl">✅ Present</span></div>
    <div class="att-stat-chip red">  <span class="stat-num" id="tch-a">${ta}</span><span class="stat-lbl">❌ Absent</span></div>
    <div class="att-stat-chip yellow"><span class="stat-num" id="tch-l">${tl}</span><span class="stat-lbl">🕐 Late</span></div>
    <div class="att-stat-chip blue"> <span class="stat-num" id="tch-u">${tu}</span><span class="stat-lbl">⬜ Unmarked</span></div>
    <div class="att-stat-chip purple"><span class="stat-num" id="tch-pct">${teachers.length?Math.round(tp/teachers.length*100):0}%</span><span class="stat-lbl">📈 Rate</span></div>
  </div>
  <!-- Teacher list (horizontal card style — fits all teachers visibly) -->
  <div style="display:flex;flex-direction:column;gap:10px;" id="tchAttList">
    ${teachers.length ? teachers.map(t=>{
      const st = _tchAttMarks[t.id] || savedMap[t.id] || '';
      return `<div class="tatt-card ${st}" id="tchatt-${t.id}">
        <div class="att-card-avatar" style="width:42px;height:42px;font-size:1rem;flex-shrink:0;">${t.name[0].toUpperCase()}</div>
        <div class="tatt-card-info">
          <div class="tatt-card-name">${t.name}</div>
          <div class="tatt-card-sub">${t.subject||'Teacher'} ${t.phone?'· '+t.phone:''}</div>
        </div>
        <div class="tatt-card-btns">
          <button class="tatt-btn p ${st==='present'?'active-p':''}" onclick="setTchAtt('${t.id}','present')">✅ P</button>
          <button class="tatt-btn a ${st==='absent'?'active-a':''}"  onclick="setTchAtt('${t.id}','absent')">❌ A</button>
          <button class="tatt-btn l ${st==='late'?'active-l':''}"    onclick="setTchAtt('${t.id}','late')">🕐 L</button>
        </div>
      </div>`;
    }).join('') : '<div class="empty-state"><div class="e-icon">👩‍🏫</div><p>No teachers added yet</p></div>'}
  </div>
  <!-- History table -->
  <div class="card mt-24">
    <div class="card-header"><h3>📊 Attendance History (Last 7 Days)</h3></div>
    <div class="card-body" style="padding:0;">${tchAttHistoryHtml()}</div>
  </div>`;
}

function setTchAtt(tid, status) {
  _tchAttMarks[tid] = status;
  const el = document.getElementById('tchatt-'+tid);
  if (!el) return;
  el.className = 'tatt-card ' + status;
  el.querySelectorAll('.tatt-btn').forEach(b => {
    b.classList.remove('active-p','active-a','active-l');
    if(b.classList.contains('p')&&status==='present') b.classList.add('active-p');
    if(b.classList.contains('a')&&status==='absent')  b.classList.add('active-a');
    if(b.classList.contains('l')&&status==='late')    b.classList.add('active-l');
  });
  _updateTchAttStats();
}
function _updateTchAttStats() {
  const teachers = DB.get('teachers');
  const saved = (DB.get('teacher_attendance')||[]).filter(a=>a.date===_tchAttDate);
  const sm = {}; saved.forEach(a=>{ sm[a.teacherId]=a.status; });
  let p=0,ab=0,l=0,u=0;
  teachers.forEach(t=>{ const st=_tchAttMarks[t.id]||sm[t.id]||''; if(st==='present')p++; else if(st==='absent')ab++; else if(st==='late')l++; else u++; });
  const tot = teachers.length||1;
  ['tch-p','tch-a','tch-l','tch-u','tch-pct'].forEach((id,i)=>{
    const el=document.getElementById(id); if(!el)return;
    el.textContent = [p,ab,l,u,Math.round(p/tot*100)+'%'][i];
  });
}
function markAllTchAtt(status) {
  DB.get('teachers').forEach(t => setTchAtt(t.id, status));
}
function saveTeacherAtt() {
  const teachers = DB.get('teachers');
  if (!Object.keys(_tchAttMarks).length) { toast('Mark attendance first','warning'); return; }
  const rest = (DB.get('teacher_attendance')||[]).filter(a => a.date !== _tchAttDate);
  teachers.forEach(t => {
    rest.push({ id:genId('tatt'), teacherId:t.id, date:_tchAttDate,
      status:_tchAttMarks[t.id]||'absent' });
  });
  DB.set('teacher_attendance', rest);
  Object.keys(_tchAttMarks).forEach(k => delete _tchAttMarks[k]);
  toast(`Teacher attendance saved! ${teachers.length} teachers recorded.`, 'success');
  renderTeacherAttendance();
}
function tchAttHistoryHtml() {
  const teachers = DB.get('teachers');
  const all = DB.get('teacher_attendance') || [];
  if (!all.length) return '<div class="empty-state"><div class="e-icon">📊</div><p>No data yet</p></div>';
  const days = [...new Set(all.map(a=>a.date))].sort().slice(-7).reverse();
  return `<div class="table-wrap"><table>
    <thead><tr><th>Teacher</th>${days.map(d=>`<th style="font-size:.75rem">${formatDate(d)}</th>`).join('')}</tr></thead>
    <tbody>
      ${teachers.map(t=>{
        return `<tr><td><strong>${t.name}</strong><div style="font-size:.72rem;color:var(--text2)">${t.subject||''}</div></td>${days.map(d=>{
          const r=all.find(a=>a.teacherId===t.id&&a.date===d);
          const s=r?r.status:'—';
          const cls=s==='present'?'badge-green':s==='absent'?'badge-red':s==='late'?'badge-yellow':'';
          return `<td><span class="badge ${cls}" style="font-size:.7rem">${s==='present'?'P':s==='absent'?'A':s==='late'?'L':'—'}</span></td>`;
        }).join('')}</tr>`;
      }).join('')}
    </tbody>
  </table></div>`;
}
function printTeacherAttSheet() {
  const teachers = DB.get('teachers');
  const saved = (DB.get('teacher_attendance')||[]).filter(a=>a.date===_tchAttDate);
  const savedMap = {};
  saved.forEach(a=>{savedMap[a.teacherId]=a.status;});
  const s = getSettings();
  printHtml(`
    <div style="text-align:center;margin-bottom:20px">
      <h2 style="margin:0">${s.schoolName||'School'}</h2>
      <h3 style="margin:4px 0;color:#555">Teacher Attendance — ${formatDate(_tchAttDate)}</h3>
    </div>
    <table>
      <thead><tr><th>#</th><th>Teacher Name</th><th>Subject</th><th>Status</th><th>Signature</th></tr></thead>
      <tbody>${teachers.map((t,i)=>{
        const st=_tchAttMarks[t.id]||savedMap[t.id]||'—';
        return `<tr><td>${i+1}</td><td>${t.name}</td><td>${t.subject||'—'}</td><td>${st}</td><td style="width:120px"></td></tr>`;
      }).join('')}</tbody>
    </table>`, 'Teacher Attendance');
}

// ══════════════════════════════════════════════════════
//  TEACHER TASKS / MESSAGES
// ══════════════════════════════════════════════════════
function renderTeacherTasks() {
  const teachers = DB.get('teachers');
  const tasks = DB.get('teacher_tasks') || [];

  document.getElementById('section-teachertasks').innerHTML = `
  <div class="page-header">
    <div><h2>Teacher Tasks & Messages</h2></div>
    <button class="btn btn-primary" onclick="openTaskModal()">📨 Send Task / Message</button>
  </div>
  <div class="card mb-24">
    <div class="card-header"><h3>📋 All Tasks</h3></div>
    <div class="card-body">
      ${tasks.length ? tasks.slice().reverse().map(task => {
        const tch = teachers.find(t=>t.id===task.teacherId);
        const stBadge = task.status==='done'?'badge-green':task.status==='in-progress'?'badge-cyan':'badge-yellow';
        return `<div style="padding:16px;background:var(--glass);border-radius:12px;border:1px solid var(--border);margin-bottom:12px">
          <div class="d-flex align-center justify-between mb-8">
            <div class="d-flex align-center gap-8">
              <div class="avatar-sm">${tch?tch.name[0]:'?'}</div>
              <div>
                <div class="fw-6">${tch?tch.name:'Unknown'}</div>
                <div class="text-xs text-muted">📅 ${formatDate(task.date)} · Due: ${task.dueDate?formatDate(task.dueDate):'No deadline'}</div>
              </div>
            </div>
            <div class="d-flex align-center gap-8">
              <span class="badge ${stBadge}">${task.status||'pending'}</span>
              <button class="btn btn-sm btn-danger" onclick="deleteTask('${task.id}')">🗑️</button>
            </div>
          </div>
          <div class="fw-6 mb-4">${task.title}</div>
          <div class="text-sm text-2">${task.message||''}</div>
          ${task.priority==='high'?'<span class="badge badge-red mt-8">🔴 High Priority</span>':''}
        </div>`;
      }).join('') : '<div class="empty-state"><div class="e-icon">📨</div><p>No tasks sent yet</p></div>'}
    </div>
  </div>`;
}

function openTaskModal() {
  const teachers = DB.get('teachers');
  buildModal('modal-task', '📨 Send Task / Message', `
    <div class="form-group">
      <label class="form-label">Send To (Teacher) *</label>
      <select class="form-control" id="task-teacher">
        <option value="">Select teacher</option>
        ${teachers.map(t=>`<option value="${t.id}">${t.name} — ${t.subject||''}</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Title *</label>
      <input class="form-control" id="task-title" placeholder="e.g. Prepare Class 7B Question Paper">
    </div>
    <div class="form-group">
      <label class="form-label">Message / Details</label>
      <textarea class="form-control" id="task-msg" rows="4" placeholder="Task details or message…"></textarea>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Due Date</label>
        <input type="date" class="form-control" id="task-due">
      </div>
      <div class="form-group">
        <label class="form-label">Priority</label>
        <select class="form-control" id="task-priority">
          <option value="normal">Normal</option>
          <option value="high">High</option>
        </select>
      </div>
    </div>`, saveTask, 'modal-lg');
}

function saveTask() {
  const teacherId = val('task-teacher');
  const title     = val('task-title');
  const message   = document.getElementById('task-msg').value.trim();
  const dueDate   = val('task-due');
  const priority  = val('task-priority');
  if (!teacherId || !title) { toast('Select teacher and enter title', 'warning'); return; }
  DB.push('teacher_tasks', { id:genId('task'), teacherId, title, message, dueDate, priority,
    status:'pending', date:today(), sentBy:CU.name });
  toast('Task sent!', 'success');
  closeAllModals();
  renderTeacherTasks();
}
function deleteTask(id) {
  if (!confirmAction('Delete this task?')) return;
  DB.delete('teacher_tasks', id);
  renderTeacherTasks();
}

// ══════════════════════════════════════════════════════
//  QUESTION BANK  —  Full inline add form
// ══════════════════════════════════════════════════════
let _qbState = {
  classId:'', grade:'', subject:'', chapter:'',
  type:'short', marks:2, question:'', answer:'',
  options:['','','',''], correctOpt:'A',
  filter:'', filterSubject:'', filterType:'', filterClass:''
};

function renderQuestionBank() {
  const bank     = DB.get('question_bank') || [];
  const classes  = DB.get('classes');
  const subjects = [...new Set(bank.map(q=>q.subject).filter(Boolean))].sort();
  const chapters = [...new Set(bank.map(q=>q.chapter).filter(Boolean))].sort();
  const s = _qbState;

  // Build grade from selected class
  const selCls = classes.find(c=>c.id===s.classId);
  const selGrade = selCls ? (selCls.grade||(selCls.name.match(/\d+/)||[''])[0]) : '';

  // Filtered list
  let filtered = bank.slice().reverse();
  if (s.filterClass)   filtered = filtered.filter(q=>q.grade===s.filterClass||q.classId===s.filterClass);
  if (s.filterSubject) filtered = filtered.filter(q=>q.subject===s.filterSubject);
  if (s.filterType)    filtered = filtered.filter(q=>q.type===s.filterType);
  if (s.filter)        filtered = filtered.filter(q=>(q.question||'').toLowerCase().includes(s.filter.toLowerCase()));

  const typeInfo = {
    short:     {label:'Short Answer', icon:'📝', color:'#10b981', bg:'rgba(16,185,129,.12)', marks:2},
    long:      {label:'Long Answer',  icon:'📄', color:'#f59e0b', bg:'rgba(245,158,11,.12)', marks:5},
    mcq:       {label:'MCQ',          icon:'❓', color:'#06b6d4', bg:'rgba(6,182,212,.12)',  marks:1},
    fill:      {label:'Fill in Blank',icon:'✏️', color:'#ec4899', bg:'rgba(236,72,153,.12)', marks:1},
    truefalse: {label:'True / False', icon:'⚖️', color:'#8b5cf6', bg:'rgba(139,92,246,.12)', marks:1},
  };
  const ti = typeInfo[s.type] || typeInfo.short;

  document.getElementById('section-questionbank').innerHTML = `
  <div class="page-header">
    <div><h2>Question Bank</h2><div class="breadcrumb">Total: <span>${bank.length}</span> questions</div></div>
    <button class="btn btn-secondary" onclick="activateNav('papergenerator')">📝 Generate Paper</button>
  </div>

  <div style="display:grid;grid-template-columns:420px 1fr;gap:20px;align-items:start">

    <!-- ═══ LEFT: Add Question Form ═══ -->
    <div class="card" style="position:sticky;top:20px">
      <div class="card-header" style="background:linear-gradient(135deg,rgba(124,58,237,.15),rgba(6,182,212,.1));border-radius:14px 14px 0 0">
        <h3 style="margin:0">➕ Add New Question</h3>
      </div>
      <div class="card-body" style="display:flex;flex-direction:column;gap:14px">

        <!-- Step 1: Class → Subject → Chapter -->
        <div style="background:var(--bg-2);border-radius:12px;padding:14px;border:1.5px solid var(--border)">
          <div style="font-size:12px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px">📚 Step 1 — Class, Subject, Chapter</div>
          <div class="form-group" style="margin-bottom:10px">
            <label class="form-label" style="font-size:12px">Class *</label>
            <select class="form-control" id="qb-class" onchange="_qbState.classId=this.value;_qbRefreshClassSub()">
              <option value="">— Select Class —</option>
              ${classes.map(c=>`<option value="${c.id}" ${s.classId===c.id?'selected':''}>${c.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group" style="margin-bottom:10px">
            <label class="form-label" style="font-size:12px">Subject *</label>
            <input class="form-control" id="qb-subject" placeholder="e.g. Mathematics" value="${s.subject}"
              list="qb-sub-dl" oninput="_qbState.subject=this.value">
            <datalist id="qb-sub-dl">${subjects.map(x=>`<option value="${x}">`).join('')}</datalist>
          </div>
          <div class="form-group" style="margin:0">
            <label class="form-label" style="font-size:12px">Chapter / Topic</label>
            <input class="form-control" id="qb-chapter" placeholder="e.g. Chapter 3 — Fractions" value="${s.chapter}"
              list="qb-ch-dl" oninput="_qbState.chapter=this.value">
            <datalist id="qb-ch-dl">${chapters.map(x=>`<option value="${x}">`).join('')}</datalist>
          </div>
        </div>

        <!-- Step 2: Question Type -->
        <div style="background:var(--bg-2);border-radius:12px;padding:14px;border:1.5px solid var(--border)">
          <div style="font-size:12px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px">🏷️ Step 2 — Question Type</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
            ${Object.entries(typeInfo).map(([key,t])=>`
              <button type="button" onclick="_qbSetType('${key}')"
                style="display:flex;align-items:center;gap:6px;padding:8px 10px;border-radius:10px;border:2px solid ${s.type===key?t.color:'var(--border)'};background:${s.type===key?t.bg:'transparent'};cursor:pointer;transition:all .2s;font-size:12px;font-weight:${s.type===key?'700':'500'};color:${s.type===key?t.color:'var(--text-2)'}">
                <span>${t.icon}</span> ${t.label}
              </button>`).join('')}
          </div>
        </div>

        <!-- Step 3: Marks + Question -->
        <div style="background:var(--bg-2);border-radius:12px;padding:14px;border:1.5px solid ${ti.color}44">
          <div style="font-size:12px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px">✍️ Step 3 — Question & Marks</div>
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
            <span style="font-size:11px;color:var(--text-3);white-space:nowrap">Marks:</span>
            <input type="number" id="qb-marks" value="${s.marks}" min="1" max="20"
              style="width:64px;padding:6px 8px;border-radius:8px;border:1.5px solid var(--border);background:var(--bg-3);color:var(--text-1);font-size:13px;font-weight:700"
              oninput="_qbState.marks=Number(this.value)||1">
            <span style="font-size:11px;color:${ti.color};background:${ti.bg};padding:3px 8px;border-radius:6px;font-weight:600">${ti.icon} ${ti.label}</span>
          </div>
          <textarea id="qb-question" rows="3"
            style="width:100%;padding:10px;border-radius:10px;border:1.5px solid var(--border);background:var(--bg-3);color:var(--text-1);font-size:13px;resize:vertical;font-family:inherit;line-height:1.5"
            placeholder="Question yahan type karo…"
            oninput="_qbState.question=this.value">${s.question}</textarea>
        </div>

        <!-- MCQ Options — shown only for mcq -->
        <div id="qb-mcq-wrap" style="display:${s.type==='mcq'?'block':'none'};background:var(--bg-2);border-radius:12px;padding:14px;border:1.5px solid rgba(6,182,212,.3)">
          <div style="font-size:12px;font-weight:700;color:#06b6d4;margin-bottom:10px">❓ MCQ Options</div>
          ${['A','B','C','D'].map((ltr,idx)=>`
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            <span style="width:24px;height:24px;border-radius:6px;background:rgba(6,182,212,.2);color:#06b6d4;font-weight:700;font-size:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0">${ltr}</span>
            <input id="qb-opt-${ltr}" value="${s.options[idx]||''}"
              style="flex:1;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);background:var(--bg-3);color:var(--text-1);font-size:13px"
              placeholder="Option ${ltr}" oninput="_qbState.options[${idx}]=this.value">
          </div>`).join('')}
          <div style="margin-top:8px">
            <div style="font-size:12px;font-weight:600;color:var(--text-2);margin-bottom:6px">✅ Correct Answer:</div>
            <div style="display:flex;gap:8px">
              ${['A','B','C','D'].map(ltr=>`
              <button type="button" onclick="_qbState.correctOpt='${ltr}';document.querySelectorAll('.qb-ans-btn').forEach(b=>b.style.background=b.dataset.opt==='${ltr}'?'#06b6d4':'var(--bg-3)');document.querySelectorAll('.qb-ans-btn').forEach(b=>b.style.color=b.dataset.opt==='${ltr}'?'#fff':'var(--text-2)')"
                class="qb-ans-btn" data-opt="${ltr}"
                style="flex:1;padding:8px;border-radius:8px;border:1.5px solid rgba(6,182,212,.4);background:${s.correctOpt===ltr?'#06b6d4':'var(--bg-3)'};color:${s.correctOpt===ltr?'#fff':'var(--text-2)'};cursor:pointer;font-weight:700;font-size:13px;transition:all .2s">
                ${ltr}
              </button>`).join('')}
            </div>
          </div>
        </div>

        <!-- True/False Answer -->
        <div id="qb-tf-wrap" style="display:${s.type==='truefalse'?'flex':'none'};gap:10px">
          <div style="font-size:13px;font-weight:600;color:var(--text-2);align-self:center">✅ Answer:</div>
          ${['True','False'].map(v=>`
          <button type="button" onclick="_qbState.answer='${v}';document.querySelectorAll('.qb-tf-btn').forEach(b=>{b.style.background=b.dataset.val==='${v}'?'#10b981':'var(--bg-3)';b.style.color=b.dataset.val==='${v}'?'#fff':'var(--text-2)';})"
            class="qb-tf-btn" data-val="${v}"
            style="flex:1;padding:10px;border-radius:10px;border:1.5px solid rgba(16,185,129,.4);background:${s.answer===v?'#10b981':'var(--bg-3)'};color:${s.answer===v?'#fff':'var(--text-2)'};cursor:pointer;font-weight:700;font-size:14px;transition:all .2s">
            ${v==='True'?'✅ True':'❌ False'}
          </button>`).join('')}
        </div>

        <!-- Model Answer — short/long/fill -->
        <div id="qb-ans-wrap" style="display:${['short','long','fill'].includes(s.type)?'block':'none'}">
          <div style="font-size:12px;font-weight:700;color:var(--text-3);margin-bottom:6px">💡 Model Answer <span style="font-weight:400;font-size:11px">(optional)</span></div>
          <textarea id="qb-text-answer" rows="2"
            style="width:100%;padding:10px;border-radius:10px;border:1.5px solid var(--border);background:var(--bg-2);color:var(--text-1);font-size:13px;resize:vertical;font-family:inherit"
            placeholder="Model answer / hints…"
            oninput="_qbState.answer=this.value">${['short','long','fill'].includes(s.type)?s.answer:''}</textarea>
        </div>

        <!-- Add Button -->
        <button onclick="saveQBankQuestion()" style="width:100%;padding:14px;background:linear-gradient(135deg,#7c3aed,#06b6d4);color:#fff;border:none;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;transition:opacity .2s" onmouseover="this.style.opacity='.88'" onmouseout="this.style.opacity='1'">
          ➕ Add Question to Bank
        </button>

        <div id="qb-add-status" style="font-size:12px;text-align:center;color:var(--text-3);min-height:16px"></div>
      </div>
    </div>

    <!-- ═══ RIGHT: Question List ═══ -->
    <div>
      <!-- Filters -->
      <div class="card mb-14">
        <div class="card-body" style="padding:12px 14px">
          <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">
            <div style="position:relative;flex:1;min-width:160px">
              <span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--text-3)">🔍</span>
              <input placeholder="Search questions…" value="${s.filter}"
                style="width:100%;padding:8px 8px 8px 32px;border-radius:10px;border:1.5px solid var(--border);background:var(--bg-2);color:var(--text-1);font-size:13px"
                oninput="_qbState.filter=this.value;_qbRefreshList()">
            </div>
            <select style="padding:8px 10px;border-radius:10px;border:1.5px solid var(--border);background:var(--bg-2);color:var(--text-1);font-size:13px"
              onchange="_qbState.filterSubject=this.value;_qbRefreshList()">
              <option value="">All Subjects</option>
              ${subjects.map(x=>`<option value="${x}" ${s.filterSubject===x?'selected':''}>${x}</option>`).join('')}
            </select>
            <select style="padding:8px 10px;border-radius:10px;border:1.5px solid var(--border);background:var(--bg-2);color:var(--text-1);font-size:13px"
              onchange="_qbState.filterType=this.value;_qbRefreshList()">
              <option value="">All Types</option>
              ${Object.entries(typeInfo).map(([k,t])=>`<option value="${k}" ${s.filterType===k?'selected':''}>${t.icon} ${t.label}</option>`).join('')}
            </select>
            <select style="padding:8px 10px;border-radius:10px;border:1.5px solid var(--border);background:var(--bg-2);color:var(--text-1);font-size:13px"
              onchange="_qbState.filterClass=this.value;_qbRefreshList()">
              <option value="">All Classes</option>
              ${classes.map(c=>{const g=c.grade||(c.name.match(/\d+/)||[''])[0];return`<option value="${g}" ${s.filterClass===g?'selected':''}>${c.name}</option>`}).join('')}
            </select>
            <span style="font-size:12px;color:var(--text-3);white-space:nowrap">${filtered.length} / ${bank.length}</span>
          </div>
        </div>
      </div>

      <!-- List -->
      <div id="qbank-list">${_qbRenderList(filtered)}</div>
    </div>
  </div>`;
}

function _qbRenderList(questions) {
  const typeInfo = {
    short:     {label:'Short',   icon:'📝', color:'#10b981', bg:'rgba(16,185,129,.12)'},
    long:      {label:'Long',    icon:'📄', color:'#f59e0b', bg:'rgba(245,158,11,.12)'},
    mcq:       {label:'MCQ',     icon:'❓', color:'#06b6d4', bg:'rgba(6,182,212,.12)'},
    fill:      {label:'Fill',    icon:'✏️', color:'#ec4899', bg:'rgba(236,72,153,.12)'},
    truefalse: {label:'T/F',     icon:'⚖️', color:'#8b5cf6', bg:'rgba(139,92,246,.12)'},
  };

  if (!questions.length) return `<div class="empty-state"><div class="e-icon">🗂️</div><h3>No questions</h3><p>Add questions using the form on the left</p></div>`;

  // Group by subject + chapter
  const groups = {};
  questions.forEach(q=>{
    const key = `${q.subject||'General'}|||${q.chapter||'—'}|||${q.grade||''}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(q);
  });

  return Object.entries(groups).map(([key, qs])=>{
    const [subj, chap, grade] = key.split('|||');
    return `<div class="card mb-14">
      <div class="card-header" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px">
        <div>
          <span style="font-weight:700;font-size:14px">${subj}</span>
          ${chap&&chap!=='—'?`<span style="font-size:12px;color:var(--text-3);margin-left:8px">📖 ${chap}</span>`:''}
          ${grade?`<span style="font-size:11px;color:var(--text-3);margin-left:8px">Class ${grade}</span>`:''}
        </div>
        <span class="badge badge-purple">${qs.length} Q</span>
      </div>
      <div class="card-body" style="padding:0">
        ${qs.map((q,i)=>{
          const ti = typeInfo[q.type]||typeInfo.short;
          return `<div style="padding:14px 16px;border-bottom:${i<qs.length-1?'1px solid var(--border)':'none'}">
            <div style="display:flex;align-items:flex-start;gap:10px">
              <div style="flex-shrink:0;width:32px;height:32px;border-radius:8px;background:${ti.bg};display:flex;align-items:center;justify-content:center;font-size:.9rem">${ti.icon}</div>
              <div style="flex:1;min-width:0">
                <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:6px">
                  <span style="font-size:11px;font-weight:700;color:${ti.color};background:${ti.bg};padding:2px 8px;border-radius:999px">${ti.label}</span>
                  <span style="font-size:11px;color:var(--text-3);background:rgba(245,158,11,.1);padding:2px 8px;border-radius:999px;color:#f59e0b">${q.marks||1} mark${q.marks>1?'s':''}</span>
                </div>
                <div style="font-size:13px;font-weight:600;color:var(--text-1);line-height:1.5;margin-bottom:${q.type==='mcq'?'8px':'0'}">${q.question}</div>
                ${q.type==='mcq'&&q.options?.length?`
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:3px 16px">
                  ${q.options.map((o,oi)=>{const ltr=String.fromCharCode(65+oi);return o?`<div style="font-size:12px;color:${ltr===q.answer?'#10b981':'var(--text-2)'};font-weight:${ltr===q.answer?'700':'400'}">${ltr}) ${o}${ltr===q.answer?' ✓':''}</div>`:''}).join('')}
                </div>`:''}
                ${q.type==='truefalse'?`<div style="font-size:12px;color:#10b981;margin-top:4px">✅ Answer: ${q.answer}</div>`:''}
                ${q.answer&&!['mcq','truefalse'].includes(q.type)?`<div style="font-size:12px;color:var(--text-3);margin-top:4px;font-style:italic">💡 ${q.answer.slice(0,80)}${q.answer.length>80?'…':''}</div>`:''}
              </div>
              <div style="flex-shrink:0;display:flex;flex-direction:column;gap:4px">
                <button class="btn btn-sm btn-cyan"   onclick="qbEditInline('${q.id}')" style="font-size:11px;padding:4px 8px">✏️</button>
                <button class="btn btn-sm btn-danger" onclick="deleteQBank('${q.id}')" style="font-size:11px;padding:4px 8px">🗑️</button>
              </div>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>`;
  }).join('');
}

function _qbRefreshList() {
  const bank = DB.get('question_bank')||[];
  const s = _qbState;
  let filtered = bank.slice().reverse();
  if (s.filterClass)   filtered = filtered.filter(q=>q.grade===s.filterClass||q.classId===s.filterClass);
  if (s.filterSubject) filtered = filtered.filter(q=>q.subject===s.filterSubject);
  if (s.filterType)    filtered = filtered.filter(q=>q.type===s.filterType);
  if (s.filter)        filtered = filtered.filter(q=>(q.question||'').toLowerCase().includes(s.filter.toLowerCase()));
  const el = document.getElementById('qbank-list');
  if (el) el.innerHTML = _qbRenderList(filtered);
}

function _qbRefreshClassSub() {
  const classes = DB.get('classes');
  const cls = classes.find(c=>c.id===_qbState.classId);
  if (cls) {
    const g = cls.grade||(cls.name.match(/\d+/)||[''])[0];
    _qbState.grade = g;
    // Pre-fill subject if only 1 subject for that grade in bank
    const bank = DB.get('question_bank')||[];
    const clsSubs = [...new Set(bank.filter(q=>q.grade===g).map(q=>q.subject).filter(Boolean))];
    if (clsSubs.length===1 && !_qbState.subject) {
      _qbState.subject = clsSubs[0];
      const subEl = document.getElementById('qb-subject');
      if (subEl) subEl.value = clsSubs[0];
    }
  }
}

function _qbSetType(type) {
  _qbState.type = type;
  const typeMarks = {short:2, long:5, mcq:1, fill:1, truefalse:1};
  _qbState.marks = typeMarks[type]||2;
  // toggle visibility
  const mcqWrap = document.getElementById('qb-mcq-wrap');
  const tfWrap  = document.getElementById('qb-tf-wrap');
  const ansWrap = document.getElementById('qb-ans-wrap');
  const marksEl = document.getElementById('qb-marks');
  if (mcqWrap) mcqWrap.style.display = type==='mcq'      ? 'block' : 'none';
  if (tfWrap)  tfWrap.style.display  = type==='truefalse'? 'flex'  : 'none';
  if (ansWrap) ansWrap.style.display = ['short','long','fill'].includes(type) ? 'block' : 'none';
  if (marksEl) marksEl.value = _qbState.marks;
  // update type buttons highlight
  document.querySelectorAll('[onclick^="_qbSetType"]').forEach(btn=>{
    const bType = btn.getAttribute('onclick').replace("_qbSetType('","").replace("')","");
    const typeInfo = {short:{color:'#10b981',bg:'rgba(16,185,129,.12)'},long:{color:'#f59e0b',bg:'rgba(245,158,11,.12)'},mcq:{color:'#06b6d4',bg:'rgba(6,182,212,.12)'},fill:{color:'#ec4899',bg:'rgba(236,72,153,.12)'},truefalse:{color:'#8b5cf6',bg:'rgba(139,92,246,.12)'}};
    const ti = typeInfo[bType]||{};
    const isActive = bType===type;
    btn.style.border       = `2px solid ${isActive?(ti.color||'#7c3aed'):'var(--border)'}`;
    btn.style.background   = isActive ? (ti.bg||'rgba(124,58,237,.1)') : 'transparent';
    btn.style.color        = isActive ? (ti.color||'#7c3aed') : 'var(--text-2)';
    btn.style.fontWeight   = isActive ? '700' : '500';
  });
}

function saveQBankQuestion(editId=null) {
  const classEl = document.getElementById('qb-class');
  const s = _qbState;
  const classId = classEl?.value || s.classId;
  const subject  = (document.getElementById('qb-subject')?.value||'').trim();
  const chapter  = (document.getElementById('qb-chapter')?.value||'').trim();
  const question = (document.getElementById('qb-question')?.value||'').trim();
  const marks    = Number(document.getElementById('qb-marks')?.value)||1;
  const type     = s.type;

  // get grade from classId
  const classes = DB.get('classes');
  const cls = classes.find(c=>c.id===classId);
  const grade = cls ? (cls.grade||(cls.name.match(/\d+/)||[''])[0]) : s.grade;

  if (!classId)  { toast('Select a class','warning'); return; }
  if (!subject)  { toast('Subject is required','warning'); return; }
  if (!question) { toast('Question is required','warning'); return; }

  let answer = '', options = [];
  if (type==='mcq') {
    options = ['A','B','C','D'].map(l=>(document.getElementById(`qb-opt-${l}`)?.value||'').trim());
    answer  = s.correctOpt||'A';
    if (!options.filter(Boolean).length) { toast('MCQ options are required','warning'); return; }
  } else if (type==='truefalse') {
    answer = s.answer||'True';
  } else {
    answer = (document.getElementById('qb-text-answer')?.value||'').trim();
  }

  const data = { type, subject, grade, classId, chapter, question, marks, options, answer };
  let bank = DB.get('question_bank')||[];

  if (editId) {
    const idx = bank.findIndex(q=>q.id===editId);
    if (idx!==-1) bank[idx] = {...bank[idx], ...data};
    DB.set('question_bank', bank);
    toast('Question updated!','success');
  } else {
    bank.push({id:genId('qb'), ...data, addedOn:today()});
    DB.set('question_bank', bank);
    // Reset question only, keep class/subject/chapter
    _qbState.question=''; _qbState.answer=''; _qbState.options=['','','','']; _qbState.correctOpt='A';
    const statusEl = document.getElementById('qb-add-status');
    if (statusEl) { statusEl.innerHTML=`<span style="color:#10b981">✅ Question added! (${bank.length} total)</span>`; setTimeout(()=>{if(statusEl)statusEl.textContent=''},2500); }
    // just refresh the list, don't re-render full page
    const qEl = document.getElementById('qb-question');
    if (qEl) qEl.value='';
    const taEl = document.getElementById('qb-text-answer');
    if (taEl) taEl.value='';
    ['A','B','C','D'].forEach(l=>{ const el=document.getElementById(`qb-opt-${l}`); if(el) el.value=''; });
    _qbRefreshList();
    return;
  }
  renderQuestionBank();
}

function qbEditInline(id) {
  const q = (DB.get('question_bank')||[]).find(x=>x.id===id);
  if (!q) return;
  // Load question into form
  _qbState.classId    = q.classId||'';
  _qbState.grade      = q.grade||'';
  _qbState.subject    = q.subject||'';
  _qbState.chapter    = q.chapter||'';
  _qbState.type       = q.type||'short';
  _qbState.marks      = q.marks||1;
  _qbState.question   = q.question||'';
  _qbState.answer     = q.answer||'';
  _qbState.options    = q.options?.length ? q.options : ['','','',''];
  _qbState.correctOpt = q.type==='mcq' ? (q.answer||'A') : 'A';
  renderQuestionBank();
  // Scroll to form
  setTimeout(()=>{ document.querySelector('#section-questionbank .card')?.scrollIntoView({behavior:'smooth'}); }, 100);
  // Replace Add button with Update button
  setTimeout(()=>{
    const btn = document.querySelector('#section-questionbank .card .btn:last-of-type[onclick="saveQBankQuestion()"]');
    if (btn) { btn.textContent='💾 Update Question'; btn.setAttribute('onclick',`saveQBankQuestion('${id}')`); }
    // Also change Add status text
    const statusEl = document.getElementById('qb-add-status');
    if (statusEl) statusEl.innerHTML=`<span style="color:#f59e0b">✏️ Editing question — press the Update button</span>`;
  }, 150);
  toast('Question loaded for editing','info');
}

function deleteQBank(id) {
  if (!confirmAction('Delete this question?')) return;
  DB.set('question_bank', (DB.get('question_bank')||[]).filter(q=>q.id!==id));
  toast('Question deleted','success');
  _qbRefreshList();
}

// legacy compat — old modal not used anymore but keep function name
function openQBankModal(id=null) {
  if (id) { qbEditInline(id); return; }
  renderQuestionBank();
}
function filterQBank(v) { _qbState.filter=v; _qbRefreshList(); }
function filterQBankSubject(v) { _qbState.filterSubject=v; _qbRefreshList(); }
function filterQBankType(v) { _qbState.filterType=v; _qbRefreshList(); }

// ══════════════════════════════════════════════════════
//  QUESTION PAPER GENERATOR — Select & Auto-Generate
// ══════════════════════════════════════════════════════
let _qpg = {
  tab: 'setup',
  template: 'classic',
  meta: { school:'', examTitle:'Annual Examination', subject:'', grade:'', date:today(), duration:'3 Hours', totalMarks:'100',
    instructions:'All questions are compulsory.\nAttempt all sections.\nWrite legibly and clearly.',
    logo: '' },          // ← school logo (base64)
  selectedIds: new Set(),
  filterSubject:'', filterGrade:'', filterChapter:'', filterType:'', filterSearch:'',
  // Quick-generate state
  qgClass: '', qgSubject: '',
};

// ── keep _qpe for legacy compat
let _qpe = { template:'classic', meta:{school:'',subject:'',grade:'',date:today(),duration:'3 Hours',totalMarks:'100',examTitle:'Annual Examination',instructions:''}, sections:[] };

function renderPaperGenerator() {
  // Auto-fill school name from settings (for new schools)
  const _s = getSettings();
  if (!_qpg.meta.school && _s.schoolName) _qpg.meta.school = _s.schoolName;

  const bank     = DB.get('question_bank') || [];
  const subjects = [...new Set(bank.map(q=>q.subject).filter(Boolean))].sort();
  const grades   = [...new Set(bank.map(q=>q.grade).filter(Boolean))].sort();
  const chapters = [...new Set(bank.map(q=>q.chapter).filter(Boolean))].sort();
  const selCount = _qpg.selectedIds.size;

  document.getElementById('section-papergenerator').innerHTML = `
  <div class="page-header">
    <div>
      <h2>📝 Question Paper Generator</h2>
      <div class="breadcrumb">Select questions from bank → auto-generate professional paper instantly</div>
    </div>
    <div class="d-flex gap-8">
      <button class="btn btn-secondary" onclick="_qpgClearAll()">🗑️ Clear All</button>
      <button class="btn btn-primary"   onclick="_qpgTab('preview')">👁️ Preview &amp; Print</button>
    </div>
  </div>

  <!-- Tab bar -->
  <div class="att-tab-bar mb-16">
    <button class="att-tab ${_qpg.tab==='setup'?'active':''}"    onclick="_qpgTab('setup')">⚙️ Paper Setup</button>
    <button class="att-tab ${_qpg.tab==='select'?'active':''}"   onclick="_qpgTab('select')">
      ☑️ Select Questions
      ${selCount>0?`<span style="background:#7c3aed;color:#fff;border-radius:999px;font-size:.7rem;padding:1px 7px;margin-left:6px">${selCount}</span>`:''}
    </button>
    <button class="att-tab ${_qpg.tab==='preview'?'active':''}"  onclick="_qpgTab('preview')">👁️ Preview &amp; Print</button>
    <button class="att-tab ${_qpg.tab==='creator'?'active':''}"  onclick="_qpgTab('creator')" style="${_qpg.tab==='creator'?'':''}">✏️ Paper Creator</button>
  </div>

  ${_qpg.tab==='setup'   ? _qpgSetupHtml(subjects,grades)              : ''}
  ${_qpg.tab==='select'  ? _qpgSelectHtml(bank,subjects,grades,chapters): ''}
  ${_qpg.tab==='preview' ? _qpgPreviewHtml(bank)                        : ''}
  ${_qpg.tab==='creator' ? '<div id="qpg-creator-wrap"></div>'          : ''}
  `;
}

// ── Tab switcher
function _qpgTab(t) {
  _qpg.tab = t;
  renderPaperGenerator();
  // Wire Paper Creator after DOM is set
  if (t === 'creator' && typeof _pcRenderMain === 'function') {
    _pcRenderMain('qpg-creator-wrap', true);
  }
}

// ── Clear selection
function _qpgClearAll() {
  if (!confirmAction('Clear all selected questions and reset paper?')) return;
  _qpg.selectedIds = new Set();
  _qpg.tab = 'setup';
  renderPaperGenerator();
  toast('Paper cleared','info');
}

// ══════════════════════════════════════════════════════
//  TAB 1 — Paper Setup (meta form)
// ══════════════════════════════════════════════════════
function _qpgSetupHtml(subjects, grades) {
  const m = _qpg.meta;
  const classes = DB.get('classes');
  return `
  <div class="qpg-setup-grid">
    <!-- Left col -->
    <div>

      <!-- School Logo -->
      <div class="card mb-16">
        <div class="card-header"><h3>🖼️ School Logo</h3></div>
        <div class="card-body">
          ${(()=>{const sl=getSettings().schoolLogo;const activeLogo=m.logo||sl;return`
          <div style="display:flex;align-items:center;gap:16px">
            <div id="qpg-logo-preview" style="width:80px;height:80px;border-radius:12px;border:2px dashed var(--border);background:var(--bg-2);display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0">
              ${activeLogo?`<img src="${activeLogo}" style="width:100%;height:100%;object-fit:contain">`:'<span style="font-size:2rem">🏫</span>'}
            </div>
            <div style="flex:1">
              <div style="font-size:13px;font-weight:600;margin-bottom:4px">School Logo</div>
              ${sl&&!m.logo?'<div style="font-size:11px;color:#059669;margin-bottom:6px">✅ Using logo from Settings</div>':''}
              <div style="font-size:11px;color:var(--text-3);margin-bottom:10px">Will appear at top of every generated paper</div>
              <div style="display:flex;gap:8px;flex-wrap:wrap">
                <button type="button" class="btn btn-secondary" style="padding:6px 14px;font-size:12px" onclick="document.getElementById('qpg-logo-input').click()">📁 Override Logo</button>
                ${m.logo?`<button type="button" class="btn btn-danger" style="padding:6px 12px;font-size:12px" onclick="_qpg.meta.logo='';_qpgSetupHtml&&document.getElementById('qpg-logo-preview')&&(document.getElementById('qpg-logo-preview').innerHTML=getSettings().schoolLogo?'<img src=\\''+getSettings().schoolLogo+'\\' style=\\'width:100%;height:100%;object-fit:contain\\'>':'<span style=\\'font-size:2rem\\'>🏫</span>');toast('Custom logo removed — using settings logo','info')">🗑 Remove Override</button>`:''}
              </div>
              <input type="file" id="qpg-logo-input" accept="image/*" style="display:none" onchange="handleQPGLogo(this)">
              <div id="qpg-logo-status" style="font-size:11px;color:var(--text-3);margin-top:6px"></div>
            </div>
          </div>`;})()}
        </div>
      </div>

      <div class="card mb-16">
        <div class="card-header"><h3>🏫 Paper Details</h3></div>
        <div class="card-body">
          <div class="form-group">
            <label class="form-label">School Name</label>
            <input class="form-control" id="qpg-school" value="${m.school||getSettings().schoolName||''}" placeholder="e.g. Vission Marg Academy"
              oninput="_qpg.meta.school=this.value">
          </div>
          <div class="form-group">
            <label class="form-label">Exam Title</label>
            <input class="form-control" id="qpg-title" value="${m.examTitle||'Annual Examination'}"
              oninput="_qpg.meta.examTitle=this.value">
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Subject</label>
              <input class="form-control" id="qpg-sub" value="${m.subject||''}" list="qpg-subs-dl"
                placeholder="Mathematics" oninput="_qpg.meta.subject=this.value">
              <datalist id="qpg-subs-dl">${subjects.map(s=>`<option value="${s}">`).join('')}</datalist>
            </div>
            <div class="form-group">
              <label class="form-label">Class / Grade</label>
              <input class="form-control" id="qpg-grade" value="${m.grade||''}" list="qpg-grades-dl"
                placeholder="e.g. 8th" oninput="_qpg.meta.grade=this.value">
              <datalist id="qpg-grades-dl">${grades.map(g=>`<option value="${g}">`).join('')}</datalist>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Exam Date</label>
              <input type="date" class="form-control" value="${m.date||''}" oninput="_qpg.meta.date=this.value">
            </div>
            <div class="form-group">
              <label class="form-label">Duration</label>
              <input class="form-control" value="${m.duration||'3 Hours'}" placeholder="3 Hours"
                oninput="_qpg.meta.duration=this.value">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Total Marks</label>
            <input type="number" class="form-control" value="${m.totalMarks||'100'}" min="1"
              oninput="_qpg.meta.totalMarks=this.value">
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><h3>📋 Instructions</h3></div>
        <div class="card-body">
          <textarea class="form-control" rows="5" placeholder="General instructions for students (one per line)…"
            oninput="_qpg.meta.instructions=this.value">${m.instructions||''}</textarea>
          <div style="font-size:.72rem;color:var(--text2);margin-top:6px">Each line will appear as a numbered instruction on the paper.</div>
        </div>
      </div>
    </div>

    <!-- Right col -->
    <div>
      <!-- QUICK GENERATE by Class -->
      <div class="card mb-16" style="border:2px solid #7c3aed22;background:rgba(124,58,237,.04)">
        <div class="card-header"><h3>⚡ Quick Generate by Class</h3></div>
        <div class="card-body">
          <div style="font-size:12px;color:var(--text-3);margin-bottom:12px">Select a class → questions will appear → choose and generate</div>
          <div class="form-group">
            <label class="form-label">Select Class</label>
            <select class="form-control" id="qpg-quick-class" onchange="_qpg.qgClass=this.value;_qpg.qgSubject='';renderPaperGenerator()">
              <option value="">— Select Class —</option>
              ${classes.map(c=>`<option value="${c.id}" ${_qpg.qgClass===c.id?'selected':''}>${c.name}</option>`).join('')}
            </select>
          </div>
          ${_qpg.qgClass ? (()=>{
            const cls = classes.find(c=>c.id===_qpg.qgClass);
            const bank = DB.get('question_bank')||[];
            // Match by grade from class name
            const grade = cls ? (cls.grade || (cls.name.match(/\d+/)||[''])[0]) : '';
            const clsQs = grade ? bank.filter(q=>q.grade===grade) : bank;
            const clsSubjects = [...new Set(clsQs.map(q=>q.subject).filter(Boolean))];
            return `
            <div class="form-group">
              <label class="form-label">Subject <span style="font-size:11px;color:var(--text-3)">${clsQs.length} questions in bank</span></label>
              <select class="form-control" id="qpg-quick-sub" onchange="_qpg.qgSubject=this.value;renderPaperGenerator()">
                <option value="">All Subjects</option>
                ${clsSubjects.map(s=>`<option value="${s}" ${_qpg.qgSubject===s?'selected':''}>${s}</option>`).join('')}
              </select>
            </div>
            ${(()=>{
              const subQs = _qpg.qgSubject ? clsQs.filter(q=>q.subject===_qpg.qgSubject) : clsQs;
              const mcqs  = subQs.filter(q=>q.type==='mcq');
              const short = subQs.filter(q=>q.type==='short');
              const long  = subQs.filter(q=>q.type==='long');
              if (!subQs.length) return '<div style="color:var(--text-3);font-size:13px;text-align:center;padding:16px">No questions found in bank for this class.<br>Please add questions in Question Bank first.</div>';
              return `
              <div style="font-size:13px;font-weight:600;margin-bottom:10px">📊 Available Questions:</div>
              <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px">
                <div style="background:rgba(6,182,212,.1);border:1.5px solid rgba(6,182,212,.3);border-radius:10px;padding:10px;text-align:center">
                  <div style="font-size:20px;font-weight:700;color:#06b6d4">${mcqs.length}</div>
                  <div style="font-size:11px;color:var(--text-3)">MCQ</div>
                </div>
                <div style="background:rgba(16,185,129,.1);border:1.5px solid rgba(16,185,129,.3);border-radius:10px;padding:10px;text-align:center">
                  <div style="font-size:20px;font-weight:700;color:#10b981">${short.length}</div>
                  <div style="font-size:11px;color:var(--text-3)">Short</div>
                </div>
                <div style="background:rgba(245,158,11,.1);border:1.5px solid rgba(245,158,11,.3);border-radius:10px;padding:10px;text-align:center">
                  <div style="font-size:20px;font-weight:700;color:#f59e0b">${long.length}</div>
                  <div style="font-size:11px;color:var(--text-3)">Long</div>
                </div>
              </div>
              <div style="font-size:13px;font-weight:600;margin-bottom:8px">Choose questions to include:</div>
              <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:14px">
                ${mcqs.length?`<label style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);background:var(--bg-2)">
                  <input type="checkbox" id="qpg-sel-mcq" style="accent-color:#06b6d4"> <span style="font-size:13px">❓ MCQ (${mcqs.length} questions)</span>
                  <input type="number" id="qpg-cnt-mcq" value="${Math.min(10,mcqs.length)}" min="1" max="${mcqs.length}" style="width:56px;margin-left:auto;padding:3px 6px;border-radius:6px;border:1px solid var(--border);background:var(--bg-3);color:var(--text-1);font-size:12px">
                </label>`:''}
                ${short.length?`<label style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);background:var(--bg-2)">
                  <input type="checkbox" id="qpg-sel-short" style="accent-color:#10b981"> <span style="font-size:13px">📝 Short Answer (${short.length} questions)</span>
                  <input type="number" id="qpg-cnt-short" value="${Math.min(5,short.length)}" min="1" max="${short.length}" style="width:56px;margin-left:auto;padding:3px 6px;border-radius:6px;border:1px solid var(--border);background:var(--bg-3);color:var(--text-1);font-size:12px">
                </label>`:''}
                ${long.length?`<label style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:8px 10px;border-radius:8px;border:1.5px solid var(--border);background:var(--bg-2)">
                  <input type="checkbox" id="qpg-sel-long" style="accent-color:#f59e0b"> <span style="font-size:13px">📄 Long Answer (${long.length} questions)</span>
                  <input type="number" id="qpg-cnt-long" value="${Math.min(3,long.length)}" min="1" max="${long.length}" style="width:56px;margin-left:auto;padding:3px 6px;border-radius:6px;border:1px solid var(--border);background:var(--bg-3);color:var(--text-1);font-size:12px">
                </label>`:''}
              </div>
              <button class="btn btn-primary" style="width:100%;padding:12px" onclick="_qpgQuickGenerate('${grade}')">
                ⚡ Generate Question Paper
              </button>`;
            })()}`;
          })() : '<div style="color:var(--text-3);font-size:13px;padding:12px;text-align:center">Select a class</div>'}
        </div>
      </div>

      <div class="card mb-16">
        <div class="card-header"><h3>🎨 Paper Template</h3></div>
        <div class="card-body">
          ${[
            ['classic','🏛️ Classic','Standard bordered layout — works for all exams'],
            ['cbse',   '🇮🇳 CBSE Style','CBSE-format with sections A/B/C'],
            ['modern', '✨ Modern','Colored header with clean lines'],
            ['minimal','📄 Minimal','Clean, print-friendly, no borders'],
          ].map(([id,name,desc])=>`
          <div onclick="_qpg.template='${id}';document.querySelectorAll('.qpg-tmpl').forEach(e=>e.classList.remove('active'));this.classList.add('active');"
            class="qpg-tmpl ${_qpg.template===id?'active':''}"
            style="display:flex;align-items:center;gap:14px;padding:12px 14px;border-radius:10px;border:2px solid ${_qpg.template===id?'#7c3aed':'rgba(255,255,255,.1)'};cursor:pointer;margin-bottom:10px;background:${_qpg.template===id?'rgba(124,58,237,.12)':'rgba(255,255,255,.03)'};transition:all .2s">
            <div style="font-size:1.6rem">${name.split(' ')[0]}</div>
            <div>
              <div style="font-weight:700;font-size:.9rem">${name.split(' ').slice(1).join(' ')}</div>
              <div style="font-size:.75rem;color:var(--text2)">${desc}</div>
            </div>
            ${_qpg.template===id?'<div style="margin-left:auto;color:#a78bfa">✓</div>':''}
          </div>`).join('')}
        </div>
      </div>

      <div class="card" style="background:rgba(124,58,237,.06);border:1px solid rgba(124,58,237,.2)">
        <div class="card-body">
          <div style="font-weight:700;margin-bottom:8px;color:#a78bfa">💡 Want to select manually?</div>
          <ol style="margin:0;padding-left:18px;font-size:.83rem;line-height:1.9;color:var(--text2)">
            <li>Fill paper details (school, subject, class…)</li>
            <li>Go to the <b style="color:var(--text1)">Select Questions</b> tab</li>
            <li>Filter and tick the questions</li>
            <li><b style="color:var(--text1)">Preview &amp; Print</b> — paper ready!</li>
          </ol>
          <button class="btn btn-primary" style="margin-top:14px;width:100%;" onclick="_qpgTab('select')">
            ➡️ Select Questions Manually
          </button>
        </div>
      </div>
    </div>
  </div>`;
}

// ── Logo upload handler ─────────────────────────────
function handleQPGLogo(input) {
  const file = input.files[0]; if (!file) return;
  const statusEl = document.getElementById('qpg-logo-status');
  statusEl.textContent = '⏳ Processing...';
  const MAX_BYTES = 100*1024;
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let w=img.width, h=img.height, MAX_DIM=300;
      if(w>MAX_DIM||h>MAX_DIM){if(w>h){h=Math.round(h*MAX_DIM/w);w=MAX_DIM;}else{w=Math.round(w*MAX_DIM/h);h=MAX_DIM;}}
      canvas.width=w; canvas.height=h;
      canvas.getContext('2d').drawImage(img,0,0,w,h);
      let q=0.9, d=canvas.toDataURL('image/png');
      if(d.length*0.75>MAX_BYTES) d=canvas.toDataURL('image/jpeg',0.85);
      _qpg.meta.logo = d;
      const kb=Math.round(d.length*0.75/1024);
      document.getElementById('qpg-logo-preview').innerHTML=`<img src="${d}" style="width:100%;height:100%;object-fit:contain">`;
      statusEl.innerHTML=`<span style="color:#16a34a">✅ Logo ready (${kb} KB)</span>`;
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// ── Quick Generate function ─────────────────────────
function _qpgQuickGenerate(grade) {
  const bank = DB.get('question_bank')||[];
  const subFilter = _qpg.qgSubject;
  let pool = grade ? bank.filter(q=>q.grade===grade) : bank;
  if (subFilter) pool = pool.filter(q=>q.subject===subFilter);

  const mcqs  = pool.filter(q=>q.type==='mcq');
  const short = pool.filter(q=>q.type==='short');
  const long  = pool.filter(q=>q.type==='long');

  const selMCQ   = document.getElementById('qpg-sel-mcq')?.checked;
  const selShort = document.getElementById('qpg-sel-short')?.checked;
  const selLong  = document.getElementById('qpg-sel-long')?.checked;
  const cntMCQ   = parseInt(document.getElementById('qpg-cnt-mcq')?.value)||0;
  const cntShort = parseInt(document.getElementById('qpg-cnt-short')?.value)||0;
  const cntLong  = parseInt(document.getElementById('qpg-cnt-long')?.value)||0;

  if (!selMCQ && !selShort && !selLong) { toast('Select at least one question type','warning'); return; }

  _qpg.selectedIds = new Set();
  const shuffle = arr => arr.slice().sort(()=>Math.random()-.5);
  if (selMCQ)   shuffle(mcqs).slice(0,cntMCQ).forEach(q=>_qpg.selectedIds.add(q.id));
  if (selShort) shuffle(short).slice(0,cntShort).forEach(q=>_qpg.selectedIds.add(q.id));
  if (selLong)  shuffle(long).slice(0,cntLong).forEach(q=>_qpg.selectedIds.add(q.id));

  if (!_qpg.selectedIds.size) { toast('No questions found — add them in the Question Bank first','warning'); return; }

  // Auto-fill meta from class info
  if (subFilter && !_qpg.meta.subject) _qpg.meta.subject = subFilter;
  if (grade && !_qpg.meta.grade) _qpg.meta.grade = grade;
  const schoolName = getSettings().schoolName;
  if (schoolName && !_qpg.meta.school) _qpg.meta.school = schoolName;

  toast(`${_qpg.selectedIds.size} questions selected! Opening Preview tab…`,'success');
  _qpgTab('preview');
}

// ══════════════════════════════════════════════════════
//  TAB 2 — Select Questions
// ══════════════════════════════════════════════════════
function _qpgSelectHtml(bank, subjects, grades, chapters) {
  // apply filters
  let filtered = bank.slice();
  if (_qpg.filterSubject) filtered = filtered.filter(q=>q.subject===_qpg.filterSubject);
  if (_qpg.filterGrade)   filtered = filtered.filter(q=>q.grade===_qpg.filterGrade);
  if (_qpg.filterChapter) filtered = filtered.filter(q=>q.chapter===_qpg.filterChapter);
  if (_qpg.filterType)    filtered = filtered.filter(q=>q.type===_qpg.filterType);
  if (_qpg.filterSearch)  {
    const s = _qpg.filterSearch.toLowerCase();
    filtered = filtered.filter(q=>(q.question||'').toLowerCase().includes(s));
  }

  const selCount = _qpg.selectedIds.size;
  const allVisible = filtered.length > 0 && filtered.every(q=>_qpg.selectedIds.has(q.id));

  return `
  <!-- Filters -->
  <div class="card mb-12">
    <div class="card-body" style="padding:14px 16px;">
      <!-- Row 1: Subject + Class + Type (3-col grid → 1-col on mobile) -->
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:8px;" class="qpg-filter-row">
        <div class="form-group" style="margin:0">
          <label class="form-label" style="font-size:.72rem">Subject</label>
          <select class="form-control" style="padding:6px 8px;font-size:.83rem;"
            onchange="_qpg.filterSubject=this.value;renderPaperGenerator()">
            <option value="">All Subjects</option>
            ${subjects.map(s=>`<option value="${s}" ${_qpg.filterSubject===s?'selected':''}>${s}</option>`).join('')}
          </select>
        </div>
        <div class="form-group" style="margin:0">
          <label class="form-label" style="font-size:.72rem">Class</label>
          <select class="form-control" style="padding:6px 8px;font-size:.83rem;"
            onchange="_qpg.filterGrade=this.value;renderPaperGenerator()">
            <option value="">All Classes</option>
            ${grades.map(g=>`<option value="${g}" ${_qpg.filterGrade===g?'selected':''}>${g}</option>`).join('')}
          </select>
        </div>
        <div class="form-group" style="margin:0">
          <label class="form-label" style="font-size:.72rem">Type</label>
          <select class="form-control" style="padding:6px 8px;font-size:.83rem;"
            onchange="_qpg.filterType=this.value;renderPaperGenerator()">
            <option value="">All Types</option>
            <option value="mcq"      ${_qpg.filterType==='mcq'?'selected':''}>MCQ</option>
            <option value="short"    ${_qpg.filterType==='short'?'selected':''}>Short Answer</option>
            <option value="long"     ${_qpg.filterType==='long'?'selected':''}>Long Answer</option>
            <option value="truefalse"${_qpg.filterType==='truefalse'?'selected':''}>True / False</option>
            <option value="fill"     ${_qpg.filterType==='fill'?'selected':''}>Fill in Blank</option>
          </select>
        </div>
      </div>
      <!-- Row 2: Chapter + Search + Reset -->
      <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:flex-end;">
        <div class="form-group" style="margin:0;flex:1;min-width:120px">
          <label class="form-label" style="font-size:.72rem">Chapter</label>
          <select class="form-control" style="padding:6px 8px;font-size:.83rem;"
            onchange="_qpg.filterChapter=this.value;renderPaperGenerator()">
            <option value="">All Chapters</option>
            ${chapters.map(c=>`<option value="${c}" ${_qpg.filterChapter===c?'selected':''}>${c}</option>`).join('')}
          </select>
        </div>
        <div class="form-group" style="margin:0;flex:2;min-width:140px">
          <label class="form-label" style="font-size:.72rem">Search</label>
          <input class="form-control" style="padding:6px 8px;font-size:.83rem;" placeholder="Search question text…"
            value="${_qpg.filterSearch||''}"
            oninput="_qpg.filterSearch=this.value;renderPaperGenerator()">
        </div>
        <button class="btn btn-sm btn-secondary" style="white-space:nowrap"
          onclick="_qpg.filterSubject='';_qpg.filterGrade='';_qpg.filterChapter='';_qpg.filterType='';_qpg.filterSearch='';renderPaperGenerator()">
          ↺ Reset
        </button>
      </div>
    </div>
  </div>

  <!-- Action bar -->
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;flex-wrap:wrap;gap:8px;">
    <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
      <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:.83rem;font-weight:600;">
        <input type="checkbox" ${allVisible?'checked':''} onchange="_qpgToggleAll(${JSON.stringify(filtered.map(q=>q.id))},this.checked)">
        Select visible (${filtered.length})
      </label>
      <span style="font-size:.8rem;color:var(--text2)">${bank.length} total in bank</span>
    </div>
    <div style="display:flex;align-items:center;gap:10px;">
      ${selCount>0?`<span style="font-size:.83rem;font-weight:700;color:#a78bfa">✅ ${selCount} selected</span>`:''}
      ${selCount>0?`<button class="btn btn-sm btn-primary" onclick="_qpgTab('preview')">👁️ Preview Paper →</button>`:''}
    </div>
  </div>

  <!-- Question list -->
  ${filtered.length===0 ? `
    <div class="card"><div class="card-body" style="text-align:center;padding:40px;color:var(--text2)">
      <div style="font-size:2.5rem;margin-bottom:12px">📭</div>
      <div style="font-weight:600;margin-bottom:6px">No questions found</div>
      <div style="font-size:.82rem">${bank.length===0?'Question bank is empty. Add questions first from the <b>Question Bank</b> section.':'Try changing or resetting the filters above.'}</div>
    </div></div>
  ` : `
  <div style="display:flex;flex-direction:column;gap:6px;">
    ${filtered.map((q,idx)=>{
      const sel = _qpg.selectedIds.has(q.id);
      const typeColors = {mcq:'#06b6d4',short:'#10b981',long:'#f59e0b',truefalse:'#8b5cf6',fill:'#ec4899'};
      const tc = typeColors[q.type]||'#94a3b8';
      return `<div onclick="_qpgToggleQ('${q.id}')" style="display:flex;align-items:flex-start;gap:12px;padding:12px 14px;border-radius:10px;border:2px solid ${sel?'#7c3aed':'rgba(255,255,255,.08)'};background:${sel?'rgba(124,58,237,.1)':'rgba(255,255,255,.03)'};cursor:pointer;transition:all .2s;">
        <input type="checkbox" ${sel?'checked':''} onclick="event.stopPropagation();_qpgToggleQ('${q.id}')" style="margin-top:2px;flex-shrink:0;accent-color:#7c3aed;width:16px;height:16px;">
        <div style="flex:1;min-width:0;">
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:5px;">
            <span style="font-size:.68rem;font-weight:700;padding:2px 7px;border-radius:999px;background:${tc}22;color:${tc};border:1px solid ${tc}44">${(q.type||'?').toUpperCase()}</span>
            ${q.subject?`<span style="font-size:.68rem;padding:2px 7px;border-radius:999px;background:rgba(255,255,255,.07);color:var(--text2)">${q.subject}</span>`:''}
            ${q.grade?`<span style="font-size:.68rem;padding:2px 7px;border-radius:999px;background:rgba(255,255,255,.07);color:var(--text2)">Class ${q.grade}</span>`:''}
            ${q.chapter?`<span style="font-size:.68rem;padding:2px 7px;border-radius:999px;background:rgba(255,255,255,.07);color:var(--text2)">${q.chapter}</span>`:''}
            ${q.marks?`<span style="font-size:.68rem;padding:2px 7px;border-radius:999px;background:rgba(245,158,11,.15);color:#f59e0b">${q.marks} mark${q.marks!=1?'s':''}</span>`:''}
          </div>
          <div style="font-size:.87rem;line-height:1.5;color:var(--text1)">${q.question||''}</div>
          ${q.type==='mcq'&&q.options?.length?`
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:2px 16px;margin-top:6px;">
              ${q.options.map((op,oi)=>`<div style="font-size:.78rem;color:var(--text2)">${String.fromCharCode(65+oi)}) ${op}</div>`).join('')}
            </div>`:''
          }
        </div>
        <div style="flex-shrink:0;font-size:.75rem;color:var(--text2);margin-top:2px">#${idx+1}</div>
      </div>`;
    }).join('')}
  </div>
  `}

  ${selCount>0?`
  <div style="position:sticky;bottom:20px;margin-top:16px;background:rgba(124,58,237,.95);backdrop-filter:blur(8px);padding:12px 20px;border-radius:12px;display:flex;align-items:center;justify-content:space-between;box-shadow:0 4px 24px rgba(124,58,237,.4);">
    <div style="color:#fff;font-weight:700">✅ ${selCount} question${selCount!=1?'s':''} selected</div>
    <button class="btn btn-sm" style="background:#fff;color:#7c3aed;font-weight:700;" onclick="_qpgTab('preview')">👁️ Preview &amp; Print Paper →</button>
  </div>`:''}
  `;
}

function _qpgToggleQ(id) {
  if (_qpg.selectedIds.has(id)) _qpg.selectedIds.delete(id);
  else _qpg.selectedIds.add(id);
  renderPaperGenerator();
}

function _qpgToggleAll(ids, checked) {
  ids.forEach(id => checked ? _qpg.selectedIds.add(id) : _qpg.selectedIds.delete(id));
  renderPaperGenerator();
}

// ══════════════════════════════════════════════════════
//  TAB 3 — Preview & Print
// ══════════════════════════════════════════════════════
function _qpgPreviewHtml(bank) {
  const sel = bank.filter(q => _qpg.selectedIds.has(q.id));
  if (!sel.length) return `
    <div class="card"><div class="card-body" style="text-align:center;padding:50px;color:var(--text2)">
      <div style="font-size:2.5rem;margin-bottom:12px">📭</div>
      <div style="font-weight:600;margin-bottom:8px">No questions selected</div>
      <div style="font-size:.82rem;margin-bottom:18px">Go back to Select Questions tab and tick the questions you want.</div>
      <button class="btn btn-primary" onclick="_qpgTab('select')">☑️ Select Questions</button>
    </div></div>`;

  const paperHtml = _qpgBuildPaperHtml(sel);
  return `
  <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:14px;flex-wrap:wrap;">
    <span style="font-size:.82rem;color:var(--text2)">${sel.length} questions · Template: ${_qpg.template}</span>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn btn-secondary" onclick="_qpgTab('select')">✏️ Edit Selection</button>
      <button class="btn btn-secondary" onclick="_qpgPrintAnswerKey(${JSON.stringify(sel.map(q=>q.id))})">📋 Answer Key</button>
      <button class="btn btn-cyan"      onclick="_qpgSaveToQPapers()">💾 Save to Q-Papers</button>
      <button class="btn btn-primary"   onclick="_qpgPrint()">🖨️ Print Paper</button>
    </div>
  </div>
  <div class="qpe-preview" style="max-height:none;overflow:visible;">
    <div class="qpe-preview-inner" id="qpg-preview-content">
      ${paperHtml}
    </div>
  </div>`;
}

function _qpgBuildPaperHtml(sel) {
  const m  = _qpg.meta;
  const t  = _qpg.template;

  // Group: MCQ → Short → Long → TrueFalse → Fill
  const typeOrder = ['mcq','short','long','truefalse','fill'];
  const groups = {};
  typeOrder.forEach(tp => { groups[tp] = sel.filter(q=>q.type===tp); });

  const typeLabels = {mcq:'Section A — Multiple Choice Questions',short:'Section B — Short Answer Questions',long:'Section C — Long Answer Questions',truefalse:'Section D — True / False',fill:'Section E — Fill in the Blanks'};
  const typeMark = {mcq:'1',short:'3',long:'5',truefalse:'1',fill:'2'};

  // Calculate total marks
  const calcMarks = sel.reduce((s,q)=>{
    const mark = q.marks || Number(typeMark[q.type]||1);
    return s + mark;
  }, 0);

  const instLines = (m.instructions||'All questions are compulsory.\nAttempt all sections.\nWrite answers clearly.').split('\n').filter(Boolean);

  const activeLogo = m.logo || getSettings().schoolLogo || '';
  const logoHtml = activeLogo
    ? `<img src="${activeLogo}" style="height:70px;width:70px;object-fit:contain;display:block;margin:0 auto 6px">`
    : '';

  let headerHtml = '';
  if (t === 'modern') {
    headerHtml = `<div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;padding:20px 24px;margin:-24px -24px 16px;text-align:center;border-radius:8px 8px 0 0;">
      ${activeLogo?`<img src="${activeLogo}" style="height:60px;width:60px;object-fit:contain;border-radius:8px;margin-bottom:8px;background:rgba(255,255,255,.9);padding:4px">`:''}
      <div style="font-size:11pt;opacity:.85">${m.school||'School Name'}</div>
      <div style="font-size:17pt;font-weight:bold;margin:4px 0">${m.examTitle||'Examination'}</div>
      <div style="font-size:11pt">${m.subject||'Subject'} &mdash; Class ${m.grade||'—'}</div>
    </div>`;
  } else if (t === 'cbse') {
    headerHtml = `<div style="text-align:center;border-bottom:3px double #000;padding-bottom:10px;margin-bottom:10px;">
      ${logoHtml}
      <div style="font-size:10pt;font-weight:bold;text-transform:uppercase;letter-spacing:.08em">${m.school||'School Name'}</div>
      <div style="font-size:8pt;margin:2px 0">Affiliated to CBSE</div>
      <div style="font-size:14pt;font-weight:bold;margin:6px 0;text-transform:uppercase">${m.examTitle||'Examination'}</div>
      <div style="font-size:10pt">${m.subject||'Subject'} &nbsp;|&nbsp; Class: ${m.grade||'—'} &nbsp;|&nbsp; Session: ${new Date().getFullYear()}-${new Date().getFullYear()+1}</div>
    </div>`;
  } else {
    headerHtml = `<div style="text-align:center;margin-bottom:12px;">
      ${logoHtml}
      <div style="font-size:13pt;font-weight:bold">${m.school||'School Name'}</div>
      <div style="font-size:11pt;margin:4px 0">${m.examTitle||'Examination'}</div>
      <div style="font-size:10pt">${m.subject||'Subject'} &nbsp;&mdash;&nbsp; Class: ${m.grade||'—'}</div>
    </div>`;
  }

  const metaRow = `<div style="display:grid;grid-template-columns:1fr 1fr;font-size:9.5pt;margin-bottom:10px;border:${t==='minimal'?'none':'1px solid #ccc'};padding:8px 10px;border-radius:4px;">
    <div>📅 <b>Date:</b> ${m.date ? new Date(m.date).toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'}) : '___________'}</div>
    <div style="text-align:right">⏱ <b>Duration:</b> ${m.duration||'3 Hours'}</div>
    <div>🎯 <b>Max Marks:</b> ${m.totalMarks||calcMarks}</div>
    <div style="text-align:right">📊 <b>Questions:</b> ${sel.length}</div>
  </div>`;

  const instrHtml = instLines.length ? `<div style="font-size:8.5pt;border:1px solid ${t==='minimal'?'transparent':'#ccc'};padding:8px 10px;border-radius:4px;margin-bottom:12px;">
    <b>General Instructions:</b>
    <ol style="margin:4px 0 0;padding-left:18px;">
      ${instLines.map(l=>`<li style="margin-bottom:2px">${l}</li>`).join('')}
    </ol>
  </div>` : '';

  let qNum = 0;
  const sectionsHtml = typeOrder.map(tp => {
    const qs = groups[tp];
    if (!qs.length) return '';
    const label = typeLabels[tp];
    const secStart = qNum + 1;
    const qsHtml = qs.map(q => {
      qNum++;
      const mark = q.marks || Number(typeMark[tp]||1);
      let qBody = `<div style="display:flex;gap:8px;margin-bottom:${tp==='long'?'20':'12'}px;align-items:flex-start;">
        <span style="font-weight:700;min-width:22px;font-size:10pt">${qNum}.</span>
        <div style="flex:1">
          <div style="font-size:10pt;line-height:1.55">${q.question}</div>
          ${tp==='mcq'&&q.options?.length ? `<div style="display:grid;grid-template-columns:1fr 1fr;gap:3px 20px;margin-top:6px;padding-left:4px;">
            ${q.options.map((op,oi)=>`<div style="font-size:9.5pt">(${String.fromCharCode(65+oi)}) ${op}</div>`).join('')}
          </div>` : ''}
          ${tp==='long'?`<div style="margin-top:10px;border-bottom:1px dashed #ccc;"></div><div style="border-bottom:1px dashed #ccc;margin-top:28px;"></div><div style="border-bottom:1px dashed #ccc;margin-top:28px;"></div>`:''}
          ${tp==='fill'?`<div style="margin-top:4px;border-bottom:1px solid #000;width:160px;height:1px;display:inline-block;"></div>`:''}
        </div>
        <span style="font-size:8.5pt;color:#555;white-space:nowrap;flex-shrink:0">[${mark} mark${mark!=1?'s':''}]</span>
      </div>`;
      return qBody;
    }).join('');
    return `<div style="margin-bottom:16px;">
      <div style="font-size:11pt;font-weight:bold;border-bottom:${t==='minimal'?'1px dashed #ccc':'2px solid #333'};padding-bottom:4px;margin-bottom:10px;">${label} &nbsp;<span style="font-size:9pt;font-weight:normal;">(Q.${secStart}–Q.${qNum})</span></div>
      ${qsHtml}
    </div>`;
  }).join('');

  const wrapStyle = t==='minimal'
    ? 'font-family:Arial,sans-serif;color:#111;padding:24px;'
    : 'font-family:Arial,sans-serif;color:#111;border:2px solid #333;padding:24px;border-radius:4px;';

  return `<div style="${wrapStyle}">
    ${headerHtml}
    ${metaRow}
    ${instrHtml}
    <hr style="border:none;border-top:${t==='minimal'?'1px dashed #ccc':'2px solid #333'};margin:12px 0;">
    ${sectionsHtml}
    <div style="text-align:center;font-size:8pt;margin-top:20px;color:#777;border-top:1px solid #ccc;padding-top:8px;">
      ✦ End of Question Paper ✦ &nbsp;|&nbsp; All the best!
    </div>
  </div>`;
}

function _qpgPrint() {
  const sel = (DB.get('question_bank')||[]).filter(q=>_qpg.selectedIds.has(q.id));
  if (!sel.length) { toast('No questions selected','warning'); return; }
  const html = _qpgBuildPaperHtml(sel);
  const m = _qpg.meta;
  printHtml(html, `${m.examTitle||'Question Paper'} - ${m.subject||''} Class ${m.grade||''}`,
    `body{margin:20px 30px;} @page{margin:15mm 20mm;}`);
}

function _qpgSaveToQPapers() {
  const sel = (DB.get('question_bank')||[]).filter(q=>_qpg.selectedIds.has(q.id));
  if (!sel.length) { toast('No questions selected','warning'); return; }
  const m = _qpg.meta;
  const html = _qpgBuildPaperHtml(sel);
  // Save as a question paper record — visible in Q-Papers section
  const classes = DB.get('classes');
  const cls = classes.find(c=>(c.grade||'')===(m.grade||'') || c.name.includes(m.grade||'')) || null;
  const title = `${m.examTitle||'Question Paper'} — ${m.subject||'General'} — ${m.grade?'Class '+m.grade:''}`;
  DB.push('question_papers',{
    id: genId('qp'),
    classId: cls?cls.id:'',
    subject: m.subject||'',
    title,
    uploadedBy: CU.name,
    uploadedOn: today(),
    generatedHtml: html,   // store generated HTML
    isGenerated: true,
    selCount: sel.length,
    template: _qpg.template,
  });
  toast(`Paper saved to Question Papers section! "${title.slice(0,40)}..."`, 'success');
  // Switch to qpapers section
  setTimeout(()=>activateNav('qpapers'), 1200);
}

function _qpgPrintAnswerKey(ids) {
  const bank = DB.get('question_bank')||[];
  const sel  = ids ? bank.filter(q=>ids.includes(q.id)) : bank.filter(q=>_qpg.selectedIds.has(q.id));
  if (!sel.length) { toast('No questions selected','warning'); return; }
  const m = _qpg.meta;
  let n=0;
  const rows = sel.map(q=>{
    n++;
    let ans = q.answer||q.correctAnswer||'—';
    if (q.type==='mcq'&&q.options?.length) {
      const idx = ['A','B','C','D'].indexOf(String(ans).toUpperCase());
      if (idx>=0&&q.options[idx]) ans = `(${String(ans).toUpperCase()}) ${q.options[idx]}`;
    }
    return `<tr style="border-bottom:1px solid #eee"><td style="padding:6px 8px;font-weight:700">${n}</td><td style="padding:6px 8px;font-size:9.5pt;max-width:380px">${q.question}</td><td style="padding:6px 8px;color:#1a6b3c;font-weight:600;font-size:9.5pt">${ans}</td></tr>`;
  }).join('');
  printHtml(`<div style="font-family:Arial;color:#111;padding:20px">
    <h2 style="text-align:center;margin-bottom:4px">${m.examTitle||'Question Paper'} — Answer Key</h2>
    <div style="text-align:center;font-size:10pt;color:#555;margin-bottom:16px">${m.subject||''} · Class ${m.grade||''} · ${m.school||''}</div>
    <table style="width:100%;border-collapse:collapse;border:1px solid #ccc">
      <thead><tr style="background:#f3f0ff"><th style="padding:8px;text-align:left">#</th><th style="padding:8px;text-align:left">Question</th><th style="padding:8px;text-align:left">Answer</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`, 'Answer Key');
}

function _qpeSectionHtml(sec, si) {
  return `<div class="qpe-section-block" id="qpe-sec-${si}">
    <div class="qpe-section-head">
      <div class="d-flex align-center gap-10">
        <input class="form-control" style="width:130px;padding:5px 8px;font-size:.85rem;font-weight:700;" value="${sec.title}"
          oninput="_qpe.sections[${si}].title=this.value;_qpeRefreshPreview()">
        <select class="form-control" style="width:130px;padding:5px 8px;font-size:.8rem;" onchange="_qpe.sections[${si}].type=this.value;_qpeRefreshPreview()">
          ${['mcq','short','long','truefalse','fill'].map(t=>`<option value="${t}" ${sec.type===t?'selected':''}>${t.toUpperCase()}</option>`).join('')}
        </select>
        <div style="display:flex;align-items:center;gap:4px;font-size:.8rem;">
          <span style="color:var(--text2)">Marks:</span>
          <input type="number" class="form-control" style="width:64px;padding:5px 8px;font-size:.8rem;" value="${sec.marks}"
            oninput="_qpe.sections[${si}].marks=Number(this.value);_qpeRefreshPreview()">
        </div>
      </div>
      <button class="btn btn-sm btn-danger" onclick="qpeRemoveSection(${si})">🗑️</button>
    </div>
    <div class="qpe-section-body">
      <input class="form-control mb-10" style="font-size:.82rem;" placeholder="Section instruction…" value="${sec.instruction||''}"
        oninput="_qpe.sections[${si}].instruction=this.value;_qpeRefreshPreview()">
      <div id="qpe-sec-qs-${si}">
        ${sec.questions.map((q,qi)=>_qpeQuestionRowHtml(si,qi,q)).join('')}
      </div>
      <button class="btn btn-sm" style="margin-top:8px;background:rgba(124,58,237,.1);color:#a78bfa;border:1px solid rgba(124,58,237,.3);"
        onclick="qpeAddQuestion(${si})">➕ Add Question</button>
    </div>
  </div>`;
}

function _qpeQuestionRowHtml(si, qi, q) {
  return `<div class="qpe-question-row" id="qpe-q-${si}-${qi}">
    <div class="qpe-q-num">${qi+1}</div>
    <div style="flex:1">
      <textarea class="form-control" rows="2" style="font-size:.83rem;"
        oninput="_qpe.sections[${si}].questions[${qi}]=this.value;_qpeRefreshPreview()" placeholder="Type question here…">${q}</textarea>
    </div>
    <button class="btn btn-sm btn-danger" style="margin-top:2px;flex-shrink:0;" onclick="qpeRemoveQuestion(${si},${qi})">✕</button>
  </div>`;
}

function _qpeSetTemplate(id, btn) {
  _qpe.template = id;
  document.querySelectorAll('.qpe-template-btn').forEach(b=>b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  _qpeRefreshPreview();
}
function qpeAddSection() {
  const idx = _qpe.sections.length;
  _qpe.sections.push({ id:'s'+(idx+1), title:`Section ${String.fromCharCode(65+idx)}`, instruction:'Answer the following.', type:'short', marks:3, questions:[] });
  renderPaperGenerator();
}
function qpeRemoveSection(si) {
  if (_qpe.sections.length <= 1) { toast('Need at least one section','warning'); return; }
  _qpe.sections.splice(si,1);
  renderPaperGenerator();
}
function qpeAddQuestion(si) {
  _qpe.sections[si].questions.push('');
  const container = document.getElementById('qpe-sec-qs-'+si);
  if (container) {
    const qi = _qpe.sections[si].questions.length - 1;
    const div = document.createElement('div');
    div.innerHTML = _qpeQuestionRowHtml(si, qi, '');
    container.appendChild(div.firstElementChild);
  }
  _qpeRefreshPreview();
}
function qpeRemoveQuestion(si, qi) {
  _qpe.sections[si].questions.splice(qi,1);
  const container = document.getElementById('qpe-sec-qs-'+si);
  if (container) container.innerHTML = _qpe.sections[si].questions.map((q,i)=>_qpeQuestionRowHtml(si,i,q)).join('');
  _qpeRefreshPreview();
}
function qpeImportFromBank() {
  const sub   = document.getElementById('qpe-import-sub')?.value || '';
  const type  = document.getElementById('qpe-import-type')?.value || 'mcq';
  const count = Number(document.getElementById('qpe-import-count')?.value) || 5;
  const secIdx= Number(document.getElementById('qpe-import-sec')?.value) || 0;
  let bank = DB.get('question_bank') || [];
  if (sub) bank = bank.filter(q=>q.subject===sub);
  bank = bank.filter(q=>q.type===type);
  const picked = bank.slice().sort(()=>Math.random()-.5).slice(0, Math.min(count, bank.length));
  if (!picked.length) { toast('No matching questions in bank','warning'); return; }
  picked.forEach(q => _qpe.sections[secIdx].questions.push(q.question));
  toast(`Added ${picked.length} questions to ${_qpe.sections[secIdx].title}`, 'success');
  renderPaperGenerator();
}
function _qpeRefreshPreview() {
  const el = document.getElementById('qpe-preview-content');
  if (el) el.innerHTML = _qpeRenderPreview();
}

function _qpeRenderPreview() {
  const m = _qpe.meta;
  const t = _qpe.template;
  const totalQ = _qpe.sections.reduce((s,sec)=>s+sec.questions.length,0);
  const calcMarks = _qpe.sections.reduce((s,sec)=>s+(sec.questions.length*sec.marks),0);

  const instLines = (m.instructions||'').split('\n').filter(Boolean);

  if (t === 'modern') {
    return `
      <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;padding:20px 24px;margin:-30px -36px 16px;text-align:center;">
        <div style="font-size:11pt;opacity:.85;margin-bottom:4px">${m.school||'School Name'}</div>
        <div style="font-size:16pt;font-weight:bold">${m.examTitle||'Examination'}</div>
        <div style="font-size:11pt;margin-top:4px">${m.subject||'Subject'} &mdash; Grade ${m.grade||'—'}</div>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:9.5pt;margin-bottom:10px;border-bottom:1px solid #ccc;padding-bottom:8px;">
        <span>📅 ${formatDate(m.date)}</span><span>⏱ ${m.duration}</span><span>📊 Max Marks: ${m.totalMarks}</span>
      </div>
      ${_qpePreviewSections(t)}
      <div style="text-align:center;margin-top:16px;font-size:8pt;color:#555">— End of Paper — &nbsp;&nbsp; Total Questions: ${totalQ} &nbsp;&nbsp; Calculated Marks: ${calcMarks}</div>`;
  }
  if (t === 'exam') {
    return `
      <div style="border:2px solid #000;padding:10px;margin-bottom:12px;">
        <div style="text-align:center;font-size:14pt;font-weight:bold">${m.school||'School Name'}</div>
        <div style="text-align:center;font-size:11pt;">${m.examTitle||'Examination'} | ${m.subject||'Subject'}</div>
        <div style="display:flex;justify-content:space-between;margin-top:8px;font-size:9pt;border-top:1px solid #000;padding-top:6px;">
          <span>Class: ${m.grade||'—'}</span><span>Date: ${formatDate(m.date)}</span><span>Time: ${m.duration}</span><span>Marks: ${m.totalMarks}</span>
        </div>
      </div>
      <div style="border:1px solid #ccc;padding:8px;margin-bottom:12px;font-size:9pt;">
        Name: _____________________________ Roll: _________ Section: _________ Marks: _____/${m.totalMarks}
      </div>
      ${_qpePreviewSections(t)}
      <div style="text-align:center;margin-top:16px;font-size:8pt;font-style:italic;">— End — Total: ${totalQ} questions</div>`;
  }
  if (t === 'cbse') {
    return `
      <div style="text-align:center;margin-bottom:10px;">
        <div style="font-size:9pt">CENTRAL BOARD OF SECONDARY EDUCATION</div>
        <div style="font-size:14pt;font-weight:bold;border-bottom:2px double #000;padding-bottom:6px">${m.school||'School Name'}</div>
        <div style="font-size:12pt;font-weight:bold;margin-top:6px">${m.examTitle||'ANNUAL EXAMINATION'}</div>
        <div style="font-size:10pt;">SUBJECT: ${(m.subject||'').toUpperCase()} &nbsp;&nbsp; CLASS: ${m.grade||'—'}</div>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:9pt;margin-bottom:12px;">
        <tr><td style="border:1px solid #000;padding:5px;">Time Allowed: ${m.duration}</td><td style="border:1px solid #000;padding:5px;text-align:right">Maximum Marks: ${m.totalMarks}</td></tr>
      </table>
      ${instLines.length?`<div style="font-size:8.5pt;margin-bottom:10px;"><strong>General Instructions:</strong><ol style="margin:4px 0 0 16px;padding:0">${instLines.map(i=>`<li>${i}</li>`).join('')}</ol></div>`:''}
      ${_qpePreviewSections(t)}
      <div style="text-align:center;margin-top:16px;font-size:8pt;font-style:italic;">*** END OF QUESTION PAPER ***</div>`;
  }
  // Default: classic
  return `
    <div style="text-align:center;border-bottom:2px solid #000;padding-bottom:10px;margin-bottom:14px;">
      <div style="font-size:14pt;font-weight:bold">${m.school||'School Name'}</div>
      <div style="font-size:11pt;">${m.examTitle||'Examination'}</div>
      <div class="qpe-meta-row">
        <span>Subject: <strong>${m.subject||'—'}</strong></span>
        <span>Class: <strong>${m.grade||'—'}</strong></span>
        <span>Date: <strong>${formatDate(m.date)}</strong></span>
        <span>Time: <strong>${m.duration}</strong></span>
        <span>Marks: <strong>${m.totalMarks}</strong></span>
      </div>
    </div>
    ${instLines.length?`<div style="font-size:8.5pt;margin-bottom:10px;border:1px solid #000;padding:6px 10px;"><strong>Instructions:</strong> ${instLines.join(' | ')}</div>`:''}
    <div style="border:1px dashed #ccc;padding:6px 10px;margin-bottom:12px;font-size:8.5pt;">
      Name: ______________________________ Roll No: ____________ Marks Obtained: _______ / ${m.totalMarks}
    </div>
    ${_qpePreviewSections(t)}
    <div style="text-align:center;margin-top:20px;font-style:italic;font-size:9pt;color:#555">— End of Question Paper — Total Questions: ${totalQ}</div>`;
}

function _qpePreviewSections(t) {
  let html = '';
  let qNum = 1;
  _qpe.sections.forEach((sec, si) => {
    const secMarks = sec.questions.length * sec.marks;
    const isModern = t === 'modern';
    html += `<div style="margin-bottom:12px;">
      <div class="qpe-sec-title" style="${isModern?'color:#4f46e5':''}">${sec.title} &nbsp;<span style="font-weight:normal;font-size:9pt;">[${sec.marks} mark${sec.marks>1?'s':''} each — Total: ${secMarks}]</span></div>
      ${sec.instruction?`<div style="font-size:9pt;font-style:italic;margin-bottom:6px;color:#555">${sec.instruction}</div>`:''}`;
    sec.questions.forEach(q => {
      if (!q.trim()) return;
      if (sec.type === 'mcq') {
        html += `<div class="qpe-q-item"><strong>Q${qNum++}.</strong> ${q}</div>
          <div class="qpe-opts">
            <div>(A) _____________</div><div>(B) _____________</div>
            <div>(C) _____________</div><div>(D) _____________</div>
          </div>`;
      } else if (sec.type === 'truefalse') {
        html += `<div class="qpe-q-item"><strong>Q${qNum++}.</strong> ${q} &nbsp;&nbsp; [ True / False ]</div>`;
      } else {
        const lines = sec.type === 'long' ? 4 : 2;
        html += `<div class="qpe-q-item"><strong>Q${qNum++}.</strong> ${q}</div>`;
        for(let i=0;i<lines;i++) html += `<div style="border-bottom:1px solid #ccc;height:20px;margin:2px 0"></div>`;
      }
    });
    if (!sec.questions.filter(q=>q.trim()).length) {
      html += `<div style="font-size:9pt;color:#999;font-style:italic;padding:8px 0;">No questions in this section yet.</div>`;
    }
    html += `</div>`;
  });
  return html;
}

function qpePrintPaper() {
  const preview = document.getElementById('qpe-preview-content');
  if (!preview) { toast('Open the paper editor first','warning'); return; }
  const m = _qpe.meta;
  printHtml(preview.innerHTML, `${m.examTitle||'Question Paper'} — ${m.subject||''}`, `
    body { font-family: 'Times New Roman', serif; font-size: 12pt; color: #000; }
    .qpe-meta-row { display:flex; justify-content:space-between; border-top:2px solid #000; border-bottom:2px solid #000; padding:6px 0; margin-bottom:14px; font-size:10pt; }
    .qpe-sec-title { font-size:11pt; font-weight:bold; text-decoration:underline; margin:14px 0 8px; }
    .qpe-q-item { margin-bottom:6px; }
    .qpe-opts { display:grid; grid-template-columns:1fr 1fr; margin-left:20px; font-size:10pt; }
  `);
}

function qpePrintAnswerKey() {
  let html = `<div style="text-align:center;border-bottom:2px solid #6d28d9;padding-bottom:10px;margin-bottom:14px;">
    <h2 style="margin:0">${_qpe.meta.school||'School'}</h2>
    <h3 style="margin:4px 0;color:#6d28d9">ANSWER KEY — ${_qpe.meta.subject||'Subject'} (Grade ${_qpe.meta.grade||'—'})</h3>
    <p style="color:#888;font-size:.85rem">FOR TEACHER USE ONLY</p>
  </div>`;
  let qNum = 1;
  _qpe.sections.forEach(sec => {
    if (!sec.questions.filter(q=>q.trim()).length) return;
    html += `<h4 style="border-bottom:1px solid #ccc;padding-bottom:4px">${sec.title}</h4>`;
    sec.questions.forEach(q => {
      if (!q.trim()) return;
      const bankQ = (DB.get('question_bank')||[]).find(bq=>bq.question.toLowerCase()===q.toLowerCase());
      const ans = bankQ ? bankQ.answer : '___________';
      html += `<div style="margin-bottom:8px;padding:6px 10px;background:#f9f7ff;border-left:3px solid #7c3aed;border-radius:0 4px 4px 0;font-size:11pt">
        <strong>Q${qNum++}.</strong> ${q}<br>
        <span style="color:#059669;font-weight:600">Ans: ${ans}</span>
      </div>`;
    });
  });
  printHtml(html, 'Answer Key');
}

// ── legacy helpers (used by old generatePaper code paths) ─
function _pickRandom(arr, n) { return arr.slice().sort(()=>Math.random()-.5).slice(0, Math.min(n, arr.length)); }
function _getFilteredBank(type) {
  let bank = DB.get('question_bank') || [];
  const grade = (document.getElementById('pg-grade')||{}).value || '';
  const sub   = (document.getElementById('pg-subject')||{}).value || '';
  if (grade) bank = bank.filter(q=>q.grade===grade);
  if (sub)   bank = bank.filter(q=>q.subject===sub);
  return bank.filter(q=>q.type===type);
}
function generatePaper() { qpePrintPaper(); }
function generateAnswerKey() { qpePrintAnswerKey(); }

// ══════════════════════════════════════════════════════
//  CCTV CAMERAS
// ══════════════════════════════════════════════════════
function renderCameras() {
  const cameras = DB.get('cameras') || [];
  const classes  = DB.get('classes');
  document.getElementById('section-cameras').innerHTML = `
  <div class="page-header">
    <div><h2>CCTV Cameras</h2><div class="breadcrumb">Connect and manage school cameras</div></div>
    <button class="btn btn-primary" onclick="openCameraModal()">➕ Add Camera</button>
  </div>

  <div class="card mb-20" style="padding:16px 20px;border-left:3px solid #06b6d4;">
    <div class="d-flex align-center gap-12">
      <div style="font-size:1.4rem">ℹ️</div>
      <div style="font-size:.83rem;color:rgba(255,255,255,.5);">
        Supports: <strong style="color:#67e8f9">IP Camera web URLs</strong> (http://camera-ip/video),
        <strong style="color:#67e8f9">YouTube Live embeds</strong>, <strong style="color:#67e8f9">MJPEG streams</strong>,
        and any <strong style="color:#67e8f9">shareable RTSP-to-web bridge URLs</strong>.
        Toggle <em>Parent Access</em> to allow parents to view a camera from the Student panel.
      </div>
    </div>
  </div>

  <div class="grid-3" id="cameras-grid">
    ${cameras.map(cam => cameraCardHtml(cam, classes)).join('') ||
      `<div class="card" style="grid-column:1/-1;text-align:center;padding:60px">
        <div style="font-size:3rem;margin-bottom:12px">📹</div>
        <h3>No cameras added yet</h3>
        <p style="color:rgba(255,255,255,.4);margin-top:8px">Add cameras from the button above to start monitoring</p>
      </div>`}
  </div>`;
}

function cameraCardHtml(cam, classes) {
  const cls = classes.find(c => c.id === cam.classId);
  return `
  <div class="card">
    <div class="card-body" style="padding:0;overflow:hidden;border-radius:14px;">
      <div style="position:relative;background:#000;aspect-ratio:16/9;overflow:hidden;">
        ${camFeedHtml(cam)}
        <div style="position:absolute;top:8px;left:8px;display:flex;gap:6px;">
          <span style="background:${cam.status==='active'?'rgba(16,185,129,.9)':'rgba(239,68,68,.9)'};color:#fff;font-size:.65rem;padding:2px 8px;border-radius:20px;font-weight:700;">
            ${cam.status==='active'?'🔴 LIVE':'⚫ OFFLINE'}
          </span>
          ${cam.parentAccess?'<span style="background:rgba(124,58,237,.9);color:#fff;font-size:.65rem;padding:2px 8px;border-radius:20px;font-weight:700;">👨‍👩‍👧 Parent View</span>':''}
        </div>
      </div>
      <div style="padding:14px 16px;">
        <div class="fw-7 mb-4">${cam.name}</div>
        <div class="text-xs text-muted mb-12">${cls?cls.name:'No class'} &nbsp;·&nbsp; ${cam.location||'Location not set'}</div>
        <div class="d-flex gap-8 flex-wrap">
          <button class="btn btn-sm btn-cyan" onclick="openCameraModal('${cam.id}')">✏️ Edit</button>
          <button class="btn btn-sm" style="background:rgba(${cam.parentAccess?'239,68,68':'16,185,129'},.15);color:${cam.parentAccess?'#ef4444':'#10b981'};border:1px solid ${cam.parentAccess?'rgba(239,68,68,.3)':'rgba(16,185,129,.3)'};"
            onclick="toggleCamAccess('${cam.id}')">${cam.parentAccess?'🔒 Revoke Access':'👁️ Allow Parents'}</button>
          <button class="btn btn-sm btn-danger" onclick="deleteCamera('${cam.id}')">🗑️</button>
        </div>
      </div>
    </div>
  </div>`;
}

function camFeedHtml(cam) {
  if (!cam.url || cam.status !== 'active') {
    return `<div style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;color:rgba(255,255,255,.3);min-height:120px;">
      <div style="font-size:2rem">📷</div>
      <div style="font-size:.75rem;margin-top:6px">${cam.status==='active'?'No URL set':'Camera Offline'}</div>
    </div>`;
  }
  const url = cam.url;
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    const ytId = url.match(/(?:v=|youtu\.be\/|embed\/)([^&?/]+)/)?.[1] || '';
    return `<iframe src="https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1" style="width:100%;min-height:140px;border:none" allow="autoplay" allowfullscreen></iframe>`;
  }
  if (cam.type === 'mjpeg' || url.match(/\.(jpg|jpeg|mjpg|mjpeg)/i) || url.includes('/video')) {
    return `<img src="${url}" style="width:100%;min-height:140px;object-fit:cover;" onerror="this.parentNode.innerHTML='<div style=&quot;color:rgba(255,255,255,.4);text-align:center;padding:24px;font-size:.8rem;&quot;>⚠️ Camera unreachable</div>'">`;
  }
  return `<iframe src="${url}" style="width:100%;min-height:140px;border:none" sandbox="allow-same-origin allow-scripts" onerror="this.style.display='none'"></iframe>`;
}

function openCameraModal(id=null) {
  const cam = id ? (DB.get('cameras')||[]).find(c=>c.id===id) : null;
  const classes = DB.get('classes');
  buildModal('modal-cam', id ? 'Edit Camera' : 'Add Camera', `
    <div class="form-row">
      <div class="form-group"><label class="form-label">Camera Name *</label>
        <input class="form-control" id="cam-name" placeholder="e.g. Class 6A Front Camera" value="${cam?cam.name:''}"></div>
      <div class="form-group"><label class="form-label">Location</label>
        <input class="form-control" id="cam-loc" placeholder="e.g. Room 101" value="${cam?cam.location||'':''}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Assigned Class</label>
        <select class="form-control" id="cam-class">
          <option value="">No Class (General)</option>
          ${classes.map(c=>`<option value="${c.id}" ${cam&&cam.classId===c.id?'selected':''}>${c.name}</option>`).join('')}
        </select></div>
      <div class="form-group"><label class="form-label">Feed Type</label>
        <select class="form-control" id="cam-type">
          <option value="ip"       ${cam&&cam.type==='ip'?'selected':''}>IP Camera / Web UI</option>
          <option value="mjpeg"    ${cam&&cam.type==='mjpeg'?'selected':''}>MJPEG Stream</option>
          <option value="youtube"  ${cam&&cam.type==='youtube'?'selected':''}>YouTube Live</option>
          <option value="iframe"   ${cam&&cam.type==='iframe'?'selected':''}>Embed URL (iframe)</option>
        </select></div>
    </div>
    <div class="form-group"><label class="form-label">Camera URL / Stream Link</label>
      <input class="form-control" id="cam-url" placeholder="http://192.168.1.100/video  or  https://youtube.com/watch?v=..." value="${cam?cam.url||'':''}">
      <div style="font-size:.75rem;color:rgba(255,255,255,.35);margin-top:6px">Enter the camera's web interface URL, MJPEG stream URL, or YouTube Live URL</div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Status</label>
        <select class="form-control" id="cam-status">
          <option value="active"   ${!cam||cam.status==='active'?'selected':''}>🔴 Active / Live</option>
          <option value="inactive" ${cam&&cam.status==='inactive'?'selected':''}>⚫ Offline</option>
        </select></div>
      <div class="form-group" style="display:flex;align-items:flex-end;">
        <label style="display:flex;align-items:center;gap:10px;cursor:pointer;padding:12px 14px;background:var(--glass);border-radius:10px;border:1px solid var(--border);width:100%;">
          <input type="checkbox" id="cam-parent" ${cam&&cam.parentAccess?'checked':''} style="width:16px;height:16px;">
          <div><div style="font-weight:600;font-size:.88rem">Allow Parent Access</div>
          <div style="font-size:.72rem;color:rgba(255,255,255,.4)">Parents see this in Student Panel</div></div>
        </label>
      </div>
    </div>`, ()=>saveCamera(id));
}

function saveCamera(id) {
  const name   = val('cam-name');
  const loc    = val('cam-loc');
  const classId= val('cam-class');
  const type   = val('cam-type');
  const url    = val('cam-url');
  const status = val('cam-status');
  const parentAccess = document.getElementById('cam-parent').checked;
  if (!name) { toast('Camera name is required', 'warning'); return; }
  const data = { name, location:loc, classId, type, url, status, parentAccess };
  let cams = DB.get('cameras') || [];
  if (id) {
    const i = cams.findIndex(c=>c.id===id);
    if (i !== -1) cams[i] = { ...cams[i], ...data };
  } else {
    cams.push({ id:genId('cam'), ...data, addedOn:today() });
  }
  DB.set('cameras', cams);
  toast(id ? 'Camera updated!' : 'Camera added!', 'success');
  closeAllModals();
  renderCameras();
}

function toggleCamAccess(id) {
  const cams = DB.get('cameras') || [];
  const i = cams.findIndex(c=>c.id===id);
  if (i !== -1) { cams[i].parentAccess = !cams[i].parentAccess; DB.set('cameras', cams); }
  renderCameras();
  toast(cams[i]?.parentAccess ? 'Parents can now view this camera' : 'Parent access revoked', 'info');
}

function deleteCamera(id) {
  if (!confirmAction('Delete this camera?')) return;
  DB.set('cameras', (DB.get('cameras')||[]).filter(c=>c.id!==id));
  renderCameras();
}

// ══════════════════════════════════════════════════════
//  VEHICLE GPS TRACKING
// ══════════════════════════════════════════════════════
let _mapInstance    = null;
let _mapMarkers     = {};
let _liveTrackWatch = null;
let _liveTrackVehId = null;
let _vehPollTimer   = null;   // Server-side live poll interval (8s)
let _vehLiveData    = {};     // Latest live data per vehicleId from server

// Called by nav when leaving Vehicles section — clean up map + live tracking
window._destroyVehicleMap = function() {
  if (_liveTrackWatch !== null) {
    navigator.geolocation.clearWatch(_liveTrackWatch);
    _liveTrackWatch = null; _liveTrackVehId = null;
  }
  if (_vehPollTimer) { clearInterval(_vehPollTimer); _vehPollTimer = null; }
  if (_mapInstance) { _mapInstance.remove(); _mapInstance = null; }
  _mapMarkers = {}; _vehLiveData = {};
};

function renderVehicles() {
  const vehicles = DB.get('vehicles') || [];
  const withGPS  = vehicles.filter(v => v.lat && v.lng).length;

  document.getElementById('section-vehicles').innerHTML = `
  <div class="page-header">
    <div>
      <h2>🚌 Vehicle GPS Tracking</h2>
      <div class="breadcrumb">Monitor real-time location of all school vehicles</div>
    </div>
    <button class="btn btn-primary" onclick="openVehicleModal()">➕ Vehicle Add Karein</button>
  </div>

  <!-- Stats row -->
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:18px;">
    <div class="stat-card purple" style="padding:14px 16px;">
      <div class="stat-value">${vehicles.length}</div>
      <div class="stat-label">Total Vehicles</div>
    </div>
    <div class="stat-card" style="padding:14px 16px;">
      <div class="stat-value" style="color:#10b981;">${vehicles.filter(v=>v.status==='running').length}</div>
      <div class="stat-label">🟢 Running</div>
    </div>
    <div class="stat-card" style="padding:14px 16px;">
      <div class="stat-value" style="color:#06b6d4;">${withGPS}</div>
      <div class="stat-label">📍 GPS Set</div>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:1fr 360px;gap:18px;align-items:start;">

    <!-- Map card -->
    <div class="card" style="overflow:hidden;min-height:460px;">
      <div class="card-header" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
        <h3>🗺️ Live Map <span style="font-size:.72rem;font-weight:400;color:rgba(255,255,255,.35);">${withGPS} vehicle${withGPS!==1?'s':''} on map</span></h3>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          <button class="btn btn-sm btn-secondary" onclick="refreshMap()">🔄 Refresh</button>
          <button class="btn btn-sm btn-cyan" onclick="fitAllVehicles()">⛶ Fit All</button>
          <button class="btn btn-sm" style="background:rgba(245,158,11,.15);color:#f59e0b;" onclick="openSchoolLocModal()" title="Set school location for ETA calculation">🏫 School Location</button>
        </div>
      </div>
      <div id="vehicle-map" style="height:400px;border-radius:0 0 14px 14px;background:#1a1a2e;"></div>
    </div>

    <!-- Fleet list -->
    <div class="card" style="overflow-y:auto;max-height:480px;">
      <div class="card-header"><h3>🚌 Fleet</h3></div>
      <div style="padding:12px;">
        ${vehicles.length ? vehicles.map(v => {
          const statusColor = v.status==='running'?'#10b981':v.status==='maintenance'?'#ef4444':'#94a3b8';
          const statusBg    = v.status==='running'?'rgba(16,185,129,.12)':v.status==='maintenance'?'rgba(239,68,68,.12)':'rgba(148,163,184,.08)';
          const statusLabel = v.status==='running'?'🟢 Running':v.status==='maintenance'?'🔴 Maintenance':'⚫ Parked';
          const isLive      = _liveTrackVehId === v.id;
          const liveD       = _vehLiveData[v.id];
          const isOnline    = liveD && liveD.online && liveD.timestamp && (Date.now()-new Date(liveD.timestamp).getTime() < 30000);
          const lastUpd     = liveD && liveD.timestamp
            ? new Date(liveD.timestamp).toLocaleString('en-IN',{hour:'2-digit',minute:'2-digit',day:'2-digit',month:'short'}) + ' (Live)'
            : v.lastUpdated ? new Date(v.lastUpdated).toLocaleString('en-IN',{hour:'2-digit',minute:'2-digit',day:'2-digit',month:'short'}) : '—';
          const dispLat = liveD&&liveD.lat ? liveD.lat : v.lat;
          const dispLng = liveD&&liveD.lng ? liveD.lng : v.lng;
          const spdText = liveD&&liveD.speed ? ` · 🚀 ${liveD.speed} km/h` : '';
          const accText = liveD&&liveD.accuracy ? ` · 🎯 ±${liveD.accuracy}m` : '';
          const borderCol = isOnline ? 'rgba(16,185,129,.6)' : isLive ? 'rgba(124,58,237,.6)' : 'var(--border)';
          return `
          <div id="vcard-${v.id}" style="padding:12px;background:var(--glass);border-radius:12px;border:1px solid ${borderCol};margin-bottom:10px;cursor:pointer;transition:border-color .2s;" onclick="focusVehicle('${v.id}')">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
              <div style="font-weight:700;font-size:.95rem;">${v.name}</div>
              <div style="display:flex;gap:5px;align-items:center;">
                ${isOnline ? '<span style="font-size:.68rem;padding:2px 8px;border-radius:20px;font-weight:700;background:rgba(16,185,129,.15);color:#10b981;animation:vmPulse 1.5s infinite">🟢 LIVE</span>' : ''}
                <span style="font-size:.68rem;padding:2px 8px;border-radius:20px;font-weight:700;background:${statusBg};color:${statusColor};">${statusLabel}</span>
              </div>
            </div>
            <div class="text-xs text-muted">🚌 ${v.number||'—'} &nbsp;·&nbsp; 👨 ${v.driver||'—'} &nbsp;·&nbsp; 📞 ${v.driverPhone||'—'}</div>
            <div class="text-xs text-muted mt-2">📍 Route: ${v.route||'—'} &nbsp;·&nbsp; 💺 Capacity: ${v.capacity||'—'}</div>
            ${dispLat&&dispLng ? `<div class="text-xs mt-2" data-coords style="color:${isOnline?'#10b981':'rgba(124,58,237,.8)'};">🛰 ${parseFloat(dispLat).toFixed(5)}, ${parseFloat(dispLng).toFixed(5)}${spdText}${accText}</div>` : '<div class="text-xs mt-2" data-coords style="color:rgba(255,255,255,.25);">📍 Location not set</div>'}
            <div class="text-xs text-muted mt-1">🕐 ${lastUpd}</div>
            ${isLive ? '<div class="text-xs mt-2" style="color:#a78bfa;font-weight:700;">● Device GPS Active</div>' : ''}
            <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px;" onclick="event.stopPropagation()">
              <button class="btn btn-sm btn-cyan" onclick="openVehicleModal('${v.id}')">✏️ Edit</button>
              <button class="btn btn-sm btn-secondary" onclick="openUpdateLocationModal('${v.id}')">📍 Location</button>
              <button class="btn btn-sm" style="background:rgba(124,58,237,.2);color:#a78bfa;" onclick="copyDriverLink('${v.id}')" title="Copy tracking link for the driver phone">🔗 Driver Link</button>
              <button class="btn btn-sm" style="background:rgba(6,182,212,.15);color:#06b6d4;" onclick="openGpsDeviceModal('${v.id}')" title="Connect a GPS tracker device installed in the vehicle">📟 GPS Device</button>
              ${dispLat&&dispLng ? `<button class="btn btn-sm" style="background:rgba(16,185,129,.15);color:#10b981;" onclick="openInMaps('${dispLat}','${dispLng}','${encodeURIComponent(v.name)}')">🗺 Maps</button>` : ''}
              <button class="btn btn-sm btn-danger" onclick="deleteVehicle('${v.id}')">🗑️</button>
            </div>
          </div>`;
        }).join('') : '<div class="empty-state"><div class="e-icon">🚌</div><p>No vehicles found — start with ➕ Add Vehicle</p></div>'}
      </div>
    </div>
  </div>

  <!-- Mobile: stack map below fleet on small screens -->
  <style>
    @media(max-width:700px){
      #section-vehicles > div:last-of-type { grid-template-columns: 1fr !important; }
    }
  </style>`;

  // Lazy-load Leaflet only when vehicle section opens
  setTimeout(() => {
    (window._loadLeaflet ? window._loadLeaflet() : Promise.resolve())
      .then(() => initVehicleMap(vehicles));
  }, 50);
}

function initVehicleMap(vehicles) {
  const mapEl = document.getElementById('vehicle-map');
  if (!mapEl || !window.L) { console.warn('Leaflet not loaded'); return; }

  if (_mapInstance) { try { _mapInstance.remove(); } catch(e){} _mapInstance = null; }
  _mapMarkers = {};

  const hasGPS   = vehicles.filter(v => v.lat && v.lng);
  const center   = hasGPS.length ? [hasGPS[0].lat, hasGPS[0].lng] : [20.5937, 78.9629];
  const zoom     = hasGPS.length ? (hasGPS.length === 1 ? 14 : 11) : 5;

  _mapInstance = L.map('vehicle-map', {
    zoomControl: true,
    attributionControl: true,
    tap: true          // needed for mobile touch events in Leaflet
  }).setView(center, zoom);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://openstreetmap.org">OSM</a>',
    maxZoom: 19
  }).addTo(_mapInstance);

  hasGPS.forEach(v => _addVehicleMarker(v));

  // Force map to recalculate size (fixes grey tiles on first render)
  setTimeout(() => { if (_mapInstance) _mapInstance.invalidateSize(); }, 200);

  // Start server-side live poll
  _startVehPoll();
}

function _addVehicleMarker(v, liveOverride) {
  if (!_mapInstance) return;
  const ld   = liveOverride || _vehLiveData[v.id];
  const isOnline = ld && ld.online && ld.timestamp && (Date.now()-new Date(ld.timestamp).getTime()<30000);
  const lat  = (ld && ld.lat) ? ld.lat : v.lat;
  const lng  = (ld && ld.lng) ? ld.lng : v.lng;
  if (!lat || !lng) return;
  if (_mapMarkers[v.id]) { try { _mapMarkers[v.id].remove(); } catch(e){} }

  const isLive  = _liveTrackVehId === v.id;
  const color   = isOnline ? '#10b981' : v.status==='running'?'#10b981':v.status==='maintenance'?'#ef4444':'#94a3b8';
  const border  = isOnline ? '#fff' : isLive ? '#a78bfa' : '#fff';
  const pulse   = (isOnline||isLive) ? 'animation:vmPulse 1.2s ease-in-out infinite;' : '';
  const icon = L.divIcon({
    html: `<div style="background:${color};color:#fff;border-radius:50%;width:38px;height:38px;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 3px 10px rgba(0,0,0,.5);border:3px solid ${border};${pulse}">🚌</div>`,
    iconSize: [38, 38], iconAnchor: [19, 19], className: ''
  });

  const updTime = ld && ld.timestamp ? new Date(ld.timestamp).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',second:'2-digit'}) + ' (Live)' :
    v.lastUpdated ? new Date(v.lastUpdated).toLocaleString('en-IN',{hour:'2-digit',minute:'2-digit',day:'2-digit',month:'short'}) : '—';
  const spdInfo = ld && ld.speed ? `<div style="font-size:.75rem;color:#555;">🚀 Speed: ${ld.speed} km/h · 🎯 ±${ld.accuracy||'?'}m</div>` : '';
  const marker = L.marker([lat, lng], { icon })
    .addTo(_mapInstance)
    .bindPopup(`
      <div style="min-width:180px;font-family:sans-serif;">
        <div style="font-weight:700;font-size:.95rem;margin-bottom:4px;">${v.name}</div>
        <div style="font-size:.8rem;color:#555;">🚌 ${v.number||'—'}</div>
        <div style="font-size:.8rem;color:#555;">👨 ${v.driver||'—'} · 📞 ${v.driverPhone||'—'}</div>
        <div style="font-size:.8rem;color:#555;">📍 ${v.route||'—'}</div>
        ${spdInfo}
        <div style="font-size:.75rem;color:#888;margin-top:4px;">Updated: ${updTime}</div>
        ${isOnline ? '<div style="color:#10b981;font-size:.75rem;font-weight:700;margin-top:4px;">🟢 LIVE GPS</div>' : ''}
      </div>
    `);
  _mapMarkers[v.id] = marker;
}

// Add CSS pulse animation for live tracking marker
if (!document.getElementById('_vmMapStyle')) {
  const s = document.createElement('style');
  s.id = '_vmMapStyle';
  s.textContent = '@keyframes vmPulse{0%,100%{box-shadow:0 0 0 0 rgba(167,139,250,.6),0 3px 10px rgba(0,0,0,.5)}50%{box-shadow:0 0 0 8px rgba(167,139,250,0),0 3px 10px rgba(0,0,0,.5)}}';
  document.head.appendChild(s);
}

function refreshMap() {
  const vehicles = DB.get('vehicles') || [];
  initVehicleMap(vehicles);
  toast('Map refreshed', 'info');
}

function fitAllVehicles() {
  if (!_mapInstance) return;
  const pts = Object.values(_mapMarkers).map(m => m.getLatLng());
  if (!pts.length) { toast('No vehicle has a GPS location set', 'warning'); return; }
  if (pts.length === 1) { _mapInstance.setView(pts[0], 14); return; }
  _mapInstance.fitBounds(L.latLngBounds(pts), { padding: [40, 40] });
}

function focusVehicle(id) {
  const marker = _mapMarkers[id];
  if (marker && _mapInstance) {
    _mapInstance.setView(marker.getLatLng(), 15);
    marker.openPopup();
  } else if (!marker) {
    toast('This vehicle has no GPS location set', 'warning');
  }
}

function openInMaps(lat, lng, name) {
  const url = `https://www.google.com/maps?q=${lat},${lng}&z=15&label=${name}`;
  window.open(url, '_blank');
}

// ── Live GPS Tracking — uses device Geolocation API ──────────────────────
// Admin/driver apne phone se ek vehicle ko track kar sakta hai.
// watchPosition har 5-10 second mein location update karta hai.
function startLiveTracking(vehId) {
  // Toggle off if same vehicle
  if (_liveTrackVehId === vehId) {
    navigator.geolocation.clearWatch(_liveTrackWatch);
    _liveTrackWatch = null; _liveTrackVehId = null;
    toast('Live tracking stopped', 'info');
    renderVehicles();
    return;
  }

  // Stop any previous watch
  if (_liveTrackWatch !== null) navigator.geolocation.clearWatch(_liveTrackWatch);

  if (!navigator.geolocation) {
    toast('GPS is not supported on this device/browser', 'error'); return;
  }

  const v = (DB.get('vehicles')||[]).find(x => x.id === vehId);
  if (!v) return;

  toast(`📡 "${v.name}" live tracking started… getting first location`, 'info');

  _liveTrackVehId = vehId;

  _liveTrackWatch = navigator.geolocation.watchPosition(
    pos => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      // Save to DB
      let vehs = DB.get('vehicles') || [];
      const i  = vehs.findIndex(x => x.id === vehId);
      if (i === -1) { navigator.geolocation.clearWatch(_liveTrackWatch); _liveTrackWatch = null; _liveTrackVehId = null; return; }
      vehs[i] = { ...vehs[i], lat, lng, lastUpdated: new Date().toISOString() };
      DB.set('vehicles', vehs);

      // Update map marker in-place (no full re-render — keeps map stable)
      if (_mapInstance) {
        _addVehicleMarker(vehs[i]);
        _mapInstance.panTo([lat, lng]);
      }

      // Update coordinate display in fleet card
      const card = document.getElementById('vcard-' + vehId);
      if (card) {
        const coordEl = card.querySelector('[data-coords]');
        if (coordEl) coordEl.textContent = `🛰 Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`;
      }
    },
    err => {
      const msg = err.code === 1 ? 'GPS permission denied — allow location in phone settings'
                : err.code === 2 ? 'No GPS signal — move outdoors or wait'
                : 'GPS error: ' + err.message;
      toast(msg, 'error');
      navigator.geolocation.clearWatch(_liveTrackWatch);
      _liveTrackWatch = null; _liveTrackVehId = null;
    },
    { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
  );

  renderVehicles();
}

function openVehicleModal(id=null) {
  const v = id ? (DB.get('vehicles')||[]).find(x=>x.id===id) : null;
  buildModal('modal-vehicle', id ? 'Edit Vehicle' : 'Add Vehicle', `
    <div class="form-row">
      <div class="form-group"><label class="form-label">Vehicle Name *</label>
        <input class="form-control" id="veh-name" placeholder="e.g. School Bus 1" value="${v?v.name:''}"></div>
      <div class="form-group"><label class="form-label">Vehicle Number *</label>
        <input class="form-control" id="veh-no" placeholder="e.g. MH 01 AB 1234" value="${v?v.number||'':''}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Driver Name</label>
        <input class="form-control" id="veh-driver" placeholder="Driver full name" value="${v?v.driver||'':''}"></div>
      <div class="form-group"><label class="form-label">Driver Phone</label>
        <input class="form-control" type="tel" inputmode="tel" id="veh-phone" placeholder="9876543210" value="${v?v.driverPhone||'':''}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Route</label>
        <input class="form-control" id="veh-route" placeholder="e.g. Route A - North Zone" value="${v?v.route||'':''}"></div>
      <div class="form-group"><label class="form-label">Capacity</label>
        <input type="number" inputmode="numeric" class="form-control" id="veh-cap" placeholder="40" value="${v?v.capacity||'':''}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Status</label>
        <select class="form-control" id="veh-status">
          <option value="parked"      ${v&&v.status==='parked'?'selected':''}>⚫ Parked</option>
          <option value="running"     ${!v||v.status==='running'?'selected':''}>🟢 Running</option>
          <option value="maintenance" ${v&&v.status==='maintenance'?'selected':''}>🔴 Maintenance</option>
        </select></div>
      <div class="form-group"><label class="form-label">GPS Share URL <span style="font-size:.7rem;color:rgba(255,255,255,.3)">(optional)</span></label>
        <input class="form-control" id="veh-gpsurl" placeholder="Google Maps Share Link…" value="${v?v.gpsUrl||'':''}"></div>
    </div>
    <hr style="border-color:rgba(255,255,255,.08);margin:8px 0 16px">
    <p style="font-size:.8rem;color:rgba(255,255,255,.4);margin-bottom:12px">GPS position (set manually or auto-fill with "📍 Use My Location"):</p>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Latitude</label>
        <input type="number" step="any" class="form-control" id="veh-lat" placeholder="19.0760" value="${v?v.lat||'':''}"></div>
      <div class="form-group"><label class="form-label">Longitude</label>
        <input type="number" step="any" class="form-control" id="veh-lng" placeholder="72.8777" value="${v?v.lng||'':''}"></div>
    </div>
    <button type="button" class="btn btn-secondary" style="margin-top:4px;" onclick="_useDeviceGPS('veh-lat','veh-lng')">📍 Use My Location</button>
  `, ()=>saveVehicle(id));
}

function saveVehicle(id) {
  const name = val('veh-name');
  if (!name) { toast('Vehicle name is required', 'warning'); return; }
  const data = {
    name, number:val('veh-no'), driver:val('veh-driver'), driverPhone:val('veh-phone'),
    route:val('veh-route'), capacity:Number(document.getElementById('veh-cap').value)||0,
    status:val('veh-status'), gpsUrl:val('veh-gpsurl'),
    lat:parseFloat(document.getElementById('veh-lat').value)||null,
    lng:parseFloat(document.getElementById('veh-lng').value)||null,
    lastUpdated: new Date().toISOString()
  };
  let vehs = DB.get('vehicles') || [];
  if (id) {
    const i = vehs.findIndex(v=>v.id===id);
    if (i !== -1) vehs[i] = { ...vehs[i], ...data };
  } else {
    vehs.push({ id:genId('veh'), ...data });
  }
  DB.set('vehicles', vehs);
  toast(id ? 'Vehicle updated!' : 'Vehicle added!', 'success');
  closeAllModals();
  renderVehicles();
}

// Shared helper — fills lat/lng fields from device GPS
function _useDeviceGPS(latId, lngId) {
  if (!navigator.geolocation) { toast('GPS is not available on this device', 'error'); return; }
  toast('📍 Getting GPS location…', 'info');
  navigator.geolocation.getCurrentPosition(
    pos => {
      const latEl = document.getElementById(latId);
      const lngEl = document.getElementById(lngId);
      if (latEl) latEl.value = pos.coords.latitude.toFixed(6);
      if (lngEl) lngEl.value = pos.coords.longitude.toFixed(6);
      toast('✅ Location filled!', 'success');
    },
    err => toast('GPS error: ' + (err.code===1?'Permission denied':err.message), 'error'),
    { enableHighAccuracy: true, timeout: 12000 }
  );
}

function openUpdateLocationModal(id) {
  const v = (DB.get('vehicles')||[]).find(x=>x.id===id);
  if (!v) return;
  buildModal('modal-veh-loc', `📍 Location Update — ${v.name}`, `
    <p style="color:rgba(255,255,255,.5);font-size:.85rem;margin-bottom:12px">
      Enter GPS coordinates or press <strong>"📍 Use My Location"</strong>.
    </p>
    <button type="button" class="btn btn-cyan" style="width:100%;margin-bottom:16px;" onclick="_useDeviceGPS('uloc-lat','uloc-lng')">
      📍 Use My Current Location (Device GPS)
    </button>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Latitude *</label>
        <input type="number" step="any" class="form-control" id="uloc-lat" placeholder="19.0760" value="${v.lat||''}"></div>
      <div class="form-group"><label class="form-label">Longitude *</label>
        <input type="number" step="any" class="form-control" id="uloc-lng" placeholder="72.8777" value="${v.lng||''}"></div>
    </div>
    <div class="form-group"><label class="form-label">Status Update</label>
      <select class="form-control" id="uloc-status">
        <option value="running"     ${v.status==='running'?'selected':''}>🟢 Running</option>
        <option value="parked"      ${v.status==='parked'?'selected':''}>⚫ Parked</option>
        <option value="maintenance" ${v.status==='maintenance'?'selected':''}>🔴 Maintenance</option>
      </select>
    </div>
    <p style="font-size:.75rem;color:rgba(255,255,255,.3);margin-top:8px;">
      💡 For live tracking, use the <strong>"🔗 Driver Link"</strong> or <strong>"📟 GPS Device"</strong> buttons on the fleet card.
    </p>
  `, () => {
    const lat = parseFloat(document.getElementById('uloc-lat').value);
    const lng = parseFloat(document.getElementById('uloc-lng').value);
    if (!lat || !lng) { toast('Enter valid coordinates', 'warning'); return; }
    const status = val('uloc-status');
    let vehs = DB.get('vehicles') || [];
    const i = vehs.findIndex(v=>v.id===id);
    if (i !== -1) vehs[i] = { ...vehs[i], lat, lng, status, lastUpdated: new Date().toISOString() };
    DB.set('vehicles', vehs);
    closeAllModals();
    toast('Location updated!', 'success');
    renderVehicles();
  });
}

function deleteVehicle(id) {
  if (!confirmAction('Delete this vehicle?')) return;
  if (_liveTrackVehId === id) {
    navigator.geolocation.clearWatch(_liveTrackWatch);
    _liveTrackWatch = null; _liveTrackVehId = null;
  }
  DB.set('vehicles', (DB.get('vehicles')||[]).filter(v=>v.id!==id));
  renderVehicles();
}

// ── School Location — used for parent-side ETA calculation ───────────────────
function openSchoolLocModal() {
  const st = DB.get('school_settings') || {};
  buildModal('modal-school-loc', '🏫 School Location & Geofence', `
    <p style="color:rgba(255,255,255,.5);font-size:.85rem;margin-bottom:12px">
      Set the school GPS location. Used for Bus ETA and for <strong>Geofencing Attendance</strong> — staff are auto-marked Present when they enter the boundary.
    </p>
    <button type="button" class="btn btn-cyan" style="width:100%;margin-bottom:16px;" onclick="_useDeviceGPS('schloc-lat','schloc-lng')">
      📍 Use My Current Location (press while standing at the school)
    </button>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Latitude *</label>
        <input type="number" step="any" class="form-control" id="schloc-lat" placeholder="19.0760" value="${st.lat||''}"></div>
      <div class="form-group"><label class="form-label">Longitude *</label>
        <input type="number" step="any" class="form-control" id="schloc-lng" placeholder="72.8777" value="${st.lng||''}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Geofence Radius (metres)</label>
        <input type="number" class="form-control" id="schloc-radius" placeholder="150" value="${st.geofenceRadius||150}"></div>
      <div class="form-group"><label class="form-label">Geofence Attendance</label>
        <select class="form-control" id="schloc-geo">
          <option value="1" ${st.geofenceEnabled?'selected':''}>Enabled</option>
          <option value="0" ${!st.geofenceEnabled?'selected':''}>Disabled</option>
        </select></div>
    </div>
    <div style="font-size:.76rem;color:rgba(255,255,255,.4);">Tip: 100–200m radius works well. Staff get auto-marked Present when their phone is within this distance of the school.</div>
  `, () => {
    const lat = parseFloat(document.getElementById('schloc-lat').value);
    const lng = parseFloat(document.getElementById('schloc-lng').value);
    if (!lat || !lng) { toast('Enter valid coordinates', 'warning'); return; }
    const radius = Number(document.getElementById('schloc-radius').value)||150;
    const geofenceEnabled = document.getElementById('schloc-geo').value==='1';
    const s = DB.get('school_settings') || {};
    DB.set('school_settings', { ...s, lat, lng, geofenceRadius:radius, geofenceEnabled });
    closeAllModals();
    toast('🏫 School location & geofence saved!', 'success');
  });
}

// ── Hardware GPS Device Setup — bus mein laga SIM-based GPS tracker ──────────
// Tracker device ko server URL configure karna hota hai (SMS command ya app se).
// Device api/gps.php pe location bhejta hai → wahi vehicle_live_{id} key mein
// save hota hai jo driver-phone wala system use karta hai. Dono ek saath kaam karte hai.
function openGpsDeviceModal(vehId) {
  const v = (DB.get('vehicles')||[]).find(x=>x.id===vehId);
  if (!v) return;
  const schoolId = DB._schoolId ? DB._schoolId() : (DB.get('school_settings')||{}).id || 'school';
  const base = location.origin + location.pathname.replace(/\/[^/]+$/, '/') + 'api/gps.php';
  const deviceUrl = `${base}?school=${encodeURIComponent(schoolId)}&v=${encodeURIComponent(vehId)}`;
  const exampleUrl = deviceUrl + '&lat={LAT}&lon={LON}&speed={SPEED}';

  buildModal('modal-gps-device', `📟 GPS Tracker Device — ${v.name}`, `
    <p style="color:rgba(255,255,255,.5);font-size:.85rem;margin-bottom:14px;line-height:1.6">
      If the vehicle has a <strong>hardware GPS tracker</strong> (SIM-based device — GT06, Concox, AIS-140, or any other),
      configure it to send location to the URL below. Whatever the device sends will appear
      live on the admin map and in the parents Bus Tracker.
    </p>

    <label class="form-label">📡 Device Server URL (set this in the device)</label>
    <div style="display:flex;gap:6px;margin-bottom:14px;">
      <input class="form-control" id="gps-dev-url" readonly value="${deviceUrl}" style="font-size:11px;font-family:monospace;flex:1" onclick="this.select()">
      <button class="btn btn-sm btn-primary" onclick="navigator.clipboard.writeText(document.getElementById('gps-dev-url').value).then(()=>toast('✅ URL copied!','success'))">📋 Copy</button>
    </div>

    <div style="background:rgba(6,182,212,.07);border:1px solid rgba(6,182,212,.25);border-radius:10px;padding:12px 14px;font-size:12px;color:rgba(255,255,255,.55);line-height:1.8;margin-bottom:14px;">
      <strong style="color:#06b6d4">⚙️ How to set up:</strong><br>
      <strong>1. Traccar Client app (easiest, free):</strong> Install the "Traccar Client" app on the driver phone
      or a spare phone kept in the bus → paste the URL above as Server URL → Start. Done!<br>
      <strong>2. Hardware tracker (GT06/Concox type):</strong> Set a custom HTTP server via the device SMS
      command, or ask your GPS vendor to forward data to this URL in "OsmAnd format".<br>
      <strong>3. Already using a Traccar server?</strong> Add this URL as a forwarding/webhook target in Traccar.
    </div>

    <label class="form-label">🔧 URL Format (technical detail for your vendor)</label>
    <div style="background:rgba(0,0,0,.3);border-radius:8px;padding:10px 12px;font-size:10.5px;font-family:monospace;color:rgba(255,255,255,.45);word-break:break-all;margin-bottom:10px;">
      ${exampleUrl}
    </div>
    <div style="font-size:11.5px;color:rgba(255,255,255,.4);line-height:1.7">
      Supported params: <code>lat, lon, speed</code> (km/h), <code>bearing, accuracy, timestamp</code> —
      Both GET and POST work. OsmAnd/Traccar protocol compatible.
    </div>

    <hr style="border-color:rgba(255,255,255,.08);margin:14px 0">
    <div style="display:flex;align-items:center;gap:8px;">
      <button class="btn btn-sm btn-secondary" onclick="_testGpsDevice('${vehId}')">🧪 Test Connection</button>
      <span id="gps-test-result" style="font-size:12px;color:rgba(255,255,255,.4)"></span>
    </div>
  `, ()=>closeAllModals(), 'modal-lg');
}

// Sends one fake ping through gps.php then reads it back — proves the pipeline works
function _testGpsDevice(vehId) {
  const schoolId = DB._schoolId ? DB._schoolId() : (DB.get('school_settings')||{}).id || '';
  const out = document.getElementById('gps-test-result');
  if (out) out.textContent = '⏳ Testing…';
  const testLat = 20.5937 + Math.random()*0.001, testLng = 78.9629 + Math.random()*0.001;
  fetch(`api/gps.php?school=${encodeURIComponent(schoolId)}&v=${encodeURIComponent(vehId)}&lat=${testLat}&lon=${testLng}&speed=0`)
    .then(r => r.json())
    .then(j => {
      if (j.ok) {
        if (out) { out.textContent = '✅ Working! Device URL is live — a test marker will appear on the map'; out.style.color = '#10b981'; }
        _pollVehiclesOnce(schoolId);
      } else {
        if (out) { out.textContent = '❌ Error: ' + (j.error||'unknown'); out.style.color = '#ef4444'; }
      }
    })
    .catch(() => { if (out) { out.textContent = '❌ Could not reach server — check api/gps.php on your hosting'; out.style.color = '#ef4444'; } });
}

// ── Driver Link — share this URL with the driver so their phone broadcasts GPS ─
function copyDriverLink(vehId) {
  const v = (DB.get('vehicles')||[]).find(x=>x.id===vehId);
  if (!v) return;
  const schoolId = DB._schoolId ? DB._schoolId() : (DB.get('school_settings')||{}).id || 'school';
  const base = location.origin + location.pathname.replace(/\/[^/]+$/, '/') + 'driver-tracking.html';
  const driverName = encodeURIComponent(v.driver || v.name);
  const url = `${base}?school=${encodeURIComponent(schoolId)}&v=${encodeURIComponent(vehId)}&name=${driverName}`;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(() => toast('✅ Driver link copied! Send it to the driver on WhatsApp', 'success'));
  } else {
    prompt('Link for the driver (copy it):', url);
  }
}

// ── Server-side live poll — reads vehicle_live_{id} from kv.php every 8s ──────
function _startVehPoll() {
  if (_vehPollTimer) { clearInterval(_vehPollTimer); _vehPollTimer = null; }
  const schoolId = DB._schoolId ? DB._schoolId() : (DB.get('school_settings')||{}).id || '';
  if (!schoolId) return;
  _pollVehiclesOnce(schoolId);
  _vehPollTimer = setInterval(() => _pollVehiclesOnce(schoolId), 8000);
}

function _pollVehiclesOnce(schoolId) {
  const vehicles = DB.get('vehicles') || [];
  if (!vehicles.length) return;
  vehicles.forEach(v => {
    fetch(`api/kv.php?school_id=${encodeURIComponent(schoolId)}&key=vehicle_live_${encodeURIComponent(v.id)}`)
      .then(r => r.ok ? r.text() : null)
      .then(txt => {
        if (!txt || txt.trim()==='null' || txt.trim()==='') return;
        let ld;
        try { ld = JSON.parse(txt); } catch(e) { return; }
        if (!ld || !ld.lat) return;
        const wasOnline = _vehLiveData[v.id]?.online;
        _vehLiveData[v.id] = ld;
        const isOnline = ld.online && ld.timestamp && (Date.now()-new Date(ld.timestamp).getTime()<30000);
        if (isOnline && _mapInstance) {
          _addVehicleMarker(v, ld);
          // Update fleet card coords without full re-render
          const card = document.getElementById('vcard-' + v.id);
          if (card) {
            const coordEl = card.querySelector('[data-coords]');
            if (coordEl) {
              coordEl.style.color = '#10b981';
              coordEl.textContent = `🛰 ${parseFloat(ld.lat).toFixed(5)}, ${parseFloat(ld.lng).toFixed(5)}` + (ld.speed ? ` · 🚀 ${ld.speed} km/h` : '') + (ld.accuracy ? ` · 🎯 ±${ld.accuracy}m` : '');
            }
          }
        }
        // If vehicle just came online — re-render fleet list for full badge
        if (!wasOnline && isOnline) renderVehicles();
      }).catch(()=>{});
  });
}

// ══════════════════════════════════════════════════════
//  MESSAGES — Admin WhatsApp-style Chat
// ══════════════════════════════════════════════════════
let _admChat = { tid:'', search:'', tab:'mine' };

function renderAdminMessages() {
  // Badge
  const unread = _chatUnread(CU.id);
  const badge  = document.getElementById('admin-msg-badge');
  if (badge) { badge.style.display = unread?'inline':'none'; badge.textContent = unread; }

  const myT  = _chatMyThreads(CU.id);
  const allT = _chatAll().sort((a,b)=>(b.lastTime||'').localeCompare(a.lastTime||''));
  const pool = _admChat.tab==='all' ? allT : myT;
  const filt = _admChat.search
    ? pool.filter(t=>t.p.some(p=>(p.name||'').toLowerCase().includes(_admChat.search.toLowerCase())))
    : pool;
  const mob  = window.innerWidth<=768;

  document.getElementById('section-messages').innerHTML = `
  <div class="page-header">
    <div><h2>💬 Messages</h2><div class="breadcrumb">Chat with parents &amp; teachers · See all school communications</div></div>
    <button class="btn btn-primary" onclick="_admNewChat()">✏️ New Chat</button>
  </div>

  <div class="chat-wrap" style="height:calc(100vh - var(--header) - 110px);min-height:480px">

    <!-- Sidebar -->
    <div class="chat-sidebar ${mob&&_admChat.tid?'chat-panel-hide':''}">
      <div style="padding:12px 14px;border-bottom:1px solid var(--border);flex-shrink:0">
        <input type="search" class="form-control" placeholder="🔍 Search…" value="${_admChat.search}"
          oninput="_admChat.search=this.value;renderAdminMessages()" style="margin-bottom:9px;font-size:13px">
        <div style="display:flex;gap:5px;margin-bottom:9px">
          <button class="btn btn-sm ${_admChat.tab==='mine'?'btn-primary':'btn-secondary'}" style="flex:1;font-size:11px"
            onclick="_admChat.tab='mine';renderAdminMessages()">💬 My Chats (${myT.length})</button>
          <button class="btn btn-sm ${_admChat.tab==='all'?'btn-primary':'btn-secondary'}" style="flex:1;font-size:11px"
            onclick="_admChat.tab='all';renderAdminMessages()">👁 All (${allT.length})</button>
        </div>
        <button class="btn btn-primary w-full" onclick="_admNewChat()" style="font-size:13px">✏️ New Conversation</button>
      </div>
      <div style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch">
        ${filt.length===0
          ? `<div style="padding:32px 20px;text-align:center;color:var(--text-3)"><div style="font-size:2.5rem;margin-bottom:8px">💬</div><div style="font-size:13px">${_admChat.tab==='mine'?'No conversations yet.':'No conversations in school yet.'}</div></div>`
          : filt.map(t=>_admChat.tab==='all'?_admAllItem(t,_admChat.tid):_chatThreadItem(t,CU.id,_admChat.tid,'_admOpenThread')).join('')}
      </div>
    </div>

    <!-- Chat window -->
    <div class="chat-main ${mob&&!_admChat.tid?'chat-panel-hide':''}">
      ${_admChat.tid ? _admChatWin() : `
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;color:var(--text-3);gap:10px;text-align:center;padding:40px">
        <div style="font-size:4rem">💬</div>
        <div style="font-size:16px;font-weight:700;color:var(--text)">Select a conversation</div>
        <div style="font-size:13px">Choose from the list or start a new chat</div>
        <button class="btn btn-primary mt-8" onclick="_admNewChat()">✏️ Start New Chat</button>
      </div>`}
    </div>

  </div>`;

  const msgsEl = document.getElementById('_vc_msgs');
  if (msgsEl) msgsEl.scrollTop = msgsEl.scrollHeight;
}

// Build chat window HTML (admin)
function _admChatWin() {
  const thread = _chatGetById(_admChat.tid);
  if (!thread) return '';
  _chatMarkRead(_admChat.tid, CU.id);

  const amI = thread.p.some(p=>p.id===CU.id);
  const other = amI
    ? (thread.p.find(p=>p.id!==CU.id)||thread.p[0])
    : thread.p[0];
  const COLS = {'admin':'#7c3aed','teacher':'#06b6d4','parent':'#10b981'};
  const col  = COLS[other.role]||'#94a3b8';
  const rLbl = {'admin':'👑 Admin','teacher':'👩‍🏫 Teacher','parent':'👨‍👩‍👦 Parent'}[other.role]||other.role;

  let hName = amI ? other.name : `${thread.p[0].name} ↔ ${thread.p[1].name}`;
  let hSub  = amI ? rLbl : `${thread.p[0].role} · ${thread.p[1].role} · 👁️ Read-only`;

  const myId   = CU.id;
  const myName = (CU.name||'Admin').replace(/'/g,"\\'");

  return `
  <div style="padding:12px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px;flex-shrink:0;background:rgba(255,255,255,.02)">
    <button class="btn btn-sm btn-secondary chat-mob-back" onclick="_admChat.tid='';renderAdminMessages()" style="padding:5px 10px">← Back</button>
    <div style="width:40px;height:40px;border-radius:50%;background:${col};display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;flex-shrink:0;font-size:1.05rem">${(other.name||'?')[0].toUpperCase()}</div>
    <div style="flex:1;min-width:0">
      <div style="font-weight:700;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${hName}</div>
      <div style="font-size:11px;color:var(--text-3)">${hSub}</div>
    </div>
    ${amI?`<button class="btn btn-sm btn-danger" title="Delete conversation"
      onclick="if(confirmAction('Delete this conversation?')){var a=_chatAll();_chatSave(a.filter(function(x){return x.id!=='${_admChat.tid}';}));_admChat.tid='';renderAdminMessages()}">🗑️</button>`:''}
  </div>
  <div id="_vc_msgs" class="chat-msgs">${_chatMsgsHtml(thread, myId)}</div>
  ${amI?`
  <div class="chat-inp-bar">
    <textarea id="_vc_input" class="chat-textarea" placeholder="Type a message… (Enter to send)"
      onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();window._vmChatSend('${_admChat.tid}','${myId}','${myName}','admin','_vc_input')}"
      oninput="window._vmChatResize(this)"></textarea>
    <button class="chat-send" onclick="window._vmChatSend('${_admChat.tid}','${myId}','${myName}','admin','_vc_input')">➤</button>
  </div>`:`
  <div style="padding:12px;border-top:1px solid var(--border);text-align:center;color:var(--text-3);font-size:12px;flex-shrink:0">
    👁️ Read-only view — You're monitoring this conversation as Admin
  </div>`}`;
}

// All-chats thread item (shows both participants)
function _admAllItem(thread, activeId) {
  const [p1,p2] = thread.p;
  const act = thread.id===activeId;
  const COLS={'admin':'#7c3aed','teacher':'#06b6d4','parent':'#10b981'};
  return `<div onclick="_admOpenThread('${thread.id}')"
    style="display:flex;align-items:center;gap:10px;padding:11px 14px;cursor:pointer;border-bottom:1px solid rgba(255,255,255,.05);
           background:${act?'rgba(124,58,237,.18)':'transparent'};transition:background .15s"
    onmouseover="this.style.background='${act?'rgba(124,58,237,.18)':'rgba(255,255,255,.04)'}'"
    onmouseout="this.style.background='${act?'rgba(124,58,237,.18)':'transparent'}'">
    <div style="position:relative;width:42px;height:42px;flex-shrink:0">
      <div style="width:28px;height:28px;border-radius:50%;background:${COLS[p1.role]||'#94a3b8'};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;position:absolute;top:0;left:0">${(p1.name||'?')[0]}</div>
      <div style="width:28px;height:28px;border-radius:50%;background:${COLS[p2.role]||'#94a3b8'};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;position:absolute;bottom:0;right:0;border:2px solid rgba(6,6,26,1)">${(p2.name||'?')[0]}</div>
    </div>
    <div style="flex:1;min-width:0">
      <div style="font-size:12px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p1.name} ↔ ${p2.name}</div>
      <div style="font-size:10px;color:var(--text-3);margin-top:1px">${_chatFmtTime(thread.lastTime)}</div>
      <div style="font-size:11px;color:var(--text-3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:2px">${thread.lastMsg||'No messages yet'}</div>
    </div>
  </div>`;
}

// Open thread — update right panel only (desktop) or full re-render (mobile)
function _admOpenThread(tid) {
  _admChat.tid = tid;
  _chatMarkRead(tid, CU.id);
  if (window.innerWidth<=768) { renderAdminMessages(); return; }
  // Desktop: update right panel only
  const mainEl = document.getElementById('_vc_main')||document.querySelector('.chat-main');
  if (mainEl) { mainEl.outerHTML = '<div id="_vc_main" class="chat-main">'+_admChatWin()+'</div>'; }
  const msgsEl = document.getElementById('_vc_msgs');
  if (msgsEl) msgsEl.scrollTop = msgsEl.scrollHeight;
  // Update badge
  const unread = _chatUnread(CU.id);
  const badge  = document.getElementById('admin-msg-badge');
  if (badge) { badge.style.display=unread?'inline':'none'; badge.textContent=unread; }
  // Highlight active thread in sidebar
  document.querySelectorAll('[id^="_vc_item_"]').forEach(function(el){
    el.style.background = el.id==='_vc_item_'+tid ? 'rgba(124,58,237,.18)' : 'transparent';
  });
}

// New chat — pick a contact
function _admNewChat() {
  const teachers = DB.get('teachers');
  const students = DB.get('students');
  const contacts = [
    ...teachers.map(t=>({id:t.id,name:t.name,role:'teacher',sub:t.subject||'Teacher',col:'#06b6d4'})),
    ...students.map(s=>({id:s.id,name:'Parent of '+s.name,role:'parent',sub:DB.find('classes',s.classId)?.name||'',col:'#10b981'}))
  ];
  const html = `
  <input type="search" class="form-control" placeholder="🔍 Search contacts…" style="margin-bottom:12px"
    oninput="var q=this.value.toLowerCase();document.querySelectorAll('.adm-contact').forEach(function(el){el.style.display=el.dataset.n.includes(q)?'flex':'none'})">
  <div style="display:flex;flex-direction:column;gap:6px;max-height:420px;overflow-y:auto">
    ${contacts.map(c=>`
    <div class="adm-contact" data-n="${c.name.toLowerCase()}"
         onclick="_admStartChat('${c.id}','${c.name.replace(/'/g,'&#39;')}','${c.role}');closeAllModals()"
         style="display:flex;align-items:center;gap:12px;padding:11px 14px;border-radius:10px;border:1px solid var(--border);cursor:pointer;transition:background .14s"
         onmouseover="this.style.background='rgba(124,58,237,.1)'" onmouseout="this.style.background=''">
      <div style="width:40px;height:40px;border-radius:50%;background:${c.col};display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;flex-shrink:0;font-size:1.1rem">${c.name[0].toUpperCase()}</div>
      <div>
        <div style="font-weight:600;font-size:14px">${c.name}</div>
        <div style="font-size:11px;color:var(--text-3)">${c.role==='teacher'?'👩‍🏫':'👨‍👩‍👦'} ${c.sub}</div>
      </div>
    </div>`).join('')}
  </div>`;
  buildModal('_adm_new_chat','💬 Start New Conversation',html,null);
}

function _admStartChat(cId, cName, cRole) {
  const me   = {id:CU.id,   name:CU.name||'Admin', role:'admin'};
  const them = {id:cId,     name:cName,             role:cRole};
  const t    = _chatCreate(me, them);
  _admChat.tab = 'mine';
  _admOpenThread(t.id);
  renderAdminMessages();
}

// Badge init on load
(function _admBadgeInit(){
  setTimeout(function(){
    const n = _chatUnread(CU.id);
    const b = document.getElementById('admin-msg-badge');
    if (b){ b.style.display=n?'inline':'none'; b.textContent=n; }
  },300);
})();

// ══════════════════════════════════════════════════════
//  REMINDERS — Admin personal reminder / alert system
// ══════════════════════════════════════════════════════
function renderReminders() {
  const all = DB.get('reminders').sort((a,b)=>{
    const order={high:0,medium:1,low:2};
    if(a.status==='done'&&b.status!=='done') return 1;
    if(b.status==='done'&&a.status!=='done') return -1;
    return (order[a.priority]||1)-(order[b.priority]||1);
  });
  const pending = all.filter(r=>r.status!=='done');
  const done    = all.filter(r=>r.status==='done');

  const _prioStyle = p => p==='high'
    ? 'background:rgba(239,68,68,.12);color:#ef4444;border:1px solid rgba(239,68,68,.3);'
    : p==='medium'
    ? 'background:rgba(245,158,11,.12);color:#f59e0b;border:1px solid rgba(245,158,11,.3);'
    : 'background:rgba(16,185,129,.1);color:#10b981;border:1px solid rgba(16,185,129,.25);';

  const _catIcon = c => ({fees:'💳',exam:'📝',meeting:'👥',event:'🎉',leave:'📅',notice:'📢',other:'📌'})[c]||'📌';

  const _card = (r, isDone) => `
    <div style="display:flex;gap:14px;align-items:flex-start;padding:14px 16px;
      background:rgba(255,255,255,.03);border:1px solid ${isDone?'rgba(255,255,255,.05)':'rgba(255,255,255,.1)'};
      border-radius:12px;margin-bottom:10px;opacity:${isDone?.55:1};">
      <!-- Icon -->
      <div style="width:40px;height:40px;border-radius:10px;background:rgba(124,58,237,.15);
        display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">
        ${_catIcon(r.category)}
      </div>
      <!-- Content -->
      <div style="flex:1;min-width:0;">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px;">
          <span style="font-weight:700;color:${isDone?'rgba(255,255,255,.4)':'#fff'};font-size:.92rem;
            text-decoration:${isDone?'line-through':'none'};">${r.title}</span>
          <span style="padding:1px 8px;border-radius:20px;font-size:.68rem;font-weight:700;${_prioStyle(r.priority)}">
            ${r.priority?.toUpperCase()||'MEDIUM'}
          </span>
          ${isDone?'<span style="padding:1px 8px;border-radius:20px;font-size:.68rem;font-weight:700;background:rgba(16,185,129,.1);color:#10b981;border:1px solid rgba(16,185,129,.25);">✅ Done</span>':''}
        </div>
        ${r.notes?`<div style="font-size:.8rem;color:rgba(255,255,255,.5);margin-bottom:6px;line-height:1.5;">${r.notes}</div>`:''}
        <div style="font-size:.75rem;color:rgba(255,255,255,.3);">
          📅 Due: <strong style="color:${!isDone&&r.dueDate<=today()?'#ef4444':'rgba(255,255,255,.5)'};">
            ${r.dueDate?formatDate(r.dueDate):'No date'}</strong>
          ${r.dueTime?` &nbsp;⏰ ${r.dueTime}`:''}
          &nbsp;·&nbsp; ${_catIcon(r.category)} ${r.category||'General'}
          &nbsp;·&nbsp; Added ${formatDate(r.createdAt?.split?.('T')[0]||r.createdAt)}
        </div>
      </div>
      <!-- Actions -->
      <div style="display:flex;flex-direction:column;gap:6px;flex-shrink:0;">
        ${!isDone?`
          <button onclick="markReminderDone('${r.id}')"
            style="background:rgba(16,185,129,.12);color:#10b981;border:1px solid rgba(16,185,129,.3);
            border-radius:7px;padding:5px 12px;cursor:pointer;font-size:.75rem;font-weight:700;white-space:nowrap;">
            ✅ Done
          </button>
          <button onclick="editReminder('${r.id}')"
            style="background:rgba(99,102,241,.1);color:#a78bfa;border:1px solid rgba(99,102,241,.25);
            border-radius:7px;padding:5px 12px;cursor:pointer;font-size:.75rem;font-weight:700;">
            ✏️ Edit
          </button>` : ''}
        <button onclick="deleteReminder('${r.id}')"
          style="background:rgba(239,68,68,.08);color:#ef4444;border:1px solid rgba(239,68,68,.2);
          border-radius:7px;padding:5px 12px;cursor:pointer;font-size:.75rem;font-weight:700;">
          🗑️
        </button>
      </div>
    </div>`;

  document.getElementById('section-reminders').innerHTML = `
  <div class="page-header">
    <div>
      <h2>🔔 Reminders</h2>
      <p class="page-sub">Personal reminders — pop up automatically when you open the admin panel</p>
    </div>
    <button class="btn btn-primary" onclick="openAddReminderModal()">➕ Add Reminder</button>
  </div>

  <!-- Stats -->
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:14px;margin-bottom:24px;">
    <div class="card" style="text-align:center;padding:16px;">
      <div style="font-size:2rem;font-weight:800;color:#ef4444;">${pending.filter(r=>r.dueDate&&r.dueDate<today()).length}</div>
      <div style="color:rgba(255,255,255,.4);font-size:.75rem;margin-top:4px;">Overdue</div>
    </div>
    <div class="card" style="text-align:center;padding:16px;">
      <div style="font-size:2rem;font-weight:800;color:#f59e0b;">${pending.filter(r=>r.dueDate===today()).length}</div>
      <div style="color:rgba(255,255,255,.4);font-size:.75rem;margin-top:4px;">Due Today</div>
    </div>
    <div class="card" style="text-align:center;padding:16px;">
      <div style="font-size:2rem;font-weight:800;color:#a78bfa;">${pending.length}</div>
      <div style="color:rgba(255,255,255,.4);font-size:.75rem;margin-top:4px;">Pending</div>
    </div>
    <div class="card" style="text-align:center;padding:16px;">
      <div style="font-size:2rem;font-weight:800;color:#10b981;">${done.length}</div>
      <div style="color:rgba(255,255,255,.4);font-size:.75rem;margin-top:4px;">Completed</div>
    </div>
  </div>

  <!-- Pending -->
  <div class="card mb-24">
    <div class="card-header">
      <h3>⏳ Pending Reminders (${pending.length})</h3>
      ${pending.length?`<button class="btn btn-sm" onclick="markAllRemindersDone()"
        style="background:rgba(16,185,129,.12);color:#10b981;border:1px solid rgba(16,185,129,.3);">
        ✅ Mark All Done</button>`:''}
    </div>
    <div class="card-body">
      ${pending.length
        ? pending.map(r=>_card(r,false)).join('')
        : '<div class="empty-state"><div class="e-icon">🎉</div><p>No pending reminders! You\'re all caught up.</p></div>'}
    </div>
  </div>

  <!-- Completed -->
  ${done.length?`
  <div class="card">
    <div class="card-header">
      <h3 style="color:rgba(255,255,255,.4);">✅ Completed (${done.length})</h3>
      <button class="btn btn-sm btn-danger" onclick="clearDoneReminders()">🗑️ Clear All</button>
    </div>
    <div class="card-body">${done.map(r=>_card(r,true)).join('')}</div>
  </div>`:''}`;

  _updateReminderNavBadge();
}

function openAddReminderModal(prefillId='') {
  const existing = prefillId ? DB.find('reminders', prefillId) : null;
  buildModal('modal-add-reminder', existing ? '✏️ Edit Reminder' : '🔔 Add Reminder', `
    <div class="form-group">
      <label class="form-label">Title *</label>
      <input class="form-control" id="rem-title" placeholder="e.g. Collect exam fees, Send progress report…"
        value="${existing?.title||''}">
    </div>
    <div class="form-group">
      <label class="form-label">Notes / Details</label>
      <textarea class="form-control" id="rem-notes" rows="3"
        placeholder="Additional details…">${existing?.notes||''}</textarea>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
      <div class="form-group">
        <label class="form-label">📅 Due Date</label>
        <input class="form-control" type="date" id="rem-date" value="${existing?.dueDate||today()}">
      </div>
      <div class="form-group">
        <label class="form-label">⏰ Time (optional)</label>
        <input class="form-control" type="time" id="rem-time" value="${existing?.dueTime||''}">
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
      <div class="form-group">
        <label class="form-label">🚦 Priority</label>
        <select class="form-control" id="rem-priority">
          <option value="high"   ${existing?.priority==='high'  ?'selected':''}>🔴 High</option>
          <option value="medium" ${!existing||existing?.priority==='medium'?'selected':''}>🟡 Medium</option>
          <option value="low"    ${existing?.priority==='low'   ?'selected':''}>🟢 Low</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">📌 Category</label>
        <select class="form-control" id="rem-category">
          <option value="fees"    ${existing?.category==='fees'   ?'selected':''}>💳 Fees</option>
          <option value="exam"    ${existing?.category==='exam'   ?'selected':''}>📝 Exam</option>
          <option value="meeting" ${existing?.category==='meeting'?'selected':''}>👥 Meeting</option>
          <option value="event"   ${existing?.category==='event'  ?'selected':''}>🎉 Event</option>
          <option value="leave"   ${existing?.category==='leave'  ?'selected':''}>📅 Leave</option>
          <option value="notice"  ${existing?.category==='notice' ?'selected':''}>📢 Notice</option>
          <option value="other"   ${existing?.category==='other'  ?'selected':''}>📌 Other</option>
        </select>
      </div>
    </div>`,
  () => saveReminder(prefillId), 'md');
}

function editReminder(id) { openAddReminderModal(id); }

function saveReminder(editId='') {
  const title    = document.getElementById('rem-title')?.value.trim();
  const notes    = document.getElementById('rem-notes')?.value.trim();
  const dueDate  = document.getElementById('rem-date')?.value;
  const dueTime  = document.getElementById('rem-time')?.value;
  const priority = document.getElementById('rem-priority')?.value;
  const category = document.getElementById('rem-category')?.value;

  if (!title) { toast('Title is required', 'warning'); return; }

  if (editId) {
    DB.update('reminders', editId, { title, notes, dueDate, dueTime, priority, category });
    toast('Reminder updated!', 'success');
  } else {
    DB.push('reminders', {
      id: genId('rem'), title, notes, dueDate, dueTime,
      priority, category, status: 'pending',
      createdAt: new Date().toISOString(), createdBy: CU.name
    });
    toast('🔔 Reminder added!', 'success');
  }
  closeAllModals();
  renderReminders();
}

function markReminderDone(id) {
  DB.update('reminders', id, { status: 'done' });
  toast('✅ Marked as done!', 'success');
  renderReminders();
}

function markAllRemindersDone() {
  if (!confirmAction('Mark all pending reminders as done?')) return;
  const all = DB.get('reminders').map(r => r.status !== 'done' ? {...r, status:'done'} : r);
  DB.set('reminders', all);
  toast('All reminders marked done!', 'success');
  renderReminders();
}

function deleteReminder(id) {
  if (!confirmAction('Delete this reminder?')) return;
  DB.set('reminders', DB.get('reminders').filter(r => r.id !== id));
  toast('Reminder deleted', 'info');
  renderReminders();
}

function clearDoneReminders() {
  if (!confirmAction('Clear all completed reminders?')) return;
  DB.set('reminders', DB.get('reminders').filter(r => r.status !== 'done'));
  toast('Completed reminders cleared', 'info');
  renderReminders();
}

function _updateReminderNavBadge() {
  const due = DB.get('reminders').filter(r =>
    r.status !== 'done' && r.dueDate && r.dueDate <= today()
  ).length;
  const badge = document.getElementById('reminder-nav-badge');
  if (badge) { badge.style.display = due ? 'inline' : 'none'; badge.textContent = due; }
}

// ── Popup on page open: show due/overdue reminders ────
(function _reminderStartupPopup() {
  setTimeout(() => {
    const all = DB.get('reminders');
    const due = all.filter(r =>
      r.status !== 'done' &&
      r.dueDate && r.dueDate <= today()
    ).sort((a,b) => {
      const o = {high:0,medium:1,low:2};
      return (o[a.priority]||1) - (o[b.priority]||1);
    });

    _updateReminderNavBadge();

    if (!due.length) return;

    // Build popup
    const _prioColor = p => p==='high'?'#ef4444':p==='medium'?'#f59e0b':'#10b981';
    const _catIcon   = c => ({fees:'💳',exam:'📝',meeting:'👥',event:'🎉',leave:'📅',notice:'📢',other:'📌'})[c]||'📌';

    let popupIdx = 0;

    const overlay = document.createElement('div');
    overlay.id = '_rem_popup_overlay';
    overlay.style.cssText = `position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.75);
      backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);
      display:flex;align-items:center;justify-content:center;padding:20px;
      animation:_remFadeIn .35s ease;`;

    overlay.innerHTML = `
      <style>
        @keyframes _remFadeIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
        @keyframes _remSlide{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
      </style>
      <div id="_rem_popup_box" style="background:linear-gradient(145deg,#1a1235,#0f172a);
        border:1.5px solid rgba(124,58,237,.4);border-radius:22px;padding:28px 28px 22px;
        max-width:460px;width:100%;box-shadow:0 24px 80px rgba(0,0,0,.7),0 0 0 1px rgba(124,58,237,.15);
        position:relative;animation:_remSlide .3s ease;">

        <!-- Header -->
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
          <div style="width:44px;height:44px;border-radius:12px;
            background:linear-gradient(135deg,#7c3aed,#ef4444);
            display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">🔔</div>
          <div>
            <div style="font-weight:800;font-size:1.05rem;color:#fff;">Reminder Alert</div>
            <div style="font-size:.78rem;color:rgba(255,255,255,.4);">${due.length} reminder${due.length>1?'s':''} need${due.length===1?'s':''} your attention</div>
          </div>
          <button onclick="_remClose()" style="margin-left:auto;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);
            color:rgba(255,255,255,.6);border-radius:50%;width:32px;height:32px;cursor:pointer;font-size:16px;
            display:flex;align-items:center;justify-content:center;flex-shrink:0;">✕</button>
        </div>

        <!-- Reminder card (dynamic) -->
        <div id="_rem_popup_card"></div>

        <!-- Navigation -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:16px;padding-top:14px;border-top:1px solid rgba(255,255,255,.07);">
          <div id="_rem_popup_dots" style="display:flex;gap:6px;align-items:center;"></div>
          <div style="display:flex;gap:8px;">
            <button id="_rem_prev" onclick="_remNav(-1)" style="background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);
              color:rgba(255,255,255,.5);border-radius:8px;padding:6px 14px;cursor:pointer;font-size:.8rem;font-weight:700;">‹ Prev</button>
            <button id="_rem_next" onclick="_remNav(1)"  style="background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);
              color:rgba(255,255,255,.5);border-radius:8px;padding:6px 14px;cursor:pointer;font-size:.8rem;font-weight:700;">Next ›</button>
          </div>
        </div>

        <!-- Bottom actions -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px;">
          <button onclick="_remDoneCurrent()"
            style="background:linear-gradient(135deg,rgba(16,185,129,.2),rgba(16,185,129,.1));color:#10b981;
            border:1px solid rgba(16,185,129,.35);border-radius:12px;padding:11px;font-weight:700;cursor:pointer;font-size:.85rem;">
            ✅ Mark Done
          </button>
          <button onclick="_remGotoSection()"
            style="background:linear-gradient(135deg,rgba(124,58,237,.25),rgba(124,58,237,.1));color:#a78bfa;
            border:1px solid rgba(124,58,237,.35);border-radius:12px;padding:11px;font-weight:700;cursor:pointer;font-size:.85rem;">
            👁️ View All
          </button>
        </div>
      </div>`;

    document.body.appendChild(overlay);

    function _remRender() {
      const r   = due[popupIdx];
      const box = document.getElementById('_rem_popup_card');
      if (!box) return;
      const overdue = r.dueDate < today();
      box.innerHTML = `
        <div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);
          border-radius:14px;padding:16px 18px;animation:_remSlide .2s ease;">
          <div style="display:flex;align-items:flex-start;gap:12px;">
            <div style="font-size:2rem;flex-shrink:0;">${_catIcon(r.category)}</div>
            <div style="flex:1;min-width:0;">
              <div style="font-weight:800;font-size:1rem;color:#fff;margin-bottom:6px;">${r.title}</div>
              ${r.notes?`<div style="font-size:.8rem;color:rgba(255,255,255,.5);margin-bottom:8px;line-height:1.5;">${r.notes}</div>`:''}
              <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
                <span style="padding:2px 10px;border-radius:20px;font-size:.7rem;font-weight:700;
                  background:rgba(239,68,68,.12);color:${_prioColor(r.priority)};
                  border:1px solid rgba(239,68,68,.25);">${r.priority?.toUpperCase()||'MEDIUM'}</span>
                <span style="font-size:.78rem;color:${overdue?'#ef4444':'rgba(255,255,255,.4)'};">
                  ${overdue?'⚠️ Overdue:':'📅'} ${formatDate(r.dueDate)}${r.dueTime?' '+r.dueTime:''}
                </span>
              </div>
            </div>
          </div>
        </div>`;
      // Dots
      const dotsEl = document.getElementById('_rem_popup_dots');
      if (dotsEl) {
        dotsEl.innerHTML = due.map((_,i)=>
          `<div style="width:${i===popupIdx?18:7}px;height:7px;border-radius:10px;transition:all .2s;
            background:${i===popupIdx?'#a78bfa':'rgba(255,255,255,.2)'}"></div>`
        ).join('');
      }
      // Nav buttons
      const prev = document.getElementById('_rem_prev');
      const next = document.getElementById('_rem_next');
      if (prev) prev.style.opacity = popupIdx === 0 ? '.3' : '1';
      if (next) next.style.opacity = popupIdx === due.length-1 ? '.3' : '1';
    }

    window._remNav = function(dir) {
      const nx = popupIdx + dir;
      if (nx < 0 || nx >= due.length) return;
      popupIdx = nx;
      _remRender();
    };
    window._remClose = function() {
      const ov = document.getElementById('_rem_popup_overlay');
      if (ov) ov.remove();
    };
    window._remDoneCurrent = function() {
      const r = due[popupIdx];
      DB.update('reminders', r.id, {status:'done'});
      due.splice(popupIdx, 1);
      _updateReminderNavBadge();
      toast('✅ Marked as done!', 'success');
      if (!due.length) { _remClose(); return; }
      popupIdx = Math.min(popupIdx, due.length - 1);
      _remRender();
    };
    window._remGotoSection = function() {
      _remClose();
      activateNav('reminders');
    };

    _remRender();
  }, 800); // small delay so page renders first
})();

// ══════════════════════════════════════════════════════
//  PAYMENT SETTINGS — Admin side
// ══════════════════════════════════════════════════════

function savePaymentSettings() {
  const s   = getSettings();
  const pc  = s.paymentConfig || {};
  const enabled  = document.getElementById('pay-enabled')?.checked || false;
  const upiId    = document.getElementById('pay-upi')?.value.trim()    || '';
  const upiName  = document.getElementById('pay-upiname')?.value.trim() || '';
  const accName  = document.getElementById('pay-accname')?.value.trim() || '';
  const accNo    = document.getElementById('pay-accno')?.value.trim()   || '';
  const ifsc     = document.getElementById('pay-ifsc')?.value.trim()    || '';
  const bankName = document.getElementById('pay-bank')?.value.trim()    || '';
  const note     = document.getElementById('pay-note')?.value.trim()    || '';

  if (enabled && !upiId && !accNo) {
    toast('⚠️ Please enter UPI ID or Bank Account Number before enabling online payment', 'warning');
    return;
  }

  const newPc = { ...pc, enabled, upiId, upiName, accName, accNo, ifsc, bankName, note };
  updateSettings({ paymentConfig: newPc });

  if (enabled && (upiId || accNo)) {
    toast('✅ Online payment ENABLED! Students can now pay fees online.', 'success', 3000);
  } else if (!enabled) {
    toast('Payment settings saved. Online payment is OFF.', 'info');
  } else {
    toast('✅ Payment settings saved!', 'success');
  }
  renderSettings();
}

function togglePaymentPreview() {
  const cb = document.getElementById('pay-enabled');
  if (!cb) return;
  const on = cb.checked;

  // Update the track background
  const track = document.getElementById('pay-toggle-track');
  if (track) track.style.background = on ? '#10b981' : 'rgba(255,255,255,.15)';

  // Move the ball
  const ball = document.getElementById('pay-toggle-ball');
  if (ball) ball.style.left = on ? '23px' : '3px';

  // Update status badge text + color
  const badge = document.getElementById('pay-status-badge');
  if (badge) {
    badge.textContent = on ? '🟢 Active' : '⚫ Inactive';
    badge.style.color       = on ? '#10b981' : '#64748b';
    badge.style.background  = on ? 'rgba(16,185,129,.15)' : 'rgba(100,116,139,.1)';
    badge.style.borderColor = on ? 'rgba(16,185,129,.3)'  : 'rgba(100,116,139,.2)';
  }
}

// Handle QR code upload
window.handlePayQRUpload = function(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX = 300;
      let w = img.width, h = img.height;
      if (w > MAX || h > MAX) { const r = MAX / Math.max(w,h); w=Math.round(w*r); h=Math.round(h*r); }
      canvas.width=w; canvas.height=h;
      canvas.getContext('2d').drawImage(img,0,0,w,h);
      const qrData = canvas.toDataURL('image/png');
      const s = getSettings();
      const pc = s.paymentConfig || {};
      updateSettings({ paymentConfig: { ...pc, qrCode: qrData } });
      toast('QR Code uploaded!', 'success');
      renderSettings();
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
};

function clearPayQR() {
  const s = getSettings();
  const pc = s.paymentConfig || {};
  updateSettings({ paymentConfig: { ...pc, qrCode: '' } });
  toast('QR Code removed', 'info');
  renderSettings();
}

// Preview what parents will see
function previewPaymentModal() {
  const s  = getSettings();
  const pc = s.paymentConfig || {};
  if (!pc.upiId && !pc.accNo) { toast('Please add UPI ID or Bank details first', 'warning'); return; }
  _showPaymentModal({ amount: 0, feeType: 'Sample Preview', id: '__preview__' });
}

// Approve payment proof — mark fee as paid + create transaction
function approvePaymentProof(proofId) {
  const proofs = DB.get('fee_payment_proofs');
  const proof  = proofs.find(p => p.id === proofId);
  if (!proof) return;

  const fee = DB.get('fees').find(f => f.id === proof.feeId);
  const s   = getSettings();
  const cur = s.currency || '₹';

  if (fee) {
    // Mark fee as paid
    DB.update('fees', fee.id, { status: 'paid', paidDate: today() });

    // Create transaction record
    const n = (DB.get('fee_transactions').length || 0) + 1;
    DB.push('fee_transactions', {
      id: genId('ft'), studentId: proof.studentId,
      amount: fee.amount, method: 'UPI/Online',
      date: today(), total: fee.amount,
      receiptNo: `RCP-${String(n).padStart(4,'0')}`,
      note: `Online Payment${proof.txnId ? ' · TXN: '+proof.txnId : ''}`,
      lateFee: 0
    });
    // Update student feePaid total
    const stu = DB.find('students', proof.studentId);
    if (stu) DB.update('students', proof.studentId, { feePaid: (Number(stu.feePaid||0) + Number(fee.amount||0)) });
  }

  // Mark proof as approved
  DB.set('fee_payment_proofs', proofs.map(p => p.id === proofId ? {...p, status:'approved'} : p));
  const stuName = DB.find('students', proof.studentId)?.name || 'Student';
  const feeAmt  = fee ? Number(fee.amount||0) : 0;
  const cur2    = getSettings().currency||'₹';
  toast(`✅ ${stuName} — payment of ${cur2}${feeAmt.toLocaleString()} approved!`, 'success');
  // Refresh whichever section is currently visible
  try { renderFees(); } catch(e){}
  try { const sec = document.getElementById('section-settings'); if(sec && sec.style.display!=='none') renderSettings(); } catch(e){}
}

// Reject payment proof
function rejectPaymentProof(proofId) {
  if (!confirmAction('Reject this payment proof?')) return;
  const proofs = DB.get('fee_payment_proofs');
  DB.set('fee_payment_proofs', proofs.map(p => p.id === proofId ? {...p, status:'rejected'} : p));
  toast('Payment proof rejected.', 'warning');
  try { renderFees(); } catch(e){}
  try { const sec = document.getElementById('section-settings'); if(sec && sec.style.display!=='none') renderSettings(); } catch(e){}
}

// Also show proofs badge in fees section header
function _pendingProofsCount() {
  return DB.get('fee_payment_proofs').filter(p => p.status === 'pending').length;
}

// ══════════════════════════════════════════════════════
//  CERTIFICATES — All 5 types
// ══════════════════════════════════════════════════════

function renderCertificates() {
  const students = DB.get('students');
  const classes  = DB.get('classes');
  const s        = getSettings();

  const CERT_TYPES = [
    { id:'character',    icon:'⭐', label:'Character Certificate',   color:'#7c3aed', bg:'rgba(124,58,237,.1)',  border:'rgba(124,58,237,.3)',  desc:'For good character & conduct' },
    { id:'transfer',     icon:'📋', label:'Transfer Certificate',    color:'#06b6d4', bg:'rgba(6,182,212,.1)',   border:'rgba(6,182,212,.3)',   desc:'Issued when student leaves school (TC)' },
    { id:'dob',          icon:'🎂', label:'DOB Certificate',         color:'#f59e0b', bg:'rgba(245,158,11,.1)',  border:'rgba(245,158,11,.3)',  desc:'Date of Birth proof certificate' },
    { id:'bonafide',     icon:'🏫', label:'Bonafide Certificate',    color:'#10b981', bg:'rgba(16,185,129,.1)', border:'rgba(16,185,129,.3)', desc:'For Bank / Passport / Scholarship' },
    { id:'appreciation', icon:'🏆', label:'Appreciation Certificate',color:'#f97316', bg:'rgba(249,115,22,.1)', border:'rgba(249,115,22,.3)', desc:'For Achievement & Performance' },
  ];

  const stuOptions = `<option value="">-- Select Student --</option>` +
    students.map(st => {
      const cls = classes.find(c=>c.id===st.classId);
      return `<option value="${st.id}">${st.name}${cls?' — '+cls.name:''}</option>`;
    }).join('');

  document.getElementById('section-certificates').innerHTML = `
  <div class="page-header">
    <div><h2>🎓 Certificates</h2><p class="page-sub">Generate & print school certificates for students</p></div>
  </div>

  <!-- Certificate type cards -->
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px;margin-bottom:32px;">
    ${CERT_TYPES.map(ct=>`
    <div style="background:${ct.bg};border:1.5px solid ${ct.border};border-radius:16px;padding:20px 22px;cursor:pointer;transition:transform .15s,box-shadow .15s;"
         onmouseover="this.style.transform='translateY(-3px)';this.style.boxShadow='0 8px 32px rgba(0,0,0,.3)'"
         onmouseout="this.style.transform='';this.style.boxShadow=''"
         onclick="openCertModal('${ct.id}')">
      <div style="font-size:2.2rem;margin-bottom:10px;">${ct.icon}</div>
      <div style="font-weight:800;font-size:.95rem;color:#fff;margin-bottom:4px;">${ct.label}</div>
      <div style="font-size:.75rem;color:rgba(255,255,255,.45);margin-bottom:14px;">${ct.desc}</div>
      <button style="background:${ct.color};color:#fff;border:none;border-radius:9px;padding:7px 18px;font-size:.78rem;font-weight:700;cursor:pointer;">
        ✏️ Generate
      </button>
    </div>`).join('')}
  </div>

  <!-- ── Achievement / Award certificate designs (10, fully editable) ── -->
  <div style="margin-top:8px;margin-bottom:14px;">
    <h3 style="margin:0 0 4px;">🎨 Achievement & Award Certificates</h3>
    <p style="font-size:.8rem;color:var(--text-3);margin:0;">10 modern designs — pick one, edit every line (title, name, text, signatures), then print or save as PDF.</p>
  </div>
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:14px;">
    ${CERT_DESIGNS.map(t=>`
      <div onclick="openCertDesigner('${t.id}')" style="cursor:pointer;border-radius:14px;overflow:hidden;border:1px solid var(--border);background:var(--glass);transition:transform .15s,box-shadow .15s;"
           onmouseover="this.style.transform='translateY(-3px)';this.style.boxShadow='0 8px 26px rgba(0,0,0,.3)'"
           onmouseout="this.style.transform='';this.style.boxShadow=''">
        <div style="height:90px;position:relative;background:${t.deco==='luxury'?'#0e0e0e':'#fff'};display:flex;align-items:center;justify-content:center;">
          <div style="position:absolute;inset:8px;border:2px solid ${t.accent};"></div>
          <div style="position:absolute;top:8px;left:8px;width:34px;height:34px;background:linear-gradient(135deg,${t.accent2},${t.accent});clip-path:polygon(0 0,100% 0,0 100%);"></div>
          <div style="position:absolute;bottom:8px;right:8px;width:34px;height:34px;background:linear-gradient(315deg,${t.accent2},${t.accent});clip-path:polygon(100% 0,100% 100%,0 100%);"></div>
          <div style="font-size:1.5rem;">🏅</div>
        </div>
        <div style="padding:8px 10px;">
          <div style="font-weight:700;font-size:.82rem;color:var(--text-1);">${t.name}</div>
          <div style="font-size:.68rem;color:${t.accent};font-weight:700;">✏️ Editable · Print / PDF</div>
        </div>
      </div>`).join('')}
  </div>

  <!-- Hidden student options for modals -->
  <select id="_cert_stu_opts_hidden" style="display:none;">${stuOptions}</select>
  <div id="modals-cert-root"></div>`;
}

// ══════════════════════════════════════════════════════
//  CERTIFICATE DESIGNER (10 editable templates)
// ══════════════════════════════════════════════════════
let _certDesign='c1', _certData=null;

function openCertDesigner(id){
  _certDesign=id;
  _certData=certDesignDefaults();
  const students=DB.get('students'), classes=DB.get('classes');
  const stuOpts=`<option value="">— Auto-fill from student (optional) —</option>`+
    students.map(st=>{const c=classes.find(x=>x.id===st.classId);return `<option value="${st.id}">${esc(st.name)}${c?' — '+esc(c.name):''}</option>`;}).join('');

  const fld=(label,id,val,ph)=>`<div class="form-group" style="margin-bottom:10px;"><label class="form-label" style="font-size:.78rem;">${label}</label>
    <input class="form-control" id="cd-${id}" value="${esc(val||'')}" placeholder="${ph||''}" oninput="certPreviewUpdate()"></div>`;

  const root=document.getElementById('modals-root');
  root.innerHTML=`
  <div class="modal-overlay open" id="certDesignerModal" style="display:flex;align-items:flex-start;justify-content:center;overflow-y:auto;padding:18px 10px;z-index:1000;">
    <div style="background:var(--bg-1,#12121a);border-radius:16px;max-width:1080px;width:100%;margin:auto;overflow:hidden;border:1px solid var(--border,rgba(255,255,255,.1));">
      <div style="background:linear-gradient(135deg,#7c3aed,#3b82f6);padding:12px 18px;display:flex;align-items:center;justify-content:space-between;">
        <div style="color:#fff;font-weight:800;">🎨 Certificate Designer</div>
        <button onclick="document.getElementById('certDesignerModal').remove();document.body.style.overflow=''" style="background:rgba(255,255,255,.2);border:none;width:30px;height:30px;border-radius:50%;cursor:pointer;color:#fff;">✕</button>
      </div>
      <div style="display:grid;grid-template-columns:340px 1fr;gap:0;max-height:82vh;">
        <!-- Form -->
        <div style="padding:16px;overflow-y:auto;border-right:1px solid var(--border,rgba(255,255,255,.08));">
          <div class="form-group" style="margin-bottom:10px;"><label class="form-label" style="font-size:.78rem;">Auto-fill recipient</label>
            <select class="form-control" id="cd-student" onchange="certAutoFill()">${stuOpts}</select></div>
          ${fld('Top Title','topLabel',_certData.topLabel)}
          ${fld('Subtitle line','subtitle',_certData.subtitle)}
          ${fld('Recipient Name','recipient',_certData.recipient)}
          <div class="form-group" style="margin-bottom:10px;"><label class="form-label" style="font-size:.78rem;">Body text</label>
            <textarea class="form-control" id="cd-body" rows="3" oninput="certPreviewUpdate()">${esc(_certData.body)}</textarea></div>
          ${fld('Footer note','footer',_certData.footer)}
          ${fld('Date','date',_certData.date)}
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
            ${fld('Signatory 1 Name','sign1Name',_certData.sign1Name)}
            ${fld('Title','sign1Title',_certData.sign1Title)}
            ${fld('Signatory 2 Name','sign2Name',_certData.sign2Name)}
            ${fld('Title','sign2Title',_certData.sign2Title)}
          </div>
          <div style="border-top:1px solid var(--border,rgba(255,255,255,.08));margin:6px 0 10px;padding-top:10px;">
            <div style="font-size:.74rem;color:var(--text-3);margin-bottom:4px;">School details (editable)</div>
            ${fld('School Name','schoolName',_certData.schoolName)}
            ${fld('Address','address',_certData.address)}
            ${fld('Session','session',_certData.session)}
          </div>
        </div>
        <!-- Preview + design switcher -->
        <div style="padding:16px;overflow-y:auto;background:var(--bg-2,#0c0c14);">
          <div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:10px;">
            ${CERT_DESIGNS.map(t=>`<button id="cdsw-${t.id}" onclick="certSwitchDesign('${t.id}')"
              style="flex:0 0 auto;cursor:pointer;border:2px solid ${t.id===_certDesign?t.accent:'transparent'};border-radius:8px;padding:5px 10px;background:${t.deco==='luxury'?'#0e0e0e':'#fff'};color:${t.accent};font-size:.7rem;font-weight:700;white-space:nowrap;">${t.name}</button>`).join('')}
          </div>
          <div style="background:#eef2f7;border-radius:10px;padding:14px;overflow:auto;">
            <div id="certPreviewScale" style="transform-origin:top left;">
              <div id="certPreview"></div>
            </div>
          </div>
          <div style="display:flex;gap:10px;margin-top:12px;">
            <button class="btn btn-primary" style="flex:1;" onclick="certPrintCurrent()">🖨️ Print / Save PDF</button>
          </div>
        </div>
      </div>
    </div>
  </div>`;
  document.body.style.overflow='hidden';
  certPreviewUpdate();
}

function _certReadForm(){
  if(!_certData) _certData=certDesignDefaults();
  ['topLabel','subtitle','recipient','body','footer','date','sign1Name','sign1Title','sign2Name','sign2Title','schoolName','address','session'].forEach(k=>{
    const el=document.getElementById('cd-'+k); if(el) _certData[k]=el.value;
  });
}
function certPreviewUpdate(){
  _certReadForm();
  const prev=document.getElementById('certPreview'); if(!prev) return;
  prev.innerHTML=certRenderDesign(_certDesign,_certData);
  // scale preview to fit panel width
  const scaleWrap=document.getElementById('certPreviewScale');
  const panel=prev.parentElement.parentElement; // padded box
  if(scaleWrap && panel){
    const avail=panel.clientWidth-28;
    const s=Math.min(1, avail/1000);
    scaleWrap.style.transform='scale('+s+')';
    scaleWrap.style.height=(707*s+4)+'px';
  }
}
function certSwitchDesign(id){
  _certDesign=id;
  CERT_DESIGNS.forEach(t=>{const b=document.getElementById('cdsw-'+t.id); if(b) b.style.border='2px solid '+(t.id===id?t.accent:'transparent');});
  certPreviewUpdate();
}
function certAutoFill(){
  const id=document.getElementById('cd-student')?.value;
  const st=id?DB.find('students',id):null;
  if(!st) return;
  const cls=DB.find('classes',st.classId);
  const recEl=document.getElementById('cd-recipient'); if(recEl) recEl.value=st.name;
  const bodyEl=document.getElementById('cd-body');
  if(bodyEl && cls) bodyEl.value=`of Class ${cls.name} for outstanding performance and achievement during the academic session.`;
  certPreviewUpdate();
}
function certPrintCurrent(){
  _certReadForm();
  certPrintDesign(certRenderDesign(_certDesign,_certData), 'Certificate — '+(_certData.recipient||''));
}

// ── Open certificate modal ────────────────────────────
function openCertModal(type) {
  const s        = getSettings();
  const students = DB.get('students');
  const classes  = DB.get('classes');

  const stuOptions = `<option value="">-- Select Student --</option>` +
    students.map(st => {
      const cls = classes.find(c=>c.id===st.classId);
      return `<option value="${st.id}">${st.name}${cls?' — '+cls.name:''}</option>`;
    }).join('');

  const certConfigs = {
    character: {
      icon:'⭐', label:'Character Certificate', color:'#7c3aed',
      fields: `
        <div class="form-group"><label class="form-label">Select Student *</label>
          <select class="form-control" id="cert-student" onchange="_certFillStudent()">${stuOptions}</select></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div class="form-group"><label class="form-label">From Date</label>
            <input class="form-control" type="date" id="cert-from"></div>
          <div class="form-group"><label class="form-label">To Date</label>
            <input class="form-control" type="date" id="cert-to" value="${today()}"></div>
        </div>
        <div class="form-group"><label class="form-label">Purpose / Reason</label>
          <input class="form-control" id="cert-purpose" placeholder="e.g. For Employment, For Higher Studies"></div>
        <div class="form-group"><label class="form-label">Certificate Date</label>
          <input class="form-control" type="date" id="cert-date" value="${today()}"></div>
        <div class="form-group"><label class="form-label">Principal Name</label>
          <input class="form-control" id="cert-principal" placeholder="Principal / Head Teacher name" value="${s.principalName||''}"></div>`
    },
    transfer: {
      icon:'📋', label:'Transfer Certificate', color:'#06b6d4',
      fields: `
        <div class="form-group"><label class="form-label">Select Student *</label>
          <select class="form-control" id="cert-student" onchange="_certFillStudent()">${stuOptions}</select></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div class="form-group"><label class="form-label">TC Date</label>
            <input class="form-control" type="date" id="cert-date" value="${today()}"></div>
          <div class="form-group"><label class="form-label">TC Number</label>
            <input class="form-control" id="cert-tcno" placeholder="e.g. TC/2025-26/001"></div>
        </div>
        <div class="form-group"><label class="form-label">Last Class Studied</label>
          <input class="form-control" id="cert-lastclass" placeholder="e.g. Class 8 (2025-26)"></div>
        <div class="form-group"><label class="form-label">Reason for Leaving</label>
          <input class="form-control" id="cert-reason" placeholder="e.g. Family Relocation, Admission in other school"></div>
        <div class="form-group"><label class="form-label">Fee Status</label>
          <select class="form-control" id="cert-feestatus">
            <option value="clear">Fees Cleared</option>
            <option value="due">Fees Due</option>
          </select></div>
        <div class="form-group"><label class="form-label">Principal Name</label>
          <input class="form-control" id="cert-principal" placeholder="Principal name" value="${s.principalName||''}"></div>`
    },
    dob: {
      icon:'🎂', label:'DOB Certificate', color:'#f59e0b',
      fields: `
        <div class="form-group"><label class="form-label">Select Student *</label>
          <select class="form-control" id="cert-student" onchange="_certFillStudent()">${stuOptions}</select></div>
        <div class="form-group"><label class="form-label">Date of Birth <span style="color:#94a3b8;font-size:11px;">(auto-filled from student record)</span></label>
          <input class="form-control" type="date" id="cert-dob"></div>
        <div class="form-group"><label class="form-label">DOB in Words</label>
          <input class="form-control" id="cert-dobwords" placeholder="e.g. Fifteenth March Two Thousand Twelve"></div>
        <div class="form-group"><label class="form-label">Purpose</label>
          <input class="form-control" id="cert-purpose" placeholder="e.g. For Passport, For Bank Account"></div>
        <div class="form-group"><label class="form-label">Certificate Date</label>
          <input class="form-control" type="date" id="cert-date" value="${today()}"></div>
        <div class="form-group"><label class="form-label">Principal Name</label>
          <input class="form-control" id="cert-principal" placeholder="Principal name" value="${s.principalName||''}"></div>`
    },
    bonafide: {
      icon:'🏫', label:'Bonafide Certificate', color:'#10b981',
      fields: `
        <div class="form-group"><label class="form-label">Select Student *</label>
          <select class="form-control" id="cert-student" onchange="_certFillStudent()">${stuOptions}</select></div>
        <div class="form-group"><label class="form-label">Purpose *</label>
          <select class="form-control" id="cert-purpose">
            <option value="Bank Account Opening">Bank Account Opening</option>
            <option value="Passport Application">Passport Application</option>
            <option value="Scholarship Application">Scholarship Application</option>
            <option value="Education Loan">Education Loan</option>
            <option value="Bus Pass">Bus Pass</option>
            <option value="Railway Concession">Railway Concession</option>
            <option value="Other Government Purpose">Other Government Purpose</option>
          </select></div>
        <div class="form-group"><label class="form-label">Custom Purpose (override above if needed)</label>
          <input class="form-control" id="cert-purpose-custom" placeholder="Leave blank to use above selection"></div>
        <div class="form-group"><label class="form-label">Certificate Date</label>
          <input class="form-control" type="date" id="cert-date" value="${today()}"></div>
        <div class="form-group"><label class="form-label">Principal Name</label>
          <input class="form-control" id="cert-principal" placeholder="Principal name" value="${s.principalName||''}"></div>`
    },
    appreciation: {
      icon:'🏆', label:'Appreciation Certificate', color:'#f97316',
      fields: `
        <div class="form-group"><label class="form-label">Recipient Type</label>
          <select class="form-control" id="cert-recip-type" onchange="_certRecipChange()">
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="custom">Custom (any name)</option>
          </select></div>
        <div id="cert-student-row" class="form-group"><label class="form-label">Select Student</label>
          <select class="form-control" id="cert-student" onchange="_certFillStudent()">${stuOptions}</select></div>
        <div id="cert-teacher-row" class="form-group" style="display:none;"><label class="form-label">Select Teacher</label>
          <select class="form-control" id="cert-teacher">
            <option value="">-- Select Teacher --</option>
            ${DB.get('teachers').map(t=>`<option value="${t.id}">${t.name} — ${t.subject||''}</option>`).join('')}
          </select></div>
        <div id="cert-custom-row" class="form-group" style="display:none;"><label class="form-label">Recipient Name</label>
          <input class="form-control" id="cert-custom-name" placeholder="Enter full name"></div>
        <div class="form-group"><label class="form-label">Achievement / Title *</label>
          <input class="form-control" id="cert-achievement" placeholder="e.g. Best Student Award, Science Olympiad Winner, 100% Attendance"></div>
        <div class="form-group"><label class="form-label">Event / Occasion</label>
          <input class="form-control" id="cert-event" placeholder="e.g. Annual Day 2025-26, Farewell Ceremony"></div>
        <div class="form-group"><label class="form-label">Description (optional)</label>
          <textarea class="form-control" id="cert-desc" rows="2" placeholder="Additional appreciation text…"></textarea></div>
        <div class="form-group"><label class="form-label">Certificate Date</label>
          <input class="form-control" type="date" id="cert-date" value="${today()}"></div>
        <div class="form-group"><label class="form-label">Principal / Issuing Authority</label>
          <input class="form-control" id="cert-principal" placeholder="Principal name" value="${s.principalName||''}"></div>`
    },
  };

  const cfg = certConfigs[type];
  if (!cfg) return;

  buildModal('modal-cert-' + type, `${cfg.icon} ${cfg.label}`, `
    <div style="padding:12px 14px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px;margin-bottom:18px;font-size:.8rem;color:rgba(255,255,255,.5);">
      Fill the details below and click <strong style="color:#a78bfa;">Generate Certificate</strong> to preview & print.
    </div>
    ${cfg.fields}`,
    () => generateCertificate(type), 'md');

  // Set default from date for character cert
  if (type === 'character') {
    const fromEl = document.getElementById('cert-from');
    if (fromEl) fromEl.value = (getSettings().academicYear||'').split('-')[0]+'-04-01' || '';
  }
}

// Auto-fill student fields when student is selected
window._certFillStudent = function() {
  const id  = document.getElementById('cert-student')?.value;
  const stu = id ? DB.find('students', id) : null;
  if (!stu) return;
  const cls = DB.find('classes', stu.classId);

  const dobEl       = document.getElementById('cert-dob');
  const lastclsEl   = document.getElementById('cert-lastclass');
  if (dobEl && stu.dob)       dobEl.value      = stu.dob;
  if (lastclsEl && cls)       lastclsEl.value   = cls.name + ' (' + (getSettings().academicYear||today().slice(0,4)) + ')';
};

// Appreciation — toggle recipient type rows
window._certRecipChange = function() {
  const type = document.getElementById('cert-recip-type')?.value;
  document.getElementById('cert-student-row').style.display = type==='student' ? 'block' : 'none';
  document.getElementById('cert-teacher-row').style.display = type==='teacher' ? 'block' : 'none';
  document.getElementById('cert-custom-row').style.display  = type==='custom'  ? 'block' : 'none';
};

// ── Generate & Print the selected certificate ─────────
function generateCertificate(type) {
  const s = getSettings();
  const school = s.schoolName  || 'School Name';
  const addr   = s.schoolAddress || '';
  const phone  = s.schoolPhone   || '';
  const logo   = s.schoolLogo    || '';
  const ay     = s.academicYear  || '';
  const cur    = s.currency || '₹';

  const certDate  = document.getElementById('cert-date')?.value   || today();
  const principal = document.getElementById('cert-principal')?.value.trim() || 'Principal';

  // Helper — get student object
  const getStu = () => {
    const id = document.getElementById('cert-student')?.value;
    return id ? DB.find('students', id) : null;
  };
  const getCls = (stu) => stu?.classId ? DB.find('classes', stu.classId) : null;

  // School header HTML (common)
  const schoolHeader = (accentColor='#7c3aed') => `
    <div style="text-align:center;padding:28px 30px 18px;border-bottom:3px double ${accentColor};">
      ${logo ? `<img src="${logo}" style="height:60px;object-fit:contain;margin-bottom:10px;display:block;margin-left:auto;margin-right:auto;">` : ''}
      <div style="font-size:22px;font-weight:900;color:#1e293b;letter-spacing:.5px;">${school}</div>
      ${addr ? `<div style="font-size:12px;color:#64748b;margin-top:3px;">${addr}</div>` : ''}
      ${phone ? `<div style="font-size:11px;color:#94a3b8;">📞 ${phone}</div>` : ''}
    </div>`;

  const certTitle = (title, color='#7c3aed') => `
    <div style="text-align:center;padding:20px 30px 10px;">
      <div style="display:inline-block;border-bottom:2.5px solid ${color};border-top:2.5px solid ${color};padding:6px 28px;">
        <span style="font-size:17px;font-weight:800;color:${color};letter-spacing:2px;text-transform:uppercase;">${title}</span>
      </div>
    </div>`;

  const certFooter = (color='#7c3aed') => `
    <div style="margin-top:40px;padding:0 30px 30px;display:flex;justify-content:space-between;align-items:flex-end;">
      <div style="text-align:center;">
        <div style="border-top:1.5px solid #334155;width:140px;padding-top:6px;font-size:11px;color:#64748b;">Date: ${formatDate(certDate)}</div>
      </div>
      <div style="text-align:center;">
        <div style="border-top:1.5px solid #334155;width:160px;padding-top:6px;font-size:11px;color:#64748b;">${principal}<br><span style="font-size:10px;">Principal / Head Teacher</span></div>
      </div>
    </div>`;

  const border = (color='#7c3aed') => `border:3px solid ${color};border-radius:12px;padding:0;overflow:hidden;max-width:700px;margin:0 auto;background:#fff;font-family:'Segoe UI',Arial,sans-serif;color:#1e293b;`;

  let html = '';

  // ── 1. CHARACTER CERTIFICATE ──────────────────────────
  if (type === 'character') {
    const stu  = getStu();
    if (!stu) { toast('Please select a student', 'warning'); return; }
    const cls  = getCls(stu);
    const from = document.getElementById('cert-from')?.value || '';
    const to   = document.getElementById('cert-to')?.value   || today();
    const purp = document.getElementById('cert-purpose')?.value.trim() || '';

    html = `<div style="${border('#7c3aed')}">
      ${schoolHeader('#7c3aed')}
      ${certTitle('Character Certificate', '#7c3aed')}
      <div style="padding:14px 36px 10px;text-align:center;font-size:13px;color:#475569;line-height:1.9;">
        <p>This is to certify that <strong style="color:#1e293b;font-size:15px;">${stu.name}</strong>
        ${stu.rollNo?`(Roll No. <strong>${stu.rollNo}</strong>)`:''}
        ${cls?`, Class <strong>${cls.name}</strong>`:''}, has been a bonafide student of <strong>${school}</strong>
        ${from&&to ? `from <strong>${formatDate(from)}</strong> to <strong>${formatDate(to)}</strong>.` : `during the academic session <strong>${ay || 'current year'}</strong>.`}
        </p>
        <p style="margin-top:12px;">During this period, the student has been found to be of <strong>good character and conduct</strong>.
        He/She has maintained a disciplined behaviour and has actively participated in curricular and co-curricular activities.</p>
        ${purp?`<p style="margin-top:12px;">This certificate is issued for the purpose of <strong>${purp}</strong>.</p>`:''}
        <p style="margin-top:12px;">We wish him/her all the best in future endeavours.</p>
      </div>
      ${certFooter('#7c3aed')}
    </div>`;
  }

  // ── 2. TRANSFER CERTIFICATE ───────────────────────────
  else if (type === 'transfer') {
    const stu      = getStu();
    if (!stu) { toast('Please select a student', 'warning'); return; }
    const cls      = getCls(stu);
    const tcNo     = document.getElementById('cert-tcno')?.value.trim()     || 'TC/' + today().replaceAll('-','') + '/001';
    const lastcls  = document.getElementById('cert-lastclass')?.value.trim() || cls?.name || '';
    const reason   = document.getElementById('cert-reason')?.value.trim()   || 'As per parent request';
    const feeSt    = document.getElementById('cert-feestatus')?.value       || 'clear';
    const dob      = stu.dob ? formatDate(stu.dob) : 'As per records';

    const rows = [
      ['Sr. No.', '1'],
      ['Name of Student', stu.name],
      ['Father\'s Name', stu.fatherName || '—'],
      ['Mother\'s Name', stu.motherName || '—'],
      ['Date of Birth', dob],
      ['Admission No. / ID', stu.id.slice(-8).toUpperCase()],
      ['Last Class Studied', lastcls],
      ['Academic Year', ay || today().slice(0,4)],
      ['Roll No.', stu.rollNo || '—'],
      ['Reason for Leaving', reason],
      ['Fee Status', feeSt === 'clear' ? '✓ All fees cleared' : '⚠ Fees due'],
      ['Character & Conduct', 'Good'],
    ];

    html = `<div style="${border('#06b6d4')}">
      ${schoolHeader('#06b6d4')}
      ${certTitle('Transfer Certificate', '#06b6d4')}
      <div style="padding:8px 30px;display:flex;justify-content:space-between;font-size:12px;color:#64748b;">
        <span>TC No: <strong style="color:#1e293b;">${tcNo}</strong></span>
        <span>Date: <strong style="color:#1e293b;">${formatDate(certDate)}</strong></span>
      </div>
      <div style="padding:6px 30px 16px;">
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          ${rows.map((r,i)=>`<tr style="background:${i%2===0?'#f8fafc':'#fff'};">
            <td style="padding:8px 12px;color:#475569;font-weight:600;width:46%;border:1px solid #e2e8f0;">${r[0]}</td>
            <td style="padding:8px 12px;color:#1e293b;font-weight:700;border:1px solid #e2e8f0;">${r[1]}</td>
          </tr>`).join('')}
        </table>
        <p style="margin-top:14px;font-size:12px;color:#64748b;text-align:center;">
          This certificate is issued on the request of the parent/guardian.
        </p>
      </div>
      ${certFooter('#06b6d4')}
    </div>`;
  }

  // ── 3. DOB CERTIFICATE ────────────────────────────────
  else if (type === 'dob') {
    const stu  = getStu();
    if (!stu) { toast('Please select a student', 'warning'); return; }
    const cls  = getCls(stu);
    const dob  = document.getElementById('cert-dob')?.value     || stu.dob || '';
    const dobW = document.getElementById('cert-dobwords')?.value.trim() || '';
    const purp = document.getElementById('cert-purpose')?.value.trim() || '';

    html = `<div style="${border('#f59e0b')}">
      ${schoolHeader('#f59e0b')}
      ${certTitle('Date of Birth Certificate', '#f59e0b')}
      <div style="padding:16px 36px 10px;text-align:center;font-size:13px;color:#475569;line-height:1.9;">
        <p>This is to certify that <strong style="color:#1e293b;font-size:15px;">${stu.name}</strong>,
        ${stu.fatherName?`son/daughter of <strong>${stu.fatherName}</strong>,`:''} is a bonafide student of
        <strong>${school}</strong>${cls?`, currently enrolled in <strong>Class ${cls.name}</strong>`:''}.</p>

        <div style="margin:20px auto;max-width:420px;background:#fffbeb;border:2px solid #fcd34d;border-radius:10px;padding:16px 22px;">
          <div style="font-size:11px;color:#92400e;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px;">Date of Birth</div>
          <div style="font-size:22px;font-weight:900;color:#78350f;">${dob ? formatDate(dob) : '—'}</div>
          ${dobW?`<div style="font-size:12px;color:#92400e;margin-top:4px;font-style:italic;">(${dobW})</div>`:''}
        </div>

        <p>As per the school admission records, the date of birth of the above named student is
        <strong>${dob ? formatDate(dob) : 'as mentioned above'}</strong>.</p>
        ${purp?`<p style="margin-top:10px;">This certificate is issued for the purpose of <strong>${purp}</strong>.</p>`:''}
      </div>
      ${certFooter('#f59e0b')}
    </div>`;
  }

  // ── 4. BONAFIDE CERTIFICATE ───────────────────────────
  else if (type === 'bonafide') {
    const stu   = getStu();
    if (!stu) { toast('Please select a student', 'warning'); return; }
    const cls   = getCls(stu);
    const selPurp  = document.getElementById('cert-purpose')?.value || '';
    const custPurp = document.getElementById('cert-purpose-custom')?.value.trim() || '';
    const purpose  = custPurp || selPurp;

    html = `<div style="${border('#10b981')}">
      ${schoolHeader('#10b981')}
      ${certTitle('Bonafide Certificate', '#10b981')}
      <div style="padding:16px 36px 10px;text-align:center;font-size:13px;color:#475569;line-height:1.9;">
        <p>This is to certify that <strong style="color:#1e293b;font-size:15px;">${stu.name}</strong>
        ${stu.rollNo?`(Roll No. <strong>${stu.rollNo}</strong>)`:''}
        ${stu.fatherName?`, son/daughter of <strong>${stu.fatherName}</strong>,`:''}
        is a bonafide student of <strong>${school}</strong>${addr?`, ${addr}`:''}.</p>

        ${cls?`<p style="margin-top:10px;">He/She is currently studying in <strong>Class ${cls.name}</strong>
        during the academic year <strong>${ay || today().slice(0,4)}</strong>.</p>`:''}

        ${stu.dob?`<p style="margin-top:10px;">His/Her date of birth as per school records is <strong>${formatDate(stu.dob)}</strong>.</p>`:''}

        <p style="margin-top:10px;">His/Her character and conduct are <strong>satisfactory</strong>.</p>

        ${purpose?`<p style="margin-top:14px;padding:12px 20px;background:#ecfdf5;border:1.5px solid #6ee7b7;border-radius:8px;color:#065f46;">
          This certificate is issued for the purpose of <strong>${purpose}</strong>.
        </p>`:''}
      </div>
      ${certFooter('#10b981')}
    </div>`;
  }

  // ── 5. APPRECIATION CERTIFICATE ──────────────────────
  else if (type === 'appreciation') {
    const recipType   = document.getElementById('cert-recip-type')?.value || 'student';
    const achievement = document.getElementById('cert-achievement')?.value.trim() || 'Outstanding Achievement';
    const event       = document.getElementById('cert-event')?.value.trim() || '';
    const desc        = document.getElementById('cert-desc')?.value.trim() || '';

    let recipName = '', recipDetail = '';
    if (recipType === 'student') {
      const stu = getStu();
      if (!stu) { toast('Please select a student', 'warning'); return; }
      const cls = getCls(stu);
      recipName   = stu.name;
      recipDetail = cls ? `Class ${cls.name}` : '';
    } else if (recipType === 'teacher') {
      const tId = document.getElementById('cert-teacher')?.value;
      const tch = tId ? DB.find('teachers', tId) : null;
      if (!tch) { toast('Please select a teacher', 'warning'); return; }
      recipName   = tch.name;
      recipDetail = tch.subject ? tch.subject + ' Teacher' : 'Teacher';
    } else {
      recipName   = document.getElementById('cert-custom-name')?.value.trim() || '';
      if (!recipName) { toast('Please enter recipient name', 'warning'); return; }
    }

    html = `<div style="border:4px solid #f97316;border-radius:16px;padding:0;overflow:hidden;max-width:700px;margin:0 auto;background:#fff;font-family:'Segoe UI',Arial,sans-serif;">
      <!-- Gold top band -->
      <div style="background:linear-gradient(135deg,#f97316,#fbbf24);padding:6px 0;"></div>
      ${schoolHeader('#f97316')}
      <div style="text-align:center;padding:10px 30px 6px;">
        <div style="font-size:11px;font-weight:700;color:#f97316;text-transform:uppercase;letter-spacing:.15em;margin-bottom:6px;">Certificate of Appreciation</div>
        <div style="font-size:40px;">🏆</div>
      </div>
      <div style="text-align:center;padding:4px 30px;font-size:13px;color:#475569;">
        <p>This certificate is proudly presented to</p>
        <div style="margin:14px auto;padding:16px 28px;background:linear-gradient(135deg,#fff7ed,#ffedd5);border:2px solid #fdba74;border-radius:12px;display:inline-block;min-width:280px;">
          <div style="font-size:24px;font-weight:900;color:#c2410c;letter-spacing:.5px;">${recipName}</div>
          ${recipDetail?`<div style="font-size:12px;color:#ea580c;margin-top:3px;">${recipDetail}</div>`:''}
        </div>
        <p style="margin-top:14px;">in recognition of</p>
        <div style="font-size:17px;font-weight:800;color:#1e293b;margin:10px 0;padding:10px 20px;background:#fef3c7;border-radius:8px;display:inline-block;">
          ${achievement}
        </div>
        ${event?`<p style="margin-top:8px;font-size:12px;color:#64748b;">at <strong>${event}</strong></p>`:''}
        ${desc?`<p style="margin-top:10px;font-size:12px;color:#64748b;max-width:480px;margin-left:auto;margin-right:auto;line-height:1.7;">${desc}</p>`:''}
        <p style="margin-top:12px;font-size:12px;color:#64748b;">We wish you continued success and growth. Keep up the excellent work!</p>
      </div>
      ${certFooter('#f97316')}
      <!-- Gold bottom band -->
      <div style="background:linear-gradient(135deg,#fbbf24,#f97316);padding:6px 0;"></div>
    </div>`;
  }

  if (!html) return;

  closeAllModals();

  // Print
  const w = window.open('', '_blank', 'width=820,height=700');
  if (!w) { toast('Please allow popups to print certificates', 'warning'); return; }
  w.document.write(`<!DOCTYPE html><html><head>
    <title>${type.charAt(0).toUpperCase()+type.slice(1)} Certificate — ${school}</title>
    <style>
      *{box-sizing:border-box;margin:0;padding:0;}
      body{background:#f1f5f9;padding:32px;display:flex;flex-direction:column;align-items:center;gap:20px;}
      @media print{body{background:#fff;padding:0;}  .no-print{display:none!important;}}
      .no-print{display:flex;gap:12px;justify-content:center;margin-bottom:20px;flex-wrap:wrap;}
      button{padding:10px 22px;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;border:none;}
      .btn-print{background:#7c3aed;color:#fff;}
      .btn-close{background:#e2e8f0;color:#334155;}
    </style>
  </head><body>
    <div class="no-print">
      <button class="btn-print" onclick="window.print()">🖨️ Print Certificate</button>
      <button class="btn-close" onclick="window.close()">✕ Close</button>
    </div>
    ${html}
  </body></html>`);
  w.document.close();
}

// ── Start ─────────────────────────────────────────────

// ══════════════════════════════════════════════════════
//  ASSIGNMENTS — Admin Overview
// ══════════════════════════════════════════════════════
function renderAdminAssignments() {
  const assignments = (DB.get('assignments') || [])
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  const subs    = DB.get('assignment_submissions') || [];
  const classes = DB.get('classes') || [];
  const teachers = DB.get('teachers') || [];

  // Summary
  const totalAsn  = assignments.length;
  const totalSubs = subs.length;
  const graded    = subs.filter(s => s.status === 'graded').length;
  const pending   = subs.filter(s => s.status === 'submitted').length;

  // Group by class
  const byClass = {};
  assignments.forEach(a => {
    if (!byClass[a.classId]) byClass[a.classId] = [];
    byClass[a.classId].push(a);
  });

  const rows = assignments.map(a => {
    const cls  = classes.find(c => c.id === a.classId);
    const tch  = teachers.find(t => t.id === a.teacherId);
    const students = (DB.get('students') || []).filter(s => s.classId === a.classId).length;
    const submitted = subs.filter(s => s.assignmentId === a.id).length;
    const gradedN   = subs.filter(s => s.assignmentId === a.id && s.status === 'graded').length;
    const pct = students ? Math.round(submitted / students * 100) : 0;
    const overdue = a.dueDate && a.dueDate < today() && submitted < students;
    return `<tr style="border-top:1px solid rgba(255,255,255,.05);">
      <td style="padding:12px 14px;">
        <div style="font-weight:700;color:#fff;font-size:14px;">${a.title}</div>
        ${a.subject ? `<div style="font-size:11px;color:rgba(255,255,255,.35);margin-top:2px;">${a.subject}</div>` : ''}
      </td>
      <td style="padding:12px 14px;">
        <span style="background:rgba(6,182,212,.12);color:#67e8f9;border-radius:6px;padding:2px 9px;font-size:12px;">
          ${cls ? cls.name : '—'}
        </span>
      </td>
      <td style="padding:12px 14px;font-size:13px;color:rgba(255,255,255,.5);">${tch ? tch.name : a.teacherName || '—'}</td>
      <td style="padding:12px 14px;">
        <div style="font-size:12px;color:${overdue ? '#f87171' : 'rgba(255,255,255,.45)'};">
          ${a.dueDate ? a.dueDate : '—'}
          ${overdue ? '<span style="font-size:10px;margin-left:4px;">⚠️</span>' : ''}
        </div>
      </td>
      <td style="padding:12px 14px;">
        <div style="display:flex;align-items:center;gap:8px;">
          <div style="background:rgba(255,255,255,.07);border-radius:999px;height:5px;width:60px;overflow:hidden;">
            <div style="height:100%;width:${pct}%;background:${pct>=80?'#10b981':pct>=40?'#f59e0b':'#7c3aed'};border-radius:999px;"></div>
          </div>
          <span style="font-size:12px;color:rgba(255,255,255,.5);">${submitted}/${students}</span>
        </div>
        ${gradedN < submitted ? `<div style="font-size:10px;color:#f59e0b;margin-top:3px;">⏳ ${submitted-gradedN} to grade</div>` : ''}
      </td>
      <td style="padding:12px 14px;text-align:right;">
        <button onclick="_adminAsnDeleteConfirm('${a.id}')"
          style="background:rgba(239,68,68,.08);color:#ef4444;border:1px solid rgba(239,68,68,.2);
                 border-radius:6px;padding:3px 10px;font-size:11px;cursor:pointer;">🗑️</button>
      </td>
    </tr>`;
  }).join('');

  document.getElementById('section-assignments').innerHTML = `
  <div class="page-header">
    <div><h2>📋 Assignments Overview</h2>
      <div style="font-size:13px;color:rgba(255,255,255,.4);margin-top:2px;">All assignments given by teachers across all classes</div>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;margin-bottom:24px;">
    <div style="background:rgba(124,58,237,.1);border:1px solid rgba(124,58,237,.2);border-radius:12px;padding:16px;text-align:center;">
      <div style="font-size:26px;font-weight:800;color:#a78bfa;">${totalAsn}</div>
      <div style="font-size:12px;color:rgba(255,255,255,.4);margin-top:3px;">Total Assignments</div>
    </div>
    <div style="background:rgba(16,185,129,.1);border:1px solid rgba(16,185,129,.2);border-radius:12px;padding:16px;text-align:center;">
      <div style="font-size:26px;font-weight:800;color:#10b981;">${totalSubs}</div>
      <div style="font-size:12px;color:rgba(255,255,255,.4);margin-top:3px;">Submissions</div>
    </div>
    <div style="background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.2);border-radius:12px;padding:16px;text-align:center;">
      <div style="font-size:26px;font-weight:800;color:#f59e0b;">${pending}</div>
      <div style="font-size:12px;color:rgba(255,255,255,.4);margin-top:3px;">Pending Grade</div>
    </div>
    <div style="background:rgba(6,182,212,.1);border:1px solid rgba(6,182,212,.2);border-radius:12px;padding:16px;text-align:center;">
      <div style="font-size:26px;font-weight:800;color:#06b6d4;">${graded}</div>
      <div style="font-size:12px;color:rgba(255,255,255,.4);margin-top:3px;">Graded</div>
    </div>
  </div>

  ${assignments.length === 0
    ? `<div class="empty-state"><div class="e-icon">📋</div><h3>No assignments yet</h3>
       <p style="color:rgba(255,255,255,.4);">Teachers will create assignments from their panel.</p></div>`
    : `<div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:14px;overflow:hidden;">
         <div style="overflow-x:auto;">
           <table style="width:100%;border-collapse:collapse;min-width:640px;">
             <thead>
               <tr style="background:rgba(124,58,237,.1);">
                 <th style="padding:11px 14px;text-align:left;font-size:11px;font-weight:700;color:rgba(255,255,255,.4);text-transform:uppercase;">Assignment</th>
                 <th style="padding:11px 14px;text-align:left;font-size:11px;font-weight:700;color:rgba(255,255,255,.4);text-transform:uppercase;">Class</th>
                 <th style="padding:11px 14px;text-align:left;font-size:11px;font-weight:700;color:rgba(255,255,255,.4);text-transform:uppercase;">Teacher</th>
                 <th style="padding:11px 14px;text-align:left;font-size:11px;font-weight:700;color:rgba(255,255,255,.4);text-transform:uppercase;">Due Date</th>
                 <th style="padding:11px 14px;text-align:left;font-size:11px;font-weight:700;color:rgba(255,255,255,.4);text-transform:uppercase;">Submissions</th>
                 <th style="padding:11px 14px;text-align:right;font-size:11px;font-weight:700;color:rgba(255,255,255,.4);text-transform:uppercase;">Action</th>
               </tr>
             </thead>
             <tbody>${rows}</tbody>
           </table>
         </div>
       </div>`}`;
}

function _adminAsnDeleteConfirm(id) {
  if (!confirmAction('Delete this assignment and all its submissions?')) return;
  DB.set('assignments', (DB.get('assignments') || []).filter(a => a.id !== id));
  DB.set('assignment_submissions', (DB.get('assignment_submissions') || []).filter(s => s.assignmentId !== id));
  toast('Assignment deleted', 'info');
  renderAdminAssignments();
}

// ══════════════════════════════════════════════════════
//  WEBSITE BUILDER — School public website with templates,
//  drag-and-drop sections, custom URL & activate/deactivate
// ══════════════════════════════════════════════════════
let _wbTab = 'design';
let _wbDragIdx = null;

const WB_TEMPLATES = [
  { id:'t1',  name:'Royal Blue',    colors:['#1e3a8a','#3b82f6','#eff6ff'], font:'Poppins',  desc:'Classic & professional' },
  { id:'t2',  name:'Emerald Green', colors:['#065f46','#10b981','#ecfdf5'], font:'Nunito',   desc:'Fresh & natural' },
  { id:'t3',  name:'Sunset Orange', colors:['#9a3412','#f97316','#fff7ed'], font:'Poppins',  desc:'Warm & energetic' },
  { id:'t4',  name:'Royal Purple',  colors:['#5b21b6','#8b5cf6','#f5f3ff'], font:'Quicksand',desc:'Modern & creative' },
  { id:'t5',  name:'Crimson Red',   colors:['#991b1b','#ef4444','#fef2f2'], font:'Roboto',   desc:'Bold & confident' },
  { id:'t6',  name:'Ocean Teal',    colors:['#115e59','#14b8a6','#f0fdfa'], font:'Nunito',   desc:'Calm & trustworthy' },
  { id:'t7',  name:'Midnight Dark', colors:['#0f172a','#6366f1','#1e293b'], font:'Poppins',  desc:'Premium dark theme', dark:true },
  { id:'t8',  name:'Rose Pink',     colors:['#9f1239','#f43f5e','#fff1f2'], font:'Quicksand',desc:'Soft & welcoming' },
  { id:'t9',  name:'Golden Amber',  colors:['#92400e','#f59e0b','#fffbeb'], font:'Poppins',  desc:'Traditional & prestigious' },
  { id:'t10', name:'Slate Minimal', colors:['#334155','#64748b','#f8fafc'], font:'Roboto',   desc:'Clean & minimal' },
];

function _wbDefaultConfig() {
  const st = getSettings();
  return {
    slug: '', active: false, template: 't1',
    header: { schoolName: st.schoolName || 'My School', tagline: 'Excellence in Education', logo: st.schoolLogo || '', phone: st.schoolPhone || '' },
    footer: { address: st.address || '', phone: st.phone || '', email: st.email || '', facebook: '', instagram: '', youtube: '' },
    sections: [
      { id:'hero',     type:'hero',     visible:true, data:{ heading:'Welcome to '+(st.schoolName||'Our School'), sub:'Shaping bright futures with quality education', image:'', images:[], btnText:'Apply for Admission' } },
      { id:'about',    type:'about',    visible:true, data:{ title:'About Our School', text:'We are committed to providing the best education with experienced teachers, modern facilities and a caring environment.', image:'' } },
      { id:'services', type:'services', visible:true, data:{ title:'Our Services', items:[ {icon:'📚',title:'Quality Education',desc:'Experienced teachers and modern curriculum'}, {icon:'🚌',title:'Transport Facility',desc:'Safe GPS-tracked buses on all routes'}, {icon:'🏏',title:'Sports & Activities',desc:'Playground, sports coaching and annual events'} ] } },
      { id:'fees',     type:'fees',     visible:true, data:{ title:'Fee Structure', note:'Fees are per month. Contact office for details.', rows:[ {cls:'Nursery – KG', amount:'₹800'}, {cls:'Class 1 – 5', amount:'₹1,000'}, {cls:'Class 6 – 8', amount:'₹1,200'}, {cls:'Class 9 – 10', amount:'₹1,500'} ] } },
      { id:'gallery',  type:'gallery',  visible:true, data:{ title:'School Gallery', images:[] } },
      { id:'contact',  type:'contact',  visible:true, data:{ title:'Contact Us', text:'Visit us or call for admission enquiries.' } },
    ]
  };
}

function _wbConfig() {
  let c = DB.get('website_config');
  if (!c || !c.sections) { c = _wbDefaultConfig(); DB.set('website_config', c); }
  return c;
}
function _wbSave(c) { DB.set('website_config', c); }

function _wbSiteUrl(slug) {
  const base = location.origin + location.pathname.replace(/\/[^/]*$/, '/');
  return base + 'site.html?s=' + encodeURIComponent(slug || 'your-school');
}

function renderWebsiteBuilder() {
  const c = _wbConfig();
  const url = _wbSiteUrl(c.slug);
  document.getElementById('section-website').innerHTML = `
  <div class="page-header">
    <div><h2>🌐 Website Builder</h2>
      <div class="breadcrumb">Build your school's public website — choose a template, edit sections, publish</div></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      <button class="btn btn-secondary" onclick="wbPreview()">👁 Preview</button>
      <button class="btn btn-success" onclick="wbPublish()">🚀 Publish</button>
    </div>
  </div>

  <!-- Status bar -->
  <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:14px 18px;border-radius:14px;margin-bottom:18px;
    background:${c.active?'rgba(16,185,129,.08)':'rgba(239,68,68,.06)'};border:1px solid ${c.active?'rgba(16,185,129,.3)':'rgba(239,68,68,.25)'};">
    <div style="font-size:1.6rem;">${c.active?'🟢':'🔴'}</div>
    <div style="flex:1;min-width:200px;">
      <div style="font-weight:800;font-size:.95rem;">${c.active?'Website is LIVE':'Website is OFFLINE'}</div>
      <div style="font-size:.78rem;color:rgba(255,255,255,.4);word-break:break-all;">${c.slug?url:'Set your website URL in ⚙️ Settings tab, then Publish'}</div>
    </div>
    ${c.slug?`<button class="btn btn-sm btn-cyan" onclick="navigator.clipboard.writeText('${url}').then(()=>toast('✅ Website link copied!','success'))">📋 Copy Link</button>`:''}
    <button class="btn btn-sm ${c.active?'btn-danger':'btn-success'}" onclick="wbToggleActive()">${c.active?'⏸ Deactivate':'▶️ Activate'}</button>
  </div>

  <!-- Tabs -->
  <div class="att-tab-bar">
    <button class="att-tab ${_wbTab==='design'?'active':''}"   onclick="_wbTab='design';renderWebsiteBuilder()">🎨 Templates</button>
    <button class="att-tab ${_wbTab==='sections'?'active':''}" onclick="_wbTab='sections';renderWebsiteBuilder()">🧱 Page Sections</button>
    <button class="att-tab ${_wbTab==='settings'?'active':''}" onclick="_wbTab='settings';renderWebsiteBuilder()">⚙️ Settings</button>
  </div>
  <div id="wb-body"></div>`;

  const el = document.getElementById('wb-body');
  if (_wbTab === 'design')        el.innerHTML = _wbDesignTab(c);
  else if (_wbTab === 'sections') el.innerHTML = _wbSectionsTab(c);
  else                            el.innerHTML = _wbSettingsTab(c);
}

/* ── TAB: Templates ── */
function _wbDesignTab(c) {
  return `
  <p style="font-size:.85rem;color:rgba(255,255,255,.45);margin-bottom:16px;">Choose a template — colors, fonts and styling apply instantly to your live site.</p>
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px;">
    ${WB_TEMPLATES.map(t=>`
    <div onclick="wbPickTemplate('${t.id}')" style="cursor:pointer;border-radius:14px;overflow:hidden;border:2px solid ${c.template===t.id?'#10b981':'rgba(255,255,255,.1)'};background:rgba(255,255,255,.03);transition:transform .15s;"
      onmouseover="this.style.transform='translateY(-3px)'" onmouseout="this.style.transform=''">
      <!-- Mini preview -->
      <div style="height:110px;background:${t.dark?t.colors[0]:t.colors[2]};position:relative;padding:10px;">
        <div style="height:14px;background:${t.colors[0]};border-radius:4px;margin-bottom:8px;display:flex;align-items:center;padding:0 6px;gap:4px;">
          <div style="width:8px;height:8px;border-radius:50%;background:${t.colors[1]};"></div>
          <div style="width:30px;height:4px;background:rgba(255,255,255,.5);border-radius:2px;"></div>
        </div>
        <div style="height:34px;background:linear-gradient(135deg,${t.colors[0]},${t.colors[1]});border-radius:5px;margin-bottom:7px;display:flex;align-items:center;justify-content:center;">
          <div style="width:50%;height:5px;background:rgba(255,255,255,.7);border-radius:3px;"></div>
        </div>
        <div style="display:flex;gap:5px;">
          <div style="flex:1;height:24px;background:${t.dark?'rgba(255,255,255,.08)':'#fff'};border-radius:4px;border:1px solid ${t.colors[1]}33;"></div>
          <div style="flex:1;height:24px;background:${t.dark?'rgba(255,255,255,.08)':'#fff'};border-radius:4px;border:1px solid ${t.colors[1]}33;"></div>
          <div style="flex:1;height:24px;background:${t.dark?'rgba(255,255,255,.08)':'#fff'};border-radius:4px;border:1px solid ${t.colors[1]}33;"></div>
        </div>
        ${c.template===t.id?'<div style="position:absolute;top:6px;right:6px;background:#10b981;color:#fff;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:13px;">✓</div>':''}
      </div>
      <div style="padding:10px 12px;">
        <div style="font-weight:700;font-size:.88rem;">${t.name}</div>
        <div style="font-size:.7rem;color:rgba(255,255,255,.35);">${t.desc} · ${t.font}</div>
        <div style="display:flex;gap:4px;margin-top:6px;">
          ${t.colors.map(col=>`<div style="width:16px;height:16px;border-radius:50%;background:${col};border:1px solid rgba(255,255,255,.2);"></div>`).join('')}
        </div>
      </div>
    </div>`).join('')}
  </div>`;
}

function wbPickTemplate(tid) {
  const c = _wbConfig(); c.template = tid; _wbSave(c);
  toast('🎨 Template applied! Press Publish to update the live site', 'success');
  renderWebsiteBuilder();
}

/* ── TAB: Sections (drag & drop) ── */
const WB_SECTION_META = {
  hero:     { icon:'🖼️', label:'Hero Banner' },
  about:    { icon:'🏫', label:'About School' },
  services: { icon:'⭐', label:'Services' },
  fees:     { icon:'💰', label:'Fee Structure' },
  gallery:  { icon:'📷', label:'Photo Gallery' },
  contact:  { icon:'📞', label:'Contact' },
};

function _wbSectionsTab(c) {
  return `
  <p style="font-size:.85rem;color:rgba(255,255,255,.45);margin-bottom:14px;">
    ⠿ <strong>Drag to reorder</strong> sections on your page · 👁 toggle show/hide · ✏️ edit content
  </p>
  <div id="wb-sec-list" style="display:flex;flex-direction:column;gap:10px;max-width:680px;">
    ${c.sections.map((s,i)=>{
      const m = WB_SECTION_META[s.type]||{icon:'📄',label:s.type};
      return `
      <div draggable="true" data-idx="${i}"
        ondragstart="_wbDragIdx=${i};this.style.opacity='.4'"
        ondragend="this.style.opacity=''"
        ondragover="event.preventDefault();this.style.borderColor='#7c3aed'"
        ondragleave="this.style.borderColor=''"
        ondrop="event.preventDefault();wbReorder(${i})"
        style="display:flex;align-items:center;gap:12px;padding:14px 16px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:12px;cursor:grab;${!s.visible?'opacity:.45;':''}">
        <span style="color:rgba(255,255,255,.25);font-size:1.1rem;cursor:grab;">⠿</span>
        <span style="font-size:1.4rem;">${m.icon}</span>
        <div style="flex:1;">
          <div style="font-weight:700;font-size:.92rem;">${m.label}</div>
          <div style="font-size:.72rem;color:rgba(255,255,255,.35);">${s.data.title||s.data.heading||''}</div>
        </div>
        <button class="btn btn-sm btn-secondary" onclick="wbToggleSection(${i})" title="${s.visible?'Hide this section':'Show this section'}">${s.visible?'👁 Visible':'🚫 Hidden'}</button>
        <button class="btn btn-sm btn-cyan" onclick="wbEditSection(${i})">✏️ Edit</button>
      </div>`;
    }).join('')}
  </div>`;
}

function wbReorder(dropIdx) {
  if (_wbDragIdx === null || _wbDragIdx === dropIdx) return;
  const c = _wbConfig();
  const [moved] = c.sections.splice(_wbDragIdx, 1);
  c.sections.splice(dropIdx, 0, moved);
  _wbSave(c); _wbDragIdx = null;
  renderWebsiteBuilder();
  toast('Section order changed', 'info');
}

function wbToggleSection(i) {
  const c = _wbConfig();
  c.sections[i].visible = !c.sections[i].visible;
  _wbSave(c); renderWebsiteBuilder();
}

/* ── Section editors ── */
function wbEditSection(i) {
  const c = _wbConfig();
  const s = c.sections[i];
  if (s.type === 'hero')          _wbEditHero(c, i);
  else if (s.type === 'about')    _wbEditAbout(c, i);
  else if (s.type === 'services') _wbEditServices(c, i);
  else if (s.type === 'fees')     _wbEditFees(c, i);
  else if (s.type === 'gallery')  _wbEditGallery(c, i);
  else if (s.type === 'contact')  _wbEditContact(c, i);
}

function _wbImgInput(id, current) {
  return `
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">
    <div id="${id}-prev" style="width:74px;height:50px;border-radius:8px;background:rgba(255,255,255,.06);overflow:hidden;display:flex;align-items:center;justify-content:center;font-size:1.3rem;flex-shrink:0;">
      ${current?`<img src="${current}" style="width:100%;height:100%;object-fit:cover;">`:'🖼️'}
    </div>
    <input type="file" accept="image/*" class="form-control" style="flex:1" onchange="_wbImgPick(this,'${id}')">
  </div>
  <input type="hidden" id="${id}" value="">`;
}

window._wbImgStore = {};
function _wbImgPick(input, id) {
  const f = input.files?.[0]; if (!f) return;
  // Compress to ~300KB for site images
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let w=img.width,h=img.height,MAX=1400;
      if(w>MAX||h>MAX){ if(w>h){h=Math.round(h*MAX/w);w=MAX;}else{w=Math.round(w*MAX/h);h=MAX;} }
      canvas.width=w;canvas.height=h;
      const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0,w,h);
      let q=0.8,d=canvas.toDataURL('image/jpeg',q);
      while(d.length*0.75>300*1024&&q>0.2){q-=0.1;d=canvas.toDataURL('image/jpeg',q);}
      window._wbImgStore[id]=d;
      const prev=document.getElementById(id+'-prev');
      if(prev) prev.innerHTML='<img src="'+d+'" style="width:100%;height:100%;object-fit:cover;">';
      toast('✅ Image ready','success');
    };
    img.src=e.target.result;
  };
  reader.readAsDataURL(f);
}
function _wbImg(id, fallback) { return window._wbImgStore[id] || fallback || ''; }

function _wbEditHero(c, i) {
  const d = c.sections[i].data;
  // migrate old single image → images array
  if (!d.images) d.images = d.image ? [d.image] : [];
  buildModal('modal-wb-hero','🖼️ Edit Hero Banner',`
    <div class="form-group"><label class="form-label">Main Heading</label>
      <input class="form-control" id="wbh-head" value="${(d.heading||'').replace(/"/g,'&quot;')}"></div>
    <div class="form-group"><label class="form-label">Sub Text</label>
      <input class="form-control" id="wbh-sub" value="${(d.sub||'').replace(/"/g,'&quot;')}"></div>
    <div class="form-group"><label class="form-label">Button Text</label>
      <input class="form-control" id="wbh-btn" value="${(d.btnText||'').replace(/"/g,'&quot;')}"></div>
    <label class="form-label">Banner Photos <span class="text-muted">(add multiple — they auto-scroll like a slider, max 6)</span></label>
    <input type="file" accept="image/*" multiple class="form-control" onchange="wbHeroAdd(this)" style="margin-bottom:12px;">
    <div id="wbh-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">
      ${d.images.map(im=>`
        <div style="position:relative;aspect-ratio:16/9;border-radius:8px;overflow:hidden;">
          <img src="${im}" style="width:100%;height:100%;object-fit:cover;">
          <button onclick="this.parentElement.remove()" style="position:absolute;top:3px;right:3px;background:rgba(239,68,68,.85);color:#fff;border:none;border-radius:50%;width:20px;height:20px;cursor:pointer;font-size:11px;">✕</button>
        </div>`).join('')}
    </div>
  `, ()=>{
    d.heading=val('wbh-head'); d.sub=val('wbh-sub'); d.btnText=val('wbh-btn');
    const imgs=[]; document.querySelectorAll('#wbh-grid img').forEach(im=>imgs.push(im.src));
    d.images=imgs.slice(0,6);
    d.image=d.images[0]||'';   // keep first as fallback for old renderer
    _wbSave(c); closeAllModals(); renderWebsiteBuilder(); toast('Hero updated ('+d.images.length+' photos)','success');
  },'modal-lg');
}
function wbHeroAdd(input) {
  const files = Array.from(input.files||[]).slice(0,6);
  files.forEach(f=>{
    const reader=new FileReader();
    reader.onload=e=>{
      const img=new Image();
      img.onload=()=>{
        const canvas=document.createElement('canvas');
        let w=img.width,h=img.height,MAX=1400;
        if(w>MAX||h>MAX){ if(w>h){h=Math.round(h*MAX/w);w=MAX;}else{w=Math.round(w*MAX/h);h=MAX;} }
        canvas.width=w;canvas.height=h;
        canvas.getContext('2d').drawImage(img,0,0,w,h);
        let q=0.78,dd=canvas.toDataURL('image/jpeg',q);
        while(dd.length*0.75>320*1024&&q>0.2){q-=0.1;dd=canvas.toDataURL('image/jpeg',q);}
        const grid=document.getElementById('wbh-grid');
        if(grid && grid.children.length<6){
          const div=document.createElement('div');
          div.style.cssText='position:relative;aspect-ratio:16/9;border-radius:8px;overflow:hidden;';
          div.innerHTML='<img src="'+dd+'" style="width:100%;height:100%;object-fit:cover;"><button onclick="this.parentElement.remove()" style="position:absolute;top:3px;right:3px;background:rgba(239,68,68,.85);color:#fff;border:none;border-radius:50%;width:20px;height:20px;cursor:pointer;font-size:11px;">✕</button>';
          grid.appendChild(div);
        }
      };
      img.src=e.target.result;
    };
    reader.readAsDataURL(f);
  });
  input.value='';
}

function _wbEditAbout(c, i) {
  const d = c.sections[i].data;
  window._wbImgStore = {};
  buildModal('modal-wb-about','🏫 Edit About Section',`
    <div class="form-group"><label class="form-label">Title</label>
      <input class="form-control" id="wba-title" value="${(d.title||'').replace(/"/g,'&quot;')}"></div>
    <div class="form-group"><label class="form-label">About Text</label>
      <textarea class="form-control" id="wba-text" rows="5">${d.text||''}</textarea></div>
    <div class="form-group"><label class="form-label">School Photo</label>
      ${_wbImgInput('wba-img', d.image)}</div>
  `, ()=>{
    d.title=val('wba-title'); d.text=document.getElementById('wba-text').value;
    d.image=_wbImg('wba-img', d.image);
    _wbSave(c); closeAllModals(); renderWebsiteBuilder(); toast('About updated','success');
  });
}

function _wbEditServices(c, i) {
  const d = c.sections[i].data;
  if (!d.items) d.items = [];
  const rows = d.items.map((it,k)=>`
    <div style="display:flex;gap:6px;margin-bottom:8px;align-items:center;">
      <input class="form-control" style="width:56px;text-align:center;" id="wbs-icon-${k}" value="${it.icon||'⭐'}" maxlength="4">
      <input class="form-control" style="flex:1;" id="wbs-title-${k}" placeholder="Service title" value="${(it.title||'').replace(/"/g,'&quot;')}">
      <input class="form-control" style="flex:2;" id="wbs-desc-${k}" placeholder="Short description" value="${(it.desc||'').replace(/"/g,'&quot;')}">
      <button class="btn btn-sm btn-danger" onclick="this.parentElement.remove()">✕</button>
    </div>`).join('');
  buildModal('modal-wb-svc','⭐ Edit Services',`
    <div class="form-group"><label class="form-label">Section Title</label>
      <input class="form-control" id="wbs-title" value="${(d.title||'').replace(/"/g,'&quot;')}"></div>
    <label class="form-label">Services (icon · title · description)</label>
    <div id="wbs-rows">${rows}</div>
    <button type="button" class="btn btn-sm btn-secondary" onclick="wbAddSvcRow()">➕ Add Service</button>
  `, ()=>{
    d.title=val('wbs-title');
    const out=[];
    document.querySelectorAll('#wbs-rows > div').forEach(row=>{
      const ins=row.querySelectorAll('input');
      if(ins.length>=3 && ins[1].value.trim()) out.push({icon:ins[0].value||'⭐',title:ins[1].value.trim(),desc:ins[2].value.trim()});
    });
    d.items=out;
    _wbSave(c); closeAllModals(); renderWebsiteBuilder(); toast('Services updated','success');
  },'modal-lg');
}
function wbAddSvcRow() {
  const k = Date.now();
  const div = document.createElement('div');
  div.style.cssText='display:flex;gap:6px;margin-bottom:8px;align-items:center;';
  div.innerHTML = `
    <input class="form-control" style="width:56px;text-align:center;" value="⭐" maxlength="4">
    <input class="form-control" style="flex:1;" placeholder="Service title" value="">
    <input class="form-control" style="flex:2;" placeholder="Short description" value="">
    <button class="btn btn-sm btn-danger" onclick="this.parentElement.remove()">✕</button>`;
  document.getElementById('wbs-rows').appendChild(div);
}

function _wbEditFees(c, i) {
  const d = c.sections[i].data;
  if (!d.rows) d.rows = [];
  const rows = d.rows.map((r,k)=>`
    <div style="display:flex;gap:6px;margin-bottom:8px;">
      <input class="form-control" style="flex:2;" placeholder="Class (e.g. Class 1 – 5)" value="${(r.cls||'').replace(/"/g,'&quot;')}">
      <input class="form-control" style="flex:1;" placeholder="₹1,000" value="${(r.amount||'').replace(/"/g,'&quot;')}">
      <button class="btn btn-sm btn-danger" onclick="this.parentElement.remove()">✕</button>
    </div>`).join('');
  buildModal('modal-wb-fees','💰 Edit Fee Structure',`
    <div class="form-group"><label class="form-label">Section Title</label>
      <input class="form-control" id="wbf-title" value="${(d.title||'').replace(/"/g,'&quot;')}"></div>
    <label class="form-label">Fee Rows (class · monthly fee)</label>
    <div id="wbf-rows">${rows}</div>
    <button type="button" class="btn btn-sm btn-secondary" onclick="wbAddFeeRow()" style="margin-bottom:12px;">➕ Add Row</button>
    <div class="form-group"><label class="form-label">Note (shown below table)</label>
      <input class="form-control" id="wbf-note" value="${(d.note||'').replace(/"/g,'&quot;')}"></div>
  `, ()=>{
    d.title=val('wbf-title'); d.note=val('wbf-note');
    const out=[];
    document.querySelectorAll('#wbf-rows > div').forEach(row=>{
      const ins=row.querySelectorAll('input');
      if(ins.length>=2 && ins[0].value.trim()) out.push({cls:ins[0].value.trim(),amount:ins[1].value.trim()});
    });
    d.rows=out;
    _wbSave(c); closeAllModals(); renderWebsiteBuilder(); toast('Fee structure updated','success');
  });
}
function wbAddFeeRow() {
  const div = document.createElement('div');
  div.style.cssText='display:flex;gap:6px;margin-bottom:8px;';
  div.innerHTML = `
    <input class="form-control" style="flex:2;" placeholder="Class (e.g. Class 1 – 5)" value="">
    <input class="form-control" style="flex:1;" placeholder="₹1,000" value="">
    <button class="btn btn-sm btn-danger" onclick="this.parentElement.remove()">✕</button>`;
  document.getElementById('wbf-rows').appendChild(div);
}

function _wbEditGallery(c, i) {
  const d = c.sections[i].data;
  if (!d.images) d.images = [];
  buildModal('modal-wb-gal','📷 Edit Photo Gallery',`
    <div class="form-group"><label class="form-label">Section Title</label>
      <input class="form-control" id="wbg-title" value="${(d.title||'').replace(/"/g,'&quot;')}"></div>
    <label class="form-label">Photos (max 8 — auto-compressed)</label>
    <input type="file" accept="image/*" multiple class="form-control" onchange="wbGalAdd(this)" style="margin-bottom:12px;">
    <div id="wbg-grid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;">
      ${d.images.map((im,k)=>`
        <div style="position:relative;aspect-ratio:4/3;border-radius:8px;overflow:hidden;" data-img="${k}">
          <img src="${im}" style="width:100%;height:100%;object-fit:cover;">
          <button onclick="this.parentElement.remove()" style="position:absolute;top:3px;right:3px;background:rgba(239,68,68,.85);color:#fff;border:none;border-radius:50%;width:20px;height:20px;cursor:pointer;font-size:11px;">✕</button>
        </div>`).join('')}
    </div>
  `, ()=>{
    d.title=val('wbg-title');
    const imgs=[];
    document.querySelectorAll('#wbg-grid img').forEach(im=>imgs.push(im.src));
    d.images=imgs.slice(0,8);
    _wbSave(c); closeAllModals(); renderWebsiteBuilder(); toast('Gallery updated ('+d.images.length+' photos)','success');
  },'modal-lg');
}
function wbGalAdd(input) {
  const files = Array.from(input.files||[]).slice(0,8);
  files.forEach(f=>{
    const reader=new FileReader();
    reader.onload=e=>{
      const img=new Image();
      img.onload=()=>{
        const canvas=document.createElement('canvas');
        let w=img.width,h=img.height,MAX=1000;
        if(w>MAX||h>MAX){ if(w>h){h=Math.round(h*MAX/w);w=MAX;}else{w=Math.round(w*MAX/h);h=MAX;} }
        canvas.width=w;canvas.height=h;
        canvas.getContext('2d').drawImage(img,0,0,w,h);
        let q=0.75,dd=canvas.toDataURL('image/jpeg',q);
        while(dd.length*0.75>250*1024&&q>0.2){q-=0.1;dd=canvas.toDataURL('image/jpeg',q);}
        const grid=document.getElementById('wbg-grid');
        if(grid && grid.children.length<8){
          const div=document.createElement('div');
          div.style.cssText='position:relative;aspect-ratio:4/3;border-radius:8px;overflow:hidden;';
          div.innerHTML='<img src="'+dd+'" style="width:100%;height:100%;object-fit:cover;"><button onclick="this.parentElement.remove()" style="position:absolute;top:3px;right:3px;background:rgba(239,68,68,.85);color:#fff;border:none;border-radius:50%;width:20px;height:20px;cursor:pointer;font-size:11px;">✕</button>';
          grid.appendChild(div);
        }
      };
      img.src=e.target.result;
    };
    reader.readAsDataURL(f);
  });
  input.value='';
}

function _wbEditContact(c, i) {
  const d = c.sections[i].data;
  buildModal('modal-wb-contact','📞 Edit Contact Section',`
    <div class="form-group"><label class="form-label">Title</label>
      <input class="form-control" id="wbc-title" value="${(d.title||'').replace(/"/g,'&quot;')}"></div>
    <div class="form-group"><label class="form-label">Text</label>
      <textarea class="form-control" id="wbc-text" rows="3">${d.text||''}</textarea></div>
    <p style="font-size:.78rem;color:rgba(255,255,255,.4);">📍 Address, phone & email come from the ⚙️ Settings tab (footer info).</p>
  `, ()=>{
    d.title=val('wbc-title'); d.text=document.getElementById('wbc-text').value;
    _wbSave(c); closeAllModals(); renderWebsiteBuilder(); toast('Contact updated','success');
  });
}

/* ── TAB: Settings ── */
function _wbSettingsTab(c) {
  return `
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:16px;max-width:900px;">

    <div class="card" style="padding:18px;">
      <h3 style="margin-bottom:14px;">🔗 Website URL</h3>
      <div class="form-group"><label class="form-label">Your school's web address (slug)</label>
        <input class="form-control" id="wb-slug" placeholder="my-school-name" value="${c.slug||''}"
          oninput="this.value=this.value.toLowerCase().replace(/[^a-z0-9-]/g,'-')">
        <div style="font-size:.72rem;color:rgba(255,255,255,.35);margin-top:6px;word-break:break-all;">
          Your site: <span style="color:#06b6d4;">${_wbSiteUrl('<slug>')}</span></div>
      </div>
      <div class="form-group"><label class="form-label">Header — School Name</label>
        <input class="form-control" id="wb-hname" value="${(c.header.schoolName||'').replace(/"/g,'&quot;')}"></div>
      <div class="form-group"><label class="form-label">Header — Tagline</label>
        <input class="form-control" id="wb-htag" value="${(c.header.tagline||'').replace(/"/g,'&quot;')}"></div>
      <div class="form-group"><label class="form-label">Logo</label>
        ${_wbImgInput('wb-hlogo', c.header.logo)}</div>
    </div>

    <div class="card" style="padding:18px;">
      <h3 style="margin-bottom:14px;">📍 Footer / Contact Info</h3>
      <div class="form-group"><label class="form-label">Address</label>
        <input class="form-control" id="wb-faddr" value="${(c.footer.address||'').replace(/"/g,'&quot;')}"></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Phone</label>
          <input class="form-control" id="wb-fphone" value="${(c.footer.phone||'').replace(/"/g,'&quot;')}"></div>
        <div class="form-group"><label class="form-label">Email</label>
          <input class="form-control" id="wb-femail" value="${(c.footer.email||'').replace(/"/g,'&quot;')}"></div>
      </div>
      <div class="form-group"><label class="form-label">📲 WhatsApp Number <span class="text-muted">(for the floating enquiry button)</span></label>
        <input class="form-control" id="wb-fwa" placeholder="10-digit WhatsApp number" value="${(c.footer.whatsapp||'').replace(/"/g,'&quot;')}"></div>
      <div class="form-group"><label class="form-label">Facebook URL</label>
        <input class="form-control" id="wb-ffb" placeholder="https://facebook.com/…" value="${(c.footer.facebook||'').replace(/"/g,'&quot;')}"></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Instagram URL</label>
          <input class="form-control" id="wb-fig" placeholder="https://instagram.com/…" value="${(c.footer.instagram||'').replace(/"/g,'&quot;')}"></div>
        <div class="form-group"><label class="form-label">YouTube URL</label>
          <input class="form-control" id="wb-fyt" placeholder="https://youtube.com/…" value="${(c.footer.youtube||'').replace(/"/g,'&quot;')}"></div>
      </div>
    </div>
  </div>
  <button class="btn btn-primary" style="margin-top:16px;" onclick="wbSaveSettings()">💾 Save Settings</button>`;
}

function wbSaveSettings() {
  const c = _wbConfig();
  const slug = val('wb-slug').trim();
  if (slug && slug.length < 3) { toast('URL slug must be at least 3 characters', 'warning'); return; }
  c.slug = slug;
  c.header.schoolName = val('wb-hname');
  c.header.tagline    = val('wb-htag');
  c.header.logo       = _wbImg('wb-hlogo', c.header.logo);
  c.footer.address    = val('wb-faddr');
  c.footer.phone      = val('wb-fphone');
  c.footer.email      = val('wb-femail');
  c.footer.whatsapp   = val('wb-fwa');
  c.footer.facebook   = val('wb-ffb');
  c.footer.instagram  = val('wb-fig');
  c.footer.youtube    = val('wb-fyt');
  _wbSave(c);
  toast('✅ Settings saved! Press Publish to update the live site', 'success');
  renderWebsiteBuilder();
}

/* ── Publish & Activate ── */
function wbToggleActive() {
  const c = _wbConfig();
  if (!c.slug) { toast('Set your website URL in ⚙️ Settings first', 'warning'); _wbTab='settings'; renderWebsiteBuilder(); return; }
  c.active = !c.active;
  _wbSave(c);
  _wbPushToServer(c, () => {
    toast(c.active ? '🟢 Website is now LIVE!' : '🔴 Website deactivated', c.active ? 'success' : 'info');
    renderWebsiteBuilder();
  });
}

function wbPreview() {
  const c = _wbConfig();
  sessionStorage.setItem('wb_preview', JSON.stringify(c));
  window.open('site.html?preview=1', '_blank');
}

function wbPublish() {
  const c = _wbConfig();
  if (!c.slug) { toast('Set your website URL in ⚙️ Settings first', 'warning'); _wbTab='settings'; renderWebsiteBuilder(); return; }
  toast('🚀 Publishing…', 'info');
  _wbPushToServer(c, () => {
    toast('✅ Published! ' + (c.active ? 'Your site is live — share the link!' : 'Now press Activate to make it live'), 'success');
    renderWebsiteBuilder();
  });
}

// Push site config to server under reserved school_id '_public_sites' with key = slug,
// so site.html can fetch it with just the slug (no login needed).
function _wbPushToServer(c, done) {
  const schoolId = DB._schoolId ? DB._schoolId() : '';
  fetch('api/kv.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ school_id: '_public_sites', key: c.slug, value: { schoolId, config: c, updatedAt: new Date().toISOString() } })
  }).then(r => {
    if (r.ok) { if (done) done(); }
    else toast('⚠️ Server error while publishing — try again', 'error');
  }).catch(() => {
    // Offline/local — saved locally, preview still works
    if (done) done();
    toast('⚠️ Saved locally — server publish will work on live hosting', 'warning');
  });
}

// ══════════════════════════════════════════════════════
//  EXAM SCHEDULE
// ══════════════════════════════════════════════════════
let _esEditId = null;
let _esFilterClass = '';

function _exScheduleHtml(classes) {
  const schedules = DB.get('exam_schedules') || [];
  const classMap = {};
  classes.forEach(c => { classMap[c.id] = c.name; });

  const filtered = _esFilterClass
    ? schedules.filter(s => s.classId === _esFilterClass || s.classId === 'all')
    : schedules;

  return `
  <div class="d-flex gap-12 mb-16" style="flex-wrap:wrap;align-items:center;justify-content:space-between">
    <div class="d-flex gap-10 align-items-center" style="flex-wrap:wrap">
      <select class="form-control" style="width:200px" onchange="_esFilterClass=this.value;renderExams()">
        <option value="">All Classes</option>
        ${classes.map(c=>`<option value="${c.id}" ${c.id===_esFilterClass?'selected':''}>${c.name}</option>`).join('')}
      </select>
      <span class="text-xs text-muted">${filtered.length} schedule(s)</span>
    </div>
    <button class="btn btn-primary" onclick="openExamScheduleModal()">➕ Create Exam Schedule</button>
  </div>

  ${filtered.length ? filtered.map(sch => {
    const cls = sch.classId === 'all' ? 'All Classes' : (classMap[sch.classId] || sch.classId);
    const entries = sch.entries || [];
    const startDate = entries.length ? entries.map(e=>e.date).sort()[0] : null;
    const endDate   = entries.length ? entries.map(e=>e.date).sort().reverse()[0] : null;
    return `
    <div class="card mb-16" style="overflow:hidden">
      <div style="background:linear-gradient(135deg,#1e1b4b,#312e81);padding:18px 22px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
        <div>
          <div style="font-size:1.1rem;font-weight:700;color:#fff">${sch.name}</div>
          <div style="font-size:.82rem;color:rgba(255,255,255,.7);margin-top:3px">
            🏫 ${cls} &nbsp;·&nbsp; ${entries.length} Subject(s)
            ${startDate ? `&nbsp;·&nbsp; 📅 ${formatDate(startDate)}${endDate!==startDate?' → '+formatDate(endDate):''}` : ''}
          </div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn-sm" style="background:rgba(255,255,255,.15);color:#fff;border:1px solid rgba(255,255,255,.3)" onclick="editExamSchedule('${sch.id}')">✏️ Edit</button>
          <button class="btn btn-sm" style="background:#10b981;color:#fff;border:none" onclick="printExamSchedule('${sch.id}')">🖨️ Print</button>
          <button class="btn btn-sm btn-danger" onclick="deleteExamSchedule('${sch.id}')">🗑️</button>
        </div>
      </div>
      ${entries.length ? `
      <div style="overflow-x:auto">
        <table style="width:100%;border-collapse:collapse;min-width:580px">
          <thead>
            <tr style="background:#f1f5f9">
              <th style="padding:10px 14px;text-align:left;font-size:.8rem;color:#475569;font-weight:700;text-transform:uppercase;letter-spacing:.04em">Date</th>
              <th style="padding:10px 14px;text-align:left;font-size:.8rem;color:#475569;font-weight:700;text-transform:uppercase;letter-spacing:.04em">Day</th>
              <th style="padding:10px 14px;text-align:left;font-size:.8rem;color:#475569;font-weight:700;text-transform:uppercase;letter-spacing:.04em">Subject</th>
              <th style="padding:10px 14px;text-align:center;font-size:.8rem;color:#475569;font-weight:700;text-transform:uppercase;letter-spacing:.04em">Time</th>
              <th style="padding:10px 14px;text-align:center;font-size:.8rem;color:#475569;font-weight:700;text-transform:uppercase;letter-spacing:.04em">Max Marks</th>
              <th style="padding:10px 14px;text-align:left;font-size:.8rem;color:#475569;font-weight:700;text-transform:uppercase;letter-spacing:.04em">Venue</th>
            </tr>
          </thead>
          <tbody>
            ${entries.slice().sort((a,b)=>(a.date||'').localeCompare(b.date||'')).map((e,i)=>`
            <tr style="border-bottom:1px solid var(--border);background:${i%2===0?'transparent':'rgba(99,102,241,.03)'}">
              <td style="padding:10px 14px;font-weight:600;color:var(--text-1)">${formatDate(e.date)}</td>
              <td style="padding:10px 14px"><span style="background:#e0e7ff;color:#3730a3;padding:2px 10px;border-radius:20px;font-size:.8rem;font-weight:600">${e.day||getDayName(e.date)}</span></td>
              <td style="padding:10px 14px;font-weight:700;color:#6d28d9">${e.subject}</td>
              <td style="padding:10px 14px;text-align:center;color:var(--text-2);font-size:.9rem">${e.startTime||''}${e.endTime?' – '+e.endTime:''}</td>
              <td style="padding:10px 14px;text-align:center"><span style="background:#fef3c7;color:#92400e;padding:2px 10px;border-radius:12px;font-size:.82rem;font-weight:600">${e.maxMarks||'—'}</span></td>
              <td style="padding:10px 14px;color:var(--text-2);font-size:.88rem">${e.venue||'—'}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>` : `<div style="padding:24px;text-align:center;color:var(--text-3)">No subjects added yet — click Edit</div>`}
    </div>`;
  }).join('') : `<div class="empty-state"><div class="e-icon">📅</div><h3>No Exam Schedules Yet</h3><p>Click "Create Exam Schedule" to build a datesheet for any exam</p></div>`}`;
}

function getDayName(dateStr) {
  if (!dateStr) return '';
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  return days[new Date(dateStr).getDay()] || '';
}

function openExamScheduleModal(id) {
  _esEditId = id || null;
  const classes = DB.get('classes');
  let sch = id ? DB.find('exam_schedules', id) : null;
  if (!sch) sch = { name:'', classId:'', entries:[], instructions:'' };

  const body = `
  <div class="form-group">
    <label class="form-label">Exam Name *</label>
    <input class="form-control" id="es-name" placeholder="e.g. Half Yearly Exam 2025-26" value="${esc(sch.name)}">
  </div>
  <div class="form-group">
    <label class="form-label">Class *</label>
    <select class="form-control" id="es-class">
      <option value="all" ${sch.classId==='all'?'selected':''}>All Classes (Common Schedule)</option>
      ${classes.map(c=>`<option value="${c.id}" ${c.id===sch.classId?'selected':''}>${c.name}</option>`).join('')}
    </select>
  </div>
  <div class="form-group">
    <label class="form-label">Instructions (optional)</label>
    <textarea class="form-control" id="es-instr" rows="2" placeholder="e.g. Bring admit card. No electronic devices allowed.">${esc(sch.instructions||'')}</textarea>
  </div>
  <div style="border-top:1px solid var(--border);padding-top:16px;margin-top:4px">
    <div style="font-weight:700;margin-bottom:12px;font-size:.95rem">📚 Subjects / Date Entries</div>
    <div id="es-entries-wrap">
      ${(sch.entries||[]).map((e,i)=>_esEntryRow(e,i)).join('')}
    </div>
    <button class="btn btn-sm" style="margin-top:8px;background:rgba(99,102,241,.12);color:#6366f1;border:1px dashed #6366f1" onclick="_esAddRow()">➕ Add Subject</button>
  </div>`;

  buildModal('esModal', (id ? '✏️ Edit' : '➕ Create') + ' Exam Schedule', body, saveExamSchedule, 'lg');
  if (!sch.entries || !sch.entries.length) setTimeout(_esAddRow, 50);
}

function _esEntryRow(e, i) {
  return `<div class="es-row d-flex gap-8 mb-8 align-items-center" style="flex-wrap:wrap;background:var(--glass);border:1px solid var(--border);border-radius:10px;padding:10px 12px;position:relative">
    <input class="form-control" style="flex:2;min-width:110px" placeholder="Subject *" value="${esc(e.subject||'')}">
    <input type="date" class="form-control" style="flex:1.2;min-width:130px" value="${e.date||''}">
    <input class="form-control" style="flex:1;min-width:90px" placeholder="Start time" value="${e.startTime||''}" list="es-time-list">
    <input class="form-control" style="flex:1;min-width:90px" placeholder="End time"   value="${e.endTime||''}"   list="es-time-list">
    <input type="number" class="form-control" style="flex:.7;min-width:70px" placeholder="Max Marks" value="${e.maxMarks||''}">
    <input class="form-control" style="flex:1.5;min-width:100px" placeholder="Venue / Room" value="${esc(e.venue||'')}">
    <button onclick="this.closest('.es-row').remove()" style="background:#ef4444;color:#fff;border:none;border-radius:8px;width:30px;height:30px;cursor:pointer;flex-shrink:0;font-size:1rem;line-height:1">×</button>
  </div>`;
}

function _esAddRow() {
  const wrap = document.getElementById('es-entries-wrap');
  if (!wrap) return;
  const div = document.createElement('div');
  div.innerHTML = _esEntryRow({}, wrap.children.length);
  wrap.appendChild(div.firstElementChild);
}

function saveExamSchedule() {
  const name = (document.getElementById('es-name')?.value||'').trim();
  const classId = document.getElementById('es-class')?.value || 'all';
  const instr = (document.getElementById('es-instr')?.value||'').trim();
  if (!name) { toast('Exam name is required','error'); return; }

  const rows = document.querySelectorAll('#es-entries-wrap .es-row');
  const entries = [];
  rows.forEach(row => {
    const inputs = row.querySelectorAll('input,select');
    const subject   = (inputs[0]?.value||'').trim();
    const date      = inputs[1]?.value || '';
    const startTime = (inputs[2]?.value||'').trim();
    const endTime   = (inputs[3]?.value||'').trim();
    const maxMarks  = inputs[4]?.value ? Number(inputs[4].value) : '';
    const venue     = (inputs[5]?.value||'').trim();
    if (subject) entries.push({ subject, date, day: getDayName(date), startTime, endTime, maxMarks, venue });
  });

  const schedules = DB.get('exam_schedules') || [];
  if (_esEditId) {
    const idx = schedules.findIndex(s => s.id === _esEditId);
    if (idx > -1) schedules[idx] = { ...schedules[idx], name, classId, entries, instructions: instr };
  } else {
    schedules.push({ id: genId('esch'), name, classId, entries, instructions: instr, createdAt: today() });
  }
  DB.set('exam_schedules', schedules);
  document.getElementById('esModal')?.remove();
  toast('✅ Exam schedule saved!', 'success');
  renderExams();
}

function editExamSchedule(id) { openExamScheduleModal(id); }

function deleteExamSchedule(id) {
  if (!confirmAction('Delete this exam schedule?')) return;
  DB.set('exam_schedules', (DB.get('exam_schedules')||[]).filter(s => s.id !== id));
  toast('Exam schedule deleted', 'success');
  renderExams();
}

function printExamSchedule(id) {
  const sch = DB.find('exam_schedules', id);
  if (!sch) return;
  const settings = getSettings();
  const classes  = DB.get('classes');
  const classMap = {}; classes.forEach(c => { classMap[c.id] = c.name; });
  const cls = sch.classId === 'all' ? 'All Classes' : (classMap[sch.classId] || sch.classId);
  const entries = (sch.entries || []).slice().sort((a,b) => (a.date||'').localeCompare(b.date||''));
  const startDate = entries.length ? formatDate(entries[0].date) : '';
  const endDate   = entries.length ? formatDate(entries[entries.length-1].date) : '';

  const subjectColors = ['#7c3aed','#0891b2','#059669','#d97706','#dc2626','#7c3aed','#db2777','#2563eb'];

  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
  <title>${sch.name} — Exam Schedule</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Segoe UI',Arial,sans-serif;background:#f8faff;color:#1e293b;min-height:100vh}
    .page{max-width:900px;margin:0 auto;padding:30px 24px}

    /* Header banner */
    .header-banner{background:linear-gradient(135deg,#1e1b4b 0%,#312e81 50%,#4f46e5 100%);border-radius:20px;padding:36px 40px;color:#fff;margin-bottom:28px;display:flex;align-items:center;gap:28px;position:relative;overflow:hidden}
    .header-banner::before{content:'';position:absolute;right:-40px;top:-40px;width:220px;height:220px;background:rgba(255,255,255,.06);border-radius:50%}
    .header-banner::after{content:'';position:absolute;right:60px;bottom:-60px;width:160px;height:160px;background:rgba(255,255,255,.04);border-radius:50%}
    .school-logo-wrap{width:80px;height:80px;border-radius:16px;background:rgba(255,255,255,.15);display:flex;align-items:center;justify-content:center;font-size:2.5rem;flex-shrink:0;overflow:hidden;border:2px solid rgba(255,255,255,.3)}
    .school-logo-wrap img{width:100%;height:100%;object-fit:contain}
    .header-text{}
    .header-text .school-name{font-size:1.5rem;font-weight:800;letter-spacing:.02em;margin-bottom:4px}
    .header-text .exam-title{font-size:1.1rem;font-weight:700;color:#c7d2fe;margin-bottom:6px}
    .header-text .meta-row{font-size:.82rem;color:rgba(255,255,255,.7);display:flex;gap:16px;flex-wrap:wrap}
    .header-text .meta-row span{display:flex;align-items:center;gap:5px}

    /* Stats strip */
    .stats-strip{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px}
    .stat-card{background:#fff;border-radius:14px;padding:16px 18px;text-align:center;box-shadow:0 2px 10px rgba(0,0,0,.06)}
    .stat-card .val{font-size:1.6rem;font-weight:800;color:#4f46e5;line-height:1.1}
    .stat-card .lbl{font-size:.73rem;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin-top:4px}

    /* Schedule table */
    .section-title{font-size:1rem;font-weight:700;color:#1e293b;margin-bottom:14px;display:flex;align-items:center;gap-8px}
    .schedule-wrap{background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.07);margin-bottom:24px}
    table{width:100%;border-collapse:collapse}
    thead tr{background:linear-gradient(90deg,#312e81,#4f46e5)}
    th{padding:13px 16px;text-align:left;font-size:.78rem;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:.06em}
    th:nth-child(4),th:nth-child(5){text-align:center}
    tbody tr{border-bottom:1px solid #f1f5f9;transition:background .15s}
    tbody tr:hover{background:#f8f7ff}
    tbody tr:last-child{border-bottom:none}
    td{padding:13px 16px;vertical-align:middle}
    .date-cell .d{font-size:.95rem;font-weight:700;color:#1e293b}
    .date-cell .m{font-size:.75rem;color:#64748b}
    .day-badge{display:inline-block;padding:3px 12px;border-radius:20px;font-size:.75rem;font-weight:700;background:#e0e7ff;color:#3730a3}
    .sunday .day-badge{background:#fee2e2;color:#991b1b}
    .subject-cell .subj{font-size:1rem;font-weight:700;padding-left:10px;border-left:3px solid #4f46e5}
    .time-cell{text-align:center;font-size:.85rem;color:#475569;font-weight:600}
    .marks-chip{display:inline-block;padding:4px 14px;border-radius:12px;font-weight:700;font-size:.82rem;background:#fef3c7;color:#92400e;text-align:center}
    .venue-cell{font-size:.82rem;color:#475569}

    /* Instructions */
    .instructions-box{background:#fff;border-left:4px solid #4f46e5;border-radius:0 14px 14px 0;padding:16px 20px;margin-bottom:24px;box-shadow:0 2px 8px rgba(0,0,0,.04)}
    .instructions-box .inst-title{font-weight:700;color:#312e81;margin-bottom:8px;font-size:.9rem}
    .instructions-box ul{padding-left:18px;color:#475569;font-size:.85rem;line-height:1.7}

    /* Footer */
    .print-footer{text-align:center;font-size:.75rem;color:#94a3b8;padding:16px;border-top:1px solid #e2e8f0;margin-top:8px}
    .signature-row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:24px;margin:30px 0 12px}
    .sig-box{text-align:center}
    .sig-line{border-top:2px solid #cbd5e1;margin-top:50px;padding-top:8px;font-size:.75rem;color:#475569;font-weight:600;text-transform:uppercase;letter-spacing:.05em}

    /* Print */
    .no-print{margin-bottom:20px;display:flex;gap:10px;flex-wrap:wrap}
    @media print{
      .no-print{display:none!important}
      body{background:#fff}
      .page{padding:16px}
      .header-banner{border-radius:12px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
      .stat-card,.schedule-wrap,.instructions-box{box-shadow:none;-webkit-print-color-adjust:exact;print-color-adjust:exact}
      thead tr{-webkit-print-color-adjust:exact;print-color-adjust:exact}
    }
  </style>
</head><body>
<div class="page">
  <!-- Action bar -->
  <div class="no-print">
    <button onclick="window.print()" style="background:#4f46e5;color:#fff;border:none;padding:10px 22px;border-radius:10px;cursor:pointer;font-weight:700;font-size:.95rem">🖨️ Print / Save PDF</button>
    <button onclick="window.close()" style="background:#f1f5f9;color:#475569;border:1px solid #e2e8f0;padding:10px 20px;border-radius:10px;cursor:pointer;font-weight:600">✕ Close</button>
  </div>

  <!-- Header -->
  <div class="header-banner">
    <div class="school-logo-wrap">${settings.schoolLogo?`<img src="${settings.schoolLogo}" alt="logo">`:'🏫'}</div>
    <div class="header-text">
      <div class="school-name">${esc(settings.schoolName||'School Name')}</div>
      <div class="exam-title">${esc(sch.name)}</div>
      <div class="meta-row">
        <span>🏫 ${esc(cls)}</span>
        ${startDate?`<span>📅 ${startDate}${endDate&&endDate!==startDate?' to '+endDate:''}</span>`:''}
        <span>📚 ${entries.length} Subjects</span>
        ${settings.schoolAddress?`<span>📍 ${esc(settings.schoolAddress)}</span>`:''}
      </div>
    </div>
  </div>

  <!-- Stats -->
  <div class="stats-strip">
    <div class="stat-card"><div class="val">${entries.length}</div><div class="lbl">Subjects</div></div>
    <div class="stat-card"><div class="val">${[...new Set(entries.map(e=>e.date).filter(Boolean))].length}</div><div class="lbl">Exam Days</div></div>
    <div class="stat-card"><div class="val">${entries.reduce((t,e)=>t+(Number(e.maxMarks)||0),0)}</div><div class="lbl">Total Marks</div></div>
    <div class="stat-card"><div class="val">${startDate||'—'}</div><div class="lbl">Starts From</div></div>
  </div>

  <!-- Instructions -->
  ${sch.instructions?`<div class="instructions-box"><div class="inst-title">📌 Important Instructions</div><ul>${sch.instructions.split('\n').filter(Boolean).map(l=>`<li>${esc(l)}</li>`).join('')}</ul></div>`:''}

  <!-- Schedule Table -->
  <div class="section-title">📅 Exam Datesheet</div>
  <div class="schedule-wrap">
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Day</th>
          <th>Subject</th>
          <th style="text-align:center">Timing</th>
          <th style="text-align:center">Max Marks</th>
          <th>Venue / Room</th>
        </tr>
      </thead>
      <tbody>
        ${entries.map((e,i)=>{
          const isSun = getDayName(e.date)==='Sunday';
          const color = subjectColors[i % subjectColors.length];
          return `<tr class="${isSun?'sunday':''}">
            <td class="date-cell">
              <div class="d">${e.date ? new Date(e.date).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—'}</div>
            </td>
            <td><span class="day-badge">${e.day||getDayName(e.date)||'—'}</span></td>
            <td class="subject-cell"><div class="subj" style="border-left-color:${color}">${esc(e.subject)}</div></td>
            <td class="time-cell">${e.startTime||''}${e.endTime?' – '+e.endTime:''}</td>
            <td style="text-align:center"><span class="marks-chip">${e.maxMarks||'—'}</span></td>
            <td class="venue-cell">${esc(e.venue||'—')}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  </div>

  <!-- Signatures -->
  <div class="signature-row">
    <div class="sig-box"><div class="sig-line">Class Teacher</div></div>
    <div class="sig-box"><div class="sig-line">Principal / Head</div></div>
    <div class="sig-box"><div class="sig-line">Parent / Guardian</div></div>
  </div>

  <div class="print-footer">
    ${esc(settings.schoolName||'')} &nbsp;·&nbsp; Generated by VisionMarg School Management &nbsp;·&nbsp; ${new Date().toLocaleDateString('en-IN')}
  </div>
</div>
</body></html>`);
  win.document.close();
}

// ══════════════════════════════════════════════════════
//  BIRTHDAYS (admin view + card preview/download/share)
// ══════════════════════════════════════════════════════
let _abTpl='b1', _abData=null;

function _abMonthDay(dob){ const d=new Date(dob); return {m:d.getMonth(), day:d.getDate()}; }

function renderBirthdays(){
  const students=DB.get('students').filter(s=>s.dob);
  const classMap={}; DB.get('classes').forEach(c=>classMap[c.id]=c.name);
  const now=new Date(), tm=now.getMonth(), td=now.getDate();

  const todays=students.filter(s=>bdayIsToday(s.dob));
  // This month, sorted by day
  const monthList=students.filter(s=>_abMonthDay(s.dob).m===tm)
    .sort((a,b)=>_abMonthDay(a.dob).day-_abMonthDay(b.dob).day);

  const card=(s,highlight)=>{
    const md=_abMonthDay(s.dob);
    return `<div class="card" style="${highlight?'border:2px solid #f5c542;box-shadow:0 0 0 3px rgba(245,197,66,.2);':''}">
      <div class="card-body" style="display:flex;align-items:center;gap:12px;">
        <div class="avatar-sm" style="width:48px;height:48px;font-size:1.1rem;flex-shrink:0;">${s.photo?`<img src="${s.photo}" style="width:48px;height:48px;border-radius:50%;object-fit:cover">`:(s.name||'?')[0]}</div>
        <div style="flex:1;min-width:0;">
          <div class="fw-7">${esc(s.name)} ${highlight?'🎉':''}</div>
          <div class="text-xs text-muted">${esc(classMap[s.classId]||'—')} · Roll ${esc(s.rollNo||'—')}</div>
          <div class="text-xs" style="color:#f59e0b;">🎂 ${formatDate(s.dob)} · turning ${bdayAge(s.dob)+1}</div>
        </div>
        <button class="btn btn-sm btn-primary" onclick="openAdminBdayCard('${s.id}')">🎨 Card</button>
      </div>
    </div>`;
  };

  document.getElementById('section-birthdays').innerHTML=`
  <div class="page-header"><div><h2>Birthdays 🎂</h2></div></div>

  <div class="card mb-20" style="padding:16px 20px;">
    <div style="font-weight:700;margin-bottom:4px;">🎨 Birthday Card Designs (${BDAY_TEMPLATES.length})</div>
    <div style="font-size:.8rem;color:var(--text-3);margin-bottom:14px;">These are the 5 designs available. On a student's birthday, parents can pick any of these in their app — and you can too from the "🎨 Card" button below.</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:14px;">
      ${BDAY_TEMPLATES.map(t=>`
        <div style="text-align:center;">
          <div style="border-radius:12px;overflow:hidden;background:#000;border:2px solid ${t.swatch};box-shadow:0 4px 14px rgba(0,0,0,.25);">
            <canvas id="abprev-${t.id}" style="width:100%;display:block;"></canvas>
          </div>
          <div style="font-size:.78rem;font-weight:700;margin-top:6px;color:${t.swatch};">${t.name}</div>
        </div>`).join('')}
    </div>
  </div>

  <div class="card mb-20" style="padding:16px 20px;">
    <div style="font-weight:700;margin-bottom:4px;">🎉 Today's Birthdays (${todays.length})</div>
    <div style="font-size:.8rem;color:var(--text-3);margin-bottom:12px;">Parents automatically get a birthday card popup in their app today. You can also generate & share it from here.</div>
    ${todays.length?`<div class="grid-3">${todays.map(s=>card(s,true)).join('')}</div>`
      :`<div class="text-muted" style="padding:14px;">No birthdays today.</div>`}
  </div>

  <div class="card" style="padding:16px 20px;">
    <div style="font-weight:700;margin-bottom:12px;">📅 This Month (${monthList.length})</div>
    ${monthList.length?`<div class="grid-3">${monthList.map(s=>card(s,bdayIsToday(s.dob))).join('')}</div>`
      :`<div class="text-muted" style="padding:14px;">No birthdays this month.</div>`}
  </div>`;

  // Render the 5 design previews (sample student or a real birthday student)
  const sample = todays[0] || monthList[0] || students[0];
  const previewData = sample ? _abBuildData(sample) : _abSampleData();
  BDAY_TEMPLATES.forEach(t=>{
    const cv=document.getElementById('abprev-'+t.id);
    if(cv) drawBirthdayCard(cv, t.id, previewData);
  });
}

function _abSampleData(){
  const s=getSettings();
  return {
    name:'Aaradhya Sharma', className:'Class 4', father:'Rajesh Sharma',
    mother:'Sunita Sharma', scholarNo:'221', dob:'2014-12-28', age:10, photo:'',
    schoolName:s.schoolName||'Your School', logo:s.schoolLogo||'', address:s.schoolAddress||'', phone:s.schoolPhone||''
  };
}

function _abBuildData(st){
  const cls=DB.find('classes',st.classId), s=getSettings();
  return {
    name:st.name||'Student', className:cls?cls.name:'', father:st.fatherName||'',
    mother:st.motherName||'', scholarNo:st.admissionNo||st.scholarNo||st.rollNo||'',
    dob:st.dob||'', age:bdayAge(st.dob), photo:st.photo||'',
    schoolName:s.schoolName||'', logo:s.schoolLogo||'', address:s.schoolAddress||'', phone:s.schoolPhone||''
  };
}

function openAdminBdayCard(studentId){
  const st=DB.find('students',studentId); if(!st) return;
  _abData=_abBuildData(st); _abTpl='b1';
  const root=document.getElementById('modals-root');
  root.innerHTML=`
  <div class="modal-overlay" id="abBdayModal" style="display:flex;align-items:flex-start;justify-content:center;overflow-y:auto;padding:18px 0;">
    <div style="background:var(--bg-1,#12121a);border-radius:18px;max-width:460px;width:94%;margin:auto;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.5);">
      <div style="background:linear-gradient(135deg,#f5c542,#e0a800);padding:14px 18px;display:flex;align-items:center;justify-content:space-between;">
        <div style="font-weight:800;color:#1a1a1a;">🎂 Birthday Card — ${esc((_abData.name||'').split(' ')[0])}</div>
        <button onclick="document.getElementById('abBdayModal').remove()" style="background:rgba(0,0,0,.15);border:none;width:30px;height:30px;border-radius:50%;cursor:pointer;color:#1a1a1a;">✕</button>
      </div>
      <div style="padding:16px;">
        <div style="border-radius:12px;overflow:hidden;background:#000;"><canvas id="abBdayCanvas" style="width:100%;display:block;"></canvas></div>
        <div style="display:flex;gap:8px;overflow-x:auto;padding:12px 2px;">
          ${BDAY_TEMPLATES.map(t=>`<button id="abthumb-${t.id}" onclick="adminBdaySwitch('${t.id}')"
            style="flex:0 0 auto;cursor:pointer;border:2px solid ${t.id===_abTpl?t.swatch:'transparent'};border-radius:10px;padding:6px 10px;background:linear-gradient(135deg,${t.bg[0]},${t.bg[1]});color:${t.swatch};font-size:.72rem;font-weight:700;white-space:nowrap;">${t.name}</button>`).join('')}
        </div>
        <div style="display:flex;gap:10px;">
          <button class="btn btn-primary" style="flex:1;" onclick="adminBdayDownload()">📥 Download</button>
          <button class="btn" style="flex:1;background:#25D366;color:#fff;border:none;" onclick="adminBdayShare()">📤 Share</button>
        </div>
      </div>
    </div>
  </div>`;
  drawBirthdayCard(document.getElementById('abBdayCanvas'), _abTpl, _abData);
}
function adminBdaySwitch(id){
  _abTpl=id;
  BDAY_TEMPLATES.forEach(t=>{ const b=document.getElementById('abthumb-'+t.id); if(b) b.style.border='2px solid '+(t.id===id?t.swatch:'transparent'); });
  drawBirthdayCard(document.getElementById('abBdayCanvas'), id, _abData);
}
function adminBdayDownload(){
  const c=document.getElementById('abBdayCanvas'); if(!c) return;
  const a=document.createElement('a');
  a.download='Happy-Birthday-'+(_abData.name||'').replace(/[^a-z0-9]/gi,'_')+'.png';
  a.href=c.toDataURL('image/png'); document.body.appendChild(a); a.click(); document.body.removeChild(a);
  toast('📥 Birthday card downloaded!','success');
}
function adminBdayShare(){
  const c=document.getElementById('abBdayCanvas'); if(!c) return;
  c.toBlob(blob=>{
    if(!blob){ toast('Could not generate image','error'); return; }
    const file=new File([blob],'birthday.png',{type:'image/png'});
    const txt=`🎉 Happy Birthday ${_abData.name}! 🎂 — ${_abData.schoolName||''}`;
    if(navigator.canShare && navigator.canShare({files:[file]})){
      navigator.share({files:[file], title:'Happy Birthday', text:txt}).catch(()=>{});
    } else {
      const w=window.open('','_blank');
      if(w){ w.document.write(`<body style="margin:0;background:#000;display:flex;align-items:center;justify-content:center;min-height:100vh"><img src="${c.toDataURL('image/png')}" style="max-width:100%;max-height:100vh"></body>`); w.document.close(); }
      toast('📋 Image opened — save or share it','info');
    }
  },'image/png');
}

// ══════════════════════════════════════════════════════
//  AI EXAM INSIGHTS DASHBOARD
// ══════════════════════════════════════════════════════
let _eiClass='', _eiExam='', _eiTab='overall', _eiReady=false;

function _eiAnalyze(classId, examName){
  const students = DB.where('students','classId',classId)
    .sort((a,b)=>String(a.rollNo||0).localeCompare(String(b.rollNo||0),undefined,{numeric:true}));
  const exams = DB.get('exams').filter(e=>e.classId===classId && e.name===examName);
  const marks = DB.get('marks');
  const maxTotal = exams.reduce((t,e)=>t+Number(e.maxMarks||0),0);

  const rows = students.map(s=>{
    let o=0,m=0;
    const subs = exams.map(e=>{
      const mk=marks.find(x=>x.examId===e.id&&x.studentId===s.id);
      const ob=mk?Number(mk.obtained):null;
      if(ob!=null){o+=ob;m+=Number(e.maxMarks);}
      return {subject:e.subject, obtained:ob, max:Number(e.maxMarks), pct: ob!=null?Math.round(ob/e.maxMarks*100):null};
    });
    const pct = m>0?Math.round(o/m*100):null;
    return {id:s.id, name:s.name, roll:s.rollNo, total:o, max:m||maxTotal, pct, subs, attempted:m>0};
  });

  const done = rows.filter(r=>r.attempted).sort((a,b)=>b.pct-a.pct);
  done.forEach((r,i)=>r.rank=i+1);

  const n = done.length;
  const avg = n?Math.round(done.reduce((t,r)=>t+r.pct,0)/n):0;
  const passN = done.filter(r=>r.pct>=33).length;
  const passPct = n?Math.round(passN/n*100):0;

  const stars = done.filter(r=>r.pct>=85);
  const average = done.filter(r=>r.pct>=50&&r.pct<85);
  const struggling = done.filter(r=>r.pct>=33&&r.pct<50);
  const extra = done.filter(r=>r.pct<33);

  // Subject-wise averages
  const subjAvg = exams.map(e=>{
    const ps=marks.filter(m=>m.examId===e.id).map(m=>Math.round(m.obtained/e.maxMarks*100));
    const a = ps.length?Math.round(ps.reduce((t,x)=>t+x,0)/ps.length):0;
    return {subject:e.subject, avg:a, count:ps.length};
  }).sort((a,b)=>a.avg-b.avg);

  // Trend across all exam types for this class (by earliest date)
  const allExams = DB.get('exams').filter(e=>e.classId===classId);
  const names = [...new Set(allExams.map(e=>e.name))];
  const trend = names.map(nm=>{
    const exs=allExams.filter(e=>e.name===nm);
    const date=exs.map(e=>e.date).filter(Boolean).sort()[0]||'';
    const mx=exs.reduce((t,e)=>t+Number(e.maxMarks||0),0);
    // class avg for this exam name
    const perStu = students.map(s=>{
      let o=0,m=0; exs.forEach(e=>{const mk=marks.find(x=>x.examId===e.id&&x.studentId===s.id); if(mk){o+=Number(mk.obtained);m+=Number(e.maxMarks);}});
      return m>0?o/m*100:null;
    }).filter(x=>x!=null);
    const a=perStu.length?Math.round(perStu.reduce((t,x)=>t+x,0)/perStu.length):0;
    return {name:nm, date, avg:a, attempted:perStu.length};
  }).filter(t=>t.attempted).sort((a,b)=>(a.date||'').localeCompare(b.date||''));

  // Projection (simple linear slope of last trend points)
  let projected=null, direction='steady';
  if(trend.length>=2){
    const last=trend[trend.length-1].avg, prev=trend[trend.length-2].avg;
    const slope=last-prev;
    projected=Math.max(0,Math.min(100, last+slope));
    direction = slope>2?'improving':slope<-2?'declining':'steady';
  }

  return {exams, rows, done, n, avg, passN, passPct, stars, average, struggling, extra,
          subjAvg, trend, projected, direction, maxTotal, examName};
}

function renderExamInsights(){
  const classes=DB.get('classes');
  if(!_eiClass && classes[0]) _eiClass=classes[0].id;
  const exTypes=[...new Set(DB.get('exams').filter(e=>e.classId===_eiClass).map(e=>e.name))].sort();
  if(!_eiExam && exTypes[0]) _eiExam=exTypes[0];

  document.getElementById('section-examinsights').innerHTML=`
  <div class="page-header">
    <div><h2>🧠 AI Exam Insights</h2><p class="page-sub" style="color:var(--text-3);font-size:.82rem;">Smart exam analysis · projected results · star performers · students needing attention</p></div>
  </div>

  <div class="card" style="padding:18px 20px;margin-bottom:18px;background:linear-gradient(135deg,rgba(124,58,237,.12),rgba(59,130,246,.08));">
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;align-items:end;">
      <div class="form-group" style="margin:0;"><label class="form-label">Class</label>
        <select class="form-control" onchange="_eiClass=this.value;_eiExam='';_eiReady=false;renderExamInsights()">
          ${classes.map(c=>`<option value="${c.id}" ${c.id===_eiClass?'selected':''}>${c.name}</option>`).join('')}
        </select></div>
      <div class="form-group" style="margin:0;"><label class="form-label">Exam / Test</label>
        <select class="form-control" onchange="_eiExam=this.value;_eiReady=false;renderExamInsights()">
          ${exTypes.length?exTypes.map(t=>`<option value="${t}" ${t===_eiExam?'selected':''}>${t}</option>`).join(''):'<option value="">No exams found</option>'}
        </select></div>
      <div><button class="btn btn-primary" style="width:100%;" onclick="_eiReady=true;renderExamInsights()">✨ Generate AI Insights</button></div>
    </div>
  </div>

  ${!exTypes.length
    ? `<div class="empty-state"><div class="e-icon">🧠</div><h3>No exam data</h3><p>Add exams & marks first, then generate insights.</p></div>`
    : (_eiReady ? _eiRenderResults() : `<div class="empty-state"><div class="e-icon">✨</div><h3>Select filters & Generate</h3><p>Choose a class and exam, then click "Generate AI Insights".</p></div>`)}`;
}

function _eiRenderResults(){
  const d=_eiAnalyze(_eiClass, _eiExam);
  if(!d.n) return `<div class="empty-state"><div class="e-icon">📭</div><h3>No marks entered</h3><p>No marks found for ${esc(_eiExam)} in this class.</p></div>`;
  const cls=DB.find('classes',_eiClass);
  const card=(c,n,lbl,sub)=>`<div style="background:${c}14;border:1px solid ${c}40;border-radius:14px;padding:16px;text-align:center;">
    <div style="font-size:1.8rem;font-weight:900;color:${c};">${n}</div>
    <div style="font-size:.8rem;font-weight:700;color:var(--text-1);margin-top:2px;">${lbl}</div>
    <div style="font-size:.68rem;color:var(--text-3);">${sub}</div></div>`;

  const tabBtn=(id,icon,lbl)=>`<button onclick="_eiTab='${id}';renderExamInsights()" style="padding:8px 16px;border-radius:20px;border:1px solid ${_eiTab===id?'#7c3aed':'var(--border)'};background:${_eiTab===id?'rgba(124,58,237,.2)':'transparent'};color:${_eiTab===id?'#a78bfa':'var(--text-2)'};font-weight:700;font-size:.82rem;cursor:pointer;white-space:nowrap;">${icon} ${lbl}</button>`;

  return `
  <!-- Metric cards -->
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:18px;">
    ${card('#7c3aed', d.avg+'%', 'Class Average', d.n+' students')}
    ${card('#f59e0b', d.stars.length, '⭐ Star Performers', '85%+ scored')}
    ${card('#10b981', d.average.length, '✅ Average', '50–84%')}
    ${card('#ef4444', d.struggling.length, '⚠️ Struggling', '33–49%')}
    ${card('#dc2626', d.extra.length, '🆘 Extra Effort', 'Below 33%')}
    ${card('#06b6d4', d.passPct+'%', 'Pass Rate', d.passN+'/'+d.n+' passed')}
  </div>

  <!-- AI summary -->
  <div class="card" style="padding:16px 18px;margin-bottom:16px;border-left:4px solid #7c3aed;">
    <div style="font-weight:800;margin-bottom:8px;">🤖 AI Insights — ${esc(cls?cls.name:'')} · ${esc(_eiExam)}</div>
    <ul style="margin:0;padding-left:20px;font-size:.86rem;line-height:1.8;color:var(--text-2);">
      ${_eiInsightBullets(d).map(b=>`<li>${b}</li>`).join('')}
    </ul>
  </div>

  <!-- Tabs -->
  <div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:8px;margin-bottom:14px;">
    ${tabBtn('overall','📊','Overall')}
    ${tabBtn('stars','⭐','Star Performers')}
    ${tabBtn('struggle','⚠️','Struggling')}
    ${tabBtn('extra','🆘','Extra Effort')}
    ${tabBtn('subjects','📚','Subject Analysis')}
    ${tabBtn('trend','📈','Trend')}
  </div>

  <div style="display:flex;justify-content:flex-end;margin-bottom:10px;">
    <button class="btn btn-secondary" onclick="_eiPrint()">🖨️ Print Full Report</button>
  </div>

  <div class="card" style="padding:0;overflow:hidden;">${_eiTabBody(d)}</div>`;
}

function _eiInsightBullets(d){
  const out=[];
  out.push(`Class average is <strong>${d.avg}%</strong> with a <strong>${d.passPct}%</strong> pass rate.`);
  if(d.stars.length) out.push(`<strong>${d.stars.length}</strong> star performer(s) — top: <strong>${esc(d.stars[0].name)}</strong> (${d.stars[0].pct}%).`);
  if(d.extra.length) out.push(`<span style="color:#dc2626;font-weight:700;">${d.extra.length} student(s) need immediate support</span> (below 33%).`);
  if(d.struggling.length) out.push(`${d.struggling.length} student(s) are struggling (33–49%) and need extra guidance.`);
  if(d.subjAvg.length){ const w=d.subjAvg[0], s=d.subjAvg[d.subjAvg.length-1];
    out.push(`Weakest subject: <strong>${esc(w.subject)}</strong> (avg ${w.avg}%). Strongest: <strong>${esc(s.subject)}</strong> (avg ${s.avg}%).`);
  }
  if(d.projected!=null) out.push(`Trend is <strong style="color:${d.direction==='improving'?'#10b981':d.direction==='declining'?'#ef4444':'#f59e0b'}">${d.direction}</strong> — projected next-exam average ≈ <strong>${d.projected}%</strong>.`);
  return out;
}

function _eiStudentTable(list, color){
  if(!list.length) return `<div style="padding:24px;text-align:center;color:var(--text-3);">No students in this category 🎉</div>`;
  return `<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:.86rem;">
    <thead><tr style="background:var(--glass);">
      <th style="padding:9px 12px;text-align:left;">Rank</th><th style="padding:9px 12px;text-align:left;">Student</th>
      <th style="padding:9px 12px;text-align:center;">Roll</th><th style="padding:9px 12px;text-align:center;">Total</th>
      <th style="padding:9px 12px;text-align:center;">%</th><th style="padding:9px 12px;text-align:left;">Weak Subjects</th>
    </tr></thead><tbody>
      ${list.map(r=>{
        const weak=r.subs.filter(s=>s.pct!=null&&s.pct<40).map(s=>s.subject).join(', ')||'—';
        return `<tr style="border-top:1px solid var(--border);">
          <td style="padding:8px 12px;font-weight:700;color:${color};">#${r.rank}</td>
          <td style="padding:8px 12px;font-weight:600;">${esc(r.name)}</td>
          <td style="padding:8px 12px;text-align:center;">${esc(r.roll||'—')}</td>
          <td style="padding:8px 12px;text-align:center;">${r.total}/${r.max}</td>
          <td style="padding:8px 12px;text-align:center;font-weight:800;color:${color};">${r.pct}%</td>
          <td style="padding:8px 12px;color:#ef4444;">${esc(weak)}</td>
        </tr>`;
      }).join('')}
    </tbody></table></div>`;
}

function _eiTabBody(d){
  if(_eiTab==='stars')    return _eiStudentTable(d.stars,'#f59e0b');
  if(_eiTab==='struggle') return _eiStudentTable(d.struggling,'#ef4444');
  if(_eiTab==='extra')    return _eiStudentTable(d.extra,'#dc2626');
  if(_eiTab==='subjects'){
    return `<div style="padding:16px;">${d.subjAvg.map(s=>`
      <div style="margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;font-size:.85rem;margin-bottom:4px;">
          <span style="font-weight:600;">${esc(s.subject)}</span>
          <span style="font-weight:700;color:${s.avg>=70?'#10b981':s.avg>=40?'#f59e0b':'#ef4444'};">${s.avg}% avg</span>
        </div>
        <div style="background:var(--glass);border-radius:999px;height:8px;overflow:hidden;">
          <div style="height:100%;width:${s.avg}%;background:${s.avg>=70?'#10b981':s.avg>=40?'#f59e0b':'#ef4444'};border-radius:999px;"></div>
        </div>
      </div>`).join('')}</div>`;
  }
  if(_eiTab==='trend'){
    if(!d.trend.length) return `<div style="padding:24px;text-align:center;color:var(--text-3);">Not enough exams for trend.</div>`;
    const maxH=120;
    return `<div style="padding:20px;">
      <div style="display:flex;gap:14px;align-items:flex-end;height:${maxH+30}px;overflow-x:auto;">
        ${d.trend.map(t=>`<div style="text-align:center;flex:0 0 auto;">
          <div style="font-size:.72rem;font-weight:700;color:var(--text-1);margin-bottom:4px;">${t.avg}%</div>
          <div style="width:46px;height:${Math.max(6,t.avg/100*maxH)}px;background:linear-gradient(180deg,#a78bfa,#7c3aed);border-radius:6px 6px 0 0;"></div>
          <div style="font-size:.68rem;color:var(--text-3);margin-top:5px;max-width:60px;">${esc(t.name)}</div>
        </div>`).join('')}
      </div>
      <div style="margin-top:14px;font-size:.85rem;color:var(--text-2);">
        Direction: <strong style="color:${d.direction==='improving'?'#10b981':d.direction==='declining'?'#ef4444':'#f59e0b'}">${d.direction.toUpperCase()}</strong>
        ${d.projected!=null?` · Projected next ≈ <strong>${d.projected}%</strong>`:''}
      </div>
    </div>`;
  }
  // overall — full ranking
  return _eiStudentTable(d.done,'#7c3aed');
}

function _eiPrint(){
  const d=_eiAnalyze(_eiClass,_eiExam);
  const cls=DB.find('classes',_eiClass); const s=getSettings();
  const rowsHtml=d.done.map(r=>`<tr>
    <td>#${r.rank}</td><td>${esc(r.name)}</td><td>${esc(r.roll||'—')}</td>
    <td>${r.total}/${r.max}</td><td>${r.pct}%</td>
    <td>${r.pct>=85?'⭐ Star':r.pct>=50?'Average':r.pct>=33?'Struggling':'🆘 Extra Effort'}</td>
    <td>${esc(r.subs.filter(x=>x.pct!=null&&x.pct<40).map(x=>x.subject).join(', ')||'—')}</td>
  </tr>`).join('');
  printHtml(`
    <style>body{font-family:Arial;padding:20px;color:#111}h1{color:#6d28d9;text-align:center;margin:0}
    h2{color:#4c1d95;font-size:15px;border-bottom:2px solid #6d28d9;padding-bottom:4px;margin-top:18px}
    table{width:100%;border-collapse:collapse;font-size:12px;margin-top:6px}th,td{border:1px solid #cbd5e1;padding:5px 7px}
    th{background:#ede9fe}.cards{display:flex;gap:10px;flex-wrap:wrap;margin-top:10px}
    .c{flex:1;min-width:110px;border:1px solid #ddd;border-radius:8px;padding:8px;text-align:center}
    .c .n{font-size:20px;font-weight:800}ul{font-size:12px;line-height:1.7}</style>
    <h1>${esc(s.schoolName||'School')}</h1>
    <div style="text-align:center;font-size:13px;color:#555">AI Exam Insights Report — ${esc(cls?cls.name:'')} · ${esc(_eiExam)}</div>
    <div class="cards">
      <div class="c"><div class="n" style="color:#7c3aed">${d.avg}%</div>Class Avg</div>
      <div class="c"><div class="n" style="color:#f59e0b">${d.stars.length}</div>Star</div>
      <div class="c"><div class="n" style="color:#10b981">${d.average.length}</div>Average</div>
      <div class="c"><div class="n" style="color:#ef4444">${d.struggling.length}</div>Struggling</div>
      <div class="c"><div class="n" style="color:#dc2626">${d.extra.length}</div>Extra Effort</div>
      <div class="c"><div class="n" style="color:#06b6d4">${d.passPct}%</div>Pass Rate</div>
    </div>
    <h2>🤖 AI Insights</h2><ul>${_eiInsightBullets(d).map(b=>`<li>${b.replace(/<[^>]+>/g,'')}</li>`).join('')}</ul>
    <h2>📚 Subject-wise Average</h2>
    <table><thead><tr><th>Subject</th><th>Average %</th><th>Status</th></tr></thead><tbody>
      ${d.subjAvg.map(x=>`<tr><td>${esc(x.subject)}</td><td>${x.avg}%</td><td>${x.avg>=70?'Strong':x.avg>=40?'Needs work':'Weak'}</td></tr>`).join('')}
    </tbody></table>
    <h2>📋 Full Class Ranking</h2>
    <table><thead><tr><th>Rank</th><th>Student</th><th>Roll</th><th>Marks</th><th>%</th><th>Category</th><th>Weak Subjects</th></tr></thead>
    <tbody>${rowsHtml}</tbody></table>`,
    `Exam Insights — ${cls?cls.name:''} ${_eiExam}`);
}

// ══════════════════════════════════════════════════════
//  COMMUNICATION — WhatsApp & SMS to parents
// ══════════════════════════════════════════════════════
function renderCommunication(){
  const c=msgCfg();
  const waLabel = c.waProvider==='clicktochat' ? 'Click-to-Chat (free)' : (c.waProvider||'').toUpperCase();
  const smsLabel = c.smsEnabled ? (c.smsProvider||'—').toUpperCase() : 'Disabled';
  document.getElementById('section-communication').innerHTML=`
  <div class="page-header">
    <div><h2>📲 WhatsApp & SMS</h2><p class="page-sub" style="color:var(--text-3);font-size:.82rem;">Send notices, reminders & alerts straight to parents</p></div>
    <button class="btn btn-secondary" onclick="openCommSettings()">⚙️ Provider Settings</button>
  </div>

  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;margin-bottom:18px;">
    <div class="card" style="padding:18px;">
      <div style="font-size:1.6rem;">💬</div>
      <div style="font-weight:800;margin-top:6px;">WhatsApp</div>
      <div style="font-size:.8rem;color:var(--text-3);">Method: <strong style="color:#25D366;">${esc(waLabel)}</strong></div>
    </div>
    <div class="card" style="padding:18px;">
      <div style="font-size:1.6rem;">📱</div>
      <div style="font-weight:800;margin-top:6px;">SMS</div>
      <div style="font-size:.8rem;color:var(--text-3);">Provider: <strong style="color:${c.smsEnabled?'#10b981':'#94a3b8'};">${esc(smsLabel)}</strong></div>
    </div>
    <div class="card" style="padding:18px;display:flex;flex-direction:column;justify-content:center;gap:8px;">
      <button class="btn" style="background:#25D366;color:#fff;border:none;font-weight:700;" onclick="openMsgComposer()">📤 New Message</button>
    </div>
  </div>

  <div class="card" style="padding:18px 20px;">
    <div style="font-weight:800;margin-bottom:10px;">🚀 Quick Send</div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;">
      <button class="btn btn-secondary" onclick="openMsgComposer({text:'Dear {name}, '})">✍️ Custom Alert</button>
      <button class="btn btn-secondary" onclick="openMsgComposer({text:'Dear Parent, this is a reminder that {name}\\'s fee is pending. Kindly pay at the earliest. — {school}'})">💳 Fee Reminder</button>
      <button class="btn btn-secondary" onclick="openMsgComposer({text:'Dear Parent, {school} will remain closed tomorrow on account of a holiday. — {school}'})">🏖️ Holiday Notice</button>
      <button class="btn btn-secondary" onclick="openMsgComposer({text:'Dear Parent, kindly attend the Parent-Teacher Meeting at {school}. Date & time will be shared shortly.'})">👨‍👩‍👧 PTM Invite</button>
    </div>
  </div>

  <div class="card" style="padding:18px 20px;margin-top:16px;">
    <div style="font-weight:800;margin-bottom:8px;">ℹ️ How to use</div>
    <ol style="margin:0;padding-left:20px;font-size:.86rem;line-height:1.9;color:var(--text-2);">
      <li><strong>Free WhatsApp (no setup):</strong> leave method on "Click-to-Chat". Compose a message, pick parents, and tap each name to open WhatsApp with the text ready to send.</li>
      <li><strong>Automatic bulk (needs a provider):</strong> open <strong>⚙️ Provider Settings</strong> and add your own API keys — WhatsApp Cloud API / Gupshup / Twilio, or SMS via Fast2SMS / MSG91 / Twilio.</li>
      <li>Then choose the channel in the composer and hit <strong>Send</strong> — messages go out automatically to all selected parents.</li>
      <li>Use placeholders <code>{name}</code>, <code>{school}</code>, <code>{class}</code> — they auto-fill for each parent.</li>
    </ol>
    <div style="font-size:.74rem;color:var(--text-3);margin-top:8px;">Phone numbers are read from each student's parent phone. API keys are used by the server relay <code>api/notify.php</code> (works on live hosting).</div>
  </div>`;
}

// ══════════════════════════════════════════════════════
//  PASSWORD RESET REQUESTS (one-click approve)
// ══════════════════════════════════════════════════════
function _genTempPwd(){ return 'vm' + Math.floor(1000 + Math.random()*9000); }

function renderPwdResets(){
  const reqs=(DB.get('password_reset_requests')||[]).slice().reverse();
  const pending=reqs.filter(r=>r.status==='pending');
  const done=reqs.filter(r=>r.status!=='pending');
  const card=(r)=>{
    const stu=r.role==='student'?DB.get('students').find(s=>s.username===r.username):null;
    const phone=r.phone||(stu&&stu.phone)||'';
    const waMsg=encodeURIComponent(`Hello ${r.name}, your VissionMarg password has been reset. New password: ${r.newPassword||''}. Please login and change it.`);
    return `<div class="card" style="margin-bottom:10px;">
      <div class="card-body" style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
        <div class="avatar-sm" style="width:42px;height:42px;background:rgba(124,58,237,.2);flex-shrink:0;">${(r.name||'?')[0].toUpperCase()}</div>
        <div style="flex:1;min-width:160px;">
          <div class="fw-7">${esc(r.name)} <span class="badge ${r.role==='teacher'?'badge-purple':'badge-cyan'}">${r.role}</span></div>
          <div class="text-xs text-muted">👤 ${esc(r.username)} ${phone?'· 📱 '+esc(phone):''} · 📅 ${formatDate(r.date)}</div>
          ${r.status==='approved'?`<div style="margin-top:4px;font-size:.82rem;color:#10b981;">✅ New password: <strong style="font-family:monospace;background:rgba(16,185,129,.12);padding:2px 8px;border-radius:6px;">${esc(r.newPassword)}</strong></div>`:''}
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          ${r.status==='pending'
            ? `<button class="btn btn-sm btn-success" onclick="approvePwdReset('${r.id}')">✅ Approve & Reset</button>
               <button class="btn btn-sm btn-danger" onclick="dismissPwdReset('${r.id}')">✕</button>`
            : `${phone?`<a class="btn btn-sm" style="background:#25D366;color:#fff;border:none;" href="https://wa.me/${(phone.replace(/[^0-9]/g,'').length===10?'91':'')+phone.replace(/[^0-9]/g,'')}?text=${waMsg}" target="_blank">📲 Send to user</a>`:''}
               <button class="btn btn-sm btn-secondary" onclick="dismissPwdReset('${r.id}')">🗑 Clear</button>`}
        </div>
      </div>
    </div>`;
  };
  document.getElementById('section-pwdresets').innerHTML=`
  <div class="page-header"><div><h2>🔑 Password Reset Requests</h2><p class="page-sub" style="color:var(--text-3);font-size:.82rem;">Students & teachers who forgot their password — approve in one click</p></div></div>
  ${pending.length?`<h3 style="margin:6px 0 10px;">⏳ Pending (${pending.length})</h3>${pending.map(card).join('')}`:'<div class="empty-state"><div class="e-icon">✅</div><p>No pending reset requests</p></div>'}
  ${done.length?`<h3 style="margin:18px 0 10px;">✅ Recently Reset</h3>${done.slice(0,10).map(card).join('')}`:''}`;
}
function approvePwdReset(id){
  const reqs=DB.get('password_reset_requests'); const r=reqs.find(x=>x.id===id); if(!r) return;
  const np=_genTempPwd();
  // update the users credentials store
  const users=DB.get('users'); const u=users.find(x=>x.username===r.username && x.role===r.role);
  if(u){ u.password=np; DB.set('users',users); }
  // update the role-specific array too (keeps panels in sync)
  if(r.role==='teacher'){ const ts=DB.get('teachers'); const t=ts.find(x=>x.username===r.username); if(t){ t.password=np; DB.set('teachers',ts);} }
  if(r.role==='student'){ const ss=DB.get('students'); const st=ss.find(x=>x.username===r.username); if(st){ st.password=np; DB.set('students',ss);} }
  if(!u && r.role==='student'){ const ss=DB.get('students'); const st=ss.find(x=>x.username===r.username); if(st){ st.password=np; DB.set('students',ss);} }
  r.status='approved'; r.newPassword=np; r.approvedAt=today();
  DB.set('password_reset_requests',reqs);
  toast(`✅ Reset done — new password: ${np}`,'success');
  renderPwdResets();
}
function dismissPwdReset(id){
  DB.set('password_reset_requests',(DB.get('password_reset_requests')||[]).filter(x=>x.id!==id));
  renderPwdResets();
}

// ══════════════════════════════════════════════════════
//  HELP & SUPPORT
// ══════════════════════════════════════════════════════
function renderHelp(){
  const num='9128600175', wa='919128600175';
  document.getElementById('section-help').innerHTML=`
  <div class="page-header"><div><h2>🆘 Help & Support</h2></div></div>
  <div class="card" style="max-width:520px;">
    <div class="card-body" style="text-align:center;padding:28px 22px;">
      <div style="font-size:3rem;">🤝</div>
      <h3 style="margin:10px 0 4px;">Need help? We're here for you</h3>
      <p style="color:var(--text-3);font-size:.88rem;margin-bottom:20px;">Any problem, question, or feature request — message us anytime.</p>
      <div style="display:flex;flex-direction:column;gap:12px;">
        <a class="btn" style="background:#25D366;color:#fff;border:none;font-weight:700;padding:14px;" href="https://wa.me/${wa}?text=${encodeURIComponent('Hi, I need help with VissionMarg School App.')}" target="_blank">📲 WhatsApp Support — +91 ${num}</a>
        <a class="btn btn-primary" style="padding:14px;" href="tel:+91${num}">📞 Call Support — +91 ${num}</a>
      </div>
      <div style="margin-top:18px;font-size:.78rem;color:var(--text-3);">Support hours: Mon–Sat, 10 AM – 7 PM</div>
    </div>
  </div>`;
}

// ══════════════════════════════════════════════════════
//  SESSION & PROMOTION (year-end rollover, no data conflict)
// ══════════════════════════════════════════════════════
const _SESSION_KEYS = ['marks','attendance','exams','exam_schedules','homework','fees','fee_transactions','assignments','assignment_submissions'];

function _nextClassGuess(cls, classes){
  const m=(cls.name||'').match(/\d+/); if(!m) return '';
  const n=parseInt(m[0],10);
  const sec=((cls.name||'').match(/[A-Za-z]\s*$/)||[''])[0].trim();
  let cand=classes.find(c=>{const mm=(c.name||'').match(/\d+/);return mm&&parseInt(mm[0],10)===n+1&&((c.name||'').match(/[A-Za-z]\s*$/)||[''])[0].trim()===sec;});
  if(!cand) cand=classes.find(c=>{const mm=(c.name||'').match(/\d+/);return mm&&parseInt(mm[0],10)===n+1;});
  return cand?cand.id:'';
}

function renderSession(){
  const s=getSettings();
  const archives=(DB.get('session_archives')||[]).slice().reverse();
  const students=DB.get('students').filter(x=>x.status!=='alumni');
  const alumni=DB.get('students').filter(x=>x.status==='alumni').length + (DB.get('alumni')||[]).length;
  document.getElementById('section-session').innerHTML=`
  <div class="page-header"><div><h2>🎓 Session & Promotion</h2>
    <p class="page-sub" style="color:var(--text-3);font-size:.82rem;">Promote students to the next class & start a new academic session — old data stays safe & viewable</p></div></div>

  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:18px;">
    <div class="card" style="padding:16px;text-align:center;"><div style="font-size:1.5rem;font-weight:900;color:#7c3aed;">${esc(s.academicYear||'—')}</div><div style="font-size:.78rem;color:var(--text-3);">Current Session</div></div>
    <div class="card" style="padding:16px;text-align:center;"><div style="font-size:1.5rem;font-weight:900;color:#06b6d4;">${students.length}</div><div style="font-size:.78rem;color:var(--text-3);">Active Students</div></div>
    <div class="card" style="padding:16px;text-align:center;"><div style="font-size:1.5rem;font-weight:900;color:#f59e0b;">${archives.length}</div><div style="font-size:.78rem;color:var(--text-3);">Past Sessions</div></div>
    <div class="card" style="padding:16px;text-align:center;"><div style="font-size:1.5rem;font-weight:900;color:#10b981;">${alumni}</div><div style="font-size:.78rem;color:var(--text-3);">Alumni (Passed Out)</div></div>
  </div>

  <div class="card" style="padding:18px 20px;margin-bottom:18px;border-left:4px solid #f59e0b;">
    <h3 style="margin:0 0 6px;">🚀 Promote to New Session</h3>
    <p style="font-size:.85rem;color:var(--text-2);line-height:1.7;margin-bottom:12px;">
      At year-end, move students to their next class and start a new session. What happens:
      <br>✅ The entire current session is <strong>archived</strong> (read-only, never deleted)
      <br>✅ Each student moves to their <strong>next class</strong>; final-class students become <strong>Alumni</strong>
      <br>✅ Marks, attendance, exams &amp; fees reset <strong>fresh</strong> for the new session (no conflict)
    </p>
    <button class="btn btn-primary" onclick="openPromoteModal()">🎓 Start Promotion</button>
  </div>

  <div class="card" style="padding:18px 20px;">
    <h3 style="margin:0 0 12px;">📚 Past Sessions (read-only)</h3>
    ${archives.length?archives.map((a,ri)=>{
      const realIdx=(DB.get('session_archives')||[]).length-1-ri;
      return `<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;padding:12px;border:1px solid var(--border);border-radius:10px;margin-bottom:8px;">
        <div><div style="font-weight:700;">📅 Session ${esc(a.year||'—')}</div>
          <div style="font-size:.76rem;color:var(--text-3);">${(a.students||[]).length} students · ${(a.marks||[]).length} marks · archived ${a.savedAt?formatDate(a.savedAt):'—'}</div></div>
        <button class="btn btn-sm btn-secondary" onclick="viewArchive(${realIdx})">👁 View Records</button>
      </div>`;
    }).join(''):'<div class="text-muted" style="padding:10px;">No past sessions yet. They appear here after your first promotion.</div>'}
  </div>`;
}

function openPromoteModal(){
  const classes=DB.get('classes');
  const students=DB.get('students').filter(x=>x.status!=='alumni');
  const s=getSettings();
  if(!classes.length){ toast('Add classes first','warning'); return; }
  const curYear=s.academicYear||'';
  const nextYear=(()=>{ const m=curYear.match(/(\d{4})\D+(\d{2,4})/); if(m){const a=+m[1]+1;const b=(+m[2]%100)+1;return a+'-'+String(b).padStart(2,'0');} return ''; })();
  const opt=(cls)=>{
    const guess=_nextClassGuess(cls,classes);
    return `<select class="form-control" id="promote-${cls.id}" style="min-width:150px;">
      ${classes.map(c=>`<option value="${c.id}" ${c.id===guess?'selected':''}>→ ${esc(c.name)}</option>`).join('')}
      <option value="__grad__">🎓 Graduate (Pass Out)</option>
      <option value="__stay__">⏸ Keep same class</option>
    </select>`;
  };
  buildModal('modal-promote','🎓 Promote Students',`
    <div class="alert" style="background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.35);border-radius:10px;padding:10px 14px;margin-bottom:14px;font-size:.82rem;color:#b45309;">
      ⚠️ This will archive the current session and start a new one. Your data is saved automatically first.
    </div>
    <div class="form-group"><label class="form-label">New Session / Academic Year *</label>
      <input class="form-control" id="promote-year" placeholder="e.g. 2026-27" value="${esc(nextYear)}"></div>
    <label class="form-label">Promotion Map (class → next class)</label>
    <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:14px;">
      ${classes.map(cls=>{
        const cnt=students.filter(x=>x.classId===cls.id).length;
        return `<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
          <div style="flex:1;min-width:120px;font-weight:600;">${esc(cls.name)} <span style="font-size:.72rem;color:var(--text-3);">(${cnt})</span></div>
          ${opt(cls)}</div>`;
      }).join('')}
    </div>
    <div class="form-group"><label class="form-label">Type <strong>PROMOTE</strong> to confirm *</label>
      <input class="form-control" id="promote-confirm" placeholder="PROMOTE" autocomplete="off"></div>
  `, runPromotion, 'modal-lg');
}

function runPromotion(){
  const newYear=val('promote-year').trim();
  const confirmTxt=val('promote-confirm').trim().toUpperCase();
  if(!newYear){ toast('Enter the new session year','warning'); return; }
  if(confirmTxt!=='PROMOTE'){ toast('Type PROMOTE to confirm','warning'); return; }

  const s=getSettings();
  const classes=DB.get('classes');
  // 1) Build mapping from the selects
  const mapping={};
  classes.forEach(c=>{ const el=document.getElementById('promote-'+c.id); if(el) mapping[c.id]=el.value; });

  // 2) Archive current session (deep copy, read-only)
  const archive={ year:s.academicYear||'(unknown)', savedAt:today(),
    students:JSON.parse(JSON.stringify(DB.get('students'))),
    classes:JSON.parse(JSON.stringify(classes)) };
  _SESSION_KEYS.forEach(k=>{ archive[k]=JSON.parse(JSON.stringify(DB.get(k)||[])); });
  const archives=DB.get('session_archives')||[];
  archives.push(archive);
  DB.set('session_archives', archives);

  // 3) Promote / graduate students
  const students=DB.get('students');
  const alumni=DB.get('alumni')||[];
  const keep=[];
  let promoted=0, graduated=0;
  students.forEach(st=>{
    if(st.status==='alumni'){ keep.push(st); return; }
    const target=mapping[st.classId];
    if(target==='__grad__'){
      st.status='alumni'; st.graduatedFrom=st.classId; st.graduatedYear=s.academicYear||''; st.feePaid=0;
      alumni.push(st); graduated++;
    } else if(target==='__stay__' || !target){
      keep.push(st);
    } else {
      st.classId=target; st.feePaid=0; keep.push(st); promoted++;
    }
  });
  DB.set('students', keep);
  DB.set('alumni', alumni);
  // keep users table password/usernames intact (only classId changed in students) — sync classId to users
  const users=DB.get('users'); let uch=false;
  keep.forEach(st=>{ const u=users.find(x=>x.id===st.id); if(u && u.classId!==st.classId){ u.classId=st.classId; uch=true; } });
  if(uch) DB.set('users', users);

  // 4) Reset session-specific data for a clean new session
  DB.set('marks',[]); DB.set('attendance',[]); DB.set('exams',[]);
  DB.set('exam_schedules',[]); DB.set('homework',[]);
  DB.set('fees',[]); DB.set('fee_transactions',[]);
  DB.set('assignments',[]); DB.set('assignment_submissions',[]);
  DB.set('report_overrides',{});

  // 5) Start the new session
  updateSettings({ academicYear:newYear });

  closeAllModals();
  toast(`✅ New session ${newYear} started! ${promoted} promoted, ${graduated} graduated. Old data archived.`,'success');
  renderSession();
}

function viewArchive(idx){
  const a=(DB.get('session_archives')||[])[idx];
  if(!a){ toast('Archive not found','error'); return; }
  const classes=a.classes||[]; const studs=a.students||[]; const marks=a.marks||[]; const exams=a.exams||[];
  const clsBlock=classes.map(cls=>{
    const cs=studs.filter(x=>x.classId===cls.id);
    if(!cs.length) return '';
    const rows=cs.map(st=>{
      const ex=exams.filter(e=>e.classId===cls.id);
      let o=0,m=0; ex.forEach(e=>{const mk=marks.find(x=>x.examId===e.id&&x.studentId===st.id); if(mk){o+=Number(mk.obtained);m+=Number(e.maxMarks);}});
      const pct=m>0?Math.round(o/m*100):null;
      return `<tr><td style="padding:5px 8px;">${esc(st.rollNo||'—')}</td><td style="padding:5px 8px;">${esc(st.name)}</td>
        <td style="padding:5px 8px;">${esc(st.fatherName||'—')}</td>
        <td style="padding:5px 8px;text-align:center;">${pct!=null?pct+'%':'—'}</td></tr>`;
    }).join('');
    return `<div style="margin-bottom:14px;"><div style="font-weight:700;margin-bottom:4px;">🏫 ${esc(cls.name)} <span style="font-size:.72rem;color:var(--text-3);">(${cs.length})</span></div>
      <div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:.82rem;">
      <thead><tr style="background:var(--glass);"><th style="padding:5px 8px;text-align:left;">Roll</th><th style="padding:5px 8px;text-align:left;">Name</th><th style="padding:5px 8px;text-align:left;">Father</th><th style="padding:5px 8px;">Final %</th></tr></thead>
      <tbody>${rows}</tbody></table></div></div>`;
  }).join('');
  buildModal('modal-archive',`📅 Session ${esc(a.year)} — Records`,`
    <div style="font-size:.8rem;color:var(--text-3);margin-bottom:12px;">${studs.length} students · ${(a.attendance||[]).length} attendance entries · ${marks.length} marks · archived ${a.savedAt?formatDate(a.savedAt):'—'}. This is a read-only snapshot.</div>
    ${clsBlock||'<div class="text-muted">No class data in this archive.</div>'}
  `, null, 'modal-lg');
  // hide the Save button for read-only view
  const sb=document.getElementById('modal-save-btn'); if(sb) sb.style.display='none';
}

// ══════════════════════════════════════════════════════
//  SCHOOL GROWTH PLAN (targets · timeline · to-do · 10 templates)
// ══════════════════════════════════════════════════════
const GROWTH_TEMPLATES = [
  { id:'g1', name:'Digital Marketing Blitz', icon:'📱', color:'#3b82f6',
    tagline:'Grow admissions through social media, Google & a strong online presence',
    offers:['Free online admission form','₹500 off for online enquiries','Refer-a-friend digital coupon'],
    milestones:[['Set up online presence','Month 1'],['Run paid ad campaign','Month 2'],['Build review & rating base','Month 3'],['Scale top-performing ads','Month 4']],
    tasks:[['Create Facebook & Instagram pages','Online'],['Set up Google Business Profile','Online'],['Publish school website (use Website Builder)','Online'],['Run Facebook/Instagram ads for admissions','Ads'],['Post 3 reels/photos per week','Content'],['Collect Google reviews from parents','Reputation']] },
  { id:'g2', name:'Referral & Word-of-Mouth', icon:'🤝', color:'#10b981',
    tagline:'Turn happy parents into your best marketers',
    offers:['₹1,000 fee credit per successful referral','Free month for 3 referrals','Family discount for siblings'],
    milestones:[['Launch referral program','Month 1'],['Reward first referrers','Month 2'],['Run a referral contest','Month 3']],
    tasks:[['Design a referral reward scheme','Plan'],['Print referral cards/coupons','Material'],['Announce program in parent group','Comms'],['Track referrals in a sheet','Ops'],['Reward & thank referrers publicly','Engagement']] },
  { id:'g3', name:'Community Outreach', icon:'🏘️', color:'#f59e0b',
    tagline:'Become the most visible & trusted school in your area',
    offers:['Free weekend workshops for kids','Open-house demo classes','Scholarship for local toppers'],
    milestones:[['Host a free community event','Month 1'],['Partner with local shops/temples','Month 2'],['Run a school open day','Month 3']],
    tasks:[['Organize a free kids workshop','Event'],['Put up banners at key local spots','Visibility'],['Distribute pamphlets in nearby areas','Outreach'],['Invite local leaders to events','Relations'],['Hold an Open House with campus tour','Event']] },
  { id:'g4', name:'Academic Excellence', icon:'🏆', color:'#7c3aed',
    tagline:'Let great results market your school for you',
    offers:['Merit scholarships for toppers','Free doubt-clearing classes','Result-guarantee coaching batch'],
    milestones:[['Strengthen weak subjects','Month 1'],['Launch toppers program','Month 2'],['Publish results & felicitate','Month 3']],
    tasks:[['Identify struggling students (use Exam Insights)','Academics'],['Start extra coaching for weak areas','Academics'],['Reward & spotlight toppers','Motivation'],['Share result highlights publicly','Marketing'],['Conduct regular parent-teacher meetings','Engagement']] },
  { id:'g5', name:'Facilities & Infrastructure', icon:'🏫', color:'#06b6d4',
    tagline:'Upgrade facilities that parents look for',
    offers:['Free transport for 1st year','New computer lab access','Sports coaching included'],
    milestones:[['Audit current facilities','Month 1'],['Add 1-2 key facilities','Month 2-3'],['Promote upgrades','Month 4']],
    tasks:[['Set up/upgrade computer lab','Infra'],['Add or expand transport routes','Transport'],['Improve playground & sports','Sports'],['Create a small library','Academics'],['Showcase facilities on website & visits','Marketing']] },
  { id:'g6', name:'Admission Campaign', icon:'🎯', color:'#ef4444',
    tagline:'A focused drive to fill seats fast',
    offers:['Early-bird: zero admission fee','Free uniform/books on admission','Limited-time fee discount'],
    milestones:[['Plan the campaign','Week 1'],['Launch with offers','Week 2'],['Open house + demo classes','Week 4'],['Close & follow up leads','Week 6']],
    tasks:[['Set admission targets per class','Plan'],['Design early-bird offers','Offers'],['Promote campaign online & locally','Marketing'],['Hold demo/trial classes','Conversion'],['Follow up every enquiry within 24h','Sales']] },
  { id:'g7', name:'Brand & Identity', icon:'✨', color:'#ec4899',
    tagline:'Build a premium, trustworthy school brand',
    offers:['New-look branded uniform','Branded welcome kit','Identity cards for all'],
    milestones:[['Define brand identity','Month 1'],['Roll out new look','Month 2'],['Build reputation/PR','Month 3']],
    tasks:[['Finalize logo, colors & tagline','Brand'],['Standardize uniform & signage','Brand'],['Create branded social templates','Content'],['Get featured in local news/PR','PR'],['Collect & display testimonials','Trust']] },
  { id:'g8', name:'Retention & Satisfaction', icon:'💚', color:'#22c55e',
    tagline:'Keep every student — happy families stay & refer',
    offers:['Loyalty discount for continuing students','Free parent counselling','Sibling fee waiver'],
    milestones:[['Measure parent satisfaction','Month 1'],['Fix top complaints','Month 2'],['Build loyalty program','Month 3']],
    tasks:[['Run a parent feedback survey','Feedback'],['Improve communication (use WhatsApp/SMS)','Comms'],['Resolve recurring complaints','Service'],['Reward long-staying families','Loyalty'],['Celebrate student achievements','Engagement']] },
  { id:'g9', name:'New Programs & Streams', icon:'🚀', color:'#8b5cf6',
    tagline:'Attract more students by offering more',
    offers:['Free trial of new activity classes','Skill course included in fee','Add a new stream/grade'],
    milestones:[['Research demand','Month 1'],['Launch 1-2 new programs','Month 2'],['Promote & enroll','Month 3']],
    tasks:[['Survey what parents want','Research'],['Add activities (music/coding/sports)','Programs'],['Hire/train staff for new programs','Staffing'],['Add a new class/stream if viable','Expansion'],['Market the new offerings','Marketing']] },
  { id:'g10', name:'Partnerships & Tie-ups', icon:'🔗', color:'#0ea5e9',
    tagline:'Grow faster by partnering with others',
    offers:['Tie-up coaching at no extra cost','Free edtech app access','Sports academy partnership'],
    milestones:[['Identify partners','Month 1'],['Sign 1-2 tie-ups','Month 2'],['Promote partnerships','Month 3']],
    tasks:[['List potential local partners','Plan'],['Partner with a coaching/academy','Tie-up'],['Add an edtech/learning app','EdTech'],['Cross-promote with partners','Marketing'],['Track results of each tie-up','Ops']] },
];

// ── Multi-strategy storage (admin can run several strategies at once) ──
let _growthTab='plans', _growthSel=null;   // _growthSel: null=overview, 'gallery'=add, or a plan id
function _growthPlans(){
  let arr=DB.get('growth_plans');
  if(!Array.isArray(arr)) arr=[];
  // migrate old single-plan format
  if(!arr.length){
    const old=DB.getObj('growth_plan');
    if(old && old.templateId && old.milestones){ old.id=old.id||genId('gp'); arr=[old]; DB.set('growth_plans',arr); }
  }
  return arr;
}
function _growthSavePlans(arr){ DB.set('growth_plans', arr); }
function _growthDefault(){ return { id:'', templateId:'', templateName:'', goal:'', targetStudents:'', deadline:'', offers:[], milestones:[], tasks:[] }; }
// _growthGet/_growthSet operate on the SELECTED plan — keeps all edit functions working
function _growthGet(){ const arr=_growthPlans(); return arr.find(p=>p.id===_growthSel) || _growthDefault(); }
function _growthSet(p){ const arr=_growthPlans(); const i=arr.findIndex(x=>x.id===p.id); if(i>-1){arr[i]=p;_growthSavePlans(arr);} }

function renderGrowth(){
  const plans=_growthPlans();
  document.getElementById('section-growth').innerHTML=`
  <div class="page-header"><div><h2>📈 School Growth Plan</h2>
    <p class="page-sub" style="color:var(--text-3);font-size:.82rem;">Run multiple growth strategies, build a mind map & track your roadmap</p></div></div>
  <div class="att-tab-bar">
    <button class="att-tab ${_growthTab==='plans'?'active':''}" onclick="_growthTab='plans';renderGrowth()">📋 Strategies${plans.length?' ('+plans.length+')':''}</button>
    <button class="att-tab ${_growthTab==='mindmap'?'active':''}" onclick="_growthTab='mindmap';renderGrowth()">🧠 Mind Map</button>
  </div>
  <div id="growth-body"></div>`;
  const body=document.getElementById('growth-body');
  if(_growthTab==='mindmap'){ body.innerHTML=_growthMindMap(); return; }
  // Plans tab
  if(_growthSel==='gallery' || (!plans.length && _growthSel===null)){ body.innerHTML=_growthTemplateGallery(plans.length>0); return; }
  if(_growthSel && _growthSel!=='gallery'){
    const p=plans.find(x=>x.id===_growthSel);
    if(!p){ _growthSel=null; renderGrowth(); return; }
    const cur=DB.get('students').filter(s=>s.status!=='alumni').length;
    const tasksDone=p.tasks.filter(t=>t.done).length, msDone=p.milestones.filter(m=>m.status==='done').length;
    const taskPct=p.tasks.length?Math.round(tasksDone/p.tasks.length*100):0;
    const target=Number(p.targetStudents)||0, goalPct=target?Math.min(100,Math.round(cur/target*100)):0;
    body.innerHTML=`
      <div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;">
        <button class="btn btn-sm btn-secondary" onclick="_growthSel=null;renderGrowth()">← All Strategies</button>
        <button class="btn btn-sm btn-danger" onclick="growthRemovePlan('${p.id}')">🗑 Remove this strategy</button>
      </div>
      ${_growthPlanView(p, cur, target, goalPct, taskPct, tasksDone, msDone)}`;
    return;
  }
  body.innerHTML=_growthOverview(plans);
}

function _growthOverview(plans){
  const cur=DB.get('students').filter(s=>s.status!=='alumni').length;
  return `
  <div class="card" style="padding:14px 18px;margin-bottom:16px;border-left:4px solid #10b981;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
    <div><div style="font-weight:700;">🌟 Active Strategies (${plans.length})</div>
      <div style="font-size:.82rem;color:var(--text-2);">Run as many strategies together as you like. Click one to manage its roadmap & tasks.</div></div>
    <button class="btn btn-primary" onclick="_growthSel='gallery';renderGrowth()">➕ Add Strategy</button>
  </div>
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px;">
    ${plans.map(p=>{
      const tmpl=GROWTH_TEMPLATES.find(t=>t.id===p.templateId)||{color:'#7c3aed',icon:'📈'};
      const td=p.tasks.filter(t=>t.done).length, mp=p.milestones.filter(m=>m.status==='done').length;
      const tp=p.tasks.length?Math.round(td/p.tasks.length*100):0;
      return `<div onclick="_growthSel='${p.id}';renderGrowth()" style="cursor:pointer;border-radius:14px;overflow:hidden;border:1px solid var(--border);background:var(--glass);transition:transform .15s,box-shadow .15s;"
        onmouseover="this.style.transform='translateY(-3px)';this.style.boxShadow='0 8px 26px rgba(0,0,0,.3)'" onmouseout="this.style.transform='';this.style.boxShadow=''">
        <div style="height:56px;background:linear-gradient(135deg,${tmpl.color},${tmpl.color}aa);display:flex;align-items:center;gap:10px;padding:0 14px;color:#fff;">
          <span style="font-size:1.4rem;">${tmpl.icon}</span><span style="font-weight:800;font-size:.88rem;line-height:1.1;">${esc(p.templateName)}</span>
        </div>
        <div style="padding:12px 14px;">
          <div style="font-size:.76rem;color:var(--text-3);margin-bottom:6px;">✅ ${td}/${p.tasks.length} tasks · 🚩 ${mp}/${p.milestones.length} milestones</div>
          <div class="progress" style="height:7px;"><div class="progress-bar" style="width:${tp}%;background:${tmpl.color};"></div></div>
        </div>
      </div>`;
    }).join('')}
  </div>`;
}

function _growthTemplateGallery(hasBack){
  return `
  <div class="card" style="padding:16px 20px;margin-bottom:16px;border-left:4px solid #7c3aed;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
    <div><div style="font-weight:700;margin-bottom:4px;">🌱 Choose a Growth Strategy</div>
    <div style="font-size:.84rem;color:var(--text-2);">Pick from 10 ready-made plans — full roadmap + to-do + offers, fully editable. Add as many as you want.</div></div>
    ${hasBack?`<button class="btn btn-secondary" onclick="_growthSel=null;renderGrowth()">← Back</button>`:''}
  </div>
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px;">
    ${GROWTH_TEMPLATES.map(t=>`
      <div onclick="growthApplyTemplate('${t.id}')" style="cursor:pointer;border-radius:14px;overflow:hidden;border:1px solid var(--border);background:var(--glass);transition:transform .15s,box-shadow .15s;"
        onmouseover="this.style.transform='translateY(-3px)';this.style.boxShadow='0 8px 26px rgba(0,0,0,.3)'"
        onmouseout="this.style.transform='';this.style.boxShadow=''">
        <div style="height:64px;background:linear-gradient(135deg,${t.color},${t.color}aa);display:flex;align-items:center;gap:10px;padding:0 16px;color:#fff;">
          <span style="font-size:1.6rem;">${t.icon}</span><span style="font-weight:800;font-size:.92rem;line-height:1.1;">${t.name}</span>
        </div>
        <div style="padding:12px 14px;">
          <div style="font-size:.8rem;color:var(--text-2);line-height:1.5;">${t.tagline}</div>
          <div style="font-size:.7rem;color:${t.color};font-weight:700;margin-top:8px;">${t.milestones.length} milestones · ${t.tasks.length} tasks</div>
        </div>
      </div>`).join('')}
  </div>`;
}

function _growthPlanView(p, cur, target, goalPct, taskPct, tasksDone, msDone){
  const tmpl=GROWTH_TEMPLATES.find(t=>t.id===p.templateId)||{color:'#7c3aed',icon:'📈'};
  // Funnel diagram
  const funnel=[['📣 Awareness','Reach families via marketing & community',tmpl.color],
                ['💡 Interest','Enquiries, calls & website visits','#06b6d4'],
                ['🏫 Visit','Campus tour / demo class','#f59e0b'],
                ['✅ Admission','Enrolled student','#10b981']];
  return `
  <!-- Target + progress -->
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;margin-bottom:18px;">
    <div class="card" style="padding:16px;">
      <div style="font-size:.78rem;color:var(--text-3);">🎯 Strategy</div>
      <div style="font-weight:800;color:${tmpl.color};">${tmpl.icon} ${esc(p.templateName)}</div>
    </div>
    <div class="card" style="padding:16px;">
      <div style="font-size:.78rem;color:var(--text-3);margin-bottom:6px;">📊 Student Target</div>
      <div style="display:flex;align-items:flex-end;gap:6px;"><span style="font-size:1.5rem;font-weight:900;color:#10b981;">${cur}</span><span style="color:var(--text-3);">/ ${target||'—'}</span></div>
      <div class="progress mt-8" style="height:8px;"><div class="progress-bar green" style="width:${goalPct}%"></div></div>
    </div>
    <div class="card" style="padding:16px;">
      <div style="font-size:.78rem;color:var(--text-3);margin-bottom:6px;">✅ Tasks Done</div>
      <div style="font-size:1.5rem;font-weight:900;color:${tmpl.color};">${tasksDone}/${p.tasks.length}</div>
      <div class="progress mt-8" style="height:8px;"><div class="progress-bar" style="width:${taskPct}%;background:${tmpl.color};"></div></div>
    </div>
    <div class="card" style="padding:16px;">
      <div style="font-size:.78rem;color:var(--text-3);margin-bottom:6px;">🚩 Milestones</div>
      <div style="font-size:1.5rem;font-weight:900;color:#f59e0b;">${msDone}/${p.milestones.length}</div>
    </div>
  </div>

  <!-- Goal editor -->
  <div class="card" style="padding:16px 20px;margin-bottom:16px;">
    <div style="font-weight:700;margin-bottom:10px;">🎯 My Goal</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;">
      <div><label class="form-label" style="font-size:.78rem;">Growth Goal</label><input class="form-control" id="gr-goal" value="${esc(p.goal||tmpl.tagline||'')}"></div>
      <div><label class="form-label" style="font-size:.78rem;">Target Students</label><input class="form-control" type="number" id="gr-target" value="${esc(p.targetStudents||'')}" placeholder="e.g. 300"></div>
      <div><label class="form-label" style="font-size:.78rem;">Achieve By</label><input class="form-control" id="gr-deadline" value="${esc(p.deadline||'')}" placeholder="e.g. June 2027"></div>
      <div style="display:flex;align-items:flex-end;"><button class="btn btn-primary" style="width:100%;" onclick="growthSaveGoal()">💾 Save</button></div>
    </div>
  </div>

  <!-- Growth funnel diagram -->
  <div class="card" style="padding:18px 20px;margin-bottom:16px;">
    <div style="font-weight:700;margin-bottom:12px;">🔻 Admission Funnel — how a student joins</div>
    <div style="display:flex;flex-direction:column;align-items:center;gap:6px;">
      ${funnel.map((f,i)=>`
        <div style="width:${100-i*16}%;min-width:200px;background:linear-gradient(135deg,${f[2]},${f[2]}cc);color:#fff;border-radius:10px;padding:12px 16px;text-align:center;">
          <div style="font-weight:800;">${f[0]}</div><div style="font-size:.74rem;opacity:.9;">${f[1]}</div>
        </div>
        ${i<funnel.length-1?'<div style="color:var(--text-3);">▼</div>':''}`).join('')}
    </div>
  </div>

  <!-- Timeline / Roadmap -->
  <div class="card" style="padding:18px 20px;margin-bottom:16px;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
      <div style="font-weight:700;">🗺️ Roadmap / Timeline</div>
      <button class="btn btn-sm btn-secondary" onclick="growthEditMilestone()">➕ Add Milestone</button>
    </div>
    <div style="position:relative;padding-left:24px;">
      <div style="position:absolute;left:7px;top:4px;bottom:4px;width:2px;background:var(--border);"></div>
      ${p.milestones.length?p.milestones.map((m)=>{
        const col=m.status==='done'?'#10b981':m.status==='active'?'#f59e0b':'#64748b';
        const ic=m.status==='done'?'✓':m.status==='active'?'●':'○';
        return `<div style="position:relative;margin-bottom:14px;">
          <div onclick="growthCycleMilestone('${m.id}')" title="Click to change status" style="position:absolute;left:-24px;top:0;width:16px;height:16px;border-radius:50%;background:${col};color:#fff;display:flex;align-items:center;justify-content:center;font-size:10px;cursor:pointer;">${ic}</div>
          <div style="background:var(--glass);border:1px solid var(--border);border-radius:10px;padding:10px 14px;">
            <div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;">
              <div style="font-weight:700;${m.status==='done'?'text-decoration:line-through;opacity:.6;':''}">${esc(m.title)}</div>
              <div style="display:flex;gap:6px;align-items:center;">
                ${m.when?`<span class="badge badge-purple">${esc(m.when)}</span>`:''}
                <span class="badge" style="background:${col}22;color:${col};">${m.status}</span>
                <button class="btn-icon" onclick="growthEditMilestone('${m.id}')">✏️</button>
                <button class="btn-icon" onclick="growthDelMilestone('${m.id}')">🗑️</button>
              </div>
            </div>
            ${m.desc?`<div style="font-size:.8rem;color:var(--text-3);margin-top:4px;">${esc(m.desc)}</div>`:''}
          </div>
        </div>`;
      }).join(''):'<div class="text-muted" style="padding:8px;">No milestones yet — add one.</div>'}
    </div>
  </div>

  <!-- To-Do checklist -->
  <div class="card" style="padding:18px 20px;margin-bottom:16px;">
    <div style="font-weight:700;margin-bottom:12px;">✅ To-Do Action List</div>
    <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;">
      <input class="form-control" id="gr-newtask" placeholder="Add a new action…" style="flex:1;min-width:180px;" onkeydown="if(event.key==='Enter')growthAddTask()">
      <button class="btn btn-primary" onclick="growthAddTask()">➕ Add</button>
    </div>
    ${p.tasks.length?p.tasks.map(t=>`
      <div style="display:flex;align-items:center;gap:10px;padding:9px 4px;border-bottom:1px solid var(--border);">
        <input type="checkbox" ${t.done?'checked':''} onchange="growthToggleTask('${t.id}')" style="width:18px;height:18px;cursor:pointer;">
        <div style="flex:1;${t.done?'text-decoration:line-through;opacity:.55;':''}">${esc(t.text)}${t.category?` <span class="badge badge-gray" style="font-size:.62rem;">${esc(t.category)}</span>`:''}</div>
        <button class="btn-icon" onclick="growthDelTask('${t.id}')">🗑️</button>
      </div>`).join(''):'<div class="text-muted" style="padding:8px;">No tasks yet.</div>'}
  </div>

  <!-- Offers -->
  <div class="card" style="padding:18px 20px;">
    <div style="font-weight:700;margin-bottom:12px;">🎁 Offers to Attract Students</div>
    <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;">
      <input class="form-control" id="gr-newoffer" placeholder="Add an offer / incentive…" style="flex:1;min-width:180px;" onkeydown="if(event.key==='Enter')growthAddOffer()">
      <button class="btn btn-primary" onclick="growthAddOffer()">➕ Add</button>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:8px;">
      ${(p.offers||[]).map((o,i)=>`<span style="background:${tmpl.color}18;border:1px solid ${tmpl.color}44;color:var(--text-1);border-radius:20px;padding:6px 12px;font-size:.82rem;display:inline-flex;align-items:center;gap:8px;">🎁 ${esc(o)} <span style="cursor:pointer;color:#ef4444;font-weight:800;" onclick="growthDelOffer(${i})">✕</span></span>`).join('')||'<div class="text-muted">No offers yet.</div>'}
    </div>
  </div>`;
}

function growthApplyTemplate(id){
  const t=GROWTH_TEMPLATES.find(x=>x.id===id); if(!t) return;
  const p={
    id:genId('gp'), templateId:t.id, templateName:t.name, goal:t.tagline,
    targetStudents:'', deadline:'',
    offers:t.offers.slice(),
    milestones:t.milestones.map((m,i)=>({id:genId('ms'), title:m[0], when:m[1], desc:'', status:i===0?'active':'pending'})),
    tasks:t.tasks.map(tk=>({id:genId('tk'), text:tk[0], category:tk[1]||'', done:false})),
  };
  const arr=_growthPlans(); arr.push(p); _growthSavePlans(arr);
  _growthSel=p.id;
  toast('✅ "'+t.name+'" strategy added — now customize it!','success');
  renderGrowth();
}
function growthRemovePlan(id){
  if(!confirmAction('Remove this strategy? Its roadmap & tasks will be deleted.')) return;
  _growthSavePlans(_growthPlans().filter(p=>p.id!==id));
  _growthSel=null; renderGrowth();
}
function growthSaveGoal(){
  const p=_growthGet();
  p.goal=val('gr-goal'); p.targetStudents=val('gr-target'); p.deadline=val('gr-deadline');
  _growthSet(p); toast('💾 Goal saved','success'); renderGrowth();
}
function growthCycleMilestone(id){
  const p=_growthGet(); const m=p.milestones.find(x=>x.id===id); if(!m) return;
  m.status = m.status==='pending'?'active':m.status==='active'?'done':'pending';
  _growthSet(p); renderGrowth();
}
function growthEditMilestone(id){
  const p=_growthGet();
  const m=id?p.milestones.find(x=>x.id===id):null;
  buildModal('modal-ms', m?'✏️ Edit Milestone':'➕ Add Milestone',`
    <div class="form-group"><label class="form-label">Milestone *</label><input class="form-control" id="ms-title" value="${m?esc(m.title):''}"></div>
    <div class="form-group"><label class="form-label">Timeline label</label><input class="form-control" id="ms-when" placeholder="e.g. Month 1 / Week 2" value="${m?esc(m.when||''):''}"></div>
    <div class="form-group"><label class="form-label">Notes</label><textarea class="form-control" id="ms-desc" rows="2">${m?esc(m.desc||''):''}</textarea></div>
  `, ()=>{
    const title=val('ms-title'); if(!title){toast('Enter a milestone','warning');return;}
    if(m){ m.title=title; m.when=val('ms-when'); m.desc=val('ms-desc'); }
    else p.milestones.push({id:genId('ms'),title,when:val('ms-when'),desc:val('ms-desc'),status:'pending'});
    _growthSet(p); closeAllModals(); renderGrowth();
  });
}
function growthDelMilestone(id){ const p=_growthGet(); p.milestones=p.milestones.filter(x=>x.id!==id); _growthSet(p); renderGrowth(); }
function growthAddTask(){
  const txt=val('gr-newtask').trim(); if(!txt) return;
  const p=_growthGet(); p.tasks.push({id:genId('tk'),text:txt,category:'',done:false}); _growthSet(p); renderGrowth();
}
function growthToggleTask(id){ const p=_growthGet(); const t=p.tasks.find(x=>x.id===id); if(t){t.done=!t.done;_growthSet(p);renderGrowth();} }
function growthDelTask(id){ const p=_growthGet(); p.tasks=p.tasks.filter(x=>x.id!==id); _growthSet(p); renderGrowth(); }
function growthAddOffer(){ const v=val('gr-newoffer').trim(); if(!v) return; const p=_growthGet(); p.offers=p.offers||[]; p.offers.push(v); _growthSet(p); renderGrowth(); }
function growthDelOffer(i){ const p=_growthGet(); p.offers.splice(i,1); _growthSet(p); renderGrowth(); }

// ── Growth Mind Map ──────────────────────────────────
function _mmGet(){ const m=DB.getObj('growth_mindmap'); if(!m||!m.branches) return {center:(getSettings().schoolName||'My School')+' Growth', branches:[]}; return m; }
function _mmSet(m){ DB.set('growth_mindmap', m); }

function _growthMindMap(){
  const m=_mmGet();
  return `
  <div class="card" style="padding:16px 20px;margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
    <div><div style="font-weight:700;">🧠 Growth Mind Map</div>
      <div style="font-size:.82rem;color:var(--text-2);">Brainstorm visually — a central goal with branches & sub-ideas. Fully editable.</div></div>
    <button class="btn btn-primary" onclick="mmAddBranch()">➕ Add Branch</button>
  </div>
  <div class="card" style="padding:24px 16px;overflow-x:auto;">
    <div style="display:flex;flex-direction:column;align-items:center;min-width:min-content;">
      <div onclick="mmSetCenter()" title="Click to edit central goal" style="cursor:pointer;background:linear-gradient(135deg,#7c3aed,#3b82f6);color:#fff;font-weight:800;padding:16px 30px;border-radius:40px;font-size:1.1rem;box-shadow:0 6px 22px rgba(124,58,237,.4);text-align:center;max-width:340px;">${esc(m.center)} ✏️</div>
      ${m.branches.length?'<div style="width:2px;height:22px;background:var(--border);"></div>':''}
      <div style="display:flex;gap:18px;flex-wrap:wrap;justify-content:center;align-items:flex-start;">
        ${m.branches.map((b,bi)=>{ const col=b.color||DASH_PAL[bi%DASH_PAL.length]; return `
          <div style="display:flex;flex-direction:column;align-items:center;">
            <div style="width:2px;height:14px;background:${col};"></div>
            <div style="min-width:190px;max-width:240px;border:2px solid ${col};border-radius:14px;overflow:hidden;background:var(--glass);">
              <div style="background:${col};color:#fff;padding:8px 12px;font-weight:700;display:flex;justify-content:space-between;align-items:center;gap:6px;">
                <span>${esc(b.text)}</span>
                <span style="display:flex;gap:6px;flex-shrink:0;">
                  <span style="cursor:pointer;" onclick="mmEditBranch('${b.id}')">✏️</span>
                  <span style="cursor:pointer;" onclick="mmDelBranch('${b.id}')">🗑️</span></span>
              </div>
              <div style="padding:10px 12px;">
                ${(b.children||[]).map(ch=>`<div style="display:flex;justify-content:space-between;gap:6px;align-items:center;font-size:.84rem;padding:4px 0;border-bottom:1px solid var(--border);">
                  <span>• ${esc(ch.text)}</span><span style="cursor:pointer;color:#ef4444;font-weight:800;" onclick="mmDelIdea('${b.id}','${ch.id}')">✕</span></div>`).join('')||'<div style="font-size:.74rem;color:var(--text-3);">No ideas yet</div>'}
                <div style="display:flex;gap:4px;margin-top:8px;">
                  <input class="form-control" id="mm-idea-${b.id}" placeholder="Add idea…" style="font-size:.8rem;padding:6px 8px;" onkeydown="if(event.key==='Enter')mmAddIdea('${b.id}')">
                  <button class="btn btn-sm" style="background:${col};color:#fff;border:none;" onclick="mmAddIdea('${b.id}')">+</button>
                </div>
              </div>
            </div>
          </div>`; }).join('')}
      </div>
      ${!m.branches.length?'<div class="text-muted" style="margin-top:16px;">No branches yet — click "➕ Add Branch" to start your mind map.</div>':''}
    </div>
  </div>`;
}
function mmSetCenter(){
  const m=_mmGet();
  buildModal('mm-center','✏️ Central Goal',`<div class="form-group"><label class="form-label">Central goal</label><input class="form-control" id="mm-c" value="${esc(m.center)}"></div>`,
    ()=>{ const v=val('mm-c'); if(v) m.center=v; _mmSet(m); closeAllModals(); renderGrowth(); });
}
function mmAddBranch(){
  const m=_mmGet();
  buildModal('mm-branch','➕ Add Branch',`<div class="form-group"><label class="form-label">Branch / theme</label><input class="form-control" id="mm-b" placeholder="e.g. Marketing, Academics, Facilities"></div>`,
    ()=>{ const t=val('mm-b'); if(!t){toast('Enter a name','warning');return;} m.branches=m.branches||[]; m.branches.push({id:genId('br'),text:t,color:DASH_PAL[m.branches.length%DASH_PAL.length],children:[]}); _mmSet(m); closeAllModals(); renderGrowth(); });
}
function mmEditBranch(id){
  const m=_mmGet(); const b=m.branches.find(x=>x.id===id); if(!b) return;
  buildModal('mm-branch','✏️ Edit Branch',`<div class="form-group"><label class="form-label">Branch / theme</label><input class="form-control" id="mm-b" value="${esc(b.text)}"></div>`,
    ()=>{ const t=val('mm-b'); if(t) b.text=t; _mmSet(m); closeAllModals(); renderGrowth(); });
}
function mmDelBranch(id){ if(!confirmAction('Delete this branch and its ideas?')) return; const m=_mmGet(); m.branches=m.branches.filter(x=>x.id!==id); _mmSet(m); renderGrowth(); }
function mmAddIdea(bid){
  const el=document.getElementById('mm-idea-'+bid); const t=el?el.value.trim():''; if(!t) return;
  const m=_mmGet(); const b=m.branches.find(x=>x.id===bid); if(!b) return;
  b.children=b.children||[]; b.children.push({id:genId('id'),text:t}); _mmSet(m); renderGrowth();
}
function mmDelIdea(bid,cid){ const m=_mmGet(); const b=m.branches.find(x=>x.id===bid); if(b){ b.children=(b.children||[]).filter(c=>c.id!==cid); _mmSet(m); renderGrowth(); } }

// ══════════════════════════════════════════════════════
//  CUSTOMIZE SIDEBAR MENU (show/hide + pin favorites)
// ══════════════════════════════════════════════════════
function _allNavItems(){
  return Array.from(document.querySelectorAll('.sidebar-nav .nav-item[data-section]'))
    .filter(n => !n.closest('#navFav'));
}
function _hideEmptyNavLabels(){
  document.querySelectorAll('.sidebar-nav .nav-section-label').forEach(label=>{
    if(label.closest('#navFavWrap')) return;
    let sib=label.nextElementSibling, hasVisible=false;
    while(sib && !sib.classList.contains('nav-section-label')){
      if(sib.classList.contains('nav-item') && sib.style.display!=='none'){ hasVisible=true; break; }
      sib=sib.nextElementSibling;
    }
    label.style.display=hasVisible?'':'none';
  });
}
function applySidebarPrefs(){
  const nav=document.querySelector('.sidebar-nav'); if(!nav) return;
  // Capture feature-locked (super-admin disabled) items once, so we never re-show them
  if(!window._featLockedSet){
    window._featLockedSet=new Set();
    _allNavItems().forEach(n=>{ if(n.style.display==='none') window._featLockedSet.add(n.dataset.section); });
  }
  const locked=window._featLockedSet;
  const prefs=DB.getObj('sidebar_prefs'); const hidden=prefs.hidden||[]; const pinned=prefs.pinned||[];

  const oldFav=document.getElementById('navFavWrap'); if(oldFav) oldFav.remove();

  _allNavItems().forEach(n=>{
    const sec=n.dataset.section;
    if(locked.has(sec)) return;                 // leave disabled features hidden
    n.style.display=(hidden.includes(sec)||pinned.includes(sec))?'none':'';
  });

  if(pinned.length){
    const wrap=document.createElement('div'); wrap.id='navFavWrap';
    const lbl=document.createElement('div'); lbl.className='nav-section-label'; lbl.textContent='⭐ Favorites'; wrap.appendChild(lbl);
    const fav=document.createElement('div'); fav.id='navFav'; wrap.appendChild(fav);
    pinned.forEach(sec=>{
      if(locked.has(sec)) return;
      const orig=_allNavItems().find(n=>n.dataset.section===sec); if(!orig) return;
      const clone=orig.cloneNode(true); clone.style.display=''; clone.classList.remove('active');
      clone.addEventListener('click',()=>activateNav(sec));
      fav.appendChild(clone);
    });
    const cust=document.getElementById('navCustomizeBtn');
    if(cust) nav.insertBefore(wrap, cust.nextSibling); else nav.insertBefore(wrap, nav.firstChild);
  }
  _hideEmptyNavLabels();
}
function openSidebarCustomize(){
  const prefs=DB.getObj('sidebar_prefs'); const hidden=prefs.hidden||[]; const pinned=prefs.pinned||[];
  const locked=window._featLockedSet||new Set();
  const items=_allNavItems().filter(n=>!locked.has(n.dataset.section)).map(n=>({
    sec:n.dataset.section,
    icon:((n.querySelector('.nav-icon')||{}).textContent)||'•',
    label:((n.querySelector('.nav-label')||{}).textContent)||n.dataset.section
  }));
  const rows=items.map(it=>{
    const lock=(it.sec==='dashboard');
    return `<div style="display:flex;align-items:center;gap:10px;padding:8px 10px;border:1px solid var(--border);border-radius:10px;margin-bottom:6px;">
      <span style="font-size:1.1rem;">${it.icon}</span>
      <span style="flex:1;font-weight:600;font-size:.88rem;">${esc(it.label)}</span>
      <label style="display:flex;align-items:center;gap:4px;font-size:.76rem;cursor:pointer;"><input type="checkbox" data-show="${it.sec}" ${hidden.includes(it.sec)?'':'checked'} ${lock?'disabled':''}> Show</label>
      <label style="display:flex;align-items:center;gap:3px;font-size:.76rem;cursor:pointer;" title="Pin to top">⭐<input type="checkbox" data-pin="${it.sec}" ${pinned.includes(it.sec)?'checked':''}></label>
    </div>`;
  }).join('');
  buildModal('modal-sidebar','🎚️ Customize Menu',`
    <p style="font-size:.82rem;color:var(--text-3);margin-bottom:12px;">Hide features you don't use to keep the menu simple, and ⭐ pin your favorites to the top for quick access.</p>
    <div style="display:flex;gap:8px;margin-bottom:10px;">
      <button class="btn btn-sm btn-secondary" onclick="document.querySelectorAll('#modal-sidebar [data-show]:not(:disabled)').forEach(c=>c.checked=true)">👁 Show all</button>
      <button class="btn btn-sm btn-secondary" onclick="document.querySelectorAll('#modal-sidebar [data-pin]').forEach(c=>c.checked=false)">✖ Clear pins</button>
    </div>
    <div style="max-height:52vh;overflow-y:auto;">${rows}</div>
  `, saveSidebarCustomize, 'modal-lg');
}
function saveSidebarCustomize(){
  const hidden=[], pinned=[];
  document.querySelectorAll('#modal-sidebar [data-show]').forEach(c=>{ if(!c.checked) hidden.push(c.dataset.show); });
  document.querySelectorAll('#modal-sidebar [data-pin]').forEach(c=>{ if(c.checked) pinned.push(c.dataset.pin); });
  DB.set('sidebar_prefs',{hidden,pinned});
  closeAllModals(); applySidebarPrefs(); toast('✅ Menu customized','success');
}
function _setupSidebarCustomize(){
  // Customize Menu now lives inside Settings — here we only apply saved prefs.
  applySidebarPrefs();
}
_setupSidebarCustomize();

activateNav('dashboard');
