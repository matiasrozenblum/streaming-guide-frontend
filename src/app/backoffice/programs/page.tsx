'use client';

import { useState, useEffect } from 'react';
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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Group as GroupIcon,
} from '@mui/icons-material';
import { Program } from '@/types/program';
import { Channel } from '@/types/channel';
import Image from 'next/image';
import ProgramPanelistsDialog from '@/components/backoffice/ProgramPanelistsDialog';
import { useSessionContext } from '@/contexts/SessionContext';

export default function ProgramsPage() {
  // Forzar sesión y redirigir si no está autenticado
  const { status } = useSessionContext();

  const [programs, setPrograms] = useState<Program[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    channel_id: '',
    logo_url: '',
    youtube_url: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openPanelistsDialog, setOpenPanelistsDialog] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchPrograms();
      fetchChannels();
    }
  }, [status]);

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

  const handleOpenDialog = (program?: Program) => {
    if (program) {
      setEditingProgram(program);
      setFormData({
        name: program.name,
        description: program.description || '',
        channel_id: String(program.channel_id),
        logo_url: program.logo_url || '',
        youtube_url: program.youtube_url || '',
      });
    } else {
      setEditingProgram(null);
      setFormData({
        name: '',
        description: '',
        channel_id: '',
        logo_url: '',
        youtube_url: '',
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
      logo_url: '',
      youtube_url: '',
    });
  };

  const handleSubmit = async () => {
    try {
      const url = editingProgram
        ? `/api/programs/${editingProgram.id}`
        : '/api/programs';
      const method = editingProgram ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          channel_id: parseInt(formData.channel_id),
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.details || body.error || 'Error al guardar el programa');
      await fetchPrograms();
      handleCloseDialog();
      setSuccess(editingProgram ? 'Programa actualizado correctamente' : 'Programa creado correctamente');
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
        <Typography variant="h4">Programas</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          Nuevo Programa
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Logo</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Canal</TableCell>
              <TableCell>YouTube</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {programs.map(program => (
              <TableRow key={program.id}>
                <TableCell>
                  {program.logo_url && (
                    <Image src={program.logo_url} alt={program.name} width={50} height={50} style={{ objectFit: 'contain' }} />
                  )}
                </TableCell>
                <TableCell>{program.name}</TableCell>
                <TableCell>{channels.find(c => c.id === program.channel_id)?.name || 'Sin canal'}</TableCell>
                <TableCell>
                  {program.youtube_url ? (
                    <a href={program.youtube_url} target="_blank" rel="noopener noreferrer">Ver en YouTube</a>
                  ) : (
                    'Sin enlace'
                  )}
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpenDialog(program)}><EditIcon /></IconButton>
                  <IconButton onClick={() => handleDelete(program.id)}><DeleteIcon /></IconButton>
                  <IconButton onClick={() => { setEditingProgram(program); handleOpenPanelistsDialog(); }}>
                    <GroupIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingProgram ? 'Editar Programa' : 'Nuevo Programa'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField label="Nombre" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} fullWidth required />
            <TextField label="Descripción" multiline rows={3} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} fullWidth />
            <FormControl fullWidth>
              <InputLabel>Canal</InputLabel>
              <Select value={formData.channel_id} onChange={e => setFormData({ ...formData, channel_id: e.target.value as string })} label="Canal">
                {channels.map(ch => <MenuItem key={ch.id} value={String(ch.id)}>{ch.name}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="URL del logo" value={formData.logo_url} onChange={e => setFormData({ ...formData, logo_url: e.target.value })} fullWidth />
            <TextField label="URL de YouTube" value={formData.youtube_url} onChange={e => setFormData({ ...formData, youtube_url: e.target.value })} fullWidth />
          </Box>
        </DialogContent>
        <DialogActions>
          {editingProgram && <Button startIcon={<GroupIcon />} onClick={handleOpenPanelistsDialog} variant="outlined">Panelistas</Button>}
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
