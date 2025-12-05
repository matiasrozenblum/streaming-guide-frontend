'use client';

import { useState, useEffect } from 'react';
import { useSessionContext } from '@/contexts/SessionContext';
import {
  Box,
  Button,
  Paper,
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
  Card,
  CardMedia,
  CardContent,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  VisibilityOff as VisibilityOffIcon,
  Link as LinkIcon,
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import Image from 'next/image';
import { bannersApi } from '@/services/banners';
import type { Banner, CreateBannerDto, LinkType, BannerType } from '@/types/banner';

export default function BannersPage() {
  const { status } = useSessionContext();

  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [formData, setFormData] = useState<CreateBannerDto>({
    title: '',
    description: '',
    image_url: '',
    link_type: 'none' as LinkType,
    link_url: '',
    is_enabled: true,
    start_date: '',
    end_date: '',
    display_order: 0,
    banner_type: 'news' as BannerType,
  });
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; banner: Banner | null }>({
    open: false,
    banner: null,
  });

  // Redirect if not admin
  useEffect(() => {
    if (status === 'unauthenticated') {
      window.location.href = '/';
    }
  }, [status]);

  // Fetch banners
  const fetchBanners = async () => {
    try {
      setLoading(true);
      const data = await bannersApi.getAllBanners();
      setBanners(data);
    } catch (error) {
      console.error('Error fetching banners:', error);
      setSnackbar({
        open: true,
        message: 'Error al cargar los banners',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleOpenDialog = (banner?: Banner) => {
    if (banner) {
      setEditingBanner(banner);
      setFormData({
        title: banner.title,
        description: banner.description || '',
        image_url: banner.image_url,
        link_type: banner.link_type,
        link_url: banner.link_url || '',
        is_enabled: banner.is_enabled,
        start_date: banner.start_date || '',
        end_date: banner.end_date || '',
        display_order: banner.display_order,
        banner_type: banner.banner_type,
      });
    } else {
      setEditingBanner(null);
      setFormData({
        title: '',
        description: '',
        image_url: '',
        link_type: 'none' as LinkType,
        link_url: '',
        is_enabled: true,
        start_date: '',
        end_date: '',
        display_order: Math.max(...banners.map(b => b.display_order), 0) + 1,
        banner_type: 'news' as BannerType,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingBanner(null);
  };

  const handleSave = async () => {
    try {
      if (editingBanner) {
        await bannersApi.updateBanner(editingBanner.id, formData);
        setSnackbar({
          open: true,
          message: 'Banner actualizado correctamente',
          severity: 'success',
        });
      } else {
        await bannersApi.createBanner(formData);
        setSnackbar({
          open: true,
          message: 'Banner creado correctamente',
          severity: 'success',
        });
      }
      handleCloseDialog();
      fetchBanners();
    } catch (error) {
      console.error('Error saving banner:', error);
      setSnackbar({
        open: true,
        message: 'Error al guardar el banner',
        severity: 'error',
      });
    }
  };

  const handleDelete = async (banner: Banner) => {
    try {
      await bannersApi.deleteBanner(banner.id);
      setSnackbar({
        open: true,
        message: 'Banner eliminado correctamente',
        severity: 'success',
      });
      setDeleteConfirm({ open: false, banner: null });
      fetchBanners();
    } catch (error) {
      console.error('Error deleting banner:', error);
      setSnackbar({
        open: true,
        message: 'Error al eliminar el banner',
        severity: 'error',
      });
    }
  };

  const handleToggleEnabled = async (banner: Banner) => {
    try {
      await bannersApi.updateBanner(banner.id, { is_enabled: !banner.is_enabled });
      setSnackbar({
        open: true,
        message: `Banner ${banner.is_enabled ? 'deshabilitado' : 'habilitado'} correctamente`,
        severity: 'success',
      });
      fetchBanners();
    } catch (error) {
      console.error('Error toggling banner:', error);
      setSnackbar({
        open: true,
        message: 'Error al cambiar el estado del banner',
        severity: 'error',
      });
    }
  };

  const getBannerTypeColor = (type: BannerType) => {
    switch (type) {
      case 'news': return 'primary';
      case 'promotional': return 'secondary';
      case 'featured': return 'success';
      default: return 'default';
    }
  };

  const getBannerTypeLabel = (type: BannerType) => {
    switch (type) {
      case 'news': return 'Noticia';
      case 'promotional': return 'Promocional';
      case 'featured': return 'Destacado';
      default: return type;
    }
  };

  const getLinkTypeLabel = (type: LinkType) => {
    switch (type) {
      case 'internal': return 'Interno';
      case 'external': return 'Externo';
      case 'none': return 'Sin enlace';
      default: return type;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            Gestión de Banners
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Nuevo Banner
          </Button>
        </Box>

        {banners.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" color="textSecondary">
              No hay banners creados
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              Crea tu primer banner para comenzar
            </Typography>
          </Paper>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: 'repeat(2, 1fr)',
                lg: 'repeat(3, 1fr)',
              },
              gap: 3,
            }}
          >
            {banners.map((banner) => (
              <Card key={banner.id}>
                  <Box sx={{ position: 'relative' }}>
                    <CardMedia
                      component="div"
                      sx={{ height: 140, position: 'relative' }}
                    >
                      <Image
                        src={banner.image_url}
                        alt={banner.title}
                        fill
                        style={{ objectFit: 'cover' }}
                      />
                      {!banner.is_enabled && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <VisibilityOffIcon sx={{ color: 'white', fontSize: 40 }} />
                        </Box>
                      )}
                    </CardMedia>
                    <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                      <Chip
                        label={getBannerTypeLabel(banner.banner_type)}
                        color={getBannerTypeColor(banner.banner_type)}
                        size="small"
                      />
                    </Box>
                  </Box>
                  <CardContent>
                    <Typography variant="h6" component="h3" gutterBottom>
                      {banner.title}
                    </Typography>
                    {banner.description && (
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        {banner.description.length > 100
                          ? `${banner.description.substring(0, 100)}...`
                          : banner.description}
                      </Typography>
                    )}
                    <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      <Chip
                        icon={banner.link_type !== 'none' ? <LinkIcon /> : undefined}
                        label={getLinkTypeLabel(banner.link_type)}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        label={`Orden: ${banner.display_order}`}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Switch
                        checked={banner.is_enabled}
                        onChange={() => handleToggleEnabled(banner)}
                        size="small"
                      />
                      <Box>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(banner)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => setDeleteConfirm({ open: true, banner })}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
            ))}
          </Box>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingBanner ? 'Editar Banner' : 'Nuevo Banner'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField
                label="Título"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
                label="URL de la imagen"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                fullWidth
                required
                helperText="URL de la imagen en Supabase Storage"
              />
              <FormControl fullWidth>
                <InputLabel>Tipo de banner</InputLabel>
                <Select
                  value={formData.banner_type}
                  onChange={(e) => setFormData({ ...formData, banner_type: e.target.value as BannerType })}
                  label="Tipo de banner"
                >
                  <MenuItem value="news">Noticia</MenuItem>
                  <MenuItem value="promotional">Promocional</MenuItem>
                  <MenuItem value="featured">Destacado</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Tipo de enlace</InputLabel>
                <Select
                  value={formData.link_type}
                  onChange={(e) => setFormData({ ...formData, link_type: e.target.value as LinkType })}
                  label="Tipo de enlace"
                >
                  <MenuItem value="none">Sin enlace</MenuItem>
                  <MenuItem value="internal">Enlace interno</MenuItem>
                  <MenuItem value="external">Enlace externo</MenuItem>
                </Select>
              </FormControl>
              {formData.link_type !== 'none' && (
                <TextField
                  label="URL del enlace"
                  value={formData.link_url}
                  onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                  fullWidth
                  required
                  helperText={
                    formData.link_type === 'internal'
                      ? 'Ruta interna (ej: /streamers)'
                      : 'URL completa (ej: https://example.com)'
                  }
                />
              )}
              <TextField
                label="Orden de visualización"
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                fullWidth
                helperText="Números menores aparecen primero"
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <DateTimePicker
                  label="Fecha de inicio"
                  value={formData.start_date ? dayjs(formData.start_date) : null}
                  onChange={(date) => setFormData({ ...formData, start_date: date?.toISOString() || '' })}
                  sx={{ flex: 1 }}
                />
                <DateTimePicker
                  label="Fecha de fin"
                  value={formData.end_date ? dayjs(formData.end_date) : null}
                  onChange={(date) => setFormData({ ...formData, end_date: date?.toISOString() || '' })}
                  sx={{ flex: 1 }}
                />
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancelar</Button>
            <Button onClick={handleSave} variant="contained">
              {editingBanner ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteConfirm.open}
          onClose={() => setDeleteConfirm({ open: false, banner: null })}
        >
          <DialogTitle>Confirmar eliminación</DialogTitle>
          <DialogContent>
            <Typography>
              ¿Estás seguro de que quieres eliminar el banner &quot;{deleteConfirm.banner?.title}&quot;?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteConfirm({ open: false, banner: null })}>
              Cancelar
            </Button>
            <Button
              onClick={() => deleteConfirm.banner && handleDelete(deleteConfirm.banner)}
              color="error"
              variant="contained"
            >
              Eliminar
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
}
