'use client';

import React from 'react';
import { Box, Tooltip, Typography, alpha, Button } from '@mui/material';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { useLayoutValues } from '../constants/layout';
import { OpenInNew } from '@mui/icons-material';
import { useThemeContext } from '@/contexts/ThemeContext';
import { useState, useEffect, useRef } from 'react';
import { event as gaEvent } from '@/lib/gtag';
import { useLiveStatus } from '@/contexts/LiveStatusContext';

dayjs.extend(customParseFormat);

interface Props {
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
  onYouTubeClick?: (url: string) => void;
}

export const ProgramBlock: React.FC<Props> = ({
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
  onYouTubeClick,
}) => {
  const { pixelsPerMinute } = useLayoutValues();
  const { mode } = useThemeContext();
  const [isMobile, setIsMobile] = useState(false);
  const [openTooltip, setOpenTooltip] = useState(false);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMobile(/Mobi|Android/i.test(navigator.userAgent));
    }
  }, []);

  useEffect(() => {
    if (isMobile && openTooltip) {
      const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
        // Check if the click is outside the program block
        if (!event.target || !(event.target as HTMLElement).closest('.program-block')) {
          setOpenTooltip(false);
        }
      };
  
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
  
      return () => {
        document.removeEventListener('mousedown', handleOutsideClick);
        document.removeEventListener('touchstart', handleOutsideClick);
      };
    }
  }, [isMobile, openTooltip]);

  const [startHours, startMinutes] = start.split(':').map(Number);
  const [endHours, endMinutes] = end.split(':').map(Number);
  const minutesFromMidnightStart = (startHours * 60) + startMinutes;
  const minutesFromMidnightEnd = (endHours * 60) + endMinutes;

  const offsetPx = (minutesFromMidnightStart * pixelsPerMinute);
  const duration = minutesFromMidnightEnd - minutesFromMidnightStart;
  const widthPx = duration * pixelsPerMinute - 1;

  const now = dayjs();
  const currentDate = now.format('YYYY-MM-DD');
  const parsedEndWithDate = dayjs(`${currentDate} ${end}`, 'YYYY-MM-DD HH:mm');

  const isPast = isToday && now.isAfter(parsedEndWithDate);

  const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!stream_url) return;

    // Track GA event
    gaEvent({
      action: 'click_youtube',
      category: 'program',
      label: name,
      value: is_live ? 1 : 0,
    });

    console.log('ProgramBlock - URL being passed:', stream_url);
    onYouTubeClick?.(stream_url);
  };

  const handleTooltipOpen = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    if (!isMobile) {
      setOpenTooltip(true);
    }
  };

  const handleTooltipClose = () => {
    if (!isMobile) {
      closeTimeoutRef.current = setTimeout(() => {
        setOpenTooltip(false);
      }, 100);
    }
  };

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
            {panelists.map((p) => p.name).join(', ')}
          </Typography>
        </Box>
      ) : null}
      {stream_url && (
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
            touchAction: 'manipulation', // Optimize for touch
          }}
        >
          {is_live ? 'Ver en vivo' : 'Ver en YouTube'}
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
      PopperProps={{
        onMouseEnter: handleTooltipOpen,
        onMouseLeave: handleTooltipClose,
      }}
    >
      <Box
        onMouseEnter={handleTooltipOpen}
        onMouseLeave={handleTooltipClose}
        onClick={() => isMobile && setOpenTooltip(!openTooltip)}
        position="absolute"
        left={`${offsetPx}px`}
        width={`${widthPx}px`}
        height="100%"
        sx={{
          backgroundColor: alpha(color, isPast ? 0.05 : is_live ? (mode === 'light' ? 0.2 : 0.3) : (mode === 'light' ? 0.1 : 0.15)),
          border: `1px solid ${isPast ? alpha(color, mode === 'light' ? 0.3 : 0.4) : color}`,
          borderRadius: 1,
          transition: 'all 0.2s ease-in-out',
          cursor: 'pointer',
          overflow: 'hidden',
          '&:hover': {
            backgroundColor: alpha(color, isPast ? (mode === 'light' ? 0.1 : 0.15) : is_live ? (mode === 'light' ? 0.3 : 0.4) : (mode === 'light' ? 0.2 : 0.25)),
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
          {is_live && (
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