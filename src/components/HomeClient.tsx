'use client';

import { useSession } from 'next-auth/react'
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Box,
  Container,
  IconButton,
  Typography
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';

import { api } from '@/services/api';
import { ThemeToggle } from '@/components/ThemeToggle';
import LoginModal from '@/components/auth/LoginModal';
import UserMenu from '@/components/UserMenu';
import { LiveStatusProvider, useLiveStatus } from '@/contexts/LiveStatusContext';
import { useThemeContext } from '@/contexts/ThemeContext';
import { ScheduleGrid } from '@/components/ScheduleGrid';
import { SkeletonScheduleGrid } from '@/components/SkeletonScheduleGrid';
import type { ChannelWithSchedules } from '@/types/channel';

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
  // Timer for performance logging
  const startRef = useRef(performance.now());

  const { data: session } = useSession()
  const isAuth = session?.user.role === 'user' || session?.user.role === 'admin'
  const token = session?.accessToken || ''

  // Hydrate with initialData from SSR
  const initArray: ChannelWithSchedules[] =
    Array.isArray(initialData)
      ? initialData
      : hasData(initialData)
      ? initialData.data
      : [];

  const [channelsWithSchedules, setChannelsWithSchedules] = useState(initArray);
  const [showHoliday, setShowHoliday] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

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

  // Grid shows skeleton only if truly empty
  const showSkeleton = flattened.length === 0;

  // One effect: holiday, weekly load, polling
  useEffect(() => {
    let isMounted = true;

    // Holiday check
    (async () => {
      try {
        const { data } = await api.get<{ holiday: boolean }>(
          '/holiday',
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (isMounted && data.holiday) setShowHoliday(true);
      } catch {
        // ignore
      }
    })();

    // Load week schedules
    const loadWeek = async () => {
      try {
        console.log('HomeClient.tsx token', token);
        const resp = await api.get<ChannelWithSchedules[]>(
          '/channels/with-schedules',
          { params: { live_status: true }, headers: { Authorization: `Bearer ${token}` } }
        );
        if (!isMounted) return;
        const weekData = resp.data;
        const liveMap: LiveMap = {};
        weekData.forEach(ch =>
          ch.schedules.forEach(sch => {
            liveMap[sch.id.toString()] = {
              is_live: sch.program.is_live,
              stream_url: sch.program.stream_url
            };
          })
        );
        setLiveStatuses(liveMap);
        setChannelsWithSchedules(weekData);
      } catch {
        // ignore errors on load
      }
    };

    loadWeek();
    const intervalId = setInterval(loadWeek, 60_000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [token, setLiveStatuses]);

  // Performance log once data arrives
  useEffect(() => {
    if (flattened.length > 0) {
      console.log(
        `🏁 Grid rendered in ${(performance.now() - startRef.current).toFixed(2)} ms`
      );
    }
  }, [flattened]);

  // Assets
  const logo = '/img/logo.png';
  const text = mode === 'light' ? '/img/text.png' : '/img/text-white.png';

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
        {/* HEADER */}
        <Container maxWidth="xl" disableGutters sx={{ px: 0, mb: { xs: 1, sm: 2 } }}>
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
                px: { xs: 1, sm: 2 },
                position: 'relative'
              }}
            >
              <Box
                component="img"
                src={logo}
                alt="Logo"
                sx={{ height: '11vh', width: 'auto' }}
              />
              <Box
                component="img"
                src={text}
                alt="Texto"
                sx={{ pl: { xs: 1, sm: 2 }, height: '11vh', width: 'auto' }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  right: 8,
                  transform: 'translateY(-50%)',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {!isAuth ? (
                  <>
                    <IconButton
                      color="inherit"
                      onClick={() => setLoginOpen(true)}
                      sx={{ ml: 1 }}
                    >
                      <PersonIcon sx={{ color: 'text.secondary' }} />
                      <Typography
                        variant="button"
                        sx={{ color: 'text.secondary', ml: 0.5 }}
                      >
                        Acceder
                      </Typography>
                    </IconButton>
                    <LoginModal
                      open={loginOpen}
                      onClose={() => setLoginOpen(false)}
                    />
                  </>
                ) : (
                  <UserMenu />
                )}
                <ThemeToggle />
              </Box>
            </Box>
          </MotionBox>
        </Container>

        {/* GRID */}
        <Container
          maxWidth="xl"
          disableGutters
          sx={{ px: 0, flex: 1, display: 'flex', flexDirection: 'column' }}
        >
          <MotionBox
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            sx={{
              flex: 1,
              background:
                mode === 'light' ? 'rgba(255,255,255,0.9)' : 'rgba(30,41,59,0.9)',
              borderRadius: 2,
              backdropFilter: 'blur(8px)'
            }}
          >
            {showSkeleton ? (
              <SkeletonScheduleGrid rowCount={10} />
            ) : (
              <ScheduleGrid channels={channels} schedules={flattened} />
            )}
          </MotionBox>
        </Container>
      </Box>
    </LiveStatusProvider>
  );
}