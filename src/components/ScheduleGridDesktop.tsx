'use client';

import { Box, Typography, Button } from '@mui/material';
import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import dayjs from 'dayjs';
import { TimeHeader } from './TimeHeader';
import { ScheduleRow, Program } from './ScheduleRow';
import { NowIndicator } from './NowIndicator';
import CategoryTabs from './CategoryTabs';
import { Channel, Category } from '@/types/channel';
import { Schedule } from '@/types/schedule';
import { getColorForChannel } from '@/utils/colors';
import { useLayoutValues, DAY_ORDER, DayOfWeek, DAY_WIDTH_PX, WEEK_WIDTH_PX } from '@/constants/layout';
import { useThemeContext } from '@/contexts/ThemeContext';
import { AccessTime } from '@mui/icons-material';
import weekday from 'dayjs/plugin/weekday';
import { useInView } from 'react-intersection-observer';
import { event as gaEvent } from '@/lib/gtag';
import Clarity from '@microsoft/clarity';
import { useSessionContext } from '@/contexts/SessionContext';
import { SessionWithToken } from '@/types/session';
import Footer from './Footer';

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
  const scrollRafRef = useRef<number | null>(null);
  const today = dayjs().format('dddd').toLowerCase();
  const todayDayIndex = DAY_ORDER.indexOf(today as DayOfWeek);
  const [selectedDay, setSelectedDay] = useState(today);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
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

  // IntersectionObserver para el botón 'En vivo'
  const { ref: observerRef, inView } = useInView({ threshold: 0 });
  useEffect(() => {
    if (nowIndicatorRef.current) observerRef(nowIndicatorRef.current);
  }, [observerRef]);

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
    const targetLeft = dayIndex * DAY_WIDTH_PX + minutes * pixelsPerMinute - 240;
    scrollRef.current?.scrollTo({
      left: Math.max(0, targetLeft),
      behavior: 'smooth',
    });
  }, [pixelsPerMinute, today]);

  // Scroll to the start of a specific day, preserving the current hour offset
  const scrollToDay = useCallback((dayValue: string) => {
    const container = scrollRef.current;
    if (!container) return;
    const dayIndex = DAY_ORDER.indexOf(dayValue as DayOfWeek);
    if (dayIndex === -1) return;
    const hourOffset = container.scrollLeft % DAY_WIDTH_PX;
    container.scrollTo({ left: dayIndex * DAY_WIDTH_PX + hourOffset, behavior: 'smooth' });
    setSelectedDay(dayValue);
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
      // Bail out if day hasn't changed — avoids triggering re-renders of all day buttons
      setSelectedDay(prev => {
        const next = DAY_ORDER[centerDayIndex];
        return prev === next ? prev : next;
      });

      // Visible day range with ±1 buffer for lazy rendering
      const leftDay = Math.max(0, Math.floor(scrollLeft / DAY_WIDTH_PX) - 1);
      const rightDay = Math.min(6, Math.ceil((scrollLeft + clientWidth) / DAY_WIDTH_PX));
      // Bail out if range hasn't changed — avoids re-rendering all ScheduleRows
      setVisibleDayRange(prev => {
        if (prev[0] === leftDay && prev[1] === rightDay) return prev;
        return [leftDay, rightDay];
      });
    });
  }, [channelLabelWidth]);

  // Scroll to now on mount
  useEffect(() => {
    scrollToNow();
  }, [scrollToNow]);

  // Wire up scroll listener
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Get scrollable container width for footer
  useEffect(() => {
    const updateContainerWidth = () => {
      if (scrollRef.current) setContainerWidth(scrollRef.current.clientWidth);
    };
    updateContainerWidth();
    window.addEventListener('resize', updateContainerWidth);
    return () => window.removeEventListener('resize', updateContainerWidth);
  }, []);

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
        sx={{ flexShrink: 0, zIndex: 10 }}
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
            onClick={() => {
              scrollToDay(day.value);
              try { Clarity.setTag('selected_day', day.value); Clarity.event('day_change'); } catch { /* Clarity not yet loaded */ }
              gaEvent({
                action: 'day_change',
                params: { day: day.value, client: 'desktop' },
                userData: typedSession?.user,
              });
            }}
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
              try { Clarity.event('live_button_click'); } catch { /* Clarity not yet loaded */ }
              gaEvent({
                action: 'scroll_to_now',
                params: { client: 'desktop' },
                userData: typedSession?.user,
              });
              scrollToNow();
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
          borderTopLeftRadius: categoriesEnabled ? 0 : '12px',
          borderTopRightRadius: categoriesEnabled ? 0 : '12px',
          borderBottomLeftRadius: '12px',
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
          <TimeHeader isMobile={false} />
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
    </Box>
  );
};
