import { useMediaQuery, useTheme } from '@mui/material';

export const PIXELS_PER_MINUTE = 2;
export const TIME_HEADER_HEIGHT = 40;
export const ROW_HEIGHT = {
  mobile: 60,
  desktop: 80,
};

export const CHANNEL_LABEL_WIDTH = {
  mobile: 122,
  desktop: 150,
};

export const DAY_ORDER = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
] as const;
export type DayOfWeek = typeof DAY_ORDER[number];

export const DAY_WIDTH_PX = PIXELS_PER_MINUTE * 60 * 24;                          // 2880
export const OVERFLOW_HOURS = 4;
export const OVERFLOW_MINUTES = OVERFLOW_HOURS * 60;                               // 240
export const OVERFLOW_WIDTH_PX = PIXELS_PER_MINUTE * OVERFLOW_MINUTES;            // 480
export const DAY_WITH_OVERFLOW_WIDTH_PX = PIXELS_PER_MINUTE * 60 * (24 + OVERFLOW_HOURS); // 3360

// Custom hook to get layout values based on screen size
export const useLayoutValues = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return {
    channelLabelWidth: isMobile ? CHANNEL_LABEL_WIDTH.mobile : CHANNEL_LABEL_WIDTH.desktop,
    rowHeight: isMobile ? ROW_HEIGHT.mobile : ROW_HEIGHT.desktop,
    pixelsPerMinute: PIXELS_PER_MINUTE,
    timeHeaderHeight: TIME_HEADER_HEIGHT,
  };
};