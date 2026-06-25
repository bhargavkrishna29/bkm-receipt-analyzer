// lib/firestore.ts — All Firestore operations (client-side, browser only)
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
} from 'firebase/firestore';
import { db, auth } from './firebase';
import type { Receipt, ReceiptItem, UserProfile } from '@/types';

function uid(): string {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  return user.uid;
}

// ── Save a receipt to Firestore ─────────────────────────────────────────────
export async function saveReceipt(
  receiptData: Omit<Receipt, 'id' | 'uid' | 'addedAt'>
): Promise<Receipt> {
  const userId = uid();
  const docData = {
    ...receiptData,
    uid: userId,
    addedAt: Timestamp.now(),
  };
  const ref = await addDoc(collection(db, 'users', userId, 'receipts'), docData);
  return { id: ref.id, ...docData, addedAt: Date.now() };
}

// ── Load last N months of receipts ──────────────────────────────────────────
export async function loadReceipts(months = 3): Promise<Receipt[]> {
  const userId = uid();
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);

  const q = query(
    collection(db, 'users', userId, 'receipts'),
    where('addedAt', '>=', Timestamp.fromDate(cutoff)),
    orderBy('addedAt', 'desc')
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<Receipt, 'id' | 'addedAt'>),
    addedAt: (d.data().addedAt as Timestamp)?.toMillis?.() ?? Date.now(),
  }));
}

// ── Delete a receipt ────────────────────────────────────────────────────────
export async function deleteReceipt(receiptId: string): Promise<void> {
  const userId = uid();
  await deleteDoc(doc(db, 'users', userId, 'receipts', receiptId));
}

// ── Save budget to user profile ─────────────────────────────────────────────
export async function saveBudget(budget: number): Promise<void> {
  const userId = uid();
  await setDoc(doc(db, 'users', userId), { budget }, { merge: true });
}

// ── Save user profile data on login ──────────────────────────────────────────
export async function saveProfileData(user: {
  uid: string;
  email: string | null;
  displayName: string | null;
}): Promise<void> {
  await setDoc(
    doc(db, 'users', user.uid),
    {
      email: user.email,
      displayName: user.displayName ?? null,
      lastLoginAt: Timestamp.now(),
    },
    { merge: true }
  );
}

// ── Load user profile (budget etc.) ─────────────────────────────────────────
export async function loadProfile(): Promise<UserProfile | null> {
  const userId = uid();
  const snap = await getDoc(doc(db, 'users', userId));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}
