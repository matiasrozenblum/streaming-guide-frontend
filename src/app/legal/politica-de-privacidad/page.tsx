'use client';
import React from 'react';
import { Container, Typography, Box, Paper, Divider, useTheme } from '@mui/material';
import Header from '@/components/Header';
import { useThemeContext } from '@/contexts/ThemeContext';

export default function PrivacyPolicyPage() {
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
            <Typography variant="body2" component="ul" sx={{ pl: 2, mb: 2 }}>
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
              3. Uso de YouTube API Services
            </Typography>
            <Typography variant="body1" paragraph>
              <strong>Este sitio web utiliza YouTube API Services.</strong> Al usar nuestro sitio, usted también acepta las políticas de YouTube y Google.
            </Typography>
            <Typography variant="body2" paragraph>
              Para más información sobre cómo Google maneja sus datos, consulte la{' '}
              <a 
                href="http://www.google.com/policies/privacy" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ color: theme.palette.primary.main, textDecoration: 'underline' }}
              >
                Política de Privacidad de Google
              </a>
              .
            </Typography>
            
            <Typography variant="h6" component="h3" gutterBottom sx={{ mt: 2 }}>
              Datos de YouTube que Accedemos
            </Typography>
            <Typography variant="body2" paragraph>
              A través de YouTube API Services, accedemos únicamente a información pública como:
            </Typography>
            <Typography variant="body2" component="ul" sx={{ pl: 2, mb: 1 }}>
              <li>Información de canales de YouTube (nombres, IDs)</li>
              <li>Estado de transmisiones en vivo</li>
              <li>IDs de videos públicos</li>
              <li>Metadatos públicos de contenido</li>
            </Typography>
            <Typography variant="body2" paragraph>
              <strong>No accedemos ni almacenamos datos privados de cuentas de YouTube de usuarios.</strong>
            </Typography>

            <Typography variant="h6" component="h3" gutterBottom sx={{ mt: 2 }}>
              Revocación de Acceso
            </Typography>
            <Typography variant="body2" paragraph>
              Si desea revocar el acceso de aplicaciones a su cuenta de Google/YouTube, puede hacerlo en{' '}
              <a 
                href="https://security.google.com/settings/" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ color: theme.palette.primary.main, textDecoration: 'underline' }}
              >
                Google Security Settings
              </a>
              .
            </Typography>
          </section>

          <section>
            <Typography variant="h5" component="h2" gutterBottom>
              4. Otros Servicios de Terceros
            </Typography>
            <Typography variant="body1" paragraph>
              Además de YouTube API Services, utilizamos otros servicios de terceros:
            </Typography>
            <Typography variant="body2" component="ul" sx={{ pl: 2 }}>
              <li><strong>Google Analytics:</strong> Para análisis web</li>
              <li><strong>PostHog:</strong> Para análisis de producto</li>
              <li><strong>Microsoft Clarity:</strong> Para análisis de comportamiento</li>
              <li><strong>Hotjar:</strong> Para análisis de experiencia de usuario</li>
            </Typography>
            
            <Typography variant="h6" component="h3" gutterBottom sx={{ mt: 2 }}>
              Contenido y Publicidad de Terceros
            </Typography>
            <Typography variant="body2" paragraph>
              Nuestro sitio permite que terceros sirvan contenido, incluyendo:
            </Typography>
            <Typography variant="body2" component="ul" sx={{ pl: 2 }}>
              <li>Videos embebidos de YouTube (que pueden incluir publicidad)</li>
              <li>Contenido analítico de servicios de terceros</li>
              <li>Scripts de seguimiento y análisis</li>
            </Typography>
          </section>

          <section>
            <Typography variant="h5" component="h2" gutterBottom>
              5. Almacenamiento y Procesamiento de Datos
            </Typography>
            <Typography variant="body1" paragraph>
              Explicamos cómo utilizamos, procesamos y compartimos su información:
            </Typography>
            
            <Typography variant="h6" component="h3" gutterBottom sx={{ mt: 2 }}>
              Uso Interno
            </Typography>
            <Typography variant="body2" component="ul" sx={{ pl: 2 }}>
              <li>Mejorar la experiencia de usuario en nuestro sitio</li>
              <li>Analizar patrones de uso y preferencias</li>
              <li>Mantener y optimizar el funcionamiento del sitio</li>
              <li>Proporcionar recomendaciones personalizadas</li>
            </Typography>

            <Typography variant="h6" component="h3" gutterBottom sx={{ mt: 2 }}>
              Compartir con Terceros
            </Typography>
            <Typography variant="body2" paragraph>
              Compartimos información con terceros únicamente en las siguientes circunstancias:
            </Typography>
            <Typography variant="body2" component="ul" sx={{ pl: 2 }}>
              <li>Con servicios de análisis (Google Analytics, PostHog, Microsoft Clarity, Hotjar) para mejorar nuestro sitio</li>
              <li>Con YouTube/Google para el funcionamiento de contenido embebido</li>
              <li>Datos agregados y anónimos para análisis estadístico</li>
              <li>Cuando sea requerido por ley</li>
            </Typography>

            <Typography variant="h6" component="h3" gutterBottom sx={{ mt: 2 }}>
              Almacenamiento de Datos
            </Typography>
            <Typography variant="body2" paragraph>
              Sus datos se almacenan de forma segura y se conservan únicamente mientras sea necesario para los fines descritos o según requiera la ley.
            </Typography>
            
            <Typography variant="h6" component="h3" gutterBottom sx={{ mt: 2 }}>
              Eliminación de Datos
            </Typography>
            <Typography variant="body2" paragraph>
              Para solicitar la eliminación de sus datos almacenados, contáctenos usando la información proporcionada en la sección de contacto. Procesaremos su solicitud de acuerdo con la legislación aplicable.
            </Typography>
          </section>

          <section>
            <Typography variant="h5" component="h2" gutterBottom>
              6. Tus Derechos
            </Typography>
            <Typography variant="body1" paragraph>
              Tienes derecho a:
            </Typography>
            <Typography variant="body2" component="ul" sx={{ pl: 2, mb: 1 }}>
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
              7. Seguridad de los Datos
            </Typography>
            <Typography variant="body1" paragraph>
              Implementamos medidas de seguridad apropiadas para proteger tu información personal contra acceso no autorizado, alteración, divulgación o destrucción.
            </Typography>
          </section>

          <section>
            <Typography variant="h5" component="h2" gutterBottom>
              8. Información de Contacto
            </Typography>
            <Typography variant="body1" paragraph>
              Si tienes preguntas sobre esta política de privacidad, sobre el tratamiento de tus datos, o deseas ejercer tus derechos de privacidad, puedes contactarnos en:
            </Typography>
            <Typography variant="body2" paragraph>
              <strong>Email:</strong> laguiadelstreaming@gmail.com<br />
              <strong>Sitio web:</strong> https://laguiadelstreaming.com<br />
              <strong>Responsable:</strong> La Guía del Streaming
            </Typography>
            <Typography variant="body2" paragraph>
              Responderemos a tu consulta en un plazo razonable de acuerdo con la legislación aplicable.
            </Typography>
          </section>

          <section>
            <Typography variant="h5" component="h2" gutterBottom>
              9. Cambios en esta Política
            </Typography>
            <Typography variant="body1" paragraph>
              Podemos actualizar esta política de privacidad ocasionalmente. Te notificaremos sobre cambios significativos actualizando la fecha en la parte superior de esta página y, cuando sea apropiado, a través de otros medios de comunicación.
            </Typography>
            <Typography variant="body2" paragraph>
              Te recomendamos revisar esta política periódicamente para mantenerte informado sobre cómo protegemos tu información.
            </Typography>
          </section>
        </Box>
      </Paper>
    </Container>
    </Box>
  );
} 