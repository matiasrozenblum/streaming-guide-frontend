import { CustomThemeProvider } from '@/contexts/ThemeContext';
import '@/styles/globals.css';

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
      <body suppressHydrationWarning>
        <CustomThemeProvider>
          {children}
        </CustomThemeProvider>
      </body>
    </html>
  );
}