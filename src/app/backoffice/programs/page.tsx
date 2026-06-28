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
  Autocomplete,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Group as GroupIcon,
  Search as SearchIcon,
  DeleteSweep as DeleteSweepIcon,
  Link as LinkIcon,
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
    youtube_url: '',
    is_visible: true,
    is_premiere: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openPanelistsDialog, setOpenPanelistsDialog] = useState(false);
  const [pendingSchedules, setPendingSchedules] = useState<PendingSchedule[]>([]);
  const [pendingPanelistIds, setPendingPanelistIds] = useState<number[]>([]);

  // Multi-select & bulk delete
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [confirmBulkDeleteOpen, setConfirmBulkDeleteOpen] = useState(false);

  // Single-program delete confirmation dialog
  const [confirmDeleteDialog, setConfirmDeleteDialog] = useState<{ open: boolean; program: Program | null }>({ open: false, program: null });

  // Linked-program delete dialog
  const [linkedDeleteDialog, setLinkedDeleteDialog] = useState<{ open: boolean; program: Program | null }>({ open: false, program: null });

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

  // Reset to first page and clear selection whenever search/sort/filter changes
  useEffect(() => {
    setPage(0);
    setSelectedIds(new Set());
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
        youtube_url: program.youtube_url || '',
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
        youtube_url: '',
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
      youtube_url: '',
      is_visible: true,
      is_premiere: false,
    });
    setPendingSchedules([]);
    setPendingPanelistIds([]);
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      if (editingProgram) {
        // Edit existing program — single channel, same as before
        const res = await fetch(`/api/programs/${editingProgram.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            description: formData.description,
            channel_id: parseInt(formData.channel_id),
            youtube_url: formData.youtube_url,
            is_visible: formData.is_visible,
            is_premiere: formData.is_premiere,
          }),
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body.details || body.error || 'Error al actualizar el programa');
        setSuccess('Programa actualizado correctamente');
      } else if (formData.channel_ids.length > 1) {
        // Bulk create: multiple channels → linked programs
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
            youtube_url: formData.youtube_url,
            is_visible: formData.is_visible,
            is_premiere: formData.is_premiere,
            ...(scheduleItems.length > 0 && { schedules: scheduleItems }),
            ...(pendingPanelistIds.length > 0 && { panelist_ids: pendingPanelistIds }),
          }),
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body.details || body.error || 'Error al crear los programas');
        const scheduleMsg = pendingSchedules.length > 0 ? ` con ${pendingSchedules.length} horario(s)` : '';
        const panelistMsg = pendingPanelistIds.length > 0 ? ` con ${pendingPanelistIds.length} panelista(s)` : '';
        setSuccess(`${formData.channel_ids.length} programas vinculados creados correctamente${scheduleMsg}${panelistMsg}`);
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
            youtube_url: formData.youtube_url,
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (program: Program) => {
    if (program.link_group_id) {
      setLinkedDeleteDialog({ open: true, program });
    } else {
      setConfirmDeleteDialog({ open: true, program });
    }
  };

  const handleDeleteConfirmed = async (id: number, deleteLinked: boolean) => {
    setLinkedDeleteDialog({ open: false, program: null });
    try {
      const url = deleteLinked ? `/api/programs/${id}?deleteLinked=true` : `/api/programs/${id}`;
      const res = await fetch(url, { method: 'DELETE' });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.details || 'Error al eliminar el programa');
      }
      await fetchPrograms();
      fetchSchedulesForFilter();
      setSuccess(deleteLinked ? 'Programas vinculados eliminados correctamente' : 'Programa eliminado correctamente');
    } catch (err: unknown) {
      console.error('Error deleting program:', err);
      setError(err instanceof Error ? err.message : 'Error al eliminar el programa');
    }
  };

  const handleToggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const allPageSelected =
    paginatedPrograms.length > 0 &&
    paginatedPrograms.every(p => selectedIds.has(p.id));

  const somePageSelected =
    paginatedPrograms.some(p => selectedIds.has(p.id)) && !allPageSelected;

  const handleSelectAllPage = () => {
    if (allPageSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        paginatedPrograms.forEach(p => next.delete(p.id));
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev);
        paginatedPrograms.forEach(p => next.add(p.id));
        return next;
      });
    }
  };

  const handleBulkDelete = async () => {
    setConfirmBulkDeleteOpen(false);
    try {
      await Promise.all(
        [...selectedIds].map(id => fetch(`/api/programs/${id}`, { method: 'DELETE' }))
      );
      setSelectedIds(new Set());
      await fetchPrograms();
      fetchSchedulesForFilter();
      setSuccess(`${selectedIds.size} programa(s) eliminado(s) correctamente`);
    } catch (err: unknown) {
      console.error('Error bulk deleting programs:', err);
      setError('Error al eliminar los programas seleccionados');
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
              <TableCell padding="checkbox">
                <Checkbox
                  size="small"
                  indeterminate={somePageSelected}
                  checked={allPageSelected}
                  onChange={handleSelectAllPage}
                />
              </TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Canal</TableCell>
              <TableCell>YouTube</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedPrograms.map(program => {
              const channel = channels.find(c => c.id === program.channel_id);
              return (
                <TableRow
                  key={program.id}
                  selected={selectedIds.has(program.id)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      size="small"
                      checked={selectedIds.has(program.id)}
                      onChange={() => handleToggleSelect(program.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      {program.link_group_id && (
                        <Tooltip title="Programa vinculado" arrow>
                          <LinkIcon fontSize="small" color="primary" />
                        </Tooltip>
                      )}
                      {program.name}
                    </Box>
                  </TableCell>
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
                  <TableCell>
                    <Tooltip title="Editar programa" arrow>
                      <IconButton aria-label="Editar programa" onClick={() => handleOpenDialog(program)}><EditIcon /></IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar programa" arrow>
                      <IconButton aria-label="Eliminar programa" onClick={() => handleDelete(program)}><DeleteIcon /></IconButton>
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
              <Box>
                <Autocomplete
                  multiple
                  disableCloseOnSelect
                  options={channels}
                  getOptionLabel={(ch) => ch.name}
                  value={channels.filter(ch => formData.channel_ids.includes(String(ch.id)))}
                  onChange={(_, newValue) =>
                    setFormData({ ...formData, channel_ids: newValue.map(ch => String(ch.id)) })
                  }
                  renderInput={(params) => (
                    <TextField {...params} label="Canales" placeholder={formData.channel_ids.length === 0 ? 'Seleccionar canales…' : ''} />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((ch, index) => {
                      const { key, ...tagProps } = getTagProps({ index });
                      return <Chip key={key} label={ch.name} size="small" {...tagProps} />;
                    })
                  }
                  renderOption={(props, option, { selected }) => (
                    <li {...props}>
                      <Checkbox size="small" checked={selected} sx={{ mr: 1 }} />
                      {option.name}
                    </li>
                  )}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  limitTags={4}
                  fullWidth
                />
                {formData.channel_ids.length > 1 && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    Se crearán {formData.channel_ids.length} programas vinculados (uno por canal). Cambios en cualquiera se propagan a todos.
                  </Typography>
                )}
              </Box>
            )}
            <TextField label="URL de YouTube" value={formData.youtube_url} onChange={e => setFormData({ ...formData, youtube_url: e.target.value })} fullWidth />
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
          <Button onClick={handleSubmit} variant="contained" disabled={isSubmitting} sx={{ position: 'relative' }}>
            <Box sx={{ visibility: isSubmitting ? 'hidden' : 'visible' }}>
              {editingProgram ? 'Actualizar' : 'Crear'}
            </Box>
            {isSubmitting && <CircularProgress size={20} color="inherit" sx={{ position: 'absolute' }} />}
          </Button>
        </DialogActions>
      </Dialog>

      <ProgramPanelistsDialog open={openPanelistsDialog} onClose={handleClosePanelistsDialog} program={editingProgram!} onError={setError} />

      <Snackbar open={!!error || !!success} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert severity={error ? 'error' : 'success'} onClose={handleCloseSnackbar}>{error || success}</Alert>
      </Snackbar>

      {/* Floating bulk-action bar */}
      {selectedIds.size > 0 && (
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            bottom: 32,
            left: '50%',
            transform: 'translateX(-50%)',
            px: 3,
            py: 1.5,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            borderRadius: 3,
            zIndex: 1300,
          }}
        >
          <Typography variant="body2" fontWeight={600}>
            {selectedIds.size} programa{selectedIds.size !== 1 ? 's' : ''} seleccionado{selectedIds.size !== 1 ? 's' : ''}
          </Typography>
          <Button
            variant="text"
            size="small"
            onClick={() => setSelectedIds(new Set())}
          >
            Deseleccionar
          </Button>
          <Button
            variant="contained"
            color="error"
            size="small"
            startIcon={<DeleteSweepIcon />}
            onClick={() => setConfirmBulkDeleteOpen(true)}
          >
            Eliminar seleccionados
          </Button>
        </Paper>
      )}

      {/* Linked-program delete dialog */}
      <Dialog open={linkedDeleteDialog.open} onClose={() => setLinkedDeleteDialog({ open: false, program: null })} maxWidth="sm" fullWidth>
        <DialogTitle>Eliminar programa vinculado</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            <strong>{linkedDeleteDialog.program?.name}</strong> está vinculado a otro/s canal/es. ¿Qué querés eliminar?
          </Typography>
          <Alert severity="warning">
            Eliminar todos los vinculados borrará también los horarios y overrides de cada uno.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLinkedDeleteDialog({ open: false, program: null })}>Cancelar</Button>
          <Button onClick={() => handleDeleteConfirmed(linkedDeleteDialog.program!.id, false)}>
            Solo este canal
          </Button>
          <Button variant="contained" color="error" onClick={() => handleDeleteConfirmed(linkedDeleteDialog.program!.id, true)}>
            Eliminar todos los vinculados
          </Button>
        </DialogActions>
      </Dialog>

      {/* Single-program delete confirmation dialog */}
      <Dialog open={confirmDeleteDialog.open} onClose={() => setConfirmDeleteDialog({ open: false, program: null })} maxWidth="sm" fullWidth>
        <DialogTitle>Eliminar programa</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            ¿Estás seguro que querés eliminar <strong>{confirmDeleteDialog.program?.name}</strong>
            {channels.find(c => c.id === confirmDeleteDialog.program?.channel_id)?.name
              ? ` (${channels.find(c => c.id === confirmDeleteDialog.program?.channel_id)?.name})`
              : ''}
            ?
          </Typography>
          <Alert severity="warning">
            Esta acción eliminará también todos los horarios y overrides asociados.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteDialog({ open: false, program: null })}>Cancelar</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              setConfirmDeleteDialog({ open: false, program: null });
              handleDeleteConfirmed(confirmDeleteDialog.program!.id, false);
            }}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk delete confirmation dialog */}
      <Dialog open={confirmBulkDeleteOpen} onClose={() => setConfirmBulkDeleteOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Eliminar programas</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            ¿Estás seguro que querés eliminar los siguientes {selectedIds.size} programa{selectedIds.size !== 1 ? 's' : ''}?
          </Typography>
          <Box component="ul" sx={{ m: 0, pl: 2 }}>
            {[...selectedIds].map(id => {
              const p = programs.find(pr => pr.id === id);
              const ch = channels.find(c => c.id === p?.channel_id);
              return (
                <li key={id}>
                  <Typography variant="body2">
                    <strong>{p?.name ?? `#${id}`}</strong>
                    {ch ? ` — ${ch.name}` : ''}
                  </Typography>
                </li>
              );
            })}
          </Box>
          <Alert severity="warning" sx={{ mt: 2 }}>
            Esta acción eliminará también todos los horarios y overrides asociados.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmBulkDeleteOpen(false)}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={handleBulkDelete}>
            Eliminar {selectedIds.size} programa{selectedIds.size !== 1 ? 's' : ''}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
