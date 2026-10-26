"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
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
 * Caption, share dock and the air around them — the row gets what is left.
 *
 * Desktop: 16 top + card + 12 + caption + 12 + dock(44) + 16 bottom.
 */
const BLOCK_DESKTOP = 120;
const BLOCK_MOBILE = 152;

const GAP_DESKTOP = 20;
const PAD_DESKTOP = 40;

/** A slide leaves the next placa visibly peeking at both sides, as designed. */
const SLIDE_WIDTH_RATIO = 0.74;
const GAP_MOBILE = 16;

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

interface Metrics {
  /** Desktop: height of every card — they are all the same size. */
  card: number;
  /** Mobile: width of one slide. */
  slide: number;
  viewportWidth: number;
}

/**
 * Card sizes, measured rather than guessed.
 *
 * The space the row may use is the viewport minus wherever the row actually
 * starts, so moving the header or the title row cannot leave a stale constant
 * behind. Two details matter:
 *
 * - the row's offset is taken from the document, not the viewport, so it does
 *   not drift as the page scrolls;
 * - the viewport height comes from a `100svh` probe instead of `innerHeight`.
 *   `innerHeight` grows when a phone's address bar slides away mid-scroll, and
 *   the cards were visibly inflating along with it.
 */
function useMetrics(count: number) {
  const rowRef = useRef<HTMLDivElement | null>(null);
  const probeRef = useRef<HTMLDivElement | null>(null);
  const [metrics, setMetrics] = useState<Metrics>({
    card: 460,
    slide: 280,
    viewportWidth: 1280,
  });

  const measure = useCallback(() => {
    const row = rowRef.current;
    if (!row || count === 0) return;

    const viewportWidth = window.innerWidth;
    const viewportHeight = probeRef.current?.clientHeight || window.innerHeight;
    const offsetTop = row.getBoundingClientRect().top + window.scrollY;
    const room = (block: number) =>
      Math.max(260, viewportHeight - offsetTop - block);

    // Both layouts are solved on every pass, deliberately. Measuring only the
    // live one would mean trusting `useMediaQuery`, which reports desktop on
    // the first client render — one stale pass and the other layout renders at
    // zero.
    const slide = Math.min(
      viewportWidth * SLIDE_WIDTH_RATIO,
      room(BLOCK_MOBILE) * RATIO,
    );

    // Every card is the same size, so the row simply divides the width it has
    // and takes the height only when that is the tighter of the two.
    const usable = Math.max(
      240,
      viewportWidth - 2 * PAD_DESKTOP - (count - 1) * GAP_DESKTOP,
    );
    const card = Math.min(room(BLOCK_DESKTOP), usable / count / RATIO);

    setMetrics({ card, slide, viewportWidth });
  }, [count]);

  useIsomorphicLayoutEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("orientationchange", measure);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("orientationchange", measure);
    };
  }, [measure]);

  return { rowRef, probeRef, metrics };
}

/** Reads `100svh`, which `innerHeight` cannot be trusted to match on a phone. */
function ViewportProbe({ innerRef }: { innerRef: React.Ref<HTMLDivElement> }) {
  return (
    <Box
      ref={innerRef}
      aria-hidden
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        width: 0,
        height: "100svh",
        visibility: "hidden",
        pointerEvents: "none",
      }}
    />
  );
}

/**
 * The placa at card size. It is the same component the export renders, scaled
 * by a transform rather than re-laid-out, so the card and the image cannot
 * drift apart.
 */
