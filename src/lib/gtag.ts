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
export const event = ({ action, params, userData }: { action: string; params?: GtagEventParams; userData?: { id?: string; gender?: string; birthDate?: string; role?: string } }) => {
  // Use userData if provided, otherwise try to get from window.__NEXT_DATA__
  let user = userData;
  if (!user) {
    const nextData = (window as { __NEXT_DATA__?: NextData }).__NEXT_DATA__;
    user = nextData?.props?.pageProps?.session?.user || {};
  }
  // Debug: log userData
  console.log('userData for analytics', user);

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

  if (typeof window.gtag === 'function') {
    window.gtag('event', action, {
      ...params,
      user_id: user?.id,
      user_gender: user?.gender,
      user_age: age,
      user_role: user?.role,
    });
  }

  posthog.capture(action, {
    ...params,
    user_id: user?.id,
    user_gender: user?.gender,
    user_age: age,
    user_role: user?.role,
  });
};
