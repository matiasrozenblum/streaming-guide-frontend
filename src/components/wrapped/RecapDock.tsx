"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Box, Tooltip, Typography, useMediaQuery, useTheme } from "@mui/material";
import type { Recap } from "@/services/analytics";
import { PLACA_HEIGHT, PLACA_WIDTH } from "./placas/PlacaChrome";
import {
  PLACA_LABELS,
  PLACA_ORDER,
  Placa,
  canRender,
  type PlacaKind,
} from "./placas/Placa";

const RATIO = PLACA_WIDTH / PLACA_HEIGHT;

/**
 * Room the page needs around the cards: header, title row, the card's own
 * caption and the share dock. The card takes whatever is left, so hovering can
 * never push the actions off the screen.
 */
const CHROME_DESKTOP = 330;
const CHROME_MOBILE = 250;

/** Hovering scales the card in place — growing its box would reflow the row. */
const HOVER_SCALE = 1.06;

function useCardSize(mobile: boolean) {
  const [size, setSize] = useState({ width: 280, height: 498 });

  useEffect(() => {
    const measure = () => {
      const chrome = mobile ? CHROME_MOBILE : CHROME_DESKTOP;
      const byHeight = Math.max(300, window.innerHeight - chrome);
      // On a phone one card fills the screen; on desktop four share the row and
      // the hovered one still has to fit inside its slot once scaled.
      const byWidth = mobile
        ? window.innerWidth - 32
        : (window.innerWidth - 96 - 3 * 16) / 4 / HOVER_SCALE;

      const height = Math.min(byHeight, byWidth / RATIO);
      setSize({ width: Math.round(height * RATIO), height: Math.round(height) });
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [mobile]);

  return size;
}

/**
 * The placa at card size. It is the same component the export renders, scaled
 * by a transform rather than re-laid-out, so the card and the image cannot
 * drift apart.
 */
function PlacaCard({
  kind,
  recap,
  width,
  height,
  active,
}: {
  kind: PlacaKind;
  recap: Recap;
  width: number;
  height: number;
  active: boolean;
}) {
  return (
    <Box
      sx={{
        width,
        height,
        borderRadius: "16px",
        overflow: "hidden",
        flexShrink: 0,
        border: active ? "2px solid #3B82F6" : "1px solid #334155",
        boxShadow: active ? "0 24px 60px rgba(59,130,246,0.30)" : "none",
        transform: active ? `scale(${HOVER_SCALE})` : "none",
        transition: "transform .2s ease, box-shadow .2s ease, border-color .2s ease",
        willChange: "transform",
      }}
    >
      <Box
        sx={{
          width: PLACA_WIDTH,
          height: PLACA_HEIGHT,
          transform: `scale(${width / PLACA_WIDTH})`,
          transformOrigin: "top left",
        }}
      >
        <Placa kind={kind} recap={recap} />
      </Box>
    </Box>
  );
}

type ShareTarget = {
  id: string;
  label: string;
  icon: React.ReactNode;
  primary?: boolean;
};

const svg = (path: React.ReactNode) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
    {path}
  </svg>
);

const TARGETS: ShareTarget[] = [
  {
    id: "instagram",
    label: "Instagram",
    icon: svg(
      <>
        <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" />
      </>,
    ),
  },
  {
    id: "tiktok",
    label: "TikTok",
    icon: svg(
      <>
        <path d="M14 3v12.2a3.6 3.6 0 1 1-3.2-3.58" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14 3a5.4 5.4 0 0 0 5 4.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </>,
    ),
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    icon: svg(
      <path d="M12 3a9 9 0 0 0-7.7 13.6L3 21l4.6-1.2A9 9 0 1 0 12 3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />,
    ),
  },
  {
    id: "x",
    label: "X",
    icon: svg(<path d="M4 4l16 16M20 4L4 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />),
  },
  {
    id: "facebook",
    label: "Facebook",
    icon: svg(
      <path d="M14.5 8.5h2.2V5.6h-2.4c-2.2 0-3.6 1.4-3.6 3.6v1.6H8.4v2.9h2.3V21h3v-7.3h2.3l.4-2.9h-2.7V9.6c0-.7.3-1.1.8-1.1z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />,
    ),
  },
  {
    id: "download",
    label: "Descargar",
    primary: true,
    icon: svg(
      <path d="M12 3.5v11M7.5 10.5 12 15l4.5-4.5M4 19.5h16" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />,
    ),
  },
];

function ShareDock({
  onShare,
  busy,
}: {
  onShare: (target: string) => void;
  busy: boolean;
}) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: "10px" }}>
      {TARGETS.map((target) => (
        <Tooltip key={target.id} title={target.label} arrow>
          <Box
            component="button"
            type="button"
            aria-label={target.label}
            disabled={busy}
            onClick={() => onShare(target.id)}
            sx={{
              width: 44,
              height: 44,
              borderRadius: "999px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: busy ? "default" : "pointer",
              opacity: busy ? 0.5 : 1,
              color: "#F1F5F9",
              border: target.primary ? "none" : "1px solid #334155",
              backgroundColor: target.primary ? "#3B82F6" : "#1E293B",
              transition: "background-color .15s ease, transform .15s ease",
              "&:hover": {
                backgroundColor: target.primary ? "#2563EB" : "#334155",
                transform: "translateY(-1px)",
              },
            }}
          >
            {target.icon}
          </Box>
        </Tooltip>
      ))}
    </Box>
  );
}

