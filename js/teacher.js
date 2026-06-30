// teacher.js — Teacher Panel
const CU = requireAuth('teacher');
const PERMS = getTeacherPermsFor(CU.id);

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

const $ = id => document.getElementById(id);
const val = id => { const e=$(id); return e?e.value.trim():''; };

function myClasses()  { return DB.get('classes').filter(c=>c.teacherId===CU.id||(c.subjects||[]).some(s=>s.teacherId===CU.id)); }
function myClassIds() { return myClasses().map(c=>c.id); }

// Chart registry — destroy before re-creating to avoid canvas reuse errors
const _charts = {};
function mkChart(id, cfg) {
  if (_charts[id]) { _charts[id].destroy(); delete _charts[id]; }
  const el = $(id); if (!el || !window.Chart) return;
  _charts[id] = new Chart(el, cfg);
}
const CH = {
  grid:   'rgba(148,163,184,0.1)',
  tick:   '#94a3b8',
  legend: '#94a3b8',
  pal:    ['#7c3aed','#06b6d4','#10b981','#f59e0b','#ef4444','#f97316','#3b82f6','#8b5cf6'],
};
function chartScales(yStep) {
  return {
    x:{ ticks:{color:CH.tick}, grid:{display:false} },
    y:{ ticks:{color:CH.tick, stepSize:yStep||1}, grid:{color:CH.grid} }
  };
}

// ── Hide restricted nav items ─────────────────────────────────────────────────
(function applyPermNav(){
  ['attendance','homework','timetable','exams','materials','qpapers','notices','leaves','leaderboard','fees','accounts'].forEach(s=>{
    if(!PERMS[s]){ const el=document.querySelector(`.nav-item[data-section="${s}"]`); if(el) el.style.display='none'; }
  });
})();

// ── Build section containers (no inline display — activateNav handles visibility) ──
(function buildSections(){
  ['dashboard','profile','attendance','homework','timetable','exams',
   'materials','qpapers','questionbank','papercreator','tasks','salary','idcard','messages','notices','leaves','leaderboard','gallery','fees','accounts','assignments'].forEach(id=>{
    const d=document.createElement('div');
    d.id='section-'+id; d.className='section-content';
    $('pageBody').appendChild(d);
  });
})();

function renderRestricted(key){
  $('section-'+key).innerHTML=`<div class="glass-card" style="text-align:center;padding:60px 20px">
    <div style="font-size:48px;margin-bottom:16px">🔒</div>
    <h3 style="color:var(--red)">Access Restricted</h3>
    <p style="color:var(--text-muted);margin-top:8px">Admin has disabled your access to this feature.</p>
  </div>`;
}

window._sectionRenderers = {
  dashboard:   renderDashboard,
  profile:     renderProfile,
  attendance:  ()=>PERMS.attendance  ?renderAttendance() :renderRestricted('attendance'),
  homework:    ()=>PERMS.homework    ?renderHomework()   :renderRestricted('homework'),
  timetable:   ()=>PERMS.timetable   ?renderTimetable()  :renderRestricted('timetable'),
  exams:       ()=>PERMS.exams       ?renderExams()      :renderRestricted('exams'),
  materials:   ()=>PERMS.materials   ?renderMaterials()  :renderRestricted('materials'),
  qpapers:     ()=>PERMS.qpapers     ?renderQPapers()    :renderRestricted('qpapers'),
  notices:     ()=>PERMS.notices     ?renderNotices()    :renderRestricted('notices'),
  leaves:      ()=>PERMS.leaves      ?renderLeaves()     :renderRestricted('leaves'),
  leaderboard:  ()=>PERMS.leaderboard ?renderLeaderboard():renderRestricted('leaderboard'),
  gallery:      renderGallery,
  questionbank:  renderTeacherQuestionBank,
  papercreator:  renderPaperCreator,
  tasks:         renderMyTasks,
  salary:      renderMySalary,
  idcard:      renderIDCardGenerator,
  messages:    renderTeacherMessages,
  fees:        ()=>PERMS.fees     ? renderTeacherFees()     : renderRestricted('fees'),
  accounts:     ()=>PERMS.accounts ? renderTeacherAccounts() : renderRestricted('accounts'),
  assignments:  renderAssignments,
};

(function initTeacherInfo(){
  const t=DB.find('teachers',CU.id); if(!t) return;
  const n=$('teacherName'); if(n) n.textContent=t.name;
  const s=$('teacherSubject'); if(s) s.textContent=t.subject||'Teacher';
  const a=$('teacherAvatar'); if(a) a.textContent=(t.name||'T')[0].toUpperCase();
})();

// ═════════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ═════════════════════════════════════════════════════════════════════════════
function renderDashboard(){
  const mc=myClasses(), ids=mc.map(c=>c.id);
  const students=DB.get('students').filter(s=>ids.includes(s.classId));
  const attAll=DB.get('attendance').filter(a=>ids.includes(a.classId));
  const attToday=attAll.filter(a=>a.date===today());
  const hw=DB.get('homework').filter(h=>h.teacherId===CU.id);
  const t=DB.find('teachers',CU.id)||{};

  const todayP =attToday.filter(a=>a.status==='present').length;
  const todayAb=attToday.filter(a=>a.status==='absent').length;
  const todayLt=attToday.filter(a=>a.status==='late').length;
  const todayUn=students.length-attToday.length;

  // Last 7 days trend
  const last7=[];
  for(let i=6;i>=0;i--){
    const d=new Date(); d.setDate(d.getDate()-i);
    const ds=d.toISOString().split('T')[0];
    const recs=attAll.filter(a=>a.date===ds);
    last7.push({label:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()],
      p:recs.filter(a=>a.status==='present').length,
      ab:recs.filter(a=>a.status==='absent').length});
  }

  const tSettings=getSettings();
  $('section-dashboard').innerHTML=`
    <div class="section-header" style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px;">
      <div>
        <h2 class="section-title">Dashboard</h2>
        <p class="section-subtitle">Welcome back, ${t.name||'Teacher'}! 👋</p>
      </div>
      ${tSettings.academicYear?`<span style="background:linear-gradient(135deg,rgba(124,58,237,.2),rgba(124,58,237,.08));color:#a78bfa;border:1px solid rgba(124,58,237,.25);border-radius:20px;padding:5px 14px;font-size:12px;font-weight:700;">📅 Session ${tSettings.academicYear}</span>`:''}
    </div>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-icon" style="background:linear-gradient(135deg,#7c3aed,#3b82f6)">🏫</div><div class="stat-info"><div class="stat-value">${mc.length}</div><div class="stat-label">My Classes</div></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:linear-gradient(135deg,#06b6d4,#10b981)">👨‍🎓</div><div class="stat-info"><div class="stat-value">${students.length}</div><div class="stat-label">My Students</div></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:linear-gradient(135deg,#10b981,#06b6d4)">✅</div><div class="stat-info"><div class="stat-value">${todayP}</div><div class="stat-label">Present Today</div></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:linear-gradient(135deg,#f59e0b,#f97316)">📚</div><div class="stat-info"><div class="stat-value">${hw.length}</div><div class="stat-label">Homework Given</div></div></div>
    </div>

    <div class="grid-2" style="margin-top:24px">
      <div class="glass-card">
        <h3 class="card-title">📊 Today's Attendance</h3>
        <div style="position:relative;height:200px"><canvas id="tChAtt"></canvas></div>
        <div style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap;margin-top:12px;font-size:12px">
          <span style="color:#10b981">● Present (${todayP})</span>
          <span style="color:#ef4444">● Absent (${todayAb})</span>
          <span style="color:#f59e0b">● Late (${todayLt})</span>
          <span style="color:#6b7280">● Unmarked (${todayUn})</span>
        </div>
      </div>
      <div class="glass-card">
        <h3 class="card-title">📈 7-Day Attendance Trend</h3>
        <div style="position:relative;height:230px"><canvas id="tChWeek"></canvas></div>
      </div>
    </div>

    <div class="grid-2" style="margin-top:24px">
      <div class="glass-card">
        <h3 class="card-title">🏫 Students per Class</h3>
        ${mc.length
          ? `<div style="position:relative;height:180px"><canvas id="tChClass"></canvas></div>`
          : '<p class="text-muted">No classes assigned.</p>'}
      </div>
      <div class="glass-card">
        <h3 class="card-title">📚 Recent Homework</h3>
        ${hw.slice(-5).reverse().map(h=>`
          <div class="list-item">
            <div>
              <div style="font-weight:600">${h.subject}</div>
              <div style="color:var(--text-muted);font-size:12px">${h.dueDate} · ${DB.find('classes',h.classId)?.name||h.classId}</div>
            </div>
            <span class="badge ${h.dueDate<today()?'badge-red':'badge-green'}">${h.dueDate<today()?'Overdue':'Active'}</span>
          </div>`).join('')||'<p class="text-muted">No homework assigned.</p>'}
      </div>
    </div>`;

  mkChart('tChAtt',{type:'doughnut',data:{
    labels:['Present','Absent','Late','Unmarked'],
    datasets:[{data:[todayP,todayAb,todayLt,todayUn],
      backgroundColor:['#10b981','#ef4444','#f59e0b','rgba(107,114,128,0.4)'],
      borderWidth:0,hoverOffset:8}]
  },options:{responsive:true,maintainAspectRatio:false,
    plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>`${c.label}: ${c.raw}`}}}}});

  mkChart('tChWeek',{type:'bar',data:{
    labels:last7.map(d=>d.label),
    datasets:[
      {label:'Present',data:last7.map(d=>d.p),backgroundColor:'rgba(16,185,129,0.85)',borderRadius:6,borderSkipped:false},
      {label:'Absent', data:last7.map(d=>d.ab),backgroundColor:'rgba(239,68,68,0.75)',borderRadius:6,borderSkipped:false}
    ]
  },options:{responsive:true,maintainAspectRatio:false,
    plugins:{legend:{labels:{color:CH.legend}}},scales:chartScales(1)}});

  if(mc.length) mkChart('tChClass',{type:'bar',data:{
    labels:mc.map(c=>c.name),
    datasets:[{label:'Students',
      data:mc.map(c=>DB.get('students').filter(s=>s.classId===c.id).length),
      backgroundColor:CH.pal,borderRadius:8,borderWidth:0}]
  },options:{responsive:true,maintainAspectRatio:false,
    plugins:{legend:{display:false}},scales:chartScales(1)}});
}

// ═════════════════════════════════════════════════════════════════════════════
// PROFILE
// ═════════════════════════════════════════════════════════════════════════════
function renderProfile(){
  const t=DB.find('teachers',CU.id)||{};
  $('section-profile').innerHTML=`
    <div class="section-header"><h2 class="section-title">My Profile</h2></div>
    <div class="glass-card" style="max-width:600px">
      <div style="display:flex;gap:20px;align-items:center;margin-bottom:24px">
        <div style="width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,var(--purple),var(--cyan));display:flex;align-items:center;justify-content:center;color:#fff;font-size:28px;font-weight:700">${(t.name||'T')[0].toUpperCase()}</div>
        <div><h3>${t.name||'Teacher'}</h3><p style="color:var(--text-muted)">${t.subject||''} Teacher</p></div>
      </div>
      <div class="form-grid">
        <div class="form-group"><label class="form-label">Full Name</label><input class="form-control" id="pName" value="${t.name||''}"></div>
        <div class="form-group"><label class="form-label">Subject</label><input class="form-control" id="pSubject" value="${t.subject||''}"></div>
        <div class="form-group"><label class="form-label">Email</label><input class="form-control" type="email" inputmode="email" id="pEmail" value="${t.email||''}"></div>
        <div class="form-group"><label class="form-label">Phone</label><input class="form-control" type="tel" inputmode="tel" id="pPhone" value="${t.phone||''}"></div>
        <div class="form-group"><label class="form-label">Qualification</label><input class="form-control" id="pQual" value="${t.qualification||''}"></div>
        <div class="form-group"><label class="form-label">New Password</label><input class="form-control" id="pPass" type="password" placeholder="Leave blank to keep"></div>
      </div>
      <button class="btn btn-primary mt-8" onclick="saveProfile()">💾 Save Profile</button>
    </div>
    <div class="glass-card" style="max-width:600px;margin-top:16px;">
      <h3 class="card-title">🙂 Face Attendance</h3>
      <p style="color:var(--text-muted);font-size:.85rem;margin-bottom:12px;">Register your face once to mark your own attendance touch-free, and to enable the face scanner for your class.</p>
      <button class="btn ${(typeof faceIsEnrolled==='function'&&faceIsEnrolled(CU.id))?'btn-secondary':'btn-primary'}" onclick="faceOpenEnroll(CU.id,'teacher',(DB.find('teachers',CU.id)||{}).name||'Teacher','')">
        ${(typeof faceIsEnrolled==='function'&&faceIsEnrolled(CU.id))?'🔄 Re-register My Face':'🙂 Register My Face'}
      </button>
    </div>
    <div class="glass-card" style="max-width:600px;margin-top:16px;">
      <h3 class="card-title">📍 Geofencing Attendance</h3>
      <p style="color:var(--text-muted);font-size:.85rem;margin-bottom:10px;">Get auto-marked Present when you reach the school. Tap below while you are on campus.</p>
      <div id="geoBanner"></div>
      <button class="btn btn-primary" onclick="geoMarkTeacherIfInside({auto:false})">📍 Mark My Attendance by Location</button>
    </div>
    <div class="glass-card" style="max-width:600px;margin-top:16px;">
      <h3 class="card-title">🌐 Language / भाषा</h3>
      <p style="color:var(--text-muted);font-size:.85rem;margin-bottom:10px;">Choose your display language.</p>
      ${typeof langSelectorHtml==='function'?langSelectorHtml():''}
    </div>`;
  // Auto-check on profile open (once per session) if geofence enabled
  try{
    if(typeof geoFence==='function' && geoFence().enabled && !window._geoAutoChecked){
      window._geoAutoChecked=true;
      setTimeout(()=>geoMarkTeacherIfInside({auto:true}), 600);
    }
  }catch(e){}
}
function saveProfile(){
  const t=DB.find('teachers',CU.id)||{};
  DB.update('teachers',CU.id,{...t,name:val('pName'),subject:val('pSubject'),email:val('pEmail'),phone:val('pPhone'),qualification:val('pQual')});
  const np=val('pPass');
  if(np){const u=DB.getObj('users');if(u[CU.id]){u[CU.id].password=np;DB.set('users',u);}}
  const n=$('teacherName'); if(n) n.textContent=val('pName');
  const a=$('teacherAvatar'); if(a) a.textContent=(val('pName')||'T')[0].toUpperCase();
  toast('Profile updated!','success');
}

// ═════════════════════════════════════════════════════════════════════════════
// ATTENDANCE
// ═════════════════════════════════════════════════════════════════════════════
let _att={classId:'',date:today(),marks:{},search:'',tab:'mark',qrScanned:{}};

function renderAttendance(){
  const classes=myClasses();
  if(!_att.classId&&classes.length) _att.classId=classes[0].id;
  if(!_att.editDate) _att.editDate=today();
  const showSave=_att.tab==='mark';

  $('section-attendance').innerHTML=`
    <div class="section-header">
      <h2 class="section-title">📋 Attendance</h2>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-sm" style="background:#10b981;color:#fff;border:none;" onclick="faceOpenScanner({mode:'student',classId:_att.classId,date:_att.date,title:(DB.find('classes',_att.classId)||{}).name||''})">📷 Face</button>
        <button class="btn btn-sm btn-secondary" onclick="printTchAttSheet()">🖨️ Print</button>
        ${showSave?`<button class="btn btn-sm btn-success" onclick="saveAttendance()">💾 Save</button>`:''}
      </div>
    </div>

    <!-- Tab switcher — same tabs as admin -->
    <div class="att-tab-bar">
      <button class="att-tab ${_att.tab==='mark'?'active':''}"    onclick="_att.tab='mark';renderAttendance()">✏️ Mark Today</button>
      <button class="att-tab ${_att.tab==='qrscan'?'active':''}"  onclick="_att.tab='qrscan';if(!_att.qrScanned)_att.qrScanned={};renderAttendance()">📷 QR Scan</button>
      <button class="att-tab ${_att.tab==='edit'?'active':''}"    onclick="_att.tab='edit';renderAttendance()">🖊️ Edit Past</button>
      <button class="att-tab ${_att.tab==='report'?'active':''}"  onclick="_att.tab='report';renderAttendance()">📊 Class Report</button>
      <button class="att-tab ${_att.tab==='student'?'active':''}" onclick="_att.tab='student';renderAttendance()">👤 Student Report</button>
    </div>

    <!-- Filters row (hidden in qrscan — it has its own) -->
    ${_att.tab!=='qrscan'?`
    <div class="d-flex gap-10 mb-16" style="flex-wrap:wrap;align-items:center;display:flex;gap:10px;margin-bottom:16px;">
      <select class="form-control" style="min-width:160px;flex:1;max-width:220px"
        onchange="_att.classId=this.value;_att.marks={};renderAttendance()">
        ${classes.map(c=>`<option value="${c.id}" ${c.id===_att.classId?'selected':''}>${c.name}</option>`).join('')}
      </select>
      ${_att.tab==='mark'||_att.tab==='edit'?`
      <input type="date" class="form-control" style="min-width:155px;flex:1;max-width:200px"
        value="${_att.tab==='edit'?_att.editDate:_att.date}"
        onchange="${_att.tab==='edit'?'_att.editDate':'_att.date'}=this.value;${_att.tab==='mark'?'_att.marks={};':''}renderAttendance()">
      `:``}
      <div class="search-box" style="flex:2;min-width:180px;max-width:280px">
        <span class="s-icon">🔍</span>
        <input placeholder="Search student…" value="${_att.search||''}"
          oninput="_att.search=this.value;_renderTchAttBody()">
      </div>
    </div>`:''}
    <div id="tch-att-body"></div>
  `;
  _renderTchAttBody();
}

function _renderTchAttBody(){
  const el=document.getElementById('tch-att-body');
  if(!el) return;
  if      (_att.tab==='mark')    el.innerHTML=_tchBuildMarkTab();
  else if (_att.tab==='qrscan')  el.innerHTML=_buildTchQRScanTab(myClasses());
  else if (_att.tab==='edit')    el.innerHTML=_tchBuildEditTab();
  else if (_att.tab==='report')  el.innerHTML=_tchBuildReportTab();
  else                           el.innerHTML=_tchBuildStudentReportTab();
}

/* ── MARK TODAY — list format, same as admin ── */
function _tchBuildMarkTab(){
  const allStudents=DB.get('students').filter(s=>s.classId===_att.classId);
  const search=(_att.search||'').toLowerCase();
  const students=search?allStudents.filter(s=>s.name.toLowerCase().includes(search)||String(s.rollNo).includes(search)):allStudents;
  const saved=DB.get('attendance').filter(a=>a.classId===_att.classId&&a.date===_att.date);
  const savedMap={};
  saved.forEach(a=>{ savedMap[a.studentId]=a.status; if(!_att.marks[a.studentId]) _att.marks[a.studentId]=a.status; });

  let p=0,ab=0,l=0,u=0;
  allStudents.forEach(s=>{
    const st=_att.marks[s.id]||savedMap[s.id]||'';
    if(st==='present')p++; else if(st==='absent')ab++; else if(st==='late')l++; else u++;
  });
  const pct=Math.round(p/(allStudents.length||1)*100);

  return `
  <div class="att-stats-strip">
    <div class="att-stat-chip green"><span class="stat-num" id="tatt-p">${p}</span><span class="stat-lbl">✅ Present</span></div>
    <div class="att-stat-chip red">  <span class="stat-num" id="tatt-a">${ab}</span><span class="stat-lbl">❌ Absent</span></div>
    <div class="att-stat-chip yellow"><span class="stat-num" id="tatt-l">${l}</span><span class="stat-lbl">🕐 Late</span></div>
    <div class="att-stat-chip blue"> <span class="stat-num" id="tatt-u">${u}</span><span class="stat-lbl">⬜ Unmarked</span></div>
    <div class="att-stat-chip purple"><span class="stat-num" id="tatt-pct">${pct}%</span><span class="stat-lbl">📈 Rate</span></div>
  </div>
  <div class="att-bulk-bar">
    <span style="font-weight:600;font-size:.85rem;color:var(--text2);">Mark All:</span>
    <button class="btn btn-sm btn-success" onclick="markAll('present')">✅ Present</button>
    <button class="btn btn-sm btn-danger"  onclick="markAll('absent')">❌ Absent</button>
    <button class="btn btn-sm" style="background:rgba(245,158,11,.15);color:var(--yellow);border:1px solid rgba(245,158,11,.3);" onclick="markAll('late')">🕐 Late</button>
    <button class="btn btn-sm btn-secondary" onclick="tchMarkUnmarkedAbsent()" style="margin-left:auto;">⚠️ Mark Unmarked → Absent</button>
  </div>
  <!-- List view — same style as admin attendance -->
  <div style="display:flex;flex-direction:column;gap:8px;" id="tattList">
    ${students.length ? students.map((s,i)=>{
      const st=_att.marks[s.id]||savedMap[s.id]||'';
      return `<div class="tatt-card ${st}" id="tatt-${s.id}">
        <div style="width:32px;text-align:center;font-size:.75rem;color:var(--text2);flex-shrink:0;">${s.rollNo||i+1}</div>
        <div class="att-card-avatar" style="width:38px;height:38px;font-size:.9rem;flex-shrink:0;">${(s.name||'S')[0].toUpperCase()}</div>
        <div class="tatt-card-info">
          <div class="tatt-card-name">${s.name}</div>
          <div class="tatt-card-sub">${DB.find('classes',s.classId)?.name||''}</div>
        </div>
        <div class="tatt-card-btns">
          <button class="tatt-btn p ${st==='present'?'active-p':''}" onclick="tchSetAtt('${s.id}','present')">✅ P</button>
          <button class="tatt-btn a ${st==='absent'?'active-a':''}"  onclick="tchSetAtt('${s.id}','absent')">❌ A</button>
          <button class="tatt-btn l ${st==='late'?'active-l':''}"    onclick="tchSetAtt('${s.id}','late')">🕐 L</button>
        </div>
      </div>`;
    }).join('') : '<div class="empty-state"><div class="e-icon">👨‍🎓</div><p>No students found</p></div>'}
  </div>`;
}

/* ── EDIT PAST ATTENDANCE — same as admin ── */
function _tchBuildEditTab(){
  const allStudents=DB.get('students').filter(s=>s.classId===_att.classId);
  const search=(_att.search||'').toLowerCase();
  const students=search?allStudents.filter(s=>s.name.toLowerCase().includes(search)||String(s.rollNo).includes(search)):allStudents;
  const saved=DB.get('attendance').filter(a=>a.classId===_att.classId&&a.date===_att.editDate);
  const savedMap={};
  saved.forEach(a=>{ savedMap[a.studentId]=a.status; });

  if(!_att._editMarks) _att._editMarks={};
  if(!_att._editMarks[_att.editDate]){
    _att._editMarks[_att.editDate]={};
    saved.forEach(a=>{ _att._editMarks[_att.editDate][a.studentId]=a.status; });
  }
  const editMarks=_att._editMarks[_att.editDate]||{};
  const hasSaved=saved.length>0;
  let p=0,ab=0,l=0;
  students.forEach(s=>{ const st=editMarks[s.id]||savedMap[s.id]||''; if(st==='present')p++; else if(st==='absent')ab++; else if(st==='late')l++; });

  return `
  <div class="glass-card mb-12" style="padding:14px 18px;border-left:3px solid ${hasSaved?'var(--green)':'var(--yellow)'};margin-bottom:12px;">
    <div style="display:flex;align-items:center;gap:12px;">
      <div style="font-size:1.4rem">${hasSaved?'✅':'⚠️'}</div>
      <div>
        <div style="font-weight:600;">${hasSaved?`Attendance found for ${formatDate(_att.editDate)}`:`No attendance saved for ${formatDate(_att.editDate)}`}</div>
        <div style="font-size:.78rem;color:var(--text2);">${hasSaved?`${p} Present · ${ab} Absent · ${l} Late — Edit and save changes`:'Select a different date or mark attendance from "Mark Today" tab'}</div>
      </div>
      ${hasSaved?`<button class="btn btn-sm btn-success" style="margin-left:auto;" onclick="saveTchEditedAtt()">💾 Save Changes</button>`:''}
    </div>
  </div>
  <div style="display:flex;flex-direction:column;gap:8px;">
    ${students.length ? students.map((s,i)=>{
      const st=editMarks[s.id]||savedMap[s.id]||'';
      return `<div class="tatt-card ${st}" id="tedit-att-${s.id}">
        <div style="width:32px;text-align:center;font-size:.75rem;color:var(--text2);flex-shrink:0;">${s.rollNo||i+1}</div>
        <div class="att-card-avatar" style="width:38px;height:38px;font-size:.9rem;flex-shrink:0;">${(s.name||'S')[0].toUpperCase()}</div>
        <div class="tatt-card-info">
          <div class="tatt-card-name">${s.name}</div>
          <div class="tatt-card-sub">${st?`Currently: ${st.charAt(0).toUpperCase()+st.slice(1)}`:'Not marked'}</div>
        </div>
        <div class="tatt-card-btns">
          <button class="tatt-btn p ${st==='present'?'active-p':''}" onclick="tchSetEditAtt('${s.id}','present')">✅ P</button>
          <button class="tatt-btn a ${st==='absent'?'active-a':''}"  onclick="tchSetEditAtt('${s.id}','absent')">❌ A</button>
          <button class="tatt-btn l ${st==='late'?'active-l':''}"    onclick="tchSetEditAtt('${s.id}','late')">🕐 L</button>
        </div>
      </div>`;
    }).join('') : '<div class="empty-state"><div class="e-icon">👨‍🎓</div><p>No students</p></div>'}
  </div>`;
}

