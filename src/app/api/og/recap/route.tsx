import { NextRequest, NextResponse } from "next/server";
import { ImageResponse } from "next/og";
import { requireAccessToken } from "@/utils/auth-server";
import type { Recap } from "@/services/analytics";
import {
  renderRecap,
  RECAP_WIDTH,
  RECAP_HEIGHT,
  type RecapLayoutRow,
} from "@/lib/og/recapLayout";
import { loadOutfit, toImageResponseFonts, inlineImage } from "@/lib/og/fonts";

// Remote logo fetching and font loading both need Node APIs.
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  let token: string;
  try {
    token = await requireAccessToken(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") ?? "week";
  const date = searchParams.get("date");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const query = new URLSearchParams({ period, ...(date ? { date } : {}) });

  let recap: Recap;
  try {
    // The backend scopes the recap by JWT, so the card can only ever be built
    // from the caller's own data.
    const res = await fetch(`${apiUrl}/analytics/me/recap?${query}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: "No se pudo obtener el resumen" },
        { status: res.status },
      );
    }
    recap = await res.json();
  } catch (error) {
    console.error("[og/recap] recap fetch failed", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }

  if (!recap.enough_data) {
    return NextResponse.json(
      { error: "Todavía no hay suficiente actividad para armar un resumen" },
      { status: 404 },
    );
  }

  const [fonts, logos] = await Promise.all([
    loadOutfit(),
    Promise.all(recap.top_programs.map((p) => inlineImage(p.channel_logo_url))),
  ]);

  const rows: RecapLayoutRow[] = recap.top_programs.map((program, index) => ({
    position: program.position,
    program_name: program.program_name,
    channel_name: program.channel_name,
    plays: program.plays,
    logo: logos[index],
  }));

  return new ImageResponse(
    renderRecap({
      periodLabel: recap.period.label,
      rows,
      totalPlays: recap.totals.plays,
      distinctPrograms: recap.totals.distinct_programs,
      favoriteWeekday: recap.habits.favorite_weekday,
    }),
    {
      width: RECAP_WIDTH,
      height: RECAP_HEIGHT,
      fonts: toImageResponseFonts(fonts),
    },
  );
}
