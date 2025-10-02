'use client';

import { Box, Tabs, Tab } from '@mui/material';
import { Category } from '@/types/channel';
import { useLayoutValues } from '@/constants/layout';

interface CategoryTabsProps {
  selectedCategory: Category | null;
  onCategoryChange: (category: Category | null) => void;
  categories: Category[];
}

export default function CategoryTabs({ selectedCategory, onCategoryChange, categories }: CategoryTabsProps) {
  const { pixelsPerMinute, channelLabelWidth } = useLayoutValues();
  const tabWidth = pixelsPerMinute * 60; // Same width as each hour block (120px)
  
  const handleCategoryClick = (category: Category | null) => {
    onCategoryChange(category);
  };

  // Create tab value based on selected category
  const currentValue = selectedCategory ? `category-${selectedCategory.id}` : 'all';

  return (
    <Box
      sx={{
        borderBottom: 1,
        borderColor: 'divider',
        backgroundColor: 'background.paper',
        borderTopLeftRadius: '12px', // Round upper corners
        borderTopRightRadius: '12px',
        borderBottomLeftRadius: 0, // Straight bottom corners for seamless connection
        borderBottomRightRadius: 0,
        display: 'flex', // Make this a flex container
        width: '100%', // Full width
      }}
    >
      {/* Channel label spacer - matches the "Canal" column width */}
      <Box
        sx={{
          width: `${channelLabelWidth}px`,
          minWidth: `${channelLabelWidth}px`,
          maxWidth: `${channelLabelWidth}px`,
          borderRight: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'background.paper',
        }}
      >
        {/* Empty space to align with "Canal" column */}
      </Box>
      
      {/* Category tabs container */}
      <Box sx={{ flex: 1, overflowX: 'auto' }}>
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
            width: `${tabWidth}px`,
            minWidth: `${tabWidth}px`,
            maxWidth: `${tabWidth}px`,
            flex: 'none', // Prevent flex from changing the width
          },
          '& .MuiTabs-indicator': {
            height: 3,
            borderRadius: '3px 3px 0 0',
            backgroundColor: selectedCategory?.color || '#1976d2',
          },
        }}
      >
        <Tab
          label="Todos"
          value="all"
          sx={{
            fontWeight: selectedCategory === null ? 600 : 500,
            color: selectedCategory === null ? '#1976d2' : 'text.secondary',
            '&.Mui-selected': {
              color: '#1976d2',
            },
            '&:hover': {
              color: '#1976d2',
              backgroundColor: 'rgba(25, 118, 210, 0.04)',
            },
          }}
        />
        {categories.map((category) => (
          <Tab
            key={category.id}
            label={category.name}
            value={`category-${category.id}`}
            sx={{
              fontWeight: selectedCategory?.id === category.id ? 600 : 500,
              color: selectedCategory?.id === category.id 
                ? (category.color || '#1976d2') 
                : 'text.secondary',
              '&.Mui-selected': {
                color: category.color || '#1976d2',
              },
              '&:hover': {
                color: category.color || '#1976d2',
                backgroundColor: `${category.color || '#1976d2'}14`, // 14 is hex for ~8% opacity
              },
            }}
          />
        ))}
      </Tabs>
      </Box>
    </Box>
  );
}