function tchSetEditAtt(sid,status){
  if(!_att._editMarks) _att._editMarks={};
  if(!_att._editMarks[_att.editDate]) _att._editMarks[_att.editDate]={};
  _att._editMarks[_att.editDate][sid]=status;
  const el=document.getElementById('tedit-att-'+sid);
  if(!el) return;
  el.className='tatt-card '+status;
  el.querySelectorAll('.tatt-btn').forEach(b=>{
    b.classList.remove('active-p','active-a','active-l');
    if(b.classList.contains('p')&&status==='present') b.classList.add('active-p');
    if(b.classList.contains('a')&&status==='absent')  b.classList.add('active-a');
    if(b.classList.contains('l')&&status==='late')    b.classList.add('active-l');
  });
  const sub=el.querySelector('.tatt-card-sub');
  if(sub) sub.textContent='Currently: '+status.charAt(0).toUpperCase()+status.slice(1);
}

function saveTchEditedAtt(){
  const editMarks=(_att._editMarks||{})[_att.editDate]||{};
  if(!Object.keys(editMarks).length){ toast('No changes to save','warning'); return; }
  const classId=_att.classId, date=_att.editDate;
  const students=DB.get('students').filter(s=>s.classId===classId);
  const rest=DB.get('attendance').filter(a=>!(a.classId===classId&&a.date===date));
  students.forEach(s=>{
    const st=editMarks[s.id];
    if(st) rest.push({id:genId('att'),classId,studentId:s.id,date,status:st,teacherId:CU.id});
  });
  DB.set('attendance',rest);
  if(_att._editMarks) delete _att._editMarks[date];
  toast(`Attendance updated for ${formatDate(date)}!`,'success');
  renderAttendance();
}

/* ── CLASS REPORT — scoped to teacher's classes ── */
function _tchBuildReportTab(){
  const classes=myClasses();
  const ids=myClassIds();
  const allAtt=DB.get('attendance').filter(a=>ids.includes(a.classId));
  if(!allAtt.length) return '<div class="empty-state"><div class="e-icon">📊</div><p>No attendance data yet. Start marking daily attendance.</p></div>';
  return `<div class="glass-card">
    <h3 class="card-title">📊 Class-wise Attendance Summary</h3>
    <div class="table-wrap"><table class="data-table">
      <thead><tr><th>Class</th><th>Students</th><th>Days Recorded</th><th>Avg Present%</th><th>Avg Absent%</th></tr></thead>
      <tbody>
        ${classes.map(c=>{
          const students=DB.get('students').filter(s=>s.classId===c.id);
          const cAtt=allAtt.filter(a=>a.classId===c.id);
          const days=[...new Set(cAtt.map(a=>a.date))].length;
          const p=cAtt.filter(a=>a.status==='present').length;
          const tot=cAtt.length||1;
          const pPct=Math.round(p/tot*100);
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
  <div class="glass-card mt-16" style="margin-top:16px;">
    <h3 class="card-title">📅 Last 10 Days — ${DB.find('classes',_att.classId)?.name||'Selected Class'}</h3>
    <div class="table-wrap">${_tchAttDayWiseTable()}</div>
  </div>`;
}

function _tchAttDayWiseTable(){
  const allAtt=DB.get('attendance').filter(a=>a.classId===_att.classId);
  const days=[...new Set(allAtt.map(a=>a.date))].sort().slice(-10).reverse();
  const students=DB.get('students').filter(s=>s.classId===_att.classId);
  if(!days.length) return '<div class="empty-state"><div class="e-icon">📅</div><p>No data for this class</p></div>';
  return `<table class="data-table">
    <thead><tr><th>Date</th><th>Present</th><th>Absent</th><th>Late</th><th>Rate</th></tr></thead>
    <tbody>
      ${days.map(d=>{
        const recs=allAtt.filter(a=>a.date===d);
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

/* ── STUDENT REPORT — same as admin ── */
function _tchBuildStudentReportTab(){
  const allAtt=DB.get('attendance').filter(a=>a.classId===_att.classId);
  const students=DB.get('students').filter(s=>s.classId===_att.classId);
  const search=(_att.search||'').toLowerCase();
  const filtered=search?students.filter(s=>s.name.toLowerCase().includes(search)):students;
  if(!students.length) return '<div class="empty-state"><div class="e-icon">👤</div><p>No students in this class</p></div>';
  return `<div class="glass-card">
    <h3 class="card-title">👤 Student-wise Report — ${DB.find('classes',_att.classId)?.name||''}</h3>
    <div class="table-wrap"><table class="data-table">
      <thead><tr><th>Roll</th><th>Student</th><th>Present</th><th>Absent</th><th>Late</th><th>Attendance%</th></tr></thead>
      <tbody>
        ${filtered.map(s=>{
          const sAtt=allAtt.filter(a=>a.studentId===s.id);
          const p=sAtt.filter(a=>a.status==='present').length;
          const ab=sAtt.filter(a=>a.status==='absent').length;
          const l=sAtt.filter(a=>a.status==='late').length;
          const tot=sAtt.length||1;
          const pct=Math.round(p/tot*100);
          const cls=pct>=75?'badge-green':pct>=50?'badge-yellow':'badge-red';
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

function tchMarkUnmarkedAbsent(){
  const saved=DB.get('attendance').filter(a=>a.classId===_att.classId&&a.date===_att.date);
  const savedMap={}; saved.forEach(a=>{ savedMap[a.studentId]=a.status; });
  DB.get('students').filter(s=>s.classId===_att.classId).forEach(s=>{
    if(!_att.marks[s.id]&&!savedMap[s.id]) tchSetAtt(s.id,'absent');
  });
}

function attHistory(){
  const ids=myClassIds();
  const grp=DB.get('attendance').filter(a=>ids.includes(a.classId)).reduce((acc,r)=>{
    const k=r.classId+'|'+r.date;
    if(!acc[k]) acc[k]={classId:r.classId,date:r.date,p:0,ab:0,t:0};
    acc[k].t++; if(r.status==='present') acc[k].p++; else acc[k].ab++;
    return acc;
  },{});
  const rows=Object.values(grp).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,20);
  if(!rows.length) return '<p class="text-muted">No records yet.</p>';
  return `<table class="data-table"><thead><tr><th>Class</th><th>Date</th><th>Present</th><th>Absent</th><th>%</th></tr></thead><tbody>
    ${rows.map(r=>`<tr>
      <td>${DB.find('classes',r.classId)?.name||r.classId}</td><td>${r.date}</td>
      <td><span class="badge badge-green">${r.p}</span></td>
      <td><span class="badge badge-red">${r.ab}</span></td>
      <td>${r.t?Math.round(r.p/r.t*100):0}%</td>
    </tr>`).join('')}
  </tbody></table>`;
}
// ── Teacher QR Scan Tab ───────────────────────────────
function _buildTchQRScanTab(classes) {
  var students = DB.get('students').filter(function(s){ return s.classId===_att.classId; });
  classes = classes || myClasses();
  var scanned = _att.qrScanned || {};
  var scannedHtml = Object.entries(scanned).map(function(entry){
    var id = entry[0], info = entry[1];
    var st = DB.find('students', id);
    return st ? '<div style="display:flex;align-items:center;gap:10px;padding:9px 12px;background:rgba(16,185,129,.1);border:1px solid rgba(16,185,129,.25);border-radius:10px;margin-bottom:7px;"><span style="font-size:1.1rem;">✅</span><div><div style="font-weight:700;color:#10b981;font-size:.88rem;">' + st.name + '</div><div style="font-size:.7rem;color:rgba(255,255,255,.35);">Roll ' + (st.rollNo||'—') + ' · ' + info.time + '</div></div></div>' : '';
  }).join('');

  return `
  <!-- Class & Date selector for QR mode -->
  <div class="glass-card mb-8">
    <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
      <select class="form-control" style="min-width:150px;flex:1;max-width:200px" onchange="_att.classId=this.value;_att.marks={};_att.qrScanned={};renderAttendance()">
        ${classes.map(function(c){ return '<option value="'+c.id+'" '+(c.id===_att.classId?'selected':'')+'>'+c.name+'</option>'; }).join('')}
      </select>
      <input type="date" class="form-control" style="min-width:150px;flex:1;max-width:200px" value="${_att.date}"
        onchange="_att.date=this.value;renderAttendance()">
    </div>
  </div>

  <div style="display:grid;grid-template-columns:minmax(280px,1fr) minmax(240px,1fr);gap:18px;align-items:start;">

    <!-- Camera panel -->
    <div class="glass-card" style="padding:18px;">
      <h4 style="margin-bottom:6px;">📷 QR Code Scanner</h4>
      <div style="font-size:.78rem;color:rgba(255,255,255,.4);margin-bottom:14px;">Hold student ID card QR code up to camera — marks attendance automatically.</div>

      <div style="position:relative;background:#111;border-radius:14px;overflow:hidden;aspect-ratio:4/3;max-height:250px;margin-bottom:12px;">
        <video id="_vmQRVideo" style="width:100%;height:100%;object-fit:cover;" playsinline muted></video>
        <canvas id="_vmQRCanvas" style="display:none;"></canvas>
        <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;">
          <div style="position:relative;width:140px;height:140px;">
            <div style="position:absolute;inset:0;border:2px solid rgba(124,58,237,.6);border-radius:10px;box-shadow:0 0 0 5000px rgba(0,0,0,.38);"></div>
            <div style="position:absolute;top:-2px;left:-2px;width:18px;height:18px;border-top:3px solid #a78bfa;border-left:3px solid #a78bfa;border-radius:6px 0 0 0;"></div>
            <div style="position:absolute;top:-2px;right:-2px;width:18px;height:18px;border-top:3px solid #a78bfa;border-right:3px solid #a78bfa;border-radius:0 6px 0 0;"></div>
            <div style="position:absolute;bottom:-2px;left:-2px;width:18px;height:18px;border-bottom:3px solid #a78bfa;border-left:3px solid #a78bfa;border-radius:0 0 0 6px;"></div>
            <div style="position:absolute;bottom:-2px;right:-2px;width:18px;height:18px;border-bottom:3px solid #a78bfa;border-right:3px solid #a78bfa;border-radius:0 0 6px 0;"></div>
          </div>
        </div>
      </div>

      <div id="_qrStatus" style="min-height:22px;font-size:.8rem;color:rgba(255,255,255,.45);text-align:center;margin-bottom:12px;">Camera off — tap Start to scan</div>

      <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;">
        <button class="btn btn-primary" onclick="_vmQRStart(_onTchQRScan)">▶️ Start Camera</button>
        <button class="btn btn-secondary" onclick="_vmQRStop()">⏹ Stop</button>
        <button class="btn btn-success" onclick="_saveTchQRAttendance()" style="margin-left:8px;">💾 Save All</button>
      </div>
      <div style="margin-top:12px;font-size:.72rem;color:rgba(255,255,255,.3);text-align:center;">Students not scanned will be marked <strong>Absent</strong> on save</div>
    </div>

    <!-- Scanned list -->
    <div class="glass-card" style="padding:18px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <h4>✅ Present: <span id="_qrCount">${Object.keys(scanned).length}</span>/${students.length}</h4>
        <button class="btn btn-sm btn-danger" onclick="_att.qrScanned={};_att.marks={};renderAttendance()">🗑 Clear</button>
      </div>
      <div id="_qrList" style="max-height:320px;overflow-y:auto;">
        ${scannedHtml||'<div style="text-align:center;padding:36px 12px;color:rgba(255,255,255,.2);font-size:.83rem;line-height:1.8;">No students scanned yet.<br>📱 Hold a QR ID card to the camera.</div>'}
      </div>
    </div>
  </div>`;
}

window._onTchQRScan = function(data) {
  var statusEl = document.getElementById('_qrStatus');
  function setS(html){ if(statusEl) statusEl.innerHTML=html; }

  if (!data.startsWith('VM:STU:')) { setS('<span style="color:#f59e0b;">⚠️ Not a student QR code</span>'); return; }
  var studentId = data.slice(7);
  var student   = DB.find('students', studentId);
  if (!student)                     { setS('<span style="color:#ef4444;">❌ Student not found</span>'); return; }
  if (student.classId !== _att.classId) {
    var wc = DB.find('classes', student.classId);
    setS('<span style="color:#f59e0b;">⚠️ ' + student.name + ' is from ' + (wc?wc.name:'another class') + '</span>');
    return;
  }
  if (!_att.qrScanned) _att.qrScanned = {};
  if (_att.qrScanned[studentId]) { setS('<span style="color:#06b6d4;">ℹ️ ' + student.name + ' already marked</span>'); return; }

  var timeStr = new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});
  _att.qrScanned[studentId] = { time:timeStr, status:'present' };
  _att.marks[studentId]     = 'present';
  setS('<span style="color:#10b981;font-weight:700;">✅ ' + student.name + ' — ' + timeStr + '</span>');

  var listEl = document.getElementById('_qrList');
  if (listEl) {
    var emp = listEl.querySelector('div[style*="No students"]');
    if (emp) emp.remove();
    var item = document.createElement('div');
    item.style.cssText='display:flex;align-items:center;gap:10px;padding:9px 12px;background:rgba(16,185,129,.1);border:1px solid rgba(16,185,129,.25);border-radius:10px;margin-bottom:7px;';
    item.innerHTML='<span style="font-size:1.1rem;">✅</span><div><div style="font-weight:700;color:#10b981;font-size:.88rem;">'+student.name+'</div><div style="font-size:.7rem;color:rgba(255,255,255,.35);">Roll '+(student.rollNo||'—')+' · '+timeStr+'</div></div>';
    listEl.insertBefore(item, listEl.firstChild);
  }
  var cntEl = document.getElementById('_qrCount');
  var studs = DB.get('students').filter(function(s){ return s.classId===_att.classId; });
  if (cntEl) cntEl.textContent = Object.keys(_att.qrScanned).length;
};

window._saveTchQRAttendance = function() {
  var scanned  = _att.qrScanned || {};
  var students = DB.get('students').filter(function(s){ return s.classId===_att.classId; });
  if (!students.length) { toast('No students in this class','warning'); return; }
  if (!Object.keys(scanned).length) { toast('No students scanned yet','warning'); return; }
  students.forEach(function(s){ if(!_att.marks[s.id]) _att.marks[s.id]='absent'; });
  window._vmQRStop();
  var rest=DB.get('attendance').filter(function(a){ return !(a.classId===_att.classId&&a.date===_att.date); });
  students.forEach(function(s){ rest.push({id:genId('att'),classId:_att.classId,studentId:s.id,date:_att.date,status:_att.marks[s.id]||'absent',teacherId:CU.id}); });
  DB.set('attendance',rest);
  var pCnt=Object.keys(scanned).length;
  toast('✅ Attendance saved! '+pCnt+' present, '+(students.length-pCnt)+' absent.','success');
  _att.marks={}; _att.qrScanned={}; _att.tab='mark';
  renderAttendance();
};

function tchSetAtt(sid, status) {
  _att.marks[sid] = status;
  const card = $('tatt-'+sid);
  if (!card) return;
  // tatt-card (list view) style — same as admin
  card.className = 'tatt-card ' + status;
  card.querySelectorAll('.tatt-btn').forEach(b=>{
    b.classList.remove('active-p','active-a','active-l');
    if(b.classList.contains('p')&&status==='present') b.classList.add('active-p');
    if(b.classList.contains('a')&&status==='absent')  b.classList.add('active-a');
    if(b.classList.contains('l')&&status==='late')    b.classList.add('active-l');
  });
  // Update live stats
  const allStudents = DB.get('students').filter(s=>s.classId===_att.classId);
  const saved = DB.get('attendance').filter(a=>a.classId===_att.classId&&a.date===_att.date);
  const savedMap = {}; saved.forEach(a=>{ savedMap[a.studentId]=a.status; });
  let p=0,ab=0,l=0,u=0;
  allStudents.forEach(s=>{ const st=_att.marks[s.id]||savedMap[s.id]||''; if(st==='present')p++; else if(st==='absent')ab++; else if(st==='late')l++; else u++; });
  const upd=(id,v)=>{ const el=document.getElementById(id); if(el) el.textContent=v; };
  upd('tatt-p',p); upd('tatt-a',ab); upd('tatt-l',l); upd('tatt-u',u);
  upd('tatt-pct', Math.round(p/(allStudents.length||1)*100)+'%');
}
function toggleAtt(sid) { tchSetAtt(sid, _att.marks[sid]==='present'?'absent':_att.marks[sid]==='absent'?'late':'present'); }
function markAll(status){
  DB.get('students').filter(s=>s.classId===_att.classId).forEach(s=>tchSetAtt(s.id, status));
}
function saveAttendance(){
  if(!_att.classId) return toast('Select a class','warning');
  const students=DB.get('students').filter(s=>s.classId===_att.classId);
  const rest=DB.get('attendance').filter(a=>!(a.classId===_att.classId&&a.date===_att.date));
  students.forEach(s=>{
    rest.push({id:genId('att'),classId:_att.classId,studentId:s.id,date:_att.date,status:_att.marks[s.id]||'absent',teacherId:CU.id});
  });
  DB.set('attendance',rest);
  _att.marks={};
  toast(`Attendance saved! ${students.length} students recorded.`,'success');
  renderAttendance();
}

// ═════════════════════════════════════════════════════════════════════════════
// HOMEWORK
// ═════════════════════════════════════════════════════════════════════════════
// ── Teacher Homework Photo ────────────────────────────
let _hwPhotoData=null, _hwPhotoTargetId=null;

function compressToBase64(file, cb){
  const MAX_BYTES=200*1024, reader=new FileReader();
  reader.onload=e=>{
    const img=new Image();
    img.onload=()=>{
      const canvas=document.createElement('canvas');
      let w=img.width,h=img.height,MAX_DIM=800;
      if(w>MAX_DIM||h>MAX_DIM){if(w>h){h=Math.round(h*MAX_DIM/w);w=MAX_DIM;}else{w=Math.round(w*MAX_DIM/h);h=MAX_DIM;}}
      canvas.width=w;canvas.height=h;
      const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0,w,h);
      let q=0.92,d=canvas.toDataURL('image/jpeg',q);
      while(d.length*0.75>MAX_BYTES&&q>0.1){q-=0.08;d=canvas.toDataURL('image/jpeg',Math.max(q,0.1));}
      while(d.length*0.75>MAX_BYTES&&(w>200||h>200)){w=Math.round(w*0.8);h=Math.round(h*0.8);canvas.width=w;canvas.height=h;ctx.drawImage(img,0,0,w,h);d=canvas.toDataURL('image/jpeg',0.7);}
      cb(d);
    };
    img.src=e.target.result;
  };
  reader.readAsDataURL(file);
}

function handleHWPhoto(input){
  const file=input.files[0]; if(!file)return;
  const statusEl=document.getElementById('hw-photo-status');
  const previewEl=document.getElementById('hw-photo-preview');
  statusEl.textContent='⏳ Compressing...';
  compressToBase64(file,dataUrl=>{
    _hwPhotoData=dataUrl;
    const kb=Math.round(dataUrl.length*0.75/1024);
    previewEl.innerHTML=`<img src="${dataUrl}" style="width:100%;max-height:180px;object-fit:cover;border-radius:10px">`;
    statusEl.innerHTML=`<span style="color:#16a34a">✅ ${kb} KB — Ready</span>`;
  });
}

function openHWPhotoUpload(id){
  _hwPhotoTargetId=id;
  const inp=document.getElementById('hw-photo-existing-input');
  inp.value=''; inp.click();
}

function handleHWExistingPhoto(input){
  const file=input.files[0]; if(!file)return;
  compressToBase64(file,dataUrl=>{
    const kb=Math.round(dataUrl.length*0.75/1024);
    DB.update('homework',_hwPhotoTargetId,{photo:dataUrl});
    toast(`Photo added! (${kb} KB)`,'success');
    _hwPhotoTargetId=null; renderHomework();
  });
}

function deleteHWPhoto(id){
  if(!confirm('Remove this photo?'))return;
  DB.update('homework',id,{photo:''});
  toast('Photo removed','success'); renderHomework();
}

function renderHomework(){
  const hw=DB.get('homework').filter(h=>h.teacherId===CU.id).sort((a,b)=>b.dueDate.localeCompare(a.dueDate));
  const td=today();
  const pending=hw.filter(h=>h.dueDate>=td).length;
  const overdue=hw.filter(h=>h.dueDate<td).length;

  $('section-homework').innerHTML=`
    <div class="section-header">
      <h2 class="section-title">Homework</h2>
      <button class="btn btn-primary" onclick="openHWModal()">+ Assign Homework</button>
    </div>
    <div class="stats-grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:20px">
      <div class="stat-card"><div class="stat-icon" style="background:linear-gradient(135deg,#7c3aed,#06b6d4)">📚</div><div class="stat-info"><div class="stat-value">${hw.length}</div><div class="stat-label">Total Assigned</div></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:linear-gradient(135deg,#10b981,#06b6d4)">✅</div><div class="stat-info"><div class="stat-value">${pending}</div><div class="stat-label">Active</div></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:linear-gradient(135deg,#ef4444,#f97316)">⚠️</div><div class="stat-info"><div class="stat-value">${overdue}</div><div class="stat-label">Overdue</div></div></div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px">
      ${hw.length?hw.map(h=>{
        const cls=DB.find('classes',h.classId);
        const ov=h.dueDate<td;
        return `<div class="glass-card" style="padding:0;overflow:hidden;border-radius:16px">
          ${h.photo?`<div style="position:relative">
            <img src="${h.photo}" style="width:100%;max-height:180px;object-fit:cover;display:block">
            <button onclick="deleteHWPhoto('${h.id}')" style="position:absolute;top:8px;right:8px;background:rgba(239,68,68,.9);color:#fff;border:none;border-radius:8px;padding:4px 10px;font-size:12px;cursor:pointer">🗑️ Photo</button>
          </div>`:''}
          <div style="padding:14px">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
              <span class="badge badge-purple">${h.subject}</span>
              <span class="badge ${ov?'badge-red':'badge-green'}">${ov?'⚠️ Overdue':'✅ Active'}</span>
            </div>
            <div style="font-weight:700;font-size:15px;margin-bottom:4px">${h.description||'—'}</div>
            <div style="font-size:12px;color:var(--text-muted);margin-bottom:10px">🏫 ${cls?cls.name:'—'} &nbsp;·&nbsp; 📅 Due: ${h.dueDate}</div>
            <div style="display:flex;gap:8px">
              ${!h.photo?`<button class="btn btn-sm" style="flex:1;background:var(--card-bg);border:1.5px solid var(--border)" onclick="openHWPhotoUpload('${h.id}')">📷 Add Photo</button>`:''}
              <button class="btn btn-sm btn-danger" style="${!h.photo?'':'flex:1'}" onclick="deleteHW('${h.id}')">🗑 Delete</button>
            </div>
          </div>
        </div>`;
      }).join(''):'<p class="text-muted">No homework assigned yet.</p>'}
    </div>
    <input type="file" id="hw-photo-existing-input" accept="image/*" style="display:none" onchange="handleHWExistingPhoto(this)">`;
}

