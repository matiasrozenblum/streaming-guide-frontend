'use client';

import { Box, Tooltip, Typography, alpha, Button } from '@mui/material';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { useLayoutValues } from '../constants/layout';
import { OpenInNew } from '@mui/icons-material';
import { useThemeContext } from '@/contexts/ThemeContext';
import { useState, useEffect, useRef } from 'react';
import { event as gaEvent } from '@/lib/gtag';

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
  youtube_url?: string;
  live_url?: string;
}

export const ProgramBlock = ({
  name,
  start,
  end,
  description,
  panelists,
  logo_url,
  color = '#2196F3',
  isToday,
  youtube_url,
  live_url,
}: Props) => {
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
  const parsedStartWithDate = dayjs(`${currentDate} ${start}`, 'YYYY-MM-DD HH:mm');
  const parsedEndWithDate = dayjs(`${currentDate} ${end}`, 'YYYY-MM-DD HH:mm');

  const isLive = isToday && now.isAfter(parsedStartWithDate) && now.isBefore(parsedEndWithDate);
  const isPast = isToday && now.isAfter(parsedEndWithDate);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!youtube_url) return;
    const url = isLive ? live_url : youtube_url;

    // Track GA event
    gaEvent({
      action: 'click_youtube',
      category: 'program',
      label: name,
      value: isLive ? 1 : 0,
    });

    const newTab = window.open(url, '_blank');
    newTab?.focus();
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
      {youtube_url && (
        <Button
          onClick={handleClick}
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
              gap: 1, // Adds spacing between the logo and the name
            }}
          >
            {logo_url && (
              <Box
                component="img"
                src={logo_url}
                alt={name}
                sx={{
                  width: '40px', // Adjust the size of the logo
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
                  textAlign: logo_url ? 'left' : 'center', // Align text differently if there's a logo
                  color: isPast ? alpha(color, mode === 'light' ? 0.5 : 0.6) : color,
                }}
              >
                {name.toUpperCase()}
              </Typography>
              {(panelists ?? []).length > 0 && (
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.65rem',
                    textAlign: logo_url ? 'left' : 'center', // Align text differently if there's a logo
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
                  {(panelists?.map((p) => p.name).join(', ')) ?? ''}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      </Box>
    </Tooltip>
  );
};