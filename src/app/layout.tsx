import { CustomThemeProvider } from '@/contexts/ThemeContext';
import '@/styles/globals.css';
import Script from 'next/script';
import { GA_TRACKING_ID } from '@/lib/gtag';
import { HotjarLoader } from '@/components/HotjarLoader';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Footer from '@/components/Footer';
import { YouTubePlayerProvider } from '@/contexts/YouTubeGlobalPlayerContext';
import { YouTubeGlobalPlayer } from '@/components/YouTubeGlobalPlayer';

const inter = Inter({ subsets: ['latin'] });
const GTM_ID = 'GTM-TCGNQB97';

export const metadata: Metadata = {
  title: 'La Guía del Streaming',
  description: 'Guía de programación de streaming',
  icons: {
    icon: '/favicon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      {/* Google Tag Manager */}
      <Script
        id="gtm-script"
        strategy="afterInteractive"
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
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
      />
      <Script
        id="gtag-init"
        strategy="afterInteractive"
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
        {/* Google Tag Manager (noscript) */}
        <noscript
          dangerouslySetInnerHTML={{
            __html: `<iframe src="https://www.googletagmanager.com/ns.html?id=${GTM_ID}"
  height="0" width="0" style="display:none;visibility:hidden"></iframe>`,
          }}
        />

        <HotjarLoader />
        <CustomThemeProvider>
          <YouTubePlayerProvider>
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
              {children}
              <Footer />
            </div>
            <YouTubeGlobalPlayer />
          </YouTubePlayerProvider>
        </CustomThemeProvider>
      </body>
    </html>
  );
}