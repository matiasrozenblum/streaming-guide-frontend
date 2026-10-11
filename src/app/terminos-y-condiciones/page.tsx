"use client";
import Header from "@/components/Header";
import { Box, Container, Typography, Paper, Divider } from "@mui/material";
import { useTheme } from "@mui/material";
import { LEGAL_LAST_UPDATED } from "@/constants/legal";

export default function TerminosYCondiciones() {
  const theme = useTheme();
  return (
    <Box
      sx={{
        minHeight: "100dvh",
        background: "linear-gradient(135deg,#0f172a 0%,#1e293b 100%)",
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
            backgroundColor: "rgba(30, 41, 59, 0.9)",
            backdropFilter: "blur(8px)",
          }}
        >
          <Typography variant="h3" component="h1" gutterBottom align="center">
            Términos y Condiciones
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            sx={{ mb: 4 }}
          >
            Última actualización: {LEGAL_LAST_UPDATED}
          </Typography>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ "& > *": { mb: 3 } }}>
            <Typography variant="h6" gutterBottom>
              1. Descripción del servicio
            </Typography>
            <Typography paragraph>
              <strong>LA GUÍA DEL STREAMING</strong> es una plataforma web y
              móvil que organiza y presenta la programación de contenidos de
              plataformas de terceros (como{" "}
              <strong>YouTube, Twitch y Kick</strong>), destacando programas
              relevantes, transmisiones especiales, coberturas deportivas y
              creadores de interés general. A través de una grilla interactiva,
              los usuarios acceden a contenidos pasados, en vivo o programados
              mediante redirecciones o reproductores embebidos (embedded
              players) oficiales provistos por dichas plataformas.
            </Typography>

            <Typography variant="h6" gutterBottom>
              2. Requisitos de edad y registro de usuarios
            </Typography>
            <Typography paragraph>
              El registro y la creación de una cuenta en LA GUÍA DEL STREAMING
              están reservados{" "}
              <strong>exclusivamente para personas mayores de 18 años</strong>.
              Al registrarse, el usuario declara bajo juramento contar con la
              mayoría de edad legal para contratar y aceptar estos Términos. LA
              GUÍA DEL STREAMING se reserva el derecho de dar de baja cualquier
              cuenta si toma conocimiento fehaciente de que pertenece a un menor
              de edad.
            </Typography>

            <Typography variant="h6" gutterBottom>
              3. Uso del servicio y conducta del usuario
            </Typography>
            <Typography paragraph>
              Al utilizar este servicio, el usuario acepta quedar sujeto a los{" "}
              <strong>Términos de Servicio de YouTube, Twitch y Kick</strong>{" "}
              (según corresponda a la transmisión visualizada). El acceso y
              navegación deben realizarse de forma legal y de buena fe.{" "}
              <strong>Queda estrictamente prohibido:</strong>
            </Typography>
            <ul style={{ marginLeft: 24, marginBottom: 16 }}>
              <li>
                Reproducir, copiar, descargar, extraer de manera automatizada
                (scraping) o distribuir la arquitectura de información, diseño o
                base de datos de la plataforma sin autorización previa y por
                escrito.
              </li>
              <li>
                Utilizar herramientas automatizadas (bots o scripts) para
                acceder masivamente al sitio o extraer información de la grilla.
              </li>
              <li>
                Modificar, interferir o eludir las funcionalidades de los
                reproductores originales de video (incluyendo sistemas de
                publicidad, contadores de métricas o controles de reproducción).
              </li>
            </ul>

            <Typography variant="h6" gutterBottom>
              4. Notificaciones push y alertas
            </Typography>
            <Typography paragraph>
              La plataforma ofrece un sistema voluntario de alertas y
              notificaciones push para avisar el inicio de transmisiones,
              programas seleccionados o eventos especiales. La activación de
              estas alertas requiere la autorización explícita del usuario en su
              navegador o sistema operativo móvil. El usuario puede deshabilitar
              estas notificaciones en cualquier momento desde la configuración
              de su dispositivo o del navegador.
            </Typography>

            <Typography variant="h6" gutterBottom>
              5. Funcionalidad &quot;Mi Resumen&quot; y contenido generado
            </Typography>
            <Typography paragraph>
              LA GUÍA DEL STREAMING pone a disposición de los usuarios
              registrados herramientas interactivas destinadas a reflejar
              hábitos y resúmenes periódicos de consumo (&quot;Mi Resumen&quot;,
              balances semanales o balances anuales). Las piezas gráficas
              generadas por el sistema tienen fines informativos y de
              entretenimiento. Al descargar o compartir estas imágenes en redes
              sociales o canales de mensajería de terceros, el usuario decide de
              manera voluntaria y exclusiva hacer públicos sus hábitos de
              visualización e interacción.
            </Typography>

            <Typography variant="h6" gutterBottom>
              6. Propiedad intelectual y uso de marcas de terceros
            </Typography>
            <Typography paragraph>
              El nombre comercial, marca registrada, diseño gráfico, logotipos y
              organización integral de LA GUÍA DEL STREAMING se encuentran
              protegidos por las leyes de propiedad intelectual e industrial
              vigentes en la República Argentina.
            </Typography>
            <Typography paragraph>
              Las marcas, logotipos, nombres comerciales y material audiovisual
              de canales, transmisiones o creadores de contenido pertenecen a
              sus respectivos titulares. LA GUÍA DEL STREAMING no reclama
              derecho alguno sobre dicho material, operando como un directorio
              facilitador de acceso. La inclusión eventual de logotipos de
              terceros en piezas de comunicación, rankings o placas informativas
              difundidas en redes sociales se realiza con fines estrictamente
              descriptivos, informativos y de identificación del contenido
              cultural y de entretenimiento para la audiencia.
            </Typography>

            <Typography variant="h6" gutterBottom>
              7. Limitación de responsabilidad
            </Typography>
            <Typography paragraph>
              La plataforma no aloja, retransmite ni almacena transmisiones o
              contenidos audiovisuales propios en sus servidores. En
              consecuencia,{" "}
              <strong>
                LA GUÍA DEL STREAMING no asume responsabilidad por:
              </strong>
            </Typography>
            <ul style={{ marginLeft: 24, marginBottom: 16 }}>
              <li>
                La disponibilidad, interrupciones, calidad o veracidad de las
                emisiones alojadas en plataformas externas.
              </li>
              <li>
                Las opiniones, manifestaciones o conductas emitidas por los
                conductores o streamers en sus transmisiones.
              </li>
              <li>
                Modificaciones de último momento, retrasos o cancelaciones en la
                programación de los canales.
              </li>
              <li>
                Fallas técnicas, caídas de servicio o incompatibilidades
                operativas de las APIs o reproductores de plataformas terceras.
              </li>
            </ul>

            <Typography variant="h6" gutterBottom>
              8. Protección de derechos y baja de contenidos
            </Typography>
            <Typography paragraph>
              Si un titular de derechos o creador de contenido desea que su
              canal o enlace sea retirado del directorio, puede solicitarlo
              enviando un correo a <strong>hola@laguiadelstreaming.com</strong>.
              El enlace o reproductor embebido será desvinculado en un plazo
              máximo de <strong>72 horas hábiles</strong>.
            </Typography>

            <Typography variant="h6" gutterBottom>
              9. Modificaciones a los términos
            </Typography>
            <Typography paragraph>
              Nos reservamos la facultad de modificar o actualizar estos
              Términos y Condiciones en cualquier momento. Las versiones
              actualizadas entrarán en vigencia desde el momento de su
              publicación en el sitio web y la app móvil.
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
