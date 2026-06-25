'use client';

import { useState, FormEvent } from 'react';
import {
  signInWithGoogle,
  signUpWithEmail,
  signInWithEmail,
  resendVerificationEmail,
  friendlyAuthError,
} from '@/lib/auth';

interface AuthScreenProps {
  onToast: (msg: string) => void;
}

export default function AuthScreen({ onToast }: AuthScreenProps) {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [signInError, setSignInError] = useState('');
  const [signUpError, setSignUpError] = useState('');
  const [signInLoading, setSignInLoading] = useState(false);
  const [signUpLoading, setSignUpLoading] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState('');
  const [showVerifyBanner, setShowVerifyBanner] = useState(false);

  async function handleGoogleSignIn() {
    setSignInError('');
    try {
      await signInWithGoogle();
    } catch (err) {
      setSignInError(friendlyAuthError(err));
    }
  }

  async function handleSignIn(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const email = (form.elements.namedItem('siEmail') as HTMLInputElement).value.trim();
    const password = (form.elements.namedItem('siPassword') as HTMLInputElement).value;
    setSignInError('');
    setSignInLoading(true);
    try {
      await signInWithEmail(email, password);
    } catch (err) {
      setSignInError(friendlyAuthError(err));
    } finally {
      setSignInLoading(false);
    }
  }

  async function handleSignUp(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const email = (form.elements.namedItem('suEmail') as HTMLInputElement).value.trim();
    const password = (form.elements.namedItem('suPassword') as HTMLInputElement).value;
    setSignUpError('');
    setSignUpLoading(true);
    try {
      const user = await signUpWithEmail(email, password);
      setVerifyEmail(user.email ?? '');
      setShowVerifyBanner(true);
    } catch (err) {
      setSignUpError(friendlyAuthError(err));
    } finally {
      setSignUpLoading(false);
    }
  }

  async function handleResend() {
    try {
      await resendVerificationEmail();
      onToast('Verification email resent ✓');
    } catch (err) {
      onToast('Failed to resend: ' + (err as Error).message);
    }
  }

  return (
    <div className="auth-screen" id="authScreen">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="logo-icon">◈</span>
          <span className="logo-text">Spendwise</span>
          <p className="auth-tagline">Upload receipts. Track spending. Get AI insights.</p>
        </div>

        {showVerifyBanner && (
          <div className="auth-verify-banner" id="authVerifyBanner">
            <span>📧</span>
            <div>
              <strong>Check your email</strong>
              <p>We sent a verification link to <span id="verifyEmail">{verifyEmail}</span></p>
            </div>
            <button className="btn-text" id="resendVerifyBtn" onClick={handleResend}>Resend</button>
          </div>
        )}

        {/* Tabs */}
        <div className="auth-tabs" id="authTabs">
          <button
            className={`auth-tab${tab === 'signin' ? ' active' : ''}`}
            id="tabSignIn"
            onClick={() => setTab('signin')}
          >
            Sign In
          </button>
          <button
            className={`auth-tab${tab === 'signup' ? ' active' : ''}`}
            id="tabSignUp"
            onClick={() => setTab('signup')}
          >
            Sign Up
          </button>
        </div>

        {/* Google Button */}
        <button className="btn-google" id="googleSignInBtn" onClick={handleGoogleSignIn}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div className="auth-divider"><span>or</span></div>

        {/* Sign In Form */}
        {tab === 'signin' && (
          <form className="auth-form" id="signInForm" onSubmit={handleSignIn}>
            <div className="input-group">
              <label className="input-label" htmlFor="siEmail">Email</label>
              <input type="email" id="siEmail" name="siEmail" className="input-field" placeholder="you@example.com" required autoComplete="email" />
            </div>
            <div className="input-group">
              <label className="input-label" htmlFor="siPassword">Password</label>
              <input type="password" id="siPassword" name="siPassword" className="input-field" placeholder="Your password" required autoComplete="current-password" />
            </div>
            {signInError && <div className="auth-error" id="signInError">{signInError}</div>}
            <button type="submit" className="btn-primary btn-full" id="signInBtn" disabled={signInLoading}>
              {signInLoading ? 'Please wait…' : 'Sign In'}
            </button>
          </form>
        )}

        {/* Sign Up Form */}
        {tab === 'signup' && (
          <form className="auth-form" id="signUpForm" onSubmit={handleSignUp}>
            <div className="input-group">
              <label className="input-label" htmlFor="suEmail">Email</label>
              <input type="email" id="suEmail" name="suEmail" className="input-field" placeholder="you@example.com" required autoComplete="email" />
            </div>
            <div className="input-group">
              <label className="input-label" htmlFor="suPassword">Password</label>
              <input type="password" id="suPassword" name="suPassword" className="input-field" placeholder="Min 6 characters" required autoComplete="new-password" minLength={6} />
            </div>
            {signUpError && <div className="auth-error" id="signUpError">{signUpError}</div>}
            <button type="submit" className="btn-primary btn-full" id="signUpBtn" disabled={signUpLoading}>
              {signUpLoading ? 'Please wait…' : 'Create Account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
