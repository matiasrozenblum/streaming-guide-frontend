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
  Autocomplete,
} from '@mui/material';
import {
  Add,
  Delete,
  Edit,
  Refresh,
  Schedule,
  Cancel,
  AccessTime,
  SwapHoriz,
  Analytics,
  Settings,
  AddCircle,
  Group,
} from '@mui/icons-material';
import { useSessionContext } from '@/contexts/SessionContext';
import type { SessionWithToken } from '@/types/session';
import type { Schedule as ScheduleType } from '@/types/schedule';
import type { WeeklyOverride } from '@/types/schedule';
import type { Program } from '@/types/program';
import type { Panelist } from '@/types/panelist';
import { useTheme } from '@mui/material/styles';

// Types
interface WeeklyStats {
  weekStart: string;
  totalOverrides: number;
  byType: {
    cancel: number;
    time_change: number;
    reschedule: number;
    create: number;
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
  { value: 'create', label: 'Programa especial', icon: AddCircle, color: 'success' as const },
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
  const [programs, setPrograms] = useState<Program[]>([]);
  const [panelists, setPanelists] = useState<Panelist[]>([]);
  const [stats, setStats] = useState<WeeklyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleType | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [panelistSearchTerm, setPanelistSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    targetWeek: 'current' as 'current' | 'next',
    overrideType: 'cancel' as 'cancel' | 'time_change' | 'reschedule' | 'create',
    newStartTime: '',
    newEndTime: '',
    newDayOfWeek: '',
    reason: '',
    panelistIds: [] as number[],
    specialProgram: {
      name: '',
      description: '',
      channelId: 0,
      imageUrl: '',
    },
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [channels, setChannels] = useState<{ id: number; name: string }[]>([]);
  const [editingOverride, setEditingOverride] = useState<WeeklyOverride | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!typedSession?.accessToken) return;

    try {
      setLoading(true);
      console.log('Fetching weekly overrides data...');
      
      const [overridesRes, schedulesRes, programsRes, panelistsRes, statsRes] = await Promise.all([
        fetch('/api/weekly-overrides', {
          headers: { Authorization: `Bearer ${typedSession.accessToken}` },
        }),
        fetch('/api/schedules?raw=true', {
          headers: { Authorization: `Bearer ${typedSession.accessToken}` },
        }),
        fetch('/api/programs', {
          headers: { Authorization: `Bearer ${typedSession.accessToken}` },
        }),
        fetch('/api/panelists', {
          headers: { Authorization: `Bearer ${typedSession.accessToken}` },
        }),
        fetch('/api/weekly-schedule-manager/current-week-stats', {
          headers: { Authorization: `Bearer ${typedSession.accessToken}` },
        }),
      ]);

      console.log('Response statuses:', {
        overrides: overridesRes.status,
        schedules: schedulesRes.status,
        programs: programsRes.status,
        panelists: panelistsRes.status,
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

      if (programsRes.ok) {
        const programsData = await programsRes.json();
        console.log('Programs data length:', programsData?.length);
        setPrograms(programsData || []);
      } else {
        console.error('Failed to fetch programs:', programsRes.status, await programsRes.text());
      }

      if (panelistsRes.ok) {
        const panelistsData = await panelistsRes.json();
        console.log('Panelists data length:', panelistsData?.length);
        setPanelists(panelistsData || []);
      } else {
        console.error('Failed to fetch panelists:', panelistsRes.status, await panelistsRes.text());
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

  useEffect(() => {
    async function fetchChannels() {
      try {
        const res = await fetch('/api/channels');
        if (!res.ok) throw new Error('Failed to fetch channels');
        const data = await res.json();
        setChannels(data);
      } catch (err) {
        console.error('Error fetching channels:', err);
      }
    }
    fetchChannels();
  }, []);

  // Handlers
  const handleOpenDialog = (schedule: ScheduleType) => {
    setSelectedSchedule(schedule);
    setSelectedProgram(null);
    setFormData({
      targetWeek: 'current',
      overrideType: 'cancel',
      newStartTime: schedule.start_time,
      newEndTime: schedule.end_time,
      newDayOfWeek: schedule.day_of_week,
      reason: '',
      panelistIds: [],
      specialProgram: {
        name: '',
        description: '',
        channelId: 0,
        imageUrl: '',
      },
    });
    setOpenDialog(true);
  };

  const handleOpenProgramDialog = (program: Program) => {
    setSelectedProgram(program);
    setSelectedSchedule(null);
    setFormData({
      targetWeek: 'current',
      overrideType: 'cancel',
      newStartTime: '',
      newEndTime: '',
      newDayOfWeek: '',
      reason: '',
      panelistIds: program.panelists?.map(p => p.id) || [],
      specialProgram: {
        name: '',
        description: '',
        channelId: 0,
        imageUrl: '',
      },
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedSchedule(null);
    setSelectedProgram(null);
    setEditingOverride(null);
    setIsEditMode(false);
    setPanelistSearchTerm('');
    setFormData({
      targetWeek: 'current',
      overrideType: 'cancel',
      newStartTime: '',
      newEndTime: '',
      newDayOfWeek: '',
      reason: '',
      panelistIds: [],
      specialProgram: {
        name: '',
        description: '',
        channelId: 0,
        imageUrl: '',
      },
    });
  };

  const handleSubmit = async () => {
    if (!selectedSchedule && !selectedProgram && formData.overrideType !== 'create' && !isEditMode) return;

    try {
      interface OverridePayload {
        targetWeek: 'current' | 'next';
        overrideType: 'cancel' | 'time_change' | 'reschedule' | 'create';
        newStartTime?: string;
        newEndTime?: string;
        newDayOfWeek?: string;
        reason?: string;
        createdBy?: string;
        scheduleId?: number;
        programId?: number;
        panelistIds?: number[];
        specialProgram?: {
          name: string;
          description?: string;
          channelId: number;
          imageUrl?: string;
        };
      }

      const payload: OverridePayload = {
        targetWeek: formData.targetWeek,
        overrideType: formData.overrideType,
        ...(formData.overrideType !== 'cancel' && {
          newStartTime: formData.newStartTime,
          newEndTime: formData.newEndTime,
        }),
        ...(formData.overrideType === 'reschedule' && {
          newDayOfWeek: formData.newDayOfWeek,
        }),
        ...(formData.overrideType === 'create' && {
          newDayOfWeek: formData.newDayOfWeek,
          specialProgram: formData.specialProgram,
        }),
        // For edit mode, use the existing override's IDs; for create mode, use selected entities
        ...(isEditMode && editingOverride ? {
          ...(editingOverride.scheduleId && { scheduleId: editingOverride.scheduleId }),
          ...(editingOverride.programId && { programId: editingOverride.programId }),
        } : {
          ...(formData.overrideType !== 'create' && selectedSchedule && {
            scheduleId: selectedSchedule.id,
          }),
          ...(formData.overrideType !== 'create' && selectedProgram && {
            programId: selectedProgram.id,
          }),
        }),
        ...(formData.panelistIds.length > 0 && {
          panelistIds: formData.panelistIds,
        }),
        reason: formData.reason,
        createdBy: typedSession?.user?.name || 'Admin',
      };

      const url = isEditMode && editingOverride 
        ? `/api/weekly-overrides/${editingOverride.id}`
        : '/api/weekly-overrides';
      
      const method = isEditMode ? 'PUT' : 'POST';
      
      console.log('Submitting override:', { isEditMode, editingOverride, payload, url, method });
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${typedSession?.accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error al ${isEditMode ? 'actualizar' : 'crear'} el cambio`);
      }

      setSuccess(`Cambio semanal ${isEditMode ? 'actualizado' : 'creado'} correctamente`);
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

  const handleEdit = (override: WeeklyOverride) => {
    setEditingOverride(override);
    setIsEditMode(true);
    
    // Populate form with existing data
    setFormData({
      targetWeek: override.weekStartDate === getWeekStartDate('current') ? 'current' : 'next',
      overrideType: override.overrideType,
      newStartTime: override.newStartTime || '',
      newEndTime: override.newEndTime || '',
      newDayOfWeek: override.newDayOfWeek || '',
      reason: override.reason || '',
      panelistIds: override.panelistIds || [],
      specialProgram: override.specialProgram ? {
        name: override.specialProgram.name || '',
        description: override.specialProgram.description || '',
        channelId: override.specialProgram.channelId || 0,
        imageUrl: override.specialProgram.imageUrl || '',
      } : {
        name: '',
        description: '',
        channelId: 0,
        imageUrl: '',
      },
    });
    
    setOpenDialog(true);
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

  const getOverrideColor = (type: string): "error" | "warning" | "info" | "success" => {
    const override = OVERRIDE_TYPES.find(ot => ot.value === type);
    return override ? override.color : 'info';
  };

  const getOverrideLabel = (type: string) => {
    const override = OVERRIDE_TYPES.find(ot => ot.value === type);
    return override ? override.label : type;
  };

  const getWeekStartDate = (targetWeek: 'current' | 'next'): string => {
    const now = new Date();
    const currentDay = now.getDay();
    const daysToMonday = currentDay === 0 ? 6 : currentDay - 1; // Sunday = 0, Monday = 1
    
    if (targetWeek === 'current') {
      const monday = new Date(now);
      monday.setDate(now.getDate() - daysToMonday);
      return monday.toISOString().split('T')[0];
    } else {
      const nextMonday = new Date(now);
      nextMonday.setDate(now.getDate() - daysToMonday + 7);
      return nextMonday.toISOString().split('T')[0];
    }
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
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ minWidth: 120 }}>
                <Typography variant="body2" color="text.secondary">Total de cambios</Typography>
                <Typography variant="h5">{stats.totalOverrides}</Typography>
              </Box>
              <Box sx={{ minWidth: 120 }}>
                <Typography variant="body2" color="text.secondary">Cancelaciones</Typography>
                <Typography variant="h5" color="error.main">{stats.byType.cancel}</Typography>
              </Box>
              <Box sx={{ minWidth: 120 }}>
                <Typography variant="body2" color="text.secondary">Cambios de horario</Typography>
                <Typography variant="h5" color="warning.main">{stats.byType.time_change}</Typography>
              </Box>
              <Box sx={{ minWidth: 120 }}>
                <Typography variant="body2" color="text.secondary">Reprogramaciones</Typography>
                <Typography variant="h5" color="info.main">{stats.byType.reschedule}</Typography>
              </Box>
              <Box sx={{ minWidth: 120 }}>
                <Typography variant="body2" color="text.secondary">Programas especiales</Typography>
                <Typography variant="h5" color="success.main">{stats.byType.create}</Typography>
              </Box>
            </Box>
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
          <Tab 
            label="Cambios por Programa" 
            sx={{ fontWeight: 600, color: 'text.primary' }}
          />
          <Tab 
            label="Programas Especiales" 
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
                <TableCell>Panelistas</TableCell>
                <TableCell>Motivo</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {currentWeekOverrides.map((override) => {
                const schedule = override.scheduleId ? schedules.find(s => s.id === override.scheduleId) : null;
                const program = override.programId ? programs.find(p => p.id === override.programId) : null;
                const Icon = getOverrideIcon(override.overrideType);
                
                return (
                  <TableRow key={override.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {override.overrideType === 'create' 
                          ? override.specialProgram?.name || 'Programa especial'
                          : program?.name || schedule?.program.name || 'Programa desconocido'
                        }
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {override.overrideType === 'create'
                          ? `Canal ID: ${override.specialProgram?.channelId || 'N/A'}`
                          : program?.channel_name || schedule?.program.channel?.name || 'Sin canal'
                        }
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
                        {override.overrideType === 'create'
                          ? `${getDayLabel(override.newDayOfWeek || '')} ${formatTime(override.newStartTime || '')}-${formatTime(override.newEndTime || '')}`
                          : schedule 
                            ? `${getDayLabel(schedule.day_of_week)} ${formatTime(schedule.start_time)}-${formatTime(schedule.end_time)}`
                            : 'Programa completo'
                        }
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
                    <TableCell>
                      {override.panelistIds && override.panelistIds.length > 0 ? (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {override.panelistIds.map(panelistId => {
                            const panelist = panelists.find(p => p.id === panelistId);
                            return panelist ? (
                              <Chip
                                key={panelistId}
                                label={panelist.name}
                                size="small"
                                icon={<Group />}
                                variant="outlined"
                              />
                            ) : null;
                          })}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">—</Typography>
                      )}
                    </TableCell>
                    <TableCell>{override.reason || '—'}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton onClick={() => handleEdit(override)} color="primary">
                          <Edit />
                        </IconButton>
                        <IconButton onClick={() => handleDelete(override.id)} color="error">
                          <Delete />
                        </IconButton>
                      </Box>
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
                <TableCell>Panelistas</TableCell>
                <TableCell>Motivo</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {nextWeekOverrides.map((override) => {
                const schedule = override.scheduleId ? schedules.find(s => s.id === override.scheduleId) : null;
                const program = override.programId ? programs.find(p => p.id === override.programId) : null;
                const Icon = getOverrideIcon(override.overrideType);
                
                return (
                  <TableRow key={override.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {override.overrideType === 'create' 
                          ? override.specialProgram?.name || 'Programa especial'
                          : program?.name || schedule?.program.name || 'Programa desconocido'
                        }
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {override.overrideType === 'create'
                          ? `Canal ID: ${override.specialProgram?.channelId || 'N/A'}`
                          : program?.channel_name || schedule?.program.channel?.name || 'Sin canal'
                        }
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
                        {override.overrideType === 'create'
                          ? `${getDayLabel(override.newDayOfWeek || '')} ${formatTime(override.newStartTime || '')}-${formatTime(override.newEndTime || '')}`
                          : schedule 
                            ? `${getDayLabel(schedule.day_of_week)} ${formatTime(schedule.start_time)}-${formatTime(schedule.end_time)}`
                            : 'Programa completo'
                        }
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
                    <TableCell>
                      {override.panelistIds && override.panelistIds.length > 0 ? (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {override.panelistIds.map(panelistId => {
                            const panelist = panelists.find(p => p.id === panelistId);
                            return panelist ? (
                              <Chip
                                key={panelistId}
                                label={panelist.name}
                                size="small"
                                icon={<Group />}
                                variant="outlined"
                              />
                            ) : null;
                          })}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">—</Typography>
                      )}
                    </TableCell>
                    <TableCell>{override.reason || '—'}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton onClick={() => handleEdit(override)} color="primary">
                          <Edit />
                        </IconButton>
                        <IconButton onClick={() => handleDelete(override.id)} color="error">
                          <Delete />
                        </IconButton>
                      </Box>
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
            Selecciona un horario para crear un cambio semanal
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
                    <TableCell sx={{ fontWeight: 600 }}>Panelistas</TableCell>
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
                          {schedule.program.panelists && schedule.program.panelists.length > 0 ? (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {schedule.program.panelists.map(panelist => (
                                <Chip
                                  key={panelist.id}
                                  label={panelist.name}
                                  size="small"
                                  icon={<Group />}
                                  variant="outlined"
                                />
                              ))}
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">—</Typography>
                          )}
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

      {/* Program-Level Overrides Tab */}
      {currentTab === 3 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ color: 'text.primary', fontWeight: 600 }}>
            Crear cambios a nivel de programa (afecta todos los horarios del programa)
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Selecciona un programa para crear un cambio que afecte a todos sus horarios semanales. Esto es útil para cancelar o modificar un programa completo.
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
              placeholder="Escribe para filtrar programas"
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'background.paper',
                },
              }}
            />
          </Box>

          {programs.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No hay programas disponibles
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Programa</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Canal</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Horarios</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Panelistas</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {programs
                    .filter((program) => {
                      const searchLower = searchTerm.toLowerCase();
                      return (
                        program.name.toLowerCase().includes(searchLower) ||
                        (program.channel_name || '').toLowerCase().includes(searchLower)
                      );
                    })
                    .map((program) => {
                      const programSchedules = schedules.filter(s => s.program.id === program.id);
                      return (
                        <TableRow key={program.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold">
                              {program.name}
                            </Typography>
                            {program.description && (
                              <Typography variant="caption" color="text.secondary">
                                {program.description}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {program.channel_name || 'Sin canal'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {programSchedules.length} horario{programSchedules.length !== 1 ? 's' : ''}
                            </Typography>
                            {programSchedules.length > 0 && (
                              <Typography variant="caption" color="text.secondary">
                                {programSchedules.map(s => `${getDayLabel(s.day_of_week)} ${formatTime(s.start_time)}`).join(', ')}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {program.panelists && program.panelists.length > 0 ? (
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {program.panelists.map(panelist => (
                                  <Chip
                                    key={panelist.id}
                                    label={panelist.name}
                                    size="small"
                                    icon={<Group />}
                                    variant="outlined"
                                  />
                                ))}
                              </Box>
                            ) : (
                              <Typography variant="body2" color="text.secondary">—</Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="contained"
                              startIcon={<Add />}
                              onClick={() => handleOpenProgramDialog(program)}
                              size="small"
                            >
                              Crear Cambio
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Show filtered results count */}
          {searchTerm && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Mostrando {programs.filter((program) => {
                  const searchLower = searchTerm.toLowerCase();
                  return (
                    program.name.toLowerCase().includes(searchLower) ||
                    (program.channel_name || '').toLowerCase().includes(searchLower)
                  );
                }).length} de {programs.length} programas
              </Typography>
            </Box>
          )}
        </Paper>
      )}

      {/* Special Programs Tab */}
      {currentTab === 4 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ color: 'text.primary', fontWeight: 600 }}>
            Crear Programa Especial
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Crea un programa especial que no existe en la base de datos. Este programa aparecerá en el horario con el indicador de &quot;cambio semanal&quot;.
          </Typography>
          
          <Button
            variant="contained"
            startIcon={<AddCircle />}
            onClick={() => {
              setSelectedSchedule(null);
              setSelectedProgram(null);
              setFormData({
                targetWeek: 'current',
                overrideType: 'create',
                newStartTime: '',
                newEndTime: '',
                newDayOfWeek: '',
                reason: '',
                panelistIds: [],
                specialProgram: {
                  name: '',
                  description: '',
                  channelId: 0,
                  imageUrl: '',
                },
              });
              setOpenDialog(true);
            }}
            size="large"
            sx={{ mb: 3 }}
          >
            Crear Programa Especial
          </Button>

          {/* Show existing special program overrides */}
          <Typography variant="h6" gutterBottom sx={{ mt: 4, color: 'text.primary', fontWeight: 600 }}>
            Programas Especiales Activos
          </Typography>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Programa</TableCell>
                  <TableCell>Canal</TableCell>
                  <TableCell>Horario</TableCell>
                  <TableCell>Panelistas</TableCell>
                  <TableCell>Semana</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {[...currentWeekOverrides, ...nextWeekOverrides]
                  .filter(override => override.overrideType === 'create')
                  .map((override) => {
                    return (
                      <TableRow key={override.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {override.specialProgram?.name || 'Programa especial'}
                          </Typography>
                          {override.specialProgram?.description && (
                            <Typography variant="caption" color="text.secondary">
                              {override.specialProgram.description}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            Canal ID: {override.specialProgram?.channelId || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            {getDayLabel(override.newDayOfWeek || '')} {formatTime(override.newStartTime || '')}-{formatTime(override.newEndTime || '')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {override.panelistIds && override.panelistIds.length > 0 ? (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {override.panelistIds.map(panelistId => {
                                const panelist = panelists.find(p => p.id === panelistId);
                                return panelist ? (
                                  <Chip
                                    key={panelistId}
                                    label={panelist.name}
                                    size="small"
                                    icon={<Group />}
                                    variant="outlined"
                                  />
                                ) : null;
                              })}
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">—</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={override.weekStartDate === currentWeekOverrides[0]?.weekStartDate ? 'Actual' : 'Próxima'}
                            color={override.weekStartDate === currentWeekOverrides[0]?.weekStartDate ? 'primary' : 'secondary'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton onClick={() => handleEdit(override)} color="primary">
                              <Edit />
                            </IconButton>
                            <IconButton onClick={() => handleDelete(override.id)} color="error">
                              <Delete />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </TableContainer>
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
            {isEditMode ? 'Editar Cambio Semanal' : 'Crear Cambio Semanal'}
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
          {selectedProgram && (
            <Box sx={{ mt: 1, p: 2, backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'grey.50', borderRadius: 1 }}>
              <Typography variant="body1" fontWeight="bold" color="text.primary">
                {selectedProgram.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Canal: {selectedProgram.channel_name || 'Sin canal'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Programa completo (todos los horarios)
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
                  onChange={(e) => setFormData({ ...formData, overrideType: e.target.value as 'cancel' | 'time_change' | 'reschedule' | 'create' })}
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
                {formData.overrideType === 'create' && '✨ Programa especial: Crea un programa temporal que no existe en la base de datos'}
              </Typography>
            </Box>

            {/* Panelist selection */}
            {panelists.length > 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Panelistas
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
                  <Autocomplete
                    options={panelists.filter(panelist => !formData.panelistIds.includes(panelist.id))}
                    getOptionLabel={(option) => typeof option === 'string' ? option : option.name}
                    inputValue={panelistSearchTerm}
                    onInputChange={(_, newValue) => setPanelistSearchTerm(newValue)}
                    onChange={(_, newValue) => {
                      if (newValue && typeof newValue !== 'string') {
                        setFormData({ ...formData, panelistIds: [...formData.panelistIds, newValue.id] });
                        setPanelistSearchTerm('');
                      }
                    }}
                    sx={{ flex: 1 }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Buscar o crear panelista"
                        fullWidth
                        sx={{ minWidth: 300 }}
                      />
                    )}
                    renderOption={(props, option) => (
                      <li {...props} key={typeof option === 'string' ? option : option.id}>
                        {typeof option === 'string' ? option : option.name}
                      </li>
                    )}
                    freeSolo
                    disableClearable
                  />
                  {panelistSearchTerm && (
                    <Button
                      variant="contained"
                      onClick={async () => {
                        if (panelistSearchTerm.trim()) {
                          try {
                            // Create new panelist
                            const createResponse = await fetch('/api/panelists', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${typedSession?.accessToken}`,
                              },
                              body: JSON.stringify({ name: panelistSearchTerm.trim() }),
                            });

                            if (!createResponse.ok) throw new Error('Failed to create panelist');

                            const newPanelist = await createResponse.json();
                            
                            // Update state
                            setPanelists([...panelists, newPanelist]);
                            setFormData({ ...formData, panelistIds: [...formData.panelistIds, newPanelist.id] });
                            setPanelistSearchTerm('');
                          } catch (error) {
                            console.error('Error creating panelist:', error);
                            setError('Error al crear el panelista');
                          }
                        }
                      }}
                      disabled={!panelistSearchTerm.trim()}
                      sx={{ minWidth: 120 }}
                    >
                      Crear y Agregar
                    </Button>
                  )}
                </Box>
                
                {/* Selected Panelists */}
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Panelistas Seleccionados
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {formData.panelistIds.map((panelistId) => {
                      const panelist = panelists.find(p => p.id === panelistId);
                      return panelist ? (
                        <Chip
                          key={panelistId}
                          label={panelist.name}
                          onDelete={() => setFormData({ 
                            ...formData, 
                            panelistIds: formData.panelistIds.filter(id => id !== panelistId) 
                          })}
                        />
                      ) : null;
                    })}
                  </Box>
                </Box>
              </Box>
            )}

            {/* Special program fields for create overrides */}
            {formData.overrideType === 'create' && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 600 }}>
                  Información del Programa Especial
                </Typography>
                
                <TextField
                  label="Nombre del programa"
                  value={formData.specialProgram.name}
                  onChange={(e) => setFormData({
                    ...formData,
                    specialProgram: { ...formData.specialProgram, name: e.target.value }
                  })}
                  fullWidth
                  required
                />
                
                <TextField
                  label="Descripción (opcional)"
                  value={formData.specialProgram.description}
                  onChange={(e) => setFormData({
                    ...formData,
                    specialProgram: { ...formData.specialProgram, description: e.target.value }
                  })}
                  fullWidth
                  multiline
                  rows={2}
                />
                
                {/* Channel selection dropdown */}
                <FormControl fullWidth required>
                  <InputLabel id="special-program-channel-label">Canal</InputLabel>
                  <Select
                    labelId="special-program-channel-label"
                    value={formData.specialProgram.channelId}
                    label="Canal"
                    onChange={(e) => setFormData({
                      ...formData,
                      specialProgram: { ...formData.specialProgram, channelId: Number(e.target.value) }
                    })}
                  >
                    {channels.map((channel) => (
                      <MenuItem key={channel.id} value={channel.id}>{channel.name}</MenuItem>
                    ))}
                  </Select>
                  <Typography variant="caption" color="text.secondary">
                    Selecciona el canal donde se emitirá el programa
                  </Typography>
                </FormControl>
                
                <TextField
                  label="URL de imagen (opcional)"
                  value={formData.specialProgram.imageUrl}
                  onChange={(e) => setFormData({
                    ...formData,
                    specialProgram: { ...formData.specialProgram, imageUrl: e.target.value }
                  })}
                  fullWidth
                  placeholder="https://example.com/image.jpg"
                />
              </Box>
            )}

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
                    required
                  />
                  <TextField
                    label="Nueva hora de fin"
                    type="time"
                    value={formData.newEndTime}
                    onChange={(e) => setFormData({ ...formData, newEndTime: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    required
                  />
                </Box>

                {formData.overrideType === 'reschedule' && (
                  <FormControl fullWidth>
                    <InputLabel>Nuevo día de la semana</InputLabel>
                    <Select
                      value={formData.newDayOfWeek}
                      onChange={(e) => setFormData({ ...formData, newDayOfWeek: e.target.value })}
                      label="Nuevo día de la semana"
                      required
                    >
                      {DAYS_OF_WEEK.map((day) => (
                        <MenuItem key={day.value} value={day.value}>
                          {day.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}

                {(formData.overrideType === 'create') && (
                  <FormControl fullWidth>
                    <InputLabel>Día de la semana</InputLabel>
                    <Select
                      value={formData.newDayOfWeek}
                      onChange={(e) => setFormData({ ...formData, newDayOfWeek: e.target.value })}
                      label="Día de la semana"
                      required
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
              label="Motivo del cambio"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              fullWidth
              multiline
              rows={2}
              placeholder="Ej: Programa especial por día festivo, cambio de horario por evento, etc."
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
            startIcon={isEditMode ? <Edit /> : <Add />}
            disabled={
              formData.overrideType !== 'cancel' && 
              (!formData.newStartTime || !formData.newEndTime || 
               (formData.overrideType === 'reschedule' && !formData.newDayOfWeek))
            }
            onMouseEnter={() => {
              console.log('Form data:', formData);
              console.log('Button disabled:', formData.overrideType !== 'cancel' && 
                (!formData.newStartTime || !formData.newEndTime || 
                 (formData.overrideType === 'reschedule' && !formData.newDayOfWeek)));
            }}
          >
            {isEditMode ? 'Actualizar Cambio' : 'Crear Cambio'}
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