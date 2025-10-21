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
  const { hasRole, hasRoleOrHigher, isSuperAdmin } = useRBAC();
  const { user } = useAuth();

  const isFeatureEnabled = useCallback((
    featureKey: string, 
    options: FeatureFlagOptions = {}
  ): boolean => {
    console.log(`[FeatureFlags] Checking feature: ${featureKey}`, {
      hasUser: !!user,
      options
    });

    // Get feature setting
    const featureSetting = getSettingValue(featureKey) as FeatureConfig;
    
    if (!featureSetting) {
      console.warn(`[FeatureFlags] ${featureKey} not found, defaulting to enabled`);
      return true; // Default to enabled during migration
    }

    console.log(`[FeatureFlags] ${featureKey} config:`, {
      enabled: featureSetting.enabled,
      allowedRoles: featureSetting.allowed_roles
    });

    // Check if globally disabled
    if (featureSetting.enabled === false) {
      console.log(`[FeatureFlags] ${featureKey} is globally disabled`);
      return false;
    }

    // Super admin bypass - they can access everything
    if (user && isSuperAdmin()) {
      console.log(`[FeatureFlags] ${featureKey} allowed - super admin bypass`);
      return true;
    }

    // If no allowed_roles defined or empty array, feature is open to all authenticated users
    if (!featureSetting.allowed_roles || featureSetting.allowed_roles.length === 0) {
      const result = !!user;
      console.log(`[FeatureFlags] ${featureKey} open to authenticated users: ${result}`);
      return result;
    }

    // Check role requirements if specified
    if (options.checkRole !== false && user) {
      // Check if user has ANY of the required roles OR higher hierarchy
      const hasRequiredRole = featureSetting.allowed_roles.some((requiredRole: string) => {
        // Use hierarchy-aware role checking
        return hasRoleOrHigher(requiredRole);
      });
      
      if (!hasRequiredRole) {
        console.log(`[FeatureFlags] ${featureKey} blocked - missing required role`, {
          requiredRoles: featureSetting.allowed_roles
        });
        return false;
      }

      console.log(`[FeatureFlags] ${featureKey} allowed - has required role`);
      return true;
    }

    console.log(`[FeatureFlags] ${featureKey} allowed - no role check`);
    return true;
  }, [getSettingValue, hasRole, hasRoleOrHigher, isSuperAdmin, user]);

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

  const canCreateProjectUpdates = useMemo(() => {
    return isFeatureEnabled('features.project_updates', { checkRole: true });
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
    canCreateProjectUpdates,
  };
}
