// app/api/admin/users/reset-password/route.ts
// Generates a Firebase Auth password reset link for a given user.
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

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }
    await assertAdmin(session.user.id);

    const { uid } = (await req.json()) as { uid?: string };
    if (!uid) {
      return NextResponse.json({ error: 'uid is required' }, { status: 400 });
    }

    // Fetch the user to get their email
    const userRecord = await adminAuth.getUser(uid);
    if (!userRecord.email) {
      return NextResponse.json(
        { error: 'User has no email address (OAuth-only account). Cannot send a password reset.' },
        { status: 422 }
      );
    }

    // Check if this user signed up only via OAuth (no password provider)
    const hasPasswordProvider = userRecord.providerData.some(
      (p) => p.providerId === 'password'
    );
    if (!hasPasswordProvider) {
      return NextResponse.json(
        {
          error: `This user signed in with ${userRecord.providerData[0]?.providerId ?? 'OAuth'} only. Password reset is not applicable.`,
        },
        { status: 422 }
      );
    }

    const resetLink = await adminAuth.generatePasswordResetLink(userRecord.email);

    return NextResponse.json({ success: true, resetLink, email: userRecord.email });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
