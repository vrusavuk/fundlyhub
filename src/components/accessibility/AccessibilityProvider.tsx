/**
 * Accessibility context provider
 * Provides accessibility state and utilities throughout the app
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAccessibility } from '@/hooks/useAccessibility';

interface AccessibilityContextType {
  announceMessage: (message: string, priority?: 'polite' | 'assertive') => void;
  prefersReducedMotion: boolean;
  prefersHighContrast: boolean;
  keyboardNavigation: boolean;
  setKeyboardNavigation: (value: boolean) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const { announce, prefersReducedMotion, prefersHighContrast } = useAccessibility();
  const [keyboardNavigation, setKeyboardNavigation] = useState(false);

  // Detect keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setKeyboardNavigation(true);
      }
    };

    const handleMouseDown = () => {
      setKeyboardNavigation(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  // Apply body classes based on preferences
  useEffect(() => {
    const body = document.body;
    
    if (prefersReducedMotion()) {
      body.classList.add('reduce-motion');
    } else {
      body.classList.remove('reduce-motion');
    }

    if (prefersHighContrast()) {
      body.classList.add('high-contrast');
    } else {
      body.classList.remove('high-contrast');
    }

    if (keyboardNavigation) {
      body.classList.add('keyboard-navigation');
    } else {
      body.classList.remove('keyboard-navigation');
    }
  }, [prefersReducedMotion, prefersHighContrast, keyboardNavigation]);

  const value = {
    announceMessage: announce,
    prefersReducedMotion: prefersReducedMotion(),
    prefersHighContrast: prefersHighContrast(),
    keyboardNavigation,
    setKeyboardNavigation,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibilityContext() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibilityContext must be used within an AccessibilityProvider');
  }
  return context;
}