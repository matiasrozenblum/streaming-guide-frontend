'use client';

import { Box, Typography, Button, Fab } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useEffect, useState, useRef, useCallback } from 'react';
import dayjs from 'dayjs';
import { TimeHeader } from './TimeHeader';
import { Channel } from '@/types/channel';
import { Schedule } from '@/types/schedule';
import { ScheduleRow } from './ScheduleRow';
import { NowIndicator } from './NowIndicator';
import { getColorForChannel } from '@/utils/colors';
import { useLayoutValues } from '@/constants/layout';
import { useThemeContext } from '@/contexts/ThemeContext';
import { event as gaEvent } from '@/lib/gtag';
import Clarity from '@microsoft/clarity';

interface Props {
  channels: Channel[];
  schedules: Schedule[];
}

export const ScheduleGridMobile = ({ channels, schedules }: Props) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const nowIndicatorRef = useRef<HTMLDivElement>(null);
  const today = dayjs().format('dddd').toLowerCase();
  const [selectedDay, setSelectedDay] = useState(today);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const { channelLabelWidth, pixelsPerMinute } = useLayoutValues();
  const { mode } = useThemeContext();
  const isToday = selectedDay === today;
  const totalGridWidth = pixelsPerMinute * 60 * 24 + channelLabelWidth;

  const daysOfWeek = [
    { label: 'L', value: 'monday' },
    { label: 'M', value: 'tuesday' },
    { label: 'X', value: 'wednesday' },
    { label: 'J', value: 'thursday' },
    { label: 'V', value: 'friday' },
    { label: 'S', value: 'saturday' },
    { label: 'D', value: 'sunday' },
  ];

  const scrollToNow = useCallback(() => {
    const now = dayjs();
    const minutesFromStart = now.hour() * 60 + now.minute();
    const scrollPosition = minutesFromStart * pixelsPerMinute - 120;
    scrollRef.current?.scrollTo({ left: scrollPosition, behavior: 'smooth' });
  }, [pixelsPerMinute]);

  const checkNowIndicatorVisibility = useCallback(() => {
    const indicator = nowIndicatorRef.current;
    const container = scrollRef.current;
    if (!indicator || !container) return;

    const indicatorRect = indicator.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    const isVisible =
      indicatorRect.left >= containerRect.left &&
      indicatorRect.right <= containerRect.right;
    setShowScrollButton(!isVisible);
  }, []);

  useEffect(() => { scrollToNow(); }, [scrollToNow]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    if (selectedDay !== today) {
      setShowScrollButton(true);
      return;
    }

    container.addEventListener('scroll', checkNowIndicatorVisibility);
    checkNowIndicatorVisibility();

    return () => {
      container.removeEventListener('scroll', checkNowIndicatorVisibility);
    };
  }, [checkNowIndicatorVisibility, selectedDay, today]);

  if (!channels.length || !schedules.length) {
    return (
      <Typography sx={{ mt: 4, color: mode === 'light' ? '#374151' : '#f1f5f9' }}>
        Sin datos disponibles
      </Typography>
    );
  }

  const schedulesForDay = schedules.filter(s => s.day_of_week === selectedDay);
  const getSchedulesForChannel = (channelId: number) =>
    schedulesForDay.filter(s => s.program.channel.id === channelId);

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Día Selector */}
      <Box
        display="flex"
        gap={1}
        p={2}
        sx={{
          background:
            mode === 'light'
              ? 'linear-gradient(to right, rgba(255,255,255,0.9), rgba(255,255,255,0.7))'
              : 'linear-gradient(to right, rgba(30,41,59,0.9), rgba(30,41,59,0.7))',
          borderBottom: `1px solid ${mode === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}`,
          backdropFilter: 'blur(8px)',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {daysOfWeek.map(day => (
          <Button
            key={day.value}
            variant={selectedDay === day.value ? 'contained' : 'outlined'}
            onClick={() => {
              setSelectedDay(day.value);
              Clarity.setTag('selected_day', day.value);
              Clarity.event('day_change');
              gaEvent(
                'day_change',
                { day: day.value, client: 'mobile' }
              );
            }}
            sx={{ minWidth: '40px', height: '40px', padding: 0, borderRadius: '8px' }}
          >
            {day.label}
          </Button>
        ))}
      </Box>

      {/* Contenedor scrollable */}
      <Box
        ref={scrollRef}
        sx={{
          flex: 1,
          minHeight: 0,
          overflowX: 'auto',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          position: 'relative',
          userSelect: 'none',
          WebkitUserDrag: 'none',
          cursor: 'grab',
          '&.dragging': {
            cursor: 'grabbing',
          },
        }}
      >
        <Box sx={{ width: `${totalGridWidth}px`, position: 'relative' }}>
          <TimeHeader />
          {isToday && <NowIndicator ref={nowIndicatorRef} />}
          {channels.map((channel, idx) => (
            <ScheduleRow
              key={channel.id}
              channelName={channel.name}
              channelLogo={channel.logo_url || undefined}
              programs={getSchedulesForChannel(channel.id).map(s => ({
                id: s.program.id.toString(),
                name: s.program.name,
                start_time: s.start_time.slice(0, 5),
                end_time: s.end_time.slice(0, 5),
                subscribed: s.subscribed,
                description: s.program.description || undefined,
                panelists: s.program.panelists || undefined,
                logo_url: s.program.logo_url || undefined,
                is_live: s.program.is_live,
                stream_url: s.program.stream_url || undefined,
              }))}
              color={getColorForChannel(idx)}
              isToday={isToday}
            />
          ))}
        </Box>
      </Box>

      {/* Botón flotante */}
      {showScrollButton && (
        <Fab
          variant="extended"
          size="medium"
          onClick={() => {
            if (selectedDay !== today) {
              setSelectedDay(today);
              setTimeout(() => scrollToNow(), 100);
            } else scrollToNow();
            Clarity.event('live_button_click');
            gaEvent(
              'live_button_click',
              { client: 'mobile' }
            );
          }}
          sx={{
            position: 'fixed',
            bottom: '20vh',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: mode === 'light' ? '#2563eb' : '#3b82f6',
            color: '#ffffff',
            opacity: 0.85,
            textTransform: 'none',
            zIndex: 1000,
            '&:hover': {
              backgroundColor: mode === 'light' ? '#1d4ed8' : '#2563eb',
              opacity: 1,
            },
          }}
        >
          <AccessTimeIcon sx={{ mr: 1 }} />
          En vivo
        </Fab>
      )}
    </Box>
  );
};
