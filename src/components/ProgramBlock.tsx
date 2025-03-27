import { Box, Tooltip } from '@mui/material';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { PIXELS_PER_MINUTE, CHANNEL_LABEL_WIDTH } from '@/constants/layout';

dayjs.extend(customParseFormat);

interface Props {
  name: string;
  start: string;
  end: string;
  description?: string;
  panelists?: { id: string; name: string }[];
  logo_url?: string;
  color?: string;
}

const BLOCK_SPACING = 2;

export const ProgramBlock = ({
  name,
  start,
  end,
  description,
  panelists,
  logo_url,
  color = '#1976d2',
}: Props) => {
  const parsedStart = dayjs(start, 'HH:mm');
  const parsedEnd = dayjs(end, 'HH:mm');

  const duration = parsedEnd.diff(parsedStart, 'minute');
  const offset = parsedStart.diff(dayjs().startOf('day'), 'minute'); // ahora desde 00:00

  const widthPx = duration * PIXELS_PER_MINUTE - 1;
  const offsetPx = offset * PIXELS_PER_MINUTE;

  console.log(`🧱 ${name}: start=${start}, end=${end}, duration=${duration}min, offset=${offset}px`);

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
        height="40px"
        bgcolor={color}
        color="white"

        borderRadius={1}
        display="flex"
        alignItems="center"
        fontSize={12}
        overflow="hidden"
        whiteSpace="nowrap"
      >
        {logo_url && (
          <Box
            component="img"
            src={logo_url}
            alt={name}
            sx={{
              height: '100%',
              marginRight: 1,
              borderRadius: '4px',
            }}
          />
        )}
        {name}
      </Box>
    </Tooltip>
  );
};