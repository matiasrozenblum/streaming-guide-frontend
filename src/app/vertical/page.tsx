'use client';

import { useEffect, useState } from 'react';
import { Box, Container, CircularProgress, Typography } from '@mui/material';
import { Calendar, Clock, Tv2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '@/services/api';
import { Schedule } from '@/types/schedule';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useThemeContext } from '@/contexts/ThemeContext';
import { ScheduleGrid } from '@/components/ScheduleGrid';

const MotionBox = motion(Box);

export default function VerticalLayout() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const { mode } = useThemeContext();
  const [mounted, setMounted] = useState(false);
  
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

  const channels = Array.from(
    new Map(
      schedules.map((s) => [s.program.channel.id, s.program.channel])
    ).values()
  );

  return (
    <Box 
      sx={{ 
        height: '100vh',
        background: mode === 'light' 
          ? 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
          : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 1000,
        }}
      >
        <ThemeToggle />
      </Box>

      <Container 
        maxWidth="xl" 
        sx={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          py: { xs: 2, sm: 4 },
          px: { xs: 1, sm: 2 },
        }}
      >
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          sx={{ 
            position: 'relative',
            zIndex: 1,
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2, 
            mb: 2,
            background: mode === 'light'
              ? 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.8) 100%)'
              : 'linear-gradient(135deg, rgba(30,41,59,0.9) 0%, rgba(30,41,59,0.8) 100%)',
            p: 3,
            borderRadius: 3,
            boxShadow: mode === 'light'
              ? '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
              : '0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.3)',
            backdropFilter: 'blur(8px)',
          }}>
            <Tv2 
              size={40} 
              style={{ 
                color: mode === 'light' ? '#2563eb' : '#3b82f6',
                strokeWidth: 1.5 
              }} 
            />
            <Box>
              <Typography variant="h1" sx={{ 
                fontSize: '2.25rem', 
                fontWeight: 700, 
                color: mode === 'light' ? '#111827' : '#f1f5f9',
                mb: 1 
              }}>
                TV Schedule
              </Typography>
              <Typography variant="subtitle1" sx={{ 
                color: mode === 'light' ? '#4B5563' : '#94a3b8',
                fontWeight: 400 
              }}>
                Your complete guide to weekly programming
              </Typography>
            </Box>
          </Box>
        </MotionBox>
        
        <MotionBox
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          sx={{
            flex: 1,
            background: mode === 'light'
              ? 'rgba(255,255,255,0.9)'
              : 'rgba(30,41,59,0.9)',
            borderRadius: 3,
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