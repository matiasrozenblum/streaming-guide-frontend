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
} from '@mui/material';
import { Edit, Delete, Add, Check, Close } from '@mui/icons-material';
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
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

type DayOfWeek = typeof DAYS_OF_WEEK[number];

interface ProgramWithSchedules extends Program {
  schedules: ScheduleType[];
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
  const [showAddScheduleForm, setShowAddScheduleForm] = useState(false);
  const [programFormData, setProgramFormData] = useState({ dayOfWeek: '', startTime: '', endTime: '' });

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const [schedulesRes, programsRes] = await Promise.all([
        api.get<ScheduleType[]>('/schedules', { headers: { Authorization: `Bearer ${typedSession?.accessToken}` } }),
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
  }, [typedSession]);

  useEffect(() => {
    if (status === 'authenticated' && typedSession?.user.role === 'admin') {
      fetchSchedules();
    }
  }, [status, typedSession?.accessToken, typedSession?.user.role, fetchSchedules]);

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
        day_of_week: formData.dayOfWeek,
        start_time: formData.startTime,
        end_time: formData.endTime,
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
    setOpenProgramDialog(true);
    setShowAddScheduleForm(false);
  };

  const handleCloseProgramDialog = () => {
    setOpenProgramDialog(false);
    setSelectedProgram(null);
    setProgramFormData({ dayOfWeek: '', startTime: '', endTime: '' });
    setShowAddScheduleForm(false);
  };

  const handleShowAddScheduleForm = () => setShowAddScheduleForm(true);

  const handleAddProgramSchedule = async () => {
    if (!selectedProgram) return;
    try {
      if (!programFormData.dayOfWeek || !programFormData.startTime || !programFormData.endTime) {
        throw new Error('Todos los campos son requeridos');
      }
      const newData = {
        program_id: selectedProgram.id,
        day_of_week: programFormData.dayOfWeek,
        start_time: programFormData.startTime,
        end_time: programFormData.endTime,
      };
      const resp = await api.post<ScheduleType>('/schedules', newData, { headers: { Authorization: `Bearer ${typedSession?.accessToken}` } });
      const created = resp.data;
      setPrograms(programs.map(pr =>
        pr.id === selectedProgram.id
          ? { ...pr, schedules: [...pr.schedules, created] }
          : pr
      ));
      setSuccess('Nuevo horario agregado correctamente');
      setShowAddScheduleForm(false);
    } catch (err) {
      console.error('Error adding schedule:', err);
      setError((err as Error).message || 'Error al agregar el horario');
    }
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
        <Typography variant="h5">Programas y Horarios</Typography>
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
                        label={`${schedule.day_of_week} ${formatTime(schedule.start_time)}-${formatTime(schedule.end_time)}`}
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
      <Dialog open={openProgramDialog} onClose={handleCloseProgramDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedProgram ? `Horarios de ${selectedProgram.name}` : 'Horarios'}
        </DialogTitle>
        <DialogContent>
          {selectedProgram && (
            <Box>
              {/* Horarios actuales y botón Agregar */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Horarios actuales</Typography>
                {!showAddScheduleForm && (
                  <Button variant="outlined" startIcon={<Add />} onClick={handleShowAddScheduleForm}>
                    Agregar Horario
                  </Button>
                )}
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
                                {DAYS_OF_WEEK.map((day: DayOfWeek) => (
                                  <MenuItem key={day} value={day}>
                                    {day}
                                  </MenuItem>
                                ))}
                              </TextField>
                            </TableCell>
                            <TableCell>
                              <TextField
                                type="time"
                                value={formData.startTime}
                                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                InputLabelProps={{ shrink: true }}
                                fullWidth
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                type="time"
                                value={formData.endTime}
                                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                InputLabelProps={{ shrink: true }}
                                fullWidth
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
                            <TableCell>{schedule.day_of_week}</TableCell>
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

              {/* Add Schedule Form */}
              {showAddScheduleForm && (
                <Box sx={{ mt: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Agregar Nuevo Horario</Typography>
                    <Button
                      variant="text"
                      onClick={() => setShowAddScheduleForm(false)}
                    >
                      Cancelar
                    </Button>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    <TextField
                      select
                      label="Día de la semana"
                      value={programFormData.dayOfWeek}
                      onChange={(e) => setProgramFormData({ ...programFormData, dayOfWeek: e.target.value })}
                      fullWidth
                    >
                      {DAYS_OF_WEEK.map((day: DayOfWeek) => (
                        <MenuItem key={day} value={day}>
                          {day}
                        </MenuItem>
                      ))}
                    </TextField>
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