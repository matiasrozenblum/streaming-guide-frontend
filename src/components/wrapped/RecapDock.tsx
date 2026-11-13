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
 * What sits under a card: its caption, a breath, and the share buttons.
 *
 * Every pixel here is one the placa does not get. A 9:16 card inside a
 * landscape window is starved of height long before it runs out of width — on
 * a 13" laptop the whole page is barely 660px tall — so this block is kept to
 * the smallest it can still be read at.
 */
const CAPTION_HEIGHT = 18;
const CAPTION_GAP = 6;
const DOCK_HEIGHT = 34;
const CHROME_DESKTOP = CAPTION_HEIGHT + CAPTION_GAP + DOCK_HEIGHT;

/** 14 top + title block(38) + 10 + buttons(44) + 16 bottom. */
const ACTIONS_MOBILE = 44;
const BLOCK_MOBILE = 14 + 38 + 10 + ACTIONS_MOBILE + 16;

const GAP_MIN = 20;
const PAD_DESKTOP = 40;

/** The card's border, which `box-sizing: border-box` takes out of its width. */
const CARD_BORDER = 2;

/**
 * How much the placa under the mouse grows.
 *
 * Small on purpose, and not only because the old 1.1 felt violent: the row is
 * solved so the *hovered* card is as tall as the row allows, which means a
 * bigger scale buys nothing at the top and only shrinks the three cards that
 * are sitting still. 6% is enough to read as "this one".
 *
 * It grows with a transform rather than in layout, so hovering moves exactly
 * one card and never reflows the row.
 */
const HOVER_SCALE = 1.06;

/** Half the growth: the air a hovered card needs above, below and either side. */
function clearance(card: number): number {
  return Math.ceil((card * (HOVER_SCALE - 1)) / 2);
}

/** A slide leaves the next placa visibly peeking at both sides, as designed. */
const SLIDE_WIDTH_RATIO = 0.74;
const GAP_MOBILE = 16;

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

interface Metrics {
  /** Desktop: height of every card — they are all the same size. */
  card: number;
  /** Desktop: gap between cards, wide enough to absorb the hover. */
  gap: number;
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
    gap: GAP_MIN,
    slide: 280,
    viewportWidth: 1280,
  });

  const measure = useCallback(() => {
    const row = rowRef.current;
    if (!row || count === 0) return;

    const viewportWidth = window.innerWidth;
    const viewportHeight = probeRef.current?.clientHeight || window.innerHeight;
    const offsetTop = row.getBoundingClientRect().top + window.scrollY;
    // Whatever the page keeps for itself below the row. Read rather than
    // hardcoded, for the same reason the offset above it is.
    const tail = row.parentElement
      ? parseFloat(getComputedStyle(row.parentElement).paddingBottom) || 0
      : 0;
    const room = (block: number) =>
      Math.max(260, viewportHeight - offsetTop - tail - block);

    // Both layouts are solved on every pass, deliberately. Measuring only the
    // live one would mean trusting `useMediaQuery`, which reports desktop on
    // the first client render — one stale pass and the other layout renders at
    // zero.
    const slide = Math.min(
      viewportWidth * SLIDE_WIDTH_RATIO,
      room(BLOCK_MOBILE) * RATIO,
    );

    // Height first, because height is what runs out. The row holds the card,
    // the clearance it grows into above and below, and the chrome underneath;
    // since each clearance is half the growth, that comes to `card * scale`.
    // Which is the point: the *hovered* card is exactly as tall as the row
    // allows, whatever the scale, so a gentler hover costs nothing at the top
    // and leaves the three resting cards bigger.
    let card = room(CHROME_DESKTOP) / HOVER_SCALE;
    let width = card * RATIO;
    let gap = Math.max(GAP_MIN, Math.ceil(width * (HOVER_SCALE - 1)));

    // Width only bites on a window that is wide *and* tall. The gap grows with
    // the card so a hovered one never reaches its neighbour.
    const usable = Math.max(240, viewportWidth - 2 * PAD_DESKTOP);
    if (count * width + (count - 1) * gap > usable) {
      // Settle the gap first and spend what is left on the cards, so the row
      // lands on the usable width exactly rather than a pixel past it.
      gap = Math.max(
        GAP_MIN,
        Math.ceil(
          (usable / (count + (count - 1) * (HOVER_SCALE - 1))) *
            (HOVER_SCALE - 1),
        ),
      );
      width = (usable - (count - 1) * gap) / count;
      card = width / RATIO;
    }

    setMetrics({ card, gap, slide, viewportWidth });
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
  scale = 1,
}: {
  kind: PlacaKind;
  recap: Recap;
  height: number;
  active: boolean;
  /** How much to grow by while hovered. Layout size never changes. */
  scale?: number;
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
        position: "relative",
        zIndex: active ? 2 : 1,
        // A transform, not a bigger box: growing in layout shoved every other
        // card sideways and the whole row lurched. Nothing moves but this one.
        transform: active ? `scale(${scale})` : "none",
        // Constant width, colour-only change — a border that thickens on hover
        // reflows the placa inside it by a pixel.
        border: `${CARD_BORDER}px solid`,
        borderColor: active ? "#3B82F6" : "#334155",
        boxShadow: active ? "0 18px 44px rgba(2,6,23,0.55)" : "none",
        transition:
          "transform .22s cubic-bezier(.22,.61,.36,1), box-shadow .22s ease, border-color .22s ease",
      }}
    >
      <Box
        sx={{
          width: PLACA_WIDTH,
          height: PLACA_HEIGHT,
          transform: `scale(${(width - 2 * CARD_BORDER) / PLACA_WIDTH})`,
          transformOrigin: "top left",
        }}
      >
        <Placa kind={kind} recap={recap} />
      </Box>
    </Box>
  );
}

