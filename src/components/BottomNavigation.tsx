'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Box, BottomNavigation as MuiBottomNavigation, BottomNavigationAction, useTheme, useMediaQuery } from '@mui/material';
import { Schedule, LiveTv } from '@mui/icons-material';
import { useSessionContext } from '@/contexts/SessionContext';
import type { SessionWithToken } from '@/types/session';
import { event as gaEvent } from '@/lib/gtag';
import { useStreamersConfig } from '@/hooks/useStreamersConfig';

export default function BottomNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  // const { mode } = useThemeContext();
  const { session } = useSessionContext();
  const typedSession = session as SessionWithToken | null;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { streamersEnabled, loading } = useStreamersConfig();

  // Only show on mobile
  if (!isMobile) {
    return null;
  }

  // Don't render while loading config (prevents flash of content)
  if (loading) {
    return null;
  }

  // Hide entire bottom navigation if streamers are disabled (no need for navigation with only 1 section)
  if (!streamersEnabled) {
    return null;
  }

  // Only show on main pages (not on subscriptions, profile, etc.)
  const showOnPage = pathname === '/' || pathname === '/streamers';

  if (!showOnPage) {
    return null;
  }

  const currentValue = pathname === '/streamers' ? 1 : 0;

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    if (newValue === 0) {
      router.push('/');
      gaEvent({
        action: 'navigation_click',
        params: { section: 'canales', location: 'bottom_nav' },
        userData: typedSession?.user
      });
    } else if (newValue === 1) {
      router.push('/streamers');
      gaEvent({
        action: 'navigation_click',
        params: { section: 'streamers', location: 'bottom_nav' },
        userData: typedSession?.user
      });
    }
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        borderTop: '1px solid rgba(255,255,255,0.12)',
        backgroundColor: 'rgba(30,41,59,0.95)',
        backdropFilter: 'blur(8px)',
        // Use safe area insets to avoid overlapping with system navigation bars
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <MuiBottomNavigation
        value={currentValue}
        onChange={handleChange}
        showLabels
        sx={{
          backgroundColor: 'transparent',
          '& .MuiBottomNavigationAction-root': {
            color: 'rgba(255,255,255,0.6)',
            '&.Mui-selected': {
              color: '#42a5f5',
            },
            '& .MuiBottomNavigationAction-label': {
              textTransform: 'uppercase',
              fontFamily: '"Outfit", sans-serif',
              fontWeight: 600,
            },
          },
        }}
      >
        <BottomNavigationAction
          label="Canales"
          icon={<Schedule />}
        />
        <BottomNavigationAction
          label="Streamers"
          icon={<LiveTv />}
        />
      </MuiBottomNavigation>
    </Box>
  );
}

