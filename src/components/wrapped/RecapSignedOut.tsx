"use client";

import { Box, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import LoginModal from "@/components/auth/LoginModal";
import Header from "@/components/Header";
import BottomNavigation, {
  useBottomNavHeight,
} from "@/components/BottomNavigation";

/**
 * The three placas, fanned, as a glimpse of what is behind the form. The
 * coordinates come from the same artboard the welcome notice uses, so the two
 * places that show a recap to somebody who has not seen one agree with each
 * other.
 */
const PLACAS = [
  { src: "/img/recap-intro/left.jpg", rotate: -8, lift: 18, z: 1 },
  { src: "/img/recap-intro/center.jpg", rotate: 0, lift: 0, z: 2 },
  { src: "/img/recap-intro/right.jpg", rotate: 8, lift: 18, z: 1 },
];

function PlacaFan() {
  return (
    <Box
      aria-hidden
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        gap: { xs: "8px", md: "14px" },
        width: "100%",
      }}
    >
      {PLACAS.map((placa) => (
        <Box
          key={placa.src}
          sx={{
            width: { xs: 92, sm: 120, md: 148 },
            aspectRatio: "9 / 16",
            borderRadius: { xs: "10px", md: "14px" },
            border: "1px solid #475569",
            backgroundImage: `url(${placa.src})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            boxShadow: "0 18px 40px rgba(0, 0, 0, 0.45)",
            rotate: `${placa.rotate}deg`,
            mt: `${placa.lift}px`,
            zIndex: placa.z,
          }}
        />
      ))}
    </Box>
  );
}

/**
 * What /mi-resumen shows to somebody who is not signed in.
 *
 * Until now the section was hidden from visitors and the page bounced them to
 * the grid, which is the worst of both worlds: the feature most worth signing
 * up for was the one nobody could see. The pitch and the form sit side by side
 * — the form is not a dialog over the page, it is half of it.
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
        background: "linear-gradient(135deg,#0f172a 0%,#131d33 100%)",
        pt: { xs: "8px", sm: "10px" },
        pb: navHeight
          ? `calc(${navHeight}px + env(safe-area-inset-bottom, 0px) + 8px)`
          : { xs: "8px", sm: "4px" },
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
          gap: { xs: "28px", md: "64px" },
          px: { xs: "20px", md: "48px" },
          py: { xs: "24px", md: "32px" },
        }}
      >
        <Box
          sx={{
            flex: { md: "1 1 0" },
            maxWidth: { md: 560 },
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: { xs: "18px", md: "28px" },
            textAlign: "center",
          }}
        >
          <Box>
            <Typography
              component="h1"
              sx={{
                fontFamily: "Outfit, sans-serif",
                fontSize: { xs: 26, md: 40 },
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
                mt: { xs: "10px", md: "14px" },
                fontSize: { xs: 15, md: 17 },
                lineHeight: 1.5,
                color: "#CBD5E1",
              }}
            >
              Los programas y streamers que más viste en la semana y en el mes,
              con el diseño listo para subir a tus historias. Creá tu cuenta y
              empezá a armar el tuyo.
            </Typography>
          </Box>

          <PlacaFan />
        </Box>

        <Box sx={{ width: "100%", maxWidth: 440, flexShrink: 0 }}>
          {/* The same component the grid opens as a dialog, inline. Signing in
              only changes the session on the client, and this page decides
              what to render on the server, so it has to be asked again. */}
          <LoginModal
            open
            variant="inline"
            onClose={() => router.refresh()}
          />
        </Box>
      </Box>

      <BottomNavigation />
    </Box>
  );
}
