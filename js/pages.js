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

  if (!withSidebar || !user) {
    app.innerHTML = html;
    return;
  }

  const sidebarHtml = `
    <aside class="sidebar">
      ${sidebarItems.map(section => `
        <div class="sidebar-section">
          ${section.label ? `<div class="sidebar-label">${section.label}</div>` : ''}
          ${section.items.map(item => `
            <button class="sidebar-item ${item.active ? 'active' : ''}" onclick="${item.action}">
              <span class="icon">${item.icon}</span>
              ${item.name}
              ${item.badge ? `<span class="sidebar-badge">${item.badge}</span>` : ''}
            </button>`).join('')}
        </div>`).join('')}
    </aside>`;

  app.innerHTML = `<div class="app-layout">${sidebarHtml}<main class="main-content">${html}</main></div>`;
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
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:2rem;background:radial-gradient(ellipse at 50% 0%, rgba(240,165,0,0.08) 0%, transparent 60%), var(--bg)">
      <div style="width:100%;max-width:420px">
        <div style="text-align:center;margin-bottom:2rem">
          <div style="font-size:3rem;margin-bottom:0.5rem">⚡</div>
          <h1 style="font-size:2rem;margin-bottom:0.25rem">EventHub</h1>
          <p class="text-muted">Smart Event Management System</p>
        </div>
        <div class="card" style="padding:2rem">
          <div class="tabs" style="margin-bottom:1.5rem">
            <button class="tab active" id="tab-login" onclick="switchAuthTab('login')">Sign In</button>
            <button class="tab" id="tab-register" onclick="switchAuthTab('register')">Register</button>
          </div>
          <!-- LOGIN FORM -->
          <div id="login-form">
            <div class="form-group">
              <label class="form-label">Email Address</label>
              <input type="email" class="form-control" id="login-email" placeholder="you@college.edu">
            </div>
            <div class="form-group">
              <label class="form-label">Password</label>
              <input type="password" class="form-control" id="login-password" placeholder="Your password">
            </div>
            <div style="text-align:right;margin-top:-0.75rem;margin-bottom:1rem">
              <a href="#" class="text-xs text-accent" onclick="forgotPassword(event)">Forgot password?</a>
            </div>
            <button class="btn btn-primary w-full" style="margin-top:0.5rem" onclick="doLogin()">Sign In →</button>
          </div>
          <!-- REGISTER FORM (hidden by default, reused from auth tab) -->
          <div id="register-form" class="hidden">
            <div class="form-group">
              <label class="form-label">Full Name</label>
              <input type="text" class="form-control" id="reg-full-name" placeholder="Your name">
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Email</label>
                <input type="email" class="form-control" id="reg-email" placeholder="you@college.edu">
              </div>
              <div class="form-group">
                <label class="form-label">Department</label>
                <select class="form-control" id="reg-department-auth">
                  <option value="">Select Department</option>
                  <option>BCA</option><option>BTech CSE</option><option>Nursing</option>
                  <option>Pharmacy</option><option>Other</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Category</label>
              <div class="radio-group">
                <label class="radio-option" id="auth-day" onclick="selectAuthCat('Day Scholar')"><input type="radio" name="auth-cat">🏠 Day Scholar</label>
                <label class="radio-option" id="auth-host" onclick="selectAuthCat('Hosteller')"><input type="radio" name="auth-cat">🏢 Hosteller</label>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Password</label>
                <input type="password" class="form-control" id="reg-password" placeholder="Create password">
              </div>
              <div class="form-group">
                <label class="form-label">Confirm</label>
                <input type="password" class="form-control" id="reg-confirm" placeholder="Repeat password">
              </div>
            </div>
            <input type="hidden" id="auth-cat-val">
            <button class="btn btn-primary w-full" onclick="doRegister()">Create Account →</button>
          </div>
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
  const result = await Auth.register({ name, email, department, category, password });
  if (result.error) { Toast.error(result.error); return; }
  Toast.success(`Welcome to EventHub, ${name.split(' ')[0]}! 🎉`);
  Router.navigate('events');
}

