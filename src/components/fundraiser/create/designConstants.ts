/**
 * Design constants for fundraiser creation wizard
 * Ensures consistency across all steps
 */

export const WIZARD_SPACING = {
  // Main containers
  stepContainer: 'component-hierarchy', // space-y-3 sm:space-y-4
  
  // Form fields
  fieldGroup: 'stripe-space-sm', // space-y-2
  fieldStack: 'stripe-space-lg', // space-y-4
  
  // Card sections
  cardSection: 'stripe-space-lg', // space-y-4
  cardSubsection: 'stripe-space-md', // space-y-3
  
  // Nested content
  alertContent: 'stripe-space-md', // space-y-3
  listItems: 'stripe-space-sm', // space-y-2
} as const;

export const WIZARD_TYPOGRAPHY = {
  // Headings
  stepTitle: 'text-xl sm:text-2xl font-bold',
  sectionTitle: 'text-lg font-semibold',
  subsectionTitle: 'text-base font-semibold',
  cardTitle: 'text-sm font-medium text-muted-foreground',
  
  // Body text
  bodyText: 'text-sm',
  helperText: 'text-xs text-muted-foreground',
  
  // Labels
  fieldLabel: 'text-sm font-medium',
  requiredMark: 'text-destructive',
} as const;

export const WIZARD_ICONS = {
  // Icon sizes
  hero: 'h-6 w-6', // Feature/main icons
  standard: 'h-4 w-4', // UI icons (buttons, alerts)
  inline: 'h-3.5 w-3.5', // Inline with text
} as const;

export const WIZARD_CARDS = {
  // Padding
  outerCard: 'mobile-card-spacing', // p-3 sm:p-4 md:p-6
  nestedCard: 'p-4',
  
  // Headers
  cardHeader: 'pb-3',
  cardContent: 'pt-0',
  
  // Interactions
  interactive: 'cursor-pointer transition-all duration-200 hover:border-primary/50 hover:shadow-standard',
  selected: 'border-2 border-primary shadow-standard',
  
  // States
  validState: 'border-success/30',
  invalidState: 'border-2 border-warning',
} as const;

export const WIZARD_ALERTS = {
  // Base styles
  info: 'border-border bg-accent/50 p-4',
  success: 'border-success/20 bg-success/10 p-4',
  warning: 'border-warning/20 bg-warning/10 p-4',
  error: 'border-destructive/20 bg-destructive/10 p-4',
  
  // Icon
  icon: 'h-4 w-4',
  
  // Content
  description: 'text-sm',
} as const;

export const WIZARD_BUTTONS = {
  // Footer container - grid layout ensures consistent button positioning
  footer: 'grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-2 sm:gap-3 items-center sm:sticky md:fixed bottom-0 left-0 right-0 md:left-auto md:right-auto md:max-w-screen-2xl md:mx-auto bg-background/95 backdrop-blur-sm p-3 border-t border-border z-50',
  
  // Button props
  size: 'lg' as const,
  className: 'w-full sm:w-auto touch-button',
} as const;

export const WIZARD_BADGES = {
  // Variants
  status: 'secondary' as const,
  feature: 'default' as const,
  
  // Size
  className: 'text-xs',
} as const;

export const WIZARD_GAPS = {
  // Inline elements
  tight: 'gap-1.5',
  inline: 'gap-2',
  
  // Containers
  standard: 'gap-3',
  responsive: 'gap-3 sm:gap-4',
  
  // Sections
  section: 'gap-4 sm:gap-6',
} as const;
