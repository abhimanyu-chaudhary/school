/* ═══════════════════════════════════════════════════════════════
   SCHOOL CALENDAR — shared glass-design calendar.
   Admin = editable (add/edit/delete events). Parents = read-only.
   Events stored in DB 'calendar_events' (mirrored to server, so
   parents & admin always see the same calendar).
═══════════════════════════════════════════════════════════════ */

const CAL_CATS = {
  holiday:   { label:'Holiday',   color:'#ef4444', icon:'🏖️' },
  festival:  { label:'Festival',  color:'#f59e0b', icon:'🎉' },
  exam:      { label:'Exam',      color:'#7c3aed', icon:'📝' },
  admission: { label:'Admission', color:'#06b6d4', icon:'📋' },
  event:     { label:'Event',     color:'#10b981', icon:'📌' },
  meeting:   { label:'Meeting',   color:'#3b82f6', icon:'👥' },
};
const _CAL_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const _CAL_DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

let _calY, _calM, _calEl, _calEditable=false, _calEditId=null, _calEditDate='';

/* ── Default Indian holidays/festivals (admin can edit/delete each) ── */
const _CAL_SEED_VERSION = 3;  // bump when the lists below change → re-seeds missing events

/* Fixed-date national days & observances (same date every year) */
function _calFixedHolidays(y){
  return [
    [`${y}-01-01`,'New Year','festival'],
    [`${y}-01-12`,'National Youth Day','event'],
    [`${y}-01-23`,'Netaji Subhas Chandra Bose Jayanti','event'],
    [`${y}-01-26`,'Republic Day','holiday'],
    [`${y}-02-14`,"Valentine's Day",'event'],
    [`${y}-02-28`,'National Science Day','event'],
    [`${y}-03-08`,"International Women's Day",'event'],
    [`${y}-04-07`,'World Health Day','event'],
    [`${y}-04-14`,'Ambedkar Jayanti / Baisakhi','holiday'],
    [`${y}-04-22`,'Earth Day','event'],
    [`${y}-05-01`,'Labour Day','holiday'],
    [`${y}-06-05`,'World Environment Day','event'],
    [`${y}-06-21`,'International Yoga Day','event'],
    [`${y}-07-15`,'Summer Session Begins','event'],
    [`${y}-08-15`,'Independence Day','holiday'],
    [`${y}-08-29`,'National Sports Day','event'],
    [`${y}-09-05`,"Teachers' Day",'event'],
    [`${y}-09-14`,'Hindi Diwas','event'],
    [`${y}-10-02`,'Gandhi Jayanti','holiday'],
    [`${y}-11-14`,"Children's Day",'event'],
    [`${y}-12-25`,'Christmas','holiday'],
    [`${y}-12-31`,"New Year's Eve",'event'],
  ];
}
/* Variable (lunar) festival dates per year — admin can fine-tune */
const _CAL_FEST = {
  2026:[
    ['2026-01-14','Makar Sankranti / Pongal','festival'],
    ['2026-01-23','Vasant Panchami','festival'],
    ['2026-02-15','Maha Shivratri','festival'],
    ['2026-03-02','Holika Dahan','festival'],
    ['2026-03-03','Holi','holiday'],
    ['2026-03-20','Eid-ul-Fitr','festival'],
    ['2026-03-26','Ram Navami','festival'],
    ['2026-03-31','Mahavir Jayanti','festival'],
    ['2026-04-03','Good Friday','holiday'],
    ['2026-04-05','Easter Sunday','festival'],
    ['2026-05-01','Buddha Purnima','festival'],
    ['2026-05-27','Bakrid (Eid al-Adha)','festival'],
    ['2026-06-25','Muharram','festival'],
    ['2026-07-29','Guru Purnima','festival'],
    ['2026-08-28','Raksha Bandhan','festival'],
    ['2026-09-04','Janmashtami','festival'],
    ['2026-09-14','Ganesh Chaturthi','festival'],
    ['2026-10-11','Navratri Begins','festival'],
    ['2026-10-20','Dussehra (Vijayadashami)','holiday'],
    ['2026-10-29','Karva Chauth','festival'],
    ['2026-11-08','Diwali','holiday'],
    ['2026-11-09','Govardhan Puja','festival'],
    ['2026-11-10','Bhai Dooj','festival'],
    ['2026-11-15','Chhath Puja','festival'],
    ['2026-11-24','Guru Nanak Jayanti','holiday'],
  ],
  2027:[
    ['2027-01-14','Makar Sankranti / Pongal','festival'],
    ['2027-02-06','Vasant Panchami','festival'],
    ['2027-03-06','Maha Shivratri','festival'],
    ['2027-03-22','Holi','holiday'],
    ['2027-04-15','Ram Navami','festival'],
    ['2027-08-15','Raksha Bandhan','festival'],
    ['2027-09-24','Janmashtami','festival'],
    ['2027-10-09','Dussehra (Vijayadashami)','holiday'],
    ['2027-10-29','Diwali','holiday'],
    ['2027-11-13','Guru Nanak Jayanti','holiday'],
  ],
};
function _calSeedList(y){ return _calFixedHolidays(y).concat(_CAL_FEST[y]||[]); }

