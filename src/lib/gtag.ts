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

/**
 * Dispara un evento en GA4 con nombre `name` y parámetros `params`.
 * En params puedes incluir lo que necesites: name, type, id, duration, index...
 */
export const event = (
  name: string,
  params: Record<string, unknown> = {}
) => {
  if (typeof window.gtag === 'function') {
    window.gtag('event', name, {
      ...params,
      // si aún quieres mantener compatibilidad con UA:
      // event_category: params.category,
      // event_label: params.label,
      // value: params.value,
    });
  }
};
