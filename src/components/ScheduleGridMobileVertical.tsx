'use client';

import React from 'react';
import { Box, Typography, Button, Avatar, useTheme, Tooltip } from '@mui/material';
import { useEffect, useState, useRef } from 'react';
import dayjs from 'dayjs';
import { Channel } from '@/types/channel';
import { Schedule } from '@/types/schedule';
import { getColorForChannel } from '@/utils/colors';
import { useThemeContext } from '@/contexts/ThemeContext';
import { getChannelBackground } from '@/utils/getChannelBackground';
import { OpenInNew } from '@mui/icons-material';

interface Props {
  channels: Channel[];
  schedules: Schedule[];
}

export const ScheduleGridMobileVertical = ({ channels, schedules }: Props) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const today = dayjs().format('dddd').toLowerCase();
  const [selectedDay, setSelectedDay] = useState(today);
  const { mode } = useThemeContext();
  const theme = useTheme();
  const now = dayjs();
  const currentHour = now.hour();
  const currentMinute = now.minute();
  const numberOfColumns = channels.length + 2;

  // Now Indicator offset calculation
  const rowHeight = 36; // Height of each row in pixels
  const minuteHeight = rowHeight / 60; // Height of each minute in pixels
  const channelLabelHeight = 76; // Height of the channel label row + padding
  const nowIndicatorOffset = (currentHour * rowHeight) + (currentMinute * minuteHeight) + channelLabelHeight;

  const daysOfWeek = [
    { label: 'L', value: 'monday' },
    { label: 'M', value: 'tuesday' },
    { label: 'X', value: 'wednesday' },
    { label: 'J', value: 'thursday' },
    { label: 'V', value: 'friday' },
    { label: 'S', value: 'saturday' },
    { label: 'D', value: 'sunday' },
  ];

  const timeSlots = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    label: `${String(i).padStart(2, '0')}:00`,
  }));

  const isToday = selectedDay === today;

  useEffect(() => {
    if (isToday && gridRef.current) {
      const currentHourElement = document.getElementById(`time-${currentHour}`);
      if (currentHourElement) {
        const yOffset = -100;
        gridRef.current.scrollTo({
          top: currentHourElement.offsetTop + yOffset,
          behavior: 'smooth'
        });
      }
    }
  }, [isToday, currentHour]);

  // Sync horizontal scroll between header and content
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (scrollContainerRef.current && gridRef.current) {
      const scrollLeft = (e.target as HTMLDivElement).scrollLeft;
      if (e.target === scrollContainerRef.current) {
        gridRef.current.scrollLeft = scrollLeft;
      } else if (e.target === gridRef.current) {
        scrollContainerRef.current.scrollLeft = scrollLeft;
      }
    }
  };

  if (!channels.length || !schedules.length) {
    return <Typography sx={{ mt: 4, color: mode === 'light' ? '#374151' : '#f1f5f9' }}>Sin datos disponibles</Typography>;
  }

  const schedulesForDay = schedules.filter((s) => s.day_of_week === selectedDay);

  const getPrograms = () => {
    const programs: {
      [channelId: string]: {
        [hour: number]: Schedule & { rowSpan: number };
      };
    } = {};

    channels.forEach(channel => {
      programs[channel.id] = {};
      const channelSchedules = schedulesForDay.filter(s => s.program.channel.id === channel.id);
      
      channelSchedules.forEach(schedule => {
        const startHour = parseInt(schedule.start_time.split(':')[0]);
        const endHour = parseInt(schedule.end_time.split(':')[0]);
        const duration = endHour - startHour;

        programs[channel.id][startHour] = {
          ...schedule,
          rowSpan: duration,
        };
      });
    });

    return programs;
  };

  const programs = getPrograms();

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      height: '100%',
    }}>
      {/* Days of week selector - Fixed at top */}
      <Box 
        sx={{
          background: mode === 'light'
            ? 'linear-gradient(to right, rgba(255,255,255,0.95), rgba(255,255,255,0.9))'
            : 'linear-gradient(to right, rgba(30,41,59,0.95), rgba(30,41,59,0.9))',
          borderBottom: `1px solid ${mode === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}`,
          backdropFilter: 'blur(8px)',
          display: 'flex',
          gap: 1,
          p: 2,
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {daysOfWeek.map((day) => (
          <Button
            key={day.value}
            variant={selectedDay === day.value ? 'contained' : 'outlined'}
            onClick={() => setSelectedDay(day.value)}
            sx={{
              minWidth: '44px',
              height: '44px',
              padding: '0',
              borderRadius: '10px',
            }}
          >
            {day.label}
          </Button>
        ))}
      </Box>

      {/* Scrollable container */}
      <Box sx={{ 
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header row with horizontal scroll */}
        <Box
          ref={scrollContainerRef}
          onScroll={handleScroll}
          sx={{
            overflowX: 'auto',
            overflowY: 'hidden',
            WebkitOverflowScrolling: 'touch',
            background: mode === 'light'
              ? 'rgba(255,255,255,0.95)'
              : 'rgba(30,41,59,0.95)',
            borderBottom: `1px solid ${mode === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}`,
            backdropFilter: 'blur(8px)',
            position: 'sticky',
            top: 0,
            zIndex: 2,
            // Hide scrollbar for Chrome, Safari and Opera
            '&::-webkit-scrollbar': {
              display: 'none',
            },
            // Hide scrollbar for IE, Edge and Firefox
            msOverflowStyle: 'none',  // IE and Edge
            scrollbarWidth: 'none',  // Firefox
          }}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: `80px repeat(${channels.length}, 74px)`,
              minWidth: 'fit-content',
              gap: 1,
              p: 1,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: mode === 'light' ? '#64748b' : '#94a3b8',
                  fontWeight: 500,
                }}
              >
                Horario
              </Typography>
            </Box>

            {channels.map((channel) => (
              <Box
                key={channel.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: mode === 'light'
                    ? 'rgba(255,255,255,0.8)'
                    : 'rgba(30,41,59,0.8)',
                  borderRadius: '8px',
                  height: '60px',
                  width: '74px',
                }}
              >
                {channel.logo_url ? (
                  <Avatar
                    src={channel.logo_url}
                    alt={channel.name}
                    variant="rounded"
                    sx={{
                      width: '100%',
                      height: 'auto',
                      aspectRatio: '16/9',
                      backgroundColor: getChannelBackground(channel.name),
                      '& img': {
                        objectFit: 'contain',
                      }
                    }}
                  />
                ) : (
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 600,
                      color: mode === 'light' ? '#374151' : '#f1f5f9',
                      textAlign: 'center',
                    }}
                  >
                    {channel.name}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        </Box>

        {/* Grid content with both scrolls */}
        <Box
          ref={gridRef}
          onScroll={handleScroll}
          sx={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            position: 'relative',
          }}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: `80px repeat(${channels.length}, 74px)`,
              minWidth: 'fit-content',
              gap: 1,
              pb: 2,
            }}
          >
            {/* Time Slots and Programs */}
            {timeSlots.map((slot, slotIndex) => (
              <React.Fragment key={slot.hour}>
                {/* Time Label */}
                <Box
                  id={`time-${slot.hour}`}
                  sx={{
                    gridColumn: '1',
                    gridRow: slotIndex + 1,
                    p: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderBottom: `1px solid ${mode === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}`,
                    background: isToday && slot.hour === currentHour
                      ? mode === 'light'
                        ? 'rgba(37,99,235,0.1)'
                        : 'rgba(59,130,246,0.2)'
                      : 'transparent',
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: isToday && slot.hour === currentHour
                        ? theme.palette.primary.main
                        : mode === 'light' ? '#64748b' : '#94a3b8',
                      fontWeight: isToday && slot.hour === currentHour ? 600 : 400,
                    }}
                  >
                    {slot.label}
                  </Typography>
                </Box>

                {/* Programs */}
                {channels.map((channel, channelIndex) => {
                  const program = programs[channel.id][slot.hour];
                  const color = getColorForChannel(channelIndex);

                  if (!program || parseInt(program.start_time.split(':')[0]) !== slot.hour) {
                    return (
                      <Box
                        key={`empty-${channel.id}-${slot.hour}`}
                        sx={{
                          gridColumn: channelIndex + 2,
                          gridRow: slotIndex + 1,
                          borderBottom: `1px solid ${mode === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'}`,
                        }}
                      />
                    );
                  }

                  return (
                    <Tooltip
                      key={`${channel.id}-${slot.hour}`}
                      title={
                        <Box sx={{ p: 1 }}>
                          <Typography variant="subtitle1" fontWeight="bold" color="white">
                            {program.program.name}
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 1, color: 'rgba(255,255,255,0.9)' }}>
                            {program.start_time} - {program.end_time}
                          </Typography>
                          {program.program.description && (
                            <Typography variant="body2" sx={{ mt: 1, color: 'rgba(255,255,255,0.9)' }}>
                              {program.program.description}
                            </Typography>
                          )}
                          {program.program.panelists?.length ? (
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="body2" fontWeight="bold" color="white">
                                Panelistas:
                              </Typography>
                              <Typography variant="body2" color="rgba(255,255,255,0.9)">
                                {program.program.panelists.map((p) => p.name).join(', ')}
                              </Typography>
                            </Box>
                          ) : null}
                          {program.program.youtube_url && (
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(program.program.youtube_url, '_blank');
                              }}
                              variant="contained"
                              size="small"
                              startIcon={<OpenInNew />}
                              sx={{
                                mt: 2,
                                backgroundColor: '#FF0000',
                                '&:hover': { backgroundColor: '#cc0000' },
                                fontWeight: 'bold',
                                textTransform: 'none',
                                fontSize: '0.8rem',
                                boxShadow: 'none',
                              }}
                            >
                              Ver en YouTube
                            </Button>
                          )}
                        </Box>
                      }
                      arrow
                      placement="top"
                    >
                      <Box
                        sx={{
                          gridColumn: channelIndex + 2,
                          gridRow: `${slotIndex + 1} / span ${program.rowSpan}`,
                          p: 0.5,
                          background: `${color}${mode === 'light' ? '10' : '20'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative',
                          transition: 'all 0.2s ease-in-out',
                          cursor: 'pointer',
                          borderRadius: '8px',
                          border: `1px solid ${color}${mode === 'light' ? '30' : '40'}`,
                          width: '74px',
                          '&:hover': {
                            background: `${color}${mode === 'light' ? '20' : '30'}`,
                            transform: 'scale(1.02)',
                          },
                        }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'column',
                            gap: 0.5,
                            height: '100%',
                            width: '100%',
                            overflow: 'hidden',
                          }}
                        >
                          {program.program.logo_url ? (
                            <Box
                              component="img"
                              src={program.program.logo_url}
                              alt={program.program.name}
                              sx={{
                                width: '100%',
                                height: 'auto',
                                objectFit: 'contain',
                                opacity: 0.8,
                              }}
                            />
                          ) : (
                            <Typography
                              variant="caption"
                              sx={{
                                fontSize: '0.65rem',
                                lineHeight: 1.1,
                                color: mode === 'light' ? '#374151' : '#f1f5f9',
                                textAlign: 'center',
                                fontWeight: 600,
                                width: '100%',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                px: 0.5,
                              }}
                            >
                              {program.program.name}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Tooltip>
                  );
                })}
              </React.Fragment>
            ))}
          </Box>

          {/* Now Indicator */}
          {isToday && (
            <Box
              sx={{
                position: 'absolute',
                top: `${nowIndicatorOffset}px`,
                left: 0,
                width: `${numberOfColumns * 74}px`,
                height: '2px',
                backgroundColor: '#f44336',
                zIndex: 3,
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  left: 0,
                  top: '-4px',
                  width: '10px',
                  height: '10px',
                  backgroundColor: '#f44336',
                  borderRadius: '50%',
                },
              }}
            />
          )}
        </Box>
      </Box>
    </Box>
  );
};