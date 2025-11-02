'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, alpha, ClickAwayListener, IconButton, Snackbar, Alert, Button, useTheme } from '@mui/material';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { useLayoutValues } from '@/constants/layout';
import { OpenInNew, Notifications } from '@mui/icons-material';
import { useThemeContext } from '@/contexts/ThemeContext';
import { useYouTubePlayer } from '@/contexts/YouTubeGlobalPlayerContext';
import { event as gaEvent } from '@/lib/gtag';
import { extractVideoId } from '@/utils/extractVideoId';
import { tokens } from '@/design-system/tokens';
import { Text, BaseButton } from '@/design-system/components';
import { api } from '@/services/api';
import { useSessionContext } from '@/contexts/SessionContext';
import type { SessionWithToken } from '@/types/session';
import { usePush } from '@/contexts/PushContext';
import LoginModal from './auth/LoginModal';
import IOSNotificationSetup from './IOSNotificationSetup';
import { useTooltip } from '@/contexts/TooltipContext';
import { programStyleOverrides } from '@/styles/programStyleOverrides';
// Removed LiveStream import - no longer needed
// Removed useSecondaryStreamsConfig - no longer needed

dayjs.extend(customParseFormat);

// Removed ScoredStream type - no longer needed

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

// Helper to encode ArrayBuffer to base64
function arrayBufferToBase64(buffer: ArrayBuffer | null): string {
  if (!buffer) return '';
  return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(buffer))));
}

