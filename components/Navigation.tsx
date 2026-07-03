'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { useData } from './DataProvider';
import { signOut, useSession } from 'next-auth/react';
import { useTheme } from './ThemeProvider';
import { ExchangeRateBanner } from './ExchangeRateBanner';

export function Navigation({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { notifications, markNotificationsRead } = useData();
  const { theme, toggleTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check admin role via server-side API (reliable — no NEXT_PUBLIC_ dependency)
  useEffect(() => {
    async function checkRole() {
      if (!session?.user?.id) return;
      try {
        const res = await fetch('/api/admin/check');
        const data = await res.json();
        setIsAdmin(data.isAdmin === true);
      } catch {
        // silently ignore — non-admin is the safe default
      }
    }
    checkRole();
  }, [session?.user?.id]);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfile(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
    { name: 'Receipts', href: '/receipts', icon: 'receipt_long' },
    { name: 'Budget', href: '/budget', icon: 'account_balance_wallet' },
    { name: 'Reports', href: '/reports', icon: 'bar_chart' },
    { name: 'Settings', href: '/settings', icon: 'settings' },
    ...(isAdmin ? [{ name: 'Admin Panel', href: '/admin', icon: 'admin_panel_settings' }] : []),
  ];

  return (
    <div className="bg-surface text-on-surface font-body-md min-h-screen flex">
      {/* SideNavBar */}
      <nav className="h-screen w-64 fixed left-0 top-0 bg-surface-container-low hidden md:flex flex-col py-lg px-md z-50 border-r border-outline-variant">
        <Link href="/" className="mb-xl block cursor-pointer group">
          <div className="flex items-center gap-3 mb-sm">
            <div className="w-12 h-12 bg-white rounded-md flex items-center justify-center flex-shrink-0 shadow-sm group-hover:shadow transition-shadow">
              <Image
                src="/logo.png"
                alt="Lekha Tracker Logo" width={36} height={36} className="object-contain" unoptimized
              />
            </div>
            <h1 className="font-headline-md text-2xl font-bold text-primary tracking-tight">
              Lekha Tracker
            </h1>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant ml-1">Financial Intelligence</p>
        </Link>

        <ul className="flex flex-col gap-xs flex-grow">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-sm px-md py-sm rounded-lg transition-colors transition-all duration-200 ease-in-out ${
                    isActive
                      ? 'text-primary font-bold border-r-4 border-primary bg-surface-variant'
                      : 'text-on-surface-variant hover:bg-surface-variant'
                  }`}
                >
                  <span
                    className="material-symbols-outlined"
                    style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                  >
                    {item.icon}
                  </span>
                  <span className="font-body-md text-body-md">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-auto">
          <button className="w-full bg-primary text-on-primary font-label-md text-label-md py-sm px-md rounded-full hover:bg-primary-container transition-colors shadow-sm flex items-center justify-center gap-xs">
            <span className="material-symbols-outlined text-[18px]">upload</span>
            Upload Receipt
          </button>
        </div>
      </nav>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-h-screen md:ml-64 w-full">
        {/* TopAppBar */}
        <header className="docked full-width top-0 sticky z-40 bg-surface border-b border-outline-variant flex justify-between items-center w-full px-margin-desktop py-xs shadow-none">
          <div className="flex items-center md:hidden">
            <Link href="/" className="flex items-center gap-2 cursor-pointer">
              <div className="w-8 h-8 bg-white rounded flex items-center justify-center flex-shrink-0 shadow-sm">
                <Image src="/logo.png" alt="Lekha Tracker Logo" width={24} height={24} className="object-contain" unoptimized />
              </div>
              <h1 className="font-headline-md text-xl font-bold text-primary tracking-tight">
                Lekha Tracker
              </h1>
            </Link>
          </div>
          

          
          {/* Actions */}
          <div className="flex items-center gap-sm ml-auto">
            {/* Dark / Light toggle */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="p-xs rounded-full text-on-surface-variant hover:text-primary hover:bg-surface-container transition-all duration-200"
            >
              <span className="material-symbols-outlined text-[22px]">
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
              </span>
            </button>

            <div className="relative" ref={notifRef}>
              <button 
                className="p-xs rounded-full text-on-surface-variant dark:text-outline-variant hover:text-primary dark:hover:text-secondary-fixed transition-colors scale-95 active:scale-100 transition-transform relative"
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  if (!showNotifications && unreadCount > 0) markNotificationsRead();
                }}
              >
                <span className="material-symbols-outlined text-[24px]">notifications</span>
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full border border-surface"></span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-surface border border-outline-variant rounded-xl shadow-lg z-50 overflow-hidden">
                  <div className="p-md border-b border-outline-variant">
                    <h3 className="font-headline-sm text-on-surface">Notifications</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {!notifications || notifications.length === 0 ? (
                      <div className="p-md text-center text-on-surface-variant font-body-sm">
                        No notifications yet.
                      </div>
                    ) : (
                      <ul className="flex flex-col">
                        {notifications.map(n => (
                          <li key={n.id} className={`p-md border-b border-outline-variant hover:bg-surface-container-lowest last:border-b-0 ${!n.read ? 'bg-primary/5' : ''}`}>
                            <p className="font-body-sm text-on-surface">{n.message}</p>
                            <p className="font-label-sm text-on-surface-variant mt-xs">
                              {new Date(n.time).toLocaleString()}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="relative" ref={profileRef}>
              <div 
                className="w-8 h-8 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-label-md font-bold cursor-pointer ml-sm ring-2 ring-transparent hover:ring-primary-fixed transition-all select-none"
                onClick={() => setShowProfile(!showProfile)}
              >
                {session?.user?.name?.[0]?.toUpperCase() || session?.user?.email?.[0]?.toUpperCase() || 'U'}
              </div>

              {showProfile && (
                <div className="absolute right-0 mt-2 w-48 bg-surface border border-outline-variant rounded-xl shadow-lg z-50 overflow-hidden py-xs">
                  <div className="px-md py-sm border-b border-outline-variant">
                    <p className="font-label-md text-on-surface truncate">{session?.user?.name || 'User'}</p>
                    <p className="font-body-sm text-on-surface-variant truncate">{session?.user?.email}</p>
                  </div>
                  <div className="flex flex-col">
                    <Link href="/settings" className="px-md py-sm hover:bg-surface-container-lowest font-body-md flex items-center gap-sm transition-colors text-on-surface" onClick={() => setShowProfile(false)}>
                      <span className="material-symbols-outlined text-[20px]">person</span>
                      Profile Settings
                    </Link>
                    {isAdmin && (
                      <Link href="/admin" className="px-md py-sm hover:bg-primary/10 font-body-md flex items-center gap-sm transition-colors text-primary" onClick={() => setShowProfile(false)}>
                        <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
                        Admin Panel
                      </Link>
                    )}
                    <button 
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="px-md py-sm hover:bg-error-container text-error font-body-md flex items-center gap-sm transition-colors w-full text-left"
                    >
                      <span className="material-symbols-outlined text-[20px]">logout</span>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
        
        <ExchangeRateBanner />
        
        <main className="p-margin-mobile md:p-margin-desktop max-w-[1200px] mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
