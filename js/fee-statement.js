/* ═══════════════════════════════════════════════════════════════
   FEE STATEMENT — shared by Admin & Parent panel.
   Month-wise fee breakdown + paid-fee (transaction) details + summary.
   Pulls from DB 'fees' (invoices) and 'fee_transactions' (payments).
═══════════════════════════════════════════════════════════════ */

const _FS_MON = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function feeStatementData(studentId){
  const st = DB.find('students', studentId);
  if (!st) return null;
  const cls = st.classId ? DB.find('classes', st.classId) : null;
  const s   = (typeof getSettings==='function') ? getSettings() : DB.getObj('school_settings');

  const fees = (DB.get('fees')||[]).filter(f=>f.studentId===studentId)
    .sort((a,b)=> (a.dueDate||a.createdAt||'').localeCompare(b.dueDate||b.createdAt||''));
  const txns = (DB.get('fee_transactions')||[]).filter(t=>t.studentId===studentId)
    .sort((a,b)=> (a.date||'').localeCompare(b.date||''));

  const rows = fees.map(f=>{
    const d = f.dueDate || f.createdAt || '';
    const mIdx = d ? (parseInt(d.slice(5,7),10)-1) : -1;
    return { month: mIdx>=0?_FS_MON[mIdx]:'—', feeName: f.feeType||'School Fee', amount: Number(f.amount||0) };
  });

  const totalAmount = rows.reduce((a,r)=>a+r.amount, 0);
  const received    = txns.reduce((a,t)=>a+Number(t.amount||0), 0);
  const discount    = txns.reduce((a,t)=>a+Number(t.discount||0), 0);
  const lateFee     = txns.reduce((a,t)=>a+Number(t.lateFee||0), 0);
  const oldSession  = Number(st.oldSessionFee||0);
  const balance     = Math.max(0, (totalAmount + oldSession) - received);

  return { st, cls, s, rows, txns, totalAmount, received, discount, lateFee, oldSession, balance };
}

