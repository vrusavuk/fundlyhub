import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Shield, 
  Mail, 
  Server,
  Users,
  AlertTriangle,
  Lock,
  RefreshCw,
  Save,
  Bell,
  Eye,
  CheckCircle,
  Database
} from 'lucide-react';
import { useRBAC } from '@/hooks/useRBAC';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { SettingsCategory } from '@/components/admin/settings/SettingsCategory';
import { AdminPageLayout, PageSection } from '@/components/admin/unified';

export function SystemSettings() {
  const { 
    settings, 
    loading, 
    saving, 
    error,
    updateSetting,
    getSettingsByCategory,
    canEditCategory,
    canViewSensitive,
    getSettingValue
  } = useSystemSettings();
  
  const { isSuperAdmin, isPlatformAdmin } = useRBAC();

  // Only admins can access system settings
  if (!isSuperAdmin() && !isPlatformAdmin()) {
    return (
      <div className="flex items-center justify-center h-64">
        <Alert className="max-w-md">
          <Lock className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You need administrator privileges to access system settings.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <Alert className="max-w-md" variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Settings</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const maintenanceModeEnabled = getSettingValue('platform.maintenance_mode')?.enabled || false;
  const categories = ['general', 'security', 'email', 'api', 'user_management', 'content_moderation', 'notifications', 'system'];

  return (
    <AdminPageLayout
      title="System Settings"
      description="Configure platform-wide settings and security policies"
      badge={{
        text: `${isSuperAdmin() ? "Super Admin" : "Platform Admin"} • ${settings.length} settings`,
        variant: isSuperAdmin() ? "default" : "secondary"
      }}
    >
      {/* Maintenance Mode Alert */}
      {maintenanceModeEnabled && (
        <Alert className="border-warning mb-6">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <AlertTitle className="text-warning">Maintenance Mode Active</AlertTitle>
          <AlertDescription>
            The platform is currently in maintenance mode. Only administrators can access the system.
          </AlertDescription>
        </Alert>
      )}

      {/* Permission Info */}
      {!isSuperAdmin() && (
        <Alert className="mb-6">
          <Lock className="h-4 w-4" />
          <AlertTitle>Limited Access</AlertTitle>
          <AlertDescription>
            As a platform admin, you can only modify certain settings. Sensitive security settings require super admin privileges.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
          <TabsTrigger value="general">
            <Settings className="w-4 h-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="w-4 h-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="email">
            <Mail className="w-4 h-4 mr-2" />
            Email
          </TabsTrigger>
          <TabsTrigger value="api">
            <Server className="w-4 h-4 mr-2" />
            API
          </TabsTrigger>
          <TabsTrigger value="user_management">
            <Users className="w-4 h-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="content_moderation">
            <Eye className="w-4 h-4 mr-2" />
            Content
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="system">
            <Database className="w-4 h-4 mr-2" />
            System
          </TabsTrigger>
        </TabsList>

        {categories.map(category => (
          <TabsContent key={category} value={category} className="space-y-6">
            <SettingsCategory
              category={category}
              settings={getSettingsByCategory(category)}
              canEdit={canEditCategory(category)}
              canViewSensitive={canViewSensitive()}
              onUpdate={updateSetting}
              saving={saving}
            />
          </TabsContent>
        ))}
      </Tabs>
    </AdminPageLayout>
  );
}