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
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { Category } from '@/types/category';

const COLOR_PRESETS = [
  '#f44336', // Red
  '#e91e63', // Pink
  '#9c27b0', // Purple
  '#673ab7', // Deep Purple
  '#3f51b5', // Indigo
  '#2196f3', // Blue
  '#03a9f4', // Light Blue
  '#00bcd4', // Cyan
  '#009688', // Teal
  '#4caf50', // Green
  '#8bc34a', // Light Green
  '#cddc39', // Lime
  '#ffeb3b', // Yellow
  '#ffc107', // Amber
  '#ff9800', // Orange
  '#ff5722', // Deep Orange
  '#795548', // Brown
  '#607d8b', // Blue Grey
];

export default function CategoriesPage() {
  const { status } = useSessionContext();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    description: '', 
    color: '#2196f3' 
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'authenticated') fetchCategories();
  }, [status]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      setCategories(data);
    } catch (err: unknown) {
      console.error('Error fetching categories:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar las categorías');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({ 
        name: category.name, 
        description: category.description || '', 
        color: category.color || '#2196f3' 
      });
    } else {
      setEditingCategory(null);
      setFormData({ name: '', description: '', color: '#2196f3' });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCategory(null);
    setFormData({ name: '', description: '', color: '#2196f3' });
  };

  const handleSubmit = async () => {
    try {
      const url = editingCategory ? `/api/categories/${editingCategory.id}` : '/api/categories';
      const method = editingCategory ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.details || body.error || 'Error al guardar la categoría');
      await fetchCategories();
      handleCloseDialog();
      setSuccess(editingCategory ? 'Categoría actualizada correctamente' : 'Categoría creada correctamente');
    } catch (err: unknown) {
      console.error('Error saving category:', err);
      setError(err instanceof Error ? err.message : 'Error al guardar la categoría');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro que deseas eliminar esta categoría?')) return;
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.details || 'Error al eliminar la categoría');
      }
      await fetchCategories();
      setSuccess('Categoría eliminada correctamente');
    } catch (err: unknown) {
      console.error('Error deleting category:', err);
      setError(err instanceof Error ? err.message : 'Error al eliminar la categoría');
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
        <Typography variant="h4" color="text.primary">Categorías</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          Nueva Categoría
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Descripción</TableCell>
              <TableCell>Color</TableCell>
              <TableCell>Canales</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell>
                  <Typography variant="subtitle1" fontWeight="medium">
                    {category.name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {category.description || 'Sin descripción'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box
                      width={24}
                      height={24}
                      borderRadius="50%"
                      bgcolor={category.color || '#2196f3'}
                      border="1px solid"
                      borderColor="divider"
                    />
                    <Typography variant="body2" fontFamily="monospace">
                      {category.color || '#2196f3'}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label="0 canales"
                    size="small"
                    variant="outlined"
                    color="primary"
                  />
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpenDialog(category)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(category.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight:'bold', fontSize:'1.5rem' }}>
          {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
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
            <TextField
              label="Descripción"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />
            
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Color de la categoría
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                {COLOR_PRESETS.map((color) => (
                  <Box
                    key={color}
                    width={32}
                    height={32}
                    borderRadius="50%"
                    bgcolor={color}
                    border={formData.color === color ? '3px solid' : '1px solid'}
                    borderColor={formData.color === color ? 'primary.main' : 'divider'}
                    sx={{ cursor: 'pointer' }}
                    onClick={() => setFormData({ ...formData, color })}
                  />
                ))}
              </Box>
              
              <TextField
                label="Color personalizado"
                value={formData.color}
                onChange={e => setFormData({ ...formData, color: e.target.value })}
                fullWidth
                size="small"
                placeholder="#2196f3"
                InputProps={{
                  startAdornment: (
                    <Box
                      width={20}
                      height={20}
                      borderRadius="50%"
                      bgcolor={formData.color}
                      border="1px solid"
                      borderColor="divider"
                      mr={1}
                    />
                  ),
                }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p:2 }}>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingCategory ? 'Guardar' : 'Crear'}
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
