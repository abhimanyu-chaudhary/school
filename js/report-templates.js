/* ═══════════════════════════════════════════════════════════════
   REPORT CARD TEMPLATES — shared by Admin (generate) + Student/Parent (view)
   + public verifier (report.html via QR scan).
   The admin-selected template id + per-student details live in DB
   'report_config' and 'report_overrides', mirrored to the server so
   parents (and QR scanners) see exactly what the admin set.
═══════════════════════════════════════════════════════════════ */

const RC_TEMPLATES = [
  { id:'t1', name:'Blue Progress Report',     accent:'#1d4ed8', tag:'Term-wise · Scholastic + Co-Scholastic', desc:'Classic blue board-style progress report with full info table, co-scholastic, discipline, attendance, rank & 9-point grading scale.' },
  { id:'t2', name:'CBSE Green Record Card',   accent:'#15803d', tag:'CBSE style · Green banner', desc:'CBSE "Record of Academic Performance" layout with green header band, grading system footer and affiliation details.' },
  { id:'t3', name:'Marksheet cum Certificate',accent:'#b91c1c', tag:'Max + Obtained columns', desc:'Marksheet-cum-certificate with Max / Obtained columns, division, rank & co-scholastic areas.' },
  { id:'t4', name:'Beige Record Sheet',       accent:'#92400e', tag:'State board · Record sheet', desc:'Warm beige record sheet with scholar/SSSM/Aadhaar row, evaluation + personal-social skills.' },
  { id:'t5', name:'Classic Purple',           accent:'#6d28d9', tag:'Advanced · Clean', desc:'Clean professional report card with full details, summary band, QR & signatures.' },
  { id:'t6', name:'Modern Minimal',           accent:'#0f172a', tag:'Advanced · Minimalist', desc:'Minimalist layout with accent line, complete details and a crisp summary band.' },
  { id:'t7', name:'Premium Gradient',         accent:'#7c3aed', tag:'Advanced · Gradient', desc:'Premium gradient header with performance ring, full info, discipline & QR verification.' },
  { id:'t8',  name:'Pre-Primary · Progress Card', accent:'#dc2626', tag:'Kids · Colorful', desc:'Festive pre-primary progress card with star, balloons, CONGRATULATIONS banner, term columns, grade & promoted-to.' },
  { id:'t9',  name:'Pre-Primary · Blue Joy',      accent:'#0ea5e9', tag:'Kids · Term marks', desc:'Bright blue kids report with info boxes, term-wise marks, result, position & rainbow footer.' },
  { id:'t10', name:'Pre-Primary · Orange Scholastic', accent:'#ea580c', tag:'Kids · Scholastic areas', desc:'Orange/maroon scholastic-areas card with Term-1/Term-2/Overall, grading scale & remarks.' },
  { id:'t11', name:'Pre-Primary · Star Kinder',   accent:'#9333ea', tag:'Kids · Playful stars', desc:'Playful kindergarten card with big star grade, pastel subject chips & cheerful design.' },
  { id:'t12', name:'Pre-Primary · Rainbow',       accent:'#16a34a', tag:'Kids · Rainbow', desc:'Cheerful rainbow primary report with colorful subject rows, total, grade & signatures.' },
];

/* ── Config (persisted, mirrored to server) ── */
function rcGetConfig() {
  const d = {
    template: 't1',
    publishedExam: '',     // '' = consolidate all exams; else specific exam name
    coScholastic: ['Work Education','Art Education','Health & Physical Education'],
    discipline:   ['Discipline','Punctuality','Neatness','Behaviour'],
    grader: 'Class Teacher',
    defaultRemark: 'Keep up the good work!',
    showQR: true,
    showRank: true,
  };
  return Object.assign(d, DB.getObj('report_config') || {});
}
function rcSetConfig(patch) { DB.set('report_config', Object.assign(rcGetConfig(), patch)); }

/* ── Per-student overrides (remark, co-scholastic/discipline grades, manual rank) ── */
function _rcOvKey(studentId, examType){ return studentId + '__' + (examType || '_all'); }
function rcGetOverride(studentId, examType){
  const all = DB.getObj('report_overrides') || {};
  return all[_rcOvKey(studentId, examType)] || {};
}
function rcSetOverride(studentId, examType, patch){
  const all = DB.getObj('report_overrides') || {};
  const k = _rcOvKey(studentId, examType);
  all[k] = Object.assign(all[k] || {}, patch);
  DB.set('report_overrides', all);
}

/* ── Rank within class for the given exam (or consolidated) ── */
function _rcRank(studentId, classId, examType){
  const exams = DB.get('exams').filter(e => e.classId === classId && (!examType || e.name === examType));
  if (!exams.length) return null;
  const marks = DB.get('marks');
  const scored = DB.get('students').filter(s => s.classId === classId).map(s => {
    let o = 0, m = 0;
    exams.forEach(e => { const mk = marks.find(x => x.examId === e.id && x.studentId === s.id); if (mk) { o += Number(mk.obtained); m += Number(e.maxMarks); } });
    return { id:s.id, pct: m > 0 ? o/m*100 : 0, has: m > 0 };
  }).filter(x => x.has);
  scored.sort((a,b) => b.pct - a.pct);
  const idx = scored.findIndex(x => x.id === studentId);
  return idx >= 0 ? { rank: idx+1, outOf: scored.length } : null;
}

/* ── Build the full data object for one student ── */
function rcBuildData(studentId, examType) {
  const st = DB.find('students', studentId);
  if (!st) return null;
  const cls = DB.find('classes', st.classId);
  const allExams = DB.get('exams').filter(e => e.classId === st.classId);
  const exams = (examType ? allExams.filter(e => e.name === examType) : allExams)
    .sort((a,b) => String(a.subject||'').localeCompare(String(b.subject||'')));
  const marks = DB.get('marks').filter(m => m.studentId === studentId);

  let totO = 0, totM = 0;
  const subjects = exams.map(e => {
    const m  = marks.find(mk => mk.examId === e.id);
    const ob = m ? Number(m.obtained) : null;
    if (ob !== null) { totO += ob; totM += Number(e.maxMarks); }
    const pct = ob !== null ? Math.round(ob / e.maxMarks * 100) : null;
    const g   = pct !== null ? getGrade(pct) : null;
    return { subject:e.subject, obtained:ob, max:Number(e.maxMarks), pct,
             grade:g?g.grade:'—', color:g?g.color:'#9ca3af', examName:e.name };
  });

  const pct = totM > 0 ? Math.round(totO / totM * 100) : 0;
  const g   = getGrade(pct);

  const att = DB.get('attendance').filter(a => a.classId === st.classId && a.studentId === studentId);
  const present = att.filter(a => a.status === 'present').length;
  const attData = att.length ? { total:att.length, present, pct:Math.round(present/att.length*100) } : null;

  const s   = DB.getObj('school_settings');
  const cfg = rcGetConfig();
  const ov  = rcGetOverride(studentId, examType || cfg.publishedExam || '');
  const result = totM > 0 ? (pct >= 33 ? 'PASS' : 'FAIL') : '—';
  const rankInfo = ov.rank ? { rank: ov.rank, outOf: ov.outOf || '' } : _rcRank(studentId, st.classId, examType || cfg.publishedExam || '');

  const tm = rcBuildTermMatrix(st);

  return { st, cls, exams, subjects, totO, totM, pct, g, attData, s, cfg, ov, result,
           rank: rankInfo, examType: examType || cfg.publishedExam || '', tm };
}

/* Build a subject × term (exam-type) matrix — used by the pre-primary
   cards which show I-SEM / II-SEM / TOTAL style columns. */
