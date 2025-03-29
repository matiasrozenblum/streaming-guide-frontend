import { Box } from '@mui/material';
import dayjs from 'dayjs';
import { useLayoutValues } from '../constants/layout';

export const NowIndicator = () => {
  const { channelLabelWidth, pixelsPerMinute } = useLayoutValues();
  const now = dayjs();
  const startOfDay = now.startOf('day');
  const minutesFromMidnight = now.diff(startOfDay, 'minute');
  const offsetPx = channelLabelWidth + (minutesFromMidnight * pixelsPerMinute);

  return (
    <Box
      position="absolute"
      top={0}
      left={`${offsetPx}px`}
      sx={{
        width: '2px',
        height: '100%',
        backgroundColor: '#f44336',
        zIndex: 2,
        clipPath: `polygon(0 0, 100% 0, 100% 100%, 0 100%)`,
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