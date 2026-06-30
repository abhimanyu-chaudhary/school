/* ═══════════════════════════════════════════════════════════════
   WHATSAPP + SMS MESSAGING
   Schools plug in their own provider (or use free WhatsApp
   click-to-chat) and send notices, reminders & alerts to parents.
   Config lives in school_settings.commConfig.
   API providers are called via the server relay api/notify.php
   (keeps API keys off the client where possible).
═══════════════════════════════════════════════════════════════ */

function msgCfg(){
  const s=getSettings();
  return Object.assign({
    waEnabled:true,  waProvider:'clicktochat',           // clicktochat | cloud | gupshup | twilio
    smsEnabled:false, smsProvider:'',                     // fast2sms | msg91 | twilio
    // keys (only those for the chosen provider are used)
    wa_cloud_token:'', wa_cloud_phoneId:'',
    wa_gupshup_apikey:'', wa_gupshup_source:'',
    wa_twilio_sid:'', wa_twilio_token:'', wa_twilio_from:'',
    sms_fast2sms_key:'',
    sms_msg91_authkey:'', sms_msg91_sender:'', sms_msg91_route:'4',
    sms_twilio_sid:'', sms_twilio_token:'', sms_twilio_from:'',
    countryCode:'91',
  }, s.commConfig||{});
}
function msgSaveCfg(patch){
  const s=getSettings();
  DB.set('school_settings', { ...s, commConfig: Object.assign(msgCfg(), patch) });
}

function _msgNorm(p, cc){
  p=String(p||'').replace(/[^0-9]/g,'');
  if(p.length===10) p=(cc||'91')+p;
  return p;
}
function _msgFill(text, r){
  const s=getSettings();
  return String(text||'')
    .replace(/\{name\}/gi, r.name||'Parent')
    .replace(/\{school\}/gi, s.schoolName||'School')
    .replace(/\{class\}/gi, r.className||'');
}

/* Build recipient list with parent phone numbers */
function msgRecipients(scope, id){
  let studs=DB.get('students')||[];
  if(scope==='class')   studs=studs.filter(s=>s.classId===id);
  if(scope==='student') studs=studs.filter(s=>s.id===id);
  const clsMap={}; (DB.get('classes')||[]).forEach(c=>clsMap[c.id]=c.name);
  return studs.filter(s=>s.phone).map(s=>({ name:s.name, phone:s.phone, className:clsMap[s.classId]||'' }));
}

