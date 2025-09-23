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
          "bg-primary text-primary-foreground hover:bg-primary-hover",
          "shadow-lg hover:shadow-xl hover:-translate-y-0.5",
          "border-0 text-base px-8 py-3",
          gradient && "bg-gradient-to-r from-primary to-primary-hover",
          pulse && "animate-pulse"
        );
      
      case 'hero':
        return cn(
          baseClasses,
          "bg-gradient-to-r from-primary via-primary-hover to-accent",
          "text-white font-bold text-lg px-10 py-4",
          "shadow-2xl hover:shadow-primary/25",
          "hover:scale-105 active:scale-95",
          "border-0"
        );
      
      case 'premium':
        return cn(
          baseClasses,
          "bg-gradient-to-r from-accent via-primary to-secondary",
          "text-white font-bold",
          "shadow-xl hover:shadow-2xl",
          "border-2 border-accent/20",
          "hover:border-accent/40",
          "before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/0 before:via-white/20 before:to-white/0",
          "before:translate-x-[-100%] before:transition-transform before:duration-700",
          "hover:before:translate-x-[100%]"
        );
      
      case 'success':
        return cn(
          baseClasses,
          "bg-success text-success-foreground hover:bg-success/90",
          "shadow-md hover:shadow-lg hover:shadow-success/20",
          "border-0"
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
          <span className={cn(
            "transition-transform duration-200",
            !loading && "group-hover:translate-x-1"
          )}>
            {iconElement}
          </span>
        )}
      </span>
    </Button>
  );
}