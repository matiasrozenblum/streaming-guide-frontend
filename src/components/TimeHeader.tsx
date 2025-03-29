import { Box, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { PIXELS_PER_MINUTE, CHANNEL_LABEL_WIDTH, TIME_HEADER_HEIGHT } from '../constants/layout';

const hours = Array.from({ length: 24 }, (_, i) => i);

export const TimeHeader = () => {
  const now = dayjs();
  const totalWidth = (PIXELS_PER_MINUTE * 60 * 24) + CHANNEL_LABEL_WIDTH;
  
  return (
    <Box 
      display="flex" 
      width={`${totalWidth}px`}
      borderBottom="1px solid rgba(0, 0, 0, 0.12)"
      height={`${TIME_HEADER_HEIGHT}px`}
      bgcolor="white"
      position="sticky"
      top={0}
      zIndex={1000}
      sx={{ boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
    >
      {/* Fixed width column for channel labels */}
      <Box
        width={`${CHANNEL_LABEL_WIDTH}px`}
        minWidth={`${CHANNEL_LABEL_WIDTH}px`}
        borderRight="1px solid rgba(0, 0, 0, 0.12)"
        bgcolor="white"
        position="sticky"
        left={0}
        zIndex={2}
      />
      
      {/* Time columns */}
      <Box display="flex" width={`${PIXELS_PER_MINUTE * 60 * 24}px`}>
        {hours.map((hour) => {
          const hourTime = dayjs().hour(hour).minute(0);
          const isPast = now.isAfter(hourTime);
          
          return (
            <Box
              key={hour}
              width={`${PIXELS_PER_MINUTE * 60}px`}
              minWidth={`${PIXELS_PER_MINUTE * 60}px`}
              p={1}
              textAlign="center"
              borderRight="1px solid rgba(0, 0, 0, 0.08)"
              sx={{
                opacity: isPast ? 0.5 : 1,
                transition: 'opacity 0.2s ease',
              }}
            >
              <Typography 
                variant="body2"
                sx={{
                  fontWeight: hour === now.hour() ? 'bold' : 'normal',
                  color: hour === now.hour() ? 'primary.main' : 'inherit',
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