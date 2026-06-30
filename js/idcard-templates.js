/* ═══════════════════════════════════════════════════════════════
   ID CARD TEMPLATES — shared by Admin (pick/print) + Student/Parent (view).
   The admin-selected design is saved in DB 'idcard_design' and shown to parents.
═══════════════════════════════════════════════════════════════ */
function idCardSel(){ try{ return (DB.getObj('idcard_design').sel) || 'p1'; }catch(e){ return 'p1'; } }
function idCardSetSel(sel){ DB.set('idcard_design', { sel }); }
function _idGenQR(text, size){
  if(!window.QRCode) return null;
  const wrap=document.createElement('div');
  wrap.style.cssText='position:fixed;left:-9999px;top:-9999px;';
  document.body.appendChild(wrap);
  try{ new QRCode(wrap,{text,width:size,height:size,colorDark:'#000',colorLight:'#fff',correctLevel:QRCode.CorrectLevel.M});
    const cv=wrap.querySelector('canvas'); const u=cv?cv.toDataURL('image/png'):(wrap.querySelector('img')?wrap.querySelector('img').src:null);
    document.body.removeChild(wrap); return u;
  }catch(e){ try{document.body.removeChild(wrap);}catch(_){} return null; }
}

// ── 14 premium ID-card design themes (shared by picker + builder) ──
const ID_THEMES = {
  royal:   { label:'Royal',    grad:'linear-gradient(135deg,#4c1d95 0%,#1e3a5f 100%)', accent:'#a78bfa', stripe:'#6d28d9', badge:'#ddd6fe', badgeText:'#4c1d95' },
  ocean:   { label:'Ocean',    grad:'linear-gradient(135deg,#0c4a6e 0%,#065f46 100%)', accent:'#34d399', stripe:'#059669', badge:'#d1fae5', badgeText:'#065f46' },
  forest:  { label:'Forest',   grad:'linear-gradient(135deg,#14532d 0%,#1e3a5f 100%)', accent:'#6ee7b7', stripe:'#10b981', badge:'#d1fae5', badgeText:'#14532d' },
  sunset:  { label:'Sunset',   grad:'linear-gradient(135deg,#7c2d12 0%,#1e3a5f 100%)', accent:'#fbbf24', stripe:'#d97706', badge:'#fef3c7', badgeText:'#7c2d12' },
  crimson: { label:'Crimson',  grad:'linear-gradient(135deg,#7f1d1d 0%,#b45309 100%)', accent:'#fca5a5', stripe:'#b91c1c', badge:'#fee2e2', badgeText:'#7f1d1d' },
  navy:    { label:'Navy Corp',grad:'linear-gradient(135deg,#0f172a 0%,#1e3a8a 100%)', accent:'#60a5fa', stripe:'#1d4ed8', badge:'#dbeafe', badgeText:'#1e3a8a' },
  teal:    { label:'Teal',     grad:'linear-gradient(135deg,#134e4a 0%,#0e7490 100%)', accent:'#5eead4', stripe:'#0d9488', badge:'#ccfbf1', badgeText:'#134e4a' },
  grape:   { label:'Grape',    grad:'linear-gradient(135deg,#581c87 0%,#be185d 100%)', accent:'#f0abfc', stripe:'#a21caf', badge:'#fae8ff', badgeText:'#581c87' },
  charcoal:{ label:'Black Gold',grad:'linear-gradient(135deg,#0a0a0a 0%,#262626 100%)',accent:'#facc15', stripe:'#a16207', badge:'#fef9c3', badgeText:'#713f12' },
  maroon:  { label:'Maroon',   grad:'linear-gradient(135deg,#581c2c 0%,#7c2d12 100%)', accent:'#fda4af', stripe:'#9f1239', badge:'#ffe4e6', badgeText:'#881337' },
  indigo:  { label:'Indigo',   grad:'linear-gradient(135deg,#312e81 0%,#0e7490 100%)', accent:'#818cf8', stripe:'#4f46e5', badge:'#e0e7ff', badgeText:'#312e81' },
  rose:    { label:'Rose',     grad:'linear-gradient(135deg,#9d174d 0%,#7c3aed 100%)', accent:'#fb7185', stripe:'#e11d48', badge:'#ffe4e6', badgeText:'#9d174d' },
  amber:   { label:'Amber',    grad:'linear-gradient(135deg,#92400e 0%,#854d0e 100%)', accent:'#fcd34d', stripe:'#d97706', badge:'#fef3c7', badgeText:'#78350f' },
  slate:   { label:'Slate',    grad:'linear-gradient(135deg,#334155 0%,#0ea5e9 100%)', accent:'#7dd3fc', stripe:'#0284c7', badge:'#e2e8f0', badgeText:'#334155' },
};

