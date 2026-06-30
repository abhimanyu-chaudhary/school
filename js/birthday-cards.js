/* ═══════════════════════════════════════════════════════════════
   BIRTHDAY CARDS — 5 attractive, downloadable & shareable designs.
   Rendered on <canvas> (1080×1440) so the parent can download a crisp
   PNG or share it straight to WhatsApp / Instagram / social media.
═══════════════════════════════════════════════════════════════ */

const BDAY_TEMPLATES = [
  { id:'b1', name:'Black & Gold', swatch:'#f5c542',
    bg:['#000000','#1c1c1c'], accent:'#f5c542', accent2:'#e0a800', text:'#f7e6a8',
    ribbon:'#e0a800', confetti:['#f5c542','#e0a800','#fff3c4','#bfa14a'] },
  { id:'b2', name:'Royal Blue', swatch:'#ffd23f',
    bg:['#06214d','#0a4bb0'], accent:'#ffd23f', accent2:'#ffb703', text:'#ffffff',
    ribbon:'#ffb703', confetti:['#ffd23f','#ff5d8f','#4cc9f0','#ffffff'] },
  { id:'b3', name:'Pink Party', swatch:'#ff4d8d',
    bg:['#7a1f5c','#c2185b'], accent:'#ffd6e7', accent2:'#ff4d8d', text:'#ffffff',
    ribbon:'#ff4d8d', confetti:['#ffd6e7','#ff4d8d','#ffe066','#ffffff'] },
  { id:'b4', name:'Teal Fresh', swatch:'#14a098',
    bg:['#063b3b','#0d7377'], accent:'#ffe066', accent2:'#14a098', text:'#eafff8',
    ribbon:'#14a098', confetti:['#ffe066','#14e0c8','#ff8c66','#ffffff'] },
  { id:'b5', name:'Purple Magic', swatch:'#b5179e',
    bg:['#2b0a4a','#6a0dad'], accent:'#ff8fd0', accent2:'#b5179e', text:'#ffffff',
    ribbon:'#b5179e', confetti:['#ff8fd0','#c77dff','#ffd23f','#ffffff'] },
];

/* ── Date helpers ── */
function bdayIsToday(dob){
  if (!dob) return false;
  const d = new Date(dob), t = new Date();
  return d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
}
function bdayAge(dob){
  if (!dob) return '';
  const d = new Date(dob), t = new Date();
  let a = t.getFullYear() - d.getFullYear();
  if (t.getMonth() < d.getMonth() || (t.getMonth() === d.getMonth() && t.getDate() < d.getDate())) a--;
  return a >= 0 ? a : '';
}

/* ── Image loader (data URLs load instantly, no CORS taint) ── */
function _bdayLoadImg(src){
  return new Promise(res=>{
    if (!src) { res(null); return; }
    const i = new Image();
    i.crossOrigin = 'anonymous';
    i.onload = ()=>res(i);
    i.onerror = ()=>res(null);
    i.src = src;
  });
}

/* ── small deterministic RNG so confetti looks the same each render ── */
function _bdayRng(seed){ let s = seed||1; return ()=>{ s = (s*9301+49297)%233280; return s/233280; }; }

