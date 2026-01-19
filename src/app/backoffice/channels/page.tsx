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
  Switch,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowUpward,
  ArrowDownward,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { Channel, Category } from '@/types/channel';
import Image from 'next/image';
import CategorySelector from '@/components/backoffice/CategorySelector';
import { ConfigService } from '@/services/config';

export default function ChannelsPage() {
  // Require session; redirect on unauth
  const { status } = useSessionContext();

  const [channels, setChannels] = useState<Channel[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [formData, setFormData] = useState({ name: '', logo_url: '', handle: '', is_visible: false, background_color: '', show_only_when_scheduled: false, youtube_fetch_enabled: true, youtube_fetch_override_holiday: true });
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const [loadingConfigs, setLoadingConfigs] = useState(false);
  const [clearingCache, setClearingCache] = useState<number | null>(null);

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

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent<HTMLTableRowElement>) => {
    e.preventDefault();
  };

  const handleDrop = (dropIndex: number) => {
    if (dragIndex === null || dragIndex === dropIndex) return;
    setChannels((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(dragIndex, 1);
      updated.splice(dropIndex, 0, moved);
      return updated;
    });
    setDragIndex(null);
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

  const handleOpenDialog = async (channel?: Channel) => {
    if (channel) {
      setEditingChannel(channel);
      setFormData({ name: channel.name, logo_url: channel.logo_url || '', handle: channel.handle || '', is_visible: channel.is_visible ?? true, background_color: channel.background_color || '', show_only_when_scheduled: channel.show_only_when_scheduled ?? false, youtube_fetch_enabled: true, youtube_fetch_override_holiday: true });
      setSelectedCategories(channel.categories || []);
      
      // Fetch current config values for this channel before opening dialog
      if (channel.handle) {
        setLoadingConfigs(true);
        try {
          const configs = await ConfigService.findAll();
          const fetchEnabledConfig = configs.find(c => c.key === `youtube.fetch_enabled.${channel.handle}`);
          const holidayOverrideConfig = configs.find(c => c.key === `youtube.fetch_override_holiday.${channel.handle}`);
          
          setFormData(prev => ({
            ...prev,
            youtube_fetch_enabled: fetchEnabledConfig ? fetchEnabledConfig.value === 'true' : true,
            youtube_fetch_override_holiday: holidayOverrideConfig ? holidayOverrideConfig.value === 'true' : true,
          }));
        } catch (err) {
          console.error('Error fetching config values:', err);
          // Keep defaults if fetch fails
        } finally {
          setLoadingConfigs(false);
        }
      }
      // Open dialog after configs are loaded (or if no handle to fetch)
      setOpenDialog(true);
    } else {
      setEditingChannel(null);
      setFormData({ name: '', logo_url: '', handle: '', is_visible: false, background_color: '', show_only_when_scheduled: false, youtube_fetch_enabled: true, youtube_fetch_override_holiday: true });
      setSelectedCategories([]);
      // For new channels, open immediately (no config fetch needed)
      setOpenDialog(true);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingChannel(null);
    setFormData({ name: '', logo_url: '', handle: '', is_visible: false, background_color: '', show_only_when_scheduled: false, youtube_fetch_enabled: true, youtube_fetch_override_holiday: true });
    setSelectedCategories([]);
    setLoadingConfigs(false);
  };

  const handleSubmit = async () => {
    try {
      const url = editingChannel ? `/api/channels/${editingChannel.id}` : '/api/channels';
      const method = editingChannel ? 'PATCH' : 'POST';
      const requestData = {
        ...formData,
        category_ids: selectedCategories.map(cat => cat.id),
      };
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
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

  const handleClearCache = async (channel: Channel) => {
    if (!channel.handle) {
      setError('El canal no tiene handle de YouTube');
      return;
    }
    
    try {
      setClearingCache(channel.id);
      const res = await fetch(`/api/channels/${channel.id}/clear-cache`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.details || body?.message || 'Error al limpiar la caché');
      }
      const data = await res.json();
      setSuccess(`Caché limpiada correctamente para ${channel.name}. Entradas eliminadas: ${data.cleared?.join(', ') || 'todas'}`);
    } catch (err: unknown) {
      console.error('Error clearing cache:', err);
      setError(err instanceof Error ? err.message : 'Error al limpiar la caché');
    } finally {
      setClearingCache(null);
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
              <TableRow
                key={channel.id}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(idx)}
                sx={{ cursor: 'grab' }}
              >
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
                  <Box display="flex" alignItems="center" gap={1}>
                    <IconButton onClick={() => handleOpenDialog(channel)}><EditIcon /></IconButton>
                    <Switch
                      checked={channel.is_visible}
                      onChange={() => handleToggleVisibility(channel)}
                      color="primary"
                      size="small"
                    />
                    {channel.handle && (
                      <IconButton
                        onClick={() => handleClearCache(channel)}
                        disabled={clearingCache === channel.id}
                        title="Limpiar caché de estado en vivo"
                        color="secondary"
                      >
                        <RefreshIcon />
                      </IconButton>
                    )}
                    <IconButton onClick={() => handleDelete(channel.id)}><DeleteIcon /></IconButton>
                  </Box>
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
            <TextField
              label="Color de Fondo"
              value={formData.background_color}
              onChange={e => setFormData({ ...formData, background_color: e.target.value })}
              fullWidth
              placeholder="#ffffff o linear-gradient(...)"
              helperText="Color hexadecimal (#ffffff) o gradiente CSS (linear-gradient(...))"
            />
            <Box display="flex" alignItems="center" gap={2}>
              <Typography>Visible</Typography>
              <Switch
                checked={formData.is_visible}
                onChange={e => setFormData({ ...formData, is_visible: e.target.checked })}
                color="primary"
              />
            </Box>
            <Box display="flex" alignItems="center" gap={2}>
              <Typography>Mostrar solo cuando tenga programación</Typography>
              <Switch
                checked={formData.show_only_when_scheduled}
                onChange={e => setFormData({ ...formData, show_only_when_scheduled: e.target.checked })}
                color="primary"
              />
            </Box>
            <Box display="flex" alignItems="center" gap={2}>
              <Typography>Fetch de YouTube habilitado</Typography>
              <Switch
                checked={formData.youtube_fetch_enabled}
                onChange={e => setFormData({ ...formData, youtube_fetch_enabled: e.target.checked })}
                color="primary"
              />
            </Box>
            <Box display="flex" alignItems="center" gap={2}>
              <Typography>Fetch de YouTube habilitado en feriados</Typography>
              <Switch
                checked={formData.youtube_fetch_override_holiday}
                onChange={e => setFormData({ ...formData, youtube_fetch_override_holiday: e.target.checked })}
                color="primary"
              />
            </Box>
            <CategorySelector
              selectedCategories={selectedCategories}
              onCategoriesChange={setSelectedCategories}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p:2 }}>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loadingConfigs}>
            {loadingConfigs ? 'Cargando...' : (editingChannel ? 'Guardar' : 'Crear')}
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
