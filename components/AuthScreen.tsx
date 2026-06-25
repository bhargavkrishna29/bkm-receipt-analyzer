'use client';

import { useState } from 'react';
import Image from 'next/image';
import { signIn } from 'next-auth/react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { firebaseAuth } from '@/lib/firebase-client';

type Tab = 'signin' | 'signup';
type View = 'form' | 'reset' | 'verify';

// ── Map Firebase error codes to friendly messages ────────────────────────────
function friendlyError(code: string): string {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Incorrect email or password.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Try signing in.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

export default function AuthScreen() {
  const [tab, setTab] = useState<Tab>('signin');
  const [view, setView] = useState<View>('form');

  // Shared fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);

  function switchTab(t: Tab) {
    setTab(t);
    setView('form');
    setError('');
    setPassword('');
    setConfirmPassword('');
  }

  // ── Sign In ──────────────────────────────────────────────────────────────────
  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
      const idToken = await credential.user.getIdToken();
      const result = await signIn('firebase-credentials', { idToken, redirect: false });
      if (result?.error) {
        setError('Sign in failed. Please try again.');
      }
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      setError(friendlyError(code));
    } finally {
      setLoading(false);
    }
  }

  // ── Sign Up ──────────────────────────────────────────────────────────────────
  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      // Send email verification
      await sendEmailVerification(credential.user);
      // Sign in immediately via NextAuth
      const idToken = await credential.user.getIdToken();
      const result = await signIn('firebase-credentials', { idToken, redirect: false });
      if (result?.error) {
        setError('Account created but sign in failed. Please try signing in.');
      } else {
        setView('verify');
      }
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      setError(friendlyError(code));
    } finally {
      setLoading(false);
    }
  }

  // ── Password Reset ──────────────────────────────────────────────────────────
  async function handlePasswordReset(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await sendPasswordResetEmail(firebaseAuth, resetEmail);
      setResetSent(true);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      setError(friendlyError(code));
    } finally {
      setLoading(false);
    }
  }

  // ── Google ──────────────────────────────────────────────────────────────────
  async function handleGoogle() {
    setLoading(true);
    await signIn('google');
  }

  // ── Forgot Password View ─────────────────────────────────────────────────────
  if (view === 'reset') {
    return (
      <div className="auth-screen" id="authScreen">
        <div className="auth-card">
          <div className="auth-brand">
            <Image src="/logo.png" alt="Lekha Tracker" width={160} height={54} className="auth-logo" priority />
          </div>

          <h2 className="auth-section-title">Reset your password</h2>
          <p className="auth-section-sub">
            Enter your email and we&apos;ll send you a reset link.
          </p>

          {resetSent ? (
            <div className="auth-verify-banner">
              <span>✉️</span>
              <div>
                <strong>Email sent!</strong>
                <p>Check your inbox for a password reset link.</p>
              </div>
            </div>
          ) : (
            <form className="auth-form" onSubmit={handlePasswordReset} noValidate>
              {error && <div className="auth-error" role="alert">{error}</div>}
              <div className="input-group">
                <label className="input-label" htmlFor="resetEmail">Email address</label>
                <input
                  id="resetEmail"
                  className="input"
                  type="email"
                  placeholder="you@example.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <button
                id="sendResetBtn"
                className="btn-primary btn-full"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
          )}

          <button
            className="auth-back-link"
            id="backToSignInBtn"
            onClick={() => { setView('form'); setResetSent(false); setError(''); }}
          >
            ← Back to sign in
          </button>
        </div>
      </div>
    );
  }

  // ── Email Verification Banner ─────────────────────────────────────────────────
  if (view === 'verify') {
    return (
      <div className="auth-screen" id="authScreen">
        <div className="auth-card">
          <div className="auth-brand">
            <Image src="/logo.png" alt="Lekha Tracker" width={160} height={54} className="auth-logo" priority />
          </div>
          <div className="auth-verify-banner">
            <span>✉️</span>
            <div>
              <strong>Verify your email</strong>
              <p>
                We&apos;ve sent a verification link to <strong>{email}</strong>.
                Check your inbox — you can start using the app right away.
              </p>
            </div>
          </div>
          <button
            className="btn-primary btn-full"
            id="continueBtn"
            onClick={() => window.location.reload()}
          >
            Continue to app →
          </button>
        </div>
      </div>
    );
  }

  // ── Main Auth Form ────────────────────────────────────────────────────────────
  return (
    <div className="auth-screen" id="authScreen">
      <div className="auth-card">
        <div className="auth-brand">
          <Image src="/logo.png" alt="Lekha Tracker" width={160} height={54} className="auth-logo" priority />
          <p className="auth-tagline">Upload receipts. Track spending. Get AI insights.</p>
        </div>

        {/* Tab switcher */}
        <div className="auth-tabs" role="tablist">
          <button
            role="tab"
            aria-selected={tab === 'signin'}
            className={`auth-tab${tab === 'signin' ? ' active' : ''}`}
            id="signinTab"
            onClick={() => switchTab('signin')}
          >
            Sign In
          </button>
          <button
            role="tab"
            aria-selected={tab === 'signup'}
            className={`auth-tab${tab === 'signup' ? ' active' : ''}`}
            id="signupTab"
            onClick={() => switchTab('signup')}
          >
            Sign Up
          </button>
        </div>

        {/* Google button */}
        <button
          className="btn-google"
          id="googleSignInBtn"
          onClick={handleGoogle}
          disabled={loading}
          type="button"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div className="auth-divider"><span>or</span></div>

        {/* ── Sign In Form ── */}
        {tab === 'signin' && (
          <form className="auth-form" id="signInForm" onSubmit={handleSignIn} noValidate>
            {error && <div className="auth-error" role="alert">{error}</div>}

            <div className="input-group">
              <label className="input-label" htmlFor="signinEmail">Email address</label>
              <input
                id="signinEmail"
                className="input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="input-group">
              <div className="input-label-row">
                <label className="input-label" htmlFor="signinPassword">Password</label>
                <button
                  type="button"
                  className="auth-forgot-link"
                  id="forgotPasswordBtn"
                  onClick={() => {
                    setResetEmail(email);
                    setView('reset');
                    setError('');
                  }}
                >
                  Forgot password?
                </button>
              </div>
              <input
                id="signinPassword"
                className="input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <button
              id="signInBtn"
              className="btn-primary btn-full"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        )}

        {/* ── Sign Up Form ── */}
        {tab === 'signup' && (
          <form className="auth-form" id="signUpForm" onSubmit={handleSignUp} noValidate>
            {error && <div className="auth-error" role="alert">{error}</div>}

            <div className="input-group">
              <label className="input-label" htmlFor="signupEmail">Email address <span className="auth-field-note">(this is your username)</span></label>
              <input
                id="signupEmail"
                className="input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="signupPassword">Password</label>
              <input
                id="signupPassword"
                className="input"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="signupConfirmPassword">Confirm password</label>
              <input
                id="signupConfirmPassword"
                className="input"
                type="password"
                placeholder="Repeat your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>

            <button
              id="signUpBtn"
              className="btn-primary btn-full"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>

            <p className="auth-tos">
              By signing up you agree to our{' '}
              <span className="auth-tos-link">Terms of Service</span>.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
