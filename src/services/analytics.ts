import { api } from "@/services/api";

/** Mirrors the backend's DEFAULT_METRIC — the event that means "opened a live stream". */
export const DEFAULT_METRIC = "click_youtube_live";

export type Granularity = "day" | "week" | "month";
export type Platform = "web" | "ios" | "android";
export type RecapPeriod = "week" | "month" | "year";

export interface OverviewTile {
  metric: string;
  value: number;
  previous: number;
  /** null when the prior window was zero — "nuevo", not "+100%". */
  delta_pct: number | null;
}

export interface Overview {
  from: string;
  to: string;
  previous_from: string;
  previous_to: string;
  tiles: OverviewTile[];
}

export interface TrendPoint {
  bucket: string;
  count: number;
  unique_users: number;
  unique_devices: number;
}

export interface Trend {
  metric: string;
  granularity: Granularity;
  points: TrendPoint[];
}

export interface RankingRow {
  position: number;
  program_id?: number;
  program_name?: string;
  channel_id: number | null;
  channel_name: string | null;
  channel_logo_url: string | null;
  channel_background_color: string | null;
  value: number;
  unique_users: number;
  previous_position: number | null;
}

export interface EventName {
  event_name: string;
  total: number;
}

export interface RecapProgram {
  position: number;
  program_id: number;
  program_name: string;
  channel_id: number | null;
  channel_name: string | null;
  channel_logo_url: string | null;
  channel_background_color: string | null;
  plays: number;
}

export interface RecapChannel {
  position: number;
  channel_id: number;
  channel_name: string;
  channel_logo_url: string | null;
  channel_background_color: string | null;
  plays: number;
}

export interface Recap {
  enough_data: boolean;
  period: { type: RecapPeriod; from: string; to: string; label: string };
  top_programs: RecapProgram[];
  top_channels: RecapChannel[];
  totals: {
    plays: number;
    distinct_programs: number;
    distinct_channels: number;
  };
  habits: { favorite_weekday: string | null };
  comparison: { plays_delta_pct_vs_previous: number | null };
}

interface RangeParams {
  from: string;
  to: string;
  platform?: Platform;
}

export async function getOverview(params: RangeParams): Promise<Overview> {
  const { data } = await api.get<Overview>("/analytics/overview", { params });
  return data;
}

export async function getTrends(
  params: RangeParams & { metric?: string; granularity?: Granularity },
): Promise<Trend> {
  const { data } = await api.get<Trend>("/analytics/trends", { params });
  return data;
}

export async function getProgramRanking(
  params: RangeParams & { metric?: string; limit?: number },
): Promise<RankingRow[]> {
  const { data } = await api.get<RankingRow[]>("/analytics/rankings/programs", {
    params,
  });
  return data;
}

export async function getChannelRanking(
  params: RangeParams & { metric?: string; limit?: number },
): Promise<RankingRow[]> {
  const { data } = await api.get<RankingRow[]>("/analytics/rankings/channels", {
    params,
  });
  return data;
}

export async function getProgramTrend(
  programId: number,
  params: RangeParams & { metric?: string; granularity?: Granularity },
): Promise<{ program_id: number; metric: string; points: TrendPoint[] }> {
  const { data } = await api.get(`/analytics/programs/${programId}/trend`, {
    params,
  });
  return data;
}

export async function getEventNames(): Promise<EventName[]> {
  const { data } = await api.get<EventName[]>("/analytics/event-names");
  return data;
}

/** The signed-in user's own recap. The backend scopes it by JWT. */
export async function getMyRecap(params?: {
  period?: RecapPeriod;
  date?: string;
}): Promise<Recap> {
  const { data } = await api.get<Recap>("/analytics/me/recap", { params });
  return data;
}

/** Human labels for the event names the backoffice surfaces most. */
export const METRIC_LABELS: Record<string, string> = {
  click_youtube_live: "Clicks en vivo",
  click_youtube_deferred: "Clicks en diferido",
  program_subscribe: "Suscripciones a programas",
  program_unsubscribe: "Bajas de programas",
  streamer_subscribe: "Suscripciones a streamers",
  zap_use: "Uso de zapping",
  banner_click: "Clicks en banners",
  $pageview: "Vistas de página",
  home_page_visit: "Visitas al home",
  login_success: "Logins",
  signup_success: "Registros",
};

export const metricLabel = (metric: string): string =>
  METRIC_LABELS[metric] ?? metric;
