import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRBAC } from '@/contexts/RBACContext';
import { logger } from '@/lib/services/logger.service';

export interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  category: string;
  description?: string;
  is_sensitive: boolean;
  requires_restart: boolean;
  created_at: string;
  updated_at: string;
}

export interface SettingUpdate {
  setting_key: string;
  setting_value: any;
  change_reason?: string;
}

export function useSystemSettings() {
  const [settings, setSettings] = useState<Record<string, SystemSetting>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { hasPermission, isSuperAdmin } = useRBAC();

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;

      const settingsMap = data?.reduce((acc, setting) => {
        acc[setting.setting_key] = setting;
        return acc;
      }, {} as Record<string, SystemSetting>) || {};

      setSettings(settingsMap);
    } catch (err) {
      logger.error('Error fetching settings', err as Error, {
        componentName: 'useSystemSettings',
        operationName: 'fetchSettings'
      });
      setError(err instanceof Error ? err.message : 'Failed to load settings');
      toast({
        title: "Error",
        description: "Failed to load system settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const updateSetting = useCallback(async (update: SettingUpdate) => {
    try {
      setSaving(true);

      const { error } = await supabase
        .from('system_settings')
        .update({ 
          setting_value: update.setting_value,
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', update.setting_key);

      if (error) throw error;

      // Update local state
      setSettings(prev => ({
        ...prev,
        [update.setting_key]: {
          ...prev[update.setting_key],
          setting_value: update.setting_value,
          updated_at: new Date().toISOString()
        }
      }));

      toast({
        title: "Setting Updated",
        description: `Successfully updated ${update.setting_key}`,
      });

      return true;
    } catch (err) {
      logger.error('Error updating setting', err as Error, {
        componentName: 'useSystemSettings',
        operationName: 'updateSetting',
        metadata: { settingKey: update.setting_key }
      });
      toast({
        title: "Update Failed",
        description: err instanceof Error ? err.message : 'Failed to update setting',
        variant: "destructive"
      });
      return false;
    } finally {
      setSaving(false);
    }
  }, [toast]);

  const updateMultipleSettings = useCallback(async (updates: SettingUpdate[]) => {
    try {
      setSaving(true);
      const results = await Promise.all(
        updates.map(update => updateSetting(update))
      );
      return results.every(result => result);
    } finally {
      setSaving(false);
    }
  }, [updateSetting]);

  const getSettingValue = useCallback((key: string, defaultValue?: any) => {
    return settings[key]?.setting_value ?? defaultValue;
  }, [settings]);

  const getSettingsByCategory = useCallback((category: string) => {
    return Object.values(settings).filter(setting => setting.category === category);
  }, [settings]);

  const canEditCategory = useCallback((category: string) => {
    if (isSuperAdmin()) return true;
    
    // Platform admins can edit specific categories
    if (hasPermission('manage_platform_settings')) {
      return ['user_management', 'content_moderation', 'notifications'].includes(category);
    }
    
    return false;
  }, [isSuperAdmin, hasPermission]);

  const canViewSensitive = useCallback(() => {
    return isSuperAdmin();
  }, [isSuperAdmin]);

  useEffect(() => {
    fetchSettings();

    // Phase 5: Real-time updates for feature toggles
    const channel = supabase
      .channel('system-settings-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'system_settings',
        },
        (payload) => {
          const updated = payload.new as SystemSetting;
          setSettings(prev => ({
            ...prev,
            [updated.setting_key]: updated
          }));

          // Log feature toggle changes
          if (updated.setting_key.startsWith('features.')) {
            logger.info('Feature toggle updated', {
              componentName: 'useSystemSettings',
              operationName: 'realtimeUpdate',
              metadata: { 
                settingKey: updated.setting_key, 
                enabled: updated.setting_value.enabled 
              }
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSettings]);

  return {
    settings: Object.values(settings),
    settingsMap: settings,
    loading,
    saving,
    error,
    updateSetting,
    updateMultipleSettings,
    getSettingValue,
    getSettingsByCategory,
    canEditCategory,
    canViewSensitive,
    refreshSettings: fetchSettings
  };
}