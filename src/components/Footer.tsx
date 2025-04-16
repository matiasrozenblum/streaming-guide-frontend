import React from 'react';
import { Box, Typography } from '@mui/material';

const Footer: React.FC = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 2,
        px: 2,
        mt: 'auto',
        backgroundColor: 'background.paper',
        borderTop: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        align="center"
        sx={{
          fontSize: '0.65rem',
          lineHeight: 1.2,
          display: 'block',
          mb: 0.5,
        }}
      >
        © 2025 LA GUÍA DEL STREAMING. Todos los derechos reservados.
      </Typography>
      <Typography
        variant="caption"
        color="text.secondary"
        align="center"
        sx={{
          fontSize: '0.65rem',
          lineHeight: 1.2,
          display: 'block',
        }}
      >
        Este sitio no aloja contenido propio. Todos los videos son propiedad de sus respectivos creadores y se visualizan a través de YouTube.
      </Typography>
    </Box>
  );
};

export default Footer; 