function openHWModal(){
  _hwPhotoData=null;
  const classes=myClasses();
  buildModal('hwModal','Assign Homework',`
    <div style="background:var(--bg-secondary,rgba(255,255,255,.05));border-radius:12px;border:2px dashed var(--border,rgba(255,255,255,.1));padding:14px;margin-bottom:16px">
      <div style="font-size:13px;font-weight:600;color:var(--text-primary);margin-bottom:8px">📷 Blackboard / Reference Photo <span style="font-weight:400;font-size:11px;color:var(--text-muted)">(optional)</span></div>
      <div id="hw-photo-preview" style="width:100%;min-height:80px;border-radius:10px;background:var(--bg-primary,rgba(0,0,0,.2));display:flex;align-items:center;justify-content:center;font-size:2.5rem;overflow:hidden;margin-bottom:8px;cursor:pointer" onclick="document.getElementById('hw-photo-input').click()">📸</div>
      <div style="display:flex;align-items:center;gap:10px">
        <button type="button" class="btn" style="padding:6px 14px;font-size:12px;background:var(--card-bg);border:1.5px solid var(--border)" onclick="document.getElementById('hw-photo-input').click()">📷 Upload Photo</button>
        <div id="hw-photo-status" style="font-size:11px;color:var(--text-muted)">You can upload a blackboard photo</div>
      </div>
      <input type="file" id="hw-photo-input" accept="image/*" style="display:none" onchange="handleHWPhoto(this)">
    </div>
    <div class="form-grid">
      <div class="form-group"><label class="form-label">Class</label>
        <select class="form-control" id="hwClass">${classes.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">Subject</label><input class="form-control" id="hwSubject" placeholder="Mathematics"></div>
      <div class="form-group" style="grid-column:1/-1"><label class="form-label">Description / Title</label><textarea class="form-control" id="hwDesc" rows="3" placeholder="Homework details..."></textarea></div>
      <div class="form-group"><label class="form-label">Due Date</label><input type="date" class="form-control" id="hwDue" value="${today()}"></div>
    </div>`,saveHW);
}
function saveHW(){
  if(!val('hwSubject')) return toast('Enter subject','warning');
  const photo=_hwPhotoData||'';
  DB.push('homework',{id:genId('hw'),classId:val('hwClass'),subject:val('hwSubject'),description:val('hwDesc'),dueDate:val('hwDue'),photo,teacherId:CU.id,date:today()});
  _hwPhotoData=null;
  closeModal('hwModal'); toast('Homework assigned!','success'); renderHomework();
}
function deleteHW(id){if(confirm('Delete homework?')){DB.delete('homework',id);renderHomework();}}

// ═════════════════════════════════════════════════════════════════════════════
// TIMETABLE  (uses admin-configured days & slots)
// ═════════════════════════════════════════════════════════════════════════════
let _ttClass='';

function getTTSettings(){
  const s=(DB.get('ttSettings')||[])[0]||{};
  return{
    days: s.days||['Monday','Tuesday','Wednesday','Thursday','Friday'],
    slots:s.slots||['9:00–9:45','9:45–10:30','10:30–11:15','11:15–12:00','12:00–12:45','1:30–2:15','2:15–3:00']
  };
}

