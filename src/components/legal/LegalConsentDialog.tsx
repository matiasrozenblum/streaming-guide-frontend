"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
  Link,
  Slide,
  useMediaQuery,
  useTheme,
} from "@mui/material";
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

/**
 * The fanned-out placas at the top of the card, with the coordinates taken
 * straight from the Paper artboards (580px card on desktop, 390px sheet on a
 * phone). They live inside a fixed-width stage that is centred and clipped, so
 * one set of numbers covers every screen: on a phone narrower than the 390px
 * the mobile design was drawn at, the overhang is simply cut off instead of the
 * whole arrangement reflowing.
 */
const STAGE = {
  xs: { width: 390, height: 230, cardW: 124, cardH: 220, radius: 12 },
  sm: { width: 580, height: 270, cardW: 150, cardH: 267, radius: 14 },
} as const;

const PLACAS = [
  {
    src: "/img/recap-intro/left.jpg",
    left: { xs: 62, sm: 112 },
    top: { xs: 36, sm: 46 },
    rotate: -9,
    front: false,
  },
  {
    src: "/img/recap-intro/right.jpg",
    left: { xs: 204, sm: 318 },
    top: { xs: 36, sm: 46 },
    rotate: 9,
    front: false,
  },
  // Last so it paints over the two tilted ones behind it.
  {
    src: "/img/recap-intro/center.jpg",
    left: { xs: 133, sm: 215 },
    top: { xs: 20, sm: 28 },
    rotate: 0,
    front: true,
  },
];

