// Firebase-Powered Store (Serverless)
window.Store = {
  // Local state cache
  events: [],
  registrations: [],
  highlights: [],
  user: null,
  _booted: false,

  // Utility: wrap a promise with a timeout so Firestore never hangs the app
  _withTimeout(promise, ms = 10000, label = 'fetch') {
    return Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
      )
    ]);
  },

  // Initialize data from Firebase, then boot Router
  async init() {
    // Read local session immediately (sync, no waiting)
    this.user = JSON.parse(localStorage.getItem('sems_session') || 'null');

    // Hard safety timeout: force-boot after 5 seconds no matter what
    const safetyTimer = setTimeout(() => {
      if (!this._booted) {
        console.warn('Store.init safety timeout fired — force-booting Router');
        this._booted = true;
        if (typeof Router !== 'undefined') {
          try { Toast.init(); Router.init(); } catch(_) {}
        }
      }
    }, 5000);

    // Set persistence with tight timeout so it never blocks boot
    try {
      await Promise.race([
        window.auth.setPersistence('local'),
        new Promise((_, r) => setTimeout(() => r(new Error('setPersistence timeout')), 2000))
      ]);
    } catch (e) { console.warn('Could not set auth persistence:', e.message); }

    try {
      await Promise.allSettled([
        this._withTimeout(this.fetchEvents(), 8000, 'fetchEvents'),
        this._withTimeout(this.fetchHighlights(), 8000, 'fetchHighlights')
      ]);
      if (this.user) {
        await this._withTimeout(
          this.fetchRegistrations(), 6000, 'fetchRegistrations'
        ).catch(e => console.warn('fetchRegistrations failed:', e.message));
      }
    } catch (e) {
      console.error('Store.init data fetch error:', e);
    } finally {
      clearTimeout(safetyTimer);
      if (!this._booted) {
        this._booted = true;
        if (typeof Router !== 'undefined') {
          Toast.init();
          Router.init();
        }
      }
    }

    // After boot, listen for Auth state changes to keep session in sync
    window.auth.onAuthStateChanged(async (firebaseUser) => {
      console.log('Auth state changed:', firebaseUser ? firebaseUser.email : 'No user');
      if (firebaseUser) {
        try {
          const userDoc = await this._withTimeout(
            window.db.collection('users').doc(firebaseUser.uid).get(), 8000, 'userDoc'
          );
          if (userDoc.exists) {
            const userData = { id: userDoc.id, ...userDoc.data() };
            // Only update session if something changed
            const prev = JSON.stringify(this.user);
            const next = JSON.stringify(userData);
            if (prev !== next) {
              console.log('Syncing user session from Firestore');
              this.setSession(userData);
              // If we are on landing or login, maybe we should redirect?
              // But let's keep it simple for now.
            }
          }
        } catch (e) { console.warn('onAuthStateChanged user fetch failed:', e.message); }
      } else {
        // If Firebase says no user but we have one in local session, clear it?
        // Actually, let's trust Firebase as the source of truth for auth, 
        // but keep local session for metadata.
      }
    });
  },

  async fetchEvents() {
    try {
      const snapshot = await this._withTimeout(
        window.db.collection('events').get(),
        10000, 'fetchEvents'
      );
      let evs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      evs.sort((a, b) => new Date(b.date) - new Date(a.date));
      this.events = evs;
    } catch (e) { console.error('Failed to fetch events:', e.message); this.events = this.events || []; }
  },

  async fetchRegistrations() {
    try {
      if (!this.user) return;
      let query = window.db.collection('registrations');
      // If not admin, only fetch own registrations
      if (this.user.role !== 'admin') {
        query = query.where('userId', '==', this.user.id);
      }
      const snapshot = await this._withTimeout(query.get(), 8000, 'fetchRegistrations');
      this.registrations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log(`Fetched ${this.registrations.length} registrations`);
    } catch (e) { console.error('Failed to fetch registrations', e.message); }
  },

  // ----- EVENTS -----
  getEvents() { return this.events; },
  getEvent(id) { return this.events.find(e => e.id === id); },

  async addEvent(eventData) {
    try {
      await window.db.collection('events').add({
        ...eventData,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      await this.fetchEvents();
    } catch (e) { throw new Error(e.message); }
  },

  async updateEvent(id, updates) {
    try {
      await window.db.collection('events').doc(id).update(updates);
      await this.fetchEvents();
    } catch (e) { throw new Error(e.message); }
  },

  async deleteEvent(id) {
    try {
      await window.db.collection('events').doc(id).delete();
      await this.fetchEvents();
    } catch (e) { throw new Error(e.message); }
  },

  // ----- REGISTRATIONS -----
  getRegistrations() { return this.registrations; },
  getRegistrationsByEvent(eid) { 
    return this.registrations.filter(r => r.eventId === eid);
  },
  getRegistrationsByUser(uid) {
    return this.registrations.filter(r => r.userId === uid);
  },
  findRegistration(uid, eid) { 
    return this.registrations.find(r => r.userId === uid && r.eventId === eid);
  },

  async addRegistration(regData) {
    try {
      const docRef = await window.db.collection('registrations').add({
        ...regData,
        attended: false,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
      await this.fetchRegistrations();
      return { id: docRef.id };
    } catch (e) { throw new Error(e.message); }
  },

  async markAttendance(regId) {
    try {
      await window.db.collection('registrations').doc(regId).update({ attended: true });
      await this.fetchRegistrations();
    } catch (e) { throw new Error(e.message); }
  },

  async deleteRegistration(id) {
    try {
      await window.db.collection('registrations').doc(id).delete();
      await this.fetchRegistrations();
    } catch (e) { throw new Error(e.message); }
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
    window.auth.signOut();
  },

  // ----- HIGHLIGHTS (MEMORIES) -----
  getHighlights() { return this.highlights; },
  getHighlight(id) { return this.highlights.find(h => h.id === id); },

  async fetchHighlights() {
    try {
      const snap = await this._withTimeout(
        window.db.collection('highlights').get(),
        10000, 'fetchHighlights'
      );
      let hls = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      hls.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : Date.now();
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : Date.now();
        return timeB - timeA;
      });
      this.highlights = hls;
    } catch (e) {
      console.warn('fetchHighlights failed:', e.message);
      this.highlights = this.highlights || [];
    }
  },

  async addHighlight(data) {
    try {
      await window.db.collection('highlights').add({
        ...data,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      await this.fetchHighlights();
    } catch (e) { throw new Error(e.message); }
  },

  async updateHighlight(id, updates) {
    try {
      await window.db.collection('highlights').doc(id).update(updates);
      await this.fetchHighlights();
    } catch (e) { throw new Error(e.message); }
  },

  async deleteHighlight(id) {
    try {
      await window.db.collection('highlights').doc(id).delete();
      await this.fetchHighlights();
    } catch (e) { throw new Error(e.message); }
  },

  // Mock functions for compatibility
  getNotifications() { return []; },
  addNotification() {},
  markAllRead() {},
  getFeedbacksByEvent() { return []; },
  getFeedbacks() { return []; },
  addFeedback() {},
  getUsers() { return [this.user].filter(Boolean); },
  findUserById(id) { return this.user?.id === id ? this.user : null; },
  findRegistrationById(id) { return this.registrations.find(r => r.id === id); },
  _set(key, val) { this[key] = val; }
};

window.Auth = {
  current() { return Store.getSession(); },
  
  async login(email, password) {
    console.log('Attempting login for:', email);
    try {
      const userCredential = await window.auth.signInWithEmailAndPassword(email, password);
      
      const userDoc = await window.db.collection('users').doc(userCredential.user.uid).get();
      
      if (!userDoc.exists) return { error: 'User profile not found in database.' };
      
      const userData = { id: userDoc.id, ...userDoc.data() };
      Store.setSession(userData);
      return { user: userData };
    } catch (e) {
      console.error('Firebase Auth Error:', e.code, e.message);
      if (e.code === 'auth/user-not-found') return { error: 'No account found with this email. Please register first!' };
      if (e.code === 'auth/wrong-password') return { error: 'Incorrect password. Please try again.' };
      if (e.code === 'auth/operation-not-allowed') return { error: 'Email/Password login is not enabled in Firebase Console!' };
      if (e.code === 'auth/invalid-email') return { error: 'Please enter a valid email address.' };
      return { error: e.message };
    }
  },

  async register(userData) {
    try {
      // Create Firebase Auth user
      const userCredential = await window.auth.createUserWithEmailAndPassword(userData.email, userData.password);
      
      // All self-registrations are always 'student'. Admin accounts are DB-seeded only.
      const profile = {
        name: userData.name,
        email: userData.email,
        role: 'student',
        department: userData.department || '',
        category: userData.category || '',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      await window.db.collection('users').doc(userCredential.user.uid).set(profile);
      
      const fullUser = { id: userCredential.user.uid, ...profile };
      Store.setSession(fullUser);
      return { user: fullUser };
    } catch (e) {
      return { error: e.message };
    }
  },

  logout() {
    Store.clearSession();
  },

};

document.addEventListener('DOMContentLoaded', () => {
  Store.init().catch(e => {
    console.error('Fatal Store.init error:', e);
    // Emergency boot: try to at least show the login page
    if (typeof Router !== 'undefined') { try { Toast.init(); Router.init(); } catch(_) {} }
  });
});