function _bdayRoundRect(ctx,x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.arcTo(x+w,y,x+w,y+h,r);
  ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r);
  ctx.arcTo(x,y,x+w,y,r);
  ctx.closePath();
}
function _bdayBalloon(ctx,x,y,rw,rh,color){
  ctx.save();
  ctx.fillStyle=color;
  ctx.beginPath(); ctx.ellipse(x,y,rw,rh,0,0,Math.PI*2); ctx.fill();
  // knot
  ctx.beginPath(); ctx.moveTo(x-7,y+rh); ctx.lineTo(x+7,y+rh); ctx.lineTo(x,y+rh+14); ctx.closePath(); ctx.fill();
  // string
  ctx.strokeStyle='rgba(255,255,255,.35)'; ctx.lineWidth=2;
  ctx.beginPath(); ctx.moveTo(x,y+rh+14);
  ctx.quadraticCurveTo(x+18,y+rh+90,x,y+rh+160); ctx.stroke();
  // highlight
  ctx.fillStyle='rgba(255,255,255,.28)';
  ctx.beginPath(); ctx.ellipse(x-rw*0.32,y-rh*0.32,rw*0.22,rh*0.3,-0.5,0,Math.PI*2); ctx.fill();
  ctx.restore();
}
function _bdayConfetti(ctx,W,topH,colors,seed){
  const rnd=_bdayRng(seed);
  for(let i=0;i<70;i++){
    const x=rnd()*W, y=rnd()*topH, s=6+rnd()*12, rot=rnd()*Math.PI;
    ctx.save(); ctx.translate(x,y); ctx.rotate(rot);
    ctx.fillStyle=colors[Math.floor(rnd()*colors.length)];
    if(rnd()>0.5) ctx.fillRect(-s/2,-s/4,s,s/2);
    else { ctx.beginPath(); ctx.arc(0,0,s/2.4,0,Math.PI*2); ctx.fill(); }
    ctx.restore();
  }
}
function _bdayFitText(ctx,text,maxW){
  // shrink helper not strictly needed; ctx.font set by caller
  return text;
}

