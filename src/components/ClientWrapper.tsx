'use client';

import { LiveStatusProvider } from '@/contexts/LiveStatusContext';

export function ClientWrapper({ children }: { children: React.ReactNode }) {
  return <LiveStatusProvider>{children}</LiveStatusProvider>;
} 