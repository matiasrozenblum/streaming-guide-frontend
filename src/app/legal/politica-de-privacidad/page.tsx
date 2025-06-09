import React from 'react';
import { Container, Typography, Box, Paper, Divider } from '@mui/material';

export const metadata = {
  title: 'Política de Privacidad - La Guía del Streaming',
  description: 'Política de privacidad y uso de cookies de La Guía del Streaming',
};

export default function PrivacyPolicyPage() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={1} sx={{ p: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          Política de Privacidad
        </Typography>
        
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 4 }}>
          Última actualización: {new Date().toLocaleDateString('es-ES')}
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ '& > *': { mb: 3 } }}>
          <section>
            <Typography variant="h5" component="h2" gutterBottom>
              1. Información que Recopilamos
            </Typography>
            <Typography variant="body1" paragraph>
              En La Guía del Streaming recopilamos información para mejorar tu experiencia en nuestro sitio web:
            </Typography>
            <Typography variant="body2" component="ul" sx={{ pl: 2 }}>
              <li>Información de uso del sitio web (páginas visitadas, tiempo de permanencia)</li>
              <li>Datos técnicos (tipo de navegador, dispositivo, dirección IP)</li>
              <li>Preferencias de usuario (configuraciones, suscripciones)</li>
              <li>Datos de interacción (clics, reproducciones de video)</li>
            </Typography>
          </section>

          <section>
            <Typography variant="h5" component="h2" gutterBottom>
              2. Uso de Cookies
            </Typography>
            <Typography variant="body1" paragraph>
              Utilizamos diferentes tipos de cookies para mejorar tu experiencia:
            </Typography>
            
            <Typography variant="h6" component="h3" gutterBottom sx={{ mt: 2 }}>
              Cookies Necesarias
            </Typography>
            <Typography variant="body2" paragraph>
              Esenciales para el funcionamiento del sitio. Incluyen cookies de sesión, autenticación y preferencias básicas.
            </Typography>

            <Typography variant="h6" component="h3" gutterBottom>
              Cookies de Análisis
            </Typography>
            <Typography variant="body2" paragraph>
              Nos ayudan a entender cómo interactúas con nuestro sitio web. Utilizamos:
            </Typography>
            <Typography variant="body2" component="ul" sx={{ pl: 2 }}>
              <li><strong>Google Analytics:</strong> Análisis de tráfico y comportamiento de usuarios</li>
              <li><strong>PostHog:</strong> Análisis de producto y experiencia de usuario</li>
              <li><strong>Microsoft Clarity:</strong> Mapas de calor y grabaciones de sesión</li>
            </Typography>

            <Typography variant="h6" component="h3" gutterBottom>
              Cookies de Marketing
            </Typography>
            <Typography variant="body2" paragraph>
              Se utilizan para mostrar contenido relevante y medir la efectividad. Incluye Google Tag Manager y herramientas similares.
            </Typography>

            <Typography variant="h6" component="h3" gutterBottom>
              Cookies de Preferencias
            </Typography>
            <Typography variant="body2" paragraph>
              Permiten recordar tus configuraciones como tema, idioma y otras preferencias personales.
            </Typography>
          </section>

          <section>
            <Typography variant="h5" component="h2" gutterBottom>
              3. Servicios de Terceros
            </Typography>
            <Typography variant="body1" paragraph>
              Utilizamos servicios de terceros que pueden recopilar información:
            </Typography>
            <Typography variant="body2" component="ul" sx={{ pl: 2 }}>
              <li><strong>YouTube:</strong> Para mostrar contenido de video (sujeto a las políticas de Google/YouTube)</li>
              <li><strong>Google Analytics:</strong> Para análisis web</li>
              <li><strong>PostHog:</strong> Para análisis de producto</li>
              <li><strong>Microsoft Clarity:</strong> Para análisis de comportamiento</li>
              <li><strong>Hotjar:</strong> Para análisis de experiencia de usuario</li>
            </Typography>
          </section>

          <section>
            <Typography variant="h5" component="h2" gutterBottom>
              4. Tus Derechos
            </Typography>
            <Typography variant="body1" paragraph>
              Tienes derecho a:
            </Typography>
            <Typography variant="body2" component="ul" sx={{ pl: 2 }}>
              <li>Configurar tus preferencias de cookies en cualquier momento</li>
              <li>Solicitar información sobre los datos que tenemos sobre ti</li>
              <li>Solicitar la eliminación de tus datos</li>
              <li>Retirar tu consentimiento en cualquier momento</li>
            </Typography>
            <Typography variant="body2" paragraph>
              Puedes gestionar tus preferencias de cookies desde el footer del sitio o contactándonos directamente.
            </Typography>
          </section>

          <section>
            <Typography variant="h5" component="h2" gutterBottom>
              5. Seguridad de los Datos
            </Typography>
            <Typography variant="body1" paragraph>
              Implementamos medidas de seguridad apropiadas para proteger tu información personal contra acceso no autorizado, alteración, divulgación o destrucción.
            </Typography>
          </section>

          <section>
            <Typography variant="h5" component="h2" gutterBottom>
              6. Contacto
            </Typography>
            <Typography variant="body1" paragraph>
              Si tienes preguntas sobre esta política de privacidad o sobre el tratamiento de tus datos, puedes contactarnos en:
            </Typography>
            <Typography variant="body2">
              Email: laguiadelstreaming@gmail.com
            </Typography>
          </section>

          <section>
            <Typography variant="h5" component="h2" gutterBottom>
              7. Cambios en esta Política
            </Typography>
            <Typography variant="body1" paragraph>
              Podemos actualizar esta política de privacidad ocasionalmente. Te notificaremos sobre cambios significativos actualizando la fecha en la parte superior de esta página.
            </Typography>
          </section>
        </Box>
      </Paper>
    </Container>
  );
} 