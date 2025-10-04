/**
 * Navigation Progress Indicator
 * Slim progress bar for route transitions (YouTube-style)
 * Works with BrowserRouter by tracking location changes
 */

import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export function NavigationProgress() {
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const prevLocationRef = useRef(location.pathname);

  useEffect(() => {
    // Detect route change
    if (prevLocationRef.current !== location.pathname) {
      // Show progress bar
      setIsVisible(true);
      setProgress(0);

      // Animate to 70% quickly
      const quick = setTimeout(() => setProgress(70), 100);
      
      // Slowly progress to 90%
      const slow = setTimeout(() => setProgress(90), 300);
      
      // Complete when route is fully loaded
      const complete = setTimeout(() => {
        setProgress(100);
        
        // Fade out
        setTimeout(() => {
          setIsVisible(false);
          setProgress(0);
        }, 200);
      }, 500);

      prevLocationRef.current = location.pathname;

      return () => {
        clearTimeout(quick);
        clearTimeout(slow);
        clearTimeout(complete);
      };
    }
  }, [location.pathname]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[100] h-1 bg-gradient-to-r from-primary via-primary/80 to-primary"
      style={{
        width: `${progress}%`,
        transition: progress === 100 
          ? 'width 200ms ease-out, opacity 200ms ease-out' 
          : 'width 300ms ease-out',
        opacity: progress === 100 ? 0 : 1,
      }}
    />
  );
}
