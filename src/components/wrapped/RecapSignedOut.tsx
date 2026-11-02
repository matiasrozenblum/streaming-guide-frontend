"use client";

import { Box, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import LoginModal from "@/components/auth/LoginModal";
import Header from "@/components/Header";
import BottomNavigation, {
  useBottomNavHeight,
} from "@/components/BottomNavigation";

/**
 * The fan is drawn 560px wide, so every piece inside it is written as a
 * fraction of that and multiplied by the width it ends up with. That is what
 * lets the same arrangement shrink onto a phone without each placa having to
 * be positioned twice.
 */
const FAN_WIDTH = 560;
const u = (n: number) => `calc(var(--fan) * ${n} / ${FAN_WIDTH})`;

/**
 * Straight from the artboard, including the rotation about the top-left
 * corner, which is what splays them outward from the middle one.
 */
const PLACAS = [
  { src: "/img/recap-intro/left.jpg", left: 40, top: 30, rotate: -8 },
  { src: "/img/recap-intro/center.jpg", left: 205, top: 0, rotate: 0 },
  { src: "/img/recap-intro/right.jpg", left: 370, top: 30, rotate: 8 },
];

function PlacaFan() {
  return (
    <Box
      aria-hidden
      sx={{
        /**
         * A real length and not a percentage: this feeds both the width and
         * the height, and a percentage inside the height calc resolves against
         * the container's height instead of its width — which collapsed the
         * whole fan on a phone.
         */
        "--fan": {
          xs: "min(calc(100vw - 40px), 400px)",
          md: `${FAN_WIDTH}px`,
        },
        position: "relative",
        width: "var(--fan)",
        height: u(290),
        flexShrink: 0,
        mt: u(20),
      }}
    >
      {PLACAS.map((placa) => (
        <Box
          key={placa.src}
          sx={{
            position: "absolute",
            left: u(placa.left),
            top: u(placa.top),
            width: u(150),
            height: u(267),
            borderRadius: u(24),
            border: `${u(3)} solid #334155`,
            boxShadow: "0 16px 32px rgba(0, 0, 0, 0.4)",
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
 * for was the one nobody could see. The pitch and the form sit side by side —
 * the form is not a dialog over the page, it is half of it.
 */
export function RecapSignedOut() {
  const router = useRouter();
  const navHeight = useBottomNavHeight();

  return (
    <Box
      sx={{
        minHeight: "100svh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#0F172A",
        pb: navHeight
          ? `calc(${navHeight}px + env(safe-area-inset-bottom, 0px) + 8px)`
          : 0,
      }}
    >
      <Header />

      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          // Side by side on a desktop; stacked on a phone, with the pitch
          // first so the form is not the first thing a visitor meets.
          flexDirection: { xs: "column", md: "row" },
          alignItems: "center",
          justifyContent: "center",
          gap: { xs: "28px", md: "70px" },
          px: { xs: "20px", md: "40px", lg: "70px" },
          py: { xs: "24px", md: "32px" },
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: { md: 700 },
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
            textAlign: "center",
          }}
        >
          <Typography
            component="h1"
            sx={{
              maxWidth: 620,
              fontFamily: "Outfit, sans-serif",
              fontSize: { xs: 28, md: 36, lg: 44 },
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
              color: "#F1F5F9",
            }}
          >
            Tu resumen, en placas para compartir
          </Typography>

          <Typography
            sx={{
              maxWidth: 600,
              fontSize: { xs: 15, md: 16 },
              lineHeight: 1.5,
              color: "#CBD5E1",
            }}
          >
            Mi resumen es tu espacio personal en La Guía: los programas y
            streamers que más viste en la semana y en el mes, con el diseño
            listo para subir a tus historias.
          </Typography>

          {/* Asking a visitor for an account needs a reason, and the reason is
              not obvious: the recap is built out of what they watch, so there
              is nothing to build until there is somebody to build it for. */}
          <Box
            sx={{
              mt: "4px",
              width: "100%",
              maxWidth: 560,
              display: "flex",
              alignItems: "center",
              gap: "14px",
              px: "18px",
              py: "14px",
              borderRadius: "12px",
              backgroundColor: "rgba(59, 130, 246, 0.10)",
              border: "1px solid rgba(59, 130, 246, 0.25)",
              textAlign: "left",
            }}
          >
            <LockOutlinedIcon sx={{ fontSize: 22, color: "#60A5FA", flexShrink: 0 }} />
            <Typography sx={{ fontSize: 14, lineHeight: "21px", color: "#E2E8F0" }}>
              <Box component="span" sx={{ color: "#F1F5F9", fontWeight: 600 }}>
                ¿Por qué te pedimos una cuenta?
              </Box>{" "}
              Para armar tu resumen necesitamos saber qué mirás: con tu usuario
              vamos acumulando los programas que viste.
            </Typography>
          </Box>

          <PlacaFan />
        </Box>

        <Box
          sx={{
            width: "100%",
            maxWidth: 444,
            flexShrink: 0,
            // The card is its own surface in the artboard; the steps inside
            // paint their own background, which would cover it.
            "& .MuiDialogTitle-root, & .MuiDialogContent-root": {
              backgroundColor: "transparent",
            },
          }}
        >
          {/* The same component the grid opens as a dialog, inline. Signing in
              only changes the session on the client, and this page decides what
              to render on the server, so it has to be asked again. */}
          <LoginModal open variant="inline" onClose={() => router.refresh()} />
        </Box>
      </Box>

      <BottomNavigation />
    </Box>
  );
}
