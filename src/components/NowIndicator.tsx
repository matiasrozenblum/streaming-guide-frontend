import { Box } from '@mui/material';
import dayjs from 'dayjs';
import { useLayoutValues } from '../constants/layout';
import { getARTMinutesFromMidnight } from '@/utils/timezone';
import { forwardRef, useEffect, useState } from 'react';

interface Props {
  isModalOpen?: boolean;
  /** When non-zero (ARG display mode), position the indicator at ART time instead of local time. */
  localToARTOffsetMinutes?: number;
}

export const NowIndicator = forwardRef<HTMLDivElement, Props>(
  ({ isModalOpen, localToARTOffsetMinutes = 0 }, ref) => {
    const { channelLabelWidth, pixelsPerMinute } = useLayoutValues();

    const computeMinutes = () => {
      if (localToARTOffsetMinutes !== 0) return getARTMinutesFromMidnight();
      const now = dayjs();
      return now.diff(now.startOf('day'), 'minute');
    };

    const [minutesFromMidnight, setMinutesFromMidnight] = useState(computeMinutes);

    useEffect(() => {
      setMinutesFromMidnight(computeMinutes());
      if (!isModalOpen) {
        const intervalId = setInterval(() => {
          setMinutesFromMidnight(computeMinutes());
        }, 60000);
        return () => clearInterval(intervalId);
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isModalOpen, localToARTOffsetMinutes]);

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
  }
);

NowIndicator.displayName = 'NowIndicator';
