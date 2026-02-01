'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Box, Tooltip, Typography, alpha, IconButton, Snackbar, Alert } from '@mui/material';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { useLayoutValues } from '@/constants/layout';
import { Notifications } from '@mui/icons-material';
import { useYouTubePlayer } from '@/contexts/YouTubeGlobalPlayerContext';
import { event as gaEvent } from '@/lib/gtag';
import { extractVideoId } from '@/utils/extractVideoId';
import { Text } from '@/design-system/components';
import { api } from '@/services/api';
import { useSessionContext } from '@/contexts/SessionContext';
import type { SessionWithToken } from '@/types/session';
import { usePush } from '@/contexts/PushContext';
import LoginModal from './auth/LoginModal';
import IOSNotificationSetup from './IOSNotificationSetup';
import { useTooltip } from '@/contexts/TooltipContext';
import { programStyleOverrides } from '@/styles/programStyleOverrides';

dayjs.extend(customParseFormat);

interface Props {
  id: string;
  name: string;
  start: string;
  end: string;
  subscribed: boolean;
  description?: string;
  panelists?: { id: string; name: string }[];
  logo_url?: string;
  color?: string;
  channelName?: string;
  isToday?: boolean;
  is_live?: boolean;
  stream_url?: string | null;
  isWeeklyOverride?: boolean;
  overrideType?: string;
  styleOverride?: string | null;
  multipleStreamsIndex?: number;
  totalMultipleStreams?: number;
}

