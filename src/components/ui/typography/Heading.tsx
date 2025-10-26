/**
 * Heading component that enforces design system typography
 * Uses the typography scale from lib/design/typography.ts
 */
import { typographyScale, getTypographyClasses } from '@/lib/design/typography';
import { cn } from '@/lib/utils';

interface HeadingProps {
  level: 'xl' | 'lg' | 'md' | 'sm' | 'xs';
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  children: React.ReactNode;
  className?: string;
  responsive?: boolean;
}

export function Heading({ 
  level, 
  as: Component = 'h2', 
  children, 
  className,
  responsive = false 
}: HeadingProps) {
  const classes = getTypographyClasses('heading', level, '', responsive);
  
  return (
    <Component className={cn(classes, 'text-foreground', className)}>
      {children}
    </Component>
  );
}

interface DisplayHeadingProps {
  level: '2xl' | 'xl' | 'lg' | 'md' | 'sm';
  as?: 'h1' | 'h2' | 'h3';
  children: React.ReactNode;
  className?: string;
  responsive?: boolean;
}

export function DisplayHeading({ 
  level, 
  as: Component = 'h1', 
  children, 
  className,
  responsive = false 
}: DisplayHeadingProps) {
  const classes = getTypographyClasses('display', level, '', responsive);
  
  return (
    <Component className={cn(classes, 'text-foreground', className)}>
      {children}
    </Component>
  );
}
