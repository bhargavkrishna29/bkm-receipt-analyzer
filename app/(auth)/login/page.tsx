'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { firebaseAuth } from '@/lib/firebase-client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      } else {
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      setError(code === 'auth/invalid-credential' ? 'Incorrect email or password.' : 'Sign in failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-background text-on-background min-h-screen flex items-center justify-center font-body-md overflow-hidden relative">
      {/* Decorative Background Elements */}
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-20 hidden md:block"
        style={{
          backgroundImage:
            "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAnlLUpA8oRXCdh_tS2NM2dG5QnBaRXoPeV-dAqnjweHXsUl3JIsLOBckzWjVAwBhpRk2UrDwxlIWp9agMw5FoyLGVcl1HtkhXAIpylJQG-iyKxp49nYRIam1i8-s7SpuXM2aMVTMp6sCol-WAHC93IGOFvKpNCSVucSKAK9pwxAXp7-nTPv1W6UjJsry1VZeYZ2VjnvCoYZRm0czvfUe3BzH_OCtvMmnUea-AszZkWJ6Ko-0xgb_J76eHiY9PdgbTMRDM8sUeADSAz')",
        }}
      ></div>
      <div className="absolute -top-64 -right-64 w-[800px] h-[800px] bg-primary-fixed rounded-full blur-[120px] opacity-30 z-0 pointer-events-none"></div>
      <div className="absolute -bottom-64 -left-64 w-[600px] h-[600px] bg-surface-variant rounded-full blur-[100px] opacity-40 z-0 pointer-events-none"></div>

      <div className="w-full max-w-[1000px] mx-margin-mobile md:mx-margin-desktop bg-surface rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.05)] border border-outline-variant flex flex-col md:flex-row overflow-hidden relative z-10 min-h-[600px]">
        {/* Left Side: Branding / Illustration (Hidden on mobile) */}
        <div className="hidden md:flex md:w-1/2 bg-surface-container-high p-xl flex-col justify-between relative border-r border-outline-variant">
          <div>
            <div className="flex items-center gap-sm mb-lg">
              <Image
                alt="Lekha Tracker Logo"
                className="w-12 h-12 object-contain"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBMEmwQJVDQVfGITFEyI3uBNhPN6Co2ugnqCHDMEVDKNpUjEMbY4fhZkYgBJ1D9CToTDuLvP7QfTS_Y6Y4Ft-9xHtiGpbGJSx1w0_-sFmk7hMlWtGUbDC2JDj2Sq2sGpe9jn5GvzlWLjsUDToyFQ8bAiAHZbP4xjeYmifwjs3SMsVUGsgdUEAWFrgGpiE5F9Wzq8IsYoNhQTQQn9gKxhw9CocwIFY5oShPgkOwFC7eOXoiFj1EDcSft4SDkg0oeXDA5e5GWYRGN9GhT"
                width={48}
                height={48}
              />
              <span className="font-headline-md text-headline-md text-primary tracking-tight">Lekha Tracker</span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface mb-md max-w-md">
              Financial intelligence, simplified.
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-sm">
              Secure access to your professional financial dashboard. Track, analyze, and optimize your business
              performance.
            </p>
          </div>
          <div className="mt-auto">
            <div
              className="h-64 w-full rounded-lg bg-surface-container shadow-sm border border-outline-variant flex items-end overflow-hidden p-md relative"
              style={{
                backgroundImage:
                  "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDNHjlEFJOfFf-mEPh_NNH1GSRW5Jmv58Y1J9D4Vl3qpg6L65kz4s28jTxZW8D8fphyj54cJ76nsNgYIR64aDL8pezY1fkWNCQ5TXRseF9t3Ut0wIfsXS_z3BUtPXqzfL5eTc2BzPPE8jnyW4XzBSDe7OR8BGnEVPH242GFC-ADjHlldXxV9D_sk1lZbkbWxpxmvy3s4mUyLE_m6jPkLMVyuKYFUUNU0my3KpfsQoQeO4lbfpXW70C2wVjym_YD9q4rfY2wC88ppRlr')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {/* Faux chart overlay for texture */}
              <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-primary/10 to-transparent"></div>
            </div>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="w-full md:w-1/2 p-lg md:p-xl flex flex-col justify-center bg-surface">
          {/* Mobile Logo */}
          <div className="md:hidden flex items-center justify-center gap-sm mb-lg">
            <Image
              alt="Lekha Tracker Logo"
              className="w-10 h-10 object-contain"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBMEmwQJVDQVfGITFEyI3uBNhPN6Co2ugnqCHDMEVDKNpUjEMbY4fhZkYgBJ1D9CToTDuLvP7QfTS_Y6Y4Ft-9xHtiGpbGJSx1w0_-sFmk7hMlWtGUbDC2JDj2Sq2sGpe9jn5GvzlWLjsUDToyFQ8bAiAHZbP4xjeYmifwjs3SMsVUGsgdUEAWFrgGpiE5F9Wzq8IsYoNhQTQQn9gKxhw9CocwIFY5oShPgkOwFC7eOXoiFj1EDcSft4SDkg0oeXDA5e5GWYRGN9GhT"
              width={40}
              height={40}
            />
            <span className="font-headline-md text-headline-md text-primary tracking-tight">Lekha Tracker</span>
          </div>
          <div className="mb-xl text-center md:text-left">
            <h2 className="font-headline-md text-headline-md text-on-surface mb-xs">Welcome back</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">Please enter your details to sign in.</p>
          </div>
          {error && <p className="text-error font-body-sm text-center mb-md">{error}</p>}
          <form className="space-y-md" onSubmit={handleSignIn}>
            <div>
              <label className="block font-label-md text-label-md text-on-surface mb-base" htmlFor="email">
                Email address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-sm text-outline">
                  <span className="material-symbols-outlined text-[20px]">mail</span>
                </span>
                <input
                  className="w-full pl-xl pr-sm py-sm bg-surface-container-lowest border border-outline-variant rounded focus:ring-2 focus:ring-primary focus:border-primary text-on-surface font-body-md text-body-md transition-colors"
                  id="email"
                  name="email"
                  placeholder="name@company.com"
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block font-label-md text-label-md text-on-surface mb-base" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-sm text-outline">
                  <span className="material-symbols-outlined text-[20px]">lock</span>
                </span>
                <input
                  className="w-full pl-xl pr-sm py-sm bg-surface-container-lowest border border-outline-variant rounded focus:ring-2 focus:ring-primary focus:border-primary text-on-surface font-body-md text-body-md transition-colors"
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center justify-between mt-sm mb-lg">
              <label className="flex items-center gap-xs cursor-pointer group">
                <input
                  className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary bg-surface-container-lowest cursor-pointer"
                  type="checkbox"
                />
                <span className="font-body-sm text-body-sm text-on-surface-variant group-hover:text-on-surface transition-colors">
                  Remember me
                </span>
              </label>
              <a
                className="font-label-md text-label-md text-primary hover:text-on-primary-fixed-variant transition-colors"
                href="#"
              >
                Forgot password?
              </a>
            </div>
            <button
              className="w-full py-sm bg-primary text-on-primary font-label-md text-label-md rounded flex justify-center items-center gap-xs hover:bg-on-primary-fixed-variant active:scale-[0.98] transition-all shadow-sm disabled:opacity-50"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-xl text-center">
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Don't have an account?
              <Link
                className="font-label-md text-label-md text-primary hover:text-on-primary-fixed-variant transition-colors ml-xs"
                href="/signup"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
