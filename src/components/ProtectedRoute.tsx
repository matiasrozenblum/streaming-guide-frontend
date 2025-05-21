'use client';

import { useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useSessionContext } from '@/contexts/SessionContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { session, status } = useSessionContext();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      // No autenticado → redirige al login
      signIn(undefined, { callbackUrl: pathname });
    } else if (session.user.role !== 'admin') {
      // No es admin → redirige al home público
      router.push('/');
    }
  }, [session, status, router, pathname]);

  if (status !== 'authenticated' || session?.user.role !== 'admin') {
    return null;
  }

  return <>{children}</>;
}