function feeStatementHTML(studentId){
  const d = feeStatementData(studentId);
  if (!d) return '<p style="padding:30px;text-align:center;">Student not found.</p>';
  const { st, cls, s, rows, txns, totalAmount, received, oldSession, balance } = d;
  const cur = (s.currency)||'₹';
  const E = (typeof esc==='function') ? esc : (v=>String(v==null?'':v));
  const fd = (typeof formatDate==='function') ? formatDate : (v=>v||'');
  const session = s.academicYear || '';

  const info = (l,v)=>`<div style="display:flex;gap:6px;"><span style="color:#64748b;min-width:90px;">${l}</span><strong style="color:#0f172a;">${E(v||'—')}</strong></div>`;

  return `
  <div style="font-family:Arial,Helvetica,sans-serif;color:#0f172a;max-width:760px;margin:0 auto;background:#fff;border:1px solid #cbd5e1;">
    <!-- Header -->
    <div style="display:flex;align-items:center;gap:14px;padding:16px 22px;border-bottom:1px solid #cbd5e1;">
      ${s.schoolLogo?`<img src="${s.schoolLogo}" style="height:54px;object-fit:contain;">`:`<div style="height:54px;width:54px;border-radius:50%;background:#e5e7eb;display:flex;align-items:center;justify-content:center;font-size:26px;">🏫</div>`}
      <div>
        <div style="font-size:22px;font-weight:900;color:#1d4ed8;letter-spacing:.5px;">${E(s.schoolName||'School Name')}</div>
        <div style="font-size:12px;color:#475569;">${E(s.schoolAddress||'')}${s.schoolPhone?' · 📞 '+E(s.schoolPhone):''}</div>
      </div>
    </div>

    <!-- Title -->
    <div style="text-align:center;padding:12px 0;border-bottom:1px solid #e2e8f0;">
      <span style="font-size:18px;font-weight:800;color:#0f172a;">Fee Statement${session?` (${E(session)})`:''}</span>
    </div>

    <!-- Student info -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 30px;padding:14px 22px;font-size:13px;border-bottom:1px solid #e2e8f0;">
      ${info('Name', st.name)}
      ${info('Class', cls?cls.name:'—')}
      ${info('Adm No', st.admissionNo||st.scholarNo||st.rollNo)}
      ${info('Roll No', st.rollNo)}
      ${info("Father's Name", st.fatherName)}
      ${info("Mother's Name", st.motherName)}
    </div>

    <!-- Fee breakdown -->
    <div style="padding:14px 22px;">
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead><tr style="background:#fde8e8;">
          <th style="border:1px solid #cbd5e1;padding:7px 10px;text-align:left;color:#b91c1c;">Month</th>
          <th style="border:1px solid #cbd5e1;padding:7px 10px;text-align:center;color:#b91c1c;">Fee Name</th>
          <th style="border:1px solid #cbd5e1;padding:7px 10px;text-align:right;color:#b91c1c;">Amount</th>
        </tr></thead>
        <tbody>
          ${rows.length?rows.map(r=>`<tr>
            <td style="border:1px solid #cbd5e1;padding:6px 10px;font-weight:600;">${E(r.month)}</td>
            <td style="border:1px solid #cbd5e1;padding:6px 10px;text-align:center;">${E(r.feeName)}</td>
            <td style="border:1px solid #cbd5e1;padding:6px 10px;text-align:right;">${cur}${r.amount.toLocaleString()}</td>
          </tr>`).join(''):`<tr><td colspan="3" style="border:1px solid #cbd5e1;padding:14px;text-align:center;color:#94a3b8;">No fee invoices generated yet.</td></tr>`}
          <tr style="background:#f1f5f9;font-weight:800;">
            <td style="border:1px solid #cbd5e1;padding:8px 10px;" colspan="2" align="center">TOTAL</td>
            <td style="border:1px solid #cbd5e1;padding:8px 10px;text-align:right;">${cur}${totalAmount.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Paid fee details -->
    <div style="padding:0 22px 8px;">
      <div style="color:#b91c1c;font-weight:800;font-size:14px;margin-bottom:6px;">Paid Fee Details</div>
      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <thead><tr style="background:#f1f5f9;">
          <th style="border:1px solid #cbd5e1;padding:5px 6px;">Sno</th>
          <th style="border:1px solid #cbd5e1;padding:5px 6px;">R.No.</th>
          <th style="border:1px solid #cbd5e1;padding:5px 6px;">Date</th>
          <th style="border:1px solid #cbd5e1;padding:5px 6px;">Net Amt</th>
          <th style="border:1px solid #cbd5e1;padding:5px 6px;">Discount</th>
          <th style="border:1px solid #cbd5e1;padding:5px 6px;">Late Fee</th>
          <th style="border:1px solid #cbd5e1;padding:5px 6px;">Received</th>
          <th style="border:1px solid #cbd5e1;padding:5px 6px;">Mode</th>
          <th style="border:1px solid #cbd5e1;padding:5px 6px;">UName</th>
        </tr></thead>
        <tbody>
          ${txns.length?txns.map((t,i)=>`<tr style="text-align:center;">
            <td style="border:1px solid #cbd5e1;padding:5px 6px;">${i+1}</td>
            <td style="border:1px solid #cbd5e1;padding:5px 6px;">${E(t.receiptNo||t.id.slice(-5))}</td>
            <td style="border:1px solid #cbd5e1;padding:5px 6px;">${fd(t.date)}</td>
            <td style="border:1px solid #cbd5e1;padding:5px 6px;">${cur}${Number(t.amount||0).toLocaleString()}</td>
            <td style="border:1px solid #cbd5e1;padding:5px 6px;">${cur}${Number(t.discount||0).toLocaleString()}</td>
            <td style="border:1px solid #cbd5e1;padding:5px 6px;">${cur}${Number(t.lateFee||0).toLocaleString()}</td>
            <td style="border:1px solid #cbd5e1;padding:5px 6px;font-weight:700;">${cur}${Number(t.amount||0).toLocaleString()}</td>
            <td style="border:1px solid #cbd5e1;padding:5px 6px;">${E(t.method||'Cash')}</td>
            <td style="border:1px solid #cbd5e1;padding:5px 6px;">${E(t.by||'admin')}</td>
          </tr>`).join(''):`<tr><td colspan="9" style="border:1px solid #cbd5e1;padding:12px;text-align:center;color:#94a3b8;">No payments recorded yet.</td></tr>`}
          <tr style="background:#f1f5f9;font-weight:800;text-align:center;">
            <td style="border:1px solid #cbd5e1;padding:6px;" colspan="3">Total</td>
            <td style="border:1px solid #cbd5e1;padding:6px;">${cur}${received.toLocaleString()}</td>
            <td style="border:1px solid #cbd5e1;padding:6px;">${cur}${d.discount.toLocaleString()}</td>
            <td style="border:1px solid #cbd5e1;padding:6px;">${cur}${d.lateFee.toLocaleString()}</td>
            <td style="border:1px solid #cbd5e1;padding:6px;">${cur}${received.toLocaleString()}</td>
            <td style="border:1px solid #cbd5e1;padding:6px;" colspan="2"></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Summary -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 30px;padding:14px 22px 20px;font-size:14px;">
      <div style="display:flex;justify-content:space-between;"><span style="color:#475569;">Total Amount</span><strong>${cur}${(totalAmount+oldSession).toLocaleString()}</strong></div>
      <div style="display:flex;justify-content:space-between;"><span style="color:#475569;">Currently Received</span><strong style="color:#059669;">${cur}${received.toLocaleString()}</strong></div>
      <div style="display:flex;justify-content:space-between;"><span style="color:#475569;">Old Session Fee</span><strong>${cur}${oldSession.toLocaleString()}</strong></div>
      <div style="display:flex;justify-content:space-between;"><span style="color:#475569;">Balance Amount</span><strong style="color:${balance>0?'#dc2626':'#059669'};">${cur}${balance.toLocaleString()}</strong></div>
    </div>
  </div>`;
}