/** The placa fan. Decorative: everything it says is in the copy below it. */
function PlacaStage() {
  return (
    <Box
      aria-hidden
      sx={{
        position: "relative",
        width: "100%",
        height: { xs: STAGE.xs.height, sm: STAGE.sm.height },
        overflow: "hidden",
        flexShrink: 0,
        // A pool of light under the placas, so the fan sits on something
        // instead of floating on a flat panel.
        backgroundImage:
          "radial-gradient(ellipse 70% 80% at 50% 100%, rgba(59, 130, 246, 0.35) 0%, rgba(59, 130, 246, 0) 70%)",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          height: "100%",
          width: { xs: STAGE.xs.width, sm: STAGE.sm.width },
        }}
      >
        {PLACAS.map((placa) => (
          <Box
            key={placa.src}
            sx={{
              position: "absolute",
              left: { xs: placa.left.xs, sm: placa.left.sm },
              top: { xs: placa.top.xs, sm: placa.top.sm },
              width: { xs: STAGE.xs.cardW, sm: STAGE.sm.cardW },
              height: { xs: STAGE.xs.cardH, sm: STAGE.sm.cardH },
              borderRadius: {
                xs: `${STAGE.xs.radius}px`,
                sm: `${STAGE.sm.radius}px`,
              },
              border: placa.front ? "2px solid #3B82F6" : "1px solid #475569",
              boxShadow: placa.front ? "0 18px 40px rgba(0, 0, 0, 0.5)" : "none",
              // Rotating about the top-left corner, the way the artboard does:
              // the cards splay downwards and outwards from the fan's hinge.
              rotate: `${placa.rotate}deg`,
              transformOrigin: "0% 0%",
              overflow: "hidden",
              backgroundImage: `url(${placa.src})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        ))}
      </Box>
    </Box>
  );
}

interface ViewProps {
  onAccept: () => void;
  onSignOut: () => void;
}

/**
 * The notice itself, with no session or network concerns — kept separate so the
 * layout can be rendered and reviewed on its own.
 *
 * Two shapes of the same card: a centred poster on a desktop, and a sheet that
 * rises from the bottom edge on a phone, where a floating card with margin all
 * around would waste the little width there is.
 */
export function LegalConsentDialogView({ onAccept, onSignOut }: ViewProps) {
  const theme = useTheme();
  // Safe despite running on the client only: `open` starts false and the card
  // is mounted after the backend answers, so there is no first paint to
  // mismatch.
  const isSheet = useMediaQuery(theme.breakpoints.down("sm"));

  // The notice can sit on screen across a new year; deriving it keeps the
  // promise honest instead of freezing a year into the copy.
  const year = new Date().getFullYear();

  return (
    <Dialog
      open
      maxWidth={false}
      // No escape hatch: dismissing without a decision is not one of the options.
      disableEscapeKeyDown
      onClose={(_, reason) => {
        if (reason === "backdropClick") return;
      }}
      aria-labelledby="legal-consent-title"
      slots={isSheet ? { transition: Slide } : undefined}
      slotProps={{
        ...(isSheet ? { transition: { direction: "up" as const } } : {}),
        backdrop: {
          sx: {
            backgroundColor: "rgba(7, 11, 20, 0.72)",
            backdropFilter: "blur(4px)",
          },
        },
        paper: {
          sx: {
            // The card's own light: a touch brighter at the top, where the
            // placas are, settling into the darker base under the button.
            backgroundImage:
              "linear-gradient(180deg, #1B2740 0%, #131C30 100%)",
            backgroundColor: "#131C30",
            border: "1px solid #334155",
            overflow: "hidden",
            ...(isSheet
              ? {
                  // A sheet: the full width of the screen, hinged on the bottom
                  // edge, with only the top corners rounded.
                  m: 0,
                  width: "100%",
                  maxWidth: "100%",
                  borderRadius: "32px 32px 0 0",
                  borderBottom: "none",
                  boxShadow: "0 -30px 80px rgba(0, 0, 0, 0.5)",
                }
              : {
                  width: 580,
                  maxWidth: "calc(100% - 32px)",
                  borderRadius: "32px",
                  boxShadow: "0 40px 100px rgba(0, 0, 0, 0.55)",
                }),
          },
        },
      }}
      sx={{
        // The cookie banner is pinned at z-index 9999 and would otherwise sit
        // over this card — on a phone, right across the button. This notice
        // blocks the site until it is answered, so it has to be the thing on
        // top; the banner comes back the moment this closes.
        zIndex: 10000,
        ...(isSheet
          ? { "& .MuiDialog-container": { alignItems: "flex-end" } }
          : {}),
      }}
    >
      {/* The stage runs edge to edge, so every inset below is applied by the
          blocks themselves rather than by the content wrapper. */}
      <DialogContent sx={{ p: 0, "&.MuiDialogContent-root": { p: 0 } }}>
        {isSheet && (
          <Box
            aria-hidden
            sx={{
              width: 44,
              height: 5,
              borderRadius: "3px",
              backgroundColor: "#475569",
              mx: "auto",
              mt: "10px",
              mb: "2px",
            }}
          />
        )}

        <PlacaStage />

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: { xs: "12px", sm: "14px" },
            px: { xs: "28px", sm: "52px" },
            pt: { xs: "22px", sm: "30px" },
          }}
        >
          <Box
            sx={{
              backgroundColor: "rgba(59, 130, 246, 0.18)",
              border: "1px solid rgba(96, 165, 250, 0.5)",
              borderRadius: "999px",
              px: { xs: "12px", sm: "14px" },
              py: { xs: "5px", sm: "6px" },
            }}
          >
            <Typography
              component="span"
              sx={{
                display: "block",
                color: "#93C5FD",
                fontSize: { xs: 11, sm: 12 },
                fontWeight: 700,
                letterSpacing: "0.12em",
                lineHeight: { xs: "14px", sm: "16px" },
              }}
            >
              NUEVO
            </Typography>
          </Box>

          <Typography
            id="legal-consent-title"
            component="h2"
            sx={{
              fontFamily: "Outfit, sans-serif",
              // One line, the way it was drawn. Outfit 800 at the artboard's
              // 38px measures 492px in a browser against the 474px the card
              // leaves, so the desktop size comes down a notch; on a phone the
              // room depends on the screen, and the headline is sized from it
              // — this string takes just under 13px of width per px of type.
              fontSize: {
                xs: "clamp(19px, calc((100vw - 56px) / 13.6), 27px)",
                sm: 36,
              },
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
              color: "#F1F5F9",
              textAlign: "center",
            }}
          >
            ¡Llegó tu resumen a La Guía!
          </Typography>

          <Typography
            sx={{
              color: "#CBD5E1",
              fontSize: { xs: 15, sm: 16 },
              lineHeight: 1.5,
              textAlign: "center",
              // Spreads the last line instead of leaving a single word stranded.
              textWrap: "balance",
            }}
          >
            Mirá el ranking de los programas y canales que más viste en la
            semana, con diseños listos para compartir en redes.
          </Typography>

          <Typography
            sx={{
              color: "#93C5FD",
              fontSize: { xs: 13, sm: 14 },
              fontWeight: 600,
              lineHeight: { xs: "16px", sm: "18px" },
              textAlign: "center",
            }}
          >
            A fin de año tendrás tu resumen de {year} también.
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: { xs: "14px", sm: "16px" },
            px: { xs: "28px", sm: "52px" },
            pt: { xs: "22px", sm: "28px" },
            // On a phone the sheet reaches the bottom edge of the screen, so
            // the home indicator's strip has to be added to its own padding.
            pb: {
              xs: "calc(34px + env(safe-area-inset-bottom, 0px))",
              sm: "32px",
            },
          }}
        >
          <Button
            variant="contained"
            onClick={onAccept}
            disableElevation
            sx={{
              width: "100%",
              height: { xs: 54, sm: 56 },
              borderRadius: "999px",
              textTransform: "none",
              fontSize: { xs: 16, sm: 17 },
              fontWeight: 700,
              color: "#FFFFFF",
              backgroundImage:
                "linear-gradient(90deg, #3B82F6 0%, #2563EB 100%)",
              boxShadow: "0 10px 30px rgba(59, 130, 246, 0.4)",
              "&:hover": {
                backgroundImage:
                  "linear-gradient(90deg, #2563EB 0%, #1D4ED8 100%)",
                boxShadow: "0 10px 30px rgba(59, 130, 246, 0.5)",
              },
            }}
          >
            Continuar y ver mi resumen
          </Button>

          <Typography
            component="p"
            sx={{
              color: "#94A3B8",
              fontSize: { xs: 11, sm: 12 },
              lineHeight: 1.5,
              textAlign: "center",
              // Chrome on Android grows small text inside wide blocks on its own.
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
            {/* A real <button> here is inline-block: it carries its own box, and
                browsers size that box differently enough that the line it landed
                on ended up visibly taller than its neighbours on Android. A span
                is a true inline element, so it flows as plain text — with the
                button role and key handling added back by hand. */}
            <Box
              component="span"
              role="button"
              tabIndex={0}
              onClick={onSignOut}
              onKeyDown={(e: ReactKeyboardEvent<HTMLSpanElement>) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSignOut();
                }
              }}
              sx={{
                cursor: "pointer",
                textDecoration: "underline",
                color: "inherit",
                "&:hover": { color: "text.primary" },
              }}
            >
              cerrar sesión
            </Box>
            .
          </Typography>
        </Box>
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
