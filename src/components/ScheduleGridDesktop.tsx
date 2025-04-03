'use client';

import { Box, Typography, Button, IconButton } from '@mui/material';
import { useRef, useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { TimeHeader } from './TimeHeader';
import { ScheduleRow } from './ScheduleRow';
import { NowIndicator } from './NowIndicator';
import { Channel } from '@/types/channel';
import { Schedule } from '@/types/schedule';
import { getColorForChannel } from '@/utils/colors';
import { useLayoutValues } from '@/constants/layout';
import { useThemeContext } from '@/contexts/ThemeContext';
import { AccessTime } from '@mui/icons-material';
import weekday from 'dayjs/plugin/weekday';
import { useInView } from 'react-intersection-observer';

dayjs.extend(weekday);

interface Props {
  channels: Channel[];
  schedules: Schedule[];
}

export const ScheduleGridDesktop = ({ channels, schedules }: Props) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const today = dayjs().format('dddd').toLowerCase();
  const [selectedDay, setSelectedDay] = useState(today);
  const { channelLabelWidth, pixelsPerMinute } = useLayoutValues();
  const { mode } = useThemeContext();

  const isToday = selectedDay === today;
  const totalGridWidth = (pixelsPerMinute * 60 * 24) + channelLabelWidth;

  const nowIndicatorRef = useRef<HTMLDivElement | null>(null);
  const { ref: observerRef, inView } = useInView({ threshold: 0 });

  useEffect(() => {
    if (nowIndicatorRef.current) {
      observerRef(nowIndicatorRef.current);
    }
  }, [observerRef]);

  const daysOfWeek = [
    { label: 'Lun', value: 'monday' },
    { label: 'Mar', value: 'tuesday' },
    { label: 'Mié', value: 'wednesday' },
    { label: 'Jue', value: 'thursday' },
    { label: 'Vie', value: 'friday' },
    { label: 'Sáb', value: 'saturday' },
    { label: 'Dom', value: 'sunday' },
  ];

  const scrollToNow = () => {
    const now = dayjs();
    const minutesFromStart = (now.hour() * 60) + now.minute();
    const scrollPosition = (minutesFromStart * pixelsPerMinute) - 200;
    scrollRef.current?.scrollTo({
      left: scrollPosition,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    if (isToday) scrollToNow();
  }, [isToday, pixelsPerMinute]);

  if (!channels.length || !schedules.length) {
    return <Typography sx={{ mt: 4, color: mode === 'light' ? '#374151' : '#f1f5f9' }}>Sin datos disponibles</Typography>;
  }

  const schedulesForDay = schedules.filter((s) => s.day_of_week === selectedDay);
  const getSchedulesForChannel = (channelId: string) =>
    schedulesForDay.filter((s) => s.program.channel.id === channelId);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <Box display="flex" gap={1} p={2} alignItems="center"
        sx={{
          background: mode === 'light'
            ? 'linear-gradient(to right, rgba(255,255,255,0.9), rgba(255,255,255,0.7))'
            : 'linear-gradient(to right, rgba(30,41,59,0.9), rgba(30,41,59,0.7))',
          borderBottom: `1px solid ${mode === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}`,
          backdropFilter: 'blur(8px)',
        }}
      >
        {daysOfWeek.map((day) => (
          <Button
            key={day.value}
            variant={selectedDay === day.value ? 'contained' : 'outlined'}
            onClick={() => setSelectedDay(day.value)}
            sx={{ minWidth: '80px', height: '40px' }}
          >
            {day.label}
          </Button>
        ))}
        {isToday && !inView && (
          <Button
            onClick={scrollToNow}
            variant="outlined"
            startIcon={<AccessTime />}
            sx={{
              ml: 'auto',
              height: '40px',
              fontWeight: 'bold',
              textTransform: 'none',
            }}
          >
            Volver al presente
          </Button>
        )}
      </Box>

      <Box
        ref={scrollRef}
        sx={{
          flex: 1,
          minHeight: 0,
          overflowX: 'auto',
          overflowY: 'scroll',
          width: '100%',
          maxWidth: '100vw',
          position: 'relative',
          mr: '-8px',
          pr: '8px',
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: mode === 'light' ? '#f1f5f9' : '#1e293b',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: mode === 'light' ? '#cbd5e1' : '#475569',
            borderRadius: '4px',
            '&:hover': {
              background: mode === 'light' ? '#94a3b8' : '#64748b',
            },
          },
        }}
      >
        <Box sx={{ width: `${totalGridWidth}px`, position: 'relative' }}>
          <TimeHeader />
          {isToday && <NowIndicator ref={nowIndicatorRef} />}
          {channels.map((channel, index) => (
            <ScheduleRow
              key={channel.id}
              channelName={channel.name}
              channelLogo={channel.logo_url}
              programs={getSchedulesForChannel(channel.id).map((s) => ({
                id: s.id.toString(),
                name: s.program.name,
                start_time: s.start_time.slice(0, 5),
                end_time: s.end_time.slice(0, 5),
                description: s.program.description,
                panelists: s.program.panelists,
                logo_url: s.program.logo_url,
                youtube_url: s.program.youtube_url,
                live_url: channel.streaming_url,
              }))}
              color={getColorForChannel(index)}
              isToday={isToday}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
};