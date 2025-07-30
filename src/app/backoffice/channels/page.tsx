'use client';

import { useState, useEffect } from 'react';
import { useSessionContext } from '@/contexts/SessionContext';
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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowUpward,
  ArrowDownward,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import { Channel } from '@/types/channel';
import Image from 'next/image';

export default function ChannelsPage() {
  // Require session; redirect on unauth
  const { status } = useSessionContext();

  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [formData, setFormData] = useState({ name: '', logo_url: '', handle: '' });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') fetchChannels();
  }, [status]);

  const fetchChannels = async () => {
    try {
      const response = await fetch('/api/channels');
      if (!response.ok) throw new Error('Failed to fetch channels');
      const data = await response.json();
      setChannels(data);
    } catch (err: unknown) {
      console.error('Error fetching channels:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar los canales');
    } finally {
      setLoading(false);
    }
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const arr = [...channels];
    [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
    setChannels(arr);
  };

  const handleMoveDown = (index: number) => {
    if (index === channels.length - 1) return;
    const arr = [...channels];
    [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
    setChannels(arr);
  };

  const handleSaveOrder = async () => {
    try {
      setSavingOrder(true);
      const ids = channels.map(c => c.id);
      const res = await fetch('/api/channels/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) throw new Error('Error al guardar el orden');
      setSuccess('Orden guardado correctamente');
    } catch (err: unknown) {
      console.error('Error saving order:', err);
      setError(err instanceof Error ? err.message : 'Error al guardar el orden');
    } finally {
      setSavingOrder(false);
    }
  };

  const handleOpenDialog = (channel?: Channel) => {
    if (channel) {
      setEditingChannel(channel);
      setFormData({ name: channel.name, logo_url: channel.logo_url || '', handle: channel.handle || '' });
    } else {
      setEditingChannel(null);
      setFormData({ name: '', logo_url: '', handle: '' });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingChannel(null);
    setFormData({ name: '', logo_url: '', handle: '' });
  };

  const handleSubmit = async () => {
    try {
      const url = editingChannel ? `/api/channels/${editingChannel.id}` : '/api/channels';
      const method = editingChannel ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.details || body.error || 'Error al guardar el canal');
      await fetchChannels();
      handleCloseDialog();
      setSuccess(editingChannel ? 'Canal actualizado correctamente' : 'Canal creado correctamente');
    } catch (err: unknown) {
      console.error('Error saving channel:', err);
      setError(err instanceof Error ? err.message : 'Error al guardar el canal');
    }
  };

  const handleToggleVisibility = async (channel: Channel) => {
    try {
      const res = await fetch(`/api/channels/${channel.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_visible: !channel.is_visible }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.details || 'Error al actualizar la visibilidad del canal');
      }
      await fetchChannels();
      setSuccess(`Canal ${channel.is_visible ? 'ocultado' : 'mostrado'} correctamente`);
    } catch (err: unknown) {
      console.error('Error toggling channel visibility:', err);
      setError(err instanceof Error ? err.message : 'Error al actualizar la visibilidad del canal');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro que deseas eliminar este canal?')) return;
    try {
      const res = await fetch(`/api/channels/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.details || 'Error al eliminar el canal');
      }
      await fetchChannels();
      setSuccess('Canal eliminado correctamente');
    } catch (err: unknown) {
      console.error('Error deleting channel:', err);
      setError(err instanceof Error ? err.message : 'Error al eliminar el canal');
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
        <Typography variant="h4" color="text.primary">Canales</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          Nuevo Canal
        </Button>
      </Box>

      <Button
        variant="contained"
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
            {channels.map((channel, idx) => (
              <TableRow key={channel.id}>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    #{idx + 1}
                    <IconButton size="small" onClick={() => handleMoveUp(idx)} disabled={idx === 0}>
                      <ArrowUpward fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleMoveDown(idx)} disabled={idx === channels.length - 1}>
                      <ArrowDownward fontSize="small" />
                    </IconButton>
                  </Box>
                </TableCell>
                <TableCell>
                  {channel.logo_url ? (
                    <Image src={channel.logo_url} alt={channel.name} width={50} height={50} style={{ objectFit: 'contain' }} />
                  ) : (
                    <Box width={50} height={50} display="flex" justifyContent="center" alignItems="center">
                      <Typography variant="caption" color="textSecondary">Sin logo</Typography>
                    </Box>
                  )}
                </TableCell>
                <TableCell>{channel.name}</TableCell>
                <TableCell>
                  {channel.handle && (
                    <Button
                      variant="contained"
                      color="primary"
                      href={`https://www.youtube.com/${channel.handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      size="small"
                    >
                      Ver canal
                    </Button>
                  )}
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpenDialog(channel)}><EditIcon /></IconButton>
                  <IconButton 
                    onClick={() => handleToggleVisibility(channel)}
                    color={channel.is_visible ? 'primary' : 'default'}
                    title={channel.is_visible ? 'Ocultar canal' : 'Mostrar canal'}
                  >
                    {channel.is_visible ? <VisibilityIcon /> : <VisibilityOffIcon />}
                  </IconButton>
                  <IconButton onClick={() => handleDelete(channel.id)}><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight:'bold', fontSize:'1.5rem' }}>
          {editingChannel ? 'Editar Canal' : 'Nuevo Canal'}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={3} mt={2}>
            <TextField
              label="Nombre"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              fullWidth required
            />
            <TextField
              label="URL del Logo"
              value={formData.logo_url}
              onChange={e => setFormData({ ...formData, logo_url: e.target.value })}
              fullWidth
            />
            <TextField
              label="Handle de YouTube"
              value={formData.handle}
              onChange={e => setFormData({ ...formData, handle: e.target.value })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p:2 }}>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingChannel ? 'Guardar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!error || !!success} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={error ? 'error' : 'success'} sx={{ width:'100%' }}>
          {error || success}
        </Alert>
      </Snackbar>
    </Box>
  );
}
