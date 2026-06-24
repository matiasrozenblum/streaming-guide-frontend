'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Box,
  Container,
} from '@mui/material';
import dynamic from 'next/dynamic';

import { api } from '@/services/api';
import { bannersApi } from '@/services/banners';
import { useLiveStatus } from '@/contexts/LiveStatusContext';
import { useThemeContext } from '@/contexts/ThemeContext';
import { useYouTubePlayer } from '@/contexts/YouTubeGlobalPlayerContext';
import { ScheduleGrid } from '@/components/ScheduleGrid';
import { SkeletonScheduleGrid } from '@/components/SkeletonScheduleGrid';
import BannerCarousel from '@/components/BannerCarousel';
import type { ChannelWithSchedules, Category } from '@/types/channel';
import type { Schedule } from '@/types/schedule';
import type { Banner } from '@/types/banner';
import type { ZapItem } from '@/types/zap';
import Header from './Header';
import BottomNavigation from './BottomNavigation';
import { useDeviceId } from '@/hooks/useDeviceId';
import { event as gaEvent } from '@/lib/gtag';
import { useSessionContext } from '@/contexts/SessionContext';
import type { SessionWithToken } from '@/types/session';
import { isBeforeInBuenosAires, getNextMondayDate } from '@/utils/date';
import { parseStreamUrl } from '@/utils/parseStreamUrl';
import dayjs from 'dayjs';


const HolidayDialog = dynamic(() => import('@/components/HolidayDialog'), { ssr: false });
const SeasonalDialog = dynamic(() => import('@/components/SeasonalDialog'), { ssr: false });

interface HomeClientProps {
  initialData: {
    holiday: boolean;
    todaySchedules: ChannelWithSchedules[];
    weekSchedules: ChannelWithSchedules[];
    categories: Category[];
    categoriesEnabled: boolean;
    streamersEnabled: boolean;
    banners: Banner[];
    nextWeekMondaySchedules: Schedule[];
  };
}

