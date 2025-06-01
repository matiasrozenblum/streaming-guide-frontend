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
  if (typeof window.gtag === 'function') {
    window.gtag('config', GA_TRACKING_ID, {
      page_path: url,
    });
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
export const event = ({ action, params }: { action: string; params?: GtagEventParams }) => {
  // Get user data from session if available
  const nextData = (window as { __NEXT_DATA__?: NextData }).__NEXT_DATA__;
  const userData = nextData?.props?.pageProps?.session?.user || {};
  
  // Calculate age if birthDate is available
  let age: number | undefined;
  if (userData.birthDate) {
    const birthDate = new Date(userData.birthDate);
    const today = new Date();
    age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
  }

  if (typeof window.gtag === 'function') {
    window.gtag('event', action, {
      ...params,
      // Add user data if available
      user_id: userData.id,
      user_gender: userData.gender,
      user_age: age,
      user_role: userData.role,
    });
  }

  // Always send to PostHog
  posthog.capture(action, {
    ...params,
    user_id: userData.id,
    user_gender: userData.gender,
    user_age: age,
    user_role: userData.role,
  });
};
