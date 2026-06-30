/* =====================================================
   PAPER CREATOR  —  Shared module (admin + teacher)
   Requires: utils.js (DB, genId, today, getSettings,
             toast, buildModal, closeAllModals, printHtml)
   Optional: Tesseract.js for OCR, QRCode.js
===================================================== */

// ── State ──────────────────────────────────────────────
var _pc = {
  school:'', subject:'', grade:'', exam:'Unit Test',
  date:'', marks:'100', duration:'3 Hours',
  instructions:'1. All questions are compulsory.\n2. Write neatly and legibly.\n3. Attempt all sections.',
  editorHtml:'', ocrText:'', ocrStream:null,
  draftId:null, draftName:'', template:'classic',
  pcTab:'editor'   // 'editor' | 'templates' | 'drafts'
};

// Camera / OCR cleanup hook (called from activateNav in utils.js)
window._pcCleanup = function() {
  if (_pc.ocrStream) {
    try { _pc.ocrStream.getTracks().forEach(function(t){ t.stop(); }); } catch(e){}
    _pc.ocrStream = null;
  }
};

// ══════════════════════════════════════════════════════
//  TEMPLATE DEFINITIONS
// ══════════════════════════════════════════════════════
var _PC_TMPLS = {
  classic: {
    icon:'🏛️', name:'Classic',
    desc:'Standard bordered layout — professional look used in most schools',
    preview:'Double-line header · bordered meta row · Times New Roman',
    printCss:
      'body{font-family:"Times New Roman",Georgia,serif;font-size:13.5pt;padding:28px 36px;max-width:820px;margin:0 auto}'+
      '.hdr{text-align:center;border-bottom:3px double #000;padding-bottom:12px;margin-bottom:14px}'+
      '.school-nm{font-size:18pt;font-weight:700;letter-spacing:.5px;margin-bottom:2px}'+
      '.exam-nm{font-size:13pt;font-weight:700}'+
      '.meta-row{display:flex;justify-content:space-between;flex-wrap:wrap;gap:4px;border:1.5px solid #000;padding:6px 14px;margin-bottom:12px;font-size:11pt}'+
      '.instr{border:1.5px solid #555;padding:10px 14px;margin-bottom:18px;font-size:11pt;background:#fafafa}'+
      '.instr ol{margin:6px 0;padding-left:20px}.instr li{margin-bottom:3px}'+
      '.body{line-height:2}'+
      '.body h1,.body h2{font-size:13pt;font-weight:700;border-bottom:1.5px solid #000;margin:16px 0 8px;padding-bottom:3px}'+
      '.body h3{font-size:12pt;font-weight:700;margin:12px 0 4px}'+
      '.body ul,.body ol{padding-left:24px;margin:6px 0}'+
      '.body table{border-collapse:collapse;width:100%;margin:12px 0}'+
      '.body td,.body th{border:1.5px solid #444;padding:7px 11px}'+
      '.body th{background:#eee;font-weight:700}'+
      '.body hr{border:none;border-top:1px solid #888;margin:16px 0}'
  },
  cbse: {
    icon:'🇮🇳', name:'CBSE Style',
    desc:'Central Board format — standard layout used in CBSE affiliated schools',
    preview:'Box border header · section-wise layout · Arial font',
    printCss:
      'body{font-family:Arial,sans-serif;font-size:12pt;padding:24px 32px;max-width:820px;margin:0 auto}'+
      '.hdr{text-align:center;border:3px double #000;padding:14px;margin-bottom:10px}'+
      '.school-nm{font-size:16pt;font-weight:900;letter-spacing:1px;margin-bottom:2px}'+
      '.exam-nm{font-size:13pt;font-weight:700;margin-top:4px}'+
      '.meta-row{display:flex;justify-content:space-between;flex-wrap:wrap;border:1px solid #000;padding:6px 12px;margin-bottom:10px;font-size:11pt;gap:4px}'+
      '.instr{border-left:4px solid #000;padding:8px 14px;margin-bottom:16px;font-size:11pt;background:#f8f8f8}'+
      '.instr ol{margin:4px 0;padding-left:20px}.instr li{margin-bottom:2px}'+
      '.body{line-height:1.9}'+
      '.body h1,.body h2{font-size:12pt;font-weight:800;text-transform:uppercase;border-bottom:2px solid #000;margin:16px 0 8px;padding-bottom:2px}'+
      '.body h3{font-size:11pt;font-weight:700;margin:10px 0 4px}'+
      '.body ul,.body ol{padding-left:24px;margin:6px 0}'+
      '.body table{border-collapse:collapse;width:100%;margin:12px 0}'+
      '.body td,.body th{border:1px solid #000;padding:7px 10px}'+
      '.body th{background:#f0f0f0;font-weight:700}'+
      '.body hr{border:none;border-top:1.5px solid #000;margin:18px 0}'
  },
  modern: {
    icon:'✨', name:'Modern Clean',
    desc:'Contemporary look — clean sans-serif ideal for private schools',
    preview:'Color header band · purple accent · Segoe UI font',
    printCss:
      'body{font-family:"Segoe UI",Arial,sans-serif;font-size:12.5pt;padding:0;max-width:820px;margin:0 auto}'+
      '.hdr{background:#1e1b4b;color:#fff;padding:20px 28px;text-align:center;margin-bottom:14px}'+
      '.school-nm{font-size:18pt;font-weight:800;letter-spacing:.5px;margin-bottom:3px}'+
      '.exam-nm{font-size:12pt;font-weight:400;opacity:.85;margin-top:2px}'+
      '.meta-row{display:flex;justify-content:space-between;flex-wrap:wrap;border-bottom:2.5px solid #1e1b4b;padding:8px 28px 8px;margin-bottom:12px;font-size:11pt;gap:4px}'+
      '.instr{border-left:4px solid #7c3aed;padding:10px 14px;margin:0 28px 16px;font-size:11pt;background:#f5f3ff;border-radius:0 6px 6px 0}'+
      '.instr ol{margin:4px 0;padding-left:20px}.instr li{margin-bottom:2px}'+
      '.body{line-height:1.9;padding:0 28px 28px}'+
      '.body h1,.body h2{font-size:13pt;font-weight:700;color:#1e1b4b;border-bottom:2px solid #7c3aed;margin:14px 0 6px;padding-bottom:3px}'+
      '.body h3{font-size:12pt;font-weight:600;color:#1e1b4b;margin:10px 0 4px}'+
      '.body ul,.body ol{padding-left:24px;margin:6px 0}'+
      '.body table{border-collapse:collapse;width:100%;margin:12px 0}'+
      '.body td,.body th{border:1px solid #ddd;padding:8px 12px}'+
      '.body th{background:#f5f3ff;font-weight:700;color:#1e1b4b}'+
      '.body hr{border:none;border-top:2px solid #7c3aed;margin:16px 0;opacity:.4}'
  },
  minimal: {
    icon:'📄', name:'Minimal',
    desc:'Print-friendly — maximum content area, no decorative elements',
    preview:'Single line borders · compact · maximises writing space',
    printCss:
      'body{font-family:"Times New Roman",serif;font-size:12pt;padding:20px 28px;max-width:820px;margin:0 auto}'+
      '.hdr{text-align:center;border-bottom:1px solid #000;padding-bottom:8px;margin-bottom:10px}'+
      '.school-nm{font-size:15pt;font-weight:700;margin-bottom:2px}'+
      '.exam-nm{font-size:11pt;font-weight:600}'+
      '.meta-row{display:flex;justify-content:space-between;flex-wrap:wrap;border-top:1px solid #000;border-bottom:1px solid #000;padding:4px 0;margin-bottom:10px;font-size:10.5pt;gap:4px}'+
      '.instr{font-size:10.5pt;margin-bottom:12px;line-height:1.7}'+
      '.instr ol{margin:2px 0;padding-left:18px}'+
      '.body{line-height:1.95}'+
      '.body h1,.body h2{font-size:12pt;font-weight:700;text-decoration:underline;margin:12px 0 4px}'+
      '.body h3{font-size:11.5pt;font-weight:700;margin:8px 0 3px}'+
      '.body ul,.body ol{padding-left:20px;margin:4px 0}'+
      '.body table{border-collapse:collapse;width:100%;margin:10px 0}'+
      '.body td,.body th{border:1px solid #999;padding:5px 9px}'+
      '.body th{font-weight:700}'+
      '.body hr{border:none;border-top:1px solid #aaa;margin:12px 0}'
  },
  government: {
    icon:'🏛️', name:'Government Official',
    desc:'Formal government style — used in state board & official exams',
    preview:'Box border · uppercase school name · official look',
    printCss:
      'body{font-family:"Times New Roman",serif;font-size:12pt;padding:26px 34px;max-width:820px;margin:0 auto}'+
      '.hdr{text-align:center;border:2.5px solid #000;padding:12px;margin-bottom:10px}'+
      '.school-nm{font-size:16pt;font-weight:900;text-transform:uppercase;letter-spacing:2px;margin-bottom:3px}'+
      '.exam-nm{font-size:12pt;font-weight:700;text-transform:uppercase;margin-top:4px}'+
      '.meta-row{display:flex;justify-content:space-between;flex-wrap:wrap;border:1px solid #000;padding:6px 12px;margin-bottom:10px;font-size:11pt;gap:4px}'+
      '.instr{border:1px solid #000;padding:10px 14px;margin-bottom:16px;font-size:10.5pt}'+
      '.instr ol{margin:4px 0;padding-left:20px}.instr li{margin-bottom:2px}'+
      '.body{line-height:2}'+
      '.body h1,.body h2{font-size:12pt;font-weight:700;text-align:center;text-transform:uppercase;text-decoration:underline;margin:16px 0 8px}'+
      '.body h3{font-size:11.5pt;font-weight:700;margin:10px 0 4px}'+
      '.body ul,.body ol{padding-left:22px;margin:5px 0}'+
      '.body table{border-collapse:collapse;width:100%;margin:12px 0}'+
      '.body td,.body th{border:1px solid #000;padding:6px 10px}'+
      '.body th{background:#f0f0f0;font-weight:700}'+
      '.body hr{border:none;border-top:1.5px solid #000;margin:16px 0}'
  },
  science: {
    icon:'🔬', name:'Science / Lab',
    desc:'Science practical & theory paper — formula boxes & diagram spaces',
    preview:'Diagram space · formula area · lab-style layout',
    printCss:
      'body{font-family:Arial,sans-serif;font-size:12pt;padding:24px 32px;max-width:820px;margin:0 auto}'+
      '.hdr{text-align:center;border-bottom:3px solid #166534;padding-bottom:10px;margin-bottom:14px}'+
      '.school-nm{font-size:17pt;font-weight:800;color:#166534;letter-spacing:.5px;margin-bottom:2px}'+
      '.exam-nm{font-size:12pt;font-weight:600;margin-top:3px}'+
      '.meta-row{display:flex;justify-content:space-between;flex-wrap:wrap;border:1.5px solid #166534;padding:6px 12px;margin-bottom:12px;font-size:11pt;gap:4px}'+
      '.instr{border-left:4px solid #166534;padding:8px 14px;margin-bottom:16px;font-size:11pt;background:#f0fdf4}'+
      '.instr ol{margin:4px 0;padding-left:20px}.instr li{margin-bottom:2px}'+
      '.body{line-height:1.9}'+
      '.body h1,.body h2{font-size:13pt;font-weight:700;color:#166534;border-bottom:2px solid #166534;margin:14px 0 6px;padding-bottom:3px}'+
      '.body h3{font-size:12pt;font-weight:700;margin:10px 0 4px}'+
      '.body ul,.body ol{padding-left:24px;margin:6px 0}'+
      '.body table{border-collapse:collapse;width:100%;margin:12px 0}'+
      '.body td,.body th{border:1.5px solid #166534;padding:7px 11px}'+
      '.body th{background:#dcfce7;font-weight:700;color:#166534}'+
      '.body hr{border:none;border-top:2px dashed #166534;margin:16px 0}'
  }
};

