import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? 'https://lekhatracker.app'
  ),
  title: 'Lekha Tracker — Receipt Analyzer',
  description:
    'Upload receipts, track spending, and get AI-powered insights on your expenses. Sign up free.',
  icons: {
    icon: [
      { url: '/icon.png', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'Lekha Tracker',
    description: 'Upload receipts, track spending, and get AI-powered insights.',
    images: [{ url: '/logo.png', width: 1024, height: 1024, alt: 'Lekha Tracker Logo' }],
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Lekha Tracker',
    description: 'Upload receipts, track spending, and get AI-powered insights.',
    images: ['/logo.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Anti-FOUC: apply saved theme class before first paint */}
        {/* suppressHydrationWarning prevents React from complaining when a
            browser extension modifies this element's attributes before hydration */}
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('lekha-theme');if(t==='light'){document.documentElement.classList.remove('dark')}else{document.documentElement.classList.add('dark')}}catch(e){}})();`,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Syne:wght@400;700;800&display=swap"
          rel="stylesheet"
        />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,1,0" rel="stylesheet" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

