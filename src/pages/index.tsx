import { useEffect, useState } from 'react';
import { Container, Typography, Box, CircularProgress } from '@mui/material';
import { api } from '@/services/api';
import { Schedule } from '@/types/schedule';
import { ScheduleGrid } from '@/components/ScheduleGrid';

export default function Home() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/schedules')
      .then((res) => {
        console.log('📦 Schedules from backend:', res.data);
        setSchedules(res.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  // Obtener canales únicos a partir de los schedules
  const channels = Array.from(
    new Map(
      schedules.map((s) => [s.program.channel.id, s.program.channel])
    ).values()
  );

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
        <ScheduleGrid channels={channels} schedules={schedules} />
      )}
    </Container>
  );
}