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
import { Settings as SettingsIcon } from '@mui/icons-material';
import { useCookieConsent } from '@/contexts/CookieConsentContext';

export function CookieConsentBanner() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { showBanner, acceptAll, rejectAll, openPreferences } = useCookieConsent();

  if (!showBanner) return null;

  return (
    <Slide direction="up" in={showBanner} mountOnEnter unmountOnExit>
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          p: isMobile ? 2 : 3,
        }}
      >
        <Paper
          elevation={8}
          sx={{
            p: isMobile ? 2 : 3,
            borderRadius: 2,
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            backdropFilter: 'blur(10px)',
            maxWidth: '100%',
          }}
        >
          <Stack spacing={2}>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
              <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
                🍪 Configuración de cookies
              </Typography>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
              Utilizamos cookies para mejorar tu experiencia, analizar el tráfico del sitio y personalizar el contenido. 
              Puedes elegir qué tipos de cookies aceptar. Para más información, consulta nuestra{' '}
              <Button
                variant="text"
                size="small"
                sx={{ 
                  p: 0, 
                  minWidth: 'auto', 
                  textDecoration: 'underline',
                  fontSize: 'inherit',
                  lineHeight: 'inherit',
                  verticalAlign: 'baseline'
                }}
                onClick={() => window.open('/legal/politica-de-privacidad', '_blank')}
              >
                política de privacidad
              </Button>
              .
            </Typography>

            <Stack 
              direction={isMobile ? 'column' : 'row'} 
              spacing={1} 
              justifyContent="flex-end"
              alignItems={isMobile ? 'stretch' : 'center'}
            >
              <Button
                variant="outlined"
                size="small"
                startIcon={<SettingsIcon />}
                onClick={openPreferences}
                sx={{ 
                  borderColor: theme.palette.divider,
                  color: theme.palette.text.secondary,
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                    backgroundColor: theme.palette.action.hover,
                  }
                }}
              >
                Configurar
              </Button>
              
              <Button
                variant="outlined"
                size="small"
                onClick={rejectAll}
                sx={{ 
                  borderColor: theme.palette.divider,
                  color: theme.palette.text.secondary,
                  '&:hover': {
                    borderColor: theme.palette.error.main,
                    backgroundColor: theme.palette.error.main + '10',
                  }
                }}
              >
                Rechazar todo
              </Button>
              
              <Button
                variant="contained"
                size="small"
                onClick={acceptAll}
                sx={{
                  backgroundColor: theme.palette.primary.main,
                  '&:hover': {
                    backgroundColor: theme.palette.primary.dark,
                  }
                }}
              >
                Aceptar todo
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Box>
    </Slide>
  );
} 