import { Box, Avatar, Typography } from '@mui/material';
import { ProgramBlock } from './ProgramBlock';
import { ROW_HEIGHT } from '../constants/layout';

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
  return (
    <Box 
      display="flex" 
      alignItems="center" 
      borderBottom="1px solid rgba(0, 0, 0, 0.12)"
      position="relative" 
      height={`${ROW_HEIGHT}px`}
      sx={{
        '&:hover': {
          backgroundColor: 'rgba(0, 0, 0, 0.02)',
        },
      }}
    >
      <Box
        width={160}
        px={2}
        display="flex"
        alignItems="center"
        gap={2}
        position="sticky"
        left={0}
        bgcolor="white"
        height="100%"
        zIndex={2}
        sx={{ 
          borderRight: '1px solid rgba(0, 0, 0, 0.12)',
          boxShadow: '2px 0 4px rgba(0,0,0,0.05)',
        }}
      >
        {channelLogo ? (
          <Avatar 
            src={channelLogo} 
            alt={channelName}
            sx={{
              width: 40,
              height: 40,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          />
        ) : null}
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 'bold',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {channelName}
        </Typography>
      </Box>

      <Box position="relative" flex="1" height="100%">
        {programs.map((p) => (
          <ProgramBlock
            key={p.id}
            name={p.name}
            start={p.start_time}
            end={p.end_time}
            description={p.description}
            panelists={p.panelists}
            logo_url={p.logo_url}
            channelName={channelName}
            color={color}
          />
        ))}
      </Box>
    </Box>
  );
};