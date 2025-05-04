'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Box, Container, Skeleton } from '@mui/material';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { api } from '@/services/api';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useThemeContext } from '@/contexts/ThemeContext';
import { LiveStatusProvider, useLiveStatus } from '@/contexts/LiveStatusContext';
import { AuthService } from '@/services/auth';
import { ScheduleGrid } from '@/components/ScheduleGrid';
import type { ChannelWithSchedules } from '@/types/channel';
import { useLayoutValues } from '@/constants/layout';

const HolidayDialog = dynamic(
  () => import('@/components/HolidayDialog'),
  { ssr: false }
);

const MotionBox = motion(Box);

interface HomeClientProps {
  initialData: ChannelWithSchedules[] | { data: ChannelWithSchedules[] };
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

export default function HomeClient({ initialData }: HomeClientProps) {
  const startRef = useRef<number>(0);

  // Hydrate inicial
  const initArray: ChannelWithSchedules[] = Array.isArray(initialData)
    ? initialData
    : hasData(initialData)
    ? initialData.data
    : [];

  const [channelsWithSchedules, setChannelsWithSchedules] =
    useState<ChannelWithSchedules[]>(initArray);
  const [showHoliday, setShowHoliday] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { mode } = useThemeContext();
  const { setLiveStatuses } = useLiveStatus();
  const {
    channelLabelWidth,
    pixelsPerMinute,
    rowHeight,
    timeHeaderHeight,
  } = useLayoutValues();

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
    console.time(day ? 'fetchToday' : 'fetchWeek');
    const token = AuthService.getCorrectToken(false);
    const params: FetchParams = { live_status: true };
    if (day) params.day = day;
    const resp = await api.get<ChannelWithSchedules[]>('/channels/with-schedules', {
      params,
      headers: { Authorization: `Bearer ${token}` },
    });
    console.timeEnd(day ? 'fetchToday' : 'fetchWeek');
    return resp.data;
  };

  // mounting + cronómetro
  useEffect(() => {
    startRef.current = performance.now();
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Holiday (no bloquea)
    (async () => {
      const token = AuthService.getCorrectToken(false);
      const resp = await api.get<{ holiday: boolean }>('/holiday', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resp.data.holiday) {
        setShowHoliday(true);
      }
    })();

    // 1) fetch rápido de HOY
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

    // 2) precarga toda la semana en background
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

    // 3) polling SOLO hoy
    const intervalId = setInterval(async () => {
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
    }, 60_000);

    return () => clearInterval(intervalId);
  }, [mounted, today, setLiveStatuses]);

  // medir render final
  useEffect(() => {
    if (flattened.length > 0) {
      const total = performance.now() - startRef.current;
      console.log(`🏁 Grid rendered in ${total.toFixed(2)} ms`);
    }
  }, [flattened]);

  if (!mounted) return null;

  // skeleton placeholder
  const SkeletonGrid = () => {
    const totalGridWidth = pixelsPerMinute * 60 * 24 + channelLabelWidth;
    const rows = Math.min(channels.length, 6);
    return (
      <Box sx={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        {/* header */}
        <Box display="flex">
          <Skeleton
            variant="rectangular"
            width={channelLabelWidth}
            height={timeHeaderHeight}
          />
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton
              key={i}
              variant="rectangular"
              width={pixelsPerMinute * 60}
              height={timeHeaderHeight}
            />
          ))}
        </Box>
        {/* filas */}
        <Box>
          {Array.from({ length: rows }).map((_, r) => (
            <Box key={r} display="flex">
              <Skeleton
                variant="rectangular"
                width={channelLabelWidth}
                height={rowHeight}
              />
              <Skeleton
                variant="rectangular"
                width={totalGridWidth - channelLabelWidth}
                height={rowHeight}
              />
            </Box>
          ))}
        </Box>
      </Box>
    );
  };

  const logo = '/img/logo.png';
  const text = mode === 'light' ? '/img/text.png' : '/img/text-white.png';

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
          }}
        >
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            sx={{ position: 'relative', zIndex: 1, mb: 2 }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 2,
                background:
                  mode === 'light'
                    ? 'rgba(255,255,255,0.9)'
                    : 'rgba(30,41,59,0.9)',
                borderRadius: 2,
                backdropFilter: 'blur(8px)',
              }}
            >
              <Box component="img" src={logo} alt="Logo" sx={{ height: 64 }} />
              <Box component="img" src={text} alt="Text" sx={{ height: 64 }} />
              <ThemeToggle />
            </Box>
          </MotionBox>

          <MotionBox
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            sx={{
              flex: 1,
              minHeight: 0,
              background: mode === 'light' ? '#fff' : '#1e293b',
              borderRadius: 2,
              overflow: 'hidden',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {flattened.length === 0 ? (
              <SkeletonGrid />
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
