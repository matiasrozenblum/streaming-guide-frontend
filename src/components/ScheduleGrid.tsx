import { Box, Typography, Button } from '@mui/material';
import { useRef, useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { TimeHeader } from './TimeHeader';
import { ScheduleRow } from './ScheduleRow';
import { NowIndicator } from './NowIndicator';
import { Channel } from '@/types/channel';
import { Schedule } from '@/types/schedule';
import { getColorForChannel } from '@/utils/colors';
import { PIXELS_PER_MINUTE, CHANNEL_LABEL_WIDTH } from '@/constants/layout';
import weekday from 'dayjs/plugin/weekday';

dayjs.extend(weekday);

interface Props {
  channels: Channel[];
  schedules: Schedule[];
}

export const ScheduleGrid = ({ channels, schedules }: Props) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const today = dayjs().format('dddd').toLowerCase(); // Ej: "friday"
  const [selectedDay, setSelectedDay] = useState(today);

  const daysOfWeek = [
    { label: 'Lun', value: 'monday' },
    { label: 'Mar', value: 'tuesday' },
    { label: 'Mié', value: 'wednesday' },
    { label: 'Jue', value: 'thursday' },
    { label: 'Vie', value: 'friday' },
  ];

  const isToday = selectedDay === dayjs().format('dddd').toLowerCase();

  const totalGridWidth = 60 * PIXELS_PER_MINUTE * 24 + CHANNEL_LABEL_WIDTH;

  // Jump buttons cada 2 horas
  const jumpHours = Array.from({ length: 12 }, (_, i) => i * 2).map((h) =>
    `${String(h).padStart(2, '0')}:00`
  );

  const scrollToHour = (hour: string) => {
    const [h, m] = hour.split(':').map(Number);
    const minutesFromStart = h * 60 + m;
    scrollRef.current?.scrollTo({
      left: minutesFromStart * PIXELS_PER_MINUTE,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    const now = dayjs();
    const minutesFromStart = now.diff(now.startOf('day'), 'minute');
    scrollRef.current?.scrollTo({
      left: minutesFromStart * PIXELS_PER_MINUTE,
      behavior: 'smooth',
    });
  }, []);

  if (!channels.length || !schedules.length) {
    return <Typography sx={{ mt: 4 }}>Sin datos disponibles</Typography>;
  }

  const schedulesForDay = schedules.filter((s) => s.day_of_week === selectedDay);
  const getSchedulesForChannel = (channelId: string) =>
    schedulesForDay.filter((s) => s.program.channel.id === channelId);

  return (
    <>
      {/* Selector de días */}
      <Box display="flex" gap={1} mb={2}>
        {daysOfWeek.map((day) => (
          <Button
            key={day.value}
            variant={selectedDay === day.value ? 'contained' : 'outlined'}
            onClick={() => setSelectedDay(day.value)}
          >
            {day.label}
          </Button>
        ))}
      </Box>

      {/* Botones de salto */}
      <Box display="flex" gap={1} mb={2}>
        {jumpHours.map((hour) => (
          <Button key={hour} variant="outlined" size="small" onClick={() => scrollToHour(hour)}>
            {hour}
          </Button>
        ))}
      </Box>

      {/* Grilla */}
      <Box
        overflow="auto"
        ref={scrollRef}
        sx={{
          position: 'relative',
          display: 'block',
          width: '100%',
          maxWidth: '100vw',
          minWidth: totalGridWidth
        }}
      >
      <Box
        minWidth= {totalGridWidth}
        sx={{
          width: 'fit-content',
          display: 'inline-block',
        }}
        position='relative'
      >
    <TimeHeader />
    {isToday && <NowIndicator />}
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
        }))}
        color={getColorForChannel(index)}
        isToday={isToday}
      />
    ))}
  </Box>
</Box>
    </>
  );
};