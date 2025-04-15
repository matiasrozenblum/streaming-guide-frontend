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
  InputLabel
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Group as GroupIcon } from '@mui/icons-material';
import { Program } from '@/types/program';
import { Channel } from '@/types/channel';
import Image from 'next/image';
import ProgramPanelistsDialog from '@/components/backoffice/ProgramPanelistsDialog';

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_time: '',
    end_time: '',
    channel_id: '',
    logo_url: '',
    youtube_url: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openPanelistsDialog, setOpenPanelistsDialog] = useState(false);

  useEffect(() => {
    fetchPrograms();
    fetchChannels();
  }, []);

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const cookies = document.cookie.split(';');
      const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('backoffice_token='));
      const token = tokenCookie?.split('=')[1];
      console.log('Token:', token);
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/programs', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch programs');
      }
      
      const data = await response.json();
      setPrograms(data);
    } catch (error) {
      console.error('Error fetching programs:', error);
      setError('Error al cargar los programas');
      setPrograms([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchChannels = async () => {
    try {
      const response = await fetch('/api/channels');
      if (!response.ok) {
        throw new Error('Failed to fetch channels');
      }
      const data = await response.json();
      setChannels(data);
    } catch (error) {
      console.error('Error fetching channels:', error);
      setError('Error al cargar los canales');
    }
  };

  const handleOpenDialog = (program?: Program) => {
    if (program) {
      setEditingProgram(program);
      setFormData({
        name: program.name,
        description: program.description || '',
        start_time: program.start_time || '',
        end_time: program.end_time || '',
        channel_id: program.channel_id?.toString() || '',
        logo_url: program.logo_url || '',
        youtube_url: program.youtube_url || '',
      });
    } else {
      setEditingProgram(null);
      setFormData({
        name: '',
        description: '',
        start_time: '',
        end_time: '',
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
      start_time: '',
      end_time: '',
      channel_id: '',
      logo_url: '',
      youtube_url: '',
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

      const url = editingProgram 
        ? `/api/programs/${editingProgram.id}`
        : '/api/programs';
      
      const method = editingProgram ? 'PATCH' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          channel_id: parseInt(formData.channel_id),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Error al guardar el programa');
      }

      await fetchPrograms();
      handleCloseDialog();
      setSuccess(editingProgram ? 'Programa actualizado correctamente' : 'Programa creado correctamente');
    } catch (error) {
      console.error('Error saving program:', error);
      setError(error instanceof Error ? error.message : 'Error al guardar el programa');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro que deseas eliminar este programa?')) {
      return;
    }

    try {
      const cookies = document.cookie.split(';');
      const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('backoffice_token='));
      const token = tokenCookie?.split('=')[1];
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`/api/programs/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Error al eliminar el programa');
      }

      await fetchPrograms();
      setSuccess('Programa eliminado correctamente');
    } catch (error) {
      console.error('Error deleting program:', error);
      setError(error instanceof Error ? error.message : 'Error al eliminar el programa');
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
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
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
              <TableCell>Horario</TableCell>
              <TableCell>YouTube</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {programs.map((program) => {
              const channel = channels.find(c => c.id === program.channel_id);
              return (
                <TableRow key={program.id}>
                  <TableCell>
                    {program.logo_url && (
                      <Image 
                        src={program.logo_url || '/placeholder.png'} 
                        alt={program.name}
                        width={50}
                        height={50}
                        style={{ objectFit: 'contain' }}
                      />
                    )}
                  </TableCell>
                  <TableCell>{program.name}</TableCell>
                  <TableCell>{channel?.name}</TableCell>
                  <TableCell>
                    {program.start_time && program.end_time ? (
                      `${program.start_time} - ${program.end_time}`
                    ) : 'No especificado'}
                  </TableCell>
                  <TableCell>
                    {program.youtube_url && (
                      <a href={program.youtube_url} target="_blank" rel="noopener noreferrer">
                        Ver en YouTube
                      </a>
                    )}
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleOpenDialog(program)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(program.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>
          {editingProgram ? 'Editar Programa' : 'Nuevo Programa'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Nombre"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Descripción"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />
            <TextField
              label="Hora de inicio"
              type="time"
              value={formData.start_time}
              onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Hora de fin"
              type="time"
              value={formData.end_time}
              onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <FormControl fullWidth>
              <InputLabel>Canal</InputLabel>
              <Select
                value={formData.channel_id}
                onChange={(e) => setFormData({ ...formData, channel_id: e.target.value })}
                label="Canal"
              >
                {channels.map((channel) => (
                  <MenuItem key={channel.id} value={channel.id}>
                    {channel.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="URL del logo"
              value={formData.logo_url}
              onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
              fullWidth
            />
            <TextField
              label="URL de YouTube"
              value={formData.youtube_url}
              onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          {editingProgram && (
            <Button
              startIcon={<GroupIcon />}
              onClick={handleOpenPanelistsDialog}
              variant="outlined"
            >
              Panelistas
            </Button>
          )}
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingProgram ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      <ProgramPanelistsDialog
        open={openPanelistsDialog}
        onClose={handleClosePanelistsDialog}
        program={editingProgram!}
        onError={setError}
      />

      <Snackbar
        open={!!error || !!success}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={error ? 'error' : 'success'}
          sx={{ width: '100%' }}
        >
          {error || success}
        </Alert>
      </Snackbar>
    </Box>
  );
}