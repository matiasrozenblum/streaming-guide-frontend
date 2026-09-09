/* eslint-disable @next/next/no-img-element -- These layouts are rendered by
   satori into a static PNG, never into a browser DOM. next/image has no
   meaning here and would not work. */
import type { ReactElement } from "react";

/** 9:16 — the story format people actually share this kind of card in. */
export const RECAP_WIDTH = 1080;
export const RECAP_HEIGHT = 1920;

const COLORS = {
  // The product's own dark palette, so a shared card still reads as ours.
  bg: "#0f172a",
  card: "#1e293b",
  accent: "#3b82f6",
  ink: "#f1f5f9",
  inkMuted: "#cbd5e1",
  border: "#334155",
};

export interface RecapLayoutRow {
  position: number;
  program_name: string;
  channel_name: string | null;
  plays: number;
  /** Already inlined as a data URI, or null when the logo could not be loaded. */
  logo: string | null;
}

export interface RecapLayoutData {
  periodLabel: string;
  rows: RecapLayoutRow[];
  totalPlays: number;
  distinctPrograms: number;
  favoriteWeekday: string | null;
}

/**
 * The personal recap card, as a pure function of its data — same split as the
 * top-10 artwork, so it can be rendered from fixtures and eyeballed without a
 * populated backend.
 */
export function renderRecap(data: RecapLayoutData): ReactElement {
  return (
    <div
      style={{
        width: RECAP_WIDTH,
        height: RECAP_HEIGHT,
        display: "flex",
        flexDirection: "column",
        backgroundColor: COLORS.bg,
        padding: "90px 72px",
        fontFamily: "Outfit, sans-serif",
      }}
    >
      <div
        style={{ display: "flex", flexDirection: "column", marginBottom: 56 }}
      >
        <span style={{ fontSize: 34, fontWeight: 600, color: COLORS.accent }}>
          {data.periodLabel}
        </span>
        <span
          style={{
            fontSize: 76,
            fontWeight: 800,
            color: COLORS.ink,
            lineHeight: 1.1,
          }}
        >
          Mi resumen
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
        {data.rows.map((row) => (
          <div
            key={row.position}
            style={{
              display: "flex",
              alignItems: "center",
              backgroundColor: COLORS.card,
              border: `2px solid ${COLORS.border}`,
              borderRadius: 24,
              padding: "26px 32px",
              marginBottom: 22,
            }}
          >
            <span
              style={{
                fontSize: 54,
                fontWeight: 800,
                color: COLORS.accent,
                width: 82,
              }}
            >
              {row.position}
            </span>

            {row.logo ? (
              <img
                src={row.logo}
                width={78}
                height={78}
                style={{
                  objectFit: "contain",
                  borderRadius: 14,
                  marginRight: 26,
                }}
                alt=""
              />
            ) : (
              <div
                style={{
                  display: "flex",
                  width: 78,
                  height: 78,
                  marginRight: 26,
                }}
              />
            )}

            <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              <span
                style={{
                  fontSize: row.program_name.length > 20 ? 38 : 46,
                  fontWeight: 800,
                  color: COLORS.ink,
                  lineHeight: 1.15,
                }}
              >
                {row.program_name}
              </span>
              {row.channel_name && (
                <span
                  style={{
                    fontSize: 30,
                    fontWeight: 600,
                    color: COLORS.inkMuted,
                  }}
                >
                  {row.channel_name}
                </span>
              )}
            </div>

            <span
              style={{ fontSize: 34, fontWeight: 800, color: COLORS.inkMuted }}
            >
              {row.plays}
            </span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 22, marginTop: 28 }}>
        <Stat value={String(data.totalPlays)} label="reproducciones" />
        <Stat value={String(data.distinctPrograms)} label="programas" />
        {data.favoriteWeekday && (
          <Stat value={data.favoriteWeekday} label="tu día" />
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "center", marginTop: 44 }}>
        <span style={{ fontSize: 30, fontWeight: 600, color: COLORS.inkMuted }}>
          laguiadelstreaming.com
        </span>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        backgroundColor: COLORS.card,
        border: `2px solid ${COLORS.border}`,
        borderRadius: 24,
        padding: "26px 30px",
      }}
    >
      <span style={{ fontSize: 50, fontWeight: 800, color: COLORS.ink }}>
        {value}
      </span>
      <span style={{ fontSize: 26, fontWeight: 600, color: COLORS.inkMuted }}>
        {label}
      </span>
    </div>
  );
}
