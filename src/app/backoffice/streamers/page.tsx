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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Remove as RemoveIcon,
} from '@mui/icons-material';
import { Streamer, StreamingService } from '@/types/streamer';
import { Category } from '@/types/channel';
import Image from 'next/image';
import CategorySelector from '@/components/backoffice/CategorySelector';

// Service icon URLs from Supabase storage
const SERVICE_ICONS: Record<string, string> = {
  twitch: 'https://dwtkmfahaokhtpuafhsc.supabase.co/storage/v1/object/sign/streaming-services-logos/twitch_glitch_flat_purple.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV84ZWQzMzdmNy04YmEwLTQxYjAtYmJjOS05YjI2NjVhZWYwYzIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJzdHJlYW1pbmctc2VydmljZXMtbG9nb3MvdHdpdGNoX2dsaXRjaF9mbGF0X3B1cnBsZS5wbmciLCJpYXQiOjE3NjM1MjA4NTUsImV4cCI6MTc5NTA1Njg1NX0.9nqfLHXQIsExihVdeGIaAnhWqlW9zRnx0FPFqHarVpA',
  kick: 'https://dwtkmfahaokhtpuafhsc.supabase.co/storage/v1/object/sign/streaming-services-logos/Kick%20Icon%20(Green).png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV84ZWQzMzdmNy04YmEwLTQxYjAtYmJjOS05YjI2NjVhZWYwYzIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJzdHJlYW1pbmctc2VydmljZXMtbG9nb3MvS2ljayBJY29uIChHcmVlbikucG5nIiwiaWF0IjoxNzYzNTIwODQyLCJleHAiOjE3OTUwNTY4NDJ9.3cqNHCk9mYT4k6E7mUiIDIA8CWXWIKTUQK1iThtSrmo',
};

