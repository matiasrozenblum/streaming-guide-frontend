import type { CSSProperties, ReactNode } from "react";
import type { Recap, RecapGrid } from "@/services/analytics";
import {
  PLACA_HEIGHT,
  PLACA_PADDING,
  PLACA_WIDTH,
  PlacaFooter,
  PlacaGrid,
  PlacaHeader,
  PlacaLegend,
  PlacaSentence,
  PlacaTitle,
  condensed,
  placaPeriod,
} from "./PlacaChrome";
import {
  PLATFORM_LEGEND,
  accentGlow,
  channelColor,
  platformColor,
} from "./palette";

export type PlacaKind =
  | "top-program"
  | "top-streamer"
  | "program-list"
  | "streamer-list";

export const PLACA_ORDER: PlacaKind[] = [
  "top-program",
  "program-list",
  "top-streamer",
  "streamer-list",
];

export const PLACA_LABELS: Record<PlacaKind, string> = {
  "top-program": "Programa más visto",
  "program-list": "Top programas",
  "top-streamer": "Streamer más visto",
  "streamer-list": "Top streamers",
};

const inter: CSSProperties = { fontFamily: "Inter, sans-serif" };

/** "reproducciones", never "horas": plays are what we actually measure. */
function playsLabel(n: number): string {
  return n === 1 ? "1 reproducción" : `${n} reproducciones`;
}

function periodWord(recap: Recap): string {
  return recap.period.type === "week" ? "DE LA SEMANA" : "DEL MES";
}

/**
 * Breaks a name where a person would, rather than letting a long word decide.
 * Two lines is the shape the design gives the display type.
 */
function nameLines(name: string): string[] {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return [words[0]];
  const mid = Math.floor(words.length / 2) || 1;
  return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
}

function sentence(grid: RecapGrid | null, plural: boolean): string | null {
  if (!grid?.peak_label) return null;
  return `${plural ? "Los vi" : "Lo vi"} sobre todo ${grid.peak_label}.`;
}

/** Only the channels actually present, so the legend never lists a dead colour. */
function channelLegend(grid: RecapGrid) {
  const names = new Set<string>();
  for (const row of grid.rows) {
    for (const cell of row.cells) {
      if (cell.plays > 0 && cell.channel_name) names.add(cell.channel_name);
    }
  }
  return [...names]
    .sort()
    .map((name) => ({ label: name, color: channelColor(name) }));
}

function dominantPlatform(grid: RecapGrid | null): string | null {
  if (!grid) return null;
  const tally = new Map<string, number>();
  for (const row of grid.rows) {
    for (const cell of row.cells) {
      if (cell.plays > 0 && cell.platform) {
        tally.set(cell.platform, (tally.get(cell.platform) ?? 0) + cell.plays);
      }
    }
  }
  let best: string | null = null;
  let bestPlays = 0;
  for (const [platform, plays] of tally) {
    if (plays > bestPlays) {
      best = platform;
      bestPlays = plays;
    }
  }
  return best;
}

