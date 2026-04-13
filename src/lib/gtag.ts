import posthog from 'posthog-js';
import { datadogRum } from '@datadog/browser-rum';

export const GA_TRACKING_ID = 'G-WP58Q5S1H2';

// Module-level flag — avoids calling datadogRum.getInitConfiguration() which
// throws a TrustedScript CSP error in Next.js on some browsers.
let datadogInited = false;

export function initDatadogRum(): void {
  if (datadogInited) return;
  if (typeof window === 'undefined') return;

  const appId = process.env.NEXT_PUBLIC_DATADOG_APP_ID;
  const clientToken = process.env.NEXT_PUBLIC_DATADOG_CLIENT_TOKEN;
  if (!appId || !clientToken) return;

  try {
    datadogRum.init({
      applicationId: appId,
      clientToken,
      site: 'datadoghq.com',
      service: 'la-guia-del-streaming-frontend',
      env: process.env.NODE_ENV === 'production' ? 'production' : 'staging',
      version: process.env.NEXT_PUBLIC_APP_VERSION,
      sessionSampleRate: 100,
      sessionReplaySampleRate: 0,
      trackUserInteractions: true,
      trackResources: true,
      trackLongTasks: true,
      defaultPrivacyLevel: 'mask-user-input',
    });
    datadogInited = true;
  } catch (e) {
    console.warn('[Datadog] init FAILED:', e);
  }
}

declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event',
      targetId: string,
      config?: Record<string, unknown>
    ) => void;
  }
}

export const pageview = (url: string) => {
  // Check if analytics consent is given
  const consent = localStorage.getItem('cookie-consent');
  if (consent) {
    try {
      const consentData = JSON.parse(consent);
      if (!consentData.preferences?.analytics) {
        return; // Don't track if analytics consent not given
      }
    } catch {
      return; // Don't track if consent data is invalid
    }
  } else {
    return; // Don't track if no consent data
  }

  // Get user data from window.__NEXT_DATA__
  const nextData = (window as { __NEXT_DATA__?: NextData }).__NEXT_DATA__;
  const user = nextData?.props?.pageProps?.session?.user || {};

  // Don't track admin users to avoid polluting metrics
  if (user?.role === 'admin') return;

  // Calculate age if birthDate is available
  let age: number | undefined;
  if (user?.birthDate) {
    const birthDate = new Date(user.birthDate);
    const today = new Date();
    age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
  }

  const pageviewData = {
    page_path: url,
    user_id: user?.id,
    user_gender: user?.gender,
    user_age: age,
    user_age_group: getAgeGroup(user?.birthDate),
    user_role: user?.role,
  };

  if (typeof window.gtag === 'function') {
    try {
      window.gtag('config', GA_TRACKING_ID, pageviewData);
    } catch { /* gtag Trusted Types error — non-fatal */ }
  }

  // Send to PostHog if loaded
  if (posthog.__loaded) {
    try {
      posthog.capture('$pageview', pageviewData);
    } catch { /* non-fatal */ }
  }

  // Send to Datadog RUM if initialized — use startView() for native page view tracking
  // (feeds visitors/sessions/bounce rate in RUM analytics, unlike addAction which only creates custom events)
  if (datadogInited) {
    try {
      datadogRum.startView({ name: pageviewData.page_path });
    } catch (e) {
      console.warn('[Datadog] startView error:', e);
    }
  }
};

type GtagEventParams = {
  [key: string]: string | number | boolean | undefined;
};

/**
 * Calculate age group from birth date
 */
const getAgeGroup = (birthDate: string | Date | undefined): string => {
  if (!birthDate) return 'unknown';

  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  if (age < 18) return 'under_18';
  if (age < 25) return '18_24';
  if (age < 35) return '25_34';
  if (age < 45) return '35_44';
  if (age < 55) return '45_54';
  if (age < 65) return '55_64';
  return '65_plus';
};

type NextData = {
  props?: {
    pageProps?: {
      session?: {
        user?: {
          id?: string;
          gender?: string;
          birthDate?: string;
          role?: string;
        };
      };
    };
  };
};

/**
 * Dispara un evento en GA4 con nombre `name` y parámetros `params`.
 * En params puedes incluir lo que necesites: name, type, id, duration, index...
 * Si hay una sesión activa, incluye datos del usuario como gender and age
 */
export const event = ({ action, params, userData }: { action: string; params?: GtagEventParams; userData?: { id?: string; gender?: string; birthDate?: string; role?: string } }) => {
  // Resolve consent state:
  //   hasAnalyticsConsent — user explicitly accepted analytics
  //   analyticsExplicitlyRejected — user explicitly rejected analytics
  //   Neither flag set — user hasn't responded yet (opt-out model applies)
  const consent = localStorage.getItem('cookie-consent');
  let hasAnalyticsConsent = false;
  let analyticsExplicitlyRejected = false;
  if (consent) {
    try {
      const consentData = JSON.parse(consent);
      hasAnalyticsConsent = consentData.preferences?.analytics === true;
      analyticsExplicitlyRejected = consentData.preferences?.analytics === false;
    } catch {
      // Don't track if consent data is invalid
      return;
    }
  }
  // If user hasn't responded yet, GA4 and PostHog still require explicit consent,
  // but Datadog uses opt-out model (tracks unless explicitly rejected).

  // Use userData if provided, otherwise try to get from window.__NEXT_DATA__
  let user = userData;
  if (!user) {
    const nextData = (window as { __NEXT_DATA__?: NextData }).__NEXT_DATA__;
    user = nextData?.props?.pageProps?.session?.user || {};
  }

  // Don't track admin users to avoid polluting metrics
  if (user?.role === 'admin') return;

  // Calculate age if birthDate is available
  let age: number | undefined;
  if (user?.birthDate) {
    const birthDate = new Date(user.birthDate);
    const today = new Date();
    age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
  }

  const eventData = {
    ...params,
    user_id: user?.id,
    user_gender: user?.gender,
    user_age: age,
    user_age_group: getAgeGroup(user?.birthDate),
    user_role: user?.role,
  };

  // Only send to Google Analytics if analytics consent is given.
  // Wrapped in try-catch: gtag.js violates Trusted Types CSP on some browsers
  // and would otherwise throw synchronously, blocking PostHog and Datadog.
  if (hasAnalyticsConsent && typeof window.gtag === 'function') {
    try {
      window.gtag('event', action, eventData);
    } catch { /* gtag Trusted Types error — non-fatal */ }
  }

  // Only send to PostHog if analytics consent is given and PostHog is loaded
  if (hasAnalyticsConsent && posthog.__loaded) {
    try {
      posthog.capture(action, eventData);
    } catch { /* non-fatal */ }
  }

  // Send to Datadog RUM using opt-out model: track unless user explicitly rejected.
  // Mirrors PostHog's behavior so both tools have comparable coverage.
  if (!analyticsExplicitlyRejected && datadogInited) {
    try {
      datadogRum.addAction(action, eventData);
    } catch (e) {
      console.warn('[Datadog] addAction error:', e);
    }
  }
};
