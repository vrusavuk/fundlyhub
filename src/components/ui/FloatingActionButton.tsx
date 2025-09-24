/**
 * Floating action button with contextual animations
 */
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AnimatedButton } from '@/components/animations/AnimatedButton';
import { useOnboarding } from '@/components/onboarding/OnboardingProvider';
import { useAuth } from '@/hooks/useAuth';
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
  const { user } = useAuth();

  // Show/hide based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setIsVisible(scrollTop > 200);
      setShowScrollToTop(scrollTop > 600);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
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

  return (
    <div className={cn(
      'fixed bottom-6 right-6 z-50 flex flex-col gap-3 transition-all duration-300 ease-out',
      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none',
      className
    )}>
      {/* Scroll to top button */}
      <div className={cn(
        'transition-all duration-300 ease-out',
        showScrollToTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      )}>
        <AnimatedButton
          size="sm"
          className="h-12 w-12 rounded-full shadow-lg"
          onClick={handleScrollToTop}
          variant="outline"
          haptic
        >
          <ChevronUp className="h-5 w-5" />
        </AnimatedButton>
      </div>

      {/* Help/Tour button - Only show for authenticated users */}
      {user && (
        <AnimatedButton
          size="lg"
          className="h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl"
          onClick={handleHelpClick}
          haptic
        >
          <div className="relative">
            <HelpCircle className="h-6 w-6" />
            <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-accent" />
          </div>
        </AnimatedButton>
      )}
    </div>
  );
}