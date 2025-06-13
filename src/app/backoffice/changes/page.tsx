'use client';

import { Box, Container, Typography } from '@mui/material';
import ProtectedRoute from '@/components/ProtectedRoute';
import ProposedChangesTable from '@/components/backoffice/ProposedChangesTable';

export default function ChangesPage() {
  return (
    <ProtectedRoute>
      <Container maxWidth="xl">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" color="text.primary" component="h1" gutterBottom>
            Cambios Propuestos
          </Typography>
          <ProposedChangesTable />
        </Box>
      </Container>
    </ProtectedRoute>
  );
}
