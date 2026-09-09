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
 * Inline a remote image as a data URI. Satori can take remote URLs, but one slow
 * or 403-ing host would stall or fail the whole render — fetching here lets a
 * broken logo degrade to no logo instead.
 */
export async function inlineImage(url: string | null): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const type = res.headers.get("content-type") ?? "image/png";
    // SVG is not reliably rasterised by satori inside an <img>.
    if (type.includes("svg")) return null;
    const base64 = Buffer.from(await res.arrayBuffer()).toString("base64");
    return `data:${type};base64,${base64}`;
  } catch {
    return null;
  }
}