export default function HomeClient({ initialData }: HomeClientProps) {
  const deviceId = useDeviceId();
  const { session } = useSessionContext();
  const typedSession = session as SessionWithToken | null;
  const streamersEnabled = initialData.streamersEnabled;
  const isSeasonActive = isBeforeInBuenosAires('2026-01-02');

  const [channelsWithSchedules, setChannelsWithSchedules] = useState(
    Array.isArray(initialData.weekSchedules) ? initialData.weekSchedules : []
  );
  const [nextWeekMondaySchedules, setNextWeekMondaySchedules] = useState<Schedule[]>(
    initialData.nextWeekMondaySchedules ?? []
  );
  const [showHoliday, setShowHoliday] = useState(initialData.holiday);
  const [showSeasonal, setShowSeasonal] = useState(isSeasonActive);
  const [banners, setBanners] = useState<Banner[]>(initialData.banners || []);
  const bannerContainerRef = useRef<HTMLDivElement>(null);
  const bannerOuterRef = useRef<HTMLDivElement>(null);
  const bannerOffsetRef = useRef(0);

  const { mode } = useThemeContext();
  const { setLiveStatuses, liveStatus } = useLiveStatus();
  const { setZapList } = useYouTubePlayer();

  // Populate live status context with initial data synchronously
  const initialLiveMap = useMemo(() => {
    const map: Record<string, { is_live: boolean; stream_url: string | null }> = {};
    if (initialData.weekSchedules.length > 0) {
      initialData.weekSchedules.forEach(ch =>
        ch.schedules.forEach(sch => {
          map[sch.id.toString()] = {
            is_live: sch.program.is_live,
            stream_url: sch.program.stream_url,
          };
          // Secondary index by programId so non-ART users can find the live stream URL
          // even when the displayed schedule belongs to a different ART day.
          if (sch.program.is_live && sch.program.stream_url) {
            map[`p:${sch.program.id}`] = { is_live: true, stream_url: sch.program.stream_url };
          }
        })
      );
    }
    return map;
  }, [initialData.weekSchedules]);

  // Keep html background in sync with theme so overscroll bounce area matches
  useEffect(() => {
    document.documentElement.style.backgroundColor =
      mode === 'dark' ? '#0f172a' : '#f8fafc';
  }, [mode]);

  // Set initial live statuses immediately
  useEffect(() => {
    setLiveStatuses(initialLiveMap);
  }, [setLiveStatuses, initialLiveMap]);

  // Sync next-week Monday schedules when router.refresh() brings new server props (e.g. after override SSE)
  useEffect(() => {
    setNextWeekMondaySchedules(initialData.nextWeekMondaySchedules ?? []);
  }, [initialData.nextWeekMondaySchedules]);

  // Banners are now loaded server-side, but we can refresh them periodically if needed
  // Only fetch if streamers are enabled and we don't have banners yet (fallback)
  useEffect(() => {
    if (!streamersEnabled || banners.length > 0) {
      return;
    }

    // Fallback: fetch banners client-side if they weren't loaded server-side
    const fetchBanners = async () => {
      try {
        const activeBanners = await bannersApi.getActiveBanners();
        setBanners(activeBanners);
      } catch (error) {
        console.warn('Error fetching banners:', error);
      }
    };

    fetchBanners();
  }, [streamersEnabled, banners.length]);

  // Two-phase scroll: banner slides off first, then grid scrolls.
  // Fully DOM-driven (no React re-renders in the hot path).
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return; // ignore horizontal

      const scheduleGrid = document.querySelector('[data-schedule-grid]') as HTMLElement;
      if (!scheduleGrid) return;

      const inner = bannerContainerRef.current;
      const bannerH = inner?.offsetHeight ?? 0;
      const currentOffset = bannerOffsetRef.current;
      const insideGrid = scheduleGrid.contains(e.target as HTMLElement);

      if (e.deltaY > 0) {
        // ── Scrolling down ──
        if (currentOffset < bannerH) {
          // Phase 1: consume delta for banner; block grid scroll
          e.preventDefault();
          const newOffset = Math.min(currentOffset + e.deltaY, bannerH);
          bannerOffsetRef.current = newOffset;
          if (inner) {
            inner.style.transform = `translateY(-${newOffset}px)`;
            inner.style.marginBottom = `-${newOffset}px`;
          }
        } else if (!insideGrid) {
          // Phase 2: banner gone, forward to grid
          e.preventDefault();
          scheduleGrid.scrollTop += e.deltaY;
        }
        // else: insideGrid + banner gone → native scroll handles it
      } else {
        // ── Scrolling up ──
        if (scheduleGrid.scrollTop > 0) {
          // Grid still scrolled — let it scroll up first
          if (!insideGrid) {
            e.preventDefault();
            scheduleGrid.scrollTop += e.deltaY;
          }
        } else if (currentOffset > 0) {
          // Grid at top — restore banner
          e.preventDefault();
          const newOffset = Math.max(currentOffset + e.deltaY, 0);
          bannerOffsetRef.current = newOffset;
          if (inner) {
            inner.style.transform = `translateY(-${newOffset}px)`;
            inner.style.marginBottom = `-${newOffset}px`;
          }
        }
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  // Derive flat lists for grid
  const channels = useMemo(
    () => channelsWithSchedules.map(c => ({
      ...c.channel,
    })),
    [channelsWithSchedules]
  );
  const flattened = useMemo(
    () => channelsWithSchedules.flatMap(c =>
      c.schedules.map(s => ({ ...s, program: { ...s.program, channel: c.channel } }))
    ),
    [channelsWithSchedules]
  );

  const showSkeleton = flattened.length === 0;

  // Build the channel list used by the zapping feature in the player
  const zapList = useMemo((): ZapItem[] => {
    const today = dayjs().format('dddd').toLowerCase();

    return channelsWithSchedules.map(cws => {
      const { channel, schedules } = cws;

      let videoUrl: string | null = null;
      let isLive = false;
      let programName: string | null = null;

      // Prefer a currently-live program from today's schedules
      const todaySchedules = schedules.filter(s => s.day_of_week === today);
      for (const s of todaySchedules) {
        const liveData = liveStatus[s.id.toString()];
        const streamUrl = liveData?.stream_url || s.program.stream_url;
        const live = liveData?.is_live ?? s.program.is_live;
        if (streamUrl && live) {
          videoUrl = streamUrl;
          isLive = true;
          programName = s.program.name;
          break;
        }
      }

      // Fall back to any schedule that has a stream URL
      if (!videoUrl) {
        for (const s of schedules) {
          if (s.program.stream_url) {
            videoUrl = s.program.stream_url;
            break;
          }
        }
      }

      const service = videoUrl ? (parseStreamUrl(videoUrl)?.service ?? null) : null;

      return {
        id: channel.id,
        name: channel.name,
        logoUrl: channel.logo_url,
        backgroundColor: channel.background_color,
        videoUrl,
        service,
        isLive,
        programName,
      };
    });
  }, [channelsWithSchedules, liveStatus]);

  useEffect(() => {
    setZapList(zapList);
    return () => setZapList([]);
  }, [zapList, setZapList]);

  useEffect(() => {
    if (!deviceId) return; // Only wait for deviceId

    let isMounted = true;

    const updateLiveStatuses = async () => {
      const currentDeviceId = deviceId;
      try {
        const params: { live_status: boolean; deviceId?: string } = { live_status: true }; // Re-enabled with optimized backend
        if (currentDeviceId) {
          params.deviceId = currentDeviceId;
        }

        const resp = await api.get<ChannelWithSchedules[]>('/channels/with-schedules/week', {
          params
        });
        if (!isMounted) return;

        const weekData = resp.data;
        const liveMap: Record<string, { is_live: boolean; stream_url: string | null }> = {};
        weekData.forEach(ch =>
          ch.schedules.forEach(sch => {
            liveMap[sch.id.toString()] = {
              is_live: sch.program.is_live,
              stream_url: sch.program.stream_url,
            };
            if (sch.program.is_live && sch.program.stream_url) {
              liveMap[`p:${sch.program.id}`] = { is_live: true, stream_url: sch.program.stream_url };
            }
          })
        );

        setLiveStatuses(liveMap);
        setChannelsWithSchedules(Array.isArray(weekData) ? weekData : []);

        // Also refresh next-week Monday schedules for Sunday overflow
        try {
          const nextMonday = getNextMondayDate();
          const nextWeekResp = await api.get<ChannelWithSchedules[]>('/channels/with-schedules/week', {
            params: { weekStart: nextMonday }
          });
          if (isMounted && Array.isArray(nextWeekResp.data)) {
            setNextWeekMondaySchedules(
              nextWeekResp.data.flatMap(c =>
                c.schedules
                  .filter(s => s.day_of_week === 'monday')
                  .map(s => ({ ...s, program: { ...s.program, channel: c.channel } }))
              )
            );
          }
        } catch {
          // ignore
        }
      } catch {
        // ignore
      }
    };

    // Initial load
    updateLiveStatuses();

    // Reduced from 60 seconds to 5 minutes to optimize YouTube API usage
    // Backend cron (every 2 min) keeps cache fresh, so 5 min frontend polling is sufficient
    const intervalId = setInterval(() => {
      updateLiveStatuses();
    }, 300_000); // 5 minutes (was 60 seconds - 92% reduction in API calls)

    // Listen for live status refresh events from SSE for real-time updates
    const handleLiveStatusRefresh = () => {
      updateLiveStatuses();
    };

    window.addEventListener('liveStatusRefresh', handleLiveStatusRefresh);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      window.removeEventListener('liveStatusRefresh', handleLiveStatusRefresh);
    };
  }, [deviceId, setLiveStatuses]);

  useEffect(() => {
    if (flattened.length > 0) {
      gaEvent({
        action: 'home_page_visit',
        params: {
          has_schedules: flattened.length > 0,
          channel_count: channels.length,
          schedule_count: flattened.length,
        },
        userData: typedSession?.user
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {showSeasonal && <SeasonalDialog open onClose={() => setShowSeasonal(false)} />}
      {!isSeasonActive && showHoliday && <HolidayDialog open onClose={() => setShowHoliday(false)} />}

      <Box
        sx={{
          height: '100%',
          maxWidth: '100vw',
          background:
            mode === 'light'
              ? 'linear-gradient(135deg,#f8fafc 0%,#e2e8f0 100%)'
              : 'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          py: { xs: 1, sm: 2 },
        }}
      >
        <Header streamersEnabled={streamersEnabled} />

        <Container
          maxWidth={false}
          disableGutters
          sx={{
            px: 0,
            mx: { xs: 0, sm: 2 }, // 16px margin on each side (matches production)
            maxWidth: {
              xs: '100%',
              sm: 'min(1920px, calc(100vw - 32px))' // Max 1920px, but account for 16px margins on each side
            },
            width: {
              xs: '100%',
              sm: 'calc(100% - 32px)' // Subtract margins to prevent overflow
            },
            boxSizing: 'border-box',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0
          }}
        >
          {/* Banner Carousel - slides off the top naturally as the grid scrolls (DOM-driven, no React re-render) */}
          {streamersEnabled && banners.length > 0 && (
            <Box ref={bannerOuterRef} sx={{ overflow: 'hidden' }}>
              <Box
                ref={bannerContainerRef}
                sx={{
                  position: 'relative',
                  pb: { xs: 1, sm: 0 },
                  pt: { md: 2, lg: 2 },
                  willChange: 'transform',
                }}
              >
                <BannerCarousel banners={banners} />
              </Box>
            </Box>
          )}

          <Box
            sx={{
              position: 'relative',
              flex: 1,
              minHeight: 0,
              backdropFilter: 'blur(8px)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {showSkeleton ? <SkeletonScheduleGrid rowCount={10} /> : <ScheduleGrid channels={channels} schedules={flattened} categories={initialData.categories} categoriesEnabled={initialData.categoriesEnabled} nextWeekMondaySchedules={nextWeekMondaySchedules} />}
          </Box>
        </Container>
        <BottomNavigation />
      </Box>
    </>
  );
}
