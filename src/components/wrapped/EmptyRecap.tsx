"use client";

import { Box, Button, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import type { Recap } from "@/services/analytics";

/**
 * What most people see at first: the recap needs a handful of plays before it
 * says anything worth sharing. The bar turns the gate into progress instead of
 * a dead end, and the target comes from the API so it cannot drift from the
 * rule that actually withholds the recap.
 */
export function EmptyRecap({ recap }: { recap: Recap }) {
  const router = useRouter();
  const done = recap.totals.plays;
  const target = Math.max(recap.minimum_plays, 1);
  const pct = Math.min(100, Math.round((done / target) * 100));

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: { xs: "40px", md: "90px" },
        flexDirection: { xs: "column", md: "row" },
        flexGrow: 1,
        px: "48px",
        py: "40px",
      }}
    >
      <Box
        aria-hidden
        sx={{
          width: 300,
          height: 533,
          flexShrink: 0,
          borderRadius: "18px",
          border: "2px dashed #334155",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: "18px",
          px: "38px",
        }}
      >
        <Box
          sx={{ height: 14, width: "80%", borderRadius: "7px", bgcolor: "#334155" }}
        />
        <Box
          sx={{ height: 14, width: "55%", borderRadius: "7px", bgcolor: "#2A3448" }}
        />
        <Box
          sx={{
            height: 76,
            borderRadius: "12px",
            bgcolor: "#2A3448",
            mt: "14px",
          }}
        />
        <Box sx={{ display: "flex", gap: "8px", mt: "14px" }}>
          {Array.from({ length: 6 }).map((_, index) => (
            <Box
              key={index}
              sx={{
                flex: 1,
                height: 30,
                borderRadius: "7px",
                bgcolor: index === 2 ? "#3B82F6" : "#232D42",
              }}
            />
          ))}
        </Box>
        <Box sx={{ display: "flex", gap: "8px" }}>
          {Array.from({ length: 6 }).map((_, index) => (
            <Box
              key={index}
              sx={{ flex: 1, height: 30, borderRadius: "7px", bgcolor: "#232D42" }}
            />
          ))}
        </Box>
      </Box>

      <Box sx={{ maxWidth: 520 }}>
        <Typography
          component="h2"
          sx={{
            fontFamily: "Outfit, sans-serif",
            fontSize: { xs: 38, md: 46 },
            fontWeight: 800,
            letterSpacing: "-0.03em",
            lineHeight: 1.08,
            color: "#F1F5F9",
          }}
        >
          Todavía estamos
          <br />
          armando tu resumen
        </Typography>

        <Typography
          sx={{
            mt: "18px",
            fontSize: 18,
            lineHeight: 1.5,
            color: "#CBD5E1",
          }}
        >
          Necesitamos un poco más de lo que viste{" "}
          {recap.period.type === "week" ? "esta semana" : "este mes"} para
          mostrarte tus programas y streamers favoritos.
        </Typography>

        <Box sx={{ mt: "32px" }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              mb: "10px",
            }}
          >
            <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#F1F5F9" }}>
              Vas {done} {done === 1 ? "reproducción" : "reproducciones"}
            </Typography>
            <Typography sx={{ fontSize: 15, color: "#94A3B8" }}>
              Meta: {target}
            </Typography>
          </Box>
          <Box
            role="progressbar"
            aria-valuenow={done}
            aria-valuemin={0}
            aria-valuemax={target}
            sx={{
              height: 8,
              borderRadius: "999px",
              bgcolor: "#334155",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                width: `${pct}%`,
                height: "100%",
                borderRadius: "999px",
                bgcolor: "#3B82F6",
                transition: "width .3s ease",
              }}
            />
          </Box>
        </Box>

        <Button
          variant="contained"
          onClick={() => router.push("/")}
          sx={{
            mt: "32px",
            borderRadius: "999px",
            px: "34px",
            py: "14px",
            fontSize: 17,
          }}
        >
          Ver qué hay en vivo
        </Button>
      </Box>
    </Box>
  );
}
