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
import { Edit, Delete, Add, Schedule } from '@mui/icons-material';
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

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      const cookies = document.cookie.split(';');
      const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('backoffice_token='));
      const token = tokenCookie?.split('=')[1];
      const [schedulesResponse, programsResponse] = await Promise.all([
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

      const schedules = schedulesResponse.data;
      const programs = programsResponse.data;

      // Group schedules by program
      const programsWithSchedules = programs.map((program: Program) => ({
        ...program,
        schedules: schedules.filter((schedule: ScheduleType) => schedule.program.id === program.id),
      }));

      setPrograms(programsWithSchedules);
    } catch (error) {
      console.error('Error fetching data:', error);
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
      if (editingSchedule) {
        await api.put(`/schedules/${editingSchedule.id}`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        // Refresh the selected program's schedules
        if (selectedProgram) {
          const updatedProgram = await api.get(`/programs/${selectedProgram.id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          setSelectedProgram(updatedProgram.data);
        }
      } else {
        if (!formData.programId) {
          throw new Error('Debe seleccionar un programa');
        }
        await api.post('/schedules', {
          ...formData,
          programId: formData.programId,
        }, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
      fetchSchedules();
      handleCloseEditDialog();
    } catch (error) {
      console.error('Error saving schedule:', error);
      alert(error instanceof Error ? error.message : 'Error al guardar el horario');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este horario?')) {
      try {
        const cookies = document.cookie.split(';');
        const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('backoffice_token='));
        const token = tokenCookie?.split('=')[1];
        await api.delete(`/schedules/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        fetchSchedules();
      } catch (error) {
        console.error('Error deleting schedule:', error);
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
            {programs.map((program) => (
              <TableRow key={program.id}>
                <TableCell>{program.name}</TableCell>
                <TableCell>{program.channel?.name || 'Sin canal'}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {program.schedules.map((schedule) => (
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
                    onClick={() => handleOpenDialog(program)}
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
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedProgram ? `Horarios de ${selectedProgram.name}` : 'Nuevo Horario'}
        </DialogTitle>
        <DialogContent>
          {selectedProgram ? (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Horarios actuales</Typography>
                <Button
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={() => {
                    setEditingSchedule(null);
                    setFormData({
                      dayOfWeek: '',
                      startTime: '',
                      endTime: '',
                      programId: selectedProgram.id.toString(),
                    });
                  }}
                >
                  Agregar Horario
                </Button>
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
                    {selectedProgram.schedules.map((schedule) => (
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
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <TextField
                select
                label="Día de la semana"
                value={formData.dayOfWeek}
                onChange={(e) =>
                  setFormData({ ...formData, dayOfWeek: e.target.value })
                }
              >
                {DAYS_OF_WEEK.map((day) => (
                  <MenuItem key={day} value={day}>
                    {day}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Programa"
                value={formData.programId}
                onChange={(e) =>
                  setFormData({ ...formData, programId: e.target.value })
                }
              >
                {programs.map((program) => (
                  <MenuItem key={program.id} value={program.id}>
                    {program.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Hora de inicio"
                type="time"
                value={formData.startTime}
                onChange={(e) =>
                  setFormData({ ...formData, startTime: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Hora de fin"
                type="time"
                value={formData.endTime}
                onChange={(e) =>
                  setFormData({ ...formData, endTime: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cerrar</Button>
          {!selectedProgram && (
            <Button onClick={handleSubmit} variant="contained">
              Crear
            </Button>
          )}
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
              onChange={(e) =>
                setFormData({ ...formData, dayOfWeek: e.target.value })
              }
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
              onChange={(e) =>
                setFormData({ ...formData, startTime: e.target.value })
              }
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Hora de fin"
              type="time"
              value={formData.endTime}
              onChange={(e) =>
                setFormData({ ...formData, endTime: e.target.value })
              }
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