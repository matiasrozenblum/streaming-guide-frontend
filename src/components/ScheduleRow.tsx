'use client';

import React, { useState } from 'react';
import { Box, Avatar, Typography, useTheme, useMediaQuery } from '@mui/material';
import { usePathname } from 'next/navigation';
import { ProgramBlock } from './ProgramBlock';
import { useLayoutValues } from '../constants/layout';
import { useThemeContext } from '@/contexts/ThemeContext';
import { getChannelBackground } from '@/utils/getChannelBackground';
import YouTubeModal from './YouTubeModal';

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
  const pathname = usePathname();
  const isLegalPage = pathname === '/legal';
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

  const extractVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleYouTubeClick = (url: string) => {
    const videoId = extractVideoId(url);
    if (videoId) {
      setSelectedVideoId(videoId);
    }
  };

  const StandardLayout = (
    <Box
      width={`${channelLabelWidth}px`}
      minWidth={`${channelLabelWidth}px`}
      display="flex"
      alignItems="center"
      justifyContent="center"
      position="sticky"
      left={0}
      bgcolor={mode === 'light' ? 'white' : '#1e293b'}
      height="100%"
      zIndex={6}
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
            background: getChannelBackground(channelName),
            boxShadow: mode === 'light'
              ? '0 2px 4px rgba(0,0,0,0.1)'
              : '0 2px 4px rgba(0,0,0,0.2)',
            '& img': {
              objectFit: 'contain',
              width: '100%',
              height: '100%',
            }
          }}
        />
      ) : (
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 600,
            fontSize: isMobile ? '0.875rem' : '1rem',
            color: mode === 'light' ? '#374151' : '#f1f5f9',
            textAlign: 'center',
          }}
        >
          {channelName}
        </Typography>
      )}
    </Box>
  );

  const LegalLayout = (
    <Box
      width={`${channelLabelWidth}px`}
      minWidth={`${channelLabelWidth}px`}
      display="flex"
      alignItems="center"
      justifyContent="center"
      position="sticky"
      left={0}
      bgcolor={mode === 'light' ? 'white' : '#1e293b'}
      height="100%"
      zIndex={6}
      sx={{ 
        borderRight: `1px solid ${mode === 'light' ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)'}`,
        boxShadow: mode === 'light' 
          ? '2px 0 4px rgba(0,0,0,0.05)'
          : '2px 0 4px rgba(0,0,0,0.2)',
      }}
    >
      {/* Blurred Logo Background */}
      {channelLogo && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: isMobile ? '112px' : '130px',
            height: isMobile ? '50px' : '68px',
            backgroundImage: `url(${channelLogo})`,
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            filter: 'blur(4px)',
            opacity: 0.15,
          }}
        />
      )}

      {/* Content Container */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          padding: 1,
        }}
      >
        {/* Channel Name */}
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 700,
            fontSize: isMobile ? '0.875rem' : '1rem',
            lineHeight: 1.2,
            color: mode === 'light' ? '#1e293b' : '#f1f5f9',
            textAlign: 'center',
            letterSpacing: '0.02em',
            textTransform: 'uppercase',
            marginBottom: 0.5,
          }}
        >
          {channelName}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <>
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
        {isLegalPage ? StandardLayout : LegalLayout}

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
              onYouTubeClick={handleYouTubeClick}
            />
          ))}
        </Box>
      </Box>
      <YouTubeModal
        open={!!selectedVideoId}
        onClose={() => setSelectedVideoId(null)}
        videoId={selectedVideoId || ''}
      />
    </>
  );
};