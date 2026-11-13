import type { Recap } from "@/services/analytics";
import { inlineImage } from "./fonts";

/**
 * Satori cannot follow a URL of its own: a root relative path has no host, and
 * a remote one that is slow or 403s stalls or kills the whole render. So every
 * image a placa draws is fetched here and handed over as a data URI, and a
 * logo that cannot be fetched degrades to no logo rather than to no placa.
 *
 * Only the images actually on screen are fetched — the recap carries up to ten
 * logos and a placa shows at most five.
 */
export interface PlacaAssets {
  recap: Recap;
  logo: string | undefined;
}

/** How many ranking rows a placa can show, so nothing is fetched for nothing. */
const MAX_ROWS = 5;

export async function resolvePlacaAssets(
  recap: Recap,
  origin: string,
): Promise<PlacaAssets> {
  const programs = recap.top_programs.slice(0, MAX_ROWS);
  const streamers = recap.top_streamers.slice(0, MAX_ROWS);

  const [logo, programLogos, streamerLogos] = await Promise.all([
    inlineImage(`${origin}/img/text-white.png`),
    Promise.all(programs.map((p) => inlineImage(p.channel_logo_url))),
    Promise.all(streamers.map((s) => inlineImage(s.streamer_logo_url ?? null))),
  ]);

  return {
    logo: logo ?? undefined,
    recap: {
      ...recap,
      top_programs: programs.map((program, index) => ({
        ...program,
        channel_logo_url: programLogos[index],
      })),
      top_streamers: streamers.map((streamer, index) => ({
        ...streamer,
        streamer_logo_url: streamerLogos[index],
      })),
    },
  };
}