function renderTimetable(){
  const classes=myClasses();
  if(!_ttClass&&classes.length) _ttClass=classes[0].id;
  const tt=DB.get('timetable');
  const {days,slots}=getTTSettings();
  $('section-timetable').innerHTML=`
    <div class="section-header"><h2 class="section-title">Timetable</h2>
      <span style="font-size:12px;color:var(--text-muted)">📅 ${days.length} days &nbsp;·&nbsp; ⏰ ${slots.length} periods</span>
    </div>
    <div class="glass-card">
      <div class="form-group" style="max-width:280px"><label class="form-label">Class</label>
        <select class="form-control" onchange="_ttClass=this.value;renderTimetable()">
          ${classes.map(c=>`<option value="${c.id}" ${c.id===_ttClass?'selected':''}>${c.name}</option>`).join('')}
        </select></div>
    </div>
    <div class="glass-card mt-8" style="overflow-x:auto">
      <table class="data-table timetable-table" style="min-width:${160+days.length*110}px">
        <thead><tr><th style="white-space:nowrap">⏰ Time</th>${days.map(d=>`<th>${d}</th>`).join('')}</tr></thead>
        <tbody>${slots.map(slot=>`<tr>
          <td style="font-weight:600;color:var(--cyan);white-space:nowrap;font-size:12px">${slot}</td>
          ${days.map(day=>{
            const cell=tt.find(t=>t.classId===_ttClass&&t.day===day&&t.slot===slot)||{};
            return `<td style="min-width:110px;cursor:pointer;transition:background .2s"
              onmouseover="this.style.background='rgba(124,58,237,0.15)'"
              onmouseout="this.style.background=''"
              onclick="openTTModal('${_ttClass}','${day}','${slot}')">
              ${cell.isBreak?'<span style="color:#f59e0b;font-size:12px">☕ Break</span>':
                cell.subject?`<div style="font-weight:600;font-size:13px">${cell.subject}</div><div style="font-size:11px;color:var(--text-muted)">${cell.teacher||''}</div>`
                :'<span style="color:var(--text-muted);font-size:12px">+ Add</span>'}
            </td>`;
          }).join('')}
        </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

function openTTModal(classId,day,slot){
  const tt=DB.get('timetable');
  const cell=tt.find(t=>t.classId===classId&&t.day===day&&t.slot===slot)||{};
  const tName=DB.find('teachers',CU.id)?.name||'';
  buildModal('ttModal',`${day} — ${slot}`,`
    <div class="form-group"><label class="form-label">Subject</label><input class="form-control" id="ttSubject" value="${cell.subject&&!cell.isBreak?cell.subject:''}" placeholder="Leave blank to clear"></div>
    <div class="form-group"><label class="form-label">Teacher</label><input class="form-control" id="ttTeacher" value="${cell.teacher||tName}"></div>
    <label style="display:flex;align-items:center;gap:10px;margin-top:8px;cursor:pointer">
      <input type="checkbox" id="ttBreak" ${cell.isBreak?'checked':''}> ☕ Mark as Break
    </label>
    ${cell.subject?`<button type="button" onclick="clearTTCellT('${classId}','${day}','${slot}')" class="btn btn-danger" style="width:100%;margin-top:12px">🗑️ Clear Cell</button>`:''}`,
  ()=>{
    const subj=val('ttSubject');
    const isBreak=document.getElementById('ttBreak').checked;
    const rest=DB.get('timetable').filter(t=>!(t.classId===classId&&t.day===day&&t.slot===slot));
    if(subj||isBreak) rest.push({id:genId('tt'),classId,day,slot,subject:isBreak?'BREAK':subj,teacher:val('ttTeacher'),isBreak});
    DB.set('timetable',rest);
    closeModal('ttModal'); renderTimetable();
  });
}

function clearTTCellT(classId,day,slot){
  DB.set('timetable',DB.get('timetable').filter(t=>!(t.classId===classId&&t.day===day&&t.slot===slot)));
  closeModal('ttModal'); renderTimetable();
}

// ═════════════════════════════════════════════════════════════════════════════
// EXAMS & MARKS
// ═════════════════════════════════════════════════════════════════════════════
let _texTab='list', _texEntryClass='', _texEntryType='';
function renderExams(){
  const classes=myClasses();
  if(!_texEntryClass&&classes[0]) _texEntryClass=classes[0].id;
  const exams=DB.get('exams').filter(e=>classes.some(c=>c.id===e.classId));
  const marks=DB.get('marks');

  $('section-exams').innerHTML=`
    <div class="section-header">
      <h2 class="section-title">Exams &amp; Marks</h2>
      <button class="btn btn-primary" onclick="openExamModal()">+ Add Exam Subject</button>
    </div>
    <div style="display:flex;gap:0;border-bottom:1px solid var(--glass-border);margin-bottom:20px">
      <button style="padding:10px 18px;border:none;background:none;cursor:pointer;font-weight:600;border-bottom:${_texTab==='list'?'3px solid var(--primary)':'3px solid transparent'};color:${_texTab==='list'?'var(--primary)':'var(--text-muted)'}" onclick="_texTab='list';renderExams()">📋 Exams</button>
      <button style="padding:10px 18px;border:none;background:none;cursor:pointer;font-weight:600;border-bottom:${_texTab==='entry'?'3px solid var(--primary)':'3px solid transparent'};color:${_texTab==='entry'?'var(--primary)':'var(--text-muted)'}" onclick="_texTab='entry';renderExams()">📝 Enter Marks</button>
    </div>
    ${_texTab==='list'?_texListHtml(classes,exams,marks):_texEntryHtml(classes)}`;

  if(_texTab==='list'){
    const examStats=exams.map(e=>{
      const em=marks.filter(m=>m.examId===e.id);
      const avg=em.length?Math.round(em.reduce((s,m)=>s+parseFloat(m.obtained),0)/em.length):null;
      return {...e,avg};
    });
    if(examStats.length) mkChart('tChExams',{type:'bar',data:{
      labels:examStats.map(e=>e.name+(e.subject?' ('+e.subject+')':'')),
      datasets:[
        {label:'Average',data:examStats.map(e=>e.avg||0),backgroundColor:'rgba(124,58,237,0.8)',borderRadius:8,borderSkipped:false},
        {label:'Max Marks',data:examStats.map(e=>e.maxMarks),backgroundColor:'rgba(6,182,212,0.3)',borderRadius:8,borderSkipped:false}
      ]
    },options:{responsive:true,maintainAspectRatio:false,
      plugins:{legend:{labels:{color:CH.legend}}},scales:chartScales(10)}});
  }
}

function _texListHtml(classes,exams,marks){
  const examStats=exams.map(e=>{
    const em=marks.filter(m=>m.examId===e.id);
    const avg=em.length?Math.round(em.reduce((s,m)=>s+parseFloat(m.obtained),0)/em.length):null;
    const totalSt=DB.get('students').filter(s=>s.classId===e.classId).length;
    return {...e,avg,entered:em.length,total:totalSt};
  });
  return `
    ${examStats.length?`<div class="glass-card" style="margin-bottom:20px">
      <h3 class="card-title">📊 Average Marks per Exam</h3>
      <div style="position:relative;height:200px"><canvas id="tChExams"></canvas></div>
    </div>`:''}
    <div class="glass-card">
      ${examStats.length?`<table class="data-table"><thead><tr><th>Exam Name</th><th>Class</th><th>Subject</th><th>Date</th><th>Max</th><th>Avg</th><th>Entered</th><th>Action</th></tr></thead><tbody>
        ${examStats.map(e=>`<tr>
          <td><strong>${e.name}</strong></td>
          <td>${DB.find('classes',e.classId)?.name||'—'}</td>
          <td>${e.subject}</td><td>${e.date}</td><td>${e.maxMarks}</td>
          <td>${e.avg!==null?`<span class="badge ${e.avg>=60?'badge-green':'badge-red'}">${e.avg}/${e.maxMarks}</span>`:'<span style="color:var(--text-muted)">—</span>'}</td>
          <td><span class="badge ${e.entered===e.total&&e.total>0?'badge-green':'badge-yellow'}">${e.entered}/${e.total}</span></td>
          <td style="display:flex;gap:4px">
            <button class="btn btn-sm btn-secondary" onclick="tOpenSingleMarks('${e.id}')">📝</button>
            <button class="btn btn-sm btn-danger" onclick="deleteExam('${e.id}')">🗑</button>
          </td>
        </tr>`).join('')}
      </tbody></table>`:'<p class="text-muted" style="text-align:center;padding:30px">No exams yet. Click "+ Add Exam Subject" to create one.</p>'}
    </div>`;
}

function _texEntryHtml(classes){
  const allExams=DB.get('exams').filter(e=>classes.some(c=>c.id===e.classId));
  const classExams=allExams.filter(e=>e.classId===_texEntryClass);
  const examTypes=[...new Set(classExams.map(e=>e.name))].sort();
  if(!_texEntryType&&examTypes[0]) _texEntryType=examTypes[0];
  const typeExams=classExams.filter(e=>e.name===_texEntryType).sort((a,b)=>a.subject.localeCompare(b.subject));
  const students=DB.get('students').filter(s=>s.classId===_texEntryClass).sort((a,b)=>(a.rollNo||'').toString().localeCompare((b.rollNo||'').toString(),undefined,{numeric:true}));
  const allMarks=DB.get('marks');
  const maxTotal=typeExams.reduce((t,e)=>t+e.maxMarks,0);
  return `
  <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px;align-items:flex-end">
    <div>
      <div style="font-size:.78rem;font-weight:600;margin-bottom:4px;color:var(--text-muted)">Class</div>
      <select class="form-control" style="width:170px" onchange="_texEntryClass=this.value;_texEntryType='';renderExams()">
        ${classes.map(c=>`<option value="${c.id}" ${c.id===_texEntryClass?'selected':''}>${c.name}</option>`).join('')}
      </select>
    </div>
    <div>
      <div style="font-size:.78rem;font-weight:600;margin-bottom:4px;color:var(--text-muted)">Exam Type</div>
      <select class="form-control" style="width:190px" onchange="_texEntryType=this.value;renderExams()">
        ${examTypes.length?examTypes.map(t=>`<option value="${t}" ${t===_texEntryType?'selected':''}>${t}</option>`).join(''):'<option value="">No exams for this class</option>'}
      </select>
    </div>
    ${_texEntryType?`<div style="align-self:flex-end;font-size:.82rem;color:var(--text-muted)">${typeExams.length} subject(s) · Max ${maxTotal} marks</div>`:''}
  </div>
  ${typeExams.length&&students.length?`
  <div class="glass-card" style="padding:0;overflow:hidden">
    <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid var(--glass-border);flex-wrap:wrap;gap:10px">
      <h3 class="card-title" style="margin:0">📝 ${_texEntryType} — Mark Sheet</h3>
      <button class="btn btn-primary" onclick="tSaveBulkMarks()">💾 Save All Marks</button>
    </div>
    <div style="overflow-x:auto">
      <table class="data-table" style="min-width:480px">
        <thead><tr>
          <th style="position:sticky;left:0;background:var(--glass);z-index:2">#</th>
          <th style="position:sticky;left:40px;background:var(--glass);z-index:2;min-width:130px">Student</th>
          ${typeExams.map(e=>`<th style="text-align:center;min-width:100px">${e.subject}<br><span style="font-weight:400;font-size:.72rem;opacity:.8">Max ${e.maxMarks}</span></th>`).join('')}
          <th style="text-align:center">Total/${maxTotal}</th>
          <th style="text-align:center">%</th>
        </tr></thead>
        <tbody>
          ${students.map((s,si)=>{
            const sMarks=typeExams.map(e=>allMarks.find(mk=>mk.examId===e.id&&mk.studentId===s.id));
            const tot=sMarks.reduce((t,m)=>t+(m?m.obtained:0),0);
            const pct=maxTotal?Math.round(tot/maxTotal*100):0;
            const g=getGrade(pct);
            const hasAny=sMarks.some(m=>m);
            return `<tr>
              <td style="position:sticky;left:0;background:var(--bg-card);z-index:1;text-align:center;font-weight:600">${s.rollNo||si+1}</td>
              <td style="position:sticky;left:40px;background:var(--bg-card);z-index:1;font-weight:600;white-space:nowrap">${s.name}</td>
              ${typeExams.map((e,ei)=>{
                const m=sMarks[ei];
                return `<td style="text-align:center;padding:6px 8px">
                  <input type="number" style="width:80px;padding:5px 7px;text-align:center;border:1.5px solid var(--glass-border);border-radius:8px;background:var(--glass);color:var(--text-primary);font-size:.9rem"
                    id="tbm-${e.id}-${s.id}" value="${m?m.obtained:''}" min="0" max="${e.maxMarks}" placeholder="—"
                    oninput="_texUpdateRow('${s.id}',[${typeExams.map(e=>`'${e.id}'`).join(',')}],[${typeExams.map(e=>e.maxMarks).join(',')}])">
                </td>`;
              }).join('')}
              <td style="text-align:center;font-weight:700" id="trt-${s.id}">${hasAny?tot:'—'}</td>
              <td style="text-align:center;font-weight:700;color:${g.color}" id="trp-${s.id}">${hasAny?pct+'%':'—'}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
    <div style="padding:14px 20px;border-top:1px solid var(--glass-border);display:flex;align-items:center;gap:14px;flex-wrap:wrap">
      <button class="btn btn-primary" onclick="tSaveBulkMarks()">💾 Save All Marks</button>
      <span style="font-size:.8rem;color:var(--text-muted)">${students.length} students · Click Save when done</span>
    </div>
  </div>`
  :(!examTypes.length
    ?`<div class="glass-card" style="text-align:center;padding:40px"><div style="font-size:2.5rem;margin-bottom:12px">📋</div><h3>No Exams for This Class</h3><p style="color:var(--text-muted)">Click "+ Add Exam Subject" above to create exam subjects first</p></div>`
    :`<div class="glass-card" style="text-align:center;padding:40px"><div style="font-size:2.5rem;margin-bottom:12px">📝</div><h3>Select Exam Type</h3><p style="color:var(--text-muted)">Pick a class and exam type above to enter marks</p></div>`)}`;
}

function _texUpdateRow(studentId,examIds,maxMarks){
  let total=0,maxT=0,hasAny=false;
  examIds.forEach((eid,i)=>{
    const el=document.getElementById(`tbm-${eid}-${studentId}`);
    maxT+=maxMarks[i];
    if(el&&el.value!==''){total+=Number(el.value);hasAny=true;}
  });
  const rt=document.getElementById(`trt-${studentId}`);
  const rp=document.getElementById(`trp-${studentId}`);
  if(rt) rt.textContent=hasAny?total:'—';
  if(rp){
    const pct=maxT?Math.round(total/maxT*100):0;
    const g=getGrade(pct);
    rp.textContent=hasAny?pct+'%':'—';
    rp.style.color=hasAny?g.color:'';
  }
}

function tSaveBulkMarks(){
  const typeExams=DB.get('exams').filter(e=>e.classId===_texEntryClass&&e.name===_texEntryType);
  const students=DB.get('students').filter(s=>s.classId===_texEntryClass);
  const rest=DB.get('marks').filter(m=>!typeExams.find(e=>e.id===m.examId));
  let count=0;
  typeExams.forEach(e=>{
    students.forEach(s=>{
      const el=document.getElementById(`tbm-${e.id}-${s.id}`);
      if(el&&el.value!==''){rest.push({id:genId('mrk'),examId:e.id,studentId:s.id,obtained:Math.min(Number(el.value),e.maxMarks)});count++;}
    });
  });
  DB.set('marks',rest);
  toast(`✅ Saved ${count} mark entries!`,'success');
  renderExams();
}

function openExamModal(){
  const classes=myClasses();
  const existingNames=[...new Set(DB.get('exams').map(e=>e.name))];
  buildModal('examModal','Add Exam Subject',`
    <div style="background:rgba(124,58,237,.1);border:1px solid rgba(124,58,237,.3);border-radius:10px;padding:10px 14px;margin-bottom:14px;font-size:.85rem">
      💡 Use the <strong>same Exam Name</strong> (e.g. "Mid Term") for all subjects of the same exam.
    </div>
    <div class="form-grid">
      <div class="form-group"><label class="form-label">Exam Name *</label>
        <input class="form-control" id="exName" placeholder="Mid Term / Unit Test 1" list="texNameList">
        <datalist id="texNameList">${existingNames.map(n=>`<option value="${n}">`).join('')}</datalist>
      </div>
      <div class="form-group"><label class="form-label">Class *</label>
        <select class="form-control" id="exClass">${classes.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}</select>
      </div>
      <div class="form-group"><label class="form-label">Subject *</label><input class="form-control" id="exSubject" placeholder="e.g. Mathematics"></div>
      <div class="form-group"><label class="form-label">Max Marks</label><input type="number" class="form-control" id="exMax" value="100"></div>
      <div class="form-group"><label class="form-label">Date</label><input type="date" class="form-control" id="exDate" value="${today()}"></div>
    </div>`,saveExam);
}
function saveExam(){
  const name=val('exName'),classId=val('exClass'),subject=val('exSubject');
  if(!name||!subject) return toast('Fill required fields','warning');
  const dup=DB.get('exams').find(e=>e.classId===classId&&e.name===name&&e.subject.toLowerCase()===subject.toLowerCase());
  if(dup) return toast('This subject already exists in that exam!','warning');
  DB.push('exams',{id:genId('ex'),name,classId,subject,date:val('exDate'),maxMarks:parseInt(val('exMax'))||100,teacherId:CU.id});
  closeModal('examModal'); toast('Exam subject added!','success'); renderExams();
}
function deleteExam(id){if(confirm('Delete exam and its marks?')){DB.set('marks',DB.get('marks').filter(m=>m.examId!==id));DB.delete('exams',id);renderExams();}}
function tOpenSingleMarks(examId){
  const exam=DB.find('exams',examId); if(!exam) return;
  const students=DB.get('students').filter(s=>s.classId===exam.classId).sort((a,b)=>(a.rollNo||'').toString().localeCompare((b.rollNo||'').toString(),undefined,{numeric:true}));
  const marks=DB.get('marks');
  buildModal('marksModal',`Marks — ${exam.name} (${exam.subject})`,`
    <p style="color:var(--text-muted);margin-bottom:12px">Max Marks: <strong>${exam.maxMarks}</strong></p>
    <div style="max-height:380px;overflow-y:auto">
    ${students.map(s=>{
      const mk=marks.find(m=>m.examId===examId&&m.studentId===s.id);
      return `<div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
        <span style="flex:1;color:var(--text-secondary)">${s.name} <span style="color:var(--text-muted);font-size:12px">${s.rollNo||''}</span></span>
        <input type="number" class="form-control" style="width:90px" id="mk_${s.id}" value="${mk!==undefined?mk.obtained:''}" min="0" max="${exam.maxMarks}">
      </div>`;
    }).join('')}</div>`,
  ()=>{
    const rest=DB.get('marks').filter(m=>!(m.examId===examId&&students.some(s=>s.id===m.studentId)));
    students.forEach(s=>{
      const v=$('mk_'+s.id)?.value;
      if(v!=='') rest.push({id:genId('mrk'),examId,studentId:s.id,obtained:parseFloat(v)});
    });
    DB.set('marks',rest); closeModal('marksModal'); toast('Marks saved!','success'); renderExams();
  },'lg');
}
// backward compat
function openMarksModal(examId){ tOpenSingleMarks(examId); }

// ═════════════════════════════════════════════════════════════════════════════
// STUDY MATERIALS
// ═════════════════════════════════════════════════════════════════════════════
function renderMaterials(){
  const mats=DB.get('materials').filter(m=>m.teacherId===CU.id).sort((a,b)=>b.date.localeCompare(a.date));
  $('section-materials').innerHTML=`
    <div class="section-header">
      <h2 class="section-title">Study Materials</h2>
      <button class="btn btn-primary" onclick="openMatModal()">+ Upload Material</button>
    </div>

    <!-- Curriculum Library -->
    <div class="glass-card mb-16" style="padding:20px;">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:16px;">
        <div>
          <h3 style="margin:0;font-size:1rem;">📚 Curriculum Library</h3>
          <div style="font-size:.76rem;color:rgba(255,255,255,.4);">Browse Class 1–10 chapters & Q&A. Add directly to Question Bank.</div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <select id="tch-lib-class" onchange="tchLoadLibSubjects()" style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:8px;color:#fff;padding:7px 12px;font-size:.85rem;">
            <option value="">Select Class</option>
            ${['1','2','3','4','5','6','7','8','9','10'].map(c=>`<option value="${c}">Class ${c}</option>`).join('')}
          </select>
          <select id="tch-lib-subject" onchange="tchLoadLibChapters()" style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:8px;color:#fff;padding:7px 12px;font-size:.85rem;">
            <option value="">Select Subject</option>
          </select>
        </div>
      </div>
      <div id="tch-lib-content" style="color:rgba(255,255,255,.35);text-align:center;padding:24px;">
        Select class &amp; subject to browse chapters
      </div>
    </div>

    <!-- Uploaded Materials -->
    <div class="glass-card">
      <div style="font-weight:600;margin-bottom:10px;">📂 My Uploaded Materials</div>
      ${mats.length?`<table class="data-table"><thead><tr><th>Title</th><th>Class</th><th>Subject</th><th>Type</th><th>Date</th><th>Actions</th></tr></thead><tbody>
        ${mats.map(m=>`<tr>
          <td><strong>${m.title}</strong></td>
          <td>${DB.find('classes',m.classId)?.name||m.classId}</td>
          <td>${m.subject}</td>
          <td><span class="badge badge-cyan">${m.type||'File'}</span></td>
          <td>${m.date}</td>
          <td style="display:flex;gap:4px">
            ${m.fileData?`<a href="${m.fileData}" download="${m.title}" class="btn btn-sm btn-secondary">⬇</a>`:''}
            <button class="btn btn-sm btn-danger" onclick="deleteMat('${m.id}')">🗑</button>
          </td>
        </tr>`).join('')}
      </tbody></table>`:'<p class="text-muted">No materials uploaded.</p>'}
    </div>`;
}

function tchLoadLibSubjects() {
  const classNum = document.getElementById('tch-lib-class') ? document.getElementById('tch-lib-class').value : '';
  const subSel = document.getElementById('tch-lib-subject');
  document.getElementById('tch-lib-content').innerHTML='<div style="text-align:center;padding:24px;color:rgba(255,255,255,.35);">Select a subject to browse chapters</div>';
  if (!classNum || typeof getCurriculumSubjects!=='function') { if(subSel) subSel.innerHTML='<option value="">Select Subject</option>'; return; }
  const subjects = getCurriculumSubjects(classNum);
  if(subSel) subSel.innerHTML = '<option value="">Select Subject</option>' + subjects.map(s=>`<option value="${s}">${s}</option>`).join('');
}

function tchLoadLibChapters() {
  const classNum = document.getElementById('tch-lib-class') ? document.getElementById('tch-lib-class').value : '';
  const subject = document.getElementById('tch-lib-subject') ? document.getElementById('tch-lib-subject').value : '';
  const el = document.getElementById('tch-lib-content');
  if (!classNum || !subject || !el) return;
  if (typeof getCurriculumChapters!=='function') { el.innerHTML='<p style="color:rgba(255,255,255,.4)">Curriculum data not loaded.</p>'; return; }
  const chapters = getCurriculumChapters(classNum, subject);
  if (!chapters.length) { el.innerHTML='<p style="color:rgba(255,255,255,.4)">No chapters found.</p>'; return; }
  el.innerHTML = chapters.map((ch, ci) => `
    <div style="margin-bottom:12px;border:1px solid rgba(255,255,255,.08);border-radius:10px;overflow:hidden;">
      <div onclick="tchToggleChapter('tch-ch-${ci}')" style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:rgba(124,58,237,.1);cursor:pointer;">
        <div>
          <span style="font-weight:700;">📖 ${ch.chapter}</span>
          <div style="font-size:.74rem;color:rgba(255,255,255,.4);margin-top:2px;">${ch.topics.slice(0,3).join(' · ')}</div>
        </div>
        <span id="tch-ch-arrow-${ci}">▼</span>
      </div>
      <div id="tch-ch-${ci}" style="display:none;padding:14px 16px;">
        ${ch.qa.map((item,qi)=>`
          <div style="margin-bottom:10px;background:rgba(255,255,255,.03);border-radius:8px;padding:10px 12px;border-left:3px solid #7c3aed;">
            <div style="font-weight:600;font-size:.88rem;color:#e2e8f0;margin-bottom:4px;">Q${qi+1}. ${item.q}</div>
            <div style="font-size:.83rem;color:#a78bfa;">✅ ${item.a}</div>
          </div>`).join('')}
        <button class="btn btn-sm" style="background:rgba(6,182,212,.15);color:#06b6d4;border:1px solid rgba(6,182,212,.3);margin-top:6px;"
          onclick="tchAddToQBank('${classNum}','${subject}','${ci}')">➕ Add to Question Bank</button>
      </div>
    </div>`).join('');
}

function tchToggleChapter(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const arrow = document.getElementById(id.replace('tch-ch-','tch-ch-arrow-'));
  const isOpen = el.style.display !== 'none';
  el.style.display = isOpen ? 'none' : 'block';
  if (arrow) arrow.textContent = isOpen ? '▼' : '▲';
}

function tchAddToQBank(classNum, subject, chapterIdx) {
  if (typeof getCurriculumChapters!=='function') { toast('Curriculum data unavailable','warning'); return; }
  const chapters = getCurriculumChapters(classNum, subject);
  const ch = chapters[parseInt(chapterIdx)];
  if (!ch) return;
  const bank = DB.get('question_bank');
  let added = 0;
  ch.qa.forEach(item => {
    if (!bank.find(q => q.question === item.q)) {
      DB.push('question_bank', {
        id: genId('qb'), subject, classId: 'class'+classNum,
        topic: ch.chapter, type: 'short', marks: 2,
        question: item.q, answer: item.a, options: []
      });
      added++;
    }
  });
  toast(`Added ${added} questions to Question Bank!`, 'success');
}
function openMatModal(){
  const classes=myClasses();
  buildModal('matModal','Upload Study Material',`
    <div class="form-grid">
      <div class="form-group"><label class="form-label">Title</label><input class="form-control" id="matTitle"></div>
      <div class="form-group"><label class="form-label">Class</label>
        <select class="form-control" id="matClass">${classes.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">Subject</label><input class="form-control" id="matSubject"></div>
      <div class="form-group"><label class="form-label">Type</label>
        <select class="form-control" id="matType"><option>Notes</option><option>PDF</option><option>Video Link</option><option>Practice Sheet</option></select></div>
      <div class="form-group" style="grid-column:1/-1"><label class="form-label">Description</label><textarea class="form-control" id="matDesc" rows="2"></textarea></div>
      <div class="form-group" style="grid-column:1/-1"><label class="form-label">File (optional)</label><input type="file" class="form-control" id="matFile"></div>
    </div>`,saveMat);
}
async function saveMat(){
  if(!val('matTitle')) return toast('Enter title','warning');
  let fileData=null;
  const fi=$('matFile');
  if(fi&&fi.files[0]){try{fileData=await fileToBase64(fi.files[0]);}catch(e){}}
  DB.push('materials',{id:genId('mat'),title:val('matTitle'),classId:val('matClass'),subject:val('matSubject'),type:val('matType'),description:val('matDesc'),fileData,teacherId:CU.id,date:today()});
  closeModal('matModal'); toast('Material uploaded!','success'); renderMaterials();
}
function deleteMat(id){if(confirm('Delete?')){DB.delete('materials',id);renderMaterials();}}

// ═════════════════════════════════════════════════════════════════════════════
// QUESTION PAPERS
// ═════════════════════════════════════════════════════════════════════════════
function renderQPapers(){
  const qps=DB.get('qpapers').filter(q=>q.teacherId===CU.id).sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  // Also show admin-generated papers for my classes
  const myClassIds = myClasses().map(c=>c.id);
  const genQPs = DB.get('question_papers').filter(q=>q.isGenerated&&myClassIds.includes(q.classId));
  $('section-qpapers').innerHTML=`
    <div class="section-header">
      <h2 class="section-title">Question Papers</h2>
      <button class="btn btn-primary" onclick="openQPModal()">+ Upload Paper</button>
    </div>
    ${genQPs.length?`
    <div class="glass-card mb-16">
      <div style="font-weight:600;margin-bottom:10px">⚡ Generated Papers</div>
      <div style="display:flex;flex-direction:column;gap:8px">
        ${genQPs.map(q=>`<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;border:1px solid rgba(124,58,237,.2);background:rgba(124,58,237,.05)">
          <span style="font-size:1.4rem">⚡</span>
          <div style="flex:1"><div style="font-weight:600;font-size:13px">${q.title}</div>
          <div style="font-size:11px;color:var(--text-muted)">${q.subject||'—'} · ${q.selCount||0} questions · ${q.uploadedOn||''}</div></div>
          <button class="btn btn-sm" style="background:#7c3aed;color:#fff" onclick="teacherViewGenQP('${q.id}')">👁️ View</button>
        </div>`).join('')}
      </div>
    </div>`:''}
    <div class="glass-card">
      <div style="font-weight:600;margin-bottom:10px">📄 Uploaded Papers</div>
      ${qps.length?`<table class="data-table"><thead><tr><th>Title</th><th>Class</th><th>Subject</th><th>Year</th><th>Date</th><th>Actions</th></tr></thead><tbody>
        ${qps.map(q=>`<tr>
          <td><strong>${q.title}</strong></td>
          <td>${DB.find('classes',q.classId)?.name||q.classId}</td>
          <td>${q.subject}</td><td>${q.year||'—'}</td><td>${q.date}</td>
          <td style="display:flex;gap:4px">
            ${q.fileData?`<a href="${q.fileData}" download="${q.title}" class="btn btn-sm btn-secondary">⬇</a>`:''}
            <button class="btn btn-sm btn-danger" onclick="deleteQP('${q.id}')">🗑</button>
          </td>
        </tr>`).join('')}
      </tbody></table>`:'<p class="text-muted">No papers uploaded.</p>'}
    </div>`;
}

function teacherViewGenQP(id) {
  const qp = DB.find('question_papers', id);
  if (!qp || !qp.generatedHtml) { alert('Paper not available'); return; }
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html><head><title>${qp.title}</title>
    <style>body{margin:20px 30px;font-family:Arial,sans-serif;} @media print{body{margin:0}}</style>
  </head><body>${qp.generatedHtml}
    <div style="text-align:center;margin-top:20px"><button onclick="window.print()" style="padding:10px 24px;background:#7c3aed;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:14px">🖨️ Print</button></div>
  </body></html>`);
  win.document.close();
}

// ═════════════════════════════════════════════════════════════════════════════
// QUESTION BANK  —  Teacher can add / manage questions
// ═════════════════════════════════════════════════════════════════════════════
let _tqbState = {
  classId:'', grade:'', subject:'', chapter:'',
  type:'short', marks:2, question:'', answer:'',
  options:['','','',''], correctOpt:'A',
  filter:'', filterSubject:'', filterType:''
};

function renderTeacherQuestionBank() {
  const bank    = DB.get('question_bank')||[];
  const classes = myClasses();
  const myGrades = classes.map(c=>c.grade||(c.name.match(/\d+/)||[''])[0]).filter(Boolean);
  const subjects = [...new Set(bank.map(q=>q.subject).filter(Boolean))].sort();
  const chapters = [...new Set(bank.map(q=>q.chapter).filter(Boolean))].sort();
  const s = _tqbState;

  // Filtered list — show all bank questions (teacher can add to shared bank)
  let filtered = bank.slice().reverse();
  if (s.filterSubject) filtered = filtered.filter(q=>q.subject===s.filterSubject);
  if (s.filterType)    filtered = filtered.filter(q=>q.type===s.filterType);
  if (s.filter)        filtered = filtered.filter(q=>(q.question||'').toLowerCase().includes(s.filter.toLowerCase()));

  const typeInfo = {
    short:     {label:'Short Answer', icon:'📝', color:'#10b981', bg:'rgba(16,185,129,.15)', marks:2},
    long:      {label:'Long Answer',  icon:'📄', color:'#f59e0b', bg:'rgba(245,158,11,.15)', marks:5},
    mcq:       {label:'MCQ',          icon:'❓', color:'#06b6d4', bg:'rgba(6,182,212,.15)',  marks:1},
    fill:      {label:'Fill in Blank',icon:'✏️', color:'#ec4899', bg:'rgba(236,72,153,.15)', marks:1},
    truefalse: {label:'True / False', icon:'⚖️', color:'#8b5cf6', bg:'rgba(139,92,246,.15)', marks:1},
  };
  const ti = typeInfo[s.type]||typeInfo.short;

  $('section-questionbank').innerHTML = `
  <div class="section-header">
    <h2 class="section-title">🗂️ Question Bank</h2>
    <span style="font-size:12px;color:var(--text-muted)">${bank.length} total questions</span>
  </div>

  <div style="display:grid;grid-template-columns:380px 1fr;gap:18px;align-items:start">

    <!-- ═══ LEFT: Add Question Form ═══ -->
    <div class="glass-card" style="padding:0;overflow:hidden;position:sticky;top:20px">
      <div style="padding:14px 16px;background:linear-gradient(135deg,rgba(124,58,237,.2),rgba(6,182,212,.1));font-weight:700;font-size:14px">➕ Add New Question</div>
      <div style="padding:14px;display:flex;flex-direction:column;gap:12px">

        <!-- Class → Subject → Chapter -->
        <div style="background:rgba(255,255,255,.04);border-radius:10px;padding:12px;border:1px solid rgba(255,255,255,.08)">
          <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px">📚 Class, Subject, Chapter</div>
          <div style="display:flex;flex-direction:column;gap:8px">
            <select id="tqb-class" style="width:100%;padding:8px 10px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:#fff;font-size:13px"
              onchange="_tqbState.classId=this.value;_tqbRefreshGrade()">
              <option value="">— Select Class —</option>
              ${classes.map(c=>`<option value="${c.id}" ${s.classId===c.id?'selected':''}>${c.name}</option>`).join('')}
            </select>
            <input id="tqb-subject" value="${s.subject}"
              style="padding:8px 10px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:#fff;font-size:13px"
              placeholder="Subject (e.g. Mathematics)" list="tqb-sub-dl"
              oninput="_tqbState.subject=this.value">
            <datalist id="tqb-sub-dl">${subjects.map(x=>`<option value="${x}">`).join('')}</datalist>
            <input id="tqb-chapter" value="${s.chapter}"
              style="padding:8px 10px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:#fff;font-size:13px"
              placeholder="Chapter / Topic" list="tqb-ch-dl"
              oninput="_tqbState.chapter=this.value">
            <datalist id="tqb-ch-dl">${chapters.map(x=>`<option value="${x}">`).join('')}</datalist>
          </div>
        </div>

        <!-- Question Type -->
        <div style="background:rgba(255,255,255,.04);border-radius:10px;padding:12px;border:1px solid rgba(255,255,255,.08)">
          <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px">🏷️ Question Type</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px">
            ${Object.entries(typeInfo).map(([key,t])=>`
            <button type="button" onclick="_tqbSetType('${key}')"
              style="display:flex;align-items:center;gap:5px;padding:7px 9px;border-radius:8px;border:1.5px solid ${s.type===key?t.color:'rgba(255,255,255,.12)'};background:${s.type===key?t.bg:'rgba(255,255,255,.03)'};cursor:pointer;font-size:12px;font-weight:${s.type===key?'700':'400'};color:${s.type===key?t.color:'var(--text-muted)'}">
              ${t.icon} ${t.label}
            </button>`).join('')}
          </div>
        </div>

        <!-- Marks + Question -->
        <div style="background:rgba(255,255,255,.04);border-radius:10px;padding:12px;border:1.5px solid ${ti.color}33">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
            <span style="font-size:11px;color:var(--text-muted)">Marks:</span>
            <input type="number" id="tqb-marks" value="${s.marks}" min="1" max="20"
              style="width:56px;padding:5px 8px;border-radius:7px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.06);color:#fff;font-size:13px;font-weight:700"
              oninput="_tqbState.marks=Number(this.value)||1">
            <span style="font-size:11px;color:${ti.color};background:${ti.bg};padding:3px 8px;border-radius:6px;font-weight:600">${ti.icon} ${ti.label}</span>
          </div>
          <textarea id="tqb-question" rows="3"
            style="width:100%;padding:9px;border-radius:9px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:#fff;font-size:13px;resize:vertical;font-family:inherit;line-height:1.5"
            placeholder="Question yahan type karo…"
            oninput="_tqbState.question=this.value">${s.question}</textarea>
        </div>

        <!-- MCQ Options -->
        <div id="tqb-mcq-wrap" style="display:${s.type==='mcq'?'block':'none'};background:rgba(6,182,212,.06);border-radius:10px;padding:12px;border:1px solid rgba(6,182,212,.2)">
          <div style="font-size:11px;font-weight:700;color:#06b6d4;margin-bottom:10px">❓ Options</div>
          ${['A','B','C','D'].map((ltr,idx)=>`
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:7px">
            <span style="width:22px;height:22px;border-radius:5px;background:rgba(6,182,212,.2);color:#06b6d4;font-weight:700;font-size:11px;display:flex;align-items:center;justify-content:center;flex-shrink:0">${ltr}</span>
            <input id="tqb-opt-${ltr}" value="${s.options[idx]||''}"
              style="flex:1;padding:7px 9px;border-radius:7px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:#fff;font-size:12px"
              placeholder="Option ${ltr}" oninput="_tqbState.options[${idx}]=this.value">
          </div>`).join('')}
          <div style="margin-top:8px">
            <div style="font-size:11px;color:var(--text-muted);margin-bottom:6px">✅ Correct Answer:</div>
            <div style="display:flex;gap:6px">
              ${['A','B','C','D'].map(ltr=>`
              <button type="button" onclick="_tqbState.correctOpt='${ltr}';document.querySelectorAll('.tqb-ans-btn').forEach(b=>{b.style.background=b.dataset.opt==='${ltr}'?'#06b6d4':'rgba(255,255,255,.06)';b.style.color=b.dataset.opt==='${ltr}'?'#fff':'var(--text-muted)'})"
                class="tqb-ans-btn" data-opt="${ltr}"
                style="flex:1;padding:7px;border-radius:7px;border:1px solid rgba(6,182,212,.3);background:${s.correctOpt===ltr?'#06b6d4':'rgba(255,255,255,.06)'};color:${s.correctOpt===ltr?'#fff':'var(--text-muted)'};cursor:pointer;font-weight:700;font-size:13px;transition:all .2s">
                ${ltr}
              </button>`).join('')}
            </div>
          </div>
        </div>

        <!-- True/False -->
        <div id="tqb-tf-wrap" style="display:${s.type==='truefalse'?'flex':'none'};gap:10px">
          <button type="button" onclick="_tqbState.answer='True';this.style.background='#10b981';this.style.color='#fff';this.nextElementSibling.style.background='rgba(255,255,255,.06)';this.nextElementSibling.style.color='var(--text-muted)'"
            style="flex:1;padding:10px;border-radius:9px;border:1px solid rgba(16,185,129,.3);background:${s.answer==='True'?'#10b981':'rgba(255,255,255,.06)'};color:${s.answer==='True'?'#fff':'var(--text-muted)'};cursor:pointer;font-weight:700;font-size:13px;transition:all .2s">
            ✅ True
          </button>
          <button type="button" onclick="_tqbState.answer='False';this.style.background='#ef4444';this.style.color='#fff';this.previousElementSibling.style.background='rgba(255,255,255,.06)';this.previousElementSibling.style.color='var(--text-muted)'"
            style="flex:1;padding:10px;border-radius:9px;border:1px solid rgba(239,68,68,.3);background:${s.answer==='False'?'#ef4444':'rgba(255,255,255,.06)'};color:${s.answer==='False'?'#fff':'var(--text-muted)'};cursor:pointer;font-weight:700;font-size:13px;transition:all .2s">
            ❌ False
          </button>
        </div>

        <!-- Model Answer -->
        <div id="tqb-ans-wrap" style="display:${['short','long','fill'].includes(s.type)?'block':'none'}">
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:6px">💡 Model Answer <span style="font-size:10px">(optional)</span></div>
          <textarea id="tqb-text-answer" rows="2"
            style="width:100%;padding:9px;border-radius:9px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:#fff;font-size:12px;resize:vertical;font-family:inherit"
            placeholder="Model answer / hints…"
            oninput="_tqbState.answer=this.value">${['short','long','fill'].includes(s.type)?s.answer:''}</textarea>
        </div>

        <!-- Add Button -->
        <button onclick="saveTQBank()" style="width:100%;padding:13px;background:linear-gradient(135deg,#7c3aed,#06b6d4);color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer">
          ➕ Add Question to Bank
        </button>
        <div id="tqb-status" style="font-size:12px;text-align:center;color:var(--text-muted);min-height:16px"></div>
      </div>
    </div>

    <!-- ═══ RIGHT: Question List ═══ -->
    <div>
      <!-- Filters -->
      <div class="glass-card mb-12" style="padding:12px">
        <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">
          <div style="position:relative;flex:1;min-width:150px">
            <span style="position:absolute;left:10px;top:50%;transform:translateY(-50%)">🔍</span>
            <input placeholder="Search…" value="${s.filter}"
              style="width:100%;padding:8px 8px 8px 30px;border-radius:9px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:#fff;font-size:12px"
              oninput="_tqbState.filter=this.value;_tqbRefreshList()">
          </div>
          <select style="padding:8px 10px;border-radius:9px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:#fff;font-size:12px"
            onchange="_tqbState.filterSubject=this.value;_tqbRefreshList()">
            <option value="">All Subjects</option>
            ${subjects.map(x=>`<option value="${x}" ${s.filterSubject===x?'selected':''}>${x}</option>`).join('')}
          </select>
          <select style="padding:8px 10px;border-radius:9px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:#fff;font-size:12px"
            onchange="_tqbState.filterType=this.value;_tqbRefreshList()">
            <option value="">All Types</option>
            ${Object.entries(typeInfo).map(([k,t])=>`<option value="${k}" ${s.filterType===k?'selected':''}>${t.icon} ${t.label}</option>`).join('')}
          </select>
          <span style="font-size:11px;color:var(--text-muted)">${filtered.length} / ${bank.length}</span>
        </div>
      </div>
      <div id="tqbank-list">${_tqbRenderList(filtered,typeInfo)}</div>
    </div>
  </div>`;
}

function _tqbRenderList(questions, typeInfo) {
  if (!questions.length) return `<div class="glass-card" style="text-align:center;padding:50px 20px">
    <div style="font-size:2.5rem;margin-bottom:12px">🗂️</div>
    <div style="font-weight:600;margin-bottom:6px">No questions yet</div>
    <div style="font-size:.82rem;color:var(--text-muted)">Add questions using the form on the left</div>
  </div>`;

  const groups = {};
  questions.forEach(q=>{
    const key=`${q.subject||'General'}|||${q.chapter||'—'}|||${q.grade||''}`;
    if(!groups[key]) groups[key]=[];
    groups[key].push(q);
  });

  return Object.entries(groups).map(([key,qs])=>{
    const [subj,chap,grade]=key.split('|||');
    return `<div class="glass-card mb-12" style="padding:0;overflow:hidden">
      <div style="padding:10px 14px;background:rgba(124,58,237,.1);display:flex;align-items:center;justify-content:space-between">
        <div>
          <span style="font-weight:700;font-size:13px">${subj}</span>
          ${chap&&chap!=='—'?`<span style="font-size:11px;color:var(--text-muted);margin-left:8px">📖 ${chap}</span>`:''}
          ${grade?`<span style="font-size:11px;color:var(--text-muted);margin-left:8px">Class ${grade}</span>`:''}
        </div>
        <span style="background:rgba(124,58,237,.3);color:#a78bfa;font-size:11px;padding:2px 8px;border-radius:999px">${qs.length} Q</span>
      </div>
      ${qs.map((q,i)=>{
        const t=typeInfo[q.type]||typeInfo.short;
        return `<div style="padding:12px 14px;border-bottom:${i<qs.length-1?'1px solid rgba(255,255,255,.06)':'none'}">
          <div style="display:flex;align-items:flex-start;gap:10px">
            <div style="flex-shrink:0;width:28px;height:28px;border-radius:7px;background:${t.bg};display:flex;align-items:center;justify-content:center;font-size:.85rem">${t.icon}</div>
            <div style="flex:1;min-width:0">
              <div style="display:flex;gap:5px;margin-bottom:5px;flex-wrap:wrap">
                <span style="font-size:10px;font-weight:700;color:${t.color};background:${t.bg};padding:2px 7px;border-radius:999px">${t.label}</span>
                <span style="font-size:10px;color:#f59e0b;background:rgba(245,158,11,.1);padding:2px 7px;border-radius:999px">${q.marks||1} mark${q.marks>1?'s':''}</span>
              </div>
              <div style="font-size:13px;font-weight:600;line-height:1.5;margin-bottom:${q.type==='mcq'?'6px':'0'}">${q.question}</div>
              ${q.type==='mcq'&&q.options?.length?`<div style="display:grid;grid-template-columns:1fr 1fr;gap:2px 14px">
                ${q.options.map((o,oi)=>{const l=String.fromCharCode(65+oi);return o?`<div style="font-size:11px;color:${l===q.answer?'#10b981':'var(--text-muted)'}${l===q.answer?';font-weight:700':''}">${l}) ${o}${l===q.answer?' ✓':''}</div>`:''}).join('')}
              </div>`:''}
              ${q.type==='truefalse'?`<div style="font-size:11px;color:#10b981;margin-top:3px">✅ ${q.answer}</div>`:''}
              ${q.answer&&!['mcq','truefalse'].includes(q.type)?`<div style="font-size:11px;color:var(--text-muted);margin-top:3px;font-style:italic">💡 ${q.answer.slice(0,60)}${q.answer.length>60?'…':''}</div>`:''}
            </div>
            <button onclick="tqbDelete('${q.id}')" style="flex-shrink:0;background:rgba(239,68,68,.15);color:#f87171;border:1px solid rgba(239,68,68,.3);border-radius:7px;padding:4px 8px;cursor:pointer;font-size:11px">🗑</button>
          </div>
        </div>`;
      }).join('')}
    </div>`;
  }).join('');
}

function _tqbRefreshList() {
  const bank = DB.get('question_bank')||[];
  const s = _tqbState;
  const typeInfo = {short:{label:'Short Answer',icon:'📝',color:'#10b981',bg:'rgba(16,185,129,.15)'},long:{label:'Long Answer',icon:'📄',color:'#f59e0b',bg:'rgba(245,158,11,.15)'},mcq:{label:'MCQ',icon:'❓',color:'#06b6d4',bg:'rgba(6,182,212,.15)'},fill:{label:'Fill in Blank',icon:'✏️',color:'#ec4899',bg:'rgba(236,72,153,.15)'},truefalse:{label:'True/False',icon:'⚖️',color:'#8b5cf6',bg:'rgba(139,92,246,.15)'}};
  let filtered = bank.slice().reverse();
  if (s.filterSubject) filtered = filtered.filter(q=>q.subject===s.filterSubject);
  if (s.filterType)    filtered = filtered.filter(q=>q.type===s.filterType);
  if (s.filter)        filtered = filtered.filter(q=>(q.question||'').toLowerCase().includes(s.filter.toLowerCase()));
  const el = document.getElementById('tqbank-list');
  if (el) el.innerHTML = _tqbRenderList(filtered, typeInfo);
}

function _tqbRefreshGrade() {
  const classes = myClasses();
  const cls = classes.find(c=>c.id===_tqbState.classId);
  if (cls) _tqbState.grade = cls.grade||(cls.name.match(/\d+/)||[''])[0];
}

function _tqbSetType(type) {
  _tqbState.type = type;
  const typeMarks = {short:2, long:5, mcq:1, fill:1, truefalse:1};
  _tqbState.marks = typeMarks[type]||2;
  const typeInfo = {short:{color:'#10b981',bg:'rgba(16,185,129,.15)'},long:{color:'#f59e0b',bg:'rgba(245,158,11,.15)'},mcq:{color:'#06b6d4',bg:'rgba(6,182,212,.15)'},fill:{color:'#ec4899',bg:'rgba(236,72,153,.15)'},truefalse:{color:'#8b5cf6',bg:'rgba(139,92,246,.15)'}};
  const mcqWrap = document.getElementById('tqb-mcq-wrap');
  const tfWrap  = document.getElementById('tqb-tf-wrap');
  const ansWrap = document.getElementById('tqb-ans-wrap');
  const marksEl = document.getElementById('tqb-marks');
  if (mcqWrap) mcqWrap.style.display = type==='mcq' ? 'block' : 'none';
  if (tfWrap)  tfWrap.style.display  = type==='truefalse' ? 'flex' : 'none';
  if (ansWrap) ansWrap.style.display = ['short','long','fill'].includes(type) ? 'block' : 'none';
  if (marksEl) marksEl.value = _tqbState.marks;
  document.querySelectorAll('[onclick^="_tqbSetType"]').forEach(btn=>{
    const bType = btn.getAttribute('onclick').replace("_tqbSetType('","").replace("')","");
    const t = typeInfo[bType]||{};
    const isActive = bType===type;
    btn.style.border     = `1.5px solid ${isActive?(t.color||'#7c3aed'):'rgba(255,255,255,.12)'}`;
    btn.style.background = isActive ? (t.bg||'rgba(124,58,237,.15)') : 'rgba(255,255,255,.03)';
    btn.style.color      = isActive ? (t.color||'#7c3aed') : 'var(--text-muted)';
    btn.style.fontWeight = isActive ? '700' : '400';
  });
}

function saveTQBank() {
  const s = _tqbState;
  const classId  = document.getElementById('tqb-class')?.value||'';
  const subject  = (document.getElementById('tqb-subject')?.value||'').trim();
  const chapter  = (document.getElementById('tqb-chapter')?.value||'').trim();
  const question = (document.getElementById('tqb-question')?.value||'').trim();
  const marks    = Number(document.getElementById('tqb-marks')?.value)||1;
  const type     = s.type;

  const classes = myClasses();
  const cls = classes.find(c=>c.id===classId);
  const grade = cls ? (cls.grade||(cls.name.match(/\d+/)||[''])[0]) : s.grade;

  if (!classId)  { toast('Select a class','warning'); return; }
  if (!subject)  { toast('Subject is required','warning'); return; }
  if (!question) { toast('Question is required','warning'); return; }

  let answer='', options=[];
  if (type==='mcq') {
    options=['A','B','C','D'].map(l=>(document.getElementById(`tqb-opt-${l}`)?.value||'').trim());
    answer = s.correctOpt||'A';
    if (!options.filter(Boolean).length) { toast('MCQ options are required','warning'); return; }
  } else if (type==='truefalse') {
    answer = s.answer||'True';
  } else {
    answer = (document.getElementById('tqb-text-answer')?.value||'').trim();
  }

  const bank = DB.get('question_bank')||[];
  bank.push({id:genId('qb'), type, subject, grade, classId, chapter, question, marks, options, answer, addedBy:CU.name, addedOn:today()});
  DB.set('question_bank', bank);

  // Reset question only
  _tqbState.question=''; _tqbState.answer=''; _tqbState.options=['','','','']; _tqbState.correctOpt='A';
  const qEl=document.getElementById('tqb-question'); if(qEl) qEl.value='';
  const taEl=document.getElementById('tqb-text-answer'); if(taEl) taEl.value='';
  ['A','B','C','D'].forEach(l=>{const el=document.getElementById(`tqb-opt-${l}`);if(el) el.value='';});
  const statusEl=document.getElementById('tqb-status');
  if (statusEl) { statusEl.innerHTML=`<span style="color:#10b981">✅ Question added! (${bank.length} total)</span>`; setTimeout(()=>{if(statusEl)statusEl.textContent=''},2500); }
  _tqbRefreshList();
}

function tqbDelete(id) {
  if (!confirm('Delete this question?')) return;
  DB.set('question_bank', (DB.get('question_bank')||[]).filter(q=>q.id!==id));
  toast('Question deleted','success');
  _tqbRefreshList();
}
function openQPModal(){
  const classes=myClasses();
  buildModal('qpModal','Upload Question Paper',`
    <div class="form-grid">
      <div class="form-group"><label class="form-label">Title</label><input class="form-control" id="qpTitle"></div>
      <div class="form-group"><label class="form-label">Class</label>
        <select class="form-control" id="qpClass">${classes.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">Subject</label><input class="form-control" id="qpSubject"></div>
      <div class="form-group"><label class="form-label">Year</label><input class="form-control" id="qpYear" placeholder="2024"></div>
      <div class="form-group" style="grid-column:1/-1"><label class="form-label">File</label><input type="file" class="form-control" id="qpFile"></div>
    </div>`,saveQP);
}
async function saveQP(){
  if(!val('qpTitle')) return toast('Enter title','warning');
  let fileData=null;
  const fi=$('qpFile');
  if(fi&&fi.files[0]){try{fileData=await fileToBase64(fi.files[0]);}catch(e){}}
  DB.push('qpapers',{id:genId('qp'),title:val('qpTitle'),classId:val('qpClass'),subject:val('qpSubject'),year:val('qpYear'),fileData,teacherId:CU.id,date:today()});
  closeModal('qpModal'); toast('Paper uploaded!','success'); renderQPapers();
}
function deleteQP(id){if(confirm('Delete?')){DB.delete('qpapers',id);renderQPapers();}}

// ═════════════════════════════════════════════════════════════════════════════
// NOTICES
// ═════════════════════════════════════════════════════════════════════════════
function renderNotices(){
  const notices=DB.get('notices')
    .filter(n=>n.authorId===CU.id||n.audience==='all'||n.audience==='teacher')
    .sort((a,b)=>b.date.localeCompare(a.date));
  $('section-notices').innerHTML=`
    <div class="section-header">
      <h2 class="section-title">Notices</h2>
      <button class="btn btn-primary" onclick="openNoticeModal()">+ Post Notice</button>
    </div>
    <div class="glass-card">
      ${notices.map(n=>`
        <div style="margin-bottom:12px;padding:16px;background:var(--glass);border-radius:12px;border:1px solid var(--border)">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px">
            <div>
              <h4>${n.title}</h4>
              <p style="color:var(--text-muted);font-size:13px;margin-top:4px;line-height:1.5">${n.body||''}</p>
              <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">
                <span class="badge badge-purple">${n.audience}</span>
                <span style="color:var(--text-muted);font-size:12px">By ${n.authorName||'Admin'} · ${n.date}</span>
              </div>
            </div>
            ${n.authorId===CU.id?`<button class="btn btn-sm btn-danger" onclick="deleteNotice('${n.id}')">🗑</button>`:''}
          </div>
        </div>`).join('')||'<p class="text-muted">No notices.</p>'}
    </div>`;
}
function openNoticeModal(){
  buildModal('noticeModal','Post Notice',`
    <div class="form-group"><label class="form-label">Title</label><input class="form-control" id="ntTitle"></div>
    <div class="form-group"><label class="form-label">Body</label><textarea class="form-control" id="ntBody" rows="4"></textarea></div>
    <div class="form-group"><label class="form-label">Audience</label>
      <select class="form-control" id="ntAud">
        <option value="all">All</option>
        <option value="student">Students</option>
        <option value="teacher">Teachers</option>
      </select></div>`,saveNotice);
}
function saveNotice(){
  if(!val('ntTitle')) return toast('Enter title','warning');
  DB.push('notices',{id:genId('nt'),title:val('ntTitle'),body:val('ntBody'),audience:val('ntAud'),authorId:CU.id,authorName:DB.find('teachers',CU.id)?.name||'Teacher',date:today()});
  closeModal('noticeModal'); toast('Notice posted!','success'); renderNotices();
}
function deleteNotice(id){if(confirm('Delete?')){DB.delete('notices',id);renderNotices();}}

// ═════════════════════════════════════════════════════════════════════════════
// LEAVE APPLICATIONS
// ═════════════════════════════════════════════════════════════════════════════
function renderLeaves(){
  const ids=myClassIds();
  const stuLeaves=DB.get('leaves').filter(l=>l.type==='student'&&ids.includes(l.classId)).sort((a,b)=>b.applyDate.localeCompare(a.applyDate));
  const myLeaves=DB.get('leaves').filter(l=>l.type==='teacher'&&l.teacherId===CU.id).sort((a,b)=>b.applyDate.localeCompare(a.applyDate));
  const pending=stuLeaves.filter(l=>l.status==='pending').length;

  $('section-leaves').innerHTML=`
    <div class="section-header">
      <h2 class="section-title">Leave Applications</h2>
      <button class="btn btn-primary" onclick="openMyLeaveModal()">+ Apply for Leave</button>
    </div>

    ${pending>0?`<div class="glass-card" style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.3);margin-bottom:16px;padding:14px">
      <p style="color:#f59e0b;font-weight:600">⚠️ ${pending} student leave request${pending>1?'s':''} pending your approval</p>
    </div>`:''}

    <div class="glass-card">
      <h3 class="card-title">Student Leave Requests</h3>
      ${stuLeaves.length?`<table class="data-table"><thead><tr><th>Student</th><th>Class</th><th>From</th><th>To</th><th>Reason</th><th>Status</th><th>Action</th></tr></thead><tbody>
        ${stuLeaves.map(l=>`<tr>
          <td>${DB.find('students',l.studentId)?.name||l.studentId}</td>
          <td>${DB.find('classes',l.classId)?.name||l.classId}</td>
          <td>${l.fromDate}</td><td>${l.toDate}</td><td>${l.reason}</td>
          <td><span class="badge ${l.status==='approved'?'badge-green':l.status==='rejected'?'badge-red':'badge-yellow'}">${l.status}</span></td>
          <td>${l.status==='pending'
            ?`<div style="display:flex;gap:4px"><button class="btn btn-sm btn-success" onclick="updateLeave('${l.id}','approved')">✅ Approve</button><button class="btn btn-sm btn-danger" onclick="updateLeave('${l.id}','rejected')">❌ Reject</button></div>`
            :'—'}</td>
        </tr>`).join('')}
      </tbody></table>`:'<p class="text-muted">No student leave requests.</p>'}
    </div>
    <div class="glass-card mt-8">
      <h3 class="card-title">My Leave Applications</h3>
      ${myLeaves.length?`<table class="data-table"><thead><tr><th>From</th><th>To</th><th>Reason</th><th>Applied</th><th>Status</th></tr></thead><tbody>
        ${myLeaves.map(l=>`<tr>
          <td>${l.fromDate}</td><td>${l.toDate}</td><td>${l.reason}</td><td>${l.applyDate}</td>
          <td><span class="badge ${l.status==='approved'?'badge-green':l.status==='rejected'?'badge-red':'badge-yellow'}">${l.status}</span></td>
        </tr>`).join('')}
      </tbody></table>`:'<p class="text-muted">No leave applications yet.</p>'}
    </div>`;
}
function openMyLeaveModal(){
  buildModal('myLeaveModal','Apply for Leave',`
    <div class="form-grid">
      <div class="form-group"><label class="form-label">From Date</label><input type="date" class="form-control" id="lvFrom" value="${today()}"></div>
      <div class="form-group"><label class="form-label">To Date</label><input type="date" class="form-control" id="lvTo" value="${today()}"></div>
      <div class="form-group" style="grid-column:1/-1"><label class="form-label">Reason</label><textarea class="form-control" id="lvReason" rows="3"></textarea></div>
    </div>`,saveMyLeave);
}
function saveMyLeave(){
  if(!val('lvReason')) return toast('Enter reason','warning');
  DB.push('leaves',{id:genId('lv'),type:'teacher',teacherId:CU.id,fromDate:val('lvFrom'),toDate:val('lvTo'),reason:val('lvReason'),status:'pending',applyDate:today()});
  closeModal('myLeaveModal'); toast('Leave applied!','success'); renderLeaves();
}
function updateLeave(id,status){
  DB.update('leaves',id,{status});
  toast(`Leave ${status}!`,status==='approved'?'success':'error');
  renderLeaves();
}

// ═════════════════════════════════════════════════════════════════════════════
// LEADERBOARD
// ═════════════════════════════════════════════════════════════════════════════
let _tlbClass='__all__', _tlbExamType='__all__';
function renderLeaderboard(){
  const ids=myClassIds();
  const classes=DB.get('classes').filter(c=>ids.includes(c.id));
  const allExams=DB.get('exams').filter(e=>ids.includes(e.classId));
  const classExams=_tlbClass==='__all__'?allExams:allExams.filter(e=>e.classId===_tlbClass);
  const examTypes=[...new Set(classExams.map(e=>e.name))].sort();
  const filtExams=_tlbExamType==='__all__'?classExams:classExams.filter(e=>e.name===_tlbExamType);
  const marks=DB.get('marks');
  const students=(_tlbClass==='__all__'
    ?DB.get('students').filter(s=>ids.includes(s.classId))
    :DB.get('students').filter(s=>s.classId===_tlbClass));
  const scores=students.map(s=>{
    let tot=0,mx=0;
    filtExams.filter(e=>e.classId===s.classId).forEach(e=>{
      const m=marks.find(mk=>mk.examId===e.id&&mk.studentId===s.id);
      if(m!==undefined){tot+=parseFloat(m.obtained);mx+=e.maxMarks;}
    });
    return {...s,total:tot,max:mx,pct:mx>0?Math.round(tot/mx*100):0};
  }).sort((a,b)=>b.pct-a.pct);
  const top10=scores.slice(0,10);
  const top3=scores.slice(0,3);

  $('section-leaderboard').innerHTML=`
    <div class="section-header"><h2 class="section-title">Leaderboard</h2></div>

    <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:20px;align-items:flex-end">
      <div>
        <div style="font-size:.78rem;font-weight:600;margin-bottom:4px;color:var(--text-muted)">Class</div>
        <select class="form-control" style="width:170px" onchange="_tlbClass=this.value;_tlbExamType='__all__';renderLeaderboard()">
          <option value="__all__" ${_tlbClass==='__all__'?'selected':''}>All My Classes</option>
          ${classes.map(c=>`<option value="${c.id}" ${c.id===_tlbClass?'selected':''}>${c.name}</option>`).join('')}
        </select>
      </div>
      <div>
        <div style="font-size:.78rem;font-weight:600;margin-bottom:4px;color:var(--text-muted)">Exam</div>
        <select class="form-control" style="width:190px" onchange="_tlbExamType=this.value;renderLeaderboard()">
          <option value="__all__" ${_tlbExamType==='__all__'?'selected':''}>All Exams (Combined)</option>
          ${examTypes.map(t=>`<option value="${t}" ${t===_tlbExamType?'selected':''}>${t}</option>`).join('')}
        </select>
      </div>
      <div style="align-self:flex-end;font-size:.82rem;color:var(--text-muted)">
        ${scores.length} students · ${_tlbExamType==='__all__'?'All exams':_tlbExamType}
      </div>
    </div>

    ${top3.length>=3?`<div class="podium-row">
      ${[top3[1],top3[0],top3[2]].map((s,i)=>{
        const pos=[2,1,3][i],ht={1:'120px',2:'90px',3:'75px'}[pos];
        return `<div class="podium-item">
          <div class="podium-avatar">${(s.name||'?')[0].toUpperCase()}</div>
          <div style="font-weight:700">${s.name}</div>
          <div style="color:var(--text-muted);font-size:13px">${s.pct}%</div>
          <div class="podium-block pos-${pos}" style="height:${ht}">#${pos}</div>
        </div>`;
      }).join('')}
    </div>`:''}

    ${top10.length?`
    <div class="glass-card mt-8">
      <h3 class="card-title">📊 Top 10 — ${_tlbExamType==='__all__'?'Overall':_tlbExamType}</h3>
      <div style="position:relative;height:260px"><canvas id="tChLeader"></canvas></div>
    </div>`:''}

    <div class="glass-card mt-8">
      <table class="data-table"><thead><tr><th>Rank</th><th>Student</th><th>Class</th><th>Score</th><th>%</th><th>Grade</th></tr></thead><tbody>
        ${scores.length?scores.map((s,i)=>{
          const g=getGrade(s.pct);
          return `<tr>
            <td><strong>${i===0?'🥇':i===1?'🥈':i===2?'🥉':'#'+(i+1)}</strong></td>
            <td>${s.name}</td>
            <td>${DB.find('classes',s.classId)?.name||s.classId}</td>
            <td>${s.total}/${s.max}</td>
            <td>${s.pct}%</td>
            <td><span class="badge" style="background:${g.color}20;color:${g.color}">${g.grade}</span></td>
          </tr>`;
        }).join(''):'<tr><td colspan="6" style="text-align:center;color:var(--text-muted)">No data yet</td></tr>'}
      </tbody></table>
    </div>`;

  if(top10.length) mkChart('tChLeader',{type:'bar',data:{
    labels:top10.map((s,i)=>`#${i+1} ${s.name.split(' ')[0]}`),
    datasets:[{
      label:'Score %',
      data:top10.map(s=>s.pct),
      backgroundColor:top10.map(s=>{const g=getGrade(s.pct);return g.color+'cc';}),
      borderRadius:8,borderSkipped:false
    }]
  },options:{responsive:true,maintainAspectRatio:false,
    plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>`${c.raw}% — ${getGrade(c.raw).grade}`}}},
    scales:{x:{ticks:{color:CH.tick},grid:{display:false}},y:{min:0,max:100,ticks:{color:CH.tick,callback:v=>v+'%'},grid:{color:CH.grid}}}}});
}

