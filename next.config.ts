import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Silence "multiple lockfiles" warning when project is nested inside OneDrive
  outputFileTracingRoot: path.join(__dirname),
  env: {
    FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
    FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
    FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID,
    FIREBASE_APP_ID: process.env.FIREBASE_APP_ID,
    FIREBASE_DATABASE_ID: process.env.FIREBASE_DATABASE_ID,
  },
};

export default nextConfig;
