import { Box, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { useLayoutValues } from '../constants/layout';

const hours = Array.from({ length: 24 }, (_, i) => i);

export const TimeHeader = () => {
  const { channelLabelWidth, timeHeaderHeight, pixelsPerMinute } = useLayoutValues();
  const now = dayjs();
  const totalWidth = (pixelsPerMinute * 60 * 24) + channelLabelWidth;
  
  return (
    <Box 
      display="flex" 
      width={`${totalWidth}px`}
      borderBottom="1px solid rgba(0, 0, 0, 0.12)"
      height={`${timeHeaderHeight}px`}
      bgcolor="white"
      position="sticky"
      top={0}
      zIndex={1000}
      sx={{ boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
    >
      <Box
        width={`${channelLabelWidth}px`}
        minWidth={`${channelLabelWidth}px`}
        borderRight="1px solid rgba(0, 0, 0, 0.12)"
        bgcolor="white"
        position="sticky"
        left={0}
        zIndex={2}
      />
      
      <Box 
        display="flex" 
        width={`${pixelsPerMinute * 60 * 24}px`}
        position="relative"
      >
        {hours.map((hour) => {
          const hourTime = dayjs().startOf('day').add(hour, 'hour');
          const isPast = now.isAfter(hourTime);
          
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
                  backgroundColor: 'rgba(0, 0, 0, 0.08)',
                }
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