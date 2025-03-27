import { Box, Typography, Avatar } from '@mui/material';
import { ProgramBlock } from './ProgramBlock';

interface Program {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  description?: string;
  panelists?: { id: string; name: string }[];
  logo_url?: string;
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
          <Avatar src={channelLogo} alt={channelName} sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: 'inherit',
          }} />
        ) : null}
      </Box>

      <Box position="relative" flex="1" height="100%">
      {programs.map((p) => (
        console.log('p.logo_url:', p.name),
        <ProgramBlock
            key={p.id}
            name={p.name}
            start={p.start_time}
            end={p.end_time}
            description={p.description}
            panelists={p.panelists}
            logo_url={p.logo_url}
            color={color}
        />
        ))}
      </Box>
    </Box>
  );
};