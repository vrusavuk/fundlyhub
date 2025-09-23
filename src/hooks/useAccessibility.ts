/**
 * Accessibility utilities hook
 * Provides keyboard navigation and screen reader utilities
 */
import { useEffect, useRef, useCallback } from 'react';

interface UseAccessibilityOptions {
  announcePageChange?: boolean;
  trapFocus?: boolean;
  restoreFocus?: boolean;
}

export function useAccessibility({
  announcePageChange = true,
  trapFocus = false,
  restoreFocus = true
}: UseAccessibilityOptions = {}) {
  const previousFocus = useRef<HTMLElement | null>(null);

  // Announce to screen readers
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, []);

  // Save current focus
  const saveFocus = useCallback(() => {
    previousFocus.current = document.activeElement as HTMLElement;
  }, []);

  // Restore saved focus
  const restoreFocusToSaved = useCallback(() => {
    if (previousFocus.current && restoreFocus) {
      previousFocus.current.focus();
    }
  }, [restoreFocus]);

  // Focus first element in container
  const focusFirst = useCallback((container: HTMLElement) => {
    const focusable = container.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as HTMLElement;
    
    if (focusable) {
      focusable.focus();
    }
  }, []);

  // Enhanced keyboard navigation
  const handleKeyboardNavigation = useCallback((
    event: KeyboardEvent,
    options: {
      onEscape?: () => void;
      onEnter?: () => void;
      onArrowUp?: () => void;
      onArrowDown?: () => void;
      onArrowLeft?: () => void;
      onArrowRight?: () => void;
    } = {}
  ) => {
    const { onEscape, onEnter, onArrowUp, onArrowDown, onArrowLeft, onArrowRight } = options;

    switch (event.key) {
      case 'Escape':
        onEscape?.();
        break;
      case 'Enter':
      case ' ':
        onEnter?.();
        break;
      case 'ArrowUp':
        event.preventDefault();
        onArrowUp?.();
        break;
      case 'ArrowDown':
        event.preventDefault();
        onArrowDown?.();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        onArrowLeft?.();
        break;
      case 'ArrowRight':
        event.preventDefault();
        onArrowRight?.();
        break;
    }
  }, []);

  // Check if user prefers reduced motion
  const prefersReducedMotion = useCallback(() => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Check if user uses high contrast
  const prefersHighContrast = useCallback(() => {
    return window.matchMedia('(prefers-contrast: high)').matches;
  }, []);

  // Page change announcements
  useEffect(() => {
    if (announcePageChange) {
      const title = document.title;
      const main = document.querySelector('main');
      const heading = main?.querySelector('h1')?.textContent || title;
      
      announce(`Navigated to ${heading}`, 'assertive');
    }
  }, [announce, announcePageChange]);

  return {
    announce,
    saveFocus,
    restoreFocus: restoreFocusToSaved,
    focusFirst,
    handleKeyboardNavigation,
    prefersReducedMotion,
    prefersHighContrast,
  };
}

// Hook for managing focus within a component
export function useFocusManagement(isActive: boolean = true) {
  const containerRef = useRef<HTMLElement>(null);
  const { focusFirst, saveFocus, restoreFocus } = useAccessibility();

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    saveFocus();
    focusFirst(containerRef.current);

    return restoreFocus;
  }, [isActive, saveFocus, restoreFocus, focusFirst]);

  return containerRef;
}