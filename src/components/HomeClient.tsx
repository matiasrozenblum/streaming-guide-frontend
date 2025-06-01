'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Box,
  Container,
} from '@mui/material';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';

import { api } from '@/services/api';
import { useLiveStatus } from '@/contexts/LiveStatusContext';
import { useThemeContext } from '@/contexts/ThemeContext';
import { ScheduleGrid } from '@/components/ScheduleGrid';
import { SkeletonScheduleGrid } from '@/components/SkeletonScheduleGrid';
import type { ChannelWithSchedules } from '@/types/channel';
import Header from './Header';
import { useSessionContext } from '@/contexts/SessionContext';
import { useRouter } from 'next/navigation';
import type { SessionWithToken } from '@/types/session';
import { useDeviceId } from '@/hooks/useDeviceId';

const HolidayDialog = dynamic(() => import('@/components/HolidayDialog'), { ssr: false });
const MotionBox = motion(Box);

interface HomeClientProps {
  initialData: {
    holiday: boolean;
    todaySchedules: ChannelWithSchedules[];
    weekSchedules: ChannelWithSchedules[];
  };
}

export default function HomeClient({ initialData }: HomeClientProps) {
  const startRef = useRef(performance.now());
  const router = useRouter();
  const { status, session } = useSessionContext();
  const deviceId = useDeviceId();
  
  useEffect(() => {
    // si no hay sesión, redirige
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const [channelsWithSchedules, setChannelsWithSchedules] = useState(
    Array.isArray(initialData.weekSchedules) ? initialData.weekSchedules : []
  );
  const [showHoliday, setShowHoliday] = useState(initialData.holiday);

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
    if (!session || !deviceId) return; // Wait until both are available

    let isMounted = true;
    console.log('Polling effect ran');

    const updateLiveStatuses = async () => {
      const currentSession = session as SessionWithToken | null;
      const accessToken = currentSession?.accessToken;
      const currentDeviceId = deviceId;
      if (!accessToken) {
        console.warn('Attempted to update live statuses without an access token.');
        return;
      }
      try {
        const params: { live_status: boolean; deviceId?: string } = { live_status: true };
        if (currentDeviceId) {
          params.deviceId = currentDeviceId;
        }

        const resp = await api.get<ChannelWithSchedules[]>('/channels/with-schedules', {
          params,
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!isMounted) return;

        const weekData = resp.data;
        const liveMap: Record<string, { is_live: boolean; stream_url: string | null }> = {};
        weekData.forEach(ch =>
          ch.schedules.forEach(sch => {
            liveMap[sch.id.toString()] = {
              is_live: sch.program.is_live,
              stream_url: sch.program.stream_url,
            };
          })
        );

        setLiveStatuses(liveMap);
        setChannelsWithSchedules(Array.isArray(weekData) ? weekData : []);
      } catch {
        // ignore
      }
    };

    updateLiveStatuses();

    const intervalId = setInterval(() => {
      console.log('Polling interval fired');
      updateLiveStatuses();
    }, 60_000);
    console.log('Polling interval set');

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      console.log('Polling interval cleared');
    };
  }, [session, deviceId]); // Depend on both

  useEffect(() => {
    if (flattened.length > 0) {
      console.log(
        `🏁 Grid rendered in ${(performance.now() - startRef.current).toFixed(2)} ms`
      );
    }
  }, [flattened]);

  return (
    <>
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
              backdropFilter: 'blur(8px)',
            }}
          >
            {showSkeleton ? <SkeletonScheduleGrid rowCount={10} /> : <ScheduleGrid channels={channels} schedules={flattened} />}
          </MotionBox>
        </Container>
      </Box>
    </>
  );
}
