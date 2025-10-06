import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { campaignAccessApi } from '@/lib/api/campaignAccessApi';
import { Lock, AlertCircle } from 'lucide-react';

interface AccessGateProps {
  campaignId: string;
  linkToken?: string;
  onGranted: () => void;
}

export function AccessGate({ campaignId, linkToken, onGranted }: AccessGateProps) {
  const [contact, setContact] = useState('');
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const handleTryEnter = async () => {
    setError(undefined);
    setLoading(true);

    try {
      const res = await campaignAccessApi.checkAccess({
        campaign_id: campaignId,
        link_token: linkToken,
        passcode: passcode || undefined,
        contact: contact || undefined,
      });

      if (res.allow) {
        onGranted();
      } else {
        setError('Access denied. Check your link, passcode, or contact the organizer.');
      }
    } catch (err: any) {
      console.error('Access check error:', err);
      setError(err.message || 'Failed to check access');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <CardTitle>Private Fundraiser</CardTitle>
          <CardDescription>
            This fundraiser is private. Please enter your credentials to continue.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="contact">Your Email or Phone (optional)</Label>
            <Input
              id="contact"
              type="text"
              placeholder="your@email.com"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="passcode">Passcode (if required)</Label>
            <Input
              id="passcode"
              type="password"
              placeholder="Enter passcode"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
            />
          </div>

          <Button onClick={handleTryEnter} disabled={loading} className="w-full">
            {loading ? 'Checking...' : 'Continue'}
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
