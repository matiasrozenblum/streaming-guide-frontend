'use client';

import React from 'react';
import { Box, Tooltip, Typography, alpha, Button } from '@mui/material';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { useLayoutValues } from '@/constants/layout';
import { OpenInNew } from '@mui/icons-material';
import { useThemeContext } from '@/contexts/ThemeContext';
import { useYouTubePlayer } from '@/contexts/YouTubeGlobalPlayerContext';
import { useState, useEffect, useRef } from 'react';
import { event as gaEvent } from '@/lib/gtag';
import { extractVideoId } from '@/utils/extractVideoId';
import { useLiveStatus } from '@/contexts/LiveStatusContext';

dayjs.extend(customParseFormat);

interface Props {
  id: string;
  name: string;
  start: string;
  end: string;
  description?: string;
  panelists?: { id: string; name: string }[];
  logo_url?: string;
  color?: string;
  channelName?: string;
  isToday?: boolean;
  is_live?: boolean;
  stream_url?: string | null;
}

// Define a type for elements with setOpenTooltip method
type TooltipBlockElement = HTMLElement & {
  setOpenTooltip: (open: boolean) => void;
};

export const ProgramBlock: React.FC<Props> = ({
  id,
  name,
  start,
  end,
  description,
  panelists,
  logo_url,
  color = '#2196F3',
  isToday,
  is_live,
  stream_url,
}) => {
  const { liveStatus } = useLiveStatus();
  const dynamic = liveStatus[id] ?? { is_live, stream_url };
  const isLive = dynamic.is_live;
  const streamUrl = dynamic.stream_url;
  const { pixelsPerMinute } = useLayoutValues();
  const { mode } = useThemeContext();
  const [isMobile, setIsMobile] = useState(false);
  const [openTooltip, setOpenTooltip] = useState(false);

  // Refs para controlar delay de apertura y cierre
  const openTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { openVideo, openPlaylist } = useYouTubePlayer();

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
  const handleTooltipOpen = (event: React.SyntheticEvent) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    if (!isMobile) {
      if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current);
      const currentTarget = event.currentTarget;
      openTimeoutRef.current = setTimeout(() => {
        // Close other tooltips
        document.querySelectorAll('.program-block').forEach(block => {
          if (block !== currentTarget) {
            const blockComponent = block as TooltipBlockElement;
            if (blockComponent.setOpenTooltip) {
              blockComponent.setOpenTooltip(false);
            }
          }
        });
        setOpenTooltip(true);
      }, 500);
    }
  };

  // Add event listener for clicks outside the tooltip
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (openTooltip && target && !target.closest('.program-block') && !target.closest('.MuiTooltip-popper')) {
        setOpenTooltip(false);
      }
    };

    if (isMobile) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      if (isMobile) {
        document.removeEventListener('click', handleClickOutside);
      }
    };
  }, [openTooltip, isMobile]);

  // Update handleTooltipClose to not handle mobile
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

    gaEvent({
      action: 'click_youtube',
      category: 'program',
      label: name,
      value: isLive ? 1 : 0,
    });

    // Si la URL tiene un parámetro "list", es una playlist
    try {
      const url = new URL(streamUrl);
      const listId = url.searchParams.get('list');
      if (listId) {
        // Abrimos la playlist embebida
        openPlaylist(listId);
        return;
      }
    } catch {
      // stream_url podría no ser una URL válida, ignoramos
    }

    // Si no es playlist, extraemos videoId normal
    const videoId = extractVideoId(streamUrl);
    if (videoId) {
      openVideo(videoId);
    }
  };

  // Contenido del tooltip
  const tooltipContent = (
    <Box
      sx={{ p: 1 }}
      onMouseEnter={handleTooltipOpen}
      onMouseLeave={handleTooltipClose}
    >
      <Typography variant="subtitle1" fontWeight="bold" color="white">
        {name}
      </Typography>
      <Typography variant="body2" sx={{ mt: 1, color: 'rgba(255,255,255,0.9)' }}>
        {start} - {end}
      </Typography>
      {description && (
        <Typography variant="body2" sx={{ mt: 1, color: 'rgba(255,255,255,0.9)' }}>
          {description}
        </Typography>
      )}
      {panelists?.length ? (
        <Box sx={{ mt: 1 }}>
          <Typography variant="body2" fontWeight="bold" color="white">
            Panelistas:
          </Typography>
          <Typography variant="body2" color="rgba(255,255,255,0.9)">
            {panelists.map(p => p.name).join(', ')}
          </Typography>
        </Box>
      ) : null}
      {streamUrl && (
        <Button
          onClick={handleClick}
          onTouchStart={handleClick}
          variant="contained"
          size="small"
          startIcon={<OpenInNew />}
          className="youtube-button"
          sx={{
            mt: 2,
            backgroundColor: '#FF0000',
            '&:hover': { backgroundColor: '#cc0000' },
            fontWeight: 'bold',
            textTransform: 'none',
            fontSize: '0.8rem',
            boxShadow: 'none',
            touchAction: 'manipulation',
          }}
        >
          {isLive ? 'Ver en vivo' : 'Ver en YouTube'}
        </Button>
      )}
    </Box>
  );

  return (
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
          borderRadius: 1,
          transition: 'all 0.2s ease-in-out',
          cursor: 'pointer',
          overflow: 'hidden',
          '&:hover': {
            backgroundColor: alpha(color, isPast ? (mode === 'light' ? 0.1 : 0.15) : isLive ? (mode === 'light' ? 0.3 : 0.4) : (mode === 'light' ? 0.2 : 0.25)),
            transform: 'scale(1.01)',
          },
        }}
      >
        <Box
          sx={{
            p: 1,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          {isLive && (
            <Box
              sx={{
                position: 'absolute',
                top: 4,
                right: 4,
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
                alignItems: logo_url ? 'flex-start' : 'center', // Align text differently if there's a logo
                gap: 0.5,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 'bold',
                  fontSize: '0.75rem',
                  textAlign: logo_url ? 'left' : 'center',
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
                    textAlign: logo_url ? 'left' : 'center',
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
  );
};