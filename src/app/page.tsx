'use client';

import { useEffect, useState } from 'react';
import { Box, Container, CircularProgress, Alert } from '@mui/material';
import { motion } from 'framer-motion';
import { api } from '@/services/api';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useThemeContext } from '@/contexts/ThemeContext';
import { ScheduleGrid } from '@/components/ScheduleGrid';
import { LiveStatusProvider } from '@/contexts/LiveStatusContext';
import { AuthService } from '@/services/auth';
import { ChannelWithSchedules } from '@/types/channel';
import HolidayDialog from '@/components/HolidayDialog';

const MotionBox = motion(Box);

export default function Home() {
  const [isHoliday, setIsHoliday] = useState(false);
  const [showHoliday, setShowHoliday] = useState(false)
  const [channelsWithSchedules, setChannelsWithSchedules] = useState<ChannelWithSchedules[]>([]);
  const [loading, setLoading] = useState(true);
  const { mode } = useThemeContext();
  const [mounted, setMounted] = useState(false);

  const logo = '/img/logo.png';
  const text = mode === 'light' ? '/img/text.png' : '/img/text-white.png';

  const fetchTodaySchedules = async () => {
    const today = new Date().toLocaleString('en-US', { weekday: 'long' }).toLowerCase();
    const token = AuthService.getCorrectToken(false);
    const response = await api.get(`/channels/with-schedules?day=${today}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setChannelsWithSchedules(response.data);
    setLoading(false);
  };

  const fetchAllSchedulesInBackground = async () => {
    const token = AuthService.getCorrectToken(false);
    const response = await api.get(`/channels/with-schedules`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setChannelsWithSchedules(response.data);
  };

  const flattenSchedules = (data: ChannelWithSchedules[]) =>
    data.flatMap(entry =>
      entry.schedules.map(schedule => ({
        ...schedule,
        program: {
          ...schedule.program,
          channel: entry.channel,
        },
      }))
    );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchHoliday = async () => {
      const token = AuthService.getCorrectToken(false);
      const response = await api.get(`/holiday`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIsHoliday(response.data.holiday);
      if (response.data.holiday) setShowHoliday(true)
    };
    fetchHoliday();
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // carga inicial
    fetchTodaySchedules().then(() => {
      fetchAllSchedulesInBackground();
    });

    // refresco completo cada 60s
    const fullGridInterval = setInterval(() => {
      console.log('refetching full grid');
      fetchAllSchedulesInBackground();
    }, 60_000);

    return () => clearInterval(fullGridInterval);
  }, [mounted]);

  if (!mounted) {
    return null;
  }

  const channels = channelsWithSchedules.map(c => c.channel);

  return (
    <LiveStatusProvider>
      {isHoliday && <HolidayDialog open={showHoliday} onClose={() => setShowHoliday(false)} />}
      <Box
        sx={{
          minHeight: '100vh',
          maxWidth: '100vw',
          background:
            mode === 'light'
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
            background:
              mode === 'light'
                ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
                : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            opacity: 0.05,
            zIndex: 0,
          },
        }}
      >
        <Container
          maxWidth="xl"
          disableGutters
          sx={{
            px: 0,
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
            sx={{ position: 'relative', zIndex: 1, mb: { xs: 1, sm: 2 } }}
          >
            <Box
              sx={{
                height: '13vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'left',
                background:
                  mode === 'light'
                    ? 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.8) 100%)'
                    : 'linear-gradient(135deg, rgba(30,41,59,0.9) 0%, rgba(30,41,59,0.8) 100%)',
                borderRadius: 2,
                boxShadow:
                  mode === 'light'
                    ? '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
                    : '0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.3)',
                backdropFilter: 'blur(8px)',
                paddingLeft: { xs: 1, sm: 2 },
              }}
            >
              <Box
                component="img"
                src={logo}
                alt="La Guía del Streaming Logo"
                sx={{ width: 'auto', height: '11vh', maxWidth: '100%', objectFit: 'contain' }}
              />
              <Box
                component="img"
                src={text}
                alt="La Guía del Streaming Text"
                sx={{
                  paddingLeft: { xs: 1, sm: 2 },
                  width: 'auto',
                  height: '11vh',
                  maxWidth: '100%',
                  objectFit: 'contain',
                }}
              />
              <Box sx={{ position: 'fixed', right: 8, zIndex: 1000 }}>
                <ThemeToggle />
              </Box>
            </Box>
          </MotionBox>

          <MotionBox
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            sx={{
              flex: 1,
              minHeight: 0,
              background: mode === 'light' ? 'rgba(255,255,255,0.9)' : 'rgba(30,41,59,0.9)',
              borderRadius: 2,
              boxShadow:
                mode === 'light'
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
              <ScheduleGrid channels={channels} schedules={flattenSchedules(channelsWithSchedules)} />
            )}
          </MotionBox>
        </Container>
      </Box>
    </LiveStatusProvider>
  );
}
