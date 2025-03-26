import { useEffect, useState } from 'react';
import { Container, Typography, Box, CircularProgress } from '@mui/material';
import { api } from '@/services/api';
import { Channel } from '@/types/channel';
import { Program } from '@/types/program';
import { ScheduleGrid } from '@/components/ScheduleGrid';

export default function Home() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  Promise.all([
    api.get('/channels'),
    api.get('/programs'),
  ])
    .then(([channelsRes, programsRes]) => {
      setChannels(channelsRes.data);

      setPrograms(programsRes.data.map((p: any) => ({
        ...p,
        channelId: p.channel_id,
        startTime: p.start_time,
        endTime: p.end_time,
      })));
    })
    .catch((err) => console.error(err))
    .finally(() => setLoading(false));
}, []);useEffect(() => {
  Promise.all([
    api.get('/channels'),
    api.get('/programs'),
  ])
    .then(([channelsRes, programsRes]) => {
      setChannels(channelsRes.data);
      console.log('🧪 Raw programs data from backend:', programsRes.data);
      setPrograms(programsRes.data.map((p: any) => ({
        ...p,
        channelId: p.channel?.id,
        startTime: p.start_time,
        endTime: p.end_time,
      })));
    })
    .catch((err) => console.error(err))
    .finally(() => setLoading(false));
}, []);

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" component="h1" gutterBottom>
        Streaming Guide
      </Typography>

      {loading ? (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : (
        <ScheduleGrid channels={channels} programs={programs} />
      )}
    </Container>
  );
}