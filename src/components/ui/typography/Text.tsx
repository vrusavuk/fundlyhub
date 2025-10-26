/**
 * Text component that enforces design system typography
 * Uses the typography scale from lib/design/typography.ts
 */
import { getTypographyClasses, colorSemantics } from '@/lib/design/typography';
import { cn } from '@/lib/utils';

interface TextProps {
  size: 'xl' | 'lg' | 'md' | 'sm';
  as?: 'p' | 'span' | 'div';
  children: React.ReactNode;
  className?: string;
  emphasis?: 'high' | 'medium' | 'low' | 'subtle';
  responsive?: boolean;
}

export function Text({ 
  size, 
  as: Component = 'p', 
  children, 
  className,
  emphasis,
  responsive = false 
}: TextProps) {
  const classes = getTypographyClasses('body', size, '', responsive);
  const emphasisClass = emphasis ? colorSemantics.emphasis[emphasis] : '';
  
  return (
    <Component className={cn(classes, emphasisClass, className)}>
      {children}
    </Component>
  );
}

interface CaptionProps {
  size: 'lg' | 'md' | 'sm' | 'xs';
  as?: 'p' | 'span' | 'div';
  children: React.ReactNode;
  className?: string;
}

export function Caption({ 
  size, 
  as: Component = 'span', 
  children, 
  className 
}: CaptionProps) {
  const classes = getTypographyClasses('caption', size);
  
  return (
    <Component className={cn(classes, 'text-muted-foreground', className)}>
      {children}
    </Component>
  );
}

interface LabelProps {
  size: 'lg' | 'md' | 'sm';
  as?: 'label' | 'span';
  children: React.ReactNode;
  className?: string;
  htmlFor?: string;
}

export function Label({ 
  size, 
  as: Component = 'label', 
  children, 
  className,
  htmlFor 
}: LabelProps) {
  const classes = getTypographyClasses('label', size);
  
  return (
    <Component htmlFor={htmlFor} className={cn(classes, 'text-foreground', className)}>
      {children}
    </Component>
  );
}
