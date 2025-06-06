'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Box, Tooltip, Typography, alpha, ClickAwayListener, IconButton } from '@mui/material';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { useLayoutValues } from '@/constants/layout';
import { OpenInNew, Notifications } from '@mui/icons-material';
import { useThemeContext } from '@/contexts/ThemeContext';
import { useYouTubePlayer } from '@/contexts/YouTubeGlobalPlayerContext';
import { event as gaEvent } from '@/lib/gtag';
import { extractVideoId } from '@/utils/extractVideoId';
import { useLiveStatus } from '@/contexts/LiveStatusContext';
import Clarity from '@microsoft/clarity';
import { tokens } from '@/design-system/tokens';
import { Text, BaseButton } from '@/design-system/components';
import { api } from '@/services/api';
import { useSessionContext } from '@/contexts/SessionContext';
import type { SessionWithToken } from '@/types/session';
import { usePush } from '@/contexts/PushContext';
import LoginModal from './auth/LoginModal';

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
  isToday,
  is_live,
  stream_url,
}) => {
  const { session } = useSessionContext();
  const typedSession = session as SessionWithToken | null;
  const { liveStatus } = useLiveStatus();
  const dynamic = liveStatus[id] ?? { is_live, stream_url };
  const isLive = dynamic.is_live;
  const streamUrl = dynamic.stream_url;
  const { pixelsPerMinute } = useLayoutValues();
  const { mode } = useThemeContext();
  const [isMobile, setIsMobile] = useState(false);
  const bellRef = useRef<HTMLButtonElement>(null);
  const [isOn, setIsOn] = useState(subscribed);
  const [isLoading, setIsLoading] = useState(false);
  const { openVideo, openPlaylist } = useYouTubePlayer();
  const { subscribeAndRegister } = usePush();
  const [openTooltip, setOpenTooltip] = useState(false);
  const openTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);

  useEffect(() => {
    setIsOn(subscribed);
  }, [subscribed]);

  // Detectar mobile
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMobile(/Mobi|Android/i.test(navigator.userAgent));
    }
  }, []);

  // Cálculo de posición y tamaño
  const [startHours, startMinutes] = start.split(':').map(Number);
  const [endHours, endMinutes] = end.split(':').map(Number);
  const minutesFromMidnightStart = startHours * 60 + startMinutes;
  const minutesFromMidnightEnd = endHours * 60 + endMinutes;
  const offsetPx = minutesFromMidnightStart * pixelsPerMinute;
  const duration = minutesFromMidnightEnd - minutesFromMidnightStart;
  const widthPx = duration * pixelsPerMinute - 1;

  const now = dayjs();
  const currentDate = now.format('YYYY-MM-DD');
  const parsedEndWithDate = dayjs(`${currentDate} ${end}`, 'YYYY-MM-DD HH:mm');
  const isPast = isToday && now.isAfter(parsedEndWithDate);

  // Manejo de click en YouTube
  const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!streamUrl) return;

    Clarity.setTag('program_name', name);
    Clarity.event(isLive ? 'click_youtube_live' : 'click_youtube_deferred');

    gaEvent({
      action: isLive ? 'click_youtube_live' : 'click_youtube_deferred',
      params: {
        category: 'program',
        program_name: name,
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
      try {
        pushSubscription = await subscribeAndRegister();
        if (pushSubscription) {
          endpoint = pushSubscription.endpoint;
          p256dh = arrayBufferToBase64(pushSubscription.getKey('p256dh'));
          auth = arrayBufferToBase64(pushSubscription.getKey('auth'));
        }
      } catch (error) {
        pushErrorReason = error instanceof Error ? error.message : 'Unknown error';
        console.warn('Failed to get push subscription:', error);
      }

      // Validate push subscription before sending to backend
      const isValidPush = !!(pushSubscription && endpoint && p256dh && auth);
      if (!isValidPush) {
        const reason = pushErrorReason || (!pushSubscription ? 'No subscription object' : 'Missing endpoint/keys');
        console.warn('Not sending invalid push subscription:', reason);
        gaEvent({
          action: 'push_subscription_invalid',
          params: {
            program_id: id,
            program_name: name,
            reason,
            endpoint,
            p256dh,
            auth,
            has_push: !!pushSubscription,
          },
          userData: typedSession?.user
        });
      }

      // Subscribe to program (only one request)
      await api.post(
        `/programs/${id}/subscribe`,
        { 
          notificationMethod: 'both',
          endpoint: isValidPush ? endpoint : undefined,
          p256dh: isValidPush ? p256dh : undefined,
          auth: isValidPush ? auth : undefined
        },
        {
          headers: { Authorization: `Bearer ${typedSession.accessToken}` },
        }
      );
      
      // Track subscription event
      gaEvent({
        action: 'program_subscribe',
        params: {
          program_id: id,
          program_name: name,
          notification_method: 'both',
          has_push: !!pushSubscription,
        },
        userData: typedSession?.user
      });
    } catch (error) {
      // Revert UI on error
      setIsOn(prevIsOn);
      alert('Error updating subscription. Please try again.');
      console.error('Error updating subscription:', error);
      
      // Track subscription error
      gaEvent({
        action: 'subscription_error',
        params: {
          action: willSubscribe ? 'subscribe' : 'unsubscribe',
          program_id: id,
          program_name: name,
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
  const handleTooltipOpen = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    if (!isMobile) {
      if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current);
      openTimeoutRef.current = setTimeout(() => {
        setOpenTooltip(true);
      }, 500);
    }
  };

  // Apertura inmediata al hacer click
  const handleTooltipClick = () => {
    // Cancelar cualquier timeout pendiente
    if (openTimeoutRef.current) {
      clearTimeout(openTimeoutRef.current);
      openTimeoutRef.current = null;
    }
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    // Abrir tooltip inmediatamente
    setOpenTooltip(!openTooltip);
  };

  // Cierre rápido
  const handleTooltipClose = () => {
    if (openTimeoutRef.current) {
      clearTimeout(openTimeoutRef.current);
      openTimeoutRef.current = null;
    }
    if (!isMobile) {
      closeTimeoutRef.current = setTimeout(() => {
        setOpenTooltip(false);
      }, 100);
    }
  };

  // Contenido del tooltip
  const tooltipContent = (
    <Box
      sx={{ p: tokens.spacing.sm }}
    >
      <Text variant="subtitle1" fontWeight={tokens.typography.fontWeight.bold} sx={{ color: '#fff !important' }}>
        {name}
      </Text>
      <Text variant="body2" sx={{ mt: tokens.spacing.sm, color: 'rgba(255,255,255,0.8) !important' }}>
        {start} - {end}
      </Text>
      {description && (
        <Text variant="body2" sx={{ mt: tokens.spacing.sm, color: 'rgba(255,255,255,0.8) !important' }}>
          {description}
        </Text>
      )}
      {panelists?.length ? (
        <Box sx={{ mt: tokens.spacing.sm }}>
          <Text variant="body2" fontWeight={tokens.typography.fontWeight.bold} sx={{ color: '#fff !important' }}>
            Panelistas:
          </Text>
          <Text variant="body2" sx={{ color: 'rgba(255,255,255,0.8) !important' }}>
            {panelists.map(p => p.name).join(', ')}
          </Text>
        </Box>
      ) : null}
      {streamUrl && (
        <BaseButton
          onClick={handleClick}
          onTouchStart={handleClick}
          variant="contained"
          size="small"
          startIcon={<OpenInNew />}
          className="youtube-button"
          sx={{
            mt: tokens.spacing.md,
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
          mt: tokens.spacing.md,
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
  );

  return (
    <ClickAwayListener onClickAway={
      (event) => {
        if (bellRef.current?.contains(event.target as Node)) {
          return;
        }
        if (isMobile) setOpenTooltip(false);
      }
    }>
      <>
        <Tooltip
          title={tooltipContent}
          arrow
          placement="top"
          open={openTooltip}
          onOpen={handleTooltipOpen}
          onClose={handleTooltipClose}
          disableTouchListener={isMobile}
          disableFocusListener={isMobile}
          PopperProps={{ onMouseEnter: handleTooltipOpen, onMouseLeave: handleTooltipClose }}
        >
          <Box
            className="program-block"
            onMouseEnter={handleTooltipOpen}
            onMouseLeave={handleTooltipClose}
            onClick={handleTooltipClick}
            style={{
              position: 'absolute',
              left: `${offsetPx}px`,
              width: `${widthPx}px`,
              height: '100%',
            }}
            height="100%"
            sx={{
              backgroundColor: isPast
                ? alpha(color, 0.05)
                : isLive
                  ? alpha(color, 0.3)
                  : alpha(color, 0.15),
              border: `1px solid ${isPast ? alpha(color, mode === 'light' ? 0.3 : 0.4) : color}`,
              borderRadius: tokens.borderRadius.sm,
              transition: `background-color ${tokens.transition.normal} ${tokens.transition.timing}`,
              cursor: 'pointer',
              overflow: 'hidden',
              boxShadow: tokens.boxShadow.sm,
              '&:hover': {
                backgroundColor: isPast
                  ? alpha(color, mode === 'light' ? 0.36 : 0.28)
                  : isLive
                    ? alpha(color, mode === 'light' ? 0.38 : 0.48)
                    : alpha(color, mode === 'light' ? 0.22 : 0.28),
                transform: 'scale(1.01)',
              },
            }}
          >
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
                  }}
                >
                  LIVE
                </Box>
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
                      fontSize: '0.75rem',
                      textAlign: 'center',
                      color: isPast ? alpha(color, 1) : color,
                    }}
                  >
                    {name.toUpperCase()}
                  </Typography>
                  {panelists && panelists.length > 0 && (!isMobile || (isMobile && widthPx > 120)) && (
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: '0.65rem',
                        textAlign: 'center',
                        color: isPast ? alpha(color, 0.8) : alpha(color, 0.8),
                        lineHeight: 1.2,
                        maxWidth: '100%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {panelists.map(p => p.name).join(', ')}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>
          </Box>
        </Tooltip>
        <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      </>
    </ClickAwayListener>
  );
};
