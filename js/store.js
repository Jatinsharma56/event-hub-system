const API_URL = 'http://localhost:5000/api';

const Store = {
  // Local state cache
  events: [],
  registrations: [],
  user: null,

  // Initialize data from backend, then boot Router
  async init() {
    this.user = JSON.parse(localStorage.getItem('sems_session') || 'null');
    // Normalize MongoDB _id to id
    if (this.user && this.user._id && !this.user.id) {
      this.user.id = this.user._id;
    }
    await this.fetchEvents();
    if (this.user) {
      await this.fetchRegistrations();
    }
    // Boot the router only after data is ready
    if (typeof Router !== 'undefined') {
      Toast.init();
      Router.init();
    }
  },

  getAuthHeaders() {
    return this.user ? { 'Authorization': `Bearer ${this.user.token}` } : {};
  },

  async fetchEvents() {
    try {
      const res = await fetch(`${API_URL}/events`);
      const data = await res.json();
      // Normalize _id to id for compatibility
      this.events = Array.isArray(data) ? data.map(e => ({ ...e, id: e.id || e._id })) : [];
    } catch (e) { console.error('Failed to fetch events', e); }
  },

  async fetchRegistrations() {
    try {
      const res = await fetch(`${API_URL}/registrations`, { headers: this.getAuthHeaders() });
      const data = await res.json();
      // Normalize _id to id for compatibility
      this.registrations = Array.isArray(data) ? data.map(r => ({ ...r, id: r.id || r._id })) : [];
    } catch (e) { console.error('Failed to fetch registrations', e); }
  },

  // ----- EVENTS -----
  getEvents() { return this.events; },
  getEvent(id) { return this.events.find(e => e._id === id || e.id === id || e._id?.toString() === id); },

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
  getRegistrationsByEvent(eid) { 
    return this.registrations.filter(r => (r.eventId === eid) || (r.eventId?._id === eid) || (r.eventId === eid?.toString()));
  },
  getRegistrationsByUser(uid) {
    return this.registrations.filter(r => (r.userId === uid) || (r.userId?._id === uid) || (r.userId?.toString() === uid));
  },
  findRegistration(uid, eid) { 
    return this.registrations.find(r => {
      const userMatch = r.userId === uid || r.userId?.toString() === uid;
      const eventMatch = r.eventId === eid || r.eventId?.toString() === eid;
      return userMatch && eventMatch;
    });
  },

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
    // Normalize MongoDB _id to id for compatibility
    if (user && user._id && !user.id) {
      user.id = user._id;
    }
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
  getFeedbacks() { return []; },
  addFeedback() {},
  getUsers() { return [this.user].filter(Boolean); },
  findUserById(id) { return this.user?._id === id ? this.user : null; },
  findRegistrationById(id) { return this.registrations.find(r => r.id === id || r._id === id); },
  _set(key, val) { this[key] = val; }
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
  // Store.init() will call Router.init() after data is fetched
  Store.init();
});
