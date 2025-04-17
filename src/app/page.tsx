'use client';

import { useEffect, useState } from 'react';
import { Box, Container, CircularProgress, Typography } from '@mui/material';
import { Tv2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '@/services/api';
import { Schedule } from '@/types/schedule';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useThemeContext } from '@/contexts/ThemeContext';
import { ScheduleGrid } from '@/components/ScheduleGrid';

const MotionBox = motion(Box);
const POLLING_INTERVAL = 30000; // 30 seconds

export default function Home() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const { mode } = useThemeContext();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      // First fetch today's schedules
      const today = new Date().toLocaleString('en-US', { weekday: 'long' }).toLowerCase();
      const todayResponse = await api.get(`/schedules?day=${today}`);
      console.log('📦 Today\'s schedules:', todayResponse.data);
      setSchedules(todayResponse.data);
      setLoading(false); // Stop loading after today's schedules are loaded

      // Then fetch all schedules in the background
      const allResponse = await api.get('/schedules');
      console.log('📦 All schedules:', allResponse.data);
      setSchedules(allResponse.data);
    } catch (err) {
      console.error('Error fetching schedules:', err);
      setSchedules([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();

    // Set up polling
    const intervalId = setInterval(fetchSchedules, POLLING_INTERVAL);

    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, []);

  if (!mounted) {
    return null;
  }

  // Get unique channels from schedules
  const channels = Array.from(
    new Map(
      (schedules || []).map((s) => [s.program?.channel?.id, s.program?.channel])
    ).values()
  ).filter(Boolean);

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        maxWidth: '100vw',
        overflow: 'hidden',
        height : '100%',
        background: mode === 'light' 
          ? 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
          : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        position: 'relative',
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
          height: '100%',
          overflow: 'hidden',
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
            <Tv2 
              size={32} 
              style={{ 
                color: mode === 'light' ? '#2563eb' : '#3b82f6',
                strokeWidth: 1.5 
              }} 
            />
            <Box>
              <Typography variant="h1" sx={{ 
                fontSize: { xs: '1.5rem', sm: '2rem' }, 
                fontWeight: 700, 
                color: mode === 'light' ? '#111827' : '#f1f5f9',
                mb: 0.5 
              }}>
                La Guía del Streaming
              </Typography>
              <Typography variant="subtitle1" sx={{ 
                fontSize: { xs: '0.875rem', sm: '1rem' },
                color: mode === 'light' ? '#4B5563' : '#94a3b8',
                fontWeight: 400 
              }}>
                Tu guia al streaming semanal
              </Typography>
            </Box>
          </Box>
        </MotionBox>
        
        <MotionBox
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          sx={{
            background: mode === 'light'
              ? 'rgba(255,255,255,0.9)'
              : 'rgba(30,41,59,0.9)',
            borderRadius: 2,
            boxShadow: mode === 'light'
              ? '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
              : '0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.3)',
            overflow: 'hidden',
            backdropFilter: 'blur(8px)',
            height: 'calc(100vh - 140px)',
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