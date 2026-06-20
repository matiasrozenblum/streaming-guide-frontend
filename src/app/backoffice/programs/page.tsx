'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Snackbar,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormControlLabel,
  Checkbox,
  Tooltip,
  InputAdornment,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Group as GroupIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { Program } from '@/types/program';
import { Channel } from '@/types/channel';
import { Schedule as ScheduleType } from '@/types/schedule';
import Image from 'next/image';
import ProgramPanelistsDialog from '@/components/backoffice/ProgramPanelistsDialog';
import { ProgramSchedulesSection } from '@/components/backoffice/ProgramSchedulesSection';
import { ProgramPanelistsSection } from '@/components/backoffice/ProgramPanelistsSection';
import { useSessionContext } from '@/contexts/SessionContext';
import type { SessionWithToken } from '@/types/session';

interface PendingSchedule {
  id: string;
  dayOfWeek?: string;
  startTime: string;
  endTime: string;
  scheduleType: string;
  weekNumberInMonth?: string;
  specificDate?: string;
}

type ScheduleFilterValue = 'all' | 'with' | 'without';

export default function ProgramsPage() {
  const { status, session } = useSessionContext();
  const typedSession = session as SessionWithToken | null;

  const [programs, setPrograms] = useState<Program[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    channel_id: '',       // used when editing an existing program
    channel_ids: [] as string[], // used when creating (supports multi-select)
    logo_url: '',
    youtube_url: '',
    style_override: '',
    is_visible: true,
    is_premiere: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openPanelistsDialog, setOpenPanelistsDialog] = useState(false);
  const [pendingSchedules, setPendingSchedules] = useState<PendingSchedule[]>([]);
  const [pendingPanelistIds, setPendingPanelistIds] = useState<number[]>([]);

  // Search / sort / filter / pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name_asc');
  const [scheduleFilter, setScheduleFilter] = useState<ScheduleFilterValue>('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [programIdsWithSchedules, setProgramIdsWithSchedules] = useState<Set<number>>(new Set());
  const [schedulesLoaded, setSchedulesLoaded] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchPrograms();
      fetchChannels();
      fetchSchedulesForFilter();
    }
  }, [status]);

  // Reset to first page whenever search/sort/filter changes
  useEffect(() => {
    setPage(0);
  }, [searchTerm, sortBy, scheduleFilter]);

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/programs');
      if (!res.ok) throw new Error('Failed to fetch programs');
      const data = (await res.json()) as Program[];
      setPrograms(data);
    } catch (err: unknown) {
      console.error('Error fetching programs:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar los programas');
      setPrograms([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchChannels = async () => {
    try {
      const res = await fetch('/api/channels');
      if (!res.ok) throw new Error('Failed to fetch channels');
      const data = (await res.json()) as Channel[];
      setChannels(data);
    } catch (err: unknown) {
      console.error('Error fetching channels:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar los canales');
      setChannels([]);
    }
  };

  const fetchSchedulesForFilter = async () => {
    try {
      const res = await fetch('/api/schedules?raw=true');
      if (!res.ok) return;
      const data = (await res.json()) as ScheduleType[];
      setProgramIdsWithSchedules(new Set(data.map(s => s.program.id)));
      setSchedulesLoaded(true);
    } catch {
      // silently fail — schedule filter will stay disabled
    }
  };

  const filteredPrograms = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase();

    const filtered = programs.filter(p => {
      if (searchTerm) {
        const channelName = channels.find(c => c.id === p.channel_id)?.name ?? '';
        if (
          !p.name.toLowerCase().includes(lowerSearch) &&
          !channelName.toLowerCase().includes(lowerSearch)
        ) return false;
      }
      if (scheduleFilter !== 'all' && schedulesLoaded) {
        const hasSchedules = programIdsWithSchedules.has(p.id);
        if (scheduleFilter === 'with' && !hasSchedules) return false;
        if (scheduleFilter === 'without' && hasSchedules) return false;
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name_asc':
          return a.name.localeCompare(b.name, 'es');
        case 'name_desc':
          return b.name.localeCompare(a.name, 'es');
        case 'channel': {
          const aName = channels.find(c => c.id === a.channel_id)?.name ?? '';
          const bName = channels.find(c => c.id === b.channel_id)?.name ?? '';
          return aName.localeCompare(bName, 'es');
        }
        case 'created_desc':
          return b.id - a.id;
        case 'created_asc':
          return a.id - b.id;
        default:
          return 0;
      }
    });
  }, [programs, channels, searchTerm, sortBy, scheduleFilter, programIdsWithSchedules, schedulesLoaded]);

  const paginatedPrograms = filteredPrograms.slice(
    page * rowsPerPage,
    (page + 1) * rowsPerPage,
  );

  const handleOpenDialog = (program?: Program) => {
    if (program) {
      setEditingProgram(program);
      setFormData({
        name: program.name,
        description: program.description || '',
        channel_id: String(program.channel_id),
        channel_ids: [],
        logo_url: program.logo_url || '',
        youtube_url: program.youtube_url || '',
        style_override: program.style_override || '',
        is_visible: program.is_visible ?? true,
        is_premiere: program.is_premiere ?? false,
      });
    } else {
      setEditingProgram(null);
      setFormData({
        name: '',
        description: '',
        channel_id: '',
        channel_ids: [],
        logo_url: '',
        youtube_url: '',
        style_override: '',
        is_visible: true,
        is_premiere: false,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingProgram(null);
    setFormData({
      name: '',
      description: '',
      channel_id: '',
      channel_ids: [],
      logo_url: '',
      youtube_url: '',
      style_override: '',
      is_visible: true,
      is_premiere: false,
    });
    setPendingSchedules([]);
    setPendingPanelistIds([]);
  };

  const handleSubmit = async () => {
    try {
      if (editingProgram) {
        // Edit existing program — single channel, same as before
        const res = await fetch(`/api/programs/${editingProgram.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            description: formData.description,
            channel_id: parseInt(formData.channel_id),
            logo_url: formData.logo_url,
            youtube_url: formData.youtube_url,
            style_override: formData.style_override || null,
            is_visible: formData.is_visible,
            is_premiere: formData.is_premiere,
          }),
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body.details || body.error || 'Error al actualizar el programa');
        setSuccess('Programa actualizado correctamente');
      } else if (formData.channel_ids.length > 1) {
        // Bulk create: multiple channels → single API call, no panelists
        const scheduleItems = pendingSchedules.map(s => ({
          startTime: s.startTime,
          endTime: s.endTime,
          scheduleType: s.scheduleType || 'weekly',
          ...(s.dayOfWeek && { dayOfWeek: s.dayOfWeek }),
          ...(s.weekNumberInMonth && { weekNumberInMonth: parseInt(s.weekNumberInMonth, 10) }),
          ...(s.specificDate && { specificDate: s.specificDate }),
        }));
        const res = await fetch('/api/programs/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            description: formData.description,
            channel_ids: formData.channel_ids.map(Number),
            logo_url: formData.logo_url,
            youtube_url: formData.youtube_url,
            style_override: formData.style_override || null,
            is_visible: formData.is_visible,
            is_premiere: formData.is_premiere,
            ...(scheduleItems.length > 0 && { schedules: scheduleItems }),
          }),
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body.details || body.error || 'Error al crear los programas');
        const scheduleMsg = pendingSchedules.length > 0 ? ` con ${pendingSchedules.length} horario(s)` : '';
        setSuccess(`${formData.channel_ids.length} programas creados correctamente${scheduleMsg}`);
      } else {
        // Single channel create — existing flow
        const channelId = parseInt(formData.channel_ids[0] ?? formData.channel_id);
        const res = await fetch('/api/programs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            description: formData.description,
            channel_id: channelId,
            logo_url: formData.logo_url,
            youtube_url: formData.youtube_url,
            style_override: formData.style_override || null,
            is_visible: formData.is_visible,
            is_premiere: formData.is_premiere,
          }),
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body.details || body.error || 'Error al crear el programa');

        const newProgramId = body.id;

        if (pendingSchedules.length > 0 && typedSession?.accessToken) {
          try {
            const bulkData = {
              programId: newProgramId.toString(),
              channelId: channelId.toString(),
              schedules: pendingSchedules.map(s => ({
                startTime: s.startTime,
                endTime: s.endTime,
                scheduleType: s.scheduleType || 'weekly',
                ...(s.dayOfWeek && { dayOfWeek: s.dayOfWeek }),
                ...(s.weekNumberInMonth && { weekNumberInMonth: parseInt(s.weekNumberInMonth, 10) }),
                ...(s.specificDate && { specificDate: s.specificDate }),
              })),
            };
            const scheduleRes = await fetch('/api/schedules/bulk', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${typedSession.accessToken}`,
              },
              body: JSON.stringify(bulkData),
            });
            if (!scheduleRes.ok) {
              const scheduleBody = await scheduleRes.json().catch(() => ({}));
              throw new Error(scheduleBody.details || scheduleBody.error || 'Error al crear los horarios');
            }
          } catch (scheduleErr) {
            console.error('Error creating schedules:', scheduleErr);
            setSuccess('Programa creado correctamente, pero hubo un error al crear algunos horarios');
            await fetchPrograms();
            fetchSchedulesForFilter();
            handleCloseDialog();
            return;
          }
        }

        if (pendingPanelistIds.length > 0 && typedSession?.accessToken) {
          try {
            await Promise.all(
              pendingPanelistIds.map(panelistId =>
                fetch(`/api/panelists/${panelistId}/programs/${newProgramId}`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${typedSession.accessToken}`,
                  },
                })
              )
            );
          } catch (panelistErr) {
            console.error('Error adding panelists:', panelistErr);
          }
        }

        const scheduleMsg = pendingSchedules.length > 0 ? ` con ${pendingSchedules.length} horario(s)` : '';
        const panelistMsg = pendingPanelistIds.length > 0 ? ` con ${pendingPanelistIds.length} panelista(s)` : '';
        setSuccess(`Programa creado correctamente${scheduleMsg}${panelistMsg}`);
      }

      await fetchPrograms();
      fetchSchedulesForFilter();
      handleCloseDialog();
    } catch (err: unknown) {
      console.error('Error saving program:', err);
      setError(err instanceof Error ? err.message : 'Error al guardar el programa');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro que deseas eliminar este programa?')) return;
    try {
      const res = await fetch(`/api/programs/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.details || 'Error al eliminar el programa');
      }
      await fetchPrograms();
      fetchSchedulesForFilter();
      setSuccess('Programa eliminado correctamente');
    } catch (err: unknown) {
      console.error('Error deleting program:', err);
      setError(err instanceof Error ? err.message : 'Error al eliminar el programa');
    }
  };

  const handleCloseSnackbar = () => {
    setError(null);
    setSuccess(null);
  };

  const handleOpenPanelistsDialog = () => {
    if (!editingProgram) return;
    setOpenPanelistsDialog(true);
  };

  const handleClosePanelistsDialog = () => {
    setOpenPanelistsDialog(false);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" color="text.primary">Programas</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          Nuevo Programa
        </Button>
      </Box>

      {/* Toolbar: search + sort + schedule filter */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          label="Buscar por nombre o canal"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ flexGrow: 1, minWidth: 220 }}
        />
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Ordenar por</InputLabel>
          <Select value={sortBy} onChange={e => setSortBy(e.target.value)} label="Ordenar por">
            <MenuItem value="name_asc">Nombre A→Z</MenuItem>
            <MenuItem value="name_desc">Nombre Z→A</MenuItem>
            <MenuItem value="channel">Canal A→Z</MenuItem>
            <MenuItem value="created_desc">Más recientes</MenuItem>
            <MenuItem value="created_asc">Más antiguos</MenuItem>
          </Select>
        </FormControl>
        <Tooltip title={!schedulesLoaded ? 'Cargando datos de horarios…' : ''} arrow>
          <FormControl size="small" sx={{ minWidth: 160 }} disabled={!schedulesLoaded}>
            <InputLabel>Horarios</InputLabel>
            <Select
              value={scheduleFilter}
              onChange={e => setScheduleFilter(e.target.value as ScheduleFilterValue)}
              label="Horarios"
            >
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value="with">Con horarios</MenuItem>
              <MenuItem value="without">Sin horarios</MenuItem>
            </Select>
          </FormControl>
        </Tooltip>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Logo</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Canal</TableCell>
              <TableCell>YouTube</TableCell>
              <TableCell>Estilo especial</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedPrograms.map(program => {
              const channel = channels.find(c => c.id === program.channel_id);
              return (
                <TableRow key={program.id}>
                  <TableCell>
                    {program.logo_url && (
                      <Image unoptimized src={program.logo_url} alt={program.name} width={50} height={50} style={{ objectFit: 'contain' }} />
                    )}
                  </TableCell>
                  <TableCell>{program.name}</TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      {channel?.logo_url && (
                        <Image unoptimized src={channel.logo_url} alt={channel.name} width={32} height={32} style={{ objectFit: 'contain', borderRadius: 4 }} />
                      )}
                      <span>{channel?.name || 'Sin canal'}</span>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {program.youtube_url ? (
                      <Button
                        variant="contained"
                        color="primary"
                        href={program.youtube_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        size="small"
                      >
                        Ver en YouTube
                      </Button>
                    ) : (
                      'Sin enlace'
                    )}
                  </TableCell>
                  <TableCell>{program.style_override || '-'}</TableCell>
                  <TableCell>
                    <Tooltip title="Editar programa" arrow>
                      <IconButton aria-label="Editar programa" onClick={() => handleOpenDialog(program)}><EditIcon /></IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar programa" arrow>
                      <IconButton aria-label="Eliminar programa" onClick={() => handleDelete(program.id)}><DeleteIcon /></IconButton>
                    </Tooltip>
                    <Tooltip title="Gestionar panelistas" arrow>
                      <IconButton aria-label="Gestionar panelistas" onClick={() => { setEditingProgram(program); handleOpenPanelistsDialog(); }}>
                        <GroupIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={filteredPrograms.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={e => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 25, 50, 100]}
          labelRowsPerPage="Por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
        />
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingProgram ? 'Editar Programa' : 'Nuevo Programa'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField label="Nombre" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} fullWidth required />
            <TextField label="Descripción" multiline rows={3} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} fullWidth />
            {editingProgram ? (
              <FormControl fullWidth>
                <InputLabel>Canal</InputLabel>
                <Select
                  value={formData.channel_id}
                  onChange={e => setFormData({ ...formData, channel_id: e.target.value as string })}
                  label="Canal"
                >
                  {channels.map(ch => <MenuItem key={ch.id} value={String(ch.id)}>{ch.name}</MenuItem>)}
                </Select>
              </FormControl>
            ) : (
              <FormControl fullWidth>
                <InputLabel>Canales</InputLabel>
                <Select
                  multiple
                  value={formData.channel_ids}
                  onChange={e => setFormData({ ...formData, channel_ids: e.target.value as string[] })}
                  label="Canales"
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as string[]).map(id => {
                        const ch = channels.find(c => String(c.id) === id);
                        return <Chip key={id} label={ch?.name ?? id} size="small" />;
                      })}
                    </Box>
                  )}
                >
                  {channels.map(ch => <MenuItem key={ch.id} value={String(ch.id)}>{ch.name}</MenuItem>)}
                </Select>
                {formData.channel_ids.length > 1 && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                    Se crearán {formData.channel_ids.length} programas independientes (uno por canal)
                  </Typography>
                )}
              </FormControl>
            )}
            <TextField label="URL del logo" value={formData.logo_url} onChange={e => setFormData({ ...formData, logo_url: e.target.value })} fullWidth />
            <TextField label="URL de YouTube" value={formData.youtube_url} onChange={e => setFormData({ ...formData, youtube_url: e.target.value })} fullWidth />
            <TextField label="Estilo especial (opcional)" value={formData.style_override} onChange={e => setFormData({ ...formData, style_override: e.target.value })} fullWidth placeholder="boca, river, etc." />
            <FormControlLabel
              control={
                <Checkbox
                  checked={!!formData.is_visible}
                  onChange={(e) => setFormData({ ...formData, is_visible: e.target.checked })}
                />
              }
              label="Visible (mostrar en grilla)"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={!!formData.is_premiere}
                  onChange={(e) => setFormData({ ...formData, is_premiere: e.target.checked })}
                />
              }
              label="Es estreno (YouTube premiere)"
            />

            <ProgramSchedulesSection
              programId={editingProgram?.id || null}
              channelId={
                editingProgram
                  ? (formData.channel_id ? parseInt(formData.channel_id) : null)
                  : (formData.channel_ids[0] ? parseInt(formData.channel_ids[0]) : null)
              }
              onSchedulesChange={setPendingSchedules}
            />

            <ProgramPanelistsSection
              programId={editingProgram?.id || null}
              onPanelistsChange={setPendingPanelistIds}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">{editingProgram ? 'Actualizar' : 'Crear'}</Button>
        </DialogActions>
      </Dialog>

      <ProgramPanelistsDialog open={openPanelistsDialog} onClose={handleClosePanelistsDialog} program={editingProgram!} onError={setError} />

      <Snackbar open={!!error || !!success} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert severity={error ? 'error' : 'success'} onClose={handleCloseSnackbar}>{error || success}</Alert>
      </Snackbar>
    </Box>
  );
}
