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
    image_url_desktop: '',
    image_url_mobile: '',
    link_type: 'none' as LinkType,
    link_url: '',
    is_enabled: true,
    start_date: '',
    end_date: '',
    display_order: 0,
    is_fixed: false,
    priority: 0,
    banner_type: 'news' as BannerType,
  });
  const [uploadingDesktop, setUploadingDesktop] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);
  const [imagePreviewDesktop, setImagePreviewDesktop] = useState<string | null>(null);
  const [imagePreviewMobile, setImagePreviewMobile] = useState<string | null>(null);
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
        image_url_desktop: banner.image_url_desktop || banner.image_url,
        image_url_mobile: banner.image_url_mobile || banner.image_url,
        link_type: banner.link_type,
        link_url: banner.link_url || '',
        is_enabled: banner.is_enabled,
        start_date: banner.start_date || '',
        end_date: banner.end_date || '',
        display_order: banner.display_order,
        is_fixed: banner.is_fixed,
        priority: banner.priority,
        banner_type: banner.banner_type,
      });
      setImagePreviewDesktop(banner.image_url_desktop || banner.image_url);
      setImagePreviewMobile(banner.image_url_mobile || banner.image_url);
    } else {
      setEditingBanner(null);
      setFormData({
        title: '',
        description: '',
        image_url: '',
        image_url_desktop: '',
        image_url_mobile: '',
        link_type: 'none' as LinkType,
        link_url: '',
        is_enabled: true,
        start_date: '',
        end_date: '',
        display_order: Math.max(...banners.map(b => b.display_order), 0) + 1,
        is_fixed: false,
        priority: Math.max(...banners.map(b => b.priority || 0), 0) + 1,
        banner_type: 'news' as BannerType,
      });
      setImagePreviewDesktop(null);
      setImagePreviewMobile(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingBanner(null);
    setImagePreviewDesktop(null);
    setImagePreviewMobile(null);
    setUploadingDesktop(false);
    setUploadingMobile(false);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>, target: 'desktop' | 'mobile') => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setSnackbar({
        open: true,
        message: 'Por favor selecciona un archivo de imagen',
        severity: 'error',
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setSnackbar({
        open: true,
        message: 'El archivo es demasiado grande. Máximo 5MB',
        severity: 'error',
      });
      return;
    }

    const setUploading = target === 'desktop' ? setUploadingDesktop : setUploadingMobile;
    const setPreview = target === 'desktop' ? setImagePreviewDesktop : setImagePreviewMobile;
    setUploading(true);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const response = await fetch('/api/banners/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al subir la imagen');
      }

      const data = await response.json();
      setFormData(prev => (
        target === 'desktop'
          ? { ...prev, image_url_desktop: data.url }
          : { ...prev, image_url_mobile: data.url }
      ));
      setPreview(data.url);
      setSnackbar({
        open: true,
        message: 'Imagen subida correctamente',
        severity: 'success',
      });
    } catch (error: unknown) {
      console.error('Error uploading image:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al subir la imagen';
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFixedBannerChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      is_fixed: checked,
      start_date: checked ? '' : prev.start_date,
      end_date: checked ? '' : prev.end_date,
    }));
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
                        src={banner.image_url_desktop || banner.image_url}
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
              
              {/* Banner Fijo Checkbox */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Switch
                  checked={formData.is_fixed || false}
                  onChange={(e) => handleFixedBannerChange(e.target.checked)}
                />
                <Typography>Banner Fijo (siempre activo, sin fechas)</Typography>
              </Box>

              {/* Priority Field */}
              <TextField
                label="Prioridad"
                type="number"
                value={formData.priority || 0}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                fullWidth
                required
                helperText="Números menores tienen mayor prioridad. Los banners temporales siempre aparecen antes que los fijos."
              />

              {/* Images Upload (Desktop + Mobile) */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                {/* Desktop image */}
                <Box>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>Imagen Desktop (recomendada 1920×400)</Typography>
                  <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="banner-image-upload-desktop"
                    type="file"
                    onChange={(e) => handleFileSelect(e, 'desktop')}
                    disabled={uploadingDesktop}
                  />
                  <label htmlFor="banner-image-upload-desktop">
                    <Button
                      variant="outlined"
                      component="span"
                      fullWidth
                      disabled={uploadingDesktop}
                      sx={{ mb: 2 }}
                    >
                      {uploadingDesktop ? 'Subiendo...' : 'Subir Imagen Desktop'}
                    </Button>
                  </label>
                  {(imagePreviewDesktop || formData.image_url_desktop) && (
                    <Box sx={{ mt: 1, mb: 2 }}>
                      <Box
                        sx={{
                          position: 'relative',
                          width: '100%',
                          height: 200,
                          borderRadius: 2,
                          overflow: 'hidden',
                          border: '1px solid',
                          borderColor: 'divider',
                        }}
                      >
                        <Image
                          src={imagePreviewDesktop || formData.image_url_desktop || ''}
                          alt="Desktop Preview"
                          fill
                          style={{ objectFit: 'cover' }}
                        />
                      </Box>
                    </Box>
                  )}
                  <TextField
                    label="URL imagen Desktop"
                    value={formData.image_url_desktop || ''}
                    onChange={(e) => setFormData({ ...formData, image_url_desktop: e.target.value })}
                    fullWidth
                    required
                    helperText="URL de la imagen (usada en pantallas grandes)"
                  />
                </Box>

                {/* Mobile image */}
                <Box>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>Imagen Mobile (recomendada 1200×400)</Typography>
                  <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="banner-image-upload-mobile"
                    type="file"
                    onChange={(e) => handleFileSelect(e, 'mobile')}
                    disabled={uploadingMobile}
                  />
                  <label htmlFor="banner-image-upload-mobile">
                    <Button
                      variant="outlined"
                      component="span"
                      fullWidth
                      disabled={uploadingMobile}
                      sx={{ mb: 2 }}
                    >
                      {uploadingMobile ? 'Subiendo...' : 'Subir Imagen Mobile'}
                    </Button>
                  </label>
                  {(imagePreviewMobile || formData.image_url_mobile) && (
                    <Box sx={{ mt: 1, mb: 2 }}>
                      <Box
                        sx={{
                          position: 'relative',
                          width: '100%',
                          height: 200,
                          borderRadius: 2,
                          overflow: 'hidden',
                          border: '1px solid',
                          borderColor: 'divider',
                        }}
                      >
                        <Image
                          src={imagePreviewMobile || formData.image_url_mobile || ''}
                          alt="Mobile Preview"
                          fill
                          style={{ objectFit: 'cover' }}
                        />
                      </Box>
                    </Box>
                  )}
                  <TextField
                    label="URL imagen Mobile"
                    value={formData.image_url_mobile || ''}
                    onChange={(e) => setFormData({ ...formData, image_url_mobile: e.target.value })}
                    fullWidth
                    required
                    helperText="URL de la imagen (usada en pantallas pequeñas)"
                  />
                </Box>
              </Box>

              {/* Legacy fallback image URL */}
              <TextField
                label="URL de la imagen (fallback)"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                fullWidth
                helperText="Se usará si falta Desktop/Mobile. Recomendado cargar ambas imágenes."
                sx={{ mt: 2 }}
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
                helperText="Números menores aparecen primero (legacy, usar prioridad)"
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <DateTimePicker
                  label="Fecha de inicio"
                  value={formData.start_date ? dayjs(formData.start_date) : null}
                  onChange={(date) => setFormData({ ...formData, start_date: date?.toISOString() || '' })}
                  sx={{ flex: 1 }}
                  disabled={formData.is_fixed}
                />
                <DateTimePicker
                  label="Fecha de fin"
                  value={formData.end_date ? dayjs(formData.end_date) : null}
                  onChange={(date) => setFormData({ ...formData, end_date: date?.toISOString() || '' })}
                  sx={{ flex: 1 }}
                  disabled={formData.is_fixed}
                />
              </Box>
              {formData.is_fixed && (
                <Alert severity="info">
                  Los banners fijos no requieren fechas de inicio y fin, ya que están siempre activos.
                </Alert>
              )}
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
