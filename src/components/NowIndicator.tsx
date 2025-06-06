import { Box } from '@mui/material';
import dayjs from 'dayjs';
import { useLayoutValues } from '../constants/layout';
import { forwardRef, useEffect, useState } from 'react';

interface Props {
  isModalOpen?: boolean;
}

export const NowIndicator = forwardRef<HTMLDivElement, Props>(({ isModalOpen }, ref) => {
  const { channelLabelWidth, pixelsPerMinute } = useLayoutValues();
  const [minutesFromMidnight, setMinutesFromMidnight] = useState(() => {
    const now = dayjs();
    return now.diff(now.startOf('day'), 'minute');
  });

  useEffect(() => {
    if (!isModalOpen) {
      const updatePosition = () => {
        const now = dayjs();
        setMinutesFromMidnight(now.diff(now.startOf('day'), 'minute'));
      };

      // Update every minute
      const intervalId = setInterval(updatePosition, 60000);
      return () => clearInterval(intervalId);
    }
  }, [isModalOpen]);

  const offsetPx = channelLabelWidth + (minutesFromMidnight * pixelsPerMinute);

  return (
    <Box
      ref={ref}
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
});

NowIndicator.displayName = 'NowIndicator';