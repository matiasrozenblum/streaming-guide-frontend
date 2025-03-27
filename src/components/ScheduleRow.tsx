import { Box, Typography, Avatar } from '@mui/material';
import { ProgramBlock } from './ProgramBlock';

interface Program {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  description?: string;
  panelists?: { id: string; name: string }[];
}

interface Props {
  channelName: string;
  channelLogo?: string;
  programs: Program[];
  color?: string;
}

export const ScheduleRow = ({ channelName, channelLogo, programs, color }: Props) => {
  console.log(`📡 ${channelName} programs count:`, programs.length);
  return (
    <Box display="flex" alignItems="center" borderBottom={1} position="relative" height="60px">
      <Box
        width="120px"
        px={1}
        display="flex"
        alignItems="center"
        gap={1}
        sx={{ overflow: 'hidden', whiteSpace: 'nowrap' }}
      >
        {channelLogo ? (
          <Avatar src={channelLogo} alt={channelName} sx={{ width: 32, height: 32 }} />
        ) : null}
        <Typography variant="body2" fontWeight={600}>
          {channelName}
        </Typography>
      </Box>

      <Box position="relative" flex="1" height="100%">
      {programs.map((p, i) => (
        <ProgramBlock
            key={p.id}
            name={p.name}
            start={p.start_time}
            end={p.end_time}
            description={p.description}
            panelists={p.panelists}
            color={color}
        />
        ))}
      </Box>
    </Box>
  );
};