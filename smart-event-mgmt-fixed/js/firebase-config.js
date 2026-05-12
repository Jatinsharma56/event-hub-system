const API_URL = 'http://localhost:5000/api';

const Store = {
  // Local state cache
  events: [],
  registrations: [],
  user: null,

  // Initialize data from backend
  async init() {
    this.user = JSON.parse(localStorage.getItem('sems_session') || 'null');
    await this.fetchEvents();
    if (this.user) {
      await this.fetchRegistrations();
    }
    if (window.Router && window.Router.current) {
      Router.render(Router.current);
    }
  },

  getAuthHeaders() {
    return this.user ? { 'Authorization': `Bearer ${this.user.token}` } : {};
  },

  async fetchEvents() {
    try {
      const res = await fetch(`${API_URL}/events`);
      this.events = await res.json();
    } catch (e) { console.error('Failed to fetch events', e); }
  },

  async fetchRegistrations() {
    try {
      const res = await fetch(`${API_URL}/registrations`, { headers: this.getAuthHeaders() });
      this.registrations = await res.json();
    } catch (e) { console.error('Failed to fetch registrations', e); }
  },

  // ----- EVENTS -----
  getEvents() { return this.events; },
  getEvent(id) { return this.events.find(e => e._id === id || e.id === id); },

  async addEvent(eventData) {
    const res = await fetch(`${API_URL}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() },
      body: JSON.stringify(eventData)
    });
    if (!res.ok) throw new Error(await res.text());
    await this.fetchEvents();
  },

  async updateEvent(id, updates) {
    const res = await fetch(`${API_URL}/events/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() },
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error(await res.text());
    await this.fetchEvents();
  },

  async deleteEvent(id) {
    const res = await fetch(`${API_URL}/events/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    if (!res.ok) throw new Error(await res.text());
    await this.fetchEvents();
  },

  // ----- REGISTRATIONS -----
  getRegistrations() { return this.registrations; },
  getRegistrationsByEvent(eid) { return this.registrations.filter(r => r.eventId === eid); },
  findRegistration(uid, eid) { return this.registrations.find(r => r.userId === uid && r.eventId === eid); },

  async addRegistration(regData) {
    const res = await fetch(`${API_URL}/registrations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() },
      body: JSON.stringify(regData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Registration failed');
    await this.fetchRegistrations();
    return data;
  },

  async markAttendance(regId) {
    const res = await fetch(`${API_URL}/registrations/${regId}/attendance`, {
      method: 'PUT',
      headers: this.getAuthHeaders()
    });
    if (!res.ok) throw new Error(await res.text());
    await this.fetchRegistrations();
  },

  // ----- SESSION & AUTH -----
  getSession() { return this.user; },
  setSession(user) { 
    this.user = user;
    localStorage.setItem('sems_session', JSON.stringify(user)); 
    this.fetchRegistrations();
  },
  clearSession() { 
    this.user = null;
    this.registrations = [];
    localStorage.removeItem('sems_session'); 
  },

  // Mock functions to prevent crashing (not fully implemented in backend yet)
  getNotifications() { return []; },
  addNotification() {},
  markAllRead() {},
  getFeedbacksByEvent() { return []; },
  addFeedback() {},
  getUsers() { return [this.user].filter(Boolean); },
  findUserById(id) { return this.user?._id === id ? this.user : null; }
};

const Auth = {
  current() { return Store.getSession(); },
  
  async login(email, password) {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) return { error: data.message || 'Login failed' };
      
      Store.setSession(data);
      return { user: data };
    } catch (e) {
      return { error: 'Network error. Backend might be down.' };
    }
  },

  async register(userData) {
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      const data = await res.json();
      if (!res.ok) return { error: data.message || 'Registration failed' };
      
      Store.setSession(data);
      return { user: data };
    } catch (e) {
      return { error: 'Network error. Backend might be down.' };
    }
  },

  logout() {
    Store.clearSession();
  }
};

document.addEventListener('DOMContentLoaded', () => {
  Store.init();
});
