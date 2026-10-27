"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Box, CircularProgress, Typography } from "@mui/material";
import Header from "@/components/Header";
import { getMyRecap, type Recap, type RecapPeriod } from "@/services/analytics";
import { RecapDock } from "./RecapDock";
import { EmptyRecap } from "./EmptyRecap";
import { PLACA_ORDER, canRender, type PlacaKind } from "./placas/Placa";

/**
 * Week and month only. The yearly recap stays hidden until there is a year of
 * history worth showing — the data exists, the product decision does not.
 */
const PERIODS: Array<{ id: RecapPeriod; label: string }> = [
  { id: "week", label: "Semana" },
  { id: "month", label: "Mes" },
];

const MONTHS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

/** "5 — 11 de octubre" for a week, "octubre de 2026" for a month. */
function rangeLabel(recap: Recap): string {
  if (recap.period.type !== "week") return recap.period.label;
  const from = new Date(`${recap.period.from}T12:00:00Z`);
  const to = new Date(`${recap.period.to}T12:00:00Z`);
  const month = MONTHS[to.getUTCMonth()];
  return `${from.getUTCDate()} — ${to.getUTCDate()} de ${month}`;
}

function PeriodSwitch({
  value,
  onChange,
  disabled,
}: {
  value: RecapPeriod;
  onChange: (next: RecapPeriod) => void;
  disabled: boolean;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: "4px",
        p: "3px",
        borderRadius: "999px",
        bgcolor: "#1E293B",
        width: "fit-content",
      }}
    >
      {PERIODS.map((period) => {
        const selected = period.id === value;
        return (
          <Box
            key={period.id}
            component="button"
            type="button"
            disabled={disabled}
            aria-pressed={selected}
            onClick={() => onChange(period.id)}
            sx={{
              border: "none",
              borderRadius: "999px",
              px: "18px",
              py: "6px",
              fontSize: 14,
              fontFamily: "inherit",
              fontWeight: selected ? 600 : 500,
              cursor: disabled ? "default" : "pointer",
              color: selected ? "#FFFFFF" : "#CBD5E1",
              bgcolor: selected ? "#3B82F6" : "transparent",
              transition: "background-color .15s ease",
            }}
          >
            {period.label}
          </Box>
        );
      })}
    </Box>
  );
}

export function RecapClient() {
  const [period, setPeriod] = useState<RecapPeriod>("week");
  const [recap, setRecap] = useState<Recap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getMyRecap({ period })
      .then((data) => {
        if (!cancelled) setRecap(data);
      })
      .catch(() => {
        if (!cancelled) setError("No pudimos traer tu resumen. Probá de nuevo.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [period]);

  /**
   * Rendered placas, keyed by period and kind.
   *
   * The export takes a few hundred milliseconds, which is a long time to stare
   * at a button that has not acknowledged the click. Rendering them in the
   * background as soon as the recap arrives means the share sheet opens on the
   * blob that is already in hand.
   */
  const placas = useRef(new Map<string, Blob>());

  useEffect(() => {
    if (!recap?.enough_data) return;
    const kinds = PLACA_ORDER.filter((kind) => canRender(kind, recap));
    let cancelled = false;

    void (async () => {
      // One at a time: four 1080x1920 renders at once would spike the server
      // for no gain, and they are all in hand within a couple of seconds.
      for (const kind of kinds) {
        if (cancelled) return;
        const key = `${period}:${kind}`;
        if (placas.current.has(key)) continue;
        try {
          const response = await fetch(
            `/api/og/recap?period=${period}&kind=${kind}`,
            { cache: "no-store" },
          );
          if (!response.ok || cancelled) continue;
          placas.current.set(key, await response.blob());
        } catch {
          // Leave it out of the cache; sharing falls back to fetching on click.
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [recap, period]);

  const handleShare = useCallback(
    async (kind: PlacaKind, target: string) => {
      setSharing(true);
      try {
        const key = `${period}:${kind}`;
        let blob = placas.current.get(key);
        if (!blob) {
          const response = await fetch(
            `/api/og/recap?period=${period}&kind=${kind}`,
            { cache: "no-store" },
          );
          if (!response.ok) throw new Error("export failed");
          blob = await response.blob();
          placas.current.set(key, blob);
        }
        const file = new File([blob], `mi-resumen-${kind}.png`, {
          type: "image/png",
        });

        // The share sheet is the only path that actually posts to a network from
        // the browser; everything else can do no better than hand over the file.
        const shareable =
          target !== "download" &&
          typeof navigator !== "undefined" &&
          typeof navigator.canShare === "function" &&
          navigator.canShare({ files: [file] });

        if (shareable) {
          await navigator.share({
            files: [file],
            text: "Mi resumen en La Guía del Streaming",
          });
          return;
        }

        const href = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = href;
        anchor.download = file.name;
        anchor.click();
        URL.revokeObjectURL(href);
      } catch {
        setError("No pudimos generar la imagen. Probá de nuevo.");
      } finally {
        setSharing(false);
      }
    },
    [period],
  );

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(135deg,#0f172a 0%,#131d33 100%)",
        // Enough that the logo is not flush against the top of the window, and
        // no more: on a 13" laptop the row below is fighting for every pixel.
        pt: { xs: "8px", sm: "10px" },
        pb: { xs: "8px", sm: "4px" },
      }}
    >
      <Header />

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          px: { xs: "16px", md: "40px" },
          pt: { xs: "16px", md: "10px" },
          pb: { xs: "16px", md: "10px" },
          flexWrap: "wrap",
        }}
      >
        <Typography
          component="h1"
          sx={{
            fontFamily: "Outfit, sans-serif",
            fontSize: { xs: 26, md: 22 },
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: "#F1F5F9",
          }}
        >
          Mi resumen
        </Typography>

        <PeriodSwitch value={period} onChange={setPeriod} disabled={loading} />

        {recap && (
          <Typography sx={{ fontSize: 14, color: "#94A3B8" }}>
            {rangeLabel(recap)}
          </Typography>
        )}

        {recap?.enough_data && (
          <Typography
            sx={{
              flexGrow: 1,
              textAlign: "right",
              fontSize: 13,
              fontWeight: 500,
              color: "#94A3B8",
              display: { xs: "none", lg: "block" },
            }}
          >
            Pasá el mouse por una tarjeta para compartirla
          </Typography>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mx: "48px", mt: "16px" }}>
          {error}
        </Alert>
      )}

      {loading && (
        <Box
          sx={{
            flexGrow: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CircularProgress />
        </Box>
      )}

      {!loading && recap && !recap.enough_data && <EmptyRecap recap={recap} />}

      {!loading && recap?.enough_data && (
        <RecapDock recap={recap} onShare={handleShare} busy={sharing} />
      )}
    </Box>
  );
}
