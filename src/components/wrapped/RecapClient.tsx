"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  ToggleButton,
  ToggleButtonGroup,
  Button,
  CircularProgress,
  Alert,
  Avatar,
  Stack,
} from "@mui/material";
import ShareIcon from "@mui/icons-material/Share";
import DownloadIcon from "@mui/icons-material/Download";
import { useSessionContext } from "@/contexts/SessionContext";
import { getMyRecap, type Recap, type RecapPeriod } from "@/services/analytics";

const PERIOD_LABELS: Record<RecapPeriod, string> = {
  week: "Semana",
  month: "Mes",
  year: "Año",
};

export function RecapClient() {
  const { session, status } = useSessionContext();

  const [period, setPeriod] = useState<RecapPeriod>("week");
  const [recap, setRecap] = useState<Recap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRecap(await getMyRecap({ period }));
    } catch {
      setError("No pudimos cargar tu resumen. Probá de nuevo en un rato.");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    if (status === "authenticated") void load();
    else if (status !== "loading") setLoading(false);
  }, [status, load]);

  /**
   * Share the rendered card as a file when the browser supports it, and fall
   * back to a download otherwise — desktop Chrome and Firefox can't share files,
   * and a share sheet that silently does nothing is worse than a saved image.
   */
  const share = async () => {
    setSharing(true);
    setShareError(null);
    try {
      const res = await fetch(`/api/og/recap?period=${period}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setShareError(body?.error ?? "No pudimos generar la imagen.");
        return;
      }

      const blob = await res.blob();
      const file = new File([blob], `mi-resumen-${period}.png`, {
        type: "image/png",
      });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "Mi resumen" });
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.name;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      // A user dismissing the share sheet rejects with AbortError; that is not
      // an error worth showing them.
      if ((err as Error)?.name !== "AbortError") {
        setShareError("No pudimos compartir la imagen.");
      }
    } finally {
      setSharing(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!session) {
    return (
      <Alert severity="info">
        Iniciá sesión para ver tu resumen de lo que más viste.
      </Alert>
    );
  }

  return (
    <Box>
      <Stack
        direction="row"
        spacing={2}
        alignItems="center"
        justifyContent="space-between"
        flexWrap="wrap"
        useFlexGap
        sx={{ mb: 3 }}
      >
        <ToggleButtonGroup
          size="small"
          exclusive
          value={period}
          onChange={(_, value) => value && setPeriod(value as RecapPeriod)}
        >
          {(Object.keys(PERIOD_LABELS) as RecapPeriod[]).map((key) => (
            <ToggleButton key={key} value={key}>
              {PERIOD_LABELS[key]}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        {recap?.enough_data && (
          <Button
            variant="contained"
            startIcon={sharing ? <CircularProgress size={16} /> : <ShareIcon />}
            onClick={() => void share()}
            disabled={sharing}
          >
            Compartir
          </Button>
        )}
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}
      {shareError && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {shareError}
        </Alert>
      )}

      {recap && !recap.enough_data && (
        <Card variant="outlined">
          <CardContent sx={{ textAlign: "center", py: 6 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Todavía no hay suficiente para contar
            </Typography>
            <Typography color="text.secondary">
              Mirá algunos programas y volvé — tu resumen de{" "}
              {PERIOD_LABELS[period].toLowerCase()} aparece cuando tengamos algo
              interesante que mostrarte.
            </Typography>
          </CardContent>
        </Card>
      )}

      {recap?.enough_data && (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {recap.period.label}
          </Typography>

          <Stack spacing={1.5} sx={{ mb: 3 }}>
            {recap.top_programs.map((program) => (
              <Card key={program.program_id} variant="outlined">
                <CardContent
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    py: 1.5,
                  }}
                >
                  <Typography
                    variant="h5"
                    sx={{ fontWeight: 800, color: "primary.main", width: 32 }}
                  >
                    {program.position}
                  </Typography>
                  {program.channel_logo_url && (
                    <Avatar
                      src={program.channel_logo_url}
                      alt=""
                      variant="rounded"
                      sx={{ width: 40, height: 40 }}
                    />
                  )}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography noWrap sx={{ fontWeight: 600 }}>
                      {program.program_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {program.channel_name}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {program.plays}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Stack>

          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            <Stat value={recap.totals.plays} label="reproducciones" />
            <Stat value={recap.totals.distinct_programs} label="programas" />
            {recap.habits.favorite_weekday && (
              <Stat value={recap.habits.favorite_weekday} label="tu día" />
            )}
          </Stack>

          <Button
            sx={{ mt: 3 }}
            startIcon={<DownloadIcon />}
            onClick={() => void share()}
            disabled={sharing}
          >
            Descargar imagen
          </Button>
        </>
      )}
    </Box>
  );
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <Card variant="outlined" sx={{ flex: "1 1 140px" }}>
      <CardContent>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {typeof value === "number" ? value.toLocaleString("es-AR") : value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
      </CardContent>
    </Card>
  );
}
