'use client';
import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Stack,
  useTheme,
  useMediaQuery,
} from '@mui/material';

import { useCookieConsent } from '@/contexts/CookieConsentContext';
import { useThemeContext } from '@/contexts/ThemeContext';

export function CookieConsentBanner() {
  const theme = useTheme();
  const { mode } = useThemeContext();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { showBanner, showPreferences, acceptAll, openPreferences } = useCookieConsent();

  // Hide banner when preferences modal is open or when banner should not be shown
  if (!showBanner || showPreferences) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 20,
        left: '50%',
        transform: showBanner ? 'translate(-50%, 0)' : 'translate(-50%, 120%)',
        zIndex: 9999,
        transition: 'transform 0.3s ease-in-out',
        maxWidth: { xs: 'calc(100vw - 32px)', sm: '800px', md: '800px' },
        width: '100%',
      }}
    >
      <Paper
        elevation={12}
        sx={{
          p: { xs: 2, sm: 2.5 },
          borderRadius: 3,
          backgroundColor: mode === 'light' ? '#ffffff' : '#1e293b',
          border: `1px solid ${mode === 'light' ? '#e0e0e0' : '#374151'}`,
          backdropFilter: 'blur(10px)',
          boxShadow: mode === 'light' 
            ? '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            : '0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
        }}
      >
          <Stack 
            direction={isMobile ? 'column' : 'row'} 
            spacing={2} 
            alignItems={isMobile ? 'flex-start' : 'center'}
            justifyContent="space-between"
          >
            {/* Compact text section */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography 
                variant="body2" 
                                 sx={{ 
                   fontSize: { xs: '0.8rem', sm: '0.875rem' },
                   lineHeight: 1.4,
                   color: mode === 'light' ? '#000000' : '#ffffff',
                 }}
              >
                Usamos cookies para mejorar tu experiencia en La Guía.{' '}
                <br />
                Descubrí{' '}
                <Button
                  variant="text"
                  size="small"
                  sx={{ 
                    p: 0, 
                    minWidth: 'auto', 
                    textDecoration: 'underline',
                    fontSize: 'inherit',
                    lineHeight: 'inherit',
                    verticalAlign: 'baseline',
                    color: mode === 'light' ? '#1976d2' : '#64b5f6',
                    textTransform: 'none',
                    '&:hover': {
                      backgroundColor: 'transparent',
                      textDecoration: 'underline',
                    }
                  }}
                  onClick={() => window.open('/legal/politica-de-privacidad', '_blank')}
                >
                 más información
                </Button>
                .
              </Typography>
            </Box>

            {/* Compact buttons */}
            <Stack 
              direction={isMobile ? 'column' : 'row'} 
              spacing={1}
              sx={{ 
                flexShrink: 0,
                width: isMobile ? '100%' : 'auto'
              }}
            >
              <Button
                variant="text"
                size="small"
                onClick={openPreferences}
                sx={{ 
                  fontSize: '0.8rem',
                  p: { xs: '6px 12px', sm: '4px 8px' },
                  minWidth: 'auto',
                  color: mode === 'light' ? '#1976d2' : '#64b5f6',
                  '&:hover': {
                    backgroundColor: mode === 'light' ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.08)',
                  }
                }}
              >
                Configurar cookies
              </Button>
              
              <Button
                variant="contained"
                size="small"
                onClick={acceptAll}
                sx={{
                  fontSize: '0.8rem',
                  p: { xs: '6px 16px', sm: '4px 12px' },
                  minWidth: 'auto',
                  backgroundColor: mode === 'light' ? '#1976d2' : '#64b5f6',
                  color: '#ffffff',
                  '&:hover': {
                    backgroundColor: mode === 'light' ? '#1565c0' : '#42a5f5',
                  }
                }}
              >
                Aceptar cookies
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Box>
  );
} 