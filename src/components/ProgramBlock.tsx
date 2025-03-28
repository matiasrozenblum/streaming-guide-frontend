import { Box, Tooltip, Typography } from '@mui/material';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { PIXELS_PER_MINUTE } from '@/constants/layout';

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
}

export const ProgramBlock = ({
  name,
  start,
  end,
  description,
  panelists,
  logo_url,
  channelName,
}: Props) => {
  const parsedStart = dayjs(start, 'HH:mm');
  const parsedEnd = dayjs(end, 'HH:mm');

  const duration = parsedEnd.diff(parsedStart, 'minute');
  const offset = parsedStart.diff(dayjs().startOf('day'), 'minute');

  const widthPx = duration * PIXELS_PER_MINUTE - 1;
  const offsetPx = offset * PIXELS_PER_MINUTE;

  const isVorterix = !logo_url && channelName === 'Vorterix';

  return (
    <Tooltip
      title={
        <>
          <strong>{name}</strong>
          <br />
          {description}
          {panelists?.length ? (
            <>
              <br />
              <strong>Panelistas:</strong>
              <br />
              {panelists.map((p) => p.name).join(', ')}
            </>
          ) : null}
        </>
      }
      arrow
      placement="top"
    >
      <Box
        position="absolute"
        left={`${offsetPx}px`}
        width={`${widthPx}px`}
        height="60px"
        overflow="hidden"
        borderRadius={1}
        sx={
          isVorterix
            ? {
                backgroundColor: 'rgba(78, 38, 180, 0.1)',
                border: '1px solid rgb(78, 38, 180)',
                borderRadius: '12px',
                fontFamily:
                  'ui-sans-serif, system-ui, -apple-system, "system-ui", "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
              }
            : undefined
        }
      >
        {logo_url ? (
          <Box
            component="img"
            src={logo_url}
            alt={name}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: 'inherit',
            }}
          />
        ) : isVorterix ? (
          <Typography variant="caption" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>
            {name}
          </Typography>
        ) : null}
      </Box>
    </Tooltip>
  );
};