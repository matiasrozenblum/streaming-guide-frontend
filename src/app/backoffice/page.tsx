'use client';

import { useEffect, useState } from 'react';
import { Box, Typography, Paper, useTheme, Snackbar, Alert } from '@mui/material';
import ProtectedRoute from '@/components/ProtectedRoute';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface DashboardStats {
  channels: number;
  programs: number;
  panelists: number;
  schedules: number;
}

export default function DashboardPage() {
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
    const fetchStats = async () => {
      try {
        const response = await fetch(`${API_URL}/stats`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        } else {
          throw new Error('Failed to fetch stats');
        }
      } catch (error) {
        setError('Error loading dashboard statistics');
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, []);

  const handleCloseError = () => {
    setError(null);
  };

  return (
    <ProtectedRoute>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(4, 1fr)',
            },
            gap: 3,
          }}
        >
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              backgroundColor: isDark ? 'grey.800' : 'grey.100',
            }}
          >
            <Typography variant="h6" gutterBottom>
              Canales
            </Typography>
            <Typography variant="h3">
              {stats.channels}
            </Typography>
          </Paper>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              backgroundColor: isDark ? 'grey.800' : 'grey.100',
            }}
          >
            <Typography variant="h6" gutterBottom>
              Programas
            </Typography>
            <Typography variant="h3">
              {stats.programs}
            </Typography>
          </Paper>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              backgroundColor: isDark ? 'grey.800' : 'grey.100',
            }}
          >
            <Typography variant="h6" gutterBottom>
              Panelistas
            </Typography>
            <Typography variant="h3">
              {stats.panelists}
            </Typography>
          </Paper>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              backgroundColor: isDark ? 'grey.800' : 'grey.100',
            }}
          >
            <Typography variant="h6" gutterBottom>
              Horarios
            </Typography>
            <Typography variant="h3">
              {stats.schedules}
            </Typography>
          </Paper>
        </Box>
      </Box>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </ProtectedRoute>
  );
} 