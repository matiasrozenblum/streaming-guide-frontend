import { Box, Tooltip } from '@mui/material';
import dayjs from 'dayjs';

interface Props {
  name: string;
  start: string;
  end: string;
  description?: string;
  color?: string;
}

export const ProgramBlock = ({ name, start, end, description, color = '#1976d2' }: Props) => {
  const startTime = dayjs(start, 'HH:mm');
  const endTime = dayjs(end, 'HH:mm');
  const duration = endTime.diff(startTime, 'minute');
  const offset = startTime.diff(dayjs().hour(8).minute(0), 'minute');

  return (
    <Tooltip title={<>{name}<br />{description}</>} arrow placement="top">
      <Box
        position="absolute"
        left={`${(offset / 60) * 100}px`}
        width={`${(duration / 60) * 100}px`}
        height="40px"
        bgcolor={color}
        color="white"
        px={1}
        borderRadius={1}
        display="flex"
        alignItems="center"
        fontSize={12}
        overflow="hidden"
        whiteSpace="nowrap"
      >
        {name}
      </Box>
    </Tooltip>
  );
};