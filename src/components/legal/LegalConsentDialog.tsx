"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
  Link,
  Alert,
  CircularProgress,
} from "@mui/material";
import InsightsIcon from "@mui/icons-material/Insights";
import { useSessionContext } from "@/contexts/SessionContext";
import { api } from "@/services/api";
import {
  buildLegalConsentEntry,
  hasAcceptedCurrentLegal,
} from "@/constants/legal";

/**
 * The signup flow takes the same acceptance at the password step, so a user
 * still completing their profile would otherwise be asked twice.
 */
const EXCLUDED_PATHS = ["/profile-completion"];

interface ViewProps {
  saving: boolean;
  error: string | null;
  onAccept: () => void;
  onSignOut: () => void;
}

/**
 * The notice itself, with no session or network concerns — kept separate so the
 * layout can be rendered and reviewed on its own.
 */
export function LegalConsentDialogView({
  saving,
  error,
  onAccept,
  onSignOut,
}: ViewProps) {
  return (
    <Dialog
      open
      maxWidth="xs"
      fullWidth
      // No escape hatch: dismissing without a decision is not one of the options.
      disableEscapeKeyDown
      onClose={(_, reason) => {
        if (reason === "backdropClick") return;
      }}
      aria-labelledby="legal-consent-title"
      slotProps={{ paper: { sx: { borderRadius: 3 } } }}
    >
      <DialogContent sx={{ textAlign: "center", px: 2.5, py: 3 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            bgcolor: "primary.main",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mx: "auto",
            mb: 2,
          }}
        >
          <InsightsIcon sx={{ fontSize: 26, color: "#fff" }} />
        </Box>

        <Typography
          id="legal-consent-title"
          variant="h6"
          sx={{ fontWeight: 700, mb: 1.25 }}
        >
          ¡Llegó tu resumen a La Guía!
        </Typography>

        <Typography color="text.secondary" sx={{ mb: 2.5 }}>
          Mirá el ranking de los canales y programas que más viste en la semana
          y durante el año, con diseños listos para compartir en redes.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2, textAlign: "left" }}>
            {error}
          </Alert>
        )}

        <Button
          variant="contained"
          size="large"
          onClick={onAccept}
          disabled={saving}
          startIcon={
            saving ? <CircularProgress size={18} color="inherit" /> : undefined
          }
          sx={{ fontWeight: 700, py: 1.2, px: 3.5, mb: 2 }}
        >
          {saving ? "Guardando…" : "Ver mi resumen y continuar"}
        </Button>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", fontSize: "0.6875rem", lineHeight: 1.55 }}
        >
          Al continuar confirmás que sos mayor de 18 años y aceptás nuestros{" "}
          <Link
            href="/terminos-y-condiciones"
            target="_blank"
            rel="noopener"
            color="primary"
          >
            Términos y Condiciones
          </Link>{" "}
          y la{" "}
          <Link
            href="/legal/politica-de-privacidad"
            target="_blank"
            rel="noopener"
            color="primary"
          >
            Política de Privacidad
          </Link>
          . O podés{" "}
          <Link
            component="button"
            type="button"
            onClick={onSignOut}
            color="inherit"
            sx={{ verticalAlign: "baseline", font: "inherit" }}
          >
            cerrar sesión
          </Link>
          .
        </Typography>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Blocking notice shown once per account, announcing the recap feature and
 * taking acceptance of the current terms, privacy policy and the 18+
 * declaration in one step.
 *
 * It cannot be dismissed: the only ways past it are accepting or signing out.
 * That makes failure handling load-bearing — a user who cannot record their
 * acceptance would be trapped, so the error is surfaced with a retry and the
 * sign-out link stays live throughout.
 */
export function LegalConsentDialog() {
  const { session, status } = useSessionContext();
  const router = useRouter();
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || !session) return;
    if (EXCLUDED_PATHS.includes(pathname)) return;

    let cancelled = false;

    api
      .get("/users/me/seen-features")
      .then((res) => {
        if (cancelled) return;
        const seen: string[] = Array.isArray(res.data) ? res.data : [];
        setOpen(!hasAcceptedCurrentLegal(seen));
      })
      .catch(() => {
        // We cannot tell whether they already accepted. Staying quiet is the
        // right failure mode: a blocking dialog on a network blip would lock
        // people out of a site whose terms they may have accepted long ago.
        if (!cancelled) setOpen(false);
      });

    return () => {
      cancelled = true;
    };
  }, [status, session, pathname]);

  const accept = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      await api.post("/users/me/seen-features", {
        feature: buildLegalConsentEntry(),
      });
      setOpen(false);
      router.push("/mi-resumen");
    } catch {
      setError(
        "No pudimos guardar tu confirmación. Revisá tu conexión y probá de nuevo.",
      );
    } finally {
      setSaving(false);
    }
  }, [router]);

  if (!open) return null;

  return (
    <LegalConsentDialogView
      saving={saving}
      error={error}
      onAccept={() => void accept()}
      onSignOut={() => void signOut({ callbackUrl: "/" })}
    />
  );
}
