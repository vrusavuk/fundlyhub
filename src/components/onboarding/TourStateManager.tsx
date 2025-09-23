/**
 * Tour state manager for handling complex onboarding state transitions
 */
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export interface TourStep {
  id: string;
  title: string;
  description: string;
  target?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  icon: React.ComponentType<{ className?: string }>;
  action?: {
    text: string;
    onClick: () => void;
  };
  validPaths?: string[]; // Pages where this step is valid
  requiresInteraction?: boolean; // Step requires user interaction to proceed
  interactionType?: 'search' | 'click' | 'navigation';
}

export interface TourProgress {
  currentStep: number;
  completedSteps: number[];
  skippedSteps: number[];
  isPaused: boolean;
  pauseReason?: string;
  userDeviations: Array<{
    step: number;
    action: string;
    timestamp: number;
    data?: any;
  }>;
}

export interface TourRecoveryState {
  canRecover: boolean;
  recoverToStep?: number;
  recoveryMessage?: string;
}

interface TourStateContextType {
  // State
  tourProgress: TourProgress;
  recoveryState: TourRecoveryState;
  isWaitingForInteraction: boolean;
  currentStepRef: React.RefObject<any> | null;
  
  // Actions
  startTour: (steps: TourStep[]) => void;
  pauseTour: (reason: string) => void;
  resumeTour: () => void;
  nextStep: () => void;
  previousStep: () => void;
  skipStep: (stepId: string) => void;
  completeTour: () => void;
  resetTour: () => void;
  
  // Interaction handling
  trackUserDeviation: (action: string, data?: any) => void;
  handleUserInteraction: (interactionType: string, data?: any) => void;
  setWaitingForInteraction: (waiting: boolean, interactionType?: string) => void;
  
  // Recovery
  attemptRecovery: () => void;
  checkStepValidity: (step: TourStep) => boolean;
  
  // Persistence
  saveTourState: () => void;
  loadTourState: () => TourProgress | null;
}

const TourStateContext = createContext<TourStateContextType | undefined>(undefined);

export function useTourState() {
  const context = useContext(TourStateContext);
  if (!context) {
    throw new Error('useTourState must be used within TourStateProvider');
  }
  return context;
}

const TOUR_STORAGE_KEY = 'onboarding_tour_state';

interface TourStateProviderProps {
  children: React.ReactNode;
}

