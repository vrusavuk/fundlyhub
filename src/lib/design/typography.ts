/**
 * Typography system with standardized scales and utilities
 * Provides consistent text sizing, spacing, and hierarchy
 */

export const typographyScale = {
  // Display sizes - for hero sections and large headings
  display: {
    '2xl': 'text-6xl font-bold leading-tight tracking-tight', // 72px
    'xl': 'text-5xl font-bold leading-tight tracking-tight',  // 48px
    'lg': 'text-4xl font-bold leading-tight tracking-tight',  // 36px
    'md': 'text-3xl font-bold leading-snug tracking-tight',   // 30px
    'sm': 'text-2xl font-bold leading-snug tracking-tight',   // 24px
  },
  
  // Heading sizes - for section titles and card headers
  heading: {
    'xl': 'text-2xl font-bold leading-tight',     // 24px
    'lg': 'text-xl font-bold leading-tight',      // 20px
    'md': 'text-lg font-semibold leading-snug',   // 18px
    'sm': 'text-base font-semibold leading-snug', // 16px
    'xs': 'text-sm font-semibold leading-normal', // 14px
  },
  
  // Body text sizes - for paragraphs and content
  body: {
    'xl': 'text-lg leading-relaxed',    // 18px
    'lg': 'text-base leading-relaxed',  // 16px
    'md': 'text-sm leading-relaxed',    // 14px
    'sm': 'text-xs leading-normal',     // 12px
  },
  
  // Caption sizes - for small text and metadata
  caption: {
    'lg': 'text-sm font-medium leading-normal',  // 14px
    'md': 'text-xs font-medium leading-normal',  // 12px
    'sm': 'text-xs leading-tight',               // 12px
    'xs': 'text-[10px] leading-tight',           // 10px
  },
  
  // Label sizes - for form labels and UI elements
  label: {
    'lg': 'text-sm font-semibold leading-normal uppercase tracking-wider',
    'md': 'text-xs font-semibold leading-normal uppercase tracking-wide',
    'sm': 'text-[10px] font-semibold leading-tight uppercase tracking-wide',
  }
} as const;

export const spacingScale = {
  // Content spacing - for text and component spacing
  content: {
    'xs': 'space-y-2',   // 8px
    'sm': 'space-y-3',   // 12px
    'md': 'space-y-4',   // 16px
    'lg': 'space-y-6',   // 24px
    'xl': 'space-y-8',   // 32px
    '2xl': 'space-y-12', // 48px
  },
  
  // Section spacing - for page sections and major content blocks
  section: {
    'xs': 'space-y-6',   // 24px
    'sm': 'space-y-8',   // 32px
    'md': 'space-y-12',  // 48px
    'lg': 'space-y-16',  // 64px
    'xl': 'space-y-20',  // 80px
    '2xl': 'space-y-24', // 96px
  },
  
  // Component spacing - for internal component layout
  component: {
    'xs': 'gap-1',   // 4px
    'sm': 'gap-2',   // 8px
    'md': 'gap-3',   // 12px
    'lg': 'gap-4',   // 16px
    'xl': 'gap-6',   // 24px
    '2xl': 'gap-8',  // 32px
  }
} as const;

export const colorSemantics = {
  // Status colors
  status: {
    success: 'text-success',
    warning: 'text-warning', 
    error: 'text-destructive',
    info: 'text-primary',
    neutral: 'text-muted-foreground'
  },
  
  // Emphasis levels
  emphasis: {
    high: 'text-foreground font-bold',
    medium: 'text-foreground font-semibold',
    low: 'text-muted-foreground font-normal',
    subtle: 'text-muted-foreground/70 font-light'
  },
  
  // Interactive states
  interactive: {
    default: 'text-foreground hover:text-primary',
    primary: 'text-primary hover:text-primary-hover',
    secondary: 'text-secondary hover:text-secondary/80',
    muted: 'text-muted-foreground hover:text-foreground'
  }
} as const;

// Utility functions for consistent typography
export const getTypographyClasses = (
  type: keyof typeof typographyScale,
  size: string,
  color?: string,
  responsive?: boolean
) => {
  const baseClasses = typographyScale[type]?.[size as keyof typeof typographyScale[typeof type]] || '';
  const colorClasses = color || '';
  
  // Add responsive classes for mobile-first design
  const responsiveClasses = responsive ? {
    'display-2xl': 'text-4xl sm:text-5xl md:text-6xl',
    'display-xl': 'text-3xl sm:text-4xl md:text-5xl',
    'display-lg': 'text-2xl sm:text-3xl md:text-4xl',
    'heading-xl': 'text-lg sm:text-xl md:text-2xl',
    'heading-lg': 'text-base sm:text-lg md:text-xl',
    'body-xl': 'text-base sm:text-lg',
    'body-lg': 'text-sm sm:text-base',
  } : {};
  
  const responsiveClass = responsive ? responsiveClasses[`${type}-${size}` as keyof typeof responsiveClasses] : '';
  
  return [baseClasses, colorClasses, responsiveClass].filter(Boolean).join(' ');
};

export const getSpacingClasses = (
  type: keyof typeof spacingScale,
  size: string,
  responsive?: boolean
) => {
  const baseClasses = spacingScale[type]?.[size as keyof typeof spacingScale[typeof type]] || '';
  
  // Add responsive spacing variants
  if (responsive) {
    const responsiveMap = {
      'content-md': 'space-y-3 sm:space-y-4',
      'content-lg': 'space-y-4 sm:space-y-6',
      'content-xl': 'space-y-6 sm:space-y-8',
      'section-md': 'space-y-8 sm:space-y-12',
      'section-lg': 'space-y-12 sm:space-y-16',
      'component-md': 'gap-2 sm:gap-3',
      'component-lg': 'gap-3 sm:gap-4',
    };
    
    return responsiveMap[`${type}-${size}` as keyof typeof responsiveMap] || baseClasses;
  }
  
  return baseClasses;
};

// Design tokens for consistent design system
export const designTokens = {
  // Border radius scale
  radius: {
    'none': 'rounded-none',
    'sm': 'rounded-sm',
    'md': 'rounded-md', 
    'lg': 'rounded-lg',
    'xl': 'rounded-xl',
    '2xl': 'rounded-2xl',
    'full': 'rounded-full',
  },
  
  // Shadow scale
  shadow: {
    'none': 'shadow-none',
    'sm': 'shadow-sm',
    'md': 'shadow-md',
    'lg': 'shadow-lg',
    'xl': 'shadow-xl',
    '2xl': 'shadow-2xl',
    'inner': 'shadow-inner',
  },
  
  // Opacity scale
  opacity: {
    '0': 'opacity-0',
    '10': 'opacity-10',
    '20': 'opacity-20',
    '50': 'opacity-50',
    '70': 'opacity-70',
    '90': 'opacity-90',
    '100': 'opacity-100',
  }
} as const;