/* ── Composer modal ── */
function openMsgComposer(prefill){
  prefill=prefill||{};
  const classes=DB.get('classes')||[];
  const students=DB.get('students')||[];
  const cfg=msgCfg();
  const root=document.getElementById('modals-root'); if(!root) return;
  root.innerHTML=`
  <div class="modal-overlay open" id="msgComposer" style="display:flex;align-items:flex-start;justify-content:center;overflow-y:auto;padding:18px 10px;z-index:1000;">
    <div style="background:var(--bg-1,#12121a);border-radius:16px;max-width:520px;width:100%;margin:auto;overflow:hidden;border:1px solid var(--border,rgba(255,255,255,.1));">
      <div style="background:linear-gradient(135deg,#25D366,#128C7E);padding:13px 18px;display:flex;align-items:center;justify-content:space-between;">
        <div style="color:#fff;font-weight:800;">📲 Send to Parents</div>
        <button onclick="document.getElementById('msgComposer').remove();document.body.style.overflow=''" style="background:rgba(255,255,255,.2);border:none;width:30px;height:30px;border-radius:50%;cursor:pointer;color:#fff;">✕</button>
      </div>
      <div style="padding:16px;">
        <div class="form-row">
          <div class="form-group"><label class="form-label">Channel</label>
            <select class="form-control" id="msg-channel">
              ${cfg.waEnabled?'<option value="whatsapp">WhatsApp</option>':''}
              ${cfg.smsEnabled?'<option value="sms">SMS</option>':''}
              ${!cfg.waEnabled&&!cfg.smsEnabled?'<option value="whatsapp">WhatsApp (click-to-chat)</option>':''}
            </select></div>
          <div class="form-group"><label class="form-label">Send To</label>
            <select class="form-control" id="msg-scope" onchange="_msgScopeChange()">
              <option value="all">All Parents</option>
              <option value="class">By Class</option>
              <option value="student">Single Student</option>
            </select></div>
        </div>
        <div class="form-group" id="msg-class-row" style="display:none;"><label class="form-label">Class</label>
          <select class="form-control" id="msg-class">${classes.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></div>
        <div class="form-group" id="msg-student-row" style="display:none;"><label class="form-label">Student</label>
          <select class="form-control" id="msg-student">${students.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join('')}</select></div>
        <div class="form-group"><label class="form-label">Message</label>
          <textarea class="form-control" id="msg-text" rows="5" placeholder="Type your message…">${esc(prefill.text||'')}</textarea>
          <div style="font-size:.72rem;color:var(--text-3);margin-top:4px;">Placeholders: <code>{name}</code> {school} {class} — auto-filled per parent.</div>
        </div>
        <button class="btn" style="width:100%;background:#25D366;color:#fff;border:none;font-weight:700;" onclick="msgDispatch()">📤 Send</button>
        <div id="msg-result" style="margin-top:12px;"></div>
      </div>
    </div>
  </div>`;
  document.body.style.overflow='hidden';
}
function _msgScopeChange(){
  const v=document.getElementById('msg-scope').value;
  document.getElementById('msg-class-row').style.display   = v==='class'?'block':'none';
  document.getElementById('msg-student-row').style.display = v==='student'?'block':'none';
}

