'use client';

import { Box, Container, Typography } from '@mui/material';
import ProtectedRoute from '@/components/ProtectedRoute';
import { SchedulesTable } from '@/components/backoffice/SchedulesTable';

export default function SchedulesPage() {
  return (
    <ProtectedRoute>
      <Container maxWidth="xl">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Gestión de Horarios
          </Typography>
          <SchedulesTable />
        </Box>
      </Container>
    </ProtectedRoute>
  );
} 