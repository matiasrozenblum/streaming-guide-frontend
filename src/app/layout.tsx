import { CustomThemeProvider } from '@/contexts/ThemeContext';
import '@/styles/globals.css';
import Script from 'next/script';
import { GA_TRACKING_ID } from '@/lib/gtag';
import { HotjarLoader } from '@/components/HotjarLoader';
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Footer from "@/components/Footer";
import { YouTubePlayerProvider } from '@/contexts/YouTubeGlobalPlayerContext';
import { YouTubeGlobalPlayer } from '@/components/YouTubeGlobalPlayer';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "La Guía del Streaming",
  description: "Guía de programación de streaming",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
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