function capitalise(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function Canvas({ accent, children }: { accent: string; children: ReactNode }) {
  return (
    <div
      style={{
        width: PLACA_WIDTH,
        height: PLACA_HEIGHT,
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#0F172A",
        backgroundImage: accentGlow(accent),
        padding: PLACA_PADDING,
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}

function Artwork({
  src,
  alt,
  size,
  width,
  round,
  accent,
}: {
  src: string | null;
  alt: string;
  size: number;
  /** Wider than tall for a channel wordmark; square for a portrait. */
  width?: number;
  round: boolean;
  accent: string;
}) {
  return (
    <div
      style={{
        width: width ?? size,
        height: size,
        flexShrink: 0,
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: round ? 999 : Math.round(size * 0.22),
        backgroundColor: round ? "#1E293B" : accent,
        border: round ? `5px solid ${accent}` : "none",
      }}
    >
      {src && (
        // A portrait is cropped to its circle; a channel logo is a wordmark on
        // its own background and gets cropped into nonsense by `cover`.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          width={width ?? size}
          height={size}
          style={{ objectFit: round ? "cover" : "contain" }}
        />
      )}
    </div>
  );
}

function Hero(props: {
  recap: Recap;
  accent: string;
  logo?: string;
  title: string;
  artwork: string | null;
  round: boolean;
  name: string;
  where: string;
  count: number;
  grid: RecapGrid | null;
  legend: Array<{ label: string; color: string }>;
}) {
  const { recap, accent, grid } = props;
  const text = sentence(grid, false);

  return (
    <Canvas accent={accent}>
      <PlacaHeader period={placaPeriod(recap.period)} logo={props.logo} />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          marginTop: "auto",
          marginBottom: "auto",
          padding: "24px 0",
        }}
      >
        <PlacaTitle lines={[props.title, periodWord(recap)]} accent={accent} />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 30,
            paddingTop: 40,
          }}
        >
          <Artwork
            src={props.artwork}
            alt={props.where}
            size={120}
            round={props.round}
            accent={accent}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div
              style={{
                ...inter,
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: "0.12em",
                color: "#94A3B8",
              }}
            >
              EN
            </div>
            <div
              style={{
                ...inter,
                fontSize: 36,
                fontWeight: 600,
                lineHeight: "42px",
                color: "#F1F5F9",
              }}
            >
              {props.where}
            </div>
          </div>
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", paddingTop: 44 }}
        >
          {nameLines(props.name).map((line) => (
            <div
              key={line}
              style={{
                ...condensed,
                fontSize: recap.period.type === "week" ? 170 : 140,
                letterSpacing: "-0.04em",
                lineHeight: "86%",
                color: "#F1F5F9",
                whiteSpace: "nowrap",
              }}
            >
              {line.toUpperCase()}
            </div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 22,
            paddingTop: 36,
          }}
        >
          <div
            style={{
              ...condensed,
              fontSize: 120,
              letterSpacing: "-0.05em",
              lineHeight: "84%",
              color: accent,
            }}
          >
            {/* A bare number is a non-string child, which satori refuses on a
                div that is not a flex container — so it goes in as text. */}
            {String(props.count)}
          </div>
          <div
            style={{
              ...condensed,
              fontWeight: 800,
              fontStretch: "84%",
              fontSize: 58,
              lineHeight: "70px",
              letterSpacing: "-0.01em",
              color: "#F1F5F9",
            }}
          >
            {props.count === 1 ? "reproducción" : "reproducciones"}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
        {grid && <PlacaGrid grid={grid} />}
        <PlacaLegend items={props.legend} />
        {text && <PlacaSentence text={text} />}
        <PlacaFooter accent={accent} />
      </div>
    </Canvas>
  );
}

function Ranking(props: {
  recap: Recap;
  accent: string;
  logo?: string;
  title: string;
  rows: Array<{
    key: string;
    name: string;
    artwork: string | null;
    plays: number;
    color: string;
  }>;
  round: boolean;
  grid: RecapGrid | null;
  legend: Array<{ label: string; color: string }>;
}) {
  const { recap, accent, rows, grid } = props;
  const text = sentence(grid, true);
  // Five entries have to give up the room three could spend on air.
  const compact = rows.length > 3;

  return (
    <Canvas accent={accent}>
      <PlacaHeader period={placaPeriod(recap.period)} logo={props.logo} />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          paddingTop: compact ? 64 : 80,
        }}
      >
        <div style={{ paddingBottom: compact ? 44 : 56, display: "flex" }}>
          <PlacaTitle lines={[props.title, periodWord(recap)]} accent={accent} />
        </div>

        {rows.map((row, index) => {
          const first = index === 0;
          return (
            <div
              key={row.key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 26,
                ...(first
                  ? { paddingBottom: compact ? 14 : 20 }
                  : {
                      borderTop: "2px solid rgba(241,245,249,0.14)",
                      paddingTop: compact ? 10 : 18,
                      paddingBottom: compact ? 10 : 18,
                    }),
              }}
            >
              <div
                style={{
                  ...condensed,
                  width: 46,
                  flexShrink: 0,
                  fontSize: first ? 48 : 38,
                  lineHeight: "100%",
                  color: first ? accent : "#94A3B8",
                }}
              >
                {String(index + 1)}
              </div>
              <Artwork
                src={row.artwork}
                alt={row.name}
                size={80}
                width={props.round ? 80 : 180}
                round={props.round}
                accent={row.color}
              />
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    ...condensed,
                    fontSize: first ? (compact ? 54 : 64) : compact ? 44 : 52,
                    letterSpacing: "-0.03em",
                    lineHeight: "96%",
                    color: "#F1F5F9",
                  }}
                >
                  {row.name.toUpperCase()}
                </div>
                <div
                  style={{
                    ...inter,
                    fontSize: first ? 30 : 28,
                    fontWeight: first ? 600 : 500,
                    lineHeight: "36px",
                    color: first ? accent : "#CBD5E1",
                  }}
                >
                  {playsLabel(row.plays)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 30,
          marginTop: "auto",
        }}
      >
        {grid && <PlacaGrid grid={grid} dense={compact} />}
        <PlacaLegend items={props.legend} />
        {text && <PlacaSentence text={text} />}
        <PlacaFooter accent={accent} />
      </div>
    </Canvas>
  );
}

