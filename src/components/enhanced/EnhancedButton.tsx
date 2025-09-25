/**
 * Enhanced button component with better visual hierarchy and CTA prominence
 * Provides multiple variants optimized for different use cases
 */
import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ArrowRight, ExternalLink, Download, Share, Heart, Bookmark } from 'lucide-react';

interface EnhancedButtonProps extends Omit<ButtonProps, 'variant'> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'hero' | 'accent' | 'success' | 'cta' | 'premium';
  prominence?: 'primary' | 'secondary' | 'tertiary';
  icon?: 'arrow' | 'external' | 'download' | 'share' | 'heart' | 'bookmark' | React.ReactNode;
  iconPosition?: 'left' | 'right';
  gradient?: boolean;
  pulse?: boolean;
  loading?: boolean;
  loadingText?: string;
}

const getIcon = (iconType: EnhancedButtonProps['icon']) => {
  if (React.isValidElement(iconType)) return iconType;
  
  switch (iconType) {
    case 'arrow':
      return <ArrowRight className="w-4 h-4" />;
    case 'external':
      return <ExternalLink className="w-4 h-4" />;
    case 'download':
      return <Download className="w-4 h-4" />;
    case 'share':
      return <Share className="w-4 h-4" />;
    case 'heart':
      return <Heart className="w-4 h-4" />;
    case 'bookmark':
      return <Bookmark className="w-4 h-4" />;
    default:
      return null;
  }
};

export function EnhancedButton({
  children,
  className,
  variant = 'default',
  prominence = 'primary',
  icon,
  iconPosition = 'right',
  gradient = false,
  pulse = false,
  loading = false,
  loadingText = 'Loading...',
  disabled,
  ...props
}: EnhancedButtonProps) {
  const iconElement = getIcon(icon);
  
  const getVariantClasses = () => {
    const baseClasses = "relative overflow-hidden transition-all duration-300 font-semibold";
    
    switch (variant) {
      case 'cta':
        return cn(
          baseClasses,
          "bg-primary text-primary-foreground hover:bg-primary/90",
          "shadow-standard border-0 text-base px-8 py-3"
        );
      
      case 'hero':
        return cn(
          baseClasses,
          "bg-primary text-primary-foreground font-bold text-lg px-10 py-4",
          "shadow-standard border-0 hover:bg-primary/90"
        );
      
      case 'premium':
        return cn(
          baseClasses,
          "bg-accent text-accent-foreground font-bold",
          "shadow-standard border border-border hover:bg-accent/90"
        );
      
      case 'success':
        return cn(
          baseClasses,
          "bg-success text-success-foreground hover:bg-success/90",
          "shadow-minimal border-0"
        );
      
      default:
        return "";
    }
  };

  const getProminenceClasses = () => {
    switch (prominence) {
      case 'primary':
        return "text-base font-semibold px-6 py-2.5 min-h-[44px]";
      case 'secondary':
        return "text-sm font-medium px-4 py-2 min-h-[40px]";
      case 'tertiary':
        return "text-sm px-3 py-1.5 min-h-[36px]";
      default:
        return "";
    }
  };

  const combinedClassName = cn(
    getVariantClasses(),
    getProminenceClasses(),
    loading && "opacity-70 cursor-not-allowed",
    className
  );

  const buttonContent = loading && loadingText ? loadingText : children;

  return (
    <Button
      className={combinedClassName}
      variant={variant === 'cta' || variant === 'hero' || variant === 'premium' ? 'default' : variant}
      disabled={loading || disabled}
      {...props}
    >
      <span className="flex items-center gap-2">
        {iconElement && iconPosition === 'left' && (
          <span className={cn(
            "transition-transform duration-200",
            !loading && "group-hover:translate-x-0.5"
          )}>
            {iconElement}
          </span>
        )}
        
        <span className="relative">
          {buttonContent}
          {loading && (
            <span className="absolute inset-0 flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            </span>
          )}
        </span>
        
        {iconElement && iconPosition === 'right' && (
          <span className="transition-transform duration-200">
            {iconElement}
          </span>
        )}
      </span>
    </Button>
  );
}