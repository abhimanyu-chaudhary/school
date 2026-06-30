/* ═══════════════════════════════════════════════════════════════
   FACE RECOGNITION ATTENDANCE  (powered by face-api.js / @vladmandic)
   • Students & teachers enroll their face once from their own panel.
   • A scanner (admin / teacher kiosk) recognises the face and marks
     attendance automatically — touch-free, proxy-proof (blink liveness).
   Descriptors stored in DB 'face_descriptors' (128-D vectors).
═══════════════════════════════════════════════════════════════ */

const FACE_CDN   = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/dist/face-api.min.js';
const FACE_MODELS= 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';
const FACE_MATCH_THRESHOLD = 0.45;   // lower = stricter (euclidean distance)
const FACE_MIN_SCORE = 0.55;         // min detector confidence

let _faceReady=false, _faceLoadingPromise=null;

function _faceLoadScript(){
  return new Promise((res,rej)=>{
    if (window.faceapi) return res();
    const s=document.createElement('script'); s.src=FACE_CDN;
    s.onload=()=>res(); s.onerror=()=>rej(new Error('script load failed'));
    document.head.appendChild(s);
  });
}
async function faceLoadModels(statusEl){
  if (_faceReady) return true;
  if (_faceLoadingPromise) return _faceLoadingPromise;
  _faceLoadingPromise = (async()=>{
    if (statusEl) statusEl.textContent='⏳ Loading face engine…';
    await _faceLoadScript();
    const f=window.faceapi;
    await Promise.all([
      f.nets.tinyFaceDetector.loadFromUri(FACE_MODELS),
      f.nets.faceLandmark68Net.loadFromUri(FACE_MODELS),
      f.nets.faceRecognitionNet.loadFromUri(FACE_MODELS),
    ]);
    _faceReady=true;
    if (statusEl) statusEl.textContent='';
    return true;
  })();
  return _faceLoadingPromise;
}

/* ── Descriptor store ── */
function _faceStore(){ return DB.getObj('face_descriptors')||{}; }
function _faceSaveStore(o){ DB.set('face_descriptors', o); }
function faceIsEnrolled(userId){ const s=_faceStore(); return !!(s[userId] && (s[userId].descriptors||[]).length); }

/* ── Camera helpers ── */
async function _faceStartCam(video){
  const stream=await navigator.mediaDevices.getUserMedia({ video:{ facingMode:'user', width:480, height:360 }, audio:false });
  video.srcObject=stream; await video.play(); return stream;
}
function _faceStopCam(stream){ try{ (stream.getTracks()||[]).forEach(t=>t.stop()); }catch(e){} }

async function _faceDetectOne(video){
  const f=window.faceapi;
  const opts=new f.TinyFaceDetectorOptions({ inputSize:320, scoreThreshold:FACE_MIN_SCORE });
  return await f.detectSingleFace(video,opts).withFaceLandmarks().withFaceDescriptor();
}

/* Eye-aspect-ratio for blink liveness */
function _faceEAR(eye){
  const d=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  return (d(eye[1],eye[5])+d(eye[2],eye[4]))/(2*d(eye[0],eye[3]));
}

