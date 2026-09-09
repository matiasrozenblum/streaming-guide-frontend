import { NextRequest, NextResponse } from "next/server";
import { ImageResponse } from "next/og";
import { requireAccessToken } from "@/utils/auth-server";
import type { RankingRow } from "@/services/analytics";
import {
  renderTop10,
  TOP10_WIDTH,
  TOP10_HEIGHT,
  type Top10Row,
  type LogoShape,
} from "@/lib/og/top10Layout";
import { loadOutfit, toImageResponseFonts, inlineImage } from "@/lib/og/fonts";

// Remote logo fetching and font loading both need Node APIs.
export const runtime = "nodejs";

const ROWS = 10;
const FOOTER = "*usuarios live en laguiadelstreaming.com o app";

/**
 * The three things worth ranking. Each names its backend route and the default
 * metric that route ranks by — streamers have no live-click event of their own,
 * so their equivalent action is following the link out to their channel.
 */
const KINDS = {
  programs: {
    path: "rankings/programs",
    metric: "click_youtube_live",
    logoShape: "wide" as LogoShape,
  },
  channels: {
    path: "rankings/channels",
    metric: "click_youtube_live",
    logoShape: "wide" as LogoShape,
  },
  streamers: {
    path: "rankings/streamers",
    metric: "streamer_service_click",
    // Streamer logos are photos of a person, not wordmarks.
    logoShape: "avatar" as LogoShape,
  },
} as const;

type Kind = keyof typeof KINDS;

const isKind = (value: string): value is Kind => value in KINDS;

/**
 * Flatten a ranking row into what the artwork needs. Programs show the program
 * name over the channel's logo; channels and streamers are their own subject, so
 * the name and the logo come from the same entity.
 */
function toRow(
  kind: Kind,
  row: RankingRow,
): Omit<Top10Row, "logo"> & {
  logoUrl: string | null;
} {
  if (kind === "streamers") {
    return {
      title: row.streamer_name ?? "—",
      subtitle: null,
      logoUrl: row.streamer_logo_url ?? null,
    };
  }
  if (kind === "channels") {
    return {
      title: row.channel_name ?? "—",
      subtitle: null,
      logoUrl: row.channel_logo_url,
    };
  }
  return {
    title: row.program_name ?? "—",
    subtitle: row.channel_name,
    logoUrl: row.channel_logo_url,
  };
}

export async function GET(request: NextRequest) {
  let token: string;
  try {
    token = await requireAccessToken(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const kindParam = searchParams.get("kind") ?? "programs";

  if (!from || !to) {
    return NextResponse.json(
      { error: "from and to are required" },
      { status: 400 },
    );
  }
  if (!isKind(kindParam)) {
    return NextResponse.json(
      { error: `kind must be one of ${Object.keys(KINDS).join(", ")}` },
      { status: 400 },
    );
  }

  const kind = kindParam;
  const metric = searchParams.get("metric") ?? KINDS[kind].metric;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const query = new URLSearchParams({ from, to, metric, limit: String(ROWS) });

  let ranking: RankingRow[];
  try {
    const res = await fetch(
      `${apiUrl}/analytics/${KINDS[kind].path}?${query}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      },
    );
    if (!res.ok) {
      return NextResponse.json(
        { error: "No se pudo obtener el ranking" },
        { status: res.status },
      );
    }
    ranking = await res.json();
  } catch (error) {
    console.error("[og/top10] ranking fetch failed", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }

  if (ranking.length === 0) {
    return NextResponse.json(
      { error: "No hay datos para ese rango" },
      { status: 404 },
    );
  }

  const flattened = ranking.map((row) => toRow(kind, row));

  const [fonts, logos] = await Promise.all([
    loadOutfit(),
    Promise.all(flattened.map((r) => inlineImage(r.logoUrl))),
  ]);

  const rows: Top10Row[] = flattened.map((row, index) => ({
    title: row.title,
    subtitle: row.subtitle,
    logo: logos[index],
  }));

  return new ImageResponse(renderTop10(rows, FOOTER, KINDS[kind].logoShape), {
    width: TOP10_WIDTH,
    height: TOP10_HEIGHT,
    fonts: toImageResponseFonts(fonts),
    // ImageResponse defaults to `public, immutable, max-age=31536000`, which is
    // right for an OG card keyed by immutable content and wrong for this: the
    // ranking changes as events arrive, so the same URL must not be frozen for
    // a year. It is also admin-only data, which has no business in a shared cache.
    headers: {
      "cache-control": "private, no-store, max-age=0, must-revalidate",
    },
  });
}
