"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Container,
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
  IconButton,
  Skeleton,
  Divider,
} from "@mui/material";
import { motion } from "framer-motion";
import ArrowBack from "@mui/icons-material/ArrowBack";
import ShareIcon from "@mui/icons-material/Share";
import DownloadIcon from "@mui/icons-material/Download";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import Header from "@/components/Header";
import { useSessionContext } from "@/contexts/SessionContext";
import { getMyRecap, type Recap, type RecapPeriod } from "@/services/analytics";

const MotionBox = motion(Box);

const PERIOD_LABELS: Record<RecapPeriod, string> = {
  week: "Semana",
  month: "Mes",
  year: "Año",
};

const headerTextColor = "rgba(255,255,255,0.6)";

export function RecapClient() {
  const router = useRouter();
  const { status } = useSessionContext();

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

  const ready = recap?.enough_data === true;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        py: { xs: 1, sm: 2 },
      }}
    >
      <Header />
      <Box component="main" sx={{ pt: 2, pb: 6 }}>
        <Container maxWidth="sm" sx={{ px: { xs: 2, sm: 3 } }}>
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Box display="flex" alignItems="center" gap={2} mb={1}>
              <IconButton
                aria-label="Volver atrás"
                onClick={() => router.back()}
                sx={{ color: headerTextColor }}
              >
                <ArrowBack />
              </IconButton>
              <Typography
                variant="h5"
                sx={{ fontWeight: 600, color: headerTextColor }}
              >
                Mi resumen
              </Typography>
            </Box>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 3, ml: 6 }}
            >
              Lo que más viste, listo para compartir.
            </Typography>

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
                onChange={(_, value) =>
                  value && setPeriod(value as RecapPeriod)
                }
              >
                {(Object.keys(PERIOD_LABELS) as RecapPeriod[]).map((key) => (
                  <ToggleButton key={key} value={key} sx={{ px: 2 }}>
                    {PERIOD_LABELS[key]}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>

              {ready && (
                <Button
                  variant="contained"
                  startIcon={
                    sharing ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <ShareIcon />
                    )
                  }
                  onClick={() => void share()}
                  disabled={sharing}
                >
                  Compartir
                </Button>
              )}
            </Stack>

            {error && (
              <Alert
                severity="error"
                sx={{ mb: 2 }}
                action={<Button onClick={() => void load()}>Reintentar</Button>}
              >
                {error}
              </Alert>
            )}
            {shareError && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                {shareError}
              </Alert>
            )}

            {loading && <RecapSkeleton />}

            {!loading && recap && !recap.enough_data && (
              <EmptyState period={period} onExplore={() => router.push("/")} />
            )}

            {!loading && ready && recap && (
              <RecapContent
                recap={recap}
                sharing={sharing}
                onShare={() => void share()}
              />
            )}
          </MotionBox>
        </Container>
      </Box>
    </Box>
  );
}

function RecapContent({
  recap,
  sharing,
  onShare,
}: {
  recap: Recap;
  sharing: boolean;
  onShare: () => void;
}) {
  return (
    <>
      <Typography
        variant="overline"
        sx={{ color: "primary.main", fontWeight: 700, letterSpacing: 1 }}
      >
        {recap.period.label}
      </Typography>

      <Stack spacing={1.5} sx={{ mt: 1.5, mb: 3 }}>
        {recap.top_programs.map((program) => (
          <Card
            key={program.program_id}
            variant="outlined"
            sx={{
              // The leader gets the brand accent, the way the shareable card
              // sets its first row apart.
              borderColor: program.position === 1 ? "primary.main" : "divider",
            }}
          >
            <CardContent
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                py: 1.5,
                "&:last-child": { pb: 1.5 },
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 800,
                  color:
                    program.position === 1 ? "primary.main" : "text.secondary",
                  width: 28,
                  textAlign: "center",
                }}
              >
                {program.position}
              </Typography>
              {program.channel_logo_url && (
                <Avatar
                  src={program.channel_logo_url}
                  alt=""
                  variant="rounded"
                  sx={{ width: 44, height: 44, bgcolor: "transparent" }}
                  imgProps={{ style: { objectFit: "contain" } }}
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
              <Box sx={{ textAlign: "right" }}>
                <Typography sx={{ fontWeight: 700 }}>
                  {program.plays}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {program.plays === 1 ? "vez" : "veces"}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Stack>

      <Stack
        direction="row"
        spacing={1.5}
        flexWrap="wrap"
        useFlexGap
        sx={{ mb: 2 }}
      >
        <Stat value={recap.totals.plays} label="reproducciones" />
        <Stat value={recap.totals.distinct_programs} label="programas" />
        {recap.habits.favorite_weekday && (
          <Stat value={recap.habits.favorite_weekday} label="tu día" />
        )}
      </Stack>

      {recap.comparison.plays_delta_pct_vs_previous !== null && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {recap.comparison.plays_delta_pct_vs_previous >= 0
            ? "Subiste "
            : "Bajaste "}
          <Box component="span" sx={{ color: "text.primary", fontWeight: 600 }}>
            {Math.abs(recap.comparison.plays_delta_pct_vs_previous)}%
          </Box>
          {" respecto del período anterior."}
        </Typography>
      )}

      {recap.top_channels.length > 0 && (
        <>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
            Tus canales
          </Typography>
          <Stack
            direction="row"
            spacing={1.5}
            flexWrap="wrap"
            useFlexGap
            sx={{ mb: 3 }}
          >
            {recap.top_channels.map((channel) => (
              <Card
                key={channel.channel_id}
                variant="outlined"
                sx={{ flex: "1 1 120px" }}
              >
                <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {channel.channel_logo_url && (
                      <Avatar
                        src={channel.channel_logo_url}
                        alt=""
                        variant="rounded"
                        sx={{ width: 28, height: 28, bgcolor: "transparent" }}
                        imgProps={{ style: { objectFit: "contain" } }}
                      />
                    )}
                    <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
                      {channel.channel_name}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {channel.plays} {channel.plays === 1 ? "vez" : "veces"}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </>
      )}

      <Button
        fullWidth
        variant="outlined"
        startIcon={<DownloadIcon />}
        onClick={onShare}
        disabled={sharing}
      >
        Descargar imagen
      </Button>
    </>
  );
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <Card variant="outlined" sx={{ flex: "1 1 110px" }}>
      <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
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

function RecapSkeleton() {
  return (
    <Stack spacing={1.5}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} variant="rounded" height={76} />
      ))}
      <Stack direction="row" spacing={1.5}>
        <Skeleton variant="rounded" height={78} sx={{ flex: 1 }} />
        <Skeleton variant="rounded" height={78} sx={{ flex: 1 }} />
        <Skeleton variant="rounded" height={78} sx={{ flex: 1 }} />
      </Stack>
    </Stack>
  );
}

function EmptyState({
  period,
  onExplore,
}: {
  period: RecapPeriod;
  onExplore: () => void;
}) {
  return (
    <Card variant="outlined">
      <CardContent sx={{ textAlign: "center", py: 6, px: 3 }}>
        <AutoAwesomeIcon
          sx={{ fontSize: 40, color: "primary.main", mb: 1.5 }}
        />
        <Typography variant="h6" sx={{ mb: 1 }}>
          Todavía no hay suficiente para contar
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Mirá algunos programas y volvé — tu resumen de{" "}
          {PERIOD_LABELS[period].toLowerCase()} aparece cuando tengamos algo
          interesante que mostrarte.
        </Typography>
        <Button variant="contained" onClick={onExplore}>
          Ver la grilla
        </Button>
      </CardContent>
    </Card>
  );
}
