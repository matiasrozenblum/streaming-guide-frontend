'use client';

import { Box, Container, Typography } from '@mui/material';
import ProtectedRoute from '@/components/ProtectedRoute';
import { WeeklyOverridesTable } from '@/components/backoffice/WeeklyOverridesTable';

export default function WeeklyOverridesPage() {
  return (
    <ProtectedRoute>
      <Container maxWidth="xl">
        <Box sx={{ my: 4, background: 'linear-gradient(135deg,#f8fafc 0%,#e2e8f0 100%)' }}>
          <Typography variant="h4" color="text.primary" component="h1" gutterBottom>
            Gestión de Cambios Semanales
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary', fontWeight: 500 }}>
            Modifica horarios de manera temporal para la semana actual o próxima. 
            Los cambios se resetean automáticamente cada domingo.
          </Typography>
          <WeeklyOverridesTable />
        </Box>
      </Container>
    </ProtectedRoute>
  );
} 