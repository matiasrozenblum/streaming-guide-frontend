'use client';

import { Box, Typography, Button } from '@mui/material';
import { useRef, useEffect, useState, useCallback } from 'react';
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
import { event as gaEvent } from '@/lib/gtag';
import Clarity from '@microsoft/clarity';

dayjs.extend(weekday);

interface Props {
  channels: Channel[];
  schedules: Schedule[];
}

export const ScheduleGridDesktop = ({ channels, schedules }: Props) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const nowIndicatorRef = useRef<HTMLDivElement | null>(null);
  const today = dayjs().format('dddd').toLowerCase();
  const [selectedDay, setSelectedDay] = useState(today);
  const { channelLabelWidth, pixelsPerMinute } = useLayoutValues();
  const { mode } = useThemeContext();
  const isToday = selectedDay === today;
  const totalGridWidth = pixelsPerMinute * 60 * 24 + channelLabelWidth;

  // IntersectionObserver para el botón 'En vivo'
  const { ref: observerRef, inView } = useInView({ threshold: 0 });
  useEffect(() => {
    if (nowIndicatorRef.current) observerRef(nowIndicatorRef.current);
  }, [observerRef]);

  // Scroll al momento actual
  const scrollToNow = useCallback(() => {
    const now = dayjs();
    const minutes = now.hour() * 60 + now.minute();
    scrollRef.current?.scrollTo({
      left: minutes * pixelsPerMinute - 240,
      behavior: 'smooth',
    });
  }, [pixelsPerMinute]);

  useEffect(() => {
    if (isToday) scrollToNow();
  }, [isToday, scrollToNow]);

  // Lógica de arrastre horizontal
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDown = true;
      container.classList.add('dragging');
      startX = e.pageX - container.offsetLeft;
      scrollLeft = container.scrollLeft;
    };
    const onMouseUp = () => {
      isDown = false;
      container.classList.remove('dragging');
    };
    const onMouseLeave = onMouseUp;
    const onMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - container.offsetLeft;
      container.scrollLeft = scrollLeft - (x - startX) * 1.2;
    };

    container.addEventListener('mousedown', onMouseDown);
    container.addEventListener('mouseup', onMouseUp);
    container.addEventListener('mouseleave', onMouseLeave);
    container.addEventListener('mousemove', onMouseMove);
    return () => {
      container.removeEventListener('mousedown', onMouseDown);
      container.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('mouseleave', onMouseLeave);
      container.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  if (!channels.length || !schedules.length) {
    return (
      <Typography sx={{ mt: 4, color: mode === 'light' ? '#374151' : '#f1f5f9' }}>
        Sin datos disponibles
      </Typography>
    );
  }

  const schedulesForDay = schedules.filter(s => s.day_of_week === selectedDay);
  const getSchedulesForChannel = (id: number) =>
    schedulesForDay.filter(s => s.program.channel.id === id);

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
      {/* Day selector & Live button */}
      <Box
        display="flex"
        gap={1}
        py={2}
        alignItems="center"
        sx={{
          /*background: mode === 'light'
            ? 'linear-gradient(to right, rgba(255,255,255,0.9), rgba(255,255,255,0.7))'
            : 'linear-gradient(to right, rgba(30,41,59,0.9), rgba(30,41,59,0.7))',
          borderBottom: `1px solid ${mode === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}`,
          backdropFilter: 'blur(8px)',*/
        }}
      >
        {[
          { label: 'Lun', value: 'monday' },
          { label: 'Mar', value: 'tuesday' },
          { label: 'Mié', value: 'wednesday' },
          { label: 'Jue', value: 'thursday' },
          { label: 'Vie', value: 'friday' },
          { label: 'Sáb', value: 'saturday' },
          { label: 'Dom', value: 'sunday' },
        ].map(day => (
          <Button
            key={day.value}
            variant={selectedDay === day.value ? 'contained' : 'outlined'}
            onClick={
              () => {
                setSelectedDay(day.value);
                Clarity.setTag('selected_day', day.value);
                Clarity.event('day_change');
                gaEvent({
                  action: 'day_change',
                  params: {
                    day: day.value,
                    client: 'desktop',
                  }
                });
              }
            }
            sx={{
              minWidth: '80px',
              height: '40px',
              transition: 'background-color 0.3s ease, border 0.3s ease, color 0.3s ease, box-shadow 0.3s ease, transform 0.2s cubic-bezier(0.68, -0.55, 0.27, 1.55)',
              transform: selectedDay === day.value ? 'scale(1.05)' : 'scale(1)',
            }}
          >
            {day.label}
          </Button>
        ))}
        {!inView && (
          <Button
            onClick={() => {
              Clarity.event('live_button_click');
              gaEvent({
                action: 'scroll_to_now',
                params: {
                  client: 'desktop',
                }
              });
              if (selectedDay !== today) {
                setSelectedDay(today);
                setTimeout(() => scrollToNow(), 100);
              } else scrollToNow();
            }}
            variant="outlined"
            startIcon={<AccessTime />}
            sx={{ ml: 'auto', height: '40px', fontWeight: 'bold', textTransform: 'none' }}
          >
            En vivo
          </Button>
        )}
      </Box>

      {/* Grid scrollable area */}
      <Box
        ref={scrollRef}
        sx={{
          background: mode === 'light'
            ? 'linear-gradient(to right, rgba(255,255,255,0.9), rgba(255,255,255,0.7))'
            : 'linear-gradient(to right, rgba(30,41,59,0.9), rgba(30,41,59,0.7))',
          border: `1px solid ${mode === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}`,
          borderRadius: '12px',
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'auto',
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
          <TimeHeader isMobile={false} />
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
    </Box>
  );
};