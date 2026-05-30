'use client';

import { Box, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { useLayoutValues, DAY_WITH_OVERFLOW_WIDTH_PX, DAY_WIDTH_PX, OVERFLOW_WIDTH_PX } from '../constants/layout';
import { useThemeContext } from '@/contexts/ThemeContext';
import { useEffect, useState } from 'react';
import { tokens } from '@/design-system/tokens';

const allHours = Array.from({ length: 28 }, (_, i) => i);

interface Props {
  isModalOpen?: boolean;
  isMobile?: boolean;
}

export const TimeHeader = ({ isModalOpen, isMobile }: Props) => {
  const { channelLabelWidth, timeHeaderHeight, pixelsPerMinute } = useLayoutValues();
  const { mode, theme } = useThemeContext();
  const [currentHour, setCurrentHour] = useState(dayjs().hour());
  const totalWidth = DAY_WITH_OVERFLOW_WIDTH_PX + channelLabelWidth;

  useEffect(() => {
    if (!isModalOpen) {
      const updateCurrentHour = () => {
        const newHour = dayjs().hour();
        setCurrentHour(newHour);
      };

      const intervalId = setInterval(updateCurrentHour, 60000);
      return () => clearInterval(intervalId);
    }
  }, [currentHour, isModalOpen]);

  return (
    <Box
      display="flex"
      width={`${totalWidth}px`}
      borderBottom={`1px solid ${mode === 'light' ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)'}`}
      height={`${timeHeaderHeight}px`}
      bgcolor={mode === 'light' ? 'white' : '#1e293b'}
      position="sticky"
      zIndex={1000}
      sx={{
        boxShadow: mode === 'light'
          ? '0 1px 2px rgba(0,0,0,0.05)'
          : '0 1px 2px rgba(0,0,0,0.2)',
        position: 'sticky',
        top: isMobile ? -1 : 0,
        zIndex: 1000,
      }}
    >
      <Box
        width={`${channelLabelWidth}px`}
        minWidth={`${channelLabelWidth}px`}
        borderRight={`1px solid ${mode === 'light' ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)'}`}
        bgcolor={mode === 'light' ? 'white' : '#1e293b'}
        position="sticky"
        left={0}
        zIndex={2}
        p={2}
        sx={{
          width: `${channelLabelWidth}px`,
          minWidth: `${channelLabelWidth}px`,
          maxWidth: `${channelLabelWidth}px`,
          borderRight: `1px solid ${mode === 'light' ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)'}`,
          bgcolor: mode === 'light' ? 'white' : '#1e293b',
          position: 'sticky',
          left: 0,
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: mode === 'light'
            ? '1px 0 2px rgba(0,0,0,0.05)'
            : '1px 0 2px rgba(0,0,0,0.2)',
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: mode === 'light' ? '#64748b' : '#94a3b8',
            fontWeight: 500,
            fontSize: tokens.typography.fontSize.sm,
          }}
        >
          Canal
        </Typography>
      </Box>

      <Box
        display="flex"
        width={`${DAY_WITH_OVERFLOW_WIDTH_PX}px`}
        position="relative"
      >
        {allHours.map((hour) => {
          const isOverflow = hour >= 24;
          const displayHour = isOverflow ? hour - 24 : hour;
          const hourTime = dayjs().startOf('day').add(displayHour, 'hour');
          const isPast = !isOverflow && hour < currentHour;
          const isDimmed = isPast || isOverflow;

          return (
            <Box
              key={hour}
              sx={{
                width: `${pixelsPerMinute * 60}px`,
                minWidth: `${pixelsPerMinute * 60}px`,
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: isDimmed ? 0.5 : 1,
                transition: 'opacity 0.2s ease',
                position: 'relative',
                backgroundColor: isOverflow
                  ? mode === 'dark'
                    ? 'rgba(255,255,255,0.04)'
                    : 'rgba(0,0,0,0.04)'
                  : undefined,
                '&:not(:last-child)::after': {
                  content: '""',
                  position: 'absolute',
                  right: 0,
                  top: 0,
                  bottom: 0,
                  width: '1px',
                  backgroundColor: mode === 'light'
                    ? 'rgba(0, 0, 0, 0.08)'
                    : 'rgba(255, 255, 255, 0.08)',
                }
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontWeight: hour === currentHour ? 'bold' : 'normal',
                  color: hour === currentHour
                    ? theme.palette.primary.main
                    : mode === 'light' ? '#374151' : '#f1f5f9',
                }}
              >
                {hourTime.format('HH:mm')}
              </Typography>
            </Box>
          );
        })}
        {/* Overflow zone border — subtle left edge at midnight */}
        <Box
          sx={{
            position: 'absolute',
            left: `${DAY_WIDTH_PX}px`,
            top: 0,
            width: `${OVERFLOW_WIDTH_PX}px`,
            height: '100%',
            borderLeft: `1px dashed ${mode === 'light' ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.15)'}`,
            pointerEvents: 'none',
          }}
        />
      </Box>
    </Box>
  );
};
