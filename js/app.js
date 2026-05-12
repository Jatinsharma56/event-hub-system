/**
 * =============================================
 * app.js — Core Application Logic
 * Handles: Auth, Navigation, Toast, QR, Routing
 * =============================================
 */

// =============================================
// TOAST NOTIFICATION SYSTEM
// =============================================
const Toast = {
  container: null,
  init() {
    this.container = document.getElementById('toast-container');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      this.container.id = 'toast-container';
      document.body.appendChild(this.container);
    }
  },
  show(message, type = 'info', duration = 4000) {
    if (!this.container) this.init();
    const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span class="toast-icon">${icons[type]}</span><span>${message}</span>`;
    this.container.appendChild(toast);
    requestAnimationFrame(() => { requestAnimationFrame(() => toast.classList.add('show')); });
    setTimeout(() => {
      toast.classList.remove('show');
      toast.classList.add('hide');
      setTimeout(() => toast.remove(), 350);
    }, duration);
  },
  success(msg) { this.show(msg, 'success'); },
  error(msg)   { this.show(msg, 'error'); },
  info(msg)    { this.show(msg, 'info'); },
  warning(msg) { this.show(msg, 'warning'); }
};

// =============================================
// MODAL MANAGER
// =============================================
const Modal = {
  open(id) {
    const el = document.getElementById(id);
    if (el) { el.classList.add('open'); document.body.style.overflow = 'hidden'; }
  },
  close(id) {
    const el = document.getElementById(id);
    if (el) { el.classList.remove('open'); document.body.style.overflow = ''; }
  },
  closeAll() {
    document.querySelectorAll('.modal-overlay.open').forEach(el => {
      el.classList.remove('open');
    });
    document.body.style.overflow = '';
  }
};

// Close modal on overlay click
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) Modal.closeAll();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') Modal.closeAll();
});

// =============================================
// QR CODE GENERATOR
// Uses qrcode.js library
// =============================================
function generateQR(containerId, text, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  new QRCode(container, {
    text: text,
    width:  options.size || 180,
    height: options.size || 180,
    colorDark:  '#000000',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.H
  });
}

// =============================================
// PAGE ROUTER
// Single-page app navigation
// =============================================
const Router = {
  current: null,
  pages: {},

  register(name, renderFn) { this.pages[name] = renderFn; },

  navigate(page, params = {}) {
    // Update URL hash
    window.location.hash = page;
    this.render(page, params);
  },

  render(page, params = {}) {
    const user = Auth.current();

    // Auth guard
    if (!user && page !== 'login' && page !== 'register') {
      this.render('login');
      return;
    }
    if (user && (page === 'login' || page === 'register')) {
      this.render(user.role === 'admin' ? 'admin-dashboard' : 'events');
      return;
    }

    // Admin guard
    if (page.startsWith('admin-') && user && user.role !== 'admin') {
      Toast.error('Admin access required');
      this.render('events');
      return;
    }

    this.current = page;
    const renderFn = this.pages[page];
    if (renderFn) {
      renderFn(params);
      updateNav(page, user);
    } else {
      this.render(user ? (user.role === 'admin' ? 'admin-dashboard' : 'events') : 'login');
    }
  },

  init() {
    const hash = window.location.hash.replace('#', '') || '';
    const user  = Auth.current();
    if (!hash || hash === '') {
      this.render(user ? (user.role === 'admin' ? 'admin-dashboard' : 'events') : 'login');
    } else {
      this.render(hash);
    }
  }
};

// =============================================
// NAV UPDATER
// =============================================
function updateNav(page, user) {
  const nav = document.getElementById('main-nav');
  if (!nav) return;

  if (!user) {
    nav.innerHTML = `
      <div class="nav-brand">⚡ Event<span>Hub</span></div>
      <div></div>
      <div class="nav-user">
        <button class="btn btn-ghost btn-sm" onclick="Router.navigate('login')">Sign In</button>
        <button class="btn btn-primary btn-sm" onclick="Router.navigate('register')">Register</button>
      </div>`;
    return;
  }

  const isAdmin = user.role === 'admin';
  const adminLinks = isAdmin ? `
    <button class="nav-link ${page === 'admin-dashboard' ? 'active' : ''}" onclick="Router.navigate('admin-dashboard')">📊 Dashboard</button>
    <button class="nav-link ${page === 'admin-events' ? 'active' : ''}" onclick="Router.navigate('admin-events')">🗓 Events</button>
    <button class="nav-link ${page === 'admin-registrations' ? 'active' : ''}" onclick="Router.navigate('admin-registrations')">📋 Registrations</button>
    <button class="nav-link ${page === 'scanner' ? 'active' : ''}" onclick="Router.navigate('scanner')">📷 Scanner</button>
  ` : `
    <button class="nav-link ${page === 'events' ? 'active' : ''}" onclick="Router.navigate('events')">🗓 Events</button>
    <button class="nav-link ${page === 'my-events' ? 'active' : ''}" onclick="Router.navigate('my-events')">🎫 My Events</button>
  `;

  // Count unread notifications
  const notifs = Store.getNotifications(user.id);
  const unread  = notifs.filter(n => !n.read).length;

  nav.innerHTML = `
    <div class="nav-brand" style="cursor:pointer" onclick="Router.navigate('${isAdmin ? 'admin-dashboard' : 'events'}')">⚡ Event<span>Hub</span></div>
    <div class="nav-links">${adminLinks}</div>
    <div class="nav-user">
      <button class="nav-link" title="Notifications" onclick="Router.navigate('notifications')" style="position:relative">
        🔔${unread > 0 ? `<span style="position:absolute;top:2px;right:2px;background:var(--red);color:#fff;font-size:9px;font-weight:700;border-radius:50%;width:14px;height:14px;display:flex;align-items:center;justify-content:center">${unread}</span>` : ''}
      </button>
      <span class="user-badge">${isAdmin ? '👑 Admin' : '🎓 Student'}</span>
      <button class="nav-link" onclick="Router.navigate('profile')">👤 ${user.name.split(' ')[0]}</button>
      <button class="btn btn-ghost btn-sm" onclick="logout()">Sign Out</button>
    </div>`;
}

// =============================================
// AUTH ACTIONS
// =============================================
function logout() {
  Auth.logout();
  Toast.info('Signed out successfully');
  Router.navigate('login');
}

// =============================================
// CATEGORY COLOR HELPER
// =============================================
function getCategoryBadgeClass(cat) {
  const map = { 'Tech': 'badge-tech', 'Cultural': 'badge-cultural', 'Sports': 'badge-sports', 'Workshop': 'badge-workshop', 'Seminar': 'badge-seminar', 'Other': 'badge-other' };
  return map[cat] || 'badge-other';
}
function getCategoryClass(cat) {
  return cat.toLowerCase();
}

// =============================================
// SEAT AVAILABILITY
// =============================================
function getSeatInfo(event) {
  const regs  = Store.getRegistrationsByEvent(event.id);
  const taken  = regs.length;
  const limit  = event.seatLimit;
  const pct    = Math.min((taken / limit) * 100, 100);
  const avail  = limit - taken;
  return { taken, limit, pct, avail };
}

// =============================================
// EVENT CARD RENDERER
// =============================================
function renderEventCard(event, isAdmin = false, showRegister = true) {
  const { taken, limit, pct, avail } = getSeatInfo(event);
  const past     = isPast(event.date);
  const fillClass = pct >= 100 ? 'full' : pct >= 80 ? 'warn' : '';
  const dateStr  = formatDate(event.date);
  const timeStr  = formatTime(event.time);
  const catClass = getCategoryBadgeClass(event.category);
  const user     = Auth.current();

  let alreadyReg = false;
  if (user && !isAdmin) {
    alreadyReg = !!Store.findRegistration(user.id, event.id);
  }

  const actionBtn = isAdmin
    ? `<div style="display:flex;gap:0.5rem">
        <button class="btn btn-secondary btn-sm" onclick="editEvent('${event.id}')">✏️ Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteEvent('${event.id}')">🗑</button>
       </div>`
    : alreadyReg
      ? `<button class="btn btn-success btn-sm" onclick="viewMyRegistration('${event.id}')">✅ Registered</button>`
      : (!event.registrationOpen || avail <= 0 || past)
        ? `<button class="btn btn-ghost btn-sm" disabled>${avail <= 0 ? '🚫 Full' : past ? '⏰ Ended' : '🔒 Closed'}</button>`
        : `<button class="btn btn-primary btn-sm" onclick="openRegisterModal('${event.id}')">Register Now →</button>`;

  return `
    <div class="event-card fade-in" onclick="viewEvent('${event.id}')">
      <div class="event-card-banner" style="${event.coverPhoto ? `background-image:url('${event.coverPhoto}');background-size:cover;background-position:center;background-repeat:no-repeat;` : `background:${event.bannerColor || 'var(--bg-elevated)'};`}">
        ${event.coverPhoto ? '' : `<span class="event-emoji">${event.emoji || '📅'}</span>`}
        ${event.clubLogo ? `<img src="${event.clubLogo}" class="club-logo-overlay" alt="Logo">` : ''}
        <span class="event-card-badge ${catClass}">${event.category}</span>
        ${past ? '<span class="event-card-badge" style="left:0.75rem;right:auto;background:rgba(0,0,0,0.6);color:#aaa">Completed</span>' : ''}
      </div>
      <div class="event-card-body">
        <div class="event-card-title">${event.name}</div>
        ${event.club ? `<div class="text-xs text-accent" style="margin-top:-0.2rem;margin-bottom:0.4rem;font-weight:600;opacity:0.8">By ${event.club}</div>` : ''}
        <div class="event-meta">
          <div class="event-meta-item"><span class="icon">📅</span>${dateStr}</div>
          <div class="event-meta-item"><span class="icon">🕐</span>${timeStr}</div>
          <div class="event-meta-item"><span class="icon">📍</span>${event.location}</div>
        </div>
        <div class="event-card-footer" onclick="event.stopPropagation()">
          <div class="seat-info" style="display:flex;flex-direction:column;gap:4px">
            <div style="font-weight:600;color:var(--text)">Total Registered: ${taken}</div>
            <div style="font-size:0.75rem">${avail} / ${limit} seats left</div>
            <div class="seat-bar"><div class="seat-fill ${fillClass}" style="width:${pct}%"></div></div>
          </div>
          ${actionBtn}
        </div>
      </div>
    </div>`;
}

// =============================================
// EVENT DETAIL MODAL OPENER
// =============================================
function viewEvent(eventId) {
  const event = Store.getEvent(eventId);
  if (!event) return;
  const user = Auth.current();
  const { taken, limit, avail } = getSeatInfo(event);
  const past = isPast(event.date);
  const alreadyReg = user && Store.findRegistration(user.id, eventId);

  // Countdown
  let countdownHtml = '';
  const timeLeft = timeUntil(event.date, event.time);
  if (timeLeft) {
    countdownHtml = `
      <div style="margin:1rem 0">
        <div class="text-xs text-muted mb-1">Event starts in</div>
        <div class="countdown">
          <div class="countdown-unit"><span class="countdown-num">${String(timeLeft.days).padStart(2,'0')}</span><div class="countdown-label">Days</div></div>
          <div class="countdown-sep">:</div>
          <div class="countdown-unit"><span class="countdown-num">${String(timeLeft.hours).padStart(2,'0')}</span><div class="countdown-label">Hours</div></div>
          <div class="countdown-sep">:</div>
          <div class="countdown-unit"><span class="countdown-num">${String(timeLeft.minutes).padStart(2,'0')}</span><div class="countdown-label">Mins</div></div>
          <div class="countdown-sep">:</div>
          <div class="countdown-unit"><span class="countdown-num" id="event-sec">${String(timeLeft.seconds).padStart(2,'0')}</span><div class="countdown-label">Secs</div></div>
        </div>
      </div>`;
  }

  // Feedbacks
  const feedbacks = Store.getFeedbacksByEvent(eventId);
  const avgRating = feedbacks.length ? (feedbacks.reduce((s,f) => s + f.rating, 0) / feedbacks.length).toFixed(1) : null;
  const feedbackHtml = feedbacks.slice(0, 3).map(f => `
    <div style="padding:0.75rem;background:var(--bg-elevated);border-radius:var(--radius-sm);margin-bottom:0.5rem">
      <div style="display:flex;gap:0.25rem;margin-bottom:0.3rem">${'⭐'.repeat(f.rating)}${'☆'.repeat(5 - f.rating)}</div>
      <p class="text-sm">${f.comment || 'No comment'}</p>
      <div class="text-xs text-muted mt-1">${f.userName}</div>
    </div>`).join('');

  document.getElementById('event-detail-content').innerHTML = `
    <div style="${event.coverPhoto ? `background-image:url('${event.coverPhoto}');background-size:cover;background-position:center;background-repeat:no-repeat;` : `background:${event.bannerColor||'var(--bg-elevated)'};`}border-radius:var(--radius-md);padding:2.5rem;text-align:center;margin-bottom:1.5rem;min-height:220px;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;overflow:hidden">
      ${event.clubLogo ? `<img src="${event.clubLogo}" style="width:60px;height:60px;object-fit:contain;margin-bottom:1rem;background:#fff;padding:5px;border-radius:50%;box-shadow:var(--shadow-md);position:relative;z-index:2">` : ''}
      ${(event.coverPhoto || event.clubLogo) ? '' : `<div style="font-size:4rem;margin-bottom:0.5rem">${event.emoji||'📅'}</div>`}
      <h2 style="font-size:1.5rem;background:rgba(0,0,0,0.6);padding:0.5rem 1.25rem;border-radius:var(--radius-sm);color:#fff;margin-bottom:0.5rem;position:relative;z-index:2">${event.name}</h2>
      ${event.club ? `<div style="color:var(--accent);font-weight:700;letter-spacing:0.05em;text-transform:uppercase;font-size:0.75rem;background:rgba(0,0,0,0.5);padding:0.25rem 0.75rem;border-radius:20px;margin-bottom:0.5rem;position:relative;z-index:2">Presented by ${event.club}</div>` : ''}
      <span class="badge ${getCategoryBadgeClass(event.category)}" style="position:relative;z-index:2">${event.category}</span>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-bottom:1.5rem">
      <div class="card" style="padding:1rem"><div class="text-xs text-muted">📅 Date</div><div style="font-weight:600;margin-top:0.25rem">${formatDate(event.date)}</div></div>
      <div class="card" style="padding:1rem"><div class="text-xs text-muted">🕐 Time</div><div style="font-weight:600;margin-top:0.25rem">${formatTime(event.time)}</div></div>
      <div class="card" style="padding:1rem"><div class="text-xs text-muted">📍 Location</div><div style="font-weight:600;margin-top:0.25rem">${event.location}</div></div>
      <div class="card" style="padding:1rem"><div class="text-xs text-muted">🪑 Seats</div><div style="font-weight:600;margin-top:0.25rem">${avail} of ${limit} left</div></div>
    </div>
    <p style="margin-bottom:1.5rem;color:var(--text-secondary)">${event.description}</p>
    ${countdownHtml}
    <div class="divider"></div>
    <div style="display:flex;gap:0.75rem;flex-wrap:wrap;margin-bottom:1.5rem">
      ${alreadyReg
        ? `<button class="btn btn-success" onclick="viewMyRegistration('${eventId}');Modal.close('event-detail-modal')">✅ View My Registration</button>`
        : (!event.registrationOpen || avail <= 0 || past)
          ? `<button class="btn btn-ghost" disabled>${avail <= 0 ? '🚫 Event Full' : past ? '⏰ Event Ended' : '🔒 Registration Closed'}</button>`
          : `<button class="btn btn-primary" onclick="openRegisterModal('${eventId}');Modal.close('event-detail-modal')">Register Now →</button>`}
      ${past && alreadyReg ? `<button class="btn btn-secondary" onclick="openFeedbackModal('${eventId}');Modal.close('event-detail-modal')">⭐ Leave Feedback</button>` : ''}
    </div>
    ${avgRating ? `<div class="text-sm text-muted mb-1">Average Rating: <strong style="color:var(--accent)">⭐ ${avgRating}</strong> (${feedbacks.length} reviews)</div>` : ''}
    ${feedbackHtml}
  `;
  Modal.open('event-detail-modal');

  // Live countdown tick
  if (timeLeft) {
    clearInterval(window._countdownInterval);
    window._countdownInterval = setInterval(() => {
      const t = timeUntil(event.date, event.time);
      const el = document.getElementById('event-sec');
      if (el && t) el.textContent = String(t.seconds).padStart(2, '0');
    }, 1000);
  }
}

// =============================================
// REGISTRATION FLOW
// =============================================
function openRegisterModal(eventId) {
  const event = Store.getEvent(eventId);
  if (!event) return;
  const user  = Auth.current();

  document.getElementById('reg-event-name').textContent = event.name;
  document.getElementById('reg-event-id').value = eventId;
  document.getElementById('reg-name').value = user ? user.name : '';
  document.getElementById('reg-email-val').value = user ? user.email : '';
  document.getElementById('reg-department').value = user ? (user.department || '') : '';

  // Pre-select category
  document.querySelectorAll('.radio-option').forEach(opt => {
    opt.classList.remove('selected');
    if (user && opt.dataset.value === user.category) opt.classList.add('selected');
  });
  document.getElementById('reg-category').value = user ? (user.category || '') : '';

  Modal.open('register-modal');
}

function viewMyRegistration(eventId) {
  const user = Auth.current();
  if (!user) return;
  const reg   = Store.findRegistration(user.id, eventId);
  const event = Store.getEvent(eventId);
  if (!reg || !event) return;

  document.getElementById('my-reg-content').innerHTML = `
    <div style="text-align:center;margin-bottom:1.5rem">
      <div style="font-size:2.5rem;margin-bottom:0.5rem">${event.emoji || '📅'}</div>
      <h3>${event.name}</h3>
      <span class="badge ${getCategoryBadgeClass(event.category)}">${event.category}</span>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-bottom:1.5rem">
      <div class="card" style="padding:1rem"><div class="text-xs text-muted">Student</div><div style="font-weight:600">${reg.userName}</div></div>
      <div class="card" style="padding:1rem"><div class="text-xs text-muted">Department</div><div style="font-weight:600">${reg.department}</div></div>
      <div class="card" style="padding:1rem"><div class="text-xs text-muted">Email</div><div style="font-weight:600">${reg.email || '—'}</div></div>
      <div class="card" style="padding:1rem"><div class="text-xs text-muted">Category</div><div style="font-weight:600">${reg.category}</div></div>
      <div class="card" style="padding:1rem"><div class="text-xs text-muted">Attendance</div><div style="font-weight:600">${reg.attended ? '✅ Present' : '⏳ Pending'}</div></div>
    </div>
    <div class="qr-container">
      <div class="text-sm text-muted mb-1">Your Entry QR Code</div>
      <div class="qr-wrapper"><div id="my-reg-qr"></div></div>
      <div class="qr-info">
        <div class="qr-id">${reg.id}</div>
        <div class="text-xs text-muted mt-1">Show this at the venue for entry</div>
      </div>
      <button class="btn btn-secondary btn-sm" onclick="downloadQR('${reg.id}', '${event.name}')">⬇️ Download QR</button>
    </div>`;
  Modal.open('my-reg-modal');
  setTimeout(() => generateQR('my-reg-qr', JSON.stringify({ regId: reg.id, eventId, userId: user.id, name: reg.userName })), 100);
}

// =============================================
// CERTIFICATE GENERATOR
// Uses jsPDF (loaded in HTML)
// =============================================
function generateCertificate(regId) {
  const reg   = Store.findRegistrationById(regId);
  if (!reg) return;
  const event = Store.getEvent(reg.eventId);
  if (!event) return;

  // Build a printable certificate page
  const certWindow = window.open('', '_blank', 'width=900,height=640');
  certWindow.document.write(`
    <!DOCTYPE html><html><head><title>Certificate</title>
    <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet">
    <style>
      body { margin:0; background:#0a0c10; display:flex; align-items:center; justify-content:center; min-height:100vh; font-family:'DM Sans',sans-serif; }
      .cert { width:800px; padding:60px; background:linear-gradient(135deg,#1a1400,#0d0f14,#001a0d); border:3px solid #f0a500; border-radius:16px; position:relative; text-align:center; color:#f0f2f8; }
      .cert::before { content:''; position:absolute; inset:12px; border:1px solid rgba(240,165,0,0.2); border-radius:10px; pointer-events:none; }
      .cert-org { font-size:11px; letter-spacing:0.25em; text-transform:uppercase; color:#f0a500; margin-bottom:1.5rem; }
      h1 { font-family:'Syne',sans-serif; font-size:3rem; font-weight:800; margin-bottom:0.25rem; }
      .sub { font-size:11px; letter-spacing:0.15em; text-transform:uppercase; color:#8891a8; margin-bottom:2rem; }
      .presented { font-size:0.875rem; color:#8891a8; margin-bottom:0.5rem; }
      .student-name { font-family:'Syne',sans-serif; font-size:3rem; color:#f0a500; font-weight:800; margin:0.25rem 0; }
      .event-name { font-size:1.1rem; color:#8891a8; margin-bottom:2rem; }
      .line { width:80px; height:2px; background:#f0a500; margin:1.5rem auto; }
      .footer { display:flex; justify-content:space-between; font-size:11px; color:#4a5168; }
      .cert-id { font-family:monospace; font-size:11px; color:#4a5168; }
      @media print { body { background:#fff; } .cert { background:white; color:#000; border-color:#c8a000; } }
    </style></head><body>
    <div class="cert">
      <div class="cert-org">⚡ EventHub — Smart Event Management System</div>
      <h1>Certificate</h1>
      <div class="sub">of Participation</div>
      <div class="presented">This is to proudly certify that</div>
      <div class="student-name">${reg.userName}</div>
      <div class="event-name">participated in <strong>${event.name}</strong></div>
      <div style="font-size:0.85rem;color:#8891a8">Held on ${formatDate(event.date)} at ${event.location}</div>
      <div class="line"></div>
      <div class="footer">
        <div>Department: ${reg.department} · Category: ${reg.category}</div>
        <div class="cert-id">ID: ${reg.id.toUpperCase()}</div>
        <div>Date: ${new Date().toLocaleDateString('en-IN')}</div>
      </div>
    </div>
    <script>window.onload = () => window.print()<\/script>
    </body></html>`);
  certWindow.document.close();
}

// =============================================
// QR DOWNLOAD
// =============================================
function downloadQR(regId, eventName) {
  const canvas = document.querySelector('#my-reg-qr canvas');
  if (!canvas) { Toast.error('QR not ready yet'); return; }
  const link = document.createElement('a');
  link.download = `QR_${eventName.replace(/\s+/g,'_')}_${regId}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
  Toast.success('QR Code downloaded!');
}

// =============================================
// FEEDBACK MODAL
// =============================================
let currentRating = 0;
function openFeedbackModal(eventId) {
  const event = Store.getEvent(eventId);
  if (!event) return;
  currentRating = 0;
  document.getElementById('fb-event-name').textContent = event.name;
  document.getElementById('fb-event-id').value = eventId;
  document.querySelectorAll('.star').forEach(s => s.classList.remove('filled'));
  document.getElementById('fb-comment').value = '';
  Modal.open('feedback-modal');
}

// Star rating interaction
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.star').forEach(star => {
    star.addEventListener('click', () => {
      currentRating = parseInt(star.dataset.rating);
      document.querySelectorAll('.star').forEach(s => {
        s.classList.toggle('filled', parseInt(s.dataset.rating) <= currentRating);
      });
    });
  });
});

function submitFeedback() {
  const eventId = document.getElementById('fb-event-id').value;
  const comment = document.getElementById('fb-comment').value.trim();
  const user    = Auth.current();
  if (!currentRating) { Toast.warning('Please select a rating'); return; }
  Store.addFeedback({ id: genId('fb'), eventId, userId: user.id, userName: user.name, rating: currentRating, comment, createdAt: Date.now() });
  Toast.success('Feedback submitted! Thank you 🙏');
  Modal.close('feedback-modal');
}

// =============================================
// NOTIFICATION HELPER
// =============================================
function notifyAllUsers(title, message, type = 'info') {
  // In real app: push to all users. In demo: just store for current user.
  const users = Store.getUsers();
  users.filter(u => u.role !== 'admin').forEach(u => {
    Store.addNotification(u.id, { id: genId('notif'), title, message, type, read: false, createdAt: Date.now() });
  });
}

// =============================================
// UTILITY FUNCTIONS
// =============================================
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
  return new Date(dateStr).toLocaleDateString('en-IN', options);
}

function formatTime(timeStr) {
  if (!timeStr) return '—';
  const [h, m] = timeStr.split(':');
  const date = new Date();
  date.setHours(h, m);
  return date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function isPast(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr).getTime() < new Date().setHours(0,0,0,0);
}

function timeUntil(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  const target = new Date(`${dateStr}T${timeStr}`);
  const now = new Date();
  const diff = target - now;
  if (diff <= 0) return null;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds };
}

function genId(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).substr(2, 9)}`;
}


