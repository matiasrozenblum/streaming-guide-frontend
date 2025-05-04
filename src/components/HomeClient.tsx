'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Box, Skeleton } from '@mui/material';
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

const HolidayDialog = dynamic(() => import('@/components/HolidayDialog'), { ssr: false });
const MotionBox = motion(Box);

interface HomeClientProps {
  initialData: ChannelWithSchedules[] | { data: ChannelWithSchedules[] };
}
interface HasData { data: ChannelWithSchedules[] }
function hasData(x: unknown): x is HasData {
  return typeof x === 'object' && x !== null && Array.isArray((x as HasData).data);
}
interface FetchParams { day?: string; live_status: boolean }
type LiveMap = Record<string, { is_live: boolean; stream_url: string | null }>;

export default function HomeClient({ initialData }: HomeClientProps) {
  const startRef = useRef<number>(0);

  // hydrate inicial
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
  const { rowHeight, timeHeaderHeight } =
    useLayoutValues();

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

  // arrancamos
  useEffect(() => {
    startRef.current = performance.now();
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // holiday
    (async () => {
      const token = AuthService.getCorrectToken(false);
      const { data } = await api.get<{ holiday: boolean }>('/holiday', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.holiday) setShowHoliday(true);
    })();

    // 1) fetch rápido HOY
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

    // 2) precarga SEMANA background
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
    const id = setInterval(async () => {
      const tData = await fetchSchedules(today);
      const liveMap: LiveMap = {};
      tData.forEach((ch) =>
        ch.schedules.forEach((sch) => {
          liveMap[sch.id.toString()] = {
            is_live: sch.program.is_live,
            stream_url: sch.program.stream_url,
          };
        })
      );
      setLiveStatuses(liveMap);
      setChannelsWithSchedules(tData);
    }, 60_000);
    return () => clearInterval(id);
  }, [mounted, today, setLiveStatuses]);

  // medir render final
  useEffect(() => {
    if (flattened.length > 0) {
      const total = performance.now() - startRef.current;
      console.log(`🏁 Grid rendered in ${total.toFixed(2)} ms`);
    }
  }, [flattened]);

  if (!mounted) return null;

  // Skeleton “lienzo completo”
  const SkeletonGrid = () => {
    const totalHeight = timeHeaderHeight + rowHeight * Math.min(channels.length, 8);
    return (
      <Box sx={{ width: '100%', height: totalHeight }}>
        <Skeleton variant="rectangular" width="100%" height="100%" />
      </Box>
    );
  };

  const logo = '/img/logo.png';
  const text = mode === 'light' ? '/img/text.png' : '/img/text-white.png';

  return (
    <LiveStatusProvider>
      {showHoliday && <HolidayDialog open onClose={() => setShowHoliday(false)} />}

      <Box
        sx={{
          minHeight: '100vh',
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
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          sx={{ mb: 2 }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 2,
              py: 1,
              background: mode === 'light' ? '#fff' : '#1e293b',
              borderRadius: 2,
              backdropFilter: 'blur(8px)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box component="img" src={logo} alt="Logo" sx={{ height: 48 }} />
              <Box component="img" src={text} alt="Texto" sx={{ height: 32 }} />
            </Box>
            <ThemeToggle />
          </Box>
        </MotionBox>

        {/* GRID / SKELETON */}
        <MotionBox
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          sx={{
            flex: 1,
            background: mode === 'light' ? '#fff' : '#1e293b',
            borderRadius: 2,
            overflow: 'hidden',
            backdropFilter: 'blur(8px)',
            px: 2,
            pt: 2,
          }}
        >
          {flattened.length === 0 ? (
            <SkeletonGrid />
          ) : (
            <ScheduleGrid channels={channels} schedules={flattened} />
          )}
        </MotionBox>
      </Box>
    </LiveStatusProvider>
  );
}
