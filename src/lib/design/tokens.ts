/**
 * Comprehensive design token system
 * Single source of truth for all design decisions
 */

export const baseTokens = {
  spacing: {
    0: '0',
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    8: '2rem',
    10: '2.5rem',
    12: '3rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
  },
  
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
    '6xl': '3.75rem',
  },
  
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  
  lineHeight: {
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
  
  borderRadius: {
    none: '0',
    sm: '0.125rem',
    DEFAULT: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    full: '9999px',
  },
  
  animation: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
    },
    easing: {
      default: 'cubic-bezier(0.4, 0, 0.2, 1)',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
} as const;

export const semanticTokens = {
  spacing: {
    component: {
      xs: baseTokens.spacing[1],
      sm: baseTokens.spacing[2],
      md: baseTokens.spacing[4],
      lg: baseTokens.spacing[6],
      xl: baseTokens.spacing[8],
    },
    section: {
      sm: baseTokens.spacing[8],
      md: baseTokens.spacing[12],
      lg: baseTokens.spacing[16],
      xl: baseTokens.spacing[24],
    },
  },
  
  typography: {
    display: {
      fontSize: baseTokens.fontSize['6xl'],
      fontWeight: baseTokens.fontWeight.bold,
      lineHeight: baseTokens.lineHeight.tight,
    },
    heading: {
      fontSize: baseTokens.fontSize['2xl'],
      fontWeight: baseTokens.fontWeight.semibold,
      lineHeight: baseTokens.lineHeight.snug,
    },
    body: {
      fontSize: baseTokens.fontSize.base,
      fontWeight: baseTokens.fontWeight.normal,
      lineHeight: baseTokens.lineHeight.normal,
    },
    caption: {
      fontSize: baseTokens.fontSize.sm,
      fontWeight: baseTokens.fontWeight.medium,
      lineHeight: baseTokens.lineHeight.normal,
    },
  },
} as const;
