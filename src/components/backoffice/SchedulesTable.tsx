'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Box,
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
  const [programs, setPrograms] = useState<ProgramWithSchedules[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProgram, setSelectedProgram] = useState<ProgramWithSchedules | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleType | null>(null);
  const [formData, setFormData] = useState({
    dayOfWeek: '',
    startTime: '',
    endTime: '',
    programId: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openProgramDialog, setOpenProgramDialog] = useState(false);
  const [showAddScheduleForm, setShowAddScheduleForm] = useState(false);
  const [programFormData, setProgramFormData] = useState({
    dayOfWeek: '',
    startTime: '',
    endTime: '',
    programId: '',
  });

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const cookies = document.cookie.split(';');
      const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('backoffice_token='));
      const token = tokenCookie?.split('=')[1];
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const [schedulesRes, programsRes] = await Promise.all([
        api.get('/schedules', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        api.get('/programs?include=channel', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      const schedules = schedulesRes.data || [];
      const programs = programsRes.data || [];

      // Group schedules by program
      const programsWithSchedules = programs.map((program: Program) => ({
        ...program,
        schedules: (schedules || []).filter((schedule: ScheduleType) => schedule.program?.id === program.id),
      }));

      setPrograms(programsWithSchedules);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Error al cargar los datos');
      setPrograms([]);
    } finally {
      setLoading(false);
    }
  };

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
    setFormData({
      dayOfWeek: '',
      startTime: '',
      endTime: '',
      programId: '',
    });
  };

  const handleSubmit = async () => {
    try {
      const cookies = document.cookie.split(';');
      const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('backoffice_token='));
      const token = tokenCookie?.split('=')[1];
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      if (editingSchedule) {
        const scheduleData = {
          programId: editingSchedule.program.id.toString(),
          channelId: editingSchedule.program.id.toString(),
          dayOfWeek: formData.dayOfWeek,
          startTime: formData.startTime,
          endTime: formData.endTime,
        };

        const response = await api.put(`/schedules/${editingSchedule.id}`, scheduleData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // Update the program's schedules in both the main list and dialog
        const updatedSchedule = response.data;
        const programId = editingSchedule.program.id;

        // Update the main programs list
        setPrograms(programs.map(program => {
          if (program.id === programId) {
            return {
              ...program,
              schedules: program.schedules.map(schedule => 
                schedule.id === editingSchedule.id ? updatedSchedule : schedule
              )
            };
          }
          return program;
        }));

        // Update the selected program in the dialog
        if (selectedProgram?.id === programId) {
          setSelectedProgram(prev => {
            if (!prev) return null;
            return {
              ...prev,
              schedules: prev.schedules.map(schedule => 
                schedule.id === editingSchedule.id ? updatedSchedule : schedule
              )
            };
          });
        }

        setSuccess(`Horario actualizado correctamente`);
        handleCloseEditDialog();
      }
    } catch (error) {
      console.error('Error saving schedule:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Error al guardar el horario');
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este horario?')) {
      return;
    }

    try {
      console.log('Starting handleDelete for schedule ID:', id);
      const cookies = document.cookie.split(';');
      const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('backoffice_token='));
      const token = tokenCookie?.split('=')[1];
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('Fetching schedule to delete...');
      const scheduleToDelete = await api.get(`/schedules/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log('Schedule to delete:', scheduleToDelete.data);
      const programId = scheduleToDelete.data.program.id;
      console.log('Affected program ID:', programId);

      console.log('Deleting schedule...');
      const deleteResponse = await api.delete(`/schedules/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log('Delete response:', deleteResponse.data);

      // Update the programs state by removing the deleted schedule
      setPrograms(programs.map(program => {
        if (program.id === programId) {
          return {
            ...program,
            schedules: program.schedules.filter(schedule => schedule.id !== id)
          };
        }
        return program;
      }));

      // If the program is currently selected in the dialog, update it too
      if (selectedProgram?.id === programId) {
        setSelectedProgram(prev => {
          if (!prev) return null;
          return {
            ...prev,
            schedules: prev.schedules.filter(schedule => schedule.id !== id)
          };
        });
      }

      setSuccess(`Horario eliminado correctamente`);
    } catch (error) {
      console.error('Error in handleDelete:', error);
      setError('Error al eliminar el horario');
    }
  };

  const handleOpenProgramDialog = (program: ProgramWithSchedules) => {
    setSelectedProgram(program);
    setProgramFormData({
      ...programFormData,
      programId: program.id.toString(),
    });
    setOpenProgramDialog(true);
    setShowAddScheduleForm(false);
  };

  const handleCloseProgramDialog = () => {
    setOpenProgramDialog(false);
    setSelectedProgram(null);
    setShowAddScheduleForm(false);
  };

  const handleShowAddScheduleForm = () => {
    setShowAddScheduleForm(true);
  };

  const handleAddProgramSchedule = async () => {
    try {
      const cookies = document.cookie.split(';');
      const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('backoffice_token='));
      const token = tokenCookie?.split('=')[1];
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Validate required fields
      if (!programFormData.dayOfWeek || !programFormData.startTime || !programFormData.endTime) {
        throw new Error('Todos los campos son requeridos');
      }

      const scheduleData = {
        programId: programFormData.programId,
        channelId: programFormData.programId,
        dayOfWeek: programFormData.dayOfWeek,
        startTime: programFormData.startTime,
        endTime: programFormData.endTime,
      };

      const response = await api.post('/schedules', scheduleData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // Update the program's schedules in both the main list and dialog
      const newSchedule = response.data;
      const programId = parseInt(programFormData.programId);

      // Update the main programs list
      setPrograms(programs.map(program => {
        if (program.id === programId) {
          return {
            ...program,
            schedules: [...(program.schedules || []), newSchedule]
          };
        }
        return program;
      }));

      // Update the selected program in the dialog
      if (selectedProgram?.id === programId) {
        setSelectedProgram(prev => {
          if (!prev) return null;
          return {
            ...prev,
            schedules: [...(prev.schedules || []), newSchedule]
          };
        });
      }

      // Reset form and hide it
      setProgramFormData({
        ...programFormData,
        dayOfWeek: '',
        startTime: '',
        endTime: '',
      });
      setShowAddScheduleForm(false);

      setSuccess(`Nuevo horario agregado correctamente`);
    } catch (error) {
      console.error('Error adding schedule:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Error al agregar el horario');
      }
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">Programas y Horarios</Typography>
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
            {(programs || []).map((program) => (
              <TableRow key={program.id}>
                <TableCell>{program.name}</TableCell>
                <TableCell>{program.channel?.name || 'Sin canal'}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {(program.schedules || []).map((schedule) => (
                      <Chip
                        key={schedule.id}
                        label={`${schedule.day_of_week} ${schedule.start_time}-${schedule.end_time}`}
                        onClick={() => handleOpenEditDialog(schedule)}
                        onDelete={() => handleDelete(schedule.id)}
                      />
                    ))}
                  </Box>
                </TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleOpenProgramDialog(program)}
                  >
                    Gestionar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Program Schedules Dialog */}
      <Dialog open={openProgramDialog} onClose={handleCloseProgramDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedProgram ? `Horarios de ${selectedProgram.name}` : 'Nuevo Horario'}
        </DialogTitle>
        <DialogContent>
          {selectedProgram && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Horarios actuales</Typography>
                {!showAddScheduleForm && (
                  <Button
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={handleShowAddScheduleForm}
                  >
                    Agregar Horario
                  </Button>
                )}
              </Box>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Día</TableCell>
                      <TableCell>Hora Inicio</TableCell>
                      <TableCell>Hora Fin</TableCell>
                      <TableCell>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(selectedProgram.schedules || []).map((schedule) => (
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
                              <IconButton onClick={() => handleOpenEditDialog(schedule)}>
                                <Edit />
                              </IconButton>
                              <IconButton onClick={() => handleDelete(schedule.id)}>
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

      {/* Snackbar for notifications */}
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