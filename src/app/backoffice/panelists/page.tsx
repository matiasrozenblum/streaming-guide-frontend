'use client';

import { Box, Typography } from '@mui/material';
import ProtectedRoute from '@/components/ProtectedRoute';
import PanelistsTable from '@/components/backoffice/PanelistsTable';

export default function PanelistsPage() {
  return (
    <ProtectedRoute>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Panelistas
        </Typography>
        <PanelistsTable onError={(error) => console.error(error)} />
      </Box>
    </ProtectedRoute>
  );
} 