import { useMediaQuery, useTheme } from '@mui/material';

export const PIXELS_PER_MINUTE = 2;
export const TIME_HEADER_HEIGHT = 50;
export const ROW_HEIGHT = {
  mobile: 80,
  desktop: 100,
};

export const CHANNEL_LABEL_WIDTH = {
  mobile: 160,
  desktop: 193,
};

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