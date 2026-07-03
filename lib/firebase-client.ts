// lib/firebase-client.ts — Firebase client SDK (browser-safe)
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey) {
  console.warn(
    'Firebase API Key is missing! Make sure to set NEXT_PUBLIC_FIREBASE_API_KEY in your Vercel Environment Variables.'
  );
}

const app = getApps().length
  ? getApps()[0]
  : initializeApp(
      firebaseConfig.apiKey ? firebaseConfig : { ...firebaseConfig, apiKey: 'dummy-key-to-prevent-crash' }
    );

export const firebaseAuth = getAuth(app);
export const firebaseDb = getFirestore(app);

