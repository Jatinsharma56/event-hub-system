// Firebase Configuration (Compat Mode)
const firebaseConfig = {
  apiKey: "AIzaSyA5k9wAJayQlaRdVQDFs0eKzHo-XhCjMWo",
  authDomain: "smart-event-management-f4c28.firebaseapp.com",
  projectId: "smart-event-management-f4c28",
  storageBucket: "smart-event-management-f4c28.firebasestorage.app",
  messagingSenderId: "277415325867",
  appId: "1:277415325867:web:e66b65ed0c72f1639f47ee",
  measurementId: "G-2CS3DBC2WQ"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Services Globally
window.db = firebase.firestore();
window.auth = firebase.auth();
window.storage = firebase.storage();

console.log("Firebase initialized successfully!");