function _calApplySeed(y, silent){
  const ev=_calEvents();
  const has=(date,title)=>ev.some(e=>e.date===date && (e.title||'').toLowerCase()===title.toLowerCase());
  let added=0;
  _calSeedList(y).forEach(([date,title,type])=>{
    if(!has(date,title)){ ev.push({id:genId('cev'),title,type,date,endDate:'',note:'',seeded:true}); added++; }
  });
  if(added){ _calSaveEvents(ev); }
  if(!silent && typeof toast==='function'){
    toast(added?('✅ Added '+added+' festivals & holidays for '+y):('All holidays for '+y+' already added'),'success');
  }
  return added;
}
function vmCalSeed(){ if(!_calEditable) return; _calApplySeed(_calY,false); vmCalRender(); }
function _calAutoSeed(){
  const meta=DB.getObj('calendar_meta')||{};
  // Re-seed (adds only missing) whenever the built-in list version changes
  if(meta.seedVersion === _CAL_SEED_VERSION) return;
  const y=new Date().getFullYear();
  _calApplySeed(y, true);
  DB.set('calendar_meta', Object.assign(meta,{seeded:true, seedVersion:_CAL_SEED_VERSION, seededYear:y}));
}

function _calEvents(){ return DB.get('calendar_events') || []; }
function _calSaveEvents(a){ DB.set('calendar_events', a); }
function _calPad(n){ return String(n).padStart(2,'0'); }
function _calDS(y,m,d){ return `${y}-${_calPad(m+1)}-${_calPad(d)}`; }
function _calForDate(ds){
  return _calEvents().filter(e=>{ const s=e.date, en=e.endDate||e.date; return ds>=s && ds<=en; });
}

function _calInjectCSS(){
  if (document.getElementById('_vmCalCSS')) return;
  const st=document.createElement('style'); st.id='_vmCalCSS';
  st.textContent=`
  .vmcal-wrap{--cg:rgba(255,255,255,.06);--cb:rgba(255,255,255,.12);}
  body.light-mode .vmcal-wrap{--cg:rgba(255,255,255,.55);--cb:rgba(0,0,0,.08);}
  .vmcal-card{background:var(--cg);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:1px solid var(--cb);border-radius:18px;padding:18px;box-shadow:0 8px 30px rgba(0,0,0,.18);}
  .vmcal-head{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:14px;}
  .vmcal-title{font-size:1.3rem;font-weight:800;}
  .vmcal-nav button{background:var(--cg);border:1px solid var(--cb);color:var(--text-1,#fff);width:38px;height:38px;border-radius:10px;cursor:pointer;font-size:1rem;}
  .vmcal-nav button:hover{background:rgba(124,58,237,.25);}
  .vmcal-legend{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px;}
  .vmcal-leg{display:flex;align-items:center;gap:5px;font-size:.74rem;background:var(--cg);border:1px solid var(--cb);border-radius:20px;padding:3px 10px;}
  .vmcal-dot{width:9px;height:9px;border-radius:50%;display:inline-block;}
  .vmcal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;}
  .vmcal-dow{text-align:center;font-size:.72rem;font-weight:700;color:var(--text-3,#94a3b8);padding:4px 0;text-transform:uppercase;letter-spacing:.05em;}
  .vmcal-cell{min-height:84px;border:1px solid var(--cb);border-radius:12px;padding:5px 6px;background:var(--cg);cursor:pointer;transition:all .12s;overflow:hidden;position:relative;}
  .vmcal-cell:hover{border-color:#7c3aed;transform:translateY(-1px);}
  .vmcal-cell.out{opacity:.32;}
  .vmcal-cell.today{border:2px solid #7c3aed;box-shadow:0 0 0 3px rgba(124,58,237,.18);}
  .vmcal-dnum{font-size:.82rem;font-weight:700;margin-bottom:3px;}
  .vmcal-cell.sun .vmcal-dnum{color:#ef4444;}
  .vmcal-chip{font-size:.62rem;font-weight:600;color:#fff;border-radius:5px;padding:1px 5px;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .vmcal-more{font-size:.6rem;color:var(--text-3,#94a3b8);font-weight:600;}
  @media(max-width:640px){.vmcal-cell{min-height:60px;}.vmcal-chip{font-size:.55rem;}}
  `;
  document.head.appendChild(st);
}

