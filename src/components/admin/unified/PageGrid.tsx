import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * PageGrid - Responsive Grid Layout Utility
 * 
 * A utility component for creating responsive grid layouts
 * that adapts to different screen sizes following Stripe's
 * design patterns.
 * 
 * Usage:
 * <PageGrid columns={3} gap="normal">
 *   <Card>Item 1</Card>
 *   <Card>Item 2</Card>
 *   <Card>Item 3</Card>
 * </PageGrid>
 */

interface PageGridProps {
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4;
  gap?: 'tight' | 'normal' | 'relaxed';
  className?: string;
}

export function PageGrid({
  children,
  columns = 3,
  gap = 'normal',
  className
}: PageGridProps) {
  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  };

  const gapClasses = {
    tight: 'gap-2',
    normal: 'gap-4',
    relaxed: 'gap-6'
  };

  return (
    <div
      className={cn(
        'grid',
        columnClasses[columns],
        gapClasses[gap],
        className
      )}
    >
      {children}
    </div>
  );
}
