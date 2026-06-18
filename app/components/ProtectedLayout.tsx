'use client';

import React, { ReactNode, useEffect, useState, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import Navbar from './Navbar';
import Footer from './Footer';
import ScrollToTop from './ScrollToTop';
import { stripLocaleFromPath, useLocale } from '@/lib/i18n/client';
import { handleGlobalLogout } from '@/lib/auth/utils';
import { RouteAwareContent } from '@/components/skeletons';

interface ProtectedLayoutProps {
  children: ReactNode;
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const dispatch = useDispatch();
  // One-shot guard so the unauthenticated→login redirect fires at most once per mount
  // (prevents a hard-reload ping-pong if useSession briefly flaps).
  const redirectedRef = useRef(false);

  const isAuthenticated = status === 'authenticated';

  // Track if user was ever authenticated in this session.
  // Prevents clearing localStorage during the initial "loading" → "unauthenticated" flash
  // that happens before NextAuth reads the JWT cookie.
  const [wasAuthenticated, setWasAuthenticated] = useState(false);

  // Strip locale prefix for route matching
  const pathnameWithoutLocale = stripLocaleFromPath(pathname);
  const publicPages = ['/login', '/forgot-password', '/about', '/catalogue', '/locations', '/guides', '/privacy-policy', '/return-exchange-policy', '/terms-conditions'];
  const isPublicPage = publicPages.some(p => pathnameWithoutLocale.startsWith(p));

  // Sync NextAuth session with Redux & LocalStorage
  useEffect(() => {
    if (status === 'authenticated') {
      setWasAuthenticated(true);

      // Check if Magento token has expired (set by auth-options.ts JWT callback)
      if ((session as any)?.error === 'MagentoTokenExpired') {
        handleGlobalLogout(`${window.location.origin}/${locale}/login`);
        return;
      }

      if ((session as any)?.accessToken) {
        const token = (session as any).accessToken;
        dispatch({ type: 'LOGIN_SUCCESS', payload: token });
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', token);
        }
      }
    } else if (status === 'unauthenticated') {
      // Clear token for unauthenticated users on protected pages
      if (!isPublicPage) {
        dispatch({ type: 'LOGOUT' });
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
        }
      }
    }
  }, [session, status, dispatch, isPublicPage, wasAuthenticated]);

  const hideFooter = ['/login', '/forgot-password'].some(p => pathnameWithoutLocale.startsWith(p));
  const isLoading = status === 'loading';

  // Redirect unauthenticated users to login on protected pages.
  // Only acts on a DEFINITIVE 'unauthenticated' status (never 'loading'), uses a soft
  // client navigation (router.replace, not a full reload that resets useSession), and a
  // one-shot ref guard — so it can't spin in a reload loop.
  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated' && !isPublicPage && !redirectedRef.current) {
      redirectedRef.current = true;
      localStorage.removeItem('token');
      const loginUrl = `/${locale}/login?callbackUrl=${encodeURIComponent(pathname)}`;
      router.replace(loginUrl);
    }
    // Reset the guard once the user is authenticated again (e.g. after login).
    if (status === 'authenticated') redirectedRef.current = false;
  }, [status, isPublicPage, locale, pathname, router]);

  // Show route-matched skeleton while auth is checking on protected pages
  if (isLoading && !isPublicPage) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <Navbar />
        <main className="flex-1 flex flex-col w-full relative">
          <RouteAwareContent />
        </main>
      </div>
    );
  }

  // Don't render page content if unauthenticated on protected pages (redirecting to login)
  const showContent = isPublicPage || status === 'authenticated' || isLoading;

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />

      <main className="flex-1 flex flex-col w-full relative">
        <div className="flex-1 flex flex-col w-full min-h-0">
          {showContent ? children : <RouteAwareContent />}
        </div>

        {!hideFooter && <Footer />}
      </main>

      <ScrollToTop />
    </div>
  );
}
