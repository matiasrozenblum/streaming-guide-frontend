'use client';

import { Box, Typography, Button, Fab } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useEffect, useState, useRef, useCallback } from 'react';
import dayjs from 'dayjs';
import { TimeHeader } from './TimeHeader';
import CategoryTabs from './CategoryTabs';
import { Channel, Category } from '@/types/channel';
import { Schedule } from '@/types/schedule';
import { ScheduleRow } from './ScheduleRow';
import { NowIndicator } from './NowIndicator';
import { getColorForChannel } from '@/utils/colors';
import { useLayoutValues } from '@/constants/layout';
import { useThemeContext } from '@/contexts/ThemeContext';
import { event as gaEvent } from '@/lib/gtag';
import Clarity from '@microsoft/clarity';
import { useSessionContext } from '@/contexts/SessionContext';
import { SessionWithToken } from '@/types/session';
import { useStreamersConfig } from '@/hooks/useStreamersConfig';
import Footer from './Footer';

interface Props {
  channels: Channel[];
  schedules: Schedule[];
  categories: Category[];
  categoriesEnabled: boolean;
}

export const ScheduleGridMobile = ({ channels, schedules, categories, categoriesEnabled }: Props) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const nowIndicatorRef = useRef<HTMLDivElement>(null);
  const today = dayjs().format('dddd').toLowerCase();
  const [selectedDay, setSelectedDay] = useState(today);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const { channelLabelWidth, pixelsPerMinute } = useLayoutValues();
  const { mode } = useThemeContext();
  const isToday = selectedDay === today;
  const totalGridWidth = pixelsPerMinute * 60 * 24 + channelLabelWidth;

  const { session } = useSessionContext();
  const typedSession = session as SessionWithToken | null;
  const { streamersEnabled } = useStreamersConfig();

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

  // Account for bottom navigation bar (56px height) + safe area inset (only if streamers enabled)
  const bottomNavHeight = streamersEnabled ? 56 : 0;

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: `calc(100vh - ${bottomNavHeight}px - env(safe-area-inset-bottom, 0px))`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Día Selector */}
      <Box
        display="flex"
        gap={1}
        pl={1}
        pb={2}
        sx={{
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
              gaEvent({
                action: 'day_change',
                params: { day: day.value, client: 'mobile' },
                userData: typedSession?.user
              });
            }}
            sx={{
              minWidth: '40px',
              height: '40px',
              padding: 0,
              borderRadius: '8px',
              transition: 'background-color 0.3s ease, border 0.3s ease, color 0.3s ease, box-shadow 0.3s ease, transform 0.2s cubic-bezier(0.68, -0.55, 0.27, 1.55)',
              transform: selectedDay === day.value ? 'scale(1.05)' : 'scale(1)',
            }}
          >
            {day.label}
          </Button>
        ))}
      </Box>

      {/* Category tabs */}
      {categoriesEnabled && (
        <CategoryTabs
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          categories={categories}
        />
      )}

      {/* Contenedor scrollable */}
      <Box
        ref={scrollRef}
        data-schedule-grid="mobile"
        sx={{
          borderTopLeftRadius: categoriesEnabled ? 0 : '12px', // Straight when categories visible, rounded when hidden
          borderTopRightRadius: categoriesEnabled ? 0 : '12px',
          borderBottomLeftRadius: '12px', // Round bottom corners
          borderBottomRightRadius: '12px',
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
          <TimeHeader isMobile={true} />
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
          {/* Footer at the bottom of scrollable grid */}
          <Box sx={{ width: '100%', mt: 2 }}>
            <Footer />
          </Box>
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
            gaEvent({
              action: 'scroll_to_now',
              params: { client: 'mobile' },
              userData: typedSession?.user
            });
          }}
          sx={{
            position: 'fixed',
            bottom: '5vh',
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
