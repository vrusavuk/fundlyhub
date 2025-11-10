/**
 * Stripe-Inspired Spacing System
 * 
 * Consistent spacing tokens for admin pages to maintain clean,
 * professional layouts matching Stripe's design principles.
 */

export const stripeSpacing = {
  // Page-level spacing
  page: {
    header: 'py-4',          // Header padding (white section)
    content: 'py-6',         // Content area padding (gray section)
    section: 'mb-6',         // Space between major sections
  },
  
  // Component spacing
  component: {
    tight: 'gap-2',          // Minimal spacing (buttons, badges)
    normal: 'gap-4',         // Standard spacing (form fields)
    relaxed: 'gap-6',        // Spacious (sections)
  },
  
  // Container padding
  container: {
    none: 'px-0',
    small: 'px-4',
    normal: 'px-6',          // Standard horizontal padding
    large: 'px-8',
  }
} as const;

// Helper function to combine spacing classes
export function combineSpacing(...classes: string[]): string {
  return classes.filter(Boolean).join(' ');
}
