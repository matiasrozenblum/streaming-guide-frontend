"use client";
import Header from '@/components/Header';
import { Box, Container, Typography } from '@mui/material';

export default function TerminosYCondiciones() {
  return (
    <>
      <Header />
      <Container maxWidth="sm" sx={{ mt: 4, mb: 8 }}>
        <Typography variant="h4" gutterBottom>
          Términos y Condiciones
        </Typography>
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>1. Descripción del servicio</Typography>
          <Typography paragraph>
            LA GUÍA DEL STREAMING es un sitio web que organiza y presenta la programación de contenidos de YouTube, destacando programas relevantes, populares o de interés general para el público argentino. A través de una grilla interactiva, los usuarios pueden acceder a programas pasados, en vivo o programados para el futuro mediante redirecciones a la plataforma de YouTube.
          </Typography>
          <Typography variant="h6" gutterBottom>2. Uso del sitio</Typography>
          <Typography paragraph>
            El uso del sitio debe ser legal y respetuoso. Queda prohibido:
          </Typography>
          <ul style={{ marginLeft: 24 }}>
            <li>Reproducir, copiar o distribuir el contenido del sitio sin autorización.</li>
            <li>Utilizar herramientas automáticas (bots) para acceder masivamente al sitio.</li>
            <li>Modificar o interferir con el funcionamiento de la plataforma.</li>
          </ul>
          <Typography variant="h6" gutterBottom>3. Propiedad intelectual</Typography>
          <Typography paragraph>
            El nombre, marca, diseño y organización del sitio LA GUÍA DEL STREAMING están protegidos por derechos de propiedad intelectual.<br />
            Los videos y transmisiones mostrados pertenecen a sus respectivos creadores y se accede a ellos a través de enlaces a YouTube.
          </Typography>
          <Typography variant="h6" gutterBottom>4. Limitación de responsabilidad</Typography>
          <Typography paragraph>
            El sitio no aloja contenido audiovisual propio. LA GUÍA DEL STREAMING no se responsabiliza por la disponibilidad, calidad o veracidad del contenido alojado en YouTube ni por modificaciones en la programación original.
          </Typography>
          <Typography variant="h6" gutterBottom>5. Modificaciones</Typography>
          <Typography paragraph>
            Nos reservamos el derecho de modificar estos términos en cualquier momento. Las actualizaciones serán publicadas en esta misma página.
          </Typography>
        </Box>
      </Container>
    </>
  );
} 