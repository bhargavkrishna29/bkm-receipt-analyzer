// public/js/firebase-init.js
// Firebase client SDK initialization via CDN ESM
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBhLhIvTQIyIK0tOnAHEntVrPyQWBTxkuY",
  authDomain: "bkm-ai-project.firebaseapp.com",
  projectId: "bkm-ai-project",
  storageBucket: "bkm-ai-project.firebasestorage.app",
  messagingSenderId: "246914268967",
  appId: "1:246914268967:web:716adbec466a1534c1f302",
  databaseId: "spendwise",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, "spendwise");

export { app, auth, db };
