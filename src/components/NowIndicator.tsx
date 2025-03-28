import { Box } from '@mui/material';
import dayjs from 'dayjs';
import { PIXELS_PER_MINUTE, CHANNEL_LABEL_WIDTH } from '../constants/layout';

export const NowIndicator = () => {
  const now = dayjs();
  const hours = now.hour();
  const minutes = now.minute();
  const minutesFromMidnight = (hours * 60) + minutes;
  const offsetPx = CHANNEL_LABEL_WIDTH + (minutesFromMidnight * PIXELS_PER_MINUTE);

  return (
    <Box
      position="absolute"
      top={0}
      left={`${offsetPx}px`}
      sx={{
        width: '2px',
        height: '100%',
        backgroundColor: '#f44336',
        zIndex: 1000,
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: '-4px',
          width: '10px',
          height: '10px',
          backgroundColor: '#f44336',
          borderRadius: '50%',
        },
      }}
    />
  );
};