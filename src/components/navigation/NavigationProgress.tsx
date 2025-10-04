/**
 * Navigation Progress Indicator
 * Slim progress bar for route transitions (YouTube-style)
 */

import { useEffect, useState } from 'react';
import { useNavigation } from 'react-router-dom';

export function NavigationProgress() {
  const navigation = useNavigation();
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (navigation.state === 'loading') {
      // Show progress bar
      setIsVisible(true);
      setProgress(0);

      // Animate to 70% quickly
      const quick = setTimeout(() => setProgress(70), 100);
      
      // Slowly progress to 90%
      const slow = setTimeout(() => setProgress(90), 500);

      return () => {
        clearTimeout(quick);
        clearTimeout(slow);
      };
    } else if (navigation.state === 'idle' && isVisible) {
      // Complete to 100% and fade out
      setProgress(100);
      
      const fadeOut = setTimeout(() => {
        setIsVisible(false);
        setProgress(0);
      }, 200);

      return () => clearTimeout(fadeOut);
    }
  }, [navigation.state, isVisible]);

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
