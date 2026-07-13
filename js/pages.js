/**
 * =============================================
 * pages.js — All Page Renderers
 * Each page is a function that injects HTML
 * into #app and sets up event listeners
 * =============================================
 */

// =============================================
// HELPER: Set page content
// =============================================
function setPage(html, withSidebar = true, sidebarItems = []) {
  const app  = document.getElementById('app');
  const user = Auth.current();

  let sidebarHtml = '';
  if (withSidebar) {
    sidebarHtml = `
      <aside class="sidebar">
        <div class="nav-brand" style="cursor:pointer" onclick="Router.navigate('events')">⚡ Event<span>Hub</span></div>
        ${sidebarItems.map(section => `
          <div class="sidebar-section">
            ${section.label ? `<div class="sidebar-label">${section.label}</div>` : ''}
            ${section.items.map(item => `
              <button class="sidebar-item ${item.active ? 'active' : ''}" onclick="${item.action}">
                <span class="icon">${item.icon}</span>
                <span>${item.name}</span>
                ${item.badge ? `<span class="sidebar-badge">${item.badge}</span>` : ''}
              </button>`).join('')}
          </div>`).join('')}
        
        <div style="margin-top:auto; padding:0 0.5rem">
          ${!user ? `
            <button class="sidebar-item" onclick="Router.navigate('login')" style="background:rgba(255,255,255,0.03)">
              <span class="icon">🔐</span>
              <span>Admin Login</span>
            </button>
          ` : `
            <button class="sidebar-item" onclick="logout()" style="color:var(--red)">
              <span class="icon">🚪</span>
              <span>Sign Out</span>
            </button>
          `}
        </div>
      </aside>`;
  }

  app.innerHTML = `
    <div class="app-layout ${!withSidebar ? 'no-sidebar' : 'admin-layout'}">
      ${sidebarHtml}
      <main class="main-content">
        ${html}
      </main>
    </div>`;
}

// =============================================
// PAGE: LOGIN
// =============================================
// AUTH HELPERS
// =============================================
function forgotPassword(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  if (!email) {
    Toast.info('Please enter your email address first.');
    return;
  }
  Toast.info(`Password reset instructions have been sent to ${email} (Demo: Contact the site administrator)`);
}

