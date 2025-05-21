'use client';

import { useEffect, useState } from 'react';
import { useSessionContext } from '@/contexts/SessionContext';
import { getSession } from 'next-auth/react';
import {
  Box,
  Typography,
  Paper,
  Snackbar,
  Alert,
  useTheme,
  CircularProgress,
} from '@mui/material';
import ProtectedRoute from '@/components/ProtectedRoute';
import PanelistsTable from '@/components/backoffice/PanelistsTable';
import type { SessionWithToken } from '@/types/session';

interface DashboardStats {
  channels: number;
  programs: number;
  panelists: number;
  schedules: number;
}

export default function DashboardPage() {
  // 1) Next-Auth: obligamos a tener sesión
  const { session, status } = useSessionContext();
  const typedSession = session as SessionWithToken | null;

  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [stats, setStats] = useState<DashboardStats>({
    channels: 0,
    programs: 0,
    panelists: 0,
    schedules: 0,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 2) Esperamos hasta que Next-Auth confirme que estamos "authenticated"
    if (status !== 'authenticated' || typedSession?.user.role !== 'admin') return;

    (async () => {
      try {
        // 3) Extraemos nuestro accessToken personalizado
        const sess = await getSession();
        const token = sess?.accessToken;
        if (!token) throw new Error('No auth token');

        // 4) Llamada al backend
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stats`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error(`Error ${res.status}`);

        const data = (await res.json()) as DashboardStats;
        setStats(data);
      } catch (err) {
        console.error('Error fetching stats:', err);
        setError('No se pudieron cargar las estadísticas');
      }
    })();
  }, [status, typedSession]);

  if (status === 'loading') {
    return (
      <Box
        sx={{
          height: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>

        {/* tarjetas */}
        <Box
          sx={{
            display: 'grid',
            gap: 3,
            mb: 4,
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2,1fr)',
              md: 'repeat(4,1fr)',
            },
          }}
        >
          {([
            ['Canales', stats.channels],
            ['Programas', stats.programs],
            ['Panelistas', stats.panelists],
            ['Horarios', stats.schedules],
          ] as [string, number][]).map(([label, value]) => (
            <Paper
              key={label}
              onClick={
                label === 'Horarios'
                  ? () => (window.location.href = '/backoffice/schedules')
                  : undefined
              }
              sx={{
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                height: 140,
                bgcolor: isDark ? 'grey.800' : 'grey.100',
                cursor: label === 'Horarios' ? 'pointer' : 'default',
                '&:hover': label === 'Horarios'
                  ? { bgcolor: isDark ? 'grey.700' : 'grey.200' }
                  : undefined,
              }}
            >
              <Typography variant="h6">{label}</Typography>
              <Typography variant="h3">{value}</Typography>
            </Paper>
          ))}
        </Box>

        <Typography variant="h5" gutterBottom>
          Panelistas
        </Typography>
        <ProtectedRoute>
          {/* tu tabla de panelistas aquí */}
          <PanelistsTable
            onError={(err) => console.error(err)}
          />
        </ProtectedRoute>
      </Box>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setError(null)}
          severity="error"
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>
    </>
  );
}