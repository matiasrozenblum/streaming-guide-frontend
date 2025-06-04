'use client';
import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import { SessionProvider as CustomSessionProvider } from '@/contexts/SessionContext';
import React, { ReactNode } from 'react';
import SessionPoller from './SessionPoller';

interface Props { children: ReactNode }
export default function SessionProviderWrapper({ children }: Props) {
  return (
    <NextAuthSessionProvider>
      <CustomSessionProvider>
        <SessionPoller />
        {children}
      </CustomSessionProvider>
    </NextAuthSessionProvider>
  );
}