// =============================================
Router.register('login', () => {
  document.getElementById('app').innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:2rem;position:relative;background:var(--bg)">
      <div style="position:absolute;top:0;left:0;right:0;height:500px;background:radial-gradient(circle at 50% 0%, var(--accent-glow) 0%, transparent 70%);pointer-events:none"></div>
      
      <div style="width:100%;max-width:420px;position:relative;z-index:1">
        <div style="text-align:center;margin-bottom:3.5rem">
          <h1 style="font-family:'Outfit';font-size:3.5rem;font-weight:800;letter-spacing:-0.04em;margin-bottom:0.5rem">Event<span>Hub</span></h1>
          <p style="color:var(--text-secondary);font-weight:500">Premium Event Management Portal</p>
        </div>

        <div style="background:var(--surface);padding:3rem;border:1px solid var(--border);border-radius:var(--radius-xl);box-shadow:0 30px 60px rgba(0,0,0,0.4)">
          
          <!-- ADMIN BADGE -->
          <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:2rem;padding:0.75rem 1.25rem;background:rgba(251,191,36,0.06);border:1px solid var(--border-bright);border-radius:12px">
            <span style="font-size:1.25rem">🔐</span>
            <div>
              <div style="font-size:0.65rem;font-weight:900;letter-spacing:0.15em;color:var(--accent);text-transform:uppercase">Admin Access Only</div>
              <div style="font-size:0.75rem;color:var(--text-muted);margin-top:0.1rem">Authorized personnel only</div>
            </div>
          </div>

          <!-- LOGIN FORM -->
          <div id="login-form">
            <div class="form-group">
              <label class="form-label">Admin Email</label>
              <input type="email" class="form-control" id="login-email" placeholder="admin@yourdomain.com">
            </div>
            <div class="form-group">
              <label class="form-label">Password</label>
              <input type="password" class="form-control" id="login-password" placeholder="••••••••" onkeydown="if(event.key==='Enter') doLogin()">
            </div>
            <button class="btn btn-primary" style="width:100%;margin-top:1.5rem;padding:1.1rem" onclick="doLogin()">Access Portal →</button>
          </div>
        </div>

        <div style="text-align:center;margin-top:2.5rem">
           <button class="sidebar-item" onclick="Router.navigate('events')" style="justify-content:center;background:none;border:none;margin:0 auto">
             <span class="icon">←</span> Back to Gallery
           </button>
        </div>
      </div>
    </div>`;
});

function switchAuthTab(tab) {
  document.getElementById('tab-login').classList.toggle('active', tab === 'login');
  document.getElementById('tab-register').classList.toggle('active', tab === 'register');
  document.getElementById('login-form').classList.toggle('hidden', tab !== 'login');
  document.getElementById('register-form').classList.toggle('hidden', tab !== 'register');
}
function selectAuthCat(val) {
  document.getElementById('auth-cat-val').value = val;
  document.getElementById('auth-day').classList.toggle('selected', val === 'Day Scholar');
  document.getElementById('auth-host').classList.toggle('selected', val === 'Hosteller');
}

async function doLogin() {
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  if (!email || !password) { Toast.warning('Please fill all fields'); return; }
  const result = await Auth.login(email, password);
  if (result.error) { Toast.error(result.error); return; }
  Toast.success(`Welcome back, ${result.user.name.split(' ')[0]}! 👋`);
  Router.navigate(result.user.role === 'admin' ? 'admin-dashboard' : 'events');
}

async function doRegister() {
  const name     = document.getElementById('reg-full-name').value.trim();
  const email    = document.getElementById('reg-email').value.trim();
  const department = document.getElementById('reg-department-auth').value;
  const category = document.getElementById('auth-cat-val').value;
  const password = document.getElementById('reg-password').value;
  const confirm  = document.getElementById('reg-confirm').value;
  if (!name || !email || !department || !category || !password) { Toast.warning('Please fill all fields'); return; }
  if (password !== confirm) { Toast.error('Passwords do not match'); return; }
  if (password.length < 6)  { Toast.error('Password must be at least 6 characters'); return; }
  // Block self-registration of admin accounts
  if (email.toLowerCase() === 'admin@demo.com') {
    Toast.error('⛔ Admin accounts cannot be self-registered. Contact the system administrator.');
    return;
  }
  const result = await Auth.register({ name, email, department, category, password });
  if (result.error) { Toast.error(result.error); return; }
  Toast.success(`Welcome to EventHub, ${name.split(' ')[0]}! 🎉`);
  Router.navigate('events');
}

// =============================================
// PAGE: LANDING (Portal Selection)
// =============================================
Router.register('landing', () => {
  const user = Auth.current();
  const isAdmin = user && user.role === 'admin';

  setPage(`
    <div class="landing-container fade-in" style="min-height: 80vh; display: flex; flex-direction: column; justify-content: center; padding: 4rem 0">
      <div style="text-align:center;margin-bottom:6rem; position: relative">
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 300px; height: 300px; background: var(--accent-glow); filter: blur(100px); border-radius: 50%; z-index: -1"></div>
        <div style="font-size:0.75rem;font-weight:900;letter-spacing:0.5em;color:var(--accent);margin-bottom:1.5rem; text-transform: uppercase">University Ecosystem</div>
        <h1 style="font-size:4.5rem;font-weight:900;font-family:'Outfit'; letter-spacing: -0.04em; line-height: 1">Event<span style="color:var(--accent)">Hub</span> Premium</h1>
        <p style="color:var(--text-secondary);font-size:1.25rem;max-width:600px;margin:2rem auto 0; line-height: 1.6; font-weight: 500">The premier destination for campus events, intelligent management, and world-class experiences.</p>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(360px, 1fr));gap:3rem;width:100%;max-width:1100px;margin:0 auto">
        
        <!-- STUDENT CARD -->
        <div class="card landing-card" onclick="Router.navigate('events')" style="padding:4rem 3rem; text-align:center; cursor:pointer; transition:all 0.5s cubic-bezier(0.23, 1, 0.32, 1); border:1px solid var(--border); background:rgba(255,255,255,0.01); border-radius: 32px; position: relative; overflow: hidden">
          <div class="card-glow" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: radial-gradient(circle at top right, rgba(255,255,255,0.05), transparent); pointer-events: none"></div>
          <div style="font-size:5rem;margin-bottom:2.5rem;filter: drop-shadow(0 20px 30px rgba(0,0,0,0.5))">🎓</div>
          <h2 style="font-family:'Outfit';font-size:2.25rem;margin-bottom:1.25rem; font-weight: 800">Student Portal</h2>
          <p style="color:var(--text-secondary);margin-bottom:3rem;line-height:1.7; font-size: 1.05rem">Discover elite hackathons, cultural fests, and workshops. Experience seamless registration.</p>
          <button class="btn btn-primary" style="width:100%;padding:1.25rem; font-size: 1.1rem">Enter Portal →</button>
        </div>

        <!-- ADMIN CARD -->
        <div class="card landing-card" style="padding:4rem 3rem; text-align:center; transition:all 0.5s cubic-bezier(0.23, 1, 0.32, 1); border:1px solid var(--border); background:rgba(255,255,255,0.01); border-radius: 32px; position: relative; overflow: hidden">
          <div class="card-glow" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: radial-gradient(circle at top right, rgba(251,191,36,0.05), transparent); pointer-events: none"></div>
          <div style="font-size:5rem;margin-bottom:2.5rem;filter: drop-shadow(0 20px 30px rgba(0,0,0,0.5))">🔐</div>
          <h2 style="font-family:'Outfit';font-size:2.25rem;margin-bottom:1.25rem; font-weight: 800">Admin Console</h2>
          <p style="color:var(--text-secondary);margin-bottom:3rem;line-height:1.7; font-size: 1.05rem">Full spectrum management. Track registrations, analyze performance, and control the event flow.</p>
          
          <div style="display:flex;flex-direction:column;gap:1rem">
            ${isAdmin ? `
              <button class="btn btn-primary" style="width:100%;padding:1.25rem; font-size: 1.1rem" onclick="Router.navigate('admin-dashboard')">
                Go to Dashboard 📊
              </button>
              <button class="btn btn-ghost" style="width:100%;padding:1rem; border: 1px solid var(--border)" onclick="logout()">
                Switch Account 🔄
              </button>
            ` : `
              <button class="btn btn-secondary" style="width:100%;padding:1.25rem; font-size: 1.1rem; border:1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.03)" onclick="Router.navigate('login')">
                Login as Authority →
              </button>
            `}
          </div>
        </div>

      </div>

      <div style="margin-top:8rem;text-align:center;opacity:0.6; display: flex; flex-direction: column; align-items: center; gap: 1rem">
        <div style="width: 40px; height: 1px; background: var(--text-muted)"></div>
        <div style="font-size:0.75rem;font-weight:800;letter-spacing:0.3em;color:var(--text-muted); text-transform: uppercase">Smart Management V2.0 — Secure & Intelligent</div>
      </div>
    </div>
  `, false);
});

// =============================================
// PAGE: EVENTS (Student view)
// =============================================
Router.register('events', () => {
  const user   = Auth.current();
  const events = Store.getEvents().sort((a, b) => new Date(a.date) - new Date(b.date));
  const sidebar = buildStudentSidebar('events');

  const renderSection = (title, items, emoji) => {
    if (!items.length) return '';
    return `
      <div class="section-header fade-in">
        <h2 class="section-title"><span>${emoji}</span> ${title}</h2>
        <span class="section-count">${items.length} Events</span>
      </div>
      <div class="event-grid">
        ${items.map(e => renderEventCard(e)).join('')}
      </div>
    `;
  };

  const now = new Date();
  const getStatus = (e) => {
    let s = e.statusOverride || 'Auto';
    if (s === 'Auto') {
      const eDate = new Date(e.date);
      if (eDate.toDateString() === now.toDateString()) return 'Ongoing';
      if (eDate < now.setHours(0,0,0,0)) return 'Past';
      return 'Upcoming';
    }
    return s;
  };

  const featured = events.filter(e => e.isPinned);
  const ongoing  = events.filter(e => getStatus(e) === 'Ongoing');
  const upcoming = events.filter(e => getStatus(e) === 'Upcoming' && !e.isPinned);
  const past     = events.filter(e => getStatus(e) === 'Past');

  setPage(`
    <div class="hero-section fade-in" style="position:relative;overflow:hidden">
      <img src="/assets/vibin-z-logo.png"
        style="position:absolute;top:2rem;right:2.5rem;width:160px;height:160px;object-fit:contain;opacity:0.9;filter:drop-shadow(0 10px 30px rgba(0,0,0,0.5));z-index:1"
        alt="VIBIN.Z">
      <div style="position:relative;z-index:2">
        <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:1.5rem">
          <span style="height:1px;width:30px;background:var(--accent)"></span>
          <span style="font-size:0.75rem;font-weight:800;letter-spacing:0.1em;color:var(--accent)">PROFESSIONAL EVENT SYSTEM</span>
        </div>
        <h1>Explore <span style="background:var(--accent-gradient);-webkit-background-clip:text;-webkit-text-fill-color:transparent">Elite</span> Events</h1>
        <p>Discover hackathons, workshops, and cultural fests curated for the university community.</p>
        <div style="display:flex;gap:1.5rem;margin-top:2.5rem">
          <button class="btn btn-primary" onclick="document.getElementById('event-grid-container')?.scrollIntoView({behavior:'smooth'})">View Gallery</button>
          ${!user ? `<button class="btn btn-secondary" onclick="Router.navigate('login')">Access Portal</button>` : ''}
        </div>
      </div>
    </div>

    <!-- INSTAGRAM-STYLE HIGHLIGHTS -->
    ${(() => {
      const adminHighlights = Store.getHighlights();
      const catEmojis = { Tech:'💻', Cultural:'🎭', Sports:'🏏', Workshop:'🔧', Seminar:'🎤', 'Music Concert':'🎶', 'DJ Night':'🎧', 'College Fest':'🎡', Gaming:'🎮', Other:'📅' };
      const catColors  = { Tech:'#3b82f6', Cultural:'#a78bfa', Sports:'#ef4444', Workshop:'#10b981', Seminar:'#f59e0b', 'Music Concert':'#ec4899', 'DJ Night':'#8b5cf6', 'College Fest':'#f97316', Gaming:'#06b6d4', Other:'#6b7280' };
      const presentCats = [...new Set(events.map(e => e.category))];

      const makeMemoryCircle = (hl) => `
        <div class="highlight-circle" onclick="openHighlightsGallery('${hl.id}')" style="cursor:pointer;text-align:center;flex-shrink:0" title="${hl.title}">
          <div style="width:72px;height:72px;border-radius:50%;padding:3px;background:linear-gradient(135deg,#f59e0b,#f97316,#ec4899);margin:0 auto 0.6rem">
            <div style="width:100%;height:100%;border-radius:50%;background:${hl.coverImage ? `center/cover url('${hl.coverImage}')` : '#111'};display:flex;align-items:center;justify-content:center;font-size:1.6rem;border:2px solid #0a0a0a;overflow:hidden">
              ${hl.coverImage ? '' : '✨'}
            </div>
          </div>
          <div style="font-size:0.68rem;font-weight:700;color:#fff;white-space:nowrap;max-width:80px;overflow:hidden;text-overflow:ellipsis">${hl.title}</div>
        </div>`;

      const makeCatCircle = (label, emoji, cover, filterVal, color, isActive=false) => `
        <div class="highlight-circle" onclick="setFilter(document.querySelector('[data-filter=All]'), '${filterVal}')" style="cursor:pointer;text-align:center;flex-shrink:0">
          <div style="width:72px;height:72px;border-radius:50%;padding:3px;background:${isActive ? 'linear-gradient(135deg,#f59e0b,#fbbf24)' : `linear-gradient(135deg,${color},${color}88)`};margin:0 auto 0.6rem">
            <div style="width:100%;height:100%;border-radius:50%;background:${cover ? `center/cover url('${cover}')` : '#111'};display:flex;align-items:center;justify-content:center;font-size:1.6rem;border:2px solid #0a0a0a;overflow:hidden">
              ${cover ? '' : emoji}
            </div>
          </div>
          <div style="font-size:0.68rem;font-weight:700;color:${isActive ? 'var(--accent)' : 'var(--text-secondary)'};white-space:nowrap;max-width:80px;overflow:hidden;text-overflow:ellipsis">${label}</div>
        </div>`;

      const circles = [
        makeCatCircle('All', '🌟', null, 'All', '#fbbf24', true),
        ...adminHighlights.map(hl => makeMemoryCircle(hl)),
        ...presentCats.map(c => makeCatCircle(c, catEmojis[c]||'📅', events.find(e=>e.category===c)?.coverPhoto||null, c, catColors[c]||'#6b7280'))
      ].join('');

      return `<div class="highlights-row fade-in"><div class="highlights-scroll">${circles}</div></div>`;
    })()}

    <div class="search-bar fade-in">
      <div class="search-input-wrap">
        <span class="search-icon">🔍</span>
        <input type="text" id="event-search" placeholder="Search for events, clubs, or locations..." oninput="filterEvents()">
      </div>
      <div class="filter-chips">
        <button class="chip active" data-filter="All" onclick="setFilter(this,'All')">All</button>
        <button class="chip" data-filter="Tech" onclick="setFilter(this,'Tech')">Technology</button>
        <button class="chip" data-filter="Cultural" onclick="setFilter(this,'Cultural')">Arts & Culture</button>
        <button class="chip" data-filter="Sports" onclick="setFilter(this,'Sports')">Athletics</button>
        <button class="chip" data-filter="Workshop" onclick="setFilter(this,'Workshop')">Skill Building</button>
      </div>
    </div>

    <div id="event-grid-container">
      ${renderSection('Featured Events', featured, '⭐')}
      ${renderSection('Ongoing Events', ongoing, '🔴')}
      ${renderSection('Upcoming Events', upcoming, '📅')}
      ${renderSection('Past Events', past, '⌛')}
      ${!events.length ? '<div class="empty-state"><p>No events found at the moment.</p></div>' : ''}
    </div>`,
    true, sidebar);

  window._currentFilter = 'All';
});

window._currentFilter = 'All';
function setFilter(btn, filter) {
  window._currentFilter = filter;
  document.querySelectorAll('.chip').forEach(c => c.classList.toggle('active', c.dataset.filter === filter));
  filterEvents();
}
function filterEvents() {
  const q      = (document.getElementById('event-search')?.value || '').toLowerCase();
  const filter = window._currentFilter || 'All';
  const events = Store.getEvents().sort((a, b) => new Date(a.date) - new Date(b.date));
  const container = document.getElementById('event-grid-container');
  if (!container) return;

  const filtered = events.filter(e => {
    const matchCat  = filter === 'All' || e.category === filter;
    const matchText = !q || e.name.toLowerCase().includes(q) || e.location.toLowerCase().includes(q) || e.description.toLowerCase().includes(q);
    return matchCat && matchText;
  });

  if (q !== '' || filter !== 'All') {
    container.innerHTML = `
      <div class="section-header fade-in">
        <h2 class="section-title">🔍 Search Results</h2>
        <span class="section-count">${filtered.length} Matches</span>
      </div>
      <div class="event-grid">
        ${filtered.length ? filtered.map(e => renderEventCard(e)).join('') : '<div class="empty-state"><div class="empty-icon">🔍</div><p>No events match your search</p></div>'}
      </div>`;
  } else {
    Router.render('events');
  }
}

// =============================================
// PAGE: MY EVENTS (Student dashboard)
// =============================================
Router.register('my-events', () => {
  const user  = Auth.current();
  const regs  = Store.getRegistrationsByUser(user.id);
  const sidebar = buildStudentSidebar('my-events');

  const cards = regs.length ? regs.map(reg => {
    const event = Store.getEvent(reg.eventId);
    if (!event) return '';
    return `
      <div class="card fade-in" style="display:flex;gap:1.25rem;align-items:flex-start;flex-wrap:wrap">
        <div style="font-size:2.5rem;background:${event.bannerColor||'var(--bg-elevated)'};padding:0.75rem 1rem;border-radius:var(--radius-md)">${event.emoji||'📅'}</div>
        <div style="flex:1;min-width:200px">
          <div style="font-family:var(--font-display);font-weight:700;margin-bottom:0.3rem">${event.name}</div>
          <div class="event-meta">
            <div class="event-meta-item"><span class="icon">📅</span>${formatDate(event.date)}</div>
            <div class="event-meta-item"><span class="icon">📍</span>${event.location}</div>
          </div>
          <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-top:0.75rem;align-items:center">
            <span class="badge ${getCategoryBadgeClass(event.category)}">${event.category}</span>
            <span class="badge ${reg.attended ? 'badge-success' : 'badge-neutral'}">${reg.attended ? '✅ Attended' : '⏳ Registered'}</span>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:0.5rem;align-items:flex-end">
          <button class="btn btn-secondary btn-sm" onclick="viewMyRegistration('${event.id}')">🎫 View QR</button>
          ${reg.attended ? `<button class="btn btn-ghost btn-sm" onclick="generateCertificate('${reg.id}')">📜 Certificate</button>` : ''}
          ${isPast(event.date) ? `<button class="btn btn-ghost btn-sm" onclick="openFeedbackModal('${event.id}')">⭐ Feedback</button>` : ''}
        </div>
      </div>`;
  }).join('') : `<div class="empty-state"><div class="empty-icon">🎫</div><p>You haven't registered for any events yet.</p><button class="btn btn-primary mt-2" onclick="Router.navigate('events')">Browse Events</button></div>`;

  setPage(`
    <div class="page-header">
      <h2>My Events</h2>
      <div class="breadcrumb"><span>Home</span> / My Events</div>
    </div>
    <div style="margin-bottom:1.5rem">
      <div class="stats-grid" style="grid-template-columns:repeat(3,1fr)">
        <div class="stat-card accent">
          <div class="stat-value">${regs.length}</div>
          <div class="stat-label">Registered</div>
          <div class="stat-icon">🎫</div>
        </div>
        <div class="stat-card green">
          <div class="stat-value">${regs.filter(r => r.attended).length}</div>
          <div class="stat-label">Attended</div>
          <div class="stat-icon">✅</div>
        </div>
        <div class="stat-card blue">
          <div class="stat-value">${regs.filter(r => r.attended).length}</div>
          <div class="stat-label">Certificates</div>
          <div class="stat-icon">📜</div>
        </div>
      </div>
    </div>
    <div style="display:flex;flex-direction:column;gap:1rem">${cards}</div>`,
    true, sidebar);
});

// =============================================
// PAGE: NOTIFICATIONS
// =============================================
Router.register('notifications', () => {
  const user  = Auth.current();
  const notifs = Store.getNotifications(user.id);
  Store.markAllRead(user.id);
  const sidebar = user.role === 'admin' ? buildAdminSidebar('notifications') : buildStudentSidebar('notifications');

  const items = notifs.length ? notifs.map(n => `
    <div class="card fade-in" style="display:flex;gap:1rem;align-items:flex-start;border-left:3px solid ${n.type==='success'?'var(--green)':n.type==='warning'?'var(--accent)':'var(--blue)'}">
      <div style="font-size:1.5rem">${n.type==='success'?'✅':n.type==='warning'?'⚠️':'ℹ️'}</div>
      <div>
        <div style="font-weight:600;margin-bottom:0.25rem">${n.title}</div>
        <p class="text-sm">${n.message}</p>
        <div class="text-xs text-muted mt-1">${new Date(n.createdAt).toLocaleDateString('en-IN')}</div>
      </div>
    </div>`).join('') : `<div class="empty-state"><div class="empty-icon">🔔</div><p>No notifications yet</p></div>`;

  setPage(`
    <div class="page-header">
      <h2>Notifications</h2>
    </div>
    <div style="display:flex;flex-direction:column;gap:0.75rem">${items}</div>`,
    true, sidebar);
});

