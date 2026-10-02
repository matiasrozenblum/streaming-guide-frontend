"use client";
import React from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Divider,
  useTheme,
} from "@mui/material";
import Header from "@/components/Header";
import { LEGAL_LAST_UPDATED } from "@/constants/legal";

export default function PrivacyPolicyPage() {
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
            Política de Privacidad
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
            <Typography paragraph>
              En LA GUÍA DEL STREAMING nos comprometemos a tratar tus datos con
              transparencia y de acuerdo con la{" "}
              <strong>
                Ley N° 25.326 de Protección de los Datos Personales
              </strong>{" "}
              de la República Argentina. Esta política detalla qué información
              recolectamos, cómo la utilizamos, bajo qué plazos la conservamos y
              qué derechos tenés como usuario.
            </Typography>

            <section>
              <Typography variant="h6" gutterBottom>
                1. Política de menores de edad
              </Typography>
              <Typography paragraph>
                Nuestros servicios y el registro de cuentas están dirigidos{" "}
                <strong>exclusivamente a personas mayores de 18 años</strong>.
                No recolectamos conscientemente datos personales de menores de
                18 años. Si tomamos conocimiento de que se han recopilado datos
                personales de un menor sin el correspondiente consentimiento,
                procederemos de inmediato a su supresión de nuestros sistemas.
              </Typography>
            </section>

            <section>
              <Typography variant="h6" gutterBottom>
                2. Información que recopilamos
              </Typography>
              <Typography paragraph>
                Recolectamos datos técnicos, de interacción y de contacto para
                operar la plataforma, enviar alertas y generar métricas de
                consumo:
              </Typography>
              <ul style={{ marginLeft: 24, marginBottom: 16 }}>
                <li>
                  <strong>Identificadores seudónimos:</strong> Asignamos
                  identificadores técnicos a tu dispositivo o navegador para
                  registrar visitas y mantener configuraciones locales. En caso
                  de iniciar sesión o registrar una cuenta, estos
                  identificadores quedan asociados a tu perfil de usuario.
                </li>
                <li>
                  <strong>Datos de registro y autenticación social:</strong> Si
                  creás una cuenta a través de servicios de terceros (como
                  Google o Apple), recopilamos la información básica provista
                  por dichos proveedores: nombre completo, dirección de correo
                  electrónico y el identificador único de autenticación.
                </li>
                <li>
                  <strong>Tokens de Notificaciones Push:</strong> Si habilitás
                  voluntariamente el sistema de alertas de transmisiones,
                  recopilamos y almacenamos un token único de notificación
                  asociado a tu dispositivo o navegador para poder remitirte los
                  avisos solicitados.
                </li>
                <li>
                  <strong>Datos de perfil demográfico:</strong> Si completás
                  voluntariamente la información de tu cuenta, asociamos a tus
                  eventos de uso variables de rango etario y género con el fin
                  de personalizar la experiencia y generar reportes de audiencia
                  agregados.
                </li>
                <li>
                  <strong>Eventos de interacción (telemetría puntual):</strong>{" "}
                  Registramos acciones puntuales dentro del sitio y la app,
                  tales como clics sobre la grilla, apertura de programas,
                  canales seleccionados, guardado de favoritos y accesos a
                  transmisiones. No registramos el tiempo de permanencia activa
                  o duración pasiva de navegación.
                </li>
                <li>
                  <strong>Información técnica general:</strong> Tipo de
                  navegador y sistema operativo para optimizar la compatibilidad
                  técnica de la interfaz. No almacenamos de forma directa tu
                  dirección IP en nuestras bases de datos propias (el
                  procesamiento de geolocalización aproximada o logs de red es
                  gestionado por los servicios de infraestructura y analítica
                  externa).
                </li>
              </ul>
            </section>

            <section>
              <Typography variant="h6" gutterBottom>
                3. Finalidades del tratamiento y función &quot;Mi Resumen&quot;
              </Typography>
              <Typography paragraph>
                Tratamos los datos recopilados para los siguientes fines:
              </Typography>
              <ul style={{ marginLeft: 24, marginBottom: 16 }}>
                <li>
                  <strong>Operación de la plataforma y alertas:</strong>{" "}
                  Presentar la programación actualizada, sincronizar enlaces a
                  emisiones en directo y despachar notificaciones push cuando
                  inician los programas o creadores que marcaste en tu grilla o
                  favoritos.
                </li>
                <li>
                  <strong>
                    Historial de usuario y balances (&quot;Mi Resumen&quot;):
                  </strong>{" "}
                  Construir y almacenar el historial de programas y canales
                  interactuados por cada usuario registrado. Esta información
                  permite generar los balances periódicos de consumo (resúmenes
                  semanales y anuales) con piezas gráficas para descargar y
                  compartir.
                </li>
                <li>
                  <strong>Métricas internas y rankings agregados:</strong>{" "}
                  Elaborar estadísticas consolidadas sobre el consumo de
                  streaming en la región. Todos los informes de industria,
                  métricas comerciales y rankings públicos se presentan de forma
                  disociada y agregada, impidiendo identificar a personas
                  individuales.
                </li>
              </ul>
            </section>

            <section>
              <Typography variant="h6" gutterBottom>
                4. Cookies, telemetría y configuración de preferencias
              </Typography>
              <Typography paragraph>
                El sitio y la app utilizan tecnologías de almacenamiento local,
                cookies y sistemas propios de eventos estructurados en las
                siguientes categorías:
              </Typography>
              <ul style={{ marginLeft: 24, marginBottom: 16 }}>
                <li>
                  <strong>Cookies Necesarias:</strong> Imprescindibles para el
                  funcionamiento técnico de la plataforma, autenticación de
                  sesiones y seguridad.
                </li>
                <li>
                  <strong>Cookies de Análisis:</strong> Permiten evaluar el uso
                  de la plataforma y el rendimiento del producto. Operamos un
                  sistema de recolección propio habilitado de forma
                  predeterminada (esquema opt-out), además de herramientas
                  analíticas de terceros.
                </li>
                <li>
                  <strong>Cookies de Preferencias:</strong> Guardan
                  configuraciones de interfaz elegidas por el usuario (como
                  canales destacados o filtros visuales).
                </li>
                <li>
                  <strong>Cookies de Marketing:</strong> Utilizadas para medir
                  la efectividad de campañas y accesos a contenidos.
                </li>
              </ul>
              <Typography paragraph>
                <strong>Herramientas de terceros:</strong> Utilizamos servicios
                externos especializados para monitoreo, envío de avisos y
                análisis, tales como Firebase (para notificaciones e
                infraestructura), Google Analytics (GA4), PostHog, Microsoft
                Clarity, Hotjar y Datadog, cada uno sujeto a sus respectivas
                políticas de privacidad.
              </Typography>
              <Typography paragraph>
                <strong>Gestión del consentimiento:</strong> Podés personalizar
                o desactivar las categorías de cookies no esenciales y el
                sistema de análisis interno en cualquier momento desde el panel
                de <strong>Configurar cookies</strong> en el pie de página web.
                En la aplicación móvil, dicha opción estará disponible en la
                sección de Configuración/Ajustes de la cuenta. Las
                notificaciones push se pueden revocar directamente desde los
                ajustes de notificaciones de tu navegador o sistema operativo
                móvil (Android/iOS).
              </Typography>
            </section>

            <section>
              <Typography variant="h6" gutterBottom>
                5. YouTube API Services
              </Typography>
              <Typography paragraph>
                Nuestra plataforma utiliza los servicios de YouTube API Services
                para mostrar transmisiones públicas y estados en vivo. Al
                interactuar con estas funciones, aceptas los{" "}
                <a
                  href="https://www.youtube.com/t/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#3b82f6" }}
                >
                  Términos de Servicio de YouTube
                </a>{" "}
                y la{" "}
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#3b82f6" }}
                >
                  Política de Privacidad de Google
                </a>
                . Únicamente accedemos y mostramos datos públicos provistos por
                la API oficial y no accedemos, recopilamos ni almacenamos datos
                privados de cuentas de Google de los usuarios. Podés gestionar y
                revocar accesos en cualquier momento a través de la{" "}
                <a
                  href="https://myaccount.google.com/permissions"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#3b82f6" }}
                >
                  Configuración de Seguridad de Google
                </a>
                .
              </Typography>
            </section>

            <section>
              <Typography variant="h6" gutterBottom>
                6. Alojamiento de datos y transferencia internacional
              </Typography>
              <Typography paragraph>
                Los servidores y bases de datos principales de LA GUÍA DEL
                STREAMING se encuentran alojados en centros de datos ubicados en
                la <strong>República Federativa del Brasil</strong> (a través de
                proveedores de infraestructura en la nube como Supabase y
                Railway). Al utilizar el servicio, consientes la transferencia
                internacional de tus datos a dicha jurisdicción bajo estándares
                de cifrado y medidas de seguridad técnicas apropiadas para
                proteger la confidencialidad de la información.
              </Typography>
            </section>

            <section>
              <Typography variant="h6" gutterBottom>
                7. Conservación y retención de datos
              </Typography>
              <ul style={{ marginLeft: 24, marginBottom: 16 }}>
                <li>
                  <strong>Eventos crudos de telemetría:</strong> Los registros
                  puntuales de eventos técnicos y clics se conservan en las
                  bases operativas por un plazo máximo de{" "}
                  <strong>90 días corridos</strong>, tras el cual se eliminan de
                  forma automatizada.
                </li>
                <li>
                  <strong>Tokens de Notificaciones Push:</strong> Se conservan
                  mientras mantengas activas las alertas o la aplicación
                  instalada; ante desinstalación o revocación de permisos,
                  quedan inactivos y se depuran en las limpiezas periódicas de
                  base de datos.
                </li>
                <li>
                  <strong>Historial de consumo de usuarios registrados:</strong>{" "}
                  Los registros de programas y canales visualizados asociados a
                  tu cuenta se conservan de forma continua mientras tu cuenta
                  permanezca activa, con el fin exclusivo de permitir la
                  generación de balances históricos y resúmenes anuales
                  (&quot;Mi Resumen&quot;).
                </li>
                <li>
                  <strong>Métricas estadísticas consolidadas:</strong> Los datos
                  agregados y disociados (sin vinculación a cuentas o
                  identificadores personales) se conservan por tiempo indefinido
                  con fines de análisis histórico y desarrollo comercial.
                </li>
              </ul>
            </section>

            <section>
              <Typography variant="h6" gutterBottom>
                8. Supresión de cuenta y derechos del titular
              </Typography>
              <Typography paragraph>
                De acuerdo con la Ley N° 25.326, tenés derecho a acceder,
                rectificar, actualizar o suprimir tus datos personales:
              </Typography>
              <ul style={{ marginLeft: 24, marginBottom: 16 }}>
                <li>
                  <strong>Baja de cuenta y desvinculación:</strong> Si solicitás
                  la baja de tu cuenta de usuario, tus credenciales, datos de
                  perfil, tokens e identificadores asociados se eliminan
                  definitivamente. Los registros históricos de interacción pasan
                  a un estado disociado y anonimizado de forma irreversible,
                  eliminando cualquier identificador que permita vincularlos con
                  tu identidad.
                </li>
                <li>
                  <strong>Ejercicio de derechos:</strong> Podés solicitar la
                  actualización, exportación o supresión de tus datos enviando
                  un correo electrónico a{" "}
                  <strong>hola@laguiadelstreaming.com</strong> con el asunto
                  &quot;Protección de Datos Personales&quot;. Responderemos a tu
                  solicitud en los plazos establecidos por la normativa vigente.
                </li>
              </ul>
            </section>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
