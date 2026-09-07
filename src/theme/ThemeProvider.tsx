'use client';

import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { theme } from './theme';

/**
 * Applies the app's single dark theme. It renders children immediately (no
 * mount gate) so pages are server-rendered and reach non-JS crawlers.
 */
export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  return <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>;
}

export default AppThemeProvider;
