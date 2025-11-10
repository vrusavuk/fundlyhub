/**
 * Donation Details Dialog
 * Displays comprehensive donation information with payment details
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Copy, 
  ExternalLink, 
  Mail, 
  RefreshCw,
  CreditCard,
  Calendar,
  DollarSign
} from 'lucide-react';
import { MoneyMath } from '@/lib/enterprise/utils/MoneyMath';
import { formatDistanceToNow } from 'date-fns';
import type { DonationData } from '@/lib/data-table/donation-columns';
import { useToast } from '@/hooks/use-toast';

interface DonationDetailsDialogProps {
  donation: DonationData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onViewCampaign?: (fundraiserId: string) => void;
  onRefund?: (donationId: string) => void;
  canRefund?: boolean;
}

const statusConfig = {
  pending: { label: "Pending", variant: "secondary" as const },
  paid: { label: "Paid", variant: "default" as const },
  completed: { label: "Completed", variant: "default" as const },
  failed: { label: "Failed", variant: "destructive" as const },
  refunded: { label: "Refunded", variant: "outline" as const },
};

export function DonationDetailsDialog({
  donation,
  open,
  onOpenChange,
  onViewCampaign,
  onRefund,
  canRefund = false,
}: DonationDetailsDialogProps) {
  const { toast } = useToast();

  if (!donation) {
    return null;
  }

  const isAnonymous = donation.is_anonymous;
  const donorName = isAnonymous 
    ? "Anonymous Donor" 
    : donation.donor_name || donation.donor?.name || "Unknown";
  const donorEmail = isAnonymous 
    ? "" 
    : donation.donor_email || donation.donor?.email || "";
  const avatar = isAnonymous ? undefined : donation.donor?.avatar;

  const statusBadge = statusConfig[donation.payment_status] || statusConfig.pending;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const handleViewInStripe = () => {
    if (donation.receipt_id) {
      window.open(
        `https://dashboard.stripe.com/payments/${donation.receipt_id}`,
        '_blank'
      );
    }
  };

  const handleRefund = () => {
    if (onRefund) {
      onRefund(donation.id);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Donation Details</DialogTitle>
          <DialogDescription>
            {donation.receipt_id && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm">Receipt ID:</span>
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  {donation.receipt_id}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(donation.receipt_id!, "Receipt ID")}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="mt-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="payment">Payment Details</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-4">
            {/* Donor Information */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Donor Information</h3>
              <div className="flex items-center space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={avatar} alt={donorName} />
                  <AvatarFallback>
                    {donorName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{donorName}</p>
                  {donorEmail && (
                    <p className="text-sm text-muted-foreground">{donorEmail}</p>
                  )}
                  {isAnonymous && (
                    <Badge variant="secondary" className="mt-1">Anonymous</Badge>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Amount Breakdown */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Amount Breakdown</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Donation Amount</span>
                  <span className="font-semibold">
                    {MoneyMath.format(MoneyMath.create(donation.amount, donation.currency))}
                  </span>
                </div>
                {donation.tip_amount && donation.tip_amount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Platform Tip</span>
                    <span className="text-muted-foreground">
                      {MoneyMath.format(MoneyMath.create(donation.tip_amount, donation.currency))}
                    </span>
                  </div>
                )}
                {donation.fee_amount && donation.fee_amount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Processing Fee</span>
                    <span className="text-muted-foreground">
                      {MoneyMath.format(MoneyMath.create(donation.fee_amount, donation.currency))}
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Net to Campaign</span>
                  <span className="text-primary">
                    {MoneyMath.format(MoneyMath.create(
                      donation.net_amount || donation.amount, 
                      donation.currency
                    ))}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Campaign Information */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Campaign</h3>
              <div className="space-y-2">
                <p className="font-medium">{donation.fundraiser?.title || "Unknown Campaign"}</p>
                {onViewCampaign && (
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0 h-auto"
                    onClick={() => onViewCampaign(donation.fundraiser_id)}
                  >
                    View Campaign <ExternalLink className="ml-1 h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>

            {/* Donor Message */}
            {donation.message && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-semibold mb-3">Message</h3>
                  <p className="text-sm text-muted-foreground italic">
                    "{donation.message}"
                  </p>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="payment" className="space-y-6 mt-4">
            {/* Payment Status */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Status</h3>
              <Badge variant={statusBadge.variant} className="text-sm">
                {statusBadge.label}
              </Badge>
            </div>

            <Separator />

            {/* Payment Provider */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Payment Provider</h3>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="capitalize">{donation.payment_provider || "Stripe"}</span>
              </div>
            </div>

            <Separator />

            {/* Payment Timeline */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Timeline</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Created:</span>
                  <span>{new Date(donation.created_at).toLocaleString()}</span>
                  <span className="text-muted-foreground text-xs">
                    ({formatDistanceToNow(new Date(donation.created_at), { addSuffix: true })})
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Stripe Link */}
            {donation.receipt_id && (
              <div>
                <h3 className="text-sm font-semibold mb-3">External Links</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleViewInStripe}
                >
                  View in Stripe Dashboard <ExternalLink className="ml-2 h-3 w-3" />
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {canRefund && 
           (donation.payment_status === 'paid' || donation.payment_status === 'completed') && (
            <Button variant="destructive" onClick={handleRefund}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refund Payment
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
