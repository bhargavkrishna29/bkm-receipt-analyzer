'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

const errorMessages: Record<string, string> = {
  Configuration: 'There is a server configuration error. Please contact support.',
  AccessDenied: 'You do not have permission to sign in.',
  Verification: 'The sign-in link is invalid or has expired.',
  OAuthSignin: 'Could not start the sign-in flow. Please try again.',
  OAuthCallback: 'There was an error during the sign-in callback. Please try again.',
  OAuthCreateAccount: 'Could not create an account with this provider.',
  EmailCreateAccount: 'Could not create an account with this email.',
  Callback: 'There was an error during authentication. Please try again.',
  OAuthAccountNotLinked: 'This email is already associated with another sign-in method.',
  CredentialsSignin: 'Invalid email or password. Please check your credentials.',
  SessionRequired: 'You must be signed in to access this page.',
  Default: 'An unexpected error occurred during sign-in. Please try again.',
};

function AuthErrorContent() {
  const params = useSearchParams();
  const error = params.get('error') ?? 'Default';
  const message = errorMessages[error] ?? errorMessages.Default;

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="text-6xl">⚠️</div>
        <h1 className="text-2xl font-bold text-white">Sign-in Error</h1>
        <p className="text-gray-400">{message}</p>
        {process.env.NODE_ENV !== 'production' && error && (
          <p className="text-xs text-gray-600 font-mono">Error code: {error}</p>
        )}
        <div className="flex flex-col gap-3 pt-2">
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition"
          >
            Back to Sign-in
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <AuthErrorContent />
    </Suspense>
  );
}
