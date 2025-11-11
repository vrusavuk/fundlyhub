/**
 * Feature Flags Hook
 * Centralized feature toggle system with role-based access control
 */

import { useMemo, useCallback } from 'react';
import { useSystemSettings } from './useSystemSettings';
import { useRBAC } from './useRBAC';
import { useAuth } from './useAuth';
import { logger } from '@/lib/services/logger.service';

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
    logger.debug('Checking feature flag', {
      componentName: 'useFeatureFlags',
      operationName: 'isFeatureEnabled',
      metadata: { featureKey, hasUser: !!user, options }
    });

    // Get feature setting
    const featureSetting = getSettingValue(featureKey) as FeatureConfig;
    
    if (!featureSetting) {
      logger.warn('Feature flag not found, defaulting to enabled', {
        componentName: 'useFeatureFlags',
        operationName: 'isFeatureEnabled',
        metadata: { featureKey }
      });
      return true; // Default to enabled during migration
    }

    logger.debug('Feature flag config retrieved', {
      componentName: 'useFeatureFlags',
      operationName: 'isFeatureEnabled',
      metadata: { 
        featureKey, 
        enabled: featureSetting.enabled, 
        allowedRoles: featureSetting.allowed_roles 
      }
    });

    // Check if globally disabled
    if (featureSetting.enabled === false) {
      logger.debug('Feature flag globally disabled', {
        componentName: 'useFeatureFlags',
        operationName: 'isFeatureEnabled',
        metadata: { featureKey }
      });
      return false;
    }

    // Super admin bypass - they can access everything
    if (user && isSuperAdmin()) {
      logger.debug('Feature flag allowed - super admin bypass', {
        componentName: 'useFeatureFlags',
        operationName: 'isFeatureEnabled',
        metadata: { featureKey }
      });
      return true;
    }

    // If no allowed_roles defined or empty array, feature is open to all authenticated users
    if (!featureSetting.allowed_roles || featureSetting.allowed_roles.length === 0) {
      const result = !!user;
      logger.debug('Feature flag open to authenticated users', {
        componentName: 'useFeatureFlags',
        operationName: 'isFeatureEnabled',
        metadata: { featureKey, result }
      });
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
        logger.debug('Feature flag blocked - missing required role', {
          componentName: 'useFeatureFlags',
          operationName: 'isFeatureEnabled',
          metadata: { featureKey, requiredRoles: featureSetting.allowed_roles }
        });
        return false;
      }

      logger.debug('Feature flag allowed - has required role', {
        componentName: 'useFeatureFlags',
        operationName: 'isFeatureEnabled',
        metadata: { featureKey }
      });
      return true;
    }

    logger.debug('Feature flag allowed - no role check', {
      componentName: 'useFeatureFlags',
      operationName: 'isFeatureEnabled',
      metadata: { featureKey }
    });
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

  // Alias for better semantic clarity - updates work for all fundraiser types
  const canCreateCampaignUpdates = useMemo(() => {
    // Note: Internal key is 'project_updates' for legacy reasons,
    // but this feature works for ALL fundraiser types (causes and projects)
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
    canCreateProjectUpdates, // Legacy name for backwards compatibility
    canCreateCampaignUpdates, // Clearer name - works for all fundraiser types
  };
}
