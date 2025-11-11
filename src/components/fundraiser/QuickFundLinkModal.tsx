import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { campaignAccessApi } from '@/lib/api/campaignAccessApi';
import { useToast } from '@/hooks/use-toast';
import { Copy, QrCode } from 'lucide-react';
import { logger } from '@/lib/services/logger.service';

interface QuickFundLinkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (result: { campaign_id: string; link_token: string }) => void;
}

export function QuickFundLinkModal({ open, onOpenChange, onCreated }: QuickFundLinkModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'personal' | 'charity'>('personal');
  const [visibility, setVisibility] = useState<'private' | 'unlisted' | 'public'>('private');
  const [goalAmount, setGoalAmount] = useState('');
  const [emails, setEmails] = useState('');
  const [passcode, setPasscode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ campaign_id: string; link_token: string } | null>(null);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({ title: 'Error', description: 'Campaign name is required', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const allowlist = emails.split(',').map(x => x.trim()).filter(Boolean);
      const payload: any = {
        name,
        type,
        visibility,
        goal_amount: goalAmount ? parseFloat(goalAmount) : undefined,
        currency: 'USD',
        access: {}
      };

      if (allowlist.length) payload.access.allowlist_emails = allowlist;
      if (passcode) payload.access.passcode = passcode;

      const res = await campaignAccessApi.createCampaign(payload);
      setResult(res);
      
      toast({
        title: 'Success',
        description: `Private fundraiser created! Link token: ${res.link_token.slice(-4)}`,
      });

      if (onCreated) {
        onCreated(res);
      }
    } catch (error: any) {
      logger.error('Create campaign error', error instanceof Error ? error : new Error(String(error)), {
        componentName: 'QuickFundLinkModal',
        operationName: 'handleSubmit',
        campaignName: name
      });
      toast({
        title: 'Error',
        description: error.message || 'Failed to create campaign',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    if (!result) return;
    const link = `${window.location.origin}/fundraiser/${result.campaign_id}?token=${result.link_token}`;
    navigator.clipboard.writeText(link);
    toast({ title: 'Copied!', description: 'Link copied to clipboard' });
  };

  const handleClose = () => {
    setName('');
    setGoalAmount('');
    setEmails('');
    setPasscode('');
    setResult(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Quick Fund Link</DialogTitle>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Campaign Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., SF gas & parking"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Type</Label>
                <Select value={type} onValueChange={(v: any) => setType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal">Personal (non-deductible)</SelectItem>
                    <SelectItem value="charity">Charity (tax-deductible)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="visibility">Visibility</Label>
                <Select value={visibility} onValueChange={(v: any) => setVisibility(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="unlisted">Unlisted (link-only)</SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="goal">Goal Amount (optional)</Label>
              <Input
                id="goal"
                type="number"
                value={goalAmount}
                onChange={(e) => setGoalAmount(e.target.value)}
                placeholder="500"
              />
            </div>

            {visibility === 'private' && (
              <>
                <div>
                  <Label htmlFor="emails">Allowlist Emails (optional)</Label>
                  <Input
                    id="emails"
                    value={emails}
                    onChange={(e) => setEmails(e.target.value)}
                    placeholder="friend1@example.com, friend2@example.com"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Comma-separated list of allowed emails
                  </p>
                </div>

                <div>
                  <Label htmlFor="passcode">Passcode (optional)</Label>
                  <Input
                    id="passcode"
                    type="password"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="Enter a passcode"
                  />
                </div>
              </>
            )}

            <Button onClick={handleSubmit} disabled={loading} className="w-full">
              {loading ? 'Creating...' : 'Create Campaign'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-accent rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Campaign ID:</p>
              <p className="font-mono text-sm break-all">{result.campaign_id}</p>
            </div>

            <div className="p-4 bg-accent rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Link Token:</p>
              <p className="font-mono text-sm break-all">{result.link_token}</p>
            </div>

            <div className="flex gap-2">
              <Button onClick={copyLink} className="flex-1">
                <Copy className="w-4 h-4 mr-2" />
                Copy Link
              </Button>
              <Button variant="outline" onClick={() => {/* TODO: QR code */}}>
                <QrCode className="w-4 h-4" />
              </Button>
            </div>

            <Button onClick={handleClose} variant="outline" className="w-full">
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