const svg = (path: React.ReactNode) => (
  <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" aria-hidden>
    {path}
  </svg>
);

/**
 * Two actions, on every screen.
 *
 * A browser cannot hand a file to a named app: Instagram Stories wants
 * `instagram-stories://` plus the pasteboard on iOS, or the
 * `com.instagram.share.ADD_TO_STORY` intent on Android, and neither is
 * reachable from a page. The deep links a browser does accept carry a link and
 * no image. So a row of per-network buttons on the web promises something it
 * cannot do; those belong in the native apps, where the intents exist.
 */
const ACTIONS = [
  {
    id: "link",
    label: "Compartir",
    primary: true,
    icon: svg(
      <>
        <path d="M10.5 13.5a3.5 3.5 0 0 0 5 0l3-3a3.54 3.54 0 0 0-5-5l-1.2 1.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M13.5 10.5a3.5 3.5 0 0 0-5 0l-3 3a3.54 3.54 0 0 0 5 5l1.2-1.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </>,
    ),
  },
  {
    id: "download",
    label: "Descargar",
    icon: svg(
      <path d="M12 3.5v11M7.5 10.5 12 15l4.5-4.5M4 19.5h16" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />,
    ),
  },
];

/**
 * Below this the two labels stop fitting side by side inside the placa.
 * Measured, not guessed: "Descargar" in Outfit 600 at 12.5px is 62px, and a
 * button is 8 + icon(16) + 6 + label + 8, so each needs 100px and the pair
 * needs 208 plus the gap. 224 leaves a few pixels for a different fallback
 * font rather than clipping on the exact boundary.
 */
const LABELLED_FROM = 224;

function ShareActions({
  width,
  height = DOCK_HEIGHT,
  busy,
  onShare,
}: {
  /** The placa's resting width — the two buttons fill exactly that. */
  width: number;
  /** Taller on a phone, where these are thumb targets rather than cursor ones. */
  height?: number;
  busy: boolean;
  onShare: (target: string) => void;
}) {
  const labelled = width >= LABELLED_FROM;

  return (
    <Box
      sx={{
        display: "flex",
        gap: "8px",
        width: `${width}px`,
        height: `${height}px`,
      }}
    >
      {ACTIONS.map((action) => (
        <Tooltip key={action.id} title={labelled ? "" : action.label} arrow>
          <Box
            component="button"
            type="button"
            aria-label={action.label}
            disabled={busy}
            onClick={() => onShare(action.id)}
            sx={{
              flex: 1,
              minWidth: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              px: "8px",
              borderRadius: "999px",
              cursor: busy ? "default" : "pointer",
              opacity: busy ? 0.5 : 1,
              color: "#F1F5F9",
              fontFamily: "Outfit, sans-serif",
              border: action.primary ? "none" : "1px solid #334155",
              backgroundColor: action.primary ? "#3B82F6" : "#1E293B",
              transition: "background-color .15s ease, transform .15s ease",
              "&:hover": {
                backgroundColor: action.primary ? "#2563EB" : "#334155",
                transform: "translateY(-1px)",
              },
            }}
          >
            <Box
              sx={{
                width: height >= 40 ? 18 : 16,
                height: height >= 40 ? 18 : 16,
                display: "flex",
                flexShrink: 0,
              }}
            >
              {action.icon}
            </Box>
            {labelled && (
              <Typography
                component="span"
                sx={{
                  fontFamily: "inherit",
                  fontSize: height >= 40 ? 14 : 12.5,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                {action.label}
              </Typography>
            )}
          </Box>
        </Tooltip>
      ))}
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
    <Box
      sx={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "center",
        gap: "8px",
        height: `${CAPTION_HEIGHT}px`,
      }}
    >
      <Typography
        sx={{
          fontFamily: "Outfit, sans-serif",
          fontSize: 14,
          fontWeight: 700,
          lineHeight: `${CAPTION_HEIGHT}px`,
          color: active ? "#F1F5F9" : "#CBD5E1",
          whiteSpace: "nowrap",
          transition: "color .2s ease",
        }}
      >
        {PLACA_LABELS[kind]}
      </Typography>
      <Typography
        sx={{
          fontSize: 12,
          lineHeight: `${CAPTION_HEIGHT}px`,
          color: "#94A3B8",
          whiteSpace: "nowrap",
        }}
      >
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
        <ShareActions
          width={slide}
          height={ACTIONS_MOBILE}
          busy={busy}
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
  const clear = clearance(metrics.card);

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
        gap: `${metrics.gap}px`,
        px: `${PAD_DESKTOP}px`,
        // Only above: below the card, the clearance sits between it and the
        // caption, and nothing has to grow past the share buttons.
        pt: `${clear}px`,
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
              // Pinned to the card's resting width: a caption or a dock even a
              // few pixels wider would widen the column, and the whole row
              // would slide sideways the moment you hovered one card.
              width: `${metrics.card * RATIO}px`,
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
              scale={HOVER_SCALE}
            />

            {/* The air the hovered card grows down into — without it, growing
                would put the placa on top of its own caption. */}
            <Box sx={{ height: `${clear}px`, flexShrink: 0 }} />

            <Caption
              kind={kind}
              index={index}
              total={kinds.length}
              active={isActive}
            />

            <Box sx={{ height: `${CAPTION_GAP}px`, flexShrink: 0 }} />

            {/* Reserved whether or not it shows, so the row keeps its height. */}
            <Box
              sx={{
                height: `${DOCK_HEIGHT}px`,
                width: "100%",
                display: "flex",
                alignItems: "center",
              }}
            >
              {isActive && (
                <ShareActions
                  busy={busy}
                  width={metrics.card * RATIO}
                  onShare={(target) => onShare(kind, target)}
                />
              )}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
