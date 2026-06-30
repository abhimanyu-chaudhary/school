/* ═══════════════════════════════════════════════════════════════
   GALLERY VIDEOS — shared by Admin, Teacher (manage) & Student/Parent (view)
   Admin/teacher paste a video link (YouTube / Shorts / Drive / .mp4);
   it shows in the gallery date-wise. Parents can watch, share & open.
   Stored in DB 'gallery_videos'.
═══════════════════════════════════════════════════════════════ */
const GV = {
  onChange: null,   // each panel sets this to its re-render function

  all(){
    return (DB.get('gallery_videos')||[]).slice()
      .sort((a,b)=> (b.date||'').localeCompare(a.date||'') || (b.createdAt||0)-(a.createdAt||0));
  },

  embed(url){
    url=(url||'').trim();
    let m=url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/))([\w-]{11})/);
    if(m) return { type:'iframe', embed:'https://www.youtube.com/embed/'+m[1] };
    m=url.match(/drive\.google\.com\/file\/d\/([\w-]+)/);
    if(m) return { type:'iframe', embed:'https://drive.google.com/file/d/'+m[1]+'/preview' };
    return { type:'file', url };
  },

  cardHtml(v, canManage){
    const e=GV.embed(v.url);
    const player = e.type==='file'
      ? `<video src="${esc(e.url)}" controls preload="metadata" style="width:100%;aspect-ratio:16/9;background:#000;border-radius:12px 12px 0 0;display:block;"></video>`
      : `<iframe src="${e.embed}" style="width:100%;aspect-ratio:16/9;border:0;border-radius:12px 12px 0 0;display:block;" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowfullscreen loading="lazy"></iframe>`;
    return `<div style="background:var(--bg-2,rgba(255,255,255,.06));border:1px solid var(--border,rgba(255,255,255,.12));border-radius:14px;overflow:hidden;">
      ${player}
      <div style="padding:10px 12px;">
        <div style="font-weight:700;font-size:.9rem;">${esc(v.title||'Video')}</div>
        <div style="font-size:.72rem;color:var(--text-3,#94a3b8);margin-top:2px;">📅 ${formatDate(v.date||v.createdAt)}${v.addedBy?' · '+esc(v.addedBy):''}</div>
        <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap;">
          <button class="btn btn-sm btn-secondary" onclick="GV.open('${v.id}')">▶ Open</button>
          <button class="btn btn-sm btn-secondary" onclick="GV.share('${v.id}')">🔗 Share</button>
          ${e.type==='file'?`<button class="btn btn-sm btn-secondary" onclick="GV.download('${v.id}')">⬇ Download</button>`:''}
          ${canManage?`<button class="btn btn-sm btn-danger" onclick="GV.del('${v.id}')">🗑</button>`:''}
        </div>
      </div>
    </div>`;
  },

  listHtml(canManage){
    const vids=GV.all();
    if(!vids.length) return `<div class="empty-state"><div class="e-icon">🎬</div><h3>No Videos Yet</h3><p>${canManage?'Tap "Add Video" and paste a YouTube/Drive/MP4 link to share school activities with parents.':'Videos of school activities will appear here.'}</p></div>`;
    const groups={};
    vids.forEach(v=>{ const d=(v.date||'').slice(0,10)|| (v.createdAt?new Date(v.createdAt).toISOString().slice(0,10):'—'); (groups[d]=groups[d]||[]).push(v); });
    return Object.keys(groups).sort((a,b)=>b.localeCompare(a)).map(d=>`
      <div style="margin-bottom:18px;">
        <div style="font-weight:700;font-size:.85rem;color:var(--text-2,#cbd5e1);margin-bottom:10px;">📅 ${formatDate(d)}</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px;">
          ${groups[d].map(v=>GV.cardHtml(v,canManage)).join('')}
        </div>
      </div>`).join('');
  },

  openAdd(){
    const td=(typeof today==='function')?today():'';
    buildModal('modal-gv','🎬 Add Activity Video',`
      <div class="form-group"><label class="form-label">Title</label>
        <input class="form-control" id="gv-title" placeholder="e.g. Annual Day Dance Performance"></div>
      <div class="form-group"><label class="form-label">Video Link *</label>
        <input class="form-control" id="gv-url" placeholder="Paste YouTube / Shorts / Google Drive / .mp4 link"></div>
      <div class="form-group"><label class="form-label">Date</label>
        <input type="date" class="form-control" id="gv-date" value="${td}"></div>
      <div style="font-size:.74rem;color:var(--text-3,#94a3b8);">Supports YouTube, YouTube Shorts, Google Drive share links, or a direct video (.mp4) URL. Parents can watch, share & open it.</div>
    `, GV.save);
  },
  save(){
    const g=id=>{const e=document.getElementById(id);return e?e.value.trim():'';};
    const url=g('gv-url');
    if(!url){ toast('Paste a video link','warning'); return; }
    const arr=DB.get('gallery_videos')||[];
    arr.push({ id:genId('gv'), title:g('gv-title')||'Video', url, date:g('gv-date')||((typeof today==='function')?today():''),
               addedBy:(typeof CU!=='undefined'&&CU&&CU.name)||'Staff', createdAt:Date.now() });
    DB.set('gallery_videos', arr);
    closeAllModals(); toast('✅ Video added','success');
    if(GV.onChange) GV.onChange();
  },
  del(id){
    if(!confirmAction('Delete this video?')) return;
    DB.set('gallery_videos',(DB.get('gallery_videos')||[]).filter(v=>v.id!==id));
    if(GV.onChange) GV.onChange();
  },
  open(id){ const v=GV.all().find(x=>x.id===id); if(v) window.open(v.url,'_blank','noopener'); },
  share(id){
    const v=GV.all().find(x=>x.id===id); if(!v) return;
    if(navigator.share){ navigator.share({title:v.title||'Video', text:v.title||'School activity video', url:v.url}).catch(()=>{}); }
    else if(navigator.clipboard){ navigator.clipboard.writeText(v.url).then(()=>toast('🔗 Link copied','success')).catch(()=>window.open(v.url,'_blank')); }
    else window.open(v.url,'_blank');
  },
  download(id){
    const v=GV.all().find(x=>x.id===id); if(!v) return;
    const a=document.createElement('a'); a.href=v.url; a.download=(v.title||'video'); a.target='_blank';
    document.body.appendChild(a); a.click(); a.remove();
  },
};