// ── Default starter content per template ──────────────
var _PC_STARTER = {
  classic:
    '<h2>Section A — Multiple Choice Questions</h2>'+
    '<p><i>Each question carries 1 mark. Attempt all questions.</i></p><p><br></p>'+
    '<p><b>Q1.</b> ___________________________?</p>'+
    '<p>&emsp;(a) Option A &emsp;&emsp; (b) Option B &emsp;&emsp; (c) Option C &emsp;&emsp; (d) Option D</p><p><br></p>'+
    '<hr style="border:none;border-top:1px solid #aaa;margin:18px 0">'+
    '<h2>Section B — Short Answer Questions</h2>'+
    '<p><i>Each question carries 2 marks. Attempt any 5.</i></p><p><br></p>'+
    '<p><b>Q6.</b> Define ___________________________. [2 marks]</p><p><br><br></p>'+
    '<p><b>Q7.</b> Explain the concept of ___________________________ with one example. [2 marks]</p>',
  cbse:
    '<h2>Section A — Objective Type Questions (1×10=10)</h2>'+
    '<p><b>Q1.</b> Choose the correct answer:</p>'+
    '<p>(a) ___ &emsp; (b) ___ &emsp; (c) ___ &emsp; (d) ___</p><p><br></p>'+
    '<hr style="border:none;border-top:1.5px solid #000;margin:18px 0">'+
    '<h2>Section B — Short Answer Type Questions (2×5=10)</h2>'+
    '<p><b>Q11.</b> Answer in 2-3 sentences: ___________________________. [2]</p><p><br><br></p>'+
    '<hr style="border:none;border-top:1.5px solid #000;margin:18px 0">'+
    '<h2>Section C — Long Answer Type Questions (5×3=15)</h2>'+
    '<p><b>Q16.</b> Explain in detail: ___________________________. [5]</p><p><br><br><br></p>',
  modern:
    '<h2>Part I — Multiple Choice Questions</h2>'+
    '<p style="color:#666"><i>Select the best answer. Each carries 1 mark.</i></p><p><br></p>'+
    '<p><b>1.</b> ___________________________?<br>&emsp;(a) ___ &emsp; (b) ___ &emsp; (c) ___ &emsp; (d) ___</p><p><br></p>'+
    '<h2>Part II — Short Answer Questions</h2>'+
    '<p style="color:#666"><i>Answer in 3-5 sentences. Each carries 3 marks.</i></p><p><br></p>'+
    '<p><b>6.</b> Describe ___________________________. [3 marks]</p><p><br><br></p>',
  minimal:
    '<p><b>Section A</b> &emsp; [1 mark each]</p>'+
    '<p>1. ___________________________ ?</p>'+
    '<p>&emsp;(a)___ &emsp;(b)___ &emsp;(c)___ &emsp;(d)___</p><p><br></p>'+
    '<p>2. ___________________________ ?</p>'+
    '<p>&emsp;(a)___ &emsp;(b)___ &emsp;(c)___ &emsp;(d)___</p><p><br></p>'+
    '<hr><p><b>Section B</b> &emsp; [2 marks each]</p>'+
    '<p>6. Define ___________________________ . [2]</p><p><br><br></p>'+
    '<p>7. Explain ___________________________ . [2]</p>',
  government:
    '<h2>भाग - अ / Part A — वस्तुनिष्ठ प्रश्न / Objective Questions</h2>'+
    '<p><b>प्र.1 / Q.1.</b> उचित उत्तर चुनिये / Choose the correct answer :</p>'+
    '<p>&emsp;(अ) ___ &emsp; (ब) ___ &emsp; (क) ___ &emsp; (ड) ___</p><p><br></p>'+
    '<h2>भाग - ब / Part B — लघु उत्तरीय / Short Answer</h2>'+
    '<p><b>प्र.6 / Q.6.</b> संक्षेप में उत्तर दीजिये / Answer briefly : [2]</p><p><br><br></p>'+
    '<h2>भाग - स / Part C — दीर्घ उत्तरीय / Long Answer</h2>'+
    '<p><b>प्र.11 / Q.11.</b> विस्तार से लिखिये / Write in detail : [5]</p><p><br><br><br></p>',
  science:
    '<h2>Section A — Theory Questions</h2>'+
    '<p><b>Q1.</b> Define ___________________________ . State its SI unit. [2]</p><p><br><br></p>'+
    '<p><b>Q2.</b> State and explain ___________________________ law. [3]</p><p><br><br><br></p>'+
    '<hr style="border:2px dashed #166534;margin:18px 0">'+
    '<h2>Section B — Diagram / Practical</h2>'+
    '<p><b>Q3.</b> Draw a labelled diagram of ___________________________ . [3]</p>'+
    '<div style="border:1.5px solid #166534;min-height:120px;margin:10px 0;border-radius:4px;display:flex;align-items:center;justify-content:center;color:#999;font-size:12px">[Diagram Space]</div>'+
    '<p><b>Q4.</b> List the apparatus needed for ___________________________ experiment. [2]</p>'
};

