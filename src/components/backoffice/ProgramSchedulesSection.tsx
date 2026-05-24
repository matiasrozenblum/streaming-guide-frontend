'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  MenuItem,
  Typography,
  Paper,
  Divider,
  Checkbox,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Alert,
  Chip,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import {
  Edit,
  Delete,
  Add,
  Check,
  Close,
  AddCircle,
  Schedule as ScheduleIcon,
  ExpandMore,
  DeleteForever,
} from '@mui/icons-material';
import { api } from '@/services/api';
import { Schedule as ScheduleType } from '@/types/schedule';
import { useSessionContext } from '@/contexts/SessionContext';
import type { SessionWithToken } from '@/types/session';

const formatTime = (time: string) => {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  return `${hours}:${minutes}`;
};

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Lunes' },
  { value: 'tuesday', label: 'Martes' },
  { value: 'wednesday', label: 'Miércoles' },
  { value: 'thursday', label: 'Jueves' },
  { value: 'friday', label: 'Viernes' },
  { value: 'saturday', label: 'Sábado' },
  { value: 'sunday', label: 'Domingo' },
] as const;

const SCHEDULE_TYPES = [
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly_weekday', label: 'Mensual fijo' },
  { value: 'monthly_dated', label: 'Mensual por fecha' },
] as const;

const WEEK_NUMBERS = [
  { value: 1, label: '1°' },
  { value: 2, label: '2°' },
  { value: 3, label: '3°' },
  { value: 4, label: '4°' },
  { value: -1, label: 'Último' },
] as const;

const formatScheduleLabel = (schedule: ScheduleType): string => {
  const type = schedule.schedule_type || 'weekly';
  if (type === 'monthly_weekday') {
    const weekLabel = WEEK_NUMBERS.find(w => w.value === schedule.week_number_in_month)?.label || '';
    const dayLabel = DAYS_OF_WEEK.find(d => d.value === schedule.day_of_week)?.label || schedule.day_of_week || '';
    return `${weekLabel} ${dayLabel} de cada mes`;
  }
  if (type === 'monthly_dated') return schedule.specific_date || '-';
  return DAYS_OF_WEEK.find(d => d.value === schedule.day_of_week)?.label || schedule.day_of_week || '-';
};

type DayOfWeek = typeof DAYS_OF_WEEK[number]['value'];

interface BulkScheduleData {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
}

interface PendingSchedule {
  id: string; // Temporary ID for new schedules
  dayOfWeek?: string;
  startTime: string;
  endTime: string;
  scheduleType: string;
  weekNumberInMonth?: string;
  specificDate?: string;
}

interface ProgramSchedulesSectionProps {
  programId?: number | null; // undefined/null means new program
  channelId?: number | null;
  onSchedulesChange?: (schedules: PendingSchedule[]) => void; // For new programs
}