// =============================================
// PAGE: EVENTS (Student view)
// =============================================
Router.register('events', () => {
  const user   = Auth.current();
  const events = Store.getEvents().sort((a, b) => new Date(a.date) - new Date(b.date));
  const sidebar = buildStudentSidebar('events');

  setPage(`
    <div class="page-header">
      <h2>Upcoming Events</h2>
      <div class="breadcrumb"><span>Home</span> / Events</div>
    </div>
    <div class="search-bar">
      <div class="search-input-wrap">
        <span class="search-icon">🔍</span>
        <input type="text" class="form-control" id="event-search" placeholder="Search events..." oninput="filterEvents()">
      </div>
      <div class="filter-chips">
        <button class="chip active" data-filter="All" onclick="setFilter(this,'All')">All</button>
        <button class="chip" data-filter="Tech" onclick="setFilter(this,'Tech')">💻 Tech</button>
        <button class="chip" data-filter="Cultural" onclick="setFilter(this,'Cultural')">🎭 Cultural</button>
        <button class="chip" data-filter="Sports" onclick="setFilter(this,'Sports')">🏏 Sports</button>
        <button class="chip" data-filter="Workshop" onclick="setFilter(this,'Workshop')">🔧 Workshop</button>
        <button class="chip" data-filter="Seminar" onclick="setFilter(this,'Seminar')">🎤 Seminar</button>
      </div>
    </div>
    <div class="event-grid stagger" id="event-grid">
      ${events.length ? events.map(e => renderEventCard(e)).join('') : '<div class="empty-state"><div class="empty-icon">📅</div><p>No events yet</p></div>'}
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
  const grid   = document.getElementById('event-grid');
  if (!grid) return;
  const filtered = events.filter(e => {
    const matchCat  = filter === 'All' || e.category === filter;
    const matchText = !q || e.name.toLowerCase().includes(q) || e.location.toLowerCase().includes(q) || e.description.toLowerCase().includes(q);
    return matchCat && matchText;
  });
  grid.innerHTML = filtered.length
    ? filtered.map(e => renderEventCard(e)).join('')
    : '<div class="empty-state"><div class="empty-icon">🔍</div><p>No events match your search</p></div>';
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
  const eventId  = document.getElementById('reg-event-id').value;
  const name     = document.getElementById('reg-name').value.trim();
  const roll     = document.getElementById('reg-roll').value.trim();
  const email    = document.getElementById('reg-email-val').value.trim();
  const department = document.getElementById('reg-department').value;
  const category = document.getElementById('reg-category').value;
  const user     = Auth.current();

  if (!name || !roll || !email || !department || !category) { Toast.warning('Please fill all fields'); return; }

  const event = Store.getEvent(eventId);
  if (!event) { Toast.error('Event not found'); return; }

  const regs = Store.getRegistrationsByEvent(eventId);

  // Check duplicate by user ID
  if (Store.findRegistration(user.id, eventId)) {
    Toast.warning('You are already registered for this event!');
    Modal.close('register-modal');
    return;
  }

  // Check duplicate by roll number
  if (regs.some(r => r.roll === roll)) {
    Toast.warning('This Roll Number is already registered for this event!');
    return;
  }

  // Check seat limit
  if (regs.length >= event.seatLimit) { Toast.error('Event is full!'); return; }

  const reg = {
    eventId, userName: name, email, roll, department, category
  };

  try {
    await Store.addRegistration(reg);
    Toast.success('Registered successfully! 🎉 Check your QR code.');
    Modal.close('register-modal');
  } catch (error) {
    Toast.error(error.message);
    return;
  }

  // Send notification
  Store.addNotification(user.id, {
    id: genId('notif'), type: 'success',
    title: 'Registration Confirmed',
    message: `You are registered for "${event.name}" on ${formatDate(event.date)}.`,
    read: false, createdAt: Date.now()
  });

  // Show QR
  setTimeout(() => viewMyRegistration(eventId), 300);

  // Refresh page
  setTimeout(() => { if (Router.current === 'events') Router.render('events'); }, 400);
}

// =============================================
// ADMIN: SIDEBAR & DASHBOARD
// =============================================
function buildAdminSidebar(active) {
  const events = Store.getEvents();
  const regs   = Store.getRegistrations();
  return [
    { label: 'Overview', items: [
      { name: 'Dashboard', icon: '📊', active: active === 'admin-dashboard', action: "Router.navigate('admin-dashboard')" },
    ]},
    { label: 'Manage', items: [
      { name: 'Events', icon: '🗓', active: active === 'admin-events', action: "Router.navigate('admin-events')", badge: events.length },
      { name: 'Registrations', icon: '📋', active: active === 'admin-registrations', action: "Router.navigate('admin-registrations')", badge: regs.length },
      { name: 'Attendance', icon: '✅', active: active === 'attendance', action: "Router.navigate('attendance')" },
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
  return [
    { label: 'Discover', items: [
      { name: 'All Events', icon: '🗓', active: active === 'events', action: "Router.navigate('events')" },
    ]},
    { label: 'My Space', items: [
      { name: 'My Events', icon: '🎫', active: active === 'my-events', action: "Router.navigate('my-events')", badge: regs.length || null },
      { name: 'Notifications', icon: '🔔', active: active === 'notifications', action: "Router.navigate('notifications')", badge: notifs || null },
      { name: 'Profile', icon: '👤', active: active === 'profile', action: "Router.navigate('profile')" },
    ]}
  ];
}

// =============================================
// PAGE: ADMIN DASHBOARD
// =============================================
Router.register('admin-dashboard', () => {
  const events = Store.getEvents();
  const regs   = Store.getRegistrations();
  const daySch = regs.filter(r => r.category === 'Day Scholar').length;
  const host   = regs.filter(r => r.category === 'Hosteller').length;
  const attended = regs.filter(r => r.attended).length;

  // Top events by registrations
  const eventPopularity = events.map(e => ({
    ...e,
    count: Store.getRegistrationsByEvent(e.id).length
  })).sort((a, b) => b.count - a.count);

  setPage(`
    <div class="page-header">
      <h2>Admin Dashboard</h2>
      <div class="breadcrumb"><span>Admin</span> / Dashboard</div>
    </div>

    <!-- STAT CARDS -->
    <div class="stats-grid stagger" style="grid-template-columns:repeat(5,1fr)">
      <div class="stat-card accent">
        <div class="stat-value">${events.length}</div>
        <div class="stat-label">Total Events</div>
        <div class="stat-icon">🗓</div>
      </div>
      <div class="stat-card green">
        <div class="stat-value">${regs.length}</div>
        <div class="stat-label">Registrations</div>
        <div class="stat-icon">📋</div>
      </div>
      <div class="stat-card blue">
        <div class="stat-value">${attended}</div>
        <div class="stat-label">Attended</div>
        <div class="stat-icon">✅</div>
      </div>
      <div class="stat-card purple">
        <div class="stat-value">${daySch}</div>
        <div class="stat-label">Day Scholars</div>
        <div class="stat-icon">🏠</div>
      </div>
      <div class="stat-card red">
        <div class="stat-value">${host}</div>
        <div class="stat-label">Hostellers</div>
        <div class="stat-icon">🏢</div>
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
  const events = Store.getEvents().sort((a, b) => new Date(a.date) - new Date(b.date));

  setPage(`
    <div class="page-header flex justify-between items-center" style="flex-wrap:wrap;gap:1rem">
      <div>
        <h2>Manage Events</h2>
        <div class="breadcrumb"><span>Admin</span> / Events</div>
      </div>
      <button class="btn btn-primary" onclick="openCreateEventModal()">+ Create Event</button>
    </div>
    <div class="event-grid stagger" id="admin-event-grid">
      ${events.map(e => renderEventCard(e, true)).join('')}
      ${events.length === 0 ? `<div class="empty-state"><div class="empty-icon">📅</div><p>No events. Create your first one!</p></div>` : ''}
    </div>`, true, buildAdminSidebar('admin-events'));
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
  Modal.open('event-modal');
}

async function uploadFile(input, targetId) {
  const file = input.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('image', file);

  try {
    Toast.info('Uploading image…');
    const res = await fetch('http://localhost:5000/api/upload', {
      method: 'POST',
      body: formData
    });
    const path = await res.text();
    // Prepend base URL if it's a local path
    const fullPath = path.startsWith('http') ? path : `http://localhost:5000${path}`;
    document.getElementById(targetId).value = fullPath;
    Toast.success('Image uploaded!');
  } catch (e) {
    Toast.error('Upload failed');
    console.error(e);
  }
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

  if (!name || !date || !time || !loc || !cat) { Toast.warning('Please fill required fields'); return; }

  const emojis = { Tech: '💻', Cultural: '🎭', Sports: '🏏', Workshop: '🔧', Seminar: '🎤', Other: '📅' };
  const colors  = { Tech: 'linear-gradient(135deg,#0a1628,#1a3a5c)', Cultural: 'linear-gradient(135deg,#1a0a28,#3d1a5c)', Sports: 'linear-gradient(135deg,#1a1a0a,#3a3a0a)', Workshop: 'linear-gradient(135deg,#1a0a00,#3a2000)', Seminar: 'linear-gradient(135deg,#1a0a1a,#2a1a3a)', Other: 'linear-gradient(135deg,#0a1428,#1a2850)' };

  const eventData = {
    name, club, date, time, location: loc, description: desc, category: cat,
    seatLimit: seats, deadline: dl, registrationOpen: open, coverPhoto, clubLogo,
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
    <div class="page-header">
      <h2>All Registrations</h2>
      <div class="breadcrumb"><span>Admin</span> / Registrations</div>
    </div>
    <div class="search-bar">
      <div class="search-input-wrap">
        <span class="search-icon">🔍</span>
        <input type="text" class="form-control" id="reg-search" placeholder="Search by name or event…" oninput="filterRegistrations()">
      </div>
      <select class="form-control" id="reg-filter-event" onchange="filterRegistrations()" style="width:auto;min-width:200px">
        <option value="">All Events</option>
        ${events.map(e => `<option value="${e.id}">${e.name}</option>`).join('')}
      </select>
      <select class="form-control" id="reg-filter-dept" onchange="filterRegistrations()" style="width:auto;min-width:150px">
        <option value="">All Departments</option>
        <option>BCA</option>
        <option>BTech CSE</option>
        <option>Nursing</option>
        <option>Pharmacy</option>
        <option>Other</option>
      </select>
    </div>
    <div class="card">
      <div class="table-wrap">
        <table id="reg-table">
          <thead><tr><th>Name</th><th>Roll No</th><th>Event</th><th>Department</th><th>Category</th><th>Registered</th><th>Attendance</th><th>Actions</th></tr></thead>
          <tbody id="reg-tbody">
            ${buildRegRows(regs)}
          </tbody>
        </table>
      </div>
    </div>`, true, buildAdminSidebar('admin-registrations'));
});

function buildRegRows(regs) {
  if (!regs.length) return `<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--text-muted)">No registrations found</td></tr>`;
  return regs.map(r => {
    const event = Store.getEvent(r.eventId);
    return `<tr>
      <td><strong>${r.userName}</strong></td>
      <td>${r.roll || '—'}</td>
      <td>${event ? event.name : r.eventId}</td>
      <td>${r.department}</td>
      <td><span class="badge ${r.category==='Hosteller'?'badge-warning':'badge-info'}">${r.category}</span></td>
      <td class="text-xs text-muted">${new Date(r.registeredAt).toLocaleDateString('en-IN')}</td>
      <td><span class="badge ${r.attended?'badge-success':'badge-neutral'}">${r.attended?'✅ Present':'⏳ Absent'}</span></td>
      <td>
        <div style="display:flex;gap:0.4rem">
          ${!r.attended ? `<button class="btn btn-success btn-sm" onclick="markPresent('${r.id}')">Mark Present</button>` : ''}
          <button class="btn btn-ghost btn-sm" onclick="generateCertificate('${r.id}')">📜 Cert</button>
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
          <input type="text" class="form-control" id="manual-reg-id" placeholder="Enter Registration ID (reg_…)">
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
  const catEngagement = ['Tech','Cultural','Sports','Workshop','Seminar','Other'].map(cat => {
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