// ══════════════════════════════════════════════════════
//  MAIN RENDER  — call with any container element ID
// ══════════════════════════════════════════════════════
// embedded=true → skip top page-header (used inside admin qpapers tab)
function _pcRenderMain(containerId, embedded) {
  var prev = document.getElementById('_pc_editor');
  if (prev) _pc.editorHtml = prev.innerHTML;

  var s   = (typeof getSettings === 'function') ? getSettings() : {};
  if (!_pc.school && s.schoolName) _pc.school = s.schoolName;
  if (!_pc.date)   _pc.date = (typeof today==='function') ? today() : new Date().toISOString().slice(0,10);

  var drafts  = (typeof DB!=='undefined' ? DB.get('paper_drafts') : null) || [];
  var el      = document.getElementById(containerId);
  if (!el) return;

  var em = !!embedded; // store for tab click closures
  var tabBtns = [
    {key:'editor',    label:'✍️ Editor'},
    {key:'templates', label:'📋 Templates'},
    {key:'drafts',    label:'💾 Drafts ('+drafts.length+')'}
  ].map(function(tb){
    return '<button class="att-tab '+(_pc.pcTab===tb.key?'active':'')+'" '+
           'onclick="_pc.pcTab=\''+tb.key+'\';_pcRenderMain(\''+containerId+'\','+em+')">'+tb.label+'</button>';
  }).join('');

  // Top action header — show for teacher (full page), hide for admin embed
  var hdr = em ? '' : (
    '<div class="page-header" style="margin-bottom:16px">'+
      '<div>'+
        '<h2>✏️ Paper Creator</h2>'+
        '<div class="breadcrumb">'+
          (_pc.draftId ? '📝 Editing: <b>'+(_pc.draftName||'Draft')+'</b>' : 'Rich text editor · Camera OCR · Templates · Save drafts')+
        '</div>'+
      '</div>'+
      '<div style="display:flex;gap:8px;flex-wrap:wrap">'+
        '<button class="btn btn-secondary" onclick="_pcSaveDraft(\''+containerId+'\')">💾 Save Draft</button>'+
        '<button class="btn btn-secondary" onclick="_pcPreview()">👁️ Preview</button>'+
        '<button class="btn btn-primary"   onclick="_pcPrint()">🖨️ Print</button>'+
      '</div>'+
    '</div>'
  );

  // When embedded, show action buttons inline above tab bar
  var inlineActs = em ? (
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">'+
      '<button class="btn btn-secondary" onclick="_pcSaveDraft(\''+containerId+'\')">💾 Save Draft</button>'+
      '<button class="btn btn-secondary" onclick="_pcPreview()">👁️ Preview</button>'+
      '<button class="btn btn-primary"   onclick="_pcPrint()">🖨️ Print</button>'+
    '</div>'
  ) : '';

  el.innerHTML =
    hdr + inlineActs+
    '<div class="att-tab-bar mb-16">'+tabBtns+'</div>'+
    (_pc.pcTab==='editor'    ? _pcEditorTabHtml(containerId, em)           :
     _pc.pcTab==='templates' ? _pcTemplatesTabHtml(containerId, em)        :
                               _pcDraftsTabHtml(drafts, containerId, em));

  if (_pc.pcTab==='editor') {
    var ed = document.getElementById('_pc_editor');
    if (ed && _pc.editorHtml) ed.innerHTML = _pc.editorHtml;
    if (_pc.ocrText) {
      var ob=document.getElementById('_pc_ocr_body'),
          or_=document.getElementById('_pc_ocr_result'),
          ot=document.getElementById('_pc_ocr_text');
      if(ob)  ob.style.display='block';
      if(or_) or_.style.display='block';
      if(ot)  ot.value=_pc.ocrText;
    }
  }
}