function rcBuildTermMatrix(st){
  const cls=st.classId;
  const exams=DB.get('exams').filter(e=>e.classId===cls);
  if(!exams.length) return { terms:[], rows:[], grandObt:0, grandMax:0, pct:0, grade:getGrade(0) };
  const marks=DB.get('marks').filter(m=>m.studentId===st.id);
  const firstDate={};
  exams.forEach(e=>{ const d=e.date||''; if(firstDate[e.name]===undefined||d<firstDate[e.name]) firstDate[e.name]=d; });
  const terms=Object.keys(firstDate).sort((a,b)=>(firstDate[a]||'').localeCompare(firstDate[b]||''));
  const subjects=[...new Set(exams.map(e=>e.subject))];
  let grandObt=0, grandMax=0;
  const rows=subjects.map(sub=>{
    let tObt=0, tMax=0;
    const cells=terms.map(tn=>{
      const ex=exams.filter(e=>e.name===tn && e.subject===sub);
      let o=null,m=0; ex.forEach(e=>{ m+=Number(e.maxMarks); const mk=marks.find(x=>x.examId===e.id); if(mk){ o=(o||0)+Number(mk.obtained); } });
      if(o!=null){ tObt+=o; tMax+=m; }
      return { obt:o, max:m, pct:(o!=null&&m)?Math.round(o/m*100):null };
    });
    grandObt+=tObt; grandMax+=tMax;
    const pct=tMax?Math.round(tObt/tMax*100):null;
    const gg=pct!=null?getGrade(pct):null;
    return { subject:sub, cells, total:tObt, totalMax:tMax, pct, grade:gg?gg.grade:'—', color:gg?gg.color:'#9ca3af' };
  });
  const pct=grandMax?Math.round(grandObt/grandMax*100):0;
  return { terms, rows, grandObt, grandMax, pct, grade:getGrade(pct) };
}

/* ── Print one report card guaranteed to fit on ONE A4 page ──
   Opens a print window, waits for images, then shrinks (zoom) so the
   whole card fits a single page no matter how many subjects there are. */