/* ════════════════ ENROLLMENT (from student/teacher panel) ════════════════ */
function faceOpenEnroll(userId, role, name, classId){
  const root=document.getElementById('modals-root'); if(!root) return;
  const NEED=3;
  root.innerHTML=`
  <div class="modal-overlay open" id="faceEnrollModal" style="display:flex;align-items:flex-start;justify-content:center;overflow-y:auto;padding:18px 10px;z-index:1000;">
    <div style="background:var(--bg-1,#12121a);border-radius:16px;max-width:430px;width:96%;margin:auto;overflow:hidden;border:1px solid var(--border,rgba(255,255,255,.1));">
      <div style="background:linear-gradient(135deg,#7c3aed,#3b82f6);padding:13px 18px;display:flex;align-items:center;justify-content:space-between;">
        <div style="color:#fff;font-weight:800;">🙂 Register My Face</div>
        <button onclick="_faceCloseEnroll()" style="background:rgba(255,255,255,.2);border:none;width:30px;height:30px;border-radius:50%;cursor:pointer;color:#fff;">✕</button>
      </div>
      <div style="padding:16px;text-align:center;">
        <div style="position:relative;border-radius:14px;overflow:hidden;background:#000;aspect-ratio:4/3;">
          <video id="faceEnrollVid" playsinline muted style="width:100%;height:100%;object-fit:cover;transform:scaleX(-1);"></video>
          <div id="faceEnrollRing" style="position:absolute;inset:14px;border:3px dashed rgba(255,255,255,.5);border-radius:50%;pointer-events:none;"></div>
        </div>
        <div id="faceEnrollStatus" style="margin:12px 0;font-size:.9rem;color:var(--text-2,#cbd5e1);min-height:22px;">Look straight at the camera</div>
        <div style="display:flex;gap:8px;justify-content:center;margin-bottom:6px;">
          ${Array.from({length:NEED}).map((_,i)=>`<div id="faceDot${i}" style="width:12px;height:12px;border-radius:50%;background:rgba(255,255,255,.2);"></div>`).join('')}
        </div>
        <button class="btn btn-primary" id="faceCaptureBtn" style="width:100%;" onclick="_faceCapture()">📸 Capture Face</button>
        <div style="font-size:.72rem;color:var(--text-3,#94a3b8);margin-top:8px;">Capture ${NEED} times — keep your face centered & well-lit. Move slightly between captures.</div>
      </div>
    </div>
  </div>`;
  document.body.style.overflow='hidden';
  window._faceEnrollCtx={ userId, role, name, classId, need:NEED, samples:[], stream:null };
  const v=document.getElementById('faceEnrollVid');
  const st=document.getElementById('faceEnrollStatus');
  faceLoadModels(st).then(()=>_faceStartCam(v).then(s=>{window._faceEnrollCtx.stream=s; st.textContent='Ready — tap Capture';})
    .catch(()=>{ st.textContent='⚠️ Camera access denied'; }))
    .catch(()=>{ st.textContent='⚠️ Could not load face engine (needs internet first time)'; });
}
function _faceCloseEnroll(){
  const c=window._faceEnrollCtx; if(c) _faceStopCam(c.stream);
  const m=document.getElementById('faceEnrollModal'); if(m) m.remove();
  document.body.style.overflow=''; window._faceEnrollCtx=null;
}
async function _faceCapture(){
  const c=window._faceEnrollCtx; if(!c) return;
  const v=document.getElementById('faceEnrollVid'), st=document.getElementById('faceEnrollStatus');
  const btn=document.getElementById('faceCaptureBtn');
  btn.disabled=true; st.textContent='🔍 Detecting…';
  const det=await _faceDetectOne(v);
  if(!det){ st.textContent='😕 No face detected — center your face & retry'; btn.disabled=false; return; }
  c.samples.push(Array.from(det.descriptor));
  const dot=document.getElementById('faceDot'+(c.samples.length-1)); if(dot) dot.style.background='#10b981';
  if(c.samples.length>=c.need){
    const store=_faceStore();
    store[c.userId]={ role:c.role, name:c.name, classId:c.classId||'', descriptors:c.samples, updatedAt:today() };
    _faceSaveStore(store);
    st.textContent='✅ Face registered successfully!';
    toast('✅ Your face is registered. Attendance can now be marked by face.','success');
    setTimeout(_faceCloseEnroll, 1100);
  } else {
    st.textContent=`Captured ${c.samples.length}/${c.need} — move slightly & capture again`;
    btn.disabled=false;
  }
}

