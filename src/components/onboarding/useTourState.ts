/**
 * Simple tour state management hook
 */
import { useReducer, useCallback } from 'react';

export interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  action?: {
    text: string;
    onClick: () => void;
  };
}

interface TourState {
  isActive: boolean;
  currentStep: number;
  steps: TourStep[];
  isNavigating: boolean; // Prevent rapid clicking
}

type TourAction = 
  | { type: 'START_TOUR'; steps: TourStep[] }
  | { type: 'NEXT_STEP' }
  | { type: 'PREVIOUS_STEP' }
  | { type: 'END_TOUR' }
  | { type: 'SET_NAVIGATING'; navigating: boolean };

const initialState: TourState = {
  isActive: false,
  currentStep: 0,
  steps: [],
  isNavigating: false
};

function tourReducer(state: TourState, action: TourAction): TourState {
  switch (action.type) {
    case 'START_TOUR':
      return {
        ...state,
        isActive: true,
        currentStep: 0,
        steps: action.steps,
        isNavigating: false
      };
      
    case 'NEXT_STEP':
      if (state.isNavigating) return state;
      
      const nextStep = state.currentStep + 1;
      if (nextStep >= state.steps.length) {
        return { ...state, isActive: false, currentStep: 0, steps: [], isNavigating: false };
      }
      return { ...state, currentStep: nextStep, isNavigating: true };
      
    case 'PREVIOUS_STEP':
      if (state.isNavigating || state.currentStep === 0) return state;
      
      return { ...state, currentStep: state.currentStep - 1, isNavigating: true };
      
    case 'END_TOUR':
      return { ...state, isActive: false, currentStep: 0, steps: [], isNavigating: false };
      
    case 'SET_NAVIGATING':
      return { ...state, isNavigating: action.navigating };
      
    default:
      return state;
  }
}

export function useTourState() {
  const [state, dispatch] = useReducer(tourReducer, initialState);

  const startTour = useCallback((steps: TourStep[]) => {
    dispatch({ type: 'START_TOUR', steps });
  }, []);

  const nextStep = useCallback(() => {
    dispatch({ type: 'NEXT_STEP' });
    // Clear navigation lock after a brief delay
    setTimeout(() => {
      dispatch({ type: 'SET_NAVIGATING', navigating: false });
    }, 300);
  }, []);

  const previousStep = useCallback(() => {
    dispatch({ type: 'PREVIOUS_STEP' });
    // Clear navigation lock after a brief delay
    setTimeout(() => {
      dispatch({ type: 'SET_NAVIGATING', navigating: false });
    }, 300);
  }, []);

  const endTour = useCallback(() => {
    dispatch({ type: 'END_TOUR' });
  }, []);

  const currentStepData = state.steps[state.currentStep] || null;
  const isFirstStep = state.currentStep === 0;
  const isLastStep = state.currentStep === state.steps.length - 1;

  return {
    isActive: state.isActive,
    currentStep: state.currentStep,
    currentStepData,
    totalSteps: state.steps.length,
    isFirstStep,
    isLastStep,
    isNavigating: state.isNavigating,
    startTour,
    nextStep,
    previousStep,
    endTour
  };
}