// ── Professional portrait ID-card layouts (lanyard style) ──
const ID_LAYOUTS = {
  p1:  { label:'Beige Classic', base:'beige', c1:'#a98467', c2:'#cbb293', text:'#5b4636' },
  p2:  { label:'Pink Petal',    base:'pink',  c1:'#ec4899', c2:'#be185d', text:'#9d174d' },
  p3:  { label:'Purple Wave',   base:'wave',  c1:'#6d28d9', c2:'#a855f7', accent:'#f97316', text:'#3b0764' },
  p4:  { label:'Blue Corporate',base:'corp',  c1:'#1d4ed8', c2:'#3b82f6', text:'#1e3a8a' },
  p5:  { label:'Festive Arch',  base:'arch',  c1:'#b91c1c', c2:'#f59e0b', accent:'#1d4ed8', text:'#7f1d1d' },
  p6:  { label:'Teal Wave',     base:'wave',  c1:'#0d9488', c2:'#2dd4bf', accent:'#f59e0b', text:'#134e4a' },
  p7:  { label:'Green Corporate',base:'corp', c1:'#15803d', c2:'#22c55e', text:'#14532d' },
  p8:  { label:'Maroon Arch',   base:'arch',  c1:'#831843', c2:'#be185d', accent:'#a16207', text:'#831843' },
  p9:  { label:'Navy Petal',    base:'pink',  c1:'#1e3a8a', c2:'#2563eb', text:'#1e3a8a' },
  p10: { label:'Gold Beige',    base:'beige', c1:'#8a6d3b', c2:'#c9a227', text:'#5b4636' },
};

function _idQR(st, embedQR, size){
  if(embedQR){ const u=_idGenQR('VM:STU:'+st.id, size); return u?`<img src="${u}" style="width:${size}px;height:${size}px;display:block;">`:''; }
  return `<div id="qra-${st.id}" style="width:${size}px;height:${size}px;line-height:0;overflow:hidden;background:#fff;"></div>`;
}
function _idPhoto(st, w, h, radius, border){
  return st.photo
    ? `<img src="${st.photo}" style="width:${w}px;height:${h}px;object-fit:cover;border-radius:${radius};${border||''}">`
    : `<div style="width:${w}px;height:${h}px;border-radius:${radius};${border||''}background:#e5e7eb;display:flex;align-items:center;justify-content:center;font-size:1.6rem;color:#9ca3af;">${(st.name||'?')[0].toUpperCase()}</div>`;
}
function _idLogo(s, size){
  return s&&s.schoolLogo
    ? `<img src="${s.schoolLogo}" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:contain;background:#fff;padding:3px;box-shadow:0 1px 4px rgba(0,0,0,.15);">`
    : `<div style="width:${size}px;height:${size}px;border-radius:50%;background:rgba(255,255,255,.25);display:flex;align-items:center;justify-content:center;font-size:${Math.round(size*0.5)}px;">🎓</div>`;
}
function _idRows(pairs, labelColor, valColor, sep){
  return pairs.filter(p=>p[1]).map(p=>`<div style="display:flex;font-size:.74rem;margin-bottom:5px;">
    <span style="min-width:96px;font-weight:600;color:${labelColor};">${esc(p[0])}</span>
    <span style="color:${labelColor};">${sep||':'}</span>
    <span style="flex:1;font-weight:700;color:${valColor};padding-left:6px;">${esc(p[1])}</span></div>`).join('');
}