export const ProgramBlock: React.FC<Props> = ({
  id,
  name,
  start,
  end,
  subscribed,
  description,
  panelists,
  logo_url,
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
  const { mode } = useThemeContext();
  const theme = useTheme();
  const [isMobile, setIsMobile] = useState(false);
  const bellRef = useRef<HTMLButtonElement>(null);
  const [isOn, setIsOn] = useState(subscribed);
  const [isLoading, setIsLoading] = useState(false);
  const { openVideo, openPlaylist } = useYouTubePlayer();
  const { subscribeAndRegister, isIOSDevice, isPWAInstalled } = usePush();
  const { openTooltip: globalOpenTooltip, closeTooltip: globalCloseTooltip, isTooltipOpen } = useTooltip();
  // Removed showSecondaryStreams - no longer needed
  const openTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [iosSetupOpen, setIOSSetupOpen] = useState(false);
  const [showIOSPushSnackbar, setShowIOSPushSnackbar] = useState(false);
  const blockRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [blockWidth, setBlockWidth] = useState<number | null>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  
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
    }
  };

  const handleBellClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!typedSession?.accessToken) {
      setLoginOpen(true);
      return;
    }

    const prevIsOn = isOn;
    const willSubscribe = !isOn;

    // Optimistically update UI
    setIsOn(willSubscribe);
    setIsLoading(true);

    try {
      let pushSubscription = null;
      let endpoint = '';
      let p256dh = '';
      let auth = '';
      let pushErrorReason = '';
      let notificationMethod = 'both'; // Default for non-iOS or iOS with PWA

      // For iOS users without PWA, use email-only subscription to reduce friction
      if (isIOSDevice && !isPWAInstalled) {
        if (willSubscribe) {
          notificationMethod = 'email';
        } else {
          notificationMethod = 'email'; // Keep it simple for unsubscription
        }
        // Skip push subscription setup entirely for iOS without PWA
      } else {
        // Normal push subscription flow for other platforms or iOS with PWA
        try {
          pushSubscription = await subscribeAndRegister();
          if (pushSubscription) {
            endpoint = pushSubscription.endpoint;
            
            // Enhanced cross-platform key extraction with detailed logging
            try {
              const p256dhKey = pushSubscription.getKey('p256dh');
              const authKey = pushSubscription.getKey('auth');
              
              if (p256dhKey && authKey) {
                p256dh = arrayBufferToBase64(p256dhKey);
                auth = arrayBufferToBase64(authKey);
              } else {
                console.warn('Missing push subscription keys:', { p256dhKey: !!p256dhKey, authKey: !!authKey });
              }
            } catch (keyError) {
              console.error('Failed to extract push subscription keys:', keyError);
              pushErrorReason = `Key extraction failed: ${keyError instanceof Error ? keyError.message : 'Unknown'}`;
            }
          } else {
            console.warn('Push subscription is null');
          }
        } catch (error) {
          pushErrorReason = error instanceof Error ? error.message : 'Unknown error';
          console.warn('Failed to get push subscription:', error);
          
          // For critical errors, still show setup dialog
          if (isIOSDevice && !isPWAInstalled && error instanceof Error && 
              error.message.includes('home screen')) {
            setIsOn(prevIsOn); // Revert UI
            setIsLoading(false);
            globalCloseTooltip(tooltipId); // Close tooltip before opening modal
            setIOSSetupOpen(true);
            return;
          }
        }
      }

      // Enhanced validation with detailed debugging
      const isValidPush = !!(pushSubscription && endpoint && p256dh && auth);
      
      if (!isValidPush) {
        const reason = pushErrorReason || (!pushSubscription ? 'No subscription object' : 'Missing endpoint/keys');
        console.warn('Not sending invalid push subscription:', reason);
        gaEvent({
          action: 'push_subscription_invalid',
          params: {
            program_id: id,
            program_name: name,
            channel_name: channelName,
            reason,
            endpoint: endpoint || 'empty',
            p256dh: p256dh || 'empty', 
            auth: auth || 'empty',
            has_push: !!pushSubscription,
          },
          userData: typedSession?.user
        });
      }
      
      await api.post(
        `/programs/${id}/subscribe`,
        { 
          notificationMethod,
          endpoint: isValidPush ? endpoint : undefined,
          p256dh: isValidPush ? p256dh : undefined,
          auth: isValidPush ? auth : undefined
        },
        {
          headers: { Authorization: `Bearer ${typedSession.accessToken}` },
        }
      );
      
      // Show helpful message for iOS users who subscribed via email
      if (isIOSDevice && !isPWAInstalled && willSubscribe && notificationMethod === 'email') {
        setTimeout(() => {
          setShowIOSPushSnackbar(true);
        }, 1000);
      }
      
      // Track subscription event
      gaEvent({
        action: willSubscribe ? 'program_subscribe' : 'program_unsubscribe',
        params: {
          program_id: id,
          program_name: name,
          channel_name: channelName,
          notification_method: notificationMethod,
          has_push: !!pushSubscription,
        },
        userData: typedSession?.user
      });
    } catch (error) {
      // Revert UI on error
      setIsOn(prevIsOn);
      
      // Provide user-friendly error messages
      let errorMessage = 'Error updating subscription. Please try again.';
      if (error instanceof Error) {
        if (error.message.includes('pantalla de inicio') || error.message.includes('home screen')) {
          errorMessage = error.message;
        } else if (error.message.includes('permission') || error.message.includes('notificaciones')) {
          errorMessage = error.message;
        }
      }
      
      alert(errorMessage);
      console.error('Error updating subscription:', error);
      
      // Track subscription error
      gaEvent({
        action: 'subscription_error',
        params: {
          action: willSubscribe ? 'subscribe' : 'unsubscribe',
          program_id: id,
          program_name: name,
          channel_name: channelName,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        userData: typedSession?.user
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Limpieza de timeouts al desmontar
  useEffect(() => {
    return () => {
      if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current);
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  // Apertura retardada 500ms
  const handleTooltipOpen = (event: React.MouseEvent) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    if (!isMobile) {
      // Capture initial mouse position
      setMousePosition({ x: event.clientX, y: event.clientY });
      if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current);
      openTimeoutRef.current = setTimeout(() => {
        globalOpenTooltip(tooltipId);
      }, 500);
    }
  };

  // Track mouse position
  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isTooltipOpenForThis && !isMobile) {
      setMousePosition({ x: event.clientX, y: event.clientY });
    }
  };

  // Apertura inmediata al hacer click
  const handleTooltipClick = (event: React.MouseEvent) => {
    // Cancelar cualquier timeout pendiente
    if (openTimeoutRef.current) {
      clearTimeout(openTimeoutRef.current);
      openTimeoutRef.current = null;
    }
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    // Abrir/cerrar tooltip inmediatamente
    if (isTooltipOpenForThis) {
      globalCloseTooltip(tooltipId);
      setMousePosition(null);
    } else {
      if (!isMobile) {
        setMousePosition({ x: event.clientX, y: event.clientY });
      }
      globalOpenTooltip(tooltipId);
    }
  };

  // Cierre rápido
  const handleTooltipClose = () => {
    if (openTimeoutRef.current) {
      clearTimeout(openTimeoutRef.current);
      openTimeoutRef.current = null;
    }
    if (!isMobile) {
      closeTimeoutRef.current = setTimeout(() => {
        globalCloseTooltip(tooltipId);
        setMousePosition(null);
      }, 100);
    }
  };

  useEffect(() => {
    if (!blockRef.current) return;
    const handleResize = () => {
      setBlockWidth(blockRef.current ? blockRef.current.offsetWidth : null);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Responsive pill styles
  let pillFontSize = '0.82rem';
  let pillPx = 1;
  let pillPy = 0.1;
  let pillTop = 6;
  let pillLeft = 6;
  
  // Determine pill label based on program type and whether it's actually today
  let pillLabel: string;
  if (overrideType === 'cancel') {
    pillLabel = 'Cancelado';
  } else if (isWeeklyOverride) {
    // For special programs, show "¡Hoy!" only if it's actually today
    pillLabel = isToday ? '¡Hoy!' : '¡Especial!';
  } else {
    pillLabel = '¡Hoy!';
  }
  
  if (blockWidth !== null) {
    if (blockWidth < 90) {
      pillFontSize = '0.7rem';
      pillPx = 0.5;
      pillPy = 0;
      pillTop = 3;
      pillLeft = 3;
      pillLabel = overrideType === 'time_change' ? '¡Hoy!' : pillLabel;
    } else if (blockWidth < 130) {
      pillFontSize = '0.76rem';
      pillPx = 0.7;
      pillPy = 0.05;
      pillTop = 4;
      pillLeft = 4;
      pillLabel = overrideType === 'time_change' ? '¡Hoy!' : pillLabel;
    }
  }

  // Contenido del tooltip
  const tooltipContent = (
    <Box sx={{ p: tokens.spacing.sm }}>
      <Text
        variant="subtitle1"
        fontWeight={tokens.typography.fontWeight.bold}
        sx={{
          color: mode === 'dark' ? '#fff' : theme.palette.text.primary
        }}
      >
        {name}
      </Text>
      <Text
        variant="body2"
        sx={{
          mt: tokens.spacing.sm,
          color: mode === 'dark' ? 'rgba(255,255,255,0.8)' : theme.palette.text.secondary,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}
      >
        {start} - {end}
        {isWeeklyOverride && (
          <span style={{ color: '#ff9800', fontWeight: 700, marginLeft: 8, fontSize: '0.95em', whiteSpace: 'nowrap' }}>
            ¡Horario especial!
          </span>
        )}
      </Text>
      {description && (
        <Text
          variant="body2"
          sx={{
            mt: tokens.spacing.sm,
            color: mode === 'dark' ? 'rgba(255,255,255,0.8)' : theme.palette.text.secondary
          }}
        >
          {description}
        </Text>
      )}
      {panelists?.length ? (
        <Box sx={{ mt: tokens.spacing.sm }}>
          <Text
            variant="body2"
            fontWeight={tokens.typography.fontWeight.bold}
            sx={{ color: mode === 'dark' ? '#fff' : theme.palette.text.primary }}
          >
            Panelistas:
          </Text>
          <Text
            variant="body2"
            sx={{ color: mode === 'dark' ? 'rgba(255,255,255,0.8)' : theme.palette.text.secondary }}
          >
            {panelists.map(p => p.name).join(', ')}
          </Text>
        </Box>
      ) : null}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: tokens.spacing.md }}>
        {streamUrl && (
          <BaseButton
            onClick={handleClick}
            onTouchStart={handleClick}
            variant="contained"
            size="small"
            startIcon={<OpenInNew />}
            className="youtube-button"
            sx={{
              backgroundColor: '#FF0000',
              '&:hover': { backgroundColor: '#cc0000' },
              fontWeight: tokens.typography.fontWeight.bold,
              textTransform: 'none',
              fontSize: tokens.typography.fontSize.sm,
              boxShadow: 'none',
              touchAction: 'manipulation',
            }}
          >
            {isLive ? 'Ver en vivo' : 'Ver en YouTube'}
          </BaseButton>
        )}
        <IconButton
          size="small"
          aria-label="Notificarme"
          onClick={handleBellClick}
          ref={bellRef}
          sx={{
            color: isLoading ? undefined : (isOn ? 'primary.main' : 'action.disabled'),
          }}
          disabled={isLoading}
        >
          {isLoading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 24, width: 24 }}>
              <svg width="20" height="20" viewBox="0 0 40 40" style={{ display: 'block' }}>
                <circle cx="20" cy="20" r="18" stroke="#1976d2" strokeWidth="4" fill="none" strokeDasharray="90" strokeDashoffset="60">
                  <animateTransform attributeName="transform" type="rotate" from="0 20 20" to="360 20 20" dur="1s" repeatCount="indefinite" />
                </circle>
              </svg>
            </Box>
          ) : (
            <Notifications color={isOn ? "primary" : "disabled"} />
          )}
        </IconButton>
      </Box>
    </Box>
  );

  return (
    <ClickAwayListener onClickAway={
      (event) => {
        if (bellRef.current?.contains(event.target as Node)) {
          return;
        }
        if (isMobile) globalCloseTooltip(tooltipId);
      }
    }>
      <>
        <Box
          className="program-block"
          onMouseEnter={handleTooltipOpen}
          onMouseLeave={handleTooltipClose}
          onMouseMove={handleMouseMove}
          onClick={handleTooltipClick}
          style={{
            position: 'absolute',
            left: `${offsetPx}px`,
            width: `${widthPx}px`,
            height: height,
            top: `${topOffset}px`,
            ...(overrideStyle ? overrideStyle.boxStyle : {}),
          }}
          height="100%"
          sx={overrideStyle ? overrideStyle.sx : {
              backgroundColor: isLive
                ? alpha(color, 0.3)
                : isPast
                  ? alpha(color, 0.05)
                  : alpha(color, 0.15),
              border: `1px solid ${isPast ? alpha(color, mode === 'light' ? 0.3 : 0.4) : color}`,
              borderRadius: tokens.borderRadius.sm,
              transition: `background-color ${tokens.transition.normal} ${tokens.transition.timing}`,
              cursor: 'pointer',
              overflow: 'hidden',
              boxShadow: tokens.boxShadow.sm,
              '&:hover': {
                backgroundColor: isLive
                  ? alpha(color, mode === 'light' ? 0.38 : 0.48)
                  : isPast
                    ? alpha(color, mode === 'light' ? 0.36 : 0.28)
                    : alpha(color, mode === 'light' ? 0.22 : 0.28),
                transform: 'scale(1.01)',
              },
            }}
            ref={blockRef}
          >
            {/* Special content for override styles */}
            {overrideStyle && overrideStyle.render && overrideStyle.render({ name, backgroundOpacity })}
            {/* Default content if no override */}
            {!overrideStyle && (
              <Box
                sx={{
                  p: tokens.spacing.sm,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-start',
                  alignItems: 'center',
                  position: 'relative',
                }}
              >
                {isLive && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: tokens.spacing.xs,
                      right: tokens.spacing.xs,
                      backgroundColor: '#f44336',
                      color: 'white',
                      fontSize: '0.65rem',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontWeight: 'bold',
                      zIndex: 5,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                    }}
                  >
                    LIVE
                  </Box>
                )}
                {isWeeklyOverride && (
                  (isMobile || duration < 120) ? (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 6,
                        left: 6,
                        width: 14,
                        height: 14,
                        backgroundColor: 'rgba(255, 152, 0, 0.5)',
                        borderRadius: '50%',
                        border: '1px solid rgba(255, 152, 0, 1)',
                        zIndex: 5,
                        pointerEvents: 'none',
                        boxShadow: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title={pillLabel !== '¡Hoy!' ? pillLabel : '¡Hoy!'}
                    />
                  ) : (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: pillTop,
                        left: pillLeft,
                        backgroundColor: 'rgba(255, 152, 0, 0.18)',
                        color: '#ff9800',
                        fontWeight: 700,
                        fontSize: pillFontSize,
                        borderRadius: '999px',
                        px: pillPx,
                        py: pillPy,
                        border: '1px solid #ff9800',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: 1,
                        zIndex: 5,
                        pointerEvents: 'none',
                        whiteSpace: 'nowrap',
                        maxWidth: blockWidth ? `${Math.floor(blockWidth * 0.8)}px` : '80%',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                      }}
                      title={pillLabel !== '¡Hoy!' ? pillLabel : '¡Hoy!'}
                    >
                      {pillLabel}
                    </Box>
                  )
                )}
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    gap: 1,
                  }}
                >
                  {logo_url && (
                    <Box
                      component="img"
                      src={logo_url}
                      alt={name}
                      sx={{
                        width: '40px',
                        height: '40px',
                        objectFit: 'contain',
                        opacity: isPast ? (mode === 'light' ? 0.5 : 0.4) : 1,
                      }}
                    />
                  )}
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 0.5,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 'bold',
                        fontSize: totalMultipleStreams && totalMultipleStreams > 1 ? '0.7rem' : '0.75rem',
                        textAlign: 'center',
                        color: isPast ? alpha(color, 1) : color,
                        lineHeight: totalMultipleStreams && totalMultipleStreams > 1 ? 1.1 : 'normal',
                        display: '-webkit-box',
                        WebkitLineClamp: totalMultipleStreams && totalMultipleStreams > 1 ? 2 : 1,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {name.toUpperCase()}
                    </Typography>
                    {panelists && panelists.length > 0 && (!isMobile || (isMobile && widthPx > 120)) && (
                      <Typography
                        variant="caption"
                        sx={{
                          fontSize: totalMultipleStreams && totalMultipleStreams > 1 ? '0.6rem' : '0.65rem',
                          textAlign: 'center',
                          color: isPast ? alpha(color, 0.8) : alpha(color, 0.8),
                          lineHeight: totalMultipleStreams && totalMultipleStreams > 1 ? 1.1 : 1.2,
                          maxWidth: '100%',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: totalMultipleStreams && totalMultipleStreams > 1 ? 1 : 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {panelists.map(p => p.name).join(', ')}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Box>
            )}
          </Box>
        {/* Custom tooltip positioned at mouse cursor */}
        {isTooltipOpenForThis && mousePosition && !isMobile && (
          <Box
            ref={tooltipRef}
            sx={{
              position: 'fixed',
              left: `${mousePosition.x}px`,
              top: `${mousePosition.y - 10}px`,
              transform: 'translate(-50%, -100%)',
              backgroundColor: mode === 'light'
                ? theme.palette.background.paper
                : '#0F172A',
              color: mode === 'light'
                ? theme.palette.text.primary
                : '#fff',
              boxShadow: theme.shadows[3],
              borderRadius: '8px',
              padding: 0,
              zIndex: 9999,
              pointerEvents: 'none',
              maxWidth: '400px',
            }}
          >
            {tooltipContent}
          </Box>
        )}
        <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
        <IOSNotificationSetup 
          open={iosSetupOpen} 
          onClose={() => setIOSSetupOpen(false)} 
          onComplete={() => {
            setIOSSetupOpen(false);
            // Optionally trigger the subscription again after setup
            if (isPWAInstalled) {
              handleBellClick({ stopPropagation: () => {} } as React.MouseEvent);
            }
          }}
        />
        <Snackbar
          open={showIOSPushSnackbar}
          autoHideDuration={8000}
          onClose={() => setShowIOSPushSnackbar(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          sx={{ zIndex: 9999 }}
        >
          <Alert 
            severity="info" 
            onClose={() => setShowIOSPushSnackbar(false)}
            sx={{ 
              minWidth: 280,
            }}
          >
            Para recibir notificaciones push en iOS, dirígete a{' '}
            <Button 
              color="inherit" 
              size="small" 
              href="/subscriptions"
              sx={{ 
                textDecoration: 'underline',
                p: 0,
                minWidth: 'auto',
                fontSize: 'inherit',
                fontWeight: 'inherit',
                textTransform: 'none',
                '&:hover': {
                  backgroundColor: 'transparent',
                  textDecoration: 'underline',
                }
              }}
            >
              Tus favoritos
            </Button>
          </Alert>
        </Snackbar>
      </>
    </ClickAwayListener>
  );
};