// ══════════════════════════════════════════════════════
//  EDITOR TAB
// ══════════════════════════════════════════════════════
function _pcEditorTabHtml(cid, em) {
  var t = _PC_TMPLS[_pc.template] || _PC_TMPLS.classic;
  return (
    // ── Paper Details (collapsible) ──
    '<div class="card mb-16">'+
      '<div class="card-header" style="cursor:pointer;user-select:none" onclick="var b=document.getElementById(\'_pc_det_body\');b.style.display=b.style.display===\'none\'?\'block\':\'none\'">'+
        '<h3>📋 Paper Details <span style="font-size:12px;font-weight:400;color:var(--text-2)">(click to expand/collapse)</span></h3>'+
        '<span style="font-size:12px;color:var(--text-3)">'+((_pc.subject||'No subject')+' · '+(_pc.grade||'No class')+' · '+(_pc.exam||''))+'</span>'+
      '</div>'+
      '<div class="card-body" id="_pc_det_body" style="display:none">'+
        '<div class="qpg-setup-grid" style="gap:12px">'+
          _pcDetailField('School Name','_pc.school=this.value','text',_pc.school,'School name','','') +
          _pcDetailField('Subject *',  '_pc.subject=this.value','text',_pc.subject,'e.g. Mathematics','','') +
          _pcDetailField('Class / Grade','_pc.grade=this.value','text',_pc.grade,'e.g. Class 8','','') +
          _pcDetailField('Exam Name',  '_pc.exam=this.value','text',_pc.exam,'e.g. Mid Term','','') +
          _pcDetailField('Date',       '_pc.date=this.value','date',_pc.date,'','','') +
          _pcDetailField('Duration',   '_pc.duration=this.value','text',_pc.duration,'3 Hours','','') +
          _pcDetailField('Max Marks',  '_pc.marks=this.value','text',_pc.marks,'100','','') +
          '<div class="form-group" style="margin:0"><label class="form-label">Instructions</label>'+
            '<textarea class="form-control" rows="3" placeholder="General instructions…" oninput="_pc.instructions=this.value">'+_pc.instructions+'</textarea>'+
          '</div>'+
        '</div>'+
      '</div>'+
    '</div>'+

    // ── Active Template ──
    '<div class="card mb-16" style="border:1.5px solid rgba(124,58,237,.3)">'+
      '<div class="card-body" style="padding:12px 16px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">'+
        '<div style="display:flex;align-items:center;gap:12px">'+
          '<div style="font-size:1.8rem">'+t.icon+'</div>'+
          '<div>'+
            '<div style="font-weight:700;font-size:14px">'+t.name+' Template</div>'+
            '<div style="font-size:11px;color:var(--text-3)">'+t.preview+'</div>'+
          '</div>'+
        '</div>'+
        '<button class="btn btn-sm btn-secondary" onclick="_pc.pcTab=\'templates\';_pcRenderMain(\''+cid+'\','+!!em+')">🎨 Change Template</button>'+
      '</div>'+
    '</div>'+

    // ── OCR Tool (collapsible) ──
    '<div class="card mb-16">'+
      '<div class="card-header" style="cursor:pointer;user-select:none" onclick="var b=document.getElementById(\'_pc_ocr_body\');b.style.display=b.style.display===\'none\'?\'block\':\'none\'">'+
        '<h3>📷 Scan Text from Camera / Image (OCR) <span style="font-size:12px;font-weight:400;color:var(--text-2)">(click to expand)</span></h3>'+
        '<span style="font-size:12px;color:var(--text-3)">Extract text from a photo or camera and paste it into the editor</span>'+
      '</div>'+
      '<div class="card-body" id="_pc_ocr_body" style="display:none">'+
        '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px">'+
          '<button class="btn btn-secondary" onclick="_pcOCRCamera()">📷 Use Camera</button>'+
          '<button class="btn btn-secondary" onclick="document.getElementById(\'_pc_ocr_file\').click()">📁 Upload Image</button>'+
          '<input type="file" id="_pc_ocr_file" accept="image/*" capture="environment" style="display:none" onchange="_pcOCRFile(this)">'+
          '<button class="btn btn-secondary" id="_pc_stopcam_btn" style="display:none" onclick="_pcOCRStopCam()">⏹ Stop Camera</button>'+
        '</div>'+
        '<div style="font-size:12px;color:var(--text-3);margin-bottom:12px">💡 Tips: Well-lit photo · Printed text · English + Hindi supported</div>'+
        '<div id="_pc_cam_view" style="display:none;margin-bottom:14px">'+
          '<video id="_pc_ocr_video" autoplay playsinline style="width:100%;max-height:280px;border-radius:12px;background:#000;display:block;object-fit:cover"></video>'+
          '<canvas id="_pc_ocr_canvas" style="display:none"></canvas>'+
          '<div style="margin-top:10px"><button class="btn btn-primary" onclick="_pcOCRCapture()">📸 Capture & Extract Text</button></div>'+
        '</div>'+
        '<div id="_pc_ocr_loading" style="display:none;padding:16px 0;text-align:center">'+
          '<div style="font-weight:600;margin-bottom:8px">⏳ Extracting text…</div>'+
          '<div class="ocr-prog-track"><div class="ocr-prog-bar" id="_pc_ocr_bar"></div></div>'+
          '<div id="_pc_ocr_pct" style="font-size:12px;color:var(--text-3);margin-top:6px">0%</div>'+
        '</div>'+
        '<div id="_pc_ocr_result" style="display:none">'+
          '<div style="font-weight:700;color:#10b981;font-size:13px;margin-bottom:8px">✅ Text Extracted! Edit if needed:</div>'+
          '<textarea id="_pc_ocr_text" class="form-control" rows="7" style="font-family:monospace;font-size:13px;resize:vertical"></textarea>'+
          '<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">'+
            '<button class="btn btn-primary" onclick="_pcOCRInsert()">↓ Insert into Editor</button>'+
            '<button class="btn btn-secondary" onclick="_pcOCRClear()">🗑️ Clear</button>'+
          '</div>'+
        '</div>'+
        '<div id="_pc_ocr_error" style="display:none;color:#ef4444;font-size:13px;padding:8px 0"></div>'+
      '</div>'+
    '</div>'+

    // ── Rich Text Editor ──
    '<div class="card">'+
      '<div class="card-header" style="flex-wrap:wrap;gap:8px">'+
        '<h3>✍️ Question Paper Content</h3>'+
        '<div style="display:flex;gap:6px;flex-wrap:wrap">'+
          '<button class="btn btn-sm btn-secondary" onclick="_pcInsertTemplate(\''+cid+'\')">📋 Insert Block</button>'+
          '<button class="btn btn-sm" style="background:rgba(239,68,68,.15);color:#f87171;border:1px solid rgba(239,68,68,.3)" onclick="_pcClearEditor()">🗑️ Clear</button>'+
        '</div>'+
      '</div>'+
      // Toolbar
      '<div class="rte-toolbar">'+
        '<select class="rte-select" title="Format" onchange="_rteFormat(this.value);this.value=\'p\'">'+
          '<option value="p">Paragraph</option><option value="h1">Heading 1</option>'+
          '<option value="h2">Heading 2</option><option value="h3">Heading 3</option>'+
        '</select>'+
        '<div class="rte-sep"></div>'+
        '<button class="rte-btn" onclick="_rteCmd(\'bold\')"          title="Bold"><b>B</b></button>'+
        '<button class="rte-btn" onclick="_rteCmd(\'italic\')"        title="Italic"><i>I</i></button>'+
        '<button class="rte-btn" onclick="_rteCmd(\'underline\')"     title="Underline"><u>U</u></button>'+
        '<button class="rte-btn" onclick="_rteCmd(\'strikeThrough\')" title="Strikethrough"><s>S</s></button>'+
        '<div class="rte-sep"></div>'+
        '<button class="rte-btn" onclick="_rteCmd(\'justifyLeft\')"   title="Left">⬅️</button>'+
        '<button class="rte-btn" onclick="_rteCmd(\'justifyCenter\')" title="Center">↔</button>'+
        '<button class="rte-btn" onclick="_rteCmd(\'justifyRight\')"  title="Right">➡️</button>'+
        '<div class="rte-sep"></div>'+
        '<button class="rte-btn" onclick="_rteCmd(\'insertOrderedList\')"   title="Numbered List" style="font-size:11px">1. List</button>'+
        '<button class="rte-btn" onclick="_rteCmd(\'insertUnorderedList\')" title="Bullet List"   style="font-size:11px">• List</button>'+
        '<div class="rte-sep"></div>'+
        '<button class="rte-btn" onclick="_rteCmd(\'indent\')"  title="Indent">⇥</button>'+
        '<button class="rte-btn" onclick="_rteCmd(\'outdent\')" title="Outdent">⇤</button>'+
        '<div class="rte-sep"></div>'+
        '<button class="rte-btn" onclick="_rteInsertMCQ()"     title="Insert MCQ"     style="font-size:11px;padding:0 9px">➕ MCQ</button>'+
        '<button class="rte-btn" onclick="_rteInsertSection()" title="Insert Section" style="font-size:11px;padding:0 9px">§ Section</button>'+
        '<button class="rte-btn" onclick="_rteInsertTable()"   title="Insert Table"   style="font-size:11px;padding:0 9px">⊞ Table</button>'+
        '<button class="rte-btn" onclick="_rteInsertLine()"    title="Insert Line"    style="font-size:11px;padding:0 9px">— Line</button>'+
        '<div class="rte-sep"></div>'+
        '<button class="rte-btn" onclick="_rteCmd(\'removeFormat\')" title="Clear Format" style="font-size:11px">✗ Fmt</button>'+
      '</div>'+
      // Editor area
      '<div id="_pc_editor" class="rte-editor" contenteditable="true" '+
           'data-placeholder="Start typing your question paper here…\n\nUse toolbar to format · MCQ / Section / Table buttons for quick inserts · 📷 Scan Text above to extract from photo." '+
           'oninput="_pc.editorHtml=this.innerHTML" '+
           'onkeydown="_rteKeyDown(event)">'+
      '</div>'+
    '</div>'
  );
}

