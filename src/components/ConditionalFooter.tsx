'use client';

import { Box } from '@mui/material';
import { usePathname } from 'next/navigation';
import Footer from './Footer';
import {
  BOTTOM_NAV_PATHS,
  useBottomNavHeight,
} from './BottomNavigation';

export default function ConditionalFooter() {
  const pathname = usePathname();
  // Hide footer on home page - it will be shown inside the grid scrollable area
  const isHomePage = pathname === '/';

  /**
   * The bottom bar is fixed, so it sits over whatever reaches the end of the
   * page — and the footer is the last thing there, which left its links half
   * covered. The grid pads its own copy of the footer for exactly this; the
   * pages that get the shared one had nothing. Zero wherever the bar does not
   * show, so no other page gains a gap at its foot.
   */
  const bottomNavHeight = useBottomNavHeight();
  const clearance = BOTTOM_NAV_PATHS.includes(pathname) ? bottomNavHeight : 0;

  if (isHomePage) {
    return null;
  }

  return (
    <Box
      sx={{
        flexShrink: 0,
        // Same surface as the footer, so the reserved strip reads as part of
        // it rather than as a band of page showing through.
        backgroundColor: 'background.paper',
        pb: clearance
          ? `calc(${clearance}px + env(safe-area-inset-bottom, 0px))`
          : 0,
      }}
    >
      <Footer />
    </Box>
  );
}
