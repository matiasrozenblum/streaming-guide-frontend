'use client';

import React from 'react';
import { Box, Avatar, Typography, useTheme, useMediaQuery } from '@mui/material';
import { usePathname } from 'next/navigation';
import { ProgramBlock, getProgramBlockPosition } from './ProgramBlock';
import { useLayoutValues } from '../constants/layout';
import { useThemeContext } from '@/contexts/ThemeContext';
import { getChannelBackground } from '@/utils/getChannelBackground';
import { useLiveStatus } from '@/contexts/LiveStatusContext';

interface Program {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  description?: string;
  panelists?: { id: string; name: string }[];
  logo_url?: string;
  stream_url?: string;
  is_live?: boolean;
  subscribed?: boolean;
  isWeeklyOverride?: boolean;
  overrideType?: 'cancel' | 'time_change' | 'reschedule';
}

interface Props {
  channelName: string;
  channelLogo?: string;
  programs: Program[];
  color?: string;
  isToday?: boolean;
}

export const ScheduleRow = ({ 
  channelName, 
  channelLogo, 
  programs, 
  color, 
  isToday,
}: Props) => {
  const theme = useTheme();
  const { mode } = useThemeContext();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { channelLabelWidth, rowHeight, pixelsPerMinute } = useLayoutValues();
  const pathname = usePathname();
  const isLegalPage = pathname === '/legal';
  const { liveStatus } = useLiveStatus();

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
          draggable={false}
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
        {!isLegalPage ? StandardLayout : LegalLayout}

        <Box position="relative" flex="1" height="100%">
          {programs.map((p) => {
            // Get live status from context
            const currentLiveStatus = liveStatus[p.id.toString()];
            const isLive = currentLiveStatus?.is_live || p.is_live;
            const currentStreamUrl = currentLiveStatus?.stream_url || p.stream_url;

            // Calculate position for override chip
            const { offsetPx, widthPx } = getProgramBlockPosition(p.start_time, p.end_time, pixelsPerMinute);

            // Determine chip color and label
            let chipColor = '#2196f3';
            let chipLabel = 'Reprogramado';
            if (p.overrideType === 'cancel') {
              chipColor = '#f44336';
              chipLabel = 'Cancelado';
            } else if (p.overrideType === 'time_change') {
              chipColor = '#ff9800';
              chipLabel = '¡Solo por hoy!';
            }

            return (
              <React.Fragment key={p.id}>
                {p.isWeeklyOverride && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 8,
                      left: `calc(${offsetPx}px - 12%)`,
                      width: `124%`,
                      backgroundColor: chipColor,
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '1.1rem',
                      textAlign: 'center',
                      py: 0.5,
                      boxShadow: 2,
                      borderRadius: '4px',
                      transform: 'rotate(-15deg)',
                      zIndex: 10,
                      pointerEvents: 'none',
                      whiteSpace: 'nowrap',
                      minWidth: `${widthPx * 1.2}px`,
                      maxWidth: 'none',
                    }}
                  >
                    {chipLabel}
                  </Box>
                )}
                <ProgramBlock
                  id={p.id}
                  name={p.name}
                  start={p.start_time}
                  end={p.end_time}
                  description={p.description}
                  panelists={p.panelists}
                  logo_url={p.logo_url}
                  channelName={channelName}
                  color={color}
                  isToday={isToday}
                  stream_url={currentStreamUrl}
                  is_live={isLive}
                  subscribed={p.subscribed ?? false}
                />
              </React.Fragment>
            );
          })}
        </Box>
      </Box>
    </>
  );
};