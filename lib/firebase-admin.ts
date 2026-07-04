import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    // Handle both literal \n (from Vercel UI copy-paste) and real newlines
    const rawKey = process.env.FIREBASE_PRIVATE_KEY ?? '';
    const privateKey = rawKey.includes('\\n')
      ? rawKey.replace(/\\n/g, '\n')
      : rawKey;

    if (projectId && clientEmail && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        databaseURL: `https://${projectId}.firebaseio.com`,
      });
    } else {
      console.warn(
        'Firebase Admin missing credentials! Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in your .env file.'
      );
      // Fallback for Next.js build time
      admin.initializeApp({ projectId: 'dummy-project-id' });
    }
  } catch (error) {
    console.error('Firebase Admin Initialization Error', error);
  }
}

import { getFirestore } from 'firebase-admin/firestore';

export const adminDb = getFirestore(process.env.FIREBASE_DATABASE_ID || '(default)');
export const adminAuth = admin.auth();
