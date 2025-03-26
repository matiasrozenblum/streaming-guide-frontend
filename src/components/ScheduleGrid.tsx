import { Box, Typography, Button } from '@mui/material';
import { useRef, useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { TimeHeader } from './TimeHeader';
import { ScheduleRow } from './ScheduleRow';
import { NowIndicator } from './NowIndicator';
import { Channel } from '@/types/channel';
import { Schedule } from '@/types/schedule';
import { getColorForChannel } from '@/utils/colors';

interface Props {
  channels: Channel[];
  schedules: Schedule[];
}

export const ScheduleGrid = ({ channels, schedules }: Props) => {
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

  if (!channels.length || !schedules.length) {
    return <Typography sx={{ mt: 4 }}>Sin datos disponibles</Typography>;
  }

  // Filtrar schedules por día seleccionado
  const schedulesForDay = schedules.filter((s) => s.day_of_week === selectedDay);

  // Agrupar schedules por canal
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

      {/* Botones de horario */}
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

      <Box overflow="auto" ref={scrollRef} sx={{ maxWidth: '100%', position: 'relative' }}>
        <Box minWidth="1200px" position="relative">
          <TimeHeader />
          <NowIndicator />
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
              }))}
              color={getColorForChannel(index)}
            />
          ))}
        </Box>
      </Box>
    </>
  );
};