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

  // Precompute split programs once
  const allSplitPrograms = programs.flatMap(p => splitLongProgram(p, isMobile));

  // Helper: convert "HH:MM" to minutes since midnight
  const parseTimeMin = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  // Greedy interval-graph lane assignment.
  // Sorts programs by start time, assigns each to the lowest lane whose
  // previous occupant has already ended. This gives the chromatic number of
  // the interval graph (= max simultaneous programs), which is the correct
  // number of vertical "slots" needed.
  const sortedForLanes = [...allSplitPrograms].sort(
    (a, b) => parseTimeMin(a.start_time) - parseTimeMin(b.start_time)
  );

  const laneAssignments = new Map<string, number>(); // program id → lane index
  const laneEndTimes: number[] = [];               // current end time for each lane

  for (const prog of sortedForLanes) {
    const progStart = parseTimeMin(prog.start_time);
    const progEnd = parseTimeMin(prog.end_time);

    // Only include in the multi-lane layout if it truly overlaps another program
    const hasOverlap = allSplitPrograms.some(other => {
      if (other.id === prog.id) return false;
      return progStart < parseTimeMin(other.end_time) &&
             parseTimeMin(other.start_time) < progEnd;
    });

    if (!hasOverlap) continue;

    // Find the lowest lane that is free at progStart
    let lane = laneEndTimes.findIndex(t => t <= progStart);
    if (lane === -1) {
      lane = laneEndTimes.length; // open a new lane
      laneEndTimes.push(progEnd);
    } else {
      laneEndTimes[lane] = progEnd;
    }

    laneAssignments.set(prog.id, lane);
  }

  // Total lanes = chromatic number = max simultaneous programs in this row
  const totalLanes = laneEndTimes.length;

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
          {allSplitPrograms.map((p) => {
            const currentLiveStatus = liveStatus[p.scheduleId];
            const isLive = p.is_live !== undefined ? p.is_live : (currentLiveStatus?.is_live || false);
            const currentStreamUrl = currentLiveStatus?.stream_url || p.stream_url;

            const laneIndex = laneAssignments.get(p.id);
            const hasTimeOverlap = laneIndex !== undefined;

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
                  {...(hasTimeOverlap ? {
                    multipleStreamsIndex: laneIndex,
                    totalMultipleStreams: totalLanes,
                  } : {})}
                />
              </React.Fragment>
            );
          })}
        </Box>
      </Box>
    </>
  );
};