'use client';

import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme, Theme, Box, CircularProgress, Components } from '@mui/material';
import type { ThemeOptions } from '@mui/material/styles';

interface ThemeContextType {
  mode: 'dark';
  theme: Theme;
}

const ThemeContext = createContext<ThemeContextType>({} as ThemeContextType);

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a CustomThemeProvider');
  }
  return context;
};

const getDesignTokens = (): ThemeOptions => ({
  palette: {
    mode: 'dark',
    primary: {
      main: '#3b82f6',
      light: '#60a5fa',
      dark: '#2563eb',
    },
    secondary: {
      main: '#10b981',
      light: '#34d399',
      dark: '#059669',
    },
    background: {
      default: '#0f172a',
      paper: '#1e293b',
    },
    text: {
      primary: '#f1f5f9',
      secondary: '#cbd5e1',
    },
  },
  typography: {
    fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '1.875rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    subtitle1: {
      fontSize: '1.125rem',
      lineHeight: 1.5,
    },
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableRipple: true,
      },
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 12,
          padding: '10px 20px',
          boxShadow: 'none',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.3)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          color: '#ffffff',
          '&:hover': {
            background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
          },
        },
        outlined: {
          borderColor: '#334155',
          color: '#94a3b8',
          backgroundColor: '#1e293b',
          '&:hover': {
            borderColor: '#475569',
            backgroundColor: '#334155',
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#0f172a',
          padding: '12px 16px',
          maxWidth: 320,
          fontSize: '0.875rem',
          lineHeight: 1.5,
          borderRadius: 8,
        },
        arrow: {
          color: '#0f172a',
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          '@media (min-width: 600px)': {
            maxWidth: 'min(1920px, 100%)', // Max 1920px but never exceed container width
            marginLeft: 'auto',
            marginRight: 'auto',
            paddingLeft: 0,
            paddingRight: 0,
            boxSizing: 'border-box',
          },
        },
      },
    },
  } as Components<Theme>,
});

export const CustomThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    setMounted(true);
  }, []);

  const theme = useMemo(() => createTheme(getDesignTokens()), []);
  const contextValue = useMemo(() => ({ mode: 'dark' as const, theme }), [theme]);

  if (!mounted) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100dvh"
        sx={{ backgroundColor: '#0f172a' }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={theme}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};