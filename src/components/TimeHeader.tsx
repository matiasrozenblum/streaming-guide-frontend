'use client';

import { Box, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { useLayoutValues, DAY_ORDER, DayOfWeek, DAY_WIDTH_PX, WEEK_WIDTH_PX } from '../constants/layout';
import { useThemeContext } from '@/contexts/ThemeContext';
import { useEffect, useState } from 'react';
import { tokens } from '@/design-system/tokens';

const hours = Array.from({ length: 24 }, (_, i) => i);
const DAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

interface Props {
  isModalOpen?: boolean;
  isMobile?: boolean;
}

export const TimeHeader = ({ isModalOpen, isMobile }: Props) => {
  const { channelLabelWidth, timeHeaderHeight, pixelsPerMinute } = useLayoutValues();
  const { mode, theme } = useThemeContext();
  const [now, setNow] = useState(dayjs);

  const currentHour = now.hour();
  const todayDayIndex = DAY_ORDER.indexOf(now.format('dddd').toLowerCase() as DayOfWeek);

  useEffect(() => {
    if (!isModalOpen) {
      const update = () => setNow(dayjs());
      const intervalId = setInterval(update, 60000);
      return () => clearInterval(intervalId);
    }
  }, [isModalOpen]);

  return (
    <Box
      display="flex"
      width={`${WEEK_WIDTH_PX + channelLabelWidth}px`}
      borderBottom={`1px solid ${mode === 'light' ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)'}`}
      height={`${timeHeaderHeight}px`}
      bgcolor={mode === 'light' ? 'white' : '#1e293b'}
      sx={{
        boxShadow: mode === 'light'
          ? '0 1px 2px rgba(0,0,0,0.05)'
          : '0 1px 2px rgba(0,0,0,0.2)',
        position: 'sticky',
        top: isMobile ? -1 : 0,
        zIndex: 1000,
      }}
    >
      {/* Channel label column */}
      <Box
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

      {/* Weekly timeline: 7 days × 24 hours */}
      <Box display="flex" width={`${WEEK_WIDTH_PX}px`} position="relative">
        {DAY_ORDER.map((day, dayIndex) => {
          const isCurrentDay = dayIndex === todayDayIndex;
          const isPastDay = dayIndex < todayDayIndex;

          return (
            <Box
              key={day}
              sx={{
                width: `${DAY_WIDTH_PX}px`,
                minWidth: `${DAY_WIDTH_PX}px`,
                height: '100%',
                display: 'flex',
                borderLeft: dayIndex > 0
                  ? `1px solid ${mode === 'light' ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.15)'}`
                  : 'none',
              }}
            >
              {hours.map((hour) => {
                const isPastHour = isPastDay || (isCurrentDay && hour < currentHour);
                const isCurrentHour = isCurrentDay && hour === currentHour;
                const hourTime = dayjs().startOf('day').add(hour, 'hour');
                const isFirstHour = hour === 0;

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
                      opacity: isPastHour ? 0.5 : 1,
                      transition: 'opacity 0.2s ease',
                      position: 'relative',
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
                      },
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: isCurrentHour ? 'bold' : 'normal',
                        color: isCurrentHour
                          ? theme.palette.primary.main
                          : isCurrentDay && isFirstHour
                            ? theme.palette.primary.main
                            : mode === 'light' ? '#374151' : '#f1f5f9',
                        fontSize: '0.7rem',
                        lineHeight: 1,
                        textAlign: 'center',
                      }}
                    >
                      {isFirstHour ? DAY_LABELS[dayIndex] : hourTime.format('HH:mm')}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};