function _pcDetailField(lbl, oninput, type, val, ph) {
  return '<div class="form-group" style="margin:0"><label class="form-label">'+lbl+'</label>'+
    '<input class="form-control" type="'+type+'" value="'+(val||'')+'" placeholder="'+ph+'" oninput="'+oninput+'">'+
  '</div>';
}

// ══════════════════════════════════════════════════════
//  TEMPLATES TAB
// ══════════════════════════════════════════════════════
function _pcTemplatesTabHtml(cid, em) {
  var keys = Object.keys(_PC_TMPLS);
  return (
    '<div style="margin-bottom:16px">'+
      '<div style="font-size:15px;font-weight:700;margin-bottom:4px">🎨 Choose a Paper Template</div>'+
      '<div style="font-size:13px;color:var(--text-2)">The template controls the paper print layout. After selecting, content is also inserted into the editor automatically.</div>'+
    '</div>'+
    '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px;margin-bottom:20px">'+
    keys.map(function(k){
      var t = _PC_TMPLS[k];
      var active = _pc.template === k;
      return (
        '<div style="border:2px solid '+(active?'#7c3aed':'rgba(255,255,255,.1)')+';border-radius:14px;padding:18px;cursor:pointer;background:'+(active?'rgba(124,58,237,.12)':'rgba(255,255,255,.03)')+';transition:all .2s"'+
          ' onclick="_pcSelectTemplate(\''+k+'\',\''+cid+'\')"'+
          ' onmouseover="if(\''+k+'\'!==\''+_pc.template+'\')this.style.background=\'rgba(255,255,255,.06)\'"'+
          ' onmouseout="if(\''+k+'\'!==\''+_pc.template+'\')this.style.background=\'rgba(255,255,255,.03)\'">'+
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">'+
            '<div style="display:flex;align-items:center;gap:10px">'+
              '<span style="font-size:2rem">'+t.icon+'</span>'+
              '<div>'+
                '<div style="font-weight:700;font-size:14px">'+t.name+'</div>'+
                '<div style="font-size:10px;color:var(--text-3);margin-top:2px">'+t.preview+'</div>'+
              '</div>'+
            '</div>'+
            (active?'<span style="background:#7c3aed;color:#fff;border-radius:999px;font-size:11px;padding:3px 10px;font-weight:700">✓ Active</span>':'<span style="font-size:12px;color:var(--text-3);border:1px solid var(--border);border-radius:999px;padding:3px 10px">Select</span>')+
          '</div>'+
          '<div style="font-size:12px;color:var(--text-2);line-height:1.6;margin-bottom:12px">'+t.desc+'</div>'+
          // Mini paper preview
          '<div style="background:#fff;border-radius:8px;padding:8px 10px;font-size:9px;color:#334155;line-height:1.5">'+
            '<div style="text-align:center;border-bottom:1.5px solid #000;padding-bottom:4px;margin-bottom:4px;font-weight:800;font-size:9px">SCHOOL NAME</div>'+
            '<div style="display:flex;justify-content:space-between;border:0.5px solid #000;padding:2px 6px;margin-bottom:4px;font-size:8px">'+
              '<span>Sub | Class</span><span>Date | Marks</span>'+
            '</div>'+
            '<div style="font-size:8px;border-left:2px solid #555;padding-left:4px;margin-bottom:4px">Instructions: 1. All Qs compulsory…</div>'+
            '<div style="font-size:8px;font-weight:700;border-bottom:0.5px solid #888;padding-bottom:2px;margin-bottom:2px">Section A — MCQ</div>'+
            '<div style="font-size:8px">Q1. ____________ (a)__ (b)__ (c)__ (d)__</div>'+
          '</div>'+
          '<button class="btn btn-primary w-full" style="margin-top:12px;font-size:13px" onclick="event.stopPropagation();_pcSelectTemplate(\''+k+'\',\''+cid+'\','+!!em+')">'+
            (active?'✓ Currently Active — Edit in Editor →':'Use This Template →')+
          '</button>'+
        '</div>'
      );
    }).join('')+
    '</div>'
  );
}

function _pcSelectTemplate(key, cid, em) {
  _pc.template = key;
  // If editor is empty, fill with starter content
  var starter = _PC_STARTER[key] || _PC_STARTER.classic;
  var curContent = _pc.editorHtml || '';
  if (!curContent.replace(/<[^>]*>/g,'').trim()) {
    _pc.editorHtml = starter;
  }
  _pc.pcTab = 'editor';
  _pcRenderMain(cid, em);
  if (typeof toast === 'function') toast('📋 '+_PC_TMPLS[key].name+' template applied! Edit as needed.','success',2500);
}

// ══════════════════════════════════════════════════════
//  DRAFTS TAB
// ══════════════════════════════════════════════════════
function _pcDraftsTabHtml(drafts, cid, em) {
  if (!drafts || !drafts.length) return (
    '<div style="text-align:center;padding:60px 20px;color:var(--text-3)">'+
      '<div style="font-size:3rem;margin-bottom:12px">💾</div>'+
      '<div style="font-size:15px;font-weight:600;color:var(--text);margin-bottom:8px">No Saved Drafts</div>'+
      '<div style="font-size:13px;margin-bottom:20px">After writing the paper in the Editor tab, press the "💾 Save Draft" button</div>'+
      '<button class="btn btn-primary" onclick="_pc.pcTab=\'editor\';_pcRenderMain(\''+cid+'\','+!!em+')">✍️ Start Writing</button>'+
    '</div>'
  );
  return (
    '<div style="margin-bottom:14px;font-size:13px;color:var(--text-2)">'+drafts.length+' saved draft'+( drafts.length!==1?'s':'')+' — click Continue to resume editing</div>'+
    '<div style="display:flex;flex-direction:column;gap:10px">'+
    drafts.slice().reverse().map(function(d){
      var isActive = d.id === _pc.draftId;
      return (
        '<div style="background:'+(isActive?'rgba(124,58,237,.1)':'var(--glass)')+';border:1.5px solid '+(isActive?'#7c3aed':'var(--border)')+';border-radius:12px;padding:14px 18px;display:flex;align-items:center;gap:14px;flex-wrap:wrap">'+
          '<div style="font-size:2rem;flex-shrink:0">📄</div>'+
          '<div style="flex:1;min-width:0">'+
            '<div style="font-weight:700;font-size:14px">'+d.name+(isActive?' <span style="font-size:11px;color:#a78bfa">(currently editing)</span>':'')+'</div>'+
            '<div style="font-size:12px;color:var(--text-3);margin-top:2px">'+
              (d.subject||'—')+' · '+(d.grade||'—')+' · '+(d.exam||'—')+
              ' &nbsp;·&nbsp; Saved by <b>'+d.savedBy+'</b>'+
              ' &nbsp;·&nbsp; '+_pcFmtDraftDate(d.savedAt)+
            '</div>'+
          '</div>'+
          '<div style="display:flex;gap:6px;flex-wrap:wrap;flex-shrink:0">'+
            '<button class="btn btn-sm btn-primary" onclick="_pcLoadDraft(\''+d.id+'\',\''+cid+'\','+!!em+')">▶️ Continue</button>'+
            '<button class="btn btn-sm btn-secondary" onclick="_pcPrintDraft(\''+d.id+'\')">🖨️ Print</button>'+
            '<button class="btn btn-sm btn-danger" onclick="_pcDeleteDraft(\''+d.id+'\',\''+cid+'\')">🗑️</button>'+
          '</div>'+
        '</div>'
      );
    }).join('')+
    '</div>'
  );
}

