/**
 * Tour Provider with enhanced error handling
 * Manages onboarding tours and interactions with safe fallbacks
 */
import React, { useState, useEffect, useCallback, ReactNode } from 'react';
import { TourStep } from '../types';
import { TourActionService } from '../services/TourActionService';
import { TourBackdrop } from './TourBackdrop';
import { TourDialog } from './TourDialog';
import { TOUR_STEPS } from '../config';
import { useGlobalSearch } from '@/contexts/UnifiedSearchContext';
import { useOnboardingDemo } from '../OnboardingDemoProvider';

interface TourProviderProps {
  children: ReactNode;
  steps?: readonly TourStep[];
  isOpen?: boolean;
  onComplete?: () => void;
  onSkip?: () => void;
  onClose?: () => void;
}

export function TourProvider({ 
  children, 
  steps = TOUR_STEPS,
  isOpen = false,
  onComplete, 
  onSkip,
  onClose
}: TourProviderProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isActive, setIsActive] = useState(isOpen);
  const [actionService] = useState(() => TourActionService.getInstance());

  // Safe context usage with fallbacks
  const globalSearch = useGlobalSearch();
  const onboardingDemo = useOnboardingDemo();

  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStepIndex === steps.length - 1;

  const startTour = useCallback(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Starting onboarding tour');
    }
    
    setIsActive(true);
    setCurrentStepIndex(0);
    
    // Enable demo mode for realistic interactions
    try {
      onboardingDemo.setDemoMode(true);
      onboardingDemo.trackDemoInteraction('tour_started');
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Failed to enable demo mode:', error);
      }
    }
  }, [onboardingDemo]);

  // Initialize services when they're available
  useEffect(() => {
    try {
      if (globalSearch && onboardingDemo) {
        // Create service adapters that conform to the expected interfaces
        const searchService = {
          openHeaderSearch: globalSearch.openHeaderSearch,
          setSearchQuery: globalSearch.setSearchQuery,
          isHeaderSearchOpen: globalSearch.isHeaderSearchOpen,
          forceOpen: () => {
            // Custom force open for demo mode
            globalSearch.openHeaderSearch();
            // Also dispatch custom event as fallback
            document.dispatchEvent(new CustomEvent('open-header-search'));
          }
        };

        const demoService = {
          setDemoMode: onboardingDemo.setDemoMode
        };

        actionService.setServices(searchService, demoService);
        
        if (process.env.NODE_ENV === 'development') {
          console.log('TourActionService services initialized');
        }
      }
    } catch (error) {
      console.warn('Failed to initialize tour action services:', error);
    }
  }, [globalSearch, onboardingDemo, actionService]);

  // Sync with isOpen prop changes
  useEffect(() => {
    if (isOpen && !isActive) {
      startTour();
    } else if (!isOpen && isActive) {
      setIsActive(false);
    }
  }, [isOpen, isActive, startTour]);

  const completeTour = useCallback(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Tour completed');
    }
    
    try {
      onboardingDemo.trackDemoInteraction('tour_completed');
      onboardingDemo.setDemoMode(false);
    } catch (error) {
      console.warn('Failed to track tour completion:', error);
    }
    
    setIsActive(false);
    onComplete?.();
    onClose?.();
  }, [onboardingDemo, onComplete, onClose]);

  const skipTour = useCallback(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Tour skipped');
    }
    
    try {
      onboardingDemo.trackDemoInteraction('tour_skipped', {
        stepIndex: currentStepIndex
      });
      onboardingDemo.setDemoMode(false);
    } catch (error) {
      console.warn('Failed to track tour skip:', error);
    }
    
    setIsActive(false);
    onSkip?.();
    onClose?.();
  }, [currentStepIndex, onboardingDemo, onSkip, onClose]);

  const handleAction = useCallback(async (action: any) => {
    console.log('🎯 TourProvider: Handling action', action);
    try {
      await actionService.executeAction(action);
    } catch (error) {
      console.error('❌ TourProvider: Action execution failed:', error);
    }
  }, [actionService]);

  const nextStep = useCallback(async () => {
    if (!currentStep) return;

    if (process.env.NODE_ENV === 'development') {
      console.log('Tour: Next step', currentStepIndex + 1);
    }

    try {
      // Track interaction
      onboardingDemo.trackDemoInteraction('tour_step_completed', {
        stepIndex: currentStepIndex,
        stepId: currentStep.id,
        stepTitle: currentStep.title
      });

      if (isLastStep) {
        completeTour();
      } else {
        setCurrentStepIndex(prev => prev + 1);
      }
    } catch (error) {
      console.warn('Error during tour step execution:', error);
      // Continue to next step even if there's an error
      if (isLastStep) {
        completeTour();
      } else {
        setCurrentStepIndex(prev => prev + 1);
      }
    }
  }, [currentStep, currentStepIndex, isLastStep, onboardingDemo, completeTour]);

  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
      
      try {
        onboardingDemo.trackDemoInteraction('tour_step_back', {
          stepIndex: currentStepIndex - 1
        });
      } catch (error) {
        console.warn('Failed to track step back:', error);
      }
    }
  }, [currentStepIndex, onboardingDemo]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          skipTour();
          break;
        case 'ArrowRight':
        case ' ':
        case 'Enter':
          event.preventDefault();
          nextStep();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          prevStep();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isActive, nextStep, prevStep, skipTour]);

  return (
    <>
      {children}
      {isActive && currentStep && (
        <>
          <TourBackdrop 
            show={currentStep.config?.showBackdrop !== false} 
            opacity={currentStep.config?.backdropOpacity || 0.3}
            allowInteraction={currentStep.config?.allowBackgroundInteraction || false}
            onClick={skipTour} 
          />
          <TourDialog
            step={currentStep}
            state={{
              isActive,
              currentStep: currentStepIndex,
              steps,
              isNavigating: false,
              completedSteps: []
            }}
            isFirstStep={currentStepIndex === 0}
            isLastStep={isLastStep}
            onNext={nextStep}
            onPrevious={currentStepIndex > 0 ? prevStep : undefined}
            onClose={skipTour}
            onAction={handleAction}
          />
        </>
      )}
    </>
  );
}