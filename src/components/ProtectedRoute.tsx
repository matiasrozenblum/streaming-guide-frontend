'use client';

import { useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { data: session, status } = useSession();
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