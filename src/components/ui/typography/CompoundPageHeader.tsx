import { ReactNode } from 'react';
import { DisplayHeading } from './Heading';
import { Text } from './Text';
import { cn } from '@/lib/utils';

/**
 * Compound component pattern for consistent page headers
 * Enforces design system hierarchy and spacing
 */
interface PageHeaderProps {
  children: ReactNode;
  className?: string;
}

interface PageHeaderTitleProps {
  children: ReactNode;
  className?: string;
  level?: '2xl' | 'xl' | 'lg' | 'md' | 'sm';
}

interface PageHeaderDescriptionProps {
  children: ReactNode;
  className?: string;
}

interface PageHeaderActionsProps {
  children: ReactNode;
  className?: string;
}

export function CompoundPageHeader({ children, className }: PageHeaderProps) {
  return (
    <header className={cn('space-y-2 mb-6 sm:mb-8', className)} role="banner">
      {children}
    </header>
  );
}

CompoundPageHeader.Title = function PageHeaderTitle({ 
  children, 
  className,
  level = 'md' 
}: PageHeaderTitleProps) {
  return (
    <DisplayHeading 
      level={level} 
      as="h1" 
      responsive
      className={cn('leading-tight', className)}
    >
      {children}
    </DisplayHeading>
  );
};

CompoundPageHeader.Description = function PageHeaderDescription({ 
  children, 
  className 
}: PageHeaderDescriptionProps) {
  return (
    <Text 
      size="lg" 
      emphasis="low" 
      className={cn('max-w-3xl', className)}
      as="p"
    >
      {children}
    </Text>
  );
};

CompoundPageHeader.Actions = function PageHeaderActions({ 
  children, 
  className 
}: PageHeaderActionsProps) {
  return (
    <div className={cn('flex items-center gap-2 mt-4', className)} role="group">
      {children}
    </div>
  );
};