export const ProgramBlock: React.FC<Props> = ({
  id,
  name,
  start,
  end,
  subscribed,
  description,
  panelists,
  color = '#2196F3',
  channelName,
  isToday,
  is_live,
  stream_url,
  isWeeklyOverride,
  overrideType,
  styleOverride,
  multipleStreamsIndex,
  totalMultipleStreams,
}) => {
  const { session } = useSessionContext();
  const typedSession = session as SessionWithToken | null;
  const isLive = is_live || false;
  const streamUrl = stream_url;

  // Simplified approach - no complex stream matching needed
  const { pixelsPerMinute } = useLayoutValues();
  // const theme = useTheme(); // Unused
  const [isMobile, setIsMobile] = useState(false);
  const bellRef = useRef<HTMLButtonElement>(null);
  const [isOn, setIsOn] = useState(subscribed);
  const [isLoading, setIsLoading] = useState(false);
  const { openVideo, openPlaylist } = useYouTubePlayer();
  const { subscribeAndRegister, isIOSDevice, isPWAInstalled } = usePush();
  const { openTooltip: globalOpenTooltip, closeTooltip: globalCloseTooltip, isTooltipOpen } = useTooltip();
  const openTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [iosSetupOpen, setIOSSetupOpen] = useState(false);
  const [showIOSPushSnackbar, setShowIOSPushSnackbar] = useState(false);
  const blockRef = useRef<HTMLDivElement>(null);
  // const anchorRef = useRef<HTMLDivElement>(null); // Unused
  // const [blockWidth, setBlockWidth] = useState<number | null>(null); // Unused
  // const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null); // Unused

  const tooltipId = `program-${id}`;
  const isTooltipOpenForThis = isTooltipOpen(tooltipId);

  // Style override logic
  const overrideStyle = styleOverride && programStyleOverrides[styleOverride];

  // Cálculo de posición y tamaño
  const [startHours, startMinutes] = start.split(':').map(Number);
  const [endHours, endMinutes] = end.split(':').map(Number);
  const minutesFromMidnightStart = startHours * 60 + startMinutes;
  const minutesFromMidnightEnd = endHours * 60 + endMinutes;
  const offsetPx = minutesFromMidnightStart * pixelsPerMinute;
  const duration = minutesFromMidnightEnd - minutesFromMidnightStart;

  // Handle multiple streams positioning
  let widthPx = duration * pixelsPerMinute - 1;
  let topOffset = 0;
  let height = '100%';

  if (totalMultipleStreams && totalMultipleStreams > 1) {
    // Keep full width for each program, but stack them vertically
    widthPx = duration * pixelsPerMinute - 1;
    // Stack vertically to fill the entire row height without gaps
    // Ensure the total height doesn't exceed 100% of the row
    const heightPercentage = 100 / totalMultipleStreams;
    topOffset = (multipleStreamsIndex || 0) * heightPercentage;
    if (topOffset > 0) {
      // Different offset adjustments for mobile vs web
      const offsetAdjustment = isMobile ? 20 : 10;
      topOffset = topOffset - offsetAdjustment;
    }
    // Use a slightly smaller height to prevent overflow
    height = `${heightPercentage}%`; // Reduce by 1% to prevent overflow
  }

  const now = dayjs();
  const currentDate = now.format('YYYY-MM-DD');
  const parsedEndWithDate = dayjs(`${currentDate} ${end}`, 'YYYY-MM-DD HH:mm');
  const isPast = isToday && now.isAfter(parsedEndWithDate);

  // Calculate background opacity as in the default style
  let backgroundOpacity = 0.15;
  if (isPast) backgroundOpacity = 0.05;
  else if (isLive) backgroundOpacity = 0.5;

  useEffect(() => {
    setIsOn(subscribed);
  }, [subscribed]);

  // Detectar mobile
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMobile(/Mobi|Android/i.test(navigator.userAgent));
    }
  }, []);

  // Manejo de click en YouTube
  const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!streamUrl) return;

    // Safe Clarity calls - only if Clarity is loaded
    if (typeof window !== 'undefined' && 'clarity' in window) {
      try {
        const clarityWindow = window as Window & { clarity: (action: string, ...args: unknown[]) => void };
        clarityWindow.clarity('set', 'program_name', name);
        clarityWindow.clarity('set', 'channel_name', channelName);
        clarityWindow.clarity('event', isLive ? 'click_youtube_live' : 'click_youtube_deferred');
      } catch (error) {
        console.warn('Clarity tracking failed:', error);
      }
    }

    gaEvent({
      action: isLive ? 'click_youtube_live' : 'click_youtube_deferred',
      params: {
        category: 'program',
        program_name: name,
        channel_name: channelName,
      },
      userData: typedSession?.user
    });

    try {
      const url = new URL(streamUrl);
      const listId = url.searchParams.get('list');
      if (listId) {
        openPlaylist(listId);
        return;
      }
    } catch {
      // Ignorar URL inválida
    }

    const videoId = extractVideoId(streamUrl);
    if (videoId) {
      openVideo(videoId);
    } else {
      window.open(streamUrl, '_blank');
    }
  };

  const handleToggleNotification = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening the video

    if (!typedSession?.user) {
      setLoginOpen(true);
      return;
    }

    if (isLoading) return;
    setIsLoading(true);

    // If implementing iOS push, we need to handle permissions first
    if (isIOSDevice && !isPWAInstalled) {
      // Check if we need to show setup instructions
      const permission = Notification.permission;
      if (permission === 'default' || permission === 'denied') {
        setIOSSetupOpen(true);
        setIsLoading(false);
        return;
      }
    }

    try {
      if (isOn) {
        // Unsubscribe
        await api.post(`/notifications/unsubscribe/${id}`);
        setIsOn(false);
        gaEvent({
          action: 'notification_unsubscribe',
          params: { program_name: name },
          userData: typedSession?.user
        });
      } else {
        // Subscribe
        await subscribeAndRegister();
        setIsOn(true);

        // Show snackbar for iOS users
        if (isIOSDevice) {
          setShowIOSPushSnackbar(true);
        }

        gaEvent({
          action: 'notification_subscribe',
          params: { program_name: name },
          userData: typedSession?.user
        });

        // Track with Clarity
        if (typeof window !== 'undefined' && 'clarity' in window) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (window as any).clarity('event', 'notification_subscribe');
        }
      }
    } catch (error) {
      console.error('Error toggling notification:', error);
      // Fallback if push subscription fails but we want to optimistically update UI
      // or handle specific errors
    } finally {
      setIsLoading(false);
    }
  };

  const handleMouseEnter = () => {
    if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current);
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);

    // Capture position for tooltip
    // Capture position for tooltip
    // Removed unused position tracking logic

    // Delay opening tooltip to avoid flickering when moving fast
    openTimeoutRef.current = setTimeout(() => {
      globalOpenTooltip(tooltipId);
    }, 50);
  };

  const handleMouseLeave = () => {
    if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current);
    // Standard delay for closing
    closeTimeoutRef.current = setTimeout(() => {
      globalCloseTooltip();
    }, 50);
  };

  // Content of the Tooltip
  const tooltipContent = (
    <Box sx={{ p: 0.5 }}>
      <React.Fragment>
        {/* Title */}
        <Text
          variant="subtitle1"
          sx={{
            fontWeight: 700,
            lineHeight: 1.3,
            mb: 0.5,
            color: '#fff'
          }}
        >
          {name.toUpperCase()}
        </Text>

        {/* Schedule */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
          <Text
            variant="body2"
            sx={{
              color: 'rgba(255,255,255,0.8)',
              fontWeight: 500,
              backgroundColor: 'rgba(255,255,255,0.1)',
              px: 0.8,
              py: 0.2,
              borderRadius: 1,
            }}
          >
            {start} - {end}
          </Text>
          {isToday && (
            <Text
              variant="caption"
              sx={{
                color: isLive ? '#ef4444' : isPast ? 'rgba(255,255,255,0.5)' : '#10b981',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              {isLive ? 'EN VIVO' : isPast ? 'FINALIZADO' : 'PRÓXIMAMENTE'}
            </Text>
          )}
        </Box>

        {/* Description */}
        {description && (
          <Text
            variant="body2"
            sx={{
              color: 'rgba(255,255,255,0.8)',
              mb: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              lineHeight: 1.5,
            }}
          >
            {description}
          </Text>
        )}

        {/* Panelists */}
        {panelists && panelists.length > 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 1.5 }}>
            {panelists.map((panelist) => (
              <Box key={panelist.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255,255,255,0.5)',
                  }}
                />
                <Text
                  variant="body2"
                  sx={{ color: '#fff' }}
                >
                  {panelist.name}
                </Text>
              </Box>
            ))}
          </Box>
        )}

        {/* Channel Info */}
        {channelName && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mt: 1,
              pt: 1,
              borderTop: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            <Text
              variant="caption"
              sx={{ color: 'rgba(255,255,255,0.8)' }}
            >
              En {channelName}
            </Text>
          </Box>
        )}
      </React.Fragment>
    </Box>
  );

  return (
    <>
      <Tooltip
        title={tooltipContent}
        open={isTooltipOpenForThis}
        disableFocusListener
        disableHoverListener
        disableTouchListener
        arrow
        placement="top"
        componentsProps={{
          tooltip: {
            sx: {
              bgcolor: '#0f172a',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
              maxWidth: 320,
              p: 1.5
            }
          },
          arrow: {
            sx: {
              color: '#0f172a'
            }
          }
        }}
        slotProps={{
          popper: {
            modifiers: [
              {
                name: 'offset',
                options: {
                  offset: [0, -8],
                },
              },
            ],
          },
        }}
      >
        <Box
          ref={blockRef}
          className="program-block"
          onClick={handleClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          sx={overrideStyle ? overrideStyle.sx : {
            position: 'absolute',
            top: isMobile && totalMultipleStreams && totalMultipleStreams > 1 ? `${topOffset}%` : (totalMultipleStreams && totalMultipleStreams > 1 ? `${topOffset}%` : 0),
            left: isMobile ? offsetPx : `${offsetPx}px`,
            width: isMobile ? widthPx : `${widthPx}px`,
            height: height,
            backgroundColor: alpha(color, backgroundOpacity),
            borderLeft: `4px solid ${color}`,
            borderRadius: '4px',
            padding: '4px 8px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            cursor: streamUrl ? 'pointer' : 'default',
            overflow: 'hidden',
            transition: 'all 0.2s',
            zIndex: 1,
            '&:hover': {
              backgroundColor: isLive
                ? alpha(color, 0.48)
                : isPast
                  ? alpha(color, 0.28)
                  : alpha(color, 0.28),
              zIndex: 10,
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
              transform: 'translateY(-1px)',
            },
            // Estilo específico para cuando es hover en desktop para mostrar el botón de notificaciones
            '&:hover .notification-button': {
              opacity: 1,
            },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              width: '100%',
              overflow: 'hidden'
            }}
          >
            <Box sx={{ minWidth: 0, flex: 1 }}> {/* minWidth 0 prevents flex child from overflowing */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.25 }}>
                {/* Shows LIVE + icon if is live, otherwise only shows text if subscribed (bell) */}
                {(isLive || isOn) ? (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      color: isLive ? '#ef4444' : '#fbbf24', // Red for live, Amber for subscribed
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      letterSpacing: '0.05em',
                      backgroundColor: isLive ? 'rgba(239, 68, 68, 0.1)' : 'rgba(251, 191, 36, 0.1)',
                      px: 0.5,
                      py: 0.1,
                      borderRadius: '2px',
                      border: `1px solid ${isLive ? 'rgba(239, 68, 68, 0.2)' : 'rgba(251, 191, 36, 0.2)'}`,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {isLive && (
                      <Box
                        sx={{
                          width: 4,
                          height: 4,
                          borderRadius: '50%',
                          backgroundColor: 'currentColor',
                          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                          '@keyframes pulse': {
                            '0%, 100%': { opacity: 1 },
                            '50%': { opacity: .5 },
                          },
                        }}
                      />
                    )}
                    {isLive ? 'EN VIVO' : 'SUSCRITO'}
                  </Box>
                ) : null}

                {/* Weekly override indicator */}
                {isWeeklyOverride && (
                  <Tooltip title={overrideType === 'special' ? 'Evento especial' : 'Horario modificado'}>
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        backgroundColor: overrideType === 'special' ? '#F59E0B' : '#3B82F6', // Amber or Blue
                        boxShadow: '0 0 4px rgba(0,0,0,0.3)',
                      }}
                    />
                  </Tooltip>
                )}
              </Box>

              <Typography
                className="program-title"
                variant="subtitle2"
                sx={{
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  lineHeight: 1.2,
                  color: '#fff',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                }}
              >
                {name.toUpperCase()}
              </Typography>

              <Typography
                className="program-time"
                variant="caption"
                sx={{
                  fontSize: '0.75rem',
                  color: 'rgba(255,255,255,0.7)',
                  fontWeight: 500,
                  mt: 0.25,
                  display: 'block',
                }}
              >
                {start} - {end}
              </Typography>
            </Box>

            {/* Desktop Notification Button */}
            {!isMobile && !isLive && !isPast && (
              <Tooltip title={isOn ? "Eliminar recordatorio" : "Avísame"}>
                <IconButton
                  ref={bellRef}
                  className="notification-button"
                  size="small"
                  onClick={handleToggleNotification}
                  disabled={isLoading}
                  sx={{
                    // Position relative to parent flex container
                    flexShrink: 0,
                    ml: 0.5,
                    mt: -0.5,
                    p: 0.5,
                    opacity: isOn ? 1 : 0, // Visible if ON, otherwise hidden until hover
                    color: isOn ? '#fbbf24' : 'rgba(255,255,255,0.7)', // Active amber, inactive white
                    transition: 'all 0.2s',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      color: isOn ? '#fbbf24' : '#fff',
                      transform: 'scale(1.1)',
                    },
                  }}
                >
                  <Notifications fontSize="small" sx={{ fontSize: '1.1rem' }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>
      </Tooltip>

      {/* Login Modal */}
      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
      />

      {/* iOS Notification Setup Modal */}
      <IOSNotificationSetup
        open={iosSetupOpen}
        onClose={() => setIOSSetupOpen(false)}
      />

      {/* iOS Push Snackbar Instruction */}
      <Snackbar
        open={showIOSPushSnackbar}
        autoHideDuration={6000}
        onClose={() => setShowIOSPushSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setShowIOSPushSnackbar(false)}
          severity="success"
          sx={{ width: '100%' }}
        >
          ¡Suscrito! Asegúrate de tener las notificaciones activadas en tu iPhone.
        </Alert>
      </Snackbar>
    </>
  );
};