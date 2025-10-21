/**
 * Feature Flags Hook
 * Centralized feature toggle system with role-based access control
 */

import { useMemo, useCallback } from 'react';
import { useSystemSettings } from './useSystemSettings';
import { useRBAC } from './useRBAC';
import { useAuth } from './useAuth';

export interface FeatureFlagOptions {
  checkRole?: boolean;  // Check if user has required role
  checkLimit?: boolean; // Check if user hit usage limits
  contextId?: string;   // Organization/campaign context
}

export interface FeatureConfig {
  enabled: boolean;
  allowed_roles?: string[];
  disabled_message?: string;
  max_active_per_user?: number;
  max_active_per_org?: number;
  require_verification?: boolean;
  [key: string]: any;
}

export function useFeatureFlags() {
  const { getSettingValue } = useSystemSettings();
  const { hasRole } = useRBAC();
  const { user } = useAuth();

  const isFeatureEnabled = useCallback((
    featureKey: string, 
    options: FeatureFlagOptions = {}
  ): boolean => {
    // Get feature setting
    const featureSetting = getSettingValue(featureKey) as FeatureConfig;
    
    if (!featureSetting) {
      console.warn(`Feature flag ${featureKey} not found, defaulting to enabled for backwards compatibility`);
      return true; // Default to enabled during migration
    }

    // Check if globally enabled
    if (featureSetting.enabled === false) {
      return false;
    }

    // Check role requirements if specified
    if (options.checkRole && featureSetting.allowed_roles && user) {
      const hasRequiredRole = featureSetting.allowed_roles.some((role: string) => 
        hasRole(role)
      );
      if (!hasRequiredRole) {
        return false;
      }
    }

    return true;
  }, [getSettingValue, hasRole, user]);

  const getFeatureConfig = useCallback((featureKey: string): FeatureConfig => {
    const config = getSettingValue(featureKey) as FeatureConfig;
    return config || { enabled: true }; // Default enabled for backwards compatibility
  }, [getSettingValue]);

  const getDisabledMessage = useCallback((featureKey: string): string => {
    const config = getFeatureConfig(featureKey);
    return config.disabled_message || 'This feature is currently disabled.';
  }, [getFeatureConfig]);

  // Convenience flags for commonly checked features
  const canCreateFundraiser = useMemo(() => {
    return isFeatureEnabled('features.fundraiser_creation', { checkRole: true });
  }, [isFeatureEnabled]);

  const canCreateProject = useMemo(() => {
    return isFeatureEnabled('features.project_creation', { checkRole: true });
  }, [isFeatureEnabled]);

  const canFollowUsers = useMemo(() => {
    return isFeatureEnabled('features.user_follow_user');
  }, [isFeatureEnabled]);

  const canFollowOrganizations = useMemo(() => {
    return isFeatureEnabled('features.user_follow_organization');
  }, [isFeatureEnabled]);

  const canRegister = useMemo(() => {
    return isFeatureEnabled('features.user_registration');
  }, [isFeatureEnabled]);

  const canDonate = useMemo(() => {
    return isFeatureEnabled('features.donations');
  }, [isFeatureEnabled]);

  const canEditProfile = useMemo(() => {
    return isFeatureEnabled('features.user_profile_editing', { checkRole: true });
  }, [isFeatureEnabled]);

  const canCreateOrganization = useMemo(() => {
    return isFeatureEnabled('features.organization_creation', { checkRole: true });
  }, [isFeatureEnabled]);

  const canUseAIEnhancement = useMemo(() => {
    return isFeatureEnabled('features.ai_text_enhancement');
  }, [isFeatureEnabled]);

  return {
    isFeatureEnabled,
    getFeatureConfig,
    getDisabledMessage,
    // Convenience flags
    canCreateFundraiser,
    canCreateProject,
    canFollowUsers,
    canFollowOrganizations,
    canRegister,
    canDonate,
    canEditProfile,
    canCreateOrganization,
    canUseAIEnhancement,
  };
}
