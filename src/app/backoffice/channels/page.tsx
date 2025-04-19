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
  Snackbar
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, ArrowUpward, ArrowDownward } from '@mui/icons-material';
import { Channel } from '@/types/channel';
import Image from 'next/image';

export default function ChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    logo_url: '',
    streaming_url: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    try {
      const cookies = document.cookie.split(';');
      const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('backoffice_token='));
      const token = tokenCookie?.split('=')[1];
      console.log('Token:', token);
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/channels', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch channels');
      }
      const data = await response.json();
      setChannels(data);
    } catch (error) {
      console.error('Error fetching channels:', error);
      setError('Error al cargar los canales');
    } finally {
      setLoading(false);
    }
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newChannels = [...channels];
    [newChannels[index - 1], newChannels[index]] = [newChannels[index], newChannels[index - 1]];
    setChannels(newChannels);
  };

  const handleMoveDown = (index: number) => {
    if (index === channels.length - 1) return;
    const newChannels = [...channels];
    [newChannels[index], newChannels[index + 1]] = [newChannels[index + 1], newChannels[index]];
    setChannels(newChannels);
  };

  const handleSaveOrder = async () => {
    try {
      setSavingOrder(true);
      const ids = channels.map(channel => channel.id);
      const response = await fetch('/api/channels/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      if (!response.ok) {
        throw new Error('Error al guardar el orden');
      }
      setSuccess('Orden guardado correctamente');
    } catch (error) {
      console.error('Error saving order:', error);
      setError(error instanceof Error ? error.message : 'Error al guardar el orden');
    } finally {
      setSavingOrder(false);
    }
  };

  const handleOpenDialog = (channel?: Channel) => {
    if (channel) {
      setEditingChannel(channel);
      setFormData({
        name: channel.name,
        logo_url: channel.logo_url || '',
        streaming_url: channel.streaming_url || '',
      });
    } else {
      setEditingChannel(null);
      setFormData({
        name: '',
        logo_url: '',
        streaming_url: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingChannel(null);
    setFormData({
      name: '',
      logo_url: '',
      streaming_url: '',
    });
  };

  const handleSubmit = async () => {
    try {
      const cookies = document.cookie.split(';');
      const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('backoffice_token='));
      const token = tokenCookie?.split('=')[1];
      console.log('Token:', token);

      const url = editingChannel 
        ? `/api/channels/${editingChannel.id}`
        : '/api/channels';
      
      const method = editingChannel ? 'PATCH' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Error al guardar el canal');
      }

      await fetchChannels();
      handleCloseDialog();
      setSuccess(editingChannel ? 'Canal actualizado correctamente' : 'Canal creado correctamente');
    } catch (error) {
      console.error('Error saving channel:', error);
      setError(error instanceof Error ? error.message : 'Error al guardar el canal');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro que deseas eliminar este canal?')) {
      return;
    }

    try {
      const cookies = document.cookie.split(';');
      const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('backoffice_token='));
      const token = tokenCookie?.split('=')[1];
      console.log('Token:', token);
      
      const response = await fetch(`/api/channels/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Error al eliminar el canal');
      }

      await fetchChannels();
      setSuccess('Canal eliminado correctamente');
    } catch (error) {
      console.error('Error deleting channel:', error);
      setError(error instanceof Error ? error.message : 'Error al eliminar el canal');
    }
  };

  const handleCloseSnackbar = () => {
    setError(null);
    setSuccess(null);
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
        <Typography variant="h4">Canales</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nuevo Canal
        </Button>
      </Box>

      <Button 
        variant="contained" 
        color="primary" 
        onClick={handleSaveOrder} 
        disabled={savingOrder}
        sx={{ mb: 2 }}
      >
        {savingOrder ? 'Guardando...' : 'Guardar Orden'}
      </Button>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Orden</TableCell>
              <TableCell>Logo</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>YouTube</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {channels.map((channel, index) => (
              <TableRow key={channel.id}>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    #{index + 1}
                    <IconButton 
                      size="small" 
                      onClick={() => handleMoveUp(index)} 
                      disabled={index === 0}
                    >
                      <ArrowUpward fontSize="small" />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => handleMoveDown(index)} 
                      disabled={index === channels.length - 1}
                    >
                      <ArrowDownward fontSize="small" />
                    </IconButton>
                  </Box>
                </TableCell>
                <TableCell>
                {channel.logo_url ? (
                  <Image 
                    src={channel.logo_url} 
                    alt={channel.name}
                    width={50}
                    height={50}
                    style={{ objectFit: 'contain' }}
                  />
                ) : (
                  <Box width={50} height={50} display="flex" justifyContent="center" alignItems="center">
                    <Typography variant="caption" color="textSecondary">
                      Sin logo
                    </Typography>
                  </Box>
                )}
                </TableCell>
                <TableCell>{channel.name}</TableCell>
                <TableCell>
                  {channel.streaming_url && (
                    <a 
                      href={channel.streaming_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      Ver canal
                    </a>
                  )}
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpenDialog(channel)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(channel.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>
          {editingChannel ? 'Editar Canal' : 'Nuevo Canal'}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={2}>
            <TextField
              label="Nombre"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="URL del Logo"
              value={formData.logo_url}
              onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
              fullWidth
            />
            <TextField
              label="URL de YouTube"
              value={formData.streaming_url}
              onChange={(e) => setFormData({ ...formData, streaming_url: e.target.value })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingChannel ? 'Guardar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

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
