/**
 * Accessibility utility functions (non-React utilities)
 * Provides tools for focus management, screen reader support, and WCAG compliance
 */
import { useEffect, useRef } from 'react';

// Focus management utilities
export const useFocusManagement = () => {
  const previousFocus = useRef<HTMLElement | null>(null);

  const saveFocus = () => {
    previousFocus.current = document.activeElement as HTMLElement;
  };

  const restoreFocus = () => {
    if (previousFocus.current) {
      previousFocus.current.focus();
    }
  };

  const trapFocus = (element: HTMLElement) => {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstFocusable = focusableElements[0] as HTMLElement;
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          lastFocusable.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          firstFocusable.focus();
          e.preventDefault();
        }
      }
    };

    element.addEventListener('keydown', handleTabKey);
    return () => element.removeEventListener('keydown', handleTabKey);
  };

  return { saveFocus, restoreFocus, trapFocus };
};

// Screen reader utilities
export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

// Keyboard navigation hook
export const useKeyboardNavigation = () => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape key handling
      if (e.key === 'Escape') {
        const activeModal = document.querySelector('[role="dialog"]:not([hidden])');
        if (activeModal) {
          const closeButton = activeModal.querySelector('[data-close]') as HTMLElement;
          closeButton?.click();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
};

// Color contrast utilities
export const getContrastRatio = (color1: string, color2: string): number => {
  // Simplified contrast ratio calculation
  // In a real implementation, you'd use a proper color library
  return 4.5; // Placeholder
};

export const meetsWCAGAA = (ratio: number): boolean => ratio >= 4.5;
export const meetsWCAGAAA = (ratio: number): boolean => ratio >= 7;

// Focus indicator styles (to be added to CSS)
export const focusStyles = {
  focusVisible: 'focus:outline-2 focus:outline-primary focus:outline-offset-2 focus:rounded',
  skipLink: 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-primary text-primary-foreground px-4 py-2 rounded'
};