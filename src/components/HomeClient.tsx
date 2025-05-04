import { useState, useEffect, useMemo } from 'react';
import { Box, Container, CircularProgress } from '@mui/material';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { api } from '@/services/api';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useThemeContext } from '@/contexts/ThemeContext';
import { LiveStatusProvider, useLiveStatus } from '@/contexts/LiveStatusContext';
import { AuthService } from '@/services/auth';
import type { ChannelWithSchedules } from '@/types/channel';

// Dynamic imports
const HolidayDialog = dynamic(
  () => import('@/components/HolidayDialog'),
  { ssr: false }
);

const ScheduleGrid = dynamic(
  () => import('@/components/ScheduleGrid').then((m) => m.ScheduleGrid),
  {
    ssr: false,
    loading: () => (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    ),
  }
);

const MotionBox = motion(Box);

interface HomeClientProps {
  initialData: ChannelWithSchedules[] | { data: ChannelWithSchedules[] };
}

interface HasData {
  data: ChannelWithSchedules[];
}
function hasData(x: unknown): x is HasData {
  return typeof x === 'object' && x !== null && Array.isArray((x as HasData).data);
}

export default function HomeClient({ initialData }: HomeClientProps) {
  const initArray: ChannelWithSchedules[] = Array.isArray(initialData)
    ? initialData
    : hasData(initialData)
    ? initialData.data
    : [];

  const [channelsWithSchedules, setChannelsWithSchedules] =
    useState<ChannelWithSchedules[]>(initArray);
  const [isHoliday, setIsHoliday] = useState(false);
  const [showHoliday, setShowHoliday] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { mode } = useThemeContext();
  const { setLiveStatuses } = useLiveStatus();

  const channels = useMemo(
    () => channelsWithSchedules.map((c) => c.channel),
    [channelsWithSchedules]
  );
  const flattened = useMemo(
    () =>
      channelsWithSchedules.flatMap((c) =>
        c.schedules.map((s) => ({
          ...s,
          program: { ...s.program, channel: c.channel },
        }))
      ),
    [channelsWithSchedules]
  );

  const today = new Date()
    .toLocaleString('en-US', { weekday: 'long' })
    .toLowerCase();

  const fetchSchedules = async (day?: string) => {
    const token = AuthService.getCorrectToken(false);
    const params: Record<string, any> = { live_status: true };
    if (day) params.day = day;
    const resp = await api.get<ChannelWithSchedules[]>('/channels/with-schedules', {
      params,
      headers: { Authorization: `Bearer ${token}` },
    });
    return resp.data;
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Feriado
    const fetchHoliday = async () => {
      const t = AuthService.getCorrectToken(false);
      const h = await api.get<{ holiday: boolean }>('/holiday', {
        headers: { Authorization: `Bearer ${t}` },
      });
      setIsHoliday(h.data.holiday);
      if (h.data.holiday) setShowHoliday(true);
    };
    fetchHoliday();

    // Carga inicial de hoy
    const loadToday = async () => {
      const todayData = await fetchSchedules(today);
      const liveMap: Record<string, { is_live: boolean; stream_url: string | null }> = {};
      todayData.forEach((ch) =>
        ch.schedules.forEach((sch) => {
          liveMap[sch.id.toString()] = {
            is_live: sch.program.is_live,
            stream_url: sch.program.stream_url,
          };
        })
      );
      setLiveStatuses(liveMap);
      setChannelsWithSchedules(todayData);
    };

    // Pre-carga de toda la semana en background
    const loadAllWeek = async () => {
      const weekData = await fetchSchedules();
      const liveMap: Record<string, { is_live: boolean; stream_url: string | null }> = {};
      weekData.forEach((ch) =>
        ch.schedules.forEach((sch) => {
          liveMap[sch.id.toString()] = {
            is_live: sch.program.is_live,
            stream_url: sch.program.stream_url,
          };
        })
      );
      setLiveStatuses(liveMap);
      setChannelsWithSchedules(weekData);
    };

    loadToday();
    loadAllWeek();

    const id = setInterval(loadToday, 60_000);
    return () => clearInterval(id);
  }, [mounted, today, setLiveStatuses]);

  if (!mounted) return null;

  const logo = '/img/logo.png';
  const text = mode === 'light' ? '/img/text.png' : '/img/text-white.png';

  return (
    <LiveStatusProvider>
      {isHoliday && (
        <HolidayDialog open={showHoliday} onClose={() => setShowHoliday(false)} />
      )}

      <Box
        sx={{
          minHeight: '100vh',
          maxWidth: '100vw',
          background:
            mode === 'light'
              ? 'linear-gradient(135deg,#f8fafc 0%,#e2e8f0 100%)'
              : 'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)',
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
                ? 'linear-gradient(135deg,#2563eb 0%,#1d4ed8 100%)'
                : 'linear-gradient(135deg,#3b82f6 0%,#2563eb 100%)',
            opacity: 0.05,
            zIndex: 0,
          },
        }}
      >
        <Container
          maxWidth="xl"
          disableGutters
          sx={{ px: 0, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
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
                    ? 'linear-gradient(135deg,rgba(255,255,255,0.9) 0%,rgba(255,255,255,0.8) 100%)'
                    : 'linear-gradient(135deg,rgba(30,41,59,0.9) 0%,rgba(30,41,59,0.8) 100%)',
                borderRadius: 2,
                boxShadow:
                  mode === 'light'
                    ? '0 4px 6px -1px rgb(0 0 0 / 0.1),0 2px 4px -2px rgb(0 0 0 / 0.1)'
                    : '0 4px 6px -1px rgb(0 0 0 / 0.3),0 2px 4px -2px rgb(0 0 0 / 0.3)',
                backdropFilter: 'blur(8px)',
                paddingLeft: { xs: 1, sm: 2 },
              }}
            >
              <Box
                component="img"
                src={logo}
                alt="Logo"
                sx={{ width: 'auto', height: '11vh', maxWidth: '100%', objectFit: 'contain' }}
              />
              <Box
                component="img"
                src={text}
                alt="Text"
                sx={{
                  paddingLeft: { xs: 1, sm: 2 },
                  width: 'auto',
                  height: '11vh',
                  maxWidth: '100%',
                  objectFit: 'contain',
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  right: { xs: 8, sm: 16 },
                  transform: 'translateY(-50%)',
                }}
              >
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
                  ? '0 4px 6px -1px rgb(0 0 0 / 0.1),0 2px 4px -2px rgb(0 0 0 / 0.1)'
                  : '0 4px 6px -1px rgb(0 0 0 / 0.3),0 2px 4px -2px rgb(0 0 0 / 0.3)',
              overflow: 'hidden',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {flattened.length === 0 ? (
              <Box display="flex" justifyContent="center" alignItems="center" p={4}>
                <CircularProgress />
              </Box>
            ) : (
              <ScheduleGrid channels={channels} schedules={flattened} />
            )}
          </MotionBox>
        </Container>
      </Box>
    </LiveStatusProvider>
  );
}