"use client";

import { useState } from "react";
import { Box, Tooltip, Typography } from "@mui/material";
import type { Recap } from "@/services/analytics";
import {
  PLACA_HEIGHT,
  PLACA_WIDTH,
} from "./placas/PlacaChrome";
import {
  PLACA_LABELS,
  PLACA_ORDER,
  Placa,
  canRender,
  type PlacaKind,
} from "./placas/Placa";

/** Widths the design gives a resting card and the one under the pointer. */
const CARD_WIDTH = 290;
const CARD_WIDTH_HOVER = 330;

function scaled(width: number) {
  return { width, height: Math.round((PLACA_HEIGHT / PLACA_WIDTH) * width) };
}

/**
 * The placa at card size. It is the same component the export renders, scaled
 * by a transform rather than re-laid-out, so what someone sees in the dock is
 * exactly what they get in the image.
 */
function PlacaCard({
  kind,
  recap,
  active,
}: {
  kind: PlacaKind;
  recap: Recap;
  active: boolean;
}) {
  const { width, height } = scaled(active ? CARD_WIDTH_HOVER : CARD_WIDTH);
  const scale = width / PLACA_WIDTH;

  return (
    <Box
      sx={{
        width,
        height,
        borderRadius: active ? "20px" : "16px",
        overflow: "hidden",
        flexShrink: 0,
        border: active
          ? "2px solid var(--placa-accent, #3B82F6)"
          : "1px solid #334155",
        boxShadow: active ? "0 24px 60px rgba(59,130,246,0.28)" : "none",
        transition:
          "width .22s ease, height .22s ease, box-shadow .22s ease, border-color .22s ease",
      }}
    >
      <Box
        sx={{
          width: PLACA_WIDTH,
          height: PLACA_HEIGHT,
          transform: `scale(${scale})`,
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

const icon = (path: React.ReactNode) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
    {path}
  </svg>
);

const TARGETS: ShareTarget[] = [
  {
    id: "instagram",
    label: "Instagram",
    icon: icon(
      <>
        <rect
          x="3"
          y="3"
          width="18"
          height="18"
          rx="5"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" />
      </>,
    ),
  },
  {
    id: "tiktok",
    label: "TikTok",
    icon: icon(
      <>
        <path
          d="M14 3v12.2a3.6 3.6 0 1 1-3.2-3.58"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M14 3a5.4 5.4 0 0 0 5 4.6"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>,
    ),
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    icon: icon(
      <path
        d="M12 3a9 9 0 0 0-7.7 13.6L3 21l4.6-1.2A9 9 0 1 0 12 3z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />,
    ),
  },
  {
    id: "x",
    label: "X",
    icon: icon(
      <path
        d="M4 4l16 16M20 4L4 20"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />,
    ),
  },
  {
    id: "facebook",
    label: "Facebook",
    icon: icon(
      <path
        d="M14.5 8.5h2.2V5.6h-2.4c-2.2 0-3.6 1.4-3.6 3.6v1.6H8.4v2.9h2.3V21h3v-7.3h2.3l.4-2.9h-2.7V9.6c0-.7.3-1.1.8-1.1z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />,
    ),
  },
  {
    id: "download",
    label: "Descargar",
    primary: true,
    icon: icon(
      <path
        d="M12 3.5v11M7.5 10.5 12 15l4.5-4.5M4 19.5h16"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />,
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

/**
 * The row of placas. Pointing at one grows it and reveals the share dock; with
 * a keyboard, focus does the same, so the actions are not mouse-only.
 */
export function RecapDock({
  recap,
  onShare,
  busy,
}: {
  recap: Recap;
  onShare: (kind: PlacaKind, target: string) => void;
  busy: boolean;
}) {
  const kinds = PLACA_ORDER.filter((kind) => canRender(kind, recap));
  const [active, setActive] = useState<PlacaKind | null>(null);

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "16px",
        px: "48px",
        pb: "24px",
        flexGrow: 1,
        flexWrap: { xs: "wrap", lg: "nowrap" },
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
              gap: isActive ? "14px" : "12px",
              flexShrink: 0,
              outline: "none",
              "&:focus-visible > :first-of-type": {
                outline: "2px solid #60A5FA",
                outlineOffset: "3px",
              },
            }}
          >
            <PlacaCard kind={kind} recap={recap} active={isActive} />

            <Box
              sx={{
                display: "flex",
                alignItems: "baseline",
                gap: "10px",
                width: "100%",
                justifyContent: "center",
              }}
            >
              <Typography
                sx={{
                  fontSize: isActive ? 17 : 15,
                  fontWeight: isActive ? 700 : 600,
                  color: isActive ? "#F1F5F9" : "#CBD5E1",
                  whiteSpace: "nowrap",
                }}
              >
                {PLACA_LABELS[kind]}
              </Typography>
              <Typography sx={{ fontSize: 13, color: "#64748B" }}>
                {index + 1} de {kinds.length}
              </Typography>
            </Box>

            {/* Reserved whether or not it is showing, so the row does not jump. */}
            <Box sx={{ height: 44, display: "flex", alignItems: "center" }}>
              {isActive && (
                <ShareDock
                  busy={busy}
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
