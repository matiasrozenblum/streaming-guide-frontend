'use client';

import { useState, useEffect } from 'react';
import { Box, Button } from '@mui/material';
import { Category } from '@/types/channel';
import { useThemeContext } from '@/contexts/ThemeContext';

interface CategoryTabsProps {
  selectedCategory: Category | null;
  onCategoryChange: (category: Category | null) => void;
}

export default function CategoryTabs({ selectedCategory, onCategoryChange }: CategoryTabsProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { mode } = useThemeContext();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      setCategories(data.sort((a: Category, b: Category) => (a.order || 0) - (b.order || 0)));
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (category: Category | null) => {
    onCategoryChange(category);
  };

  if (loading) {
    return (
      <Box
        display="flex"
        gap={1}
        py={1}
        alignItems="center"
        sx={{ opacity: 0.7 }}
      >
        <Button variant="outlined" disabled>
          Cargando...
        </Button>
      </Box>
    );
  }

  return (
    <Box
      display="flex"
      gap={1}
      py={1}
      alignItems="center"
      sx={{
        overflowX: 'auto',
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': {
          display: 'none',
        },
      }}
    >
      {/* "All" tab */}
      <Button
        variant={selectedCategory === null ? 'contained' : 'outlined'}
        onClick={() => handleCategoryClick(null)}
        sx={{
          minWidth: '80px',
          height: '36px',
          transition: 'background-color 0.3s ease, border 0.3s ease, color 0.3s ease, box-shadow 0.3s ease, transform 0.2s cubic-bezier(0.68, -0.55, 0.27, 1.55)',
          transform: selectedCategory === null ? 'scale(1.05)' : 'scale(1)',
          fontWeight: 'bold',
          textTransform: 'none',
          backgroundColor: selectedCategory === null 
            ? (mode === 'light' ? '#1976d2' : '#90caf9')
            : 'transparent',
          color: selectedCategory === null 
            ? (mode === 'light' ? 'white' : '#1976d2')
            : (mode === 'light' ? '#1976d2' : '#90caf9'),
          borderColor: mode === 'light' ? '#1976d2' : '#90caf9',
          '&:hover': {
            backgroundColor: selectedCategory === null 
              ? (mode === 'light' ? '#1565c0' : '#42a5f5')
              : (mode === 'light' ? 'rgba(25, 118, 210, 0.04)' : 'rgba(144, 202, 249, 0.08)'),
          },
        }}
      >
        Todos
      </Button>

      {/* Category tabs */}
      {categories.map((category) => (
        <Button
          key={category.id}
          variant={selectedCategory?.id === category.id ? 'contained' : 'outlined'}
          onClick={() => handleCategoryClick(category)}
          sx={{
            minWidth: '80px',
            height: '36px',
            transition: 'background-color 0.3s ease, border 0.3s ease, color 0.3s ease, box-shadow 0.3s ease, transform 0.2s cubic-bezier(0.68, -0.55, 0.27, 1.55)',
            transform: selectedCategory?.id === category.id ? 'scale(1.05)' : 'scale(1)',
            fontWeight: 'bold',
            textTransform: 'none',
            backgroundColor: selectedCategory?.id === category.id 
              ? (category.color || (mode === 'light' ? '#1976d2' : '#90caf9'))
              : 'transparent',
            color: selectedCategory?.id === category.id 
              ? 'white'
              : (category.color || (mode === 'light' ? '#1976d2' : '#90caf9')),
            borderColor: category.color || (mode === 'light' ? '#1976d2' : '#90caf9'),
            '&:hover': {
              backgroundColor: selectedCategory?.id === category.id 
                ? (category.color || (mode === 'light' ? '#1565c0' : '#42a5f5'))
                : (category.color ? `${category.color}20` : (mode === 'light' ? 'rgba(25, 118, 210, 0.04)' : 'rgba(144, 202, 249, 0.08)')),
            },
          }}
        >
          {category.name}
        </Button>
      ))}
    </Box>
  );
}