export function TourStateProvider({ children }: TourStateProviderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [tourSteps, setTourSteps] = useState<TourStep[]>([]);
  const [tourProgress, setTourProgress] = useState<TourProgress>({
    currentStep: 0,
    completedSteps: [],
    skippedSteps: [],
    isPaused: false,
    userDeviations: []
  });
  
  const [recoveryState, setRecoveryState] = useState<TourRecoveryState>({
    canRecover: false
  });
  
  const [isWaitingForInteraction, setIsWaitingForInteraction] = useState(false);
  const [currentStepRef, setCurrentStepRef] = useState<React.RefObject<any> | null>(null);

  // Check if current step is valid for current page
  const checkStepValidity = useCallback((step: TourStep): boolean => {
    if (!step.validPaths || step.validPaths.length === 0) return true;
    return step.validPaths.some(path => location.pathname.includes(path));
  }, [location.pathname]);

  // Save tour state to localStorage
  const saveTourState = useCallback(() => {
    try {
      localStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify({
        ...tourProgress,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('Failed to save tour state:', error);
    }
  }, [tourProgress]);

  // Load tour state from localStorage
  const loadTourState = useCallback((): TourProgress | null => {
    try {
      const stored = localStorage.getItem(TOUR_STORAGE_KEY);
      if (!stored) return null;
      
      const parsed = JSON.parse(stored);
      
      // Check if state is not too old (24 hours)
      const isStale = Date.now() - (parsed.timestamp || 0) > 24 * 60 * 60 * 1000;
      if (isStale) {
        localStorage.removeItem(TOUR_STORAGE_KEY);
        return null;
      }
      
      return parsed;
    } catch (error) {
      console.warn('Failed to load tour state:', error);
      return null;
    }
  }, []);

  // Start tour with given steps
  const startTour = useCallback((steps: TourStep[]) => {
    setTourSteps(steps);
    const savedState = loadTourState();
    
    if (savedState && savedState.currentStep < steps.length) {
      // Resume from saved state
      setTourProgress(savedState);
    } else {
      // Start fresh
      setTourProgress({
        currentStep: 0,
        completedSteps: [],
        skippedSteps: [],
        isPaused: false,
        userDeviations: []
      });
    }
    
    setRecoveryState({ canRecover: false });
  }, [loadTourState]);

  // Pause tour
  const pauseTour = useCallback((reason: string) => {
    setTourProgress(prev => ({
      ...prev,
      isPaused: true,
      pauseReason: reason
    }));
    
    // Set up recovery state
    setRecoveryState({
      canRecover: true,
      recoveryMessage: `Tour paused: ${reason}. Would you like to continue?`
    });
    
    saveTourState();
  }, [saveTourState]);

  // Resume tour
  const resumeTour = useCallback(() => {
    setTourProgress(prev => ({
      ...prev,
      isPaused: false,
      pauseReason: undefined
    }));
    
    setRecoveryState({ canRecover: false });
  }, []);

  // Move to next step
  const nextStep = useCallback(() => {
    setTourProgress(prev => {
      const newStep = Math.min(prev.currentStep + 1, tourSteps.length - 1);
      return {
        ...prev,
        currentStep: newStep,
        completedSteps: [...prev.completedSteps, prev.currentStep]
      };
    });
    setIsWaitingForInteraction(false);
  }, [tourSteps.length]);

  // Move to previous step
  const previousStep = useCallback(() => {
    setTourProgress(prev => ({
      ...prev,
      currentStep: Math.max(prev.currentStep - 1, 0)
    }));
    setIsWaitingForInteraction(false);
  }, []);

  // Skip current step
  const skipStep = useCallback((stepId: string) => {
    setTourProgress(prev => ({
      ...prev,
      skippedSteps: [...prev.skippedSteps, prev.currentStep]
    }));
    nextStep();
  }, [nextStep]);

  // Complete tour
  const completeTour = useCallback(() => {
    localStorage.removeItem(TOUR_STORAGE_KEY);
    setTourProgress({
      currentStep: 0,
      completedSteps: [],
      skippedSteps: [],
      isPaused: false,
      userDeviations: []
    });
    setTourSteps([]);
    setRecoveryState({ canRecover: false });
  }, []);

  // Reset tour
  const resetTour = useCallback(() => {
    localStorage.removeItem(TOUR_STORAGE_KEY);
    setTourProgress({
      currentStep: 0,
      completedSteps: [],
      skippedSteps: [],
      isPaused: false,
      userDeviations: []
    });
    setRecoveryState({ canRecover: false });
  }, []);

  // Track when user deviates from tour
  const trackUserDeviation = useCallback((action: string, data?: any) => {
    setTourProgress(prev => ({
      ...prev,
      userDeviations: [...prev.userDeviations, {
        step: prev.currentStep,
        action,
        timestamp: Date.now(),
        data
      }]
    }));
  }, []);

  // Handle user interactions during tour
  const handleUserInteraction = useCallback((interactionType: string, data?: any) => {
    const currentStep = tourSteps[tourProgress.currentStep];
    
    if (currentStep?.requiresInteraction && currentStep.interactionType === interactionType) {
      // Expected interaction - proceed to next step
      setIsWaitingForInteraction(false);
      nextStep();
    } else {
      // Unexpected interaction - track as deviation
      trackUserDeviation(`unexpected_${interactionType}`, data);
      
      // Decide if we should pause the tour
      if (interactionType === 'navigation' && data?.path !== location.pathname) {
        pauseTour(`User navigated to ${data.path}`);
      }
    }
  }, [tourSteps, tourProgress.currentStep, nextStep, trackUserDeviation, location.pathname, pauseTour]);

  // Set waiting for interaction state
  const setWaitingForInteractionState = useCallback((waiting: boolean, interactionType?: string) => {
    setIsWaitingForInteraction(waiting);
    if (waiting && interactionType) {
      trackUserDeviation('waiting_for_interaction', { interactionType });
    }
  }, [trackUserDeviation]);

  // Attempt to recover from paused state
  const attemptRecovery = useCallback(() => {
    const currentStep = tourSteps[tourProgress.currentStep];
    
    if (currentStep && checkStepValidity(currentStep)) {
      resumeTour();
    } else {
      // Find next valid step
      const nextValidStepIndex = tourSteps.findIndex((step, index) => 
        index > tourProgress.currentStep && checkStepValidity(step)
      );
      
      if (nextValidStepIndex !== -1) {
        setTourProgress(prev => ({
          ...prev,
          currentStep: nextValidStepIndex
        }));
        resumeTour();
      } else {
        // No valid steps remaining
        setRecoveryState({
          canRecover: false,
          recoveryMessage: 'Tour cannot continue from current page. Complete or restart tour?'
        });
      }
    }
  }, [tourSteps, tourProgress.currentStep, checkStepValidity, resumeTour]);

  // Auto-save tour state when it changes
  useEffect(() => {
    if (tourSteps.length > 0) {
      saveTourState();
    }
  }, [tourProgress, saveTourState, tourSteps.length]);

  // Monitor location changes for tour recovery
  useEffect(() => {
    if (tourProgress.isPaused && tourSteps.length > 0) {
      const currentStep = tourSteps[tourProgress.currentStep];
      if (currentStep && checkStepValidity(currentStep)) {
        setRecoveryState(prev => ({
          ...prev,
          canRecover: true,
          recoveryMessage: 'You can continue the tour from here!'
        }));
      }
    }
  }, [location.pathname, tourProgress.isPaused, tourSteps, tourProgress.currentStep, checkStepValidity]);

  const value: TourStateContextType = {
    // State
    tourProgress,
    recoveryState,
    isWaitingForInteraction,
    currentStepRef,
    
    // Actions
    startTour,
    pauseTour,
    resumeTour,
    nextStep,
    previousStep,
    skipStep,
    completeTour,
    resetTour,
    
    // Interaction handling
    trackUserDeviation,
    handleUserInteraction,
    setWaitingForInteraction: setWaitingForInteractionState,
    
    // Recovery
    attemptRecovery,
    checkStepValidity,
    
    // Persistence
    saveTourState,
    loadTourState
  };

  return (
    <TourStateContext.Provider value={value}>
      {children}
    </TourStateContext.Provider>
  );
}