function _idPortrait(st, cls, s, embedQR, P){
  const school=(s&&s.schoolName)||'School Name';
  const tagline=(s&&s.schoolTagline)||'';
  const phone=(s&&s.schoolPhone)||'';
  const email=(s&&s.schoolEmail)||'';
  const ay=(s&&s.academicYear)||'';
  const className=cls?cls.name:'—';
  const reg=st.admissionNo||st.scholarNo||st.rollNo||'';
  const base=P.base;
  const wrap=(inner)=>`<div style="width:330px;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 10px 34px rgba(0,0,0,.35);font-family:'Segoe UI',Arial,sans-serif;position:relative;">${inner}</div>`;

  // ── BEIGE CLASSIC (vertical side label, photo center) ──
  if(base==='beige'){
    return wrap(`
      <div style="background:linear-gradient(135deg,${P.c1},${P.c2});padding:16px 18px 60px;display:flex;align-items:center;gap:12px;color:#fff;">
        <div style="width:54px;height:54px;border-radius:50%;background:rgba(255,255,255,.92);display:flex;align-items:center;justify-content:center;flex-shrink:0;">${_idLogo(s,42)}</div>
        <div style="text-align:right;flex:1;"><div style="font-size:.7rem;letter-spacing:.1em;opacity:.85;">SCHOOL YEAR</div><div style="font-size:1.2rem;font-weight:800;">${esc(ay||'—')}</div></div>
      </div>
      <div style="display:flex;margin-top:-44px;">
        <div style="writing-mode:vertical-rl;transform:rotate(180deg);background:${P.c1};color:#fff;font-weight:800;letter-spacing:.12em;font-size:.8rem;text-align:center;padding:14px 8px;">STUDENT IDENTITY CARD</div>
        <div style="flex:1;padding:12px;">
          <div style="display:flex;justify-content:center;">${_idPhoto(st,150,170,'10px','border:4px solid #fff;box-shadow:0 4px 14px rgba(0,0,0,.2);')}</div>
        </div>
      </div>
      <div style="padding:8px 18px 16px 70px;">
        ${_idRows([['NAME',(st.name||'').toUpperCase()],['DATE OF BIRTH',st.dob?formatDate(st.dob):''],['CLASS',className],['ROLL NO',st.rollNo]], P.c1, P.text)}
        <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:8px;">
          <div style="font-size:.7rem;color:${P.text};font-weight:700;">${esc(school)}</div>
          ${_idQR(st,embedQR,52)}
        </div>
      </div>`);
  }
  // ── PINK PETAL (circle photo + tick markers) ──
  if(base==='pink'){
    return wrap(`
      <div style="position:relative;padding:18px 18px 0;text-align:center;">
        <div style="position:absolute;top:0;left:0;right:0;height:120px;background:linear-gradient(135deg,${P.c2}22,${P.c1}11);"></div>
        <div style="position:relative;display:flex;align-items:center;gap:8px;justify-content:flex-start;">${_idLogo(s,34)}<span style="font-size:.7rem;color:${P.text};font-weight:700;">${esc(ay?'Reg. No. '+reg:'')}</span></div>
        <div style="position:relative;display:flex;justify-content:center;margin-top:6px;">${_idPhoto(st,120,120,'50%','border:5px solid '+P.c1+';box-shadow:0 4px 14px rgba(0,0,0,.18);')}</div>
        <div style="position:relative;margin-top:8px;font-size:1.2rem;font-weight:900;color:${P.text};letter-spacing:.5px;">${esc((st.name||'').toUpperCase())}</div>
        <div style="position:relative;font-size:.8rem;font-weight:800;color:${P.c1};border-bottom:2px solid ${P.c1};display:inline-block;padding-bottom:2px;">CLASS - ${esc(className)}</div>
      </div>
      <div style="padding:12px 22px 4px;">
        ${[["Father's name",st.fatherName],["Mother's name",st.motherName],["Address",st.address]].filter(p=>p[1]).map(p=>`<div style="display:flex;gap:8px;font-size:.8rem;margin-bottom:6px;"><span style="width:6px;background:${P.c1};border-radius:3px;flex-shrink:0;"></span><span style="min-width:100px;color:${P.text};font-weight:600;">${esc(p[0])}</span><span style="flex:1;color:#374151;">- ${esc(p[1])}</span></div>`).join('')}
        ${phone?`<div style="text-align:center;color:#2563eb;font-weight:800;margin:6px 0;">📞 ${esc(phone)}</div>`:''}
      </div>
      <div style="border-top:2px dashed ${P.c1}55;margin:0 18px;"></div>
      <div style="padding:10px 18px 16px;text-align:center;">
        <div style="font-size:1.05rem;font-weight:900;color:${P.text};">${esc(school)}</div>
        ${email?`<div style="font-size:.74rem;color:${P.c1};">✉️ ${esc(email)}</div>`:''}
        <div style="display:flex;justify-content:center;margin-top:8px;">${_idQR(st,embedQR,54)}</div>
      </div>`);
  }
  // ── PURPLE/COLOR WAVE (top banner + ID CARD pill + principal) ──
  if(base==='wave'){
    const acc=P.accent||P.c2;
    return wrap(`
      <div style="background:linear-gradient(135deg,${P.c1},${P.c2});padding:14px 16px 34px;text-align:center;color:#fff;position:relative;">
        <div style="display:flex;align-items:center;gap:10px;justify-content:center;">${_idLogo(s,40)}<div><div style="font-size:1.05rem;font-weight:900;line-height:1.1;">${esc(school)}</div>${tagline?`<div style="font-size:.62rem;opacity:.85;">${esc(tagline)}</div>`:''}</div></div>
      </div>
      <div style="height:0;border-top:30px solid ${P.c2};border-right:330px solid transparent;"></div>
      <div style="margin-top:-58px;text-align:center;position:relative;">
        <div style="display:flex;justify-content:center;">${_idPhoto(st,120,140,'12px','border:4px solid '+acc+';box-shadow:0 4px 14px rgba(0,0,0,.2);')}</div>
        <div style="display:inline-block;background:${P.c1};color:#fff;font-weight:800;letter-spacing:.1em;padding:4px 22px;border-radius:8px;margin-top:8px;">ID CARD</div>
      </div>
      <div style="padding:12px 22px 6px;">
        ${_idRows([['Name',(st.name||'').toUpperCase()],['Class',className],['Roll',st.rollNo],['Session',ay],['Date Of Birth',st.dob?formatDate(st.dob):''],['Blood Group',st.bloodGroup],['Mobile',st.phone]], P.c1, P.text)}
      </div>
      <div style="background:linear-gradient(135deg,${acc},${P.c2});padding:10px 18px;display:flex;justify-content:space-between;align-items:center;color:#fff;">
        <div style="background:#fff;padding:3px;border-radius:6px;">${_idQR(st,embedQR,46)}</div>
        <div style="text-align:right;"><div style="border-top:1.5px solid rgba(255,255,255,.7);padding-top:3px;font-size:.72rem;font-weight:700;">Principal</div></div>
      </div>`);
  }
  // ── BLUE CORPORATE (diagonal side vertical text + barcode) ──
  if(base==='corp'){
    return wrap(`
      <div style="position:relative;background:#fff;min-height:520px;">
        <div style="position:absolute;left:0;top:0;bottom:0;width:64px;background:linear-gradient(160deg,${P.c1},${P.c2});clip-path:polygon(0 0,100% 0,60% 100%,0 100%);"></div>
        <div style="position:absolute;left:6px;top:0;bottom:0;display:flex;align-items:center;">
          <div style="writing-mode:vertical-rl;transform:rotate(180deg);color:#fff;font-weight:900;letter-spacing:.18em;font-size:1.05rem;">STUDENT ID CARD</div>
        </div>
        <div style="padding:18px 18px 18px 74px;text-align:center;">
          <div style="display:flex;justify-content:center;">${_idLogo(s,40)}</div>
          <div style="font-size:1rem;font-weight:900;color:#111;margin:4px 0 10px;">${esc(school)}</div>
          <div style="display:flex;justify-content:center;">${_idPhoto(st,130,150,'8px','border:4px solid '+P.c1+';')}</div>
          <div style="text-align:left;margin-top:12px;">
            ${_idRows([['Name',(st.name||'').toUpperCase()],["Father's Name",st.fatherName],["Mother's Name",st.motherName],['Class',className],['Roll No',st.rollNo],['Academic Year',ay],['Blood Group',st.bloodGroup]], P.c1, '#111')}
          </div>
          <div style="display:flex;justify-content:center;margin-top:10px;">${_idQR(st,embedQR,54)}</div>
        </div>
      </div>`);
  }
  // ── FESTIVE ARCH (decorative top + name badge + principal) ──
  const acc=P.accent||P.c2;
  return wrap(`
    <div style="background:linear-gradient(135deg,${P.c1},${P.c2});padding:16px 16px 40px;text-align:center;color:#fff;position:relative;">
      <div style="position:absolute;top:10px;right:14px;background:rgba(255,255,255,.2);border-radius:8px;padding:2px 8px;font-size:.62rem;font-weight:700;">${esc(ay||'')}</div>
      <div style="display:flex;justify-content:center;margin-bottom:4px;">${_idLogo(s,46)}</div>
      <div style="font-size:1.15rem;font-weight:900;line-height:1.1;">${esc(school)}</div>
      ${tagline?`<div style="font-size:.62rem;opacity:.9;">${esc(tagline)}</div>`:''}
    </div>
    <div style="background:#fff;border-radius:50% 50% 0 0/40px 40px 0 0;margin-top:-30px;padding:14px;text-align:center;position:relative;">
      <div style="display:flex;justify-content:center;">${_idPhoto(st,116,134,'10px','border:4px solid '+acc+';box-shadow:0 4px 14px rgba(0,0,0,.18);')}</div>
      <div style="font-size:1.1rem;font-weight:900;color:${P.c1};margin-top:8px;">${esc(st.name||'')}</div>
      <div style="display:inline-block;background:${acc};color:#fff;font-weight:800;padding:2px 16px;border-radius:6px;font-size:.78rem;">CLASS - ${esc(className)}</div>
      <div style="text-align:left;padding:12px 16px 4px;">
        ${[["Father Name",st.fatherName],["Mother Name",st.motherName],["Date of Birth",st.dob?formatDate(st.dob):''],["Mobile No.",st.phone],["Address",st.address]].filter(p=>p[1]).map(p=>`<div style="font-size:.76rem;margin-bottom:5px;color:#374151;"><span style="display:inline-block;min-width:104px;font-weight:700;color:${P.c1};">${esc(p[0])}</span>- ${esc(p[1])}</div>`).join('')}
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 16px 0;">
        ${phone?`<div style="background:${acc};color:#fff;border-radius:20px;padding:4px 14px;font-weight:800;font-size:.78rem;">📞 ${esc(phone)}</div>`:'<div></div>'}
        <div style="text-align:center;"><div style="font-size:.72rem;font-weight:700;color:${P.text};border-top:1.5px solid #94a3b8;padding-top:2px;">Principal</div></div>
      </div>
      <div style="display:flex;justify-content:center;margin-top:8px;">${_idQR(st,embedQR,50)}</div>
    </div>`);
}

