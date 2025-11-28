'use client';

import { Box, Typography, Button } from '@mui/material';
import { useRef, useEffect, useState, useCallback } from 'react';
import dayjs from 'dayjs';
import { TimeHeader } from './TimeHeader';
import { ScheduleRow } from './ScheduleRow';
import { NowIndicator } from './NowIndicator';
import CategoryTabs from './CategoryTabs';
import { Channel, Category } from '@/types/channel';
import { Schedule } from '@/types/schedule';
import { getColorForChannel } from '@/utils/colors';
import { useLayoutValues } from '@/constants/layout';
import { useThemeContext } from '@/contexts/ThemeContext';
import { AccessTime } from '@mui/icons-material';
import weekday from 'dayjs/plugin/weekday';
import { useInView } from 'react-intersection-observer';
import { event as gaEvent } from '@/lib/gtag';
import Clarity from '@microsoft/clarity';
import { useSessionContext } from '@/contexts/SessionContext';
import { SessionWithToken } from '@/types/session';

dayjs.extend(weekday);

interface Props {
  channels: Channel[];
  schedules: Schedule[];
  categories: Category[];
  categoriesEnabled: boolean;
}

export const ScheduleGridDesktop = ({ channels, schedules, categories, categoriesEnabled }: Props) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const nowIndicatorRef = useRef<HTMLDivElement | null>(null);
  const today = dayjs().format('dddd').toLowerCase();
  const [selectedDay, setSelectedDay] = useState(today);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const { channelLabelWidth, pixelsPerMinute } = useLayoutValues();
  const { mode } = useThemeContext();
  const isToday = selectedDay === today;
  const totalGridWidth = pixelsPerMinute * 60 * 24 + channelLabelWidth;
  const { session } = useSessionContext();
  const typedSession = session as SessionWithToken | null;

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

  // Filter channels based on conditional visibility and category
  const visibleChannels = channels.filter(channel => {
    // Filter by category if one is selected
    if (selectedCategory) {
      const hasCategory = channel.categories?.some(cat => cat.id === selectedCategory.id);
      if (!hasCategory) return false;
    }

    // If channel should show only when scheduled, check if it has schedules for this day
    if (channel.show_only_when_scheduled) {
      return getSchedulesForChannel(channel.id).length > 0;
    }
    // Otherwise, always show the channel
    return true;
  });

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Day selector & Live button - Fixed at top */}
      <Box
        display="flex"
        gap={1}
        py={2}
        alignItems="center"
        sx={{
          flexShrink: 0,
          backgroundColor: mode === 'light'
            ? 'linear-gradient(135deg,#f8fafc 0%,#e2e8f0 100%)'
            : 'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)',
          zIndex: 10,
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
                  },
                  userData: typedSession?.user
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
                },
                userData: typedSession?.user
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

      {/* Category tabs - Fixed below day selector */}
      {categoriesEnabled && (
        <Box sx={{ flexShrink: 0, zIndex: 10 }}>
          <CategoryTabs
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            categories={categories}
          />
        </Box>
      )}

      {/* Grid scrollable area */}
      <Box
        ref={scrollRef}
        data-schedule-grid="desktop"
        sx={{
          background: mode === 'light'
            ? 'linear-gradient(to right, rgba(255,255,255,0.9), rgba(255,255,255,0.7))'
            : 'linear-gradient(to right, rgba(30,41,59,0.9), rgba(30,41,59,0.7))',
          border: `1px solid ${mode === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}`,
          borderTopLeftRadius: categoriesEnabled ? 0 : '12px', // Straight when categories visible, rounded when hidden
          borderTopRightRadius: categoriesEnabled ? 0 : '12px',
          borderBottomLeftRadius: '12px', // Round bottom corners
          borderBottomRightRadius: '12px',
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
          // Custom scrollbar styling
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: mode === 'light' 
              ? 'rgba(0, 0, 0, 0.2)' 
              : 'rgba(255, 255, 255, 0.2)',
            borderRadius: '4px',
            border: '1px solid transparent',
            backgroundClip: 'content-box',
            '&:hover': {
              background: mode === 'light' 
                ? 'rgba(0, 0, 0, 0.3)' 
                : 'rgba(255, 255, 255, 0.3)',
            },
          },
          '&::-webkit-scrollbar-corner': {
            background: 'transparent',
          },
          // Firefox scrollbar styling
          scrollbarWidth: 'thin',
          scrollbarColor: mode === 'light' 
            ? 'rgba(0, 0, 0, 0.2) transparent' 
            : 'rgba(255, 255, 255, 0.2) transparent',
        }}
      >
        <Box sx={{ width: `${totalGridWidth}px`, position: 'relative' }}>
          <TimeHeader isMobile={false} />
          {isToday && <NowIndicator ref={nowIndicatorRef} />}
          {visibleChannels.map((channel, idx) => (
            <ScheduleRow
              key={channel.id}
              channelName={channel.name}
              channelLogo={channel.logo_url || undefined}
              channelBackgroundColor={channel.background_color}
              programs={getSchedulesForChannel(channel.id).map(s => ({
                id: s.program.id.toString(),
                scheduleId: s.id.toString(),
                name: s.program.name,
                start_time: s.start_time.slice(0, 5),
                end_time: s.end_time.slice(0, 5),
                subscribed: s.subscribed,
                description: s.program.description || undefined,
                panelists: s.program.panelists?.map(p => ({ id: p.id.toString(), name: p.name })) || undefined,
                logo_url: s.program.logo_url || undefined,
                is_live: s.program.is_live,
                stream_url: s.program.stream_url || undefined,
                isWeeklyOverride: s.isWeeklyOverride,
                overrideType: s.overrideType,
                style_override: s.program.style_override,
              }))}
              color={getColorForChannel(idx, mode)}
              isToday={isToday}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
};