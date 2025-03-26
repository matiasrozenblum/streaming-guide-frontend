import { Box, Typography } from '@mui/material';
import dayjs from 'dayjs';

const hours = Array.from({ length: 12 }, (_, i) => 8 + i); // de 8 a 19

export const TimeHeader = () => {
  return (
    <Box display="flex" ml="120px" borderBottom={1}>
      {hours.map((hour) => (
        <Box key={hour} width={100} p={1} textAlign="center" borderRight={1}>
          <Typography variant="body2">
            {dayjs().hour(hour).minute(0).format('HH:mm')}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};