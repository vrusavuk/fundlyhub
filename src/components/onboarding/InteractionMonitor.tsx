/**
 * Interaction monitor for tracking user behavior during onboarding tour
 */
import { useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTourState } from './TourStateManager';
import { useOnboardingDemo } from './OnboardingDemoProvider';

interface InteractionMonitorProps {
  isActive: boolean;
  onInteraction?: (type: string, data?: any) => void;
}

export function InteractionMonitor({ isActive, onInteraction }: InteractionMonitorProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { handleUserInteraction, trackUserDeviation, tourProgress } = useTourState();
  const { isDemoMode, trackDemoInteraction } = useOnboardingDemo();
  
  const previousPath = useRef(location.pathname);
  const interactionTimeouts = useRef<Set<NodeJS.Timeout>>(new Set());

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      interactionTimeouts.current.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  // Monitor navigation changes
  useEffect(() => {
    if (!isActive) return;

    if (previousPath.current !== location.pathname) {
      const navigationData = {
        from: previousPath.current,
        to: location.pathname,
        step: tourProgress.currentStep
      };

      handleUserInteraction('navigation', navigationData);
      onInteraction?.('navigation', navigationData);
      
      if (isDemoMode) {
        trackDemoInteraction('tour_navigation', navigationData);
      }

      previousPath.current = location.pathname;
    }
  }, [location.pathname, isActive, handleUserInteraction, onInteraction, tourProgress.currentStep, isDemoMode, trackDemoInteraction]);

  // Monitor clicks on interactive elements
  const handleClick = useCallback((event: MouseEvent) => {
    if (!isActive) return;

    const target = event.target as HTMLElement;
    const clickData = {
      tagName: target.tagName,
      className: target.className,
      id: target.id,
      textContent: target.textContent?.slice(0, 50),
      step: tourProgress.currentStep,
      timestamp: Date.now()
    };

    // Special handling for search-related clicks
    if (target.closest('[data-search-trigger]')) {
      handleUserInteraction('search_trigger_click', clickData);
      trackDemoInteraction('search_trigger_clicked', clickData);
      return;
    }

    if (target.closest('[data-search-result]')) {
      handleUserInteraction('search_result_click', clickData);
      trackDemoInteraction('search_result_clicked', clickData);
      return;
    }

    if (target.closest('[data-search-suggestion]')) {
      handleUserInteraction('search_suggestion_click', clickData);
      trackDemoInteraction('search_suggestion_clicked', clickData);
      return;
    }

    // Track campaign card clicks
    if (target.closest('[data-campaign-card]')) {
      handleUserInteraction('campaign_click', clickData);
      trackDemoInteraction('campaign_clicked', clickData);
      return;
    }

    // Track category clicks
    if (target.closest('[data-category-card]')) {
      handleUserInteraction('category_click', clickData);
      trackDemoInteraction('category_clicked', clickData);
      return;
    }

    // Track general clicks
    trackUserDeviation('click', clickData);
    onInteraction?.('click', clickData);
    
    if (isDemoMode) {
      trackDemoInteraction('tour_click', clickData);
    }
  }, [isActive, handleUserInteraction, trackUserDeviation, onInteraction, tourProgress.currentStep, isDemoMode, trackDemoInteraction]);

  // Monitor keyboard interactions
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isActive) return;

    const keyData = {
      key: event.key,
      code: event.code,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      shiftKey: event.shiftKey,
      step: tourProgress.currentStep,
      timestamp: Date.now()
    };

    // Handle search shortcuts
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
      event.preventDefault(); // Prevent default behavior during tour
      handleUserInteraction('search_shortcut', keyData);
      trackDemoInteraction('search_shortcut_used', keyData);
      return;
    }

    // Handle escape key
    if (event.key === 'Escape') {
      handleUserInteraction('escape_key', keyData);
      trackDemoInteraction('escape_pressed', keyData);
      return;
    }

    // Track other significant keys
    if (['Enter', 'Tab', 'Space'].includes(event.key)) {
      trackUserDeviation('keyboard', keyData);
      onInteraction?.('keyboard', keyData);
      
      if (isDemoMode) {
        trackDemoInteraction('tour_keyboard', keyData);
      }
    }
  }, [isActive, handleUserInteraction, trackUserDeviation, onInteraction, tourProgress.currentStep, isDemoMode, trackDemoInteraction]);

  // Monitor form interactions
  const handleInput = useCallback((event: Event) => {
    if (!isActive) return;

    const target = event.target as HTMLInputElement;
    const inputData = {
      type: target.type,
      name: target.name,
      value: target.value?.slice(0, 50), // Limit value length for privacy
      placeholder: target.placeholder,
      step: tourProgress.currentStep,
      timestamp: Date.now()
    };

    // Special handling for search inputs
    if (target.placeholder?.toLowerCase().includes('search')) {
      // Debounce search input tracking
      const timeoutId = setTimeout(() => {
        handleUserInteraction('search_input', inputData);
        trackDemoInteraction('search_typed', inputData);
        interactionTimeouts.current.delete(timeoutId);
      }, 500);
      
      interactionTimeouts.current.add(timeoutId);
      return;
    }

    // Track other form inputs
    trackUserDeviation('input', inputData);
    onInteraction?.('input', inputData);
    
    if (isDemoMode) {
      trackDemoInteraction('tour_input', inputData);
    }
  }, [isActive, handleUserInteraction, trackUserDeviation, onInteraction, tourProgress.currentStep, isDemoMode, trackDemoInteraction]);

  // Monitor scroll behavior
  const handleScroll = useCallback(() => {
    if (!isActive) return;

    const scrollData = {
      scrollY: window.scrollY,
      scrollX: window.scrollX,
      step: tourProgress.currentStep,
      timestamp: Date.now()
    };

    // Debounce scroll tracking
    const timeoutId = setTimeout(() => {
      trackUserDeviation('scroll', scrollData);
      onInteraction?.('scroll', scrollData);
      
      if (isDemoMode) {
        trackDemoInteraction('tour_scroll', scrollData);
      }
      
      interactionTimeouts.current.delete(timeoutId);
    }, 100);
    
    interactionTimeouts.current.add(timeoutId);
  }, [isActive, trackUserDeviation, onInteraction, tourProgress.currentStep, isDemoMode, trackDemoInteraction]);

  // Monitor resize events (important for mobile)
  const handleResize = useCallback(() => {
    if (!isActive) return;

    const resizeData = {
      width: window.innerWidth,
      height: window.innerHeight,
      step: tourProgress.currentStep,
      timestamp: Date.now()
    };

    trackUserDeviation('resize', resizeData);
    onInteraction?.('resize', resizeData);
    
    if (isDemoMode) {
      trackDemoInteraction('tour_resize', resizeData);
    }
  }, [isActive, trackUserDeviation, onInteraction, tourProgress.currentStep, isDemoMode, trackDemoInteraction]);

  // Monitor focus changes
  const handleFocusChange = useCallback((event: FocusEvent) => {
    if (!isActive) return;

    const target = event.target as HTMLElement;
    const focusData = {
      tagName: target.tagName,
      className: target.className,
      id: target.id,
      type: (target as HTMLInputElement).type,
      step: tourProgress.currentStep,
      timestamp: Date.now()
    };

    // Special handling for search focus
    if (target.matches('input[placeholder*="Search"], input[placeholder*="search"]')) {
      handleUserInteraction('search_focus', focusData);
      trackDemoInteraction('search_focused', focusData);
      return;
    }

    trackUserDeviation('focus', focusData);
    onInteraction?.('focus', focusData);
    
    if (isDemoMode) {
      trackDemoInteraction('tour_focus', focusData);
    }
  }, [isActive, handleUserInteraction, trackUserDeviation, onInteraction, tourProgress.currentStep, isDemoMode, trackDemoInteraction]);

  // Set up event listeners
  useEffect(() => {
    if (!isActive) return;

    document.addEventListener('click', handleClick, true);
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('input', handleInput, true);
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });
    document.addEventListener('focusin', handleFocusChange, true);

    return () => {
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('input', handleInput, true);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('focusin', handleFocusChange, true);
    };
  }, [isActive, handleClick, handleKeyDown, handleInput, handleScroll, handleResize, handleFocusChange]);

  return null; // This component doesn't render anything
}