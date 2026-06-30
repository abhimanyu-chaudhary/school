/* ═══════════════════════════════════════════════════════════════
   CERTIFICATE DESIGNER — 10 modern, decorative, fully-editable
   award / achievement certificate templates (landscape A4).
   Every text line is editable by the admin.
═══════════════════════════════════════════════════════════════ */

const CERT_DESIGNS = [
  { id:'c1',  name:'Royal Gold',      accent:'#b8860b', accent2:'#c0392b', deco:'corners', font:"Georgia, 'Times New Roman', serif" },
  { id:'c2',  name:'Elegant Blue',    accent:'#1d4ed8', accent2:'#0ea5e9', deco:'ribbon',  font:"Georgia, serif" },
  { id:'c3',  name:'Classic Green',   accent:'#15803d', accent2:'#65a30d', deco:'corners', font:"'Palatino Linotype', Georgia, serif" },
  { id:'c4',  name:'Purple Premium',  accent:'#6d28d9', accent2:'#a855f7', deco:'ribbon',  font:"Georgia, serif" },
  { id:'c5',  name:'Maroon Classic',  accent:'#7f1d1d', accent2:'#b8860b', deco:'corners', font:"'Book Antiqua', Georgia, serif" },
  { id:'c6',  name:'Teal Modern',     accent:'#0f766e', accent2:'#14b8a6', deco:'line',    font:"'Segoe UI', Arial, sans-serif" },
  { id:'c7',  name:'Black & Gold',    accent:'#caa44a', accent2:'#1a1a1a', deco:'luxury',  font:"Georgia, serif" },
  { id:'c8',  name:'Rose Floral',     accent:'#be185d', accent2:'#f472b6', deco:'ribbon',  font:"Georgia, serif" },
  { id:'c9',  name:'Minimal Line',    accent:'#334155', accent2:'#0ea5e9', deco:'line',    font:"'Segoe UI', Arial, sans-serif" },
  { id:'c10', name:'Navy Corporate',  accent:'#1e3a8a', accent2:'#f59e0b', deco:'corners', font:"'Segoe UI', Arial, sans-serif" },
];

function certDesignDefaults(){
  const s = (typeof getSettings==='function') ? getSettings() : {};
  return {
    schoolName: s.schoolName || 'School Name',
    address:    s.schoolAddress || '',
    session:    s.academicYear || '',
    logo:       s.schoolLogo || '',
    topLabel:   'CERTIFICATE OF ACHIEVEMENT',
    subtitle:   'This Certificate is Proudly Presented To',
    recipient:  'Student Name',
    body:       'of Class ___ for achieving FIRST position in the ____________ competition conducted at school level.',
    footer:     'Thank you for your participation and good work.',
    date:       (typeof formatDate==='function') ? formatDate(today()) : '',
    sign1Name:  s.principalName || 'Principal',
    sign1Title: 'Principal',
    sign2Name:  '',
    sign2Title: 'Class Teacher',
  };
}

function _certLogo(d, size){
  if (d.logo) return `<img src="${d.logo}" style="height:${size}px;object-fit:contain;">`;
  return `<div style="height:${size}px;width:${size}px;border-radius:50%;background:#e5e7eb;display:inline-flex;align-items:center;justify-content:center;font-size:${Math.round(size*0.5)}px;">🏫</div>`;
}
function _e(v){ return (typeof esc==='function') ? esc(v) : String(v==null?'':v); }

