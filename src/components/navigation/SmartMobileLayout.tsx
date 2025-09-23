/**
 * Smart mobile layout optimization component
 * Provides enhanced mobile user experience with proper spacing and touch targets
 */
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SmartMobileLayoutProps {
  children: ReactNode;
  className?: string;
  enableSafeArea?: boolean;
  optimizeForTouch?: boolean;
}

export function SmartMobileLayout({ 
  children, 
  className,
  enableSafeArea = true,
  optimizeForTouch = true 
}: SmartMobileLayoutProps) {
  return (
    <div 
      className={cn(
        "w-full",
        enableSafeArea && "pb-safe-bottom pt-safe-top",
        optimizeForTouch && "touch-manipulation",
        className
      )}
      style={{
        WebkitTapHighlightColor: 'transparent', // Remove iOS tap highlight
        userSelect: 'none', // Prevent text selection on touch
      }}
    >
      {children}
    </div>
  );
}

// CSS safe area utilities (to be added to CSS if needed)
export const MOBILE_SAFE_AREA_CSS = `
  .pb-safe-bottom {
    padding-bottom: max(1rem, env(safe-area-inset-bottom));
  }
  
  .pt-safe-top {
    padding-top: max(0.5rem, env(safe-area-inset-top));
  }
  
  .touch-manipulation {
    touch-action: manipulation;
  }
`;