'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import {
  Edit,
  Delete,
  Add,
  Check,
  Close,
  AddCircle,
  Schedule,
} from '@mui/icons-material';
import { DeleteForever } from '@mui/icons-material';
import { api } from '@/services/api';
import { Schedule as ScheduleType } from '@/types/schedule';
import { Program } from '@/types/program';
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
    return `${weekLabel} ${dayLabel} de cada mes ${formatTime(schedule.start_time)}-${formatTime(schedule.end_time)}`;
  }
  if (type === 'monthly_dated') {
    return `Fecha ${schedule.specific_date || ''} ${formatTime(schedule.start_time)}-${formatTime(schedule.end_time)}`;
  }
  const dayLabel = DAYS_OF_WEEK.find(d => d.value === schedule.day_of_week)?.label || schedule.day_of_week || '';
  return `${dayLabel} ${formatTime(schedule.start_time)}-${formatTime(schedule.end_time)}`;
};

type DayOfWeek = typeof DAYS_OF_WEEK[number]['value'];

interface ProgramWithSchedules extends Program {
  schedules: ScheduleType[];
}

interface BulkScheduleData {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
}

export function SchedulesTable() {
  const { session, status } = useSessionContext();
  const typedSession = session as SessionWithToken | null;

  const [programs, setPrograms] = useState<ProgramWithSchedules[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProgram, setSelectedProgram] = useState<ProgramWithSchedules | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleType | null>(null);
  const [formData, setFormData] = useState({ dayOfWeek: '', startTime: '', endTime: '', programId: '', scheduleType: 'weekly', weekNumberInMonth: '', specificDate: '' });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openProgramDialog, setOpenProgramDialog] = useState(false);
  const [programFormData, setProgramFormData] = useState({ dayOfWeek: '', startTime: '', endTime: '', scheduleType: 'weekly', weekNumberInMonth: '', specificDate: '' });
  const [bulkSchedules, setBulkSchedules] = useState<BulkScheduleData[]>([]);
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([]);
  const [bulkTimeRange, setBulkTimeRange] = useState({ startTime: '', endTime: '' });
  const [currentTab, setCurrentTab] = useState(0);

  const hasFetched = useRef(false);

  const fetchSchedules = useCallback(async () => {
    if (!typedSession?.accessToken) return;
    
    setLoading(true);
    try {
      const [schedulesRes, programsRes] = await Promise.all([
        api.get<ScheduleType[]>('/schedules?raw=true', { headers: { Authorization: `Bearer ${typedSession?.accessToken}` } }),
        api.get<Program[]>('/programs?include=channel', { headers: { Authorization: `Bearer ${typedSession?.accessToken}` } }),
      ]);
      const schedules = schedulesRes.data || [];
      const programsList = programsRes.data || [];
      const merged = programsList.map(program => ({
        ...program,
        schedules: schedules.filter(s => s.program.id === program.id),
      }));
      setPrograms(merged);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }, [typedSession?.accessToken]);

  useEffect(() => {
    if (
      status === 'authenticated' &&
      typedSession?.user.role === 'admin' &&
      !hasFetched.current
    ) {
      fetchSchedules();
      hasFetched.current = true;
    }
  }, [status, fetchSchedules, typedSession?.user.role]);

  // Filtrado en vivo
  const filteredPrograms = programs.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.channel_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenEditDialog = (schedule: ScheduleType) => {
    setEditingSchedule(schedule);
    setFormData({
      dayOfWeek: schedule.day_of_week || '',
      startTime: schedule.start_time,
      endTime: schedule.end_time,
      programId: schedule.program.id.toString(),
      scheduleType: schedule.schedule_type || 'weekly',
      weekNumberInMonth: schedule.week_number_in_month?.toString() || '',
      specificDate: schedule.specific_date || '',
    });
  };

  const handleCloseEditDialog = () => {
    setEditingSchedule(null);
    setFormData({ dayOfWeek: '', startTime: '', endTime: '', programId: '', scheduleType: 'weekly', weekNumberInMonth: '', specificDate: '' });
  };

  const handleSubmit = async () => {
    if (!editingSchedule) return;
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
        { headers: { Authorization: `Bearer ${typedSession?.accessToken}` } }
      );
      const updated = response.data;
      setPrograms(programs.map(pr =>
        pr.id === editingSchedule.program.id
          ? { ...pr, schedules: pr.schedules.map(s => s.id === updated.id ? updated : s) }
          : pr
      ));
      if (selectedProgram?.id === editingSchedule.program.id) {
        setSelectedProgram(prev => prev ? {
          ...prev,
          schedules: prev.schedules.map(s => s.id === updated.id ? updated : s)
        } : null);
      }
      setSuccess('Horario actualizado correctamente');
      handleCloseEditDialog();
    } catch (err) {
      console.error('Error saving schedule:', err);
      setError((err as Error).message || 'Error al guardar el horario');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este horario?')) return;
    try {
      // Find the program id from local state
      const program = programs.find(pr => pr.schedules.some(s => s.id === id));
      const pid = program?.id;
      if (!pid) throw new Error('No se encontró el programa para este horario');

      await api.delete(`/schedules/${id}`, { headers: { Authorization: `Bearer ${typedSession?.accessToken}` } });
      setPrograms(programs.map(pr =>
        pr.id === pid
          ? { ...pr, schedules: pr.schedules.filter(s => s.id !== id) }
          : pr
      ));
      if (selectedProgram?.id === pid) {
        setSelectedProgram(prev => prev ? {
          ...prev,
          schedules: prev.schedules.filter(s => s.id !== id)
        } : null);
      }
      setSuccess('Horario eliminado correctamente');
    } catch (err) {
      console.error('Error deleting schedule:', err);
      setError('Error al eliminar el horario');
    }
  };

  const handleOpenProgramDialog = (program: ProgramWithSchedules) => {
    setSelectedProgram(program);
    setProgramFormData({ dayOfWeek: '', startTime: '', endTime: '', scheduleType: 'weekly', weekNumberInMonth: '', specificDate: '' });
    setBulkSchedules([]);
    setSelectedDays([]);
    setBulkTimeRange({ startTime: '', endTime: '' });
    setOpenProgramDialog(true);
    setCurrentTab(0);
  };

  const handleDeleteAllSchedulesForSelectedProgram = async () => {
    if (!selectedProgram) return;
    const confirmed = typeof window !== 'undefined'
      ? window.confirm('¿Eliminar TODOS los horarios de este programa? Esta acción no se puede deshacer.')
      : false;
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/schedules/program/${selectedProgram.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${typedSession?.accessToken || ''}`,
        },
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || 'No se pudieron eliminar los horarios');
      }
      setPrograms(prev => prev.map(p => p.id === selectedProgram.id ? { ...p, schedules: [] } : p));
      setSelectedProgram(prev => prev ? { ...prev, schedules: [] } : prev);
      setSuccess('Todos los horarios del programa fueron eliminados');
    } catch (err) {
      console.error('Error deleting all schedules:', err);
      setError((err as Error).message || 'Error al eliminar todos los horarios');
    }
  };

  const handleCloseProgramDialog = () => {
    setOpenProgramDialog(false);
    setSelectedProgram(null);
    setProgramFormData({ dayOfWeek: '', startTime: '', endTime: '', scheduleType: 'weekly', weekNumberInMonth: '', specificDate: '' });
    setBulkSchedules([]);
    setSelectedDays([]);
    setBulkTimeRange({ startTime: '', endTime: '' });
    setCurrentTab(0);
  };

  const handleAddProgramSchedule = async () => {
    if (!selectedProgram) return;
    try {
      const type = programFormData.scheduleType;
      if (!programFormData.startTime || !programFormData.endTime) {
        throw new Error('Los campos de horario son requeridos');
      }
      if ((type === 'weekly' || type === 'monthly_weekday') && !programFormData.dayOfWeek) {
        throw new Error('El día de la semana es requerido');
      }
      if (type === 'monthly_weekday' && !programFormData.weekNumberInMonth) {
        throw new Error('La semana del mes es requerida');
      }
      if (type === 'monthly_dated' && !programFormData.specificDate) {
        throw new Error('La fecha específica es requerida');
      }
      if (!selectedProgram.channel_id) {
        throw new Error('El programa debe estar asociado a un canal');
      }
      const newData: Record<string, unknown> = {
        programId: selectedProgram.id.toString(),
        channelId: selectedProgram.channel_id.toString(),
        startTime: programFormData.startTime,
        endTime: programFormData.endTime,
        scheduleType: type,
        ...(type !== 'monthly_dated' && { dayOfWeek: programFormData.dayOfWeek }),
        ...(type === 'monthly_weekday' && { weekNumberInMonth: parseInt(programFormData.weekNumberInMonth, 10) }),
        ...(type === 'monthly_dated' && { specificDate: programFormData.specificDate }),
      };
      const resp = await api.post<ScheduleType>('/schedules', newData, { headers: { Authorization: `Bearer ${typedSession?.accessToken}` } });
      const created = resp.data;
      setPrograms(programs.map(pr =>
        pr.id === selectedProgram.id
          ? { ...pr, schedules: [...pr.schedules, created] }
          : pr
      ));
      setSelectedProgram(prev =>
        prev && prev.id === selectedProgram.id
          ? { ...prev, schedules: [...prev.schedules, created] }
          : prev
      );
      setSuccess('Nuevo horario agregado correctamente');
      setProgramFormData({ dayOfWeek: '', startTime: '', endTime: '', scheduleType: 'weekly', weekNumberInMonth: '', specificDate: '' });
    } catch (err) {
      console.error('Error adding schedule:', err);
      setError((err as Error).message || 'Error al agregar el horario');
    }
  };

  const handleBulkCreateSchedules = async () => {
    if (!selectedProgram || !selectedProgram.channel_id) return;
    
    try {
      if (bulkSchedules.length === 0) {
        throw new Error('Debes agregar al menos un horario');
      }

      const bulkData = {
        programId: selectedProgram.id.toString(),
        channelId: selectedProgram.channel_id.toString(),
        schedules: bulkSchedules,
      };

      const response = await api.post<ScheduleType[]>('/schedules/bulk', bulkData, { 
        headers: { Authorization: `Bearer ${typedSession?.accessToken}` } 
      });
      
      const createdSchedules = response.data;
      
      // Update local state
      setPrograms(programs.map(pr =>
        pr.id === selectedProgram.id
          ? { ...pr, schedules: [...pr.schedules, ...createdSchedules] }
          : pr
      ));
      
      setSelectedProgram(prev =>
        prev && prev.id === selectedProgram.id
          ? { ...prev, schedules: [...prev.schedules, ...createdSchedules] }
          : prev
      );
      
      setSuccess(`${createdSchedules.length} horarios creados correctamente`);
      setBulkSchedules([]);
      setSelectedDays([]);
      setBulkTimeRange({ startTime: '', endTime: '' });
    } catch (err) {
      console.error('Error creating bulk schedules:', err);
      setError((err as Error).message || 'Error al crear los horarios');
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

    setBulkSchedules(prev => [...prev, ...newSchedules]);
    setSelectedDays([]);
    setBulkTimeRange({ startTime: '', endTime: '' });
  };

  const handleRemoveBulkSchedule = (index: number) => {
    setBulkSchedules(prev => prev.filter((_, i) => i !== index));
  };

  const handleDayToggle = (day: DayOfWeek) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" color="text.primary">Programas y Horarios</Typography>
      </Box>

      {/* Buscador en vivo */}
      <Box sx={{ mb: 2 }}>
        <TextField
          label="Buscar programa o canal…"
          variant="outlined"
          size="small"
          fullWidth
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Escribe para filtrar en vivo"
        />
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Programa</TableCell>
              <TableCell>Canal</TableCell>
              <TableCell>Horarios</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredPrograms.map(program => (
              <TableRow key={program.id}>
                <TableCell>{program.name}</TableCell>
                <TableCell>{program.channel_name || 'Sin canal'}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {program.schedules.map(schedule => (
                      <Chip
                        key={schedule.id}
                        label={formatScheduleLabel(schedule)}
                        onClick={() => handleOpenEditDialog(schedule)}
                        onDelete={() => handleDelete(schedule.id)}
                      />
                    ))}
                  </Box>
                </TableCell>
                <TableCell>
                  <Button variant="contained" onClick={() => handleOpenProgramDialog(program)} startIcon={<Add />}>
                    Gestionar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Diálogo de gestión de horarios */}
      <Dialog open={openProgramDialog} onClose={handleCloseProgramDialog} maxWidth="lg" fullWidth>
        <DialogTitle>
          {selectedProgram ? `Horarios de ${selectedProgram.name}` : 'Horarios'}
        </DialogTitle>
        <DialogContent>
          {selectedProgram && (
            <Box>
              {/* Tabs + Delete-all button at same vertical level */}
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Tabs value={currentTab} onChange={(_, newValue) => setCurrentTab(newValue)}>
                  <Tab 
                    label="Horarios Actuales" 
                    icon={<Schedule />}
                    iconPosition="start"
                  />
                  <Tab 
                    label="Agregar Horario" 
                    icon={<Add />}
                    iconPosition="start"
                  />
                  <Tab 
                    label="Creación Masiva" 
                    icon={<AddCircle />}
                    iconPosition="start"
                  />
                </Tabs>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<DeleteForever />}
                  onClick={handleDeleteAllSchedulesForSelectedProgram}
                  disabled={!selectedProgram}
                >
                  Eliminar todos los horarios
                </Button>
              </Box>

              {/* Current Schedules Tab */}
              {currentTab === 0 && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" color="text.primary">Horarios actuales</Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button variant="outlined" startIcon={<Add />} onClick={() => setCurrentTab(1)}>
                        Agregar Horario
                      </Button>
                    </Box>
                  </Box>
                  <TableContainer component={Paper} sx={{ mb: 2 }}>
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
                        {selectedProgram.schedules.map(schedule => (
                          <TableRow key={schedule.id}>
                            {editingSchedule?.id === schedule.id ? (
                              <>
                                <TableCell>
                                  <TextField
                                    select
                                    value={formData.scheduleType}
                                    onChange={(e) => setFormData({ ...formData, scheduleType: e.target.value })}
                                    fullWidth
                                    size="small"
                                  >
                                    {SCHEDULE_TYPES.map((type) => (
                                      <MenuItem key={type.value} value={type.value}>
                                        {type.label}
                                      </MenuItem>
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
                                      fullWidth
                                      size="small"
                                    />
                                  ) : (
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                      {formData.scheduleType === 'monthly_weekday' && (
                                        <TextField
                                          select
                                          value={formData.weekNumberInMonth}
                                          onChange={(e) => setFormData({ ...formData, weekNumberInMonth: e.target.value })}
                                          size="small"
                                          sx={{ minWidth: 80 }}
                                        >
                                          {WEEK_NUMBERS.map((w) => (
                                            <MenuItem key={w.value} value={w.value.toString()}>
                                              {w.label}
                                            </MenuItem>
                                          ))}
                                        </TextField>
                                      )}
                                      <TextField
                                        select
                                        value={formData.dayOfWeek}
                                        onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
                                        fullWidth
                                        size="small"
                                      >
                                        {DAYS_OF_WEEK.map((day) => (
                                          <MenuItem key={day.value} value={day.value}>
                                            {day.label}
                                          </MenuItem>
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
                                    fullWidth
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell>
                                  <TextField
                                    type="time"
                                    value={formData.endTime}
                                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                    InputLabelProps={{ shrink: true }}
                                    fullWidth
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell>
                                  <IconButton aria-label="Aceptar" onClick={handleSubmit}>
                                    <Check />
                                  </IconButton>
                                  <IconButton aria-label="Cancelar" onClick={handleCloseEditDialog}>
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
                                <TableCell>
                                  {schedule.schedule_type === 'monthly_dated'
                                    ? schedule.specific_date || '-'
                                    : schedule.schedule_type === 'monthly_weekday'
                                      ? `${WEEK_NUMBERS.find(w => w.value === schedule.week_number_in_month)?.label || ''} ${DAYS_OF_WEEK.find(d => d.value === schedule.day_of_week)?.label || schedule.day_of_week || ''}`
                                      : DAYS_OF_WEEK.find(d => d.value === schedule.day_of_week)?.label || schedule.day_of_week || '-'
                                  }
                                </TableCell>
                                <TableCell>{formatTime(schedule.start_time)}</TableCell>
                                <TableCell>{formatTime(schedule.end_time)}</TableCell>
                                <TableCell>
                                  <IconButton aria-label="Editar" onClick={() => handleOpenEditDialog(schedule)}><Edit /></IconButton>
                                  <IconButton aria-label="Eliminar" onClick={() => handleDelete(schedule.id)}><Delete /></IconButton>
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

              {/* Add Single Schedule Tab */}
              {currentTab === 1 && (
                <Box>
                  <Typography variant="h6" color="text.primary" sx={{ mb: 2 }}>
                    Agregar Nuevo Horario
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                    <TextField
                      select
                      label="Tipo de recurrencia"
                      value={programFormData.scheduleType}
                      onChange={(e) => setProgramFormData({ ...programFormData, scheduleType: e.target.value, dayOfWeek: '', weekNumberInMonth: '', specificDate: '' })}
                      fullWidth
                    >
                      {SCHEDULE_TYPES.map((type) => (
                        <MenuItem key={type.value} value={type.value}>
                          {type.label}
                        </MenuItem>
                      ))}
                    </TextField>

                    {programFormData.scheduleType === 'weekly' && (
                      <TextField
                        select
                        label="Día de la semana"
                        value={programFormData.dayOfWeek}
                        onChange={(e) => setProgramFormData({ ...programFormData, dayOfWeek: e.target.value })}
                        fullWidth
                      >
                        {DAYS_OF_WEEK.map((day) => (
                          <MenuItem key={day.value} value={day.value}>
                            {day.label}
                          </MenuItem>
                        ))}
                      </TextField>
                    )}

                    {programFormData.scheduleType === 'monthly_weekday' && (
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                          select
                          label="Semana del mes"
                          value={programFormData.weekNumberInMonth}
                          onChange={(e) => setProgramFormData({ ...programFormData, weekNumberInMonth: e.target.value })}
                          fullWidth
                        >
                          {WEEK_NUMBERS.map((w) => (
                            <MenuItem key={w.value} value={w.value.toString()}>
                              {w.label}
                            </MenuItem>
                          ))}
                        </TextField>
                        <TextField
                          select
                          label="Día de la semana"
                          value={programFormData.dayOfWeek}
                          onChange={(e) => setProgramFormData({ ...programFormData, dayOfWeek: e.target.value })}
                          fullWidth
                        >
                          {DAYS_OF_WEEK.map((day) => (
                            <MenuItem key={day.value} value={day.value}>
                              {day.label}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Box>
                    )}

                    {programFormData.scheduleType === 'monthly_dated' && (
                      <Box>
                        <TextField
                          label="Fecha específica"
                          type="date"
                          value={programFormData.specificDate}
                          onChange={(e) => setProgramFormData({ ...programFormData, specificDate: e.target.value })}
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
                        value={programFormData.startTime}
                        onChange={(e) => setProgramFormData({ ...programFormData, startTime: e.target.value })}
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                      />
                      <TextField
                        label="Hora de fin"
                        type="time"
                        value={programFormData.endTime}
                        onChange={(e) => setProgramFormData({ ...programFormData, endTime: e.target.value })}
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                      />
                    </Box>
                    <Button
                      variant="contained"
                      onClick={handleAddProgramSchedule}
                      fullWidth
                    >
                      Agregar
                    </Button>
                  </Box>
                </Box>
              )}

              {/* Bulk Create Tab */}
              {currentTab === 2 && (
                <Box>
                  <Typography variant="h6" color="text.primary" sx={{ mb: 2 }}>
                    Creación Masiva de Horarios
                  </Typography>
                  
                  {/* Bulk Schedule Builder */}
                  <Paper sx={{ p: 2, mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ mb: 2 }}>
                      Configurar horarios
                    </Typography>
                    
                    {/* Day Selection */}
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        Seleccionar días:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
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
                    </Box>

                    {/* Time Range */}
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
                        sx={{ alignSelf: 'flex-end' }}
                        disabled={selectedDays.length === 0 || !bulkTimeRange.startTime || !bulkTimeRange.endTime}
                      >
                        Agregar
                      </Button>
                    </Box>
                  </Paper>

                  {/* Bulk Schedules List */}
                  {bulkSchedules.length > 0 && (
                    <Paper sx={{ p: 2, mb: 2 }}>
                      <Typography variant="subtitle1" sx={{ mb: 2 }}>
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
                                aria-label="Eliminar"
                                edge="end"
                                onClick={() => handleRemoveBulkSchedule(index)}
                                color="error"
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
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseProgramDialog}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={!!error || !!success} autoHideDuration={6000} onClose={() => { setError(null); setSuccess(null); }}>
        <Alert onClose={() => { setError(null); setSuccess(null); }} severity={error ? 'error' : 'success'}>
          {error || success}
        </Alert>
      </Snackbar>
    </Box>
  );
}