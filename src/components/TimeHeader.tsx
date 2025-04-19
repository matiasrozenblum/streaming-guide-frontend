'use client';

import { Box, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { useLayoutValues } from '../constants/layout';
import { useThemeContext } from '@/contexts/ThemeContext';
import { useEffect, useState } from 'react';

const hours = Array.from({ length: 24 }, (_, i) => i);

interface Props {
  isModalOpen?: boolean;
}

export const TimeHeader = ({ isModalOpen }: Props) => {
  const { channelLabelWidth, timeHeaderHeight, pixelsPerMinute } = useLayoutValues();
  const { mode, theme } = useThemeContext();
  const [currentHour, setCurrentHour] = useState(dayjs().hour());
  const totalWidth = (pixelsPerMinute * 60 * 24) + channelLabelWidth;

  useEffect(() => {
    if (!isModalOpen) {
      const updateCurrentHour = () => {
        const newHour = dayjs().hour();
        console.log('⏰ TimeHeader hour updated:', {
          oldHour: currentHour,
          newHour,
          timestamp: new Date().toISOString()
        });
        setCurrentHour(newHour);
      };

      // Update every minute
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
      top={0}
      zIndex={1000}
      sx={{ 
        boxShadow: mode === 'light'
          ? '0 1px 2px rgba(0,0,0,0.05)'
          : '0 1px 2px rgba(0,0,0,0.2)'
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
            fontSize: '0.75rem',
            mr: '22px',
          }}
        >
          Canal
        </Typography>
      </Box>
      
      <Box 
        display="flex" 
        width={`${pixelsPerMinute * 60 * 24}px`}
        position="relative"
      >
        {hours.map((hour) => {
          const hourTime = dayjs().startOf('day').add(hour, 'hour');
          const isPast = hour < currentHour;
          
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
                opacity: isPast ? 0.5 : 1,
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
      </Box>
    </Box>
  );
};