function PlacaCard({
  kind,
  recap,
  height,
  active,
}: {
  kind: PlacaKind;
  recap: Recap;
  height: number;
  active: boolean;
}) {
  const width = height * RATIO;
  return (
    <Box
      sx={{
        width,
        height,
        borderRadius: "16px",
        overflow: "hidden",
        flexShrink: 0,
        border: active ? "2px solid #3B82F6" : "1px solid #334155",
        boxShadow: active ? "0 20px 50px rgba(59,130,246,0.28)" : "none",
        transition: "box-shadow .2s ease, border-color .2s ease",
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
    label: "Guardar",
    primary: true,
    icon: svg(
      <path d="M12 3.5v11M7.5 10.5 12 15l4.5-4.5M4 19.5h16" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />,
    ),
  },
];

function ShareDock({
  onShare,
  busy,
  labelled = false,
}: {
  onShare: (target: string) => void;
  busy: boolean;
  /** Phones have the room and no tooltips to fall back on. */
  labelled?: boolean;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        gap: labelled ? "6px" : "10px",
      }}
    >
      {TARGETS.map((target) => {
        const button = (
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
        );

        if (!labelled) {
          return (
            <Tooltip key={target.id} title={target.label} arrow>
              {button}
            </Tooltip>
          );
        }

        return (
          <Box
            key={target.id}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "6px",
              width: 58,
            }}
          >
            {button}
            <Typography
              sx={{ fontSize: 11, color: "#94A3B8", whiteSpace: "nowrap" }}
            >
              {target.label}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}

/**
 * The label under a card. Its size never changes with hover — only the share
 * buttons appearing below mark which card is selected, so the row of captions
 * stays a steady baseline to read across.
 */
function Caption({
  kind,
  index,
  total,
  active,
}: {
  kind: PlacaKind;
  index: number;
  total: number;
  active: boolean;
}) {
  return (
    <Box sx={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
      <Typography
        sx={{
          fontFamily: "Outfit, sans-serif",
          fontSize: 15,
          fontWeight: 700,
          lineHeight: "20px",
          color: active ? "#F1F5F9" : "#CBD5E1",
          whiteSpace: "nowrap",
          transition: "color .2s ease",
        }}
      >
        {PLACA_LABELS[kind]}
      </Typography>
      <Typography sx={{ fontSize: 13, color: "#94A3B8", whiteSpace: "nowrap" }}>
        {index + 1} de {total}
      </Typography>
    </Box>
  );
}

/**
 * Phones get the placas as a swipeable row the way a story reads: one centred
 * card with the next one peeking at either side, so it is obvious there is more
 * to swipe to. Scroll snapping rather than a carousel library, so a flick
 * behaves like the rest of the OS. The dock stays put below and acts on
 * whichever card is snapped, because there is no hover to reveal it.
 */
function MobileCarousel({
  recap,
  kinds,
  slide,
  viewportWidth,
  onShare,
  busy,
}: {
  recap: Recap;
  kinds: PlacaKind[];
  slide: number;
  viewportWidth: number;
  onShare: (kind: PlacaKind, target: string) => void;
  busy: boolean;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [current, setCurrent] = useState(0);
  const sidePad = Math.max(0, (viewportWidth - slide) / 2);

  /**
   * Which placa the caption and the share buttons belong to: whichever slide
   * sits closest to the middle of the scrollport.
   *
   * Measured from the slides themselves rather than dividing `scrollLeft` by a
   * slide width plus a gap — that arithmetic drifts a couple of pixels against
   * where snapping actually lands, and breaks outright if the slides are ever
   * sized unevenly.
   */
  const onScroll = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const middle = track.scrollLeft + track.clientWidth / 2;
    let best = 0;
    let bestDistance = Infinity;
    Array.from(track.children).forEach((child, index) => {
      const slide = child as HTMLElement;
      const distance = Math.abs(slide.offsetLeft + slide.offsetWidth / 2 - middle);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = index;
      }
    });
    setCurrent(best);
  }, []);

  return (
    <>
      <Box
        ref={trackRef}
        onScroll={onScroll}
        sx={{
          display: "flex",
          gap: `${GAP_MOBILE}px`,
          px: `${sidePad}px`,
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
              flex: "0 0 auto",
              scrollSnapAlign: "center",
              scrollSnapStop: "always",
            }}
          >
            <PlacaCard
              kind={kind}
              recap={recap}
              height={slide / RATIO}
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
          pt: "14px",
          pb: "16px",
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
          <Typography sx={{ fontSize: 17, fontWeight: 700, color: "#F1F5F9" }}>
            {PLACA_LABELS[kinds[current]]}
          </Typography>
          <Typography sx={{ fontSize: 13, color: "#64748B" }}>
            {current + 1} de {kinds.length} · Deslizá para ver más
          </Typography>
        </Box>
        <ShareDock
          busy={busy}
          labelled
          onShare={(target) => onShare(kinds[current], target)}
        />
      </Box>
    </>
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
  const kinds = PLACA_ORDER.filter((kind) => canRender(kind, recap));
  const [active, setActive] = useState<PlacaKind | null>(null);
  const { rowRef, probeRef, metrics } = useMetrics(kinds.length);

  if (kinds.length === 0) return null;

  if (mobile) {
    return (
      <Box ref={rowRef} sx={{ display: "flex", flexDirection: "column" }}>
        <ViewportProbe innerRef={probeRef} />
        <MobileCarousel
          recap={recap}
          kinds={kinds}
          slide={metrics.slide}
          viewportWidth={metrics.viewportWidth}
          onShare={onShare}
          busy={busy}
        />
      </Box>
    );
  }

  return (
    <Box
      ref={rowRef}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: `${GAP_DESKTOP}px`,
        px: `${PAD_DESKTOP}px`,
        py: "16px",
        flexGrow: 1,
      }}
    >
      <ViewportProbe innerRef={probeRef} />

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
              gap: "12px",
              flexShrink: 0,
              outline: "none",
              "&:focus-visible > :first-of-type": {
                outline: "2px solid #60A5FA",
                outlineOffset: "3px",
              },
            }}
          >
            <PlacaCard
              kind={kind}
              recap={recap}
              height={metrics.card}
              active={isActive}
            />

            <Caption
              kind={kind}
              index={index}
              total={kinds.length}
              active={isActive}
            />

            {/*
              The slot is reserved whether or not the dock shows, and the dock
              itself is taken out of flow: it is wider than a card, so leaving
              it in would widen this column the moment it appears and shove the
              whole row sideways.
            */}
            <Box sx={{ height: 44, width: "100%", position: "relative" }}>
              {isActive && (
                <Box
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: "50%",
                    transform: "translateX(-50%)",
                  }}
                >
                  <ShareDock
                    busy={busy}
                    onShare={(target) => onShare(kind, target)}
                  />
                </Box>
              )}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
