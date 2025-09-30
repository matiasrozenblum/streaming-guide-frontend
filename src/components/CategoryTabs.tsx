'use client';

import { useState, useEffect } from 'react';
import { Box, Button, Tabs, Tab } from '@mui/material';
import { Category } from '@/types/channel';

interface CategoryTabsProps {
  selectedCategory: Category | null;
  onCategoryChange: (category: Category | null) => void;
}

export default function CategoryTabs({ selectedCategory, onCategoryChange }: CategoryTabsProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

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
          justifyContent: 'center',
          py: 2,
          opacity: 0.7,
        }}
      >
        <Button variant="outlined" disabled>
          Cargando...
        </Button>
      </Box>
    );
  }

  // Create tab value based on selected category
  const currentValue = selectedCategory ? `category-${selectedCategory.id}` : 'all';

  return (
    <Box
      sx={{
        borderBottom: 1,
        borderColor: 'divider',
        backgroundColor: 'background.paper',
      }}
    >
      <Tabs
        value={currentValue}
        onChange={(event, newValue) => {
          if (newValue === 'all') {
            handleCategoryClick(null);
          } else {
            const categoryId = parseInt(newValue.replace('category-', ''));
            const category = categories.find(c => c.id === categoryId);
            if (category) {
              handleCategoryClick(category);
            }
          }
        }}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          minHeight: 48,
          '& .MuiTab-root': {
            minHeight: 48,
            textTransform: 'none',
            fontWeight: 500,
            fontSize: '0.875rem',
            px: 2,
          },
          '& .MuiTabs-indicator': {
            height: 3,
            borderRadius: '3px 3px 0 0',
          },
        }}
      >
        <Tab
          label="Todos"
          value="all"
          sx={{
            fontWeight: selectedCategory === null ? 600 : 500,
          }}
        />
        {categories.map((category) => (
          <Tab
            key={category.id}
            label={category.name}
            value={`category-${category.id}`}
            sx={{
              fontWeight: selectedCategory?.id === category.id ? 600 : 500,
            }}
          />
        ))}
      </Tabs>
    </Box>
  );
}
