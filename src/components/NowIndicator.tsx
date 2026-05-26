import { Box } from '@mui/material';
import dayjs from 'dayjs';
import { useLayoutValues, DAY_ORDER, DayOfWeek } from '../constants/layout';
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
  const todayName = dayjs().format('dddd').toLowerCase();

  useEffect(() => {
    if (!isModalOpen) {
      const updatePosition = () => {
        const now = dayjs();
        setMinutesFromMidnight(now.diff(now.startOf('day'), 'minute'));
      };
      const intervalId = setInterval(updatePosition, 60000);
      return () => clearInterval(intervalId);
    }
  }, [isModalOpen]);

  const dayIndex = DAY_ORDER.indexOf(todayName as DayOfWeek);
  const absoluteMinutes = (dayIndex >= 0 ? dayIndex : 0) * 1440 + minutesFromMidnight;
  const offsetPx = channelLabelWidth + absoluteMinutes * pixelsPerMinute;

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
