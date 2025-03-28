import { Box, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { PIXELS_PER_MINUTE, CHANNEL_LABEL_WIDTH, TIME_HEADER_HEIGHT } from '../constants/layout';

const hours = Array.from({ length: 24 }, (_, i) => i);

export const TimeHeader = () => {
  const now = dayjs();
  
  return (
    <Box 
      display="flex" 
      ml={`${CHANNEL_LABEL_WIDTH}px`} 
      borderBottom="1px solid rgba(0, 0, 0, 0.12)"
      height={`${TIME_HEADER_HEIGHT}px`}
      bgcolor="white"
      position="sticky"
      top={0}
      zIndex={1000}
      sx={{ boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
    >
      {hours.map((hour) => {
        const hourTime = dayjs().hour(hour).minute(0);
        const isPast = now.isAfter(hourTime);
        
        return (
          <Box
            key={hour}
            width={`${60 * PIXELS_PER_MINUTE}px`}
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
  );
};