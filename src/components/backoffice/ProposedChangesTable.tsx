'use client';

import { useState, useEffect } from 'react';
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
import { useSessionContext } from '@/contexts/SessionContext';

interface ProgramChangeData {
  name?: string;
  logo_url?: string;
}

interface ScheduleChangeData {
  day_of_week?: string;
  start_time?: string;
  end_time?: string;
}

type ChangeData = ProgramChangeData | ScheduleChangeData;

interface ProposedChange {
  id: number;
  channelName: string;
  programName: string;
  action: 'create' | 'update' | 'delete';
  entityType: 'program' | 'schedule';
  before?: ChangeData;
  after: ChangeData;
}

const FIELD_LABELS: Record<string, string> = {
  day_of_week: 'Día',
  start_time: 'Inicio',
  end_time: 'Fin',
  name: 'Nombre',
  logo_url: 'Logo',
};

export default function ProposedChangesTable() {
  // Forzar sesión y redirigir si no autenticado
  const { session, status } = useSessionContext();

  const [changes, setChanges] = useState<ProposedChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'authenticated' && session?.user.role === 'admin') {
      fetchChanges();
    }
  }, [status, session?.user.role]);

  const fetchChanges = async () => {
    try {
      setLoading(true);
      const response = await api.get<ProposedChange[]>('/proposed-changes', { headers: { Authorization: `Bearer ${session?.accessToken}` } });
      setChanges(response.data);
    } catch (err: unknown) {
      console.error('Error fetching proposed changes:', err);
      setError('Error al cargar cambios propuestos');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: number, action: 'approve' | 'reject') => {
    try {
      await api.post(`/proposed-changes/${id}/${action}`, null, { headers: { Authorization: `Bearer ${session?.accessToken}` } });
      setSuccess(`Cambio ${action === 'approve' ? 'aprobado' : 'rechazado'} correctamente`);
      fetchChanges();
    } catch (err: unknown) {
      console.error(`Error trying to ${action} change:`, err);
      setError(`Error al ${action === 'approve' ? 'aprobar' : 'rechazar'} el cambio`);
    }
  };

  const renderBeforeField = (field: string, beforeValue?: string, afterValue?: string) => {
    const isDifferent = beforeValue !== afterValue;
    const label = FIELD_LABELS[field] || field;
    return (
      <Typography variant="body2" sx={{ color: isDifferent ? 'error.main' : 'text.primary' }}>
        <strong>{label}:</strong> {beforeValue ?? '-'}
      </Typography>
    );
  };

  const renderAfterField = (field: string, beforeValue?: string, afterValue?: string) => {
    const isDifferent = beforeValue !== afterValue;
    const label = FIELD_LABELS[field] || field;
    return (
      <Typography variant="body2" sx={{ color: isDifferent ? 'success.main' : 'text.primary' }}>
        <strong>{label}:</strong> {afterValue ?? '-'}
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
                        {change.entityType === 'schedule' ? (
                          <>
                            {renderBeforeField(
                              'day_of_week',
                              (change.before as ScheduleChangeData)?.day_of_week,
                              (change.after as ScheduleChangeData)?.day_of_week
                            )}
                            {renderBeforeField(
                              'start_time',
                              (change.before as ScheduleChangeData)?.start_time,
                              (change.after as ScheduleChangeData)?.start_time
                            )}
                            {renderBeforeField(
                              'end_time',
                              (change.before as ScheduleChangeData)?.end_time,
                              (change.after as ScheduleChangeData)?.end_time
                            )}
                          </>
                        ) : (
                          <>
                            {renderBeforeField(
                              'name',
                              (change.before as ProgramChangeData)?.name,
                              (change.after as ProgramChangeData)?.name
                            )}
                            {renderBeforeField(
                              'logo_url',
                              (change.before as ProgramChangeData)?.logo_url,
                              (change.after as ProgramChangeData)?.logo_url
                            )}
                          </>
                        )}
                      </Box>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {change.after ? (
                      <Box sx={{ whiteSpace: 'pre-line' }}>
                        {change.entityType === 'schedule' ? (
                          <>
                            {renderAfterField(
                              'day_of_week',
                              (change.before as ScheduleChangeData)?.day_of_week,
                              (change.after as ScheduleChangeData)?.day_of_week
                            )}
                            {renderAfterField(
                              'start_time',
                              (change.before as ScheduleChangeData)?.start_time,
                              (change.after as ScheduleChangeData)?.start_time
                            )}
                            {renderAfterField(
                              'end_time',
                              (change.before as ScheduleChangeData)?.end_time,
                              (change.after as ScheduleChangeData)?.end_time
                            )}
                          </>
                        ) : (
                          <>
                            {renderAfterField(
                              'name',
                              (change.before as ProgramChangeData)?.name,
                              (change.after as ProgramChangeData)?.name
                            )}
                            {renderAfterField(
                              'logo_url',
                              (change.before as ProgramChangeData)?.logo_url,
                              (change.after as ProgramChangeData)?.logo_url
                            )}
                          </>
                        )}
                      </Box>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      onClick={() => handleAction(change.id, 'approve')}
                      color="success"
                    >
                      <Check />
                    </IconButton>
                    <IconButton
                      onClick={() => handleAction(change.id, 'reject')}
                      color="error"
                    >
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