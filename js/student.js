// student.js — Student Panel
const CU = requireAuth('student');

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
const getMe = () => DB.find('students',CU.id)||{};
const getMyClass = () => { const me=getMe(); return me.classId?DB.find('classes',me.classId):null; };

// Chart registry
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
  pal:    ['#7c3aed','#06b6d4','#10b981','#f59e0b','#ef4444','#f97316','#3b82f6'],
};
function chartScales(yMax, yStep) {
  return {
    x:{ ticks:{color:CH.tick}, grid:{display:false} },
    y:{ ...(yMax?{min:0,max:yMax}:{}), ticks:{color:CH.tick,stepSize:yStep||1}, grid:{color:CH.grid} }
  };
}

// ── Build section containers (no inline display — activateNav handles visibility) ──
(function buildSections(){
  ['dashboard','profile','idcard','attendance','homework','timetable',
   'marks','reportcard','materials','qpapers','leaderboard','fees','leave','calendar','notices','cctv','messages','gallery','assignments','bustracker'].forEach(id=>{
    const d=document.createElement('div');
    d.id='section-'+id; d.className='section-content';
    $('pageBody').appendChild(d);
  });
})();

window._sectionRenderers = {
  dashboard:   renderDashboard,  profile:     renderProfile,
  idcard:      renderIDCard,     attendance:  renderAttendance,
  homework:    renderHomework,   timetable:   renderTimetable,
  marks:       renderMarks,      reportcard:  renderReportCard,
  materials:   renderMaterials,  qpapers:     renderQPapers,
  leaderboard: renderLeaderboard,fees:        renderFees,
  leave:       renderLeave,      notices:     renderNotices,
  calendar:    ()=>vmCalMount('section-calendar',{editable:false}),
  cctv:        renderCCTVStudent,
  messages:    renderStudentMessages,
  gallery:     renderStudentGallery,
  assignments: renderAssignments,
  bustracker:  renderBusTracker,
};

(function initStudentInfo(){
  const s=getMe();
  const n=$('studentName'); if(n) n.textContent=s.name||'Student';
  const c=$('studentClass'); if(c) c.textContent=getMyClass()?.name||'Class';
  const a=$('studentAvatar'); if(a) a.textContent=(s.name||'S')[0].toUpperCase();
})();

// ═════════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ═════════════════════════════════════════════════════════════════════════════
// ── Helper: get active fee reminders for current student ──────────────────────
function _getMyFeeReminders(){
  const me=getMe();
  if(!me) return [];
  return DB.get('fee_reminders').filter(r=>{
    if(r.status!=='active') return false;
    if(r.targetType==='all') return true;
    if(r.targetType==='class') return r.targetId===me.classId;
    if(r.targetType==='student') return r.targetId===me.id||r.targetId===CU.id;
    return false;
  }).sort((a,b)=>a.dueDate.localeCompare(b.dueDate));
}

function _feeReminderBannerHtml(reminders, cur){
  if(!reminders.length) return '';
  return reminders.map(r=>{
    const today_=new Date(); today_.setHours(0,0,0,0);
    const dueD=new Date(r.dueDate);
    const daysLeft=Math.ceil((dueD-today_)/86400000);
    const isOverdue=daysLeft<0;
    const lateD=r.lateFeeAfterDate?new Date(r.lateFeeAfterDate):null;
    const lateActive=lateD&&new Date()>lateD&&Number(r.lateFeeAmount||0)>0;
    const urgent=r.urgency==='urgent'||isOverdue||daysLeft<=3;
    const bg=urgent?'rgba(239,68,68,.08)':'rgba(245,158,11,.07)';
    const border=urgent?'rgba(239,68,68,.4)':'rgba(245,158,11,.4)';
    const col=urgent?'#dc2626':'#b45309';
    return `<div style="background:${bg};border:2px solid ${border};border-radius:14px;padding:16px 18px;margin-bottom:12px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;flex-wrap:wrap">
        <span style="font-size:1.4rem">${urgent?'🚨':'🔔'}</span>
        <div>
          <div style="font-weight:800;font-size:14px;color:${col}">${urgent?'URGENT: ':''}Fee Payment Reminder</div>
          <div style="font-size:12px;color:${col};opacity:.8">
            ${isOverdue?`⚠️ Overdue by ${Math.abs(daysLeft)} day${Math.abs(daysLeft)>1?'s':''}!`
              :daysLeft===0?'⚠️ Due TODAY!'
              :`📅 Due in ${daysLeft} day${daysLeft>1?'s':''} — ${formatDate(r.dueDate)}`}
          </div>
        </div>
      </div>
      <div style="font-size:13px;color:var(--text-2);white-space:pre-line;margin-bottom:10px;line-height:1.6">${r.customMsg}</div>
      ${Number(r.lateFeeAmount||0)>0?`<div style="background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.25);border-radius:8px;padding:8px 12px;font-size:12px;color:#dc2626;font-weight:600;margin-bottom:8px">
        ⚠️ Late fee of <strong>${cur}${Number(r.lateFeeAmount).toLocaleString()}</strong> will be charged if payment is not made by <strong>${formatDate(r.lateFeeAfterDate||r.dueDate)}</strong>.
        ${lateActive?'<br><span style="color:#b91c1c">🔴 Late fee is NOW APPLICABLE on your account.</span>':''}
      </div>`:''}
      <button class="btn btn-sm btn-primary" onclick="activateNav('fees')" style="font-size:12px">💳 Pay Now →</button>
    </div>`;
  }).join('');
}

// ── Helpers for Gate alerts, Badges & Tips (all free, local) ──
function _nowHHMM(){ const d=new Date(); return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0'); }
function _fmtTime(hhmm){ if(!hhmm) return ''; let [h,m]=hhmm.split(':').map(Number); const ap=h>=12?'PM':'AM'; h=h%12||12; return h+':'+String(m).padStart(2,'0')+' '+ap; }

function _sAttStats(){
  const recs=DB.get('attendance').filter(a=>a.studentId===CU.id);
  const present=recs.filter(r=>r.status==='present').length;
  const late=recs.filter(r=>r.status==='late').length;
  const todayRec=recs.find(r=>r.date===today());
  return { total:recs.length, present, late, pct:recs.length?Math.round(present/recs.length*100):0, today:todayRec?todayRec.status:null };
}
function _sMarkStats(){
  const cls=getMyClass(); const exams=cls?DB.get('exams').filter(e=>e.classId===cls.id):[]; const marks=DB.get('marks');
  const names=[...new Set(exams.map(e=>e.name))];
  const examPct=names.map(nm=>{ const exs=exams.filter(e=>e.name===nm); let o=0,m=0; exs.forEach(e=>{const mk=marks.find(x=>x.examId===e.id&&x.studentId===CU.id); if(mk){o+=Number(mk.obtained);m+=Number(e.maxMarks);}}); return {name:nm,pct:m?Math.round(o/m*100):null,has:m>0}; }).filter(x=>x.has);
  let o=0,m=0; const weak=[];
  exams.forEach(e=>{ const mk=marks.find(x=>x.examId===e.id&&x.studentId===CU.id); if(mk){o+=Number(mk.obtained);m+=Number(e.maxMarks); if(Math.round(mk.obtained/e.maxMarks*100)<40) weak.push(e.subject);} });
  return { overall:m?Math.round(o/m*100):null, weak:[...new Set(weak)], examPct };
}

/* 🚪 Gate Entry/Exit card */
function _sGateCard(){
  const g=(getSettings().gateConfig)||{}; if(!g.enabled) return '';
  const att=_sAttStats(); const me=getMe(); const now=_nowHHMM();
  const open=g.openTime||'08:00', close=g.closeTime||'14:00';
  let rows='';
  if(att.today==='present'){
    const inOk=now>=open, outOk=now>=close;
    rows=`
      <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);">
        <span style="font-size:1.3rem;">${inOk?'✅':'⏳'}</span>
        <div><div style="font-weight:700;">${inOk?'Entered school':'Entry expected'}</div>
        <div style="font-size:.78rem;color:var(--text-muted);">${_fmtTime(open)} · ${me.name}</div></div>
      </div>
      <div style="display:flex;align-items:center;gap:10px;padding:8px 0;">
        <span style="font-size:1.3rem;">${outOk?'🏠':'🕒'}</span>
        <div><div style="font-weight:700;">${outOk?'Left school — heading home':'School ends'}</div>
        <div style="font-size:.78rem;color:var(--text-muted);">${_fmtTime(close)}</div></div>
      </div>`;
  } else if(att.today==='absent'){
    rows=`<div style="padding:8px 0;color:#ef4444;font-weight:600;">⚠️ ${me.name} is marked Absent today.</div>`;
  } else {
    rows=`<div style="padding:8px 0;color:var(--text-muted);">Attendance not marked yet today.</div>`;
  }
  return `<div class="glass-card" style="margin-top:24px;border:1px solid rgba(16,185,129,.3);">
    <h3 class="card-title">🚪 Gate Updates — Today</h3>${rows}</div>`;
}

/* 🔔 Browser notification at entry/exit time (free, while app is open) */
function _sGateNotify(){
  const g=(getSettings().gateConfig)||{}; if(!g.enabled) return;
  const att=_sAttStats(); if(att.today!=='present') return;
  if(!('Notification' in window)) return;
  if(Notification.permission==='default'){ try{ Notification.requestPermission(); }catch(e){} }
  if(Notification.permission!=='granted') return;
  const me=getMe(), td=today(), now=_nowHHMM(), school=getSettings().schoolName||'School';
  const fire=(key,when,body)=>{ if(now>=when){ const k='gate_'+key+'_'+CU.id+'_'+td; if(!localStorage.getItem(k)){ localStorage.setItem(k,'1'); try{ new Notification('🏫 '+school,{body, icon:getSettings().schoolLogo||undefined}); }catch(e){} } } };
  fire('in', g.openTime||'08:00', (me.name||'Your child')+' has entered school. ✅');
  fire('out', g.closeTime||'14:00', (me.name||'Your child')+' has left school and is heading home. 🏠');
}

/* 🏅 Achievement badges */
function _sBadges(){
  const att=_sAttStats(), mk=_sMarkStats(), L=[];
  const add=(icon,name,earned,pts,how)=>L.push({icon,name,earned:!!earned,pts,how});
  add('🥇','Excellence', mk.overall!=null&&mk.overall>=90, 50, 'Score 90%+ overall');
  add('⭐','Star Performer', mk.overall!=null&&mk.overall>=75, 30, 'Score 75%+ overall');
  add('📅','Regular', att.total>0&&att.pct>=90, 30, 'Keep attendance above 90%');
  add('🎯','Perfect Attendance', att.total>0&&att.pct===100, 40, 'Never miss a school day');
  add('🕊️','Punctual', att.total>0&&att.late===0, 20, 'No late marks');
  add('📈','Rising Star', mk.examPct.length>=2&&mk.examPct[mk.examPct.length-1].pct>mk.examPct[mk.examPct.length-2].pct, 25, 'Improve from last exam');
  add('📚','All-Rounder', mk.overall!=null&&mk.weak.length===0&&mk.examPct.length>0, 35, 'No subject below 40%');
  return L;
}
function _sBadgesCard(){
  const b=_sBadges(); const earned=b.filter(x=>x.earned); const pts=earned.reduce((t,x)=>t+x.pts,0);
  return `<div class="glass-card" style="margin-top:24px;">
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
      <h3 class="card-title" style="margin:0;">🏅 My Achievements</h3>
      <div style="background:linear-gradient(135deg,#f59e0b,#f97316);color:#fff;border-radius:20px;padding:5px 16px;font-weight:800;">⚡ ${pts} pts · ${earned.length}/${b.length} badges</div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:10px;margin-top:14px;">
      ${b.map(x=>`<div title="${esc(x.how)}" style="text-align:center;padding:12px 8px;border-radius:14px;border:1px solid var(--border);background:${x.earned?'linear-gradient(135deg,rgba(245,158,11,.18),rgba(249,115,22,.1))':'var(--glass)'};opacity:${x.earned?1:.5};">
        <div style="font-size:1.8rem;${x.earned?'':'filter:grayscale(1);'}">${x.icon}</div>
        <div style="font-size:.78rem;font-weight:700;margin-top:4px;">${x.name}</div>
        <div style="font-size:.66rem;color:var(--text-muted);margin-top:2px;">${x.earned?'+'+x.pts+' pts ✓':esc(x.how)}</div>
      </div>`).join('')}
    </div></div>`;
}

/* 💡 Personalized improvement tips */
function _sTips(){
  const att=_sAttStats(), mk=_sMarkStats(), tips=[];
  if(att.total>0&&att.pct<75) tips.push('📅 Your attendance is '+att.pct+'%. Attend regularly — it directly improves your marks.');
  else if(att.total>0&&att.pct<90) tips.push('📅 Good attendance ('+att.pct+'%). Cross 90% to earn the Regular badge!');
  if(att.late>0) tips.push('🕐 You have '+att.late+' late mark(s). Reach school on time to stay punctual.');
  if(mk.weak.length) tips.push('📘 Focus more on '+mk.weak.slice(0,3).join(', ')+'. Practice 30 minutes daily and ask your teacher for help.');
  if(mk.overall!=null){
    if(mk.overall>=90) tips.push('🏆 Outstanding '+mk.overall+'%! Revise daily and help classmates to learn even more.');
    else if(mk.overall>=75) tips.push('👍 You are at '+mk.overall+'%. A little more daily practice and you can cross 90%!');
    else if(mk.overall>=40) tips.push('💪 You are at '+mk.overall+'%. Make a daily study timetable and revise weak topics first.');
    else tips.push('🌱 Start with 1 hour daily study, focus on the basics, and your marks will rise steadily.');
  }
  if(mk.examPct.length>=2){
    const last=mk.examPct[mk.examPct.length-1].pct, prev=mk.examPct[mk.examPct.length-2].pct;
    if(last>prev) tips.push('📈 Great! You improved from '+prev+'% to '+last+'%. Keep the momentum going!');
    else if(last<prev) tips.push('📉 Your last result dipped a little. Revise regularly and clear doubts early.');
  }
  if(!tips.length) tips.push('✨ Keep studying regularly and attending school — you are doing great!');
  return tips.slice(0,5);
}
function _sTipsCard(){
  return `<div class="glass-card" style="margin-top:24px;border:1px solid rgba(124,58,237,.3);">
    <h3 class="card-title">💡 Tips to Improve</h3>
    <ul style="margin:6px 0 0 18px;line-height:1.9;font-size:.9rem;color:var(--text);">
      ${_sTips().map(t=>`<li>${esc(t)}</li>`).join('')}
    </ul></div>`;
}

function renderDashboard(){
  try{ _sGateNotify(); if(!window._sGateTimer) window._sGateTimer=setInterval(_sGateNotify,60000); }catch(e){}
  const me=getMe(), cls=getMyClass(), td=today();
  const myAtt=DB.get('attendance').filter(a=>a.studentId===CU.id);
  const present=myAtt.filter(a=>a.status==='present').length;
  const absent=myAtt.filter(a=>a.status==='absent').length;
  const late=myAtt.filter(a=>a.status==='late').length;
  const attPct=myAtt.length?Math.round(present/myAtt.length*100):0;
  const classHW=cls?DB.get('homework').filter(h=>h.classId===cls.id):[];
  const pendingHW=classHW.filter(h=>h.dueDate>=td).length;
  const pendingFees=DB.get('fees').filter(f=>f.studentId===CU.id&&f.status!=='paid').length;
  const notices=DB.get('notices').filter(n=>n.audience==='all'||n.audience==='student')
    .sort((a,b)=>b.date.localeCompare(a.date)).slice(0,3);
  const myReminders=_getMyFeeReminders();

  // Recent marks for bar chart
  const myExams=cls?DB.get('exams').filter(e=>e.classId===cls.id).slice(-6):[];
  const myMarks=DB.get('marks');
  const examChart=myExams.map(e=>{
    const mk=myMarks.find(m=>m.examId===e.id&&m.studentId===CU.id);
    return {name:e.name.length>12?e.name.slice(0,12)+'…':e.name, obtained:mk?mk.obtained:null, max:e.maxMarks};
  }).filter(e=>e.obtained!==null);

  const school=getSettings();
  // Fee + performance-trend data for dashboard charts
  const _sdFees=DB.get('fees').filter(f=>f.studentId===CU.id);
  const _sdFeePaid=_sdFees.filter(f=>f.status==='paid').reduce((s,f)=>s+Number(f.amount||0),0);
  const _sdFeeDue =_sdFees.filter(f=>f.status!=='paid').reduce((s,f)=>s+Number(f.amount||0),0);
  const _sdPerf=examChart.map(e=>({name:e.name, pct:e.max?Math.round(e.obtained/e.max*100):0}));
  $('section-dashboard').innerHTML=`
    <div class="section-header" style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px;">
      <div>
        <h2 class="section-title">Dashboard</h2>
        <p class="section-subtitle">Welcome, ${me.name||'Student'}! 👋</p>
      </div>
      ${school.academicYear?`<span style="background:linear-gradient(135deg,rgba(124,58,237,.2),rgba(124,58,237,.08));color:#a78bfa;border:1px solid rgba(124,58,237,.25);border-radius:20px;padding:5px 14px;font-size:12px;font-weight:700;">📅 Session ${school.academicYear}</span>`:''}
    </div>

    ${bdayIsToday(me.dob)?`<div onclick="showBirthdayPopup()" style="cursor:pointer;background:linear-gradient(135deg,#f5c542,#e0a800);border-radius:14px;padding:16px 18px;margin-bottom:12px;display:flex;align-items:center;gap:14px;box-shadow:0 6px 20px rgba(245,197,66,.35);">
      <div style="font-size:2.2rem;">🎂</div>
      <div style="flex:1;"><div style="font-weight:800;color:#1a1a1a;font-size:1.05rem;">Happy Birthday, ${me.name?me.name.split(' ')[0]:'Student'}! 🎉</div>
      <div style="font-size:.82rem;color:#3b2f00;">Tap to open your birthday card — download & share it!</div></div>
      <div style="background:#1a1a1a;color:#f5c542;border-radius:20px;padding:6px 14px;font-weight:700;font-size:.82rem;">🎁 Open</div>
    </div>`:''}

    ${_feeReminderBannerHtml(myReminders, school.currency||'₹')}

    <div class="stats-grid">
      <div class="stat-card"><div class="stat-icon" style="background:linear-gradient(135deg,#7c3aed,#3b82f6)">🏫</div><div class="stat-info"><div class="stat-value">${cls?.name||'N/A'}</div><div class="stat-label">My Class</div></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:linear-gradient(135deg,#10b981,#06b6d4)">✅</div><div class="stat-info"><div class="stat-value">${attPct}%</div><div class="stat-label">Attendance</div></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:linear-gradient(135deg,#f59e0b,#f97316)">📚</div><div class="stat-info"><div class="stat-value">${pendingHW}</div><div class="stat-label">Pending HW</div></div></div>
      <div class="stat-card" style="${myReminders.length?'border:2px solid rgba(239,68,68,.4);animation:pulse-fee 2s infinite':''}"><div class="stat-icon" style="background:linear-gradient(135deg,#ef4444,#f97316)">💳</div><div class="stat-info"><div class="stat-value">${pendingFees}${myReminders.length?` <span style="font-size:.7rem">🔔</span>`:''}</div><div class="stat-label">Pending Fees</div></div></div>
    </div>

    ${_sGateCard()}

    ${_sBadgesCard()}

    ${_sTipsCard()}

    <div class="grid-2" style="margin-top:24px">
      <div class="glass-card">
        <h3 class="card-title">📊 My Attendance Overview</h3>
        <div style="position:relative;height:200px"><canvas id="sChDashAtt"></canvas></div>
        <div style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap;margin-top:12px;font-size:12px">
          <span style="color:#10b981">● Present (${present})</span>
          <span style="color:#ef4444">● Absent (${absent})</span>
          <span style="color:#f59e0b">● Late (${late})</span>
        </div>
      </div>
      <div class="glass-card">
        <h3 class="card-title">📝 Recent Exam Performance</h3>
        ${examChart.length
          ?`<div style="position:relative;height:220px"><canvas id="sChDashMarks"></canvas></div>`
          :'<p class="text-muted">No exam results yet.</p>'}
      </div>
    </div>

    <div class="grid-2" style="margin-top:24px">
      <div class="glass-card">
        <h3 class="card-title">💳 Fee Status</h3>
        ${(_sdFeePaid+_sdFeeDue)>0
          ? `<div style="position:relative;height:200px"><canvas id="sChDashFee"></canvas></div>
             <div style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap;margin-top:12px;font-size:12px">
               <span style="color:#10b981">● Paid (₹${_sdFeePaid.toLocaleString()})</span>
               <span style="color:#ef4444">● Due (₹${_sdFeeDue.toLocaleString()})</span>
             </div>`
          : '<p class="text-muted">No fee records yet.</p>'}
      </div>
      <div class="glass-card">
        <h3 class="card-title">📈 Performance Trend</h3>
        ${_sdPerf.length>1
          ? `<div style="position:relative;height:220px"><canvas id="sChDashPerf"></canvas></div>`
          : '<p class="text-muted">Need at least 2 exams to show a trend.</p>'}
      </div>
    </div>

    <div class="grid-2" style="margin-top:24px">
      <div class="glass-card">
        <h3 class="card-title">📢 Latest Notices</h3>
        ${notices.map(n=>`
          <div style="padding:10px 0;border-bottom:1px solid var(--border)">
            <div style="font-weight:600">${n.title}</div>
            <div style="color:var(--text-muted);font-size:12px;margin-top:2px">${(n.body||'').slice(0,80)}${(n.body||'').length>80?'...':''}</div>
            <div style="color:var(--text-muted);font-size:11px;margin-top:4px">${n.date}</div>
          </div>`).join('')||'<p class="text-muted">No notices.</p>'}
      </div>
      <div class="glass-card">
        <h3 class="card-title">📚 Upcoming Homework</h3>
        ${classHW.filter(h=>h.dueDate>=td).slice(0,5).map(h=>`
          <div style="padding:10px 0;border-bottom:1px solid var(--border)">
            <div style="font-weight:600">${h.subject}</div>
            <div style="color:var(--text-muted);font-size:12px">${(h.description||'').slice(0,60)}</div>
            <div style="color:var(--yellow);font-size:11px;margin-top:4px">Due: ${h.dueDate}</div>
          </div>`).join('')||'<p class="text-muted">No pending homework.</p>'}
      </div>
    </div>`;

  // Attendance donut
  mkChart('sChDashAtt',{type:'doughnut',data:{
    labels:['Present','Absent','Late'],
    datasets:[{data:[present||0,absent||0,late||0],
      backgroundColor:['#10b981','#ef4444','#f59e0b'],
      borderWidth:0,hoverOffset:8}]
  },options:{responsive:true,maintainAspectRatio:false,
    plugins:{legend:{display:false},
      tooltip:{callbacks:{label:c=>`${c.label}: ${c.raw} days`}}}}});

  // Recent marks bar
  if(examChart.length) mkChart('sChDashMarks',{type:'bar',data:{
    labels:examChart.map(e=>e.name),
    datasets:[
      {label:'Your Score',data:examChart.map(e=>e.obtained),backgroundColor:'rgba(124,58,237,0.85)',borderRadius:6,borderSkipped:false},
      {label:'Max Marks',data:examChart.map(e=>e.max),backgroundColor:'rgba(6,182,212,0.25)',borderRadius:6,borderSkipped:false}
    ]
  },options:{responsive:true,maintainAspectRatio:false,
    plugins:{legend:{labels:{color:CH.legend}}},scales:chartScales(null,10)}});

  // Fee status donut
  if((_sdFeePaid+_sdFeeDue)>0) mkChart('sChDashFee',{type:'doughnut',data:{
    labels:['Paid','Due'],
    datasets:[{data:[_sdFeePaid,_sdFeeDue],backgroundColor:['#10b981','#ef4444'],borderWidth:0,hoverOffset:8}]
  },options:{responsive:true,maintainAspectRatio:false,cutout:'68%',
    plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>`${c.label}: ₹${Number(c.raw).toLocaleString()}`}}}}});

  // Performance trend line
  if(_sdPerf.length>1) mkChart('sChDashPerf',{type:'line',data:{
    labels:_sdPerf.map(p=>p.name),
    datasets:[{label:'Score %',data:_sdPerf.map(p=>p.pct),borderColor:'#7c3aed',
      backgroundColor:'rgba(124,58,237,.15)',fill:true,tension:.4,borderWidth:3,
      pointBackgroundColor:'#7c3aed',pointRadius:4}]
  },options:{responsive:true,maintainAspectRatio:false,
    plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>c.raw+'%'}}},
    scales:{x:{ticks:{color:CH.tick},grid:{display:false}},y:{min:0,max:100,ticks:{color:CH.tick,callback:v=>v+'%'},grid:{color:CH.grid}}}}});
}

