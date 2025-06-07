import { CustomThemeProvider } from '@/contexts/ThemeContext';
import '@/styles/globals.css';
import Script from 'next/script';
import { GA_TRACKING_ID } from '@/lib/gtag';
import { HotjarLoader } from '@/components/HotjarLoader';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import Footer from '@/components/Footer';
import { YouTubePlayerProvider } from '@/contexts/YouTubeGlobalPlayerContext';
import { YouTubeGlobalPlayer } from '@/components/YouTubeGlobalPlayer';
import { ClarityLoader } from '@/components/ClarityLoader'
import SessionProviderWrapper from '@/components/SessionProviderWrapper';
import Head from 'next/head';
import { PushProvider } from '@/contexts/PushContext';
import { TooltipProvider } from '@/contexts/TooltipContext';
import posthog from 'posthog-js';
import { PostHogProvider } from '@/components/PostHogProvider';

const inter = Inter({ subsets: ['latin'] });
const GTM_ID = 'GTM-TCGNQB97';

export const metadata: Metadata = {
  title: 'La Guía del Streaming',
  description: 'Guía de programación de streaming',
  icons: {
    icon: '/favicon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

let posthogInitialized = false;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (typeof window !== 'undefined' && !posthogInitialized) {
    posthog.init('phc_ioX3gwDuENT8MoUWSacARsCFVE6bSbKaEh5u7Mie5oK', {
      api_host: 'https://app.posthog.com',
      loaded: (ph) => {
        if (process.env.NODE_ENV === 'development') ph.opt_out_capturing();
      }
    });
    posthogInitialized = true;
  }
  return (
    <html lang="es" suppressHydrationWarning>
      {/* Preconnect para GA */}
      <Head>
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://www.google-analytics.com" />
        <link rel="manifest" href="/manifest.json" />
      </Head> 
      
      {/* Google Tag Manager */}
      <Script
        id="gtm-script"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{
          __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
  })(window,document,'script','dataLayer','${GTM_ID}');`,
        }}
      />

      {/* gtag.js básico */}
      <Script
        strategy="lazyOnload"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
      />
      <Script
        id="gtag-init"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_TRACKING_ID}');
          `,
        }}
      />

      <body suppressHydrationWarning className={inter.className}>
      <PostHogProvider />
      <ClarityLoader />
        {/* Google Tag Manager (noscript) */}
        <noscript
          dangerouslySetInnerHTML={{
            __html: `<iframe src="https://www.googletagmanager.com/ns.html?id=${GTM_ID}"
  height="0" width="0" style="display:none;visibility:hidden"></iframe>`,
          }}
        />

        <HotjarLoader />
        <SessionProviderWrapper>
          <PushProvider enabled={true} installPrompt={null}>
            <TooltipProvider>
              <CustomThemeProvider>
                <YouTubePlayerProvider>
                  <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
                  {children}
                  <Footer />
                </div>
                <YouTubeGlobalPlayer />
                </YouTubePlayerProvider>
              </CustomThemeProvider>
            </TooltipProvider>
          </PushProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}