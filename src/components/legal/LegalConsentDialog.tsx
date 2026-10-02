"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
  Link,
} from "@mui/material";
import InsightsIcon from "@mui/icons-material/Insights";
import { useSessionContext } from "@/contexts/SessionContext";
import { api } from "@/services/api";
import {
  buildLegalConsentEntry,
  hasAcceptedCurrentLegal,
} from "@/constants/legal";

/**
 * Routes where the notice must stay out of the way.
 *
 * The legal pages are the important case: the notice links to them, and asking
 * somebody to accept a document while covering that very document is both
 * useless and unfair. The signup flow is excluded because it takes the same
 * acceptance at the password step, so the user would be asked twice.
 */
function isExcludedPath(pathname: string): boolean {
  return (
    pathname === "/profile-completion" ||
    pathname === "/terminos-y-condiciones" ||
    // Covers the privacy policy and anything else filed under /legal.
    pathname.startsWith("/legal")
  );
}

interface ViewProps {
  onAccept: () => void;
  onSignOut: () => void;
}

/**
 * The notice itself, with no session or network concerns — kept separate so the
 * layout can be rendered and reviewed on its own.
 */
export function LegalConsentDialogView({ onAccept, onSignOut }: ViewProps) {
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

        <Button
          variant="contained"
          size="large"
          onClick={onAccept}
          sx={{ fontWeight: 700, py: 1.2, px: 3.5, mb: 2 }}
        >
          Ver mi resumen y continuar
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
 *
 * Accepting navigates immediately and records the acceptance in the background,
 * rather than holding the user behind a spinner while the request completes.
 * Nothing is lost if that request fails: the acceptance simply is not stored, so
 * the notice comes back next time. Erring towards asking twice is both the safe
 * side legally and the one that cannot leave anybody stuck on a dead dialog.
 */
export function LegalConsentDialog() {
  const { session, status } = useSessionContext();
  const router = useRouter();
  const pathname = usePathname();

  const [open, setOpen] = useState(false);

  /**
   * Set the moment the user accepts, before the write has landed. The effect
   * below re-runs on every route change, so without this the navigation to
   * /mi-resumen would re-query the backend while the POST was still in flight,
   * read "not accepted" and put the notice straight back on screen.
   */
  const acceptedRef = useRef(false);

  useEffect(() => {
    if (acceptedRef.current) return;
    if (status !== "authenticated" || !session) return;

    // Also closes it on client-side navigation into one of these routes, not
    // just on a fresh load — the links open in a new tab, but nothing stops a
    // user from reaching the legal pages some other way.
    if (isExcludedPath(pathname)) {
      setOpen(false);
      return;
    }

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

  const accept = useCallback(() => {
    acceptedRef.current = true;

    // Deliberately not awaited: the user moves on at once and the write
    // finishes on its own. A client-side route change does not cancel it.
    api
      .post("/users/me/seen-features", { feature: buildLegalConsentEntry() })
      .catch(() => {
        // Nothing to tell the user: the notice will simply reappear later.
      });

    setOpen(false);
    router.push("/mi-resumen");
  }, [router]);

  if (!open) return null;

  return (
    <LegalConsentDialogView
      onAccept={accept}
      onSignOut={() => void signOut({ callbackUrl: "/" })}
    />
  );
}
