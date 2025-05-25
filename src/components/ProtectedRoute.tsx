'use client';

import { useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useSessionContext } from '@/contexts/SessionContext';
import type { SessionWithToken } from '@/types/session';
import { Box, CircularProgress } from '@mui/material';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { session, status } = useSessionContext();
  const typedSession = session as SessionWithToken | null;
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      // No autenticado → redirige al login
      signIn(undefined, { callbackUrl: pathname });
    } else if (typedSession?.user.role !== 'admin') {
      // No es admin → redirige al home público
      router.push('/');
    }
  }, [status, typedSession, router, pathname]);

  // Si está cargando o no es admin (y no fue redirigido), muestra un loader o nada
  if (status === 'loading' || (status === 'authenticated' && typedSession?.user.role !== 'admin')) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return <>{children}</>;
}