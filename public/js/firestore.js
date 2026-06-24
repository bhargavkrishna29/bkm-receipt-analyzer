// public/js/firestore.js
// All Firestore read/write operations — runs in the browser using Firebase client SDK
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  setDoc,
  getDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import { db, auth } from "./firebase-init.js";

function uid() {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  return user.uid;
}

// ── Save a receipt to Firestore ─────────────────────────────────────────────
export async function saveReceipt(receiptData) {
  const userId = uid();
  const doc_ = {
    ...receiptData,
    uid: userId,
    addedAt: Timestamp.now(),
  };
  const ref = await addDoc(
    collection(db, "users", userId, "receipts"),
    doc_
  );
  return { id: ref.id, ...doc_, addedAt: Date.now() };
}

// ── Load last N months of receipts ──────────────────────────────────────────
export async function loadReceipts(months = 3) {
  const userId = uid();
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);

  const q = query(
    collection(db, "users", userId, "receipts"),
    where("addedAt", ">=", Timestamp.fromDate(cutoff)),
    orderBy("addedAt", "desc")
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    addedAt: d.data().addedAt?.toMillis?.() ?? Date.now(),
  }));
}

// ── Delete a receipt ────────────────────────────────────────────────────────
export async function deleteReceipt(receiptId) {
  const userId = uid();
  await deleteDoc(doc(db, "users", userId, "receipts", receiptId));
}

// ── Save budget to user profile ─────────────────────────────────────────────
export async function saveBudget(budget) {
  const userId = uid();
  await setDoc(
    doc(db, "users", userId),
    { budget: parseFloat(budget) },
    { merge: true }
  );
}

// ── Save user profile data on login ──────────────────────────────────────────
export async function saveProfileData(user) {
  const userId = user.uid;
  await setDoc(
    doc(db, "users", userId),
    { 
      email: user.email,
      displayName: user.displayName || null,
      lastLoginAt: Timestamp.now()
    },
    { merge: true }
  );
}

// ── Load user profile (budget etc.) ─────────────────────────────────────────
export async function loadProfile() {
  const userId = uid();
  const snap = await getDoc(doc(db, "users", userId));
  return snap.exists() ? snap.data() : {};
}

