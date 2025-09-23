/**
 * Tour state management hook with reducer pattern
 */
import { useReducer, useCallback, useMemo } from 'react';
import { TourState, TourAction_Internal, TourStep, TourHookReturn } from '../types';
import { TOUR_CONFIG } from '../config';

const initialState: TourState = {
  isActive: false,
  currentStep: 0,
  steps: [],
  isNavigating: false,
  completedSteps: []
};

function tourReducer(state: TourState, action: TourAction_Internal): TourState {
  switch (action.type) {
    case 'START_TOUR':
      return {
        ...initialState,
        isActive: true,
        steps: action.payload.steps
      };
      
    case 'NEXT_STEP': {
      if (state.isNavigating) return state;
      
      const nextStep = state.currentStep + 1;
      if (nextStep >= state.steps.length) {
        return { ...initialState };
      }
      
      return {
        ...state,
        currentStep: nextStep,
        isNavigating: true,
        completedSteps: [...state.completedSteps, state.currentStep]
      };
    }
      
    case 'PREVIOUS_STEP': {
      if (state.isNavigating || state.currentStep === 0) return state;
      
      return {
        ...state,
        currentStep: state.currentStep - 1,
        isNavigating: true
      };
    }
      
    case 'END_TOUR':
      return { ...initialState };
      
    case 'SET_NAVIGATING':
      return {
        ...state,
        isNavigating: action.payload.navigating
      };
      
    case 'MARK_COMPLETED': {
      const stepIndex = action.payload.stepIndex;
      if (state.completedSteps.includes(stepIndex)) return state;
      
      return {
        ...state,
        completedSteps: [...state.completedSteps, stepIndex]
      };
    }
      
    default:
      return state;
  }
}

export function useTourState(): TourHookReturn {
  const [state, dispatch] = useReducer(tourReducer, initialState);

  const startTour = useCallback((steps: readonly TourStep[]) => {
    dispatch({ type: 'START_TOUR', payload: { steps } });
  }, []);

  const nextStep = useCallback(() => {
    dispatch({ type: 'NEXT_STEP' });
    // Clear navigation lock after debounce period
    setTimeout(() => {
      dispatch({ type: 'SET_NAVIGATING', payload: { navigating: false } });
    }, TOUR_CONFIG.NAVIGATION_DEBOUNCE_MS);
  }, []);

  const previousStep = useCallback(() => {
    dispatch({ type: 'PREVIOUS_STEP' });
    // Clear navigation lock after debounce period
    setTimeout(() => {
      dispatch({ type: 'SET_NAVIGATING', payload: { navigating: false } });
    }, TOUR_CONFIG.NAVIGATION_DEBOUNCE_MS);
  }, []);

  const endTour = useCallback(() => {
    dispatch({ type: 'END_TOUR' });
  }, []);

  const currentStepData = useMemo(() => 
    state.steps[state.currentStep] ?? null, 
    [state.steps, state.currentStep]
  );

  const isFirstStep = useMemo(() => 
    state.currentStep === 0, 
    [state.currentStep]
  );

  const isLastStep = useMemo(() => 
    state.currentStep === state.steps.length - 1, 
    [state.currentStep, state.steps.length]
  );

  const actions = useMemo(() => ({
    startTour,
    nextStep,
    previousStep,
    endTour
  }), [startTour, nextStep, previousStep, endTour]);

  return {
    state,
    currentStepData,
    isFirstStep,
    isLastStep,
    actions
  };
}