function _pcFmtDraftDate(iso) {
  if (!iso) return '';
  try {
    var d = new Date(iso);
    return d.toLocaleDateString([],{day:'numeric',month:'short',year:'numeric'})+' '+d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
  } catch(e) { return iso; }
}

// ── Draft save / load / delete ─────────────────────────
function _pcSaveDraft(cid) {
  var ed = document.getElementById('_pc_editor');
  if (ed) _pc.editorHtml = ed.innerHTML;

  if (!(_pc.editorHtml||'').replace(/<[^>]*>/g,'').trim() && !_pc.subject) {
    if (typeof toast==='function') toast('Nothing to save — add some content first','warning'); return;
  }

  var defName = _pc.draftName || ((_pc.subject?_pc.subject+' — ':'')+(_pc.exam||'Draft'));
  var name = window.prompt('Save draft as:', defName);
  if (!name) return;
  _pc.draftName = name;

  var drafts = (typeof DB!=='undefined' ? DB.get('paper_drafts') : null) || [];
  var draft = {
    id:          _pc.draftId || (typeof genId==='function'?genId('pd'):'pd_'+Date.now()),
    name:        name,
    school:      _pc.school,    subject:  _pc.subject,
    grade:       _pc.grade,     exam:     _pc.exam,
    date:        _pc.date,      marks:    _pc.marks,
    duration:    _pc.duration,  instructions: _pc.instructions,
    editorHtml:  _pc.editorHtml, template: _pc.template,
    savedAt:     new Date().toISOString(),
    savedBy:     (typeof CU!=='undefined' && CU ? (CU.name||'User') : 'User')
  };

  if (_pc.draftId) {
    var idx = drafts.findIndex(function(d){ return d.id===_pc.draftId; });
    if (idx!==-1) drafts[idx]=draft; else drafts.push(draft);
  } else {
    _pc.draftId = draft.id;
    drafts.push(draft);
  }
  if (typeof DB!=='undefined') DB.set('paper_drafts', drafts);
  if (typeof toast==='function') toast('✅ Draft saved: '+name,'success');
}

function _pcLoadDraft(draftId, cid, em) {
  var drafts = (typeof DB!=='undefined' ? DB.get('paper_drafts') : null) || [];
  var d = drafts.find(function(x){ return x.id===draftId; });
  if (!d) return;
  _pc.school=d.school||''; _pc.subject=d.subject||''; _pc.grade=d.grade||'';
  _pc.exam=d.exam||'';     _pc.date=d.date||'';      _pc.marks=d.marks||'100';
  _pc.duration=d.duration||'3 Hours'; _pc.instructions=d.instructions||'';
  _pc.editorHtml=d.editorHtml||'';   _pc.template=d.template||'classic';
  _pc.draftId=d.id;                   _pc.draftName=d.name;
  _pc.pcTab='editor';
  _pcRenderMain(cid, em);
  if (typeof toast==='function') toast('📄 Draft loaded: '+d.name,'info');
}

function _pcPrintDraft(draftId) {
  var drafts = (typeof DB!=='undefined' ? DB.get('paper_drafts') : null) || [];
  var d = drafts.find(function(x){ return x.id===draftId; });
  if (!d) return;
  var saved = {school:_pc.school,subject:_pc.subject,grade:_pc.grade,exam:_pc.exam,
               date:_pc.date,marks:_pc.marks,duration:_pc.duration,instructions:_pc.instructions,
               editorHtml:_pc.editorHtml,template:_pc.template};
  Object.assign(_pc, {school:d.school,subject:d.subject,grade:d.grade,exam:d.exam,
    date:d.date,marks:d.marks,duration:d.duration,instructions:d.instructions,
    editorHtml:d.editorHtml,template:d.template});
  _pcPrint();
  Object.assign(_pc, saved);
}

function _pcDeleteDraft(draftId, cid) {
  if (typeof confirmAction==='function' ? !confirmAction('Delete this draft?') : !confirm('Delete this draft?')) return;
  var drafts = (typeof DB!=='undefined' ? DB.get('paper_drafts') : null) || [];
  DB.set('paper_drafts', drafts.filter(function(d){ return d.id!==draftId; }));
  if (_pc.draftId===draftId) { _pc.draftId=null; _pc.draftName=''; }
  _pc.pcTab='drafts';
  _pcRenderMain(cid);
  if (typeof toast==='function') toast('Draft deleted','info');
}

// ══════════════════════════════════════════════════════
//  RTE COMMANDS
// ══════════════════════════════════════════════════════
function _rteCmd(cmd, val) {
  document.execCommand(cmd, false, val||null);
  var ed = document.getElementById('_pc_editor');
  if (ed) ed.focus();
}
function _rteFormat(val) {
  document.execCommand('formatBlock', false, '<'+val+'>');
  var ed = document.getElementById('_pc_editor');
  if (ed) ed.focus();
}
function _rteKeyDown(e) {
  if (e.key==='Tab') { e.preventDefault(); document.execCommand('insertHTML',false,'&emsp;&emsp;'); }
}
function _rteInsertMCQ() {
  var n = ((document.getElementById('_pc_editor')||{}).innerHTML||'').split('<p><b>Q').length;
  document.execCommand('insertHTML',false,
    '<p><b>Q'+n+'. [Type your question here]</b></p>'+
    '<p>&emsp;(a) Option A &emsp;&emsp; (b) Option B &emsp;&emsp; (c) Option C &emsp;&emsp; (d) Option D</p>'+
    '<p><br></p>');
  var ed=document.getElementById('_pc_editor'); if(ed)ed.focus();
}
function _rteInsertSection() {
  var title = window.prompt('Section title (e.g. "Section A — MCQ  [1 mark each]"):','Section A — Multiple Choice Questions');
  if (!title) return;
  document.execCommand('insertHTML',false,
    '<p style="font-weight:800;font-size:1.1em;border-bottom:2px solid currentColor;padding-bottom:4px;margin-top:20px">'+title+'</p><p><br></p>');
  var ed=document.getElementById('_pc_editor'); if(ed)ed.focus();
}
function _rteInsertTable() {
  var r=parseInt(window.prompt('Number of rows:','4'))||4;
  var c=parseInt(window.prompt('Number of columns:','4'))||4;
  var html='<table border="1" cellpadding="8" style="border-collapse:collapse;width:100%;margin:14px 0">';
  for(var i=0;i<r;i++){
    html+='<tr>';
    for(var j=0;j<c;j++)
      html+=i===0?'<th style="background:rgba(0,0,0,.08);font-weight:700">&nbsp;&nbsp;&nbsp;</th>':'<td>&nbsp;&nbsp;&nbsp;</td>';
    html+='</tr>';
  }
  html+='</table><p><br></p>';
  document.execCommand('insertHTML',false,html);
  var ed=document.getElementById('_pc_editor'); if(ed)ed.focus();
}
function _rteInsertLine() {
  document.execCommand('insertHTML',false,'<hr style="border:none;border-top:1.5px solid #aaa;margin:18px 0"><p><br></p>');
  var ed=document.getElementById('_pc_editor'); if(ed)ed.focus();
}
function _pcClearEditor() {
  if (!(typeof confirmAction==='function'?confirmAction('Clear all editor content?'):confirm('Clear all editor content?'))) return;
  var ed=document.getElementById('_pc_editor');
  if(ed){ed.innerHTML=''; _pc.editorHtml='';}
}

