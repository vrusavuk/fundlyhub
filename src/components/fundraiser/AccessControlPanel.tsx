import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { campaignAccessApi } from '@/lib/api/campaignAccessApi';
import { CampaignAccessRule } from '@/types/domain/access';
import { useToast } from '@/hooks/use-toast';
import { Copy, RotateCw, Trash2, Plus, Link as LinkIcon } from 'lucide-react';
import { logger } from '@/lib/services/logger.service';

interface AccessControlPanelProps {
  campaignId: string;
  linkToken?: string;
  visibility: 'public' | 'unlisted' | 'private';
  type?: 'personal' | 'charity';
}

export function AccessControlPanel({ 
  campaignId, 
  linkToken: initialLinkToken,
  visibility,
  type = 'personal'
}: AccessControlPanelProps) {
  const [linkToken, setLinkToken] = useState(initialLinkToken);
  const [rules, setRules] = useState<CampaignAccessRule[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (visibility === 'private') {
      loadAccessRules();
    }
  }, [campaignId, visibility]);

  const loadAccessRules = async () => {
    try {
      const data = await campaignAccessApi.getAccessRules(campaignId);
      setRules(data);
    } catch (error: any) {
      logger.error('Failed to load access rules', error instanceof Error ? error : new Error(String(error)), {
        componentName: 'AccessControlPanel',
        operationName: 'loadAccessRules',
        campaignId
      });
    }
  };

  const handleRotateLink = async () => {
    setLoading(true);
    try {
      const res = await campaignAccessApi.rotateLink(campaignId);
      setLinkToken(res.link_token);
      toast({
        title: 'Success',
        description: 'Link token rotated successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to rotate link',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!linkToken) return;
    const link = `${window.location.origin}/fundraiser/${campaignId}?token=${linkToken}`;
    navigator.clipboard.writeText(link);
    toast({ title: 'Copied!', description: 'Link copied to clipboard' });
  };

  const handleAddEmail = async () => {
    if (!newEmail.trim()) return;

    setLoading(true);
    try {
      await campaignAccessApi.addAccessRule(campaignId, 'allowlist', newEmail.trim());
      setNewEmail('');
      await loadAccessRules();
      toast({
        title: 'Success',
        description: 'Email added to allowlist',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add email',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveRule = async (ruleId: string) => {
    setLoading(true);
    try {
      await campaignAccessApi.removeAccessRule(ruleId);
      await loadAccessRules();
      toast({
        title: 'Success',
        description: 'Access rule removed',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove rule',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Access Control</CardTitle>
        <CardDescription>
          Manage who can view and access this fundraiser
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Type indicator */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Campaign Type:</span>
          <Badge variant={type === 'charity' ? 'default' : 'secondary'}>
            {type === 'charity' ? 'Tax-Deductible' : 'Personal (Non-Deductible)'}
          </Badge>
        </div>

        <Separator />

        {/* Link token */}
        {linkToken && (
          <div className="space-y-2">
            <Label>Link Token</Label>
            <div className="flex gap-2">
              <Input
                value={`...${linkToken.slice(-8)}`}
                readOnly
                className="font-mono"
              />
              <Button onClick={handleCopyLink} variant="outline" size="icon">
                <Copy className="w-4 h-4" />
              </Button>
              <Button 
                onClick={handleRotateLink} 
                variant="outline" 
                size="icon"
                disabled={loading}
              >
                <RotateCw className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Share this link with authorized people. Rotating invalidates the old link.
            </p>
          </div>
        )}

        {/* Allowlist management (only for private) */}
        {visibility === 'private' && (
          <>
            <Separator />
            <div className="space-y-2">
              <Label>Allowlist Emails</Label>
              <div className="flex gap-2">
                <Input
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="user@example.com"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddEmail();
                    }
                  }}
                />
                <Button onClick={handleAddEmail} disabled={loading} size="icon">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {rules.length > 0 && (
                <div className="space-y-2 mt-3">
                  {rules.map((rule) => (
                    <div
                      key={rule.id}
                      className="flex items-center justify-between p-2 border rounded-md"
                    >
                      <span className="text-sm">{rule.rule_value}</span>
                      <Button
                        onClick={() => handleRemoveRule(rule.id)}
                        variant="ghost"
                        size="icon"
                        disabled={loading}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
