'use client';
import { useEffect, useState } from 'react';
import { useCookieConsent } from '@/contexts/CookieConsentContext';
import { GA_TRACKING_ID } from '@/lib/gtag';
import posthog from 'posthog-js';

const GTM_ID = 'GTM-TCGNQB97';

export function ConditionalTrackingLoader() {
  const { hasConsent, consent } = useCookieConsent();
  const [loadedScripts, setLoadedScripts] = useState({
    analytics: false,
    marketing: false,
  });

  // Initialize PostHog when analytics consent is given
  useEffect(() => {
    if (hasConsent('analytics') && typeof window !== 'undefined') {
      // Initialize PostHog
      if (!posthog.__loaded) {
        posthog.init('phc_ioX3gwDuENT8MoUWSacARsCFVE6bSbKaEh5u7Mie5oK', {
          api_host: 'https://app.posthog.com',
          loaded: (ph) => {
            if (process.env.NODE_ENV === 'development') ph.opt_out_capturing();
          }
        });
      } else {
        // Re-enable if it was disabled
        posthog.opt_in_capturing();
      }
    } else if (!hasConsent('analytics') && typeof window !== 'undefined') {
      // Opt out of PostHog if consent is withdrawn
      if (posthog.__loaded) {
        posthog.opt_out_capturing();
      }
    }
  }, [hasConsent, consent]);

  // Initialize Google Analytics when analytics consent is given
  useEffect(() => {
    if (hasConsent('analytics') && typeof window !== 'undefined' && !loadedScripts.analytics) {
      // Dynamically load GA script
      const gaScript = document.createElement('script');
      gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`;
      gaScript.async = true;
      document.head.appendChild(gaScript);

      gaScript.onload = () => {
        // Initialize gtag
        const globalWindow = window as unknown as {
          dataLayer: unknown[];
          gtag: (...args: unknown[]) => void;
        };
        globalWindow.dataLayer = globalWindow.dataLayer || [];
        function gtag(...args: unknown[]) { globalWindow.dataLayer.push(args); }
        globalWindow.gtag = gtag;
        gtag('js', new Date());
        gtag('config', GA_TRACKING_ID, {
          anonymize_ip: true,
          respect_dnt: true
        });
      };

      setLoadedScripts(prev => ({ ...prev, analytics: true }));
    }
  }, [hasConsent, loadedScripts.analytics]);

  // Initialize GTM when marketing consent is given
  useEffect(() => {
    if (hasConsent('marketing') && typeof window !== 'undefined' && !loadedScripts.marketing) {
      // Dynamically load GTM script
      const gtmScript = document.createElement('script');
      gtmScript.innerHTML = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','${GTM_ID}');`;
      document.head.appendChild(gtmScript);

      setLoadedScripts(prev => ({ ...prev, marketing: true }));
    }
  }, [hasConsent, loadedScripts.marketing]);

  // Don't render anything if no consent has been given yet
  if (!consent) return null;

  // Scripts are loaded dynamically in useEffect hooks
  return null;
}

// Component for loading Clarity only with analytics consent
export function ConditionalClarityLoader() {
  const { hasConsent } = useCookieConsent();
  const [clarityLoaded, setClarityLoaded] = useState(false);

  useEffect(() => {
    if (hasConsent('analytics') && typeof window !== 'undefined' && !clarityLoaded) {
      // Dynamically import and initialize Clarity
      import('@microsoft/clarity').then((clarityModule) => {
        const windowWithClarity = window as typeof window & { clarity?: unknown };
        if (!windowWithClarity.clarity) {
          const clarity = clarityModule as unknown as { clarity: (action: string, config: Record<string, string>) => void };
          clarity.clarity('start', {
            projectId: 'mhxe0rpxz1',
            upload: 'https://www.clarity.ms/collect'
          });
          setClarityLoaded(true);
        }
      });
    }
  }, [hasConsent, clarityLoaded]);

  return null;
}

// Component for loading Hotjar only with analytics consent
export function ConditionalHotjarLoader() {
  const { hasConsent } = useCookieConsent();
  const [hotjarLoaded, setHotjarLoaded] = useState(false);

  useEffect(() => {
    if (hasConsent('analytics') && typeof window !== 'undefined' && !hotjarLoaded) {
      // Initialize Hotjar
      interface HotjarWindow extends Window {
        hj?: {
          q?: unknown[];
          (...args: unknown[]): void;
        };
        _hjSettings?: {
          hjid: number;
          hjsv: number;
        };
      }

      const hotjarWindow = window as HotjarWindow;
      const script = document.createElement('script');
      
      hotjarWindow.hj = hotjarWindow.hj || function(...args: unknown[]) { 
        (hotjarWindow.hj!.q = hotjarWindow.hj!.q || []).push(args); 
      };
      hotjarWindow._hjSettings = { hjid: 5207197, hjsv: 6 };
      
      script.async = true;
      script.src = `https://static.hotjar.com/c/hotjar-${hotjarWindow._hjSettings.hjid}.js?sv=${hotjarWindow._hjSettings.hjsv}`;
      document.getElementsByTagName('head')[0].appendChild(script);
      setHotjarLoaded(true);
    }
  }, [hasConsent, hotjarLoaded]);

  return null;
} 