// ═════════════════════════════════════════════════════════════════════════════
// PROFILE
// ═════════════════════════════════════════════════════════════════════════════
function renderProfile(){
  const s=getMe(), cls=getMyClass();
  $('section-profile').innerHTML=`
    <div class="section-header"><h2 class="section-title">My Profile</h2></div>
    <div class="glass-card" style="max-width:640px">
      <div style="display:flex;gap:20px;align-items:center;margin-bottom:24px">
        <div style="width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,var(--purple),var(--cyan));display:flex;align-items:center;justify-content:center;color:#fff;font-size:28px;font-weight:700">${(s.name||'S')[0].toUpperCase()}</div>
        <div><h3>${s.name||'Student'}</h3><p style="color:var(--text-muted)">${cls?.name||''} · Roll No: ${s.rollNo||'—'}</p></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px;font-size:14px">
        <div><span style="color:var(--text-muted);font-size:12px">Father's Name</span><div>${s.fatherName||'—'}</div></div>
        <div><span style="color:var(--text-muted);font-size:12px">Mother's Name</span><div>${s.motherName||'—'}</div></div>
        <div><span style="color:var(--text-muted);font-size:12px">Date of Birth</span><div>${s.dob||'—'}</div></div>
        <div><span style="color:var(--text-muted);font-size:12px">Gender</span><div>${s.gender||'—'}</div></div>
        <div><span style="color:var(--text-muted);font-size:12px">Admission No</span><div>${s.admissionNo||s.id}</div></div>
        <div><span style="color:var(--text-muted);font-size:12px">Blood Group</span><div>${s.bloodGroup||'—'}</div></div>
      </div>
      <hr style="border-color:var(--border);margin:20px 0">
      <h4 style="margin-bottom:16px;color:var(--cyan)">Update Contact Info</h4>
      <div class="form-grid">
        <div class="form-group"><label class="form-label">Phone</label><input class="form-control" type="tel" inputmode="tel" id="spPhone" value="${s.phone||''}"></div>
        <div class="form-group"><label class="form-label">Email</label><input class="form-control" type="email" inputmode="email" id="spEmail" value="${s.email||''}"></div>
        <div class="form-group" style="grid-column:1/-1"><label class="form-label">Address</label><textarea class="form-control" id="spAddress" rows="2">${s.address||''}</textarea></div>
        <div class="form-group"><label class="form-label">New Password</label><input type="password" class="form-control" id="spPass" placeholder="Leave blank to keep"></div>
      </div>
      <button class="btn btn-primary mt-8" onclick="saveStudentProfile()">💾 Save Changes</button>
    </div>
    <div class="glass-card" style="max-width:640px;margin-top:16px;">
      <h3 class="card-title">🌐 Language / भाषा</h3>
      <p style="color:var(--text-muted);font-size:.85rem;margin-bottom:10px;">Choose your display language.</p>
      ${typeof langSelectorHtml==='function'?langSelectorHtml():''}
    </div>`;
}
function saveStudentProfile(){
  const s=getMe();
  DB.update('students',CU.id,{...s,phone:val('spPhone'),email:val('spEmail'),address:val('spAddress')});
  const np=val('spPass');
  if(np){ const users=DB.get('users'); const idx=users.findIndex(u=>u.id===CU.id); if(idx!==-1){users[idx].password=np;DB.set('users',users);} }
  toast('Profile updated!','success');
}

// ═════════════════════════════════════════════════════════════════════════════
// ID CARD
// ═════════════════════════════════════════════════════════════════════════════
function renderIDCard(){
  const me=getMe(), school=DB.getObj('school_settings');
  // Show ONLY the design the admin selected (shared builder) — no picker
  const card = (typeof buildIDCard==='function')
    ? buildIDCard(me, DB.get('classes'), school, false)
    : '<p class="text-muted">ID card loading…</p>';
  $('section-idcard').innerHTML=`
    <div class="section-header">
      <h2 class="section-title">My ID Card</h2>
      <button class="btn btn-primary" onclick="printStudentIDCard()">🖨️ Print</button>
    </div>
    <div style="display:flex;flex-direction:column;align-items:center;gap:16px;padding:16px;">
      ${card}
      <div style="font-size:.75rem;color:rgba(255,255,255,.35);text-align:center;max-width:300px;line-height:1.5;">
        📱 Show the QR code on your card to your teacher — they can scan it with the camera to mark your attendance instantly.
      </div>
    </div>`;
  // Fill the QR placeholder used by the shared builder
  setTimeout(function() {
    _vmGenQR('qra-' + (me.id||'stu'), 'VM:STU:' + (me.id||''), 68);
  }, 120);
}

function _buildStudentIDCard(me, cls, school, theme='royal') {
  school = school || {};
  const initials = (me.name||'S').split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2);
  const themes = {
    royal:  { grad:'linear-gradient(135deg,#4c1d95 0%,#1e3a5f 100%)', accent:'#a78bfa', stripe:'#6d28d9', badge:'#ddd6fe', badgeText:'#4c1d95' },
    ocean:  { grad:'linear-gradient(135deg,#0c4a6e 0%,#065f46 100%)', accent:'#34d399', stripe:'#059669', badge:'#d1fae5', badgeText:'#065f46' },
    forest: { grad:'linear-gradient(135deg,#14532d 0%,#1e3a5f 100%)', accent:'#6ee7b7', stripe:'#10b981', badge:'#d1fae5', badgeText:'#14532d' },
    sunset: { grad:'linear-gradient(135deg,#7c2d12 0%,#1e3a5f 100%)', accent:'#fbbf24', stripe:'#d97706', badge:'#fef3c7', badgeText:'#7c2d12' },
  };
  const t = themes[theme]||themes.royal;
  const sName  = school.schoolName  || 'My School';
  const sTag   = school.schoolTagline || '';
  const acYear = school.academicYear || '';
  const sPhone = school.schoolPhone  || school.schoolEmail || '';
  const sLogo  = school.schoolLogo   || '';

  const schoolLogoHtml = sLogo
    ? `<img src="${sLogo}" style="width:34px;height:34px;border-radius:7px;object-fit:contain;background:rgba(255,255,255,.9);padding:2px;flex-shrink:0;">`
    : `<div style="width:36px;height:36px;border-radius:8px;background:rgba(255,255,255,.15);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">🎓</div>`;
  const studentPhotoHtml = me.photo
    ? `<img src="${me.photo}" style="width:72px;height:72px;border-radius:50%;object-fit:cover;border:3px solid rgba(255,255,255,.5);flex-shrink:0;">`
    : `<div style="width:72px;height:72px;border-radius:50%;background:rgba(255,255,255,.15);border:3px solid rgba(255,255,255,.3);display:flex;align-items:center;justify-content:center;font-size:1.6rem;font-weight:800;color:#fff;flex-shrink:0;">${initials}</div>`;

  return `<div style="
    width:300px;border-radius:16px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,.6);
    font-family:'Segoe UI',Arial,sans-serif;border:2px solid ${t.stripe};">
    <div style="background:${t.grad};padding:20px;position:relative;overflow:hidden;">
      <div style="position:absolute;top:-30px;right:-30px;width:100px;height:100px;border-radius:50%;background:rgba(255,255,255,.06);"></div>
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
        ${schoolLogoHtml}
        <div style="min-width:0;">
          <div style="font-weight:800;font-size:.85rem;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${sName}</div>
          ${sTag?`<div style="font-size:.65rem;color:rgba(255,255,255,.55);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${sTag}</div>`:''}
        </div>
        <div style="margin-left:auto;background:${t.badge};color:${t.badgeText};font-size:.6rem;font-weight:800;padding:2px 8px;border-radius:20px;white-space:nowrap;flex-shrink:0;">STUDENT ID</div>
      </div>
      <div style="display:flex;align-items:center;gap:14px;">
        ${studentPhotoHtml}
        <div style="min-width:0;">
          <div style="font-size:1.08rem;font-weight:800;color:#fff;">${me.name||'Student'}</div>
          <div style="font-size:.8rem;color:${t.accent};font-weight:600;margin-top:3px;">${cls?cls.name:'—'}</div>
          <div style="margin-top:6px;background:rgba(255,255,255,.15);border-radius:6px;display:inline-block;padding:2px 10px;">
            <span style="font-size:.7rem;color:rgba(255,255,255,.7);">Roll: </span>
            <span style="font-size:.75rem;font-weight:700;color:#fff;">${me.rollNo||'—'}</span>
          </div>
        </div>
      </div>
    </div>
    <div style="height:4px;background:linear-gradient(to right,${t.stripe},${t.accent},${t.stripe});"></div>
    <div style="background:#fff;padding:14px 18px;">
      ${[
        ['Adm. No', me.admissionNo||me.id||'—'],
        ['Date of Birth', me.dob||'—'],
        ['Blood Group', me.bloodGroup||'—'],
        ["Father's Name", me.fatherName||'—'],
        ['Contact', me.phone||'—'],
      ].map(([k,v])=>`
        <div style="display:flex;align-items:baseline;margin-bottom:7px;padding-bottom:7px;border-bottom:1px solid #f1f5f9;">
          <span style="font-size:.68rem;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;width:90px;flex-shrink:0;">${k}</span>
          <span style="font-size:.8rem;font-weight:600;color:#1e293b;">${v}</span>
        </div>`).join('')}
    </div>
    <!-- QR Code strip (for attendance scanning) -->
    <div style="background:#f8fafc;padding:10px 16px;display:flex;align-items:center;gap:12px;border-top:1px solid #f1f5f9;">
      <div style="flex-shrink:0;">
        <div id="qrs-${me.id||'stu'}" style="width:68px;height:68px;line-height:0;overflow:hidden;border-radius:4px;background:#fff;"></div>
      </div>
      <div>
        <div style="font-size:.58rem;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px;">Scan for Attendance</div>
        <div style="font-size:.62rem;font-weight:800;color:#334155;font-family:monospace;">${(me.id||'').slice(-8).toUpperCase()}</div>
        <div style="font-size:.58rem;color:#94a3b8;margin-top:4px;">Show this QR to teacher</div>
      </div>
    </div>

    <div style="background:${t.badge};padding:8px 18px;display:flex;justify-content:space-between;align-items:center;">
      <span style="font-size:.65rem;font-weight:700;color:${t.badgeText};">AY: ${acYear}</span>
      <span style="font-size:.65rem;color:${t.badgeText};opacity:.8;">${sPhone}</span>
    </div>
  </div>`;
}

function printStudentIDCard(){
  const me=getMe(), school=DB.getObj('school_settings');
  const card = buildIDCard(me, DB.get('classes'), school, true); // embedQR for print
  printHtml(`<style>body{margin:0;display:flex;justify-content:center;align-items:flex-start;padding:40px;background:#f8fafc;}@media print{body{padding:10px;background:#fff;}}</style>${card}`, 'ID Card — '+(me.name||''));
}

