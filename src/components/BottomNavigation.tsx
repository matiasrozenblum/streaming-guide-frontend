'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Box, BottomNavigation as MuiBottomNavigation, BottomNavigationAction, useTheme, useMediaQuery } from '@mui/material';
import { Schedule, LiveTv, AutoAwesome } from '@mui/icons-material';
import { useSessionContext } from '@/contexts/SessionContext';
import type { SessionWithToken } from '@/types/session';
import { event as gaEvent } from '@/lib/gtag';
import { useStreamersConfig } from '@/hooks/useStreamersConfig';

/** The height the bar occupies, for pages that have to keep clear of it. */
export const BOTTOM_NAV_HEIGHT = 56;

interface NavItem {
  path: string;
  label: string;
  /** What the analytics event calls this section. */
  section: string;
  icon: React.ReactNode;
}

const ITEMS: NavItem[] = [
  { path: '/', label: 'Canales', section: 'canales', icon: <Schedule /> },
  { path: '/streamers', label: 'Streamers', section: 'streamers', icon: <LiveTv /> },
  { path: '/mi-resumen', label: 'Mi resumen', section: 'mi_resumen', icon: <AutoAwesome /> },
];

/**
 * How much room the bar takes, or 0 when it is not showing — for pages that
 * size their content against the space they actually have.
 */
export function useBottomNavHeight(): number {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { streamersEnabled, loading } = useStreamersConfig();
  if (!isMobile || loading || !streamersEnabled) return 0;
  return BOTTOM_NAV_HEIGHT;
}

export default function BottomNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { session } = useSessionContext();
  const typedSession = session as SessionWithToken | null;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { streamersEnabled, loading } = useStreamersConfig();
  const isAuth =
    typedSession?.user.role === 'user' || typedSession?.user.role === 'admin';

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

  // "Mi resumen" is about the signed-in user, and the page sends a visitor
  // straight back to the grid — the same rule the header follows.
  const items = ITEMS.filter((item) => item.path !== '/mi-resumen' || isAuth);

  // Only show on the main pages (not on subscriptions, profile, etc.)
  const currentValue = items.findIndex((item) => item.path === pathname);
  if (currentValue === -1) {
    return null;
  }

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    const item = items[newValue];
    if (!item) return;
    router.push(item.path);
    gaEvent({
      action: 'navigation_click',
      params: { section: item.section, location: 'bottom_nav' },
      userData: typedSession?.user
    });
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
          height: `${BOTTOM_NAV_HEIGHT}px`,
          '& .MuiBottomNavigationAction-root': {
            color: 'rgba(255,255,255,0.6)',
            // Three labels have to fit on a 320px screen without wrapping.
            minWidth: 0,
            px: '6px',
            '&.Mui-selected': {
              color: '#42a5f5',
            },
            '& .MuiBottomNavigationAction-label': {
              textTransform: 'uppercase',
              fontFamily: '"Outfit", sans-serif',
              fontWeight: 600,
              whiteSpace: 'nowrap',
            },
          },
        }}
      >
        {items.map((item) => (
          <BottomNavigationAction
            key={item.path}
            label={item.label}
            icon={item.icon}
          />
        ))}
      </MuiBottomNavigation>
    </Box>
  );
}
