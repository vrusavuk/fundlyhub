/**
 * App Providers - Consolidated provider wrapper
 * Reduces nesting complexity in App.tsx
 */
import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { UnifiedSearchProvider } from "@/contexts/UnifiedSearchContext";
import { NavigationProvider } from '@/contexts/NavigationContext';
import { OnboardingProvider } from '@/components/onboarding/OnboardingProvider';
import { OnboardingDemoProvider } from '@/components/onboarding/OnboardingDemoProvider';

interface AppProvidersProps {
  children: ReactNode;
}

// Query client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <AuthProvider>
            <UnifiedSearchProvider>
              <NavigationProvider>
                <OnboardingProvider>
                  <OnboardingDemoProvider>
                    {children}
                  </OnboardingDemoProvider>
                </OnboardingProvider>
              </NavigationProvider>
            </UnifiedSearchProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}