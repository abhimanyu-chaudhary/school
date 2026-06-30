/* ═══════════════════════════════════════════════════════════════
   GEOFENCING ATTENDANCE
   Staff are auto-marked PRESENT when they enter the school's defined
   GPS boundary. Uses the device Geolocation API + Haversine distance.
   Fence config lives in school_settings: { lat, lng, geofenceRadius,
   geofenceEnabled }. Marks into 'teacher_attendance'.
═══════════════════════════════════════════════════════════════ */

function geoFence(){
  const s = (typeof getSettings==='function') ? getSettings() : DB.getObj('school_settings');
  return {
    lat: parseFloat(s.lat),
    lng: parseFloat(s.lng),
    radius: Number(s.geofenceRadius || 150),   // metres
    enabled: !!s.geofenceEnabled,
  };
}

function geoHaversine(lat1,lng1,lat2,lng2){
  const R=6371000, rad=Math.PI/180;
  const dLat=(lat2-lat1)*rad, dLng=(lng2-lng1)*rad;
  const a=Math.sin(dLat/2)**2 + Math.cos(lat1*rad)*Math.cos(lat2*rad)*Math.sin(dLng/2)**2;
  return R*2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); // metres
}

function _geoSetStatus(state, dist, radius){
  const el=document.getElementById('geoBanner'); if(!el) return;
  const map={
    off:     ['rgba(148,163,184,.12)','#94a3b8','📍 Location attendance not enabled by school'],
    checking:['rgba(59,130,246,.12)','#3b82f6','📡 Checking your location…'],
    present: ['rgba(16,185,129,.12)','#10b981','✅ You are inside school — marked Present'+(dist!=null?' ('+dist+'m)':'')],
    already: ['rgba(16,185,129,.12)','#10b981','✅ Already marked Present today'],
    outside: ['rgba(245,158,11,.12)','#f59e0b','📍 You are '+(dist!=null?dist+'m':'')+' away — come within '+(radius||'')+'m of school'],
    denied:  ['rgba(239,68,68,.12)','#ef4444','⚠️ Location permission denied — allow location to auto-mark'],
    nofence: ['rgba(245,158,11,.12)','#f59e0b','⚠️ School location not set yet (ask admin)'],
  };
  const [bg,col,txt]=map[state]||map.off;
  el.style.cssText='background:'+bg+';border:1px solid '+col+'55;border-radius:10px;padding:10px 14px;margin-bottom:12px;font-size:.85rem;color:'+col+';font-weight:600;';
  el.textContent=txt;
}

/* Mark current teacher present if inside the fence.
   opts.auto = true → silent (no warning toasts), used on page load. */
function geoMarkTeacherIfInside(opts){
  opts=opts||{}; const auto=!!opts.auto;
  const f=geoFence();
  if(!f.enabled){ _geoSetStatus('off'); if(!auto) toast('Geofence attendance is off','info'); return; }
  if(!f.lat||!f.lng){ _geoSetStatus('nofence'); if(!auto) toast('School location not set','warning'); return; }

  const td=today();
  const already=(DB.get('teacher_attendance')||[]).find(a=>a.teacherId===CU.id&&a.date===td&&a.status==='present');
  if(already){ _geoSetStatus('already'); if(!auto) toast('✅ Already marked present today','info'); return; }

  if(!navigator.geolocation){ if(!auto) toast('Location not supported on this device','error'); return; }
  _geoSetStatus('checking');
  navigator.geolocation.getCurrentPosition(pos=>{
    const d=geoHaversine(pos.coords.latitude,pos.coords.longitude,f.lat,f.lng);
    const dist=Math.round(d);
    if(d<=f.radius){
      const all=DB.get('teacher_attendance')||[];
      const rest=all.filter(a=>!(a.teacherId===CU.id&&a.date===td));
      rest.push({ id:genId('tatt'), teacherId:CU.id, date:td, status:'present', via:'geo' });
      DB.set('teacher_attendance', rest);
      _geoSetStatus('present', dist);
      toast('✅ Auto-marked Present — inside school premises','success');
    } else {
      _geoSetStatus('outside', dist, f.radius);
      if(!auto) toast('📍 You are '+dist+'m away — get within '+f.radius+'m','warning');
    }
  }, err=>{
    _geoSetStatus('denied');
    if(!auto) toast('Location permission denied','error');
  }, { enableHighAccuracy:true, timeout:10000, maximumAge:0 });
}
