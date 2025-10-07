'use client';

import React from 'react';
import { Box, Avatar, Typography, useTheme, useMediaQuery } from '@mui/material';
import { usePathname } from 'next/navigation';
import { ProgramBlock } from './ProgramBlock';
import { useLayoutValues } from '../constants/layout';
import { useThemeContext } from '@/contexts/ThemeContext';
// Removed getChannelBackground import - now using database background_color
import { useLiveStatus } from '@/contexts/LiveStatusContext';

// Removed LiveStream import - no longer needed

// Helper function to split long programs into smaller blocks for better visibility
const splitLongProgram = (program: Program, isMobile: boolean): Program[] => {
  const parseTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };
  
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };
  
  const startMinutes = parseTime(program.start_time);
  const endMinutes = parseTime(program.end_time);
  const duration = endMinutes - startMinutes;
  
  // Define thresholds and max block duration based on device
  const threshold = isMobile ? 360 : 600; // 6 hours for mobile, 10 hours for web
  const maxBlockDuration = isMobile ? 360 : 600; // 6 hours for mobile, 10 hours for web
  
  // Check if program needs to be split
  if (duration > threshold) {
    const blocks: Program[] = [];
    const numBlocks = Math.ceil(duration / maxBlockDuration);
    const actualBlockDuration = Math.ceil(duration / numBlocks);
    
    for (let i = 0; i < numBlocks; i++) {
      const blockStart = startMinutes + (i * actualBlockDuration);
      const blockEnd = Math.min(blockStart + actualBlockDuration, endMinutes);
      
      blocks.push({
        ...program,
        id: `${program.id}-block-${i}`, // Unique ID for each block
        start_time: formatTime(blockStart),
        end_time: formatTime(blockEnd),
        // Preserve the original program's live status for all blocks
        is_live: program.is_live,
      });
    }
    
    return blocks;
  }
  
  return [program]; // Return original program if doesn't need splitting
};

interface Program {
  id: string; // program ID
  scheduleId: string; // schedule ID for live status lookup
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
  style_override?: string | null;
}

interface Props {
  channelName: string;
  channelLogo?: string;
  channelBackgroundColor?: string | null;
  programs: Program[];
  color?: string;
  isToday?: boolean;
}

export const ScheduleRow = ({ 
  channelName, 
  channelLogo, 
  channelBackgroundColor,
  programs, 
  color, 
  isToday,
}: Props) => {
  const theme = useTheme();
  const { mode } = useThemeContext();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { channelLabelWidth, rowHeight } = useLayoutValues();
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
            background: channelBackgroundColor || '#ffffff', // fallback to white
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
          {programs.flatMap(p => splitLongProgram(p, isMobile)).map((p) => {
            // Get live status from context using schedule ID
            const currentLiveStatus = liveStatus[p.scheduleId];
            // Always prioritize program's is_live field if it's explicitly set
            const isLive = p.is_live !== undefined ? p.is_live : (currentLiveStatus?.is_live || false);
            const currentStreamUrl = currentLiveStatus?.stream_url || p.stream_url;
            
            // Check for time overlap with other programs
            const hasTimeOverlap = programs.some(otherProg => {
              if (otherProg.id === p.id) return false; // Don't compare with self
              
              // Convert time strings to minutes for comparison
              const parseTime = (timeStr: string) => {
                const [hours, minutes] = timeStr.split(':').map(Number);
                return hours * 60 + minutes;
              };
              
              const pStart = parseTime(p.start_time);
              const pEnd = parseTime(p.end_time);
              const otherStart = parseTime(otherProg.start_time);
              const otherEnd = parseTime(otherProg.end_time);
              
              // Check for overlap: two time ranges overlap if one starts before the other ends
              return pStart < otherEnd && otherStart < pEnd;
            });
            
            // Count overlapping programs (including self)
            const overlappingPrograms = programs.filter(prog => {
              if (prog.id === p.id) return true; // Include self
              
              const parseTime = (timeStr: string) => {
                const [hours, minutes] = timeStr.split(':').map(Number);
                return hours * 60 + minutes;
              };
              
              const pStart = parseTime(p.start_time);
              const pEnd = parseTime(p.end_time);
              const progStart = parseTime(prog.start_time);
              const progEnd = parseTime(prog.end_time);
              
              return pStart < progEnd && progStart < pEnd;
            });
            
            // Apply multiple streams layout if there's time overlap
            if (hasTimeOverlap) {
              return (
                <React.Fragment key={p.id}>
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
                    isWeeklyOverride={p.isWeeklyOverride ?? false}
                    overrideType={p.overrideType ?? ''}
                    styleOverride={p.style_override}
                    multipleStreamsIndex={overlappingPrograms.findIndex(prog => prog.id === p.id)}
                    totalMultipleStreams={overlappingPrograms.length}
                  />
                </React.Fragment>
              );
            }

            return (
              <React.Fragment key={p.id}>
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
                  isWeeklyOverride={p.isWeeklyOverride ?? false}
                  overrideType={p.overrideType ?? ''}
                  styleOverride={p.style_override}
                />
              </React.Fragment>
            );
          })}
        </Box>
      </Box>
    </>
  );
};