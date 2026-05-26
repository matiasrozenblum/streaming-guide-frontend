'use client';

import { Box, Typography, Button, Fab } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import dayjs from 'dayjs';
import { TimeHeader } from './TimeHeader';
import CategoryTabs from './CategoryTabs';
import { Channel, Category } from '@/types/channel';
import { Schedule } from '@/types/schedule';
import { ScheduleRow, Program } from './ScheduleRow';
import { NowIndicator } from './NowIndicator';
import { getColorForChannel } from '@/utils/colors';
import { useLayoutValues, DAY_ORDER, DayOfWeek, DAY_WIDTH_PX, WEEK_WIDTH_PX } from '@/constants/layout';
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
  const scrollRafRef = useRef<number | null>(null);
  const today = dayjs().format('dddd').toLowerCase();
  const todayDayIndex = DAY_ORDER.indexOf(today as DayOfWeek);
  const [selectedDay, setSelectedDay] = useState(today);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [visibleDayRange, setVisibleDayRange] = useState<[number, number]>([
    Math.max(0, todayDayIndex - 1),
    Math.min(6, todayDayIndex + 1),
  ]);

  const { channelLabelWidth, pixelsPerMinute } = useLayoutValues();
  const { mode } = useThemeContext();
  const totalGridWidth = WEEK_WIDTH_PX + channelLabelWidth;

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

  // Memoize programs per channel — stable references prevent ScheduleRow re-renders during scroll
  const channelPrograms = useMemo(() => {
    const map = new Map<number, Program[]>();
    for (const s of schedules) {
      const channelId = s.program.channel.id;
      if (!map.has(channelId)) map.set(channelId, []);
      map.get(channelId)!.push({
        id: s.program.id.toString(),
        scheduleId: s.id.toString(),
        name: s.program.name,
        start_time: s.start_time.slice(0, 5),
        end_time: s.end_time.slice(0, 5),
        day_of_week: s.day_of_week,
        subscribed: s.subscribed,
        description: s.program.description || undefined,
        panelists: s.program.panelists?.map(p => ({ id: p.id.toString(), name: p.name })) || undefined,
        logo_url: s.program.logo_url || undefined,
        is_live: s.program.is_live,
        stream_url: s.program.stream_url || undefined,
        isWeeklyOverride: s.isWeeklyOverride,
        overrideType: s.overrideType,
        style_override: s.program.style_override,
      });
    }
    return map;
  }, [schedules]);

  const visibleChannels = useMemo(() =>
    channels.filter(channel => {
      if (selectedCategory) {
        const hasCategory = channel.categories?.some(cat => cat.id === selectedCategory.id);
        if (!hasCategory) return false;
      }
      if (channel.show_only_when_scheduled) {
        return (channelPrograms.get(channel.id)?.length ?? 0) > 0;
      }
      return true;
    }),
    [channels, selectedCategory, channelPrograms]
  );

  // Scroll to the current time in the weekly timeline
  const scrollToNow = useCallback(() => {
    const now = dayjs();
    const minutes = now.hour() * 60 + now.minute();
    const dayIndex = DAY_ORDER.indexOf(today as DayOfWeek);
    const targetLeft = dayIndex * DAY_WIDTH_PX + minutes * pixelsPerMinute - 120;
    scrollRef.current?.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' });
  }, [pixelsPerMinute, today]);

  // Scroll to a specific day preserving the current hour offset
  const scrollToDay = useCallback((dayValue: string) => {
    const container = scrollRef.current;
    if (!container) return;
    const dayIndex = DAY_ORDER.indexOf(dayValue as DayOfWeek);
    if (dayIndex === -1) return;
    const hourOffset = container.scrollLeft % DAY_WIDTH_PX;
    container.scrollTo({ left: dayIndex * DAY_WIDTH_PX + hourOffset, behavior: 'smooth' });
    setSelectedDay(dayValue);
  }, []);

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

  // RAF-throttled scroll handler — only updates state when values actually change
  const handleScroll = useCallback(() => {
    if (scrollRafRef.current !== null) return;
    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = null;
      const container = scrollRef.current;
      if (!container) return;

      const { scrollLeft, clientWidth } = container;

      // Day index at center of visible timeline
      const timelineCenter = scrollLeft + (clientWidth - channelLabelWidth) / 2;
      const centerDayIndex = Math.max(0, Math.min(6, Math.floor(Math.max(0, timelineCenter) / DAY_WIDTH_PX)));
      setSelectedDay(prev => {
        const next = DAY_ORDER[centerDayIndex];
        return prev === next ? prev : next;
      });

      // Visible day range with ±1 buffer for lazy rendering
      const leftDay = Math.max(0, Math.floor(scrollLeft / DAY_WIDTH_PX) - 1);
      const rightDay = Math.min(6, Math.ceil((scrollLeft + clientWidth) / DAY_WIDTH_PX));
      setVisibleDayRange(prev => {
        if (prev[0] === leftDay && prev[1] === rightDay) return prev;
        return [leftDay, rightDay];
      });

      checkNowIndicatorVisibility();
    });
  }, [channelLabelWidth, checkNowIndicatorVisibility]);

  // Scroll to now on mount
  useEffect(() => {
    scrollToNow();
  }, [scrollToNow]);

  // Wire up scroll listener
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    container.addEventListener('scroll', handleScroll, { passive: true });
    checkNowIndicatorVisibility();
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll, checkNowIndicatorVisibility]);

  // Get scrollable container width for footer
  useEffect(() => {
    const updateContainerWidth = () => {
      if (scrollRef.current) setContainerWidth(scrollRef.current.clientWidth);
    };
    updateContainerWidth();
    window.addEventListener('resize', updateContainerWidth);
    return () => window.removeEventListener('resize', updateContainerWidth);
  }, []);

  if (!channels.length || !schedules.length) {
    return (
      <Typography sx={{ mt: 4, color: mode === 'light' ? '#374151' : '#f1f5f9' }}>
        Sin datos disponibles
      </Typography>
    );
  }

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
              scrollToDay(day.value);
              try { Clarity.setTag('selected_day', day.value); Clarity.event('day_change'); } catch { /* Clarity not yet loaded */ }
              gaEvent({
                action: 'day_change',
                params: { day: day.value, client: 'mobile' },
                userData: typedSession?.user,
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
          borderTopLeftRadius: categoriesEnabled ? 0 : '12px',
          borderTopRightRadius: categoriesEnabled ? 0 : '12px',
          borderBottomLeftRadius: '12px',
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
          '&.dragging': { cursor: 'grabbing' },
          '&::-webkit-scrollbar': { width: '8px', height: '8px' },
          '&::-webkit-scrollbar-track': { background: 'transparent', borderRadius: '4px' },
          '&::-webkit-scrollbar-thumb': {
            background: mode === 'light' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)',
            borderRadius: '4px',
            border: '1px solid transparent',
            backgroundClip: 'content-box',
            '&:hover': {
              background: mode === 'light' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.3)',
            },
          },
          '&::-webkit-scrollbar-corner': { background: 'transparent' },
          scrollbarWidth: 'thin',
          scrollbarColor: mode === 'light'
            ? 'rgba(0, 0, 0, 0.2) transparent'
            : 'rgba(255, 255, 255, 0.2) transparent',
        }}
      >
        <Box sx={{ width: `${totalGridWidth}px`, position: 'relative' }}>
          <TimeHeader isMobile={true} />
          <NowIndicator ref={nowIndicatorRef} />
          {visibleChannels.map((channel, idx) => (
            <ScheduleRow
              key={channel.id}
              channelName={channel.name}
              channelLogo={channel.logo_url || undefined}
              channelBackgroundColor={channel.background_color}
              programs={channelPrograms.get(channel.id) ?? []}
              color={getColorForChannel(idx, mode)}
              todayName={today}
              visibleDayRange={visibleDayRange}
            />
          ))}
          {/* Footer at the bottom of grid */}
          {containerWidth > 0 && (
            <Box
              sx={{
                width: `${containerWidth}px`,
                position: 'sticky',
                left: 0,
                mt: 2,
                pb: streamersEnabled
                  ? `calc(${bottomNavHeight}px + env(safe-area-inset-bottom, 0px))`
                  : 0,
                zIndex: 10,
                backgroundColor: mode === 'light' ? 'white' : '#1e293b',
                borderTop: `1px solid ${mode === 'light' ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)'}`,
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <Box sx={{ width: '100%' }}>
                <Footer />
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      {/* Botón flotante */}
      {showScrollButton && (
        <Fab
          aria-label="Ir al horario en vivo"
          variant="extended"
          size="medium"
          onClick={() => {
            scrollToNow();
            try { Clarity.event('live_button_click'); } catch { /* Clarity not yet loaded */ }
            gaEvent({
              action: 'scroll_to_now',
              params: { client: 'mobile' },
              userData: typedSession?.user,
            });
          }}
          sx={{
            position: 'fixed',
            bottom: streamersEnabled
              ? `calc(${bottomNavHeight}px + env(safe-area-inset-bottom, 0px) + 16px)`
              : '5vh',
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