function openFeeStatement(studentId){
  const root=document.getElementById('modals-root'); if(!root) return;
  root.innerHTML=`
  <div class="modal-overlay open" id="feeStmtModal" style="display:flex;align-items:flex-start;justify-content:center;overflow-y:auto;padding:18px 10px;z-index:1000;">
    <div style="background:var(--bg-1,#12121a);border-radius:14px;max-width:820px;width:100%;margin:auto;overflow:hidden;border:1px solid var(--border,rgba(255,255,255,.1));">
      <div style="background:linear-gradient(135deg,#1d4ed8,#3b82f6);padding:12px 18px;display:flex;align-items:center;justify-content:space-between;">
        <div style="color:#fff;font-weight:800;">📄 Fee Statement</div>
        <div style="display:flex;gap:8px;">
          <button onclick="feeStatementPrint('${studentId}')" style="background:#fff;color:#1d4ed8;border:none;border-radius:8px;padding:6px 14px;font-weight:700;cursor:pointer;">🖨️ Print / PDF</button>
          <button onclick="document.getElementById('feeStmtModal').remove();document.body.style.overflow=''" style="background:rgba(255,255,255,.2);border:none;width:32px;height:32px;border-radius:50%;cursor:pointer;color:#fff;">✕</button>
        </div>
      </div>
      <div style="padding:16px;background:#eef2f7;max-height:80vh;overflow-y:auto;">${feeStatementHTML(studentId)}</div>
    </div>
  </div>`;
  document.body.style.overflow='hidden';
}

function feeStatementPrint(studentId){
  const html = feeStatementHTML(studentId);
  const st = DB.find('students', studentId);
  const w = window.open('', '_blank', 'width=820,height=900');
  if (!w) { try{ toast('Allow popups to print','warning'); }catch(e){} return; }
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Fee Statement — ${st?st.name:''}</title>
  <style>@page{size:A4 portrait;margin:8mm;} *{box-sizing:border-box;} html,body{margin:0;padding:0;background:#eef2f7;}
  #fs{max-width:760px;margin:0 auto;} @media print{html,body{background:#fff;}}</style></head>
  <body><div id="fs">${html}</div>
  <script>(function(){var done=false;function go(){if(done)return;done=true;setTimeout(function(){window.focus();window.print();},200);}var imgs=document.querySelectorAll('img'),left=imgs.length;if(!left)go();else{for(var i=0;i<imgs.length;i++){(function(im){if(im.complete){if(--left===0)go();}else im.onload=im.onerror=function(){if(--left===0)go();};})(imgs[i]);}setTimeout(go,1500);}window.onafterprint=function(){setTimeout(function(){try{window.close();}catch(e){}},300);};})();<\/script>
  </body></html>`);
  w.document.close();
}
