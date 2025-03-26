import { Box, Typography } from '@mui/material';
import { TimeHeader } from './TimeHeader';
import { ScheduleRow } from './ScheduleRow';
import { NowIndicator } from './NowIndicator';
import { Channel } from '@/types/channel';
import { Program } from '@/types/program';

interface Props {
  channels: Channel[];
  programs: Program[];
}

export const ScheduleGrid = ({ channels, programs }: Props) => {
  // agrupamos programas por canal
  const getProgramsForChannel = (channelId: string) =>
    programs.filter((p) => p.channelId === channelId);
  console.log('channels:', channels);
  console.log('programs:', programs);

  if (!channels.length || !programs.length) {
    return <Typography sx={{ mt: 4 }}>Sin datos disponibles</Typography>;
  }
  return (
    <Box position="relative">
      <TimeHeader />
      <NowIndicator /> {/* ⏱ línea roja en tiempo real */}
      {channels.map((channel, index) => (
        <ScheduleRow
        key={channel.id}
        channelName={channel.name}
        channelLogo={channel.logo_url}
        programs={getProgramsForChannel(channel.id).map((p) => ({
          id: p.id,
          name: p.name,
          start_time: p.startTime.slice(0, 5),
          end_time: p.endTime.slice(0, 5),
          description: p.description,
        }))}
        color={getColorForChannel(index)}
      />
      ))}
    </Box>
  );
};