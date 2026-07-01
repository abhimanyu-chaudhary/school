/* =====================================================
   SAGARMATHA GURUKUL ACADEMY — CORE JAVASCRIPT
   ===================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initMobileNav();
  initHeroSlider();
  initAccordions();
  initTabRouting();
  initAdmissionsForm();
  initAlumniForm();
  initAlumniUpdateForm();
  loadLiveNotices();
  loadLiveCalendar();
  loadLiveLeadership();
  loadLiveAlumni();
});

// ── Header Scroll Class ──
function initHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
}

// ── Mobile Navigation Dropdowns ──
function initMobileNav() {
  const toggle = document.querySelector('.hamburger-toggle');
  const nav = document.querySelector('.main-nav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    nav.classList.toggle('active');
    toggle.textContent = nav.classList.contains('active') ? '✕' : '☰';
  });

  // Close nav on click outside
  document.addEventListener('click', (e) => {
    if (nav.classList.contains('active') && !nav.contains(e.target) && e.target !== toggle) {
      nav.classList.remove('active');
      toggle.textContent = '☰';
    }
  });

  // Handle collapsible dropdown sub-menus on mobile viewport
  const navLinksWithDropdown = document.querySelectorAll('.nav-item-li > .nav-link');
  navLinksWithDropdown.forEach(link => {
    link.addEventListener('click', (e) => {
      if (window.innerWidth <= 768) {
        const parentLi = link.parentElement;
        const menu = parentLi.querySelector('.dropdown-menu');
        if (menu) {
          e.preventDefault();
          parentLi.classList.toggle('active');
        }
      }
    });
  });

  const dropdownLinksWithSub = document.querySelectorAll('.dropdown-item-li > .dropdown-link');
  dropdownLinksWithSub.forEach(link => {
    link.addEventListener('click', (e) => {
      if (window.innerWidth <= 768) {
        const parentLi = link.parentElement;
        const menu = parentLi.querySelector('.sub-dropdown-menu');
        if (menu) {
          e.preventDefault();
          parentLi.classList.toggle('active');
        }
      }
    });
  });
}

// ── Hero Slider Carousel (Woodstock Style) ──
function initHeroSlider() {
  const slides = document.querySelectorAll('.slide');
  const dotsContainer = document.querySelector('.slider-dots');
  const prevBtn = document.querySelector('.slider-prev');
  const nextBtn = document.querySelector('.slider-next');
  if (!slides.length) return;

  let activeIndex = 0;
  let timer = null;

  // Build dots
  slides.forEach((_, idx) => {
    const dot = document.createElement('div');
    dot.className = `slider-dot ${idx === 0 ? 'active' : ''}`;
    dot.addEventListener('click', () => gotoSlide(idx));
    dotsContainer.appendChild(dot);
  });

  const dots = document.querySelectorAll('.slider-dot');

  function gotoSlide(idx) {
    slides[activeIndex].classList.remove('active');
    dots[activeIndex].classList.remove('active');
    
    activeIndex = (idx + slides.length) % slides.length;
    
    slides[activeIndex].classList.add('active');
    dots[activeIndex].classList.add('active');
    resetTimer();
  }

  function nextSlide() {
    gotoSlide(activeIndex + 1);
  }

  function prevSlide() {
    gotoSlide(activeIndex - 1);
  }

  function resetTimer() {
    clearInterval(timer);
    timer = setInterval(nextSlide, 6000);
  }

  if (prevBtn) prevBtn.addEventListener('click', prevSlide);
  if (nextBtn) nextBtn.addEventListener('click', nextSlide);

  resetTimer();
}

// ── Accordions (FAQ section) ──
function initAccordions() {
  const accordionHeaders = document.querySelectorAll('.accordion-header');
  accordionHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const acc = header.parentElement;
      acc.classList.toggle('active');
    });
  });
}

// ── Tab Routing (Auto opens tabs via URL Hash e.g. about.html#vision) ──
function initTabRouting() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');
  if (!tabButtons.length) return;

  function activateTab(hash) {
    if (!hash) return;
    const targetId = hash.replace('#', '');
    const targetBtn = document.querySelector(`.tab-btn[data-tab="${targetId}"]`);
    const targetPanel = document.getElementById(targetId);

    if (targetBtn && targetPanel) {
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabPanels.forEach(panel => panel.classList.remove('active'));

      targetBtn.classList.add('active');
      targetPanel.classList.add('active');

      // Scroll smoothly to section if needed, but not on initial load to avoid layout jump
      if (window.scrollY > 200) {
        targetPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;
      window.location.hash = tabId;
    });
  });

  // Watch URL Hash Changes
  window.addEventListener('hashchange', () => activateTab(window.location.hash));

  // Initialize on page load
  if (window.location.hash) {
    activateTab(window.location.hash);
  } else {
    // Default: activate first tab button
    const firstBtn = tabButtons[0];
    if (firstBtn) {
      const tabId = firstBtn.dataset.tab;
      activateTab('#' + tabId);
    }
  }
}

// ── Toast Notifications ──
function toast(msg, type = 'success') {
  let box = document.getElementById('website-toast-container');
  if (!box) {
    box = document.createElement('div');
    box.id = 'website-toast-container';
    box.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:10px;';
    document.body.appendChild(box);
  }
  const t = document.createElement('div');
  t.style.cssText = `padding:14px 24px;background:#ffffff;border-radius:6px;font-weight:600;font-size:.9rem;box-shadow:0 10px 30px rgba(0,47,108,.15);border-left:4px solid ${type === 'success' ? '#10b981' : '#ef4444'};display:flex;align-items:center;gap:10px;animation:slideIn .25s ease;`;
  
  // Slide in keyframe inject
  if (!document.getElementById('toast-animation-style')) {
    const s = document.createElement('style');
    s.id = 'toast-animation-style';
    s.textContent = '@keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:none;opacity:1}}';
    document.head.appendChild(s);
  }

  t.innerHTML = `<span>${type === 'success' ? '✅' : '⚠️'}</span><span>${msg}</span>`;
  box.appendChild(t);
  setTimeout(() => {
    t.style.transition = 'opacity .3s, transform .3s';
    t.style.opacity = '0';
    t.style.transform = 'translateY(10px)';
    setTimeout(() => t.remove(), 300);
  }, 4000);
}

// ── API Configuration ──
// Connects to local server or online host on the same domain
const API_URL = window.location.origin + '/api/kv.php';
const SCHOOL_ID = 'sch001'; // NextGen Entrepreneurs School ID

// ── Admissions Submission Handler ──
function initAdmissionsForm() {
  const form = document.getElementById('admissions-apply-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    
    const studentName = document.getElementById('studentName').value.trim();
    const classLabel = document.getElementById('classSelect').value;
    const dob = document.getElementById('dob').value;
    const gender = document.getElementById('gender').value;
    const fatherName = document.getElementById('fatherName').value.trim();
    const motherName = document.getElementById('motherName').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const email = document.getElementById('email').value.trim();
    const address = document.getElementById('address').value.trim();

    if (!studentName || !classLabel || !dob || !gender || !fatherName || !motherName || !phone || !address) {
      toast('Please fill all required fields.', 'error');
      return;
    }

    btn.disabled = true;
    btn.textContent = '⏳ Submitting Application...';

    // 1. Fetch current pending admissions
    let pendingAdmissions = [];
    try {
      const res = await fetch(`${API_URL}?school_id=${SCHOOL_ID}&key=pendingAdmissions`);
      if (res.ok) {
        const text = await res.text();
        if (text) {
          pendingAdmissions = JSON.parse(text) || [];
        }
      }
    } catch (err) {
      console.log("No existing pending admissions found or offline.");
    }

    // 2. Add new registration record
    const newRecord = {
      id: 'adm_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      name: studentName,
      classLabel: classLabel,
      dob: dob,
      gender: gender,
      fatherName: fatherName,
      motherName: motherName,
      phone: phone,
      email: email,
      address: address,
      status: 'pending',
      appliedOn: new Date().toISOString().split('T')[0]
    };

    pendingAdmissions.push(newRecord);

    // 3. Save back to the key-value database
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          school_id: SCHOOL_ID,
          key: 'pendingAdmissions',
          value: pendingAdmissions
        })
      });

      if (res.ok) {
        toast('🎉 Application submitted successfully! Please check your portal updates soon.', 'success');
        form.reset();
      } else {
        toast('Failed to submit application. Server error.', 'error');
      }
    } catch (err) {
      toast('Network error. Check your connection.', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = '📨 Submit Application';
    }
  });
}

// ── Alumni Registration Form Handler ──
function initAlumniForm() {
  const form = document.getElementById('alumni-reg-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');

    const name = document.getElementById('alumniName').value.trim();
    const passYear = document.getElementById('passYear').value;
    const currentStatus = document.getElementById('currentStatus').value.trim();
    const email = document.getElementById('alumniEmail').value.trim();
    const phone = document.getElementById('alumniPhone').value.trim();
    const message = document.getElementById('alumniMessage').value.trim();

    if (!name || !passYear || !currentStatus || !email || !phone) {
      toast('Please fill all required fields.', 'error');
      return;
    }

    btn.disabled = true;
    btn.textContent = '⏳ Registering...';

    // 1. Fetch current alumni list
    let alumniList = [];
    try {
      const res = await fetch(`${API_URL}?school_id=${SCHOOL_ID}&key=alumni_registrations`);
      if (res.ok) {
        const text = await res.text();
        if (text) {
          alumniList = JSON.parse(text) || [];
        }
      }
    } catch (err) {}

    // 2. Append new alumni
    alumniList.push({
      id: 'alumni_' + Date.now(),
      name,
      passYear,
      currentStatus,
      email,
      phone,
      message,
      verified: false,
      registeredOn: new Date().toISOString().split('T')[0]
    });

    // 3. Save back to API
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          school_id: SCHOOL_ID,
          key: 'alumni_registrations',
          value: alumniList
        })
      });

      if (res.ok) {
        toast('🎉 Registered successfully! Welcome to the Alumni Network.', 'success');
        form.reset();
      } else {
        toast('Registration failed. Server error.', 'error');
      }
    } catch (err) {
      toast('Network error. Check connection.', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = '🎓 Register Now';
    }
  });
}

// ── Load Live Notices from Central Database ──
async function loadLiveNotices() {
  const container = document.getElementById('live-notices-container');
  if (!container) return;

  try {
    const res = await fetch(`${API_URL}?school_id=${SCHOOL_ID}&key=notices`);
    if (res.ok) {
      const text = await res.text();
      if (text) {
        const notices = JSON.parse(text) || [];
        // Only get active notices or show last 3
        const active = notices.slice(0, 3);
        if (active.length > 0) {
          container.innerHTML = active.map(n => `
            <div style="background:#ffffff; border:1px solid #e2e8f0; border-left:4px solid #002F6C; border-radius:6px; padding:18px; margin-bottom:12px; box-shadow: 0 2px 8px rgba(0,47,108,0.03);">
              <div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:0.78rem; color:#64748b; font-weight:600;">
                <span>📢 NOTICE</span>
                <span>📅 ${n.date || ''}</span>
              </div>
              <h4 style="color:#002F6C; font-size:1.05rem; font-weight:700; margin-bottom:8px;">${n.title}</h4>
              <p style="font-size:0.9rem; color:#475569; line-height:1.5;">${n.body}</p>
            </div>
          `).join('');
          return;
        }
      }
    }
  } catch (err) {
    console.log("Offline or no live notices.");
  }

  // Fallback if no notices in DB
  container.innerHTML = `
    <div style="background:#ffffff; border:1px solid #e2e8f0; border-left:4px solid #002F6C; border-radius:6px; padding:18px; margin-bottom:12px;">
      <div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:0.78rem; color:#64748b; font-weight:600;">
        <span>📢 GENERAL NOTICE</span>
        <span>📅 Active</span>
      </div>
      <h4 style="color:#002F6C; font-size:1.05rem; font-weight:700; margin-bottom:8px;">New Academic Session Admissions Open</h4>
      <p style="font-size:0.9rem; color:#475569; line-height:1.5;">Admissions for the upcoming academic session are now open for Grade KG to Grade 10. Visit our Admissions section to apply online.</p>
    </div>
    <div style="background:#ffffff; border:1px solid #e2e8f0; border-left:4px solid #002F6C; border-radius:6px; padding:18px; margin-bottom:12px;">
      <div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:0.78rem; color:#64748b; font-weight:600;">
        <span>📢 INFRASTRUCTURE</span>
        <span>📅 Active</span>
      </div>
      <h4 style="color:#002F6C; font-size:1.05rem; font-weight:700; margin-bottom:8px;">Smart Tech Lab Construction Completed</h4>
      <p style="font-size:0.9rem; color:#475569; line-height:1.5;">Our new state-of-the-art computer science and electronics lab is fully completed and ready for student enrollment check-ins.</p>
    </div>
  `;
}

// ── Load Live Academic Calendar from Database ──
async function loadLiveCalendar() {
  const tbody = document.getElementById('live-calendar-tbody');
  if (!tbody) return;

  try {
    const res = await fetch(`${API_URL}?school_id=${SCHOOL_ID}&key=calendar_events`);
    if (res.ok) {
      const text = await res.text();
      if (text) {
        const events = JSON.parse(text) || [];
        const upcoming = events.slice(0, 10);
        if (upcoming.length > 0) {
          tbody.innerHTML = upcoming.map(e => `
            <tr>
              <td style="font-weight:700; color:#002F6C;">${e.title}</td>
              <td style="text-transform:capitalize;">
                <span style="font-size: 0.75rem; font-weight: 700; padding: 2px 10px; border-radius: 20px;
                  ${e.type === 'holiday' ? 'background:rgba(239,68,68,.12); color:#ef4444;' :
                    e.type === 'festival' ? 'background:rgba(245,158,11,.1); color:#f59e0b;' :
                    'background:rgba(0,90,156,.1); color:#005A9C;'}">
                  ${e.type}
                </span>
              </td>
              <td>📅 ${e.date}</td>
              <td style="color:#475569;">${e.note || 'No description available.'}</td>
            </tr>
          `).join('');
          return;
        }
      }
    }
  } catch (err) {
    console.log("Offline or no live calendar.");
  }

  // Fallback default events
  const defaultEvents = [
    { title: 'New Year Day', type: 'holiday', date: '2026-01-01', note: 'School remains closed.' },
    { title: 'Republic Day Celebration', type: 'event', date: '2026-01-26', note: 'Flag hoisting ceremony at 8:30 AM.' },
    { title: 'Holi Festival', type: 'holiday', date: '2026-03-03', note: 'Festival of colors. Closed.' },
    { title: 'New Academic Session Begins', type: 'event', date: '2026-04-01', note: 'Classes start for Grade KG-10.' },
    { title: 'Independence Day', type: 'holiday', date: '2026-08-15', note: 'National holiday.' }
  ];

  tbody.innerHTML = defaultEvents.map(e => `
    <tr>
      <td style="font-weight:700; color:#002F6C;">${e.title}</td>
      <td style="text-transform:capitalize;">
        <span style="font-size: 0.75rem; font-weight: 700; padding: 2px 10px; border-radius: 20px;
          ${e.type === 'holiday' ? 'background:rgba(239,68,68,.12); color:#ef4444;' :
            'background:rgba(0,90,156,.1); color:#005A9C;'}">
          ${e.type}
        </span>
      </td>
      <td>📅 ${e.date}</td>
      <td style="color:#475569;">${e.note}</td>
    </tr>
  `).join('');
}

// ── Alumni Contact Update Form Handler ──
function initAlumniUpdateForm() {
  const form = document.getElementById('alumni-update-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');

    const name = document.getElementById('updateName').value.trim();
    const email = document.getElementById('updateEmail').value.trim();
    const phone = document.getElementById('updatePhone').value.trim();

    if (!name || !email || !phone) {
      toast('Please fill all required fields.', 'error');
      return;
    }

    btn.disabled = true;
    btn.textContent = '⏳ Submitting Updates...';

    // 1. Fetch current contact updates list
    let updatesList = [];
    try {
      const res = await fetch(`${API_URL}?school_id=${SCHOOL_ID}&key=contact_updates`);
      if (res.ok) {
        const text = await res.text();
        if (text) {
          updatesList = JSON.parse(text) || [];
        }
      }
    } catch (err) {
      console.log("No existing updates found or offline.");
    }

    // 2. Append new record
    updatesList.push({
      id: 'cnt_' + Date.now(),
      name,
      newEmail: email,
      newPhone: phone,
      status: 'pending',
      updatedOn: new Date().toISOString().split('T')[0]
    });

    // 3. Save back to API
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          school_id: SCHOOL_ID,
          key: 'contact_updates',
          value: updatesList
        })
      });

      if (res.ok) {
        toast('✅ Contact details updated successfully. Thank you!', 'success');
        form.reset();
      } else {
        toast('Failed to save updates. Server error.', 'error');
      }
    } catch (err) {
      toast('Network error. Check connection.', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = '💾 Save Updates';
    }
  });
}

// ── Load Verified Live Alumni from Central Database ──
async function loadLiveAlumni() {
  const container = document.getElementById('dynamic-alumni-container');
  if (!container) return;

  try {
    const res = await fetch(`${API_URL}?school_id=${SCHOOL_ID}&key=alumni_registrations`);
    if (res.ok) {
      const text = await res.text();
      if (text) {
        const list = JSON.parse(text) || [];
        // Filter only verified alumni
        const verifiedAlumni = list.filter(a => !!a.verified);

        if (verifiedAlumni.length > 0) {
          container.innerHTML = verifiedAlumni.map((a, idx) => {
            const avatarChar = a.name ? a.name[0] : 'A';
            const colorBg = idx % 2 === 0 ? 'var(--primary)' : 'var(--accent)';
            return `
              <div style="background-color:var(--bg-light); border:1.5px solid var(--border-color); border-radius:8px; padding:20px; display:flex; flex-wrap:wrap; gap:16px; align-items:start;">
                <div style="width:52px; height:52px; border-radius:50%; background:${colorBg}; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:1.4rem; flex-shrink:0;">
                  ${avatarChar}
                </div>
                <div style="flex:1; min-width:240px;">
                  <h4 style="margin-bottom:2px; font-size:1.05rem;">${a.name}</h4>
                  <div style="font-size:0.75rem; color:var(--accent); font-weight:700; text-transform:uppercase; margin-bottom:8px;">
                    ${a.currentStatus || 'Alumni Member'} · Class of ${a.passYear}
                  </div>
                  <p style="font-style:italic; font-size:0.88rem; color:var(--text-muted); line-height:1.6;">
                    "${a.message || 'No message provided.'}"
                  </p>
                </div>
              </div>
            `;
          }).join('');
          return;
        }
      }
    }
  } catch (err) {
    console.log("Offline or error loading alumni.");
  }

  // Fallback prominent alumni if database is empty or offline
  container.innerHTML = `
    <!-- Alumni 1 -->
    <div style="background-color:var(--bg-light); border:1.5px solid var(--border-color); border-radius:8px; padding:20px; display:flex; flex-wrap:wrap; gap:16px; align-items:start;">
      <div style="width:52px; height:52px; border-radius:50%; background:var(--primary); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:1.4rem; flex-shrink:0;">S</div>
      <div style="flex:1; min-width:240px;">
        <h4 style="margin-bottom:2px; font-size:1.05rem;">Sachin</h4>
        <div style="font-size:0.75rem; color:var(--accent); font-weight:700; text-transform:uppercase; margin-bottom:8px;">
          Chief Technology Officer, Dynamic Technosoft · Class of 2018
        </div>
        <p style="font-style:italic; font-size:0.88rem; color:var(--text-muted); line-height:1.6;">
          "Sagarmatha Gurukul was instrumental in my journey to becoming a Chief Technology Officer. The school's focus on critical thinking and computer education provided me with a solid foundation in software development and leadership. I am profoundly grateful."
        </p>
      </div>
    </div>

    <!-- Alumni 2 -->
    <div style="background-color:var(--bg-light); border:1.5px solid var(--border-color); border-radius:8px; padding:20px; display:flex; flex-wrap:wrap; gap:16px; align-items:start;">
      <div style="width:52px; height:52px; border-radius:50%; background:var(--accent); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:1.4rem; flex-shrink:0;">K</div>
      <div style="flex:1; min-width:240px;">
        <h4 style="margin-bottom:2px; font-size:1.05rem;">Dr. Kiran Chaudhary</h4>
        <div style="font-size:0.75rem; color:var(--accent); font-weight:700; text-transform:uppercase; margin-bottom:8px;">
          Medical Resident, T.U. Teaching Hospital · Class of 2016
        </div>
        <p style="font-style:italic; font-size:0.88rem; color:var(--text-muted); line-height:1.6;">
          "The rigorous biology lab check-ins and mock test routines at Gurukul prepared me for the competitive medical exams. Beyond academics, the values of integrity and patience taught in boarding life are crucial in my everyday medical practice."
        </p>
      </div>
    </div>
  `;
}

// ── Load Live Leadership from Central Database ──
async function loadLiveLeadership() {
  const container = document.getElementById('dynamic-leadership-container');
  if (!container) return;

  try {
    const res = await fetch(`${API_URL}?school_id=${SCHOOL_ID}&key=teachers`);
    if (res.ok) {
      const text = await res.text();
      if (text) {
        const teachers = JSON.parse(text) || [];
        
        if (teachers.length > 0) {
          container.innerHTML = teachers.map((t, idx) => {
            const avatarChar = t.name ? t.name[0] : 'T';
            const borderStyle = idx < teachers.length - 1 ? 'border-bottom:1.5px solid var(--border-color); padding-bottom:20px;' : '';
            const bgGrad = idx % 2 === 0 ? 'linear-gradient(135deg, var(--primary), var(--accent))' : 'linear-gradient(135deg, var(--secondary), #F2A900)';
            const color = idx % 2 === 0 ? '#fff' : 'var(--primary-dark)';
            
            // Format designation: use designation if present, otherwise default to Subject Instructor
            const displayRole = t.designation && t.designation.trim() !== '' 
              ? t.designation 
              : `${t.subject || 'Faculty'} Instructor`;
            
            return `
              <div style="display:flex; flex-wrap:wrap; gap:20px; ${borderStyle}">
                <div style="width:120px; height:120px; border-radius:50%; background:${bgGrad}; color:${color}; display:flex; align-items:center; justify-content:center; font-size:3rem; font-weight:700; flex-shrink:0;">
                  ${avatarChar}
                </div>
                <div style="flex:1; min-width:240px;">
                  <h3 style="font-size:1.2rem; margin-bottom:4px;">${t.title || ''} ${t.name}</h3>
                  <h4 style="font-size:0.85rem; color:var(--accent); text-transform:uppercase; margin-bottom:8px; font-weight:700;">${displayRole}</h4>
                  <p style="font-size:0.9rem; color:var(--text-muted); line-height:1.6;">
                    ${t.about || 'No details available.'}
                  </p>
                </div>
              </div>
            `;
          }).join('');
          return;
        }
      }
    }
  } catch (err) {
    console.log("Offline or error loading leadership.");
  }

  // Fallback default leadership if database is empty or offline
  container.innerHTML = `
    <!-- Principal -->
    <div style="display:flex; flex-wrap:wrap; gap:20px; border-bottom:1.5px solid var(--border-color); padding-bottom:20px;">
      <div style="width:120px; height:120px; border-radius:50%; background: linear-gradient(135deg, var(--primary), var(--accent)); color:#fff; display:flex; align-items:center; justify-content:center; font-size:3rem; font-weight:700; flex-shrink:0;">P</div>
      <div style="flex:1; min-width:240px;">
        <h3 style="font-size:1.2rem; margin-bottom:4px;">Mrs. Priya Sharma</h3>
        <h4 style="font-size:0.85rem; color:var(--accent); text-transform:uppercase; margin-bottom:8px; font-weight:700;">Principal</h4>
        <p style="font-size:0.9rem; color:var(--text-muted); line-height:1.6;">
          With over 15 years of academic leadership, Mrs. Sharma oversees the curriculum execution, teacher performance evaluations, and the daily administration operations of Shishu Gyan Nikunja.
        </p>
      </div>
    </div>

    <!-- Chairman -->
    <div style="display:flex; flex-wrap:wrap; gap:20px; padding-bottom:20px;">
      <div style="width:120px; height:120px; border-radius:50%; background: linear-gradient(135deg, var(--secondary), #F2A900); color:var(--primary-dark); display:flex; align-items:center; justify-content:center; font-size:3rem; font-weight:700; flex-shrink:0;">C</div>
      <div style="flex:1; min-width:240px;">
        <h3 style="font-size:1.2rem; margin-bottom:4px;">Mr. Rajesh Chaudhary</h3>
        <h4 style="font-size:0.85rem; color:var(--accent); text-transform:uppercase; margin-bottom:8px; font-weight:700;">Chairman, Board of Directors</h4>
        <p style="font-size:0.9rem; color:var(--text-muted); line-height:1.6;">
          Mr. Chaudhary has steered the strategic expansion and digital integration of the school, setting up high-tech infrastructures such as the Smart Tech and electronics lab models.
        </p>
      </div>
    </div>
  `;
}