export default function StreamersPage() {
  const { status } = useSessionContext();

  const [streamers, setStreamers] = useState<Streamer[]>([]);
  const [originalStreamers, setOriginalStreamers] = useState<Streamer[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<{ index: number; position: 'above' | 'below' } | null>(null);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingStreamer, setEditingStreamer] = useState<Streamer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    logo_url: '',
    is_visible: true,
    services: [] as Array<{ service: StreamingService; url: string; username?: string }>,
  });
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const [syncingService, setSyncingService] = useState<{ streamerId: number; service: string } | null>(null);

  useEffect(() => {
    if (status === 'authenticated') fetchStreamers();
  }, [status]);

  const fetchStreamers = async () => {
    try {
      const response = await fetch('/api/streamers');
      if (!response.ok) throw new Error('Failed to fetch streamers');
      const data = await response.json();
      setStreamers(data);
      setOriginalStreamers(data);
    } catch (err: unknown) {
      console.error('Error fetching streamers:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar los streamers');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (streamer?: Streamer) => {
    if (streamer) {
      setEditingStreamer(streamer);
      setFormData({
        name: streamer.name,
        logo_url: streamer.logo_url || '',
        is_visible: streamer.is_visible ?? true,
        services: streamer.services || [],
      });
      setSelectedCategories(streamer.categories || []);
      setLogoPreview(streamer.logo_url || null);
    } else {
      setEditingStreamer(null);
      setFormData({
        name: '',
        logo_url: '',
        is_visible: true,
        services: [],
      });
      setSelectedCategories([]);
      setLogoPreview(null);
    }
    setUploadingLogo(false);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingStreamer(null);
    setFormData({
      name: '',
      logo_url: '',
      is_visible: true,
      services: [],
    });
    setSelectedCategories([]);
    setUploadingLogo(false);
    setLogoPreview(null);
  };

  const handleLogoFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona un archivo de imagen');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('El archivo es demasiado grande. Máximo 5MB');
      return;
    }

    setUploadingLogo(true);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const response = await fetch('/api/streamers/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || 'Error al subir el logo');
      }

      const data = await response.json();
      setFormData(prev => ({ ...prev, logo_url: data.url }));
      setLogoPreview(data.url);
      setSuccess('Logo subido correctamente');
    } catch (err: unknown) {
      console.error('Error uploading logo:', err);
      setError(err instanceof Error ? err.message : 'Error al subir el logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  // When editing, extract username from URL for Twitch/Kick if username is missing
  useEffect(() => {
    if (editingStreamer && formData.services && formData.services.length > 0) {
      const updatedServices = formData.services.map(service => {
        if ((service.service === StreamingService.TWITCH || service.service === StreamingService.KICK) &&
          service.url && !service.username) {
          // Extract username from URL for display
          const urlMatch = service.url.match(/(?:twitch\.tv\/|kick\.com\/)([^/?]+)/);
          if (urlMatch && urlMatch[1]) {
            return { ...service, username: urlMatch[1] };
          }
        }
        return service;
      });
      // Only update if there's a change to avoid infinite loop
      const hasChanges = updatedServices.some((s, i) => s.username !== formData.services[i]?.username);
      if (hasChanges) {
        setFormData({ ...formData, services: updatedServices });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingStreamer]); // Only run when editingStreamer changes

  const handleAddService = () => {
    setFormData({
      ...formData,
      services: [...formData.services, { service: StreamingService.TWITCH, url: '', username: '' }],
    });
  };

  const handleRemoveService = (index: number) => {
    setFormData({
      ...formData,
      services: formData.services.filter((_, i) => i !== index),
    });
  };

  // Use functional updates to avoid stale state when multiple updates happen back-to-back
  const handleServiceChange = (index: number, field: 'service' | 'url' | 'username', value: string) => {
    setFormData(prev => {
      const updatedServices = [...prev.services];
      updatedServices[index] = {
        ...updatedServices[index],
        [field]: field === 'service' ? (value as StreamingService) : value,
      };
      return { ...prev, services: updatedServices };
    });
  };

  // Dedicated handler to change service type and clear fields atomically
  const handleServiceTypeChange = (index: number, newService: StreamingService) => {
    setFormData(prev => {
      const updatedServices = [...prev.services];
      const current = updatedServices[index] ?? { service: newService, url: '', username: '' };
      const cleared =
        newService === StreamingService.YOUTUBE
          ? { ...current, service: newService, url: '', username: '' }
          : { ...current, service: newService, username: '', url: '' };
      updatedServices[index] = cleared;
      return { ...prev, services: updatedServices };
    });
  };

  const handleSubmit = async () => {
    try {
      if (formData.services.length === 0) {
        setError('Debes agregar al menos un servicio de streaming');
        return;
      }

      // Validate services have required fields
      for (const service of formData.services) {
        if (service.service === StreamingService.YOUTUBE) {
          if (!service.url?.trim()) {
            setError('YouTube requiere una URL');
            return;
          }
        } else if (service.service === StreamingService.TWITCH || service.service === StreamingService.KICK) {
          if (!service.username?.trim()) {
            setError(`${service.service === StreamingService.TWITCH ? 'Twitch' : 'Kick'} requiere un username`);
            return;
          }
        }
      }

      const url = editingStreamer ? `/api/streamers/${editingStreamer.id}` : '/api/streamers';
      const method = editingStreamer ? 'PATCH' : 'POST';
      const requestData = {
        name: formData.name,
        logo_url: formData.logo_url || undefined,
        is_visible: formData.is_visible,
        services: formData.services.map(s => {
          // For Twitch/Kick, only send username (backend will generate URL)
          // For YouTube, only send URL
          if (s.service === StreamingService.YOUTUBE) {
            return {
              service: s.service,
              url: s.url,
            };
          } else {
            return {
              service: s.service,
              username: s.username?.trim(),
            };
          }
        }),
        category_ids: selectedCategories.map(cat => cat.id),
      };
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.details || body.error || 'Error al guardar el streamer');
      await fetchStreamers();
      handleCloseDialog();
      setSuccess(editingStreamer ? 'Streamer actualizado correctamente' : 'Streamer creado correctamente');
    } catch (err: unknown) {
      console.error('Error saving streamer:', err);
      setError(err instanceof Error ? err.message : 'Error al guardar el streamer');
    }
  };

  const handleToggleVisibility = async (streamer: Streamer) => {
    try {
      const res = await fetch(`/api/streamers/${streamer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_visible: !streamer.is_visible }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.details || 'Error al actualizar la visibilidad del streamer');
      }
      await fetchStreamers();
      setSuccess(`Streamer ${streamer.is_visible ? 'ocultado' : 'mostrado'} correctamente`);
    } catch (err: unknown) {
      console.error('Error toggling streamer visibility:', err);
      setError(err instanceof Error ? err.message : 'Error al actualizar la visibilidad del streamer');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro que deseas eliminar este streamer?')) return;
    try {
      const res = await fetch(`/api/streamers/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.details || 'Error al eliminar el streamer');
      }
      await fetchStreamers();
      setSuccess('Streamer eliminado correctamente');
    } catch (err: unknown) {
      console.error('Error deleting streamer:', err);
      setError(err instanceof Error ? err.message : 'Error al eliminar el streamer');
    }
  };

  const handleCloseSnackbar = () => {
    setError(null);
    setSuccess(null);
  };

  const hasOrderChanges =
    streamers.length > 0 &&
    originalStreamers.length === streamers.length &&
    streamers.map(s => s.id).join(',') !== originalStreamers.map(s => s.id).join(',');

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const arr = [...streamers];
    [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
    setStreamers(arr);
  };

  const handleMoveDown = (index: number) => {
    if (index === streamers.length - 1) return;
    const arr = [...streamers];
    [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
    setStreamers(arr);
  };

  const handleSaveOrder = async () => {
    try {
      setSavingOrder(true);
      const ids = streamers.map(s => s.id);
      const res = await fetch('/api/streamers/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.details || 'Error al guardar el orden');
      }
      setSuccess('Orden de streamers guardado correctamente');
      setOriginalStreamers(streamers);
    } catch (err: unknown) {
      console.error('Error saving order:', err);
      setError(err instanceof Error ? err.message : 'Error al guardar el orden');
    } finally {
      setSavingOrder(false);
    }
  };

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent<HTMLTableRowElement>, index: number) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const offset = e.clientY - rect.top;
    const position: 'above' | 'below' = offset < rect.height / 2 ? 'above' : 'below';
    setDragOver({ index, position });
  };

  const handleDrop = (dropIndex: number) => {
    if (dragIndex === null || dragOver === null) return;
    const insertionIndex = dragOver.position === 'above' ? dropIndex : dropIndex + 1;
    setStreamers((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(dragIndex, 1);
      let insertAt = insertionIndex;
      if (dragIndex < insertionIndex) insertAt = insertionIndex - 1;
      updated.splice(insertAt, 0, moved);
      return updated;
    });
    setDragIndex(null);
    setDragOver(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOver(null);
  };

  const getServiceName = (service: StreamingService): string => {
    switch (service) {
      case StreamingService.TWITCH:
        return 'Twitch';
      case StreamingService.KICK:
        return 'Kick';
      case StreamingService.YOUTUBE:
        return 'YouTube';
      default:
        return service;
    }
  };

  const handleSyncLiveStatus = async (streamerId: number, service: 'kick' | 'twitch') => {
    try {
      setSyncingService({ streamerId, service });
      const res = await fetch(`/api/streamers/${streamerId}/sync-live-status`, {
        method: 'POST',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.details || `Error al sincronizar estado de ${service}`);
      }
      const data = await res.json();
      const result = data.results?.find((r: { service: string }) => r.service === service);
      if (result?.success) {
        setSuccess(`Estado de ${service} sincronizado: ${result.isLive ? 'EN VIVO' : 'OFFLINE'}`);
      } else {
        setError(result?.error || `No se pudo sincronizar el estado de ${service}`);
      }
    } catch (err: unknown) {
      console.error('Error syncing live status:', err);
      setError(err instanceof Error ? err.message : 'Error al sincronizar estado');
    } finally {
      setSyncingService(null);
    }
  };

  const hasService = (streamer: Streamer, service: StreamingService): boolean => {
    return streamer.services.some(s => s.service === service);
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
        <Typography variant="h4" color="text.primary">Streamers</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          Nuevo Streamer
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Orden</TableCell>
              <TableCell>Logo</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Servicios</TableCell>
              <TableCell>Categorías</TableCell>
              <TableCell>Visible</TableCell>
              <TableCell>Sync</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {streamers.map((streamer, idx) => (
              <TableRow
                key={streamer.id}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDrop={() => handleDrop(idx)}
                onDragEnd={handleDragEnd}
                sx={{
                  cursor: 'grab',
                  transition: 'transform 120ms ease, opacity 120ms ease, border-color 120ms ease',
                  opacity: dragIndex === idx ? 0.85 : 1,
                  transform: dragIndex === idx ? 'scale(0.995)' : 'none',
                  ...(dragOver && dragOver.index === idx && dragOver.position === 'above'
                    ? { borderTop: '2px dashed', borderTopColor: 'primary.main' }
                    : {}),
                  ...(dragOver && dragOver.index === idx && dragOver.position === 'below'
                    ? { borderBottom: '2px dashed', borderBottomColor: 'primary.main' }
                    : {}),
                }}
              >
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    #{idx + 1}
                    <IconButton size="small" onClick={() => handleMoveUp(idx)} disabled={idx === 0}>
                      {/* using a simple caret by unicode to avoid extra imports */}
                      <span style={{ fontSize: 14 }}>▲</span>
                    </IconButton>
                    <IconButton size="small" onClick={() => handleMoveDown(idx)} disabled={idx === streamers.length - 1}>
                      <span style={{ fontSize: 14 }}>▼</span>
                    </IconButton>
                  </Box>
                </TableCell>
                <TableCell>
                  {streamer.logo_url ? (
                    <Image src={streamer.logo_url} alt={streamer.name} width={50} height={50} style={{ objectFit: 'contain' }} />
                  ) : (
                    <Box width={50} height={50} display="flex" justifyContent="center" alignItems="center">
                      <Typography variant="caption" color="textSecondary">Sin logo</Typography>
                    </Box>
                  )}
                </TableCell>
                <TableCell>{streamer.name}</TableCell>
                <TableCell>
                  <Box display="flex" flexDirection="column" gap={0.5}>
                    {streamer.services.map((service, idx) => (
                      <Chip
                        key={idx}
                        label={`${getServiceName(service.service)}: ${service.url}`}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box display="flex" flexWrap="wrap" gap={0.5}>
                    {streamer.categories?.map((cat) => (
                      <Chip
                        key={cat.id}
                        label={cat.name}
                        size="small"
                        sx={{
                          backgroundColor: cat.color ? `${cat.color}20` : undefined,
                          borderColor: cat.color || undefined,
                        }}
                      />
                    ))}
                  </Box>
                </TableCell>
                <TableCell>
                  <Switch
                    checked={streamer.is_visible ?? true}
                    onChange={() => handleToggleVisibility(streamer)}
                    color="primary"
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Box display="flex" gap={0.5}>
                    <IconButton
                      size="small"
                      onClick={() => handleSyncLiveStatus(streamer.id, 'kick')}
                      disabled={!hasService(streamer, StreamingService.KICK) || syncingService?.streamerId === streamer.id}
                      title={hasService(streamer, StreamingService.KICK) ? 'Sync Kick' : 'No tiene Kick'}
                      sx={{
                        backgroundColor: hasService(streamer, StreamingService.KICK) ? 'rgba(83, 252, 24, 0.1)' : undefined,
                        '&:hover': {
                          backgroundColor: hasService(streamer, StreamingService.KICK) ? 'rgba(83, 252, 24, 0.2)' : undefined,
                        },
                        opacity: hasService(streamer, StreamingService.KICK) ? 1 : 0.3,
                      }}
                    >
                      {syncingService?.streamerId === streamer.id && syncingService?.service === 'kick' ? (
                        <CircularProgress size={18} />
                      ) : (
                        <Image
                          src={SERVICE_ICONS.kick}
                          alt="Kick"
                          width={18}
                          height={18}
                          style={{ objectFit: 'contain' }}
                        />
                      )}
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleSyncLiveStatus(streamer.id, 'twitch')}
                      disabled={!hasService(streamer, StreamingService.TWITCH) || syncingService?.streamerId === streamer.id}
                      title={hasService(streamer, StreamingService.TWITCH) ? 'Sync Twitch' : 'No tiene Twitch'}
                      sx={{
                        backgroundColor: hasService(streamer, StreamingService.TWITCH) ? 'rgba(145, 70, 255, 0.1)' : undefined,
                        '&:hover': {
                          backgroundColor: hasService(streamer, StreamingService.TWITCH) ? 'rgba(145, 70, 255, 0.2)' : undefined,
                        },
                        opacity: hasService(streamer, StreamingService.TWITCH) ? 1 : 0.3,
                      }}
                    >
                      {syncingService?.streamerId === streamer.id && syncingService?.service === 'twitch' ? (
                        <CircularProgress size={18} />
                      ) : (
                        <Image
                          src={SERVICE_ICONS.twitch}
                          alt="Twitch"
                          width={18}
                          height={18}
                          style={{ objectFit: 'contain' }}
                        />
                      )}
                    </IconButton>
                  </Box>
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpenDialog(streamer)}><EditIcon /></IconButton>
                  <IconButton onClick={() => handleDelete(streamer.id)}><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', fontSize: '1.5rem' }}>
          {editingStreamer ? 'Editar Streamer' : 'Nuevo Streamer'}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={3} mt={2}>
            <TextField
              label="Nombre"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />
            <Box>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="streamer-logo-upload"
                type="file"
                onChange={handleLogoFileSelect}
                disabled={uploadingLogo}
              />
              <label htmlFor="streamer-logo-upload">
                <Button
                  variant="outlined"
                  component="span"
                  fullWidth
                  disabled={uploadingLogo}
                  sx={{ mb: 2 }}
                >
                  {uploadingLogo ? 'Subiendo...' : 'Subir Logo'}
                </Button>
              </label>

              {logoPreview && (
                <Box sx={{ mt: 1, mb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>Vista previa:</Typography>
                  <Box
                    sx={{
                      position: 'relative',
                      width: 140,
                      height: 140,
                      borderRadius: 2,
                      overflow: 'hidden',
                      border: '1px solid',
                      borderColor: 'divider',
                      backgroundColor: 'background.paper',
                    }}
                  >
                    <Image
                      src={logoPreview}
                      alt="Logo preview"
                      fill
                      style={{ objectFit: 'contain' }}
                    />
                  </Box>
                </Box>
              )}

              <TextField
                label="URL del Logo"
                value={formData.logo_url}
                onChange={e => setFormData({ ...formData, logo_url: e.target.value })}
                fullWidth
                helperText="URL del logo en Supabase Storage (se llena automáticamente al subir)"
              />
            </Box>
            <Box display="flex" alignItems="center" gap={2}>
              <Typography>Visible</Typography>
              <Switch
                checked={formData.is_visible}
                onChange={e => setFormData({ ...formData, is_visible: e.target.checked })}
                color="primary"
              />
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Servicios de Streaming
              </Typography>
              {formData.services.map((service, index) => {
                const isTwitchOrKick = service.service === StreamingService.TWITCH || service.service === StreamingService.KICK;
                const isYouTube = service.service === StreamingService.YOUTUBE;

                return (
                  <Box key={index} display="flex" gap={1} mb={2} alignItems="flex-start">
                    <FormControl sx={{ minWidth: 120 }}>
                      <InputLabel>Servicio</InputLabel>
                      <Select
                        value={service.service}
                        label="Servicio"
                        onChange={(e) => handleServiceTypeChange(index, e.target.value as StreamingService)}
                      >
                        <MenuItem value={StreamingService.TWITCH}>Twitch</MenuItem>
                        <MenuItem value={StreamingService.KICK}>Kick</MenuItem>
                        <MenuItem value={StreamingService.YOUTUBE}>YouTube</MenuItem>
                      </Select>
                    </FormControl>
                    {isTwitchOrKick ? (
                      <TextField
                        label="Username"
                        value={service.username || ''}
                        onChange={e => handleServiceChange(index, 'username', e.target.value)}
                        fullWidth
                        required
                        placeholder="username"
                        helperText="La URL se generará automáticamente"
                      />
                    ) : isYouTube ? (
                      <TextField
                        label="URL"
                        value={service.url || ''}
                        onChange={e => handleServiceChange(index, 'url', e.target.value)}
                        fullWidth
                        required
                        placeholder="https://www.youtube.com/@channelname"
                      />
                    ) : null}
                    <IconButton
                      onClick={() => handleRemoveService(index)}
                      color="error"
                      sx={{ mt: 1 }}
                    >
                      <RemoveIcon />
                    </IconButton>
                  </Box>
                )
              })}
              <Button
                startIcon={<AddIcon />}
                onClick={handleAddService}
                variant="outlined"
                size="small"
              >
                Agregar Servicio
              </Button>
            </Box>

            <CategorySelector
              selectedCategories={selectedCategories}
              onCategoriesChange={setSelectedCategories}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={formData.services.length === 0}>
            {editingStreamer ? 'Guardar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!error || !!success} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={error ? 'error' : 'success'} sx={{ width: '100%' }}>
          {error || success}
        </Alert>
      </Snackbar>

      {hasOrderChanges && (
        <Paper
          elevation={6}
          sx={{
            position: 'fixed',
            left: '50%',
            transform: 'translateX(-50%)',
            bottom: 16,
            zIndex: 1200,
            px: 2,
            py: 1,
            borderRadius: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <Button
            variant="text"
            color="inherit"
            onClick={() => setStreamers(originalStreamers)}
          >
            Descartar cambios
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveOrder}
            disabled={savingOrder}
          >
            {savingOrder ? 'Guardando...' : 'Confirmar orden'}
          </Button>
        </Paper>
      )}
    </Box>
  );
}

