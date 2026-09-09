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

interface Props {
  from: string;
  to: string;
  metric: string;
}

/**
 * Generates the shareable top-10 artwork and previews it before download.
 *
 * The image is fetched as a blob rather than pointed at with an <img src>, so
 * the route's 401/404 bodies surface as a message here instead of a broken
 * image icon, and the download reuses the bytes already in memory.
 */
export function InstagramExport({ from, to, metric }: Props) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ from, to, metric });
      const res = await fetch(`/api/og/top10?${params}`);
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
  }, [from, to, metric]);

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
        <DialogTitle>Top 10 para Instagram</DialogTitle>
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
              alt="Ranking top 10"
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
            download={`top10-${from}-a-${to}.png`}
          >
            Descargar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