function vmCalMount(elId, opts){
  _calEl=elId; _calEditable=!!(opts && opts.editable);
  const t=new Date(); _calY=t.getFullYear(); _calM=t.getMonth();
  if(_calEditable){ try{ _calAutoSeed(); }catch(e){} }
  _calInjectCSS(); vmCalRender();
}
function vmCalNav(d){ _calM+=d; if(_calM<0){_calM=11;_calY--;} if(_calM>11){_calM=0;_calY++;} vmCalRender(); }
function vmCalToday(){ const t=new Date(); _calY=t.getFullYear(); _calM=t.getMonth(); vmCalRender(); }

function vmCalRender(){
  const el=document.getElementById(_calEl); if(!el) return;
  const first=new Date(_calY,_calM,1).getDay();
  const dim=new Date(_calY,_calM+1,0).getDate();
  const prevDim=new Date(_calY,_calM,0).getDate();
  const todayStr=_calDS(new Date().getFullYear(),new Date().getMonth(),new Date().getDate());

  let cells='';
  for(let i=0;i<42;i++){
    let d, mm=_calM, yy=_calY, out=false;
    if(i<first){ d=prevDim-first+1+i; mm=_calM-1; out=true; if(mm<0){mm=11;yy--;} }
    else if(i>=first+dim){ d=i-first-dim+1; mm=_calM+1; out=true; if(mm>11){mm=0;yy++;} }
    else d=i-first+1;
    const ds=_calDS(yy,mm,d);
    const evs=_calForDate(ds);
    const dow=new Date(yy,mm,d).getDay();
    const chips=evs.slice(0,2).map(e=>{ const c=CAL_CATS[e.type]||CAL_CATS.event; return `<div class="vmcal-chip" style="background:${c.color}" title="${esc(e.title)}">${c.icon} ${esc(e.title)}</div>`; }).join('');
    const more=evs.length>2?`<div class="vmcal-more">+${evs.length-2} more</div>`:'';
    cells+=`<div class="vmcal-cell ${out?'out':''} ${ds===todayStr?'today':''} ${dow===0?'sun':''}" onclick="vmCalDay('${ds}')">
      <div class="vmcal-dnum">${d}</div>${chips}${more}</div>`;
  }

  // Upcoming events (this month onward)
  const upcoming=_calEvents().filter(e=>(e.endDate||e.date)>=todayStr)
    .sort((a,b)=>a.date.localeCompare(b.date)).slice(0,6);

  el.innerHTML=`
  <div class="vmcal-wrap">
    <div class="vmcal-card">
      <div class="vmcal-head">
        <div class="vmcal-title">📅 ${_CAL_MONTHS[_calM]} ${_calY}</div>
        <div class="vmcal-nav" style="display:flex;gap:8px;align-items:center;">
          <button onclick="vmCalNav(-1)">‹</button>
          <button onclick="vmCalToday()" style="width:auto;padding:0 14px;font-size:.82rem;font-weight:700;">Today</button>
          <button onclick="vmCalNav(1)">›</button>
          ${_calEditable?`<button onclick="vmCalSeed()" title="Load Indian festivals & national holidays for ${_calY}" style="width:auto;padding:0 14px;font-size:.82rem;font-weight:700;background:#10b981;color:#fff;border:none;">🇮🇳 Load Holidays</button>`:''}
          ${_calEditable?`<button onclick="vmCalAdd('${_calDS(_calY,_calM,Math.min(new Date().getDate(),dim))}')" style="width:auto;padding:0 14px;font-size:.82rem;font-weight:700;background:#7c3aed;color:#fff;border:none;">➕ Add Event</button>`:''}
        </div>
      </div>
      <div class="vmcal-legend">
        ${Object.keys(CAL_CATS).map(k=>`<span class="vmcal-leg"><span class="vmcal-dot" style="background:${CAL_CATS[k].color}"></span>${CAL_CATS[k].icon} ${CAL_CATS[k].label}</span>`).join('')}
      </div>
      <div class="vmcal-grid">
        ${_CAL_DOW.map(d=>`<div class="vmcal-dow">${d}</div>`).join('')}
        ${cells}
      </div>
    </div>

    <div class="vmcal-card" style="margin-top:16px;">
      <div style="font-weight:800;margin-bottom:12px;">🔔 Upcoming Events</div>
      ${upcoming.length?upcoming.map(e=>{const c=CAL_CATS[e.type]||CAL_CATS.event;return `
        <div onclick="vmCalDay('${e.date}')" style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--cb);cursor:pointer;">
          <div style="width:46px;text-align:center;flex-shrink:0;">
            <div style="font-size:1.3rem;font-weight:800;line-height:1;color:${c.color}">${new Date(e.date).getDate()}</div>
            <div style="font-size:.62rem;color:var(--text-3,#94a3b8);text-transform:uppercase;">${_CAL_MONTHS[new Date(e.date).getMonth()].slice(0,3)}</div>
          </div>
          <div style="flex:1;min-width:0;">
            <div style="font-weight:700;">${c.icon} ${esc(e.title)}</div>
            <div style="font-size:.72rem;color:var(--text-3,#94a3b8);">${c.label}${e.endDate&&e.endDate!==e.date?' · till '+formatDate(e.endDate):''}${e.note?' · '+esc(e.note):''}</div>
          </div>
          <span class="vmcal-dot" style="background:${c.color};width:12px;height:12px;"></span>
        </div>`;}).join(''):'<div style="color:var(--text-3,#94a3b8);padding:8px 0;">No upcoming events.</div>'}
    </div>
  </div>`;
}

