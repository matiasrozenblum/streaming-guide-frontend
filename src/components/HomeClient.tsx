'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Box,
  Container,
} from '@mui/material';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';

import { api } from '@/services/api';
import { LiveStatusProvider, useLiveStatus } from '@/contexts/LiveStatusContext';
import { useThemeContext } from '@/contexts/ThemeContext';
import { ScheduleGrid } from '@/components/ScheduleGrid';
import { SkeletonScheduleGrid } from '@/components/SkeletonScheduleGrid';
import type { ChannelWithSchedules } from '@/types/channel';
import Header from './Header';

const HolidayDialog = dynamic(() => import('@/components/HolidayDialog'), { ssr: false });
const MotionBox = motion(Box);

interface HomeClientProps {
  initialData: ChannelWithSchedules[] | { data: ChannelWithSchedules[] };
}

interface HasData { data: ChannelWithSchedules[]; }
const hasData = (x: unknown): x is HasData =>
  typeof x === 'object' && x !== null && Array.isArray((x as HasData).data);

type LiveMap = Record<string, { is_live: boolean; stream_url: string | null }>;

export default function HomeClient({ initialData }: HomeClientProps) {
  const startRef = useRef(performance.now());

  // Hydrate with initialData from SSR
  const initArray: ChannelWithSchedules[] =
    Array.isArray(initialData)
      ? initialData
      : hasData(initialData)
      ? initialData.data
      : [];

  const [channelsWithSchedules, setChannelsWithSchedules] = useState(initArray);
  const [showHoliday, setShowHoliday] = useState(false);

  const { mode } = useThemeContext();
  const { setLiveStatuses } = useLiveStatus();

  // Derive flat lists for grid
  const channels = useMemo(
    () => channelsWithSchedules.map(c => c.channel),
    [channelsWithSchedules]
  );
  const flattened = useMemo(
    () => channelsWithSchedules.flatMap(c =>
      c.schedules.map(s => ({ ...s, program: { ...s.program, channel: c.channel } }))
    ),
    [channelsWithSchedules]
  );

  const showSkeleton = flattened.length === 0;

  useEffect(() => {
    let isMounted = true;

    // Holiday check
    (async () => {
      try {
        const { data } = await api.get<{ holiday: boolean }>('/holiday');
        if (isMounted && data.holiday) setShowHoliday(true);
      } catch {
        // ignore
      }
    })();

    // Load week schedules
    const loadWeek = async () => {
      try {
        const resp = await api.get<ChannelWithSchedules[]>('/channels/with-schedules', {
          params: { live_status: true },
        });
        if (!isMounted) return;

        const weekData = resp.data;
        const liveMap: LiveMap = {};
        weekData.forEach(ch =>
          ch.schedules.forEach(sch => {
            liveMap[sch.id.toString()] = {
              is_live: sch.program.is_live,
              stream_url: sch.program.stream_url,
            };
          })
        );

        setLiveStatuses(liveMap);
        setChannelsWithSchedules(weekData);
      } catch {
        // ignore
      }
    };

    loadWeek();
    const intervalId = setInterval(loadWeek, 60_000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [setLiveStatuses]);

  useEffect(() => {
    if (flattened.length > 0) {
      console.log(
        `🏁 Grid rendered in ${(performance.now() - startRef.current).toFixed(2)} ms`
      );
    }
  }, [flattened]);

  return (
    <LiveStatusProvider>
      {showHoliday && <HolidayDialog open onClose={() => setShowHoliday(false)} />}

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
          flexDirection: 'column'
        }}
      >
        <Header />

        <Container maxWidth="xl" disableGutters sx={{ px: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <MotionBox
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            sx={{
              flex: 1,
              background: mode === 'light' ? 'rgba(255,255,255,0.9)' : 'rgba(30,41,59,0.9)',
              borderRadius: 2,
              backdropFilter: 'blur(8px)',
            }}
          >
            {showSkeleton ? <SkeletonScheduleGrid rowCount={10} /> : <ScheduleGrid channels={channels} schedules={flattened} />}
          </MotionBox>
        </Container>
      </Box>
    </LiveStatusProvider>
  );
}