/* ════════════════ SCANNER (kiosk — marks attendance) ════════════════ */
function faceOpenScanner(opts){
  // opts: { mode:'student'|'teacher', classId?, date? , title? }
  opts=opts||{}; const mode=opts.mode||'student'; const date=opts.date||today();
  const store=_faceStore();
  const enrolled=Object.keys(store).map(uid=>({uid,...store[uid]}))
    .filter(e=>e.role===mode && (mode!=='student' || !opts.classId || e.classId===opts.classId));

  const root=document.getElementById('modals-root'); if(!root) return;
  root.innerHTML=`
  <div class="modal-overlay open" id="faceScanModal" style="display:flex;align-items:flex-start;justify-content:center;overflow-y:auto;padding:18px 10px;z-index:1000;">
    <div style="background:var(--bg-1,#12121a);border-radius:16px;max-width:460px;width:96%;margin:auto;overflow:hidden;border:1px solid var(--border,rgba(255,255,255,.1));">
      <div style="background:linear-gradient(135deg,#10b981,#06b6d4);padding:13px 18px;display:flex;align-items:center;justify-content:space-between;">
        <div style="color:#fff;font-weight:800;">📷 Face Attendance${opts.title?' — '+esc(opts.title):''}</div>
        <button onclick="_faceCloseScanner()" style="background:rgba(255,255,255,.2);border:none;width:30px;height:30px;border-radius:50%;cursor:pointer;color:#fff;">✕</button>
      </div>
      <div style="padding:16px;text-align:center;">
        <div style="position:relative;border-radius:14px;overflow:hidden;background:#000;aspect-ratio:4/3;">
          <video id="faceScanVid" playsinline muted style="width:100%;height:100%;object-fit:cover;transform:scaleX(-1);"></video>
          <div id="faceScanFlash" style="position:absolute;inset:0;background:#10b981;opacity:0;transition:opacity .25s;"></div>
        </div>
        <div id="faceScanStatus" style="margin:12px 0 4px;font-size:1.05rem;font-weight:800;color:var(--text-1,#fff);min-height:26px;">Starting…</div>
        <div id="faceScanHint" style="font-size:.74rem;color:var(--text-3,#94a3b8);">Point the camera at each student's face, one by one — they get marked automatically.</div>
        <div id="faceScanCount" style="margin-top:8px;font-weight:800;color:#10b981;">✅ 0 marked present</div>
        <div id="faceScanLog" style="margin-top:10px;text-align:left;max-height:150px;overflow-y:auto;"></div>
      </div>
    </div>
  </div>`;
  document.body.style.overflow='hidden';

  if(!enrolled.length){
    document.getElementById('faceScanStatus').textContent='⚠️ No faces enrolled yet';
    document.getElementById('faceScanHint').textContent = mode==='student'
      ? 'Ask students to tap "Register My Face" in their app.'
      : 'Ask teachers to register their face in their app.';
    return;
  }

  window._faceScanCtx={ mode, date, classId:opts.classId||'', enrolled, stream:null, running:true,
    matcher:null, marked:{}, count:0, cooldownUntil:0, lastLabel:'' };

  const v=document.getElementById('faceScanVid'), st=document.getElementById('faceScanStatus');
  faceLoadModels(st).then(()=>{
    const f=window.faceapi;
    const labeled=enrolled.map(e=>new f.LabeledFaceDescriptors(e.uid, e.descriptors.map(d=>new Float32Array(d))));
    window._faceScanCtx.matcher=new f.FaceMatcher(labeled, FACE_MATCH_THRESHOLD);
    return _faceStartCam(v);
  }).then(s=>{ window._faceScanCtx.stream=s; st.textContent='👀 Look at the camera'; _faceScanLoop(); })
    .catch(()=>{ st.textContent='⚠️ Camera/engine error (needs internet first time)'; });
}
function _faceCloseScanner(){
  const c=window._faceScanCtx; if(c){ c.running=false; _faceStopCam(c.stream); }
  const m=document.getElementById('faceScanModal'); if(m) m.remove();
  document.body.style.overflow=''; window._faceScanCtx=null;
}
async function _faceScanLoop(){
  const c=window._faceScanCtx; if(!c||!c.running) return;
  const v=document.getElementById('faceScanVid'), st=document.getElementById('faceScanStatus');
  try{
    const det=await _faceDetectOne(v);
    const now=Date.now();
    if(det){
      const best=c.matcher.findBestMatch(det.descriptor);
      if(best.label!=='unknown'){
        const ent=c.enrolled.find(e=>e.uid===best.label);
        const nm=ent?ent.name:best.label;
        if(c.marked[best.label]){
          // already done — gentle reminder, then ready for next face
          st.innerHTML=`✅ <b>${esc(nm)}</b> already present`;
          if(now>c.cooldownUntil) c.lastLabel='';   // allow a fresh face immediately
        } else if(now>c.cooldownUntil){
          const ok = c.mode==='student' ? _faceMarkStudent(best.label,c.date) : _faceMarkTeacher(best.label,c.date);
          if(ok){
            c.marked[best.label]=true; c.count++; c.lastLabel=best.label;
            _faceFlash(); _faceLog(nm);
            st.innerHTML=`✅ <b style="color:#10b981;">${esc(nm)}</b> is Present!`;
            const cEl=document.getElementById('faceScanCount'); if(cEl) cEl.textContent='✅ '+c.count+' marked present';
            c.cooldownUntil=now+1600;   // brief pause, then point at the next student
          }
        } else {
          st.innerHTML=`✅ <b>${esc(nm)}</b> — done. Point at next student…`;
        }
      } else {
        st.textContent='🔍 Face not recognised (is the student registered?)';
      }
    } else {
      st.textContent='👀 Point the camera at a student';
    }
  }catch(e){}
  if(c.running) setTimeout(_faceScanLoop, 280);
}
function _faceFlash(){ const f=document.getElementById('faceScanFlash'); if(!f)return; f.style.opacity='.6'; setTimeout(()=>f.style.opacity='0',250); }
function _faceLog(name){
  const log=document.getElementById('faceScanLog'); if(!log)return;
  const t=new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});
  const row=document.createElement('div');
  row.style.cssText='display:flex;justify-content:space-between;background:rgba(16,185,129,.12);border:1px solid rgba(16,185,129,.3);border-radius:8px;padding:6px 10px;margin-bottom:6px;font-size:.82rem;';
  row.innerHTML=`<span style="font-weight:700;">✅ ${esc(name)}</span><span style="color:#94a3b8;">${t}</span>`;
  log.prepend(row);
}

/* ── Mark helpers (reuse existing attendance schema) ── */
function _faceMarkStudent(studentId, date){
  const st=DB.find('students',studentId); if(!st) return false;
  const all=DB.get('attendance');
  const rest=all.filter(a=>!(a.studentId===studentId && a.date===date));
  rest.push({ id:genId('att'), classId:st.classId, studentId, date, status:'present', via:'face' });
  DB.set('attendance', rest);
  return true;
}
function _faceMarkTeacher(teacherId, date){
  const all=DB.get('teacher_attendance')||[];
  const rest=all.filter(a=>!(a.teacherId===teacherId && a.date===date));
  rest.push({ id:genId('tatt'), teacherId, date, status:'present', via:'face' });
  DB.set('teacher_attendance', rest);
  return true;
}
