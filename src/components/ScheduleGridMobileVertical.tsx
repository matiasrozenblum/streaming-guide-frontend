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
import { OpenInNew, AccessTime } from '@mui/icons-material';
import { useInView } from 'react-intersection-observer';

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

  const nowIndicatorRef = useRef<HTMLDivElement | null>(null);
  const { ref: observerRef, inView } = useInView({ threshold: 0 });

  useEffect(() => {
    if (nowIndicatorRef.current) {
      observerRef(nowIndicatorRef.current);
    }
  }, [observerRef]);

  // Now Indicator offset calculation
  const rowHeight = 36;
  const minuteHeight = rowHeight / 60;
  const channelLabelHeight = 76;
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
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Día selector */}
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

        {/* Contenedor scrollable */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Header horizontal */}
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
              '&::-webkit-scrollbar': { display: 'none' },
              msOverflowStyle: 'none',
              scrollbarWidth: 'none',
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
                        '& img': { objectFit: 'contain' }
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

          {/* Contenido con programas */}
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
              {timeSlots.map((slot, slotIndex) => (
                <React.Fragment key={slot.hour}>
                  {/* Time */}
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
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: mode === 'light' ? '#64748b' : '#94a3b8',
                        fontWeight: 400,
                      }}
                    >
                      {slot.label}
                    </Typography>
                  </Box>

                  {/* Programas */}
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
                          }}
                        />
                      );
                    }

                    return (
                      <Box
                        key={`${channel.id}-${slot.hour}`}
                        sx={{
                          gridColumn: channelIndex + 2,
                          gridRow: `${slotIndex + 1} / span ${program.rowSpan}`,
                          p: 0.5,
                          background: `${color}${mode === 'light' ? '10' : '20'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '8px',
                        }}
                      >
                        <Typography variant="caption" fontWeight={600} color="#fff">
                          {program.program.name}
                        </Typography>
                      </Box>
                    );
                  })}
                </React.Fragment>
              ))}
            </Box>

            {/* Now Indicator */}
            {isToday && (
              <Box
                ref={nowIndicatorRef}
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

      {/* Botón flotante "Volver al presente" */}
      {isToday && !inView && (
  <Button
    variant="contained"
    startIcon={<AccessTime />}
    onClick={(e) => {
      e.preventDefault(); // <- evita que el foco genere scroll
      const currentHourElement = document.getElementById(`time-${currentHour}`);
      if (currentHourElement && gridRef.current) {
        const yOffset = -100;
        setTimeout(() => {
          gridRef.current?.scrollTo({
            top: currentHourElement.offsetTop + yOffset,
            behavior: 'smooth',
          });
        }, 10); // permite que el foco no afecte el scroll
      }
    }}
    tabIndex={-1} // <- evita el foco automático al hacer click
    sx={{
      position: 'fixed',
      bottom: '80px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: '#f44336',
      color: '#fff',
      fontWeight: 'bold',
      textTransform: 'none',
      zIndex: 999,
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      '&:hover': {
        backgroundColor: '#d32f2f',
      },
    }}
  >
    Volver al presente
  </Button>
)}
    </>
  );
};
