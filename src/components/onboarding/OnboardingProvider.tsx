/**
 * Onboarding provider for managing onboarding state and tours
 */
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { TourProvider } from './components/TourProvider';
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
  const { user } = useAuth();
  
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  
  // Return no-op functions for guests
  if (!user) {
    return {
      isOnboardingOpen: false,
      startOnboarding: () => {},
      completeOnboarding: () => {},
      skipOnboarding: () => {},
    };
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

  // Auto-start onboarding for new authenticated users only
  useEffect(() => {
    if (loading || !user) return; // Only show for authenticated users

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
  }, [preferences.hasCompletedOnboarding, loading, user]);

  const startOnboarding = useCallback(() => {
    // Only allow starting onboarding for authenticated users
    if (!user) return;
    setIsOnboardingOpen(true);
  }, [user]);

  const handleCompleteOnboarding = useCallback(() => {
    setIsOnboardingOpen(false);
    saveOnboardingComplete();
  }, [saveOnboardingComplete]);

  const skipOnboarding = useCallback(() => {
    setIsOnboardingOpen(false);
    sessionStorage.setItem('onboardingSkipped', 'true');
  }, []);

  const contextValue = useMemo(() => ({
    isOnboardingOpen,
    startOnboarding,
    completeOnboarding: handleCompleteOnboarding,
    skipOnboarding,
  }), [isOnboardingOpen, startOnboarding, handleCompleteOnboarding, skipOnboarding]);

  return (
    <OnboardingContext.Provider value={contextValue}>
      {user ? (
        <TourProvider
          isOpen={isOnboardingOpen}
          onClose={handleCompleteOnboarding}
          onComplete={handleCompleteOnboarding}
        >
          {children}
        </TourProvider>
      ) : (
        children
      )}
    </OnboardingContext.Provider>
  );
}