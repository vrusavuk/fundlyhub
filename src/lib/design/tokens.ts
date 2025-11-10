/**
 * Comprehensive design token system
 * Single source of truth for all design decisions
 * Enhanced with Stripe-inspired professional aesthetics
 */

// Stripe-inspired color palette
export const stripeColors = {
  // Primary (Indigo - professional blue)
  primary: {
    50: '231 235 255',  // #E7EBFF
    100: '224 231 255', // #E0E7FF
    500: '99 102 241',  // #6366F1
    600: '79 70 229',   // #4F46E5
    700: '67 56 202',   // #4338CA
    900: '49 46 129',   // #312E81
  },
  
  // Neutrals (Slate - refined grays)
  neutral: {
    50: '248 250 252',  // #F8FAFC
    100: '241 245 249', // #F1F5F9
    200: '226 232 240', // #E2E8F0
    300: '203 213 225', // #CBD5E1
    400: '148 163 184', // #94A3B8
    500: '100 116 139', // #64748B
    600: '71 85 105',   // #475569
    700: '51 65 85',    // #334155
    800: '30 41 59',    // #1E293B
    900: '15 23 42',    // #0F172A
  },
  
  // Semantic colors
  success: '16 185 129',  // #10B981 - Green-500
  warning: '245 158 11',  // #F59E0B - Amber-500
  error: '239 68 68',     // #EF4444 - Red-500
  info: '59 130 246',     // #3B82F6 - Blue-500
};

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

// Stripe-inspired spacing (tighter for data density)
export const stripeSpacing = {
  xs: '0.25rem',  // 4px
  sm: '0.5rem',   // 8px
  md: '0.75rem',  // 12px
  lg: '1rem',     // 16px
  xl: '1.5rem',   // 24px
  '2xl': '2rem',  // 32px
  '3xl': '2.5rem', // 40px
};

// Stripe-inspired typography
export const stripeTypography = {
  sizes: {
    xs: '0.6875rem',  // 11px - Tiny labels
    sm: '0.8125rem',  // 13px - Table data, secondary text
    base: '0.875rem', // 14px - Body text
    lg: '1rem',       // 16px - Emphasized text
    xl: '1.25rem',    // 20px - Section headers
    '2xl': '1.5rem',  // 24px - Page headers
    '3xl': '2rem',    // 32px - Hero text
  },
  
  weights: {
    normal: 400,
    medium: 500,
    semibold: 600,
  },
  
  lineHeights: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

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