// ═════════════════════════════════════════════════════════════════════════════
// ATTENDANCE
// ═════════════════════════════════════════════════════════════════════════════
function renderAttendance(){
  const records=DB.get('attendance').filter(a=>a.studentId===CU.id).sort((a,b)=>b.date.localeCompare(a.date));
  const present=records.filter(r=>r.status==='present').length;
  const absent=records.filter(r=>r.status==='absent').length;
  const late=records.filter(r=>r.status==='late').length;
  const pct=records.length?Math.round(present/records.length*100):0;

  // Monthly breakdown
  const monthly=records.reduce((acc,r)=>{
    const mon=r.date.slice(0,7);
    if(!acc[mon]) acc[mon]={p:0,ab:0,lt:0};
    if(r.status==='present') acc[mon].p++;
    else if(r.status==='absent') acc[mon].ab++;
    else acc[mon].lt++;
    return acc;
  },{});
  const months=Object.keys(monthly).sort().slice(-6);

  const _faceOn=(typeof faceIsEnrolled==='function')&&faceIsEnrolled(CU.id);
  $('section-attendance').innerHTML=`
    <div class="section-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
      <h2 class="section-title">My Attendance</h2>
      <button class="btn ${_faceOn?'btn-secondary':'btn-primary'}" onclick="faceOpenEnroll(CU.id,'student',getMe().name,getMe().classId)">
        ${_faceOn?'🔄 Re-register Face':'🙂 Register My Face'}
      </button>
    </div>
    ${_faceOn?'<div style="background:rgba(16,185,129,.1);border:1px solid rgba(16,185,129,.3);border-radius:10px;padding:10px 14px;margin-bottom:12px;font-size:.85rem;color:#10b981;">✅ Your face is registered — attendance can be marked by face at school.</div>':'<div style="background:rgba(124,58,237,.08);border:1px solid rgba(124,58,237,.25);border-radius:10px;padding:10px 14px;margin-bottom:12px;font-size:.85rem;color:var(--text-2);">🙂 Register your face once to enable touch-free, proxy-proof attendance.</div>'}

    <!-- Stats row: 4 cards, 2×2 on mobile -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon" style="background:linear-gradient(135deg,#10b981,#06b6d4);width:42px;height:42px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:1.3rem;margin-bottom:10px">✅</div>
        <div class="stat-value">${present}</div><div class="stat-label">Present Days</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:linear-gradient(135deg,#ef4444,#f97316);width:42px;height:42px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:1.3rem;margin-bottom:10px">❌</div>
        <div class="stat-value">${absent}</div><div class="stat-label">Absent Days</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:linear-gradient(135deg,#f59e0b,#f97316);width:42px;height:42px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:1.3rem;margin-bottom:10px">⏰</div>
        <div class="stat-value">${late}</div><div class="stat-label">Late Days</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:linear-gradient(135deg,#7c3aed,#3b82f6);width:42px;height:42px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:1.3rem;margin-bottom:10px">📊</div>
        <div class="stat-value">${pct}%</div><div class="stat-label">Percentage</div>
      </div>
    </div>

    <!-- Charts: side by side on desktop, stacked on mobile -->
    <div class="grid-2 mt-8" style="gap:12px">
      <div class="glass-card">
        <h3 class="card-title">📊 Attendance Summary</h3>
        <div style="position:relative;height:180px;max-height:180px;overflow:hidden"><canvas id="sChAttDonut"></canvas></div>
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:10px;font-size:12px">
          <span style="color:#10b981">● Present (${present})</span>
          <span style="color:#ef4444">● Absent (${absent})</span>
          <span style="color:#f59e0b">● Late (${late})</span>
        </div>
      </div>
      ${months.length?`
      <div class="glass-card">
        <h3 class="card-title">📅 Monthly Attendance</h3>
        <div style="position:relative;height:180px;max-height:180px;overflow:hidden"><canvas id="sChAttMonth"></canvas></div>
      </div>`:`<div class="glass-card" style="display:flex;align-items:center;justify-content:center"><p class="text-muted" style="text-align:center">No monthly data yet.</p></div>`}
    </div>

    <!-- Records table: always scrollable -->
    <div class="glass-card mt-8">
      <h3 class="card-title">📋 Attendance Records</h3>
      ${records.length?`
      <div style="overflow-x:auto;-webkit-overflow-scrolling:touch;border-radius:8px;">
        <table style="width:100%;border-collapse:collapse;font-size:.87rem;min-width:0">
          <thead>
            <tr>
              <th style="padding:10px 14px;text-align:left;font-size:.75rem;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text-3);border-bottom:1px solid rgba(255,255,255,.08)">Date</th>
              <th style="padding:10px 14px;text-align:left;font-size:.75rem;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text-3);border-bottom:1px solid rgba(255,255,255,.08)">Status</th>
            </tr>
          </thead>
          <tbody>
            ${records.map(r=>`<tr style="border-bottom:1px solid rgba(255,255,255,.04)">
              <td style="padding:10px 14px;color:var(--text-2)">${r.date}</td>
              <td style="padding:10px 14px"><span class="badge ${r.status==='present'?'badge-green':r.status==='absent'?'badge-red':'badge-yellow'}">${r.status}</span></td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>`:`<p class="text-muted" style="text-align:center;padding:20px 0">No attendance records yet.</p>`}
    </div>`;

  mkChart('sChAttDonut',{type:'doughnut',data:{
    labels:['Present','Absent','Late'],
    datasets:[{data:[present||0,absent||0,late||0],
      backgroundColor:['#10b981','#ef4444','#f59e0b'],borderWidth:0,hoverOffset:8}]
  },options:{responsive:true,maintainAspectRatio:false,
    plugins:{legend:{display:false},
      tooltip:{callbacks:{label:c=>`${c.label}: ${c.raw} days`}}}}});

  if(months.length) mkChart('sChAttMonth',{type:'bar',data:{
    labels:months.map(m=>{const [y,mo]=m.split('-');return new Date(y,mo-1).toLocaleString('en',{month:'short',year:'2-digit'});}),
    datasets:[
      {label:'Present',data:months.map(m=>monthly[m].p),backgroundColor:'rgba(16,185,129,0.85)',borderRadius:5,borderSkipped:false},
      {label:'Absent', data:months.map(m=>monthly[m].ab),backgroundColor:'rgba(239,68,68,0.75)',borderRadius:5,borderSkipped:false},
      {label:'Late',   data:months.map(m=>monthly[m].lt),backgroundColor:'rgba(245,158,11,0.75)',borderRadius:5,borderSkipped:false}
    ]
  },options:{responsive:true,maintainAspectRatio:false,
    plugins:{legend:{labels:{color:CH.legend}}},
    scales:{x:{ticks:{color:CH.tick},grid:{display:false}},y:{ticks:{color:CH.tick,stepSize:1},grid:{color:CH.grid}}}}});
}

// ═════════════════════════════════════════════════════════════════════════════
// HOMEWORK
// ═════════════════════════════════════════════════════════════════════════════
function renderHomework(){
  const cls=getMyClass(), td=today();
  const hw=cls?DB.get('homework').filter(h=>h.classId===cls.id).sort((a,b)=>b.dueDate.localeCompare(a.dueDate)):[];
  $('section-homework').innerHTML=`
    <div class="section-header"><h2 class="section-title">📚 Homework</h2></div>
    ${hw.length
      ? `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px">
          ${hw.map(h=>{
            const ov=h.dueDate<td;
            return `<div class="glass-card" style="padding:0;overflow:hidden;border-radius:16px">
              ${h.photo?`<div style="position:relative">
                <img src="${h.photo}" style="width:100%;max-height:220px;object-fit:cover;display:block;cursor:pointer"
                  onclick="this.style.maxHeight=this.style.maxHeight==='none'?'220px':'none'" title="Tap to expand">
                <div style="position:absolute;bottom:8px;right:8px;background:rgba(0,0,0,.6);color:#fff;font-size:10px;padding:3px 8px;border-radius:6px">📷 Tap to expand</div>
              </div>`:''}
              <div style="padding:14px">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
                  <span class="badge badge-purple">${h.subject}</span>
                  <span class="badge ${ov?'badge-red':'badge-green'}">${ov?'⚠️ Overdue':'✅ Pending'}</span>
                </div>
                ${h.description?`<div style="font-size:14px;color:var(--text-primary);margin-bottom:6px">${h.description}</div>`:''}
                <div style="font-size:12px;color:var(--text-muted)">📅 Due: <strong>${h.dueDate}</strong></div>
              </div>
            </div>`;
          }).join('')}
        </div>`
      : '<div class="glass-card"><p class="text-muted" style="text-align:center;padding:40px">No homework assigned.</p></div>'}`;
}

// ═════════════════════════════════════════════════════════════════════════════
// TIMETABLE
// ═════════════════════════════════════════════════════════════════════════════
function renderTimetable(){
  const cls=getMyClass();
  const tt=DB.get('timetable');
  const s=(DB.get('ttSettings')||[])[0]||{};
  const DAYS=s.days||['Monday','Tuesday','Wednesday','Thursday','Friday'];
  const SLOTS=s.slots||['9:00–9:45','9:45–10:30','10:30–11:15','11:15–12:00','12:00–12:45','1:30–2:15','2:15–3:00'];
  $('section-timetable').innerHTML=`
    <div class="section-header">
      <h2 class="section-title">📅 My Timetable</h2>
      ${cls?`<span class="badge badge-purple">${cls.name}</span>`:''}
    </div>
    <div class="glass-card" style="overflow-x:auto;padding:0">
      ${cls?`<table class="data-table timetable-table" style="min-width:${140+DAYS.length*110}px">
        <thead><tr>
          <th style="white-space:nowrap;padding:12px">⏰ Time</th>
          ${DAYS.map(d=>`<th style="min-width:110px">${d}</th>`).join('')}
        </tr></thead>
        <tbody>${SLOTS.map(slot=>`<tr>
          <td style="font-weight:700;color:var(--cyan);white-space:nowrap;font-size:12px;padding:10px 12px">${slot}</td>
          ${DAYS.map(day=>{
            const cell=tt.find(t=>t.classId===cls.id&&t.day===day&&t.slot===slot)||{};
            if(cell.isBreak) return `<td style="text-align:center"><span style="color:#f59e0b;font-size:12px">☕ Break</span></td>`;
            return `<td style="padding:8px">${cell.subject
              ?`<div style="font-weight:600;font-size:13px">${cell.subject}</div><div style="font-size:11px;color:var(--text-muted)">${cell.teacher||''}</div>`
              :'<span style="color:var(--text-muted);font-size:12px">—</span>'}</td>`;
          }).join('')}
        </tr>`).join('')}
        </tbody>
      </table>`:'<p class="text-muted" style="padding:40px;text-align:center">No class assigned.</p>'}
    </div>`;
}

// ═════════════════════════════════════════════════════════════════════════════
// MARKS
// ═════════════════════════════════════════════════════════════════════════════
function renderMarks(){
  const cls=getMyClass();
  const exams=cls?DB.get('exams').filter(e=>e.classId===cls.id):[];
  const marks=DB.get('marks');
  const examData=exams.map(e=>{
    const mk=marks.find(m=>m.examId===e.id&&m.studentId===CU.id);
    const pct=mk?Math.round(mk.obtained/e.maxMarks*100):null;
    const g=pct!==null?getGrade(pct):null;
    return {e,mk,pct,g};
  });
  const chartData=examData.filter(d=>d.pct!==null);

  $('section-marks').innerHTML=`
    <div class="section-header"><h2 class="section-title">My Marks</h2></div>

    ${chartData.length?`
    <div class="glass-card" style="margin-bottom:20px">
      <h3 class="card-title">📊 Exam Performance Chart</h3>
      <div style="position:relative;height:240px"><canvas id="sChMarks"></canvas></div>
    </div>`:''}

    <div class="glass-card">
      ${exams.length?`<table class="data-table"><thead><tr><th>Exam</th><th>Subject</th><th>Date</th><th>Obtained</th><th>Max</th><th>%</th><th>Grade</th></tr></thead><tbody>
        ${examData.map(({e,mk,pct,g})=>`<tr>
          <td><strong>${e.name}</strong></td>
          <td>${e.subject}</td>
          <td>${e.date}</td>
          <td>${mk?mk.obtained:'—'}</td>
          <td>${e.maxMarks}</td>
          <td>${pct!==null?pct+'%':'—'}</td>
          <td>${g?`<span class="badge" style="background:${g.color}20;color:${g.color}">${g.grade}</span>`:'—'}</td>
        </tr>`).join('')}
      </tbody></table>`:'<p class="text-muted">No exams yet.</p>'}
    </div>`;

  if(chartData.length) mkChart('sChMarks',{type:'bar',data:{
    labels:chartData.map(d=>d.e.name.length>14?d.e.name.slice(0,14)+'…':d.e.name),
    datasets:[
      {label:'Your Score',data:chartData.map(d=>d.mk.obtained),
        backgroundColor:chartData.map(d=>d.g.color+'cc'),borderRadius:8,borderSkipped:false},
      {label:'Max Marks',data:chartData.map(d=>d.e.maxMarks),
        backgroundColor:'rgba(148,163,184,0.2)',borderRadius:8,borderSkipped:false}
    ]
  },options:{responsive:true,maintainAspectRatio:false,
    plugins:{legend:{labels:{color:CH.legend}},
      tooltip:{callbacks:{label:c=>{const d=chartData[c.dataIndex]; return c.datasetIndex===0?`Score: ${c.raw}/${d.e.maxMarks} (${d.pct}%) — ${d.g.grade}`:`Max: ${c.raw}`;} }}},
    scales:{x:{ticks:{color:CH.tick},grid:{display:false}},y:{min:0,ticks:{color:CH.tick,stepSize:10},grid:{color:CH.grid}}}}});
}

// ═════════════════════════════════════════════════════════════════════════════
// REPORT CARD
// ═════════════════════════════════════════════════════════════════════════════
function calcReport(){
  const cls=getMyClass();
  const exams=cls?DB.get('exams').filter(e=>e.classId===cls.id):[];
  const marks=DB.get('marks');
  let totO=0,totM=0;
  const rows=exams.map(e=>{
    const mk=marks.find(m=>m.examId===e.id&&m.studentId===CU.id);
    const pct=mk?Math.round(mk.obtained/e.maxMarks*100):null;
    if(mk){totO+=parseFloat(mk.obtained);totM+=e.maxMarks;}
    return {e,mk,pct,g:pct!==null?getGrade(pct):null};
  });
  const ovPct=totM>0?Math.round(totO/totM*100):0;
  return {rows,totO,totM,ovPct,ovG:getGrade(ovPct)};
}
function renderReportCard(){
  const s=getMe();
  const cfg=rcGetConfig();
  const data=rcBuildData(s.id, cfg.publishedExam||'');
  const tName=(RC_TEMPLATES.find(t=>t.id===cfg.template)||{}).name||'Report Card';

  if(!data || !data.subjects.length){
    $('section-reportcard').innerHTML=`
      <div class="section-header"><h2 class="section-title">Report Card</h2></div>
      <div class="glass-card"><p class="text-muted" style="padding:30px;text-align:center">No exam results published yet. Your report card will appear here once the school publishes it.</p></div>`;
    return;
  }

  // The exact design the admin selected, shown live and printable
  const card=rcRenderCard(cfg.template, data);
  $('section-reportcard').innerHTML=`
    <div class="section-header">
      <h2 class="section-title">Report Card</h2>
      <button class="btn btn-primary" onclick="printReportCard()">🖨️ Print / Save PDF</button>
    </div>
    <div style="background:#eef2f7;border-radius:14px;padding:18px;overflow-x:auto;">
      <div style="min-width:760px;">${card}</div>
    </div>`;
}
function printReportCard(){
  const s=getMe();
  const cfg=rcGetConfig();
  const data=rcBuildData(s.id, cfg.publishedExam||'');
  if(!data){toast&&toast('No report data','error');return;}
  rcPrintCard(rcRenderCard(cfg.template, data), `Report Card — ${data.st.name||''}`);
}

// ═════════════════════════════════════════════════════════════════════════════
// MATERIALS
// ═════════════════════════════════════════════════════════════════════════════
function renderMaterials(){
  const cls=getMyClass();
  const mats=cls?DB.get('materials').filter(m=>m.classId===cls.id).sort((a,b)=>(b.date||b.uploadedOn||'').localeCompare(a.date||a.uploadedOn||'')):[];
  // Determine class number from class name e.g. "Class 7A" → "7"
  const classNumMatch = cls ? (cls.name||'').match(/\d+/) : null;
  const defaultClassNum = classNumMatch ? classNumMatch[0] : '';

  $('section-materials').innerHTML=`
    <div class="section-header"><h2 class="section-title">Study Materials</h2></div>

    <!-- Curriculum Library -->
    <div class="glass-card mb-16" style="padding:20px;">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:16px;">
        <div>
          <h3 style="margin:0;font-size:1rem;">📚 Curriculum Library</h3>
          <div style="font-size:.78rem;color:rgba(255,255,255,.4);">Pre-defined chapters &amp; Q&A for Class 1–10</div>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <select id="std-lib-class" onchange="stdLoadLibSubjects()" style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:8px;color:#fff;padding:7px 12px;font-size:.85rem;">
            <option value="">Select Class</option>
            ${['1','2','3','4','5','6','7','8','9','10'].map(c=>`<option value="${c}" ${c===defaultClassNum?'selected':''}>${'Class '+c}</option>`).join('')}
          </select>
          <select id="std-lib-subject" onchange="stdLoadLibChapters()" style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:8px;color:#fff;padding:7px 12px;font-size:.85rem;">
            <option value="">Select Subject</option>
          </select>
        </div>
      </div>
      <div id="std-lib-content" style="color:rgba(255,255,255,.35);text-align:center;padding:24px;">
        Select class &amp; subject to browse chapters
      </div>
    </div>

    <!-- Uploaded Materials -->
    <div class="glass-card">
      <div style="font-weight:600;font-size:.95rem;margin-bottom:12px;">📂 Uploaded by Teachers</div>
      ${mats.length?`<table class="data-table"><thead><tr><th>Title</th><th>Subject</th><th>Type</th><th>Date</th><th>Download</th></tr></thead><tbody>
        ${mats.map(m=>`<tr>
          <td><strong>${m.title}</strong>${m.description?`<div style="font-size:12px;color:var(--text-muted)">${m.description}</div>`:''}</td>
          <td>${m.subject}</td>
          <td><span class="badge badge-cyan">${m.type||'File'}</span></td>
          <td>${m.date||m.uploadedOn||''}</td>
          <td>${(m.fileData||m.url)?`<a href="${m.fileData||m.url}" download="${m.title}" class="btn btn-sm btn-secondary">⬇ Download</a>`:'—'}</td>
        </tr>`).join('')}
      </tbody></table>`:'<p class="text-muted">No study materials uploaded yet.</p>'}
    </div>`;

  // Auto-load subjects if class is detected
  if (defaultClassNum) { stdLoadLibSubjects(); }
}

function stdLoadLibSubjects() {
  const classNum = document.getElementById('std-lib-class') ? document.getElementById('std-lib-class').value : '';
  const subSel = document.getElementById('std-lib-subject');
  document.getElementById('std-lib-content').innerHTML='<div style="text-align:center;padding:24px;color:rgba(255,255,255,.35);">Select a subject to browse chapters</div>';
  if (!classNum || typeof getCurriculumSubjects!=='function') { if(subSel) subSel.innerHTML='<option value="">Select Subject</option>'; return; }
  const subjects = getCurriculumSubjects(classNum);
  if(subSel) subSel.innerHTML = '<option value="">Select Subject</option>' + subjects.map(s=>`<option value="${s}">${s}</option>`).join('');
}

function stdLoadLibChapters() {
  const classNum = document.getElementById('std-lib-class') ? document.getElementById('std-lib-class').value : '';
  const subject = document.getElementById('std-lib-subject') ? document.getElementById('std-lib-subject').value : '';
  const el = document.getElementById('std-lib-content');
  if (!classNum || !subject || !el) return;
  if (typeof getCurriculumChapters!=='function') { el.innerHTML='<p style="color:rgba(255,255,255,.4)">Curriculum data not loaded.</p>'; return; }
  const chapters = getCurriculumChapters(classNum, subject);
  if (!chapters.length) { el.innerHTML='<p style="color:rgba(255,255,255,.4)">No chapters found.</p>'; return; }
  el.innerHTML = chapters.map((ch, ci) => `
    <div style="margin-bottom:12px;border:1px solid rgba(255,255,255,.08);border-radius:10px;overflow:hidden;">
      <div onclick="stdToggleChapter('std-ch-${ci}')" style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:rgba(124,58,237,.1);cursor:pointer;">
        <div>
          <span style="font-weight:700;">📖 ${ch.chapter}</span>
          <div style="font-size:.74rem;color:rgba(255,255,255,.4);margin-top:2px;">${ch.topics.slice(0,3).join(' · ')}</div>
        </div>
        <span id="std-ch-arrow-${ci}">▼</span>
      </div>
      <div id="std-ch-${ci}" style="display:none;padding:14px 16px;">
        ${ch.qa.map((item,qi)=>`
          <div style="margin-bottom:10px;background:rgba(255,255,255,.03);border-radius:8px;padding:10px 12px;border-left:3px solid #7c3aed;">
            <div style="font-weight:600;font-size:.88rem;color:#e2e8f0;margin-bottom:4px;">Q${qi+1}. ${item.q}</div>
            <div style="font-size:.83rem;color:#a78bfa;">✅ ${item.a}</div>
          </div>`).join('')}
      </div>
    </div>`).join('');
}

function stdToggleChapter(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const arrow = document.getElementById(id.replace('std-ch-','std-ch-arrow-'));
  const isOpen = el.style.display !== 'none';
  el.style.display = isOpen ? 'none' : 'block';
  if (arrow) arrow.textContent = isOpen ? '▼' : '▲';
}

// ═════════════════════════════════════════════════════════════════════════════
// QUESTION PAPERS
// ═════════════════════════════════════════════════════════════════════════════
function renderQPapers(){
  const cls=getMyClass();
  // Old collection 'qpapers' + new collection 'question_papers'
  const oldQPs = cls ? DB.get('qpapers').filter(q=>q.classId===cls.id) : [];
  const newQPs = cls ? DB.get('question_papers').filter(q=>q.classId===cls.id) : [];
  const allQPs = [...oldQPs, ...newQPs].sort((a,b)=>(b.date||b.uploadedOn||'').localeCompare(a.date||a.uploadedOn||''));

  $('section-qpapers').innerHTML=`
    <div class="section-header"><h2 class="section-title">📄 Question Papers</h2></div>
    <div class="glass-card">
      ${allQPs.length?`
        <div style="display:flex;flex-direction:column;gap:10px">
          ${allQPs.map(q=>{
            const isGen = !!q.isGenerated;
            const fileLink = q.fileData||q.url||'';
            return `<div style="display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:12px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.03)">
              <div style="font-size:1.6rem;flex-shrink:0">${isGen?'⚡':'📄'}</div>
              <div style="flex:1;min-width:0">
                <div style="font-weight:600;font-size:14px">${q.title}</div>
                <div style="font-size:12px;color:var(--text-muted);margin-top:2px">${q.subject||'—'} &nbsp;·&nbsp; ${q.date||q.uploadedOn||'—'}</div>
              </div>
              <div style="flex-shrink:0">
                ${isGen
                  ? `<button class="btn btn-sm" style="background:linear-gradient(135deg,#7c3aed,#06b6d4);color:#fff" onclick="stdViewGeneratedQP('${q.id}')">👁️ View</button>`
                  : fileLink
                    ? `<a href="${fileLink}" download="${q.title}" class="btn btn-sm btn-secondary">⬇ Download</a>`
                    : '<span style="color:var(--text-muted);font-size:12px">—</span>'}
              </div>
            </div>`;
          }).join('')}
        </div>
      `:'<p class="text-muted" style="text-align:center;padding:40px">No question papers available.</p>'}
    </div>`;
}

function stdViewGeneratedQP(id) {
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
// LEADERBOARD
// ═════════════════════════════════════════════════════════════════════════════
function renderLeaderboard(){
  const cls=getMyClass();
  if(!cls){$('section-leaderboard').innerHTML='<div class="glass-card"><p class="text-muted">No class assigned.</p></div>';return;}
  const exams=DB.get('exams').filter(e=>e.classId===cls.id);
  const students=DB.get('students').filter(s=>s.classId===cls.id);
  const marks=DB.get('marks');
  const scores=students.map(s=>{
    let tot=0,mx=0;
    exams.forEach(e=>{
      const m=marks.find(mk=>mk.examId===e.id&&mk.studentId===s.id);
      if(m){tot+=parseFloat(m.obtained);mx+=e.maxMarks;}
    });
    return {...s,total:tot,max:mx,pct:mx>0?Math.round(tot/mx*100):0};
  }).sort((a,b)=>b.pct-a.pct);
  const myRank=scores.findIndex(s=>s.id===CU.id)+1;
  const top3=scores.slice(0,3);

  $('section-leaderboard').innerHTML=`
    <div class="section-header">
      <h2 class="section-title">Leaderboard</h2>
      <span class="badge badge-purple">${cls.name}</span>
    </div>

    ${myRank>0?`<div class="glass-card" style="background:rgba(124,58,237,0.1);border:1px solid var(--purple);margin-bottom:16px;text-align:center;padding:20px">
      <div style="font-size:32px;margin-bottom:8px">${myRank===1?'🥇':myRank===2?'🥈':myRank===3?'🥉':'🎯'}</div>
      <p style="font-size:20px;font-weight:700;color:var(--purple)">Your Rank: #${myRank} of ${scores.length}</p>
      <p style="color:var(--text-muted);font-size:14px">Score: ${scores[myRank-1].total}/${scores[myRank-1].max} — ${scores[myRank-1].pct}% — ${getGrade(scores[myRank-1].pct).grade}</p>
    </div>`:''}

    ${top3.length>=3?`<div class="podium-row">
      ${[top3[1],top3[0],top3[2]].map((s,i)=>{
        const pos=[2,1,3][i],ht={1:'120px',2:'90px',3:'75px'}[pos],isMe=s.id===CU.id;
        return `<div class="podium-item">
          <div class="podium-avatar" style="${isMe?'border:2px solid var(--yellow)':''}">${(s.name||'?')[0].toUpperCase()}</div>
          <div style="font-weight:700;color:${isMe?'var(--yellow)':'var(--text-primary)'}">${s.name}${isMe?' 👈':''}</div>
          <div style="color:var(--text-muted);font-size:13px">${s.pct}%</div>
          <div class="podium-block pos-${pos}" style="height:${ht}">#${pos}</div>
        </div>`;
      }).join('')}
    </div>`:''}

    ${scores.length?`
    <div class="glass-card mt-8">
      <h3 class="card-title">📊 Class Performance Overview</h3>
      <div style="position:relative;height:250px"><canvas id="sChLeader"></canvas></div>
    </div>`:''}

    <div class="glass-card mt-8">
      <table class="data-table"><thead><tr><th>Rank</th><th>Student</th><th>Score</th><th>%</th><th>Grade</th></tr></thead><tbody>
        ${scores.length?scores.map((s,i)=>{
          const g=getGrade(s.pct),isMe=s.id===CU.id;
          return `<tr style="${isMe?'background:rgba(124,58,237,0.12)':''}">
            <td>${isMe?'👉 ':''}<strong>#${i+1}</strong></td>
            <td style="font-weight:${isMe?700:400}">${s.name}${isMe?' (You)':''}</td>
            <td>${s.total}/${s.max}</td>
            <td>${s.pct}%</td>
            <td><span class="badge" style="background:${g.color}20;color:${g.color}">${g.grade}</span></td>
          </tr>`;
        }).join(''):'<tr><td colspan="5" style="text-align:center;color:var(--text-muted)">No data yet</td></tr>'}
      </tbody></table>
    </div>`;

  if(scores.length) mkChart('sChLeader',{type:'bar',data:{
    labels:scores.map((s,i)=>`#${i+1} ${s.name.split(' ')[0]}`),
    datasets:[{
      label:'Score %',
      data:scores.map(s=>s.pct),
      backgroundColor:scores.map(s=>s.id===CU.id?'rgba(245,158,11,0.9)':CH.pal[0]+'88'),
      borderWidth:scores.map(s=>s.id===CU.id?2:0),
      borderColor:'#f59e0b',
      borderRadius:6,borderSkipped:false
    }]
  },options:{responsive:true,maintainAspectRatio:false,
    plugins:{legend:{display:false},
      tooltip:{callbacks:{label:c=>`${c.raw}% — ${getGrade(c.raw).grade}${scores[c.dataIndex].id===CU.id?' (You)':''}`}}},
    scales:{x:{ticks:{color:CH.tick,maxRotation:45},grid:{display:false}},y:{min:0,max:100,ticks:{color:CH.tick,callback:v=>v+'%'},grid:{color:CH.grid}}}}});
}

