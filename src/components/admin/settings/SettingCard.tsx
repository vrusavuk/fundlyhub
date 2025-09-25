import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Lock, 
  Save, 
  RefreshCw, 
  AlertTriangle, 
  Info,
  Eye,
  EyeOff
} from 'lucide-react';
import { SystemSetting, SettingUpdate } from '@/hooks/useSystemSettings';

interface SettingCardProps {
  setting: SystemSetting;
  canEdit: boolean;
  canViewSensitive: boolean;
  onUpdate: (update: SettingUpdate) => Promise<boolean>;
  saving?: boolean;
}

export function SettingCard({ 
  setting, 
  canEdit, 
  canViewSensitive, 
  onUpdate, 
  saving = false 
}: SettingCardProps) {
  const [localValue, setLocalValue] = useState(setting.setting_value);
  const [hasChanges, setHasChanges] = useState(false);
  const [showSensitive, setShowSensitive] = useState(false);

  const handleValueChange = (newValue: any) => {
    setLocalValue(newValue);
    setHasChanges(JSON.stringify(newValue) !== JSON.stringify(setting.setting_value));
  };

  const handleSave = async () => {
    const success = await onUpdate({
      setting_key: setting.setting_key,
      setting_value: localValue,
      change_reason: 'Updated via admin settings panel'
    });
    
    if (success) {
      setHasChanges(false);
    }
  };

  const handleReset = () => {
    setLocalValue(setting.setting_value);
    setHasChanges(false);
  };

  const renderValueInput = () => {
    const value = localValue;
    
    if (setting.is_sensitive && !canViewSensitive) {
      return (
        <Alert>
          <Lock className="h-4 w-4" />
          <AlertDescription>
            This setting contains sensitive information that only super admins can view.
          </AlertDescription>
        </Alert>
      );
    }

    if (setting.is_sensitive && !showSensitive) {
      return (
        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSensitive(true)}
            className="w-full"
          >
            <Eye className="w-4 h-4 mr-2" />
            Show Sensitive Value
          </Button>
        </div>
      );
    }

    // Handle different value types
    if (typeof value === 'boolean') {
      return (
        <div className="flex items-center space-x-2">
          <Switch
            checked={value}
            onCheckedChange={(checked) => handleValueChange(checked)}
            disabled={!canEdit}
          />
          <Label>{value ? 'Enabled' : 'Disabled'}</Label>
        </div>
      );
    }

    if (typeof value === 'object') {
      // Handle JSON objects with UI-friendly controls
      if (setting.setting_key.includes('password_policy')) {
        return renderPasswordPolicyControls(value);
      }
      
      if (setting.setting_key.includes('rate_limiting')) {
        return renderRateLimitingControls(value);
      }

      // Default JSON editor
      return (
        <div className="space-y-2">
          <Label>JSON Configuration</Label>
          <Textarea
            value={JSON.stringify(value, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                handleValueChange(parsed);
              } catch {
                // Invalid JSON, don't update
              }
            }}
            disabled={!canEdit}
            rows={6}
            className="font-mono text-sm"
          />
        </div>
      );
    }

    // String/number inputs
    return (
      <div className="space-y-2">
        <Label>{setting.description || setting.setting_key}</Label>
        <Input
          type={typeof value === 'number' ? 'number' : 'text'}
          value={value?.toString() || ''}
          onChange={(e) => {
            const newValue = typeof value === 'number' 
              ? parseFloat(e.target.value) || 0 
              : e.target.value;
            handleValueChange(newValue);
          }}
          disabled={!canEdit}
        />
      </div>
    );
  };

  const renderPasswordPolicyControls = (policy: any) => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Minimum Length</Label>
        <Input
          type="number"
          value={policy.min_length || 8}
          onChange={(e) => handleValueChange({
            ...policy,
            min_length: parseInt(e.target.value) || 8
          })}
          disabled={!canEdit}
        />
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Require Uppercase</Label>
          <Switch
            checked={policy.require_uppercase || false}
            onCheckedChange={(checked) => handleValueChange({
              ...policy,
              require_uppercase: checked
            })}
            disabled={!canEdit}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <Label>Require Numbers</Label>
          <Switch
            checked={policy.require_numbers || false}
            onCheckedChange={(checked) => handleValueChange({
              ...policy,
              require_numbers: checked
            })}
            disabled={!canEdit}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <Label>Require Special Characters</Label>
          <Switch
            checked={policy.require_special_chars || false}
            onCheckedChange={(checked) => handleValueChange({
              ...policy,
              require_special_chars: checked
            })}
            disabled={!canEdit}
          />
        </div>
      </div>
    </div>
  );

  const renderRateLimitingControls = (rateLimiting: any) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Enable Rate Limiting</Label>
        <Switch
          checked={rateLimiting.enabled || false}
          onCheckedChange={(checked) => handleValueChange({
            ...rateLimiting,
            enabled: checked
          })}
          disabled={!canEdit}
        />
      </div>
      
      {rateLimiting.enabled && (
        <>
          <div className="space-y-2">
            <Label>Requests per Minute</Label>
            <Input
              type="number"
              value={rateLimiting.requests_per_minute || 100}
              onChange={(e) => handleValueChange({
                ...rateLimiting,
                requests_per_minute: parseInt(e.target.value) || 100
              })}
              disabled={!canEdit}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Burst Limit</Label>
            <Input
              type="number"
              value={rateLimiting.burst_limit || 200}
              onChange={(e) => handleValueChange({
                ...rateLimiting,
                burst_limit: parseInt(e.target.value) || 200
              })}
              disabled={!canEdit}
            />
          </div>
        </>
      )}
    </div>
  );

  return (
    <Card className="relative">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-sm font-medium">
              {setting.setting_key.split('.').pop()?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </CardTitle>
            <CardDescription className="text-xs">
              {setting.description}
            </CardDescription>
          </div>
          
          <div className="flex items-center space-x-2">
            {setting.is_sensitive && (
              <Badge variant="outline" className="text-xs">
                <Lock className="w-3 h-3 mr-1" />
                Sensitive
              </Badge>
            )}
            {setting.requires_restart && (
              <Badge variant="outline" className="text-xs">
                <RefreshCw className="w-3 h-3 mr-1" />
                Restart Required
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
      
      <CardContent className="space-y-4">
        {renderValueInput()}
        
        {setting.requires_restart && hasChanges && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This setting requires a system restart to take effect.
            </AlertDescription>
          </Alert>
        )}

        {canEdit && (
          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-muted-foreground">
              Last updated: {new Date(setting.updated_at).toLocaleString()}
            </div>
            
            {hasChanges && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  disabled={saving}
                >
                  Reset
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <RefreshCw className="w-3 h-3 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-3 h-3 mr-2" />
                  )}
                  Save
                </Button>
              </div>
            )}
          </div>
        )}

        {setting.is_sensitive && showSensitive && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSensitive(false)}
            className="w-full mt-2"
          >
            <EyeOff className="w-4 h-4 mr-2" />
            Hide Sensitive Value
          </Button>
        )}
      </CardContent>
    </Card>
  );
}