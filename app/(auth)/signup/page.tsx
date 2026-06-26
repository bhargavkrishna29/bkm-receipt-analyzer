'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { firebaseAuth } from '@/lib/firebase-client';
import { signIn } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      
      if (name) {
        await updateProfile(credential.user, { displayName: name });
      }

      // Initialize default data (budget, etc.)
      try {
        const { saveBudget } = await import('@/app/actions/db');
        await saveBudget(5000); // Default budget
      } catch (e) {
        console.error('Failed to initialize user data:', e);
      }

      const idToken = await credential.user.getIdToken();
      const result = await signIn('firebase-credentials', { idToken, redirect: false });
      
      if (result?.error) {
        setError('Failed to log in after sign up.');
      } else {
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      setError(code === 'auth/email-already-in-use' ? 'An account with this email already exists.' : 'Sign up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex-1 flex flex-col md:flex-row w-full max-w-[1440px] mx-auto min-h-screen">
      {/* Left Side: Interactive/Visual Panel (Desktop Only) */}
      <div className="hidden md:flex flex-1 bg-surface-container-low flex-col p-margin-desktop relative overflow-hidden border-r border-outline-variant">
        <div className="z-10 flex flex-col h-full">
          <div className="flex items-center gap-3">
            <Image
              alt="Lekha Tracker Logo"
              className="h-10 w-10 object-contain"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBMEmwQJVDQVfGITFEyI3uBNhPN6Co2ugnqCHDMEVDKNpUjEMbY4fhZkYgBJ1D9CToTDuLvP7QfTS_Y6Y4Ft-9xHtiGpbGJSx1w0_-sFmk7hMlWtGUbDC2JDj2Sq2sGpe9jn5GvzlWLjsUDToyFQ8bAiAHZbP4xjeYmifwjs3SMsVUGsgdUEAWFrgGpiE5F9Wzq8IsYoNhQTQQn9gKxhw9CocwIFY5oShPgkOwFC7eOXoiFj1EDcSft4SDkg0oeXDA5e5GWYRGN9GhT"
              width={40}
              height={40}
            />
            <span className="text-headline-md font-bold text-primary">Lekha Tracker</span>
          </div>
          <div className="mt-auto mb-auto max-w-md">
            <h1 className="text-display-lg text-on-surface mb-6">Start your financial journey.</h1>
            <p className="text-body-lg text-on-surface-variant">
              Track your expenses, analyze your spending habits, and optimize your personal finances seamlessly with
              Lekha Tracker.
            </p>
          </div>
          <div className="mt-auto text-body-sm text-on-surface-variant">
            © 2024 Lekha Tracker. All rights reserved.
          </div>
        </div>
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-secondary/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4"></div>
      </div>

      {/* Right Side: Sign Up Form */}
      <div className="flex-1 flex items-center justify-center p-margin-mobile md:p-margin-desktop bg-surface relative">
        <div className="w-full max-w-md z-10">
          {/* Mobile Logo */}
          <div className="flex items-center gap-3 mb-8 md:hidden">
            <Image
              alt="Lekha Tracker Logo"
              className="h-8 w-8 object-contain"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBMEmwQJVDQVfGITFEyI3uBNhPN6Co2ugnqCHDMEVDKNpUjEMbY4fhZkYgBJ1D9CToTDuLvP7QfTS_Y6Y4Ft-9xHtiGpbGJSx1w0_-sFmk7hMlWtGUbDC2JDj2Sq2sGpe9jn5GvzlWLjsUDToyFQ8bAiAHZbP4xjeYmifwjs3SMsVUGsgdUEAWFrgGpiE5F9Wzq8IsYoNhQTQQn9gKxhw9CocwIFY5oShPgkOwFC7eOXoiFj1EDcSft4SDkg0oeXDA5e5GWYRGN9GhT"
              width={32}
              height={32}
            />
            <span className="text-headline-md font-bold text-primary">Lekha Tracker</span>
          </div>
          <h2 className="text-headline-lg text-on-surface mb-2">Create an account</h2>
          <p className="text-body-md text-on-surface-variant mb-8">Join us today and take control of your finances.</p>
          {error && <p className="text-error font-body-sm text-center mb-md">{error}</p>}
          <form className="space-y-5" onSubmit={handleSignUp}>
            <div>
              <label className="block text-body-sm font-medium text-on-surface mb-1.5" htmlFor="name">
                Full Name
              </label>
              <input
                className="block w-full rounded-lg border-outline-variant bg-surface px-4 py-2.5 text-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                id="name"
                name="name"
                placeholder="John Doe"
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-body-sm font-medium text-on-surface mb-1.5" htmlFor="email">
                Email address
              </label>
              <input
                className="block w-full rounded-lg border-outline-variant bg-surface px-4 py-2.5 text-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                id="email"
                name="email"
                placeholder="john@example.com"
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-body-sm font-medium text-on-surface mb-1.5" htmlFor="password">
                Password
              </label>
              <input
                className="block w-full rounded-lg border-outline-variant bg-surface px-4 py-2.5 text-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                id="password"
                name="password"
                placeholder="••••••••"
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p className="mt-1.5 text-xs text-on-surface-variant">Must be at least 6 characters long.</p>
            </div>
            <div className="pt-2">
              <button
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-full shadow-sm text-body-md font-medium text-on-primary bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:opacity-50"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>
          </form>
          <p className="mt-8 text-center text-body-sm text-on-surface-variant">
            Already have an account?{' '}
            <Link className="font-medium text-primary hover:text-primary/80 hover:underline transition-colors" href="/login">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
