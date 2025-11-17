import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Clock, DollarSign, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { PayoutApprovalFlow } from './payout/PayoutApprovalFlow';
import { format } from 'date-fns';

interface PayoutDetailDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  payoutRequest: {
    id: string;
    user_id: string;
    fundraiser_id: string | null;
    requested_amount_str: string;
    fee_amount_str: string;
    net_amount_str: string;
    currency: string;
    status: string;
    risk_score: number | null;
    risk_factors: any;
    requires_manual_review: boolean;
    creator_notes: string | null;
    admin_notes: string | null;
    created_at: string;
    estimated_arrival_date: string | null;
  };
}

export function PayoutDetailDialog({
  open,
  onClose,
  onSuccess,
  payoutRequest,
}: PayoutDetailDialogProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return CheckCircle2;
      case 'denied':
        return AlertTriangle;
      case 'pending':
      default:
        return Clock;
    }
  };

  const StatusIcon = getStatusIcon(payoutRequest.status);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Payout Request Details</DialogTitle>
          <DialogDescription>
            Review and manage this payout request
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status and Amount */}
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <StatusIcon className="h-4 w-4" />
                <span className="text-sm font-medium">Status</span>
              </div>
              <Badge variant="outline">{payoutRequest.status.replace('_', ' ')}</Badge>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Net Amount</p>
              <p className="text-2xl font-bold">${payoutRequest.net_amount_str}</p>
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Financial Breakdown</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Requested Amount:</span>
                <span className="font-medium">${payoutRequest.requested_amount_str}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fees:</span>
                <span className="text-destructive">-${payoutRequest.fee_amount_str}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Net to Creator:</span>
                <span>${payoutRequest.net_amount_str}</span>
              </div>
            </div>
          </div>

          {/* Request Details */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Request Details</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">User ID</p>
                <p className="font-mono text-xs">{payoutRequest.user_id.slice(0, 16)}...</p>
              </div>
              <div>
                <p className="text-muted-foreground">Currency</p>
                <p>{payoutRequest.currency}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Requested</p>
                <p>{format(new Date(payoutRequest.created_at), 'MMM d, yyyy')}</p>
              </div>
              {payoutRequest.estimated_arrival_date && (
                <div>
                  <p className="text-muted-foreground">Est. Arrival</p>
                  <p>{format(new Date(payoutRequest.estimated_arrival_date), 'MMM d, yyyy')}</p>
                </div>
              )}
            </div>
          </div>

          {/* Risk Assessment */}
          {(payoutRequest.risk_score !== null || payoutRequest.requires_manual_review) && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Risk Assessment</h4>
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Risk Score</p>
                  <Badge variant={payoutRequest.risk_score && payoutRequest.risk_score > 70 ? 'destructive' : 'outline'}>
                    {payoutRequest.risk_score || 0}
                  </Badge>
                </div>
                {payoutRequest.requires_manual_review && (
                  <div>
                    <Badge variant="outline">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Manual Review Required
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {payoutRequest.creator_notes && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Creator Notes</h4>
              <p className="text-sm text-muted-foreground border-l-2 pl-3">
                {payoutRequest.creator_notes}
              </p>
            </div>
          )}

          {payoutRequest.admin_notes && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Admin Notes</h4>
              <p className="text-sm text-muted-foreground border-l-2 pl-3">
                {payoutRequest.admin_notes}
              </p>
            </div>
          )}

          {/* Approval Flow */}
          {payoutRequest.status === 'pending' && (
            <>
              <Separator />
              <PayoutApprovalFlow
                payoutRequest={payoutRequest}
                onClose={onClose}
                onSuccess={onSuccess}
              />
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
