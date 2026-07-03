// app/api/admin/users/set-role/route.ts
// Sets the role field on a Firestore user document.
// Only callable by admin users.

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { adminDb } from '@/lib/firebase-admin';
import type { UserRole } from '@/types';

const VALID_ROLES: UserRole[] = ['admin', 'editor', 'viewer'];

async function assertAdmin(sessionUserId: string) {
  const doc = await adminDb.collection('users').doc(sessionUserId).get();
  const role = doc.data()?.role as UserRole | undefined;
  if (role !== 'admin') throw new Error('Forbidden');
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }
    await assertAdmin(session.user.id);

    const { uid, role } = (await req.json()) as { uid?: string; role?: UserRole };

    if (!uid || !role || !VALID_ROLES.includes(role)) {
      return NextResponse.json({ error: 'Invalid uid or role' }, { status: 400 });
    }

    // Prevent admin from accidentally removing their own admin role
    if (uid === session.user.id && role !== 'admin') {
      return NextResponse.json(
        { error: 'You cannot remove your own admin role' },
        { status: 400 }
      );
    }

    await adminDb.collection('users').doc(uid).set({ role }, { merge: true });

    return NextResponse.json({ success: true, uid, role });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
