/**
 * Mobile-optimized input component with enhanced UX
 * Provides better touch handling, keyboard optimization, and haptic feedback
 */
import React, { useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { hapticFeedback, keyboardUtils, mobileFormValidation } from '@/lib/utils/mobile';

interface MobileOptimizedInputProps extends React.ComponentProps<"input"> {
  label?: string;
  fieldType?: 'email' | 'phone' | 'number' | 'currency' | 'url' | 'search' | 'password' | 'text';
  error?: string;
  showError?: boolean;
  enableHaptic?: boolean;
  autoEnhance?: boolean;
  containerClassName?: string;
}

export function MobileOptimizedInput({
  label,
  fieldType = 'text',
  error,
  showError = true,
  enableHaptic = true,
  autoEnhance = true,
  containerClassName,
  className,
  onFocus,
  onBlur,
  onChange,
  ...props
}: MobileOptimizedInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Auto-enhance input for mobile experience
  useEffect(() => {
    const input = inputRef.current;
    if (!input || !autoEnhance) return;
    
    // Enhance focus handling for mobile keyboards
    keyboardUtils.enhanceInputFocus(input);
    
    // Prevent double-tap zoom on number inputs
    if (fieldType === 'number' || fieldType === 'currency') {
      input.style.touchAction = 'manipulation';
    }
  }, [autoEnhance, fieldType]);

  // Enhanced event handlers with haptic feedback
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (enableHaptic) {
      hapticFeedback.light();
    }
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (enableHaptic && error) {
      hapticFeedback.error();
    }
    onBlur?.(e);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (enableHaptic) {
      hapticFeedback.light();
    }
    onChange?.(e);
  };

  // Get optimal input attributes for mobile
  const inputType = keyboardUtils.getOptimalInputType(fieldType);
  const inputMode = keyboardUtils.getInputMode(fieldType);

  return (
    <div className={cn("space-y-2", containerClassName)}>
      {label && (
        <Label 
          htmlFor={props.id} 
          className="text-base font-medium sm:text-sm"
        >
          {label}
        </Label>
      )}
      
      <Input
        ref={inputRef}
        type={inputType}
        inputMode={inputMode as any}
        className={cn(
          // Mobile-first styling
          "text-base sm:text-sm",
          "h-12 sm:h-10", // Larger on mobile
          "px-4 sm:px-3", // More padding on mobile
          
          // Error state styling
          error && "border-destructive focus:ring-destructive",
          
          // Auto-complete styling improvements
          "autofill:bg-background autofill:text-foreground",
          
          className
        )}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChange={handleChange}
        {...props}
      />
      
      {showError && error && (
        <p className="text-sm text-destructive font-medium animate-fade-in">
          {mobileFormValidation.getErrorMessage(fieldType, error)}
        </p>
      )}
    </div>
  );
}