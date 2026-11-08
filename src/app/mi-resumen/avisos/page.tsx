"use client";

import { Box, Typography } from "@mui/material";

/**
 * Temporary: the two wordings of every status pill, side by side, so the copy
 * decision can be made on a real phone instead of in a document. The point of
 * the shorter column is whether the longer one still fits on one line here.
 */
const ROWS: { estado: string; web: string; app: string }[] = [
  {
    estado: "Semana · lun a jue",
    web: "Semana pasada · Nuevo resumen el viernes a las 18 hs",
    app: "Semana pasada · Nuevo resumen el viernes 18 hs",
  },
  {
    estado: "Semana · viernes 18:00",
    web: "Lunes a viernes · Mañana se suma el sábado",
    app: "Lunes a viernes · Mañana se suma el sábado",
  },
  {
    estado: "Semana · sábado 18:00",
    web: "Lunes a sábado · El cierre sale mañana a las 22 hs",
    app: "Lunes a sábado · Cierra mañana a las 22 hs",
  },
  {
    estado: "Semana · domingo 22:00",
    web: "Semana completa · Nuevo resumen el viernes a las 18 hs",
    app: "Semana completa · Nuevo resumen el viernes 18 hs",
  },
  {
    estado: "Mes · hasta el anteúltimo",
    web: "Mes pasado · Nuevo resumen el 29 a las 18 hs",
    app: "Mes pasado · Nuevo resumen el 29 a las 18 hs",
  },
  {
    estado: "Mes · anteúltimo 18:00",
    web: "Tu mes hasta hoy · El cierre sale mañana a las 22 hs",
    app: "Mes hasta hoy · Cierra mañana a las 22 hs",
  },
  {
    estado: "Mes · último 22:00",
    web: "Mes completo · Nuevo resumen el 30 a las 18 hs",
    app: "Mes completo · Nuevo resumen el 30 a las 18 hs",
  },
];

function Pill({ text }: { text: string }) {
  const [lead, ...rest] = text.split(" · ");
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        borderRadius: "12px",
        border: "1px solid rgba(59, 130, 246, 0.35)",
        backgroundColor: "rgba(59, 130, 246, 0.12)",
        px: "12px",
        py: "9px",
      }}
    >
      <Box
        aria-hidden
        sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: "#60A5FA", flexShrink: 0 }}
      />
      <Typography
        sx={{
          fontSize: 12,
          lineHeight: "16px",
          color: "#CBD5E1",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        <Box component="span" sx={{ color: "#F1F5F9", fontWeight: 700 }}>
          {lead}
        </Box>
        {" · "}
        {rest.join(" · ")}
      </Typography>
    </Box>
  );
}

export default function AvisosPreview() {
  return (
    <Box sx={{ p: "20px", backgroundColor: "#1E293B", minHeight: "100vh" }}>
      <Typography sx={{ color: "#F1F5F9", fontSize: 18, fontWeight: 700, mb: "4px" }}>
        Avisos de estado · dos redacciones
      </Typography>
      <Typography sx={{ color: "#94A3B8", fontSize: 13, mb: "20px" }}>
        Arriba la de web, abajo la de app. Si una se corta con puntos
        suspensivos, es que no entra en un renglón en esta pantalla.
      </Typography>

      {ROWS.map((row) => {
        const igual = row.web === row.app;
        return (
          <Box key={row.estado} sx={{ mb: "22px" }}>
            <Typography
              sx={{ color: "#94A3B8", fontSize: 12, fontWeight: 600, mb: "8px" }}
            >
              {row.estado}
              {igual ? " — iguales" : ""}
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <Pill text={row.web} />
              {!igual && <Pill text={row.app} />}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
