import { CustomThemeProvider } from '@/contexts/ThemeContext';
import '@/styles/globals.css';
import Script from 'next/script';
import { GA_TRACKING_ID } from '@/lib/gtag';

export const metadata = {
  title: 'TV Schedule',
  description: 'Your complete guide to weekly programming',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
        <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`} // Reemplazá con tu ID
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
      <body suppressHydrationWarning>
        <CustomThemeProvider>
          {children}
        </CustomThemeProvider>
      </body>
    </html>
  );
}