/* ── Main: draw one birthday card. Returns a Promise. ── */
async function drawBirthdayCard(canvas, tplId, data){
  const t = BDAY_TEMPLATES.find(x=>x.id===tplId) || BDAY_TEMPLATES[0];
  const W=1080, H=1440;
  canvas.width=W; canvas.height=H;
  const ctx=canvas.getContext('2d');

  const [logo, photo] = await Promise.all([ _bdayLoadImg(data.logo), _bdayLoadImg(data.photo) ]);

  // Background gradient
  const grad=ctx.createLinearGradient(0,0,0,H);
  grad.addColorStop(0,t.bg[0]); grad.addColorStop(1,t.bg[1]);
  ctx.fillStyle=grad; ctx.fillRect(0,0,W,H);

  // Subtle radial glow centre
  const glow=ctx.createRadialGradient(W/2,560,80,W/2,560,640);
  glow.addColorStop(0, t.accent+'22'); glow.addColorStop(1,'transparent');
  ctx.fillStyle=glow; ctx.fillRect(0,0,W,H);

  // Confetti top + bottom
  _bdayConfetti(ctx,W,440,t.confetti, tplId.charCodeAt(1)*37+3);
  ctx.save(); ctx.translate(0,H); ctx.scale(1,-1);
  _bdayConfetti(ctx,W,300,t.confetti, tplId.charCodeAt(1)*53+9); ctx.restore();

  // Balloons
  _bdayBalloon(ctx,120,360,70,90,t.accent2);
  _bdayBalloon(ctx,W-120,330,72,94,t.accent);
  _bdayBalloon(ctx,70,640,52,68,t.confetti[2]||t.accent);
  _bdayBalloon(ctx,W-70,660,54,70,t.confetti[1]||t.accent2);

  // Logo
  let topY=70;
  if (logo){
    const ls=120;
    ctx.save();
    ctx.beginPath(); ctx.arc(W/2,topY+ls/2,ls/2+6,0,Math.PI*2);
    ctx.fillStyle='rgba(255,255,255,.92)'; ctx.fill();
    ctx.beginPath(); ctx.arc(W/2,topY+ls/2,ls/2,0,Math.PI*2); ctx.clip();
    ctx.drawImage(logo, W/2-ls/2, topY, ls, ls);
    ctx.restore();
    topY+=ls+18;
  } else { topY+=12; }

  // School name
  ctx.textAlign='center';
  ctx.fillStyle=t.accent;
  ctx.font='800 52px Georgia, serif';
  ctx.fillText((data.schoolName||'School Name').toUpperCase(), W/2, topY+44, W-120);
  topY+=70;
  if (data.address){
    ctx.fillStyle=t.text; ctx.font='400 26px "Segoe UI", Arial';
    ctx.fillText(data.address, W/2, topY, W-160); topY+=20;
  }

  // HAPPY BIRTHDAY heading
  ctx.fillStyle=t.text; ctx.font='700 40px "Segoe UI", Arial';
  ctx.fillText('HAPPY', W/2, topY+70);
  ctx.fillStyle=t.accent; ctx.font='italic 800 96px Georgia, serif';
  ctx.fillText('Birthday', W/2, topY+160);
  let py=topY+210;

  // Photo frame
  const pw=420, ph=440, px=W/2-pw/2;
  ctx.save();
  // gold frame
  ctx.shadowColor='rgba(0,0,0,.5)'; ctx.shadowBlur=30;
  _bdayRoundRect(ctx,px-10,py-10,pw+20,ph+20,24);
  ctx.fillStyle=t.accent; ctx.fill();
  ctx.shadowBlur=0;
  _bdayRoundRect(ctx,px,py,pw,ph,18); ctx.clip();
  if (photo){
    // cover-fit
    const ir=photo.width/photo.height, fr=pw/ph;
    let sw,sh,sx,sy;
    if(ir>fr){ sh=photo.height; sw=sh*fr; sx=(photo.width-sw)/2; sy=0; }
    else { sw=photo.width; sh=sw/fr; sx=0; sy=(photo.height-sh)/2; }
    ctx.drawImage(photo,sx,sy,sw,sh,px,py,pw,ph);
  } else {
    ctx.fillStyle='#e5e7eb'; ctx.fillRect(px,py,pw,ph);
    ctx.fillStyle='#9ca3af'; ctx.font='800 160px "Segoe UI"'; ctx.textAlign='center';
    ctx.fillText((data.name||'?')[0].toUpperCase(), W/2, py+ph/2+56);
  }
  ctx.restore();
  py+=ph+30;

  // Name ribbon
  ctx.save();
  const rw=560, rx=W/2-rw/2, rh=72;
  ctx.fillStyle=t.ribbon;
  _bdayRoundRect(ctx,rx,py,rw,rh,12); ctx.fill();
  // ribbon tails
  ctx.beginPath(); ctx.moveTo(rx,py+8); ctx.lineTo(rx-34,py+rh/2); ctx.lineTo(rx,py+rh-8); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(rx+rw,py+8); ctx.lineTo(rx+rw+34,py+rh/2); ctx.lineTo(rx+rw,py+rh-8); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#1a1a1a'; ctx.textAlign='center'; ctx.font='italic 800 48px Georgia, serif';
  ctx.fillText(data.name||'Student', W/2, py+50, rw-40);
  ctx.restore();
  py+=rh+44;

  // Details
  ctx.textAlign='center';
  const lines=[];
  if (data.className) lines.push('Class : '+data.className);
  if (data.father)    lines.push('Father Name : '+data.father);
  if (data.mother)    lines.push('Mother Name : '+data.mother);
  if (data.scholarNo) lines.push('Scholar No : '+data.scholarNo);
  if (data.age!=='' && data.age!=null) lines.push('Completed Year : '+data.age);
  if (data.dob)       lines.push(formatDate(data.dob));
  ctx.fillStyle=t.text; ctx.font='600 34px Georgia, serif';
  lines.forEach((ln,i)=>{ ctx.fillText(ln, W/2, py+i*46); });

  // Footer bar
  const fy=H-78;
  ctx.fillStyle=t.accent;
  ctx.fillRect(0,fy,W,78);
  ctx.fillStyle='#1a1a1a'; ctx.font='700 28px "Segoe UI", Arial'; ctx.textAlign='center';
  const foot=[ data.address?('📍 '+data.address):'', data.phone?('📞 '+data.phone):'' ].filter(Boolean).join('    ');
  ctx.fillText(foot || (data.schoolName||''), W/2, fy+50, W-60);

  return canvas;
}
