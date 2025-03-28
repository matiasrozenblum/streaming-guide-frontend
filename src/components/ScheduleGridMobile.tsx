import { Box, Typography, Button } from '@mui/material';
import { useEffect, useState, useRef } from 'react';
import dayjs from 'dayjs';
import { TimeHeader } from './TimeHeader';
import { Channel } from '@/types/channel';
import { Schedule } from '@/types/schedule';
import { ScheduleRow } from './ScheduleRow';
import { NowIndicator } from './NowIndicator';
import { getColorForChannel } from '@/utils/colors';
import { PIXELS_PER_MINUTE, CHANNEL_LABEL_WIDTH } from '@/constants/layout';

interface Props {
  channels: Channel[];
  schedules: Schedule[];
}

export const ScheduleGridMobile = ({ channels, schedules }: Props) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const today = dayjs().format('dddd').toLowerCase();
  const [selectedDay, setSelectedDay] = useState(today);

  const isToday = selectedDay === today;
  const totalGridWidth = 60 * PIXELS_PER_MINUTE * 24 + CHANNEL_LABEL_WIDTH;

  const daysOfWeek = [
    { label: 'Lun', value: 'monday' },
    { label: 'Mar', value: 'tuesday' },
    { label: 'Mié', value: 'wednesday' },
    { label: 'Jue', value: 'thursday' },
    { label: 'Vie', value: 'friday' },
  ];

  const schedulesForDay = schedules.filter((s) => s.day_of_week === selectedDay);
  const getSchedulesForChannel = (channelId: string) =>
    schedulesForDay.filter((s) => s.program.channel.id === channelId);

  useEffect(() => {
    const now = dayjs();
    const minutesFromStart = now.diff(now.startOf('day'), 'minute');
    scrollRef.current?.scrollTo({
      left: minutesFromStart * PIXELS_PER_MINUTE - 60,
      behavior: 'smooth',
    });
  }, []);

  if (!channels.length || !schedules.length) {
    return <Typography sx={{ mt: 4 }}>Sin datos disponibles</Typography>;
  }

  return (
    <Box>
      {/* Selector de días */}
      <Box display="flex" gap={1} mb={2} overflow="auto">
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

      {/* Scroll horizontal unificado */}
      <Box
        ref={scrollRef}
        sx={{
          overflowX: 'auto',
          overflowY: 'hidden',
          width: '100%',
          minHeight: '100px',
        }}
      >
        <Box
          sx={{
            minWidth: `${totalGridWidth}px`,
            position: 'relative',
          }}
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
    </Box>
  );
};