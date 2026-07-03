// app/api/admin/users/[uid]/route.ts
// Deletes (disables) a user from Firebase Auth and removes their Firestore doc.
// Only callable by admin users.

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import type { UserRole } from '@/types';

async function assertAdmin(sessionUserId: string) {
  const doc = await adminDb.collection('users').doc(sessionUserId).get();
  const role = doc.data()?.role as UserRole | undefined;
  if (role !== 'admin') throw new Error('Forbidden');
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }
    await assertAdmin(session.user.id);

    if (uid === session.user.id) {
      return NextResponse.json(
        { error: 'You cannot delete your own account from the admin panel.' },
        { status: 400 }
      );
    }

    // Delete from Firebase Auth
    await adminAuth.deleteUser(uid);

    // Delete Firestore user doc (receipts subcollection is left for data retention)
    await adminDb.collection('users').doc(uid).delete();

    return NextResponse.json({ success: true, uid });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
