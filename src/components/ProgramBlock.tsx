import { Box, Tooltip, Typography, alpha } from '@mui/material';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { PIXELS_PER_MINUTE } from '../constants/layout';

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
}

export const ProgramBlock = ({
  name,
  start,
  end,
  description,
  panelists,
  logo_url,
  color = '#2196F3',
  channelName,
  isToday,
}: Props) => {
  // Para posicionamiento en la grilla (desde las 00:00)
  const parsedStart = dayjs(start, 'HH:mm');
  const parsedEnd = dayjs(end, 'HH:mm');
  const offset = parsedStart.diff(dayjs().startOf('day'), 'minute');
  const duration = parsedEnd.diff(parsedStart, 'minute');
  const offsetPx = offset * PIXELS_PER_MINUTE;
  const widthPx = duration * PIXELS_PER_MINUTE - 1;
  console.log('name', name, 'parsedStart', parsedStart, 'offset', offset, 'duration', duration, 'offsetPx', offsetPx, 'widthPx', widthPx);

  // Para lógica real con fecha actual
  const parsedStartWithDate = dayjs(`${dayjs().format('YYYY-MM-DD')} ${start}`, 'YYYY-MM-DD HH:mm');
  const parsedEndWithDate = dayjs(`${dayjs().format('YYYY-MM-DD')} ${end}`, 'YYYY-MM-DD HH:mm');
  const now = dayjs();
  const isLive = isToday && now.isAfter(parsedStartWithDate) && now.isBefore(parsedEndWithDate);
  const isPast = isToday && now.isAfter(parsedEndWithDate);

  return (
    <Tooltip
      title={
        <Box sx={{ p: 1 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            {name}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            {start} - {end}
          </Typography>
          {description && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              {description}
            </Typography>
          )}
          {panelists?.length ? (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" fontWeight="bold">
                Panelistas:
              </Typography>
              <Typography variant="body2">
                {panelists.map((p) => p.name).join(', ')}
              </Typography>
            </Box>
          ) : null}
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
          backgroundColor: alpha(color, isPast ? 0.05 : isLive ? 0.2 : 0.1),
          border: `1px solid ${isPast ? alpha(color, 0.3) : color}`,
          borderRadius: 1,
          transition: 'all 0.2s ease-in-out',
          cursor: 'pointer',
          overflow: 'hidden',
          '&:hover': {
            backgroundColor: alpha(color, isPast ? 0.1 : isLive ? 0.3 : 0.2),
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
                opacity: isPast ? 0.5 : 1,
              }}
            />
          ) : (
            <Typography
              variant="caption"
              sx={{
                fontWeight: 'bold',
                fontSize: '0.75rem',
                textAlign: 'center',
                color: isPast ? alpha(color, 0.5) : color,
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