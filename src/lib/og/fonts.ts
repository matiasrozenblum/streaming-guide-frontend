export type OutfitWeight = 600 | 800;

export interface LoadedFont {
  weight: OutfitWeight;
  data: ArrayBuffer;
}

/**
 * Outfit is the product's heading face. Cached at module scope so a warm lambda
 * pays the Google Fonts round trip once, not once per render.
 */
let cache: LoadedFont[] | null = null;

async function loadWeight(weight: OutfitWeight): Promise<LoadedFont | null> {
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=Outfit:wght@${weight}&display=swap`,
    { headers: { "User-Agent": "Mozilla/5.0" } },
  ).then((r) => r.text());

  const url = css.match(/src:\s*url\((https:[^)]+)\)/)?.[1];
  if (!url) return null;

  return { weight, data: await fetch(url).then((r) => r.arrayBuffer()) };
}

export async function loadOutfit(): Promise<LoadedFont[] | null> {
  if (cache) return cache;
  try {
    const loaded = await Promise.all([loadWeight(800), loadWeight(600)]);
    const fonts = loaded.filter((f): f is LoadedFont => f !== null);
    if (fonts.length === 0) return null;
    cache = fonts;
    return cache;
  } catch {
    // Satori falls back to its built-in face; the layout still holds.
    return null;
  }
}

/** Shape `ImageResponse` expects. */
export const toImageResponseFonts = (fonts: LoadedFont[] | null) =>
  fonts?.map((f) => ({
    name: "Outfit",
    data: f.data,
    weight: f.weight,
    style: "normal" as const,
  }));

/**
 * Formats satori can decode. Anything else has to be converted before it can be
 * drawn — satori does not fail softly on an unknown format, it throws
 * ("a is not iterable") and takes the whole render down with it.
 */
const SATORI_RASTER_TYPES = ["image/png", "image/jpeg", "image/gif"];

/**
 * Re-encode to PNG. sharp is what Next already uses for image optimisation, and
 * it is declared as a direct dependency so this does not silently rely on a
 * transitive one. If it is unavailable for any reason the caller falls back to
 * no image, which the layouts render as the channel name.
 */
async function toPng(buffer: Buffer): Promise<string | null> {
  try {
    const sharp = (await import("sharp")).default;
    const png = await sharp(buffer).png().toBuffer();
    return `data:image/png;base64,${png.toString("base64")}`;
  } catch {
    return null;
  }
}

/**
 * Inline a remote image as a data URI. Satori can take remote URLs, but one slow
 * or 403-ing host would stall or fail the whole render — fetching here lets a
 * broken logo degrade to no logo instead.
 *
 * Channel logos are whatever was uploaded to the bucket: PNG, JPEG and WebP are
 * all present today. WebP and SVG have to be converted or dropped rather than
 * passed through, since satori throws on them instead of skipping them.
 */
export async function inlineImage(url: string | null): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;

    const type = (res.headers.get("content-type") ?? "image/png")
      .split(";")[0]
      .trim()
      .toLowerCase();
    const buffer = Buffer.from(await res.arrayBuffer());

    if (SATORI_RASTER_TYPES.includes(type)) {
      return `data:${type};base64,${buffer.toString("base64")}`;
    }

    // WebP, AVIF and friends: re-encode. SVG is skipped outright — sharp can
    // rasterise it, but only at a size it has to guess, and the result is
    // unreliable enough that the text fallback reads better.
    if (type.includes("svg")) return null;

    return await toPng(buffer);
  } catch {
    return null;
  }
}
