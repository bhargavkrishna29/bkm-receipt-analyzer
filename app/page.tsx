'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import LandingPage from '@/components/LandingPage';

export default function RootPage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/dashboard');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center">
          <span className="material-symbols-outlined text-4xl text-primary mb-2 animate-spin">refresh</span>
          <p className="font-body-sm text-on-surface-variant">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'authenticated') {
    return null; // Will redirect
  }

  // Render the landing page for unauthenticated users
  return <LandingPage />;
}