function rcPrintCard(cardHtml, title){
  const w = window.open('', '_blank', 'width=900,height=1000');
  if (!w) { try{ toast('Allow popups to print','warning'); }catch(e){} return; }
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title||'Report Card'}</title>
  <style>
    @page { size:A4 portrait; margin:6mm; }
    *{box-sizing:border-box;}
    html,body{margin:0;padding:0;background:#eef2f7;}
    #rc-fit{width:794px;margin:0 auto;}
    @media print{ html,body{background:#fff;} #rc-fit{margin:0;} }
  </style></head>
  <body><div id="rc-fit">${cardHtml}</div>
  <script>
  (function(){
    var fit=document.getElementById('rc-fit'), done=false;
    var MAXH=1052; /* A4 @96dpi (1123px) minus 6mm*2 margins */
    function go(){
      if(done) return; done=true;
      try{
        var h=fit.scrollHeight;
        if(h>MAXH){ fit.style.zoom=(MAXH/h).toFixed(4); }
      }catch(e){}
      setTimeout(function(){ window.focus(); window.print(); }, 200);
    }
    var imgs=fit.querySelectorAll('img'), left=imgs.length;
    if(!left){ go(); }
    else{
      for(var i=0;i<imgs.length;i++){
        (function(im){
          if(im.complete){ if(--left===0) go(); }
          else { im.onload=im.onerror=function(){ if(--left===0) go(); }; }
        })(imgs[i]);
      }
      setTimeout(go, 1800); /* fallback if an image never fires */
    }
    window.onafterprint=function(){ setTimeout(function(){ try{window.close();}catch(e){} }, 300); };
  })();
  <\/script></body></html>`);
  w.document.close();
}

/* ── Public entry: render full print-ready HTML for a template id ── */
function rcRenderCard(tid, data) {
  if (!data) return '<p style="padding:40px;text-align:center">No data.</p>';
  switch (tid) {
    case 't2': return _rcT2(data);
    case 't3': return _rcT3(data);
    case 't4': return _rcT4(data);
    case 't5': return _rcT5(data);
    case 't6': return _rcT6(data);
    case 't7': return _rcT7(data);
    case 't8': return _rcT8(data);
    case 't9': return _rcT9(data);
    case 't10': return _rcT10(data);
    case 't11': return _rcT11(data);
    case 't12': return _rcT12(data);
    default:   return _rcT1(data);
  }
}

/* ════════ Pre-Primary helpers ════════ */
// Term column labels (I SEM, II SEM…) capped to 3 for layout
function _ppTerms(d){ return (d.tm && d.tm.terms || []).slice(0,3); }
function _ppRomanLabels(terms){
  const R=['I SEM','II SEM','III SEM'];
  return terms.map((t,i)=> terms.length<=3 ? R[i] : t);
}
function _ppInfoLine(label,val){ return `<div style="display:flex;gap:8px;margin-bottom:6px;"><span style="min-width:120px;font-weight:700;">${esc(label)}</span><span style="flex:1;border-bottom:1.5px dotted #94a3b8;">${esc(val||'')}</span></div>`; }
function _ppGradeOf(d){ return (d.tm && d.tm.rows.length) ? d.tm.grade : d.g; }

/* ════════ shared bits ════════ */
function _rcLogo(s, size) {
  if (s.schoolLogo) return `<img src="${s.schoolLogo}" style="width:${size}px;height:${size}px;object-fit:contain;">`;
  return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:#e5e7eb;display:flex;align-items:center;justify-content:center;font-size:${Math.round(size*0.45)}px;">🏫</div>`;
}
function _rcPhoto(st, w, h) {
  if (st.photo) return `<img src="${st.photo}" style="width:${w}px;height:${h}px;object-fit:cover;border:1px solid #94a3b8;">`;
  return `<div style="width:${w}px;height:${h}px;border:1px solid #94a3b8;background:#f3f4f6;display:flex;align-items:center;justify-content:center;font-size:1.6rem;color:#9ca3af;">${(st.name||'?')[0].toUpperCase()}</div>`;
}
function _rcExamTitle(d){ return d.examType ? esc(d.examType) : 'Consolidated Result'; }
function _rcGradeScaleRows() {
  return [['91-100','A1'],['81-90','A2'],['71-80','B1'],['61-70','B2'],
          ['51-60','C1'],['41-50','C2'],['33-40','D'],['0-32','E']];
}

/* QR data URL (works in admin, student & report.html — all expose window.QRCode) */
function _rcGenQR(text, size){
  if (!window.QRCode) return null;
  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:fixed;left:-9999px;top:-9999px;';
  document.body.appendChild(wrap);
  try {
    new QRCode(wrap, { text, width:size, height:size, colorDark:'#0f172a', colorLight:'#ffffff', correctLevel: QRCode.CorrectLevel.M });
    const cv = wrap.querySelector('canvas');
    const url = cv ? cv.toDataURL('image/png') : (wrap.querySelector('img') ? wrap.querySelector('img').src : null);
    document.body.removeChild(wrap);
    return url;
  } catch(e){ try{ document.body.removeChild(wrap); }catch(_){} return null; }
}
function _rcQRUrl(d){
  const sid = (DB._schoolId && DB._schoolId()) || '';
  if (!sid) return '';
  const base = location.origin + location.pathname.replace(/[^/]*$/, '');
  return base + 'report.html?sid=' + encodeURIComponent(sid) + '&stu=' + encodeURIComponent(d.st.id) + '&exam=' + encodeURIComponent(d.examType||'');
}
function _rcQRBox(d, size){
  if (!d.cfg.showQR) return '';
  const url = _rcQRUrl(d);
  if (!url) return '';
  const img = _rcGenQR(url, size||86);
  if (!img) return '';
  return `<div style="text-align:center;">
    <img src="${img}" style="width:${size||86}px;height:${size||86}px;display:block;">
    <div style="font-size:.56rem;color:#64748b;margin-top:2px;line-height:1.2;">Scan to verify<br>full report</div>
  </div>`;
}

/* Full student info pairs — used by every template */
function _rcInfoPairs(d){
  const { st, cls } = d;
  return [
    ['Student Name', st.name],
    ['Class', cls?cls.name:'—'],
    ['Roll No', st.rollNo],
    ['Admission No', st.admissionNo||st.scholarNo||'—'],
    ['Date of Birth', st.dob?formatDate(st.dob):'—'],
    ["Father's Name", st.fatherName],
    ["Mother's Name", st.motherName],
    ['Aadhaar No', st.aadhaar||'—'],
  ];
}
/* Bordered 2-column info table (label,value,label,value per row) */
function _rcInfoTable(d, accent, headBg){
  const p = _rcInfoPairs(d);
  let rows = '';
  for (let i=0;i<p.length;i+=2){
    const a=p[i], b=p[i+1];
    rows += `<tr>
      <td style="border:1px solid #cbd5e1;padding:6px 9px;background:${headBg};font-weight:700;width:16%;">${esc(a[0])}</td>
      <td style="border:1px solid #cbd5e1;padding:6px 9px;width:34%;">${esc(a[1]||'—')}</td>
      ${b?`<td style="border:1px solid #cbd5e1;padding:6px 9px;background:${headBg};font-weight:700;width:16%;">${esc(b[0])}</td>
      <td style="border:1px solid #cbd5e1;padding:6px 9px;width:34%;">${esc(b[1]||'—')}</td>`:'<td colspan="2" style="border:1px solid #cbd5e1;"></td>'}
    </tr>`;
  }
  return `<table style="width:100%;border-collapse:collapse;font-size:.78rem;">${rows}</table>`;
}

/* Marks table themed by accent */
function _rcMarksTable(d, accent, headBg){
  const { subjects, totO, totM, pct, g } = d;
  return `<table style="width:100%;border-collapse:collapse;font-size:.8rem;">
    <thead><tr style="background:${headBg};">
      <th style="border:1px solid #94a3b8;padding:6px;text-align:left;">SUBJECT</th>
      <th style="border:1px solid #94a3b8;padding:6px;">Max Marks</th>
      <th style="border:1px solid #94a3b8;padding:6px;">Obtained</th>
      <th style="border:1px solid #94a3b8;padding:6px;">%</th>
      <th style="border:1px solid #94a3b8;padding:6px;">Grade</th>
    </tr></thead>
    <tbody>
      ${subjects.map(r=>`<tr>
        <td style="border:1px solid #94a3b8;padding:6px;font-weight:600;">${esc(r.subject)}</td>
        <td style="border:1px solid #94a3b8;padding:6px;text-align:center;">${r.max}</td>
        <td style="border:1px solid #94a3b8;padding:6px;text-align:center;">${r.obtained!==null?r.obtained:'<span style="color:#dc2626">AB</span>'}</td>
        <td style="border:1px solid #94a3b8;padding:6px;text-align:center;">${r.pct!==null?r.pct+'%':'—'}</td>
        <td style="border:1px solid #94a3b8;padding:6px;text-align:center;font-weight:700;color:${r.color};">${r.grade}</td>
      </tr>`).join('')}
      <tr style="background:${headBg};font-weight:800;">
        <td style="border:1px solid #94a3b8;padding:6px;">TOTAL</td>
        <td style="border:1px solid #94a3b8;padding:6px;text-align:center;">${totM}</td>
        <td style="border:1px solid #94a3b8;padding:6px;text-align:center;">${totO}</td>
        <td style="border:1px solid #94a3b8;padding:6px;text-align:center;">${pct}%</td>
        <td style="border:1px solid #94a3b8;padding:6px;text-align:center;color:${g.color};">${g.grade}</td>
      </tr>
    </tbody>
  </table>`;
}

/* Summary band: Total · % · Overall Grade · Rank · Result · Attendance */
function _rcSummaryTable(d, headBg){
  const { totO, totM, pct, g, attData, rank, result, cfg } = d;
  const cells = [
    ['Total Marks', `${totO} / ${totM}`],
    ['Percentage', `${pct}%`],
    ['Overall Grade', g.grade],
  ];
  if (cfg.showRank) cells.push(['Rank', rank ? `${rank.rank}${rank.outOf?' / '+rank.outOf:''}` : '—']);
  cells.push(['Result', result]);
  cells.push(['Attendance', attData ? `${attData.pct}% (${attData.present}/${attData.total})` : '—']);
  return `<table style="width:100%;border-collapse:collapse;font-size:.78rem;margin-top:6px;">
    <tr style="background:${headBg};font-weight:700;text-align:center;">
      ${cells.map(c=>`<td style="border:1px solid #94a3b8;padding:6px;">${c[0]}</td>`).join('')}
    </tr>
    <tr style="text-align:center;font-weight:800;">
      ${cells.map(c=>{
        const isRes = c[0]==='Result';
        const col = isRes ? (result==='PASS'?'#059669':(result==='FAIL'?'#dc2626':'#111')) : (c[0]==='Overall Grade'||c[0]==='Percentage'?g.color:'#111');
        return `<td style="border:1px solid #94a3b8;padding:7px;color:${col};">${esc(c[1])}</td>`;
      }).join('')}
    </tr>
  </table>`;
}

/* Co-Scholastic + Discipline tables (grades from per-student override) */
function _rcCoSchTables(d, headBg){
  const { cfg, ov } = d;
  const sg = ov.scholasticGrades || {};
  const dg = ov.disciplineGrades || {};
  const half = (title, areas, grades) => `
    <div style="flex:1;">
      <div style="background:${headBg};font-weight:700;font-size:.74rem;padding:4px 8px;border:1px solid #94a3b8;">${title} (3-point A–C scale)</div>
      <table style="width:100%;border-collapse:collapse;font-size:.76rem;">
        ${areas.map(a=>`<tr>
          <td style="border:1px solid #94a3b8;padding:5px 8px;">${esc(a)}</td>
          <td style="border:1px solid #94a3b8;padding:5px 8px;text-align:center;width:60px;font-weight:700;">${esc(grades[a]||'')}</td>
        </tr>`).join('')}
      </table>
    </div>`;
  return `<div style="display:flex;gap:12px;margin-top:8px;">
    ${half('Co-Scholastic Areas', cfg.coScholastic||[], sg)}
    ${half('Discipline', cfg.discipline||[], dg)}
  </div>`;
}

/* Remark + signatures + QR row */
function _rcFooter(d, accent){
  const { cfg, ov } = d;
  const remark = ov.remark || cfg.defaultRemark || '';
  const qr = _rcQRBox(d, 84);
  return `<div style="display:flex;gap:14px;align-items:flex-start;margin-top:10px;">
    <div style="flex:1;">
      <div style="font-weight:700;color:${accent};font-size:.8rem;">Class Teacher's Remark</div>
      <div style="border-bottom:1px dashed #94a3b8;min-height:30px;padding:4px 0;font-size:.82rem;">${esc(remark)}</div>
    </div>
    ${qr?`<div style="flex-shrink:0;">${qr}</div>`:''}
  </div>
  <div style="display:flex;justify-content:space-between;padding:30px 20px 10px;font-size:.78rem;font-weight:700;">
    <div style="border-top:1.5px solid #111;padding-top:4px;">Class Teacher</div>
    <div style="border-top:1.5px solid #111;padding-top:4px;">Principal</div>
  </div>`;
}

/* ═══════════════ T1 — BLUE PROGRESS REPORT ═══════════════ */
function _rcT1(d) {
  const s=d.s, accent='#1d4ed8', head='#dbeafe';
  return `<div style="font-family:Arial,sans-serif;color:#111;max-width:840px;margin:0 auto;border:2px solid ${accent};padding:0;">
    <div style="display:flex;justify-content:space-between;font-size:.72rem;font-weight:700;padding:6px 14px;border-bottom:1px solid #cbd5e1;">
      <span>Affiliation Code :- ${esc(s.affiliationNo||'—')}</span><span>School Code :- ${esc(s.schoolCode||'—')}</span>
    </div>
    <div style="text-align:center;padding:12px 14px 6px;">
      ${_rcLogo(s,58)}
      <div style="font-size:1.7rem;font-weight:900;color:${accent};letter-spacing:.5px;">${esc(s.schoolName||'School Name')}</div>
      <div style="font-size:.85rem;color:#334155;">${esc(s.schoolAddress||'')}</div>
      <div style="margin-top:8px;font-size:1.2rem;font-weight:800;color:#7c2d12;letter-spacing:1px;">Progress Report</div>
      <div style="font-size:.95rem;font-weight:700;">Session : ${esc(s.academicYear||'—')}</div>
    </div>
    <div style="padding:0 14px;">${_rcInfoTable(d, accent, head)}</div>
    <div style="background:#dc2626;color:#fff;font-weight:800;font-size:.8rem;padding:5px 14px;margin-top:6px;">PART-1 ACADEMIC PERFORMANCE : SCHOLASTIC AREAS — ${_rcExamTitle(d)}</div>
    <div style="padding:0 14px;">${_rcMarksTable(d, accent, head)}${_rcSummaryTable(d, head)}</div>
    <div style="background:#dc2626;color:#fff;font-weight:800;font-size:.8rem;padding:5px 14px;margin-top:8px;">PART-2 CO-SCHOLASTIC & DISCIPLINE</div>
    <div style="padding:0 14px;">${_rcCoSchTables(d, head)}${_rcFooter(d, accent)}</div>
    <div style="margin:0 14px 14px;border:1px solid #94a3b8;font-size:.7rem;">
      <div style="background:${head};font-weight:700;text-align:center;padding:4px;border-bottom:1px solid #94a3b8;">Grading Scale (9-Point)</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);">
        ${_rcGradeScaleRows().map(([r,gr])=>`<div style="border:1px solid #cbd5e1;padding:3px 8px;display:flex;justify-content:space-between;"><span>${r}</span><strong>${gr}</strong></div>`).join('')}
      </div>
    </div>
  </div>`;
}

/* ═══════════════ T2 — CBSE GREEN RECORD CARD ═══════════════ */
function _rcT2(d) {
  const s=d.s, accent='#15803d', head='#dcfce7';
  return `<div style="font-family:Arial,sans-serif;color:#111;max-width:850px;margin:0 auto;border:2px solid ${accent};">
    <div style="background:#166534;color:#fff;display:flex;align-items:center;gap:14px;padding:12px 18px;">
      <div style="background:#fff;border-radius:8px;padding:4px;">${_rcLogo(s,54)}</div>
      <div style="flex:1;text-align:center;">
        <div style="font-size:1.5rem;font-weight:900;letter-spacing:.5px;">REPORT CARD</div>
        <div style="font-size:.72rem;letter-spacing:.12em;opacity:.85;">RECORD OF ACADEMIC PERFORMANCE</div>
      </div>
      <div style="text-align:right;font-size:.72rem;line-height:1.5;">
        <div style="font-weight:700;">CBSE Affiliation ${esc(s.affiliationNo||'—')}</div>
        <div>School Code : ${esc(s.schoolCode||'—')}</div>
      </div>
    </div>
    <div style="text-align:center;padding:10px 14px;border-bottom:2px solid ${accent};">
      <div style="font-size:1.5rem;font-weight:900;color:#166534;">${esc(s.schoolName||'School Name')}</div>
      <div style="font-size:.82rem;color:#334155;">${esc(s.schoolAddress||'')}${s.schoolPhone?' · 📞 '+esc(s.schoolPhone):''}</div>
      <div style="margin-top:6px;font-size:1.05rem;font-weight:800;">Academic Session : ${esc(s.academicYear||'—')}</div>
    </div>
    <div style="padding:8px 14px 0;">${_rcInfoTable(d, accent, head)}</div>
    <div style="color:#b91c1c;font-weight:800;font-size:.8rem;padding:6px 14px 2px;">PART-1 SCHOLASTIC AREAS — ${_rcExamTitle(d)}</div>
    <div style="padding:0 14px;">${_rcMarksTable(d, accent, head)}${_rcSummaryTable(d, head)}</div>
    <div style="color:#b91c1c;font-weight:800;font-size:.8rem;padding:8px 14px 2px;">PART-2 CO-SCHOLASTIC & DISCIPLINE</div>
    <div style="padding:0 14px;">${_rcCoSchTables(d, head)}${_rcFooter(d, accent)}</div>
    <div style="background:#166534;color:#fff;text-align:center;font-weight:800;letter-spacing:.06em;padding:6px;">GRADING SYSTEM</div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);font-size:.7rem;">
      ${_rcGradeScaleRows().map(([r,gr])=>`<div style="border:1px solid #cbd5e1;padding:3px 8px;display:flex;justify-content:space-between;"><span>${r}</span><strong>${gr}</strong></div>`).join('')}
    </div>
    <div style="background:#166534;color:#fff;text-align:center;font-size:.85rem;padding:5px;">पढ़ेगा भारत · बढ़ेगा भारत</div>
  </div>`;
}

/* ═══════════════ T3 — MARKSHEET CUM CERTIFICATE ═══════════════ */
function _rcT3(d) {
  const s=d.s, accent='#1e3a8a', head='#dbeafe';
  const division = d.pct>=60?'I':d.pct>=45?'II':d.pct>=33?'III':'—';
  return `<div style="font-family:Arial,sans-serif;color:#111;max-width:850px;margin:0 auto;border:3px solid ${accent};">
    <div style="display:flex;justify-content:space-between;font-size:.72rem;font-weight:700;padding:5px 14px;">
      <span>DISE Code - ${esc(s.diseCode||s.affiliationNo||'—')}</span><span>School Code - ${esc(s.schoolCode||'—')}</span>
    </div>
    <div style="background:${accent};color:#fff;display:flex;align-items:center;gap:14px;padding:10px 18px;">
      <div style="background:#fff;border-radius:8px;padding:3px;">${_rcLogo(s,50)}</div>
      <div style="flex:1;text-align:center;">
        <div style="font-size:1.8rem;font-weight:900;color:#fde047;">${esc(s.schoolName||'School Name')}</div>
        <div style="font-size:.8rem;">${esc(s.schoolAddress||'')}</div>
      </div>
    </div>
    <div style="background:#fde047;text-align:center;font-weight:800;font-size:1rem;padding:6px;letter-spacing:.05em;">MARKSHEET CUM CERTIFICATE · YEAR ${esc(s.academicYear||'—')}</div>
    <div style="display:flex;gap:14px;padding:10px 14px;">
      <div style="flex:1;">${_rcInfoTable(d, accent, head)}</div>
      <div>${_rcPhoto(d.st,84,96)}</div>
    </div>
    <div style="color:${accent};font-weight:800;font-size:.82rem;padding:2px 14px;">ACADEMIC ACHIEVEMENTS — ${_rcExamTitle(d)}</div>
    <div style="padding:0 14px;">${_rcMarksTable(d, accent, head)}
      <table style="width:100%;border-collapse:collapse;font-size:.78rem;margin-top:6px;">
        <tr style="background:${head};font-weight:700;text-align:center;">
          <td style="border:1px solid #1e293b;padding:6px;">Overall</td><td style="border:1px solid #1e293b;padding:6px;">Percentage</td>
          <td style="border:1px solid #1e293b;padding:6px;">Result</td><td style="border:1px solid #1e293b;padding:6px;">Division</td>
          <td style="border:1px solid #1e293b;padding:6px;">Rank</td><td style="border:1px solid #1e293b;padding:6px;">Grade</td>
        </tr>
        <tr style="font-weight:800;text-align:center;">
          <td style="border:1px solid #1e293b;padding:6px;">${d.totO}/${d.totM}</td>
          <td style="border:1px solid #1e293b;padding:6px;">${d.pct}%</td>
          <td style="border:1px solid #1e293b;padding:6px;color:${d.result==='PASS'?'#059669':'#dc2626'};">${d.result==='PASS'?'Passed':d.result}</td>
          <td style="border:1px solid #1e293b;padding:6px;">${division}</td>
          <td style="border:1px solid #1e293b;padding:6px;">${d.rank?d.rank.rank+(d.rank.outOf?'/'+d.rank.outOf:''):'—'}</td>
          <td style="border:1px solid #1e293b;padding:6px;color:${d.g.color};">${d.g.grade}</td>
        </tr>
      </table>
      <div style="font-size:.78rem;padding:6px 0;">Attendance : <strong>${d.attData?d.attData.pct+'% ('+d.attData.present+'/'+d.attData.total+')':'—'}</strong></div>
      ${_rcCoSchTables(d, head)}${_rcFooter(d, accent)}
    </div>
  </div>`;
}

/* ═══════════════ T4 — BEIGE RECORD SHEET ═══════════════ */
function _rcT4(d) {
  const s=d.s, st=d.st, accent='#92400e', head='#f5e6c8';
  return `<div style="font-family:Arial,sans-serif;color:#3b2f1e;max-width:850px;margin:0 auto;border:2px solid ${accent};background:#fffdf7;">
    <div style="display:flex;justify-content:space-between;font-size:.72rem;font-weight:700;padding:5px 14px;color:#7c2d12;">
      <span>DISE : ${esc(s.diseCode||'—')}</span><span>Affiliated by State Board</span><span>School Code : ${esc(s.schoolCode||'—')}</span>
    </div>
    <div style="text-align:center;padding:8px 14px;">
      <div style="font-size:1.7rem;font-weight:900;color:#1e3a8a;">${esc(s.schoolName||'School Name')}</div>
      <div style="font-size:.8rem;color:#57534e;">${esc(s.schoolAddress||'')}</div>
      <div style="font-size:.95rem;font-weight:800;color:#7c2d12;margin-top:4px;">SESSION ${esc(s.academicYear||'—')}</div>
      <div style="display:inline-block;margin-top:6px;background:#2563eb;color:#fff;border-radius:20px;padding:4px 28px;font-weight:800;">Record Sheet</div>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:.74rem;">
      <tr style="background:${head};color:#7c2d12;font-weight:700;text-align:center;">
        <td style="border:1px solid #b45309;padding:5px;">ROLL NO.</td><td style="border:1px solid #b45309;padding:5px;">SCHOLAR NO.</td>
        <td style="border:1px solid #b45309;padding:5px;">SSSM ID</td><td style="border:1px solid #b45309;padding:5px;">CATEGORY</td>
        <td style="border:1px solid #b45309;padding:5px;">CLASS</td><td style="border:1px solid #b45309;padding:5px;">MEDIUM</td>
        <td style="border:1px solid #b45309;padding:5px;">AADHAAR</td>
      </tr>
      <tr style="text-align:center;font-weight:600;">
        <td style="border:1px solid #b45309;padding:6px;">${esc(st.rollNo||'—')}</td>
        <td style="border:1px solid #b45309;padding:6px;">${esc(st.admissionNo||st.scholarNo||'—')}</td>
        <td style="border:1px solid #b45309;padding:6px;">${esc(st.sssmId||'—')}</td>
        <td style="border:1px solid #b45309;padding:6px;">${esc(st.category||'GEN')}</td>
        <td style="border:1px solid #b45309;padding:6px;">${d.cls?esc(d.cls.name):'—'}</td>
        <td style="border:1px solid #b45309;padding:6px;">${esc(st.medium||'ENGLISH')}</td>
        <td style="border:1px solid #b45309;padding:6px;">${esc(st.aadhaar||'—')}</td>
      </tr>
    </table>
    <div style="display:flex;gap:14px;padding:10px 14px;">
      <div style="flex:1;font-size:.82rem;line-height:2;color:#7c2d12;">
        <div><strong>STUDENT'S NAME :</strong> ${esc((st.name||'').toUpperCase())}</div>
        <div><strong>FATHER'S NAME :</strong> ${esc((st.fatherName||'—').toUpperCase())}</div>
        <div><strong>MOTHER'S NAME :</strong> ${esc((st.motherName||'—').toUpperCase())}</div>
        <div><strong>DATE OF BIRTH :</strong> ${st.dob?formatDate(st.dob):'—'}</div>
      </div>
      <div>${_rcPhoto(st,80,92)}</div>
    </div>
    <div style="background:${accent};color:#fff;font-weight:700;font-size:.78rem;padding:4px 14px;">Evaluation of Educational Areas — ${_rcExamTitle(d)}</div>
    <div style="padding:0 14px;">${_rcMarksTable(d, accent, head)}${_rcSummaryTable(d, head)}${_rcCoSchTables(d, head)}</div>
    <div style="padding:8px 14px;font-size:.8rem;color:#7c2d12;">DECLARED <strong>${d.pct>=33?'PASSED':'DETAINED'}</strong> WITH GRADE <strong style="color:${d.g.color}">${d.g.grade}</strong> IN SESSION ${esc(s.academicYear||'—')}.</div>
    <div style="padding:0 14px;">${_rcFooter(d, accent)}</div>
  </div>`;
}

/* ═══════════════ T5 — CLASSIC PURPLE ═══════════════ */
function _rcT5(d) {
  const s=d.s, accent='#6d28d9', head='#ede9fe';
  return `<div style="font-family:'Segoe UI',Arial,sans-serif;color:#1e1b4b;max-width:800px;margin:0 auto;">
    <div style="text-align:center;border-bottom:3px solid ${accent};padding-bottom:14px;margin-bottom:14px;">
      ${_rcLogo(s,64)}
      <div style="font-size:1.5rem;font-weight:800;color:#4c1d95;">${esc(s.schoolName||'School Name')}</div>
      ${s.schoolTagline?`<div style="font-style:italic;color:${accent};font-size:.85rem;">${esc(s.schoolTagline)}</div>`:''}
      <div style="font-size:.82rem;color:#555;">${esc(s.schoolAddress||'')}</div>
      <div style="margin-top:8px;font-weight:700;color:${accent};text-transform:uppercase;letter-spacing:.05em;">Report Card — ${_rcExamTitle(d)} · ${esc(s.academicYear||'')}</div>
    </div>
    ${_rcInfoTable(d, accent, head)}
    <div style="margin-top:10px;">${_rcMarksTable(d, accent, head)}${_rcSummaryTable(d, head)}${_rcCoSchTables(d, head)}</div>
    <div style="text-align:center;margin-top:14px;padding:12px;border-radius:10px;background:${d.pct>=33?'#f0fdf4':'#fef2f2'};border:2px solid ${d.pct>=33?'#059669':'#dc2626'};">
      <div style="font-size:2.2rem;font-weight:900;color:${d.g.color};">${d.g.grade}</div>
      <div style="font-weight:600;color:${d.g.color};">${d.g.label}</div>
      <div style="font-size:1.1rem;font-weight:800;color:${d.pct>=33?'#059669':'#dc2626'};margin-top:4px;">${d.result==='PASS'?'✅ RESULT: PASS':'❌ RESULT: FAIL'}</div>
    </div>
    ${_rcFooter(d, accent)}
  </div>`;
}

/* ═══════════════ T6 — MODERN MINIMAL ═══════════════ */
function _rcT6(d) {
  const s=d.s, accent='#0f172a', head='#f1f5f9';
  return `<div style="font-family:'Segoe UI',Arial,sans-serif;color:#0f172a;max-width:800px;margin:0 auto;padding:8px;">
    <div style="border-left:6px solid ${accent};padding:8px 0 8px 18px;margin-bottom:16px;display:flex;align-items:center;gap:14px;">
      ${_rcLogo(s,46)}
      <div><div style="font-size:1.4rem;font-weight:800;letter-spacing:-.5px;">${esc(s.schoolName||'School Name')}</div>
      <div style="font-size:.78rem;color:#64748b;">${esc(s.schoolAddress||'')}</div></div>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:12px;">
      <div><div style="font-size:.7rem;letter-spacing:.18em;color:#94a3b8;text-transform:uppercase;">Report Card · ${_rcExamTitle(d)}</div>
      <div style="font-size:1.6rem;font-weight:800;">${esc(d.st.name)}</div></div>
      <div style="text-align:right;"><div style="font-size:2.4rem;font-weight:900;color:${d.g.color};line-height:1;">${d.pct}%</div>
      <div style="font-size:.82rem;font-weight:700;color:${d.g.color};">Grade ${d.g.grade}${d.rank?' · Rank '+d.rank.rank:''}</div></div>
    </div>
    ${_rcInfoTable(d, accent, head)}
    <div style="margin-top:10px;">${_rcMarksTable(d, accent, head)}${_rcSummaryTable(d, head)}${_rcCoSchTables(d, head)}</div>
    ${_rcFooter(d, accent)}
  </div>`;
}

/* ═══════════════ T7 — PREMIUM GRADIENT ═══════════════ */
function _rcT7(d) {
  const s=d.s, accent='#7c3aed', head='#f5f3ff';
  const ring = `background:conic-gradient(${d.g.color} ${d.pct*3.6}deg,#e5e7eb 0deg);`;
  return `<div style="font-family:'Segoe UI',Arial,sans-serif;color:#1e293b;max-width:820px;margin:0 auto;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
    <div style="background:linear-gradient(135deg,#4c1d95,#7c3aed 55%,#2563eb);color:#fff;padding:20px 24px;display:flex;align-items:center;gap:16px;">
      <div style="background:rgba(255,255,255,.18);border-radius:14px;padding:6px;">${_rcLogo(s,54)}</div>
      <div style="flex:1;"><div style="font-size:1.5rem;font-weight:800;">${esc(s.schoolName||'School Name')}</div>
      <div style="font-size:.8rem;opacity:.85;">${esc(s.schoolAddress||'')}</div>
      <div style="margin-top:6px;font-size:.78rem;background:rgba(255,255,255,.18);display:inline-block;padding:2px 12px;border-radius:20px;">Report Card · ${_rcExamTitle(d)} · ${esc(s.academicYear||'')}</div></div>
      <div style="text-align:center;">
        <div style="width:90px;height:90px;border-radius:50%;${ring}display:flex;align-items:center;justify-content:center;">
          <div style="width:70px;height:70px;border-radius:50%;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;">
            <div style="font-size:1.3rem;font-weight:900;color:${d.g.color};">${d.pct}%</div>
            <div style="font-size:.65rem;color:#64748b;">${d.g.grade}${d.rank?' · #'+d.rank.rank:''}</div>
          </div>
        </div>
      </div>
    </div>
    <div style="padding:16px 24px;">
      ${_rcInfoTable(d, accent, head)}
      <div style="margin-top:10px;">${_rcMarksTable(d, accent, head)}${_rcSummaryTable(d, head)}${_rcCoSchTables(d, head)}</div>
      ${_rcFooter(d, accent)}
    </div>
  </div>`;
}

/* ═══════════════ T8 — PRE-PRIMARY PROGRESS CARD (festive) ═══════════════ */
function _rcT8(d){
  const s=d.s, st=d.st, tm=d.tm, terms=_ppTerms(d), labels=_ppRomanLabels(terms);
  const g=_ppGradeOf(d);
  const rowColors=['#fde2e2','#fef3c7','#dcfce7','#dbeafe','#f3e8ff','#fae8ff','#e0f2fe','#fff7ed'];
  return `<div style="position:relative;font-family:'Segoe UI',Arial,sans-serif;color:#1f2937;max-width:760px;margin:0 auto;background:#fff;border:3px solid #f59e0b;border-radius:14px;overflow:hidden;">
    <div style="position:absolute;top:8px;right:14px;font-size:1.8rem;">🎈🎈</div>
    <div style="position:absolute;top:120px;left:10px;font-size:1.6rem;">⭐</div>
    <div style="position:absolute;top:120px;right:10px;font-size:1.6rem;">🏆</div>
    <div style="text-align:center;padding:16px 60px 6px;">
      ${_rcLogo(s,54)}
      <div style="font-size:1.5rem;font-weight:900;color:#b91c1c;line-height:1.1;">${esc(s.schoolName||'School Name')}</div>
      <div style="font-size:.8rem;color:#374151;">${esc(s.schoolAddress||'')}</div>
    </div>
    <div style="text-align:center;margin:6px 0;"><span style="display:inline-block;background:#dc2626;color:#fff;font-size:1.4rem;font-weight:900;letter-spacing:1px;padding:6px 36px;border-radius:8px;">PROGRESS CARD</span></div>
    <div style="text-align:center;font-size:.86rem;color:#374151;">For the successful completion of <strong>${esc(d.cls?d.cls.name:'____')}</strong> Class · Academic Session <strong>${esc(s.academicYear||'____')}</strong></div>
    <div style="padding:12px 30px 4px;font-size:.86rem;">
      ${_ppInfoLine('Full Name :', st.name)}
      ${_ppInfoLine("Father's Name :", st.fatherName)}
      ${_ppInfoLine("Mother's Name :", st.motherName)}
      ${_ppInfoLine('Date of Birth :', st.dob?formatDate(st.dob):'')}
    </div>
    <div style="text-align:center;margin:6px 0;"><span style="display:inline-block;background:#16a34a;color:#fde047;font-size:1.2rem;font-weight:900;padding:5px 30px;border-radius:8px;letter-spacing:.5px;">CONGRATULATIONS!!!</span></div>
    <div style="padding:6px 24px;">
      <table style="width:100%;border-collapse:collapse;font-size:.84rem;">
        <thead><tr style="background:#16a34a;color:#fff;">
          <th style="padding:7px 10px;text-align:left;border:1px solid #86efac;">SUBJECT</th>
          ${labels.map(l=>`<th style="padding:7px 8px;border:1px solid #86efac;">${esc(l)}</th>`).join('')}
          <th style="padding:7px 8px;border:1px solid #86efac;">TOTAL</th>
        </tr></thead>
        <tbody>
          ${tm.rows.length?tm.rows.map((r,i)=>`<tr>
            <td style="padding:6px 10px;border:1px solid #d1d5db;font-weight:700;background:${rowColors[i%rowColors.length]};">${esc(r.subject)}</td>
            ${terms.map((_,ti)=>`<td style="padding:6px 8px;border:1px solid #d1d5db;text-align:center;">${r.cells[ti]&&r.cells[ti].obt!=null?r.cells[ti].obt:'—'}</td>`).join('')}
            <td style="padding:6px 8px;border:1px solid #d1d5db;text-align:center;font-weight:800;color:${r.color};">${r.totalMax?r.total:'—'}</td>
          </tr>`).join(''):`<tr><td colspan="${labels.length+2}" style="padding:14px;text-align:center;color:#9ca3af;border:1px solid #d1d5db;">No marks entered yet</td></tr>`}
        </tbody>
      </table>
    </div>
    <div style="display:flex;align-items:center;justify-content:center;gap:30px;padding:10px 24px;">
      <div style="font-size:1rem;font-weight:800;">GRADE : <span style="color:${g.color};font-size:1.3rem;">${g.grade}</span></div>
      <div style="border:2px solid #16a34a;border-radius:8px;padding:6px 16px;text-align:center;">
        <div style="font-size:.68rem;color:#16a34a;font-weight:700;">Promoted to</div>
        <div style="font-weight:800;">${esc(d.ov.promotedTo||'')}</div>
      </div>
    </div>
    <div style="display:flex;justify-content:space-between;padding:22px 40px 16px;font-size:.78rem;font-weight:800;">
      <div style="border-top:1.5px solid #111;padding-top:4px;">CLASS TEACHER</div>
      <div style="border-top:1.5px solid #111;padding-top:4px;">HEAD MISTRESS</div>
    </div>
    <div style="height:10px;background:linear-gradient(90deg,#ef4444,#f59e0b,#22c55e,#0ea5e9,#a855f7);"></div>
  </div>`;
}

/* ═══════════════ T9 — PRE-PRIMARY BLUE JOY ═══════════════ */
function _rcT9(d){
  const s=d.s, st=d.st, tm=d.tm, terms=_ppTerms(d), labels=_ppRomanLabels(terms);
  const g=_ppGradeOf(d), pct=tm.rows.length?tm.pct:d.pct;
  const box=(l,v)=>`<div style="background:#e0f2fe;border:1px solid #7dd3fc;border-radius:8px;padding:6px 10px;text-align:center;"><div style="font-size:.62rem;color:#0369a1;font-weight:700;">${l}</div><div style="font-weight:800;font-size:.9rem;">${esc(v||'—')}</div></div>`;
  return `<div style="font-family:'Segoe UI',Arial,sans-serif;color:#0f172a;max-width:760px;margin:0 auto;background:#fff;border:3px solid #0ea5e9;border-radius:14px;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#0ea5e9,#38bdf8);color:#fff;display:flex;align-items:center;gap:14px;padding:14px 20px;">
      <div style="background:#fff;border-radius:50%;padding:4px;">${_rcLogo(s,50)}</div>
      <div style="flex:1;text-align:center;"><div style="font-size:1.6rem;font-weight:900;font-style:italic;">${esc(s.schoolName||'School Name')}</div>
      <div style="font-size:.78rem;opacity:.9;">${esc(s.schoolAddress||'')}</div></div>
      ${st.photo?`<img src="${st.photo}" style="width:64px;height:72px;object-fit:cover;border-radius:6px;border:2px solid #fff;">`:''}
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;padding:12px 18px;">
      ${box("Student",st.name)}${box("Father",st.fatherName)}${box("Class",d.cls?d.cls.name:'—')}${box("Session",s.academicYear)}
    </div>
    <div style="padding:0 18px 8px;">
      <table style="width:100%;border-collapse:collapse;font-size:.84rem;">
        <thead><tr style="background:#0369a1;color:#fff;">
          <th style="padding:7px 10px;text-align:left;border:1px solid #bae6fd;">Subject</th>
          ${labels.map(l=>`<th style="padding:7px 8px;border:1px solid #bae6fd;">${esc(l)}</th>`).join('')}
          <th style="padding:7px 8px;border:1px solid #bae6fd;">Total</th>
          <th style="padding:7px 8px;border:1px solid #bae6fd;">Result</th>
        </tr></thead>
        <tbody>
          ${tm.rows.map((r,i)=>`<tr style="background:${i%2?'#f0f9ff':'#fff'};">
            <td style="padding:6px 10px;border:1px solid #e2e8f0;font-weight:700;">${esc(r.subject)}</td>
            ${terms.map((_,ti)=>`<td style="padding:6px 8px;border:1px solid #e2e8f0;text-align:center;">${r.cells[ti]&&r.cells[ti].obt!=null?r.cells[ti].obt:'—'}</td>`).join('')}
            <td style="padding:6px 8px;border:1px solid #e2e8f0;text-align:center;font-weight:800;">${r.totalMax?r.total+'/'+r.totalMax:'—'}</td>
            <td style="padding:6px 8px;border:1px solid #e2e8f0;text-align:center;font-weight:700;color:${(r.pct!=null&&r.pct>=33)?'#16a34a':'#dc2626'};">${r.pct!=null?(r.pct>=33?'Pass':'Fail'):'—'}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;padding:6px 18px 12px;">
      ${box("Percentage",pct+'%')}${box("Grade",g.grade)}${box("Result",d.result)}${box("Attendance",d.attData?d.attData.pct+'%':'—')}
      ${d.cfg.showRank?box("Position",d.rank?(d.rank.rank+(d.rank.outOf?'/'+d.rank.outOf:'')):'—'):''}
    </div>
    <div style="display:flex;justify-content:space-between;padding:18px 36px 10px;font-size:.78rem;font-weight:700;">
      <div style="border-top:1.5px solid #111;padding-top:4px;">Class Teacher</div>
      <div style="border-top:1.5px solid #111;padding-top:4px;">Principal</div>
    </div>
    <div style="height:9px;background:linear-gradient(90deg,#ef4444,#f59e0b,#22c55e,#0ea5e9,#a855f7);"></div>
  </div>`;
}

/* ═══════════════ T10 — PRE-PRIMARY ORANGE SCHOLASTIC ═══════════════ */
function _rcT10(d){
  const s=d.s, st=d.st, tm=d.tm, terms=_ppTerms(d), labels=_ppRomanLabels(terms);
  const g=_ppGradeOf(d);
  const scale=[['90-100','A'],['76-90','B'],['56-75','C'],['41-55','D'],['Below 41','E']];
  return `<div style="font-family:'Segoe UI',Arial,sans-serif;color:#1f2937;max-width:760px;margin:0 auto;background:#fff;border:3px solid #ea580c;border-radius:8px;overflow:hidden;">
    <div style="border-bottom:3px solid #ea580c;padding:12px 18px;display:flex;align-items:center;gap:14px;">
      ${_rcLogo(s,52)}
      <div><div style="font-size:1.5rem;font-weight:900;color:#9a3412;">${esc(s.schoolName||'School Name')}</div>
      <div style="font-size:.8rem;color:#57534e;">${esc(s.schoolAddress||'')}</div></div>
    </div>
    <div style="text-align:center;margin:8px 0;"><span style="display:inline-block;border:2px solid #ea580c;color:#9a3412;font-weight:800;border-radius:20px;padding:4px 26px;">ACADEMIC SESSION : ${esc(s.academicYear||'____')}</span></div>
    <div style="padding:4px 22px;font-size:.84rem;">
      ${_ppInfoLine("Student's Name :", st.name)}${_ppInfoLine("Father's Name :", st.fatherName)}
      ${_ppInfoLine("Mother's Name :", st.motherName)}${_ppInfoLine("Class / Roll No :", (d.cls?d.cls.name:'')+' / '+(st.rollNo||'—'))}
    </div>
    <div style="padding:6px 18px;">
      <table style="width:100%;border-collapse:collapse;font-size:.82rem;">
        <thead><tr style="background:#fff7ed;color:#9a3412;">
          <th style="padding:6px 10px;border:1px solid #fdba74;text-align:left;">Scholastic Area</th>
          ${labels.map(l=>`<th style="padding:6px 8px;border:1px solid #fdba74;">${esc(l)}</th>`).join('')}
          <th style="padding:6px 8px;border:1px solid #fdba74;">Grand Total</th>
          <th style="padding:6px 8px;border:1px solid #fdba74;">%</th>
          <th style="padding:6px 8px;border:1px solid #fdba74;">Grade</th>
        </tr></thead>
        <tbody>
          ${tm.rows.map(r=>`<tr>
            <td style="padding:6px 10px;border:1px solid #fed7aa;font-weight:600;">${esc(r.subject)}</td>
            ${terms.map((_,ti)=>`<td style="padding:6px 8px;border:1px solid #fed7aa;text-align:center;">${r.cells[ti]&&r.cells[ti].obt!=null?r.cells[ti].obt:'—'}</td>`).join('')}
            <td style="padding:6px 8px;border:1px solid #fed7aa;text-align:center;font-weight:700;">${r.totalMax?r.total+'/'+r.totalMax:'—'}</td>
            <td style="padding:6px 8px;border:1px solid #fed7aa;text-align:center;">${r.pct!=null?r.pct+'%':'—'}</td>
            <td style="padding:6px 8px;border:1px solid #fed7aa;text-align:center;font-weight:700;color:${r.color};">${r.grade}</td>
          </tr>`).join('')}
          <tr style="background:#ffedd5;font-weight:800;">
            <td style="padding:6px 10px;border:1px solid #fdba74;" colspan="${labels.length+1}">Over All Grand Total</td>
            <td style="padding:6px 8px;border:1px solid #fdba74;text-align:center;">${tm.grandObt}/${tm.grandMax}</td>
            <td style="padding:6px 8px;border:1px solid #fdba74;text-align:center;">${tm.pct}%</td>
            <td style="padding:6px 8px;border:1px solid #fdba74;text-align:center;color:${g.color};">${g.grade}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div style="padding:6px 22px;font-size:.82rem;">
      <div style="margin-bottom:4px;">Class Teacher's Remarks : <strong>${esc(d.ov.remark||d.cfg.defaultRemark||'')}</strong></div>
      <div>Promoted to Class : <strong>${esc(d.ov.promotedTo||'')}</strong></div>
    </div>
    <div style="display:flex;justify-content:space-between;padding:18px 36px 8px;font-size:.78rem;font-weight:700;">
      <div style="border-top:1.5px solid #111;padding-top:4px;">Signature of Class Teacher</div>
      <div style="border-top:1.5px solid #111;padding-top:4px;">Signature of Principal</div>
    </div>
    <div style="margin:0 18px 14px;border:1px solid #fdba74;border-radius:8px;overflow:hidden;">
      <div style="background:#ea580c;color:#fff;text-align:center;font-weight:700;padding:4px;font-size:.8rem;">Grading Scale</div>
      <div style="display:grid;grid-template-columns:repeat(5,1fr);font-size:.74rem;">
        ${scale.map(x=>`<div style="border:1px solid #fed7aa;padding:4px 6px;text-align:center;"><strong>${x[1]}</strong><br>${x[0]}</div>`).join('')}
      </div>
    </div>
  </div>`;
}

/* ═══════════════ T11 — STAR KINDER ═══════════════ */
function _rcT11(d){
  const s=d.s, st=d.st, tm=d.tm, g=_ppGradeOf(d), pct=tm.rows.length?tm.pct:d.pct;
  const chips=['#fee2e2','#fef9c3','#dcfce7','#dbeafe','#f3e8ff','#ffe4e6','#cffafe','#fae8ff'];
  return `<div style="font-family:'Comic Sans MS','Segoe UI',Arial,sans-serif;color:#3b0764;max-width:740px;margin:0 auto;background:linear-gradient(180deg,#faf5ff,#fff);border:3px dashed #9333ea;border-radius:20px;overflow:hidden;padding-bottom:12px;">
    <div style="text-align:center;padding:16px 20px 4px;position:relative;">
      <div style="position:absolute;left:14px;top:14px;font-size:1.6rem;">🌈</div>
      <div style="position:absolute;right:14px;top:14px;font-size:1.6rem;">🎨</div>
      ${_rcLogo(s,50)}
      <div style="font-size:1.4rem;font-weight:900;color:#7e22ce;">${esc(s.schoolName||'School Name')}</div>
      <div style="font-size:.78rem;color:#6b21a8;">${esc(s.schoolAddress||'')}</div>
      <div style="margin-top:6px;font-size:1.1rem;font-weight:900;color:#db2777;">⭐ MY PROGRESS CARD ⭐</div>
      <div style="font-size:.8rem;color:#6b21a8;">Session ${esc(s.academicYear||'____')}</div>
    </div>
    <div style="display:flex;align-items:center;justify-content:center;gap:18px;padding:8px 20px;">
      <div style="flex:1;font-size:.86rem;line-height:1.9;">
        <div><strong>Name:</strong> ${esc(st.name)}</div>
        <div><strong>Class:</strong> ${esc(d.cls?d.cls.name:'—')} &nbsp; <strong>Roll:</strong> ${esc(st.rollNo||'—')}</div>
        <div><strong>Father:</strong> ${esc(st.fatherName||'—')}</div>
      </div>
      <div style="width:96px;height:96px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#c084fc,#7e22ce);display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;box-shadow:0 6px 18px rgba(147,51,234,.4);border:3px solid #fff;">
        <div style="font-size:1.8rem;font-weight:900;">${g.grade}</div><div style="font-size:.62rem;">${pct}%</div>
      </div>
    </div>
    <div style="padding:8px 22px;">
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;">
        ${tm.rows.map((r,i)=>`<div style="background:${chips[i%chips.length]};border-radius:12px;padding:8px 12px;display:flex;justify-content:space-between;align-items:center;">
          <span style="font-weight:700;font-size:.82rem;">${esc(r.subject)}</span>
          <span style="font-weight:900;color:${r.color};">${r.grade}</span></div>`).join('')||'<div style="grid-column:1/-1;text-align:center;color:#9ca3af;">No marks yet</div>'}
      </div>
    </div>
    <div style="text-align:center;font-size:.95rem;font-weight:800;color:#16a34a;padding:8px;">🎉 ${esc(d.result==='PASS'?'Promoted — Well Done!':d.result)} ${d.ov.promotedTo?' to '+esc(d.ov.promotedTo):''}</div>
    <div style="display:flex;justify-content:space-between;padding:14px 40px 4px;font-size:.78rem;font-weight:700;color:#6b21a8;">
      <div style="border-top:1.5px solid #9333ea;padding-top:4px;">Class Teacher</div>
      <div style="border-top:1.5px solid #9333ea;padding-top:4px;">Principal</div>
    </div>
  </div>`;
}

/* ═══════════════ T12 — RAINBOW PRIMARY ═══════════════ */
function _rcT12(d){
  const s=d.s, st=d.st, tm=d.tm, terms=_ppTerms(d), labels=_ppRomanLabels(terms), g=_ppGradeOf(d);
  const bars=['#ef4444','#f59e0b','#22c55e','#0ea5e9','#a855f7','#ec4899','#14b8a6','#f97316'];
  return `<div style="font-family:'Segoe UI',Arial,sans-serif;color:#1f2937;max-width:760px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;border:2px solid #e5e7eb;box-shadow:0 6px 22px rgba(0,0,0,.1);">
    <div style="height:10px;background:linear-gradient(90deg,#ef4444,#f59e0b,#22c55e,#0ea5e9,#a855f7);"></div>
    <div style="text-align:center;padding:14px 20px 6px;">
      ${_rcLogo(s,50)}
      <div style="font-size:1.5rem;font-weight:900;color:#0f172a;">${esc(s.schoolName||'School Name')}</div>
      <div style="font-size:.8rem;color:#64748b;">${esc(s.schoolAddress||'')}</div>
      <div style="margin-top:6px;font-weight:800;color:#7c3aed;letter-spacing:.05em;">PROGRESS REPORT · ${esc(s.academicYear||'____')}</div>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:6px 24px;padding:6px 24px;font-size:.84rem;">
      <div><strong>Name:</strong> ${esc(st.name)}</div><div><strong>Class:</strong> ${esc(d.cls?d.cls.name:'—')}</div>
      <div><strong>Roll:</strong> ${esc(st.rollNo||'—')}</div><div><strong>Father:</strong> ${esc(st.fatherName||'—')}</div>
    </div>
    <div style="padding:8px 22px;">
      <table style="width:100%;border-collapse:collapse;font-size:.84rem;">
        <thead><tr style="background:#0f172a;color:#fff;">
          <th style="padding:7px 10px;text-align:left;">Subject</th>
          ${labels.map(l=>`<th style="padding:7px 8px;">${esc(l)}</th>`).join('')}
          <th style="padding:7px 8px;">Total</th><th style="padding:7px 8px;">Grade</th>
        </tr></thead>
        <tbody>
          ${tm.rows.map((r,i)=>`<tr style="border-bottom:1px solid #eef2f7;">
            <td style="padding:7px 10px;font-weight:700;border-left:4px solid ${bars[i%bars.length]};">${esc(r.subject)}</td>
            ${terms.map((_,ti)=>`<td style="padding:7px 8px;text-align:center;">${r.cells[ti]&&r.cells[ti].obt!=null?r.cells[ti].obt:'—'}</td>`).join('')}
            <td style="padding:7px 8px;text-align:center;font-weight:800;">${r.totalMax?r.total+'/'+r.totalMax:'—'}</td>
            <td style="padding:7px 8px;text-align:center;"><span style="background:${r.color}22;color:${r.color};font-weight:700;padding:2px 10px;border-radius:20px;">${r.grade}</span></td>
          </tr>`).join('')}
          <tr style="font-weight:800;background:#f8fafc;">
            <td style="padding:8px 10px;" colspan="${labels.length+1}">TOTAL</td>
            <td style="padding:8px 8px;text-align:center;">${tm.grandObt}/${tm.grandMax}</td>
            <td style="padding:8px 8px;text-align:center;color:${g.color};">${g.grade}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div style="display:flex;gap:12px;padding:6px 22px 10px;">
      <div style="flex:1;text-align:center;background:${d.result==='PASS'?'#f0fdf4':'#fef2f2'};border-radius:12px;padding:10px;"><div style="font-size:.7rem;color:#64748b;">RESULT</div><div style="font-weight:800;color:${d.result==='PASS'?'#16a34a':'#dc2626'};">${d.result}</div></div>
      <div style="flex:1;text-align:center;background:#f8fafc;border-radius:12px;padding:10px;"><div style="font-size:.7rem;color:#64748b;">PERCENTAGE</div><div style="font-weight:800;">${tm.pct}%</div></div>
      <div style="flex:1;text-align:center;background:#f8fafc;border-radius:12px;padding:10px;"><div style="font-size:.7rem;color:#64748b;">ATTENDANCE</div><div style="font-weight:800;">${d.attData?d.attData.pct+'%':'—'}</div></div>
      ${d.ov.promotedTo?`<div style="flex:1;text-align:center;background:#eef2ff;border-radius:12px;padding:10px;"><div style="font-size:.7rem;color:#64748b;">PROMOTED TO</div><div style="font-weight:800;">${esc(d.ov.promotedTo)}</div></div>`:''}
    </div>
    <div style="display:flex;justify-content:space-between;padding:16px 36px 12px;font-size:.78rem;font-weight:700;">
      <div style="border-top:1.5px solid #111;padding-top:4px;">Class Teacher</div>
      <div style="border-top:1.5px solid #111;padding-top:4px;">Principal</div>
    </div>
  </div>`;
}