// ═════════════════════════════════════════════════════════════════════════════
// PRINT ATTENDANCE
// ═════════════════════════════════════════════════════════════════════════════
function printTchAttSheet() {
  const cls = DB.find('classes', _att.classId);
  const students = DB.get('students').filter(s=>s.classId===_att.classId);
  const s = getSettings();
  const rows = students.map((st,i) => {
    const status = _att.marks[st.id] || '—';
    return `<tr><td>${i+1}</td><td>${st.name}</td><td>${st.rollNo||''}</td><td>${status}</td><td style="width:120px"></td></tr>`;
  }).join('');
  printHtml(`
    <div style="text-align:center;margin-bottom:20px">
      <h2 style="margin:0">${s.schoolName||'School'}</h2>
      <h3>Attendance — ${cls?cls.name:'Class'} — ${formatDate(_att.date)}</h3>
    </div>
    <table>
      <thead><tr><th>#</th><th>Name</th><th>Roll</th><th>Status</th><th>Signature</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`, 'Attendance Sheet');
}

// ═════════════════════════════════════════════════════════════════════════════
// MY TASKS (from Admin)
// ═════════════════════════════════════════════════════════════════════════════
function renderMyTasks() {
  const tasks = (DB.get('teacher_tasks')||[]).filter(t=>t.teacherId===CU.id);
  const pending  = tasks.filter(t=>t.status==='pending').length;
  const inProg   = tasks.filter(t=>t.status==='in-progress').length;

  $('section-tasks').innerHTML = `
    <div class="section-header">
      <h2 class="section-title">My Tasks & Messages</h2>
    </div>
    <div style="display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap">
      <div class="glass-card" style="flex:1;min-width:120px;text-align:center;padding:16px">
        <div style="font-size:1.8rem;font-weight:800;color:var(--yellow)">${pending}</div>
        <div style="font-size:.75rem;color:var(--text-muted);text-transform:uppercase;margin-top:4px">Pending</div>
      </div>
      <div class="glass-card" style="flex:1;min-width:120px;text-align:center;padding:16px">
        <div style="font-size:1.8rem;font-weight:800;color:var(--cyan)">${inProg}</div>
        <div style="font-size:.75rem;color:var(--text-muted);text-transform:uppercase;margin-top:4px">In Progress</div>
      </div>
      <div class="glass-card" style="flex:1;min-width:120px;text-align:center;padding:16px">
        <div style="font-size:1.8rem;font-weight:800;color:var(--green)">${tasks.filter(t=>t.status==='done').length}</div>
        <div style="font-size:.75rem;color:var(--text-muted);text-transform:uppercase;margin-top:4px">Done</div>
      </div>
    </div>
    ${tasks.length ? tasks.slice().reverse().map(task => {
      const stColor = task.status==='done'?'var(--green)':task.status==='in-progress'?'var(--cyan)':'var(--yellow)';
      return `<div class="glass-card mb-8">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px">
          <div>
            <div style="font-weight:700;font-size:1rem;margin-bottom:4px">${task.title}</div>
            <div style="font-size:.82rem;color:var(--text-muted)">From: ${task.sentBy||'Admin'} &nbsp;·&nbsp; ${formatDate(task.date)}${task.dueDate?' &nbsp;·&nbsp; Due: '+formatDate(task.dueDate):''}</div>
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            ${task.priority==='high'?'<span style="font-size:.7rem;padding:2px 8px;border-radius:20px;background:rgba(239,68,68,.15);color:#ef4444;font-weight:700">🔴 HIGH</span>':''}
            <span style="font-size:.75rem;padding:2px 10px;border-radius:20px;background:rgba(255,255,255,.08);color:${stColor};border:1px solid ${stColor}40">${task.status}</span>
          </div>
        </div>
        ${task.message?`<div style="margin-top:10px;font-size:.88rem;color:var(--text-2);padding:10px;background:rgba(255,255,255,.03);border-radius:8px">${task.message}</div>`:''}
        <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
          ${task.status!=='in-progress'?`<button class="btn btn-sm" style="background:rgba(6,182,212,.15);color:#06b6d4;border:1px solid rgba(6,182,212,.3)" onclick="updateTaskStatus('${task.id}','in-progress')">▶️ Mark In Progress</button>`:''}
          ${task.status!=='done'?`<button class="btn btn-sm" style="background:rgba(16,185,129,.15);color:#10b981;border:1px solid rgba(16,185,129,.3)" onclick="updateTaskStatus('${task.id}','done')">✅ Mark Done</button>`:''}
        </div>
      </div>`;
    }).join('') : '<div class="glass-card" style="text-align:center;padding:48px"><div style="font-size:48px;margin-bottom:12px">📨</div><h3>No tasks assigned</h3><p style="color:var(--text-muted);margin-top:8px">Tasks from admin will appear here</p></div>'}`;
}

function updateTaskStatus(id, status) {
  const tasks = DB.get('teacher_tasks') || [];
  const idx = tasks.findIndex(t=>t.id===id);
  if (idx !== -1) { tasks[idx].status = status; DB.set('teacher_tasks', tasks); }
  toast(status==='done'?'Marked as done!':'Marked in progress!', 'success');
  renderMyTasks();
}

// ═════════════════════════════════════════════════════════════════════════════
// MY SALARY RECEIPTS
// ═════════════════════════════════════════════════════════════════════════════
function renderMySalary() {
  const receipts = (DB.get('salary_receipts')||[]).filter(r=>r.teacherId===CU.id);
  const t = DB.find('teachers', CU.id) || {};
  const s = getSettings();

  $('section-salary').innerHTML = `
    <div class="section-header"><h2 class="section-title">My Salary Receipts</h2></div>
    <div class="glass-card mb-16">
      <div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">
        <div style="width:56px;height:56px;border-radius:14px;background:linear-gradient(135deg,#7c3aed,#06b6d4);display:flex;align-items:center;justify-content:center;font-size:1.6rem">💼</div>
        <div>
          <div style="font-weight:800;font-size:1.1rem">${t.name||CU.name}</div>
          <div style="font-size:.82rem;color:var(--text-muted)">${t.subject||''} · Monthly Salary: ${s.currency||'₹'}${Number(t.salary||0).toLocaleString()}</div>
        </div>
        <div style="margin-left:auto;text-align:right">
          <div style="font-size:1.5rem;font-weight:800;color:var(--green)">${receipts.length}</div>
          <div style="font-size:.72rem;color:var(--text-muted);text-transform:uppercase">Receipts Issued</div>
        </div>
      </div>
    </div>
    ${receipts.length ? `<div class="glass-card">
      <div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse">
        <thead><tr style="border-bottom:1px solid rgba(255,255,255,.08)">
          <th style="padding:12px;text-align:left;font-size:.78rem;color:var(--text-muted);text-transform:uppercase">Month</th>
          <th style="padding:12px;text-align:left;font-size:.78rem;color:var(--text-muted);text-transform:uppercase">Amount</th>
          <th style="padding:12px;text-align:left;font-size:.78rem;color:var(--text-muted);text-transform:uppercase">Date</th>
          <th style="padding:12px;text-align:left;font-size:.78rem;color:var(--text-muted);text-transform:uppercase">Mode</th>
          <th style="padding:12px;text-align:left;font-size:.78rem;color:var(--text-muted);text-transform:uppercase">Actions</th>
        </tr></thead>
        <tbody>
          ${receipts.slice().reverse().map(r=>`
          <tr style="border-bottom:1px solid rgba(255,255,255,.05)">
            <td style="padding:12px;font-weight:600">${r.month||'—'}</td>
            <td style="padding:12px;color:var(--green);font-weight:700">${s.currency||'₹'}${Number(r.amount||0).toLocaleString()}</td>
            <td style="padding:12px;color:var(--text-muted)">${formatDate(r.paidOn||r.date)}</td>
            <td style="padding:12px">${r.paymentMode||'Cash'}</td>
            <td style="padding:12px"><button class="btn btn-sm btn-secondary" onclick="printMySalaryReceipt('${r.id}')">🖨️ Print</button></td>
          </tr>`).join('')}
        </tbody>
      </table></div>
    </div>` : '<div class="glass-card" style="text-align:center;padding:48px"><div style="font-size:48px;margin-bottom:12px">💼</div><h3>No salary receipts yet</h3><p style="color:var(--text-muted);margin-top:8px">Receipts issued by admin will appear here</p></div>'}`;
}

