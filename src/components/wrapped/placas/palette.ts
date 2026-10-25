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
 */
function hashedColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  // Steer clear of the reds and greens above so a new channel does not read as
  // Luzu or Urbana at a glance.
  const hue = 190 + (Math.abs(hash) % 140);
  return `hsl(${hue} 85% 65%)`;
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

/** The glow behind the header, as a translucent wash of the accent. */
export function accentGlow(accent: string): string {
  return `radial-gradient(85% 38% at 50% 0%, ${accent}4D 0%, ${accent}14 45%, rgba(15,23,42,0) 76%)`;
}

export const PLATFORM_LEGEND = [
  { label: "Twitch", color: PLATFORMS.twitch },
  { label: "Kick", color: PLATFORMS.kick },
  { label: "YouTube", color: PLATFORMS.youtube },
];
