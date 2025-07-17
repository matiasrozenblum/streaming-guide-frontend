'use client';
import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import { SessionProvider as CustomSessionProvider } from '@/contexts/SessionContext';
import React, { ReactNode, useEffect } from 'react';
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
      pathname !== '/profile'
    ) {
      console.log('[SessionRedirectHandler] Redirecting incomplete session to /profile');
      router.replace('/profile');
    }
  }, [session, status, pathname, router]);

  return <>{children}</>;
}

export default function SessionProviderWrapper({ children }: Props) {
  return (
    <NextAuthSessionProvider>
      <CustomSessionProvider>
        <SessionPoller />
        <SessionRedirectHandler>
          {children}
        </SessionRedirectHandler>
      </CustomSessionProvider>
    </NextAuthSessionProvider>
  );
}