"use client";

import { Box, Button, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import type { Recap } from "@/services/analytics";

/**
 * The placeholder is drawn 300px wide, so every piece inside it is written as a
 * fraction of that and multiplied by whatever width it ends up with. The width
 * is what varies — the artboard assumes a 900px window and a 13" laptop gives
 * about 660, where a fixed 300x533 box pushed the page into a scrollbar — and
 * the contents are centred inside it, so shrinking only the height would clip
 * them instead of scaling them.
 */
const DESIGN_WIDTH = 300;
const u = (n: number) => `calc(var(--sk) * ${n} / ${DESIGN_WIDTH})`;

/** 300 / 533: the placa's own proportion, which the placeholder borrows. */
const SKELETON_RATIO = 0.563;

/** One cell of the two grid rows at the foot of the placeholder. */
function Cell({ on = false }: { on?: boolean }) {
  return (
    <Box
      sx={{
        width: u(28),
        height: u(28),
        borderRadius: u(6),
        bgcolor: on ? "#3B82F6" : "#1B2435",
        flexShrink: 0,
      }}
    />
  );
}

/**
 * A placa with nothing in it yet: the shape the person is working towards,
 * dashed rather than solid so it reads as a promise and not as a failure.
 */
function PlacaSkeleton() {
  return (
    <Box
      aria-hidden
      sx={{
        // Never bigger than the artboard, never so big that the page scrolls,
        // never so small that it stops reading as a placa.
        // Measured against `svh`, not `dvh`: `dvh` grows as the phone's
        // browser retracts its toolbar on scroll, and anything sized from it
        // resizes under the reader's thumb. `svh` is the viewport with the
        // toolbar showing — the smallest it gets, and the one the page is
        // first seen at — so this is fixed from the first paint.
        "--sk": {
          xs: `clamp(120px, calc((100svh - 480px) * ${SKELETON_RATIO}), 190px)`,
          md: `clamp(200px, calc((100svh - 300px) * ${SKELETON_RATIO}), ${DESIGN_WIDTH}px)`,
        },
        width: "var(--sk)",
        height: u(533),
        flexShrink: 0,
        // On a short phone there is not enough room for the placeholder and
        // the message both, and shrinking it further turns it into a smudge.
        // It is decoration — the message, the bar and the button are the
        // content — so on those screens it steps aside instead.
        // The threshold is the window with the toolbar hidden, which is what a
        // media query measures, so it allows for the ~60px the toolbar takes
        // back when it is showing.
        "@media (max-width: 899.95px) and (max-height: 740px)": {
          display: "none",
        },
        boxSizing: "border-box",
        padding: u(36),
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: u(18),
        borderRadius: u(20),
        border: `${u(2)} dashed #475569`,
        bgcolor: "rgba(30, 41, 59, 0.45)",
      }}
    >
      <Box sx={{ width: u(170), height: u(14), borderRadius: u(7), bgcolor: "#334155" }} />
      <Box sx={{ width: u(120), height: u(14), borderRadius: u(7), bgcolor: "#334155" }} />
      <Box
        sx={{
          width: u(200),
          height: u(72),
          borderRadius: u(12),
          bgcolor: "#334155",
          mt: u(10),
        }}
      />
      <Box sx={{ display: "flex", gap: u(8), mt: u(16) }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Cell key={i} on={i === 2} />
        ))}
      </Box>
      <Box sx={{ display: "flex", gap: u(8) }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Cell key={i} />
        ))}
      </Box>
    </Box>
  );
}

/**
 * What most people see at first: the recap needs a handful of plays before it
 * says anything worth sharing. The bar turns the gate into progress instead of
 * a dead end, and the target comes from the API so it cannot drift from the
 * rule that actually withholds the recap.
 */
export function EmptyRecap({ recap }: { recap: Recap }) {
  const router = useRouter();
  const done = recap.totals.plays;
  const target = Math.max(recap.minimum_plays, 1);
  const pct = Math.min(100, Math.round((done / target) * 100));

  return (
    <Box
      sx={{
        flexGrow: 1,
        display: "flex",
        // Side by side on a desktop, stacked on a phone — where the
        // placeholder goes on top, the way the app's own screen has it.
        flexDirection: { xs: "column", md: "row" },
        alignItems: "center",
        // Centred on a desktop, where the window does not move. On a phone the
        // block is pinned to the top instead: this box grows when the browser
        // retracts its toolbar, and centring handed half of that growth to the
        // space above the placeholder, so everything slid down as you scrolled.
        justifyContent: { xs: "flex-start", md: "center" },
        gap: { xs: "16px", md: "90px" },
        px: { xs: "32px", md: "48px", lg: "120px" },
        py: { xs: "8px", md: "24px" },
      }}
    >
      <PlacaSkeleton />

      <Box
        sx={{
          width: { xs: "100%", md: 460 },
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          gap: { xs: "14px", md: "22px" },
          textAlign: { xs: "center", md: "left" },
        }}
      >
        <Typography
          component="h2"
          sx={{
            fontFamily: "Outfit, sans-serif",
            fontSize: { xs: 21, md: 34, lg: 40 },
            fontWeight: 800,
            letterSpacing: { xs: "-0.02em", md: "-0.03em" },
            lineHeight: 1.05,
            color: "#F1F5F9",
          }}
        >
          Estamos armando tu resumen
        </Typography>

        <Typography
          sx={{
            fontSize: { xs: 14, md: 17 },
            lineHeight: 1.5,
            color: "#CBD5E1",
          }}
        >
          Para construirlo necesitamos que sigas mirando programas y streamers
          en La Guía. Con unas pocas reproducciones más, tu resumen aparece acá.
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
            <Typography
              sx={{ fontSize: { xs: 12, md: 13 }, fontWeight: 600, color: "#F1F5F9" }}
            >
              Vas {done} de {target}{" "}
              {target === 1 ? "reproducción" : "reproducciones"}
            </Typography>
            <Typography sx={{ fontSize: { xs: 12, md: 13 }, color: "#94A3B8" }}>
              Meta: {target}
            </Typography>
          </Box>
          <Box
            role="progressbar"
            aria-valuenow={done}
            aria-valuemin={0}
            aria-valuemax={target}
            sx={{ height: 8, borderRadius: "4px", bgcolor: "#1E293B", overflow: "hidden" }}
          >
            <Box
              sx={{
                width: `${pct}%`,
                height: "100%",
                borderRadius: "4px",
                bgcolor: "#3B82F6",
                transition: "width .3s ease",
              }}
            />
          </Box>
        </Box>

        <Button
          variant="contained"
          disableElevation
          onClick={() => router.push("/")}
          sx={{
            alignSelf: { xs: "stretch", md: "flex-start" },
            width: { md: 260 },
            height: { xs: 48, md: 50 },
            borderRadius: "999px",
            textTransform: "none",
            fontSize: 15,
            fontWeight: 600,
          }}
        >
          Ver qué hay en vivo
        </Button>
      </Box>
    </Box>
  );
}
