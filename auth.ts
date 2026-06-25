// auth.ts — NextAuth configuration with Google + Firebase email/password
import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { FirestoreAdapter } from '@auth/firebase-adapter';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: FirestoreAdapter(adminDb),
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),

    // Firebase email/password bridge:
    // The client signs in via Firebase Auth SDK, gets an ID token,
    // then passes it here for server-side verification.
    CredentialsProvider({
      id: 'firebase-credentials',
      name: 'Email & Password',
      credentials: {
        idToken: { label: 'Firebase ID Token', type: 'text' },
      },
      async authorize(credentials) {
        const idToken = credentials?.idToken as string | undefined;
        if (!idToken) return null;

        try {
          const decoded = await adminAuth.verifyIdToken(idToken);

          // Return a user object that NextAuth understands
          return {
            id: decoded.uid,
            email: decoded.email ?? null,
            name: decoded.name ?? decoded.email?.split('@')[0] ?? null,
            image: decoded.picture ?? null,
            emailVerified: decoded.email_verified ? new Date() : null,
          };
        } catch (err) {
          console.error('Firebase ID token verification failed:', err);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async session({ session, token, user }) {
      if (session.user) {
        // JWT strategy (Credentials): user id comes from token.sub
        // Database strategy (Google): user id comes from user.id
        session.user.id = (token?.sub ?? user?.id) as string;
      }
      return session;
    },

    async jwt({ token, user }) {
      // Persist the user id in the JWT on first sign-in
      if (user?.id) token.sub = user.id;
      return token;
    },
  },

  session: {
    // Use JWT for Credentials (database sessions don't work out-of-the-box
    // with Credentials in NextAuth v5 when using FirestoreAdapter)
    strategy: 'jwt',
  },

  pages: {
    signIn: '/', // Using custom homepage for signin
  },
});
