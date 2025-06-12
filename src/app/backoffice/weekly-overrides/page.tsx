'use client';

import { Box, Container, Typography } from '@mui/material';
import ProtectedRoute from '@/components/ProtectedRoute';
import { WeeklyOverridesTable } from '@/components/backoffice/WeeklyOverridesTable';

export default function WeeklyOverridesPage() {
  return (
    <ProtectedRoute>
      <Container maxWidth="xl">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Gestión de Cambios Semanales
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Modifica horarios de manera temporal para la semana actual o próxima. 
            Los cambios se resetean automáticamente cada domingo.
          </Typography>
          <WeeklyOverridesTable />
        </Box>
      </Container>
    </ProtectedRoute>
  );
} 