// =============================================
// PAGE: PROFILE
// =============================================
Router.register('profile', () => {
  const user  = Auth.current();
  const regs  = Store.getRegistrationsByUser(user.id);
  const sidebar = user.role === 'admin' ? buildAdminSidebar('profile') : buildStudentSidebar('profile');

  setPage(`
    <div class="page-header"><h2>My Profile</h2></div>
    <div style="max-width:560px">
      <div class="card" style="text-align:center;padding:2.5rem;margin-bottom:1.25rem">
        <div style="width:80px;height:80px;border-radius:50%;background:var(--accent-dim);border:2px solid var(--accent);display:flex;align-items:center;justify-content:center;font-size:2rem;margin:0 auto 1rem">👤</div>
        <h3>${user.name}</h3>
        <p class="text-sm text-muted">${user.email}</p>
        <div style="display:flex;justify-content:center;gap:0.5rem;margin-top:0.75rem">
          <span class="badge badge-info">${user.role === 'admin' ? '👑 Admin' : '🎓 Student'}</span>
          ${user.department ? `<span class="badge badge-neutral">${user.department}</span>` : ''}
          ${user.category ? `<span class="badge badge-neutral">${user.category}</span>` : ''}
        </div>
      </div>
      ${user.role !== 'admin' ? `
      <div class="stats-grid" style="grid-template-columns:1fr 1fr 1fr;margin-bottom:1.25rem">
        <div class="stat-card accent"><div class="stat-value">${regs.length}</div><div class="stat-label">Registered</div></div>
        <div class="stat-card green"><div class="stat-value">${regs.filter(r => r.attended).length}</div><div class="stat-label">Attended</div></div>
        <div class="stat-card blue"><div class="stat-value">${Store.getFeedbacks().filter(f=>f.userId===user.id).length}</div><div class="stat-label">Reviews</div></div>
      </div>` : ''}
      <div class="card">
        <div class="card-header"><div class="card-title">Account Settings</div></div>
        <div class="form-group">
          <label class="form-label">Display Name</label>
          <input type="text" class="form-control" id="pf-name" value="${user.name}">
        </div>
        ${user.department ? `
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Department</label>
            <select class="form-control" id="pf-department">
              ${['BCA','BTech CSE','Nursing','Pharmacy','Other'].map(b => `<option ${b===user.department?'selected':''}>${b}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Category</label>
            <select class="form-control" id="pf-cat">
              <option ${user.category==='Day Scholar'?'selected':''}>Day Scholar</option>
              <option ${user.category==='Hosteller'?'selected':''}>Hosteller</option>
            </select>
          </div>
        </div>` : ''}
        <button class="btn btn-primary" onclick="saveProfile()">Save Changes</button>
      </div>
    </div>`, true, sidebar);
});

function saveProfile() {
  const user = Auth.current();
  const name = document.getElementById('pf-name').value.trim();
  const users = Store.getUsers().map(u => {
    if (u.id !== user.id) return u;
    const upd = { ...u, name: name || u.name };
    const department = document.getElementById('pf-department');
    const cat    = document.getElementById('pf-cat');
    if (department) upd.department = department.value;
    if (cat)    upd.category = cat.value;
    return upd;
  });
  Store._set('users', users);
  const updated = users.find(u => u.id === user.id);
  Store.setSession(updated);
  Toast.success('Profile updated!');
  updateNav(Router.current, updated);
}

// =============================================
// REGISTRATION SUBMIT
// =============================================
async function submitRegistration() {
  const eventId    = document.getElementById('reg-event-id').value;
  const user       = Auth.current();
  
  // Detect if we are using the Quick Section or Manual Form
  const isQuick = !document.getElementById('quick-reg-section').classList.contains('hidden');
  
  let name, roll, email, department, category;

  if (isQuick && user) {
    name = user.name;
    email = user.email;
    roll = user.roll || user.rollNumber || '';
    department = user.department;
    category = user.category;
  } else {
    name       = document.getElementById('reg-name').value.trim();
    roll       = document.getElementById('reg-roll').value.trim();
    email      = document.getElementById('reg-email-val').value.trim();
    department = document.getElementById('reg-department').value;
    category   = document.getElementById('reg-category').value;
  }

  // Final Validation
  if (!name || !roll || !email || !department || !category) { 
    if (isQuick) {
      Toast.warning('Your profile is incomplete. Please edit details manually.');
      toggleManualReg(true);
    } else {
      Toast.warning('Please fill all required fields');
    }
    return;
  }

  // Simple Email Regex Validation
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    Toast.error('Please enter a valid email address');
    return;
  }

  const event = Store.getEvent(eventId);
  if (!event) { Toast.error('Event not found'); return; }

  const regs = Store.getRegistrationsByEvent(eventId);

  // 2. DUAL DUPLICATE CHECK: Check both Roll Number AND Email
  const isDuplicateRoll = regs.some(r => r.roll === roll);
  const isDuplicateEmail = regs.some(r => r.email === email);

  if (isDuplicateRoll) {
    Toast.error(`Registration Denied: Roll Number ${roll} is already registered for this event. 🚫`);
    return;
  }
  if (isDuplicateEmail) {
    Toast.error(`Registration Denied: Email ${email} is already registered for this event. 🚫`);
    return;
  }

  // 3. CONFIRMATION STEP: Ask before final submission
  if (!confirm(`Are you sure you want to register for "${event.name}"?\n\nDetails:\n- Name: ${name}\n- Roll No: ${roll}\n- Dept: ${department}`)) {
    return;
  }

  // Check seat limit
  if (regs.length >= event.seatLimit) { Toast.error('Event is full!'); return; }

  const reg = { eventId, userName: name, email, roll, department, category };

  try {
    const createdReg = await Store.addRegistration(reg);
    
    Toast.success('Registered successfully! 🎉 Your QR code is below.');
    Modal.close('register-modal');

    // Show QR for both guests and logged-in users
    const fullReg = { ...reg, id: createdReg.id || createdReg._id };
    setTimeout(() => showRegistrationQR(fullReg, event), 300);

    // Notify logged-in users
    if (user) {
      Store.addNotification(user.id, {
        id: genId('notif'), type: 'success',
        title: 'Registration Confirmed',
        message: `You are registered for "${event.name}" on ${formatDate(event.date)}.`,
        read: false, createdAt: Date.now()
      });
    }

    // Refresh page
    setTimeout(() => { if (Router.current === 'events') Router.render('events'); }, 400);
  } catch (error) {
    Toast.error(error.message);
  }
}

// Show QR modal for any registration (guest or logged-in)
function showRegistrationQR(reg, event) {
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
      <div style="margin-top:2rem">
        <button class="btn btn-primary" style="width:100%;padding:1rem" onclick="downloadQR('${regId}', '${event.name}')">⬇️ Download Ticket</button>
      </div>
    </div>`;
  Modal.open('my-reg-modal');
  setTimeout(() => generateQR('my-reg-qr', JSON.stringify({ regId, eventId: event._id || event.id, name: reg.userName, roll: reg.roll })), 100);
}

// =============================================
// ADMIN: SIDEBAR & DASHBOARD
// =============================================
function buildAdminSidebar(active) {
  const events = Store.getEvents();
  const regs   = Store.getRegistrations();
  const hls    = Store.getHighlights();
  return [
    { label: 'Overview', items: [
      { name: 'Dashboard', icon: '📊', active: active === 'admin-dashboard', action: "Router.navigate('admin-dashboard')" },
    ]},
    { label: 'Manage', items: [
      { name: 'Events', icon: '🗓', active: active === 'admin-events', action: "Router.navigate('admin-events')", badge: events.length },
      { name: 'Registrations', icon: '📋', active: active === 'admin-registrations', action: "Router.navigate('admin-registrations')", badge: regs.length },
      { name: 'Attendance', icon: '✅', active: active === 'attendance', action: "Router.navigate('attendance')" },
      { name: 'Highlights', icon: '✨', active: active === 'highlights', action: "Router.navigate('admin-highlights')", badge: hls.length || null },
    ]},
    { label: 'Tools', items: [
      { name: 'QR Scanner', icon: '📷', active: active === 'scanner', action: "Router.navigate('scanner')" },
      { name: 'AI Insights', icon: '🤖', active: active === 'ai-insights', action: "Router.navigate('ai-insights')" },
    ]},
    { label: 'Account', items: [
      { name: 'Notifications', icon: '🔔', active: active === 'notifications', action: "Router.navigate('notifications')" },
      { name: 'Profile', icon: '👤', active: active === 'profile', action: "Router.navigate('profile')" },
    ]}
  ];
}

function buildStudentSidebar(active) {
  const user = Auth.current();
  const regs = user ? Store.getRegistrationsByUser(user.id) : [];
  const notifs = user ? Store.getNotifications(user.id).filter(n => !n.read).length : 0;
  const savedCount = Bookmarks.count();

  const items = [
    { label: 'Explore', items: [
      { name: 'All Events', icon: '🗓', active: active === 'events', action: "Router.navigate('events')" },
      { name: 'Trending', icon: '🔥', active: active === 'trending', action: "Router.navigate('trending')" },
      { name: 'Saved Events', icon: '❤️', active: active === 'saved-events', action: "Router.navigate('saved-events')", badge: savedCount || null },
    ]}
  ];

  if (user) {
    items.push({ label: 'Personal', items: [
      { name: 'My Dashboard', icon: '📊', active: active === 'student-dashboard', action: "Router.navigate('student-dashboard')" },
      { name: 'My Events', icon: '🎫', active: active === 'my-events', action: "Router.navigate('my-events')", badge: regs.length || null },
      { name: 'Notifications', icon: '🔔', active: active === 'notifications', action: "Router.navigate('notifications')", badge: notifs || null },
      { name: 'Profile', icon: '👤', active: active === 'profile', action: "Router.navigate('profile')" },
    ]});
  }

  items.push({ label: 'Support', items: [
      { name: 'Help Center', icon: '❓', active: false, action: "Toast.info('Support Desk: 1800-EVENT-HUB')" },
  ]});

  return items;
}


// =============================================
// PAGE: ADMIN DASHBOARD
// =============================================
Router.register('admin-dashboard', () => {
  const events = Store.getEvents();
  const regs   = Store.getRegistrations();
  
  const now = new Date();
  const getStatus = (e) => {
    let s = e.statusOverride || 'Auto';
    if (s === 'Auto') {
      const eDate = new Date(e.date);
      if (eDate.toDateString() === now.toDateString()) return 'Ongoing';
      if (eDate < now.setHours(0,0,0,0)) return 'Past';
      return 'Upcoming';
    }
    return s;
  };

  const upcomingCount = events.filter(e => getStatus(e) === 'Upcoming').length;
  const ongoingCount  = events.filter(e => getStatus(e) === 'Ongoing').length;
  const pastCount     = events.filter(e => getStatus(e) === 'Past').length;
  const closedCount   = events.filter(e => !e.registrationOpen).length;

  // Top events by registrations
  const eventPopularity = events.map(e => ({
    ...e,
    count: Store.getRegistrationsByEvent(e.id).length
  })).sort((a, b) => b.count - a.count);

  setPage(`
    <div class="page-header fade-in">
       <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.5rem;font-size:0.75rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.1em">
         <span>Admin</span> <span style="opacity:0.3">/</span> <span style="color:var(--accent)">Dashboard</span>
       </div>
       <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem">
         <h2 style="font-family:'Outfit';font-size:2.5rem;font-weight:800">Event <span style="color:var(--accent)">Intelligence</span></h2>
         <div class="text-xs text-muted" style="text-align:right">
           <div>SYSTEM ONLINE</div>
           <div style="color:var(--accent)">LAST SYNC: JUST NOW</div>
         </div>
       </div>
    </div>

    <!-- STAT CARDS -->
    <div class="stats-grid stagger" style="grid-template-columns:repeat(5,1fr)">
      <div class="stat-card accent">
        <div class="stat-value">${upcomingCount}</div>
        <div class="stat-label">Upcoming</div>
        <div class="stat-icon">📅</div>
      </div>
      <div class="stat-card red">
        <div class="stat-value">${ongoingCount}</div>
        <div class="stat-label">Ongoing</div>
        <div class="stat-icon">🔴</div>
      </div>
      <div class="stat-card blue">
        <div class="stat-value">${pastCount}</div>
        <div class="stat-label">Past Events</div>
        <div class="stat-icon">⌛</div>
      </div>
      <div class="stat-card purple">
        <div class="stat-value">${closedCount}</div>
        <div class="stat-label">Closed Registration</div>
        <div class="stat-icon">🔒</div>
      </div>
      <div class="stat-card green">
        <div class="stat-value">${regs.length}</div>
        <div class="stat-label">Registrations</div>
        <div class="stat-icon">📋</div>
      </div>
    </div>

    <!-- CHARTS ROW -->
    <div class="grid-2" style="margin-bottom:1.5rem">
      <div class="card">
        <div class="card-header"><div class="card-title">Registrations by Category</div></div>
        <div class="chart-wrap"><canvas id="chart-category"></canvas></div>
      </div>
      <div class="card">
        <div class="card-header"><div class="card-title">Registrations by Department</div></div>
        <div class="chart-wrap"><canvas id="chart-departments"></canvas></div>
      </div>
    </div>

    <!-- EVENT POPULARITY + ATTENDANCE CHART -->
    <div class="grid-2" style="margin-bottom:1.5rem">
      <div class="card">
        <div class="card-header"><div class="card-title">Event Popularity</div><button class="btn btn-primary btn-sm" onclick="Router.navigate('admin-events')">+ New Event</button></div>
        <div class="chart-wrap"><canvas id="chart-popularity"></canvas></div>
      </div>
      <div class="card">
        <div class="card-header"><div class="card-title">Attendance Rate</div></div>
        <div class="chart-wrap"><canvas id="chart-attendance"></canvas></div>
      </div>
    </div>

    <!-- TOP EVENTS TABLE -->
    <div class="card">
      <div class="card-header">
        <div class="card-title">Top Events by Registration</div>
        <button class="btn btn-ghost btn-sm" onclick="Router.navigate('admin-registrations')">View All →</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>#</th><th>Event</th><th>Date</th><th>Category</th><th>Registrations</th><th>Attendance</th><th>Status</th></tr></thead>
          <tbody>
            ${eventPopularity.slice(0, 6).map((e, i) => {
              const att = Store.getRegistrationsByEvent(e.id).filter(r => r.attended).length;
              return `<tr>
                <td class="text-muted">${i + 1}</td>
                <td><strong>${e.name}</strong></td>
                <td>${formatDate(e.date)}</td>
                <td><span class="badge ${getCategoryBadgeClass(e.category)}">${e.category}</span></td>
                <td><strong>${e.count}</strong> / ${e.seatLimit}</td>
                <td>${att}</td>
                <td><span class="badge ${e.registrationOpen ? 'badge-success' : 'badge-neutral'}">${e.registrationOpen ? 'Open' : 'Closed'}</span></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>`, true, buildAdminSidebar('admin-dashboard'));

  // Render charts after DOM update
  requestAnimationFrame(() => { requestAnimationFrame(() => renderAdminCharts(events, regs, eventPopularity)); });
});

function renderAdminCharts(events, regs, eventPopularity) {
  const chartDefaults = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#8891a8', font: { family: 'DM Sans', size: 11 }, boxWidth: 12 } } }
  };

  // Category donut
  const catCtx = document.getElementById('chart-category');
  if (catCtx) new Chart(catCtx, {
    type: 'doughnut',
    data: {
      labels: ['Day Scholar', 'Hosteller'],
      datasets: [{ data: [regs.filter(r=>r.category==='Day Scholar').length, regs.filter(r=>r.category==='Hosteller').length], backgroundColor: ['#5c9eff','#f0a500'], borderWidth: 0, hoverOffset: 6 }]
    },
    options: { ...chartDefaults, cutout: '65%' }
  });

  // Registrations by Department
  const depts = ['BCA', 'BTech CSE', 'Nursing', 'Pharmacy', 'Other'];
  const typeCtx = document.getElementById('chart-departments');
  if (typeCtx) new Chart(typeCtx, {
    type: 'bar',
    data: {
      labels: depts,
      datasets: [{
        label: 'Registrations',
        data: depts.map(d => regs.filter(r => r.department === d).length),
        backgroundColor: ['#5c9eff','#a78bfa','#3ddc84','#f0a500','#8891a8'],
        borderRadius: 6, borderWidth: 0
      }]
    },
    options: { ...chartDefaults, plugins: { ...chartDefaults.plugins, legend: { display: false } }, scales: { y: { ticks: { color: '#8891a8', stepSize: 1 }, grid: { color: '#252a38' } }, x: { ticks: { color: '#8891a8' }, grid: { display: false } } } }
  });

  // Popularity
  const popCtx = document.getElementById('chart-popularity');
  if (popCtx) new Chart(popCtx, {
    type: 'bar',
    data: {
      labels: eventPopularity.slice(0,5).map(e => e.name.length > 15 ? e.name.substring(0,15) + '…' : e.name),
      datasets: [{ label: 'Registrations', data: eventPopularity.slice(0,5).map(e => e.count), backgroundColor: '#f0a500cc', borderRadius: 6, borderWidth: 0 }]
    },
    options: { ...chartDefaults, plugins: { ...chartDefaults.plugins, legend: { display: false } }, scales: { y: { ticks: { color: '#8891a8' }, grid: { color: '#252a38' } }, x: { ticks: { color: '#8891a8' } , grid: { display: false } } } }
  });

  // Attendance rate
  const attCtx = document.getElementById('chart-attendance');
  if (attCtx) {
    const regCount = regs.length;
    const attCount = regs.filter(r => r.attended).length;
    new Chart(attCtx, {
      type: 'doughnut',
      data: {
        labels: ['Attended', 'No Show'],
        datasets: [{ data: [attCount, Math.max(0, regCount - attCount)], backgroundColor: ['#3ddc84','#252a38'], borderWidth: 0, hoverOffset: 6 }]
      },
      options: { ...chartDefaults, cutout: '65%' }
    });
  }
}

// =============================================
// PAGE: ADMIN EVENTS
// =============================================
Router.register('admin-events', () => {
  const now = new Date();
  const getStatus = (e) => {
    let s = e.statusOverride || 'Auto';
    if (s === 'Auto') {
      const eDate = new Date(e.date);
      if (eDate.toDateString() === now.toDateString()) return 'Ongoing';
      if (eDate < new Date().setHours(0,0,0,0)) return 'Past';
      return 'Upcoming';
    }
    return s;
  };

  const events = Store.getEvents().sort((a, b) => new Date(a.date) - new Date(b.date));
  const sidebar = buildAdminSidebar('admin-events');

  const ongoing = events.filter(e => getStatus(e) === 'Ongoing');
  const upcoming = events.filter(e => getStatus(e) === 'Upcoming');
  const past = events.filter(e => getStatus(e) === 'Past').reverse(); // Newest past events first

  const renderAdminSection = (title, items, emoji) => {
    if (!items.length) return '';
    return `
      <div class="section-header fade-in" style="margin-top:2.5rem;margin-bottom:1.5rem">
        <h2 class="section-title" style="font-size:1.75rem"><span>${emoji}</span> ${title}</h2>
        <span class="section-count">${items.length} Events</span>
      </div>
      <div class="event-grid">
        ${items.map(e => renderEventCard(e, true)).join('')}
      </div>
    `;
  };

  setPage(`
    <div class="page-header fade-in">
       <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.5rem;font-size:0.75rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.1em">
         <span>Admin</span> <span style="opacity:0.3">/</span> <span style="color:var(--accent)">Events</span>
       </div>
       <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem">
         <h2 style="font-family:'Outfit';font-size:2.5rem;font-weight:800">Event <span style="color:var(--accent)">Control</span></h2>
         <button class="btn btn-primary" onclick="openCreateEventModal()">+ Create New Event</button>
       </div>
    </div>

    <div id="admin-event-grid-container">
      ${renderAdminSection('Ongoing Events', ongoing, '🔴')}
      ${renderAdminSection('Upcoming Events', upcoming, '📅')}
      ${renderAdminSection('Past Events', past, '⌛')}
      ${!events.length ? '<div class="empty-state"><p>No events created yet.</p></div>' : ''}
    </div>`,
    true, sidebar);
});

function openCreateEventModal() {
  document.getElementById('event-modal-title').textContent = 'Create Event';
  document.getElementById('event-form').reset();
  document.getElementById('ev-id').value = '';
  document.getElementById('ev-registration').checked = true;
  Modal.open('event-modal');
}

function editEvent(eventId) {
  const event = Store.getEvent(eventId);
  if (!event) return;
  document.getElementById('event-modal-title').textContent = 'Edit Event';
  document.getElementById('ev-id').value     = eventId;
  document.getElementById('ev-name').value   = event.name;
  document.getElementById('ev-club').value   = event.club || '';
  document.getElementById('ev-date').value   = event.date;
  document.getElementById('ev-time').value   = event.time;
  document.getElementById('ev-location').value = event.location;
  document.getElementById('ev-desc').value   = event.description;
  document.getElementById('ev-cover').value  = event.coverPhoto || '';
  document.getElementById('ev-logo').value   = event.clubLogo || '';
  document.getElementById('ev-category').value = event.category;
  document.getElementById('ev-seats').value  = event.seatLimit;
  document.getElementById('ev-deadline').value = event.deadline || '';
  document.getElementById('ev-registration').checked = event.registrationOpen;
  
  // NEW FIELDS
  if (document.getElementById('ev-status')) document.getElementById('ev-status').value = event.statusOverride || 'Auto';
  if (document.getElementById('ev-pinned')) document.getElementById('ev-pinned').checked = event.isPinned || false;
  if (document.getElementById('ev-highlight')) document.getElementById('ev-highlight').value = event.highlight || '';
  
  Modal.open('event-modal');
}

async function uploadFile(input, targetId) {
  const file = input.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('image', file);

  try {
    Toast.info('Uploading image…');
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    const path = await res.text();
    // Prepend base URL only if it's a relative path
    const fullPath = path.startsWith('http') ? path : `${window.location.origin}${path}`;
    document.getElementById(targetId).value = fullPath;
    Toast.success('Image uploaded!');
  } catch (e) {
    Toast.error('Upload failed');
    console.error(e);
  }
}

async function uploadMediaHandler(input, targetId, isMultiple = false) {
  const files = input.files;
  if (!files || files.length === 0) return;

  const targetEl = document.getElementById(targetId);
  const isTextarea = targetEl.tagName.toLowerCase() === 'textarea';

  Toast.info(`Uploading ${files.length} file(s)...`);

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const formData = new FormData();
    formData.append('image', file); // Use 'image' to match multer config

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!res.ok) throw new Error('Server upload failed');
      
      const path = await res.text();
      const fullPath = path.startsWith('http') ? path : `${window.location.origin}${path}`;

      if (isTextarea) {
        targetEl.value = targetEl.value ? targetEl.value + '\n' + fullPath : fullPath;
      } else {
        targetEl.value = fullPath;
      }
      Toast.success(`Uploaded: ${file.name}`);
    } catch (e) {
      Toast.error(`Upload failed: ${file.name}`);
      console.error('Upload error:', e);
    }
  }
  input.value = '';
}

function cleanImageUrl(url) {
  if (!url) return '';
  // Handle Google Images links
  if (url.includes('google.com/imgres')) {
    const urlParams = new URLSearchParams(url.split('?')[1]);
    const directUrl = urlParams.get('imgurl');
    if (directUrl) return decodeURIComponent(directUrl);
  }
  return url;
}

async function saveEvent() {
  const id    = document.getElementById('ev-id').value;
  const name  = document.getElementById('ev-name').value.trim();
  const club  = document.getElementById('ev-club').value.trim();
  const date  = document.getElementById('ev-date').value;
  const time  = document.getElementById('ev-time').value;
  const loc   = document.getElementById('ev-location').value.trim();
  const desc  = document.getElementById('ev-desc').value.trim();
  const cat   = document.getElementById('ev-category').value;
  const coverPhoto = cleanImageUrl(document.getElementById('ev-cover').value.trim());
  const clubLogo   = cleanImageUrl(document.getElementById('ev-logo').value.trim());
  const seats = parseInt(document.getElementById('ev-seats').value) || 100;
  const dl    = document.getElementById('ev-deadline').value;
  const open  = document.getElementById('ev-registration').checked;
  const statusOverride = document.getElementById('ev-status')?.value || 'Auto';
  const isPinned = document.getElementById('ev-pinned')?.checked || false;
  const highlight = document.getElementById('ev-highlight')?.value.trim() || '';

  if (!name || !date || !time || !loc || !cat) { Toast.warning('Please fill required fields'); return; }

  // User requested: Changes should only happen when they want it
  if (!confirm(`Are you sure you want to ${id ? 'update' : 'create'} this event?`)) return;

  const emojis = { 
    Tech: '💻', Cultural: '🎭', Sports: '🏏', Workshop: '🔧', Seminar: '🎤', 
    'Music Concert': '🎶', 'DJ Night': '🎧', 'College Fest': '🎡', Gaming: '🎮',
    Other: '📅' 
  };
  const colors  = { 
    Tech: 'linear-gradient(135deg,#0a1628,#1a3a5c)', 
    Cultural: 'linear-gradient(135deg,#1a0a28,#3d1a5c)', 
    'Music Concert': 'linear-gradient(135deg,#3d0a28,#6a1a5c)',
    'DJ Night': 'linear-gradient(135deg,#0a1a3d,#1a3d6a)',
    'College Fest': 'linear-gradient(135deg,#280a1a,#5c1a3d)',
    Gaming: 'linear-gradient(135deg,#0a281a,#1a5c3d)',
    Sports: 'linear-gradient(135deg,#1a1a0a,#3a3a0a)', 
    Workshop: 'linear-gradient(135deg,#1a0a00,#3a2000)', 
    Seminar: 'linear-gradient(135deg,#1a0a1a,#2a1a3a)', 
    Other: 'linear-gradient(135deg,#0a1428,#1a2850)' 
  };

  const eventData = {
    name, club, date, time, location: loc, description: desc, category: cat,
    seatLimit: seats, deadline: dl, registrationOpen: open, coverPhoto, clubLogo,
    isPinned, statusOverride, highlight,
    emoji: emojis[cat] || '📅',
    bannerColor: colors[cat] || 'var(--bg-elevated)',
    organizer: Auth.current()?.name || 'Admin',
    updatedAt: Date.now()
  };

  try {
    if (id) {
      await Store.updateEvent(id, eventData);
      Toast.success('Event updated successfully!');
    } else {
      await Store.addEvent(eventData);
      Toast.success('Event created! Notifying students…');
      notifyAllUsers('New Event Added', `"${name}" has been added. Register before ${formatDate(dl||date)}!`, 'info');
    }
    Modal.close('event-modal');
    Router.render('admin-events');
  } catch (e) {
    Toast.error(e.message || 'Failed to save event');
  }
}

async function deleteEvent(eventId) {
  const event = Store.getEvent(eventId);
  if (!event) return;
  if (!confirm(`Delete "${event.name}"? All registrations will also be removed.`)) return;
  try {
    await Store.deleteEvent(eventId);
    Toast.success('Event deleted');
    Router.render('admin-events');
  } catch (e) { Toast.error(e.message); }
}

// =============================================
// PAGE: ADMIN REGISTRATIONS
// =============================================
Router.register('admin-registrations', () => {
  const regs   = Store.getRegistrations();
  const events = Store.getEvents();

  setPage(`
    <div class="page-header fade-in">
       <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.5rem;font-size:0.75rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.1em">
         <span>Admin</span> <span style="opacity:0.3">/</span> <span style="color:var(--accent)">Registrations</span>
       </div>
       <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem">
         <h2 style="font-family:'Outfit';font-size:2.5rem;font-weight:800">Registration <span style="color:var(--accent)">Vault</span></h2>
         <div style="display:flex;gap:0.75rem">
           <button class="btn btn-secondary" onclick="exportRegistrationsToCSV()" style="box-shadow:0 10px 25px rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.1)">📥 Export to CSV</button>
           <button class="btn btn-primary" onclick="purgeOldRegistrations()" style="background:#ef4444;color:#fff;border-color:#ef4444" title="Remove registrations older than 30 days">🗑️ Clean Up Old Data</button>
         </div>
       </div>
    </div>

    <div class="search-bar fade-in" style="background:rgba(255,255,255,0.03);padding:1.5rem;border-radius:24px;border:1px solid var(--border);backdrop-filter:blur(10px)">
      <div class="search-input-wrap">
        <span class="search-icon">🔍</span>
        <input type="text" class="form-control" id="reg-search" placeholder="Search by name, roll no, or event…" oninput="filterRegistrations()" style="border-radius:12px;background:rgba(0,0,0,0.2)">
      </div>
      <div style="display:flex;gap:1rem;flex-wrap:wrap">
        <select class="form-control" id="reg-filter-event" onchange="filterRegistrations()" style="width:auto;min-width:220px;border-radius:12px;background:rgba(0,0,0,0.2)">
          <option value="">All Events</option>
          ${events.map(e => `<option value="${e.id}">${e.name}</option>`).join('')}
        </select>
        <select class="form-control" id="reg-filter-dept" onchange="filterRegistrations()" style="width:auto;min-width:180px;border-radius:12px;background:rgba(0,0,0,0.2)">
          <option value="">All Departments</option>
          <option>BCA</option>
          <option>BTech CSE</option>
          <option>Nursing</option>
          <option>Pharmacy</option>
          <option>Other</option>
        </select>
      </div>
    </div>

    <div class="card" style="border-radius:24px;overflow:hidden;border:1px solid var(--border)">
      <div class="table-wrap">
        <table id="reg-table">
          <thead>
            <tr>
              <th>Student Name</th>
              <th>Roll Number</th>
              <th>Event Details</th>
              <th>Department</th>
              <th>Category</th>
              <th>Registered At</th>
              <th>Attendance</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="reg-tbody">
            ${buildRegRows(regs)}
          </tbody>
        </table>
      </div>
    </div>`, true, buildAdminSidebar('admin-registrations'));
});

function buildRegRows(regs) {
  if (!regs.length) return `<tr><td colspan="8" style="text-align:center;padding:4rem;color:var(--text-muted)">No registrations found matching the criteria.</td></tr>`;
  return regs.map(r => {
    const event = Store.getEvent(r.eventId);
    let dateStr = '—';
    if (r.timestamp && r.timestamp.seconds) {
       dateStr = new Date(r.timestamp.seconds * 1000).toLocaleDateString('en-IN');
    } else if (r.registeredAt) {
       dateStr = new Date(r.registeredAt).toLocaleDateString('en-IN');
    }
    
    return `
    <tr class="fade-in">
      <td>
        <div style="font-weight:700;color:#fff">${r.userName}</div>
        <div class="text-xs text-muted">${r.email || ''}</div>
      </td>
      <td><code style="background:rgba(255,255,255,0.05);padding:0.2rem 0.4rem;border-radius:4px;font-size:0.8rem">${r.roll || '—'}</code></td>
      <td>
        <div style="font-weight:600;color:var(--text-secondary)">${event ? event.name : 'Unknown'}</div>
        <div class="text-xs text-muted" style="text-transform:uppercase;letter-spacing:0.05em">${event ? event.category : '—'}</div>
      </td>
      <td><span class="badge badge-neutral" style="opacity:0.8">${r.department}</span></td>
      <td><span class="badge ${r.category === 'Hosteller' ? 'badge-warning' : 'badge-info'}">${r.category}</span></td>
      <td class="text-sm" style="color:var(--text-muted)">${dateStr}</td>
      <td>
        <span class="badge ${r.attended ? 'badge-success' : 'badge-neutral'}" style="padding:0.5rem 1rem;border-radius:20px;font-weight:900">
          ${r.attended ? '✅ PRESENT' : '⏳ ABSENT'}
        </span>
      </td>
      <td>
        <div style="display:flex;gap:0.5rem">
          ${!r.attended ? `
            <button class="btn btn-primary btn-sm" onclick="markPresent('${r.id}')" title="Mark Attendance" style="padding:0.5rem">
              ✅
            </button>` : ''}
          <button class="btn btn-secondary btn-sm" onclick="generateCertificate('${r.id}')" title="Generate Certificate" style="padding:0.5rem;display:flex;align-items:center;gap:0.3rem">
            📜 <span class="text-xs">CERT</span>
          </button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

function filterRegistrations() {
  const q       = (document.getElementById('reg-search')?.value || '').toLowerCase();
  const eventId = document.getElementById('reg-filter-event')?.value || '';
  const dept    = document.getElementById('reg-filter-dept')?.value || '';
  let regs = Store.getRegistrations();
  if (eventId) regs = regs.filter(r => r.eventId === eventId);
  if (dept) regs = regs.filter(r => r.department === dept);
  if (q) regs = regs.filter(r => r.userName.toLowerCase().includes(q) || (Store.getEvent(r.eventId)?.name||'').toLowerCase().includes(q) || (r.roll||'').toLowerCase().includes(q));
  const tbody = document.getElementById('reg-tbody');
  if (tbody) tbody.innerHTML = buildRegRows(regs);
}

async function markPresent(regId) {
  try {
    await Store.markAttendance(regId);
    Toast.success('Attendance marked!');
    filterRegistrations();
  } catch (e) { Toast.error(e.message); }
}

function exportRegistrationsToCSV() {
  const regs = Store.getRegistrations();
  if (!regs.length) { Toast.info('No registrations to export'); return; }

  const headers = ['Name', 'Email', 'Roll Number', 'Department', 'Year', 'Category', 'Event', 'Registration Time', 'Attendance'];
  const rows = regs.map(r => {
    const event = Store.getEvent(r.eventId);
    const regDate = r.timestamp ? new Date(r.timestamp.seconds * 1000) : (r.registeredAt ? new Date(r.registeredAt) : new Date());
    return [
      `"${r.userName}"`,
      `"${r.email || '—'}"`,
      `"${r.roll || '—'}"`,
      `"${r.department || '—'}"`,
      `"${r.year || '—'}"`,
      `"${r.category || '—'}"`,
      `"${event ? event.name : 'Unknown'}"`,
      `"${regDate.toLocaleString()}"`,
      `"${r.attended ? 'Present' : 'Absent'}"`
    ];
  });

  let csvContent = "data:text/csv;charset=utf-8," 
    + headers.join(",") + "\n"
    + rows.map(e => e.join(",")).join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `registrations_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  Toast.success('Registrations exported successfully!');
}

async function purgeOldRegistrations() {
  const regs = Store.getRegistrations();
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  
  const oldRegs = regs.filter(r => {
    // Check timestamp (could be Firebase serverTimestamp or JS date)
    const regDate = r.timestamp?.seconds 
      ? (r.timestamp.seconds * 1000) 
      : (r.registeredAt ? new Date(r.registeredAt).getTime() : Date.now());
    return regDate < thirtyDaysAgo;
  });

  if (!oldRegs.length) {
    Toast.info('No registrations older than 1 month found.');
    return;
  }

  if (!confirm(`Found ${oldRegs.length} registration(s) older than 1 month.\\n\\nWe strongly recommend exporting a CSV backup first. Proceed to delete them?`)) {
    return;
  }

  // Backup first automatically
  exportRegistrationsToCSV();
  
  Toast.info(`Deleting ${oldRegs.length} old registration(s)...`);
  
  try {
    for (const reg of oldRegs) {
      await Store.deleteRegistration(reg.id || reg._id);
    }
    Toast.success('Cleanup complete!');
    Router.render('admin-registrations');
  } catch (e) {
    Toast.error('Failed during cleanup: ' + e.message);
  }
}

// =============================================
// PAGE: QR SCANNER
// =============================================
Router.register('scanner', () => {
  const sidebar = Auth.current()?.role === 'admin' ? buildAdminSidebar('scanner') : buildStudentSidebar('scanner');
  setPage(`
    <div class="page-header">
      <h2>QR Code Scanner</h2>
      <div class="breadcrumb"><span>Admin</span> / Scanner</div>
    </div>
    <div style="max-width:480px;margin:0 auto">
      <div class="card" style="margin-bottom:1.25rem">
        <p class="text-sm text-muted mb-2">Point the camera at a student's QR code to mark attendance automatically.</p>
        <div class="scanner-box" id="scanner-box">
          <video id="scanner-video" style="width:100%;height:100%;object-fit:cover" autoplay muted playsinline></video>
          <div class="scanner-overlay">
            <div class="scanner-frame"></div>
            <div class="scan-line"></div>
          </div>
        </div>
        <div style="display:flex;gap:0.75rem;margin-top:1rem">
          <button class="btn btn-primary" id="start-scan-btn" onclick="startScanner()">📷 Start Camera</button>
          <button class="btn btn-ghost" id="stop-scan-btn" onclick="stopScanner()" style="display:none">🛑 Stop</button>
        </div>
      </div>

      <!-- Manual entry fallback -->
      <div class="card">
        <div class="card-title mb-2">Manual Registration ID Entry</div>
        <div style="display:flex;gap:0.75rem">
          <input type="text" class="form-control" id="manual-reg-id" placeholder="Enter Roll No or Registration ID…">
          <button class="btn btn-primary" onclick="manualScan()">✓ Verify</button>
        </div>
      </div>

      <!-- Scan Result -->
      <div id="scan-result" style="display:none;margin-top:1.25rem"></div>
    </div>`, true, sidebar);
});

let scannerStream = null;
let scannerInterval = null;

async function startScanner() {
  try {
    scannerStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    const video = document.getElementById('scanner-video');
    video.srcObject = scannerStream;
    document.getElementById('start-scan-btn').style.display = 'none';
    document.getElementById('stop-scan-btn').style.display = '';

    // Use jsQR for decoding (loaded via CDN)
    const canvas = document.createElement('canvas');
    const ctx    = canvas.getContext('2d');

    scannerInterval = setInterval(() => {
      if (video.readyState !== video.HAVE_ENOUGH_DATA) return;
      canvas.width  = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, canvas.width, canvas.height);
      if (code) {
        stopScanner();
        processQRScan(code.data);
      }
    }, 500);
  } catch (err) {
    Toast.error('Camera access denied. Use manual entry below.');
  }
}

function stopScanner() {
  if (scannerStream) { scannerStream.getTracks().forEach(t => t.stop()); scannerStream = null; }
  clearInterval(scannerInterval);
  document.getElementById('start-scan-btn').style.display = '';
  document.getElementById('stop-scan-btn').style.display = 'none';
}

function processQRScan(data) {
  try {
    const qrData = JSON.parse(data);
    const regId  = qrData.regId;
    showScanResult(regId);
  } catch {
    // Maybe direct regId
    showScanResult(data);
  }
}

function manualScan() {
  const id = document.getElementById('manual-reg-id').value.trim();
  if (!id) { Toast.warning('Please enter a Registration ID'); return; }
  showScanResult(id);
}

function showScanResult(regId) {
  const reg   = Store.findRegistrationById(regId);
  const div   = document.getElementById('scan-result');
  div.style.display = 'block';

  if (!reg) {
    div.innerHTML = `
      <div class="card" style="border-color:var(--red);border-left-width:4px">
        <div style="font-size:2rem;text-align:center;margin-bottom:0.5rem">❌</div>
        <div style="text-align:center;font-weight:700;color:var(--red)">Invalid QR Code</div>
        <div class="text-sm text-muted text-center mt-1">Registration not found: ${regId}</div>
      </div>`;
    Toast.error('Invalid QR Code');
    return;
  }

  const event = Store.getEvent(reg.eventId);

  if (reg.attended) {
    div.innerHTML = `
      <div class="card" style="border-color:var(--accent);border-left-width:4px">
        <div style="font-size:2rem;text-align:center;margin-bottom:0.5rem">⚠️</div>
        <div style="text-align:center;font-weight:700;color:var(--accent)">Already Scanned</div>
        <div class="text-sm text-muted text-center mt-1">${reg.userName} already attended ${event?.name}</div>
      </div>`;
    Toast.warning('Already attended!');
    return;
  }

  Store.markAttendance(regId);
  div.innerHTML = `
    <div class="card" style="border-color:var(--green);border-left-width:4px">
      <div style="font-size:2.5rem;text-align:center;margin-bottom:0.75rem">✅</div>
      <h3 style="text-align:center;color:var(--green);margin-bottom:1rem">Entry Approved!</h3>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem">
        <div class="card" style="padding:0.75rem"><div class="text-xs text-muted">Student</div><div style="font-weight:700">${reg.userName}</div></div>
        <div class="card" style="padding:0.75rem"><div class="text-xs text-muted">Department</div><div style="font-weight:700">${reg.department}</div></div>
        <div class="card" style="padding:0.75rem"><div class="text-xs text-muted">Category</div><div style="font-weight:700">${reg.category}</div></div>
        <div class="card" style="padding:0.75rem"><div class="text-xs text-muted">Event</div><div style="font-weight:700">${event?.name||'—'}</div></div>
      </div>
    </div>`;
  Toast.success(`Welcome, ${reg.userName}! ✅`);
}

// =============================================
// PAGE: AI INSIGHTS
// =============================================
Router.register('ai-insights', () => {
  const events = Store.getEvents();
  const regs   = Store.getRegistrations();

  // --- Compute insights ---
  // 1. Category by time preference
  const nightEvents = events.filter(e => { const h = parseInt(e.time?.split(':')[0]||0); return h >= 17; });
  const hostNight   = nightEvents.map(e => Store.getRegistrationsByEvent(e.id).filter(r=>r.category==='Hosteller').length).reduce((a,b)=>a+b,0);
  const dayNight    = nightEvents.map(e => Store.getRegistrationsByEvent(e.id).filter(r=>r.category==='Day Scholar').length).reduce((a,b)=>a+b,0);

  // 2. Best category engagement
  const cats = ['Tech','Cultural','Music Concert','DJ Night','College Fest','Gaming','Sports','Workshop','Seminar','Other'];
  const catEngagement = cats.map(cat => {
    const catEvents = events.filter(e => e.category === cat);
    const totalSeats = catEvents.reduce((s,e) => s + e.seatLimit, 0) || 1;
    const totalRegs  = catEvents.reduce((s,e) => s + Store.getRegistrationsByEvent(e.id).length, 0);
    return { cat, rate: totalSeats ? Math.round((totalRegs/totalSeats)*100) : 0 };
  }).sort((a,b) => b.rate - a.rate);

  // 3. Best day for events
  const dayCount = {};
  regs.forEach(r => {
    const event = Store.getEvent(r.eventId);
    if (!event) return;
    const day = new Date(event.date).toLocaleDateString('en-US', { weekday: 'long' });
    dayCount[day] = (dayCount[day] || 0) + 1;
  });
  const bestDay = Object.entries(dayCount).sort((a,b) => b[1]-a[1])[0];

  // 4. Suggestions
  const suggestions = [
    { emoji: '🌙', title: 'Hostellers Prefer Night Events', body: `Night events (after 5 PM) get ${hostNight > dayNight ? 'more Hosteller' : 'more Day Scholar'} registrations (${hostNight} vs ${dayNight}). Schedule major events accordingly.` },
    { emoji: '💻', title: `${catEngagement[0]?.cat || 'Tech'} Events Have Highest Engagement`, body: `${catEngagement[0]?.cat} events have a ${catEngagement[0]?.rate || 0}% fill rate — the highest across all categories. Prioritize this type.` },
    { emoji: '📅', title: `Best Day: ${bestDay?.[0] || 'Saturday'}`, body: `${bestDay?.[0] || 'Saturday'} sees the highest registration activity with ${bestDay?.[1] || 0} sign-ups. Schedule popular events on this day.` },
    { emoji: '🪑', title: 'Optimal Seat Count', body: `Events with 80–120 seats fill up faster (creating urgency). Consider splitting large events into multiple sessions.` },
    { emoji: '⏰', title: 'Registration Deadline Strategy', body: `Events with deadlines 3–5 days before the event date see 40% more last-minute sign-ups due to urgency.` },
    { emoji: '🎯', title: 'Day Scholar Outreach', body: `Day scholars represent ${Math.round((regs.filter(r=>r.category==='Day Scholar').length/Math.max(regs.length,1))*100)}% of registrations. Increase daytime event frequency to boost their engagement.` }
  ];

  setPage(`
    <div class="page-header">
      <h2>AI Insights</h2>
      <div class="breadcrumb"><span>Admin</span> / AI Insights</div>
    </div>
    <div class="card" style="margin-bottom:1.5rem;border-color:rgba(240,165,0,0.3)">
      <div style="display:flex;gap:1rem;align-items:flex-start">
        <div style="font-size:2.5rem">🤖</div>
        <div>
          <h3 style="margin-bottom:0.25rem">Event Intelligence Engine</h3>
          <p class="text-sm">Analyzing ${events.length} events and ${regs.length} registrations to surface actionable patterns.</p>
        </div>
      </div>
    </div>

    <!-- Engagement Chart -->
    <div class="grid-2" style="margin-bottom:1.5rem">
      <div class="card">
        <div class="card-title mb-2">Category Engagement Rate</div>
        <div class="chart-wrap"><canvas id="chart-engagement"></canvas></div>
      </div>
      <div class="card">
        <div class="card-title mb-2">Day Scholar vs Hosteller by Event Type</div>
        <div class="chart-wrap"><canvas id="chart-split"></canvas></div>
      </div>
    </div>

    <!-- Insight Cards -->
    <div class="card-title mb-2">AI Recommendations</div>
    <div style="display:flex;flex-direction:column;gap:0.75rem;margin-bottom:1.5rem">
      ${suggestions.map(s => `
        <div class="insight-card">
          <div class="insight-icon">${s.emoji}</div>
          <div class="insight-text">
            <strong>${s.title}</strong>
            <p>${s.body}</p>
          </div>
        </div>`).join('')}
    </div>

    <!-- Recommendations -->
    <div class="card" style="border-color:rgba(92,158,255,0.3)">
      <div class="card-title mb-2">📋 Suggested Next Events</div>
      <div style="display:flex;flex-direction:column;gap:0.5rem">
        ${['Night Coding Contest (Hostellers, 8 PM)', 'Tech Talk: Cloud Computing (Lunch slot)', 'Sports Day (Saturday morning)', 'AI Workshop (Limit 40 seats for exclusivity)'].map(s => `
          <div style="display:flex;align-items:center;gap:0.75rem;padding:0.65rem 1rem;background:var(--bg-elevated);border-radius:var(--radius-sm)">
            <span>💡</span><span class="text-sm">${s}</span>
          </div>`).join('')}
      </div>
    </div>`, true, buildAdminSidebar('ai-insights'));

  requestAnimationFrame(() => { requestAnimationFrame(() => {
    const cats = ['Tech','Cultural','Sports','Workshop','Seminar','Other'];

    const engCtx = document.getElementById('chart-engagement');
    if (engCtx) new Chart(engCtx, {
      type: 'bar',
      data: {
        labels: catEngagement.map(c => c.cat),
        datasets: [{ label: 'Fill Rate %', data: catEngagement.map(c => c.rate), backgroundColor: ['#f0a500','#5c9eff','#3ddc84','#a78bfa','#ff4d6d','#8891a8'], borderRadius: 6, borderWidth: 0 }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { max: 100, ticks: { color: '#8891a8', callback: v => v + '%' }, grid: { color: '#252a38' } }, x: { ticks: { color: '#8891a8' }, grid: { display: false } } } }
    });

    const splitCtx = document.getElementById('chart-split');
    if (splitCtx) new Chart(splitCtx, {
      type: 'bar',
      data: {
        labels: cats,
        datasets: [
          { label: 'Day Scholar', data: cats.map(c => { const evts = events.filter(e=>e.category===c); return evts.reduce((s,e)=>s+Store.getRegistrationsByEvent(e.id).filter(r=>r.category==='Day Scholar').length, 0); }), backgroundColor: '#5c9effcc', borderRadius: 4, borderWidth: 0 },
          { label: 'Hosteller',   data: cats.map(c => { const evts = events.filter(e=>e.category===c); return evts.reduce((s,e)=>s+Store.getRegistrationsByEvent(e.id).filter(r=>r.category==='Hosteller').length, 0); }), backgroundColor: '#f0a500cc', borderRadius: 4, borderWidth: 0 }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#8891a8', boxWidth: 12 } } }, scales: { y: { ticks: { color: '#8891a8', stepSize: 1 }, grid: { color: '#252a38' } }, x: { ticks: { color: '#8891a8' }, grid: { display: false } } } }
    });
  }); });
});

// =============================================
// PAGE: ATTENDANCE (admin)
// =============================================
Router.register('attendance', () => {
  const events = Store.getEvents();
  setPage(`
    <div class="page-header">
      <h2>Attendance Overview</h2>
      <div class="breadcrumb"><span>Admin</span> / Attendance</div>
    </div>
    <div style="display:flex;flex-direction:column;gap:1.25rem">
      ${events.map(e => {
        const regs = Store.getRegistrationsByEvent(e.id);
        const att  = regs.filter(r => r.attended).length;
        const pct  = regs.length ? Math.round((att/regs.length)*100) : 0;
        return `
          <div class="card">
            <div class="card-header">
              <div style="display:flex;align-items:center;gap:0.75rem">
                <span style="font-size:1.75rem">${e.emoji||'📅'}</span>
                <div>
                  <div class="card-title">${e.name}</div>
                  <div class="text-xs text-muted">${formatDate(e.date)}</div>
                </div>
              </div>
              <div style="text-align:right">
                <div style="font-family:var(--font-display);font-size:1.5rem;font-weight:800;color:${pct>=70?'var(--green)':pct>=40?'var(--accent)':'var(--red)'}">${pct}%</div>
                <div class="text-xs text-muted">${att} / ${regs.length} attended</div>
              </div>
            </div>
            <div style="height:6px;background:var(--border);border-radius:3px;overflow:hidden">
              <div style="height:100%;width:${pct}%;background:${pct>=70?'var(--green)':pct>=40?'var(--accent)':'var(--red)'};border-radius:3px;transition:width 0.6s ease"></div>
            </div>
          </div>`;
      }).join('')}
    </div>`, true, buildAdminSidebar('attendance'));
});

// =============================================
// PAGE: STUDENT DASHBOARD
// =============================================
Router.register('student-dashboard', () => {
  const user   = Auth.current();
  if (!user) { Router.navigate('login'); return; }

  const regs   = Store.getRegistrationsByUser(user.id);
  const events = Store.getEvents();
  const sidebar = buildStudentSidebar('student-dashboard');

  const attended  = regs.filter(r => r.attended);
  const upcoming  = regs.filter(r => {
    const ev = Store.getEvent(r.eventId);
    return ev && !isPast(ev.date);
  });
  const attRate = regs.length ? Math.round((attended.length / regs.length) * 100) : 0;

  // Category breakdown
  const catMap = {};
  regs.forEach(r => {
    const ev = Store.getEvent(r.eventId);
    if (ev) catMap[ev.category] = (catMap[ev.category] || 0) + 1;
  });
  const maxCat = Math.max(...Object.values(catMap), 1);
  const catBars = Object.entries(catMap).sort((a,b) => b[1]-a[1]).map(([cat, cnt]) => `
    <div class="interest-bar-item">
      <div class="interest-bar-label">${cat}</div>
      <div class="interest-bar-track">
        <div class="interest-bar-fill" style="width:${Math.round((cnt/maxCat)*100)}%"></div>
      </div>
      <div class="interest-bar-count">${cnt}</div>
    </div>`).join('') || `<div class="text-sm text-muted">Register for events to see your interests!</div>`;

  // Activity timeline — last 5 registrations
  const timelineItems = [...regs].reverse().slice(0, 6).map(reg => {
    const ev = Store.getEvent(reg.eventId);
    if (!ev) return '';
    const isUpcoming = !isPast(ev.date);
    const dotClass = reg.attended ? 'attended' : isUpcoming ? 'upcoming' : 'missed';
    const dotEmoji = reg.attended ? '✅' : isUpcoming ? '⏳' : '⌛';
    const statusLabel = reg.attended ? 'Attended' : isUpcoming ? 'Upcoming' : 'Missed';
    const statusColor = reg.attended ? 'var(--green)' : isUpcoming ? 'var(--accent)' : 'var(--text-muted)';
    return `
      <div class="timeline-item">
        <div class="timeline-dot ${dotClass}">${dotEmoji}</div>
        <div class="timeline-body">
          <div class="timeline-title">${ev.name}</div>
          <div class="timeline-meta">
            <span>📅 ${formatDate(ev.date)}</span>
            <span>📍 ${ev.location}</span>
            <span style="color:${statusColor};font-weight:700">${statusLabel}</span>
          </div>
          <div style="display:flex;gap:0.5rem;margin-top:0.75rem">
            <button class="quick-pill" onclick="viewEvent('${ev.id}')">👁 View Event</button>
            ${isUpcoming ? `<button class="quick-pill" onclick="viewMyRegistration('${ev.id}')">🎫 My QR</button>` : ''}
            ${reg.attended ? `<button class="quick-pill" onclick="generateCertificate('${reg.id}')">📜 Certificate</button>` : ''}
          </div>
        </div>
      </div>`;
  }).join('') || `<div class="empty-state"><div class="empty-icon">🎯</div><p>No activity yet. Register for an event!</p><button class="btn btn-primary mt-2" onclick="Router.navigate('events')">Browse Events</button></div>`;

  setPage(`
    <!-- HERO WELCOME -->
    <div class="student-dash-hero fade-in">
      <div class="student-avatar-lg">${user.name.charAt(0).toUpperCase()}</div>
      <div style="flex:1;position:relative;z-index:1">
        <div style="font-size:0.7rem;font-weight:800;color:var(--accent);letter-spacing:0.2em;text-transform:uppercase;margin-bottom:0.5rem">Student Dashboard</div>
        <h2 style="font-family:'Outfit';font-size:2.25rem;font-weight:800;margin-bottom:0.5rem">Welcome back, ${user.name.split(' ')[0]}! 👋</h2>
        <p style="color:var(--text-secondary);font-size:0.95rem">${user.department || ''} ${user.category ? '· ' + user.category : ''}</p>
        <div class="quick-actions">
          <button class="quick-pill" onclick="Router.navigate('events')">🗓 Browse Events</button>
          <button class="quick-pill" onclick="Router.navigate('saved-events')">❤️ Saved (${Bookmarks.count()})</button>
          <button class="quick-pill" onclick="Router.navigate('my-events')">🎫 My Tickets</button>
          <button class="quick-pill" onclick="Router.navigate('trending')">🔥 Trending</button>
        </div>
      </div>
    </div>

    <!-- STAT CARDS -->
    <div class="stats-grid stagger" style="grid-template-columns:repeat(4,1fr);margin-bottom:2.5rem">
      <div class="stat-card accent">
        <div class="stat-value">${regs.length}</div>
        <div class="stat-label">Registered</div>
        <div class="stat-icon">🎫</div>
      </div>
      <div class="stat-card green">
        <div class="stat-value">${attended.length}</div>
        <div class="stat-label">Attended</div>
        <div class="stat-icon">✅</div>
      </div>
      <div class="stat-card blue">
        <div class="stat-value">${upcoming.length}</div>
        <div class="stat-label">Upcoming</div>
        <div class="stat-icon">📅</div>
      </div>
      <div class="stat-card purple">
        <div class="stat-value">${attRate}%</div>
        <div class="stat-label">Attendance Rate</div>
        <div class="stat-icon">📊</div>
      </div>
    </div>

    <!-- GRID: TIMELINE + INTERESTS -->
    <div class="grid-2" style="margin-bottom:2.5rem">
      <div class="card">
        <div class="card-header">
          <div class="card-title">🕐 Activity Timeline</div>
          <button class="btn btn-ghost btn-sm" onclick="Router.navigate('my-events')">View All →</button>
        </div>
        <div class="timeline">${timelineItems}</div>
      </div>

      <div>
        <div class="card" style="margin-bottom:1.5rem">
          <div class="card-header"><div class="card-title">🎯 Event Interests</div></div>
          <div class="interest-bar-wrap">${catBars}</div>
        </div>
        <div class="card">
          <div class="card-header"><div class="card-title">📈 Participation Overview</div></div>
          <div class="chart-wrap" style="height:180px"><canvas id="dash-chart"></canvas></div>
        </div>
      </div>
    </div>
  `, true, sidebar);

  // Render mini chart
  requestAnimationFrame(() => {
    const ctx = document.getElementById('dash-chart');
    if (ctx && typeof Chart !== 'undefined') {
      new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Attended', 'Upcoming', 'Missed'],
          datasets: [{
            data: [
              attended.length,
              upcoming.length,
              Math.max(0, regs.length - attended.length - upcoming.length)
            ],
            backgroundColor: ['#22c55e', '#fbbf24', '#3f3f46'],
            borderWidth: 0,
            hoverOffset: 8
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false, cutout: '68%',
          plugins: {
            legend: { labels: { color: '#8891a8', font: { family: 'DM Sans', size: 11 }, boxWidth: 10 } }
          }
        }
      });
    }
  });
});

// =============================================
// PAGE: SAVED EVENTS
// =============================================
Router.register('saved-events', () => {
  const sidebar = buildStudentSidebar('saved-events');
  const savedIds = Bookmarks.getAll();
  const savedEvents = savedIds.map(id => Store.getEvent(id)).filter(Boolean);

  const content = savedEvents.length
    ? `<div class="event-grid">${savedEvents.map(e => renderEventCard(e)).join('')}</div>`
    : `<div class="saved-empty fade-in">
        <div class="saved-empty-icon">❤️</div>
        <h3 style="font-family:'Outfit';font-size:1.75rem;font-weight:800;margin-bottom:1rem">No Saved Events Yet</h3>
        <p style="color:var(--text-secondary);max-width:400px;margin:0 auto 2rem">
          Tap the 🤍 heart icon on any event card to save it for later.
        </p>
        <button class="btn btn-primary" onclick="Router.navigate('events')">Explore Events →</button>
      </div>`;

  setPage(`
    <div class="page-header">
      <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.5rem;font-size:0.75rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.1em">
        <span>Student</span> <span style="opacity:0.3">/</span> <span style="color:var(--accent)">Saved Events</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem">
        <h2 style="font-family:'Outfit';font-size:2.5rem;font-weight:800">Saved <span style="color:var(--accent)">Events</span></h2>
        ${savedEvents.length ? `<span class="section-count">${savedEvents.length} Saved</span>` : ''}
      </div>
    </div>
    ${content}
  `, true, sidebar);
});

// =============================================
// PAGE: TRENDING
// =============================================
Router.register('trending', () => {
  const sidebar = buildStudentSidebar('trending');
  const allEvents = Store.getEvents();

  // Rank events by registration count
  const ranked = allEvents
    .map(e => ({ ...e, regCount: Store.getRegistrationsByEvent(e.id).length }))
    .filter(e => {
      // Only show open or upcoming events in trending
      const now = new Date(); now.setHours(0,0,0,0);
      const eDate = new Date(e.date); eDate.setHours(0,0,0,0);
      return eDate >= now;
    })
    .sort((a, b) => b.regCount - a.regCount);

  const topEvents = ranked.slice(0, 8);

  // Category heat map
  const catCounts = {};
  allEvents.forEach(ev => {
    catCounts[ev.category] = (catCounts[ev.category] || 0) + Store.getRegistrationsByEvent(ev.id).length;
  });
  const sortedCats = Object.entries(catCounts).sort((a,b) => b[1]-a[1]);
  const maxCatCount = Math.max(...Object.values(catCounts), 1);

  const trendingCards = topEvents.length ? topEvents.map((e, i) => `
    <div class="card fade-in" style="display:flex;gap:1.5rem;align-items:center;padding:1.5rem 2rem;cursor:pointer;transition:var(--transition)" onclick="viewEvent('${e.id}')">
      <div style="font-size:2.5rem;font-weight:900;font-family:'Outfit';color:${i===0?'var(--accent)':i===1?'#a78bfa':i===2?'#3b82f6':'var(--text-muted)'};width:48px;text-align:center;flex-shrink:0">#${i+1}</div>
      <div style="font-size:2.25rem;flex-shrink:0">${e.emoji||'📅'}</div>
      <div style="flex:1;min-width:0">
        <div style="font-family:'Outfit';font-weight:800;font-size:1.1rem;margin-bottom:0.3rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${e.name}</div>
        <div style="display:flex;gap:0.75rem;font-size:0.8rem;color:var(--text-muted);flex-wrap:wrap">
          <span>📅 ${formatDate(e.date)}</span>
          <span>📍 ${e.location}</span>
          <span class="badge ${getCategoryBadgeClass(e.category)}">${e.category}</span>
        </div>
      </div>
      <div style="text-align:right;flex-shrink:0">
        <div style="font-family:'Outfit';font-size:1.75rem;font-weight:800;color:var(--accent)">${e.regCount}</div>
        <div style="font-size:0.7rem;color:var(--text-muted);font-weight:700;text-transform:uppercase;letter-spacing:0.08em">Registrations</div>
        ${i < 3 ? `<div style="font-size:0.65rem;background:linear-gradient(135deg,#ef4444,#f97316);color:#fff;padding:0.2rem 0.6rem;border-radius:20px;margin-top:0.5rem;font-weight:900;letter-spacing:0.05em">🔥 HOT</div>` : ''}
      </div>
    </div>`).join('')
    : `<div class="empty-state"><div class="empty-icon">🔥</div><p>No upcoming events to trend yet. Check back soon!</p></div>`;

  setPage(`
    <div class="page-header fade-in">
      <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.5rem;font-size:0.75rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.1em">
        <span>Student</span> <span style="opacity:0.3">/</span> <span style="color:#ef4444">Trending</span>
      </div>
      <h2 style="font-family:'Outfit';font-size:2.5rem;font-weight:800">🔥 Trending <span style="color:var(--accent)">Events</span></h2>
      <p style="color:var(--text-secondary);margin-top:0.5rem">Live-ranked by registration popularity</p>
    </div>

    <!-- CATEGORY HEAT MAP -->
    <div class="card fade-in" style="margin-bottom:2rem">
      <div class="card-header"><div class="card-title">🌡 Category Heatmap</div></div>
      <div class="interest-bar-wrap">
        ${sortedCats.map(([cat, cnt]) => `
          <div class="interest-bar-item">
            <div class="interest-bar-label">${cat}</div>
            <div class="interest-bar-track">
              <div class="interest-bar-fill" style="width:${Math.round((cnt/maxCatCount)*100)}%;background:${cnt===maxCatCount?'linear-gradient(90deg,#ef4444,#f97316)':'var(--accent-gradient)'}"></div>
            </div>
            <div class="interest-bar-count">${cnt}</div>
          </div>`).join('')}
      </div>
    </div>

    <!-- TRENDING LIST -->
    <div class="card-header" style="margin-bottom:1.5rem">
      <div class="card-title" style="font-size:1.5rem">🏆 Top Events Leaderboard</div>
      <span class="section-count">${topEvents.length} Events</span>
    </div>
    <div style="display:flex;flex-direction:column;gap:0.75rem">${trendingCards}</div>
  `, true, sidebar);
});

// =============================================
// HIGHLIGHTS GALLERY VIEWER (Photos + Videos)
// =============================================
let _hlPhotos = [];
let _hlIndex  = 0;
let _hlTimer  = null;

// Detect if a URL points to a video file
function isVideoUrl(url) {
  return /\.(mp4|webm|ogg|ogv|mov|avi|mkv)(\?.*)?$/i.test(url);
}

function openHighlightsGallery(highlightId) {
  const hl = Store.getHighlight(highlightId);
  if (!hl) return;

  _hlPhotos = (hl.photos || []).filter(Boolean);
  if (!_hlPhotos.length) {
    Toast.info('No media in this highlight yet.');
    return;
  }
  _hlIndex = 0;

  // Populate header
  document.getElementById('hl-gallery-title').textContent = hl.title || '';
  document.getElementById('hl-gallery-desc').textContent  = hl.description || '';
  const avatar = document.getElementById('hl-gallery-avatar');
  if (hl.coverImage) {
    avatar.style.backgroundImage = `url('${hl.coverImage}')`;
    avatar.textContent = '';
  } else {
    avatar.style.backgroundImage = '';
    avatar.textContent = '✨';
  }

  // Build progress bar segments
  const bar = document.getElementById('hl-progress-bar');
  bar.innerHTML = _hlPhotos.map((_, i) =>
    `<div style="flex:1;height:3px;border-radius:2px;background:rgba(255,255,255,0.25);overflow:hidden">
       <div id="hlp-${i}" style="height:100%;width:0%;background:#fff;transition:width 0.1s linear"></div>
     </div>`
  ).join('');

  // Use the CSS modal system to show the overlay
  Modal.open('highlights-gallery-overlay');
  hlShowMedia(0);
}

function hlShowMedia(idx) {
  if (idx < 0 || idx >= _hlPhotos.length) return;
  _hlIndex = idx;
  clearInterval(_hlTimer);

  const url       = _hlPhotos[idx];
  const container = document.getElementById('hl-media-container');
  const badge     = document.getElementById('hl-video-badge');
  const seg       = document.getElementById(`hlp-${idx}`);

  document.getElementById('hl-counter').textContent = `${idx + 1} / ${_hlPhotos.length}`;

  // Reset all progress bars
  _hlPhotos.forEach((_, i) => {
    const s = document.getElementById(`hlp-${i}`);
    if (s) s.style.width = i < idx ? '100%' : '0%';
  });

  if (isVideoUrl(url)) {
    // ── VIDEO SLIDE ──
    badge.style.display = 'flex';
    container.innerHTML = `
      <video id="hl-video" src="${url}"
        style="width:100%;height:100%;object-fit:cover"
        autoplay muted playsinline
        preload="auto">
      </video>`;

    const vid = document.getElementById('hl-video');

    // Sync progress bar with video duration
    vid.addEventListener('loadedmetadata', () => {
      // Nothing needed — timeupdate drives the bar
    });
    vid.addEventListener('timeupdate', () => {
      if (!vid.duration || !seg) return;
      const pct = (vid.currentTime / vid.duration) * 100;
      seg.style.width = Math.min(pct, 100) + '%';
    });
    vid.addEventListener('ended', () => {
      if (seg) seg.style.width = '100%';
      hlNavPhoto(1); // Auto-advance when video ends
    });
    vid.addEventListener('error', () => {
      // If video fails to load, fall through to show placeholder and advance
      setTimeout(() => hlNavPhoto(1), 2000);
    });
  } else {
    // ── IMAGE SLIDE ──
    badge.style.display = 'none';
    container.innerHTML = `<img src="${url}" alt="" style="width:100%;height:100%;object-fit:cover">`;

    // 4-second auto-advance for images
    if (seg) {
      let pct = 0;
      _hlTimer = setInterval(() => {
        pct += 100 / 40; // 40 ticks × 100ms = 4s
        seg.style.width = Math.min(pct, 100) + '%';
        if (pct >= 100) {
          clearInterval(_hlTimer);
          hlNavPhoto(1);
        }
      }, 100);
    }
  }
}

function hlNavPhoto(dir) {
  // Stop any playing video before switching
  const vid = document.getElementById('hl-video');
  if (vid) { vid.pause(); }

  const next = _hlIndex + dir;
  if (next < 0) return;
  if (next >= _hlPhotos.length) {
    closeHighlightsGallery();
    return;
  }
  hlShowMedia(next);
}

function closeHighlightsGallery(e) {
  // If called from overlay click, only close when clicking the backdrop itself
  if (e && e.target !== document.getElementById('highlights-gallery-overlay')) return;
  clearInterval(_hlTimer);
  // Stop any playing video
  const vid = document.getElementById('hl-video');
  if (vid) { vid.pause(); }
  Modal.close('highlights-gallery-overlay');
  document.body.style.overflow = '';
}

// =============================================
// HIGHLIGHT MODAL (ADMIN CREATE/EDIT)
// =============================================
function openHighlightModal(id = null) {
  document.getElementById('hl-id').value    = id || '';
  document.getElementById('hl-title').value = '';
  document.getElementById('hl-cover').value = '';
  document.getElementById('hl-desc').value  = '';
  document.getElementById('hl-photos').value = '';
  document.getElementById('hl-modal-title-text').textContent = id ? 'Edit Highlight' : 'New Highlight';

  if (id) {
    const hl = Store.getHighlight(id);
    if (hl) {
      document.getElementById('hl-title').value  = hl.title || '';
      document.getElementById('hl-cover').value  = hl.coverImage || '';
      document.getElementById('hl-desc').value   = hl.description || '';
      document.getElementById('hl-photos').value = (hl.photos || []).join('\n');
    }
  }

  Modal.open('highlight-modal-overlay');
}

function closeHighlightModal() {
  Modal.close('highlight-modal-overlay');
}

async function saveHighlight() {
  const id     = document.getElementById('hl-id').value;
  const title  = document.getElementById('hl-title').value.trim();
  const cover  = document.getElementById('hl-cover').value.trim();
  const desc   = document.getElementById('hl-desc').value.trim();
  const photos = document.getElementById('hl-photos').value
    .split('\n').map(s => s.trim()).filter(Boolean);

  if (!title) { Toast.warning('Please enter a title for the highlight'); return; }

  const data = { title, coverImage: cover, description: desc, photos };
  try {
    if (id) {
      await Store.updateHighlight(id, data);
      Toast.success('Highlight updated! ✨');
    } else {
      await Store.addHighlight(data);
      Toast.success('Highlight created! 🎉');
    }
    closeHighlightModal();
    Router.render(Router.current);
  } catch (e) {
    Toast.error('Failed to save highlight: ' + e.message);
  }
}

async function deleteHighlight(id) {
  if (!confirm('Delete this highlight? This cannot be undone.')) return;
  try {
    await Store.deleteHighlight(id);
    Toast.success('Highlight deleted');
    Router.render(Router.current);
  } catch (e) {
    Toast.error('Failed to delete highlight');
  }
}

// =============================================
// PAGE: ADMIN HIGHLIGHTS MANAGER
// =============================================
Router.register('admin-highlights', () => {
  const highlights = Store.getHighlights();

  const cards = highlights.length ? highlights.map(hl => {
    const media    = (hl.photos || []).filter(Boolean);
    const vidCount = media.filter(u => isVideoUrl(u)).length;
    const imgCount = media.length - vidCount;
    const mediaLabel = [
      imgCount  ? `📷 ${imgCount} photo${imgCount  !== 1 ? 's' : ''}` : '',
      vidCount  ? `🎬 ${vidCount} video${vidCount  !== 1 ? 's' : ''}` : ''
    ].filter(Boolean).join(' · ') || 'No media yet';

    return `
    <div class="card fade-in" style="display:flex;align-items:center;gap:1.5rem;padding:1.5rem 2rem">
      <div style="width:64px;height:64px;border-radius:50%;padding:3px;background:linear-gradient(135deg,#f59e0b,#fbbf24);flex-shrink:0">
        <div style="width:100%;height:100%;border-radius:50%;background:${hl.coverImage ? `center/cover url('${hl.coverImage}')` : 'var(--surface)'};display:flex;align-items:center;justify-content:center;font-size:1.5rem;border:2px solid #000;overflow:hidden">
          ${hl.coverImage ? '' : '✨'}
        </div>
      </div>
      <div style="flex:1;min-width:0">
        <div style="font-family:'Outfit';font-weight:800;font-size:1.1rem">${hl.title}</div>
        <div style="font-size:0.8rem;color:var(--text-muted);margin-top:0.25rem">${hl.description || 'No description'}</div>
        <div style="font-size:0.75rem;color:var(--accent);margin-top:0.25rem;font-weight:700">${mediaLabel}</div>
      </div>
      <div style="display:flex;gap:0.75rem;flex-shrink:0">
        <button class="btn btn-ghost btn-sm" onclick="openHighlightsGallery('${hl.id}')">👁 Preview</button>
        <button class="btn btn-ghost btn-sm" onclick="openHighlightModal('${hl.id}')">✏️ Edit</button>
        <button class="btn btn-ghost btn-sm" style="color:var(--red)" onclick="deleteHighlight('${hl.id}')">🗑️ Delete</button>
      </div>
    </div>`; }).join('')
  : `<div class="empty-state"><div class="empty-icon">✨</div><p>No highlights yet. Create your first memory album!</p></div>`;

  setPage(`
    <div class="page-header fade-in">
      <div style="font-size:0.75rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:0.5rem">Admin / <span style="color:var(--accent)">Highlights</span></div>
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem">
        <h2 style="font-family:'Outfit';font-size:2.5rem;font-weight:800">✨ Memory <span style="color:var(--accent)">Highlights</span></h2>
        <button class="btn btn-primary" onclick="openHighlightModal()">+ New Highlight</button>
      </div>
      <p style="color:var(--text-secondary);margin-top:0.5rem">Create Instagram-style highlight albums to showcase event memories</p>
    </div>
    <div style="display:flex;flex-direction:column;gap:1rem">${cards}</div>
  `, true, buildAdminSidebar('highlights'));
});


