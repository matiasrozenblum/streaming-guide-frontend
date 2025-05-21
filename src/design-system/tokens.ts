export const tokens = {
  // Espaciado
  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '1rem',       // 16px
    lg: '1.5rem',     // 24px
    xl: '2rem',       // 32px
    xxl: '3rem',      // 48px
  },

  // Tipografía
  typography: {
    fontFamily: {
      primary: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      secondary: '"Roboto Mono", monospace',
    },
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      md: '1rem',       // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      xxl: '1.5rem',    // 24px
      xxxl: '2rem',     // 32px
    },
    fontWeight: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },
  },

  // Bordes
  borderRadius: {
    none: '0',
    sm: '0.25rem',    // 2px
    md: '0.25rem',     // 4px
    lg: '0.25rem',      // 8px
    xl: '0.25rem',        // 16px
    full: '9999px',
  },

  // Sombras
  boxShadow: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  },

  // Transiciones
  transition: {
    fast: '150ms',
    normal: '250ms',
    slow: '350ms',
    timing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // Z-index
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1100,
    fixed: 1200,
    modal: 1300,
    popover: 1400,
    tooltip: 1500,
  },
} as const;

// Tipos para TypeScript
export type Spacing = keyof typeof tokens.spacing;
export type TypographySize = keyof typeof tokens.typography.fontSize;
export type TypographyWeight = keyof typeof tokens.typography.fontWeight;
export type BorderRadius = keyof typeof tokens.borderRadius;
export type BoxShadow = keyof typeof tokens.boxShadow;
export type ZIndex = keyof typeof tokens.zIndex; 