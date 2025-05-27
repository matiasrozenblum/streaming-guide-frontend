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
  const [openTooltip, setOpenTooltip] = useState(false);
  const bellRef = useRef<HTMLButtonElement>(null);
  const [isOn, setIsOn] = useState(subscribed);

  // Refs para controlar delay de apertura y cierre
  const openTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { openVideo, openPlaylist } = useYouTubePlayer();
  const { subscribeAndRegister } = usePush();

  useEffect(() => {
    setIsOn(subscribed);
  }, [subscribed]);

  // Detectar mobile
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMobile(/Mobi|Android/i.test(navigator.userAgent));
    }
  }, []);

  // Limpieza de timeouts al desmontar
  useEffect(() => {
    return () => {
      if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current);
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  // Apertura retardada 5s
  const handleTooltipOpen = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    if (!isMobile) {
      if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current);
      openTimeoutRef.current = setTimeout(() => {
        Clarity.setTag('program_name', name);
        Clarity.event(isLive ? 'open_tooltip_live' : 'open_tooltip_deferred');
        gaEvent(
          isLive ? 'open_tooltip_live' : 'open_tooltip_deferred',
          {
          category: 'tooltip',
          program_name: name,
        });
        setOpenTooltip(true);
      }, 500);
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
        setOpenTooltip(false);
      }, 100);
    }
  };

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

    gaEvent(
      isLive ? 'click_youtube_live' : 'click_youtube_deferred',
      {
      category: 'program',
      program_name: name,
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
      console.warn('No access token available');
      return;
    }

    try {
      const willSubscribe = !isOn;

      if (willSubscribe) {
        // Get push subscription details if needed
        let pushSubscription = null;
        try {
          pushSubscription = await subscribeAndRegister();
        } catch (error) {
          console.warn('Failed to get push subscription:', error);
        }

        // Subscribe to program
        await api.post(
          `/programs/${id}/subscribe`,
          { 
            notificationMethod: 'both',
            ...(pushSubscription && {
              endpoint: pushSubscription.endpoint,
              p256dh: btoa(String.fromCharCode.apply(null, 
                Array.from(new Uint8Array(pushSubscription.getKey('p256dh') || new ArrayBuffer(0)))
              )),
              auth: btoa(String.fromCharCode.apply(null, 
                Array.from(new Uint8Array(pushSubscription.getKey('auth') || new ArrayBuffer(0)))
              ))
            })
          },
          {
            headers: { Authorization: `Bearer ${typedSession.accessToken}` },
          }
        );
        setIsOn(true);
        console.log(`✅ Subscribed to ${name}`);
      } else {
        // Unsubscribe from program
        await api.delete(`/programs/${id}/subscribe`, {
          headers: { Authorization: `Bearer ${typedSession.accessToken}` },
        });
        setIsOn(false);
        console.log(`🚫 Unsubscribed from ${name}`);
      }
    } catch (error) {
      console.error('Error updating subscription:', error);
    }
  };

  // Contenido del tooltip
  const tooltipContent = (
    <Box
      sx={{ p: tokens.spacing.sm }}
      onMouseEnter={handleTooltipOpen}
      onMouseLeave={handleTooltipClose}
    >
      <Text variant="subtitle1" fontWeight={tokens.typography.fontWeight.bold} color="white">
        {name}
      </Text>
      <Text variant="body2" sx={{ mt: tokens.spacing.sm, color: 'rgba(255,255,255,0.9)' }}>
        {start} - {end}
      </Text>
      {description && (
        <Text variant="body2" sx={{ mt: tokens.spacing.sm, color: 'rgba(255,255,255,0.9)' }}>
          {description}
        </Text>
      )}
      {panelists?.length ? (
        <Box sx={{ mt: tokens.spacing.sm }}>
          <Text variant="body2" fontWeight={tokens.typography.fontWeight.bold} color="white">
            Panelistas:
          </Text>
          <Text variant="body2" color="rgba(255,255,255,0.9)">
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
      >
        {isOn ? <Notifications color="primary" /> : <Notifications color="disabled" />}
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
          onClick={() => isMobile && setOpenTooltip(!openTooltip)}
          position="absolute"
          left={`${offsetPx}px`}
          width={`${widthPx}px`}
          height="100%"
          sx={{
            backgroundColor: alpha(color, isPast ? 0.05 : isLive ? (mode === 'light' ? 0.2 : 0.3) : (mode === 'light' ? 0.1 : 0.15)),
            border: `1px solid ${isPast ? alpha(color, mode === 'light' ? 0.3 : 0.4) : color}`,
            borderRadius: tokens.borderRadius.sm,
            transition: `all ${tokens.transition.normal} ${tokens.transition.timing}`,
            cursor: 'pointer',
            overflow: 'hidden',
            boxShadow: tokens.boxShadow.sm,
            '&:hover': {
              backgroundColor: alpha(color, isPast ? (mode === 'light' ? 0.1 : 0.15) : isLive ? (mode === 'light' ? 0.3 : 0.4) : (mode === 'light' ? 0.2 : 0.25)),
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
                    color: isPast ? alpha(color, mode === 'light' ? 0.5 : 0.6) : color,
                  }}
                >
                  {name.toUpperCase()}
                </Typography>
                {panelists && panelists.length > 0 && (
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '0.65rem',
                      textAlign: 'center',
                      color: isPast ? alpha(color, mode === 'light' ? 0.4 : 0.5) : alpha(color, 0.8),
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
    </ClickAwayListener>
  );
};
