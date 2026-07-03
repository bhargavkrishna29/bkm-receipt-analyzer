import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Silence "multiple lockfiles" warning when project is nested inside OneDrive
  outputFileTracingRoot: path.join(__dirname),
  serverExternalPackages: ['firebase-admin', '@google-cloud/firestore', 'google-gax'],
  env: {
    FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
    FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
    FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID,
    FIREBASE_APP_ID: process.env.FIREBASE_APP_ID,
    FIREBASE_DATABASE_ID: process.env.FIREBASE_DATABASE_ID,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  webpack(config, { isServer }) {
    // Force Browserslist to resolve from the project root only,
    // preventing it from walking up to the OneDrive parent package.json.
    for (const rule of config.module?.rules ?? []) {
      if (rule && typeof rule === 'object' && rule.use) {
        const uses = Array.isArray(rule.use) ? rule.use : [rule.use];
        for (const u of uses) {
          if (u && typeof u === 'object' && u.options?.browserslist) {
            u.options.browserslist = undefined;
          }
        }
      }
    }
    // Disable webpack cache to prevent "Unable to snapshot resolve dependencies"
    // errors caused by OneDrive's file-on-demand syncing mechanisms.
    config.cache = false;

    // Prevent webpack from bundling firebase-admin and google-gax which contain
    // ESM-only packages (node-fetch) that break when require()'d in CJS context.
    if (isServer) {
      const existingExternals = config.externals ?? [];
      const externalsArray = Array.isArray(existingExternals)
        ? existingExternals
        : [existingExternals];

      config.externals = [
        ...externalsArray,
        ({ request }: { request?: string }, callback: (err?: Error | null, result?: string) => void) => {
          // @auth/firebase-adapter v2 is ESM-only (no CJS fallback in its exports map).
          // It must be externalised as "module" so Node uses `import()` instead of `require()`.
          const esmOnlyPkgs = ['@auth/firebase-adapter'];
          if (request && esmOnlyPkgs.some(pkg => request === pkg || request.startsWith(pkg + '/'))) {
            return callback(null, `module ${request}`);
          }

          const cjsExternalPkgs = [
            'firebase-admin',
            'google-gax',
            '@google-cloud/firestore',
            'undici',
          ];
          if (request && cjsExternalPkgs.some(pkg => request === pkg || request.startsWith(pkg + '/'))) {
            return callback(null, `commonjs ${request}`);
          }
          callback();
        },
      ];
    }

    return config;
  },
};

export default nextConfig;
