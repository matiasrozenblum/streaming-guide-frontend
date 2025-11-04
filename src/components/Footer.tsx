'use client';
import React from 'react';
import { Box, Typography, IconButton, Button } from '@mui/material';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import { useCookieConsent } from '@/contexts/CookieConsentContext';

const Footer: React.FC = () => {
  const email = 'hola@laguiadelstreaming.com';
  const { openPreferences } = useCookieConsent();

  return (
    <Box
      component="footer"
      sx={{
        position: 'relative',
        py: 2,
        px: 2,
        mt: 'auto',
        backgroundColor: 'background.paper',
        borderTop: '1px solid',
        borderColor: 'divider',
      }}
    >
      {/* Textos centrados */}
      <Typography
        variant="caption"
        color="text.secondary"
        align="center"
        sx={{ fontSize: '0.5rem', lineHeight: 1.2, display: 'block', mb: 0.5 }}
      >
        © 2025 LA GUÍA DEL STREAMING. Todos los derechos reservados. -{' '}
        <a
          href="/terminos-y-condiciones"
          target="_blank"
          style={{ color: 'inherit', textDecoration: 'underline' }}
        >
          Términos y Condiciones
        </a>
        {' '}-{' '}
        <a
          href="/legal/politica-de-privacidad"
          target="_blank"
          style={{ color: 'inherit', textDecoration: 'underline' }}
        >
          Política de Privacidad
        </a>
        {' '}-{' '}
        <Button
          variant="text"
          size="small"
          onClick={openPreferences}
          sx={{ 
            p: 0, 
            minWidth: 'auto', 
            textDecoration: 'underline',
            fontSize: '0.5rem',
            lineHeight: 1.2,
            color: 'inherit',
            verticalAlign: 'baseline',
            '&:hover': {
              backgroundColor: 'transparent',
              textDecoration: 'underline',
            }
          }}
        >
          Configurar Cookies
        </Button>
      </Typography>
      <Typography
        variant="caption"
        color="text.secondary"
        align="center"
        sx={{ fontSize: '0.5rem', lineHeight: 1.2, display: 'block', mb: 0.5 }}
      >
        Al usar este sitio, aceptas los{' '}
        <a
          href="https://www.youtube.com/t/terms"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'inherit', textDecoration: 'underline' }}
        >
          Términos de Servicio de YouTube
        </a>
        . Utilizamos YouTube API Services.
      </Typography>
      <Typography
        variant="caption"
        color="text.secondary"
        align="center"
        sx={{ fontSize: '0.5rem', lineHeight: 1.2, display: 'block' }}
      >
        Este sitio no aloja contenido propio. Todos los videos son propiedad de sus respectivos creadores y se visualizan a través de YouTube.
      </Typography>

      {/* Botón de mail SOLO en web (sm+) */}
      <IconButton
        component="a"
        href={`mailto:${email}`}
        aria-label="Enviar correo"
        sx={{
          display: { xs: 'none', sm: 'inline-flex' }, // <-- oculto en mobile
          position: 'absolute',
          top: '50%',
          right: 8,
          transform: 'translateY(-50%)',
          color: 'text.secondary',
          '&:hover': { color: 'primary.main' },
        }}
      >
        <MailOutlineIcon />
      </IconButton>
    </Box>
  );
};

export default Footer;