// Quick content-block inserter modal
function _pcInsertTemplate(cid) {
  var blocks = [
    {key:'mcq',   nm:'❓ MCQ Questions block',          desc:'Multiple choice with 4 options'},
    {key:'short', nm:'📝 Short Answer block',           desc:'Short answer with mark allocation'},
    {key:'long',  nm:'📄 Long Answer / Essay block',    desc:'Descriptive questions'},
    {key:'fill',  nm:'⬜ Fill in the Blanks block',     desc:'Blank-filling questions'},
    {key:'tf',    nm:'✅ True / False block',            desc:'True or False question set'},
    {key:'match', nm:'🔗 Match the Following block',    desc:'Two-column matching exercise'},
  ];
  var html = '<div style="display:flex;flex-direction:column;gap:8px">'+
    blocks.map(function(b){
      return '<div onclick="_pcApplyBlock(\''+b.key+'\');closeAllModals()" '+
        'style="display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:10px;border:1px solid var(--border);cursor:pointer;transition:background .14s" '+
        'onmouseover="this.style.background=\'rgba(124,58,237,.1)\'" onmouseout="this.style.background=\'\'">'+
        '<div style="font-size:1.4rem">'+b.nm.split(' ')[0]+'</div>'+
        '<div><div style="font-weight:600;font-size:14px">'+b.nm.slice(2)+'</div><div style="font-size:11px;color:var(--text-3)">'+b.desc+'</div></div>'+
      '</div>';
    }).join('')+
  '</div>';
  if(typeof buildModal==='function') buildModal('_pc_block_modal','📋 Insert Content Block',html,null);
}

var _PC_BLOCKS = {
  mcq:
    '<p style="font-weight:800;font-size:1.05em;border-bottom:1.5px solid currentColor;padding-bottom:3px;margin-top:16px">Multiple Choice Questions &emsp; <i style="font-weight:400;font-size:.85em">[1 mark each]</i></p>'+
    '<p><b>Q__.</b> ___________________________?</p>'+
    '<p>&emsp;(a) ___ &emsp;&emsp; (b) ___ &emsp;&emsp; (c) ___ &emsp;&emsp; (d) ___</p><p><br></p>'+
    '<p><b>Q__.</b> ___________________________?</p>'+
    '<p>&emsp;(a) ___ &emsp;&emsp; (b) ___ &emsp;&emsp; (c) ___ &emsp;&emsp; (d) ___</p>',
  short:
    '<p style="font-weight:800;font-size:1.05em;border-bottom:1.5px solid currentColor;padding-bottom:3px;margin-top:16px">Short Answer Questions &emsp; <i style="font-weight:400;font-size:.85em">[2 marks each]</i></p>'+
    '<p><b>Q__.</b> Define ___________________________. <i>[2]</i></p><p><br><br></p>'+
    '<p><b>Q__.</b> Explain ___________________________ with example. <i>[2]</i></p>',
  long:
    '<p style="font-weight:800;font-size:1.05em;border-bottom:1.5px solid currentColor;padding-bottom:3px;margin-top:16px">Long Answer Questions &emsp; <i style="font-weight:400;font-size:.85em">[5 marks each]</i></p>'+
    '<p><b>Q__.</b> Describe in detail: ___________________________. <i>[5]</i></p><p><br><br><br></p>'+
    '<p><b>Q__.</b> Explain with diagram: ___________________________. <i>[5]</i></p>',
  fill:
    '<p style="font-weight:800;font-size:1.05em;border-bottom:1.5px solid currentColor;padding-bottom:3px;margin-top:16px">Fill in the Blanks &emsp; <i style="font-weight:400;font-size:.85em">[1 mark each]</i></p>'+
    '<p>1. The capital of India is <u>&emsp;&emsp;&emsp;&emsp;&emsp;</u>.</p>'+
    '<p>2. ________________ is known as the Father of the Nation.</p>'+
    '<p>3. Water boils at <u>&emsp;&emsp;&emsp;&emsp;</u> degrees Celsius.</p>',
  tf:
    '<p style="font-weight:800;font-size:1.05em;border-bottom:1.5px solid currentColor;padding-bottom:3px;margin-top:16px">True / False &emsp; <i style="font-weight:400;font-size:.85em">[1 mark each — write T or F]</i></p>'+
    '<p>1. ___________________________ &emsp; [ &emsp; ]</p>'+
    '<p>2. ___________________________ &emsp; [ &emsp; ]</p>'+
    '<p>3. ___________________________ &emsp; [ &emsp; ]</p>',
  match:
    '<p style="font-weight:800;font-size:1.05em;border-bottom:1.5px solid currentColor;padding-bottom:3px;margin-top:16px">Match the Following &emsp; <i style="font-weight:400;font-size:.85em">[1 mark each correct match]</i></p>'+
    '<table border="1" cellpadding="8" style="border-collapse:collapse;width:100%;margin:10px 0">'+
    '<tr><th style="width:50%;background:rgba(0,0,0,.07)">Column A</th><th style="width:50%;background:rgba(0,0,0,.07)">Column B</th></tr>'+
    '<tr><td>1. ________________</td><td>A. ________________</td></tr>'+
    '<tr><td>2. ________________</td><td>B. ________________</td></tr>'+
    '<tr><td>3. ________________</td><td>C. ________________</td></tr>'+
    '<tr><td>4. ________________</td><td>D. ________________</td></tr></table>'
};

function _pcApplyBlock(key) {
  var ed=document.getElementById('_pc_editor'); if(!ed)return;
  ed.focus();
  document.execCommand('insertHTML',false,(_PC_BLOCKS[key]||'')+'<p><br></p>');
  _pc.editorHtml=ed.innerHTML;
  if(typeof toast==='function') toast('Block inserted — fill in the blanks!','success',2000);
}

