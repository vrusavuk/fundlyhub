import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CampaignSearchCombobox } from './CampaignSearchCombobox';
import { useDonationReallocation } from '@/hooks/useDonationReallocation';
import { MoneyMath } from '@/lib/enterprise/utils/MoneyMath';
import type { DonationData } from '@/lib/data-table/donation-columns';

interface ReallocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  donations: DonationData[];
  onSuccess: () => void;
}

export function ReallocationDialog({
  open,
  onOpenChange,
  donations,
  onSuccess,
}: ReallocationDialogProps) {
  const [targetCampaignId, setTargetCampaignId] = useState<string | null>(null);
  const [targetCampaign, setTargetCampaign] = useState<{ title: string } | null>(null);
  const [reason, setReason] = useState('');
  const { reallocateDonation, reallocateMultiple, isLoading } = useDonationReallocation();

  const isSingleDonation = donations.length === 1;
  const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0);
  const currency = donations[0]?.currency || 'USD';

  // Get the current campaign ID to exclude from search
  const currentCampaignId = isSingleDonation ? donations[0].fundraiser_id : undefined;

  const handleConfirm = async () => {
    if (!targetCampaignId || !reason.trim()) return;

    if (isSingleDonation) {
      const result = await reallocateDonation(donations[0].id, targetCampaignId, reason);
      if (result.success) {
        onOpenChange(false);
        onSuccess();
        resetForm();
      }
    } else {
      const donationIds = donations.map((d) => d.id);
      await reallocateMultiple(donationIds, targetCampaignId, reason);
      onOpenChange(false);
      onSuccess();
      resetForm();
    }
  };

  const resetForm = () => {
    setTargetCampaignId(null);
    setTargetCampaign(null);
    setReason('');
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Reallocate {isSingleDonation ? 'Donation' : `${donations.length} Donations`}
          </DialogTitle>
          <DialogDescription>
            Move {isSingleDonation ? 'this donation' : 'these donations'} to a different campaign.
            This action will be logged and cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current donation info */}
          <div className="rounded-lg border bg-muted/50 p-3 sm:p-4">
            <div className="text-xs sm:text-sm text-muted-foreground mb-1">
              {isSingleDonation ? 'Donation Details' : 'Selected Donations'}
            </div>
            <div className="font-semibold text-base sm:text-lg">
              {MoneyMath.format(MoneyMath.create(totalAmount, currency))}
            </div>
            {isSingleDonation && donations[0].fundraiser?.title && (
              <div className="text-xs sm:text-sm text-muted-foreground mt-1 break-words">
                Currently in: <span className="font-medium">{donations[0].fundraiser.title}</span>
              </div>
            )}
            {!isSingleDonation && (
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                {donations.length} donations selected
              </div>
            )}
          </div>

          {/* Arrow indicator */}
          <div className="flex justify-center">
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </div>

          {/* Target campaign selector */}
          <div className="space-y-2">
            <Label htmlFor="target-campaign">Target Campaign</Label>
            <CampaignSearchCombobox
              value={targetCampaignId}
              onChange={(id, campaign) => {
                setTargetCampaignId(id);
                setTargetCampaign(campaign);
              }}
              excludeCampaignId={currentCampaignId}
              placeholder="Search and select a campaign..."
              disabled={isLoading}
            />
          </div>

          {/* Reason input */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Reallocation *</Label>
            <Textarea
              id="reason"
              placeholder="Explain why this donation is being reallocated..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              This reason will be recorded in the audit log.
            </p>
          </div>

          {/* Warning */}
          <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This action is permanent and will be logged. Campaign statistics will be updated
              automatically.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!targetCampaignId || !reason.trim() || isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Reallocating...
              </>
            ) : (
              'Confirm Reallocation'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
