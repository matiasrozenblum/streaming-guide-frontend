"use client";
import Header from '@/components/Header';
import { Box, Container, Typography, Paper, Divider } from '@mui/material';
import { useThemeContext } from '@/contexts/ThemeContext';
import { useTheme } from '@mui/material';

export default function TerminosYCondiciones() {
  const { mode } = useThemeContext();
  const theme = useTheme();
  return (
    <Box
      sx={{
        minHeight: '100dvh',
        background: mode === 'light'
          ? 'linear-gradient(135deg,#f8fafc 0%,#e2e8f0 100%)'
          : 'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)',
        py: { xs: 1, sm: 2 },
        color: theme.palette.text.primary,
      }}
    >
      <Header />
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper
          elevation={1}
          sx={{
            p: 4,
            backgroundColor: mode === 'light' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(30, 41, 59, 0.9)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <Typography variant="h3" component="h1" gutterBottom align="center">
            Términos y Condiciones
          </Typography>

          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 4 }}>
            Última actualización: 10/06/2025
          </Typography>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ '& > *': { mb: 3 } }}>
            <Typography variant="h6" gutterBottom>1. Descripción del servicio</Typography>
            <Typography paragraph>
              <strong>LA GUÍA DEL STREAMING</strong> es un sitio web que organiza y presenta la programación de contenidos de plataformas de terceros (como <strong>YouTube, Twitch y Kick</strong>), destacando programas relevantes, populares o de interés general. A través de una grilla interactiva, los usuarios pueden acceder a contenidos pasados, en vivo o programados mediante redirecciones o reproductores embebidos (embedded players) oficiales de dichas plataformas.
            </Typography>

            <Typography variant="h6" gutterBottom>2. Uso del sitio</Typography>
            <Typography paragraph>
              Al utilizar este sitio web, usted acepta estar sujeto a los <strong>Términos de Servicio de YouTube, Twitch y Kick</strong> (según corresponda al contenido visualizado). El uso del sitio debe ser legal y respetuoso. <strong>Queda prohibido:</strong>
            </Typography>
            <ul style={{ marginLeft: 24, marginBottom: 16 }}>
              <li>Reproducir, copiar o distribuir el contenido del diseño y organización del sitio sin autorización.</li>
              <li>Utilizar herramientas automáticas (bots) para acceder masivamente al sitio.</li>
              <li>Modificar, interferir o intentar eludir las funcionalidades de los reproductores originales (como publicidad o métricas de visualización).</li>
            </ul>

            <Typography variant="h6" gutterBottom>3. Propiedad intelectual</Typography>
            <Typography paragraph>
              El nombre, marca, diseño y organización del sitio <strong>LA GUÍA DEL STREAMING</strong> están protegidos por derechos de propiedad intelectual. Los videos, transmisiones y logos mostrados pertenecen a sus respectivos creadores y plataformas. LA GUÍA DEL STREAMING no reclama derechos sobre el contenido audiovisual, actuando únicamente como un directorio facilitador de acceso a través de las herramientas tecnológicas proporcionadas por las plataformas de origen.
            </Typography>

            <Typography variant="h6" gutterBottom>4. Limitación de responsabilidad</Typography>
            <Typography paragraph>
              El sitio no aloja, retransmite ni almacena contenido audiovisual propio en sus servidores. <strong>LA GUÍA DEL STREAMING no se responsabiliza por:</strong>
            </Typography>
            <ul style={{ marginLeft: 24, marginBottom: 16 }}>
              <li>La disponibilidad, calidad o veracidad del contenido alojado en plataformas externas.</li>
              <li>Las opiniones, acciones o lenguaje utilizado por los streamers en sus transmisiones en vivo.</li>
              <li>Modificaciones de último momento en la programación original de los canales.</li>
              <li>Cualquier falla técnica en los reproductores de Twitch, Kick o YouTube.</li>
            </ul>

            <Typography variant="h6" gutterBottom>5. Protección de Derechos de Autor</Typography>
            <Typography paragraph>
              Si usted es un creador de contenido y desea que su canal sea removido de nuestra guía, puede solicitarlo enviando un correo a <strong>hola@laguiadelstreaming.com</strong>. Procederemos a la baja del enlace o embebido en un plazo de <strong>72 horas hábiles</strong>.
            </Typography>

            <Typography variant="h6" gutterBottom>6. Modificaciones</Typography>
            <Typography paragraph>
              Nos reservamos el derecho de modificar estos términos en cualquier momento. Las actualizaciones serán publicadas en esta misma página.
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
} 