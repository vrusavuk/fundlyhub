import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { AlertTriangle, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { payoutService } from '@/lib/services/payout.service';

interface PayoutApprovalFlowProps {
  payoutRequest: {
    id: string;
    user_id: string;
    requested_amount_str: string;
    risk_score: number | null;
    risk_factors: any;
    requires_manual_review: boolean;
    status: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export function PayoutApprovalFlow({ payoutRequest, onClose, onSuccess }: PayoutApprovalFlowProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<'approve' | 'deny' | 'info' | null>(null);
  const [notes, setNotes] = useState('');
  const [checklist, setChecklist] = useState({
    identityVerified: false,
    campaignLegit: false,
    noDisputes: false,
    balanceCorrect: false,
  });

  const isHighRisk = (payoutRequest.risk_score || 0) > 70;
  const requiresReview = payoutRequest.requires_manual_review || isHighRisk;

  const allChecklistComplete = requiresReview
    ? Object.values(checklist).every(Boolean)
    : true;

  const handleApprove = async () => {
    if (requiresReview && !allChecklistComplete) {
      toast({
        title: "Complete Review Checklist",
        description: "Please verify all items before approving this payout.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      await payoutService.approvePayout(payoutRequest.id, notes);
      
      toast({
        title: "Payout Approved",
        description: "The payout has been approved and will be processed shortly.",
      });
      
      onSuccess();
      onClose();
    } catch (error) {
      toast({
        title: "Approval Failed",
        description: error instanceof Error ? error.message : "Failed to approve payout",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeny = async () => {
    if (!notes.trim()) {
      toast({
        title: "Denial Reason Required",
        description: "Please provide a reason for denying this payout.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      await payoutService.denyPayout(payoutRequest.id, notes);
      
      toast({
        title: "Payout Denied",
        description: "The payout request has been denied.",
      });
      
      onSuccess();
      onClose();
    } catch (error) {
      toast({
        title: "Denial Failed",
        description: error instanceof Error ? error.message : "Failed to deny payout",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestInfo = async () => {
    if (!notes.trim()) {
      toast({
        title: "Message Required",
        description: "Please specify what additional information is needed.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      await payoutService.requestMoreInfo(payoutRequest.id, notes);
      
      toast({
        title: "Information Requested",
        description: "The creator has been notified to provide more information.",
      });
      
      onSuccess();
      onClose();
    } catch (error) {
      toast({
        title: "Request Failed",
        description: error instanceof Error ? error.message : "Failed to request information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!action) {
    return (
      <div className="space-y-4">
        {/* Risk Assessment */}
        {isHighRisk && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This payout has been flagged as high risk (Score: {payoutRequest.risk_score})
            </AlertDescription>
          </Alert>
        )}

        {/* Risk Factors */}
        {payoutRequest.risk_factors && Array.isArray(payoutRequest.risk_factors) && payoutRequest.risk_factors.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Risk Factors:</Label>
            <div className="flex flex-wrap gap-2">
              {payoutRequest.risk_factors.map((factor: any, index: number) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {typeof factor === 'string' ? factor : factor.reason || 'Unknown'}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Manual Review Checklist */}
        {requiresReview && (
          <div className="border rounded-lg p-4 space-y-3">
            <Label className="text-sm font-semibold">Manual Review Required</Label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="identity"
                  checked={checklist.identityVerified}
                  onCheckedChange={(checked) =>
                    setChecklist((prev) => ({ ...prev, identityVerified: checked as boolean }))
                  }
                />
                <Label htmlFor="identity" className="text-sm font-normal cursor-pointer">
                  Identity and KYC verification confirmed
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="campaign"
                  checked={checklist.campaignLegit}
                  onCheckedChange={(checked) =>
                    setChecklist((prev) => ({ ...prev, campaignLegit: checked as boolean }))
                  }
                />
                <Label htmlFor="campaign" className="text-sm font-normal cursor-pointer">
                  Campaign appears legitimate with no red flags
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="disputes"
                  checked={checklist.noDisputes}
                  onCheckedChange={(checked) =>
                    setChecklist((prev) => ({ ...prev, noDisputes: checked as boolean }))
                  }
                />
                <Label htmlFor="disputes" className="text-sm font-normal cursor-pointer">
                  No active disputes or chargebacks
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="balance"
                  checked={checklist.balanceCorrect}
                  onCheckedChange={(checked) =>
                    setChecklist((prev) => ({ ...prev, balanceCorrect: checked as boolean }))
                  }
                />
                <Label htmlFor="balance" className="text-sm font-normal cursor-pointer">
                  Available balance verified and correct
                </Label>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-3">
          <Button
            variant="default"
            onClick={() => setAction('approve')}
            disabled={requiresReview && !allChecklistComplete}
            className="w-full"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Approve
          </Button>
          <Button
            variant="outline"
            onClick={() => setAction('info')}
            className="w-full"
          >
            <Clock className="h-4 w-4 mr-2" />
            Request Info
          </Button>
          <Button
            variant="destructive"
            onClick={() => setAction('deny')}
            className="w-full"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Deny
          </Button>
        </div>
      </div>
    );
  }

  // Confirmation Step
  return (
    <div className="space-y-4">
      <Alert>
        <AlertDescription>
          {action === 'approve' && 'You are about to approve this payout request. The funds will be transferred to the creator.'}
          {action === 'deny' && 'You are about to deny this payout request. The creator will be notified.'}
          {action === 'info' && 'You are requesting additional information from the creator before proceeding.'}
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label htmlFor="notes">
          {action === 'approve' && 'Admin Notes (optional)'}
          {action === 'deny' && 'Denial Reason (required)'}
          {action === 'info' && 'Information Needed (required)'}
        </Label>
        <Textarea
          id="notes"
          placeholder={
            action === 'approve'
              ? 'Add any notes for internal records...'
              : action === 'deny'
              ? 'Explain why this payout is being denied...'
              : 'Specify what additional information is needed...'
          }
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="resize-none"
        />
      </div>

      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={() => setAction(null)} disabled={loading}>
          Back
        </Button>
        <Button
          onClick={
            action === 'approve'
              ? handleApprove
              : action === 'deny'
              ? handleDeny
              : handleRequestInfo
          }
          disabled={loading}
          variant={action === 'deny' ? 'destructive' : 'default'}
        >
          {loading ? 'Processing...' : `Confirm ${action === 'approve' ? 'Approval' : action === 'deny' ? 'Denial' : 'Request'}`}
        </Button>
      </div>
    </div>
  );
}
