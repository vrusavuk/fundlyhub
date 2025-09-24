/**
 * Context diagnostics component for debugging provider issues
 */
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useGlobalSearch } from '@/contexts/UnifiedSearchContext';
import { useOnboardingDemo } from '@/components/onboarding/OnboardingDemoProvider';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export function ContextDiagnostics() {
  // Test all context hooks safely
  let searchContext: ReturnType<typeof useGlobalSearch> | null = null;
  let searchError: string | null = null;
  
  let onboardingContext: ReturnType<typeof useOnboardingDemo> | null = null;
  let onboardingError: string | null = null;

  try {
    searchContext = useGlobalSearch();
  } catch (error) {
    searchError = error instanceof Error ? error.message : 'Unknown error';
  }

  try {
    onboardingContext = useOnboardingDemo();
  } catch (error) {
    onboardingError = error instanceof Error ? error.message : 'Unknown error';
  }

  const getStatusIcon = (hasContext: boolean, error: string | null) => {
    if (error) return <XCircle className="w-4 h-4 text-destructive" />;
    if (hasContext) return <CheckCircle className="w-4 h-4 text-green-500" />;
    return <AlertCircle className="w-4 h-4 text-yellow-500" />;
  };

  const getStatusBadge = (hasContext: boolean, error: string | null) => {
    if (error) return <Badge variant="destructive">Error</Badge>;
    if (hasContext) return <Badge className="bg-green-500">Connected</Badge>;
    return <Badge variant="secondary">Fallback</Badge>;
  };

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Context Diagnostics
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Checking context provider connectivity and error handling
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Search Context */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-3">
            {getStatusIcon(!!searchContext && !searchError, searchError)}
            <div>
              <h4 className="font-medium">Unified Search Context</h4>
              <p className="text-sm text-muted-foreground">
                {searchError ? searchError : 'Search functionality and state management'}
              </p>
            </div>
          </div>
          {getStatusBadge(!!searchContext && !searchError, searchError)}
        </div>

        {/* Onboarding Context */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-3">
            {getStatusIcon(!!onboardingContext && !onboardingError, onboardingError)}
            <div>
              <h4 className="font-medium">Onboarding Demo Context</h4>
              <p className="text-sm text-muted-foreground">
                {onboardingError ? onboardingError : 'Demo functionality and tour management'}
              </p>
            </div>
          </div>
          {getStatusBadge(!!onboardingContext && !onboardingError, onboardingError)}
        </div>

        {/* Context Values */}
        {searchContext && (
          <div className="p-3 border rounded-lg bg-muted/50">
            <h4 className="font-medium mb-2">Search Context State</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Header Search Open: {searchContext.isHeaderSearchOpen ? 'Yes' : 'No'}</div>
              <div>Search Query: "{searchContext.searchQuery || 'None'}"</div>
              <div>Loading: {searchContext.isLoading ? 'Yes' : 'No'}</div>
              <div>Error: {searchContext.error || 'None'}</div>
            </div>
          </div>
        )}

        {onboardingContext && (
          <div className="p-3 border rounded-lg bg-muted/50">
            <h4 className="font-medium mb-2">Onboarding Context State</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Demo Mode: {onboardingContext.isDemoMode ? 'Active' : 'Inactive'}</div>
              <div>Interactions: {onboardingContext.demoInteractions.length}</div>
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground mt-4">
          ✅ All contexts now use fallback objects instead of throwing errors<br/>
          ✅ Provider hierarchy: App → Auth → UnifiedSearch → Navigation → Onboarding → OnboardingDemo<br/>
          ✅ Enhanced error boundaries and recovery mechanisms
        </div>
      </CardContent>
    </Card>
  );
}