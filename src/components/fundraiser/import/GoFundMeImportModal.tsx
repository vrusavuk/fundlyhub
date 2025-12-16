import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ExternalLink, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface GoFundMeData {
  title: string;
  story: string;
  goalAmount: number;
  currency: string;
  coverImage: string | null;
  beneficiaryName: string | null;
  location: string | null;
  organizerName: string | null;
  amountRaised: number | null;
  donorCount: number | null;
}

interface GoFundMeImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (data: GoFundMeData) => void;
}

export function GoFundMeImportModal({ open, onOpenChange, onImport }: GoFundMeImportModalProps) {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [previewData, setPreviewData] = useState<GoFundMeData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFetch = async () => {
    if (!url.trim()) {
      setError('Please enter a GoFundMe URL');
      return;
    }

    setIsLoading(true);
    setError(null);
    setPreviewData(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('gofundme-import', {
        body: { url: url.trim() }
      });

      if (fnError) {
        throw new Error(fnError.message || 'Failed to import campaign');
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to import campaign');
      }

      setPreviewData(data.data);
    } catch (err) {
      console.error('Import error:', err);
      setError(err instanceof Error ? err.message : 'Failed to import campaign');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmImport = () => {
    if (previewData) {
      onImport(previewData);
      toast({
        title: 'Campaign imported',
        description: 'The campaign data has been imported. Review and customize before publishing.',
      });
      handleClose();
    }
  };

  const handleClose = () => {
    setUrl('');
    setPreviewData(null);
    setError(null);
    onOpenChange(false);
  };

  const formatCurrency = (amount: number | null, currency: string) => {
    if (amount === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            Import from GoFundMe
          </DialogTitle>
          <DialogDescription>
            Paste a GoFundMe campaign link to import its content into your new fundraiser.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* URL Input */}
          <div className="space-y-2">
            <Label htmlFor="gofundme-url">GoFundMe Campaign URL</Label>
            <div className="flex gap-2">
              <Input
                id="gofundme-url"
                placeholder="https://www.gofundme.com/f/campaign-name"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isLoading}
              />
              <Button onClick={handleFetch} disabled={isLoading || !url.trim()}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Fetching
                  </>
                ) : (
                  'Fetch'
                )}
              </Button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Preview Data */}
          {previewData && (
            <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                <span className="text-sm font-medium text-green-600">Campaign found!</span>
              </div>

              {/* Cover Image Preview */}
              {previewData.coverImage && (
                <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                  <img
                    src={previewData.coverImage}
                    alt={previewData.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Campaign Details */}
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Title</Label>
                  <p className="font-semibold">{previewData.title}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Goal Amount</Label>
                    <p className="font-medium">{formatCurrency(previewData.goalAmount, previewData.currency)}</p>
                  </div>
                  {previewData.amountRaised !== null && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Amount Raised</Label>
                      <p className="font-medium text-green-600">
                        {formatCurrency(previewData.amountRaised, previewData.currency)}
                      </p>
                    </div>
                  )}
                </div>

                {(previewData.beneficiaryName || previewData.organizerName) && (
                  <div className="grid grid-cols-2 gap-3">
                    {previewData.beneficiaryName && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Beneficiary</Label>
                        <p>{previewData.beneficiaryName}</p>
                      </div>
                    )}
                    {previewData.organizerName && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Organizer</Label>
                        <p>{previewData.organizerName}</p>
                      </div>
                    )}
                  </div>
                )}

                {previewData.location && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Location</Label>
                    <p>{previewData.location}</p>
                  </div>
                )}

                <div>
                  <Label className="text-xs text-muted-foreground">Story Preview</Label>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {previewData.story.substring(0, 200)}...
                  </p>
                </div>
              </div>

              {/* Import Button */}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button onClick={handleConfirmImport}>
                  Import Campaign
                </Button>
              </div>
            </div>
          )}

          {/* Help Text */}
          {!previewData && !error && (
            <p className="text-xs text-muted-foreground">
              Note: We'll import the campaign title, story, goal amount, and cover image. 
              You can edit all details before publishing.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
