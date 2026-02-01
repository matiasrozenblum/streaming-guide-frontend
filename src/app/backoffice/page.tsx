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
  CircularProgress,
  Button,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';
import { YouTube, ClearAll, Refresh } from '@mui/icons-material';
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

  // const theme = useTheme();
  // const isDark = theme.palette.mode === 'dark';
  const [stats, setStats] = useState<DashboardStats>({
    channels: 0,
    programs: 0,
    panelists: 0,
    schedules: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loadingYouTube, setLoadingYouTube] = useState(false);
  const [loadingCache, setLoadingCache] = useState(false);

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

  const handleFetchYoutubeLiveIds = async () => {
    try {
      setLoadingYouTube(true);
      setError(null);
      const response = await fetch('/api/youtube/fetch-live-ids', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch YouTube live IDs');
      }

      const data = await response.json();
      setSuccess(data.message || 'YouTube live IDs fetched successfully');
    } catch (err) {
      console.error('Error fetching YouTube live IDs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch YouTube live IDs');
    } finally {
      setLoadingYouTube(false);
    }
  };

  const handleClearCache = async () => {
    try {
      setLoadingCache(true);
      setError(null);
      const response = await fetch('/api/cache/clear-schedules', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to clear schedule cache');
      }

      const data = await response.json();
      setSuccess(data.message || 'Schedule cache cleared successfully');
    } catch (err) {
      console.error('Error clearing cache:', err);
      setError(err instanceof Error ? err.message : 'Failed to clear schedule cache');
    } finally {
      setLoadingCache(false);
    }
  };

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
        <Typography variant="h4" color="text.primary" gutterBottom>
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
                bgcolor: 'grey.800',
                cursor: label === 'Horarios' ? 'pointer' : 'default',
                '&:hover': label === 'Horarios'
                  ? { bgcolor: 'grey.700' }
                  : undefined,
              }}
            >
              <Typography variant="h6" color="text.primary">{label}</Typography>
              <Typography variant="h3" color="text.primary">{value}</Typography>
            </Paper>
          ))}
        </Box>

        {/* Admin Actions */}
        <Typography variant="h5" color="text.primary" gutterBottom>
          Acciones de Administración
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gap: 3,
            gridTemplateColumns: {
              xs: '1fr',
              md: 'repeat(2, 1fr)',
            },
          }}
        >
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <YouTube sx={{ mr: 1, color: 'error.main' }} />
                <Typography variant="h6" color="text.primary">
                  YouTube Live IDs
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Actualiza manualmente los IDs de videos en vivo de YouTube para todos los canales.
                Esto fuerza una búsqueda inmediata de streams activos.
              </Typography>
            </CardContent>
            <CardActions>
              <Button
                variant="contained"
                startIcon={<Refresh />}
                onClick={handleFetchYoutubeLiveIds}
                disabled={loadingYouTube}
                color="error"
              >
                {loadingYouTube ? 'Actualizando...' : 'Actualizar YouTube Live IDs'}
              </Button>
            </CardActions>
          </Card>

          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ClearAll sx={{ mr: 1, color: 'warning.main' }} />
                <Typography variant="h6" color="text.primary">
                  Limpiar Cache
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Limpia la cache de horarios para forzar una actualización inmediata de los datos.
                Útil después de hacer cambios importantes en el sistema.
              </Typography>
            </CardContent>
            <CardActions>
              <Button
                variant="contained"
                startIcon={<ClearAll />}
                onClick={handleClearCache}
                disabled={loadingCache}
                color="warning"
              >
                {loadingCache ? 'Limpiando...' : 'Limpiar Cache de Horarios'}
              </Button>
            </CardActions>
          </Card>
        </Box>
      </Box>

      <Snackbar
        open={!!error || !!success}
        autoHideDuration={6000}
        onClose={() => { setError(null); setSuccess(null); }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => { setError(null); setSuccess(null); }}
          severity={error ? 'error' : 'success'}
          sx={{ width: '100%' }}
        >
          {error || success}
        </Alert>
      </Snackbar>
    </>
  );
}