/* decorative corner blocks */
function _certCorners(a, a2){
  const c = (pos)=>`<div style="position:absolute;${pos}width:120px;height:120px;pointer-events:none;">
    <div style="position:absolute;inset:0;border:3px solid ${a};"></div>
    <div style="position:absolute;width:60px;height:60px;background:linear-gradient(135deg,${a},${a2});clip-path:polygon(0 0,100% 0,0 100%);"></div>
  </div>`;
  return `
    <div style="position:absolute;top:0;left:0;width:130px;height:130px;background:linear-gradient(135deg,${a2},${a});clip-path:polygon(0 0,100% 0,0 100%);opacity:.9;"></div>
    <div style="position:absolute;top:0;right:0;width:130px;height:130px;background:linear-gradient(225deg,${a2},${a});clip-path:polygon(100% 0,100% 100%,0 0);opacity:.9;"></div>
    <div style="position:absolute;bottom:0;left:0;width:130px;height:130px;background:linear-gradient(45deg,${a2},${a});clip-path:polygon(0 0,0 100%,100% 100%);opacity:.9;"></div>
    <div style="position:absolute;bottom:0;right:0;width:130px;height:130px;background:linear-gradient(315deg,${a2},${a});clip-path:polygon(100% 0,100% 100%,0 100%);opacity:.9;"></div>`;
}
function _certSeal(a, a2){
  return `<div style="position:relative;width:84px;height:84px;margin:0 auto;">
    <div style="position:absolute;inset:0;border-radius:50%;background:radial-gradient(circle at 35% 30%,${a2},${a});box-shadow:0 4px 12px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;color:#fff;font-size:30px;border:3px solid #fff;">🏅</div>
    <div style="position:absolute;bottom:-14px;left:24px;width:14px;height:34px;background:${a2};clip-path:polygon(0 0,100% 0,100% 100%,50% 78%,0 100%);"></div>
    <div style="position:absolute;bottom:-14px;right:24px;width:14px;height:34px;background:${a};clip-path:polygon(0 0,100% 0,100% 100%,50% 78%,0 100%);"></div>
  </div>`;
}

/* Main render — returns landscape certificate HTML */
function certRenderDesign(id, d){
  const t = CERT_DESIGNS.find(x=>x.id===id) || CERT_DESIGNS[0];
  const a = t.accent, a2 = t.accent2, font = t.font;

  let frameStyle, decoHTML='', bg='#ffffff', titleColor=a, nameColor=a2;
  if (t.deco==='luxury'){ bg='#0e0e0e'; }
  const lightText = (t.deco==='luxury');
  const textCol = lightText ? '#e8e8e8' : '#374151';
  const subCol  = lightText ? '#c9c9c9' : '#6b7280';
  const schoolCol = lightText ? '#f5f5f5' : '#1e293b';

  if (t.deco==='corners'){
    frameStyle = `border:none;`;
    decoHTML = _certCorners(a, a2) + `<div style="position:absolute;inset:18px;border:2px solid ${a};pointer-events:none;"></div><div style="position:absolute;inset:24px;border:1px solid ${a2};pointer-events:none;"></div>`;
  } else if (t.deco==='ribbon'){
    frameStyle = `border:10px solid ${a};outline:2px solid ${a2};outline-offset:-16px;`;
    decoHTML = `<div style="position:absolute;top:0;left:50%;transform:translateX(-50%);width:0;height:0;"></div>`;
  } else if (t.deco==='luxury'){
    frameStyle = `border:3px solid ${a};outline:1px solid ${a};outline-offset:-10px;`;
    decoHTML = _certCorners(a, '#2a2a2a');
  } else { /* line */
    frameStyle = `border:1px solid ${a};border-top:10px solid ${a};border-bottom:10px solid ${a};`;
  }

  return `
  <div style="position:relative;width:1000px;min-height:707px;background:${bg};font-family:${font};
              ${frameStyle}box-shadow:0 8px 30px rgba(0,0,0,.18);overflow:hidden;margin:0 auto;">
    ${decoHTML}
    <div style="position:relative;z-index:2;padding:46px 70px 40px;text-align:center;display:flex;flex-direction:column;min-height:707px;">

      <!-- School header -->
      <div style="display:flex;align-items:center;justify-content:center;gap:16px;margin-bottom:6px;">
        ${_certLogo(d,58)}
        <div style="text-align:left;">
          <div style="font-size:30px;font-weight:900;color:${schoolCol};letter-spacing:.5px;line-height:1.1;">${_e(d.schoolName)}</div>
          ${d.address?`<div style="font-size:13px;color:${subCol};">${_e(d.address)}</div>`:''}
          ${d.session?`<div style="font-size:13px;color:${subCol};">Session ${_e(d.session)}</div>`:''}
        </div>
      </div>

      <!-- Seal -->
      <div style="margin:10px 0 4px;">${_certSeal(a,a2)}</div>

      <!-- Title -->
      <div style="font-size:30px;font-weight:900;letter-spacing:2px;color:${titleColor};margin-top:14px;text-transform:uppercase;">${_e(d.topLabel)}</div>
      <div style="width:180px;height:3px;background:linear-gradient(90deg,transparent,${a},transparent);margin:8px auto 0;"></div>

      <!-- Subtitle -->
      <div style="font-size:15px;color:${textCol};margin-top:18px;">${_e(d.subtitle)}</div>

      <!-- Recipient -->
      <div style="font-size:46px;font-weight:700;font-style:italic;color:${nameColor};margin:8px 0 2px;font-family:${font};">${_e(d.recipient)}</div>
      <div style="width:340px;height:1px;background:${a};opacity:.4;margin:0 auto 14px;"></div>

      <!-- Body -->
      <div style="font-size:15px;color:${textCol};line-height:1.8;max-width:680px;margin:0 auto;">${_e(d.body)}</div>
      ${d.footer?`<div style="font-size:13px;color:${subCol};margin-top:10px;font-style:italic;">${_e(d.footer)}</div>`:''}

      <!-- Signatures -->
      <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:auto;padding-top:40px;">
        <div style="text-align:center;min-width:180px;">
          <div style="font-size:13px;color:${textCol};font-style:italic;">${_e(d.date)}</div>
          <div style="border-top:1.5px solid ${lightText?'#888':'#334155'};margin-top:6px;padding-top:5px;font-size:12px;color:${subCol};">Date</div>
        </div>
        ${d.sign2Name||d.sign2Title?`<div style="text-align:center;min-width:180px;">
          <div style="font-size:15px;font-weight:700;color:${schoolCol};">${_e(d.sign2Name)}</div>
          <div style="border-top:1.5px solid ${lightText?'#888':'#334155'};margin-top:6px;padding-top:5px;font-size:12px;color:${subCol};">${_e(d.sign2Title)}</div>
        </div>`:''}
        <div style="text-align:center;min-width:180px;">
          <div style="font-size:15px;font-weight:700;color:${schoolCol};">${_e(d.sign1Name)}</div>
          <div style="border-top:1.5px solid ${lightText?'#888':'#334155'};margin-top:6px;padding-top:5px;font-size:12px;color:${subCol};">${_e(d.sign1Title)}</div>
        </div>
      </div>
    </div>
  </div>`;
}

