/**
 * =============================================
 * app.js — Core Application Logic
 * Handles: Auth, Navigation, Toast, QR, Routing
 * =============================================
 */

// =============================================
// TOAST NOTIFICATION SYSTEM
// =============================================
window.Toast = {
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
window.Modal = {
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
window.Router = {
  current: null,
  pages: {},
  _rendering: false, // Guard against recursive render calls

  register(name, renderFn) { this.pages[name] = renderFn; },

  navigate(page, params = {}) {
    // Update URL hash
    window.location.hash = page;
    this.render(page, params);
  },

  render(page, params = {}) {
    // Guard: prevent recursive render calls (stack overflow protection)
    if (this._rendering) {
      console.warn('Router.render called recursively for page:', page, '— skipping');
      return;
    }
    this._rendering = true;
    try {
      this._doRender(page, params);
    } finally {
      this._rendering = false;
    }
  },

  _doRender(page, params = {}) {
    const user = Auth.current();

    // Public pages: guests can view events without logging in
    const publicPages = ['landing', 'login', 'register', 'events', 'trending', 'saved-events'];

    // Auth guard — only redirect to login for protected pages
    if (!user && !publicPages.includes(page)) {
      Toast.warning('Please sign in to access that page');
      page = 'login';
    }

    // Admin guard
    if (page.startsWith('admin-') && user && user.role !== 'admin') {
      Toast.error('Admin access required');
      page = 'events';
    }

    this.current = page;
    const renderFn = this.pages[page];
    if (renderFn) {
      renderFn(params);
      updateNav(page, user);
    } else {
      // Fallback: go to a known-good page
      const fallback = user ? (user.role === 'admin' ? 'admin-dashboard' : 'events') : 'events';
      if (fallback !== page) {
        this._doRender(fallback, {});
      }
    }
  },

  init() {
    const hash = window.location.hash.replace('#', '') || '';
    if (!hash || hash === '') {
      this.render('landing');
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

  // For the landing page, we want a very minimal or transparent header
  const isLanding = page === 'landing';
  if (isLanding) {
    nav.classList.add('nav-transparent');
  } else {
    nav.classList.remove('nav-transparent');
  }

  if (!user) {
    nav.innerHTML = `
      <div class="nav-brand" style="cursor:pointer" onclick="Router.navigate('landing')">⚡ Event<span>Hub</span></div>
      <div class="nav-links">
        ${isLanding ? '' : `<button class="nav-link ${page === 'events' ? 'active' : ''}" onclick="Router.navigate('events')">🗓 Events Gallery</button>`}
      </div>
      <div class="nav-user">
        <button class="btn btn-primary btn-sm" onclick="Router.navigate('login')">🔐 Admin Portal</button>
      </div>`;
    return;
  }

  // When logged in, the sidebar handles navigation. Top bar is for user profile and notifications.
  const isAdmin = user.role === 'admin';
  
  // Count unread notifications
  const notifs = Store.getNotifications(user.id);
  const unread  = notifs.filter(n => !n.read).length;

  nav.innerHTML = `
    <div class="nav-brand" style="cursor:pointer" onclick="Router.navigate('landing')">⚡ Event<span>Hub</span></div>
    <div class="nav-links">
      <!-- Links removed for cleaner UI, handled by Sidebar -->
    </div>
    <div class="nav-user">
      <button class="nav-link" title="Notifications" onclick="Router.navigate('notifications')" style="position:relative; background:rgba(255,255,255,0.03); width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center">
        🔔${unread > 0 ? `<span style="position:absolute;top:0;right:0;background:var(--red);color:#fff;font-size:9px;font-weight:700;border-radius:50%;width:16px;height:16px;display:flex;align-items:center;justify-content:center;border:2px solid var(--bg)">${unread}</span>` : ''}
      </button>
      <div style="display:flex;align-items:center;gap:0.75rem;background:rgba(255,255,255,0.05);padding:0.4rem 1rem;border-radius:30px;border:1px solid var(--border); transition: var(--transition); cursor:pointer" onclick="Router.navigate('profile')">
         <div style="width:24px;height:24px;background:var(--accent-gradient);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.7rem;color:#000;font-weight:800">
           ${user.name.charAt(0)}
         </div>
         <span style="font-size:0.85rem;font-weight:700;color:#fff">${user.name.split(' ')[0]}</span>
      </div>
      <button class="btn btn-ghost btn-sm" onclick="logout()" style="opacity:0.6; font-size:0.75rem">Sign Out</button>
    </div>`;
}

// =============================================
// AUTH ACTIONS
// =============================================
function logout() {
  Auth.logout();
  Toast.info('Signed out successfully');
  Router.navigate('events'); // Guests go to events
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
function renderEventCard(event, isAdmin = false) {
  const catClass = `cat-${event.category?.toLowerCase() || 'other'}`;
  const taken    = Store.getRegistrationsByEvent(event.id).length;
  const limit    = event.seatLimit || 100;
  const pct      = Math.min(100, (taken / limit) * 100);
  const avail    = limit - taken;
  
  // Status & Deadline Logic
  const now = new Date();
  const eventDate = new Date(event.date);
  const deadlineDate = event.deadline ? new Date(event.deadline) : null;
  
  let status = event.statusOverride || 'Auto';
  if (status === 'Auto') {
    const today = new Date(); today.setHours(0,0,0,0);
    const eventDay = new Date(eventDate); eventDay.setHours(0,0,0,0);
    if (eventDay.getTime() === today.getTime()) status = 'Ongoing';
    else if (eventDay < today) status = 'Past';
    else status = 'Upcoming';
  }
  
  const isPastStatus = status === 'Past';
  const isOngoing    = status === 'Ongoing';
  const deadlinePassed = deadlineDate && new Date() > deadlineDate.setHours(23, 59, 59, 999);
  const dateStr  = formatDate(event.date);

  const defaultCover = 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=1200';
  const defaultLogo  = '/assets/vibin-z-logo.png';
  
  const coverImg = event.coverPhoto || defaultCover;
  const logoImg  = event.clubLogo || defaultLogo;
  const user     = Auth.current();

  let alreadyReg = false;
  if (user && !isAdmin) {
    alreadyReg = !!Store.findRegistration(user.id, event.id);
  }

  let actionBtn = '';
  if (isAdmin) {
    actionBtn = `
      <div style="display:flex;flex-direction:column;gap:0.75rem">
        <button class="btn ${event.registrationOpen ? 'btn-secondary' : 'btn-primary'}" style="width:100%;font-size:0.8rem;padding:0.75rem" onclick="toggleRegistration('${event.id}', ${!event.registrationOpen})">
          ${event.registrationOpen ? '🛑 Stop Registration' : '🚀 Start Registration'}
        </button>
        <div style="display:flex;gap:0.75rem">
          <button class="btn btn-primary btn-sm" style="flex:1" onclick="editEvent('${event.id}')">Edit</button>
          <button class="btn btn-secondary btn-sm" style="flex:1;background:rgba(239,68,68,0.1);color:#ef4444;border-color:rgba(239,68,68,0.2)" onclick="deleteEvent('${event.id}')">Delete</button>
        </div>
      </div>`;
  } else if (isPastStatus) {
    actionBtn = `<button class="btn btn-secondary" disabled style="width:100%;opacity:0.3">Closed</button>`;
  } else if (alreadyReg) {
    actionBtn = `<button class="btn btn-primary" style="background:#22c55e;color:#fff;width:100%" onclick="viewMyRegistration('${event.id}')">✓ Registered</button>`;
  } else if (!event.registrationOpen || avail <= 0 || deadlinePassed) {
    let reason = 'Closed';
    if (avail <= 0) reason = 'Event Full';
    else if (deadlinePassed) reason = 'Deadline Passed';
    actionBtn = `<button class="btn btn-secondary" disabled style="width:100%">${reason}</button>`;
  } else {
    actionBtn = `<button class="btn btn-primary" style="width:100%" onclick="openRegisterModal('${event.id}')">Join Event →</button>`;
  }

  // Badges
  const pinnedBadge = event.isPinned ? `
    <div style="position:absolute;top:1.25rem;right:1.25rem;z-index:10;background:var(--accent);color:#000;padding:0.4rem 0.8rem;border-radius:20px;font-size:0.65rem;font-weight:900;display:flex;align-items:center;gap:0.4rem;box-shadow:0 10px 20px rgba(0,0,0,0.3)">
      <span>⭐</span> FEATURED
    </div>` : '';

  const ongoingBadge = isOngoing ? `
    <div style="position:absolute;bottom:1.25rem;right:1.25rem;z-index:10;background:#ef4444;color:#fff;padding:0.4rem 0.8rem;border-radius:20px;font-size:0.65rem;font-weight:900;display:flex;align-items:center;gap:0.4rem;box-shadow:0 10px 20px rgba(0,0,0,0.3)">
      <span class="pulse-dot"></span> LIVE NOW
    </div>` : '';

  return `
    <div class="event-card fade-in" style="${isPastStatus ? 'filter:grayscale(1);opacity:0.6' : ''}">
      <div class="event-card-banner" style="background-image:linear-gradient(to right, transparent 40%, rgba(10,10,10,0.55) 100%), url('${coverImg}');background-size:cover;background-position:center top;">
        ${pinnedBadge}
        ${ongoingBadge}
        ${!isAdmin ? `
        <button class="bookmark-btn ${Bookmarks.isBookmarked(event.id) ? 'saved' : ''}"
          title="${Bookmarks.isBookmarked(event.id) ? 'Remove from Saved' : 'Save Event'}"
          onclick="event.stopPropagation(); toggleBookmark('${event.id}', this)"
          id="bookmark-${event.id}">
          ${Bookmarks.isBookmarked(event.id) ? '❤️' : '🤍'}
        </button>` : ''}
        <div style="position:absolute;top:1.25rem;left:1.25rem;display:flex;align-items:center;gap:1rem;z-index:10">
          <div style="width:52px;height:52px;background:#fff;border:2px solid var(--accent);border-radius:18px;display:flex;align-items:center;justify-content:center;overflow:hidden;box-shadow:0 15px 30px rgba(0,0,0,0.5);transform:rotate(-2deg)">
            <img src="${logoImg}" style="width:85%;height:85%;object-fit:contain">
          </div>
          <div style="background:rgba(0,0,0,0.7);backdrop-filter:blur(12px);padding:0.5rem 1rem;border-radius:10px;border:1px solid var(--border-bright)">
            <div style="font-size:0.6rem;font-weight:800;color:var(--accent);letter-spacing:0.1em;margin-bottom:0.1rem">OFFICIAL</div>
            <div style="font-size:0.75rem;font-weight:700;color:#fff">${event.category}</div>
          </div>
        </div>
        <div class="event-card-details">
          <div style="font-size:1.5rem;margin-bottom:1rem">${event.emoji || '📅'}</div>
          <div style="font-size:0.65rem;font-weight:800;color:var(--accent);letter-spacing:0.2em;text-transform:uppercase">Premium Event</div>
        </div>
      </div>
      <div class="event-card-body">
        <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:1rem">
          <img src="${logoImg}" style="width:24px;height:24px;border-radius:50%;object-fit:cover;border:1px solid var(--border-bright)">
          <div style="font-size:0.75rem;font-weight:800;color:var(--accent);text-transform:uppercase;letter-spacing:0.2em">${event.club || 'VIBIN.Z'}</div>
        </div>
        <div class="event-card-title">${event.name}</div>
        <p style="color:var(--text-secondary);margin-bottom:2rem;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${event.description || 'Join us for a world-class experience.'}</p>
        <div style="display:flex;flex-direction:column;gap:1rem;margin-bottom:2rem;padding:1.5rem;background:rgba(255,255,255,0.02);border-radius:16px;border:1px solid rgba(255,255,255,0.05)">
          <div style="display:flex;align-items:center;gap:1rem">
            <div style="font-size:0.65rem;font-weight:800;color:var(--text-muted);width:80px">DATE</div>
            <div style="font-weight:700;font-size:1.05rem">📅 ${dateStr}</div>
          </div>
          <div style="display:flex;align-items:center;gap:1rem">
            <div style="font-size:0.65rem;font-weight:800;color:var(--text-muted);width:80px">LOCATION</div>
            <div style="font-weight:700;font-size:1.05rem;line-height:1.4">📍 ${event.location}</div>
          </div>
        </div>
        <div style="margin-top:auto">
          <div style="display:flex;justify-content:space-between;font-size:0.8rem;font-weight:700;margin-bottom:0.75rem">
             <span style="color:var(--text-secondary);letter-spacing:0.05em">REGISTRATION PROGRESS</span>
             <span style="color:var(--accent)">${taken} / ${limit}</span>
          </div>
          <div class="seat-bar" style="height:8px;margin-bottom:2.5rem;background:rgba(255,255,255,0.05);border-radius:10px;overflow:hidden">
            <div class="seat-fill" style="width:${pct}%;height:100%;background:var(--accent-gradient);border-radius:10px"></div>
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
  const user = Auth.current();

  document.getElementById('reg-event-name').textContent = event.name;
  document.getElementById('reg-event-id').value = eventId;
  
  if (user) {
    // Show Quick Section
    document.getElementById('quick-reg-section').classList.remove('hidden');
    document.getElementById('manual-reg-section').classList.add('hidden');
    
    document.getElementById('quick-reg-name').textContent = user.name;
    document.getElementById('quick-reg-dept').textContent = user.department || 'Not Set';
    
    // Check if profile is complete (needs roll number)
    if (!user.roll && !user.rollNumber) {
      document.getElementById('quick-reg-dept').innerHTML = `<span style="color:var(--red)">Incomplete Profile (Missing Roll No)</span>`;
    }

    // Pre-fill manual form in background
    document.getElementById('reg-name').value = user.name;
    document.getElementById('reg-email-val').value = user.email;
    document.getElementById('reg-roll').value = user.roll || user.rollNumber || '';
    document.getElementById('reg-department').value = user.department || '';
    document.getElementById('reg-category').value = user.category || '';
    
    // Pre-select category in manual form
    if (user.category) {
      const catVal = user.category;
      document.querySelectorAll('#manual-reg-section .radio-option').forEach(opt => {
        opt.classList.toggle('selected', opt.onclick.toString().includes(catVal));
      });
    }
  } else {
    // Guest view: Show Manual Form
    document.getElementById('quick-reg-section').classList.add('hidden');
    document.getElementById('manual-reg-section').classList.remove('hidden');
    
    document.getElementById('reg-name').value = '';
    document.getElementById('reg-email-val').value = '';
    document.getElementById('reg-roll').value = '';
    document.getElementById('reg-department').value = '';
    document.getElementById('reg-category').value = '';
    document.querySelectorAll('#manual-reg-section .radio-option').forEach(opt => opt.classList.remove('selected'));
  }

  Modal.open('register-modal');
}

function toggleManualReg(show) {
  const quick = document.getElementById('quick-reg-section');
  const manual = document.getElementById('manual-reg-section');
  if (show) {
    quick.classList.add('hidden');
    manual.classList.remove('hidden');
  } else {
    quick.classList.remove('hidden');
    manual.classList.add('hidden');
  }
}

function viewMyRegistration(eventId) {
  const user = Auth.current();
  if (!user) return;
  const reg   = Store.findRegistration(user.id, eventId);
  const event = Store.getEvent(eventId);
  if (!reg || !event) return;

  const regId = reg.id || reg._id;

  document.getElementById('my-reg-content').innerHTML = `
    <div style="text-align:center;margin-bottom:2rem;padding-top:1rem">
      <div style="font-size:3.5rem;margin-bottom:1rem;filter:drop-shadow(0 0 20px rgba(255,255,255,0.1))">${event.emoji || '🎭'}</div>
      <h3 style="font-family:'Outfit';font-size:1.75rem;font-weight:800;color:#fff;margin-bottom:0.5rem;letter-spacing:-0.02em">${event.name}</h3>
      <div style="display:inline-block;background:rgba(167,139,250,0.1);color:#a78bfa;padding:0.4rem 1rem;border-radius:30px;font-size:0.7rem;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;border:1px solid rgba(167,139,250,0.2)">
        ${event.category}
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin-bottom:2.5rem;padding:0 1rem">
      <div>
        <div style="font-size:0.75rem;font-weight:700;color:var(--text-muted);margin-bottom:0.25rem;text-transform:uppercase;letter-spacing:0.05em">Student</div>
        <div style="font-weight:700;font-size:1.1rem;color:#fff">${reg.userName}</div>
      </div>
      <div>
        <div style="font-size:0.75rem;font-weight:700;color:var(--text-muted);margin-bottom:0.25rem;text-transform:uppercase;letter-spacing:0.05em">Roll No.</div>
        <div style="font-weight:700;font-size:1.1rem;color:#fff">${reg.roll || '—'}</div>
      </div>
      <div>
        <div style="font-size:0.75rem;font-weight:700;color:var(--text-muted);margin-bottom:0.25rem;text-transform:uppercase;letter-spacing:0.05em">Department</div>
        <div style="font-weight:700;font-size:1.1rem;color:#fff">${reg.department}</div>
      </div>
      <div>
        <div style="font-size:0.75rem;font-weight:700;color:var(--text-muted);margin-bottom:0.25rem;text-transform:uppercase;letter-spacing:0.05em">Category</div>
        <div style="font-weight:700;font-size:1.1rem;color:#fff">${reg.category}</div>
      </div>
    </div>

    <div class="qr-container" style="background:transparent;border:none;padding:0">
      <div style="font-size:0.75rem;font-weight:700;color:var(--text-muted);margin-bottom:1rem;text-transform:uppercase;letter-spacing:0.1em">Your Entry QR Code</div>
      <div class="qr-wrapper" style="background:#fff;padding:1.5rem;border-radius:24px;display:inline-block;box-shadow:0 20px 50px rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.1)">
        <div id="my-reg-qr"></div>
      </div>
      <div style="margin-top:1.5rem;text-align:center">
        <div style="font-family:monospace;font-size:0.9rem;color:rgba(255,255,255,0.6);letter-spacing:0.1em;background:rgba(255,255,255,0.03);padding:0.5rem 1rem;border-radius:8px;display:inline-block">${regId}</div>
        <div style="font-size:0.8rem;color:var(--text-muted);margin-top:0.75rem">Show this at the venue for entry</div>
      </div>
      <div style="margin-top:2rem;display:flex;gap:0.75rem">
        <button class="btn btn-primary" style="flex:1;padding:1rem" onclick="downloadQR('${regId}', '${event.name}')">⬇️ Download Ticket</button>
        ${reg.attended ? `<button class="btn btn-secondary" style="flex:1;padding:1rem;background:var(--accent-gradient);color:#000;border:none;font-weight:800" onclick="generateCertificate('${reg.id}')">📜 Certificate</button>` : ''}
      </div>
    </div>`;
  Modal.open('my-reg-modal');
  setTimeout(() => generateQR('my-reg-qr', JSON.stringify({ regId, eventId, userId: user.id, name: reg.userName, roll: reg.roll })), 100);
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
  const today = new Date(); today.setHours(0,0,0,0);
  const d = new Date(dateStr); d.setHours(0,0,0,0);
  return d < today;
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

// switchAuthTab is defined in pages.js


// =============================================
// ADMIN AUTHORITY: INSTANT TOGGLE
// =============================================
async function toggleRegistration(eventId, open) {
  try {
    await Store.updateEvent(eventId, { registrationOpen: open });
    Toast.success(`Registration ${open ? 'Started 🚀' : 'Stopped 🛑'}`);
    Router.render(Router.current);
  } catch (e) {
    Toast.error('Failed to update authority status');
  }
}

// =============================================
// BOOKMARK SYSTEM (localStorage)
// =============================================
const Bookmarks = {
  _key() {
    const user = Auth.current();
    return user ? `bookmarks_${user.id}` : 'bookmarks_guest';
  },
  getAll() {
    try { return JSON.parse(localStorage.getItem(this._key()) || '[]'); }
    catch { return []; }
  },
  isBookmarked(eventId) {
    return this.getAll().includes(eventId);
  },
  toggle(eventId) {
    const list = this.getAll();
    const idx  = list.indexOf(eventId);
    if (idx === -1) {
      list.push(eventId);
      localStorage.setItem(this._key(), JSON.stringify(list));
      return true; // added
    } else {
      list.splice(idx, 1);
      localStorage.setItem(this._key(), JSON.stringify(list));
      return false; // removed
    }
  },
  count() { return this.getAll().length; }
};

function toggleBookmark(eventId, btn) {
  const added = Bookmarks.toggle(eventId);
  if (btn) {
    btn.classList.toggle('saved', added);
    btn.title = added ? 'Remove from Saved' : 'Save Event';
  }
  Toast.show(added ? '❤️ Event saved!' : '💔 Removed from saved', added ? 'success' : 'info', 2000);
  // Refresh sidebar badge
  updateNav(Router.current, Auth.current());
}


