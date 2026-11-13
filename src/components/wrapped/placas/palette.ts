/**
 * Colours for the shareable placas.
 *
 * The grid cells arrive from the API carrying a channel or a platform, never a
 * colour: `channel.background_color` is the channel's own brand background
 * (Luzu's is white) and would disappear against the navy. These are the colours
 * the design assigns, which is a separate decision from the channel's branding.
 *
 * Luzu red and Urbana green sit next to each other in a ranking, and violet and
 * blue are indistinguishable to a deuteranope — which is why every grid in the
 * design ships with a named legend rather than relying on colour alone.
 */

const NAMED_CHANNELS: Record<string, string> = {
  luzu: "#FF4B4B",
  urbana: "#22D86F",
  olga: "#A96BFF",
  vorterix: "#38BDF8",
};

/** Twitch, Kick and YouTube, as the design and the app theme already use them. */
const PLATFORMS: Record<string, string> = {
  twitch: "#9146FF",
  kick: "#53FC18",
  youtube: "#FF0000",
};

/** Empty cell: a shade of the navy ground, not a channel. */
export const EMPTY_CELL = "#1B2435";

/**
 * A stable colour for any channel the design did not name. Hashing the name
 * keeps a channel the same colour across reloads and between the card and the
 * exported image, which an index-based palette would not.
 *
 * Returns hex rather than `hsl()` because the same strings are handed to
 * satori when the placa is rendered as a PNG, and hex is the one notation it
 * reads everywhere, gradient colour stops included.
 */
function hashedColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  // Steer clear of the reds and greens above so a new channel does not read as
  // Luzu or Urbana at a glance.
  const hue = 190 + (Math.abs(hash) % 140);
  return hslToHex(hue, 0.85, 0.65);
}

function hslToHex(h: number, s: number, l: number): string {
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const x = chroma * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - chroma / 2;
  const sector = Math.floor(h / 60) % 6;
  const [r, g, b] = [
    [chroma, x, 0],
    [x, chroma, 0],
    [0, chroma, x],
    [0, x, chroma],
    [x, 0, chroma],
    [chroma, 0, x],
  ][sector];
  const channel = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${channel(r)}${channel(g)}${channel(b)}`;
}

/** `rgba()` for a `#rrggbb`, so gradient stops carry their own alpha. */
function withAlpha(hex: string, alpha: number): string {
  const value = hex.replace("#", "");
  const int = parseInt(
    value.length === 3
      ? value
          .split("")
          .map((c) => c + c)
          .join("")
      : value.slice(0, 6),
    16,
  );
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

export function channelColor(name: string | null): string {
  if (!name) return EMPTY_CELL;
  const key = name.trim().toLowerCase();
  const named = Object.keys(NAMED_CHANNELS).find((k) => key.startsWith(k));
  return named ? NAMED_CHANNELS[named] : hashedColor(key);
}

export function platformColor(platform: string | null): string {
  if (!platform) return EMPTY_CELL;
  return PLATFORMS[platform.trim().toLowerCase()] ?? hashedColor(platform);
}

/** The accent a placa is built around: its channel, or its platform. */
export function accentFor(options: {
  channelName?: string | null;
  platform?: string | null;
}): string {
  if (options.platform) return platformColor(options.platform);
  return channelColor(options.channelName ?? null);
}

/**
 * The glow behind the header, as a translucent wash of the accent.
 *
 * Two constraints come from the PNG export rather than the design: the stops
 * are `rgba()` because satori drops 8-digit hex, and the gradient is linear
 * because satori ignores a radial one's position and centres it on the canvas —
 * which puts the glow in the middle of the placa instead of behind the header.
 * A top-down wash is what both renderers draw the same way.
 */
export function accentGlow(accent: string): string {
  return `linear-gradient(to bottom, ${withAlpha(accent, 0.28)} 0%, ${withAlpha(accent, 0.1)} 18%, rgba(15,23,42,0) 42%)`;
}

export const PLATFORM_LEGEND = [
  { label: "Twitch", color: PLATFORMS.twitch },
  { label: "Kick", color: PLATFORMS.kick },
  { label: "YouTube", color: PLATFORMS.youtube },
];
