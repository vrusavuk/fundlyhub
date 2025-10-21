/**
 * Feature Flags Helper for Edge Functions
 * Backend enforcement of feature toggles
 */

import { SupabaseClient } from 'jsr:@supabase/supabase-js@2';

export interface FeatureCheckResult {
  enabled: boolean;
  reason?: string;
  config?: any;
}

export async function checkFeatureFlag(
  supabase: SupabaseClient,
  featureKey: string,
  userId?: string,
  options: {
    checkRole?: boolean;
    requiredRole?: string;
    contextId?: string;
  } = {}
): Promise<FeatureCheckResult> {
  try {
    // Get feature setting
    const { data: setting, error } = await supabase
      .from('system_settings')
      .select('setting_value')
      .eq('setting_key', featureKey)
      .maybeSingle();

    if (error) {
      console.error('[checkFeatureFlag] Database error:', error);
      return { 
        enabled: true, // Fail open for backwards compatibility
        reason: 'Feature check failed, defaulting to enabled' 
      };
    }

    if (!setting) {
      console.warn(`[checkFeatureFlag] Feature flag ${featureKey} not found, defaulting to enabled`);
      return { 
        enabled: true, 
        reason: 'Feature not configured, defaulting to enabled' 
      };
    }

    const config = setting.setting_value;

    // Check if globally enabled
    if (config.enabled === false) {
      return { 
        enabled: false, 
        reason: config.disabled_message || 'Feature is disabled globally',
        config 
      };
    }

    // Check role requirements if specified
    if (options.checkRole && userId && config.allowed_roles) {
      const { data: userRoles, error: roleError } = await supabase
        .rpc('get_user_roles', { 
          _user_id: userId, 
          _context_type: 'global' 
        });

      if (roleError) {
        console.error('[checkFeatureFlag] Role check error:', roleError);
        return { 
          enabled: true, // Fail open on role check errors
          reason: 'Role check failed, defaulting to enabled',
          config
        };
      }

      const hasRequiredRole = userRoles?.some((role: any) => 
        config.allowed_roles.includes(role.role_name)
      );

      if (!hasRequiredRole) {
        return { 
          enabled: false, 
          reason: 'User does not have required role',
          config 
        };
      }
    }

    return { enabled: true, config };
  } catch (err) {
    console.error('[checkFeatureFlag] Unexpected error:', err);
    return {
      enabled: true, // Fail open on unexpected errors
      reason: 'Feature check failed, defaulting to enabled'
    };
  }
}

/**
 * Log feature usage for analytics
 */
export async function logFeatureUsage(
  supabase: SupabaseClient,
  featureKey: string,
  action: 'attempted' | 'succeeded' | 'blocked',
  metadata: Record<string, any> = {}
): Promise<void> {
  try {
    await supabase.rpc('log_feature_usage', {
      _feature_key: featureKey,
      _action: action,
      _metadata: metadata
    });
  } catch (err) {
    console.error('[logFeatureUsage] Failed to log:', err);
    // Don't throw - logging failures shouldn't break the main flow
  }
}
