'use client';

import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme, Theme, Box, CircularProgress, Components } from '@mui/material';
import type { ThemeOptions } from '@mui/material/styles';
import { event as gaEvent } from '@/lib/gtag';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
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

const getDesignTokens = (mode: ThemeMode): ThemeOptions => ({
  palette: {
    mode,
    primary: {
      main: mode === 'light' ? '#2563eb' : '#3b82f6',
      light: mode === 'light' ? '#3b82f6' : '#60a5fa',
      dark: mode === 'light' ? '#1d4ed8' : '#2563eb',
    },
    secondary: {
      main: mode === 'light' ? '#059669' : '#10b981',
      light: mode === 'light' ? '#10b981' : '#34d399',
      dark: mode === 'light' ? '#047857' : '#059669',
    },
    background: {
      default: mode === 'light' ? '#f8fafc' : '#0f172a',
      paper: mode === 'light' ? '#ffffff' : '#1e293b',
    },
    text: {
      primary: mode === 'light' ? '#111827' : '#f1f5f9',
      secondary: mode === 'light' ? '#4B5563' : '#cbd5e1',
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
            boxShadow: mode === 'light'
              ? '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
              : '0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.3)',
          },
        },
        contained: {
          background: mode === 'light'
            ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
            : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          color: '#ffffff',
          '&:hover': {
            background: mode === 'light'
              ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
              : 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
          },
        },
        outlined: {
          borderColor: mode === 'light' ? '#e2e8f0' : '#334155',
          color: mode === 'light' ? '#64748b' : '#94a3b8',
          backgroundColor: mode === 'light' ? '#ffffff' : '#1e293b',
          '&:hover': {
            borderColor: mode === 'light' ? '#cbd5e1' : '#475569',
            backgroundColor: mode === 'light' ? '#f8fafc' : '#334155',
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: mode === 'light' ? '#1e293b' : '#0f172a',
          padding: '12px 16px',
          maxWidth: 320,
          fontSize: '0.875rem',
          lineHeight: 1.5,
          borderRadius: 8,
        },
        arrow: {
          color: mode === 'light' ? '#1e293b' : '#0f172a',
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          '@media (min-width: 1200px)': {
            maxWidth: 1400,
          },
        },
      },
    },
  } as Components<Theme>,
});

export const CustomThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<ThemeMode>('light');

  useEffect(() => {
    const savedMode = localStorage.getItem('themeMode') as ThemeMode;
    if (savedMode && (savedMode === 'light' || savedMode === 'dark')) {
      setMode(savedMode);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setMode('dark');
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  const toggleTheme = () => {
    setMode((prevMode) => {
      const newMode = prevMode === 'light' ? 'dark' : 'light';
      localStorage.setItem('themeMode', newMode);
      gaEvent(
        'theme_change',
        {
        new_mode: newMode,
        old_mode: prevMode,
      });
      return newMode;
    });
  };

  const theme = useMemo(() => createTheme(getDesignTokens(mode)), [mode]);
  const contextValue = useMemo(() => ({ mode, toggleTheme, theme }), [mode, theme]);

  if (!mounted) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100dvh"
        sx={{ backgroundColor: mode === 'light' ? '#f8fafc' : '#0f172a' }}
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