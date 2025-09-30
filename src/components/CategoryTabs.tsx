'use client';

import { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
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
        sx={{
          display: 'flex',
          alignItems: 'flex-end',
          height: '40px',
          backgroundColor: mode === 'light' ? '#f1f3f4' : '#2d2d2d',
          borderBottom: `1px solid ${mode === 'light' ? '#dadce0' : '#3c4043'}`,
          opacity: 0.7,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            minWidth: '120px',
            height: '36px',
            paddingX: '16px',
            borderTopLeftRadius: '8px',
            borderTopRightRadius: '8px',
            borderBottom: `1px solid ${mode === 'light' ? '#dadce0' : '#3c4043'}`,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontWeight: 400,
              color: mode === 'light' ? '#3c4043' : '#e8eaed',
              fontSize: '13px',
            }}
          >
            Cargando...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-end',
        height: '40px',
        backgroundColor: mode === 'light' ? '#f1f3f4' : '#2d2d2d',
        borderBottom: `1px solid ${mode === 'light' ? '#dadce0' : '#3c4043'}`,
        overflowX: 'auto',
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': {
          display: 'none',
        },
      }}
    >
      {/* "All" tab */}
      <Box
        onClick={() => handleCategoryClick(null)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          minWidth: '120px',
          maxWidth: '200px',
          height: selectedCategory === null ? '40px' : '36px',
          paddingX: '16px',
          backgroundColor: selectedCategory === null 
            ? (mode === 'light' ? '#ffffff' : '#3c4043')
            : 'transparent',
          borderTopLeftRadius: '8px',
          borderTopRightRadius: '8px',
          border: selectedCategory === null 
            ? `1px solid ${mode === 'light' ? '#dadce0' : '#3c4043'}`
            : 'none',
          borderBottom: selectedCategory === null 
            ? 'none'
            : `1px solid ${mode === 'light' ? '#dadce0' : '#3c4043'}`,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          position: 'relative',
          zIndex: selectedCategory === null ? 2 : 1,
          '&:hover': {
            backgroundColor: selectedCategory === null 
              ? (mode === 'light' ? '#ffffff' : '#3c4043')
              : (mode === 'light' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)'),
            height: '38px',
          },
        }}
      >
        <Typography
          variant="body2"
          sx={{
            fontWeight: selectedCategory === null ? 500 : 400,
            color: mode === 'light' ? '#3c4043' : '#e8eaed',
            fontSize: '13px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          Todos
        </Typography>
      </Box>

      {/* Category tabs */}
      {categories.map((category) => (
        <Box
          key={category.id}
          onClick={() => handleCategoryClick(category)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            minWidth: '120px',
            maxWidth: '200px',
            height: selectedCategory?.id === category.id ? '40px' : '36px',
            paddingX: '16px',
            backgroundColor: selectedCategory?.id === category.id 
              ? (mode === 'light' ? '#ffffff' : '#3c4043')
              : 'transparent',
            borderTopLeftRadius: '8px',
            borderTopRightRadius: '8px',
            border: selectedCategory?.id === category.id 
              ? `1px solid ${mode === 'light' ? '#dadce0' : '#3c4043'}`
              : 'none',
            borderBottom: selectedCategory?.id === category.id 
              ? 'none'
              : `1px solid ${mode === 'light' ? '#dadce0' : '#3c4043'}`,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            position: 'relative',
            zIndex: selectedCategory?.id === category.id ? 2 : 1,
            '&:hover': {
              backgroundColor: selectedCategory?.id === category.id 
                ? (mode === 'light' ? '#ffffff' : '#3c4043')
                : (mode === 'light' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)'),
              height: '38px',
            },
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontWeight: selectedCategory?.id === category.id ? 500 : 400,
              color: mode === 'light' ? '#3c4043' : '#e8eaed',
              fontSize: '13px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {category.name}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
