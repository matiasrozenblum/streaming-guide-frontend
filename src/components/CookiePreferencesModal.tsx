'use client';
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Switch,
  FormControlLabel,
  Box,
  Stack,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  Security as SecurityIcon,
  Analytics as AnalyticsIcon,
  Campaign as CampaignIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useCookieConsent, CookieConsentState } from '@/contexts/CookieConsentContext';

export function CookiePreferencesModal() {
  const theme = useTheme();
  // const { mode } = useThemeContext();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { showPreferences, closePreferences, savePreferences, consent } = useCookieConsent();

  const [preferences, setPreferences] = useState<CookieConsentState>({
    necessary: true,
    analytics: true,  // Default to enabled
    marketing: true,  // Default to enabled
    preferences: true, // Default to enabled
  });

  useEffect(() => {
    if (consent) {
      // If user has existing preferences, use those
      setPreferences(consent);
    }
    // If no consent exists yet, keep the default enabled state
  }, [consent]);

  const handleToggle = (type: keyof CookieConsentState) => {
    if (type === 'necessary') return; // Can't disable necessary cookies

    setPreferences(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const handleSave = () => {
    savePreferences(preferences);
  };

  const acceptAll = () => {
    const allAccepted: CookieConsentState = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
    };
    setPreferences(allAccepted);
    savePreferences(allAccepted);
  };

  const rejectAll = () => {
    const onlyNecessary: CookieConsentState = {
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
    };
    setPreferences(onlyNecessary);
    savePreferences(onlyNecessary);
  };

  const cookieCategories = [
    {
      key: 'necessary' as const,
      title: 'Cookies Necesarias',
      icon: <SecurityIcon />,
      description: 'Estas cookies son esenciales para el funcionamiento del sitio web y no se pueden deshabilitar.',
      details: 'Incluyen cookies de sesión, autenticación y preferencias básicas del sitio.',
      required: true,
    },
    {
      key: 'analytics' as const,
      title: 'Cookies de Análisis',
      icon: <AnalyticsIcon />,
      description: 'Nos ayudan a entender cómo los visitantes interactúan con el sitio web.',
      details: 'Google Analytics, PostHog y Microsoft Clarity para análisis de uso y rendimiento.',
      required: false,
    },
    {
      key: 'marketing' as const,
      title: 'Cookies de Marketing',
      icon: <CampaignIcon />,
      description: 'Se utilizan para mostrar anuncios relevantes y medir la efectividad de las campañas.',
      details: 'Google Tag Manager, Facebook Pixel y otras herramientas de marketing digital.',
      required: false,
    },
    {
      key: 'preferences' as const,
      title: 'Cookies de Preferencias',
      icon: <SettingsIcon />,
      description: 'Permiten recordar tus configuraciones y personalizar tu experiencia.',
      details: 'Tema, idioma, configuraciones de usuario y otras preferencias personales.',
      required: false,
    },
  ];

  return (
    <Dialog
      open={showPreferences}
      onClose={closePreferences}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 2,
          maxHeight: isMobile ? '100vh' : '90vh',
          backgroundColor: '#1e293b',
          color: '#ffffff',
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" component="h2" sx={{ color: '#ffffff' }}>
            🍪 Configuración de Cookies
          </Typography>
          <IconButton onClick={closePreferences} size="small" sx={{ color: '#ffffff' }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          py: 0,
          borderColor: '#374151',
        }}
      >
        <Typography variant="body2" sx={{ mb: 3, lineHeight: 1.6, color: 'rgba(255, 255, 255, 0.7)' }}>
          Gestiona tus preferencias de cookies. Puedes habilitar o deshabilitar diferentes tipos de cookies
          según tus necesidades. Ten en cuenta que deshabilitar algunas cookies puede afectar tu experiencia
          en el sitio.
        </Typography>

        <Stack spacing={1}>
          {cookieCategories.map((category, index) => (
            <Accordion
              key={category.key}
              defaultExpanded={index === 0}
              sx={{
                border: `1px solid #374151`,
                '&:before': { display: 'none' },
                borderRadius: 1,
                overflow: 'hidden',
                backgroundColor: '#374151',
                color: '#ffffff',
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ color: '#ffffff' }} />}
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.12)',
                  }
                }}
              >
                <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                  <Box display="flex" alignItems="center" gap={2}>
                    {React.cloneElement(category.icon, {
                      sx: { color: '#64b5f6' }
                    })}
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#ffffff' }}>
                        {category.title}
                        {category.required && (
                          <Typography
                            component="span"
                            variant="caption"
                            sx={{
                              ml: 1,
                              color: '#f44336',
                              fontSize: '0.7rem'
                            }}
                          >
                            (Requeridas)
                          </Typography>
                        )}
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                        {category.description}
                      </Typography>
                    </Box>
                  </Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={preferences[category.key]}
                        onChange={() => handleToggle(category.key)}
                        disabled={category.required}
                        size="small"
                      />
                    }
                    label=""
                    sx={{ mr: 1 }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 1, backgroundColor: '#374151' }}>
                <Typography variant="body2" sx={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                  {category.details}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Stack>

        <Box sx={{ mt: 3, p: 2, backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: 1 }}>
          <Typography variant="body2" sx={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.7)' }}>
            <strong style={{ color: '#ffffff' }}>Nota:</strong> Tus preferencias se guardarán indefinidamente. Puedes cambiar estas
            configuraciones en cualquier momento desde tu perfil o el footer del sitio.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={rejectAll} variant="outlined" size="small">
          Rechazar todo
        </Button>
        <Button onClick={acceptAll} variant="outlined" size="small">
          Aceptar todo
        </Button>
        <Button onClick={handleSave} variant="contained" size="small">
          Guardar preferencias
        </Button>
      </DialogActions>
    </Dialog>
  );
} 