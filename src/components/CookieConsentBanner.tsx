'use client';
import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Stack,
  Slide,
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
    <Slide direction="up" in={showBanner} mountOnEnter unmountOnExit>
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          p: { xs: 1, sm: 2 },
        }}
      >
        <Paper
          elevation={8}
          sx={{
            p: { xs: 1.5, sm: 2 },
            borderRadius: 1,
            backgroundColor: mode === 'light' ? '#ffffff' : '#1e293b',
            border: `1px solid ${mode === 'light' ? '#e0e0e0' : '#374151'}`,
            backdropFilter: 'blur(10px)',
            maxWidth: '100%',
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
                Usamos cookies para mejorar tu experiencia en La Guía del Streaming. Consultar más en nuestro{' '}
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
                    '&:hover': {
                      backgroundColor: 'transparent',
                      textDecoration: 'underline',
                    }
                  }}
                  onClick={() => window.open('/legal/politica-de-privacidad', '_blank')}
                >
                  Centro de Privacidad
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
    </Slide>
  );
} 