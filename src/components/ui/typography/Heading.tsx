/**
 * Heading component that enforces design system typography
 * Uses the typography scale from lib/design/typography.ts
 */
import { memo, forwardRef, ElementType, ComponentPropsWithoutRef } from 'react';
import { getTypographyClasses } from '@/lib/design/typography';
import { cn } from '@/lib/utils';

interface HeadingProps extends ComponentPropsWithoutRef<'h2'> {
  level: 'xl' | 'lg' | 'md' | 'sm' | 'xs';
  as?: ElementType;
  responsive?: boolean;
  'aria-label'?: string;
}

/**
 * Enterprise-grade Heading component with performance optimizations
 */
export const Heading = memo(
  forwardRef<HTMLHeadingElement, HeadingProps>(
    ({ 
      level, 
      as: Component = 'h2',
      children, 
      className,
      responsive = false,
      id,
      'aria-label': ariaLabel,
      ...restProps 
    }, ref) => {
      const classes = getTypographyClasses('heading', level, '', responsive);
      
      const headingId = id || (typeof children === 'string' 
        ? children.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        : undefined);
      
      return (
        <Component 
          ref={ref}
          id={headingId}
          aria-label={ariaLabel}
          className={cn(classes, 'text-foreground', className)}
          {...restProps}
        >
          {children}
        </Component>
      );
    }
  )
);

Heading.displayName = 'Heading';

interface DisplayHeadingProps extends ComponentPropsWithoutRef<'h1'> {
  level: '2xl' | 'xl' | 'lg' | 'md' | 'sm';
  as?: ElementType;
  responsive?: boolean;
  'aria-label'?: string;
}

export const DisplayHeading = memo(
  forwardRef<HTMLHeadingElement, DisplayHeadingProps>(
    ({ 
      level, 
      as: Component = 'h1',
      children, 
      className,
      responsive = false,
      id,
      'aria-label': ariaLabel,
      ...restProps 
    }, ref) => {
      const classes = getTypographyClasses('display', level, '', responsive);
      
      const headingId = id || (typeof children === 'string' 
        ? children.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        : undefined);
      
      return (
        <Component 
          ref={ref}
          id={headingId}
          aria-label={ariaLabel}
          className={cn(classes, 'text-foreground', className)}
          {...restProps}
        >
          {children}
        </Component>
      );
    }
  )
);

DisplayHeading.displayName = 'DisplayHeading';
