/**
 * Mobile utility functions for enhanced UX
 * Provides haptic feedback, keyboard handling, and touch optimizations
 */

/**
 * Haptic feedback simulation for mobile devices
 * Provides tactile feedback for better user interaction
 */
export const hapticFeedback = {
  // Light tap feedback for buttons and selections
  light: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  },
  
  // Medium feedback for form submissions and important actions
  medium: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(25);
    }
  },
  
  // Strong feedback for errors or critical actions
  strong: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 25, 50]);
    }
  },
  
  // Success feedback for completed actions
  success: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([25, 50, 25]);
    }
  },
  
  // Error feedback for failed actions
  error: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100, 50, 100]);
    }
  }
};

/**
 * Mobile keyboard utilities
 * Helps manage virtual keyboard interactions
 */
export const keyboardUtils = {
  // Check if device likely has virtual keyboard
  hasVirtualKeyboard: () => {
    return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  },
  
  // Handle form input focus for better mobile experience
  enhanceInputFocus: (element: HTMLInputElement | HTMLTextAreaElement) => {
    if (!keyboardUtils.hasVirtualKeyboard()) return;
    
    // Scroll into view with padding for virtual keyboard
    element.addEventListener('focus', () => {
      setTimeout(() => {
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'nearest'
        });
      }, 300); // Wait for keyboard animation
    });
  },
  
  // Auto-format input types for mobile
  getOptimalInputType: (fieldType: string): string => {
    const typeMap: Record<string, string> = {
      email: 'email',
      phone: 'tel',
      number: 'number',
      currency: 'number',
      url: 'url',
      search: 'search',
      password: 'password',
      default: 'text'
    };
    
    return typeMap[fieldType] || typeMap.default;
  },
  
  // Get input mode for better mobile keyboard
  getInputMode: (fieldType: string): string => {
    const modeMap: Record<string, string> = {
      email: 'email',
      phone: 'tel',
      number: 'numeric',
      currency: 'decimal',
      url: 'url',
      search: 'search',
      default: 'text'
    };
    
    return modeMap[fieldType] || modeMap.default;
  }
};

/**
 * Touch interaction utilities
 * Enhances touch-based interactions
 */
export const touchUtils = {
  // Add touch-friendly class names
  getTouchClasses: (size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeMap = {
      sm: 'min-h-[40px] min-w-[40px]',
      md: 'min-h-[44px] min-w-[44px]',
      lg: 'min-h-[48px] min-w-[48px]'
    };
    
    return `${sizeMap[size]} touch-manipulation select-none`;
  },
  
  // Prevent double-tap zoom on specific elements
  preventDoubleTab: (element: HTMLElement) => {
    element.style.touchAction = 'manipulation';
  },
  
  // Add active state handling for mobile
  addActiveState: (element: HTMLElement, activeClass = 'opacity-70') => {
    element.addEventListener('touchstart', () => {
      element.classList.add(activeClass);
    }, { passive: true });
    
    element.addEventListener('touchend', () => {
      element.classList.remove(activeClass);
    }, { passive: true });
    
    element.addEventListener('touchcancel', () => {
      element.classList.remove(activeClass);
    }, { passive: true });
  }
};

/**
 * Form validation with mobile-friendly messages
 */
export const mobileFormValidation = {
  // Get user-friendly error messages
  getErrorMessage: (field: string, error: string): string => {
    const messages: Record<string, Record<string, string>> = {
      email: {
        required: 'Email is required',
        invalid: 'Please enter a valid email address'
      },
      password: {
        required: 'Password is required',
        minLength: 'Password must be at least 8 characters',
        weak: 'Password should include letters and numbers'
      },
      phone: {
        required: 'Phone number is required',
        invalid: 'Please enter a valid phone number'
      },
      currency: {
        required: 'Amount is required',
        invalid: 'Please enter a valid amount',
        minimum: 'Amount must be greater than $0'
      }
    };
    
    return messages[field]?.[error] || 'Please check this field';
  },
  
  // Validate form field with haptic feedback
  validateField: (
    value: string, 
    rules: { required?: boolean; minLength?: number; pattern?: RegExp }
  ): { isValid: boolean; error?: string } => {
    if (rules.required && !value.trim()) {
      hapticFeedback.error();
      return { isValid: false, error: 'required' };
    }
    
    if (rules.minLength && value.length < rules.minLength) {
      hapticFeedback.error();
      return { isValid: false, error: 'minLength' };
    }
    
    if (rules.pattern && !rules.pattern.test(value)) {
      hapticFeedback.error();
      return { isValid: false, error: 'invalid' };
    }
    
    hapticFeedback.light();
    return { isValid: true };
  }
};

/**
 * Responsive breakpoint utilities
 */
export const breakpointUtils = {
  // Check current screen size
  getScreenSize: (): 'xs' | 'sm' | 'md' | 'lg' | 'xl' => {
    const width = window.innerWidth;
    if (width < 640) return 'xs';
    if (width < 768) return 'sm';
    if (width < 1024) return 'md';
    if (width < 1280) return 'lg';
    return 'xl';
  },
  
  // Check if mobile device
  isMobile: (): boolean => {
    return breakpointUtils.getScreenSize() === 'xs';
  },
  
  // Check if tablet device
  isTablet: (): boolean => {
    const size = breakpointUtils.getScreenSize();
    return size === 'sm' || size === 'md';
  },
  
  // Check if desktop device
  isDesktop: (): boolean => {
    const size = breakpointUtils.getScreenSize();
    return size === 'lg' || size === 'xl';
  }
};