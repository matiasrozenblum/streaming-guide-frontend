'use client';

import { useEffect } from 'react';
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
      // Redirect to home and open login modal
      router.push('/?login=true');
    } else if (typedSession?.user.role !== 'admin') {
      // Not admin → redirect to home
      router.push('/');
    }
  }, [status, typedSession, router, pathname]);

  // Show loader while loading or if not admin
  if (status === 'loading' || (status === 'authenticated' && typedSession?.user.role !== 'admin')) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return <>{children}</>;
}