#!/usr/bin/env node
// Run: node scripts/gen-vercel-env.js
// Reads the Firebase service account JSON and prints all env vars
// ready to copy-paste into Vercel Dashboard → Settings → Environment Variables

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read the service account key (adjust path if needed)
const keyPath = join(__dirname, '../../../Downloads/bkm-ai-project-firebase-adminsdk-fbsvc-1966cd95b7.json');

let sa;
try {
  sa = JSON.parse(readFileSync(keyPath, 'utf8'));
} catch {
  console.error('❌ Could not read service account key at:', keyPath);
  console.error('   Please update keyPath in this script.');
  process.exit(1);
}

// Read existing .env for other values
const envPath = join(__dirname, '../.env');
const envContent = readFileSync(envPath, 'utf8');
const getEnv = (key) => {
  const match = envContent.match(new RegExp(`^${key}=(.+)$`, 'm'));
  return match?.[1]?.trim() ?? '';
};

const privateKey = sa.private_key; // has real \n chars

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  VERCEL ENVIRONMENT VARIABLES');
console.log('  Copy each value into: Vercel → Settings → Env Vars');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const vars = [
  ['AUTH_URL', 'https://bkm-receipt-analyzer.vercel.app'],
  ['AUTH_SECRET', getEnv('AUTH_SECRET') || 'GENERATE WITH: openssl rand -base64 32'],
  ['AUTH_GOOGLE_ID', getEnv('AUTH_GOOGLE_ID')],
  ['AUTH_GOOGLE_SECRET', getEnv('AUTH_GOOGLE_SECRET')],
  ['FIREBASE_PROJECT_ID', sa.project_id],
  ['FIREBASE_CLIENT_EMAIL', sa.client_email],
  ['FIREBASE_PRIVATE_KEY', privateKey],
  ['FIREBASE_DATABASE_ID', getEnv('FIREBASE_DATABASE_ID') || 'spendwise'],
  ['FIREBASE_API_KEY', getEnv('FIREBASE_API_KEY')],
  ['FIREBASE_AUTH_DOMAIN', getEnv('FIREBASE_AUTH_DOMAIN')],
  ['FIREBASE_STORAGE_BUCKET', getEnv('FIREBASE_STORAGE_BUCKET')],
  ['FIREBASE_MESSAGING_SENDER_ID', getEnv('FIREBASE_MESSAGING_SENDER_ID')],
  ['FIREBASE_APP_ID', getEnv('FIREBASE_APP_ID')],
  ['NEXT_PUBLIC_FIREBASE_API_KEY', getEnv('NEXT_PUBLIC_FIREBASE_API_KEY')],
  ['NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', getEnv('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN')],
  ['NEXT_PUBLIC_FIREBASE_PROJECT_ID', getEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID')],
  ['NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', getEnv('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET')],
  ['NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', getEnv('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID')],
  ['NEXT_PUBLIC_FIREBASE_APP_ID', getEnv('NEXT_PUBLIC_FIREBASE_APP_ID')],
  ['GEMINI_API_KEY', getEnv('GEMINI_API_KEY')],
  ['GEMINI_MODEL', getEnv('GEMINI_MODEL') || 'gemini-2.5-flash-lite'],
];

for (const [key, value] of vars) {
  console.log(`KEY:   ${key}`);
  console.log(`VALUE: ${value}`);
  console.log('');
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('⚠️  FIREBASE_PRIVATE_KEY: paste the value EXACTLY as shown above.');
console.log('   In the Vercel UI, paste it as plain text (not wrapped in quotes).');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
