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
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      if (name) await updateProfile(credential.user, { displayName: name });
      const idToken = await credential.user.getIdToken();
      const result = await signIn('firebase-credentials', { idToken, redirect: false });
      
      if (result?.error) { 
        setError('Failed to sign in after registration.'); 
      } else { 
        // Now that the session is established, initialize the budget
        try {
          const { saveBudget } = await import('@/app/actions/db');
          await saveBudget(5000);
        } catch (e) { 
          console.error('Failed to initialize user data:', e); 
        }
        router.push('/dashboard'); 
      }
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      setError(code === 'auth/email-already-in-use' ? 'An account with this email already exists.' : 'Sign up failed. Please try again.');
    } finally { setLoading(false); }
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    await signIn('google', { callbackUrl: '/dashboard' });
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');
        .auth-root { font-family: 'Space Grotesk', sans-serif; }
        .auth-input {
          display: block; width: 100%;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 10px; padding: 12px 16px;
          color: #e2e8f0; font-size: 15px;
          font-family: 'Space Grotesk', sans-serif;
          outline: none; transition: border-color .2s, box-shadow .2s;
        }
        .auth-input::placeholder { color: rgba(148,163,184,0.45); }
        .auth-input:focus { border-color: #2dd4bf; box-shadow: 0 0 0 3px rgba(45,212,191,0.12); }
        .auth-label {
          display: block; font-size: 11px; font-weight: 700;
          color: #64748b; letter-spacing: .08em; text-transform: uppercase; margin-bottom: 7px;
        }
        .auth-btn-primary {
          width: 100%; background: linear-gradient(135deg,#2dd4bf,#3b82f6);
          border: none; border-radius: 10px; padding: 13px;
          color: #0a1628; font-size: 15px; font-weight: 700;
          font-family: 'Space Grotesk', sans-serif; cursor: pointer;
          transition: opacity .2s, transform .1s; letter-spacing: .01em;
        }
        .auth-btn-primary:hover:not(:disabled) { opacity: .9; transform: translateY(-1px); }
        .auth-btn-primary:active { transform: scale(.98); }
        .auth-btn-primary:disabled { opacity: .45; cursor: not-allowed; }
        .auth-btn-google {
          width: 100%; background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; padding: 12px;
          color: #e2e8f0; font-size: 15px; font-weight: 600;
          font-family: 'Space Grotesk', sans-serif; cursor: pointer;
          transition: background .2s, border-color .2s;
          display: flex; align-items: center; justify-content: center; gap: 10px;
        }
        .auth-btn-google:hover { background: rgba(255,255,255,0.09); border-color: rgba(255,255,255,0.22); }
        .auth-divider {
          display: flex; align-items: center; gap: 12px;
          color: rgba(100,116,139,0.8); font-size: 12px; font-weight: 500;
        }
        .auth-divider::before, .auth-divider::after {
          content: ''; flex: 1; height: 1px; background: rgba(255,255,255,0.07);
        }
        .stat-mini {
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px; padding: 16px;
        }
        .text-gradient-teal {
          background: linear-gradient(135deg,#2dd4bf,#60a5fa);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
      `}</style>

      {/* CSS-Grid two-panel layout */}
      <main
        className="auth-root"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          minHeight: '100vh',
          background: '#050507',
          color: '#e2e8f0',
        }}
      >
        {/* ── LEFT PANEL ── */}
        <div style={{
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          padding: '48px', position: 'relative', overflow: 'hidden',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}>
          {/* Glows */}
          <div style={{ position: 'absolute', top: -160, left: -160, width: 400, height: 400, borderRadius: '50%', background: 'rgba(45,212,191,0.14)', filter: 'blur(100px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -120, right: -120, width: 300, height: 300, borderRadius: '50%', background: 'rgba(59,130,246,0.1)', filter: 'blur(80px)', pointerEvents: 'none' }} />

          {/* Logo */}
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 1, textDecoration: 'none' }}>
            <div style={{ width: 44, height: 44, backgroundColor: '#fff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Image
                src="/logo.png"
                alt="Lekha Tracker Logo" width={32} height={32} style={{ objectFit: 'contain' }} unoptimized
              />
            </div>
            <span style={{ fontSize: 22, fontWeight: 800, color: '#fff', fontFamily: "'Syne', sans-serif" }}>Lekha Tracker</span>
          </Link>

          {/* Headline */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 52, fontWeight: 800, lineHeight: 1.05, color: '#fff', marginBottom: 20 }}>
              Start your<br />financial{' '}
              <span className="text-gradient-teal">journey.</span>
            </h1>
            <p style={{ fontSize: 17, color: '#94a3b8', lineHeight: 1.7, marginBottom: 36, maxWidth: 380 }}>
              Join thousands who've taken control of their finances. Free forever for personal use.
            </p>

            {/* Mini stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, maxWidth: 380 }}>
              {[
                { value: '100%', label: 'Free for personal use' },
                { value: 'AI', label: 'Powered receipt scanning' },
                { value: 'Live', label: 'Real-time budget tracking' },
                { value: 'Secure', label: 'Firebase-backed auth' },
              ].map(s => (
                <div key={s.value} className="stat-mini">
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <p style={{ position: 'relative', zIndex: 1, fontSize: 12, color: '#1e293b' }}>
            © 2024 Lekha Tracker. All rights reserved.
          </p>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '48px', background: 'rgba(255,255,255,0.015)',
          overflowY: 'auto',
        }}>
          <div style={{ width: '100%', maxWidth: 400 }}>
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 32, fontWeight: 800, color: '#fff', marginBottom: 8 }}>
                Create an account
              </h2>
              <p style={{ color: '#64748b', fontSize: 15 }}>Join us today and take control of your finances.</p>
            </div>

            {error && (
              <div style={{ marginBottom: 20, padding: '12px 16px', borderRadius: 10, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', color: '#f87171', fontSize: 14 }}>
                {error}
              </div>
            )}

            {/* Google SSO */}
            <button onClick={handleGoogle} disabled={googleLoading} className="auth-btn-google" style={{ marginBottom: 16 }}>
              <GoogleIcon />
              {googleLoading ? 'Redirecting…' : 'Continue with Google'}
            </button>

            <div className="auth-divider" style={{ marginBottom: 20 }}>or sign up with email</div>

            <form onSubmit={handleSignUp}>
              <div style={{ marginBottom: 16 }}>
                <label className="auth-label" htmlFor="name">Full Name</label>
                <input id="name" className="auth-input" type="text" placeholder="Jane Doe"
                  value={name} onChange={e => setName(e.target.value)} required autoComplete="name" />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label className="auth-label" htmlFor="email">Email address</label>
                <input id="email" className="auth-input" type="email" placeholder="you@example.com"
                  value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
              </div>
              <div style={{ marginBottom: 8 }}>
                <label className="auth-label" htmlFor="password">Password</label>
                <input id="password" className="auth-input" type="password" placeholder="Min. 6 characters"
                  value={password} onChange={e => setPassword(e.target.value)} required autoComplete="new-password" />
              </div>
              <button type="submit" disabled={loading} className="auth-btn-primary" style={{ marginTop: 20 }}>
                {loading ? 'Creating Account…' : 'Create Account'}
              </button>
            </form>

            <p style={{ marginTop: 24, textAlign: 'center', color: '#475569', fontSize: 14 }}>
              Already have an account?{' '}
              <Link href="/login" style={{ color: '#2dd4bf', fontWeight: 600, textDecoration: 'none' }}>
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </main>
    </>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908C16.658 14.075 17.64 11.767 17.64 9.2z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}
