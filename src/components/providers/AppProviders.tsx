/**
 * App Providers - Consolidated provider wrapper for cleaner architecture
 * Reduces nesting complexity and provides centralized configuration
 */
import { ReactNode, useMemo } from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { RBACProvider } from "@/contexts/RBACContext";
import { UnifiedSearchProvider } from "@/contexts/UnifiedSearchContext";
import { NavigationProvider } from '@/contexts/NavigationContext';
import { OnboardingProvider } from '@/components/onboarding/OnboardingProvider';
import { OnboardingDemoProvider } from '@/components/onboarding/OnboardingDemoProvider';

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  // Memoize QueryClient to prevent recreation on every render
  const queryClient = useMemo(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: 2,
        refetchOnWindowFocus: false,
        staleTime: 5 * 60 * 1000, // 5 minutes
      },
    },
  }), []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <AuthProvider>
            <RBACProvider>
              <UnifiedSearchProvider>
                <NavigationProvider>
                  <OnboardingProvider>
                    <OnboardingDemoProvider>
                      {children}
                    </OnboardingDemoProvider>
                  </OnboardingProvider>
                </NavigationProvider>
              </UnifiedSearchProvider>
            </RBACProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}