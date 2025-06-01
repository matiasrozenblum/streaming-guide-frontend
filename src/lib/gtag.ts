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
 * Si hay una sesión activa, incluye datos del usuario como gender y age
 */
export const event = (
  name: string,
  params: Record<string, unknown> = {}
) => {
  if (typeof window.gtag === 'function') {
    // Get user data from session if available
    const session = (window as any).__NEXT_DATA__?.props?.pageProps?.session;
    const userData = session?.user || {};
    
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

    window.gtag('event', name, {
      ...params,
      // Add user data if available
      user_id: userData.id,
      user_gender: userData.gender,
      user_age: age,
      user_role: userData.role,
      // si aún quieres mantener compatibilidad con UA:
      // event_category: params.category,
      // event_label: params.label,
      // value: params.value,
    });
  }
};
