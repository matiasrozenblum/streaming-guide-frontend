import { Box, Tooltip } from '@mui/material';
import dayjs from 'dayjs';

interface Props {
  name: string;
  start: string;
  end: string;
  description?: string;
  panelists?: { id: string; name: string }[];
  color?: string;
}

export const ProgramBlock = ({ name, start, end, description, panelists, color = '#1976d2' }: Props) => {
  console.log(`🎯 ProgramBlock`, { start, end });
  const startTime = dayjs(start, 'HH:mm');
  const endTime = dayjs(end, 'HH:mm');
  const duration = endTime.diff(startTime, 'minute');
  const offset = Math.max(0, startTime.diff(dayjs().hour(8).minute(0), 'minute'));
  console.log(`⏱️ Offset: ${offset}, Duration: ${duration}`);

  return (
    <Tooltip title={<>
        <strong>{name}</strong><br />
        {description}<br />
        {panelists?.length && (
          <>
            <br />
            <strong>Panelistas:</strong><br />
            {panelists.map((p) => p.name).join(', ')}
          </>
        )}
      </>} arrow placement="top">
      <Box
        position="absolute"
        left={`${(offset / 60) * 100 + 8}px`}
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