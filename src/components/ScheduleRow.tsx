'use client';

import React, { useMemo } from 'react';
import { Box, Avatar, Typography, useTheme, useMediaQuery } from '@mui/material';
import { usePathname } from 'next/navigation';
import { ProgramBlock } from './ProgramBlock';
import { useLayoutValues, DAY_ORDER, DayOfWeek } from '../constants/layout';
import { useThemeContext } from '@/contexts/ThemeContext';
import { useLiveStatus } from '@/contexts/LiveStatusContext';

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

  const threshold = isMobile ? 360 : 600;
  const maxBlockDuration = isMobile ? 360 : 600;

  if (duration > threshold) {
    const blocks: Program[] = [];
    const numBlocks = Math.ceil(duration / maxBlockDuration);
    const actualBlockDuration = Math.ceil(duration / numBlocks);

    for (let i = 0; i < numBlocks; i++) {
      const blockStart = startMinutes + (i * actualBlockDuration);
      const blockEnd = Math.min(blockStart + actualBlockDuration, endMinutes);
      blocks.push({
        ...program,
        id: `${program.id}-block-${i}`,
        start_time: formatTime(blockStart),
        end_time: formatTime(blockEnd),
        is_live: program.is_live,
      });
    }
    return blocks;
  }

  return [program];
};

// Module-level: no component state needed
const parseAbsoluteMin = (timeStr: string, dayOfWeek: string): number => {
  const [h, m] = timeStr.split(':').map(Number);
  const dayIndex = DAY_ORDER.indexOf(dayOfWeek as DayOfWeek);
  return (dayIndex >= 0 ? dayIndex : 0) * 1440 + h * 60 + m;
};

export interface Program {
  id: string;
  scheduleId: string;
  name: string;
  start_time: string;
  end_time: string;
  day_of_week: string;
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
  todayName: string;
  visibleDayRange: [number, number];
}

export const ScheduleRow = React.memo(({
  channelName,
  channelLogo,
  channelBackgroundColor,
  programs,
  color,
  todayName,
  visibleDayRange,
}: Props) => {
  const theme = useTheme();
  const { mode } = useThemeContext();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { channelLabelWidth, rowHeight } = useLayoutValues();
  const pathname = usePathname();
  const isLegalPage = pathname === '/legal';
  const { liveStatus } = useLiveStatus();

  // Memoize the expensive split + lane-assignment so it only re-runs when programs/isMobile change
  const { allSplitPrograms, laneAssignments, totalLanes } = useMemo(() => {
    const split = programs.flatMap(p => splitLongProgram(p, isMobile));

    const sorted = [...split].sort(
      (a, b) => parseAbsoluteMin(a.start_time, a.day_of_week) - parseAbsoluteMin(b.start_time, b.day_of_week)
    );

    const assignments = new Map<string, number>();
    const laneEndTimes: number[] = [];

    for (const prog of sorted) {
      const progStart = parseAbsoluteMin(prog.start_time, prog.day_of_week);
      const progEnd = parseAbsoluteMin(prog.end_time, prog.day_of_week);

      const hasOverlap = split.some(other => {
        if (other.id === prog.id) return false;
        const otherStart = parseAbsoluteMin(other.start_time, other.day_of_week);
        const otherEnd = parseAbsoluteMin(other.end_time, other.day_of_week);
        return progStart < otherEnd && otherStart < progEnd;
      });

      if (!hasOverlap) continue;

      let lane = laneEndTimes.findIndex(t => t <= progStart);
      if (lane === -1) {
        lane = laneEndTimes.length;
        laneEndTimes.push(progEnd);
      } else {
        laneEndTimes[lane] = progEnd;
      }

      assignments.set(prog.id, lane);
    }

    return { allSplitPrograms: split, laneAssignments: assignments, totalLanes: laneEndTimes.length };
  }, [programs, isMobile]);

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
            background: channelBackgroundColor || '#ffffff',
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
          {allSplitPrograms.map((p) => {
            // Lazy render: skip programs outside visible day range
            const blockDayIndex = DAY_ORDER.indexOf(p.day_of_week as DayOfWeek);
            if (blockDayIndex < visibleDayRange[0] || blockDayIndex > visibleDayRange[1]) {
              return null;
            }

            const currentLiveStatus = liveStatus[p.scheduleId];
            const isLive = p.is_live !== undefined ? p.is_live : (currentLiveStatus?.is_live || false);
            const currentStreamUrl = currentLiveStatus?.stream_url || p.stream_url;

            const laneIndex = laneAssignments.get(p.id);
            const hasTimeOverlap = laneIndex !== undefined;

            const dayOffsetMinutes = (blockDayIndex >= 0 ? blockDayIndex : 0) * 1440;
            const blockIsToday = p.day_of_week === todayName;

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
                  isToday={blockIsToday}
                  stream_url={currentStreamUrl}
                  is_live={isLive}
                  subscribed={p.subscribed ?? false}
                  isWeeklyOverride={p.isWeeklyOverride ?? false}
                  overrideType={p.overrideType ?? ''}
                  styleOverride={p.style_override}
                  dayOffsetMinutes={dayOffsetMinutes}
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
});

ScheduleRow.displayName = 'ScheduleRow';