export function ProgramSchedulesSection({ 
  programId, 
  channelId,
  onSchedulesChange 
}: ProgramSchedulesSectionProps) {
  const { session } = useSessionContext();
  const typedSession = session as SessionWithToken | null;

  const [schedules, setSchedules] = useState<ScheduleType[]>([]);
  const [pendingSchedules, setPendingSchedules] = useState<PendingSchedule[]>([]);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleType | null>(null);
  const [formData, setFormData] = useState({ dayOfWeek: '', startTime: '', endTime: '', scheduleType: 'weekly', weekNumberInMonth: '', specificDate: '' });
  const [bulkSchedules, setBulkSchedules] = useState<BulkScheduleData[]>([]);
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([]);
  const [bulkTimeRange, setBulkTimeRange] = useState({ startTime: '', endTime: '' });
  const [expandedAccordion, setExpandedAccordion] = useState<string | false>('current');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchSchedules = async () => {
    if (!programId || !typedSession?.accessToken) return;
    
    try {
      const response = await api.get<ScheduleType[]>('/schedules?raw=true', {
        headers: { Authorization: `Bearer ${typedSession.accessToken}` },
      });
      const allSchedules = response.data || [];
      const programSchedules = allSchedules.filter(s => s.program.id === programId);
      setSchedules(programSchedules);
    } catch (err) {
      console.error('Error fetching schedules:', err);
    }
  };

  const handleDeleteAllSchedules = async () => {
    if (!programId) return;
    const confirmed = typeof window !== 'undefined'
      ? window.confirm('¿Eliminar TODOS los horarios de este programa? Esta acción no se puede deshacer.')
      : false;
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/schedules/program/${programId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${typedSession?.accessToken || ''}`,
        },
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || 'No se pudieron eliminar los horarios');
      }
      await fetchSchedules();
      setSuccess('Todos los horarios del programa fueron eliminados');
    } catch (err) {
      console.error('Error deleting all schedules:', err);
      setError((err as Error).message || 'Error al eliminar todos los horarios');
    }
  };

  // Fetch schedules when programId is available (existing program)
  useEffect(() => {
    if (programId && typedSession?.accessToken) {
      fetchSchedules();
    } else {
      setSchedules([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programId, typedSession?.accessToken]);

  // Notify parent of pending schedules changes
  useEffect(() => {
    if (onSchedulesChange && !programId) {
      onSchedulesChange(pendingSchedules);
    }
  }, [pendingSchedules, programId, onSchedulesChange]);

  const handleOpenEditDialog = (schedule: ScheduleType) => {
    setEditingSchedule(schedule);
    setFormData({
      dayOfWeek: schedule.day_of_week || '',
      startTime: schedule.start_time,
      endTime: schedule.end_time,
      scheduleType: schedule.schedule_type || 'weekly',
      weekNumberInMonth: schedule.week_number_in_month?.toString() || '',
      specificDate: schedule.specific_date || '',
    });
  };

  const handleCloseEditDialog = () => {
    setEditingSchedule(null);
    setFormData({ dayOfWeek: '', startTime: '', endTime: '', scheduleType: 'weekly', weekNumberInMonth: '', specificDate: '' });
  };

  const handleUpdateSchedule = async () => {
    if (!editingSchedule || !programId || !typedSession?.accessToken) return;
    
    try {
      const updateData: Record<string, unknown> = {
        startTime: formData.startTime,
        endTime: formData.endTime,
        scheduleType: formData.scheduleType,
        ...(formData.scheduleType !== 'monthly_dated' && { dayOfWeek: formData.dayOfWeek }),
        ...(formData.scheduleType === 'monthly_weekday' && formData.weekNumberInMonth && { weekNumberInMonth: parseInt(formData.weekNumberInMonth, 10) }),
        ...(formData.scheduleType === 'monthly_dated' && formData.specificDate && { specificDate: formData.specificDate }),
      };
      const response = await api.put<ScheduleType>(
        `/schedules/${editingSchedule.id}`,
        updateData,
        { headers: { Authorization: `Bearer ${typedSession.accessToken}` } }
      );
      const updated = response.data;
      setSchedules(schedules.map(s => s.id === updated.id ? updated : s));
      setSuccess('Horario actualizado correctamente');
      handleCloseEditDialog();
    } catch (err) {
      console.error('Error updating schedule:', err);
      setError((err as Error).message || 'Error al actualizar el horario');
    }
  };

  const handleDeleteSchedule = async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este horario?')) return;
    if (!typedSession?.accessToken) return;
    
    try {
      await api.delete(`/schedules/${id}`, {
        headers: { Authorization: `Bearer ${typedSession.accessToken}` },
      });
      setSchedules(schedules.filter(s => s.id !== id));
      setSuccess('Horario eliminado correctamente');
    } catch (err) {
      console.error('Error deleting schedule:', err);
      setError('Error al eliminar el horario');
    }
  };

  const handleAddSchedule = async () => {
    const type = formData.scheduleType;
    if (!formData.startTime || !formData.endTime) {
      setError('Los campos de horario son requeridos');
      return;
    }
    if ((type === 'weekly' || type === 'monthly_weekday') && !formData.dayOfWeek) {
      setError('El día de la semana es requerido');
      return;
    }
    if (type === 'monthly_weekday' && !formData.weekNumberInMonth) {
      setError('La semana del mes es requerida');
      return;
    }
    if (type === 'monthly_dated' && !formData.specificDate) {
      setError('La fecha específica es requerida');
      return;
    }

    // If program doesn't exist yet, add to pending schedules
    if (!programId) {
      if (!channelId) {
        setError('Debes seleccionar un canal primero');
        return;
      }
      const newPending: PendingSchedule = {
        id: `pending-${Date.now()}-${Math.random()}`,
        startTime: formData.startTime,
        endTime: formData.endTime,
        scheduleType: type,
        ...(type !== 'monthly_dated' && { dayOfWeek: formData.dayOfWeek }),
        ...(type === 'monthly_weekday' && { weekNumberInMonth: formData.weekNumberInMonth }),
        ...(type === 'monthly_dated' && { specificDate: formData.specificDate }),
      };
      setPendingSchedules([...pendingSchedules, newPending]);
      setFormData({ dayOfWeek: '', startTime: '', endTime: '', scheduleType: 'weekly', weekNumberInMonth: '', specificDate: '' });
      setSuccess('Horario agregado (se creará al guardar el programa)');
      return;
    }

    // If program exists, create schedule immediately
    if (!channelId || !typedSession?.accessToken) {
      setError('El programa debe estar asociado a un canal');
      return;
    }

    try {
      const newData: Record<string, unknown> = {
        programId: programId.toString(),
        channelId: channelId.toString(),
        startTime: formData.startTime,
        endTime: formData.endTime,
        scheduleType: type,
        ...(type !== 'monthly_dated' && { dayOfWeek: formData.dayOfWeek }),
        ...(type === 'monthly_weekday' && { weekNumberInMonth: parseInt(formData.weekNumberInMonth, 10) }),
        ...(type === 'monthly_dated' && { specificDate: formData.specificDate }),
      };
      const response = await api.post<ScheduleType>('/schedules', newData, {
        headers: { Authorization: `Bearer ${typedSession.accessToken}` },
      });
      const created = response.data;
      setSchedules([...schedules, created]);
      setFormData({ dayOfWeek: '', startTime: '', endTime: '', scheduleType: 'weekly', weekNumberInMonth: '', specificDate: '' });
      setSuccess('Horario agregado correctamente');
    } catch (err) {
      console.error('Error adding schedule:', err);
      setError((err as Error).message || 'Error al agregar el horario');
    }
  };

  const handleDeletePendingSchedule = (id: string) => {
    setPendingSchedules(pendingSchedules.filter(s => s.id !== id));
  };

  const handleEditPendingSchedule = (id: string) => {
    const schedule = pendingSchedules.find(s => s.id === id);
    if (schedule) {
      setFormData({
        dayOfWeek: schedule.dayOfWeek || '',
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        scheduleType: schedule.scheduleType || 'weekly',
        weekNumberInMonth: schedule.weekNumberInMonth || '',
        specificDate: schedule.specificDate || '',
      });
      handleDeletePendingSchedule(id);
    }
  };

  const handleAddBulkSchedule = () => {
    if (!bulkTimeRange.startTime || !bulkTimeRange.endTime || selectedDays.length === 0) {
      setError('Debes seleccionar días y horarios');
      return;
    }

    const newSchedules: BulkScheduleData[] = selectedDays.map(day => ({
      dayOfWeek: day,
      startTime: bulkTimeRange.startTime,
      endTime: bulkTimeRange.endTime,
    }));

    if (!programId) {
      // Add to pending schedules
      const newPending: PendingSchedule[] = newSchedules.map((s, idx) => ({
        id: `pending-bulk-${Date.now()}-${idx}`,
        scheduleType: 'weekly',
        ...s,
      }));
      setPendingSchedules([...pendingSchedules, ...newPending]);
      setSuccess(`${newPending.length} horarios agregados (se crearán al guardar el programa)`);
    } else {
      // Add to bulk schedules list for immediate creation
      setBulkSchedules([...bulkSchedules, ...newSchedules]);
    }
    
    setSelectedDays([]);
    setBulkTimeRange({ startTime: '', endTime: '' });
  };

  const handleBulkCreateSchedules = async () => {
    if (!programId || !channelId || !typedSession?.accessToken) return;
    
    try {
      if (bulkSchedules.length === 0) {
        setError('Debes agregar al menos un horario');
        return;
      }

      const bulkData = {
        programId: programId.toString(),
        channelId: channelId.toString(),
        schedules: bulkSchedules,
      };

      const response = await api.post<ScheduleType[]>('/schedules/bulk', bulkData, {
        headers: { Authorization: `Bearer ${typedSession.accessToken}` },
      });
      
      const createdSchedules = response.data;
      setSchedules([...schedules, ...createdSchedules]);
      setSuccess(`${createdSchedules.length} horarios creados correctamente`);
      setBulkSchedules([]);
      setSelectedDays([]);
      setBulkTimeRange({ startTime: '', endTime: '' });
    } catch (err) {
      console.error('Error creating bulk schedules:', err);
      setError((err as Error).message || 'Error al crear los horarios');
    }
  };

  const handleRemoveBulkSchedule = (index: number) => {
    setBulkSchedules(bulkSchedules.filter((_, i) => i !== index));
  };

  const handleDayToggle = (day: DayOfWeek) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  // Clear messages after 6 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const allSchedules = programId ? schedules : [];
  const hasSchedules = allSchedules.length > 0 || pendingSchedules.length > 0;

  return (
    <Box>
      {error && (
        <Box sx={{ mb: 2, p: 1, bgcolor: 'error.light', color: 'error.contrastText', borderRadius: 1 }}>
          <Typography variant="body2">{error}</Typography>
        </Box>
      )}
      {success && (
        <Box sx={{ mb: 2, p: 1, bgcolor: 'success.light', color: 'success.contrastText', borderRadius: 1 }}>
          <Typography variant="body2">{success}</Typography>
        </Box>
      )}

      <Accordion 
        expanded={expandedAccordion === 'current'} 
        onChange={(_, isExpanded) => setExpandedAccordion(isExpanded ? 'current' : false)}
      >
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ScheduleIcon />
            <Typography variant="subtitle1">
              Horarios {hasSchedules && `(${allSchedules.length + pendingSchedules.length})`}
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          {/* Current Schedules */}
          {programId && allSchedules.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Horarios Actuales</Typography>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<DeleteForever />}
                  onClick={handleDeleteAllSchedules}
                >
                  Eliminar todos los horarios
                </Button>
              </Box>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Tipo</TableCell>
                      <TableCell>Día / Fecha</TableCell>
                      <TableCell>Inicio</TableCell>
                      <TableCell>Fin</TableCell>
                      <TableCell>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {allSchedules.map(schedule => (
                      <TableRow key={schedule.id}>
                        {editingSchedule?.id === schedule.id ? (
                          <>
                            <TableCell>
                              <TextField
                                select
                                value={formData.scheduleType}
                                onChange={(e) => setFormData({ ...formData, scheduleType: e.target.value })}
                                size="small"
                                fullWidth
                              >
                                {SCHEDULE_TYPES.map((t) => (
                                  <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                                ))}
                              </TextField>
                            </TableCell>
                            <TableCell>
                              {formData.scheduleType === 'monthly_dated' ? (
                                <TextField
                                  type="date"
                                  value={formData.specificDate}
                                  onChange={(e) => setFormData({ ...formData, specificDate: e.target.value })}
                                  InputLabelProps={{ shrink: true }}
                                  size="small"
                                  fullWidth
                                />
                              ) : (
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                  {formData.scheduleType === 'monthly_weekday' && (
                                    <TextField
                                      select
                                      value={formData.weekNumberInMonth}
                                      onChange={(e) => setFormData({ ...formData, weekNumberInMonth: e.target.value })}
                                      size="small"
                                      sx={{ minWidth: 75 }}
                                    >
                                      {WEEK_NUMBERS.map((w) => (
                                        <MenuItem key={w.value} value={w.value.toString()}>{w.label}</MenuItem>
                                      ))}
                                    </TextField>
                                  )}
                                  <TextField
                                    select
                                    value={formData.dayOfWeek}
                                    onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
                                    size="small"
                                    fullWidth
                                  >
                                    {DAYS_OF_WEEK.map((day) => (
                                      <MenuItem key={day.value} value={day.value}>{day.label}</MenuItem>
                                    ))}
                                  </TextField>
                                </Box>
                              )}
                            </TableCell>
                            <TableCell>
                              <TextField
                                type="time"
                                value={formData.startTime}
                                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                InputLabelProps={{ shrink: true }}
                                size="small"
                                fullWidth
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                type="time"
                                value={formData.endTime}
                                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                InputLabelProps={{ shrink: true }}
                                size="small"
                                fullWidth
                              />
                            </TableCell>
                            <TableCell>
                              <IconButton aria-label="Aceptar" onClick={handleUpdateSchedule} size="small">
                                <Check />
                              </IconButton>
                              <IconButton aria-label="Cancelar" onClick={handleCloseEditDialog} size="small">
                                <Close />
                              </IconButton>
                            </TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell>
                              <Chip
                                label={SCHEDULE_TYPES.find(t => t.value === (schedule.schedule_type || 'weekly'))?.label || 'Semanal'}
                                size="small"
                                color={schedule.schedule_type === 'monthly_weekday' ? 'primary' : schedule.schedule_type === 'monthly_dated' ? 'secondary' : 'default'}
                              />
                            </TableCell>
                            <TableCell>{formatScheduleLabel(schedule)}</TableCell>
                            <TableCell>{formatTime(schedule.start_time)}</TableCell>
                            <TableCell>{formatTime(schedule.end_time)}</TableCell>
                            <TableCell>
                              <IconButton aria-label="Editar horario" onClick={() => handleOpenEditDialog(schedule)} size="small">
                                <Edit />
                              </IconButton>
                              <IconButton aria-label="Eliminar horario" onClick={() => handleDeleteSchedule(schedule.id)} size="small">
                                <Delete />
                              </IconButton>
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Pending Schedules (for new programs) */}
          {!programId && pendingSchedules.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Horarios a Crear</Typography>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Tipo</TableCell>
                      <TableCell>Día / Fecha</TableCell>
                      <TableCell>Inicio</TableCell>
                      <TableCell>Fin</TableCell>
                      <TableCell>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pendingSchedules.map(schedule => (
                      <TableRow key={schedule.id}>
                        <TableCell>
                          <Chip
                            label={SCHEDULE_TYPES.find(t => t.value === (schedule.scheduleType || 'weekly'))?.label || 'Semanal'}
                            size="small"
                            color={schedule.scheduleType === 'monthly_weekday' ? 'primary' : schedule.scheduleType === 'monthly_dated' ? 'secondary' : 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          {schedule.scheduleType === 'monthly_dated'
                            ? schedule.specificDate || '-'
                            : schedule.scheduleType === 'monthly_weekday'
                              ? `${WEEK_NUMBERS.find(w => w.value === parseInt(schedule.weekNumberInMonth || '0'))?.label || ''} ${DAYS_OF_WEEK.find(d => d.value === schedule.dayOfWeek)?.label || schedule.dayOfWeek || ''}`
                              : DAYS_OF_WEEK.find(d => d.value === schedule.dayOfWeek)?.label || schedule.dayOfWeek || '-'
                          }
                        </TableCell>
                        <TableCell>{formatTime(schedule.startTime)}</TableCell>
                        <TableCell>{formatTime(schedule.endTime)}</TableCell>
                        <TableCell>
                          <IconButton aria-label="Editar horario pendiente" onClick={() => handleEditPendingSchedule(schedule.id)} size="small">
                            <Edit />
                          </IconButton>
                          <IconButton aria-label="Eliminar horario pendiente" onClick={() => handleDeletePendingSchedule(schedule.id)} size="small">
                            <Delete />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {!hasSchedules && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              No hay horarios configurados. Agrega uno usando el formulario a continuación.
            </Typography>
          )}

          <Divider sx={{ my: 2 }} />

          {/* Add Single Schedule */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Agregar Horario
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                select
                label="Tipo de recurrencia"
                value={formData.scheduleType}
                onChange={(e) => setFormData({ ...formData, scheduleType: e.target.value, dayOfWeek: '', weekNumberInMonth: '', specificDate: '' })}
                fullWidth
              >
                {SCHEDULE_TYPES.map((t) => (
                  <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                ))}
              </TextField>

              {formData.scheduleType === 'weekly' && (
                <TextField
                  select
                  label="Día de la semana"
                  value={formData.dayOfWeek}
                  onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
                  fullWidth
                >
                  {DAYS_OF_WEEK.map((day) => (
                    <MenuItem key={day.value} value={day.value}>{day.label}</MenuItem>
                  ))}
                </TextField>
              )}

              {formData.scheduleType === 'monthly_weekday' && (
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    select
                    label="Semana del mes"
                    value={formData.weekNumberInMonth}
                    onChange={(e) => setFormData({ ...formData, weekNumberInMonth: e.target.value })}
                    fullWidth
                  >
                    {WEEK_NUMBERS.map((w) => (
                      <MenuItem key={w.value} value={w.value.toString()}>{w.label}</MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    select
                    label="Día de la semana"
                    value={formData.dayOfWeek}
                    onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
                    fullWidth
                  >
                    {DAYS_OF_WEEK.map((day) => (
                      <MenuItem key={day.value} value={day.value}>{day.label}</MenuItem>
                    ))}
                  </TextField>
                </Box>
              )}

              {formData.scheduleType === 'monthly_dated' && (
                <Box>
                  <TextField
                    label="Fecha específica"
                    type="date"
                    value={formData.specificDate}
                    onChange={(e) => setFormData({ ...formData, specificDate: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                  <Alert severity="info" icon={<InfoOutlinedIcon />} sx={{ mt: 1 }}>
                    Deberás cargar manualmente cada fecha cuando se confirme.
                  </Alert>
                </Box>
              )}

              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Hora de inicio"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
                <TextField
                  label="Hora de fin"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Box>
              <Button
                variant="contained"
                onClick={handleAddSchedule}
                startIcon={<Add />}
                fullWidth
              >
                Agregar
              </Button>
            </Box>
          </Box>

          {/* Bulk Creation */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AddCircle />
                <Typography variant="subtitle2">Creación Masiva</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                  Seleccionar días:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {DAYS_OF_WEEK.map((day) => (
                    <FormControlLabel
                      key={day.value}
                      control={
                        <Checkbox
                          checked={selectedDays.includes(day.value)}
                          onChange={() => handleDayToggle(day.value)}
                        />
                      }
                      label={day.label}
                    />
                  ))}
                </Box>

                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <TextField
                    label="Hora de inicio"
                    type="time"
                    value={bulkTimeRange.startTime}
                    onChange={(e) => setBulkTimeRange({ ...bulkTimeRange, startTime: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                  <TextField
                    label="Hora de fin"
                    type="time"
                    value={bulkTimeRange.endTime}
                    onChange={(e) => setBulkTimeRange({ ...bulkTimeRange, endTime: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                  <Button
                    variant="outlined"
                    onClick={handleAddBulkSchedule}
                    disabled={selectedDays.length === 0 || !bulkTimeRange.startTime || !bulkTimeRange.endTime}
                  >
                    Agregar
                  </Button>
                </Box>
              </Paper>

              {/* Bulk Schedules List (only for existing programs) */}
              {programId && bulkSchedules.length > 0 && (
                <Paper sx={{ p: 2, mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>
                    Horarios a crear ({bulkSchedules.length})
                  </Typography>
                  <List dense>
                    {bulkSchedules.map((schedule, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={`${DAYS_OF_WEEK.find(d => d.value === schedule.dayOfWeek)?.label} ${formatTime(schedule.startTime)}-${formatTime(schedule.endTime)}`}
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            aria-label="Eliminar horario en lote"
                            edge="end"
                            onClick={() => handleRemoveBulkSchedule(index)}
                            size="small"
                          >
                            <Delete />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                  <Divider sx={{ my: 2 }} />
                  <Button
                    variant="contained"
                    onClick={handleBulkCreateSchedules}
                    startIcon={<AddCircle />}
                    fullWidth
                  >
                    Crear {bulkSchedules.length} Horarios
                  </Button>
                </Paper>
              )}
            </AccordionDetails>
          </Accordion>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}

