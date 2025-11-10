/**
 * Feature Toggles Admin Page
 * Centralized control panel for enabling/disabling platform features
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { useRBAC } from '@/contexts/RBACContext';
import { useToast } from '@/hooks/use-toast';
import { 
  AlertCircle, 
  CheckCircle2, 
  Lock, 
  Search, 
  Shield,
  Users,
  FileText,
  Bell,
  Settings
} from 'lucide-react';
import { AdminPageLayout } from '@/components/admin/unified';

export default function FeatureToggles() {
  const { settings, updateSetting, loading } = useSystemSettings();
  const { isSuperAdmin } = useRBAC();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');

  if (!isSuperAdmin()) {
    return (
      <AdminPageLayout
        title="Feature Toggles"
        description="Access Denied"
      >
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center text-muted-foreground">
              <Lock className="h-4 w-4 mr-2" />
              You don't have permission to access feature toggles
            </div>
          </CardContent>
        </Card>
      </AdminPageLayout>
    );
  }

  const featureSettings = settings
    .filter(s => s.setting_key.startsWith('features.'))
    .filter(s => 
      searchQuery === '' || 
      s.setting_key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const categoryIcons = {
    'user_management': Users,
    'social': Users,
    'content_moderation': FileText,
    'general': Settings,
    'notifications': Bell,
  };

  const categories = {
    'User Management': featureSettings.filter(s => s.category === 'user_management'),
    'Social Features': featureSettings.filter(s => s.category === 'social'),
    'Content Moderation': featureSettings.filter(s => s.category === 'content_moderation'),
    'General Features': featureSettings.filter(s => s.category === 'general'),
    'Notifications': featureSettings.filter(s => s.category === 'notifications'),
  };

  const handleToggle = async (settingKey: string, currentValue: any, enabled: boolean) => {
    try {
      await updateSetting({
        setting_key: settingKey,
        setting_value: {
          ...currentValue,
          enabled
        }
      });

      toast({
        title: enabled ? 'Feature Enabled' : 'Feature Disabled',
        description: `${settingKey.replace('features.', '').replace(/_/g, ' ')} has been ${enabled ? 'enabled' : 'disabled'}`,
        variant: enabled ? 'default' : 'destructive',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update feature toggle',
        variant: 'destructive',
      });
    }
  };

  const formatFeatureName = (key: string) => {
    return key
      .replace('features.', '')
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const activeFeatures = featureSettings.filter(s => s.setting_value?.enabled).length;
  const totalFeatures = featureSettings.length;

  return (
    <AdminPageLayout
      title="Feature Toggles"
      description="Enable or disable platform features globally"
    >
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Features</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalFeatures}</div>
              <p className="text-xs text-muted-foreground">
                Registered feature flags
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Features</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeFeatures}</div>
              <p className="text-xs text-muted-foreground">
                Currently enabled
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Disabled Features</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalFeatures - activeFeatures}</div>
              <p className="text-xs text-muted-foreground">
                Currently disabled
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search features..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Feature Categories */}
        {Object.entries(categories).map(([categoryName, categorySettings]) => {
          if (categorySettings.length === 0) return null;
          
          const IconComponent = categoryIcons[categorySettings[0]?.category as keyof typeof categoryIcons] || Settings;

          return (
            <Card key={categoryName}>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <IconComponent className="h-5 w-5 text-primary" />
                  <CardTitle>{categoryName}</CardTitle>
                </div>
                <CardDescription>
                  {categorySettings.filter(s => s.setting_value?.enabled).length} of {categorySettings.length} enabled
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {categorySettings.map(setting => (
                  <div 
                    key={setting.id} 
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">
                          {formatFeatureName(setting.setting_key)}
                        </span>
                        {setting.setting_value?.enabled ? (
                          <Badge variant="default" className="bg-emerald-500">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Disabled
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {setting.description}
                      </p>
                      {setting.setting_value?.allowed_roles && (
                        <div className="flex items-center space-x-1">
                          <span className="text-xs text-muted-foreground">Roles:</span>
                          {setting.setting_value.allowed_roles.map((role: string) => (
                            <Badge key={role} variant="outline" className="text-xs">
                              {role}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {setting.setting_value?.disabled_message && !setting.setting_value?.enabled && (
                        <p className="text-xs text-muted-foreground italic">
                          "{setting.setting_value.disabled_message}"
                        </p>
                      )}
                    </div>
                    
                    <Switch
                      checked={setting.setting_value?.enabled || false}
                      onCheckedChange={(checked) => {
                        handleToggle(setting.setting_key, setting.setting_value, checked);
                      }}
                      disabled={loading}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}

        {featureSettings.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                No features found matching "{searchQuery}"
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminPageLayout>
  );
}
