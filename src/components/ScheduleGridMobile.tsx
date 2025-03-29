import { Box, Typography, Button } from '@mui/material';
import { useEffect, useState, useRef } from 'react';
import dayjs from 'dayjs';
import { TimeHeader } from './TimeHeader';
import { Channel } from '@/types/channel';
import { Schedule } from '@/types/schedule';
import { ScheduleRow } from './ScheduleRow';
import { NowIndicator } from './NowIndicator';
import { getColorForChannel } from '@/utils/colors';
import { useLayoutValues } from '@/constants/layout';

interface Props {
  channels: Channel[];
  schedules: Schedule[];
}

export const ScheduleGridMobile = ({ channels, schedules }: Props) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const today = dayjs().format('dddd').toLowerCase();
  const [selectedDay, setSelectedDay] = useState(today);
  const { channelLabelWidth, pixelsPerMinute } = useLayoutValues();

  const isToday = selectedDay === today;
  const totalGridWidth = (pixelsPerMinute * 60 * 24) + channelLabelWidth;

  const daysOfWeek = [
    { label: 'L', value: 'monday' },
    { label: 'M', value: 'tuesday' },
    { label: 'X', value: 'wednesday' },
    { label: 'J', value: 'thursday' },
    { label: 'V', value: 'friday' },
    { label: 'S', value: 'saturday' },
    { label: 'D', value: 'sunday' },
  ];

  useEffect(() => {
    if (isToday) {
      const now = dayjs();
      const minutesFromStart = (now.hour() * 60) + now.minute();
      const scrollPosition = (minutesFromStart * pixelsPerMinute) - 100;
      scrollRef.current?.scrollTo({
        left: scrollPosition,
        behavior: 'smooth',
      });
    }
  }, [isToday, pixelsPerMinute]);

  if (!channels.length || !schedules.length) {
    return <Typography sx={{ mt: 4 }}>Sin datos disponibles</Typography>;
  }

  const schedulesForDay = schedules.filter((s) => s.day_of_week === selectedDay);
  const getSchedulesForChannel = (channelId: string) =>
    schedulesForDay.filter((s) => s.program.channel.id === channelId);

  return (
    <Box>
      <Box 
        display="flex" 
        gap={1} 
        mb={2} 
        p={2}
        sx={{
          background: 'linear-gradient(to right, rgba(255,255,255,0.9), rgba(255,255,255,0.7))',
          borderBottom: '1px solid rgba(0,0,0,0.1)',
          backdropFilter: 'blur(8px)',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {daysOfWeek.map((day) => (
          <Button
            key={day.value}
            variant={selectedDay === day.value ? 'contained' : 'outlined'}
            onClick={() => setSelectedDay(day.value)}
            sx={{
              minWidth: '44px',
              height: '44px',
              padding: '0',
              borderRadius: '10px',
            }}
          >
            {day.label}
          </Button>
        ))}
      </Box>

      <Box
        ref={scrollRef}
        sx={{
          overflowX: 'auto',
          overflowY: 'hidden',
          width: '100%',
          WebkitOverflowScrolling: 'touch',
          position: 'relative',
        }}
      >
        <Box
          sx={{
            width: `${totalGridWidth}px`,
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