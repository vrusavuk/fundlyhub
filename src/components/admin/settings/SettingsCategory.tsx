import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, Users, Shield, Mail, Server, Settings, Bell, Eye } from 'lucide-react';
import { SettingCard } from './SettingCard';
import { SystemSetting, SettingUpdate } from '@/hooks/useSystemSettings';

interface SettingsCategoryProps {
  category: string;
  settings: SystemSetting[];
  canEdit: boolean;
  canViewSensitive: boolean;
  onUpdate: (update: SettingUpdate) => Promise<boolean>;
  saving?: boolean;
}

const CATEGORY_CONFIG = {
  general: {
    title: 'General Settings',
    description: 'Basic platform configuration and operational settings',
    icon: Settings,
    color: 'blue'
  },
  security: {
    title: 'Security Settings',
    description: 'Authentication, authorization, and security policies',
    icon: Shield,
    color: 'red'
  },
  email: {
    title: 'Email Settings',
    description: 'Email delivery, templates, and notification configuration',
    icon: Mail,
    color: 'green'
  },
  api: {
    title: 'API Settings',
    description: 'API rate limiting, CORS, and webhook configuration',
    icon: Server,
    color: 'purple'
  },
  user_management: {
    title: 'User Management',
    description: 'User roles, permissions, and account policies',
    icon: Users,
    color: 'orange'
  },
  content_moderation: {
    title: 'Content Moderation',
    description: 'Content filtering, approval workflows, and spam detection',
    icon: Eye,
    color: 'yellow'
  },
  notifications: {
    title: 'Notifications',
    description: 'Push notifications, email alerts, and communication settings',
    icon: Bell,
    color: 'pink'
  },
  system: {
    title: 'System Settings',
    description: 'Infrastructure, monitoring, and maintenance configuration',
    icon: Server,
    color: 'gray'
  }
};

export function SettingsCategory({ 
  category, 
  settings, 
  canEdit, 
  canViewSensitive, 
  onUpdate, 
  saving = false 
}: SettingsCategoryProps) {
  const config = CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG] || {
    title: category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    description: `Settings for ${category}`,
    icon: Settings,
    color: 'gray'
  };

  const Icon = config.icon;
  const sensitiveCount = settings.filter(s => s.is_sensitive).length;
  const editableCount = settings.length;

  if (settings.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg bg-${config.color}-100 dark:bg-${config.color}-900/20`}>
                <Icon className={`w-5 h-5 text-${config.color}-600 dark:text-${config.color}-400`} />
              </div>
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <span>{config.title}</span>
                  <Badge variant="outline" className="text-xs">
                    {settings.length} settings
                  </Badge>
                </CardTitle>
                <CardDescription>{config.description}</CardDescription>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {sensitiveCount > 0 && (
                <Badge variant="outline" className="text-xs">
                  <Lock className="w-3 h-3 mr-1" />
                  {sensitiveCount} sensitive
                </Badge>
              )}
              {!canEdit && (
                <Badge variant="outline" className="text-xs">
                  Read Only
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        
        {!canEdit && (
          <CardContent>
            <Alert>
              <Lock className="h-4 w-4" />
              <AlertDescription>
                You don't have permission to modify settings in this category. 
                Contact a super administrator for changes.
              </AlertDescription>
            </Alert>
          </CardContent>
        )}
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {settings.map((setting) => (
          <SettingCard
            key={setting.id}
            setting={setting}
            canEdit={canEdit}
            canViewSensitive={canViewSensitive}
            onUpdate={onUpdate}
            saving={saving}
          />
        ))}
      </div>
    </div>
  );
}