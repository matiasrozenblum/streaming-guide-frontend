'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Snackbar,
  Alert,
  Typography,
  CircularProgress,
} from '@mui/material';
import { Check, Close } from '@mui/icons-material';
import { api } from '@/services/api';

interface ProposedChange {
  id: number;
  channelName: string;
  programName: string;
  action: 'create' | 'update' | 'delete';
  before?: any;
  after: any;
}

export default function ProposedChangesTable() {
  const [changes, setChanges] = useState<ProposedChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchChanges();
  }, []);

  const fetchChanges = async () => {
    try {
      setLoading(true);
      const cookies = document.cookie.split(';');
      const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('backoffice_token='));
      const token = tokenCookie?.split('=')[1];

      const response = await api.get('/proposed-changes', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setChanges(response.data);
    } catch (err) {
      console.error('Error fetching proposed changes:', err);
      setError('Error al cargar cambios propuestos');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: number, action: 'approve' | 'reject') => {
    try {
      const cookies = document.cookie.split(';');
      const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('backoffice_token='));
      const token = tokenCookie?.split('=')[1];

      await api.post(`/proposed-changes/${id}/${action}`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setSuccess(`Cambio ${action === 'approve' ? 'aprobado' : 'rechazado'} correctamente`);
      fetchChanges();
    } catch (err) {
      console.error(`Error trying to ${action} change:`, err);
      setError(`Error al ${action === 'approve' ? 'aprobar' : 'rechazar'} el cambio`);
    }
  };

  const renderBeforeField = (field: string, beforeValue: any, afterValue: any) => {
    const isDifferent = beforeValue !== afterValue;
    return (
      <Typography variant="body2" sx={{ color: isDifferent ? 'error.main' : 'text.primary' }}>
        <strong>{field}:</strong> {beforeValue ?? '-'}
      </Typography>
    );
  };

  const renderAfterField = (field: string, beforeValue: any, afterValue: any) => {
    const isDifferent = beforeValue !== afterValue;
    return (
      <Typography variant="body2" sx={{ color: isDifferent ? 'success.main' : 'text.primary' }}>
        <strong>{field}:</strong> {afterValue ?? '-'}
      </Typography>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Canal</TableCell>
              <TableCell>Programa</TableCell>
              <TableCell>Acción</TableCell>
              <TableCell>Antes</TableCell>
              <TableCell>Después</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {changes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No hay cambios propuestos.
                </TableCell>
              </TableRow>
            ) : (
              changes.map((change) => (
                <TableRow key={change.id}>
                  <TableCell>{change.channelName}</TableCell>
                  <TableCell>{change.programName}</TableCell>
                  <TableCell>{change.action}</TableCell>
                  <TableCell>
                    {change.before ? (
                      <Box sx={{ whiteSpace: 'pre-line' }}>
                        {renderBeforeField('Día', change.before.day_of_week, change.after?.day_of_week)}
                        {renderBeforeField('Inicio', change.before.start_time, change.after?.start_time)}
                        {renderBeforeField('Fin', change.before.end_time, change.after?.end_time)}
                      </Box>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {change.after ? (
                      <Box sx={{ whiteSpace: 'pre-line' }}>
                        {renderAfterField('Día', change.before?.day_of_week, change.after.day_of_week)}
                        {renderAfterField('Inicio', change.before?.start_time, change.after.start_time)}
                        {renderAfterField('Fin', change.before?.end_time, change.after.end_time)}
                      </Box>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleAction(change.id, 'approve')} color="success">
                      <Check />
                    </IconButton>
                    <IconButton onClick={() => handleAction(change.id, 'reject')} color="error">
                      <Close />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Snackbar
        open={!!error || !!success}
        autoHideDuration={6000}
        onClose={() => {
          setError(null);
          setSuccess(null);
        }}
      >
        <Alert
          onClose={() => {
            setError(null);
            setSuccess(null);
          }}
          severity={error ? 'error' : 'success'}
          sx={{ width: '100%' }}
        >
          {error || success}
        </Alert>
      </Snackbar>
    </Box>
  );
}
