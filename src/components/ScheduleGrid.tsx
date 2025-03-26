import { Box, Typography, Button } from '@mui/material';
import { useRef, useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { TimeHeader } from './TimeHeader';
import { ScheduleRow } from './ScheduleRow';
import { NowIndicator } from './NowIndicator';
import { Channel } from '@/types/channel';
import { Program } from '@/types/program';
import { getColorForChannel } from '@/utils/colors';

interface Props {
  channels: Channel[];
  programs: Program[];
}

export const ScheduleGrid = ({ channels, programs }: Props) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const [selectedDay, setSelectedDay] = useState('monday');

  const daysOfWeek = [
    { label: 'Lun', value: 'monday' },
    { label: 'Mar', value: 'tuesday' },
    { label: 'Mié', value: 'wednesday' },
    { label: 'Jue', value: 'thursday' },
    { label: 'Vie', value: 'friday' },
  ];

  const jumpHours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00'];

  const scrollToHour = (hour: string) => {
    const [h, m] = hour.split(':').map(Number);
    const minutesFromStart = (h - 8) * 60 + m;
    scrollRef.current?.scrollTo({
      left: (minutesFromStart / 60) * 100,
      behavior: 'smooth',
    });
  };

  const getProgramsForChannel = (channelId: string) =>
    programs.filter((p) => p.channelId === channelId);

  useEffect(() => {
    const now = dayjs();
    const startOfDay = now.hour(8).minute(0);
    const minutesFromStart = now.diff(startOfDay, 'minute');
    const scrollX = (minutesFromStart / 60) * 100;

    scrollRef.current?.scrollTo({
      left: scrollX,
      behavior: 'smooth',
    });
  }, []);

  if (!channels.length || !programs.length) {
    return <Typography sx={{ mt: 4 }}>Sin datos disponibles</Typography>;
  }

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

      {/* Botones de navegación horaria */}
      <Box display="flex" gap={1} mb={2}>
        {jumpHours.map((hour) => (
          <Button
            key={hour}
            variant="outlined"
            size="small"
            onClick={() => scrollToHour(hour)}
          >
            {hour}
          </Button>
        ))}
      </Box>

      {/* Mostrar qué día está seleccionado (solo para debug ahora) */}
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        Día seleccionado: {selectedDay}
      </Typography>

      {/* Contenedor scrollable horizontal */}
      <Box overflow="auto" ref={scrollRef} sx={{ maxWidth: '100%', position: 'relative' }}>
        <Box minWidth="1200px" position="relative">
          <TimeHeader />
          <NowIndicator />
          {channels.map((channel, index) => (
            <ScheduleRow
              key={channel.id}
              channelName={channel.name}
              channelLogo={channel.logo_url}
              programs={getProgramsForChannel(channel.id).map((p) => ({
                id: p.id,
                name: p.name,
                start_time: p.startTime.slice(0, 5),
                end_time: p.endTime.slice(0, 5),
                description: p.description,
              }))}
              color={getColorForChannel(index)}
            />
          ))}
        </Box>
      </Box>
    </>
  );
};