/* ── Day view modal ── */
function _calModal(html){
  const r=document.getElementById('modals-root'); if(!r) return;
  r.innerHTML=`<div class="modal-overlay open" id="calModal" style="display:flex;align-items:flex-start;justify-content:center;overflow-y:auto;padding:24px 12px;z-index:1000;">${html}</div>`;
  document.body.style.overflow='hidden';
}
function vmCalCloseModal(){ const m=document.getElementById('calModal'); if(m) m.remove(); document.body.style.overflow=''; }

function vmCalDay(ds){
  const evs=_calForDate(ds);
  const d=new Date(ds);
  _calModal(`
  <div style="background:var(--bg-1,#12121a);border-radius:16px;max-width:440px;width:96%;margin:auto;overflow:hidden;border:1px solid var(--border,rgba(255,255,255,.1));">
    <div style="background:linear-gradient(135deg,#7c3aed,#3b82f6);padding:14px 18px;display:flex;align-items:center;justify-content:space-between;">
      <div style="color:#fff;font-weight:800;">📅 ${_CAL_DOW[d.getDay()]}, ${formatDate(ds)}</div>
      <button onclick="vmCalCloseModal()" style="background:rgba(255,255,255,.2);border:none;width:30px;height:30px;border-radius:50%;cursor:pointer;color:#fff;">✕</button>
    </div>
    <div style="padding:16px;">
      ${evs.length?evs.map(e=>{const c=CAL_CATS[e.type]||CAL_CATS.event;return `
        <div style="display:flex;align-items:flex-start;gap:10px;padding:10px;border-left:4px solid ${c.color};background:var(--glass,rgba(255,255,255,.05));border-radius:8px;margin-bottom:10px;">
          <div style="flex:1;">
            <div style="font-weight:700;">${c.icon} ${esc(e.title)}</div>
            <div style="font-size:.72rem;color:var(--text-3,#94a3b8);">${c.label}${e.endDate&&e.endDate!==e.date?' · '+formatDate(e.date)+' → '+formatDate(e.endDate):''}</div>
            ${e.note?`<div style="font-size:.8rem;margin-top:4px;color:var(--text-2,#cbd5e1);">${esc(e.note)}</div>`:''}
          </div>
          ${_calEditable?`<div style="display:flex;gap:6px;flex-shrink:0;">
            <button onclick="vmCalEdit('${e.id}')" style="background:rgba(124,58,237,.2);border:none;border-radius:6px;width:30px;height:30px;cursor:pointer;">✏️</button>
            <button onclick="vmCalDelete('${e.id}')" style="background:rgba(239,68,68,.2);border:none;border-radius:6px;width:30px;height:30px;cursor:pointer;">🗑️</button>
          </div>`:''}
        </div>`;}).join(''):'<div style="color:var(--text-3,#94a3b8);text-align:center;padding:20px;">No events on this day.</div>'}
      ${_calEditable?`<button class="btn btn-primary" style="width:100%;margin-top:6px;" onclick="vmCalAdd('${ds}')">➕ Add Event on this day</button>`:''}
    </div>
  </div>`);
}

