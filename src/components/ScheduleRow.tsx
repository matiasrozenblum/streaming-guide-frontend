'use client';

import { Box, Avatar, Typography, useTheme, useMediaQuery } from '@mui/material';
import { ProgramBlock } from './ProgramBlock';
import { useLayoutValues } from '../constants/layout';
import { useThemeContext } from '@/contexts/ThemeContext';
import { getChannelBackground } from '@/utils/getChannelBackground';

interface Program {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  description?: string;
  panelists?: { id: string; name: string }[];
  logo_url?: string;
  youtube_url?: string;
  live_url?: string;
}

interface Props {
  channelName: string;
  channelLogo?: string;
  programs: Program[];
  color?: string;
  isToday?: boolean;
}

export const ScheduleRow = ({ channelName, channelLogo, programs, color, isToday }: Props) => {
  const theme = useTheme();
  const { mode } = useThemeContext();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { channelLabelWidth, rowHeight } = useLayoutValues();

  return (
    <Box 
      display="flex" 
      alignItems="center" 
      borderBottom={`1px solid ${mode === 'light' ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)'}`}
      position="relative"
      height={`${rowHeight}px`}
      sx={{
        '&:hover': {
          backgroundColor: mode === 'light' 
            ? 'rgba(0, 0, 0, 0.02)' 
            : 'rgba(255, 255, 255, 0.02)',
        },
      }}
    >
      <Box
        width={`${channelLabelWidth}px`}
        minWidth={`${channelLabelWidth}px`}
        display="flex"
        alignItems="center"
        gap={isMobile ? 1 : 2}
        position="sticky"
        left={0}
        bgcolor={mode === 'light' ? 'white' : '#1e293b'}
        height="100%"
        zIndex={2}
        sx={{ 
          borderRight: `1px solid ${mode === 'light' ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)'}`,
          boxShadow: mode === 'light' 
            ? '2px 0 4px rgba(0,0,0,0.05)'
            : '2px 0 4px rgba(0,0,0,0.2)',
        }}
      >
        {channelLogo ? (
          <Avatar 
            src={channelLogo} 
            alt={channelName}
            variant="rounded"
            sx={{
              width: isMobile ? 112 : 130,
              height: isMobile ? 50 : 68,
              mx: 'auto',
              background: getChannelBackground(channelName),
              boxShadow: mode === 'light'
                ? '0 2px 4px rgba(0,0,0,0.1)'
                : '0 2px 4px rgba(0,0,0,0.2)',
              overflow: 'hidden',
              '& img': {
                objectFit: 'contain',
                width: '100%',
                height: '100%',
              }
            }}
          />
        ) : (
          <Typography
            variant="subtitle2"
            textAlign="center"
            px={1}
            sx={{
              fontWeight: 'bold',
              fontSize: isMobile ? '0.7rem' : '0.8rem',
              lineHeight: 1.1,
              color: mode === 'light' ? '#374151' : '#f1f5f9',
            }}
          >
            {channelName}
          </Typography>
        )}
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
            isToday={isToday}
            youtube_url={p.youtube_url}
            live_url={p.live_url}
          />
        ))}
      </Box>
    </Box>
  );
};