'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Box, BottomNavigation as MuiBottomNavigation, BottomNavigationAction, useTheme, useMediaQuery } from '@mui/material';
import { Schedule, LiveTv } from '@mui/icons-material';
import { useThemeContext } from '@/contexts/ThemeContext';
import { useSessionContext } from '@/contexts/SessionContext';
import type { SessionWithToken } from '@/types/session';
import { event as gaEvent } from '@/lib/gtag';

export default function BottomNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { mode } = useThemeContext();
  const { session } = useSessionContext();
  const typedSession = session as SessionWithToken | null;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Only show on mobile and on main pages (not on subscriptions, profile, etc.)
  const showOnPage = pathname === '/' || pathname === '/streamers';
  
  if (!isMobile || !showOnPage) {
    return null;
  }

  const currentValue = pathname === '/streamers' ? 1 : 0;

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    if (newValue === 0) {
      router.push('/');
      gaEvent({
        action: 'navigation_click',
        params: { section: 'programacion', location: 'bottom_nav' },
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
        borderTop: `1px solid ${mode === 'light' ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)'}`,
        backgroundColor: mode === 'light' 
          ? 'rgba(255,255,255,0.95)' 
          : 'rgba(30,41,59,0.95)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <MuiBottomNavigation
        value={currentValue}
        onChange={handleChange}
        showLabels
        sx={{
          backgroundColor: 'transparent',
          '& .MuiBottomNavigationAction-root': {
            color: mode === 'light' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)',
            '&.Mui-selected': {
              color: mode === 'light' ? '#1976d2' : '#42a5f5',
            },
          },
        }}
      >
        <BottomNavigationAction
          label="Programación"
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