/* ── Add / Edit event form (admin only) ── */
function vmCalAdd(ds){ if(!_calEditable) return; _calEditId=null; _calEditDate=ds; _calForm(); }
function vmCalEdit(id){ if(!_calEditable) return; _calEditId=id; _calForm(); }
function vmCalDelete(id){
  if(!_calEditable) return;
  if(!confirm('Delete this event?')) return;
  _calSaveEvents(_calEvents().filter(e=>e.id!==id));
  toast('Event deleted','success'); vmCalCloseModal(); vmCalRender();
}
function _calForm(){
  const ev=_calEditId?_calEvents().find(x=>x.id===_calEditId):null;
  const date=ev?ev.date:(_calEditDate||_calDS(_calY,_calM,1));
  _calModal(`
  <div style="background:var(--bg-1,#12121a);border-radius:16px;max-width:440px;width:96%;margin:auto;overflow:hidden;border:1px solid var(--border,rgba(255,255,255,.1));">
    <div style="background:linear-gradient(135deg,#7c3aed,#3b82f6);padding:14px 18px;display:flex;align-items:center;justify-content:space-between;">
      <div style="color:#fff;font-weight:800;">${ev?'✏️ Edit Event':'➕ Add Event'}</div>
      <button onclick="vmCalCloseModal()" style="background:rgba(255,255,255,.2);border:none;width:30px;height:30px;border-radius:50%;cursor:pointer;color:#fff;">✕</button>
    </div>
    <div style="padding:16px;">
      <div class="form-group"><label class="form-label">Event Title *</label>
        <input class="form-control" id="cal-title" placeholder="e.g. Diwali Holiday" value="${ev?esc(ev.title):''}"></div>
      <div class="form-group"><label class="form-label">Category</label>
        <select class="form-control" id="cal-type">
          ${Object.keys(CAL_CATS).map(k=>`<option value="${k}" ${ev&&ev.type===k?'selected':''}>${CAL_CATS[k].icon} ${CAL_CATS[k].label}</option>`).join('')}
        </select></div>
      <div class="form-row" style="display:flex;gap:10px;">
        <div class="form-group" style="flex:1;"><label class="form-label">Start Date *</label>
          <input class="form-control" type="date" id="cal-date" value="${date}"></div>
        <div class="form-group" style="flex:1;"><label class="form-label">End Date <span class="text-muted">(optional)</span></label>
          <input class="form-control" type="date" id="cal-enddate" value="${ev&&ev.endDate?ev.endDate:''}"></div>
      </div>
      <div class="form-group"><label class="form-label">Note <span class="text-muted">(optional)</span></label>
        <textarea class="form-control" id="cal-note" rows="2" placeholder="Details…">${ev?esc(ev.note||''):''}</textarea></div>
      <button class="btn btn-primary" style="width:100%;" onclick="vmCalSave()">💾 Save Event</button>
    </div>
  </div>`);
}
function vmCalSave(){
  const title=(document.getElementById('cal-title').value||'').trim();
  const type=document.getElementById('cal-type').value;
  const date=document.getElementById('cal-date').value;
  let endDate=document.getElementById('cal-enddate').value||'';
  const note=(document.getElementById('cal-note').value||'').trim();
  if(!title||!date){ toast('Title and date are required','warning'); return; }
  if(endDate && endDate<date) endDate=date;
  const arr=_calEvents();
  if(_calEditId){
    const i=arr.findIndex(x=>x.id===_calEditId);
    if(i>-1) arr[i]={...arr[i],title,type,date,endDate,note};
  } else {
    arr.push({id:genId('cev'),title,type,date,endDate,note});
  }
  _calSaveEvents(arr);
  toast('✅ Event saved','success'); vmCalCloseModal(); vmCalRender();
}
