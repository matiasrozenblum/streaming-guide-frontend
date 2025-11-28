import { CustomThemeProvider } from '@/contexts/ThemeContext';
import '@/styles/globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import Footer from '@/components/Footer';
import { YouTubePlayerProvider } from '@/contexts/YouTubeGlobalPlayerContext';
import { YouTubeGlobalPlayer } from '@/components/YouTubeGlobalPlayer';
import SessionProviderWrapper from '@/components/SessionProviderWrapper';
import { PushProvider } from '@/contexts/PushContext';
import { TooltipProvider } from '@/contexts/TooltipContext';
import { CookieConsentProvider } from '@/contexts/CookieConsentContext';
import { CookieConsentBanner } from '@/components/CookieConsentBanner';
import { CookiePreferencesModal } from '@/components/CookiePreferencesModal';
import { 
  ConditionalTrackingLoader, 
  ConditionalClarityLoader, 
  ConditionalHotjarLoader 
} from '@/components/ConditionalTrackingLoader';
import PageviewTracker from '@/components/PageviewTracker';
import LiveStatusListener from '@/components/LiveStatusListener';
import PageRefreshListener from '@/components/PageRefreshListener';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/react';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'La Guía del Streaming',
  description: 'Guía de programación de streaming',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.png',
    apple: '/icons/icon-192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'La Guía del Streaming',
  },
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'La Guía del Streaming',
    'theme-color': '#f8fafc',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body suppressHydrationWarning className={inter.className}>
        <CookieConsentProvider>
          <SessionProviderWrapper>
            <PushProvider enabled={true} installPrompt={null}>
              <TooltipProvider>
                <CustomThemeProvider>
                  <YouTubePlayerProvider>
                    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                      <PageviewTracker />
                      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                        {children}
                      </div>
                      <Footer />
                    </div>
                    <YouTubeGlobalPlayer />
                    <LiveStatusListener />
                    <PageRefreshListener />
                    <SpeedInsights />
                    <Analytics />
                  </YouTubePlayerProvider>
                  
                  {/* Cookie Consent Components */}
                  <CookieConsentBanner />
                  <CookiePreferencesModal />
                </CustomThemeProvider>
              </TooltipProvider>
            </PushProvider>
          </SessionProviderWrapper>
          
          {/* Conditional Tracking Scripts */}
          <ConditionalTrackingLoader />
          <ConditionalClarityLoader />
          <ConditionalHotjarLoader />
        </CookieConsentProvider>
      </body>
    </html>
  );
}