'use client';
import { useEffect, useState } from 'react';
import { useCookieConsent } from '@/contexts/CookieConsentContext';
import { useSessionContext } from '@/contexts/SessionContext';
import { GA_TRACKING_ID } from '@/lib/gtag';
import posthog from 'posthog-js';
import { datadogRum } from '@datadog/browser-rum';
import type { SessionWithToken } from '@/types/session';

const GTM_ID = 'GTM-TCGNQB97';

export function ConditionalTrackingLoader() {
  const { hasConsent, consent } = useCookieConsent();
  const { session } = useSessionContext();
  const typedSession = session as SessionWithToken | null;
  const isAdmin = typedSession?.user?.role === 'admin';
  const [loadedScripts, setLoadedScripts] = useState({
    analytics: false,
    marketing: false,
  });

  // Initialize PostHog when analytics consent is given (skip for admin users)
  useEffect(() => {
    if (isAdmin && typeof window !== 'undefined') {
      // Opt out admin users from PostHog to avoid polluting metrics
      if (posthog.__loaded) {
        posthog.opt_out_capturing();
      }
      return;
    }

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
  }, [hasConsent, consent, isAdmin]);

  // Initialize Datadog RUM when analytics consent is given (skip for admin users)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isAdmin) return;

    const appId = process.env.NEXT_PUBLIC_DATADOG_APP_ID;
    const clientToken = process.env.NEXT_PUBLIC_DATADOG_CLIENT_TOKEN;
    console.log('[Datadog] appId:', appId, '| clientToken:', clientToken ? clientToken.slice(0, 10) + '...' : undefined);
    if (!appId || !clientToken) return;

    if (hasConsent('analytics')) {
      if (!datadogRum.getInitConfiguration()) {
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
      }
    }
  }, [hasConsent, consent, isAdmin]);

  // Initialize Google Analytics when analytics consent is given (skip for admin users)
  useEffect(() => {
    if (hasConsent('analytics') && !isAdmin && typeof window !== 'undefined' && !loadedScripts.analytics) {
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
  }, [hasConsent, loadedScripts.analytics, isAdmin]);

  // Initialize GTM when marketing consent is given (skip for admin users)
  useEffect(() => {
    if (hasConsent('marketing') && !isAdmin && typeof window !== 'undefined' && !loadedScripts.marketing) {
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
  }, [hasConsent, loadedScripts.marketing, isAdmin]);

  // Don't render anything if no consent has been given yet
  if (!consent) return null;

  // Scripts are loaded dynamically in useEffect hooks
  return null;
}

// Component for loading Clarity only with analytics consent (skip for admin users)
export function ConditionalClarityLoader() {
  const { hasConsent } = useCookieConsent();
  const { session } = useSessionContext();
  const isAdmin = (session as SessionWithToken | null)?.user?.role === 'admin';
  const [clarityLoaded, setClarityLoaded] = useState(false);

  useEffect(() => {
    if (hasConsent('analytics') && !isAdmin && typeof window !== 'undefined' && !clarityLoaded) {
      // Load Clarity script directly without dynamic import
      const script = document.createElement('script');
      script.innerHTML = `
        (function(c,l,a,r,i,t,y){
          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window, document, "clarity", "script", "mhxe0rpxz1");
      `;
      document.head.appendChild(script);
      setClarityLoaded(true);
    }
  }, [hasConsent, clarityLoaded, isAdmin]);

  return null;
}

// Component for loading Hotjar only with analytics consent (skip for admin users)
export function ConditionalHotjarLoader() {
  const { hasConsent } = useCookieConsent();
  const { session } = useSessionContext();
  const isAdmin = (session as SessionWithToken | null)?.user?.role === 'admin';
  const [hotjarLoaded, setHotjarLoaded] = useState(false);

  useEffect(() => {
    if (hasConsent('analytics') && !isAdmin && typeof window !== 'undefined' && !hotjarLoaded) {
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
  }, [hasConsent, hotjarLoaded, isAdmin]);

  return null;
} 