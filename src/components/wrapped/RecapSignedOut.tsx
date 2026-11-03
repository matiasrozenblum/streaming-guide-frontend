"use client";

import { useCallback, useState } from "react";
import { Box, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import LoginModal from "@/components/auth/LoginModal";
import Header from "@/components/Header";
import BottomNavigation, {
  useBottomNavHeight,
} from "@/components/BottomNavigation";

/**
 * Each fan is written as fractions of the width it was drawn at, so one set of
 * coordinates survives every screen. The phone artboard shows two placas and
 * the desktop one three — on 390px a third is a sliver, which is why they
 * differ rather than one being a scaled copy of the other.
 */
const DESKTOP_FAN = 560;
const MOBILE_FAN = 390;

/**
 * Tall enough to hold every placa, which is not the artboard's 290. The placas
 * rotate about their top-left corner, so the one tilted clockwise swings its
 * bottom-left corner lower than the others: 322 against the 300 of its mirror
 * image. Sizing the stage by eye cut that one placa straight across the bottom.
 */
const DESKTOP_FAN_H = 322;

const DESKTOP_PLACAS = [
  { src: "/img/recap-intro/left.jpg", left: 40, top: 30, w: 150, h: 267, r: 16, b: 3, rotate: -8 },
  { src: "/img/recap-intro/center.jpg", left: 205, top: 0, w: 150, h: 267, r: 16, b: 3, rotate: 0 },
  { src: "/img/recap-intro/right.jpg", left: 370, top: 30, w: 150, h: 267, r: 16, b: 3, rotate: 8 },
];

const MOBILE_PLACAS = [
  { src: "/img/recap-intro/left.jpg", left: 62, top: 22, w: 128, h: 228, r: 16, b: 2, rotate: -8 },
  { src: "/img/recap-intro/center.jpg", left: 176, top: 0, w: 150, h: 267, r: 18, b: 2, rotate: 0 },
];

function Fan({
  design,
  placas,
  height,
  sx,
}: {
  design: number;
  placas: typeof DESKTOP_PLACAS;
  height: number;
  sx?: object;
}) {
  const u = (n: number) => `calc(var(--fan) * ${n} / ${design})`;

  return (
    <Box
      aria-hidden
      sx={{
        position: "relative",
        width: "var(--fan)",
        height: u(height),
        flexShrink: 0,
        // The phone stage is shorter than its placas on purpose; the desktop
        // one is sized to hold them, and this keeps the shadows off the text.
        overflow: "hidden",
        ...sx,
      }}
    >
      {placas.map((placa) => (
        <Box
          key={placa.src}
          sx={{
            position: "absolute",
            left: u(placa.left),
            top: u(placa.top),
            width: u(placa.w),
            height: u(placa.h),
            borderRadius: u(placa.r),
            border: `${u(placa.b)} solid #334155`,
            boxShadow: "0 12px 24px rgba(0, 0, 0, 0.4)",
            rotate: `${placa.rotate}deg`,
            transformOrigin: "0% 0%",
            backgroundImage: `url(${placa.src})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      ))}
    </Box>
  );
}

/**
 * What /mi-resumen shows to somebody who is not signed in.
 *
 * The section used to be hidden from visitors and the page bounced them to the
 * grid, which is the worst of both worlds: the feature most worth signing up
 * for was the one nobody could see.
 *
 * One tree for both shapes, not two. The form holds the whole state of the
 * sign-up — e-mail, code, the account being created — and mounting it twice,
 * once per breakpoint, would run two of those side by side.
 */
export function RecapSignedOut() {
  const router = useRouter();
  const navHeight = useBottomNavHeight();

  /**
   * Set once the form leaves the e-mail step. On a phone the panel then takes
   * the whole screen: the steps that follow need the room the pitch is using.
   */
  const [expanded, setExpanded] = useState(false);
  const handlePhase = useCallback((phase: "email" | "flow") => {
    setExpanded(phase === "flow");
  }, []);

  const ease = "cubic-bezier(.22,.61,.36,1)";

  return (
    <Box
      sx={{
        height: { xs: "100svh", md: "auto" },
        minHeight: { md: "100svh" },
        display: "flex",
        flexDirection: "column",
        overflow: { xs: "hidden", md: "visible" },
        backgroundColor: "#0F172A",
        // The header's logo is taller than the header itself (11vh against
        // 10vh) and overflows on purpose; without this it meets the top of the
        // window instead of a sliver of page. The same figure the grid and
        // Streamers use, so the logo does not sit 6px higher here than on
        // every other page.
        pt: { xs: 1, sm: 2 },
        pb: {
          xs: 0,
          md: navHeight
            ? `calc(${navHeight}px + env(safe-area-inset-bottom, 0px) + 8px)`
            : 0,
        },
      }}
    >
      <Header />

      <Box
        sx={{
          flexGrow: 1,
          minHeight: 0,
          display: "flex",
          // Stacked on a phone — there are no two halves to divide — and side
          // by side from md, which is the wide artboard.
          flexDirection: { xs: "column", md: "row" },
          alignItems: { md: "center" },
          justifyContent: { md: "center" },
          gap: { md: "70px" },
          px: { md: "40px", lg: "70px" },
          py: { md: "32px" },
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: { md: 700 },
            flexShrink: { md: 0 },
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: { md: "16px" },
            textAlign: "center",
            "--fan": {
              xs: `min(100vw, ${MOBILE_FAN}px)`,
              /**
               * A length and not a percentage: it feeds the height too, where
               * a percentage resolves against the container's height. Never
               * wider than drawn and never so tall that the page scrolls — the
               * artboard assumes 900px of window, a laptop gives about 700.
               */
              md: `min(${DESKTOP_FAN}px, calc((100svh - 470px) * ${DESKTOP_FAN} / ${DESKTOP_FAN_H}))`,
            },
            // Collapsing the pitch is the animation: the panel below takes the
            // room it gives up, which reads as the panel growing.
            flexGrow: { xs: expanded ? 0 : 1, md: 0 },
            flexBasis: { xs: expanded ? 0 : "auto", md: "auto" },
            opacity: { xs: expanded ? 0 : 1, md: 1 },
            overflow: { xs: "hidden", md: "visible" },
            transition: `flex-grow .34s ${ease}, flex-basis .34s ${ease}, opacity .2s ease`,
          }}
        >
          <Typography
            component="h1"
            sx={{
              maxWidth: { xs: 340, md: 620 },
              px: { xs: "24px", md: 0 },
              pt: { xs: "14px", md: 0 },
              fontFamily: "Outfit, sans-serif",
              fontSize: { xs: 27, md: 36, lg: 44 },
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
              color: "#F1F5F9",
              "@media (min-width: 900px) and (max-height: 800px)": {
                fontSize: 36,
              },
            }}
          >
            Tu resumen, en placas para compartir
          </Typography>

          {/* Two readings of the same idea: the phone artboard trims it to a
              line and a half, which is all there is room for above the fan. */}
          <Typography
            sx={{
              display: { xs: "block", md: "none" },
              maxWidth: 320,
              px: "24px",
              mt: "8px",
              fontSize: 14,
              lineHeight: "21px",
              color: "#CBD5E1",
            }}
          >
            Los programas y streamers que más viste, listos para subir a tus
            historias.
          </Typography>
          <Typography
            sx={{
              display: { xs: "none", md: "block" },
              maxWidth: 600,
              fontSize: 16,
              lineHeight: 1.5,
              color: "#CBD5E1",
            }}
          >
            Mi resumen es tu espacio personal en La Guía: los programas y
            streamers que más viste en la semana y en el mes, con el diseño
            listo para subir a tus historias.
          </Typography>

          <Fan
            design={MOBILE_FAN}
            placas={MOBILE_PLACAS}
            height={176}
            sx={{
              display: { xs: "block", md: "none" },
              mt: "14px",
              /**
               * What gives when the screen is short. The fan is a cropped
               * stage already, so losing more of it costs nothing; the
               * paragraph under it is text, and half a sentence looks broken.
               */
              flexShrink: 1,
              minHeight: 0,
            }}
          />

          {/* Why an account at all, which is the question a wall provokes and
              nobody was answering. */}
          <Box
            sx={{
              // Its own margins, not a full width plus margins: that
              // overflowed the screen by exactly the two gutters.
              flexShrink: 0,
              width: { xs: "calc(100% - 40px)", md: "100%" },
              maxWidth: { md: 560 },
              mt: { xs: "14px", md: "4px" },
              px: { xs: "14px", md: "18px" },
              py: { xs: "12px", md: "14px" },
              boxSizing: "border-box",
              alignSelf: "center",
              display: "flex",
              alignItems: "center",
              gap: { xs: "12px", md: "14px" },
              borderRadius: "12px",
              backgroundColor: { xs: "#13223E", md: "rgba(59, 130, 246, 0.10)" },
              border: "1px solid",
              borderColor: { xs: "#1A325D", md: "rgba(59, 130, 246, 0.25)" },
              textAlign: "left",
            }}
          >
            <LockOutlinedIcon
              sx={{ fontSize: { xs: 20, md: 22 }, color: "#60A5FA", flexShrink: 0 }}
            />
            <Typography
              sx={{
                fontSize: { xs: 12.5, md: 14 },
                lineHeight: { xs: "18px", md: "21px" },
                color: "#E2E8F0",
              }}
            >
              <Box
                component="span"
                sx={{ color: "#F1F5F9", fontWeight: 600 }}
              >
                ¿Por qué
                <Box component="span" sx={{ display: { xs: "none", md: "inline" } }}>
                  {" "}te pedimos
                </Box>{" "}
                una cuenta?
              </Box>{" "}
              Para armar tu resumen necesitamos saber qué mirás: con tu usuario
              vamos sumando los programas que viste.
            </Typography>
          </Box>

          <Fan
            design={DESKTOP_FAN}
            placas={DESKTOP_PLACAS}
            height={DESKTOP_FAN_H}
            sx={{ display: { xs: "none", md: "block" }, mt: "20px" }}
          />
        </Box>

        <Box
          sx={{
            width: "100%",
            maxWidth: { md: 444 },
            flexShrink: 0,
            // On a phone the form is a panel hinged to the bottom edge, which
            // grows into the whole screen once the steps begin.
            flexGrow: { xs: expanded ? 1 : 0, md: 0 },
            minHeight: 0,
            overflowY: { xs: expanded ? "auto" : "visible", md: "visible" },
            backgroundColor: { xs: "#141C30", md: "transparent" },
            borderTop: { xs: "1px solid #334155", md: "none" },
            borderTopLeftRadius: { xs: "20px", md: 0 },
            borderTopRightRadius: { xs: "20px", md: 0 },
            px: { xs: "20px", md: 0 },
            pt: { xs: "18px", md: 0 },
            // The bottom bar is fixed, so it sits over whatever reaches the
            // end of the panel; its height has to be reserved here.
            pb: {
              xs: navHeight
                ? `calc(${navHeight}px + env(safe-area-inset-bottom, 0px) + 14px)`
                : "14px",
              md: 0,
            },
            transition: `flex-grow .34s ${ease}`,
            // The panel is its own surface; the steps inside paint their own
            // background, which would cover it.
            "& .MuiDialogTitle-root, & .MuiDialogContent-root": {
              backgroundColor: "transparent",
              // Zero on a phone because the panel already supplies its 20px,
              // and the card's own 24px from md up. A bare `undefined` does
              // not override the previous breakpoint, so it was zero at both
              // and the form sat flush against the card's edges.
              px: { xs: 0, md: "24px" },
            },
            "& .MuiPaper-root": {
              backgroundColor: { xs: "transparent", md: "#141C30" },
            },
          }}
        >
          <LoginModal
            open
            variant="inline"
            onPhaseChange={handlePhase}
            onClose={() => router.refresh()}
          />
        </Box>
      </Box>

      <BottomNavigation />
    </Box>
  );
}