function printMySalaryReceipt(id) {
  const r = (DB.get('salary_receipts')||[]).find(x=>x.id===id);
  if (!r) return;
  const t = DB.find('teachers', CU.id) || {};
  const s = getSettings();
  printHtml(`
    <div style="text-align:center;margin-bottom:24px;border-bottom:2px solid #6d28d9;padding-bottom:16px">
      <h2 style="margin:0;color:#6d28d9">${s.schoolName||'School'}</h2>
      <h3 style="margin:6px 0">SALARY RECEIPT</h3>
    </div>
    <table style="margin-bottom:20px">
      <tr><td style="padding:8px 12px;width:180px;background:#f5f5f5"><strong>Receipt No</strong></td><td style="padding:8px 12px">${r.id}</td></tr>
      <tr><td style="padding:8px 12px;background:#f5f5f5"><strong>Employee Name</strong></td><td style="padding:8px 12px">${t.name||CU.name}</td></tr>
      <tr><td style="padding:8px 12px;background:#f5f5f5"><strong>Subject</strong></td><td style="padding:8px 12px">${t.subject||'—'}</td></tr>
      <tr><td style="padding:8px 12px;background:#f5f5f5"><strong>Month</strong></td><td style="padding:8px 12px">${r.month||'—'}</td></tr>
      <tr><td style="padding:8px 12px;background:#f5f5f5"><strong>Salary Amount</strong></td><td style="padding:8px 12px;font-weight:700;color:#059669">${s.currency||'₹'}${Number(r.amount||0).toLocaleString()}</td></tr>
      <tr><td style="padding:8px 12px;background:#f5f5f5"><strong>Payment Date</strong></td><td style="padding:8px 12px">${formatDate(r.paidOn||r.date)}</td></tr>
      <tr><td style="padding:8px 12px;background:#f5f5f5"><strong>Payment Mode</strong></td><td style="padding:8px 12px">${r.paymentMode||'Cash'}</td></tr>
    </table>
    <div style="display:flex;justify-content:space-between;margin-top:40px;padding-top:20px;border-top:1px solid #ddd">
      <div>Employee Signature: _______________</div>
      <div>Authorized Signatory: _______________</div>
    </div>`, 'Salary Receipt');
}

// ═════════════════════════════════════════════════════════════════════════════
// ID CARD GENERATOR (Advanced — Multiple Templates)
// ═════════════════════════════════════════════════════════════════════════════
let _idTemplate = 'royal';
let _idClassId  = '';

function renderIDCardGenerator() {
  const classes  = myClasses();
  if (!_idClassId && classes[0]) _idClassId = classes[0].id;
  const students = _idClassId ? DB.get('students').filter(s=>s.classId===_idClassId) : [];
  const s        = getSettings();
  const allClasses = DB.get('classes');
  const themes = ['royal','ocean','forest','sunset'];

  $('section-idcard').innerHTML = `
    <div class="section-header"><h2 class="section-title">🪪 ID Card Generator</h2></div>

    <div class="glass-card mb-16">
      <div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">
        <div>
          <label class="form-label">Class</label>
          <select class="form-control" style="min-width:160px" onchange="_idClassId=this.value;renderIDCardGenerator()">
            ${classes.map(c=>`<option value="${c.id}" ${c.id===_idClassId?'selected':''}>${c.name}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="form-label">Theme</label>
          <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
            ${themes.map(th=>`<button onclick="_idTemplate='${th}';renderIDCardGenerator()" style="padding:5px 14px;border-radius:20px;border:2px solid ${th===_idTemplate?'#a78bfa':'rgba(255,255,255,.15)'};background:${th==='royal'?'linear-gradient(135deg,#4c1d95,#1e3a5f)':th==='ocean'?'linear-gradient(135deg,#0c4a6e,#065f46)':th==='forest'?'linear-gradient(135deg,#14532d,#1e3a5f)':'linear-gradient(135deg,#7c2d12,#1e3a5f)'};cursor:pointer;font-size:.78rem;color:#fff;font-weight:600;">${th.charAt(0).toUpperCase()+th.slice(1)}</button>`).join('')}
          </div>
        </div>
        <div style="margin-left:auto;">
          <button class="btn btn-primary" onclick="printAllIDCards()">🖨️ Print All (${students.length})</button>
        </div>
      </div>
    </div>

    <div style="display:flex;flex-wrap:wrap;gap:20px;">
      ${students.map(st=>tchIdCardHtml(st, s, allClasses, _idTemplate||'royal')).join('')}
      ${!students.length?'<div class="glass-card" style="width:100%;text-align:center;padding:48px"><div style="font-size:48px;margin-bottom:12px">🪪</div><h3>No students in this class</h3></div>':''}
    </div>`;
  // Generate QR codes after DOM ready
  setTimeout(function() {
    students.forEach(function(st) {
      _vmGenQR('qrt-' + st.id, 'VM:STU:' + st.id, 68);
    });
  }, 120);
}

// embedQR=true → embed as <img data-url> for print/download
// embedQR=false → DOM placeholder <div id="qrt-..."> filled later by _vmGenQR
function tchIdCardHtml(st, s, allClasses, theme, embedQR) {
  theme = theme || 'royal';
  const cls = allClasses ? allClasses.find(c=>c.id===st.classId) : null;
  const themes = {
    royal:  { grad:'linear-gradient(135deg,#4c1d95 0%,#1e3a5f 100%)', accent:'#a78bfa', stripe:'#6d28d9', badge:'#ddd6fe', badgeText:'#4c1d95' },
    ocean:  { grad:'linear-gradient(135deg,#0c4a6e 0%,#065f46 100%)', accent:'#34d399', stripe:'#059669', badge:'#d1fae5', badgeText:'#065f46' },
    forest: { grad:'linear-gradient(135deg,#14532d 0%,#1e3a5f 100%)', accent:'#6ee7b7', stripe:'#10b981', badge:'#d1fae5', badgeText:'#14532d' },
    sunset: { grad:'linear-gradient(135deg,#7c2d12 0%,#1e3a5f 100%)', accent:'#fbbf24', stripe:'#d97706', badge:'#fef3c7', badgeText:'#7c2d12' },
  };
  const t = themes[theme]||themes.royal;
  const initials = (st.name||'S').split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2);
  const school = (s && s.schoolName)||'School';
  const tagline = (s && s.schoolTagline)||'';
  const acYear = (s && s.academicYear)||'';

  return `<div style="
    width:300px;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,.5);
    font-family:'Segoe UI',Arial,sans-serif;flex-shrink:0;border:2px solid ${t.stripe};">
    <div style="background:${t.grad};padding:18px 20px 14px;position:relative;overflow:hidden;">
      <div style="position:absolute;top:-30px;right:-30px;width:100px;height:100px;border-radius:50%;background:rgba(255,255,255,.06);"></div>
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;position:relative;">
        <div style="width:36px;height:36px;border-radius:8px;background:rgba(255,255,255,.15);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">🎓</div>
        <div style="min-width:0;">
          <div style="font-weight:800;font-size:.85rem;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${school}</div>
          ${tagline?`<div style="font-size:.65rem;color:rgba(255,255,255,.55);">${tagline}</div>`:''}
        </div>
        <div style="margin-left:auto;background:${t.badge};color:${t.badgeText};font-size:.6rem;font-weight:800;padding:2px 8px;border-radius:20px;white-space:nowrap;flex-shrink:0;">STUDENT ID</div>
      </div>
      <div style="display:flex;align-items:center;gap:14px;position:relative;">
        <div style="width:68px;height:68px;border-radius:50%;background:rgba(255,255,255,.15);border:3px solid rgba(255,255,255,.3);display:flex;align-items:center;justify-content:center;font-size:1.5rem;font-weight:800;color:#fff;flex-shrink:0;">${initials}</div>
        <div style="min-width:0;">
          <div style="font-size:1.05rem;font-weight:800;color:#fff;line-height:1.2;">${st.name}</div>
          <div style="font-size:.78rem;color:${t.accent};font-weight:600;margin-top:3px;">${cls?cls.name:'—'}</div>
          <div style="margin-top:5px;display:inline-block;background:rgba(255,255,255,.15);border-radius:6px;padding:2px 10px;">
            <span style="font-size:.7rem;color:rgba(255,255,255,.8);">Roll: </span>
            <span style="font-size:.75rem;font-weight:700;color:#fff;">${st.rollNo||'—'}</span>
          </div>
        </div>
      </div>
    </div>
    <div style="height:4px;background:linear-gradient(to right,${t.stripe},${t.accent},${t.stripe});"></div>
    <div style="background:#ffffff;padding:14px 18px;">
      ${[['DOB',st.dob||'—'],["Father",st.fatherName||'—'],['Phone',st.phone||'—'],['Address',(st.address||'—').slice(0,28)]]
        .map(([k,v])=>`<div style="display:flex;align-items:baseline;margin-bottom:7px;padding-bottom:7px;border-bottom:1px solid #f1f5f9;">
          <span style="font-size:.68rem;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;width:75px;flex-shrink:0;">${k}</span>
          <span style="font-size:.8rem;font-weight:600;color:#1e293b;">${v}</span>
        </div>`).join('')}
    </div>
    <!-- QR Code strip -->
    <div style="background:#f8fafc;padding:10px 18px;display:flex;align-items:center;justify-content:space-between;border-top:1px solid #f1f5f9;">
      <div>
        <div style="font-size:.58rem;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Scan to Mark Attendance</div>
        ${(()=>{
          if (embedQR && typeof _genQRDataUrl === 'function') {
            const qrUrl = _genQRDataUrl('VM:STU:'+st.id, 68);
            return qrUrl
              ? `<img src="${qrUrl}" style="width:68px;height:68px;border-radius:4px;display:block;">`
              : `<div style="width:68px;height:68px;border-radius:4px;background:#f0f0f0;display:flex;align-items:center;justify-content:center;font-size:9px;color:#999;">QR</div>`;
          }
          return `<div id="qrt-${st.id}" style="width:68px;height:68px;line-height:0;overflow:hidden;border-radius:4px;background:#fff;"></div>`;
        })()}
      </div>
      <div style="text-align:right;">
        <div style="font-size:.58rem;color:#94a3b8;text-transform:uppercase;margin-bottom:2px;">Student ID</div>
        <div style="font-size:.62rem;font-weight:800;color:#334155;font-family:monospace;">${st.id.slice(-8).toUpperCase()}</div>
        <div style="font-size:.58rem;color:#94a3b8;margin-top:6px;text-transform:uppercase;">Roll No</div>
        <div style="font-size:.78rem;font-weight:800;color:#1e293b;">${st.rollNo||'—'}</div>
      </div>
    </div>

    <div style="background:${t.badge};padding:8px 18px;display:flex;justify-content:space-between;align-items:center;">
      <span style="font-size:.65rem;font-weight:700;color:${t.badgeText};">AY: ${acYear}</span>
      <span style="font-size:.65rem;color:${t.badgeText};">${s&&s.schoolPhone?s.schoolPhone:''}</span>
    </div>
  </div>`;
}

function printAllIDCards() {
  const students = _idClassId ? DB.get('students').filter(st=>st.classId===_idClassId) : [];
  if (!students.length) { toast('No students in this class', 'warning'); return; }
  const s = getSettings();
  const allClasses = DB.get('classes');
  const theme = _idTemplate || 'royal';
  const cards = students.map(st => tchIdCardHtml(st, s, allClasses, theme, true)).join(''); // embedQR=true
  const w = window.open('','_blank','width=960,height=700');
  w.document.write(`<!DOCTYPE html><html><head><title>ID Cards</title>
  <style>body{margin:0;padding:16px;background:#f8fafc;}@media print{body{padding:4px;background:#fff;}}</style>
  </head><body>
  <div style="text-align:right;margin-bottom:16px"><button onclick="window.print()" style="padding:8px 20px;background:#7c3aed;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:14px">🖨️ Print All</button></div>
  <div style="display:flex;flex-wrap:wrap;gap:16px;">${cards}</div>
  <script>window.onload=()=>{window.print();setTimeout(()=>window.close(),900)}<\/script>
  </body></html>`);
  w.document.close();
}

// ═════════════════════════════════════════════════════════════════════════════
// MESSAGES — Teacher WhatsApp-style Chat
// ═════════════════════════════════════════════════════════════════════════════
let _tchChat = { tid:'', search:'' };

function renderTeacherMessages() {
  const unread = _chatUnread(CU.id);
  const badge  = document.getElementById('tch-msg-badge');
  if (badge) { badge.style.display = unread?'inline':'none'; badge.textContent = unread; }

  const myT  = _chatMyThreads(CU.id);
  const filt = _tchChat.search
    ? myT.filter(t=>t.p.some(p=>(p.name||'').toLowerCase().includes(_tchChat.search.toLowerCase())))
    : myT;
  const mob  = window.innerWidth<=768;

  $('section-messages').innerHTML = `
  <div class="section-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:16px">
    <h2 class="section-title">💬 Messages</h2>
    <button class="btn btn-primary" onclick="_tchNewChat()">✏️ New Chat</button>
  </div>

  <div class="chat-wrap" style="height:calc(100vh - var(--header) - 130px);min-height:460px">

    <!-- Sidebar -->
    <div class="chat-sidebar ${mob&&_tchChat.tid?'chat-panel-hide':''}">
      <div style="padding:12px 14px;border-bottom:1px solid var(--border);flex-shrink:0">
        <input type="search" class="form-control" placeholder="🔍 Search…" value="${_tchChat.search}"
          oninput="_tchChat.search=this.value;renderTeacherMessages()" style="margin-bottom:9px;font-size:13px">
        <button class="btn btn-primary w-full" onclick="_tchNewChat()" style="font-size:13px">✏️ New Conversation</button>
      </div>
      <div style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch">
        ${filt.length===0
          ? `<div style="padding:32px 20px;text-align:center;color:var(--text-3)"><div style="font-size:2.5rem;margin-bottom:8px">💬</div><div style="font-size:13px">No conversations yet.<br>Click "New Chat" to start.</div></div>`
          : filt.map(t=>_chatThreadItem(t,CU.id,_tchChat.tid,'_tchOpenThread')).join('')}
      </div>
    </div>

    <!-- Chat window -->
    <div class="chat-main ${mob&&!_tchChat.tid?'chat-panel-hide':''}">
      ${_tchChat.tid ? _tchChatWin() : `
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;color:var(--text-3);gap:10px;text-align:center;padding:40px">
        <div style="font-size:4rem">💬</div>
        <div style="font-size:16px;font-weight:700;color:var(--text)">Select a conversation</div>
        <div style="font-size:13px">Chat with parents or admin</div>
        <button class="btn btn-primary mt-8" onclick="_tchNewChat()">✏️ Start New Chat</button>
      </div>`}
    </div>

  </div>`;

  const msgsEl = document.getElementById('_vc_msgs');
  if (msgsEl) msgsEl.scrollTop = msgsEl.scrollHeight;
}

function _tchChatWin() {
  const thread = _chatGetById(_tchChat.tid);
  if (!thread) return '';
  _chatMarkRead(_tchChat.tid, CU.id);
  const other = thread.p.find(p=>p.id!==CU.id)||thread.p[0];
  const COLS  = {'admin':'#7c3aed','teacher':'#06b6d4','parent':'#10b981'};
  const col   = COLS[other.role]||'#94a3b8';
  const rLbl  = {'admin':'👑 Principal / Admin','teacher':'👩‍🏫 Teacher','parent':'👨‍👩‍👦 Parent'}[other.role]||other.role;
  const myId  = CU.id;
  const tch   = DB.find('teachers',CU.id)||{};
  const myNm  = (tch.name||CU.name||'Teacher').replace(/'/g,"\\'");
  return `
  <div style="padding:12px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px;flex-shrink:0;background:rgba(255,255,255,.02)">
    <button class="btn btn-sm btn-secondary chat-mob-back" onclick="_tchChat.tid='';renderTeacherMessages()" style="padding:5px 10px">← Back</button>
    <div style="width:40px;height:40px;border-radius:50%;background:${col};display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;flex-shrink:0;font-size:1.05rem">${(other.name||'?')[0].toUpperCase()}</div>
    <div style="flex:1;min-width:0">
      <div style="font-weight:700;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${other.name}</div>
      <div style="font-size:11px;color:var(--text-3)">${rLbl}</div>
    </div>
  </div>
  <div id="_vc_msgs" class="chat-msgs">${_chatMsgsHtml(thread,myId)}</div>
  <div class="chat-inp-bar">
    <textarea id="_vc_input" class="chat-textarea" placeholder="Type a message… (Enter to send)"
      onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();window._vmChatSend('${_tchChat.tid}','${myId}','${myNm}','teacher','_vc_input')}"
      oninput="window._vmChatResize(this)"></textarea>
    <button class="chat-send" onclick="window._vmChatSend('${_tchChat.tid}','${myId}','${myNm}','teacher','_vc_input')">➤</button>
  </div>`;
}

function _tchOpenThread(tid) {
  _tchChat.tid = tid;
  _chatMarkRead(tid, CU.id);
  if (window.innerWidth<=768) { renderTeacherMessages(); return; }
  const mainEl = document.getElementById('_vc_main')||document.querySelector('.chat-main');
  if (mainEl) { mainEl.outerHTML = '<div id="_vc_main" class="chat-main">'+_tchChatWin()+'</div>'; }
  const msgsEl = document.getElementById('_vc_msgs');
  if (msgsEl) msgsEl.scrollTop = msgsEl.scrollHeight;
  const n = _chatUnread(CU.id);
  const b = document.getElementById('tch-msg-badge');
  if (b) { b.style.display=n?'inline':'none'; b.textContent=n; }
  document.querySelectorAll('[id^="_vc_item_"]').forEach(function(el){
    el.style.background = el.id==='_vc_item_'+tid ? 'rgba(124,58,237,.18)' : 'transparent';
  });
}

function _tchNewChat() {
  // Contacts: admin + parents of students in teacher's classes
  const myClassIds = myClasses().map(c=>c.id);
  const myStudents = DB.get('students').filter(s=>myClassIds.includes(s.classId));
  const contacts = [
    {id:'admin_user', name:'Principal / Admin', role:'admin', sub:'School Administration', col:'#7c3aed'},
    ...myStudents.map(s=>({id:s.id, name:'Parent of '+s.name, role:'parent', sub:DB.find('classes',s.classId)?.name||'', col:'#10b981'}))
  ];
  // Find admin user id
  const adminUser = DB.get('users').find(u=>u.role==='admin');
  if (adminUser) contacts[0].id = adminUser.id;

  const html = `
  <input type="search" class="form-control" placeholder="🔍 Search…" style="margin-bottom:12px"
    oninput="var q=this.value.toLowerCase();document.querySelectorAll('.tch-ct').forEach(function(el){el.style.display=el.dataset.n.includes(q)?'flex':'none'})">
  <div style="display:flex;flex-direction:column;gap:6px;max-height:400px;overflow-y:auto">
    ${contacts.map(c=>`
    <div class="tch-ct" data-n="${c.name.toLowerCase()}"
         onclick="_tchStartChat('${c.id}','${c.name.replace(/'/g,'&#39;')}','${c.role}');closeAllModals()"
         style="display:flex;align-items:center;gap:12px;padding:11px 14px;border-radius:10px;border:1px solid var(--border);cursor:pointer;transition:background .14s"
         onmouseover="this.style.background='rgba(124,58,237,.1)'" onmouseout="this.style.background=''">
      <div style="width:38px;height:38px;border-radius:50%;background:${c.col};display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;flex-shrink:0">${c.name[0].toUpperCase()}</div>
      <div><div style="font-weight:600;font-size:14px">${c.name}</div><div style="font-size:11px;color:var(--text-3)">${c.sub}</div></div>
    </div>`).join('')}
  </div>`;
  buildModal('_tch_new_chat','💬 Start New Conversation',html,null);
}

function _tchStartChat(cId,cName,cRole){
  const tch = DB.find('teachers',CU.id)||{};
  const me  = {id:CU.id, name:tch.name||CU.name||'Teacher', role:'teacher'};
  const t   = _chatCreate(me, {id:cId,name:cName,role:cRole});
  _tchOpenThread(t.id);
  renderTeacherMessages();
}

// Badge init
(function _tchBadgeInit(){
  setTimeout(function(){
    const n=_chatUnread(CU.id);
    const b=document.getElementById('tch-msg-badge');
    if(b){b.style.display=n?'inline':'none';b.textContent=n;}
  },300);
})();

// ══════════════════════════════════════════════════════
//  TEACHER — FEE MANAGEMENT
// ══════════════════════════════════════════════════════
function renderTeacherFees(){
  const students=DB.get('students');
  const classes=DB.get('classes');
  const s=getSettings(); const cur=s.currency||'₹';
  const txns=DB.get('fee_transactions').slice().reverse();

  $('section-fees').innerHTML=`
    <div class="section-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">
      <div><h2 class="section-title">💳 Fee Management</h2></div>
      <button class="btn btn-primary" onclick="tOpenFeeModal()">➕ Record Payment</button>
    </div>

    <!-- Fee overview table -->
    <div class="glass-card">
      <h3 class="card-title">Student Fee Status</h3>
      <div class="table-wrap"><table class="data-table">
        <thead><tr><th>Student</th><th>Class</th><th>Total</th><th>Paid</th><th>Due</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>
          ${students.map(st=>{
            const cls=classes.find(c=>c.id===st.classId);
            const due=Math.max(0,(st.feeTotal||0)-(st.feePaid||0));
            const pct=st.feeTotal?Math.round((st.feePaid||0)/st.feeTotal*100):0;
            return `<tr>
              <td><strong>${st.name}</strong></td>
              <td>${cls?cls.name:'—'}</td>
              <td>${cur}${Number(st.feeTotal||0).toLocaleString()}</td>
              <td class="text-green fw-6">${cur}${Number(st.feePaid||0).toLocaleString()}</td>
              <td class="${due>0?'text-red':''} fw-6">${cur}${due.toLocaleString()}</td>
              <td><span class="badge ${pct>=100?'badge-green':pct>=50?'badge-yellow':'badge-red'}">${pct>=100?'✅ Paid':pct>=50?'Partial':'Pending'}</span></td>
              <td><button class="btn btn-sm btn-success" onclick="tOpenFeeModal('${st.id}')">💳 Pay</button></td>
            </tr>`;
          }).join('')}
        </tbody>
      </table></div>
    </div>

    <!-- Payment history -->
    <div class="glass-card mt-8">
      <h3 class="card-title">Payment History</h3>
      <div class="table-wrap"><table class="data-table">
        <thead><tr><th>Receipt</th><th>Student</th><th>Fee</th><th>Late Fee</th><th>Total</th><th>Method</th><th>Date</th><th>Action</th></tr></thead>
        <tbody>
          ${txns.length?txns.map(t=>{
            const st=DB.find('students',t.studentId);
            const lf=Number(t.lateFee||0);
            const total=Number(t.total||t.amount||0);
            return `<tr>
              <td><span class="badge badge-purple">${t.receiptNo}</span></td>
              <td>${st?st.name:'—'}</td>
              <td>${cur}${Number(t.amount||0).toLocaleString()}</td>
              <td>${lf>0?`<span class="badge badge-yellow">${cur}${lf.toLocaleString()}</span>`:'—'}</td>
              <td class="fw-6">${cur}${total.toLocaleString()}</td>
              <td>${t.method}</td><td>${formatDate(t.date)}</td>
              <td><button class="btn btn-sm" style="background:rgba(124,58,237,.15);color:#a78bfa;border:1px solid rgba(124,58,237,.3)" onclick="tPrintFeeReceipt('${t.id}')">🖨️ Receipt</button></td>
            </tr>`;
          }).join(''):'<tr><td colspan="8" class="text-center text-muted" style="padding:30px">No transactions yet</td></tr>'}
        </tbody>
      </table></div>
    </div>`;
}

function tOpenFeeModal(preStudentId=''){
  const students=DB.get('students');
  const rcpNo='RCP-'+String(DB.get('fee_transactions').length+1).padStart(3,'0');
  buildModal('modal-t-fee','💳 Record Fee Payment',`
    <div class="form-group"><label class="form-label">Student *</label>
      <select class="form-control" id="t-fee-student">
        <option value="">Select student</option>
        ${students.map(s=>`<option value="${s.id}" ${s.id===preStudentId?'selected':''}>${s.name} (Due: ₹${Math.max(0,(s.feeTotal||0)-(s.feePaid||0)).toLocaleString()})</option>`).join('')}
      </select></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Fee Amount (₹) *</label>
        <input class="form-control" type="number" id="t-fee-amount" placeholder="0"></div>
      <div class="form-group"><label class="form-label">Late Fee (₹)</label>
        <input class="form-control" type="number" id="t-fee-late" placeholder="0" value="0"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Method</label>
        <select class="form-control" id="t-fee-method">
          ${['Cash','Online/UPI','Cheque','DD','Net Banking'].map(m=>`<option>${m}</option>`).join('')}
        </select></div>
      <div class="form-group"><label class="form-label">Date</label>
        <input class="form-control" type="date" id="t-fee-date" value="${today()}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Receipt No</label>
        <input class="form-control" id="t-fee-rcpt" value="${rcpNo}"></div>
      <div class="form-group"><label class="form-label">Note</label>
        <input class="form-control" id="t-fee-note" placeholder="e.g. Term 1 fee"></div>
    </div>`, tSaveFeePayment);
}
function tSaveFeePayment(){
  const studentId=document.getElementById('t-fee-student').value;
  const amount=Number(document.getElementById('t-fee-amount').value)||0;
  const lateFee=Number(document.getElementById('t-fee-late').value)||0;
  const total=amount+lateFee;
  const method=document.getElementById('t-fee-method').value;
  const date=document.getElementById('t-fee-date').value;
  const receiptNo=document.getElementById('t-fee-rcpt').value;
  const note=document.getElementById('t-fee-note').value;
  if(!studentId||!amount){toast('Student aur amount required hai','warning');return;}
  DB.push('fee_transactions',{id:genId('ft'),studentId,amount,lateFee,total,method,date,receiptNo,note});
  const st=DB.find('students',studentId);
  if(st){
    DB.update('students',studentId,{feePaid:(st.feePaid||0)+total});
    DB.update('users',studentId,{feePaid:(st.feePaid||0)+total});
  }
  toast(`✅ Payment ₹${total.toLocaleString()} recorded!`,'success');
  closeModal('modal-t-fee'); renderTeacherFees();
}
function tPrintFeeReceipt(txId){
  // Reuse the same receipt format as admin — find transaction and print
  const t=DB.get('fee_transactions').find(x=>x.id===txId);
  if(!t) return toast('Transaction not found','error');
  const st=DB.find('students',t.studentId);
  const cls=st?DB.find('classes',st.classId):null;
  const s=getSettings(); const cur=s.currency||'₹';
  const lf=Number(t.lateFee||0); const base=Number(t.amount||0); const total=Number(t.total||base+lf);
  const html=`
  <div style="max-width:420px;margin:30px auto;font-family:'Segoe UI',sans-serif;border:2px solid #7c3aed;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.12)">
    <div style="background:linear-gradient(135deg,#1e1b4b,#7c3aed);color:#fff;padding:20px 24px;text-align:center">
      ${s.schoolLogo?`<img src="${s.schoolLogo}" style="height:44px;border-radius:8px;background:#fff;padding:3px;margin-bottom:8px"><br>`:'<div style="font-size:2rem;margin-bottom:4px">🎓</div>'}
      <div style="font-size:18px;font-weight:800;">${s.schoolName||'School'}</div>
      ${s.schoolAddress?`<div style="font-size:10px;opacity:.6;margin-top:4px">${s.schoolAddress}</div>`:''}
    </div>
    <div style="background:#f0fdf4;border-bottom:1px solid #d1fae5;padding:10px 24px;display:flex;justify-content:space-between;align-items:center">
      <span style="font-weight:800;font-size:15px;color:#059669">💳 FEE RECEIPT</span>
      <span style="font-size:11px;color:#64748b">Receipt: <strong>${t.receiptNo}</strong></span>
    </div>
    <div style="padding:16px 24px;border-bottom:1px solid #e5e7eb;">
      <table style="width:100%;font-size:13px;border-collapse:collapse">
        <tr><td style="color:#64748b;padding:3px 0;width:40%">Student</td><td style="font-weight:700">${st?st.name:'—'}</td></tr>
        <tr><td style="color:#64748b;padding:3px 0">Class</td><td>${cls?cls.name:'—'}</td></tr>
        <tr><td style="color:#64748b;padding:3px 0">Date</td><td>${formatDate(t.date)}</td></tr>
        <tr><td style="color:#64748b;padding:3px 0">Method</td><td>${t.method}</td></tr>
        ${t.note?`<tr><td style="color:#64748b;padding:3px 0">Note</td><td>${t.note}</td></tr>`:''}
      </table>
    </div>
    <div style="padding:16px 24px;border-bottom:1px solid #e5e7eb;">
      <table style="width:100%;font-size:13px;border-collapse:collapse">
        <tr><td style="padding:4px 0">Fee Amount</td><td style="text-align:right;font-weight:600">${cur}${base.toLocaleString()}</td></tr>
        ${lf>0?`<tr><td style="padding:4px 0;color:#f59e0b;font-weight:600">Late Fee</td><td style="text-align:right;color:#f59e0b;font-weight:700">${cur}${lf.toLocaleString()}</td></tr>`:''}
        <tr style="border-top:2px solid #e5e7eb">
          <td style="padding:8px 0 4px;font-weight:800;font-size:15px;color:#059669">TOTAL PAID</td>
          <td style="text-align:right;font-weight:800;font-size:18px;color:#059669">${cur}${total.toLocaleString()}</td>
        </tr>
      </table>
    </div>
    <div style="padding:12px 24px;text-align:center;font-size:11px;color:#94a3b8">
      Session: ${s.academicYear||'—'} · Printed: ${formatDate(today())}<br>
      <span style="font-weight:600;color:#7c3aed">Computer-generated receipt. No signature required.</span>
    </div>
  </div>`;
  printHtml(`<style>body{background:#f0f0f0;padding:20px}@media print{body{background:#fff;padding:0}}</style>${html}`,`Fee Receipt — ${st?st.name:'Student'}`);
}

