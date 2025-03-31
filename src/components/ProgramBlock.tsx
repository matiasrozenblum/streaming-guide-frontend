'use client';

import { Box, Tooltip, Typography, alpha, Button } from '@mui/material';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { useLayoutValues } from '../constants/layout';
import { OpenInNew } from '@mui/icons-material';
import { useThemeContext } from '@/contexts/ThemeContext';

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
}: Props) => {
  const { pixelsPerMinute } = useLayoutValues();
  const { mode } = useThemeContext();

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

  const handleClick = () => {
    if (!youtube_url) return;
    const url = youtube_url;
    const newTab = window.open(url, '_blank');
    newTab?.focus();
  };

  return (
    <Tooltip
      title={
        <Box sx={{ p: 1 }}>
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
      }
      arrow
      placement="top"
    >
      <Box
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
              }}
            >
              LIVE
            </Box>
          )}
          {logo_url ? (
            <Box
              component="img"
              src={logo_url}
              alt={name}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                opacity: isPast ? (mode === 'light' ? 0.5 : 0.4) : 1,
              }}
            />
          ) : (
            <Typography
              variant="caption"
              sx={{
                fontWeight: 'bold',
                fontSize: '0.75rem',
                textAlign: 'center',
                color: isPast ? alpha(color, mode === 'light' ? 0.5 : 0.6) : color,
              }}
            >
              {name}
            </Typography>
          )}
        </Box>
      </Box>
    </Tooltip>
  );
};