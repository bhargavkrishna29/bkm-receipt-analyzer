// app/api/admin/check/route.ts
// Lightweight endpoint: returns { isAdmin: boolean } for the current session user.
// Used by the Navigation to decide whether to show the Admin Panel link.
// Runs server-side so it's always reliable regardless of client env vars.

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { adminDb } from '@/lib/firebase-admin';
import type { UserRole } from '@/types';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ isAdmin: false });
    }
    const doc = await adminDb.collection('users').doc(session.user.id).get();
    const role = doc.data()?.role as UserRole | undefined;
    return NextResponse.json({ isAdmin: role === 'admin' });
  } catch {
    return NextResponse.json({ isAdmin: false });
  }
}
