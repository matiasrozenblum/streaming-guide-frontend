'use client';

import { useEffect, useState } from 'react';
import { Box, Container, CircularProgress, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { api } from '@/services/api';
import { Schedule } from '@/types/schedule';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useThemeContext } from '@/contexts/ThemeContext';
import { ScheduleGrid } from '@/components/ScheduleGrid';

const MotionBox = motion(Box);

export default function Home() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const { mode } = useThemeContext();
  const [mounted, setMounted] = useState(false);

  const logo = mode === 'light' ? '/img/logo.png' : '/img/logo-dark.png';
  
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    api.get('/schedules')
      .then((res) => {
        console.log('📦 Schedules from backend:', res.data);
        setSchedules(res.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (!mounted) {
    return null;
  }

  // Get unique channels from schedules
  const channels = Array.from(
    new Map(
      schedules.map((s) => [s.program.channel.id, s.program.channel])
    ).values()
  );

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        maxWidth: '100vw',
        background: mode === 'light' 
          ? 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
          : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        py: { xs: 1, sm: 2 },
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '400px',
          background: mode === 'light'
            ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
            : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          opacity: 0.05,
          zIndex: 0,
        },
      }}
    >
      <Box
        sx={{
          position: 'fixed',
          top: 8,
          right: 8,
          zIndex: 1000,
        }}
      >
        <ThemeToggle />
      </Box>

      <Container 
        maxWidth="xl"
        sx={{
          px: { xs: 0.5, sm: 1 },
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
        }}
      >
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          sx={{ 
            position: 'relative',
            zIndex: 1,
            mb: { xs: 1, sm: 2 },
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2, 
            background: mode === 'light'
              ? 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.8) 100%)'
              : 'linear-gradient(135deg, rgba(30,41,59,0.9) 0%, rgba(30,41,59,0.8) 100%)',
            p: { xs: 2, sm: 3 },
            borderRadius: 2,
            boxShadow: mode === 'light'
              ? '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
              : '0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.3)',
            backdropFilter: 'blur(8px)',
          }}>
            <Box
              component="img"
              src={logo}
              alt="La Guía del Streaming"
              sx={{
                width: '100%',
                height: 'auto',
                maxWidth: { xs: '280px', sm: '400px' },

              }}
            />
          </Box>
        </MotionBox>
        
        <MotionBox
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          sx={{
            flex: 1,
            minHeight: 0,
            background: mode === 'light'
              ? 'rgba(255,255,255,0.9)'
              : 'rgba(30,41,59,0.9)',
            borderRadius: 2,
            boxShadow: mode === 'light'
              ? '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
              : '0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.3)',
            overflow: 'hidden',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" p={4}>
              <CircularProgress />
            </Box>
          ) : (
            <ScheduleGrid channels={channels} schedules={schedules} />
          )}
        </MotionBox>
      </Container>
    </Box>
  );
}