// ═════════════════════════════════════════════════════════════════════════════
// FEES
// ═════════════════════════════════════════════════════════════════════════════
function renderFees(){
  const fees=DB.get('fees').filter(f=>f.studentId===CU.id).sort((a,b)=>b.dueDate.localeCompare(a.dueDate));
  const due=fees.filter(f=>f.status!=='paid').reduce((s,f)=>s+parseFloat(f.amount||0),0);
  const paid=fees.filter(f=>f.status==='paid').reduce((s,f)=>s+parseFloat(f.amount||0),0);
  const total=due+paid;
  const myReminders=_getMyFeeReminders();
  const school=getSettings(); const cur=school.currency||'₹';

  $('section-fees').innerHTML=`
    <div class="section-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
      <h2 class="section-title">My Fees</h2>
      <button class="btn btn-primary" onclick="openFeeStatement(CU.id)">📄 Fee Statement</button>
    </div>
    ${_feeReminderBannerHtml(myReminders, cur)}
    <div class="stats-grid" style="grid-template-columns:repeat(3,1fr)">
      <div class="stat-card"><div class="stat-icon" style="background:linear-gradient(135deg,#ef4444,#f97316)">💳</div><div class="stat-info"><div class="stat-value">₹${due.toLocaleString()}</div><div class="stat-label">Due Amount</div></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:linear-gradient(135deg,#10b981,#06b6d4)">✅</div><div class="stat-info"><div class="stat-value">₹${paid.toLocaleString()}</div><div class="stat-label">Total Paid</div></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:linear-gradient(135deg,#f59e0b,#f97316)">📋</div><div class="stat-info"><div class="stat-value">${fees.length}</div><div class="stat-label">Total Invoices</div></div></div>
    </div>

    ${total>0?`
    <div class="glass-card mt-8">
      <h3 class="card-title">📊 Fee Payment Status</h3>
      <div style="display:flex;gap:24px;align-items:center">
        <div style="position:relative;height:160px;width:160px;flex-shrink:0"><canvas id="sChFees"></canvas></div>
        <div>
          <div style="font-size:13px;margin-bottom:8px"><span style="color:#10b981">●</span> Paid: <strong>₹${paid.toLocaleString()}</strong> (${total?Math.round(paid/total*100):0}%)</div>
          <div style="font-size:13px"><span style="color:#ef4444">●</span> Due: <strong>₹${due.toLocaleString()}</strong> (${total?Math.round(due/total*100):0}%)</div>
          <div style="margin-top:16px">
            <div style="background:var(--glass);border-radius:8px;height:10px;overflow:hidden">
              <div style="width:${total?Math.round(paid/total*100):0}%;height:100%;background:linear-gradient(90deg,#10b981,#06b6d4);border-radius:8px"></div>
            </div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:4px">${total?Math.round(paid/total*100):0}% paid</div>
          </div>
        </div>
      </div>
    </div>`:''}

    <div class="glass-card mt-8">
      <h3 class="card-title">Fee Records</h3>
      ${fees.length?`<table class="data-table"><thead><tr><th>Fee Type</th><th>Amount</th><th>Due Date</th><th>Status</th><th>Action</th></tr></thead><tbody>
        ${fees.map(f=>`<tr>
          <td><strong>${f.feeType||'School Fee'}</strong>${f.description?`<div style="font-size:12px;color:var(--text-muted)">${f.description}</div>`:''}</td>
          <td>₹${parseFloat(f.amount||0).toLocaleString()}</td>
          <td>${f.dueDate}</td>
          <td><span class="badge ${f.status==='paid'?'badge-green':f.status==='overdue'?'badge-red':'badge-yellow'}">${f.status}</span></td>
          <td>${(()=>{
            // ── PAID ──
            if (f.status==='paid')
              return `<div style="display:flex;align-items:center;gap:6px;">
                <span style="background:rgba(16,185,129,.12);color:#10b981;border:1px solid rgba(16,185,129,.3);border-radius:8px;padding:6px 12px;font-size:12px;font-weight:800;display:inline-block;">✅ Paid</span>
                ${f.paidDate?`<span style="font-size:11px;color:var(--text-3);">${formatDate(f.paidDate)}</span>`:''}
              </div>`;

            const pc = getSettings().paymentConfig || {};
            const proofs = DB.get('fee_payment_proofs');
            const pendingProof  = proofs.find(p=>p.feeId===f.id&&p.studentId===CU.id&&p.status==='pending');
            const approvedProof = proofs.find(p=>p.feeId===f.id&&p.studentId===CU.id&&p.status==='approved');
            const rejectedProof = proofs.find(p=>p.feeId===f.id&&p.studentId===CU.id&&p.status==='rejected');

            // ── PAYMENT PENDING ADMIN APPROVAL ──
            if (pendingProof)
              return `<div>
                <div style="background:rgba(245,158,11,.10);border:1.5px solid rgba(245,158,11,.35);border-radius:10px;padding:8px 12px;">
                  <div style="font-size:12px;font-weight:800;color:#f59e0b;">⏳ Payment Under Review</div>
                  <div style="font-size:11px;color:rgba(255,255,255,.45);margin-top:3px;line-height:1.4;">School is verifying your payment.<br>Contact school if not confirmed in 24 hrs.</div>
                </div>
              </div>`;

            // ── APPROVED (proof approved but fee not yet marked paid) ──
            if (approvedProof)
              return `<span style="background:rgba(16,185,129,.12);color:#10b981;border:1px solid rgba(16,185,129,.3);border-radius:8px;padding:6px 12px;font-size:12px;font-weight:800;">✅ Confirmed by school</span>`;

            // ── REJECTED — allow retry ──
            if (rejectedProof)
              return `<div>
                <div style="font-size:11px;color:#ef4444;font-weight:700;margin-bottom:6px;">❌ Payment not verified</div>
                <button onclick="_payFeeOnline('${f.id}')" style="background:linear-gradient(135deg,#7c3aed,#06b6d4);color:#fff;border:none;border-radius:9px;padding:7px 14px;cursor:pointer;font-weight:700;font-size:12px;">💳 Try Again</button>
              </div>`;

            // ── CAN PAY ONLINE ──
            if (pc.enabled && (pc.upiId || pc.accNo))
              return `<button onclick="_payFeeOnline('${f.id}')"
                style="background:linear-gradient(135deg,#7c3aed,#06b6d4);color:#fff;border:none;border-radius:9px;padding:8px 16px;cursor:pointer;font-weight:800;font-size:13px;white-space:nowrap;box-shadow:0 3px 12px rgba(124,58,237,.4);">
                💳 Pay Now</button>`;

            // ── OFFLINE PAYMENT ──
            return `<span style="font-size:11px;color:#64748b;background:rgba(100,116,139,.1);border:1px solid rgba(100,116,139,.2);border-radius:8px;padding:5px 10px;display:inline-block">🏫 Pay at school</span>`;
          })()}</td>
        </tr>`).join('')}
      </tbody></table>`:'<p class="text-muted">No fee records.</p>'}
    </div>

    <!-- Payment Receipts from admin/teacher -->
    ${(()=>{
      const txns=DB.get('fee_transactions').filter(t=>t.studentId===CU.id).sort((a,b)=>b.date.localeCompare(a.date));
      if(!txns.length) return '';
      return `<div class="glass-card mt-8">
        <h3 class="card-title">🧾 Payment Receipts</h3>
        <p style="font-size:13px;color:var(--text-muted);margin-bottom:12px">All payment receipts issued by school. You can print and save these.</p>
        <div style="display:flex;flex-direction:column;gap:10px">
          ${txns.map(t=>{
            const lf=Number(t.lateFee||0);
            const total=Number(t.total||t.amount||0);
            return `<div style="background:var(--glass);border:1px solid var(--border);border-radius:12px;padding:14px 16px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">
              <div>
                <div style="font-weight:700;font-size:14px">Receipt: <span style="color:#7c3aed">${t.receiptNo}</span></div>
                <div style="font-size:12px;color:var(--text-muted);margin-top:2px">📅 ${formatDate(t.date)} &nbsp;·&nbsp; ${t.method} ${t.note?'&nbsp;·&nbsp;'+t.note:''}</div>
                ${lf>0?`<div style="font-size:11px;color:#f59e0b;margin-top:2px">⚠️ Includes Late Fee: ₹${lf.toLocaleString()}</div>`:''}
              </div>
              <div style="text-align:right">
                <div style="font-size:18px;font-weight:800;color:#059669">₹${total.toLocaleString()}</div>
                <div style="display:flex;gap:6px;margin-top:6px">
                  <button class="btn btn-sm" style="background:rgba(124,58,237,.15);color:#7c3aed;border:1px solid rgba(124,58,237,.3)" onclick="printStudentReceipt('${t.id}')">🖨️ Print</button>
                  <button class="btn btn-sm" style="background:rgba(16,185,129,.15);color:#059669;border:1px solid rgba(16,185,129,.3)" onclick="shareStudentReceipt('${t.id}')">📤 Share</button>
                </div>
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>`;
    })()}`;

  if(total>0) mkChart('sChFees',{type:'doughnut',data:{
    labels:['Paid','Due'],
    datasets:[{data:[paid,due],backgroundColor:['#10b981','#ef4444'],borderWidth:0,hoverOffset:6}]
  },options:{responsive:true,maintainAspectRatio:false,
    plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>`₹${c.raw.toLocaleString()}`}}}}});

  // ── Auto-refresh: poll every 15s so admin approval shows instantly ──
  // Clear any previous interval first (in case renderFees is called again)
  clearInterval(window._feeAutoRefresh);
  const _feeSchoolId = DB._schoolId();
  if (_feeSchoolId) {
    window._feeAutoRefresh = setInterval(async function() {
      // Stop polling if student navigated away from fees section
      const sec = document.getElementById('section-fees');
      if (!sec || sec.style.display === 'none' || !sec.classList.contains('active')) {
        clearInterval(window._feeAutoRefresh);
        window._feeAutoRefresh = null;
        return;
      }
      try {
        await syncFromServer(_feeSchoolId);
      } catch(e) { /* offline — keep showing cached data */ }
      // Only re-render if still on fees (sync can take a moment)
      const secNow = document.getElementById('section-fees');
      if (secNow && secNow.classList.contains('active')) {
        renderFees();
      }
    }, 15000);
  }
}
// payFee removed — only admin/teacher can record fee payments

function printStudentReceipt(txId){
  const t=DB.get('fee_transactions').find(x=>x.id===txId);
  if(!t) return;
  const me=getMe(); const school=getSettings();
  const cls=me?DB.find('classes',me.classId):null;
  const cur=school.currency||'₹';
  const lf=Number(t.lateFee||0); const base=Number(t.amount||0); const total=Number(t.total||base+lf);
  const html=`
  <div style="max-width:420px;margin:30px auto;font-family:'Segoe UI',sans-serif;border:2px solid #7c3aed;border-radius:16px;overflow:hidden">
    <div style="background:linear-gradient(135deg,#1e1b4b,#7c3aed);color:#fff;padding:20px 24px;text-align:center">
      ${school.schoolLogo?`<img src="${school.schoolLogo}" style="height:44px;border-radius:8px;background:#fff;padding:3px;margin-bottom:8px"><br>`:'<div style="font-size:2rem">🎓</div>'}
      <div style="font-size:18px;font-weight:800">${school.schoolName||'School'}</div>
      ${school.schoolAddress?`<div style="font-size:10px;opacity:.6;margin-top:4px">${school.schoolAddress}</div>`:''}
    </div>
    <div style="background:#f0fdf4;border-bottom:1px solid #d1fae5;padding:10px 24px;display:flex;justify-content:space-between">
      <span style="font-weight:800;color:#059669">💳 FEE RECEIPT</span>
      <span style="font-size:11px;color:#64748b">Receipt: <strong>${t.receiptNo}</strong></span>
    </div>
    <div style="padding:16px 24px;border-bottom:1px solid #e5e7eb">
      <table style="width:100%;font-size:13px;border-collapse:collapse">
        <tr><td style="color:#64748b;padding:3px 0;width:40%">Student</td><td style="font-weight:700">${me?me.name:'—'}</td></tr>
        <tr><td style="color:#64748b;padding:3px 0">Class</td><td>${cls?cls.name:'—'}</td></tr>
        <tr><td style="color:#64748b;padding:3px 0">Date</td><td>${formatDate(t.date)}</td></tr>
        <tr><td style="color:#64748b;padding:3px 0">Method</td><td>${t.method}</td></tr>
        ${t.note?`<tr><td style="color:#64748b;padding:3px 0">Note</td><td>${t.note}</td></tr>`:''}
      </table>
    </div>
    <div style="padding:16px 24px;border-bottom:1px solid #e5e7eb">
      <table style="width:100%;font-size:13px;border-collapse:collapse">
        <tr><td style="padding:4px 0">Fee Amount</td><td style="text-align:right;font-weight:600">${cur}${base.toLocaleString()}</td></tr>
        ${lf>0?`<tr><td style="padding:4px 0;color:#f59e0b;font-weight:700">⚠️ Late Fee</td><td style="text-align:right;color:#f59e0b;font-weight:700">${cur}${lf.toLocaleString()}</td></tr>`:''}
        <tr style="border-top:2px solid #e5e7eb">
          <td style="padding:8px 0 4px;font-weight:800;font-size:15px;color:#059669">TOTAL PAID</td>
          <td style="text-align:right;font-weight:800;font-size:18px;color:#059669">${cur}${total.toLocaleString()}</td>
        </tr>
      </table>
    </div>
    <div style="padding:12px 24px;text-align:center;font-size:11px;color:#94a3b8">
      Session: ${school.academicYear||'—'} · Printed: ${formatDate(today())}<br>
      <span style="font-weight:600;color:#7c3aed">Computer-generated receipt. No signature required.</span>
    </div>
  </div>`;
  printHtml(`<style>body{background:#f0f0f0;padding:20px}@media print{body{background:#fff;padding:0}}</style>${html}`, `Fee Receipt — ${t.receiptNo}`);
}

function shareStudentReceipt(txId){
  const t=DB.get('fee_transactions').find(x=>x.id===txId);
  if(!t) return;
  const me=getMe(); const school=getSettings();
  const lf=Number(t.lateFee||0); const total=Number(t.total||t.amount||0);
  const text=`🧾 Fee Receipt\n\nSchool: ${school.schoolName||''}\nStudent: ${me?me.name:''}\nReceipt No: ${t.receiptNo}\nDate: ${formatDate(t.date)}\nAmount Paid: ${school.currency||'₹'}${(Number(t.amount||0)).toLocaleString()}${lf>0?`\nLate Fee: ${school.currency||'₹'}${lf.toLocaleString()}`:''}${lf>0?`\nTotal: ${school.currency||'₹'}${total.toLocaleString()}`:''}\nMethod: ${t.method}\n\nSession: ${school.academicYear||''}`;
  if(navigator.share){
    navigator.share({title:`Fee Receipt — ${t.receiptNo}`,text}).catch(()=>{});
  } else {
    navigator.clipboard.writeText(text).then(()=>toast('Receipt text copied! Paste in WhatsApp.','success')).catch(()=>toast('Share not supported on this device','warning'));
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// LEAVE APPLICATION
// ═════════════════════════════════════════════════════════════════════════════
function renderLeave(){
  const myLeaves=DB.get('leaves').filter(l=>l.studentId===CU.id).sort((a,b)=>b.applyDate.localeCompare(a.applyDate));
  $('section-leave').innerHTML=`
    <div class="section-header">
      <h2 class="section-title">Leave Application</h2>
      <button class="btn btn-primary" onclick="openLeaveModal()">+ Apply for Leave</button>
    </div>
    <div class="glass-card">
      <h3 class="card-title">My Leave Applications</h3>
      ${myLeaves.length?`<table class="data-table"><thead><tr><th>From</th><th>To</th><th>Reason</th><th>Applied</th><th>Status</th></tr></thead><tbody>
        ${myLeaves.map(l=>`<tr>
          <td>${l.fromDate}</td><td>${l.toDate}</td><td>${l.reason}</td><td>${l.applyDate}</td>
          <td><span class="badge ${l.status==='approved'?'badge-green':l.status==='rejected'?'badge-red':'badge-yellow'}">${l.status}</span></td>
        </tr>`).join('')}
      </tbody></table>`:'<p class="text-muted">No leave applications yet.</p>'}
    </div>`;
}
function openLeaveModal(){
  buildModal('leaveModal','Apply for Leave',`
    <div class="form-grid">
      <div class="form-group"><label class="form-label">From Date</label><input type="date" class="form-control" id="slvFrom" value="${today()}"></div>
      <div class="form-group"><label class="form-label">To Date</label><input type="date" class="form-control" id="slvTo" value="${today()}"></div>
      <div class="form-group" style="grid-column:1/-1"><label class="form-label">Reason</label><textarea class="form-control" id="slvReason" rows="3" placeholder="Medical / Family emergency / Other..."></textarea></div>
    </div>`,saveLeave);
}
function saveLeave(){
  if(!val('slvReason')) return toast('Enter reason','warning');
  const me=getMe();
  DB.push('leaves',{id:genId('lv'),type:'student',studentId:CU.id,classId:me.classId||'',fromDate:val('slvFrom'),toDate:val('slvTo'),reason:val('slvReason'),status:'pending',applyDate:today()});
  closeModal('leaveModal'); toast('Leave application submitted!','success'); renderLeave();
}

// ═════════════════════════════════════════════════════════════════════════════
// NOTICES
// ═════════════════════════════════════════════════════════════════════════════
function renderNotices(){
  const notices=DB.get('notices').filter(n=>n.audience==='all'||n.audience==='student')
    .sort((a,b)=>b.date.localeCompare(a.date));
  $('section-notices').innerHTML=`
    <div class="section-header"><h2 class="section-title">Notices & Announcements</h2></div>
    <div class="glass-card">
      ${notices.map(n=>`
        <div style="margin-bottom:12px;padding:16px;background:var(--glass);border-radius:12px;border:1px solid var(--border)">
          <h4 style="color:var(--text-primary)">${n.title}</h4>
          <p style="color:var(--text-secondary);font-size:14px;margin-top:6px;line-height:1.5">${n.body||''}</p>
          <div style="margin-top:8px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            <span class="badge badge-purple">${n.audience}</span>
            <span style="color:var(--text-muted);font-size:12px">By ${n.authorName||'Admin'} · ${n.date}</span>
          </div>
        </div>`).join('')||'<p class="text-muted">No notices at the moment.</p>'}
    </div>`;
}

// ═════════════════════════════════════════════════════════════════════════════
// CCTV — Student Panel (Parents view class camera)
// ═════════════════════════════════════════════════════════════════════════════
function renderCCTVStudent() {
  const me       = getMe();
  const myClass  = getMyClass();
  const allCams  = DB.get('cameras') || [];
  // Only show cameras assigned to student's class AND with parent access enabled
  const myCams   = allCams.filter(c => c.parentAccess && c.classId === me.classId);
  const genCams  = allCams.filter(c => c.parentAccess && !c.classId); // general cameras

  $('section-cctv').innerHTML = `
    <div class="section-header">
      <h2 class="section-title">📹 Live Camera</h2>
    </div>
    <div class="glass-card mb-16" style="border-left:3px solid #06b6d4;padding:14px 18px;">
      <div style="font-size:.83rem;color:rgba(255,255,255,.5);">
        Showing cameras for <strong style="color:#67e8f9">${myClass?myClass.name:'your class'}</strong>.
        Only cameras enabled by admin are visible here.
      </div>
    </div>

    ${myCams.length || genCams.length ? `
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:20px;">
      ${[...myCams, ...genCams].map(cam => `
      <div class="glass-card" style="padding:0;overflow:hidden;border-radius:14px;">
        <div style="background:#000;aspect-ratio:16/9;position:relative;overflow:hidden;">
          ${studentCamFeedHtml(cam)}
          <div style="position:absolute;top:8px;left:8px;">
            <span style="background:${cam.status==='active'?'rgba(16,185,129,.9)':'rgba(239,68,68,.8)'};color:#fff;font-size:.65rem;padding:2px 8px;border-radius:20px;font-weight:700;">
              ${cam.status==='active'?'🔴 LIVE':'⚫ OFFLINE'}
            </span>
          </div>
        </div>
        <div style="padding:14px 16px;">
          <div style="font-weight:700;margin-bottom:4px">${cam.name}</div>
          <div style="font-size:.75rem;color:rgba(255,255,255,.4)">${cam.location||''}</div>
        </div>
      </div>`).join('')}
    </div>` : `
    <div class="glass-card" style="text-align:center;padding:60px 24px;">
      <div style="font-size:3.5rem;margin-bottom:16px">📹</div>
      <h3>No cameras available</h3>
      <p style="color:rgba(255,255,255,.4);margin-top:10px;font-size:.9rem">
        Admin has not enabled any cameras for your class yet.<br>
        Please contact the school administration.
      </p>
    </div>`}`;
}

function studentCamFeedHtml(cam) {
  if (!cam.url || cam.status !== 'active') {
    return `<div style="width:100%;height:100%;min-height:140px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:rgba(255,255,255,.3);">
      <div style="font-size:2.5rem">📷</div>
      <div style="font-size:.75rem;margin-top:6px">Camera Offline</div>
    </div>`;
  }
  const url = cam.url;
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    const ytId = url.match(/(?:v=|youtu\.be\/|embed\/)([^&?/]+)/)?.[1] || '';
    return `<iframe src="https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1" style="width:100%;min-height:140px;border:none" allow="autoplay" allowfullscreen></iframe>`;
  }
  if (cam.type === 'mjpeg' || url.match(/\.(jpg|jpeg|mjpg|mjpeg)/i) || url.includes('/video')) {
    return `<img src="${url}" style="width:100%;min-height:140px;object-fit:cover;">`;
  }
  return `<iframe src="${url}" style="width:100%;min-height:140px;border:none" sandbox="allow-same-origin allow-scripts"></iframe>`;
}

// ═════════════════════════════════════════════════════════════════════════════
// MESSAGES — Student Panel (Parents send to teacher / principal)
// ═════════════════════════════════════════════════════════════════════════════
// MESSAGES — Student / Parent WhatsApp-style Chat
// ═════════════════════════════════════════════════════════════════════════════
let _stuChat = { tid:'' };

function renderStudentMessages() {
  const unread = _chatUnread(CU.id);
  const badge  = document.getElementById('std-msg-badge');
  if (badge) { badge.style.display = unread?'inline':'none'; badge.textContent = unread; }

  const myT = _chatMyThreads(CU.id);
  const mob = window.innerWidth<=768;

  $('section-messages').innerHTML = `
  <div class="section-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:16px">
    <h2 class="section-title">💬 Messages</h2>
    <button class="btn btn-primary" onclick="_stuNewChat()">✏️ New Chat</button>
  </div>

  <div class="chat-wrap" style="height:calc(100vh - var(--header) - 130px);min-height:440px">

    <!-- Sidebar -->
    <div class="chat-sidebar ${mob&&_stuChat.tid?'chat-panel-hide':''}">
      <div style="padding:12px 14px;border-bottom:1px solid var(--border);flex-shrink:0">
        <button class="btn btn-primary w-full" onclick="_stuNewChat()" style="font-size:13px">✏️ New Conversation</button>
      </div>
      <div style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch">
        ${myT.length===0
          ? `<div style="padding:32px 20px;text-align:center;color:var(--text-3)"><div style="font-size:2.5rem;margin-bottom:8px">💬</div><div style="font-size:13px">No conversations yet.<br>Message your teacher or principal!</div></div>`
          : myT.map(t=>_chatThreadItem(t,CU.id,_stuChat.tid,'_stuOpenThread')).join('')}
      </div>
    </div>

    <!-- Chat window -->
    <div class="chat-main ${mob&&!_stuChat.tid?'chat-panel-hide':''}">
      ${_stuChat.tid ? _stuChatWin() : `
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;color:var(--text-3);gap:10px;text-align:center;padding:40px">
        <div style="font-size:4rem">💬</div>
        <div style="font-size:16px;font-weight:700;color:var(--text)">Start a conversation</div>
        <div style="font-size:13px">Message your teacher or principal anytime</div>
        <button class="btn btn-primary mt-8" onclick="_stuNewChat()">✏️ Send First Message</button>
      </div>`}
    </div>

  </div>`;

  const msgsEl = document.getElementById('_vc_msgs');
  if (msgsEl) msgsEl.scrollTop = msgsEl.scrollHeight;
}

function _stuChatWin() {
  const thread = _chatGetById(_stuChat.tid);
  if (!thread) return '';
  _chatMarkRead(_stuChat.tid, CU.id);
  const other = thread.p.find(p=>p.id!==CU.id)||thread.p[0];
  const COLS  = {'admin':'#7c3aed','teacher':'#06b6d4','parent':'#10b981'};
  const col   = COLS[other.role]||'#94a3b8';
  const rLbl  = {'admin':'👑 Principal / Admin','teacher':'👩‍🏫 Teacher','parent':'Parent'}[other.role]||other.role;
  const me    = getMe();
  const myId  = CU.id;
  const myNm  = ('Parent of '+(me.name||CU.name||'')).replace(/'/g,"\\'");
  return `
  <div style="padding:12px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px;flex-shrink:0;background:rgba(255,255,255,.02)">
    <button class="btn btn-sm btn-secondary chat-mob-back" onclick="_stuChat.tid='';renderStudentMessages()" style="padding:5px 10px">← Back</button>
    <div style="width:40px;height:40px;border-radius:50%;background:${col};display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;flex-shrink:0;font-size:1.05rem">${(other.name||'?')[0].toUpperCase()}</div>
    <div style="flex:1;min-width:0">
      <div style="font-weight:700;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${other.name}</div>
      <div style="font-size:11px;color:var(--text-3)">${rLbl}</div>
    </div>
  </div>
  <div id="_vc_msgs" class="chat-msgs">${_chatMsgsHtml(thread,myId)}</div>
  <div class="chat-inp-bar">
    <textarea id="_vc_input" class="chat-textarea" placeholder="Type a message… (Enter to send)"
      onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();window._vmChatSend('${_stuChat.tid}','${myId}','${myNm}','parent','_vc_input')}"
      oninput="window._vmChatResize(this)"></textarea>
    <button class="chat-send" onclick="window._vmChatSend('${_stuChat.tid}','${myId}','${myNm}','parent','_vc_input')">➤</button>
  </div>`;
}

function _stuOpenThread(tid) {
  _stuChat.tid = tid;
  _chatMarkRead(tid, CU.id);
  if (window.innerWidth<=768) { renderStudentMessages(); return; }
  const mainEl = document.getElementById('_vc_main')||document.querySelector('.chat-main');
  if (mainEl) { mainEl.outerHTML = '<div id="_vc_main" class="chat-main">'+_stuChatWin()+'</div>'; }
  const msgsEl = document.getElementById('_vc_msgs');
  if (msgsEl) msgsEl.scrollTop = msgsEl.scrollHeight;
  const n = _chatUnread(CU.id);
  const b = document.getElementById('std-msg-badge');
  if (b) { b.style.display=n?'inline':'none'; b.textContent=n; }
  document.querySelectorAll('[id^="_vc_item_"]').forEach(function(el){
    el.style.background = el.id==='_vc_item_'+tid ? 'rgba(124,58,237,.18)' : 'transparent';
  });
}

function _stuNewChat() {
  const me        = getMe();
  const teachers  = DB.get('teachers');
  // Class teacher(s) of this student
  const cls = DB.find('classes', me.classId);
  const myTeachers = teachers.filter(t => {
    // Match by teacherId on class OR by classIds on teacher
    return cls && (cls.teacherId===t.id || (t.classIds||[]).includes(me.classId));
  });
  const allTeachers = myTeachers.length ? myTeachers : teachers;

  // Find admin user
  const adminUser = (DB.get('users')||[]).find(u=>u.role==='admin');
  const adminId   = adminUser ? adminUser.id : 'admin';
  const adminName = adminUser ? (adminUser.name||'Principal') : 'Principal';

  const contacts = [
    {id:adminId, name:adminName+' (Admin)', role:'admin', sub:'School Administration', col:'#7c3aed'},
    ...allTeachers.map(t=>({id:t.id, name:t.name, role:'teacher', sub:(t.subject||'Teacher')+(cls?' · '+(cls.name||''):''), col:'#06b6d4'}))
  ];

  const myNm = 'Parent of '+(me.name||CU.name||'');
  const html = `<div style="display:flex;flex-direction:column;gap:6px">
    ${contacts.map(c=>`
    <div onclick="_stuStartChat('${c.id}','${c.name.replace(/'/g,'&#39;')}','${c.role}','${myNm.replace(/'/g,'&#39;')}');closeAllModals()"
         style="display:flex;align-items:center;gap:12px;padding:13px 14px;border-radius:10px;border:1px solid var(--border);cursor:pointer;transition:background .14s"
         onmouseover="this.style.background='rgba(124,58,237,.1)'" onmouseout="this.style.background=''">
      <div style="width:42px;height:42px;border-radius:50%;background:${c.col};display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;font-size:1.1rem">${c.name[0].toUpperCase()}</div>
      <div><div style="font-weight:700;font-size:14px">${c.name}</div><div style="font-size:11px;color:var(--text-3)">${c.sub}</div></div>
    </div>`).join('')}
  </div>`;
  buildModal('_stu_new_chat','💬 Send a Message',html,null);
}

function _stuStartChat(cId,cName,cRole,myName){
  const me = {id:CU.id, name:myName, role:'parent'};
  const t  = _chatCreate(me, {id:cId,name:cName,role:cRole});
  _stuOpenThread(t.id);
  renderStudentMessages();
}

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
    document.title = 'Student Panel — ' + name;
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
//  SCHOOL GALLERY  — Student / Parent View
// ══════════════════════════════════════════════════════
function _sGalTabBar(active){
  const t=(id,ic,l)=>`<button class="att-tab ${active===id?'active':''}" onclick="window._sGalView='${id==='videos'?'videos':''}';renderStudentGallery()">${ic} ${l}</button>`;
  return `<div class="att-tab-bar" style="margin-bottom:16px;">${t('photos','📁','Photos')}${t('videos','🎬','Videos')}</div>`;
}
function renderStudentGallery(){
  if(window._sGalView==='videos'){
    document.getElementById('section-gallery').innerHTML=`
      <div class="page-header"><div><h2>🖼️ School Gallery</h2><p class="page-sub">Videos from school activities &amp; events</p></div></div>
      ${_sGalTabBar('videos')}
      ${GV.listHtml(false)}`;
    return;
  }
  const me       = getMe();
  const allGallery = DB.get('gallery').sort((a,b)=>b.createdAt-a.createdAt);

  // Filter: show photo if visibility = all, OR matches student's class, OR matches student personally
  const gallery = allGallery.filter(p=>{
    if(p.visibility==='all') return true;
    if(p.visibility==='class'   && p.classId   === me.classId) return true;
    if(p.visibility==='student' && p.studentId === me.id)      return true;
    return false;
  });

  const photoCards = gallery.map(p=>{
    let visTag = '';
    if(p.visibility==='class')   visTag = '<span style="background:rgba(59,130,246,.12);color:#2563eb;font-size:9px;font-weight:700;padding:2px 7px;border-radius:20px;">🏫 Your Class</span>';
    if(p.visibility==='student') visTag = '<span style="background:rgba(168,85,247,.12);color:#7c3aed;font-size:9px;font-weight:700;padding:2px 7px;border-radius:20px;">⭐ For You</span>';
    return `<div style="background:rgba(255,255,255,0.08);border-radius:14px;overflow:hidden;border:1px solid rgba(255,255,255,0.1);backdrop-filter:blur(8px);">
      <div style="position:relative;">
        <img src="${p.photo}" style="width:100%;height:180px;object-fit:cover;display:block;cursor:pointer;"
             onclick="sGalOpenLightbox('${p.id}')" loading="lazy" title="Click to view full size">
        ${visTag?`<div style="position:absolute;top:8px;left:8px;">${visTag}</div>`:''}
        <div style="position:absolute;top:8px;right:8px;display:flex;gap:6px;">
          <button onclick="sGalDownload('${p.id}')" title="Download photo"
            style="background:rgba(0,0,0,.55);color:#fff;border:none;border-radius:8px;padding:5px 9px;cursor:pointer;font-size:12px;font-weight:600;backdrop-filter:blur(4px);">⬇️</button>
          <button onclick="sGalShare('${p.id}')" title="Share photo"
            style="background:rgba(0,0,0,.55);color:#fff;border:none;border-radius:8px;padding:5px 9px;cursor:pointer;font-size:12px;font-weight:600;backdrop-filter:blur(4px);">🔗</button>
        </div>
      </div>
      <div style="padding:12px 14px;">
        <div style="font-weight:700;color:var(--text);font-size:13.5px;">${p.title}</div>
        ${p.description?`<div style="color:var(--text-muted);font-size:11.5px;margin-top:3px;line-height:1.4;">${p.description}</div>`:''}
        <div style="font-size:10.5px;color:var(--text-muted);margin-top:8px;display:flex;justify-content:space-between;align-items:center;">
          <span>📅 ${formatDate(p.date)}</span>
          <span>📸 ${p.uploaderName}</span>
        </div>
      </div>
    </div>`;
  }).join('');

  document.getElementById('section-gallery').innerHTML=`
  <div class="page-header">
    <div><h2>🖼️ School Gallery</h2><p class="page-sub">Photos from school activities &amp; events</p></div>
  </div>

  ${_sGalTabBar('photos')}

  ${gallery.length===0
    ?`<div class="glass-card" style="text-align:center;padding:60px 20px;">
        <div style="font-size:56px;margin-bottom:16px;">🖼️</div>
        <h3 style="color:var(--text);">No Photos Yet</h3>
        <p style="color:var(--text-muted);margin-top:8px;">School hasn't uploaded any photos yet. Check back soon!</p>
      </div>`
    :`<div style="margin-bottom:16px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
        <div class="glass-card" style="padding:10px 18px;display:inline-flex;align-items:center;gap:8px;">
          <span style="font-size:22px;font-weight:800;color:var(--purple);">${gallery.length}</span>
          <span style="color:var(--text-muted);font-size:13px;">Photos for you</span>
        </div>
        <div style="color:var(--text-muted);font-size:12px;">👆 Click any photo to view · ⬇️ Download · 🔗 Share</div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px;">${photoCards}</div>`}

  <!-- Lightbox -->
  <div id="sGalLightbox" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.92);z-index:9999;flex-direction:column;align-items:center;justify-content:center;"
       onclick="if(event.target===this)sGalCloseLightbox()">
    <button onclick="sGalCloseLightbox()" style="position:absolute;top:16px;right:20px;background:rgba(255,255,255,.15);color:#fff;border:none;border-radius:8px;padding:6px 14px;cursor:pointer;font-size:18px;">✕</button>
    <img id="sGalLbImg" src="" style="max-width:92vw;max-height:82vh;border-radius:10px;object-fit:contain;">
    <div id="sGalLbTitle" style="color:#fff;margin-top:14px;font-size:15px;font-weight:600;text-align:center;"></div>
    <div style="display:flex;gap:12px;margin-top:14px;">
      <button id="sGalLbDl" style="background:#7c3aed;color:#fff;border:none;border-radius:8px;padding:9px 22px;cursor:pointer;font-size:13px;font-weight:600;">⬇️ Download</button>
      <button id="sGalLbSh" style="background:#0ea5e9;color:#fff;border:none;border-radius:8px;padding:9px 22px;cursor:pointer;font-size:13px;font-weight:600;">🔗 Share</button>
    </div>
  </div>`;
}

// Store gallery ref for lightbox access
function _getGalById(id){ return DB.get('gallery').find(p=>p.id===id)||null; }

function sGalOpenLightbox(id){
  const p=_getGalById(id); if(!p) return;
  const lb=document.getElementById('sGalLightbox'); if(!lb) return;
  document.getElementById('sGalLbImg').src=p.photo;
  document.getElementById('sGalLbTitle').textContent=p.title+(p.description?' — '+p.description:'');
  document.getElementById('sGalLbDl').onclick=()=>sGalDownload(id);
  document.getElementById('sGalLbSh').onclick=()=>sGalShare(id);
  lb.style.display='flex';
}

function sGalCloseLightbox(){
  const lb=document.getElementById('sGalLightbox'); if(lb) lb.style.display='none';
}

function sGalDownload(id){
  const p=_getGalById(id); if(!p) return;
  const a=document.createElement('a');
  a.href=p.photo;
  a.download=p.title.replace(/[^a-z0-9]/gi,'_')+'.jpg';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  toast('📥 Photo downloading...','success');
}

function sGalShare(id){
  const p=_getGalById(id); if(!p) return;
  // Try Web Share API first (mobile)
  if(navigator.share){
    // Convert base64 to blob for sharing
    fetch(p.photo).then(r=>r.blob()).then(blob=>{
      const file=new File([blob], p.title.replace(/[^a-z0-9]/gi,'_')+'.jpg',{type:'image/jpeg'});
      navigator.share({ title:p.title, text:`${p.title} — from ${getSettings().schoolName||'School'}`, files:[file] })
        .catch(()=>sGalCopyFallback(p));
    }).catch(()=>sGalCopyFallback(p));
  } else {
    sGalCopyFallback(p);
  }
}

function sGalCopyFallback(p){
  // Fallback: open photo in new tab so user can share from there
  const w=window.open('','_blank');
  if(w){
    w.document.write(`<!DOCTYPE html><html><head><title>${p.title}</title></head><body style="margin:0;background:#000;display:flex;align-items:center;justify-content:center;min-height:100vh;">
      <img src="${p.photo}" style="max-width:100%;max-height:100vh;object-fit:contain;">
    </body></html>`);
    w.document.close();
    toast('📋 Photo opened — use your browser to save or share','info');
  }
}

// ══════════════════════════════════════════════════════
//  PAYMENT MODAL — _showPaymentModal is defined in utils.js
//  Only _submitPaymentProof stays here (needs CU)
// ══════════════════════════════════════════════════════
// NOTE: _showPaymentModal, _payCopy, _paySSPreview → utils.js

// Keep a local alias (utils.js may have already defined it; this is a no-op if so)
window._showPaymentModal = window._showPaymentModal || function(fee) {
  const s  = getSettings();
  const pc = s.paymentConfig || {};
  const cur = s.currency || '₹';
  const isPreview = fee.id === '__preview__';

  // Build UPI deep link
  const upiLink = pc.upiId
    ? `upi://pay?pa=${encodeURIComponent(pc.upiId)}&pn=${encodeURIComponent(pc.upiName||s.schoolName||'School')}${fee.amount>0?'&am='+fee.amount:''}&cu=INR&tn=${encodeURIComponent(fee.feeType||'School Fee')}`
    : '';

  // Remove existing modal
  const existing = document.getElementById('_pay_modal_overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = '_pay_modal_overlay';
  overlay.style.cssText = `position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.7);
    backdrop-filter:blur(8px);display:flex;align-items:flex-end;justify-content:center;
    padding:0;animation:_payFadeIn .25s ease;`;

  overlay.innerHTML = `
    <style>
      @keyframes _payFadeIn{from{opacity:0}to{opacity:1}}
      @keyframes _paySlideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
      #_pay_box{animation:_paySlideUp .3s cubic-bezier(.22,1,.36,1);}
      ._pay_copy_btn{cursor:pointer;user-select:none;}
      ._pay_copy_btn:active{opacity:.7;}
    </style>
    <div id="_pay_box" style="background:linear-gradient(180deg,#1a1235 0%,#0f172a 100%);
      border-radius:24px 24px 0 0;width:100%;max-width:520px;max-height:92vh;overflow-y:auto;
      border-top:1.5px solid rgba(124,58,237,.4);box-shadow:0 -20px 60px rgba(0,0,0,.6);padding:0 0 24px;">

      <!-- Handle bar -->
      <div style="display:flex;justify-content:center;padding:12px 0 4px;">
        <div style="width:40px;height:4px;background:rgba(255,255,255,.2);border-radius:4px;"></div>
      </div>

      <!-- Header -->
      <div style="padding:16px 22px 14px;border-bottom:1px solid rgba(255,255,255,.07);">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <div>
            <div style="font-weight:800;font-size:1.05rem;color:#fff;">💳 Pay School Fee</div>
            <div style="font-size:.78rem;color:rgba(255,255,255,.4);margin-top:2px;">
              ${fee.feeType||'School Fee'}${fee.description?' · '+fee.description:''}
            </div>
          </div>
          ${fee.amount>0?`<div style="text-align:right;">
            <div style="font-size:1.6rem;font-weight:900;background:linear-gradient(135deg,#a78bfa,#06b6d4);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">${cur}${parseFloat(fee.amount||0).toLocaleString()}</div>
            <div style="font-size:.7rem;color:rgba(255,255,255,.3);">Amount Due</div>
          </div>`:''}
          <button onclick="document.getElementById('_pay_modal_overlay').remove()"
            style="background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);color:rgba(255,255,255,.6);
            border-radius:50%;width:32px;height:32px;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-left:12px;">✕</button>
        </div>
      </div>

      <!-- Payment Options -->
      <div style="padding:18px 22px 0;">

        <!-- Step 1: Pay -->
        <div style="font-size:.68rem;font-weight:700;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:.1em;margin-bottom:12px;">Step 1 — Make Payment</div>

        ${pc.upiId ? `
        <!-- UPI Section -->
        <div style="background:rgba(124,58,237,.08);border:1px solid rgba(124,58,237,.25);border-radius:16px;padding:16px 18px;margin-bottom:14px;">
          <div style="font-weight:700;color:#a78bfa;font-size:.85rem;margin-bottom:12px;">📱 Pay via UPI</div>

          ${pc.qrCode ? `
          <div style="display:flex;justify-content:center;margin-bottom:14px;">
            <div style="background:#fff;padding:12px;border-radius:14px;display:inline-block;box-shadow:0 4px 20px rgba(0,0,0,.3);">
              <img src="${pc.qrCode}" style="width:170px;height:170px;object-fit:contain;display:block;">
            </div>
          </div>
          <div style="text-align:center;font-size:.75rem;color:rgba(255,255,255,.35);margin-bottom:12px;">📷 Open any UPI app → Scan QR Code</div>
          ` : ''}

          <!-- UPI ID copy -->
          <div style="background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:10px 14px;display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
            <div>
              <div style="font-size:.68rem;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:.06em;margin-bottom:2px;">UPI ID</div>
              <div style="font-size:.95rem;font-weight:700;color:#fff;font-family:monospace;" id="_pay_upi_id_text">${pc.upiId}</div>
            </div>
            <button class="_pay_copy_btn" onclick="_payCopy('${pc.upiId}','UPI ID')"
              style="background:rgba(124,58,237,.2);color:#a78bfa;border:1px solid rgba(124,58,237,.3);border-radius:8px;padding:6px 14px;font-size:.78rem;font-weight:700;">
              📋 Copy
            </button>
          </div>

          ${upiLink ? `
          <a href="${upiLink}" style="display:block;text-align:center;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;border-radius:12px;padding:13px;font-weight:800;font-size:.9rem;text-decoration:none;box-shadow:0 4px 16px rgba(124,58,237,.4);">
            🚀 Open UPI App & Pay ${fee.amount>0?cur+parseFloat(fee.amount).toLocaleString():''}
          </a>
          <div style="text-align:center;font-size:.7rem;color:rgba(255,255,255,.25);margin-top:6px;">Works with PhonePe · GPay · Paytm · BHIM · any UPI app</div>
          ` : ''}
        </div>` : ''}

        ${pc.accNo ? `
        <!-- Bank Transfer Section -->
        <div style="background:rgba(6,182,212,.06);border:1px solid rgba(6,182,212,.2);border-radius:16px;padding:16px 18px;margin-bottom:14px;">
          <div style="font-weight:700;color:#06b6d4;font-size:.85rem;margin-bottom:12px;">🏦 Bank Transfer / NEFT / RTGS</div>
          ${[
            ['Account Name', pc.accName],
            ['Account Number', pc.accNo],
            ['IFSC Code', pc.ifsc],
            ['Bank Name', pc.bankName],
          ].filter(([,v])=>v).map(([label, value])=>`
          <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.05);">
            <div>
              <div style="font-size:.68rem;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:.05em;">${label}</div>
              <div style="font-size:.9rem;font-weight:700;color:#fff;font-family:${label.includes('Number')||label.includes('IFSC')?'monospace':'inherit'};">${value}</div>
            </div>
            <button class="_pay_copy_btn" onclick="_payCopy('${value}','${label}')"
              style="background:rgba(6,182,212,.12);color:#06b6d4;border:1px solid rgba(6,182,212,.25);border-radius:7px;padding:5px 12px;font-size:.72rem;font-weight:700;white-space:nowrap;">
              📋 Copy
            </button>
          </div>`).join('')}
        </div>` : ''}

        ${pc.note ? `
        <div style="background:rgba(245,158,11,.06);border:1px solid rgba(245,158,11,.2);border-radius:10px;padding:12px 14px;margin-bottom:14px;font-size:.8rem;color:rgba(255,255,255,.6);line-height:1.6;">
          📝 <strong style="color:#f59e0b;">Instructions:</strong> ${pc.note}
        </div>` : ''}

        ${!isPreview ? `
        <!-- Step 2: Submit Proof -->
        <div style="border-top:1px solid rgba(255,255,255,.07);padding-top:16px;margin-top:4px;">
          <div style="font-size:.68rem;font-weight:700;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:.1em;margin-bottom:12px;">Step 2 — Submit Payment Proof</div>

          <div class="form-group" style="margin-bottom:12px;">
            <label style="font-size:.78rem;color:rgba(255,255,255,.6);font-weight:600;display:block;margin-bottom:6px;">Transaction ID / UTR Number *</label>
            <input id="_pay_txn_id" class="form-control" placeholder="e.g. 123456789012, T2405261234567"
              style="font-family:monospace;letter-spacing:.04em;">
          </div>

          <div class="form-group" style="margin-bottom:14px;">
            <label style="font-size:.78rem;color:rgba(255,255,255,.6);font-weight:600;display:block;margin-bottom:6px;">Payment Screenshot <span style="color:rgba(255,255,255,.3);font-weight:400;">(optional but recommended)</span></label>
            <div id="_pay_ss_preview" style="margin-bottom:8px;display:none;">
              <img id="_pay_ss_img" style="width:100%;max-height:150px;object-fit:contain;border-radius:10px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);">
            </div>
            <input type="file" id="_pay_ss_input" accept="image/*" style="display:none;" onchange="_paySSPreview(this)">
            <button onclick="document.getElementById('_pay_ss_input').click()"
              style="background:rgba(255,255,255,.06);color:rgba(255,255,255,.7);border:1.5px dashed rgba(255,255,255,.2);border-radius:10px;padding:10px 16px;cursor:pointer;font-size:.8rem;font-weight:600;width:100%;text-align:center;">
              📷 Upload Screenshot
            </button>
          </div>

          <div class="form-group" style="margin-bottom:16px;">
            <label style="font-size:.78rem;color:rgba(255,255,255,.6);font-weight:600;display:block;margin-bottom:6px;">Note <span style="color:rgba(255,255,255,.3);font-weight:400;">(optional)</span></label>
            <input id="_pay_note" class="form-control" placeholder="Any message for the school…">
          </div>

          <button onclick="_submitPaymentProof('${fee.id}','${fee.feeType||'Fee'}')"
            style="width:100%;background:linear-gradient(135deg,#10b981,#06b6d4);color:#fff;border:none;border-radius:14px;padding:15px;font-weight:800;font-size:1rem;cursor:pointer;box-shadow:0 4px 20px rgba(16,185,129,.4);">
            ✅ Submit Payment Proof
          </button>
          <div style="text-align:center;font-size:.72rem;color:rgba(255,255,255,.25);margin-top:8px;">School will verify & mark your fee as paid</div>
        </div>` : `
        <div style="text-align:center;padding:16px;color:rgba(255,255,255,.35);font-size:.8rem;">
          <em>This is a preview — in live mode students can submit payment proof here</em>
        </div>`}
      </div>
    </div>`;

  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
};

window._payCopy = function(text, label) {
  navigator.clipboard?.writeText(text).then(() => {
    toast(`📋 ${label} copied!`, 'success');
  }).catch(() => {
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); ta.remove();
    toast(`📋 ${label} copied!`, 'success');
  });
};

window._paySSPreview = function(input) {
  const file = input.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const preview = document.getElementById('_pay_ss_preview');
    const img     = document.getElementById('_pay_ss_img');
    if (preview && img) { img.src = e.target.result; preview.style.display = 'block'; }
  };
  reader.readAsDataURL(file);
};

// Super-simple submit — student just taps "Done, I've Paid"
// No transaction ID required. Admin verifies on their UPI app.
window._submitPaymentProof = function(feeId) {
  // Remove any existing pending proof for this fee first
  const existing = DB.get('fee_payment_proofs');
  const filtered = existing.filter(function(p){
    return !(p.feeId === feeId && p.studentId === CU.id && p.status !== 'approved');
  });

  const fee = DB.get('fees').find(function(f){ return f.id === feeId; }) || {};
  filtered.push({
    id:          genId('proof'),
    feeId:       feeId,
    studentId:   CU.id,
    studentName: CU.name,
    feeType:     fee.feeType || 'Fee',
    amount:      fee.amount  || 0,
    txnId:       '',          // optional — admin checks their UPI app
    screenshot:  '',
    note:        'Paid via UPI',
    submittedAt: new Date().toISOString(),
    status:      'pending',
  });
  DB.set('fee_payment_proofs', filtered);

  // Close modal
  var modal = document.getElementById('_pay_modal_overlay');
  if (modal) modal.remove();

  // Show big success message
  toast('🎉 Payment submitted! School will confirm soon.', 'success', 3500);
  renderFees();
};


// ══════════════════════════════════════════════════════
//  ASSIGNMENTS — Student Panel
// ══════════════════════════════════════════════════════
let _stdAsnState = { view: 'list', assignmentId: null };

function renderAssignments() {
  _stdAsnState.view === 'detail' && _stdAsnState.assignmentId
    ? _stdAsnDetail(_stdAsnState.assignmentId)
    : _stdAsnList();
  _stdAsnBadge();
}

function _stdAsnBadge() {
  const me = getMe();
  if (!me) return;
  const subs = DB.get('assignment_submissions') || [];
  const all  = (DB.get('assignments') || []).filter(a => a.classId === me.classId);
  const pending = all.filter(a => {
    const mySub = subs.find(s => s.assignmentId === a.id && s.studentId === me.id);
    return !mySub && a.dueDate >= today();
  }).length;
  const b = document.getElementById('std-asn-badge');
  if (b) { b.style.display = pending ? 'inline' : 'none'; b.textContent = pending; }
}

/* ── LIST VIEW ─────────────────────────────────────────── */
function _stdAsnList() {
  const me   = getMe();
  if (!me) return;
  const all  = (DB.get('assignments') || [])
    .filter(a => a.classId === me.classId)
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  const subs = DB.get('assignment_submissions') || [];

  const cards = all.map(a => {
    const mySub  = subs.find(s => s.assignmentId === a.id && s.studentId === me.id);
    const overdue = a.dueDate && a.dueDate < today() && !mySub;
    const due     = a.dueDate;
    let statusChip = '';
    if (mySub?.status === 'graded') {
      statusChip = `<span style="background:rgba(16,185,129,.2);color:#10b981;border-radius:10px;padding:3px 10px;font-size:11px;font-weight:800;">✅ Graded${mySub.grade ? ' · ' + mySub.grade : ''}</span>`;
    } else if (mySub) {
      statusChip = `<span style="background:rgba(245,158,11,.15);color:#f59e0b;border-radius:10px;padding:3px 10px;font-size:11px;font-weight:700;">⏳ Submitted</span>`;
    } else if (overdue) {
      statusChip = `<span style="background:rgba(239,68,68,.15);color:#f87171;border-radius:10px;padding:3px 10px;font-size:11px;font-weight:700;">❌ Missed</span>`;
    } else {
      statusChip = `<span style="background:rgba(124,58,237,.2);color:#c4b5fd;border-radius:10px;padding:3px 10px;font-size:11px;font-weight:700;">📤 Pending</span>`;
    }
    return `
    <div style="background:rgba(255,255,255,.04);border:1.5px solid ${mySub ? 'rgba(16,185,129,.2)' : overdue ? 'rgba(239,68,68,.2)' : 'rgba(255,255,255,.08)'};
                border-radius:16px;padding:18px 20px;cursor:pointer;transition:all .18s;"
         onmouseover="this.style.background='rgba(124,58,237,.07)'"
         onmouseout="this.style.background='rgba(255,255,255,.04)'"
         onclick="_stdAsnState.view='detail';_stdAsnState.assignmentId='${a.id}';renderAssignments()">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:8px;">
        <div style="flex:1;min-width:0;">
          <div style="font-weight:800;font-size:15px;color:#fff;">${a.title}</div>
          <div style="font-size:12px;color:rgba(255,255,255,.35);margin-top:3px;">
            ${a.subject ? `<span style="background:rgba(124,58,237,.15);color:#c4b5fd;border-radius:5px;padding:1px 7px;margin-right:5px;">${a.subject}</span>` : ''}
            👤 ${a.teacherName || 'Teacher'}
          </div>
        </div>
        ${statusChip}
      </div>
      ${a.description ? `<div style="font-size:12px;color:rgba(255,255,255,.45);margin-bottom:10px;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${a.description}</div>` : ''}
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px;">
        <div style="font-size:12px;color:rgba(255,255,255,.3);">
          📅 Due: <strong style="color:${overdue ? '#f87171' : 'rgba(255,255,255,.55)'}">${due ? _stdFmtDate(due) : 'No date'}</strong>
          ${a.fileName ? `&nbsp;·&nbsp; 📎 ${a.fileName}` : ''}
        </div>
        ${!mySub && !overdue ? `<span style="font-size:12px;color:#a78bfa;font-weight:600;">Tap to view & submit →</span>` : ''}
        ${mySub?.feedback ? `<span style="font-size:11px;color:#6ee7b7;">💬 Feedback received</span>` : ''}
      </div>
    </div>`;
  }).join('');

  $('section-assignments').innerHTML = `
  <div class="section-header"><h2 class="section-title">📋 My Assignments</h2></div>

  <!-- How to submit banner -->
  <div style="background:rgba(124,58,237,.08);border:1px solid rgba(124,58,237,.25);border-radius:12px;
              padding:12px 16px;margin-bottom:18px;font-size:13px;color:rgba(255,255,255,.6);line-height:1.7;">
    📌 <strong style="color:#c4b5fd;">How to submit:</strong>
    Open an assignment → Write your answer in the text box &amp; / or upload a file (max 2MB) → Click <strong style="color:#10b981;">Submit Assignment</strong>.
    Once submitted, your teacher will review and give a grade.
  </div>

  ${all.length === 0
    ? `<div style="text-align:center;padding:48px 20px;color:rgba(255,255,255,.3);">
         <div style="font-size:48px;margin-bottom:12px;">📋</div>
         <div style="font-size:16px;font-weight:600;">No assignments yet</div>
         <div style="font-size:13px;margin-top:6px;">Your teacher hasn't given any assignments yet.</div>
       </div>`
    : `<div style="display:grid;gap:12px;">${cards}</div>`}`;
}

/* ── DETAIL VIEW ─────────────────────────────────────────── */
function _stdAsnDetail(asnId) {
  const me  = getMe();
  const a   = (DB.get('assignments') || []).find(x => x.id === asnId);
  if (!a || !me) { _stdAsnState.view = 'list'; _stdAsnList(); return; }
  const mySub  = (DB.get('assignment_submissions') || []).find(s => s.assignmentId === asnId && s.studentId === me.id);
  const overdue = a.dueDate && a.dueDate < today();

  $('section-assignments').innerHTML = `
  <div class="section-header" style="margin-bottom:16px;">
    <button onclick="_stdAsnState.view='list';renderAssignments()"
      style="background:rgba(255,255,255,.07);color:rgba(255,255,255,.7);border:1px solid rgba(255,255,255,.12);
             border-radius:7px;padding:5px 13px;font-size:13px;cursor:pointer;margin-bottom:10px;display:block;">← Back</button>
    <h2 class="section-title" style="margin-bottom:4px;">${a.title}</h2>
    <div style="font-size:12px;color:rgba(255,255,255,.4);">
      ${a.subject ? `<span style="background:rgba(124,58,237,.15);color:#c4b5fd;border-radius:5px;padding:1px 7px;margin-right:6px;">${a.subject}</span>` : ''}
      👤 ${a.teacherName || 'Teacher'} &nbsp;·&nbsp;
      📅 Due: <strong style="color:${overdue && !mySub ? '#f87171' : 'rgba(255,255,255,.6)'}">${a.dueDate ? _stdFmtDate(a.dueDate) : 'No due date'}</strong>
    </div>
  </div>

  <!-- Assignment card -->
  <div class="card" style="margin-bottom:16px;">
    <div class="card-body">
      ${a.description ? `<p style="color:rgba(255,255,255,.75);font-size:14px;line-height:1.8;margin:0 0 14px;white-space:pre-wrap;">${a.description}</p>` : ''}
      ${a.fileName ? `<a href="${a.fileUrl || '#'}" target="_blank" download="${a.fileName}"
        style="display:inline-flex;align-items:center;gap:8px;background:rgba(124,58,237,.15);color:#c4b5fd;
               border:1px solid rgba(124,58,237,.3);border-radius:9px;padding:9px 16px;font-size:13px;
               text-decoration:none;font-weight:600;">
        📎 Download Attachment: ${a.fileName} <span style="opacity:.5;font-size:11px;">(${_stdFmtSize(a.fileSize)})</span></a>` : ''}
      ${!a.description && !a.fileName ? `<p style="color:rgba(255,255,255,.3);font-size:13px;">No description provided.</p>` : ''}
    </div>
  </div>

  <!-- Submission section -->
  ${mySub
    ? _stdSubStatus(mySub, a)
    : overdue
      ? `<div style="background:rgba(239,68,68,.08);border:1.5px solid rgba(239,68,68,.3);border-radius:14px;padding:20px;text-align:center;">
           <div style="font-size:32px;margin-bottom:8px;">⏰</div>
           <div style="font-weight:700;color:#f87171;font-size:15px;">Due date has passed</div>
           <div style="font-size:13px;color:rgba(255,255,255,.4);margin-top:6px;">Contact your teacher if you still need to submit.</div>
         </div>`
      : _stdSubForm(asnId)}`;
}

function _stdSubStatus(sub, a) {
  return `
  <div class="card">
    <div class="card-body">
      <div style="font-weight:700;color:rgba(255,255,255,.5);font-size:12px;text-transform:uppercase;letter-spacing:.05em;margin-bottom:12px;">Your Submission</div>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
        <span style="background:${sub.status==='graded'?'rgba(16,185,129,.2)':'rgba(245,158,11,.15)'};
                     color:${sub.status==='graded'?'#10b981':'#f59e0b'};
                     border-radius:10px;padding:4px 12px;font-size:12px;font-weight:800;">
          ${sub.status === 'graded' ? '✅ Graded' : '⏳ Submitted — waiting for review'}
        </span>
        ${sub.grade ? `<span style="background:rgba(124,58,237,.25);color:#a78bfa;border-radius:10px;padding:4px 14px;font-size:16px;font-weight:900;">${sub.grade}</span>` : ''}
      </div>
      <div style="font-size:11px;color:rgba(255,255,255,.3);margin-bottom:12px;">
        Submitted on: ${sub.submittedAt ? sub.submittedAt.slice(0,16).replace('T',' ') : today()}
      </div>
      ${sub.text ? `<div style="background:rgba(255,255,255,.04);border-radius:8px;padding:12px 14px;font-size:13px;color:rgba(255,255,255,.65);white-space:pre-wrap;line-height:1.6;margin-bottom:10px;">${_stdEsc(sub.text)}</div>` : ''}
      ${sub.fileName ? `<div style="background:rgba(124,58,237,.08);border:1px solid rgba(124,58,237,.25);border-radius:8px;padding:8px 14px;font-size:12px;color:#a78bfa;">📎 Uploaded: ${sub.fileName} (${_stdFmtSize(sub.fileSize)})</div>` : ''}
      ${sub.feedback ? `
        <div style="margin-top:14px;background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.25);border-radius:10px;padding:12px 16px;">
          <div style="font-size:11px;font-weight:700;color:#6ee7b7;margin-bottom:4px;">💬 Teacher Feedback</div>
          <div style="font-size:13px;color:rgba(255,255,255,.7);white-space:pre-wrap;">${_stdEsc(sub.feedback)}</div>
        </div>` : ''}
    </div>
  </div>`;
}

function _stdSubForm(asnId) {
  return `
  <div class="card">
    <div class="card-body">
      <div style="font-weight:700;color:rgba(255,255,255,.5);font-size:12px;text-transform:uppercase;letter-spacing:.05em;margin-bottom:14px;">📤 Submit Your Assignment</div>
      <div class="form-group">
        <label class="form-label">Your Answer / Notes</label>
        <textarea class="form-control" id="std-asn-text" rows="5"
          placeholder="Write your answer here... You can also attach a file below."></textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Attach File <span style="color:rgba(255,255,255,.35);font-size:11px;">(max 2MB — PDF, Word, Image, etc.)</span></label>
        <input type="file" class="form-control" id="std-asn-file"
          accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt,.zip"
          onchange="_stdAsnFileCheck(this)">
        <div id="std-asn-file-info" style="font-size:12px;margin-top:4px;color:rgba(255,255,255,.35);"></div>
      </div>
      <div style="background:rgba(255,255,255,.04);border-radius:8px;padding:10px 14px;font-size:12px;color:rgba(255,255,255,.4);margin-bottom:14px;line-height:1.6;">
        ℹ️ You can write a text answer, upload a file, or both. Once submitted you cannot edit your answer — make sure it's complete.
      </div>
      <button onclick="_stdSubmitAssignment('${asnId}')"
        style="width:100%;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;border:none;
               border-radius:10px;padding:13px;font-size:15px;font-weight:800;cursor:pointer;
               box-shadow:0 4px 16px rgba(124,58,237,.35);">
        📤 Submit Assignment
      </button>
    </div>
  </div>`;
}

// ── Image compression via Canvas ─────────────────────
function _stdCompressImage(file, maxBytes, cb) {
  const img = new Image();
  const url = URL.createObjectURL(file);
  img.onload = function() {
    URL.revokeObjectURL(url);
    const canvas = document.createElement('canvas');
    let w = img.width, h = img.height;
    // Step 1: scale down dimensions if needed
    const MAX_DIM = 1600;
    if (w > MAX_DIM || h > MAX_DIM) {
      if (w > h) { h = Math.round(h * MAX_DIM / w); w = MAX_DIM; }
      else        { w = Math.round(w * MAX_DIM / h); h = MAX_DIM; }
    }
    canvas.width = w; canvas.height = h;
    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
    // Step 2: reduce quality until under maxBytes
    let quality = 0.85;
    const tryCompress = function() {
      canvas.toBlob(function(blob) {
        if (!blob) { cb(null); return; }
        if (blob.size <= maxBytes || quality <= 0.1) {
          const reader = new FileReader();
          reader.onload = function(e) { cb(e.target.result, blob.size); };
          reader.readAsDataURL(blob);
        } else {
          quality -= 0.1;
          tryCompress();
        }
      }, 'image/jpeg', quality);
    };
    tryCompress();
  };
  img.onerror = function() { URL.revokeObjectURL(url); cb(null); };
  img.src = url;
}

function _stdAsnFileCheck(input) {
  const info = document.getElementById('std-asn-file-info');
  if (!info) return;
  const file = input.files?.[0];
  if (!file) { info.textContent = ''; return; }
  const isImage = file.type.startsWith('image/');
  const MAX = 2 * 1024 * 1024;
  if (file.size > MAX) {
    if (isImage) {
      info.style.color = '#f59e0b';
      info.textContent = '⏳ Image is ' + _stdFmtSize(file.size) + ' — will be auto-compressed to under 2MB when you submit.';
    } else {
      info.style.color = '#ef4444';
      info.textContent = '❌ File is ' + _stdFmtSize(file.size) + ' — too large! Max 2MB. Please use a smaller file or an image.';
      input.value = '';
    }
  } else {
    info.style.color = '#10b981';
    info.textContent = '✅ ' + file.name + ' (' + _stdFmtSize(file.size) + ') — Ready to upload';
  }
}

function _stdSubmitAssignment(asnId) {
  const me        = getMe();
  const text      = document.getElementById('std-asn-text')?.value.trim() || '';
  const fileInput = document.getElementById('std-asn-file');
  const file      = fileInput?.files?.[0];
  if (!text && !file) { showToast('Please write an answer or attach a file', 'warning'); return; }

  // Disable button to prevent double-submit
  const btn = document.querySelector('[onclick*="_stdSubmitAssignment"]');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Submitting…'; }

  const save = function(fileUrl, fileName, fileSize) {
    const sub = {
      id: genId('sub'),
      assignmentId: asnId,
      studentId: me.id,
      studentName: me.name || '',
      text,
      fileUrl: fileUrl || '',
      fileName: fileName || '',
      fileSize: fileSize || 0,
      submittedAt: new Date().toISOString(),
      status: 'submitted'
    };
    const list = DB.get('assignment_submissions') || [];
    list.push(sub);
    DB.set('assignment_submissions', list);
    // Show success popup
    _stdAsnSuccessPopup(asnId);
  };

  const MAX = 2 * 1024 * 1024;
  if (file) {
    if (file.size > MAX && file.type.startsWith('image/')) {
      // Auto-compress image
      const info = document.getElementById('std-asn-file-info');
      if (info) { info.style.color = '#f59e0b'; info.textContent = '⏳ Compressing image…'; }
      _stdCompressImage(file, MAX, function(dataUrl, newSize) {
        if (!dataUrl) {
          showToast('Could not compress image. Please use a smaller file.', 'error');
          if (btn) { btn.disabled = false; btn.textContent = '📤 Submit Assignment'; }
          return;
        }
        save(dataUrl, file.name.replace(/\.[^.]+$/, '') + '_compressed.jpg', newSize);
      });
    } else if (file.size > MAX) {
      showToast('File is too large (max 2MB). Please use an image or a smaller file.', 'error');
      if (btn) { btn.disabled = false; btn.textContent = '📤 Submit Assignment'; }
    } else {
      const reader = new FileReader();
      reader.onload = function(e) { save(e.target.result, file.name, file.size); };
      reader.onerror = function() {
        showToast('File read error. Try again.', 'error');
        if (btn) { btn.disabled = false; btn.textContent = '📤 Submit Assignment'; }
      };
      reader.readAsDataURL(file);
    }
  } else {
    save('', '', 0);
  }
}

// ── Success popup after submission ───────────────────
function _stdAsnSuccessPopup(asnId) {
  const asn = (DB.get('assignments') || []).find(a => a.id === asnId);
  // Remove any existing popup
  const old = document.getElementById('_asn_success_overlay');
  if (old) old.remove();

  const overlay = document.createElement('div');
  overlay.id = '_asn_success_overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.65);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:20px;animation:_asnFadeIn .3s ease;';
  overlay.innerHTML = `
    <style>
      @keyframes _asnFadeIn{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:scale(1)}}
      @keyframes _asnConfetti{0%{transform:translateY(0) rotate(0)}100%{transform:translateY(-80px) rotate(360deg);opacity:0}}
    </style>
    <div style="background:linear-gradient(160deg,#1e1b4b 0%,#0f172a 100%);border:1.5px solid rgba(124,58,237,.5);
                border-radius:24px;max-width:360px;width:100%;padding:36px 28px;text-align:center;
                box-shadow:0 24px 80px rgba(0,0,0,.6),0 0 0 1px rgba(124,58,237,.2);">
      <!-- Animated checkmark -->
      <div style="width:80px;height:80px;background:linear-gradient(135deg,#10b981,#059669);border-radius:50%;
                  display:flex;align-items:center;justify-content:center;margin:0 auto 20px;
                  box-shadow:0 8px 32px rgba(16,185,129,.4);font-size:36px;">✅</div>

      <!-- Confetti dots -->
      <div style="position:absolute;top:30%;left:50%;transform:translateX(-50%);pointer-events:none;">
        ${['#7c3aed','#10b981','#f59e0b','#ef4444','#06b6d4'].map((c,i)=>`
          <div style="position:absolute;width:8px;height:8px;background:${c};border-radius:50%;
                      left:${(i-2)*30}px;animation:_asnConfetti ${0.6+i*0.1}s ease-out ${i*0.08}s forwards;"></div>`).join('')}
      </div>

      <div style="font-size:22px;font-weight:900;color:#fff;margin-bottom:8px;">Assignment Submitted!</div>
      <div style="font-size:14px;color:rgba(255,255,255,.55);line-height:1.6;margin-bottom:6px;">
        ${asn ? `<strong style="color:#c4b5fd;">${asn.title}</strong><br>` : ''}
        Your assignment has been submitted successfully.
      </div>
      <div style="font-size:12px;color:rgba(255,255,255,.35);margin-bottom:24px;">
        📬 Your teacher will review and give feedback soon.
      </div>
      <button onclick="document.getElementById('_asn_success_overlay').remove();_stdAsnState.view='detail';renderAssignments();"
        style="width:100%;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;border:none;
               border-radius:12px;padding:13px;font-size:15px;font-weight:800;cursor:pointer;
               box-shadow:0 4px 16px rgba(124,58,237,.4);">
        View My Submission →
      </button>
      <button onclick="document.getElementById('_asn_success_overlay').remove();_stdAsnState.view='list';renderAssignments();"
        style="width:100%;background:transparent;color:rgba(255,255,255,.4);border:none;
               padding:10px;font-size:13px;cursor:pointer;margin-top:6px;">
        Back to All Assignments
      </button>
    </div>`;
  document.body.appendChild(overlay);
  // Auto-close after 8 seconds
  setTimeout(function() {
    const el = document.getElementById('_asn_success_overlay');
    if (el) { el.remove(); _stdAsnState.view = 'detail'; renderAssignments(); }
  }, 8000);
}

/* ── Helpers ─────────────────────────────────────────────── */
function _stdFmtDate(d) {
  if (!d) return '';
  try { return new Date(d + (d.length === 10 ? 'T00:00:00' : '')).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); } catch(e) { return d; }
}
function _stdFmtSize(bytes) {
  if (!bytes) return '0 B';
  const b = Number(bytes);
  if (b >= 1024 * 1024) return (b / 1024 / 1024).toFixed(1) + ' MB';
  if (b >= 1024) return (b / 1024).toFixed(0) + ' KB';
  return b + ' B';
}
function _stdEsc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ═════════════════════════════════════════════════════════════════════════════
// BUS TRACKER — Parent/Student sees their assigned vehicle live on map
// ═════════════════════════════════════════════════════════════════════════════
if (!document.getElementById('_vmBusStyle')) {
  const _bs = document.createElement('style');
  _bs.id = '_vmBusStyle';
  _bs.textContent = '@keyframes vmPulse{0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,.5),0 4px 12px rgba(0,0,0,.5)}50%{box-shadow:0 0 0 10px rgba(16,185,129,0),0 4px 12px rgba(0,0,0,.5)}}';
  document.head.appendChild(_bs);
}
let _busMap       = null;
let _busMarker    = null;
let _busPollTimer = null;
let _busSchoolId  = null;

window._destroyBusMap = function() {
  if (_busPollTimer) { clearInterval(_busPollTimer); _busPollTimer = null; }
  if (_busMap) { try { _busMap.remove(); } catch(e){} _busMap = null; }
  _busMarker = null;
};

function renderBusTracker() {
  const me = getMe();
  if (!me) return;
  const vehicleId = me.vehicleId || null;
  const vehicles  = DB.get('vehicles') || [];
  const vehicle   = vehicleId ? vehicles.find(v => v.id === vehicleId) : null;
  const schoolId  = DB._schoolId ? DB._schoolId() : (DB.get('school_settings')||{}).id || '';
  _busSchoolId    = schoolId;

  const el = document.getElementById('section-bustracker');
  if (!el) return;

  if (!vehicle) {
    el.innerHTML = `
    <div class="page-header"><div><h2>🚌 Bus Tracker</h2><div class="breadcrumb">Real-time vehicle location</div></div></div>
    <div class="empty-state" style="margin-top:40px;">
      <div class="e-icon">🚌</div>
      <h3>No Bus Assigned</h3>
      <p>No vehicle has been assigned yet. Please contact the school admin.</p>
    </div>`;
    return;
  }

  el.innerHTML = `
  <div class="page-header">
    <div><h2>🚌 Bus Tracker</h2><div class="breadcrumb">${vehicle.name} · Route: ${vehicle.route||'—'}</div></div>
    <div id="bus-live-badge" style="display:none;background:rgba(16,185,129,.15);border:1px solid rgba(16,185,129,.4);color:#10b981;padding:6px 14px;border-radius:20px;font-size:13px;font-weight:700;">🟢 LIVE</div>
  </div>

  <!-- Info cards -->
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;margin-bottom:16px;">
    <div class="stat-card" style="padding:14px 16px;">
      <div style="font-size:1.4rem;margin-bottom:4px;">🚌</div>
      <div class="stat-label">Vehicle</div>
      <div style="font-size:13px;font-weight:700;color:#fff;">${vehicle.name}</div>
      <div class="text-xs text-muted">${vehicle.number||'—'}</div>
    </div>
    <div class="stat-card" style="padding:14px 16px;">
      <div style="font-size:1.4rem;margin-bottom:4px;">👨</div>
      <div class="stat-label">Driver</div>
      <div style="font-size:13px;font-weight:700;color:#fff;">${vehicle.driver||'—'}</div>
      <div class="text-xs text-muted">${vehicle.driverPhone||'—'}</div>
    </div>
    <div class="stat-card" style="padding:14px 16px;">
      <div style="font-size:1.4rem;margin-bottom:4px;">📍</div>
      <div class="stat-label">Route</div>
      <div style="font-size:13px;font-weight:700;color:#fff;">${vehicle.route||'—'}</div>
      <div class="text-xs text-muted">Capacity: ${vehicle.capacity||'—'}</div>
    </div>
    <div class="stat-card" style="padding:14px 16px;" id="bus-eta-card">
      <div style="font-size:1.4rem;margin-bottom:4px;">⏱️</div>
      <div class="stat-label">ETA / Speed</div>
      <div style="font-size:13px;font-weight:700;color:#fff;" id="bus-eta-val">Calculating…</div>
      <div class="text-xs text-muted" id="bus-acc-val">Waiting for GPS</div>
    </div>
  </div>

  <!-- Map -->
  <div class="card" style="overflow:hidden;">
    <div class="card-header" style="display:flex;align-items:center;justify-content:space-between;">
      <h3>🗺️ Live Location</h3>
      <div style="display:flex;gap:8px;align-items:center;">
        <span id="bus-upd-time" style="font-size:11px;color:rgba(255,255,255,.35);">Waiting for location…</span>
        <button class="btn btn-sm btn-secondary" onclick="_busForceRefresh()">🔄</button>
      </div>
    </div>
    <div id="bus-map" style="height:380px;background:#1a1a2e;border-radius:0 0 14px 14px;"></div>
  </div>

  <!-- Status banner -->
  <div id="bus-status-banner" style="margin-top:12px;padding:12px 16px;background:rgba(245,158,11,.07);border:1px solid rgba(245,158,11,.25);border-radius:12px;font-size:13px;color:rgba(255,255,255,.5);">
    📡 Fetching live GPS from server… (auto-updates every 8 seconds)
  </div>`;

  // Load Leaflet and start polling
  setTimeout(() => {
    (window._loadLeaflet ? window._loadLeaflet() : Promise.resolve()).then(() => {
      _initBusMap(vehicle);
      _startBusPoll(vehicle, schoolId);
    });
  }, 50);
}

function _initBusMap(v) {
  const mapEl = document.getElementById('bus-map');
  if (!mapEl || !window.L) return;
  if (_busMap) { try { _busMap.remove(); } catch(e){} _busMap = null; _busMarker = null; }

  const lat = v.lat || 20.5937;
  const lng = v.lng || 78.9629;
  const zoom = v.lat ? 14 : 5;

  _busMap = L.map('bus-map', { zoomControl: true, tap: true }).setView([lat, lng], zoom);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OSM', maxZoom: 19
  }).addTo(_busMap);

  if (v.lat && v.lng) {
    _busMarker = _mkBusMarker(v.lat, v.lng, false);
  }
  setTimeout(() => { if (_busMap) _busMap.invalidateSize(); }, 200);
}

function _mkBusMarker(lat, lng, isLive) {
  if (!_busMap) return null;
  if (_busMarker) { try { _busMarker.remove(); } catch(e){} }
  const color  = isLive ? '#10b981' : '#94a3b8';
  const pulse  = isLive ? 'animation:vmPulse 1.5s infinite;' : '';
  const icon   = L.divIcon({
    html: `<div style="background:${color};color:#fff;border-radius:50%;width:44px;height:44px;display:flex;align-items:center;justify-content:center;font-size:22px;box-shadow:0 4px 12px rgba(0,0,0,.5);border:3px solid #fff;${pulse}">🚌</div>`,
    iconSize: [44, 44], iconAnchor: [22, 22], className: ''
  });
  return L.marker([lat, lng], { icon }).addTo(_busMap);
}

function _startBusPoll(vehicle, schoolId) {
  if (_busPollTimer) { clearInterval(_busPollTimer); _busPollTimer = null; }
  _fetchBusLive(vehicle, schoolId);
  _busPollTimer = setInterval(() => _fetchBusLive(vehicle, schoolId), 8000);
}

function _fetchBusLive(vehicle, schoolId) {
  if (!schoolId || !vehicle) return;
  fetch(`api/kv.php?school_id=${encodeURIComponent(schoolId)}&key=vehicle_live_${encodeURIComponent(vehicle.id)}`)
    .then(r => r.ok ? r.text() : null)
    .then(txt => {
      if (!txt || txt.trim()==='null' || txt.trim()==='') {
        _busUpdateBanner(false, null, vehicle);
        return;
      }
      let ld;
      try { ld = JSON.parse(txt); } catch(e) { return; }
      if (!ld || !ld.lat) { _busUpdateBanner(false, null, vehicle); return; }

      const isOnline = ld.online && ld.timestamp && (Date.now()-new Date(ld.timestamp).getTime()<30000);
      _busUpdateBanner(isOnline, ld, vehicle);

      if (ld.lat && ld.lng && _busMap) {
        _busMarker = _mkBusMarker(ld.lat, ld.lng, isOnline);
        if (isOnline) _busMap.panTo([ld.lat, ld.lng]);
      }

      // Update time display
      const timeEl = document.getElementById('bus-upd-time');
      if (timeEl && ld.timestamp) {
        timeEl.textContent = 'Updated: ' + new Date(ld.timestamp).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
      }
      // Update ETA / speed
      const etaEl = document.getElementById('bus-eta-val');
      const accEl = document.getElementById('bus-acc-val');
      if (etaEl) {
        const eta = _busCalcETA(ld);
        etaEl.textContent = eta ? eta
          : ld.speed ? `${ld.speed} km/h` : (isOnline ? 'Stopped / Slow' : 'Offline');
      }
      if (accEl) accEl.textContent = (ld.speed ? `🚀 ${ld.speed} km/h · ` : '') + (ld.accuracy ? `GPS ±${ld.accuracy}m` : '—');
      // Live badge
      const badge = document.getElementById('bus-live-badge');
      if (badge) badge.style.display = isOnline ? 'inline-block' : 'none';
    }).catch(() => _busUpdateBanner(false, null, vehicle));
}

function _busUpdateBanner(isOnline, ld, vehicle) {
  const el = document.getElementById('bus-status-banner');
  if (!el) return;
  if (isOnline) {
    const spd = ld && ld.speed ? `· Speed: ${ld.speed} km/h` : '';
    const acc = ld && ld.accuracy ? `· Accuracy: ±${ld.accuracy}m` : '';
    el.style.background = 'rgba(16,185,129,.07)';
    el.style.borderColor = 'rgba(16,185,129,.3)';
    el.innerHTML = `🟢 <strong>Live GPS active</strong> — Map auto-updates every 8 seconds ${spd} ${acc}`;
  } else {
    el.style.background = 'rgba(245,158,11,.07)';
    el.style.borderColor = 'rgba(245,158,11,.25)';
    const stored = vehicle.lastUpdated ? new Date(vehicle.lastUpdated).toLocaleString('en-IN',{hour:'2-digit',minute:'2-digit',day:'2-digit',month:'short'}) : '—';
    el.innerHTML = `⚫ Driver GPS offline — Showing last known location (${stored}). Map auto-updates every 8 seconds.`;
  }
}

// ── ETA: distance from bus to school location ÷ speed ────────────────────────
// School lat/lng comes from school_settings (admin sets it). Falls back to
// average city bus speed (20 km/h) when GPS speed is unavailable.
function _busCalcETA(ld) {
  if (!ld || !ld.lat || !ld.lng) return null;
  const st = DB.get('school_settings') || {};
  const sLat = parseFloat(st.lat || st.schoolLat);
  const sLng = parseFloat(st.lng || st.schoolLng);
  if (!sLat || !sLng) return null;
  const distKm = _busHaversine(ld.lat, ld.lng, sLat, sLng);
  const speed  = (ld.speed && ld.speed > 3) ? ld.speed : 20; // km/h fallback
  const mins   = Math.round((distKm / speed) * 60);
  if (distKm < 0.15) return '🏫 At school';
  return `~${mins} min (${distKm.toFixed(1)} km)`;
}

function _busHaversine(lat1, lng1, lat2, lng2) {
  const R = 6371, rad = Math.PI / 180;
  const dLat = (lat2-lat1)*rad, dLng = (lng2-lng1)*rad;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*rad)*Math.cos(lat2*rad)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function _busForceRefresh() {
  const me = getMe();
  const vehicleId = me && me.vehicleId;
  const vehicles  = DB.get('vehicles') || [];
  const vehicle   = vehicleId ? vehicles.find(v => v.id === vehicleId) : null;
  if (vehicle && _busSchoolId) _fetchBusLive(vehicle, _busSchoolId);
}

activateNav('dashboard');

// ═════════════════════════════════════════════════════════════════════════════
// BIRTHDAY CARD — auto popup on the student's birthday
// ═════════════════════════════════════════════════════════════════════════════
let _bdayTpl='b1', _bd=null;

function _bdayData(){
  const me=getMe(), cls=getMyClass(), s=getSettings();
  return {
    name:me.name||'Student', className:cls?cls.name:'', father:me.fatherName||'',
    mother:me.motherName||'', scholarNo:me.admissionNo||me.scholarNo||me.rollNo||'',
    dob:me.dob||'', age:bdayAge(me.dob), photo:me.photo||'',
    schoolName:s.schoolName||'', logo:s.schoolLogo||'', address:s.schoolAddress||'', phone:s.schoolPhone||''
  };
}

function showBirthdayPopup(){
  _bd=_bdayData(); _bdayTpl='b1';
  const root=document.getElementById('modals-root');
  if(!root) return;
  root.innerHTML=`
  <div class="modal-overlay" id="bdayModal" style="display:flex;align-items:flex-start;justify-content:center;overflow-y:auto;padding:18px 0;">
    <div style="background:var(--card,#12121a);border-radius:18px;max-width:460px;width:94%;margin:auto;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.5);">
      <div style="background:linear-gradient(135deg,#f5c542,#e0a800);padding:14px 18px;display:flex;align-items:center;justify-content:space-between;">
        <div style="font-weight:800;color:#1a1a1a;font-size:1.05rem;">🎉 Happy Birthday, ${esc((_bd.name||'').split(' ')[0])}!</div>
        <button onclick="closeBdayPopup()" style="background:rgba(0,0,0,.15);border:none;width:30px;height:30px;border-radius:50%;cursor:pointer;font-size:1rem;color:#1a1a1a;">✕</button>
      </div>
      <div style="padding:16px;">
        <div style="border-radius:12px;overflow:hidden;background:#000;">
          <canvas id="bdayCanvas" style="width:100%;display:block;"></canvas>
        </div>
        <div style="display:flex;gap:8px;overflow-x:auto;padding:12px 2px;">
          ${BDAY_TEMPLATES.map(t=>`<button id="bthumb-${t.id}" onclick="bdaySwitchTpl('${t.id}')"
            style="flex:0 0 auto;cursor:pointer;border:2px solid ${t.id===_bdayTpl?t.swatch:'transparent'};border-radius:10px;padding:6px 10px;background:linear-gradient(135deg,${t.bg[0]},${t.bg[1]});color:${t.swatch};font-size:.72rem;font-weight:700;white-space:nowrap;">${t.name}</button>`).join('')}
        </div>
        <div style="display:flex;gap:10px;">
          <button class="btn btn-primary" style="flex:1;" onclick="bdayDownload()">📥 Download</button>
          <button class="btn" style="flex:1;background:#25D366;color:#fff;border:none;" onclick="bdayShare()">📤 Share</button>
        </div>
      </div>
    </div>
  </div>`;
  const c=document.getElementById('bdayCanvas');
  drawBirthdayCard(c, _bdayTpl, _bd);
}
function closeBdayPopup(){ const m=document.getElementById('bdayModal'); if(m) m.remove(); }
function bdaySwitchTpl(id){
  _bdayTpl=id;
  BDAY_TEMPLATES.forEach(t=>{ const b=document.getElementById('bthumb-'+t.id); if(b) b.style.border='2px solid '+(t.id===id?t.swatch:'transparent'); });
  drawBirthdayCard(document.getElementById('bdayCanvas'), id, _bd);
}
function bdayDownload(){
  const c=document.getElementById('bdayCanvas'); if(!c) return;
  const a=document.createElement('a');
  a.download='Happy-Birthday-'+(_bd.name||'').replace(/[^a-z0-9]/gi,'_')+'.png';
  a.href=c.toDataURL('image/png');
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  toast('📥 Birthday card downloaded!','success');
}
function bdayShare(){
  const c=document.getElementById('bdayCanvas'); if(!c) return;
  c.toBlob(blob=>{
    if(!blob){ toast('Could not generate image','error'); return; }
    const file=new File([blob],'birthday.png',{type:'image/png'});
    const txt=`🎉 Happy Birthday ${_bd.name}! 🎂 — ${_bd.schoolName||''}`;
    if(navigator.canShare && navigator.canShare({files:[file]})){
      navigator.share({files:[file], title:'Happy Birthday', text:txt}).catch(()=>{});
    } else {
      // Fallback: open the image in a new tab so the user can save/share manually
      const w=window.open('','_blank');
      if(w){ w.document.write(`<body style="margin:0;background:#000;display:flex;align-items:center;justify-content:center;min-height:100vh"><img src="${c.toDataURL('image/png')}" style="max-width:100%;max-height:100vh"></body>`); w.document.close(); }
      toast('📋 Image opened — long-press to save or share','info');
    }
  },'image/png');
}

// Auto-popup once per day on the birthday
(function _birthdayAutoCheck(){
  try{
    const me=getMe();
    if(me && me.dob && bdayIsToday(me.dob)){
      const key='bday_seen_'+me.id+'_'+today();
      if(!localStorage.getItem(key)){
        localStorage.setItem(key,'1');
        setTimeout(showBirthdayPopup, 700);
      }
    }
  }catch(e){}
})();
