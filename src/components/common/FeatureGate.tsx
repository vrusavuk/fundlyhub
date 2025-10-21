/**
 * Feature Gate Component
 * Conditionally renders children based on feature flag status
 */

import { ReactNode } from 'react';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lock } from 'lucide-react';

interface FeatureGateProps {
  featureKey: string;
  checkRole?: boolean;
  fallback?: ReactNode;
  showMessage?: boolean;
  customMessage?: string;
  children?: ReactNode;
}

export function FeatureGate({
  featureKey,
  checkRole = true,
  fallback,
  showMessage = true,
  customMessage,
  children
}: FeatureGateProps) {
  const { isFeatureEnabled, getDisabledMessage } = useFeatureFlags();
  const enabled = isFeatureEnabled(featureKey, { checkRole });

  if (enabled) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showMessage) {
    return null;
  }

  const message = customMessage || getDisabledMessage(featureKey);

  return (
    <Alert variant="destructive" className="bg-muted border-border">
      <Lock className="h-4 w-4" />
      <AlertTitle>Feature Unavailable</AlertTitle>
      <AlertDescription className="text-muted-foreground">
        {message}
      </AlertDescription>
    </Alert>
  );
}
