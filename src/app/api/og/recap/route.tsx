import { NextRequest, NextResponse } from "next/server";
import { ImageResponse } from "next/og";
import { requireAccessTokenOrBearer } from "@/utils/auth-server";
import type { Recap } from "@/services/analytics";
import {
  PLACA_HEIGHT,
  PLACA_WIDTH,
} from "@/components/wrapped/placas/PlacaChrome";
import {
  PLACA_ORDER,
  Placa,
  canRender,
  type PlacaKind,
} from "@/components/wrapped/placas/Placa";
import { loadPlacaFonts } from "@/lib/og/placaFonts";
import { resolvePlacaAssets } from "@/lib/og/placaAssets";

// Remote logo fetching and font loading both need Node APIs.
export const runtime = "nodejs";

function parseKind(value: string | null): PlacaKind | null {
  return PLACA_ORDER.find((kind) => kind === value) ?? null;
}

/**
 * The image behind a share button. It renders the very same `Placa` the card on
 * screen does, at full size and with no interface around it — what you share is
 * what you were looking at.
 */
export async function GET(request: NextRequest) {
  let token: string;
  try {
    token = await requireAccessTokenOrBearer(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams, origin } = new URL(request.url);
  const period = searchParams.get("period") ?? "week";
  const date = searchParams.get("date");
  const kind = parseKind(searchParams.get("kind"));

  if (!kind) {
    return NextResponse.json(
      { error: "Placa desconocida" },
      { status: 400 },
    );
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const query = new URLSearchParams({ period, ...(date ? { date } : {}) });

  let recap: Recap;
  try {
    // The backend scopes the recap by JWT, so the placa can only ever be built
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

  // The same gate the card obeys — asking for a placa the recap cannot fill is
  // a 404 rather than an image with holes in it.
  if (!canRender(kind, recap)) {
    return NextResponse.json(
      { error: "Todavía no hay suficiente actividad para armar un resumen" },
      { status: 404 },
    );
  }

  const [fonts, assets] = await Promise.all([
    loadPlacaFonts(),
    resolvePlacaAssets(recap, origin),
  ]);

  return new ImageResponse(
    <Placa kind={kind} recap={assets.recap} logo={assets.logo} />,
    {
      width: PLACA_WIDTH,
      height: PLACA_HEIGHT,
      fonts,
      // Must override ImageResponse's default of `public, immutable,
      // max-age=31536000`. This placa is one specific user's personal data
      // behind a session; marked public, a shared cache could hand it to
      // somebody else.
      headers: {
        "cache-control": "private, no-store, max-age=0, must-revalidate",
      },
    },
  );
}
