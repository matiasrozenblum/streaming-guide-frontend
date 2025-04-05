export const GA_TRACKING_ID = 'G-WP58Q5S1H2';

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

export const pageview = (url: string) => {
  if (typeof window.gtag === 'function') {
    window.gtag('config', GA_TRACKING_ID, {
      page_path: url,
    });
  }
};

interface GTagEvent {
  action: string;
  category: string;
  label: string;
  value: number;
}

export const event = ({ action, category, label, value }: GTagEvent) => {
  if (typeof window.gtag === 'function') {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value,
    });
  }
};