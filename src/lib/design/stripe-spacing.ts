/**
 * Stripe-Inspired Spacing System
 * 
 * Consistent spacing tokens for admin pages to maintain clean,
 * professional layouts matching Stripe's design principles.
 */

export const stripeSpacing = {
  // Page-level spacing
  page: {
    header: {
      padding: 'px-8 py-6',           // Header padding (Stripe-style)
      background: 'bg-white',         // Clean white background
    },
    content: {
      padding: 'p-8',                 // Content area padding
      background: 'bg-white',         // Clean white background
    },
    section: {
      marginBottom: 'mb-6',           // Space between major sections
      gap: 'space-y-6',               // Vertical spacing within sections
    }
  },
  
  // Component spacing
  component: {
    tight: 'gap-2',                   // Minimal spacing (buttons, badges)
    normal: 'gap-4',                  // Standard spacing (form fields)
    relaxed: 'gap-6',                 // Spacious (sections)
  },
  
  // Container padding
  container: {
    none: 'px-0',
    small: 'px-4',
    normal: 'px-6',                   // Standard horizontal padding
    large: 'px-8',
  },
  
  // Grid spacing
  grid: {
    tight: 'gap-2',
    normal: 'gap-4',
    relaxed: 'gap-6',
  }
} as const;

// Helper function to combine spacing classes
export function combineSpacing(...classes: string[]): string {
  return classes.filter(Boolean).join(' ');
}
