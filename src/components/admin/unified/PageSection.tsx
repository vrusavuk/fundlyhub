import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { PageSectionProps } from '@/types/admin-layout';

/**
 * PageSection - Reusable Content Section Component
 * 
 * A semantic section component for admin pages that provides:
 * - Consistent spacing between sections
 * - Optional white card background for grouped content
 * - Configurable spacing density
 * - Proper semantic HTML structure
 * 
 * Usage:
 * <PageSection spacing="normal" background="white">
 *   <h2>Section Title</h2>
 *   <p>Section content...</p>
 * </PageSection>
 */
export function PageSection({
  children,
  spacing = 'normal',
  background = 'transparent',
  className
}: PageSectionProps) {
  const spacingClasses = {
    tight: 'space-y-2',
    normal: 'space-y-4',
    relaxed: 'space-y-6'
  };

  const backgroundClasses = {
    white: 'bg-white border border-[#E3E8EE] rounded-lg p-6',
    gray: 'bg-[#F6F9FC] rounded-lg p-6',
    transparent: ''
  };

  return (
    <section
      className={cn(
        spacingClasses[spacing],
        backgroundClasses[background],
        className
      )}
    >
      {children}
    </section>
  );
}
