/**
 * Type definitions for the onboarding system
 */
import { LucideIcon } from 'lucide-react';

export interface TourStep {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly icon: LucideIcon;
  readonly action?: TourAction;
  readonly config?: StepConfig;
}

export interface TourAction {
  readonly text: string;
  readonly type: 'demo-search' | 'navigation' | 'custom' | 'highlight-section' | 'navigate-and-scroll';
  readonly payload?: Record<string, unknown>;
}

export interface StepConfig {
  readonly showBackdrop?: boolean;
  readonly backdropOpacity?: number;
  readonly allowBackgroundInteraction?: boolean;
  readonly autoProgress?: boolean;
  readonly progressDelay?: number;
}

export interface TourState {
  readonly isActive: boolean;
  readonly currentStep: number;
  readonly steps: readonly TourStep[];
  readonly isNavigating: boolean;
  readonly completedSteps: readonly number[];
}

export type TourAction_Internal = 
  | { type: 'START_TOUR'; payload: { steps: readonly TourStep[] } }
  | { type: 'NEXT_STEP' }
  | { type: 'PREVIOUS_STEP' }
  | { type: 'END_TOUR' }
  | { type: 'SET_NAVIGATING'; payload: { navigating: boolean } }
  | { type: 'MARK_COMPLETED'; payload: { stepIndex: number } };

export interface TourHookReturn {
  readonly state: TourState;
  readonly currentStepData: TourStep | null;
  readonly isFirstStep: boolean;
  readonly isLastStep: boolean;
  readonly actions: {
    readonly startTour: (steps: readonly TourStep[]) => void;
    readonly nextStep: () => void;
    readonly previousStep: () => void;
    readonly endTour: () => void;
  };
}

export interface TourDialogProps {
  readonly step: TourStep;
  readonly state: TourState;
  readonly isFirstStep: boolean;
  readonly isLastStep: boolean;
  readonly onNext: () => void;
  readonly onPrevious: () => void;
  readonly onClose: () => void;
  readonly onAction?: (action: TourAction) => void;
}

export interface TourProviderProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onComplete?: () => void;
}