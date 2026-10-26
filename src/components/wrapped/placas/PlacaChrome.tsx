import type { CSSProperties } from "react";
import type { RecapGrid, RecapGridCell } from "@/services/analytics";
import { channelColor, platformColor, EMPTY_CELL } from "./palette";

/**
 * The pieces every placa shares, drawn at the export size (1080×1920).
 *
 * Plain elements with inline styles rather than MUI: the card on screen and the
 * downloaded image have to be the same component, and the image is rendered by
 * satori, which understands inline styles but not emotion's generated classes.
 * Nothing here is responsive on purpose — the placa is one fixed canvas that
 * the card scales down, so the thumbnail cannot drift from the export.
 */

export const PLACA_WIDTH = 1080;
export const PLACA_HEIGHT = 1920;

/**
 * The brand mark, as the browser loads it. The PNG export cannot follow a root
 * relative path, so `PlacaHeader` takes an override and the route passes the
 * same file inlined as a data URI.
 */
export const LOGO_SRC = "/img/text-white.png";

/** The condensed display face the design is built on. */
export const condensed: CSSProperties = {
  fontFamily: "Archivo, Inter, sans-serif",
  fontStretch: "76%",
  fontWeight: 900,
};

const inter: CSSProperties = { fontFamily: "Inter, sans-serif" };

export function PlacaHeader({
  period,
  logo = LOGO_SRC,
}: {
  period: string;
  logo?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logo}
        alt="La Guía del Streaming"
        width={330}
        height={90}
        style={{ objectFit: "contain", flexShrink: 0 }}
      />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          borderRadius: 999,
          border: "2px solid rgba(241,245,249,0.3)",
          padding: "16px 32px",
        }}
      >
        <div
          style={{
            ...inter,
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: "0.05em",
            color: "#F1F5F9",
            whiteSpace: "nowrap",
          }}
        >
          {period}
        </div>
      </div>
    </div>
  );
}

export function PlacaTitle({
  lines,
  accent,
}: {
  lines: [string, string];
  accent: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {lines.map((line) => (
        <div
          key={line}
          style={{
            ...inter,
            fontSize: 38,
            fontWeight: 700,
            letterSpacing: "0.04em",
            lineHeight: 1.18,
            color: accent,
            whiteSpace: "nowrap",
          }}
        >
          {line}
        </div>
      ))}
    </div>
  );
}

export function PlacaFooter({ accent }: { accent: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: 24,
        borderTop: "2px solid rgba(241,245,249,0.2)",
        paddingTop: 34,
        marginTop: 12,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div
          style={{
            ...inter,
            fontSize: 30,
            fontWeight: 600,
            lineHeight: 1.25,
            color: "#F1F5F9",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <span>Creá tu usuario y mirá tus programas en</span>
          <span>La Guía para armar el tuyo</span>
        </div>
        <div
          style={{ ...inter, fontSize: 26, fontWeight: 500, color: "#94A3B8" }}
        >
          laguiadelstreaming.com
        </div>
      </div>
      <div
        style={{
          ...inter,
          fontSize: 30,
          fontWeight: 700,
          letterSpacing: "0.05em",
          color: accent,
          whiteSpace: "nowrap",
        }}
      >
        MI RESUMEN
      </div>
    </div>
  );
}

function cellColor(cell: RecapGridCell): string {
  if (cell.plays === 0) return EMPTY_CELL;
  return cell.platform
    ? platformColor(cell.platform)
    : channelColor(cell.channel_name);
}

/**
 * The week grid is three day parts by seven days with the labels showing; the
 * month is a calendar whose leading blanks keep the columns under the right
 * letter. Both arrive already shaped, so this only paints them.
 */
export function PlacaGrid({ grid }: { grid: RecapGrid }) {
  const isWeek = grid.shape === "week";
  const labelWidth = 150;
  const cellHeight = isWeek ? 84 : 58;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: isWeek ? 10 : 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {isWeek && <div style={{ width: labelWidth, flexShrink: 0 }} />}
        {grid.day_labels.map((day, index) => (
          <div
            key={`${day}-${index}`}
            style={{
              ...inter,
              flex: 1,
              fontSize: 26,
              fontWeight: 700,
              textAlign: "center",
              color: "#94A3B8",
              display: "flex",
              justifyContent: "center",
            }}
          >
            {day}
          </div>
        ))}
      </div>

      {grid.rows.map((row) => {
        const hasPeak = row.cells.some((cell) => cell.peak);
        return (
          <div
            key={row.label}
            style={{ display: "flex", alignItems: "center", gap: 10 }}
          >
            {isWeek && (
              <div
                style={{
                  ...inter,
                  width: labelWidth,
                  flexShrink: 0,
                  fontSize: 26,
                  fontWeight: hasPeak ? 700 : 500,
                  color: hasPeak ? "#F1F5F9" : "#94A3B8",
                }}
              >
                {row.label}
              </div>
            )}
            {row.cells.map((cell, index) => (
              <div
                key={`${row.label}-${index}`}
                style={{
                  flex: 1,
                  height: cellHeight,
                  borderRadius: 14,
                  backgroundColor: cellColor(cell),
                  border: cell.peak
                    ? "4px solid #FFFFFF"
                    : "4px solid transparent",
                }}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}

export function PlacaLegend({
  items,
}: {
  items: Array<{ label: string; color: string }>;
}) {
  if (items.length === 0) return null;
  return (
    <div
      style={{ display: "flex", alignItems: "center", gap: 36, paddingTop: 4 }}
    >
      {items.map((item) => (
        <div
          key={item.label}
          style={{ display: "flex", alignItems: "center", gap: 12 }}
        >
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: 7,
              backgroundColor: item.color,
              flexShrink: 0,
            }}
          />
          <div
            style={{
              ...inter,
              fontSize: 25,
              fontWeight: 500,
              color: "#CBD5E1",
              whiteSpace: "nowrap",
            }}
          >
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
}

export function PlacaSentence({ text }: { text: string }) {
  return (
    <div
      style={{
        ...condensed,
        fontWeight: 800,
        fontStretch: "84%",
        fontSize: 54,
        letterSpacing: "-0.02em",
        lineHeight: 1.14,
        color: "#F1F5F9",
        paddingTop: 10,
      }}
    >
      {text}
    </div>
  );
}