// ══════════════════════════════════════════════════════
//  TEACHER — ACCOUNTS (without financial summary if not permitted)
// ══════════════════════════════════════════════════════
function renderTeacherAccounts(){
  const accs=DB.get('accounts'); const s=getSettings(); const cur=s.currency||'₹';
  const canView=PERMS.canViewFinancialSummary;
  const income=accs.filter(a=>a.type==='income').reduce((t,a)=>t+Number(a.amount),0);
  const expense=accs.filter(a=>a.type==='expense').reduce((t,a)=>t+Number(a.amount),0);

  $('section-accounts').innerHTML=`
    <div class="section-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">
      <div><h2 class="section-title">💰 Accounts</h2></div>
      <button class="btn btn-primary" onclick="tOpenAccountModal()">➕ Add Entry</button>
    </div>

    ${canView?`
    <div class="stats-grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:20px">
      <div class="stat-card"><div class="stat-icon" style="background:linear-gradient(135deg,#10b981,#06b6d4)">📈</div><div class="stat-info"><div class="stat-value">${cur}${(income/1000).toFixed(1)}K</div><div class="stat-label">Total Income</div></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:linear-gradient(135deg,#ef4444,#f97316)">📉</div><div class="stat-info"><div class="stat-value">${cur}${(expense/1000).toFixed(1)}K</div><div class="stat-label">Total Expense</div></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:linear-gradient(135deg,#7c3aed,#3b82f6)">💹</div><div class="stat-info"><div class="stat-value">${cur}${((income-expense)/1000).toFixed(1)}K</div><div class="stat-label">Balance</div></div></div>
    </div>`
    :`<div style="background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.25);border-radius:10px;padding:12px 16px;margin-bottom:16px;font-size:13px;color:#92400e">
        ⚠️ Financial summary totals are restricted by admin. You can add and manage entries only.
      </div>`}

    <div class="glass-card">
      <h3 class="card-title">Transaction History</h3>
      <div class="table-wrap"><table class="data-table">
        <thead><tr><th>Date</th><th>Type</th><th>Category</th><th>Amount</th><th>Note</th></tr></thead>
        <tbody>
          ${accs.slice().reverse().map(a=>`<tr>
            <td>${formatDate(a.date)}</td>
            <td><span class="badge ${a.type==='income'?'badge-green':'badge-red'}">${a.type==='income'?'📈 Income':'📉 Expense'}</span></td>
            <td>${a.category||'—'}</td>
            <td class="${a.type==='income'?'text-green':'text-red'} fw-6">${cur}${Number(a.amount).toLocaleString()}</td>
            <td>${a.note||'—'}</td>
          </tr>`).join('')||'<tr><td colspan="5" class="text-center text-muted" style="padding:30px">No entries</td></tr>'}
        </tbody>
      </table></div>
    </div>`;
}
function tOpenAccountModal(){
  buildModal('modal-t-acc','➕ Add Account Entry',`
    <div class="form-row">
      <div class="form-group"><label class="form-label">Type *</label>
        <select class="form-control" id="t-acc-type">
          <option value="income">📈 Income</option>
          <option value="expense">📉 Expense</option>
        </select></div>
      <div class="form-group"><label class="form-label">Amount (₹) *</label>
        <input class="form-control" type="number" id="t-acc-amount" placeholder="0"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Category</label>
        <input class="form-control" id="t-acc-cat" placeholder="e.g. Fee Collection, Salary, Stationery"></div>
      <div class="form-group"><label class="form-label">Date</label>
        <input class="form-control" type="date" id="t-acc-date" value="${today()}"></div>
    </div>
    <div class="form-group"><label class="form-label">Note</label>
      <input class="form-control" id="t-acc-note" placeholder="Details..."></div>`, tSaveAccount);
}
function tSaveAccount(){
  const type=document.getElementById('t-acc-type').value;
  const amount=Number(document.getElementById('t-acc-amount').value)||0;
  if(!amount){toast('Amount required','warning');return;}
  DB.push('accounts',{id:genId('ac'),type,amount,
    category:document.getElementById('t-acc-cat').value,
    date:document.getElementById('t-acc-date').value,
    note:document.getElementById('t-acc-note').value,
    addedBy:CU.name});
  toast('Entry added!','success'); closeModal('modal-t-acc'); renderTeacherAccounts();
}

// ═════════════════════════════════════════════════════════════════════════════
// PAPER CREATOR  —  Wrapper (all logic lives in js/paper-creator.js)
// ═════════════════════════════════════════════════════════════════════════════
// _pc state, _rteCmd*, _pcOCR*, _pcPrint, _pcSaveDraft, etc. are all in paper-creator.js

// renderPaperCreator — thin wrapper; all logic is in js/paper-creator.js
function renderPaperCreator() {
  _pcRenderMain('section-papercreator');
}
// All paper-creator functions live in js/paper-creator.js

// ── Init ──────────────────────────────────────────────────────────────────────
initSidebar();
initNav();

// ── Dynamic sidebar school name ───────────────────────
(function _initSchoolBranding(){
  const s = getSettings();
  const name = s.schoolName || '';
  const logo = s.schoolLogo || '';
  const ay   = s.academicYear || '';
  if (name) {
    const nameEl = document.getElementById('sidebarSchoolName');
    if (nameEl) nameEl.textContent = name;
    document.title = 'Teacher Panel — ' + name;
  }
  if (logo) {
    const markEl = document.getElementById('sidebarLogoMark');
    if (markEl) markEl.innerHTML = `<img src="${logo}" style="width:32px;height:32px;border-radius:6px;object-fit:contain;background:#fff;padding:2px">`;
  }
  const ayEl = document.getElementById('sidebarSessionYear');
  if (ayEl) {
    if (ay) { ayEl.textContent = '📅 Session ' + ay; ayEl.style.display = ''; }
    else      ayEl.style.display = 'none';
  }
})();

// ══════════════════════════════════════════════════════
//  SCHOOL GALLERY  — Teacher
// ══════════════════════════════════════════════════════
function _tGalTabBar(active){
  const t=(id,ic,l)=>`<button class="att-tab ${active===id?'active':''}" onclick="window._tGalView='${id==='videos'?'videos':''}';renderGallery()">${ic} ${l}</button>`;
  return `<div class="att-tab-bar" style="margin-bottom:16px;">${t('photos','📁','Photos')}${t('videos','🎬','Videos')}</div>`;
}
function renderGallery(){
  if(window._tGalView==='videos'){
    GV.onChange=renderGallery;
    document.getElementById('section-gallery').innerHTML=`
      <div class="page-header"><div><h2>🖼️ School Gallery</h2><p class="page-sub">Activity videos — parents can watch, share & open</p></div>
        <button class="btn btn-primary" onclick="GV.openAdd()">🎬 Add Video</button></div>
      ${_tGalTabBar('videos')}
      ${GV.listHtml(true)}`;
    return;
  }
  const allClasses = DB.get('classes');
  const myClsIds   = myClassIds();
  // Teachers only see their own classes in uploader + all school gallery
  const gallery    = DB.get('gallery').sort((a,b)=>b.createdAt-a.createdAt);
  const students   = DB.get('students');

  const photoCards = gallery.map(p=>{
    const cls = p.classId   ? allClasses.find(c=>c.id===p.classId)   : null;
    const stu = p.studentId ? students.find(s=>s.id===p.studentId)   : null;
    let visBadge='<span style="background:rgba(16,185,129,.15);color:#059669;font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;">🌐 All</span>';
    if(p.visibility==='class')   visBadge=`<span style="background:rgba(59,130,246,.15);color:#2563eb;font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;">🏫 ${cls?.name||'Class'}</span>`;
    if(p.visibility==='student') visBadge=`<span style="background:rgba(168,85,247,.15);color:#7c3aed;font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;">👤 ${stu?.name||'Student'}</span>`;
    const canDel = p.uploadedBy===`teacher:${CU.id}`;
    return `<div style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);border:1px solid #f1f5f9;">
      <div style="position:relative;">
        <img src="${p.photo}" style="width:100%;height:175px;object-fit:cover;display:block;" loading="lazy">
        <div style="position:absolute;top:8px;right:8px;">${visBadge}</div>
      </div>
      <div style="padding:12px;">
        <div style="font-weight:700;color:#1e293b;font-size:14px;margin-bottom:3px;">${p.title}</div>
        ${p.description?`<div style="color:#64748b;font-size:12px;line-height:1.4;">${p.description}</div>`:''}
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;border-top:1px solid #f1f5f9;padding-top:8px;">
          <span style="font-size:10.5px;color:#94a3b8;">📅 ${formatDate(p.date)} &nbsp;·&nbsp; ${p.uploaderName}</span>
          ${canDel?`<button onclick="tDelGalleryPhoto('${p.id}')" style="background:#fee2e2;color:#ef4444;border:none;border-radius:6px;padding:4px 10px;cursor:pointer;font-size:12px;font-weight:600;">🗑️</button>`:''}
        </div>
      </div>
    </div>`;
  }).join('');

  const myUploads = gallery.filter(p=>p.uploadedBy===`teacher:${CU.id}`).length;
  document.getElementById('section-gallery').innerHTML=`
  <div class="page-header">
    <div><h2>🖼️ School Gallery</h2><p class="page-sub">Share class activity photos with parents</p></div>
    <button class="btn btn-primary" onclick="tOpenGalleryUpload()">📷 Upload Photos (Bulk)</button>
  </div>

  ${_tGalTabBar('photos')}

  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:20px;">
    <div class="card" style="text-align:center;padding:16px;">
      <div style="font-size:30px;font-weight:800;color:#7c3aed;">${gallery.length}</div>
      <div style="color:#64748b;font-size:13px;margin-top:2px;">Total School Photos</div>
    </div>
    <div class="card" style="text-align:center;padding:16px;">
      <div style="font-size:30px;font-weight:800;color:#0ea5e9;">${myUploads}</div>
      <div style="color:#64748b;font-size:13px;margin-top:2px;">Uploaded by Me</div>
    </div>
    <div class="card" style="text-align:center;padding:16px;">
      <div style="font-size:30px;font-weight:800;color:#10b981;">${gallery.filter(p=>p.visibility==='all').length}</div>
      <div style="color:#64748b;font-size:13px;margin-top:2px;">Visible to All</div>
    </div>
  </div>

  <div class="card">
    <div class="card-header"><h3>📸 All Photos (${gallery.length})</h3></div>
    <div class="card-body">
      ${gallery.length===0
        ?'<div class="empty-state"><div class="e-icon">🖼️</div><h3>No Photos Yet</h3><p>Upload your first class activity photo!</p></div>'
        :`<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:16px;">${photoCards}</div>`}
    </div>
  </div>`;
}

let _tGalBulkQueue = [];

function tOpenGalleryUpload(){
  _tGalBulkQueue = [];
  const classes = myClasses();
  const body=`
    <div class="form-group">
      <label class="form-label">📌 Event / Album Title * <span style="color:#94a3b8;font-size:11px;">(common for all photos)</span></label>
      <input id="tgal-title" class="form-control" placeholder="e.g. Class Trip to Museum, Science Fair, Prize Distribution">
    </div>
    <div class="form-group">
      <label class="form-label">📝 Description <span style="color:#94a3b8;font-size:12px;">(optional)</span></label>
      <textarea id="tgal-desc" class="form-control" rows="2" placeholder="Briefly describe this event..."></textarea>
    </div>
    <div class="form-group">
      <label class="form-label">📅 Event Date</label>
      <input id="tgal-date" type="date" class="form-control" value="${today()}">
    </div>
    <div class="form-group">
      <label class="form-label">👁️ Visible To</label>
      <select id="tgal-vis" class="form-control" onchange="tGalVisChange()">
        <option value="all">🌐 All Parents &amp; Students</option>
        <option value="class">🏫 Specific Class Only</option>
        <option value="student">👤 Specific Student Only</option>
      </select>
    </div>
    <div id="tgal-class-row" style="display:none;" class="form-group">
      <label class="form-label">Select Class</label>
      <select id="tgal-classId" class="form-control" onchange="tGalClassChange()">
        <option value="">-- Select Class --</option>
        ${classes.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}
      </select>
    </div>
    <div id="tgal-student-row" style="display:none;" class="form-group">
      <label class="form-label">Select Student</label>
      <select id="tgal-studentId" class="form-control">
        <option value="">-- Select class first --</option>
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">📷 Select Photos
        <span style="color:#94a3b8;font-size:11px;font-weight:400;margin-left:4px;">Max 50 photos · Each auto-compressed to ≤200 KB</span>
      </label>
      <input id="tgal-photo-input" type="file" accept="image/*" multiple class="form-control"
             onchange="tGalBulkFilesSelected(this)" style="cursor:pointer;">
      <div style="color:#64748b;font-size:11.5px;margin-top:5px;">
        💡 Hold <strong>Ctrl</strong> (Windows) or <strong>Cmd</strong> (Mac) to select multiple photos at once
      </div>
    </div>
    <div id="tgal-bulk-progress" style="display:none;margin-bottom:14px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:7px;">
        <span id="tgal-progress-label" style="font-size:12px;color:#64748b;font-weight:600;">⏳ Compressing photos...</span>
        <span id="tgal-progress-count" style="font-size:12px;color:#64748b;font-weight:700;">0 / 0</span>
      </div>
      <div style="background:#f1f5f9;border-radius:20px;height:8px;overflow:hidden;">
        <div id="tgal-progress-bar" style="height:100%;background:linear-gradient(90deg,#6366f1,#0ea5e9);border-radius:20px;width:0%;transition:width .35s ease;"></div>
      </div>
    </div>
    <div id="tgal-thumb-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(88px,1fr));gap:8px;margin-bottom:10px;"></div>
    <div id="tgal-bulk-summary" style="display:none;">
      <div style="background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.25);border-radius:10px;padding:11px 16px;font-size:13px;color:#059669;font-weight:700;">
        ✅ <span id="tgal-ready-count">0</span> photos ready to upload — click <strong>Save</strong> to upload all at once
      </div>
    </div>`;
  buildModal('tGalUploadModal','📷 Bulk Upload Class Photos (Max 50)',body,tSaveGalleryPhoto,'lg');
}

function tGalVisChange(){
  const v=document.getElementById('tgal-vis')?.value;
  document.getElementById('tgal-class-row').style.display   =(v==='class'||v==='student')?'':'none';
  document.getElementById('tgal-student-row').style.display =(v==='student')?'':'none';
}

function tGalClassChange(){
  const classId=document.getElementById('tgal-classId')?.value;
  const studs=classId?DB.get('students').filter(s=>s.classId===classId):[];
  const sel=document.getElementById('tgal-studentId'); if(!sel) return;
  sel.innerHTML=studs.length
    ?studs.map(s=>`<option value="${s.id}">${s.name} (Roll: ${s.rollNo||'-'})</option>`).join('')
    :'<option value="">No students in this class</option>';
}

function tGalBulkFilesSelected(input){
  let files = Array.from(input.files);
  if(!files.length) return;
  if(files.length > 50){
    toast(`⚠️ Maximum 50 photos allowed. First 50 selected (${files.length} chosen).`,'warning');
    files = files.slice(0,50);
  }
  _tGalBulkQueue = files.map(f=>({name:f.name, file:f, compressed:null, status:'pending'}));
  document.getElementById('tgal-bulk-progress').style.display='block';
  document.getElementById('tgal-bulk-summary').style.display='none';
  _tGalUpdateBulkUI();
  let idx=0;
  function next(){
    if(idx>=_tGalBulkQueue.length){ _tGalBulkAllDone(); return; }
    _tGalBulkQueue[idx].status='compressing';
    _tGalUpdateBulkUI();
    _tCompressGalleryImg(_tGalBulkQueue[idx].file, compressed=>{
      _tGalBulkQueue[idx].compressed=compressed;
      _tGalBulkQueue[idx].status='done';
      idx++; _tGalUpdateBulkUI(); next();
    });
  }
  next();
}

function _tGalUpdateBulkUI(){
  const total = _tGalBulkQueue.length;
  const done  = _tGalBulkQueue.filter(q=>q.status==='done').length;
  const pct   = total ? Math.round(done/total*100) : 0;
  const bar   = document.getElementById('tgal-progress-bar');
  const label = document.getElementById('tgal-progress-label');
  const count = document.getElementById('tgal-progress-count');
  const grid  = document.getElementById('tgal-thumb-grid');
  if(bar)   bar.style.width   = pct+'%';
  if(count) count.textContent = `${done} / ${total}`;
  if(label) label.textContent = done===total&&total>0 ? '✅ All photos compressed!' : `⏳ Compressing... (${done}/${total})`;
  if(grid){
    grid.innerHTML = _tGalBulkQueue.map(q=>{
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

function _tGalBulkAllDone(){
  const ready = _tGalBulkQueue.filter(q=>q.status==='done').length;
  const countEl = document.getElementById('tgal-ready-count');
  const summEl  = document.getElementById('tgal-bulk-summary');
  if(countEl) countEl.textContent = ready;
  if(summEl)  summEl.style.display='block';
  toast(`✅ ${ready} photo(s) compressed and ready to upload!`,'success');
}

function _tCompressGalleryImg(file,cb){
  const reader=new FileReader();
  reader.onload=e=>{
    const img=new Image();
    img.onload=()=>{
      const canvas=document.createElement('canvas');
      let w=img.width, h=img.height, maxD=1200;
      if(w>maxD||h>maxD){ if(w>h){h=Math.round(h*maxD/w);w=maxD;}else{w=Math.round(w*maxD/h);h=maxD;} }
      canvas.width=w; canvas.height=h;
      canvas.getContext('2d').drawImage(img,0,0,w,h);
      let q=0.88, result=canvas.toDataURL('image/jpeg',q);
      while(result.length>200*1024*(4/3)&&q>0.2){ q=Math.max(0.2,q-0.06); result=canvas.toDataURL('image/jpeg',q); }
      cb(result);
    };
    img.src=e.target.result;
  };
  reader.readAsDataURL(file);
}

function tSaveGalleryPhoto(){
  const title=(document.getElementById('tgal-title')?.value||'').trim();
  if(!title){ toast('Event title is required','warning'); return; }
  const readyPhotos=_tGalBulkQueue.filter(q=>q.status==='done'&&q.compressed);
  if(!readyPhotos.length){ toast('Please select photos and wait for compression to finish','warning'); return; }
  const stillCompressing=_tGalBulkQueue.some(q=>q.status==='compressing');
  if(stillCompressing){ toast('⏳ Photos are still compressing, please wait...','warning'); return; }
  const vis       = document.getElementById('tgal-vis')?.value||'all';
  const classId   = vis!=='all'     ?(document.getElementById('tgal-classId')?.value  ||''):'';
  const studentId = vis==='student' ?(document.getElementById('tgal-studentId')?.value||''):'';
  if(vis==='class'   &&!classId)   { toast('Please select a class','warning');   return; }
  if(vis==='student' &&!studentId) { toast('Please select a student','warning'); return; }
  const teacher   = DB.find('teachers',CU.id)||{};
  const desc      = (document.getElementById('tgal-desc')?.value||'').trim();
  const date      = document.getElementById('tgal-date')?.value||today();
  const gallery   = DB.get('gallery');
  const baseTs    = Date.now();
  readyPhotos.forEach((q,i)=>{
    gallery.push({
      id:          genId('gal'),
      title:       readyPhotos.length>1 ? `${title} (${i+1}/${readyPhotos.length})` : title,
      description: desc,
      photo:       q.compressed,
      uploadedBy:  `teacher:${CU.id}`,
      uploaderName: teacher.name||'Teacher',
      date,
      visibility:  vis,
      classId:     classId||null,
      studentId:   studentId||null,
      createdAt:   baseTs+i
    });
  });
  DB.set('gallery',gallery);
  _tGalBulkQueue=[];
  document.getElementById('tGalUploadModal')?.remove();
  toast(`📸 ${readyPhotos.length} photo(s) uploaded successfully!`,'success');
  renderGallery();
}

function tDelGalleryPhoto(id){
  if(!confirm('Delete this photo?')) return;
  DB.set('gallery',DB.get('gallery').filter(p=>p.id!==id));
  toast('Photo deleted','info');
  renderGallery();
}


// ══════════════════════════════════════════════════════
//  ASSIGNMENTS — Teacher Panel
// ══════════════════════════════════════════════════════
// State: null = list view, string id = detail view
let _asnState = { view: 'list', assignmentId: null };

function renderAssignments() {
  _asnState.view === 'detail' && _asnState.assignmentId
    ? _asnRenderDetail(_asnState.assignmentId)
    : _asnRenderList();
  _asnUpdateBadge();
}

function _asnUpdateBadge() {
  const pending = (DB.get('assignment_submissions') || [])
    .filter(s => {
      const a = (DB.get('assignments') || []).find(x => x.id === s.assignmentId);
      return a && a.teacherId === CU.id && s.status === 'submitted';
    }).length;
  const b = document.getElementById('tch-asn-badge');
  if (b) { b.style.display = pending ? 'inline' : 'none'; b.textContent = pending; }
}

/* ── LIST VIEW ─────────────────────────────────────────── */
function _asnRenderList() {
  const myIds   = myClassIds();
  const all     = (DB.get('assignments') || [])
    .filter(a => a.teacherId === CU.id)
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  const subs    = DB.get('assignment_submissions') || [];
  const classes = DB.get('classes') || [];

  const cards = all.map(a => {
    const cls    = classes.find(c => c.id === a.classId);
    const total  = (DB.get('students') || []).filter(s => s.classId === a.classId).length;
    const submitted = subs.filter(s => s.assignmentId === a.id).length;
    const graded    = subs.filter(s => s.assignmentId === a.id && s.status === 'graded').length;
    const pending   = submitted - graded;
    const due       = a.dueDate;
    const overdue   = due && due < today() && submitted < total;
    const pct       = total ? Math.round(submitted / total * 100) : 0;
    return `
    <div style="background:rgba(255,255,255,.04);border:1.5px solid rgba(255,255,255,.08);border-radius:16px;
                padding:18px 20px;cursor:pointer;transition:all .18s;position:relative;"
         onmouseover="this.style.background='rgba(124,58,237,.08)';this.style.borderColor='rgba(124,58,237,.3)'"
         onmouseout="this.style.background='rgba(255,255,255,.04)';this.style.borderColor='rgba(255,255,255,.08)'"
         onclick="_asnState.view='detail';_asnState.assignmentId='${a.id}';renderAssignments()">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:10px;">
        <div style="flex:1;min-width:0;">
          <div style="font-weight:800;font-size:15px;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${a.title}</div>
          <div style="font-size:12px;color:rgba(255,255,255,.4);margin-top:3px;">
            ${a.subject ? `<span style="background:rgba(124,58,237,.2);color:#c4b5fd;border-radius:6px;padding:1px 8px;margin-right:6px;">${a.subject}</span>` : ''}
            <span style="background:rgba(6,182,212,.15);color:#67e8f9;border-radius:6px;padding:1px 8px;">🏫 ${cls ? cls.name : 'Class'}</span>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0;">
          ${pending > 0 ? `<span style="background:rgba(245,158,11,.2);color:#fbbf24;font-size:11px;padding:2px 8px;border-radius:10px;font-weight:700;">⏳ ${pending} to grade</span>` : ''}
          ${overdue ? `<span style="background:rgba(239,68,68,.15);color:#f87171;font-size:11px;padding:2px 8px;border-radius:10px;">⚠️ Overdue</span>` : ''}
          <button onclick="event.stopPropagation();_asnDelete('${a.id}')"
            style="background:rgba(239,68,68,.08);color:#ef4444;border:1px solid rgba(239,68,68,.2);
                   border-radius:6px;padding:2px 8px;font-size:11px;cursor:pointer;">🗑️</button>
        </div>
      </div>
      ${a.description ? `<div style="font-size:12px;color:rgba(255,255,255,.45);margin-bottom:10px;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${a.description}</div>` : ''}
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
        <div style="font-size:12px;color:rgba(255,255,255,.35);">
          📅 Due: <strong style="color:${overdue ? '#f87171' : 'rgba(255,255,255,.6)'}">${due ? _fmtDate(due) : 'No due date'}</strong>
          &nbsp;·&nbsp; Assigned: ${_fmtDate(a.assignedOn || a.createdAt)}
          ${a.fileName ? `&nbsp;·&nbsp; 📎 ${a.fileName}` : ''}
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <div style="font-size:12px;color:rgba(255,255,255,.45);">${submitted}/${total} submitted</div>
          <div style="background:rgba(255,255,255,.07);border-radius:999px;height:6px;width:80px;overflow:hidden;">
            <div style="height:100%;width:${pct}%;background:${pct>=80?'#10b981':pct>=40?'#f59e0b':'#7c3aed'};border-radius:999px;transition:width .3s;"></div>
          </div>
        </div>
      </div>
    </div>`;
  }).join('');

  document.getElementById('section-assignments').innerHTML = `
  <div class="page-header">
    <div><h2>📋 Assignments</h2>
      <div style="font-size:13px;color:rgba(255,255,255,.4);margin-top:2px;">${all.length} assignment${all.length !== 1 ? 's' : ''} given</div>
    </div>
    <button class="btn btn-primary" onclick="openCreateAssignment()" style="font-weight:700;">+ New Assignment</button>
  </div>
  ${all.length === 0
    ? `<div class="empty-state"><div class="e-icon">📋</div><h3>No assignments yet</h3>
       <p style="color:rgba(255,255,255,.4);margin-top:8px;">Click "+ New Assignment" to create your first one.</p></div>`
    : `<div style="display:grid;gap:12px;">${cards}</div>`}`;
}

/* ── DETAIL VIEW ─────────────────────────────────────────── */
function _asnRenderDetail(asnId) {
  const a    = (DB.get('assignments') || []).find(x => x.id === asnId);
  if (!a) { _asnState.view = 'list'; _asnRenderList(); return; }
  const cls  = DB.find('classes', a.classId) || { name: 'Class' };
  const students = (DB.get('students') || []).filter(s => s.classId === a.classId)
                     .sort((x, y) => String(x.rollNo || 0).localeCompare(String(y.rollNo || 0), undefined, { numeric: true }));
  const subs   = (DB.get('assignment_submissions') || []).filter(s => s.assignmentId === asnId);
  const total  = students.length;
  const submitted = subs.length;
  const graded    = subs.filter(s => s.status === 'graded').length;
  const notSub    = students.filter(st => !subs.some(s => s.studentId === st.id));

  const subRows = subs.map(s => {
    const st = students.find(x => x.id === s.studentId) || { name: s.studentName || 'Student' };
    return `
    <div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:14px 16px;margin-bottom:8px;">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:10px;">
        <div style="flex:1;min-width:0;">
          <div style="font-weight:700;color:#fff;font-size:14px;">${st.name}
            ${st.rollNo ? `<span style="font-size:11px;color:rgba(255,255,255,.3);margin-left:6px;">Roll: ${st.rollNo}</span>` : ''}
          </div>
          <div style="font-size:11px;color:rgba(255,255,255,.35);margin-top:2px;">Submitted: ${s.submittedAt ? s.submittedAt.slice(0, 16).replace('T', ' ') : today()}</div>
          ${s.text ? `<div style="margin-top:8px;font-size:13px;color:rgba(255,255,255,.65);background:rgba(255,255,255,.04);border-radius:8px;padding:8px 12px;line-height:1.6;white-space:pre-wrap;">${_escHtml(s.text)}</div>` : ''}
          ${s.fileName ? `<a href="${s.fileUrl || '#'}" target="_blank" download="${s.fileName}"
            style="display:inline-flex;align-items:center;gap:6px;margin-top:8px;background:rgba(124,58,237,.15);color:#c4b5fd;
                   border:1px solid rgba(124,58,237,.3);border-radius:8px;padding:5px 12px;font-size:12px;text-decoration:none;">
            📎 ${s.fileName} <span style="opacity:.5;font-size:10px;">(${_fmtSize(s.fileSize)})</span></a>` : ''}
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;flex-shrink:0;">
          <span style="background:${s.status === 'graded' ? 'rgba(16,185,129,.15)' : 'rgba(245,158,11,.15)'};
                       color:${s.status === 'graded' ? '#10b981' : '#f59e0b'};
                       border-radius:10px;padding:2px 10px;font-size:11px;font-weight:700;">
            ${s.status === 'graded' ? '✅ Graded' : '⏳ Pending'}
          </span>
          ${s.grade ? `<span style="background:rgba(124,58,237,.2);color:#a78bfa;border-radius:8px;padding:3px 10px;font-size:13px;font-weight:800;">${s.grade}</span>` : ''}
          <button onclick="_asnGrade('${s.id}')"
            style="background:rgba(124,58,237,.2);color:#a78bfa;border:1px solid rgba(124,58,237,.3);
                   border-radius:7px;padding:5px 12px;font-size:12px;cursor:pointer;font-weight:600;">
            ${s.status === 'graded' ? '✏️ Edit Grade' : '📝 Grade'}</button>
        </div>
      </div>
      ${s.feedback ? `<div style="margin-top:8px;padding:8px 12px;background:rgba(16,185,129,.06);border:1px solid rgba(16,185,129,.2);border-radius:8px;font-size:12px;color:#6ee7b7;">💬 Feedback: ${_escHtml(s.feedback)}</div>` : ''}
    </div>`;
  }).join('');

  const notSubRows = notSub.map(st => `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;
                background:rgba(239,68,68,.04);border-radius:8px;margin-bottom:5px;">
      <span style="font-size:13px;color:rgba(255,255,255,.45);">${st.rollNo ? `#${st.rollNo} ` : ''}${st.name}</span>
      <span style="font-size:11px;color:#ef4444;background:rgba(239,68,68,.1);padding:2px 8px;border-radius:8px;">Not submitted</span>
    </div>`).join('');

  document.getElementById('section-assignments').innerHTML = `
  <div class="page-header">
    <div>
      <button onclick="_asnState.view='list';renderAssignments()"
        style="background:rgba(255,255,255,.07);color:rgba(255,255,255,.7);border:1px solid rgba(255,255,255,.12);
               border-radius:7px;padding:5px 13px;font-size:13px;cursor:pointer;margin-bottom:8px;">← Back</button>
      <h2>📋 ${a.title}</h2>
      <div style="font-size:12px;color:rgba(255,255,255,.4);margin-top:3px;">
        ${a.subject ? `<span style="background:rgba(124,58,237,.2);color:#c4b5fd;border-radius:5px;padding:1px 7px;margin-right:6px;">${a.subject}</span>` : ''}
        🏫 ${cls.name} &nbsp;·&nbsp; 📅 Due: ${a.dueDate ? _fmtDate(a.dueDate) : 'No due date'}
      </div>
    </div>
  </div>

  <!-- Summary cards -->
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px;margin-bottom:20px;">
    <div style="background:rgba(124,58,237,.1);border:1px solid rgba(124,58,237,.2);border-radius:12px;padding:14px;text-align:center;">
      <div style="font-size:22px;font-weight:800;color:#a78bfa;">${total}</div>
      <div style="font-size:11px;color:rgba(255,255,255,.4);">Total Students</div>
    </div>
    <div style="background:rgba(16,185,129,.1);border:1px solid rgba(16,185,129,.2);border-radius:12px;padding:14px;text-align:center;">
      <div style="font-size:22px;font-weight:800;color:#10b981;">${submitted}</div>
      <div style="font-size:11px;color:rgba(255,255,255,.4);">Submitted</div>
    </div>
    <div style="background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.2);border-radius:12px;padding:14px;text-align:center;">
      <div style="font-size:22px;font-weight:800;color:#f59e0b;">${submitted - graded}</div>
      <div style="font-size:11px;color:rgba(255,255,255,.4);">Pending Grade</div>
    </div>
    <div style="background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.2);border-radius:12px;padding:14px;text-align:center;">
      <div style="font-size:22px;font-weight:800;color:#ef4444;">${total - submitted}</div>
      <div style="font-size:11px;color:rgba(255,255,255,.4);">Not Submitted</div>
    </div>
  </div>

  <!-- Assignment details card -->
  <div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:18px 20px;margin-bottom:20px;">
    <div style="font-weight:700;color:rgba(255,255,255,.5);font-size:12px;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px;">Assignment Details</div>
    ${a.description ? `<p style="color:rgba(255,255,255,.7);font-size:14px;line-height:1.7;margin:0 0 12px;white-space:pre-wrap;">${_escHtml(a.description)}</p>` : ''}
    ${a.fileName ? `<a href="${a.fileUrl || '#'}" target="_blank" download="${a.fileName}"
      style="display:inline-flex;align-items:center;gap:8px;background:rgba(124,58,237,.15);color:#c4b5fd;
             border:1px solid rgba(124,58,237,.3);border-radius:9px;padding:8px 16px;font-size:13px;text-decoration:none;font-weight:600;">
      📎 Download Attachment: ${a.fileName} <span style="opacity:.5;font-size:11px;">(${_fmtSize(a.fileSize)})</span></a>` : ''}
  </div>

  <!-- Submissions -->
  ${submitted > 0 ? `
  <div style="font-weight:700;color:rgba(255,255,255,.6);font-size:13px;margin-bottom:10px;">✅ Submissions (${submitted})</div>
  ${subRows}` : ''}

  <!-- Not submitted -->
  ${notSub.length > 0 ? `
  <div style="font-weight:700;color:rgba(255,255,255,.5);font-size:13px;margin:16px 0 8px;">❌ Not Submitted (${notSub.length})</div>
  <div style="background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.06);border-radius:12px;padding:10px;">
    ${notSubRows}
  </div>` : ''}`;
}

/* ── Grade modal ─────────────────────────────────────────── */
function _asnGrade(subId) {
  const sub = (DB.get('assignment_submissions') || []).find(s => s.id === subId);
  if (!sub) return;
  const st = DB.find('students', sub.studentId) || { name: sub.studentName || 'Student' };
  buildModal('modal-asn-grade', '📝 Grade Submission',
    `<div style="font-size:13px;color:rgba(255,255,255,.5);margin-bottom:14px;">👤 <strong style="color:#fff">${st.name}</strong></div>
     ${sub.text ? `<div style="background:rgba(255,255,255,.04);border-radius:8px;padding:10px 14px;font-size:13px;color:rgba(255,255,255,.6);margin-bottom:14px;max-height:120px;overflow-y:auto;white-space:pre-wrap;">${_escHtml(sub.text)}</div>` : ''}
     ${sub.fileName ? `<a href="${sub.fileUrl||'#'}" target="_blank" style="display:inline-block;margin-bottom:12px;font-size:12px;color:#a78bfa;">📎 ${sub.fileName}</a>` : ''}
     <div class="form-row">
       <div class="form-group"><label class="form-label">Grade / Marks</label>
         <input class="form-control" id="asn-grade" placeholder="e.g. A+, 18/20, Excellent"
           value="${sub.grade || ''}" style="font-size:16px;font-weight:700;text-align:center;">
       </div>
     </div>
     <div class="form-group"><label class="form-label">Feedback (optional)</label>
       <textarea class="form-control" id="asn-feedback" rows="3"
         placeholder="Write feedback for the student...">${sub.feedback || ''}</textarea>
     </div>`,
    () => {
      const grade    = document.getElementById('asn-grade')?.value.trim() || '';
      const feedback = document.getElementById('asn-feedback')?.value.trim() || '';
      DB.update('assignment_submissions', subId, { grade, feedback, status: 'graded', gradedAt: today() });
      toast('✅ Grade saved!', 'success');
      closeAllModals();
      renderAssignments();
    }, 'modal-md');
}

/* ── Delete ─────────────────────────────────────────────── */
function _asnDelete(id) {
  if (!confirmAction('Delete this assignment? All submissions will also be deleted.')) return;
  DB.set('assignments', (DB.get('assignments') || []).filter(a => a.id !== id));
  DB.set('assignment_submissions', (DB.get('assignment_submissions') || []).filter(s => s.assignmentId !== id));
  toast('Assignment deleted', 'info');
  _asnState.view = 'list';
  renderAssignments();
}

/* ── Create assignment modal ────────────────────────────── */
function openCreateAssignment() {
  const classes = myClasses();
  const classOpts = classes.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  buildModal('modal-asn-create', '+ New Assignment',
    `<div class="form-group"><label class="form-label">Title *</label>
       <input class="form-control" id="asn-title" placeholder="e.g. Chapter 3 — Drawing Assignment">
     </div>
     <div class="form-row">
       <div class="form-group"><label class="form-label">Subject</label>
         <input class="form-control" id="asn-subject" placeholder="e.g. Math, Science">
       </div>
       <div class="form-group"><label class="form-label">Class *</label>
         <select class="form-control" id="asn-class">${classOpts}</select>
       </div>
     </div>
     <div class="form-group"><label class="form-label">Instructions / Description</label>
       <textarea class="form-control" id="asn-desc" rows="4"
         placeholder="Describe what students need to do, how to submit, resources they can use..."></textarea>
     </div>
     <div class="form-row">
       <div class="form-group"><label class="form-label">Due Date</label>
         <input class="form-control" type="date" id="asn-due" value="${today()}">
       </div>
       <div class="form-group"><label class="form-label">Attachment (max 2MB)</label>
         <input type="file" class="form-control" id="asn-file"
           accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt,.zip"
           onchange="_asnFileCheck(this)">
         <div id="asn-file-info" style="font-size:11px;color:rgba(255,255,255,.35);margin-top:4px;"></div>
       </div>
     </div>
     <div style="background:rgba(124,58,237,.08);border:1px solid rgba(124,58,237,.2);border-radius:8px;padding:10px 14px;font-size:12px;color:rgba(255,255,255,.5);">
       💡 Students of the selected class will see this assignment and can submit text answers or upload files (max 2MB).
     </div>`,
    () => {
      const title   = document.getElementById('asn-title')?.value.trim() || '';
      const subject = document.getElementById('asn-subject')?.value.trim() || '';
      const classId = document.getElementById('asn-class')?.value || '';
      const desc    = document.getElementById('asn-desc')?.value.trim() || '';
      const due     = document.getElementById('asn-due')?.value || '';
      if (!title)   { toast('Enter assignment title', 'warning'); return; }
      if (!classId) { toast('Select a class', 'warning'); return; }
      const fileInput = document.getElementById('asn-file');
      const file      = fileInput?.files?.[0];
      const MAX       = 2 * 1024 * 1024;
      // Non-image files over 2MB cannot be compressed in browser
      if (file && file.size > MAX && !file.type.startsWith('image/')) {
        toast('Non-image file must be under 2MB — please compress the PDF/DOC and upload again', 'error'); return;
      }
      const save = (fileUrl, fileName, fileSize) => {
        const list = DB.get('assignments') || [];
        list.push({
          id: genId('asn'), title, subject, classId,
          teacherId: CU.id, teacherName: CU.name || '',
          description: desc, dueDate: due,
          fileUrl: fileUrl || '', fileName: fileName || '', fileSize: fileSize || 0,
          assignedOn: today(), createdAt: new Date().toISOString()
        });
        DB.set('assignments', list);
        toast('✅ Assignment created!', 'success');
        closeAllModals();
        renderAssignments();
      };
      if (file) {
        if (file.size > MAX && file.type.startsWith('image/')) {
          // Auto-compress large images (Canvas API) — same as student side
          toast('🗜️ Compressing image…', 'info');
          _asnCompressImage(file, MAX, (dataUrl) => {
            if (!dataUrl) { toast('Could not compress image — please use a smaller image', 'error'); return; }
            const approxBytes = Math.round(dataUrl.length * 0.75);
            save(dataUrl, file.name.replace(/\.\w+$/, '.jpg'), approxBytes);
          });
        } else {
          const reader = new FileReader();
          reader.onload = e => save(e.target.result, file.name, file.size);
          reader.readAsDataURL(file);
        }
      } else {
        save('', '', 0);
      }
    }, 'modal-lg');
}

function _asnFileCheck(input) {
  const info = document.getElementById('asn-file-info');
  if (!info) return;
  const file = input.files?.[0];
  if (!file) { info.textContent = ''; return; }
  const MAX = 2 * 1024 * 1024;
  if (file.size > MAX) {
    if (file.type.startsWith('image/')) {
      // Images auto-compress on save — just inform, don't block
      info.style.color = '#f59e0b';
      info.textContent = '🗜️ ' + file.name + ' (' + _fmtSize(file.size) + ') — larger than 2MB, it will be auto-compressed on save ✓';
    } else {
      info.style.color = '#ef4444';
      info.textContent = '❌ File too large! Max 2MB. Your file: ' + _fmtSize(file.size) + ' — please compress the PDF/DOC and upload again.';
      input.value = '';
    }
  } else {
    info.style.color = '#10b981';
    info.textContent = '✅ ' + file.name + ' (' + _fmtSize(file.size) + ')';
  }
}

// Canvas-based image compression — scales to max 1600px, lowers JPEG quality
// step-by-step until the result fits under maxBytes. Returns dataURL via cb.
function _asnCompressImage(file, maxBytes, cb) {
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let w = img.width, h = img.height;
      const MAX_DIM = 1600;
      if (w > MAX_DIM || h > MAX_DIM) {
        if (w > h) { h = Math.round(h * MAX_DIM / w); w = MAX_DIM; }
        else       { w = Math.round(w * MAX_DIM / h); h = MAX_DIM; }
      }
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      let q = 0.85;
      let dataUrl = canvas.toDataURL('image/jpeg', q);
      // Reduce quality until under limit
      while (dataUrl.length * 0.75 > maxBytes && q > 0.1) {
        q -= 0.1;
        dataUrl = canvas.toDataURL('image/jpeg', Math.max(q, 0.1));
      }
      // Still too big → shrink dimensions
      while (dataUrl.length * 0.75 > maxBytes && (w > 400 || h > 400)) {
        w = Math.round(w * 0.8); h = Math.round(h * 0.8);
        canvas.width = w; canvas.height = h;
        ctx.drawImage(img, 0, 0, w, h);
        dataUrl = canvas.toDataURL('image/jpeg', 0.7);
      }
      cb(dataUrl.length * 0.75 <= maxBytes ? dataUrl : null);
    };
    img.onerror = () => cb(null);
    img.src = e.target.result;
  };
  reader.onerror = () => cb(null);
  reader.readAsDataURL(file);
}

/* ── Helpers ─────────────────────────────────────────────── */
function _fmtDate(d) {
  if (!d) return '';
  try { return new Date(d + (d.length === 10 ? 'T00:00:00' : '')).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); } catch(e) { return d; }
}
function _fmtSize(bytes) {
  if (!bytes) return '0 B';
  const b = Number(bytes);
  if (b >= 1024 * 1024) return (b / 1024 / 1024).toFixed(1) + ' MB';
  if (b >= 1024) return (b / 1024).toFixed(0) + ' KB';
  return b + ' B';
}
function _escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

activateNav('dashboard');
