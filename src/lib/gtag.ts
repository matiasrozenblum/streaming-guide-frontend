import posthog from 'posthog-js';
import { datadogRum } from '@datadog/browser-rum';

export const GA_TRACKING_ID = 'G-WP58Q5S1H2';

/**
 * Ensures Datadog RUM is initialized synchronously before sending an event.
 * This prevents race conditions where events fire before the useEffect in
 * ConditionalTrackingLoader has had a chance to run datadogRum.init().
 */
function ensureDatadogInit(): boolean {
  if (datadogRum.getInitConfiguration()) return true;

  if (typeof window === 'undefined') return false;

  const appId = process.env.NEXT_PUBLIC_DATADOG_APP_ID;
  const clientToken = process.env.NEXT_PUBLIC_DATADOG_CLIENT_TOKEN;
  if (!appId || !clientToken) return false;

  datadogRum.init({
    applicationId: appId,
    clientToken,
    site: 'datadoghq.com',
    service: 'la-guia-del-streaming-frontend',
    env: process.env.NODE_ENV === 'production' ? 'production' : 'staging',
    version: process.env.NEXT_PUBLIC_APP_VERSION,
    sessionSampleRate: 100,
    sessionReplaySampleRate: 0,
    trackUserInteractions: false,
    trackResources: false,
    trackLongTasks: false,
    defaultPrivacyLevel: 'mask-user-input',
  });

  return true;
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
    window.gtag('config', GA_TRACKING_ID, pageviewData);
  }

  // Send to PostHog if loaded
  if (posthog.__loaded) {
    posthog.capture('$pageview', pageviewData);
  }

  // Send to Datadog RUM (init lazily if not yet initialized)
  if (ensureDatadogInit()) {
    datadogRum.setUser({
      id: pageviewData.user_id,
      gender: pageviewData.user_gender,
      age: pageviewData.user_age,
      age_group: pageviewData.user_age_group,
      role: pageviewData.user_role,
    });
    datadogRum.addAction('$pageview', { page_path: pageviewData.page_path });
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
  // Check if analytics consent is given
  const consent = localStorage.getItem('cookie-consent');
  let hasAnalyticsConsent = false;
  if (consent) {
    try {
      const consentData = JSON.parse(consent);
      hasAnalyticsConsent = consentData.preferences?.analytics || false;
    } catch {
      // Don't track if consent data is invalid
      return;
    }
  } else {
    // Don't track if no consent data
    return;
  }

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

  // Only send to Google Analytics if analytics consent is given
  if (hasAnalyticsConsent && typeof window.gtag === 'function') {
    window.gtag('event', action, eventData);
  }

  // Only send to PostHog if analytics consent is given and PostHog is loaded
  if (hasAnalyticsConsent && posthog.__loaded) {
    posthog.capture(action, eventData);
  }

  // Only send to Datadog RUM if analytics consent is given (init lazily if needed)
  if (hasAnalyticsConsent && ensureDatadogInit()) {
    datadogRum.addAction(action, eventData);
  }
};
