'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Autocomplete,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField as DialogTextField,
  Typography,
  CircularProgress,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { Category } from '@/types/channel';

interface CategorySelectorProps {
  selectedCategories: Category[];
  onCategoriesChange: (categories: Category[]) => void;
}

export default function CategorySelector({ selectedCategories, onCategoriesChange }: CategorySelectorProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('');
  const [creating, setCreating] = useState(false);

  // Fetch all categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchCategories = async (search: string) => {
    if (!search.trim()) {
      setCategories([]);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/categories/search?q=${encodeURIComponent(search)}`);
      if (!response.ok) throw new Error('Failed to search categories');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error searching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (event: React.SyntheticEvent, value: string) => {
    setSearchTerm(value);
    if (value.trim()) {
      searchCategories(value);
    } else {
      fetchCategories();
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      setCreating(true);
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          description: newCategoryDescription.trim() || undefined,
          color: newCategoryColor.trim() || undefined,
        }),
      });

      if (!response.ok) throw new Error('Failed to create category');

      const newCategory = await response.json();
      
      // Add to local categories list
      setCategories(prev => [...prev, newCategory]);
      
      // Add to selected categories
      onCategoriesChange([...selectedCategories, newCategory]);
      
      // Reset form and close dialog
      setNewCategoryName('');
      setNewCategoryDescription('');
      setNewCategoryColor('');
      setOpenCreateDialog(false);
    } catch (error) {
      console.error('Error creating category:', error);
      alert('Error al crear la categoría');
    } finally {
      setCreating(false);
    }
  };

  const handleCategorySelect = (event: React.SyntheticEvent, value: Category | null) => {
    if (value && !selectedCategories.find(cat => cat.id === value.id)) {
      onCategoriesChange([...selectedCategories, value]);
    }
    setSearchTerm('');
  };

  const handleCategoryRemove = (categoryToRemove: Category) => {
    onCategoriesChange(selectedCategories.filter(cat => cat.id !== categoryToRemove.id));
  };

  const filteredCategories = categories.filter(cat => 
    !selectedCategories.find(selected => selected.id === cat.id)
  );

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Categorías
      </Typography>
      
      {/* Selected categories as chips */}
      <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {selectedCategories.map((category) => (
          <Chip
            key={category.id}
            label={category.name}
            onDelete={() => handleCategoryRemove(category)}
            color="primary"
            variant="outlined"
            sx={{
              backgroundColor: category.color ? `${category.color}20` : undefined,
              borderColor: category.color || undefined,
            }}
          />
        ))}
      </Box>

      {/* Search and select categories */}
      <Autocomplete
        options={filteredCategories}
        getOptionLabel={(option) => option.name}
        value={null}
        onChange={handleCategorySelect}
        inputValue={searchTerm}
        onInputChange={handleSearchChange}
        loading={loading}
        loadingText="Cargando categorías..."
        noOptionsText={
          searchTerm.trim() ? (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                No se encontraron categorías
              </Typography>
              <Button
                startIcon={<AddIcon />}
                onClick={() => setOpenCreateDialog(true)}
                variant="outlined"
                size="small"
              >
                Crear &quot;{searchTerm}&quot;
              </Button>
            </Box>
          ) : (
            'No hay categorías disponibles'
          )
        }
        renderInput={(params) => (
          <TextField
            {...params}
            label="Buscar categorías"
            placeholder="Escribe para buscar o crear una categoría"
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
      />

      {/* Create category button (always visible) */}
      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Button
          startIcon={<AddIcon />}
          onClick={() => setOpenCreateDialog(true)}
          variant="outlined"
          size="small"
        >
          Crear nueva categoría
        </Button>
      </Box>

      {/* Create category dialog */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Crear Nueva Categoría</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <DialogTextField
              label="Nombre de la categoría"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              fullWidth
              required
              placeholder="Ej: Deportes, Noticias, Chimentos..."
            />
            <DialogTextField
              label="Descripción (opcional)"
              value={newCategoryDescription}
              onChange={(e) => setNewCategoryDescription(e.target.value)}
              fullWidth
              multiline
              rows={2}
            />
            <DialogTextField
              label="Color (opcional)"
              value={newCategoryColor}
              onChange={(e) => setNewCategoryColor(e.target.value)}
              fullWidth
              placeholder="#FF6B6B"
              helperText="Color hexadecimal para la categoría"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>Cancelar</Button>
          <Button 
            onClick={handleCreateCategory} 
            variant="contained" 
            disabled={!newCategoryName.trim() || creating}
          >
            {creating ? 'Creando...' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
