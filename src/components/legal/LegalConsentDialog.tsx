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
import type { SessionWithToken } from "@/types/session";
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

/**
 * The shared axios instance resolves the session on every request, which means
 * an extra round trip to /api/auth/session before the call even leaves. The
 * token is already in hand here, so these two talk to the backend directly.
 */
const SEEN_FEATURES_URL = `${process.env.NEXT_PUBLIC_API_URL}/users/me/seen-features`;

const authHeaders = (token: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

interface ViewProps {
  onAccept: () => void;
  onSignOut: () => void;
}

/**
 * The notice itself, with no session or network concerns — kept separate so the
 * layout can be rendered and reviewed on its own.
 */
export function LegalConsentDialogView({ onAccept, onSignOut }: ViewProps) {
  // The notice can sit on screen across a new year; deriving it keeps the
  // promise honest instead of freezing a year into the copy.
  const year = new Date().getFullYear();

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
      slotProps={{
        paper: {
          sx: {
            borderRadius: 4,
            // Lifted off the page rather than painted onto it: a surface a step
            // lighter than the background, slightly see-through over the blur,
            // a hairline edge to catch the light and a deep shadow underneath.
            backgroundColor: "rgba(42, 56, 78, 0.78)",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow: "0 24px 60px rgba(0, 0, 0, 0.55)",
            backgroundImage: "none",
          },
        },
      }}
    >
      <DialogContent sx={{ textAlign: "center", px: 3, pt: 3, pb: 2 }}>
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            bgcolor: "primary.main",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mx: "auto",
            mb: 2,
          }}
        >
          <InsightsIcon sx={{ fontSize: 28, color: "#fff" }} />
        </Box>

        <Typography
          id="legal-consent-title"
          component="h2"
          sx={{
            fontSize: "1.35rem",
            fontWeight: 700,
            lineHeight: 1.25,
            mb: 1.5,
          }}
        >
          ¡Llegó tu resumen a La Guía!
        </Typography>

        <Typography
          color="text.secondary"
          sx={{
            fontSize: "0.95rem",
            lineHeight: 1.55,
            mb: 1,
            // Spreads the last line instead of leaving a single word stranded.
            textWrap: "balance",
          }}
        >
          Mirá el ranking de los programas y canales que más viste en la semana,
          con diseños listos para compartir en redes.
        </Typography>

        <Typography
          color="text.secondary"
          sx={{
            fontSize: "0.95rem",
            lineHeight: 1.55,
            mb: 3,
            textWrap: "balance",
          }}
        >
          A fin de año tendrás tu resumen de {year} también.
        </Typography>

        <Button
          variant="contained"
          size="large"
          onClick={onAccept}
          sx={{
            // Slightly smaller with tighter sides on a phone: at full width the
            // generous desktop padding is wasted, and without this the label
            // wraps onto two lines inside the button on a 360px screen.
            fontSize: { xs: "0.9375rem", sm: "1rem" },
            fontWeight: 700,
            py: 1.35,
            px: { xs: 2, sm: 4 },
            borderRadius: 2.5,
            mb: 3,
            width: { xs: "100%", sm: "auto" },
          }}
        >
          Continuar y ver mi resumen
        </Button>

        <Typography
          component="p"
          color="text.secondary"
          sx={{
            fontSize: "0.625rem",
            lineHeight: 1.5,
            opacity: 0.75,
            // Pinned to the bottom edge, away from the body copy.
            mb: 0,
            // Chrome on Android inflates small text inside wide blocks on its
            // own ("font boosting"). It hit the sign-out control hardest, whose
            // line box then grew and left a gap twice the size of the others.
            WebkitTextSizeAdjust: "100%",
            textSizeAdjust: "100%",
          }}
        >
          Al continuar confirmás que sos mayor de 18 años y aceptás nuestros{" "}
          <Link
            href="/terminos-y-condiciones"
            target="_blank"
            rel="noopener"
            color="primary"
            sx={{ font: "inherit" }}
          >
            Términos y Condiciones
          </Link>{" "}
          y la{" "}
          <Link
            href="/legal/politica-de-privacidad"
            target="_blank"
            rel="noopener"
            color="primary"
            sx={{ font: "inherit" }}
          >
            Política de Privacidad
          </Link>
          . O podés{" "}
          <Link
            component="button"
            type="button"
            onClick={onSignOut}
            color="inherit"
            sx={{
              verticalAlign: "baseline",
              fontSize: "inherit",
              fontWeight: "inherit",
              fontFamily: "inherit",
              lineHeight: "inherit",
            }}
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
  const typedSession = session as SessionWithToken | null;
  /**
   * next-auth hands back a new session object on every refresh, so depending on
   * it re-ran this effect — and re-queried the backend — several times per page
   * load. These two only change when the user actually does.
   */
  const userId = typedSession?.user?.id ?? null;
  const accessToken = typedSession?.accessToken ?? null;
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

    // Every path that stops here has to close the notice rather than just
    // bail: an early return leaves whatever was on screen before. Signing out
    // from inside the notice hits exactly this — the session goes away but the
    // dialog stayed up, over a logged-out site.
    if (status !== "authenticated" || !userId || !accessToken) {
      setOpen(false);
      return;
    }

    // Also closes it on client-side navigation into one of these routes, not
    // just on a fresh load — the links open in a new tab, but nothing stops a
    // user from reaching the legal pages some other way.
    if (isExcludedPath(pathname)) {
      setOpen(false);
      return;
    }

    let cancelled = false;

    fetch(SEEN_FEATURES_URL, { headers: authHeaders(accessToken) })
      .then((r) =>
        r.ok ? r.json() : Promise.reject(new Error(String(r.status))),
      )
      .then((data: unknown) => {
        if (cancelled) return;
        const seen = Array.isArray(data) ? (data as string[]) : [];
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
  }, [status, userId, accessToken, pathname]);

  const accept = useCallback(() => {
    const token = accessToken;
    if (!token) return;
    acceptedRef.current = true;

    // Deliberately not awaited: the user moves on at once and the write
    // finishes on its own. A client-side route change does not cancel it.
    fetch(SEEN_FEATURES_URL, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({ feature: buildLegalConsentEntry() }),
    })
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
      })
      .catch(() => {
        // Nothing to tell the user: the notice will simply reappear later.
      });

    setOpen(false);
    router.push("/mi-resumen");
  }, [router, accessToken]);

  /**
   * `signOut({ callbackUrl })` starts the navigation alongside the request that
   * clears the session, and the two race: the new page can load while the
   * cookie is still valid, leaving the user back where they started. Awaiting
   * the sign-out and navigating afterwards — what the header's logout already
   * does — removes the race.
   */
  const handleSignOut = useCallback(async () => {
    await signOut({ redirect: false });
    router.push("/");
  }, [router]);

  if (!open) return null;

  return (
    <LegalConsentDialogView
      onAccept={accept}
      onSignOut={() => void handleSignOut()}
    />
  );
}
