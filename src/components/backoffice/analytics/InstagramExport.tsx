"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Alert,
  CircularProgress,
  Typography,
} from "@mui/material";
import InstagramIcon from "@mui/icons-material/Instagram";
import DownloadIcon from "@mui/icons-material/Download";

export type RankingKind = "programs" | "channels" | "streamers";

const TITLES: Record<RankingKind, string> = {
  programs: "Top 10 de programas",
  channels: "Top 10 de canales",
  streamers: "Top 10 de streamers",
};

interface Props {
  from: string;
  to: string;
  /** Omitted for streamers, whose default metric differs from the others. */
  metric?: string;
  kind: RankingKind;
}

/**
 * Generates the shareable top-10 artwork and previews it before download.
 *
 * The image is fetched as a blob rather than pointed at with an <img src>, so
 * the route's 401/404 bodies surface as a message here instead of a broken
 * image icon, and the download reuses the bytes already in memory.
 */
export function InstagramExport({ from, to, metric, kind }: Props) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        from,
        to,
        kind,
        // Left out entirely when absent, so the route applies the default
        // metric for this kind rather than the programs one.
        ...(metric ? { metric } : {}),
      });
      // no-store on the client too: the browser's HTTP cache would otherwise
      // re-serve a previously generated image for the same range.
      const res = await fetch(`/api/og/top10?${params}`, { cache: "no-store" });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? "No se pudo generar la imagen.");
        return;
      }
      setUrl(URL.createObjectURL(await res.blob()));
    } catch {
      setError("No se pudo generar la imagen.");
    } finally {
      setLoading(false);
    }
  }, [from, to, metric, kind]);

  const close = () => {
    setOpen(false);
    setError(null);
    if (url) {
      // Blob URLs pin their data until revoked; leaving them alive across
      // repeated generations would leak a megabyte a time.
      URL.revokeObjectURL(url);
      setUrl(null);
    }
  };

  useEffect(() => {
    if (open) void generate();
  }, [open, generate]);

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<InstagramIcon />}
        onClick={() => setOpen(true)}
      >
        Generar imagen para Instagram
      </Button>

      <Dialog open={open} onClose={close} maxWidth="sm" fullWidth>
        <DialogTitle>{TITLES[kind]} para Instagram</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {from} — {to} · 1080×1350 (formato 4:5 de Instagram)
          </Typography>

          {error && <Alert severity="error">{error}</Alert>}

          {loading && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress />
            </Box>
          )}

          {url && !loading && (
            <Box
              component="img"
              src={url}
              alt={TITLES[kind]}
              sx={{ width: "100%", borderRadius: 1, display: "block" }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={close}>Cerrar</Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            disabled={!url || loading}
            component="a"
            href={url ?? undefined}
            download={`top10-${kind}-${from}-a-${to}.png`}
          >
            Descargar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
