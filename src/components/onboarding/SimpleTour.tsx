/**
 * Simple, reliable onboarding tour component
 */
import React, { useEffect } from 'react';
import { TourDialog } from './TourDialog';
import { useTourState, TourStep } from './useTourState';
import { useOnboardingDemo } from './OnboardingDemoProvider';
import { useGlobalSearch } from '@/contexts/SearchContext';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { 
  Sparkles,
  Search,
  Heart,
  Eye,
  Users,
  CheckCircle
} from 'lucide-react';

const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to FundlyGive! 🎉',
    description: 'Let\'s take a quick tour to help you discover amazing fundraising campaigns and learn how to make a difference.',
    icon: Sparkles,
  },
  {
    id: 'search',
    title: 'Smart Search Experience',
    description: 'Our intelligent search helps you find campaigns by cause, location, or keywords. Try searching for "education" to see demo results!',
    icon: Search,
    action: {
      text: 'Try Demo Search',
      onClick: () => {} // Will be handled by the tour
    }
  },
  {
    id: 'categories',
    title: 'Browse Categories',
    description: 'Explore campaigns by category to find causes you care about. Each category shows live statistics and trending causes.',
    icon: Heart,
  },
  {
    id: 'campaigns',
    title: 'Discover Campaigns',
    description: 'View campaign cards with progress, goals, and impact. Click any card to learn more and donate.',
    icon: Eye,
  },
  {
    id: 'community',
    title: 'Join the Community',
    description: 'Follow creators, bookmark campaigns, and see the impact you\'re making with other supporters.',
    icon: Users,
  },
  {
    id: 'complete',
    title: 'You\'re All Set! ✨',
    description: 'You\'re ready to explore and support amazing causes. Happy giving!',
    icon: CheckCircle,
  }
];

interface SimpleTourProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SimpleTour({ isOpen, onClose }: SimpleTourProps) {
  const { completeOnboarding } = useUserPreferences();
  const { openHeaderSearch, setSearchQuery } = useGlobalSearch();
  const { setDemoMode } = useOnboardingDemo();
  
  const {
    isActive,
    currentStep,
    currentStepData,
    totalSteps,
    isFirstStep,
    isLastStep,
    isNavigating,
    startTour,
    nextStep,
    previousStep,
    endTour
  } = useTourState();

  // Initialize tour when opened
  useEffect(() => {
    if (isOpen && !isActive) {
      setDemoMode(true);
      startTour(TOUR_STEPS);
    } else if (!isOpen && isActive) {
      setDemoMode(false);
      endTour();
    }
  }, [isOpen, isActive, startTour, endTour, setDemoMode]);

  const handleNext = () => {
    if (isNavigating) return;
    
    if (isLastStep) {
      handleComplete();
    } else {
      nextStep();
    }
  };

  const handlePrevious = () => {
    if (isNavigating || isFirstStep) return;
    previousStep();
  };

  const handleComplete = () => {
    completeOnboarding();
    setDemoMode(false);
    endTour();
    onClose();
  };

  const handleActionClick = () => {
    if (currentStepData?.id === 'search') {
      // Demo search interaction
      openHeaderSearch();
      
      // Simulate typing after a delay
      setTimeout(() => {
        const searchInput = document.querySelector('input[placeholder*="Search"], input[placeholder*="search"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          setSearchQuery('education');
          
          // Type character by character for realistic effect
          const demoQuery = 'education';
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
    }
  };

  if (!isOpen || !isActive || !currentStepData) return null;

  return (
    <TourDialog
      title={currentStepData.title}
      description={currentStepData.description}
      icon={currentStepData.icon}
      currentStep={currentStep}
      totalSteps={totalSteps}
      isFirstStep={isFirstStep}
      isLastStep={isLastStep}
      isNavigating={isNavigating}
      onNext={handleNext}
      onPrevious={handlePrevious}
      onClose={handleComplete}
      action={currentStepData.action ? {
        text: currentStepData.action.text,
        onClick: handleActionClick
      } : undefined}
    />
  );
}