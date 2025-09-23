/**
 * Onboarding provider for managing onboarding state and tours
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { SimpleTour } from './SimpleTour';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useAuth } from '@/hooks/useAuth';

interface OnboardingContextType {
  isOnboardingOpen: boolean;
  startOnboarding: () => void;
  completeOnboarding: () => void;
  skipOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
}

interface OnboardingProviderProps {
  children: React.ReactNode;
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const { user } = useAuth();
  const { preferences, completeOnboarding: saveOnboardingComplete, loading } = useUserPreferences();

  // Auto-start onboarding for new users
  useEffect(() => {
    if (loading) return;

    // Check if user should see onboarding
    const shouldStartOnboarding = 
      !preferences.hasCompletedOnboarding && 
      !sessionStorage.getItem('onboardingSkipped');

    if (shouldStartOnboarding) {
      // Delay onboarding start to let the page load
      const timer = setTimeout(() => {
        setIsOnboardingOpen(true);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [preferences.hasCompletedOnboarding, loading]);

  const startOnboarding = () => {
    setIsOnboardingOpen(true);
  };

  const handleCompleteOnboarding = () => {
    setIsOnboardingOpen(false);
    saveOnboardingComplete();
  };

  const skipOnboarding = () => {
    setIsOnboardingOpen(false);
    sessionStorage.setItem('onboardingSkipped', 'true');
  };

  return (
    <OnboardingContext.Provider
      value={{
        isOnboardingOpen,
        startOnboarding,
        completeOnboarding: handleCompleteOnboarding,
        skipOnboarding,
      }}
    >
      {children}
      <SimpleTour
        isOpen={isOnboardingOpen}
        onClose={handleCompleteOnboarding}
      />
    </OnboardingContext.Provider>
  );
}