function Caption({
  kind,
  index,
  total,
  strong,
}: {
  kind: PlacaKind;
  index: number;
  total: number;
  strong: boolean;
}) {
  return (
    <Box sx={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
      <Typography
        sx={{
          fontSize: strong ? 17 : 15,
          fontWeight: strong ? 700 : 600,
          color: strong ? "#F1F5F9" : "#CBD5E1",
          whiteSpace: "nowrap",
        }}
      >
        {PLACA_LABELS[kind]}
      </Typography>
      <Typography sx={{ fontSize: 13, color: "#64748B" }}>
        {index + 1} de {total}
      </Typography>
    </Box>
  );
}

/**
 * Phones get the placas as a swipeable row, one per screen, the way a story
 * reads — scroll snapping rather than a carousel library, so a flick behaves
 * like the rest of the OS. The dock stays put below and acts on whichever card
 * is snapped, because there is no hover to reveal it.
 */
function MobileCarousel({
  recap,
  kinds,
  size,
  onShare,
  busy,
}: {
  recap: Recap;
  kinds: PlacaKind[];
  size: { width: number; height: number };
  onShare: (kind: PlacaKind, target: string) => void;
  busy: boolean;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [current, setCurrent] = useState(0);

  const onScroll = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const index = Math.round(track.scrollLeft / track.clientWidth);
    setCurrent(Math.min(Math.max(index, 0), kinds.length - 1));
  }, [kinds.length]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: "12px", flexGrow: 1 }}>
      <Box
        ref={trackRef}
        onScroll={onScroll}
        sx={{
          display: "flex",
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
          overscrollBehaviorX: "contain",
        }}
      >
        {kinds.map((kind) => (
          <Box
            key={kind}
            sx={{
              minWidth: "100%",
              scrollSnapAlign: "center",
              scrollSnapStop: "always",
              display: "flex",
              justifyContent: "center",
              px: "16px",
            }}
          >
            <PlacaCard
              kind={kind}
              recap={recap}
              width={size.width}
              height={size.height}
              active={false}
            />
          </Box>
        ))}
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "10px",
          pb: "16px",
        }}
      >
        <Caption
          kind={kinds[current]}
          index={current}
          total={kinds.length}
          strong
        />
        <ShareDock
          busy={busy}
          onShare={(target) => onShare(kinds[current], target)}
        />
      </Box>
    </Box>
  );
}

export function RecapDock({
  recap,
  onShare,
  busy,
}: {
  recap: Recap;
  onShare: (kind: PlacaKind, target: string) => void;
  busy: boolean;
}) {
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down("md"));
  const size = useCardSize(mobile);
  const kinds = PLACA_ORDER.filter((kind) => canRender(kind, recap));
  const [active, setActive] = useState<PlacaKind | null>(null);

  if (kinds.length === 0) return null;

  if (mobile) {
    return (
      <MobileCarousel
        recap={recap}
        kinds={kinds}
        size={size}
        onShare={onShare}
        busy={busy}
      />
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        gap: "16px",
        px: "48px",
        pb: "24px",
        flexGrow: 1,
      }}
    >
      {kinds.map((kind, index) => {
        const isActive = active === kind;
        return (
          <Box
            key={kind}
            onMouseEnter={() => setActive(kind)}
            onMouseLeave={() => setActive((c) => (c === kind ? null : c))}
            onFocus={() => setActive(kind)}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                setActive((c) => (c === kind ? null : c));
              }
            }}
            tabIndex={0}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "14px",
              flexShrink: 0,
              outline: "none",
              // The hovered card scales up and must sit over its neighbours.
              zIndex: isActive ? 2 : 1,
              "&:focus-visible > :first-of-type": {
                outline: "2px solid #60A5FA",
                outlineOffset: "3px",
              },
            }}
          >
            <PlacaCard
              kind={kind}
              recap={recap}
              width={size.width}
              height={size.height}
              active={isActive}
            />

            {/* Pushed clear of the scaled card so it never sits under it. */}
            <Box sx={{ mt: isActive ? `${size.height * (HOVER_SCALE - 1)}px` : 0 }}>
              <Caption
                kind={kind}
                index={index}
                total={kinds.length}
                strong={isActive}
              />
            </Box>

            {/* Reserved whether or not it shows, so the row does not jump. */}
            <Box sx={{ height: 44, display: "flex", alignItems: "center" }}>
              {isActive && (
                <ShareDock busy={busy} onShare={(target) => onShare(kind, target)} />
              )}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
