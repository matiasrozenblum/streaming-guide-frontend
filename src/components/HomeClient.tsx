'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Container,
} from '@mui/material';
import dynamic from 'next/dynamic';

import { api } from '@/services/api';
import { bannersApi } from '@/services/banners';
import { useLiveStatus } from '@/contexts/LiveStatusContext';
import { useThemeContext } from '@/contexts/ThemeContext';
import { ScheduleGrid } from '@/components/ScheduleGrid';
import { SkeletonScheduleGrid } from '@/components/SkeletonScheduleGrid';
import BannerCarousel from '@/components/BannerCarousel';
import type { ChannelWithSchedules, Category } from '@/types/channel';
import type { Banner } from '@/types/banner';
import Header from './Header';
import BottomNavigation from './BottomNavigation';
import { useDeviceId } from '@/hooks/useDeviceId';
import { event as gaEvent } from '@/lib/gtag';
import { useSessionContext } from '@/contexts/SessionContext';
import type { SessionWithToken } from '@/types/session';


const HolidayDialog = dynamic(() => import('@/components/HolidayDialog'), { ssr: false });

interface HomeClientProps {
  initialData: {
    holiday: boolean;
    todaySchedules: ChannelWithSchedules[];
    weekSchedules: ChannelWithSchedules[];
    categories: Category[];
    categoriesEnabled: boolean;
    streamersEnabled: boolean;
  };
}

export default function HomeClient({ initialData }: HomeClientProps) {
  const deviceId = useDeviceId();
  const { session } = useSessionContext();
  const typedSession = session as SessionWithToken | null;
  const streamersEnabled = initialData.streamersEnabled;
  
  const [channelsWithSchedules, setChannelsWithSchedules] = useState(
    Array.isArray(initialData.weekSchedules) ? initialData.weekSchedules : []
  );
  const [showHoliday, setShowHoliday] = useState(initialData.holiday);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [bannersLoading, setBannersLoading] = useState(true);
  const [bannerVisible, setBannerVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const { mode } = useThemeContext();
  const { setLiveStatuses } = useLiveStatus();

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
        })
      );
    }
    return map;
  }, [initialData.weekSchedules]);
  
  // Set initial live statuses immediately
  useEffect(() => {
    setLiveStatuses(initialLiveMap);
  }, [setLiveStatuses, initialLiveMap]);

  // Fetch banners when streamers are enabled
  useEffect(() => {
    const fetchBanners = async () => {
      if (!streamersEnabled) {
        setBanners([]);
        setBannersLoading(false);
        return;
      }

      try {
        const activeBanners = await bannersApi.getActiveBanners();
        setBanners(activeBanners);
      } catch (error) {
        console.warn('Error fetching banners:', error);
        setBanners([]);
      } finally {
        setBannersLoading(false);
      }
    };

    fetchBanners();
  }, [streamersEnabled]);

  // Grid scroll detection for banner hide/show - simplified
  useEffect(() => {
    const handleGridScroll = () => {
      const scheduleGrid = document.querySelector('[data-schedule-grid]') as HTMLElement;
      if (!scheduleGrid) return;
      
      const currentScrollY = scheduleGrid.scrollTop;
      
      if (currentScrollY < 10) {
        // Show banner when at the very top
        setBannerVisible(true);
      } else {
        // Hide banner on any scroll
        setBannerVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    // Find and attach listener to schedule grid
    const scheduleGrid = document.querySelector('[data-schedule-grid]');
    if (scheduleGrid) {
      scheduleGrid.addEventListener('scroll', handleGridScroll, { passive: true });
      
      // Cleanup
      return () => scheduleGrid.removeEventListener('scroll', handleGridScroll);
    }
  }, [lastScrollY]);

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
          })
        );

        setLiveStatuses(liveMap);
        setChannelsWithSchedules(Array.isArray(weekData) ? weekData : []);
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
      {showHoliday && <HolidayDialog open onClose={() => setShowHoliday(false)} />}

      <Box
        sx={{
          minHeight: '100dvh',
          maxWidth: '100vw',
          background:
            mode === 'light'
              ? 'linear-gradient(135deg,#f8fafc 0%,#e2e8f0 100%)'
              : 'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)',
          py: { xs: 1, sm: 2 },
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Header streamersEnabled={streamersEnabled} />

        <Container maxWidth="xl" disableGutters sx={{ px: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* CSS Keyframes for banner and grid animations */}
          <Box
            component="style"
            dangerouslySetInnerHTML={{
              __html: `
                @keyframes bannerHide {
                  from {
                    transform: scaleY(1);
                    opacity: 1;
                    max-height: 200px;
                  }
                  to {
                    transform: scaleY(0);
                    opacity: 0;
                    max-height: 0;
                  }
                }
                @keyframes bannerShow {
                  from {
                    transform: scaleY(0);
                    opacity: 0;
                    max-height: 0;
                  }
                  to {
                    transform: scaleY(1);
                    opacity: 1;
                    max-height: 200px;
                  }
                }
                @keyframes gridMoveUp {
                  from {
                    margin-top: 0;
                  }
                  to {
                    margin-top: -200px;
                  }
                }
                @keyframes gridMoveDown {
                  from {
                    margin-top: -200px;
                  }
                  to {
                    margin-top: 0;
                  }
                }
                @media (max-width: 600px) {
                  @keyframes bannerHide {
                    from {
                      transform: scaleY(1);
                      opacity: 1;
                      max-height: 132px;
                    }
                    to {
                      transform: scaleY(0);
                      opacity: 0;
                      max-height: 0;
                    }
                  }
                  @keyframes bannerShow {
                    from {
                      transform: scaleY(0);
                      opacity: 0;
                      max-height: 0;
                    }
                    to {
                      transform: scaleY(1);
                      opacity: 1;
                      max-height: 132px;
                    }
                  }
                  @keyframes gridMoveUp {
                    from {
                      margin-top: 0;
                    }
                    to {
                      margin-top: -132px;
                    }
                  }
                  @keyframes gridMoveDown {
                    from {
                      margin-top: -132px;
                    }
                    to {
                      margin-top: 0;
                    }
                  }
                }
              `,
            }}
          />

          {/* Banner Carousel - Always render when enabled, animate with keyframes */}
          {streamersEnabled && !bannersLoading && banners.length > 0 && (
            <Box
              sx={{
                position: 'relative',
                pb: { xs: 1.5, sm: 0 }, // 12px bottom padding for mobile only
                overflow: 'hidden',
                transformOrigin: 'top',
                animation: bannerVisible
                  ? 'bannerShow 0.3s ease-in-out forwards'
                  : 'bannerHide 0.3s ease-in-out forwards',
                maxHeight: bannerVisible ? { xs: '132px', sm: '200px' } : '0',
              }}
            >
              <BannerCarousel banners={banners} />
            </Box>
          )}

          <Box
            sx={{
              position: 'relative',
              flex: 1,
              backdropFilter: 'blur(8px)',
              animation: bannerVisible
                ? 'gridMoveDown 0.3s ease-in-out forwards'
                : 'gridMoveUp 0.3s ease-in-out forwards',
            }}
          >
            {showSkeleton ? <SkeletonScheduleGrid rowCount={10} /> : <ScheduleGrid channels={channels} schedules={flattened} categories={initialData.categories} categoriesEnabled={initialData.categoriesEnabled} />}
          </Box>
        </Container>
        <BottomNavigation />
      </Box>
    </>
  );
}
