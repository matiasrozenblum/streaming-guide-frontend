'use client';
import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import { SessionProvider as CustomSessionProvider } from '@/contexts/SessionContext';
import React, { ReactNode } from 'react';

interface Props { children: ReactNode }
export default function SessionProviderWrapper({ children }: Props) {
  return (
    <NextAuthSessionProvider>
      <CustomSessionProvider>
        {children}
      </CustomSessionProvider>
    </NextAuthSessionProvider>
  );
}