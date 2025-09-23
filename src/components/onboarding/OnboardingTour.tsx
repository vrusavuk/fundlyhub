/**
 * Enhanced interactive onboarding tour with comprehensive state management
 */
import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { ResponsiveTourTooltip } from './ResponsiveTourTooltip';
import { InteractionMonitor } from './InteractionMonitor';
import { useTourState, TourStep } from './TourStateManager';
import { useOnboardingDemo } from './OnboardingDemoProvider';
import { useGlobalSearch } from '@/contexts/SearchContext';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { hapticFeedback } from '@/lib/utils/mobile';
import { cn } from '@/lib/utils';
import { 
  ArrowRight, 
  ArrowLeft, 
  X, 
  Sparkles,
  Search,
  Heart,
  Eye,
  Users,
  CheckCircle,
  RotateCcw,
  Play,
  Pause
} from 'lucide-react';

const ENHANCED_ONBOARDING_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to FundlyGive! 🎉',
    description: 'Let\'s take a quick tour to help you discover amazing fundraising campaigns and learn how to make a difference.',
    icon: Sparkles,
    validPaths: ['/'],
  },
  {
    id: 'search',
    title: 'Smart Search Experience',
    description: 'Our intelligent search helps you find campaigns by cause, location, or keywords. Go ahead and try searching for "education" - we\'ll guide you through the results!',
    target: '[data-search-trigger]',
    position: 'bottom',
    icon: Search,
    validPaths: ['/'],
    requiresInteraction: true,
    interactionType: 'search',
    action: {
      text: 'Try Interactive Search',
      onClick: () => {} // Will be handled by the enhanced system
    }
  },
  {
    id: 'categories',
    title: 'Browse Categories',
    description: 'Explore campaigns by category to find causes you care about. Each category shows live statistics and trending causes.',
    target: '[data-category-filter]',
    position: 'top',
    icon: Heart,
    validPaths: ['/'],
  },
  {
    id: 'campaigns',
    title: 'Discover Campaigns',
    description: 'View campaign cards with progress, goals, and impact. Click any card to learn more and donate.',
    target: '[data-campaign-grid]',
    position: 'top',
    icon: Eye,
    validPaths: ['/'],
  },
  {
    id: 'community',
    title: 'Join the Community',
    description: 'Follow creators, bookmark campaigns, and see the impact you\'re making with other supporters.',
    icon: Users,
    validPaths: ['/'],
  },
  {
    id: 'complete',
    title: 'You\'re All Set! ✨',
    description: 'You\'re ready to explore and support amazing causes. Happy giving!',
    icon: CheckCircle,
    validPaths: ['/'],
  }
];

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OnboardingTour({ isOpen, onClose }: OnboardingTourProps) {
  const location = useLocation();
  const { completeOnboarding } = useUserPreferences();
  const { openHeaderSearch, setSearchQuery } = useGlobalSearch();
  const { 
    setDemoMode, 
    simulateSearchInteraction, 
    trackDemoInteraction 
  } = useOnboardingDemo();
  
  const {
    tourProgress,
    recoveryState,
    isWaitingForInteraction,
    startTour,
    pauseTour,
    resumeTour,
    nextStep,
    previousStep,
    skipStep,
    completeTour,
    handleUserInteraction,
    setWaitingForInteraction,
    attemptRecovery
  } = useTourState();

  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const currentStep = tourProgress.currentStep;
  const step = ENHANCED_ONBOARDING_STEPS[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === ENHANCED_ONBOARDING_STEPS.length - 1;

  // Initialize tour when opened
  useEffect(() => {
    if (isOpen) {
      setDemoMode(true);
      startTour(ENHANCED_ONBOARDING_STEPS);
      trackDemoInteraction('tour_started');
    } else {
      setDemoMode(false);
      if (tourProgress.currentStep > 0) {
        trackDemoInteraction('tour_closed', { 
          completedSteps: tourProgress.completedSteps.length,
          totalSteps: ENHANCED_ONBOARDING_STEPS.length 
        });
      }
    }
  }, [isOpen, startTour, setDemoMode, trackDemoInteraction, tourProgress.completedSteps.length, tourProgress.currentStep]);

  // Handle highlighting target elements
  useEffect(() => {
    if (!isOpen || !step?.target || tourProgress.isPaused) {
      setHighlightedElement(null);
      return;
    }

    const element = document.querySelector(step.target) as HTMLElement;
    if (element) {
      setHighlightedElement(element);
      element.style.position = 'relative';
      element.style.zIndex = '1001';
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    return () => {
      if (element) {
        element.style.position = '';
        element.style.zIndex = '';
      }
    };
  }, [isOpen, step?.target, tourProgress.isPaused]);

  // Show recovery dialog when needed
  useEffect(() => {
    if (recoveryState.canRecover && !showRecoveryDialog) {
      setShowRecoveryDialog(true);
    }
  }, [recoveryState.canRecover, showRecoveryDialog]);

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      nextStep();
      hapticFeedback.light();
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      previousStep();
      hapticFeedback.light();
    }
  };

  const handleComplete = () => {
    completeTour();
    completeOnboarding();
    setDemoMode(false);
    onClose();
    hapticFeedback.medium();
    trackDemoInteraction('tour_completed', {
      completedSteps: tourProgress.completedSteps.length,
      totalSteps: ENHANCED_ONBOARDING_STEPS.length,
      userDeviations: tourProgress.userDeviations.length
    });
  };

  const handleSkip = () => {
    skipStep(step?.id || '');
    if (isLastStep) {
      handleComplete();
    }
  };

  const handleActionClick = () => {
    if (step?.id === 'search') {
      // Enhanced search interaction
      trackDemoInteraction('search_demo_started');
      setWaitingForInteraction(true, 'search');
      
      // Open search with demo mode
      openHeaderSearch();
      
      // Simulate typing after a delay
      setTimeout(() => {
        const searchInput = document.querySelector('input[placeholder*="Search"], input[placeholder*="search"]') as HTMLInputElement;
        if (searchInput) {
          // Focus the input
          searchInput.focus();
          
          // Simulate typing "education"
          const demoQuery = 'education';
          setSearchQuery(demoQuery);
          simulateSearchInteraction(demoQuery);
          
          // Type character by character for realistic effect
          let currentText = '';
          demoQuery.split('').forEach((char, index) => {
            setTimeout(() => {
              currentText += char;
              searchInput.value = currentText;
              const event = new Event('input', { bubbles: true });
              searchInput.dispatchEvent(event);
            }, index * 150);
          });
        }
      }, 500);
    } else if (step?.action?.onClick) {
      step.action.onClick();
    }
  };

  const handleRecoveryResume = () => {
    attemptRecovery();
    setShowRecoveryDialog(false);
  };

  const handleRecoverySkip = () => {
    setShowRecoveryDialog(false);
    handleComplete();
  };

  if (!isOpen || !step) return null;

  // Recovery dialog
  if (showRecoveryDialog && recoveryState.canRecover) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <Card className="relative w-80 max-w-[90vw] shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pause className="h-5 w-5 text-warning" />
              Tour Paused
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {recoveryState.recoveryMessage}
            </p>
            <div className="flex gap-2">
              <Button 
                onClick={handleRecoveryResume}
                className="flex-1"
                size="sm"
              >
                <Play className="h-4 w-4 mr-2" />
                Continue Tour
              </Button>
              <Button 
                variant="outline"
                onClick={handleRecoverySkip}
                size="sm"
              >
                Complete
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      {/* Interactive Monitoring */}
      <InteractionMonitor 
        isActive={isOpen && !tourProgress.isPaused}
        onInteraction={(type, data) => {
          console.log('Tour interaction:', type, data);
        }}
      />

      {/* Backdrop with spotlight effect */}
      <div 
        ref={overlayRef}
        className="fixed inset-0 z-[9998]"
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        
        {/* Spotlight effect for highlighted element */}
        {highlightedElement && (
          <div
            className="absolute border-4 border-primary rounded-lg shadow-lg shadow-primary/30 animate-pulse-subtle pointer-events-none"
            style={{
              top: highlightedElement.offsetTop - 8,
              left: highlightedElement.offsetLeft - 8,
              width: highlightedElement.offsetWidth + 16,
              height: highlightedElement.offsetHeight + 16,
            }}
          />
        )}
      </div>

      {/* Enhanced Responsive Tooltip */}
      <ResponsiveTourTooltip
        title={step.title}
        description={step.description}
        icon={step.icon}
        currentStep={currentStep}
        totalSteps={ENHANCED_ONBOARDING_STEPS.length}
        targetElement={highlightedElement}
        preferredPosition={step.position}
        isVisible={isOpen && !tourProgress.isPaused}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onClose={onClose}
        onSkip={handleSkip}
        isFirstStep={isFirstStep}
        isLastStep={isLastStep}
        action={step.action ? {
          text: step.action.text,
          onClick: handleActionClick
        } : undefined}
      />
    </>
  );
}