/**
 * Interactive onboarding tour with step-by-step guidance
 */
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AnimatedCard } from '@/components/animations/AnimatedCard';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { cn } from '@/lib/utils';
import { hapticFeedback } from '@/lib/utils/mobile';
import { 
  ArrowRight, 
  ArrowLeft, 
  X, 
  Sparkles,
  Search,
  Heart,
  Eye,
  Users,
  CheckCircle
} from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector for target element
  position?: 'top' | 'bottom' | 'left' | 'right';
  icon: React.ComponentType<{ className?: string }>;
  action?: {
    text: string;
    onClick: () => void;
  };
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to FundlyGive! 🎉',
    description: 'Let\'s take a quick tour to help you discover amazing fundraising campaigns and learn how to make a difference.',
    icon: Sparkles,
  },
  {
    id: 'search',
    title: 'Smart Search',
    description: 'Use our intelligent search to find campaigns by cause, location, or keywords. Try typing "medical" or "education".',
    target: '[data-search-trigger]',
    position: 'bottom',
    icon: Search,
    action: {
      text: 'Try Search',
      onClick: () => {
        const searchTrigger = document.querySelector('[data-search-trigger]') as HTMLElement;
        searchTrigger?.click();
      }
    }
  },
  {
    id: 'categories',
    title: 'Browse Categories',
    description: 'Explore campaigns by category to find causes you care about. Each category shows live statistics.',
    target: '[data-category-filter]',
    position: 'top',
    icon: Heart,
  },
  {
    id: 'campaigns',
    title: 'Discover Campaigns',
    description: 'View campaign cards with progress, goals, and impact. Click any card to learn more and donate.',
    target: '[data-campaign-grid]',
    position: 'top',
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

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OnboardingTour({ isOpen, onClose }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
  const { completeOnboarding } = useUserPreferences();
  const overlayRef = useRef<HTMLDivElement>(null);

  const step = ONBOARDING_STEPS[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

  // Handle highlighting target elements
  useEffect(() => {
    if (!isOpen || !step.target) {
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
  }, [isOpen, step.target]);

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep(prev => prev + 1);
      hapticFeedback.light();
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
      hapticFeedback.light();
    }
  };

  const handleComplete = () => {
    completeOnboarding();
    onClose();
    hapticFeedback.medium();
  };

  const handleSkip = () => {
    completeOnboarding();
    onClose();
  };

  const getTooltipPosition = () => {
    if (!highlightedElement) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

    const rect = highlightedElement.getBoundingClientRect();
    const tooltipWidth = 320;
    const tooltipHeight = 200;
    const padding = 20;

    let top = 0;
    let left = 0;

    switch (step.position) {
      case 'bottom':
        top = rect.bottom + padding;
        left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
        break;
      case 'top':
        top = rect.top - tooltipHeight - padding;
        left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
        break;
      case 'left':
        top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
        left = rect.left - tooltipWidth - padding;
        break;
      case 'right':
        top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
        left = rect.right + padding;
        break;
      default:
        top = window.innerHeight / 2 - tooltipHeight / 2;
        left = window.innerWidth / 2 - tooltipWidth / 2;
    }

    // Keep tooltip within viewport
    top = Math.max(padding, Math.min(top, window.innerHeight - tooltipHeight - padding));
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipWidth - padding));

    return { top: `${top}px`, left: `${left}px` };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-1000">
      {/* Backdrop with spotlight effect */}
      <div 
        ref={overlayRef}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={highlightedElement ? undefined : handleSkip}
      >
        {highlightedElement && (
          <div
            className="absolute border-4 border-primary rounded-lg shadow-lg shadow-primary/30 animate-pulse-subtle"
            style={{
              top: highlightedElement.offsetTop - 8,
              left: highlightedElement.offsetLeft - 8,
              width: highlightedElement.offsetWidth + 16,
              height: highlightedElement.offsetHeight + 16,
              pointerEvents: 'none',
            }}
          />
        )}
      </div>

      {/* Tooltip */}
      <Card
        className="absolute w-80 bg-background border-2 border-primary/20 shadow-2xl animate-scale-in"
        style={getTooltipPosition()}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <step.icon className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">{step.title}</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Badge variant="outline" className="w-fit">
            Step {currentStep + 1} of {ONBOARDING_STEPS.length}
          </Badge>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {step.description}
          </p>

          {step.action && (
            <Button
              variant="outline"
              size="sm"
              onClick={step.action.onClick}
              className="w-full animate-fade-in"
            >
              {step.action.text}
            </Button>
          )}

          {/* Progress indicator */}
          <div className="flex justify-center">
            <div className="flex gap-1">
              {ONBOARDING_STEPS.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    'h-2 w-2 rounded-full transition-colors',
                    index === currentStep ? 'bg-primary' : 'bg-muted'
                  )}
                />
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={isFirstStep}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </Button>

            <Button
              onClick={handleNext}
              size="sm"
              className="flex items-center gap-2"
            >
              {isLastStep ? (
                <>
                  Complete
                  <CheckCircle className="h-4 w-4" />
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>

          {!isLastStep && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="w-full text-xs text-muted-foreground"
            >
              Skip tour
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
