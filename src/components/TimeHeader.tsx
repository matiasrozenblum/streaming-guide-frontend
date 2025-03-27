import { Box, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { PIXELS_PER_MINUTE, CHANNEL_LABEL_WIDTH } from '@/constants/layout';

const hours = Array.from({ length: 24 }, (_, i) => i); // 00:00 a 23:00

export const TimeHeader = () => {
  return (
    <Box display="flex" ml={`${CHANNEL_LABEL_WIDTH}px`} borderBottom={1}>
      {hours.map((hour) => (
        <Box
          key={hour}
          width={`${60 * PIXELS_PER_MINUTE}px`} // 60 min x px por minuto
          p={1}
          textAlign="center"
          borderRight={1}
        >
          <Typography variant="body2">
            {dayjs().hour(hour).minute(0).format('HH:mm')}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};