/* Print one certificate fit to a single A4 landscape page */
function certPrintDesign(html, title){
  const w = window.open('', '_blank', 'width=1120,height=820');
  if (!w) { try{ toast('Allow popups to print','warning'); }catch(e){} return; }
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title||'Certificate'}</title>
  <style>
    @page{ size:A4 landscape; margin:8mm; }
    *{box-sizing:border-box;} html,body{margin:0;padding:0;background:#eef2f7;}
    #cfit{width:1000px;margin:0 auto;}
    @media print{ html,body{background:#fff;} #cfit{margin:0;} }
  </style></head>
  <body><div id="cfit">${html}</div>
  <script>
  (function(){
    var f=document.getElementById('cfit'),done=false,MAXH=720;
    function go(){ if(done)return; done=true;
      try{ var h=f.scrollHeight; if(h>MAXH){ f.style.zoom=(MAXH/h).toFixed(4); } }catch(e){}
      setTimeout(function(){ window.focus(); window.print(); },200);
    }
    var imgs=f.querySelectorAll('img'),left=imgs.length;
    if(!left){ go(); }
    else{ for(var i=0;i<imgs.length;i++){ (function(im){ if(im.complete){ if(--left===0)go(); } else im.onload=im.onerror=function(){ if(--left===0)go(); }; })(imgs[i]); } setTimeout(go,1600); }
    window.onafterprint=function(){ setTimeout(function(){ try{window.close();}catch(e){} },300); };
  })();
  <\/script></body></html>`);
  w.document.close();
}
