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
import { 
  Edit, 
  Delete, 
  Add, 
  Check, 
  Close, 
  AddCircle,
  Schedule,
} from '@mui/icons-material';
import { api } from '@/services/api';
import { Schedule as ScheduleType } from '@/types/schedule';
import { Program } from '@/types/program';
import { useSessionContext } from '@/contexts/SessionContext';
import type { SessionWithToken } from '@/types/session';
import { StandardTimePicker, TimeRangePicker } from '@/components/common/DateTimePickers';

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
  const [formData, setFormData] = useState({ dayOfWeek: '', startTime: '', endTime: '', programId: '' });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openProgramDialog, setOpenProgramDialog] = useState(false);
  const [programFormData, setProgramFormData] = useState({ dayOfWeek: '', startTime: '', endTime: '' });
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
      dayOfWeek: schedule.day_of_week,
      startTime: schedule.start_time,
      endTime: schedule.end_time,
      programId: schedule.program.id.toString(),
    });
  };

  const handleCloseEditDialog = () => {
    setEditingSchedule(null);
    setFormData({ dayOfWeek: '', startTime: '', endTime: '', programId: '' });
  };

  const handleSubmit = async () => {
    if (!editingSchedule) return;
    try {
      const updateData = {
        dayOfWeek: formData.dayOfWeek,
        startTime: formData.startTime,
        endTime: formData.endTime,
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
    setProgramFormData({ dayOfWeek: '', startTime: '', endTime: '' });
    setBulkSchedules([]);
    setSelectedDays([]);
    setBulkTimeRange({ startTime: '', endTime: '' });
    setOpenProgramDialog(true);
    setCurrentTab(0);
  };

  const handleCloseProgramDialog = () => {
    setOpenProgramDialog(false);
    setSelectedProgram(null);
    setProgramFormData({ dayOfWeek: '', startTime: '', endTime: '' });
    setBulkSchedules([]);
    setSelectedDays([]);
    setBulkTimeRange({ startTime: '', endTime: '' });
    setCurrentTab(0);
  };

  const handleAddProgramSchedule = async () => {
    if (!selectedProgram) return;
    try {
      if (!programFormData.dayOfWeek || !programFormData.startTime || !programFormData.endTime) {
        throw new Error('Todos los campos son requeridos');
      }
      if (!selectedProgram.channel_id) {
        throw new Error('El programa debe estar asociado a un canal');
      }
      const newData = {
        programId: selectedProgram.id.toString(),
        channelId: selectedProgram.channel_id.toString(),
        dayOfWeek: programFormData.dayOfWeek,
        startTime: programFormData.startTime,
        endTime: programFormData.endTime,
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
      setProgramFormData({ dayOfWeek: '', startTime: '', endTime: '' });
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
                        label={`${DAYS_OF_WEEK.find(d => d.value === schedule.day_of_week)?.label || schedule.day_of_week} ${formatTime(schedule.start_time)}-${formatTime(schedule.end_time)}`}
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
              {/* Tabs */}
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
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
                          <TableCell>Día</TableCell>
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
                                    value={formData.dayOfWeek}
                                    onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
                                    fullWidth
                                  >
                                    {DAYS_OF_WEEK.map((day) => (
                                      <MenuItem key={day.value} value={day.value}>
                                        {day.label}
                                      </MenuItem>
                                    ))}
                                  </TextField>
                                </TableCell>
                                <TableCell>
                                  <StandardTimePicker
                                    label=""
                                    value={formData.startTime}
                                    onChange={(value) => setFormData({ ...formData, startTime: value })}
                                    fullWidth
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell>
                                  <StandardTimePicker
                                    label=""
                                    value={formData.endTime}
                                    onChange={(value) => setFormData({ ...formData, endTime: value })}
                                    fullWidth
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell>
                                  <IconButton onClick={handleSubmit}>
                                    <Check />
                                  </IconButton>
                                  <IconButton onClick={handleCloseEditDialog}>
                                    <Close />
                                  </IconButton>
                                </TableCell>
                              </>
                            ) : (
                              <>
                                <TableCell>{DAYS_OF_WEEK.find(d => d.value === schedule.day_of_week)?.label || schedule.day_of_week}</TableCell>
                                <TableCell>{formatTime(schedule.start_time)}</TableCell>
                                <TableCell>{formatTime(schedule.end_time)}</TableCell>
                                <TableCell>
                                  <IconButton onClick={() => handleOpenEditDialog(schedule)}><Edit /></IconButton>
                                  <IconButton onClick={() => handleDelete(schedule.id)}><Delete /></IconButton>
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
                  <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
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
                    <TimeRangePicker
                      startLabel="Hora de inicio"
                      endLabel="Hora de fin"
                      startValue={programFormData.startTime}
                      endValue={programFormData.endTime}
                      onStartChange={(value) => setProgramFormData({ ...programFormData, startTime: value })}
                      onEndChange={(value) => setProgramFormData({ ...programFormData, endTime: value })}
                      fullWidth
                    />
                    <Button
                      variant="contained"
                      onClick={handleAddProgramSchedule}
                      sx={{ alignSelf: 'flex-end' }}
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
                      <TimeRangePicker
                        startLabel="Hora de inicio"
                        endLabel="Hora de fin"
                        startValue={bulkTimeRange.startTime}
                        endValue={bulkTimeRange.endTime}
                        onStartChange={(value) => setBulkTimeRange({ ...bulkTimeRange, startTime: value })}
                        onEndChange={(value) => setBulkTimeRange({ ...bulkTimeRange, endTime: value })}
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