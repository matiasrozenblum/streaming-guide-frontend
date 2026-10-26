/**
 * Fonts for the shareable placas.
 *
 * The placa is rendered twice — as a card in the browser and as a PNG by
 * satori — and the two have to agree. In the browser the condensed display face
 * comes from Archivo's `wdth` axis driven by `font-stretch`. Satori ignores
 * `font-stretch` entirely, so the export instead loads Archivo already pinned
 * to that width and registers it under the same family name.
 */

export interface PlacaFont {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 500 | 600 | 700 | 800 | 900;
  style: "normal";
}

/** The width `PlacaChrome.condensed` asks for; Google rounds it to `condensed`. */
const CONDENSED_WIDTH = 76;

const FACES: Array<{ name: string; query: string; weight: PlacaFont["weight"] }> = [
  { name: "Archivo", query: `Archivo:wdth,wght@${CONDENSED_WIDTH},800`, weight: 800 },
  { name: "Archivo", query: `Archivo:wdth,wght@${CONDENSED_WIDTH},900`, weight: 900 },
  { name: "Inter", query: "Inter:wght@500", weight: 500 },
  { name: "Inter", query: "Inter:wght@600", weight: 600 },
  { name: "Inter", query: "Inter:wght@700", weight: 700 },
];

let cache: PlacaFont[] | null = null;

/**
 * The bare `Mozilla/5.0` user agent is what makes Google serve TrueType rather
 * than woff2, which satori cannot decode. A pinned `wdth` comes back as the two
 * nearest named widths; the first is the closer one.
 */
async function loadFace(face: (typeof FACES)[number]): Promise<PlacaFont | null> {
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=${face.query}&display=swap`,
    { headers: { "User-Agent": "Mozilla/5.0" } },
  ).then((r) => r.text());

  const url = css.match(/src:\s*url\((https:[^)]+\.ttf)\)/)?.[1];
  if (!url) return null;

  return {
    name: face.name,
    weight: face.weight,
    style: "normal",
    data: await fetch(url).then((r) => r.arrayBuffer()),
  };
}

export async function loadPlacaFonts(): Promise<PlacaFont[]> {
  if (cache) return cache;
  const loaded = await Promise.all(
    FACES.map((face) => loadFace(face).catch(() => null)),
  );
  const fonts = loaded.filter((f): f is PlacaFont => f !== null);
  // Satori throws without at least one font, so an empty result is not cached:
  // a transient Google outage should not poison a warm lambda for its lifetime.
  if (fonts.length > 0) cache = fonts;
  return fonts;
}
