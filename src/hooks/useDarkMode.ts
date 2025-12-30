/**
 * Hook to detect if dark mode is currently active
 * Monitors both the document classList and system preference
 */
import { useState, useEffect } from 'react';

export function useDarkMode(): boolean {
  const [isDark, setIsDark] = useState(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    
    // Initial check
    setIsDark(root.classList.contains('dark'));
    
    // Watch for class changes on html element
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setIsDark(root.classList.contains('dark'));
        }
      });
    });

    observer.observe(root, { attributes: true, attributeFilter: ['class'] });

    // Also listen for system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      // Re-check the classList since the app may have applied the change
      setIsDark(root.classList.contains('dark'));
    };
    
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return isDark;
}