// ══════════════════════════════════════════════════════
//  OCR FUNCTIONS
// ══════════════════════════════════════════════════════
function _pcOCRCamera() {
  var ob=document.getElementById('_pc_ocr_body'); if(ob)ob.style.display='block';
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){
    if(typeof toast==='function')toast('Camera not supported on this browser','error'); return;
  }
  navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'},audio:false})
    .then(function(stream){
      _pc.ocrStream=stream;
      var v=document.getElementById('_pc_ocr_video');
      if(v){v.srcObject=stream;v.play();}
      var cv=document.getElementById('_pc_cam_view');
      var btn=document.getElementById('_pc_stopcam_btn');
      if(cv)cv.style.display='block';
      if(btn)btn.style.display='inline-flex';
    })
    .catch(function(err){if(typeof toast==='function')toast('Camera denied: '+(err.message||err),'error');});
}
function _pcOCRStopCam() {
  window._pcCleanup();
  var cv=document.getElementById('_pc_cam_view');
  var btn=document.getElementById('_pc_stopcam_btn');
  if(cv)cv.style.display='none';
  if(btn)btn.style.display='none';
}
function _pcOCRCapture() {
  var v=document.getElementById('_pc_ocr_video');
  var c=document.getElementById('_pc_ocr_canvas');
  if(!v||!c)return;
  c.width=v.videoWidth||640; c.height=v.videoHeight||480;
  c.getContext('2d').drawImage(v,0,0,c.width,c.height);
  _pcOCRStopCam();
  _pcOCRProcess(c.toDataURL('image/png'));
}
function _pcOCRFile(input) {
  var file=input.files[0]; if(!file)return;
  var ob=document.getElementById('_pc_ocr_body'); if(ob)ob.style.display='block';
  var reader=new FileReader();
  reader.onload=function(e){_pcOCRProcess(e.target.result);};
  reader.readAsDataURL(file);
  input.value='';
}
function _pcOCRProcess(src) {
  var ldg=document.getElementById('_pc_ocr_loading');
  var res=document.getElementById('_pc_ocr_result');
  var err=document.getElementById('_pc_ocr_error');
  var bar=document.getElementById('_pc_ocr_bar');
  var pct=document.getElementById('_pc_ocr_pct');
  if(ldg)ldg.style.display='block';
  if(res)res.style.display='none';
  if(err)err.style.display='none';
  if(bar)bar.style.width='0%';
  // Lazy-load Tesseract if not already present
  var _doOcr=function(){
    if(!window.Tesseract){
      if(ldg)ldg.style.display='none';
      if(err){err.textContent='❌ OCR library failed to load. Check internet.';err.style.display='block';}
      return;
    }
    Tesseract.recognize(src,'eng+hin',{
    logger:function(m){
      if(m.status==='recognizing text'){
        var p=Math.round(m.progress*100)+'%';
        if(bar)bar.style.width=p; if(pct)pct.textContent=p;
      }
    }
  }).then(function(r){
    var text=(r.data.text||'').trim();
    _pc.ocrText=text;
    if(ldg)ldg.style.display='none';
    if(res)res.style.display='block';
    var ot=document.getElementById('_pc_ocr_text');
    if(ot)ot.value=text||'(No text detected — try a clearer image)';
  }).catch(function(e){
    if(ldg)ldg.style.display='none';
    if(err){err.textContent='❌ OCR failed: '+(e.message||'Unknown error');err.style.display='block';}
    if(typeof toast==='function')toast('OCR failed — try a clearer, well-lit image','error');
  });
  }; // end _doOcr
  // Load Tesseract lazily then run OCR
  if(window.Tesseract){ _doOcr(); }
  else if(window._loadTesseract){ window._loadTesseract().then(_doOcr); }
  else { _doOcr(); } // fallback
}
function _pcOCRInsert() {
  var ot=document.getElementById('_pc_ocr_text'); if(!ot)return;
  var text=ot.value.trim();
  if(!text){if(typeof toast==='function')toast('Nothing to insert','warning');return;}
  _pc.ocrText=text;
  var ed=document.getElementById('_pc_editor'); if(!ed)return;
  ed.focus();
  var html=text.split('\n').map(function(l){return l.trim();}).filter(function(l){return l;})
    .map(function(l){return '<p>'+l.replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</p>';}).join('');
  document.execCommand('insertHTML',false,html);
  _pc.editorHtml=ed.innerHTML;
  if(typeof toast==='function')toast('✅ Text inserted into editor!','success');
}
function _pcOCRClear() {
  _pc.ocrText='';
  var ot=document.getElementById('_pc_ocr_text');
  var res=document.getElementById('_pc_ocr_result');
  if(ot)ot.value=''; if(res)res.style.display='none';
}

// ══════════════════════════════════════════════════════
//  PRINT / PREVIEW
// ══════════════════════════════════════════════════════
function _pcPrint() {
  var ed=document.getElementById('_pc_editor');
  if(ed)_pc.editorHtml=ed.innerHTML;
  if(!(_pc.editorHtml||'').replace(/<[^>]*>/g,'').trim()){
    if(typeof toast==='function')toast('Editor is empty — add questions first','warning'); return;
  }
  var s=(typeof getSettings==='function')?getSettings():{};
  var logo=s.schoolLogo||'';
  var tmpl=_PC_TMPLS[_pc.template]||_PC_TMPLS.classic;
  var instrLines=(_pc.instructions||'').split('\n').map(function(l){return l.trim();}).filter(Boolean);

  var w=window.open('','_blank','width=920,height=780');
  if(!w){if(typeof toast==='function')toast('Allow popups to print','warning');return;}
  w.document.write('<!DOCTYPE html><html><head>'+
    '<title>'+(_pc.exam||'Exam')+' — '+(_pc.subject||'Subject')+'</title>'+
    '<meta charset="UTF-8">'+
    '<style>'+
      '*{box-sizing:border-box;margin:0;padding:0}'+
      tmpl.printCss+
      '.no-print{text-align:center;padding:16px;background:#f0f0f0}'+
      '.prt-btn{padding:10px 28px;border:none;border-radius:8px;font-size:14px;cursor:pointer;font-family:Arial;margin:4px}'+
      '@media print{.no-print{display:none!important}}'+
    '</style>'+
  '</head><body>'+
    '<div class="no-print">'+
      '<button class="prt-btn" style="background:#1e1b4b;color:#fff" onclick="window.print()">🖨️ Print Paper</button>'+
      '<button class="prt-btn" style="background:#475569;color:#fff" onclick="window.close()">✕ Close</button>'+
    '</div>'+
    '<div class="hdr">'+
      (logo?'<img src="'+logo+'" style="height:60px;border-radius:4px;margin-bottom:8px;display:block;margin-left:auto;margin-right:auto"><br>':'')+
      '<div class="school-nm">'+(_pc.school||s.schoolName||'School Name')+'</div>'+
      '<div class="exam-nm">'+(_pc.exam||'Examination')+'</div>'+
    '</div>'+
    '<div class="meta-row">'+
      '<span><b>Subject:</b> '+(_pc.subject||'—')+'</span>'+
      '<span><b>Class:</b> '+(_pc.grade||'—')+'</span>'+
      '<span><b>Date:</b> '+(_pc.date||'—')+'</span>'+
      '<span><b>Duration:</b> '+(_pc.duration||'—')+'</span>'+
      '<span><b>Max Marks:</b> '+(_pc.marks||'—')+'</span>'+
    '</div>'+
    (instrLines.length?
      '<div class="instr"><b>General Instructions:</b><ol>'+
        instrLines.map(function(l){return'<li>'+l+'</li>';}).join('')+
      '</ol></div>':'')+
    '<div class="body">'+_pc.editorHtml+'</div>'+
  '</body></html>');
  w.document.close();
}
function _pcPreview() { _pcPrint(); }
