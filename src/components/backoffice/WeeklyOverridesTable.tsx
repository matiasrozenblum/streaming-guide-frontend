'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Typography,
  Chip,
  Snackbar,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  Grid,
} from '@mui/material';
import {
  Add,
  Delete,
  Refresh,
  Schedule,
  Cancel,
  AccessTime,
  SwapHoriz,
  Analytics,
  Settings,
} from '@mui/icons-material';
import { useSessionContext } from '@/contexts/SessionContext';
import type { SessionWithToken } from '@/types/session';
import type { Schedule as ScheduleType } from '@/types/schedule';
import { useTheme } from '@mui/material/styles';

// Types
interface WeeklyOverride {
  id: string;
  scheduleId: number;
  weekStartDate: string;
  overrideType: 'cancel' | 'time_change' | 'reschedule';
  newStartTime?: string;
  newEndTime?: string;
  newDayOfWeek?: string;
  reason?: string;
  createdBy?: string;
  expiresAt: string;
  createdAt: string;
}

interface WeeklyStats {
  weekStart: string;
  totalOverrides: number;
  byType: {
    cancel: number;
    time_change: number;
    reschedule: number;
  };
}

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Lunes' },
  { value: 'tuesday', label: 'Martes' },
  { value: 'wednesday', label: 'Miércoles' },
  { value: 'thursday', label: 'Jueves' },
  { value: 'friday', label: 'Viernes' },
  { value: 'saturday', label: 'Sábado' },
  { value: 'sunday', label: 'Domingo' },
];

const OVERRIDE_TYPES = [
  { value: 'cancel', label: 'Cancelar', icon: Cancel, color: 'error' as const },
  { value: 'time_change', label: 'Cambio de horario', icon: AccessTime, color: 'warning' as const },
  { value: 'reschedule', label: 'Reprogramar', icon: SwapHoriz, color: 'info' as const },
];

