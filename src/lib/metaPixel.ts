/**
 * Meta Pixel (Facebook) for ad conversion tracking.
 *
 * It is a marketing tracker, so nothing here runs until the visitor accepts
 * the "marketing" cookie category: `MetaPixelLoader` is the only caller of
 * `loadMetaPixel`, and until it runs `window.fbq` does not exist, which turns
 * every `trackMetaEvent` call into a no-op. Callers never check consent.
 *
 * No personal data is ever passed to the pixel: events go out with no
 * parameters, and automatic configuration (which scrapes buttons and page
 * metadata) is switched off.
 */

export const META_PIXEL_ID = "1434823278676903";

type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[];
  push: Fbq;
  loaded: boolean;
  version: string;
};

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

let loaded = false;

/**
 * Meta's base code, typed. Defines the `fbq` queue, loads fbevents.js into
 * <head>, initialises the pixel and records the first PageView.
 */
export function loadMetaPixel(): void {
  if (loaded || typeof window === "undefined") return;
  loaded = true;

  if (!window.fbq) {
    const fbq = function (...args: unknown[]) {
      if (fbq.callMethod) fbq.callMethod(...args);
      else fbq.queue.push(args);
    } as Fbq;
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = "2.0";
    fbq.queue = [];
    window.fbq = fbq;
    if (!window._fbq) window._fbq = fbq;

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(script);
  }

  // Client-side route changes need nothing from us: fbevents.js watches the
  // History API and sends a PageView each time the URL changes. Calling
  // track("PageView") by hand on top would not help either — the pixel drops
  // repeated PageViews it did not see a navigation for.
  window.fbq("set", "autoConfig", false, META_PIXEL_ID);
  window.fbq("init", META_PIXEL_ID);
  window.fbq("track", "PageView");
}

/** Standard event with no parameters. No-op unless the pixel was loaded. */
export function trackMetaEvent(name: "CompleteRegistration"): void {
  if (typeof window === "undefined" || !window.fbq) return;
  window.fbq("track", name);
}

/** Pauses or resumes sending when marketing consent changes after loading. */
export function setMetaPixelConsent(granted: boolean): void {
  if (typeof window === "undefined" || !window.fbq) return;
  window.fbq("consent", granted ? "grant" : "revoke");
}
