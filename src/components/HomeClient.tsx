'use client';

import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { Box, Container, IconButton } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import LoginModal from '@/components/LoginModal';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { api } from '@/services/api';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useThemeContext } from '@/contexts/ThemeContext';
import {
  LiveStatusProvider,
  useLiveStatus,
} from '@/contexts/LiveStatusContext';
import { AuthService } from '@/services/auth';
import { ScheduleGrid } from '@/components/ScheduleGrid';
import { SkeletonScheduleGrid } from '@/components/SkeletonScheduleGrid';
import type { ChannelWithSchedules } from '@/types/channel';

const HolidayDialog = dynamic(
  () => import('@/components/HolidayDialog'),
  { ssr: false }
);
const MotionBox = motion(Box);

interface HomeClientProps {
  initialData:
    | ChannelWithSchedules[]
    | { data: ChannelWithSchedules[] };
}
interface HasData {
  data: ChannelWithSchedules[];
}
function hasData(x: unknown): x is HasData {
  return (
    typeof x === 'object' &&
    x !== null &&
    Array.isArray((x as HasData).data)
  );
}
interface FetchParams {
  day?: string;
  live_status: boolean;
}
type LiveMap = Record<
  string,
  { is_live: boolean; stream_url: string | null }
>;

export default function HomeClient({
  initialData,
}: HomeClientProps) {
  const startRef = useRef<number>(0);

  // hydrate inicial desde SSR/ISR
  const initArray: ChannelWithSchedules[] = Array.isArray(
    initialData
  )
    ? initialData
    : hasData(initialData)
    ? initialData.data
    : [];

  const [
    channelsWithSchedules,
    setChannelsWithSchedules,
  ] = useState<ChannelWithSchedules[]>(initArray);
  const [showHoliday, setShowHoliday] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { mode } = useThemeContext();
  const { setLiveStatuses } = useLiveStatus();
  const [loginOpen, setLoginOpen] = useState(false);

  const channels = useMemo(
    () =>
      channelsWithSchedules.map((c) => c.channel),
    [channelsWithSchedules]
  );
  const flattened = useMemo(
    () =>
      channelsWithSchedules.flatMap((c) =>
        c.schedules.map((s) => ({
          ...s,
          program: {
            ...s.program,
            channel: c.channel,
          },
        }))
      ),
    [channelsWithSchedules]
  );

  const today = new Date()
    .toLocaleString('en-US', {
      weekday: 'long',
    })
    .toLowerCase();

  const fetchSchedules = async (day?: string) => {
    console.time(day ? 'fetchToday' : 'fetchWeek');
    const token = AuthService.getCorrectToken(false);
    const params: FetchParams = {
      live_status: true,
    };
    if (day) params.day = day;
    const resp = await api.get<ChannelWithSchedules[]>(
      '/channels/with-schedules',
      {
        params,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    console.timeEnd(day ? 'fetchToday' : 'fetchWeek');
    return resp.data;
  };

  useEffect(() => {
    startRef.current = performance.now();
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Holiday (no bloquea grilla)
    (async () => {
      const token = AuthService.getCorrectToken(false);
      const { data } = await api.get<{ holiday: boolean }>(
        '/holiday',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (data.holiday) setShowHoliday(true);
    })();

    // 1) Carga rápida HOY
    (async () => {
      const todayData = await fetchSchedules(today);
      const liveMap: LiveMap = {};
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
    })();

    // 2) Precarga SEMANA (background)
    (async () => {
      const weekData = await fetchSchedules();
      const liveMap: LiveMap = {};
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
    })();

    // 3) Polling semanal
    const id = setInterval(async () => {
        const weekData = await fetchSchedules();
      const liveMap: LiveMap = {};
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
    }, 60_000);
    return () => clearInterval(id);
  }, [mounted, today, setLiveStatuses]);

  useEffect(() => {
    if (flattened.length > 0) {
      const total =
        performance.now() - startRef.current;
      console.log(
        `🏁 Grid rendered in ${total.toFixed(2)} ms`
      );
    }
  }, [flattened]);

  if (!mounted) return null;

  const logo = '/img/logo.png';
  const text =
    mode === 'light'
      ? '/img/text.png'
      : '/img/text-white.png';

  return (
    <LiveStatusProvider>
      {showHoliday && (
        <HolidayDialog
          open
          onClose={() => setShowHoliday(false)}
        />
      )}

      <Box
        sx={{
          minHeight: '100dvh',
          maxWidth: '100vw',
          background:
            mode === 'light'
              ? 'linear-gradient(135deg,#f8fafc 0%,#e2e8f0 100%)'
              : 'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)',
          py: { xs: 1, sm: 2 },
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* HEADER */}
        <Container
          maxWidth="xl"
          disableGutters
          sx={{ px: 0, mb: { xs: 1, sm: 2 } }}
        >
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
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
                position: 'relative',
              }}
            >
              <Box
                component="img"
                src={logo}
                alt="Logo"
                sx={{
                  height: '11vh',
                  width: 'auto',
                  objectFit: 'contain',
                }}
              />
              <Box
                component="img"
                src={text}
                alt="Texto"
                sx={{
                  paddingLeft: { xs: 1, sm: 2 },
                  height: '11vh',
                  width: 'auto',
                  objectFit: 'contain',
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  right: 8,
                  transform: 'translateY(-50%)',
                }}
              >
                <IconButton color="inherit" onClick={() => setLoginOpen(true)} sx={{ ml:1 }}>
                    <PersonIcon /> Acceder
                </IconButton>
                <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
                <ThemeToggle />
              </Box>
            </Box>
          </MotionBox>
        </Container>

        {/* GRID / SKELETON */}
        <Container
          maxWidth="xl"
          disableGutters
          sx={{
            px: 0,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <MotionBox
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: 0.5,
              delay: 0.2,
            }}
            sx={{
              flex: 1,
              background:
                mode === 'light'
                  ? 'rgba(255,255,255,0.9)'
                  : 'rgba(30,41,59,0.9)',
              borderRadius: 2,
              //overflow: 'hidden',
              backdropFilter: 'blur(8px)',
            }}
          >
            {flattened.length === 0 ? (
              <SkeletonScheduleGrid rowCount={10} />
            ) : (
              <ScheduleGrid
                channels={channels}
                schedules={flattened}
              />
            )}
          </MotionBox>
        </Container>
      </Box>
    </LiveStatusProvider>
  );
}
