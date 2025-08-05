'use client';
import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import { SessionProvider as CustomSessionProvider } from '@/contexts/SessionContext';
import React, { ReactNode, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import SessionPoller from './SessionPoller';

interface ExtendedSession {
  profileIncomplete?: boolean;
  registrationToken?: string;
}

interface Props { children: ReactNode }

function SessionRedirectHandler({ children }: Props) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only redirect if:
    // 1. Session is authenticated (not loading, not null)
    // 2. Profile is incomplete
    //3already on profile page
    if (
      status === 'authenticated' && 
      (session as ExtendedSession)?.profileIncomplete && 
      pathname !== '/profile-completion'
    ) {
      router.replace('/profile-completion');
    }
  }, [session, status, pathname, router]);

  return <>{children}</>;
}

function ServiceWorkerHandler() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    // Only run on client side
    if (typeof window === 'undefined') {
      return;
    }

    // Register service worker if not already registered
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/push-sw.js')
        .then((registration) => {
          console.log('[Service Worker] Registered:', registration);
        })
        .catch((error) => {
          console.error('[Service Worker] Registration failed:', error);
        });
    }
  }, [isClient]);

  return null;
}

export default function SessionProviderWrapper({ children }: Props) {
  return (
    <NextAuthSessionProvider>
      <CustomSessionProvider>
        <SessionPoller />
        <ServiceWorkerHandler />
        <SessionRedirectHandler>
          {children}
        </SessionRedirectHandler>
      </CustomSessionProvider>
    </NextAuthSessionProvider>
  );
}