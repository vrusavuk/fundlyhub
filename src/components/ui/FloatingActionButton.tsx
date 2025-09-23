/**
 * Floating action button with contextual animations
 */
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AnimatedButton } from '@/components/animations/AnimatedButton';
import { useOnboarding } from '@/components/onboarding/OnboardingProvider';
import { cn } from '@/lib/utils';
import { hapticFeedback } from '@/lib/utils/mobile';
import { HelpCircle, Sparkles, ChevronUp } from 'lucide-react';

interface FloatingActionButtonProps {
  className?: string;
}

export function FloatingActionButton({ className }: FloatingActionButtonProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const { startOnboarding } = useOnboarding();

  // Show/hide based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setIsVisible(scrollTop > 200);
      setShowScrollToTop(scrollTop > 600);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleHelpClick = () => {
    startOnboarding();
    hapticFeedback.medium();
  };

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    hapticFeedback.light();
  };

  if (!isVisible) return null;

  return (
    <div className={cn('fixed bottom-6 right-6 z-50 flex flex-col gap-3', className)}>
      {/* Scroll to top button */}
      {showScrollToTop && (
        <AnimatedButton
          size="sm"
          className="h-12 w-12 rounded-full shadow-lg animate-slide-up"
          onClick={handleScrollToTop}
          variant="outline"
          haptic
        >
          <ChevronUp className="h-5 w-5" />
        </AnimatedButton>
      )}

      {/* Help/Tour button */}
      <AnimatedButton
        size="lg"
        className="h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl animate-bounce-gentle"
        onClick={handleHelpClick}
        pulse
        haptic
      >
        <div className="relative">
          <HelpCircle className="h-6 w-6" />
          <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-accent animate-pulse" />
        </div>
      </AnimatedButton>
    </div>
  );
}