function msgDispatch(){
  const channel=document.getElementById('msg-channel').value;
  const scope=document.getElementById('msg-scope').value;
  const id = scope==='class' ? document.getElementById('msg-class').value
           : scope==='student' ? document.getElementById('msg-student').value : '';
  const text=document.getElementById('msg-text').value.trim();
  const res=document.getElementById('msg-result');
  if(!text){ toast('Type a message','warning'); return; }
  const recips=msgRecipients(scope, id);
  if(!recips.length){ res.innerHTML='<div style="color:#ef4444;font-size:.85rem;">No parents with a saved phone number in this selection.</div>'; return; }

  const cfg=msgCfg();
  if(channel==='whatsapp' && cfg.waProvider==='clicktochat'){
    _msgClickToChat(recips, text); return;
  }
  // API send via server relay
  res.innerHTML='<div style="color:#3b82f6;font-size:.85rem;">⏳ Sending '+recips.length+' message(s)…</div>';
  const payload={
    school_id: (DB._schoolId&&DB._schoolId())||'',
    channel, cfg,
    messages: recips.map(r=>({ to:_msgNorm(r.phone,cfg.countryCode), text:_msgFill(text,r) })),
  };
  fetch('api/notify.php',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
    .then(r=>r.json())
    .then(d=>{
      if(d && d.ok){ res.innerHTML='<div style="color:#10b981;font-size:.85rem;">✅ Sent '+(d.sent||recips.length)+' message(s)'+(d.failed?(' · '+d.failed+' failed'):'')+'</div>'; toast('✅ Messages sent','success'); }
      else { res.innerHTML='<div style="color:#ef4444;font-size:.85rem;">⚠️ '+esc((d&&d.error)||'Send failed — check provider settings')+'</div>'; }
    })
    .catch(()=>{ res.innerHTML='<div style="color:#ef4444;font-size:.85rem;">⚠️ Could not reach server relay (api/notify.php). On live hosting this works; configure your provider in Settings.</div>'; });
}

/* Free WhatsApp click-to-chat — one tap per parent, no API key needed */
function _msgClickToChat(recips, text){
  const cfg=msgCfg();
  const res=document.getElementById('msg-result');
  res.innerHTML=`
    <div style="font-size:.82rem;color:var(--text-2);margin-bottom:8px;">Tap each parent to open WhatsApp with the message ready (free, no API needed):</div>
    <div style="max-height:240px;overflow-y:auto;display:flex;flex-direction:column;gap:6px;">
      ${recips.map(r=>{
        const url='https://wa.me/'+_msgNorm(r.phone,cfg.countryCode)+'?text='+encodeURIComponent(_msgFill(text,r));
        return `<a href="${url}" target="_blank" rel="noopener" style="display:flex;justify-content:space-between;align-items:center;background:rgba(37,211,102,.12);border:1px solid rgba(37,211,102,.35);border-radius:8px;padding:8px 12px;text-decoration:none;color:var(--text-1);font-size:.85rem;">
          <span>👤 ${esc(r.name)} · ${esc(r.phone)}</span><span style="color:#25D366;font-weight:700;">Open ▸</span></a>`;
      }).join('')}
    </div>
    <div style="font-size:.72rem;color:var(--text-3);margin-top:8px;">💡 For fully-automatic bulk sending without tapping, add a WhatsApp Business API or SMS provider in Settings.</div>`;
}

/* ── Provider settings modal ── */
function openCommSettings(){
  const c=msgCfg();
  const root=document.getElementById('modals-root'); if(!root) return;
  const inp=(id,label,val,ph)=>`<div class="form-group"><label class="form-label">${label}</label><input class="form-control" id="cs-${id}" value="${esc(val||'')}" placeholder="${ph||''}"></div>`;
  root.innerHTML=`
  <div class="modal-overlay open" id="commSettings" style="display:flex;align-items:flex-start;justify-content:center;overflow-y:auto;padding:18px 10px;z-index:1000;">
    <div style="background:var(--bg-1,#12121a);border-radius:16px;max-width:540px;width:100%;margin:auto;overflow:hidden;border:1px solid var(--border,rgba(255,255,255,.1));">
      <div style="background:linear-gradient(135deg,#7c3aed,#3b82f6);padding:13px 18px;display:flex;align-items:center;justify-content:space-between;">
        <div style="color:#fff;font-weight:800;">⚙️ WhatsApp & SMS Settings</div>
        <button onclick="document.getElementById('commSettings').remove();document.body.style.overflow=''" style="background:rgba(255,255,255,.2);border:none;width:30px;height:30px;border-radius:50%;cursor:pointer;color:#fff;">✕</button>
      </div>
      <div style="padding:16px;max-height:78vh;overflow-y:auto;">
        <div style="font-weight:700;margin-bottom:8px;">💬 WhatsApp</div>
        <div class="form-group"><label class="form-label">WhatsApp Method</label>
          <select class="form-control" id="cs-waProvider" onchange="_csToggle()">
            <option value="clicktochat" ${c.waProvider==='clicktochat'?'selected':''}>Click-to-Chat (free, no API)</option>
            <option value="cloud" ${c.waProvider==='cloud'?'selected':''}>Meta WhatsApp Cloud API</option>
            <option value="gupshup" ${c.waProvider==='gupshup'?'selected':''}>Gupshup</option>
            <option value="twilio" ${c.waProvider==='twilio'?'selected':''}>Twilio WhatsApp</option>
          </select></div>
        <div id="cs-wa-cloud" style="display:none;">${inp('wa_cloud_token','Cloud API Token',c.wa_cloud_token)}${inp('wa_cloud_phoneId','Phone Number ID',c.wa_cloud_phoneId)}</div>
        <div id="cs-wa-gupshup" style="display:none;">${inp('wa_gupshup_apikey','Gupshup API Key',c.wa_gupshup_apikey)}${inp('wa_gupshup_source','Source WhatsApp Number',c.wa_gupshup_source)}</div>
        <div id="cs-wa-twilio" style="display:none;">${inp('wa_twilio_sid','Twilio SID',c.wa_twilio_sid)}${inp('wa_twilio_token','Twilio Auth Token',c.wa_twilio_token)}${inp('wa_twilio_from','From (whatsapp:+14155…)',c.wa_twilio_from)}</div>

        <div style="font-weight:700;margin:14px 0 8px;border-top:1px solid var(--border);padding-top:12px;">📱 SMS</div>
        <div class="form-group">
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;"><input type="checkbox" id="cs-smsEnabled" ${c.smsEnabled?'checked':''}> Enable SMS</label>
        </div>
        <div class="form-group"><label class="form-label">SMS Provider</label>
          <select class="form-control" id="cs-smsProvider" onchange="_csToggle()">
            <option value="" ${!c.smsProvider?'selected':''}>— Select —</option>
            <option value="fast2sms" ${c.smsProvider==='fast2sms'?'selected':''}>Fast2SMS (India)</option>
            <option value="msg91" ${c.smsProvider==='msg91'?'selected':''}>MSG91 (India)</option>
            <option value="twilio" ${c.smsProvider==='twilio'?'selected':''}>Twilio</option>
          </select></div>
        <div id="cs-sms-fast2sms" style="display:none;">${inp('sms_fast2sms_key','Fast2SMS API Key',c.sms_fast2sms_key)}</div>
        <div id="cs-sms-msg91" style="display:none;">${inp('sms_msg91_authkey','MSG91 Auth Key',c.sms_msg91_authkey)}${inp('sms_msg91_sender','Sender ID (6 chars)',c.sms_msg91_sender)}${inp('sms_msg91_route','Route',c.sms_msg91_route)}</div>
        <div id="cs-sms-twilio" style="display:none;">${inp('sms_twilio_sid','Twilio SID',c.sms_twilio_sid)}${inp('sms_twilio_token','Twilio Auth Token',c.sms_twilio_token)}${inp('sms_twilio_from','From Number',c.sms_twilio_from)}</div>

        ${inp('countryCode','Default Country Code',c.countryCode,'91')}
        <button class="btn btn-primary" style="width:100%;margin-top:8px;" onclick="saveCommSettings()">💾 Save Settings</button>
        <div style="font-size:.72rem;color:var(--text-3);margin-top:10px;line-height:1.6;">
          🔒 API keys are used by the server relay <code>api/notify.php</code>. Click-to-Chat needs no setup and works immediately.
        </div>
      </div>
    </div>
  </div>`;
  document.body.style.overflow='hidden';
  _csToggle();
}
function _csToggle(){
  const wp=document.getElementById('cs-waProvider').value;
  ['cloud','gupshup','twilio'].forEach(p=>{const el=document.getElementById('cs-wa-'+p); if(el) el.style.display=(wp===p)?'block':'none';});
  const sp=document.getElementById('cs-smsProvider').value;
  ['fast2sms','msg91','twilio'].forEach(p=>{const el=document.getElementById('cs-sms-'+p); if(el) el.style.display=(sp===p)?'block':'none';});
}
function saveCommSettings(){
  const g=id=>{const e=document.getElementById('cs-'+id); return e?(e.type==='checkbox'?e.checked:e.value.trim()):'';};
  msgSaveCfg({
    waEnabled:true, waProvider:g('waProvider'),
    smsEnabled:g('smsEnabled'), smsProvider:g('smsProvider'),
    wa_cloud_token:g('wa_cloud_token'), wa_cloud_phoneId:g('wa_cloud_phoneId'),
    wa_gupshup_apikey:g('wa_gupshup_apikey'), wa_gupshup_source:g('wa_gupshup_source'),
    wa_twilio_sid:g('wa_twilio_sid'), wa_twilio_token:g('wa_twilio_token'), wa_twilio_from:g('wa_twilio_from'),
    sms_fast2sms_key:g('sms_fast2sms_key'),
    sms_msg91_authkey:g('sms_msg91_authkey'), sms_msg91_sender:g('sms_msg91_sender'), sms_msg91_route:g('sms_msg91_route'),
    sms_twilio_sid:g('sms_twilio_sid'), sms_twilio_token:g('sms_twilio_token'), sms_twilio_from:g('sms_twilio_from'),
    countryCode:g('countryCode')||'91',
  });
  toast('✅ Communication settings saved','success');
  document.getElementById('commSettings')?.remove(); document.body.style.overflow='';
}
