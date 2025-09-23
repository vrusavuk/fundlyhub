/**
 * Main tour provider component with dependency injection
 */
import React, { useEffect, useMemo } from 'react';
import { TourDialog } from './TourDialog';
import { TourBackdrop } from './TourBackdrop';
import { useTourState } from '../hooks/useTourState';
import { TourActionService, SearchService, DemoService } from '../services/TourActionService';
import { TourProviderProps, TourAction } from '../types';
import { TOUR_STEPS } from '../config';
import { useGlobalSearch } from '@/contexts/SearchContext';
import { useOnboardingDemo } from '../OnboardingDemoProvider';
import { useUserPreferences } from '@/hooks/useUserPreferences';

export function TourProvider({ isOpen, onClose, onComplete }: TourProviderProps) {
  const { completeOnboarding } = useUserPreferences();
  const globalSearch = useGlobalSearch();
  const demo = useOnboardingDemo();
  
  const {
    state,
    currentStepData,
    isFirstStep,
    isLastStep,
    actions
  } = useTourState();

  // Initialize action service with dependencies
  const actionService = useMemo(() => {
    const service = TourActionService.getInstance();
    
    // Create service adapters
    const searchService: SearchService = {
      openHeaderSearch: globalSearch.openHeaderSearch,
      setSearchQuery: globalSearch.setSearchQuery
    };
    
    const demoService: DemoService = {
      setDemoMode: demo.setDemoMode
    };
    
    service.setServices(searchService, demoService);
    return service;
  }, [globalSearch, demo]);

  // Initialize tour when opened
  useEffect(() => {
    if (isOpen && !state.isActive) {
      demo.setDemoMode(true);
      actions.startTour(TOUR_STEPS);
    } else if (!isOpen && state.isActive) {
      demo.setDemoMode(false);
      actions.endTour();
    }
  }, [isOpen, state.isActive, actions, demo]);

  const handleNext = () => {
    if (state.isNavigating) return;
    
    if (isLastStep) {
      handleComplete();
    } else {
      actions.nextStep();
    }
  };

  const handlePrevious = () => {
    if (state.isNavigating || isFirstStep) return;
    actions.previousStep();
  };

  const handleComplete = () => {
    completeOnboarding();
    demo.setDemoMode(false);
    actions.endTour();
    onComplete?.();
    onClose();
  };

  const handleAction = async (action: TourAction) => {
    try {
      await actionService.executeAction(action);
    } catch (error) {
      console.error('Failed to execute tour action:', error);
    }
  };

  if (!isOpen || !state.isActive || !currentStepData) {
    return null;
  }

  const stepConfig = currentStepData.config ?? {};

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <TourBackdrop
        show={stepConfig.showBackdrop ?? true}
        opacity={stepConfig.backdropOpacity ?? 0.6}
        allowInteraction={stepConfig.allowBackgroundInteraction ?? false}
        onClick={stepConfig.allowBackgroundInteraction ? undefined : onClose}
      />
      
      <TourDialog
        step={currentStepData}
        state={state}
        isFirstStep={isFirstStep}
        isLastStep={isLastStep}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onClose={handleComplete}
        onAction={handleAction}
      />
    </div>
  );
}