// app/api/admin/users/route.ts
// Lists all Firebase Auth users merged with their Firestore role.
// Only callable by users whose Firestore doc has role === 'admin'.

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import type { AdminUser, UserRole } from '@/types';

async function assertAdmin(sessionUserId: string) {
  const doc = await adminDb.collection('users').doc(sessionUserId).get();
  const role = doc.data()?.role as UserRole | undefined;
  if (role !== 'admin') throw new Error('Forbidden');
}

export async function GET(_req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }
    await assertAdmin(session.user.id);

    // List all auth users (up to 1000)
    const listResult = await adminAuth.listUsers(1000);

    // Batch-fetch all Firestore user docs
    const uids = listResult.users.map((u) => u.uid);
    const refs = uids.map((uid) => adminDb.collection('users').doc(uid));
    const snapshots = refs.length > 0 ? await adminDb.getAll(...refs) : [];

    const roleMap: Record<string, UserRole> = {};
    snapshots.forEach((snap) => {
      if (snap.exists) {
        roleMap[snap.id] = (snap.data()?.role as UserRole) || 'viewer';
      }
    });

    const users: AdminUser[] = listResult.users.map((u) => ({
      uid: u.uid,
      email: u.email ?? null,
      name: u.displayName ?? null,
      role: roleMap[u.uid] ?? 'viewer',
      createdAt: u.metadata.creationTime ?? null,
      lastLoginAt: u.metadata.lastSignInTime ?? null,
      disabled: u.disabled,
      provider: u.providerData?.[0]?.providerId ?? 'password',
    }));

    return NextResponse.json({ users });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
