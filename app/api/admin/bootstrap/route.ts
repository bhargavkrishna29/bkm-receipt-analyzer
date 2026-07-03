// app/api/admin/bootstrap/route.ts
// ONE-TIME USE: Sets the currently logged-in user as admin.
// Only works if there are NO existing admins in the system yet
// (prevents any random user from escalating themselves).
// DELETE THIS FILE after you've confirmed your admin access works.

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { adminDb } from '@/lib/firebase-admin';
import type { UserRole } from '@/types';

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Safety check: only allow bootstrap if no admins exist yet
    const existing = await adminDb
      .collection('users')
      .where('role', '==', 'admin')
      .limit(1)
      .get();

    if (!existing.empty) {
      return NextResponse.json(
        { error: 'An admin already exists. Bootstrap is disabled.' },
        { status: 403 }
      );
    }

    // Set this user as admin
    await adminDb
      .collection('users')
      .doc(session.user.id)
      .set({ role: 'admin' as UserRole }, { merge: true });

    return NextResponse.json({
      success: true,
      message: `User ${session.user.email} is now an admin. DELETE app/api/admin/bootstrap/ when done.`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