export function WeeklyOverridesTable() {
  const { session } = useSessionContext();
  const typedSession = session as SessionWithToken | null;
  const theme = useTheme();

  // State
  const [currentTab, setCurrentTab] = useState(0);
  const [currentWeekOverrides, setCurrentWeekOverrides] = useState<WeeklyOverride[]>([]);
  const [nextWeekOverrides, setNextWeekOverrides] = useState<WeeklyOverride[]>([]);
  const [schedules, setSchedules] = useState<ScheduleType[]>([]);
  const [stats, setStats] = useState<WeeklyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    targetWeek: 'current' as 'current' | 'next',
    overrideType: 'cancel' as 'cancel' | 'time_change' | 'reschedule',
    newStartTime: '',
    newEndTime: '',
    newDayOfWeek: '',
    reason: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!typedSession?.accessToken) return;

    try {
      setLoading(true);
      console.log('Fetching weekly overrides data...');
      
      const [overridesRes, schedulesRes, statsRes] = await Promise.all([
        fetch('/api/weekly-overrides', {
          headers: { Authorization: `Bearer ${typedSession.accessToken}` },
        }),
        fetch('/api/schedules?raw=true', {
          headers: { Authorization: `Bearer ${typedSession.accessToken}` },
        }),
        fetch('/api/weekly-schedule-manager/current-week-stats', {
          headers: { Authorization: `Bearer ${typedSession.accessToken}` },
        }),
      ]);

      console.log('Response statuses:', {
        overrides: overridesRes.status,
        schedules: schedulesRes.status,
        stats: statsRes.status
      });

      if (overridesRes.ok) {
        const overridesData = await overridesRes.json();
        console.log('Overrides data:', overridesData);
        setCurrentWeekOverrides(overridesData.currentWeek || []);
        setNextWeekOverrides(overridesData.nextWeek || []);
      } else {
        console.error('Failed to fetch overrides:', overridesRes.status, await overridesRes.text());
      }

      if (schedulesRes.ok) {
        const schedulesData = await schedulesRes.json();
        console.log('Schedules data length:', schedulesData?.length);
        setSchedules(schedulesData || []);
      } else {
        console.error('Failed to fetch schedules:', schedulesRes.status, await schedulesRes.text());
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        console.log('Stats data:', statsData);
        setStats(statsData);
      } else {
        console.error('Failed to fetch stats (non-critical):', statsRes.status);
        // Stats are not critical, so we don't show an error for this
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }, [typedSession?.accessToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handlers
  const handleOpenDialog = (schedule: ScheduleType) => {
    setSelectedSchedule(schedule);
    setFormData({
      targetWeek: 'current',
      overrideType: 'cancel',
      newStartTime: schedule.start_time,
      newEndTime: schedule.end_time,
      newDayOfWeek: schedule.day_of_week,
      reason: '',
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedSchedule(null);
    setFormData({
      targetWeek: 'current',
      overrideType: 'cancel',
      newStartTime: '',
      newEndTime: '',
      newDayOfWeek: '',
      reason: '',
    });
  };

  const handleSubmit = async () => {
    if (!selectedSchedule) return;

    try {
      const payload = {
        scheduleId: selectedSchedule.id,
        targetWeek: formData.targetWeek,
        overrideType: formData.overrideType,
        ...(formData.overrideType !== 'cancel' && {
          newStartTime: formData.newStartTime,
          newEndTime: formData.newEndTime,
        }),
        ...(formData.overrideType === 'reschedule' && {
          newDayOfWeek: formData.newDayOfWeek,
        }),
        reason: formData.reason,
        createdBy: typedSession?.user?.name || 'Admin',
      };

      const response = await fetch('/api/weekly-overrides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${typedSession?.accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear el cambio');
      }

      setSuccess('Cambio semanal creado correctamente');
      handleCloseDialog();
      await fetchData();
    } catch (err) {
      console.error('Error creating override:', err);
      setError(err instanceof Error ? err.message : 'Error al crear el cambio');
    }
  };

  const handleDelete = async (overrideId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este cambio?')) return;

    try {
      const response = await fetch(`/api/weekly-overrides/${overrideId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${typedSession?.accessToken}` },
      });

      if (!response.ok) {
        throw new Error('Error al eliminar el cambio');
      }

      setSuccess('Cambio eliminado correctamente');
      await fetchData();
    } catch (err) {
      console.error('Error deleting override:', err);
      setError('Error al eliminar el cambio');
    }
  };

  const handleCleanup = async () => {
    try {
      const response = await fetch('/api/weekly-overrides/cleanup', {
        method: 'POST',
        headers: { Authorization: `Bearer ${typedSession?.accessToken}` },
      });

      if (!response.ok) {
        throw new Error('Error en la limpieza');
      }

      const data = await response.json();
      setSuccess(data.message || 'Limpieza completada');
      await fetchData();
    } catch (err) {
      console.error('Error during cleanup:', err);
      setError('Error durante la limpieza');
    }
  };

  const handleReset = async () => {
    if (!confirm('¿Estás seguro de que deseas realizar el reset semanal? Esto eliminará todos los cambios activos.')) return;

    try {
      const response = await fetch('/api/weekly-schedule-manager/trigger-reset', {
        method: 'POST',
        headers: { Authorization: `Bearer ${typedSession?.accessToken}` },
      });

      if (!response.ok) {
        throw new Error('Error en el reset');
      }

      const data = await response.json();
      setSuccess(data.message || 'Reset completado correctamente');
      await fetchData();
    } catch (err) {
      console.error('Error during reset:', err);
      setError('Error durante el reset');
    }
  };

  // Helper functions
  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    return `${hours}:${minutes}`;
  };

  const getOverrideIcon = (type: string) => {
    const override = OVERRIDE_TYPES.find(ot => ot.value === type);
    return override ? override.icon : Schedule;
  };

  const getOverrideColor = (type: string): "error" | "warning" | "info" => {
    const override = OVERRIDE_TYPES.find(ot => ot.value === type);
    return override ? override.color : 'info';
  };

  const getOverrideLabel = (type: string) => {
    const override = OVERRIDE_TYPES.find(ot => ot.value === type);
    return override ? override.label : type;
  };

  const getDayLabel = (day: string) => {
    const dayObj = DAYS_OF_WEEK.find(d => d.value === day);
    return dayObj ? dayObj.label : day;
  };

  if (loading) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="50vh" gap={2}>
        <CircularProgress size={48} />
        <Typography variant="body1" color="text.secondary">
          Cargando datos de cambios semanales...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Statistics Card */}
      {stats && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <Analytics sx={{ mr: 1, verticalAlign: 'middle' }} />
              Estadísticas de la Semana Actual
            </Typography>
            <Grid container spacing={2}>
              <Grid component="div" size={3}>
                <Typography variant="body2" color="text.secondary">Total de cambios</Typography>
                <Typography variant="h5">{stats.totalOverrides}</Typography>
              </Grid>
              <Grid component="div" size={3}>
                <Typography variant="body2" color="text.secondary">Cancelaciones</Typography>
                <Typography variant="h5" color="error.main">{stats.byType.cancel}</Typography>
              </Grid>
              <Grid component="div" size={3}>
                <Typography variant="body2" color="text.secondary">Cambios de horario</Typography>
                <Typography variant="h5" color="warning.main">{stats.byType.time_change}</Typography>
              </Grid>
              <Grid component="div" size={3}>
                <Typography variant="body2" color="text.secondary">Reprogramaciones</Typography>
                <Typography variant="h5" color="info.main">{stats.byType.reschedule}</Typography>
              </Grid>
            </Grid>
          </CardContent>
          <CardActions>
            <Button startIcon={<Refresh />} onClick={handleCleanup}>
              Limpiar Expirados
            </Button>
            <Button startIcon={<Settings />} onClick={handleReset} color="warning">
              Reset Semanal
            </Button>
          </CardActions>
        </Card>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={currentTab} onChange={(_, newValue) => setCurrentTab(newValue)}>
          <Tab 
            label={`Semana Actual (${currentWeekOverrides.length} cambios)`} 
            sx={{ fontWeight: 600, color: 'text.primary' }}
          />
          <Tab 
            label={`Próxima Semana (${nextWeekOverrides.length} cambios)`} 
            sx={{ fontWeight: 600, color: 'text.primary' }}
          />
          <Tab 
            label="Crear Cambios" 
            sx={{ fontWeight: 600, color: 'text.primary' }}
          />
        </Tabs>
      </Box>

      {/* Current Week Tab */}
      {currentTab === 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Programa</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Horario Original</TableCell>
                <TableCell>Cambio</TableCell>
                <TableCell>Motivo</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {currentWeekOverrides.map((override) => {
                const schedule = schedules.find(s => s.id === override.scheduleId);
                const Icon = getOverrideIcon(override.overrideType);
                
                return (
                  <TableRow key={override.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {schedule?.program.name || 'Programa desconocido'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {schedule?.program.channel?.name || 'Sin canal'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={<Icon />}
                        label={getOverrideLabel(override.overrideType)}
                        color={getOverrideColor(override.overrideType)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {getDayLabel(schedule?.day_of_week || '')} {formatTime(schedule?.start_time || '')}-{formatTime(schedule?.end_time || '')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {override.overrideType === 'cancel' ? (
                        <Typography color="error">Cancelado</Typography>
                      ) : (
                        <Typography>
                          {override.newDayOfWeek && getDayLabel(override.newDayOfWeek)} {formatTime(override.newStartTime || '')}-{formatTime(override.newEndTime || '')}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{override.reason || '—'}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleDelete(override.id)} color="error">
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Next Week Tab */}
      {currentTab === 1 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Programa</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Horario Original</TableCell>
                <TableCell>Cambio</TableCell>
                <TableCell>Motivo</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {nextWeekOverrides.map((override) => {
                const schedule = schedules.find(s => s.id === override.scheduleId);
                const Icon = getOverrideIcon(override.overrideType);
                
                return (
                  <TableRow key={override.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {schedule?.program.name || 'Programa desconocido'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {schedule?.program.channel?.name || 'Sin canal'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={<Icon />}
                        label={getOverrideLabel(override.overrideType)}
                        color={getOverrideColor(override.overrideType)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {getDayLabel(schedule?.day_of_week || '')} {formatTime(schedule?.start_time || '')}-{formatTime(schedule?.end_time || '')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {override.overrideType === 'cancel' ? (
                        <Typography color="error">Cancelado</Typography>
                      ) : (
                        <Typography>
                          {override.newDayOfWeek && getDayLabel(override.newDayOfWeek)} {formatTime(override.newStartTime || '')}-{formatTime(override.newEndTime || '')}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{override.reason || '—'}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleDelete(override.id)} color="error">
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create Changes Tab */}
      {currentTab === 2 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ color: 'text.primary', fontWeight: 600 }}>
            Selecciona un programa para crear un cambio semanal
          </Typography>
          
          {/* Search Box */}
          <Box sx={{ mb: 3 }}>
            <TextField
              label="Buscar programa o canal..."
              variant="outlined"
              size="small"
              fullWidth
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Escribe para filtrar programas y canales"
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'background.paper',
                },
              }}
            />
          </Box>

          {schedules.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No hay horarios disponibles para crear cambios
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Programa</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Canal</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Horario</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {schedules
                    .filter((schedule) => {
                      const searchLower = searchTerm.toLowerCase();
                      return (
                        schedule.program.name.toLowerCase().includes(searchLower) ||
                        (schedule.program.channel?.name || '').toLowerCase().includes(searchLower)
                      );
                    })
                    .map((schedule) => (
                      <TableRow key={schedule.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {schedule.program.name}
                          </Typography>
                          {schedule.program.description && (
                            <Typography variant="caption" color="text.secondary">
                              {schedule.program.description}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {schedule.program.channel?.name || 'Sin canal'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            {getDayLabel(schedule.day_of_week)} {formatTime(schedule.start_time)}-{formatTime(schedule.end_time)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={() => handleOpenDialog(schedule)}
                            size="small"
                          >
                            Crear Cambio
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Show filtered results count */}
          {searchTerm && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Mostrando {schedules.filter((schedule) => {
                  const searchLower = searchTerm.toLowerCase();
                  return (
                    schedule.program.name.toLowerCase().includes(searchLower) ||
                    (schedule.program.channel?.name || '').toLowerCase().includes(searchLower)
                  );
                }).length} de {schedules.length} programas
              </Typography>
            </Box>
          )}
        </Paper>
      )}

      {/* Create Override Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: theme.palette.background.paper,
          }
        }}
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Crear Cambio Semanal
          </Typography>
          {selectedSchedule && (
            <Box sx={{ mt: 1, p: 2, backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'grey.50', borderRadius: 1 }}>
              <Typography variant="body1" fontWeight="bold" color="text.primary">
                {selectedSchedule.program.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Canal: {selectedSchedule.program.channel?.name || 'Sin canal'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Horario actual: {getDayLabel(selectedSchedule.day_of_week)} {formatTime(selectedSchedule.start_time)}-{formatTime(selectedSchedule.end_time)}
              </Typography>
            </Box>
          )}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Semana objetivo</InputLabel>
                <Select
                  value={formData.targetWeek}
                  onChange={(e) => setFormData({ ...formData, targetWeek: e.target.value as 'current' | 'next' })}
                  label="Semana objetivo"
                >
                  <MenuItem value="current">Semana actual</MenuItem>
                  <MenuItem value="next">Próxima semana</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Tipo de cambio</InputLabel>
                <Select
                  value={formData.overrideType}
                  onChange={(e) => setFormData({ ...formData, overrideType: e.target.value as 'cancel' | 'time_change' | 'reschedule' })}
                  label="Tipo de cambio"
                >
                  {OVERRIDE_TYPES.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <type.icon fontSize="small" />
                        {type.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Help text for override types */}
            <Box sx={{ p: 2, backgroundColor: 'info.light', borderRadius: 1, color: 'info.contrastText' }}>
              <Typography variant="body2">
                {formData.overrideType === 'cancel' && '🚫 Cancelar: El programa no se emitirá en el horario programado'}
                {formData.overrideType === 'time_change' && '⏰ Cambio de horario: El programa se emitirá en un horario diferente el mismo día'}
                {formData.overrideType === 'reschedule' && '📅 Reprogramar: El programa se moverá a otro día y/u horario'}
              </Typography>
            </Box>

            {formData.overrideType !== 'cancel' && (
              <>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    label="Nueva hora de inicio"
                    type="time"
                    value={formData.newStartTime}
                    onChange={(e) => setFormData({ ...formData, newStartTime: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                  <TextField
                    label="Nueva hora de fin"
                    type="time"
                    value={formData.newEndTime}
                    onChange={(e) => setFormData({ ...formData, newEndTime: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                </Box>

                {formData.overrideType === 'reschedule' && (
                  <FormControl fullWidth>
                    <InputLabel>Nuevo día</InputLabel>
                    <Select
                      value={formData.newDayOfWeek}
                      onChange={(e) => setFormData({ ...formData, newDayOfWeek: e.target.value })}
                      label="Nuevo día"
                    >
                      {DAYS_OF_WEEK.map((day) => (
                        <MenuItem key={day.value} value={day.value}>
                          {day.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              </>
            )}

            <TextField
              label="Motivo (opcional)"
              multiline
              rows={3}
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button onClick={handleCloseDialog} variant="outlined">
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            startIcon={<Add />}
            disabled={
              formData.overrideType !== 'cancel' && 
              (!formData.newStartTime || !formData.newEndTime || 
               (formData.overrideType === 'reschedule' && !formData.newDayOfWeek))
            }
          >
            Crear Cambio
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={!!error || !!success}
        autoHideDuration={6000}
        onClose={() => { setError(null); setSuccess(null); }}
      >
        <Alert
          onClose={() => { setError(null); setSuccess(null); }}
          severity={error ? 'error' : 'success'}
        >
          {error || success}
        </Alert>
      </Snackbar>
    </Box>
  );
} 