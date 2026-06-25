'use server';

import { auth } from '@/auth';
import { adminDb } from '@/lib/firebase-admin';
import type { Receipt, UserProfile } from '@/types';
import * as admin from 'firebase-admin';

// ── Helper: Get authenticated user ID ───────────────────────────────────────
async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }
  return session.user.id;
}

// ── Save a receipt to Firestore ─────────────────────────────────────────────
export async function saveReceipt(
  receiptData: Omit<Receipt, 'id' | 'uid' | 'addedAt'>
): Promise<Receipt> {
  const userId = await requireAuth();

  const docData = {
    ...receiptData,
    uid: userId,
    addedAt: admin.firestore.Timestamp.now(),
  };

  const ref = await adminDb
    .collection('users')
    .doc(userId)
    .collection('receipts')
    .add(docData);

  return { id: ref.id, ...docData, addedAt: Date.now() } as unknown as Receipt;
}

// ── Load last N months of receipts ──────────────────────────────────────────
export async function loadReceipts(months = 3): Promise<Receipt[]> {
  const userId = await requireAuth();
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);

  const snap = await adminDb
    .collection('users')
    .doc(userId)
    .collection('receipts')
    .where('addedAt', '>=', admin.firestore.Timestamp.fromDate(cutoff))
    .orderBy('addedAt', 'desc')
    .get();

  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      addedAt: data.addedAt?.toMillis?.() ?? Date.now(),
    } as unknown as Receipt;
  });
}

// ── Delete a receipt ────────────────────────────────────────────────────────
export async function deleteReceipt(receiptId: string): Promise<void> {
  const userId = await requireAuth();
  await adminDb
    .collection('users')
    .doc(userId)
    .collection('receipts')
    .doc(receiptId)
    .delete();
}

// ── Save budget to user profile ─────────────────────────────────────────────
export async function saveBudget(budget: number): Promise<void> {
  const userId = await requireAuth();
  await adminDb.collection('users').doc(userId).set({ budget }, { merge: true });
}

// ── Load user profile (budget etc.) ─────────────────────────────────────────
export async function loadProfile(): Promise<UserProfile | null> {
  const userId = await requireAuth();
  const snap = await adminDb.collection('users').doc(userId).get();
  
  if (!snap.exists) return null;
  
  const data = snap.data();
  if (!data) return null;

  return {
    ...data,
    ...(data.lastLoginAt?.toMillis && {
      lastLoginAt: data.lastLoginAt.toMillis(),
    }),
  } as UserProfile;
}
