import type { Metadata } from "next";
import { Box, Container, Typography } from "@mui/material";
import { RecapClient } from "@/components/wrapped/RecapClient";

export const metadata: Metadata = {
  title: "Mi resumen | La Guía del Streaming",
  description: "Lo que más viste en la semana, el mes o el año.",
};

export default function MiResumenPage() {
  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Mi resumen
        </Typography>
        <Typography color="text.secondary">
          Lo que más viste, listo para compartir.
        </Typography>
      </Box>
      <RecapClient />
    </Container>
  );
}
