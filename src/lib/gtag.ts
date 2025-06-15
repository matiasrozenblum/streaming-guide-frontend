import posthog from 'posthog-js';

export const GA_TRACKING_ID = 'G-WP58Q5S1H2';

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
    user_role: user?.role,
  };

  if (typeof window.gtag === 'function') {
    window.gtag('config', GA_TRACKING_ID, pageviewData);
  }

  // Send to PostHog if loaded
  if (posthog.__loaded) {
    posthog.capture('$pageview', pageviewData);
  }
};

type GtagEventParams = {
  [key: string]: string | number | boolean | undefined;
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
};