/** True when the recap has enough of the right kind of data to draw this placa. */
export function canRender(kind: PlacaKind, recap: Recap): boolean {
  if (!recap.enough_data) return false;
  if (kind === "top-program") return recap.top_programs.length > 0;
  if (kind === "program-list") return recap.top_programs.length > 0;
  return recap.top_streamers.length > 0;
}

export function Placa({
  kind,
  recap,
  logo,
}: {
  kind: PlacaKind;
  recap: Recap;
  /** Inlined brand mark, for the PNG export; the browser uses the default. */
  logo?: string;
}) {
  const topProgram = recap.top_programs[0];
  const topStreamer = recap.top_streamers[0];
  const listSize = recap.period.type === "week" ? 3 : 5;

  if (kind === "top-program") {
    const accent = channelColor(topProgram.channel_name);
    return (
      <Hero
        recap={recap}
        logo={logo}
        accent={accent}
        title="MI PROGRAMA MÁS VISTO"
        artwork={topProgram.channel_logo_url}
        round={false}
        name={topProgram.program_name}
        where={topProgram.channel_name ?? "La Guía"}
        count={topProgram.plays}
        grid={recap.grids.program}
        legend={[]}
      />
    );
  }

  if (kind === "top-streamer") {
    const grid = recap.grids.streamer;
    const platform = dominantPlatform(grid);
    return (
      <Hero
        recap={recap}
        logo={logo}
        accent={platformColor(platform)}
        title="MI STREAMER MÁS VISTO"
        artwork={topStreamer.streamer_logo_url}
        round
        name={topStreamer.streamer_name}
        where={platform ? capitalise(platform) : "La Guía"}
        count={topStreamer.plays}
        grid={grid}
        legend={PLATFORM_LEGEND}
      />
    );
  }

  if (kind === "program-list") {
    const rows = recap.top_programs.slice(0, listSize).map((program) => ({
      key: String(program.program_id),
      name: program.program_name,
      artwork: program.channel_logo_url,
      plays: program.plays,
      color: channelColor(program.channel_name),
    }));
    return (
      <Ranking
        recap={recap}
        logo={logo}
        accent={channelColor(topProgram.channel_name)}
        title={`MIS ${rows.length} PROGRAMAS MÁS VISTOS`}
        rows={rows}
        round={false}
        grid={recap.grids.total}
        legend={channelLegend(recap.grids.total)}
      />
    );
  }

  const accent = platformColor(dominantPlatform(recap.grids.streamers));
  const rows = recap.top_streamers.slice(0, listSize).map((streamer) => ({
    key: String(streamer.streamer_id),
    name: streamer.streamer_name,
    artwork: streamer.streamer_logo_url,
    plays: streamer.plays,
    color: accent,
  }));
  return (
    <Ranking
      recap={recap}
      logo={logo}
      accent={accent}
      title={`MIS ${rows.length} STREAMERS MÁS VISTOS`}
      rows={rows}
      round
      grid={recap.grids.streamers}
      legend={PLATFORM_LEGEND}
    />
  );
}
