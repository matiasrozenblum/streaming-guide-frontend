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
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
import { api } from '@/services/api';
import { Schedule as ScheduleType } from '@/types/schedule';
import { Program } from '@/types/program';

const DAYS_OF_WEEK = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

interface ProgramWithSchedules extends Program {
  schedules: ScheduleType[];
}

export function SchedulesTable() {
  const [programs, setPrograms] = useState<ProgramWithSchedules[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<ProgramWithSchedules | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleType | null>(null);
  const [formData, setFormData] = useState({
    dayOfWeek: '',
    startTime: '',
    endTime: '',
    programId: '',
  });
  const [error, setError] = useState<string | null>(null);
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

  const handleOpenDialog = (program: ProgramWithSchedules) => {
    setSelectedProgram(program);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedProgram(null);
    setEditingSchedule(null);
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
        await api.put(`/schedules/${editingSchedule.id}`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } else {
        // Validate required fields
        if (!formData.programId || !formData.dayOfWeek || !formData.startTime || !formData.endTime) {
          throw new Error('Todos los campos son requeridos');
        }

        // Format the data for creating a new schedule
        const scheduleData = {
          programId: formData.programId.toString(),
          channelId: formData.programId.toString(), // Using programId as channelId for now
          dayOfWeek: formData.dayOfWeek,
          startTime: formData.startTime,
          endTime: formData.endTime,
        };

        console.log('Form Data:', formData);
        console.log('Schedule Data:', scheduleData);
        console.log('Token:', token);

        try {
          const response = await api.post('/schedules', scheduleData, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          console.log('API Response:', response.data);
        } catch (error: any) {
          console.error('Full Error:', error);
          console.error('Error Response:', error.response?.data);
          
          // Handle validation errors
          if (error.response?.data?.message) {
            const validationErrors = error.response.data.message;
            const errorMessage = Array.isArray(validationErrors) 
              ? validationErrors.join('\n')
              : validationErrors;
            throw new Error(errorMessage);
          }
          
          throw error;
        }
      }
      await fetchSchedules();
      handleCloseDialog();
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
      const cookies = document.cookie.split(';');
      const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('backoffice_token='));
      const token = tokenCookie?.split('=')[1];
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      await api.delete(`/schedules/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      await fetchSchedules();
    } catch (error) {
      console.error('Error deleting schedule:', error);
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

      // Update only the selected program's schedules
      if (selectedProgram) {
        const updatedProgram = await api.get(`/programs/${selectedProgram.id}?include=schedules`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setSelectedProgram(updatedProgram.data);
        
        // Update the program in the main list
        setPrograms(programs.map(p => 
          p.id === selectedProgram.id ? updatedProgram.data : p
        ));
      }

      // Reset form
      setProgramFormData({
        ...programFormData,
        dayOfWeek: '',
        startTime: '',
        endTime: '',
      });
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
    return <Typography>Cargando...</Typography>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">Programas y Horarios</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            setEditingSchedule(null);
            setFormData({
              dayOfWeek: '',
              startTime: '',
              endTime: '',
              programId: '',
            });
            setOpenDialog(true);
          }}
        >
          Nuevo Horario
        </Button>
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
                        <TableCell>{schedule.day_of_week}</TableCell>
                        <TableCell>{schedule.start_time}</TableCell>
                        <TableCell>{schedule.end_time}</TableCell>
                        <TableCell>
                          <IconButton onClick={() => handleOpenEditDialog(schedule)}>
                            <Edit />
                          </IconButton>
                          <IconButton onClick={() => handleDelete(schedule.id)}>
                            <Delete />
                          </IconButton>
                        </TableCell>
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
                      {DAYS_OF_WEEK.map((day) => (
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

      {/* Edit Schedule Dialog */}
      <Dialog open={!!editingSchedule} onClose={handleCloseEditDialog}>
        <DialogTitle>Editar Horario</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              select
              label="Día de la semana"
              value={formData.dayOfWeek}
              onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
            >
              {DAYS_OF_WEEK.map((day) => (
                <MenuItem key={day} value={day}>
                  {day}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Hora de inicio"
              type="time"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Hora de fin"
              type="time"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">
            Actualizar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 