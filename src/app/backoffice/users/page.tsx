'use client';

import { Box, Container, Typography } from '@mui/material';
import ProtectedRoute from '@/components/ProtectedRoute';
import { UsersTable } from '@/components/backoffice/UsersTable';

export default function UsersPage() {
  return (
    <ProtectedRoute>
      <Container maxWidth="xl">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Gestión de Usuarios
          </Typography>
          <UsersTable />
        </Box>
      </Container>
    </ProtectedRoute>
  );
} 