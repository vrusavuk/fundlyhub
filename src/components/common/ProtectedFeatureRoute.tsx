/**
 * Protected Feature Route Component
 * Handles feature flag authorization at the route/page boundary layer
 * Ensures hooks are called unconditionally to prevent React Hooks violations
 */

import { ReactNode } from 'react';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { FeatureGate } from './FeatureGate';

interface ProtectedFeatureRouteProps {
  featureKey: string;
  checkRole?: boolean;
  fallbackMessage?: string;
  children: ReactNode;
}

/**
 * Wraps page content and shows FeatureGate when feature is disabled
 * All hooks are called unconditionally to comply with React Rules of Hooks
 */
export function ProtectedFeatureRoute({
  featureKey,
  checkRole = true,
  fallbackMessage,
  children
}: ProtectedFeatureRouteProps) {
  const { isFeatureEnabled } = useFeatureFlags();
  const enabled = isFeatureEnabled(featureKey, { checkRole });

  if (!enabled) {
    return (
      <div className="w-full max-w-4xl mx-auto py-8">
        <FeatureGate 
          featureKey={featureKey} 
          showMessage={true}
          customMessage={fallbackMessage}
        />
      </div>
    );
  }

  return <>{children}</>;
}
