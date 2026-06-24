// public/js/auth.js — Authentication logic for Spendwise
import {
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { auth } from "./firebase-init.js";

// ── Auth State ────────────────────────────────────────────────────────────────
// Calls back with (user) when signed in, or (null) when signed out
export function observeAuthState(callback) {
  return onAuthStateChanged(auth, callback);
}

// Get the current ID token for API calls
export async function getIdToken() {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  return user.getIdToken();
}

// ── Google Sign-In ─────────────────────────────────────────────────────────
export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

// ── Email / Password Sign-Up ──────────────────────────────────────────────
export async function signUpWithEmail(email, password) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  // Send verification email
  await sendEmailVerification(credential.user);
  return credential.user;
}

// ── Email / Password Sign-In ──────────────────────────────────────────────
export async function signInWithEmail(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

// ── Sign Out ───────────────────────────────────────────────────────────────
export async function signOut() {
  await firebaseSignOut(auth);
}

// ── Resend Verification Email ─────────────────────────────────────────────
export async function resendVerificationEmail() {
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");
  await sendEmailVerification(user);
}

// ── Auth Error Messages ────────────────────────────────────────────────────
export function friendlyAuthError(error) {
  const map = {
    "auth/email-already-in-use": "An account with this email already exists. Try signing in.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/weak-password": "Password must be at least 6 characters.",
    "auth/user-not-found": "No account found with this email.",
    "auth/wrong-password": "Incorrect password. Please try again.",
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
    "auth/popup-closed-by-user": "Sign-in popup was closed. Please try again.",
    "auth/network-request-failed": "Network error. Check your connection and try again.",
  };
  return map[error.code] || error.message || "Authentication failed. Please try again.";
}