function buildIDCard(st, classes, s, embedQR) {
  const cls = classes.find(c=>c.id===st.classId);
  const sel = window._idSel || idCardSel();
  if (ID_LAYOUTS[sel]) return _idPortrait(st, cls, s, embedQR, ID_LAYOUTS[sel]);
  const th = (ID_THEMES[sel] ? sel : 'royal');
  const t = ID_THEMES[th] || ID_THEMES.royal;
  const initials = st.name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2);
  const acYear = (s && s.academicYear) ? s.academicYear : '';
  const school = (s && s.schoolName) ? s.schoolName : 'School';
  const tagline = (s && s.schoolTagline) ? s.schoolTagline : '';
  const schoolLogoHtml = (s && s.schoolLogo)
    ? `<img src="${s.schoolLogo}" style="width:36px;height:36px;border-radius:50%;object-fit:contain;background:#fff;padding:2px;flex-shrink:0">`
    : `<div style="width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,.15);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">🎓</div>`;
  const studentPhotoHtml = st.photo
    ? `<img src="${st.photo}" style="width:68px;height:68px;border-radius:50%;object-fit:cover;border:3px solid rgba(255,255,255,.5);flex-shrink:0;">`
    : `<div style="width:68px;height:68px;border-radius:50%;background:rgba(255,255,255,.15);border:3px solid rgba(255,255,255,.3);display:flex;align-items:center;justify-content:center;font-size:1.5rem;font-weight:800;color:#fff;flex-shrink:0;letter-spacing:-1px;">${initials}</div>`;

  return `<div style="
    width:300px;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,.5);
    font-family:'Segoe UI',Arial,sans-serif;flex-shrink:0;
    border:2px solid ${t.stripe};">

    <!-- Header -->
    <div style="background:${t.grad};padding:18px 20px 14px;position:relative;overflow:hidden;">
      <!-- Decorative circles -->
      <div style="position:absolute;top:-30px;right:-30px;width:100px;height:100px;border-radius:50%;background:rgba(255,255,255,.06);"></div>
      <div style="position:absolute;bottom:-20px;left:-20px;width:80px;height:80px;border-radius:50%;background:rgba(255,255,255,.04);"></div>

      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;position:relative;">
        ${schoolLogoHtml}
        <div style="min-width:0;">
          <div style="font-weight:800;font-size:.85rem;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${school}</div>
          ${tagline ? `<div style="font-size:.65rem;color:rgba(255,255,255,.55);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${tagline}</div>` : ''}
        </div>
        <div style="margin-left:auto;background:${t.badge};color:${t.badgeText};font-size:.6rem;font-weight:800;padding:2px 8px;border-radius:20px;white-space:nowrap;flex-shrink:0;">STUDENT ID</div>
      </div>

      <!-- Photo + Name -->
      <div style="display:flex;align-items:center;gap:14px;position:relative;">
        ${studentPhotoHtml}
        <div style="min-width:0;">
          <div style="font-size:1.05rem;font-weight:800;color:#fff;line-height:1.2;">${st.name}</div>
          <div style="font-size:.78rem;color:${t.accent};font-weight:600;margin-top:3px;">${cls?cls.name:'—'}</div>
          <div style="margin-top:5px;display:inline-block;background:rgba(255,255,255,.15);border-radius:6px;padding:2px 10px;">
            <span style="font-size:.7rem;color:rgba(255,255,255,.8);">Roll No: </span>
            <span style="font-size:.75rem;font-weight:700;color:#fff;">${st.rollNo||'—'}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Colored divider bar -->
    <div style="height:4px;background:linear-gradient(to right,${t.stripe},${t.accent},${t.stripe});"></div>

    <!-- Body -->
    <div style="background:#ffffff;padding:14px 18px;">
      ${[
        ['DOB', formatDate(st.dob)||'—'],
        ["Father's Name", st.fatherName||'—'],
        ['Phone', st.phone||'—'],
        ['Address', (st.address||'—').slice(0,30)+(st.address&&st.address.length>30?'…':'')],
      ].map(([k,v])=>`
        <div style="display:flex;align-items:baseline;margin-bottom:7px;padding-bottom:7px;border-bottom:1px solid #f1f5f9;">
          <span style="font-size:.68rem;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;width:90px;flex-shrink:0;">${k}</span>
          <span style="font-size:.8rem;font-weight:600;color:#1e293b;">${v}</span>
        </div>`).join('')}
    </div>

    <!-- QR Code strip (scan to mark attendance) -->
    <div style="background:#f8fafc;padding:10px 18px;display:flex;align-items:center;justify-content:space-between;border-top:1px solid #f1f5f9;">
      <div>
        <div style="font-size:.58rem;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Scan to Mark Attendance</div>
        ${(()=>{
          if (embedQR) {
            const qrUrl = _idGenQR('VM:STU:'+st.id, 68);
            return qrUrl
              ? `<img src="${qrUrl}" style="width:68px;height:68px;border-radius:4px;display:block;">`
              : `<div style="width:68px;height:68px;border-radius:4px;background:#f0f0f0;display:flex;align-items:center;justify-content:center;font-size:9px;color:#999;text-align:center;">QR</div>`;
          }
          return `<div id="qra-${st.id}" style="width:68px;height:68px;line-height:0;overflow:hidden;border-radius:4px;background:#fff;"></div>`;
        })()}
      </div>
      <div style="text-align:right;">
        <div style="font-size:.58rem;color:#94a3b8;text-transform:uppercase;margin-bottom:2px;">Student ID</div>
        <div style="font-size:.62rem;font-weight:800;color:#334155;font-family:monospace;">${st.id.slice(-8).toUpperCase()}</div>
        <div style="font-size:.58rem;color:#94a3b8;margin-top:6px;text-transform:uppercase;">Roll No</div>
        <div style="font-size:.78rem;font-weight:800;color:#1e293b;">${st.rollNo||'—'}</div>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:${t.badge};padding:8px 18px;display:flex;justify-content:space-between;align-items:center;">
      <span style="font-size:.65rem;font-weight:700;color:${t.badgeText};letter-spacing:.04em;">AY: ${acYear}</span>
      <span style="font-size:.65rem;color:${t.badgeText};opacity:.7;">${s&&s.schoolPhone?s.schoolPhone:s&&s.schoolEmail?s.schoolEmail:''}</span>
    </div>
  </div>`;
}
