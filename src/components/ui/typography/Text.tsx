/**
 * Text component that enforces design system typography
 * Uses the typography scale from lib/design/typography.ts
 */
import { memo, forwardRef, ElementType, ComponentPropsWithoutRef } from 'react';
import { getTypographyClasses, colorSemantics } from '@/lib/design/typography';
import { cn } from '@/lib/utils';

interface TextProps extends ComponentPropsWithoutRef<'p'> {
  size?: 'xl' | 'lg' | 'md' | 'sm';
  as?: ElementType;
  emphasis?: 'high' | 'medium' | 'low' | 'subtle';
  muted?: boolean;
  responsive?: boolean;
}

export const Text = memo(
  forwardRef<HTMLParagraphElement, TextProps>(
    ({ 
      size = 'md', 
      as: Component = 'p',
      children, 
      className,
      emphasis,
      muted,
      responsive = false,
      ...restProps 
    }, ref) => {
      const classes = getTypographyClasses('body', size, '', responsive);
      const emphasisClass = emphasis ? colorSemantics.emphasis[emphasis] : '';
      const mutedClass = muted ? 'text-muted-foreground' : '';
      
      return (
        <Component 
          ref={ref}
          className={cn(classes, emphasisClass, mutedClass, className)}
          {...restProps}
        >
          {children}
        </Component>
      );
    }
  )
);

Text.displayName = 'Text';

interface CaptionProps extends ComponentPropsWithoutRef<'span'> {
  size?: 'lg' | 'md' | 'sm' | 'xs';
  as?: ElementType;
  muted?: boolean;
}

export const Caption = memo(
  forwardRef<HTMLSpanElement, CaptionProps>(
    ({ 
      size = 'md', 
      as: Component = 'span',
      children, 
      className,
      muted = true,
      ...restProps 
    }, ref) => {
      const classes = getTypographyClasses('caption', size);
      const mutedClass = muted ? 'text-muted-foreground' : '';
      
      return (
        <Component 
          ref={ref}
          className={cn(classes, mutedClass, className)}
          {...restProps}
        >
          {children}
        </Component>
      );
    }
  )
);

Caption.displayName = 'Caption';

interface LabelProps extends ComponentPropsWithoutRef<'label'> {
  size?: 'lg' | 'md' | 'sm';
  as?: ElementType;
}

export const Label = memo(
  forwardRef<HTMLLabelElement, LabelProps>(
    ({ 
      size = 'md', 
      as: Component = 'label',
      children, 
      className,
      htmlFor,
      ...restProps 
    }, ref) => {
      const classes = getTypographyClasses('label', size);
      
      return (
        <Component 
          ref={ref}
          htmlFor={htmlFor}
          className={cn(classes, 'text-foreground', className)}
          {...restProps}
        >
          {children}
        </Component>
      );
    }
  )
);

Label.displayName = 'Label';
