import { NextRequest, NextResponse } from "next/server";
import { ImageResponse } from "next/og";
import { requireAccessToken } from "@/utils/auth-server";
import type { RankingRow } from "@/services/analytics";
import {
  renderTop10,
  TOP10_WIDTH,
  TOP10_HEIGHT,
  type Top10Row,
} from "@/lib/og/top10Layout";
import { loadOutfit, toImageResponseFonts, inlineImage } from "@/lib/og/fonts";

// Remote logo fetching and font loading both need Node APIs.
export const runtime = "nodejs";

const ROWS = 10;
const FOOTER = "*usuarios live en laguiadelstreaming.com o app";

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
  const metric = searchParams.get("metric") ?? "click_youtube_live";

  if (!from || !to) {
    return NextResponse.json(
      { error: "from and to are required" },
      { status: 400 },
    );
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const query = new URLSearchParams({ from, to, metric, limit: String(ROWS) });

  let ranking: RankingRow[];
  try {
    const res = await fetch(`${apiUrl}/analytics/rankings/programs?${query}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
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

  const [fonts, logos] = await Promise.all([
    loadOutfit(),
    Promise.all(ranking.map((r) => inlineImage(r.channel_logo_url))),
  ]);

  const rows: Top10Row[] = ranking.map((row, index) => ({
    program_name: row.program_name ?? null,
    channel_name: row.channel_name,
    logo: logos[index],
  }));

  return new ImageResponse(renderTop10(rows, FOOTER), {
    width: TOP10_WIDTH,
    height: TOP10_HEIGHT,
    fonts: toImageResponseFonts(fonts),
  });
}
