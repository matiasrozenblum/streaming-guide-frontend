/**
 * Client-side buffer for our own analytics endpoint.
 *
 * Every event already goes to PostHog, Datadog RUM, GA4 and Clarity, but none of
 * them keeps history long enough to answer "how did this program trend over the
 * year?" — Datadog RUM retains a month. This queue feeds the first-party store
 * that does.
 *
 * Events are batched rather than posted individually: opening the grid and
 * clicking through a few programs produces a burst, and one request per click
 * would be both wasteful and slow. The queue flushes on a timer, when it fills,
 * and — critically — when the page is being hidden or unloaded, where
 * sendBeacon is the only transport the browser guarantees to complete.
 *
 * Nothing here ever throws into the caller. Losing an analytics event is
 * acceptable; breaking a click handler to record one is not.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
const ENDPOINT = `${API_URL}/analytics/events`;

/** Matches MAX_EVENTS_PER_BATCH on the server. */
const MAX_BATCH = 50;
const FLUSH_AT = 20;
const FLUSH_INTERVAL_MS = 10_000;

export interface QueuedEvent {
  name: string;
  ts: string;
  program_id?: number;
  channel_id?: number;
  program_name?: string;
  channel_name?: string;
  properties?: Record<string, unknown>;
}

interface Identity {
  user_gender?: string;
  user_age_group?: string;
  user_role?: string;
}

let queue: QueuedEvent[] = [];
let identity: Identity = {};
let timer: ReturnType<typeof setInterval> | null = null;
let listenersBound = false;

function platform(): string {
  return "web";
}

/** Stable per-install id, shared with the one useDeviceId already persists. */
function deviceId(): string | undefined {
  try {
    let id = localStorage.getItem("device_id");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("device_id", id);
    }
    return id;
  } catch {
    // Private mode or blocked storage — the batch still goes, just unattributed.
    return undefined;
  }
}

/** Per-tab id, so the server can count sessions without cookies. */
function sessionId(): string | undefined {
  try {
    let id = sessionStorage.getItem("analytics_session_id");
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem("analytics_session_id", id);
    }
    return id;
  } catch {
    return undefined;
  }
}

function buildPayload(events: QueuedEvent[]): string {
  return JSON.stringify({
    device_id: deviceId(),
    session_id: sessionId(),
    platform: platform(),
    app_version: process.env.NEXT_PUBLIC_APP_VERSION,
    ...identity,
    events,
  });
}

/**
 * `useBeacon` is set when the page is going away. sendBeacon survives unload
 * where fetch does not, but it cannot carry an Authorization header — those
 * events land anonymous, attributed only by device_id. That is the right
 * trade-off at unload: an anonymous event beats a lost one.
 */
function send(events: QueuedEvent[], useBeacon: boolean): void {
  if (events.length === 0) return;

  const body = buildPayload(events);

  if (useBeacon && typeof navigator !== "undefined" && navigator.sendBeacon) {
    try {
      navigator.sendBeacon(
        ENDPOINT,
        new Blob([body], { type: "application/json" }),
      );
      return;
    } catch {
      // Fall through to fetch.
    }
  }

  try {
    void fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
      credentials: "omit",
    }).catch(() => {
      // Server down, offline, adblocker — all silent by design.
    });
  } catch {
    // Ignore.
  }
}

export function flushAnalyticsQueue(useBeacon = false): void {
  if (queue.length === 0) return;

  const pending = queue;
  queue = [];

  for (let i = 0; i < pending.length; i += MAX_BATCH) {
    send(pending.slice(i, i + MAX_BATCH), useBeacon);
  }
}

function ensureStarted(): void {
  if (typeof window === "undefined") return;

  if (!timer) {
    timer = setInterval(() => flushAnalyticsQueue(false), FLUSH_INTERVAL_MS);
  }

  if (!listenersBound) {
    // visibilitychange is the reliable signal on mobile, where a backgrounded
    // tab is often killed without ever firing pagehide or unload.
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flushAnalyticsQueue(true);
    });
    window.addEventListener("pagehide", () => flushAnalyticsQueue(true));
    listenersBound = true;
  }
}

/**
 * Attach the traits the server stores alongside each event. Called when the
 * session resolves; `user_role` is only ever used to drop admin events.
 */
export function setAnalyticsIdentity(next: Identity): void {
  identity = {
    user_gender: next.user_gender,
    user_age_group: next.user_age_group,
    user_role: next.user_role,
  };
}

export function enqueueAnalyticsEvent(event: QueuedEvent): void {
  if (typeof window === "undefined") return;

  try {
    ensureStarted();
    queue.push(event);
    if (queue.length >= FLUSH_AT) flushAnalyticsQueue(false);
  } catch {
    // Never let instrumentation break the caller.
  }
}

/** Test seam: drops queued events and unbinds the timer. */
export function __resetAnalyticsQueue(): void {
  queue = [];
  identity = {};
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
