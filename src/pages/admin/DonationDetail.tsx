/**
 * Donation Detail Page
 * Stripe-inspired detail view for individual donations
 */
import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Check, XCircle, Clock, RefreshCw, ExternalLink, Eye, RotateCcw, ArrowRightLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { MoneyMath } from '@/lib/enterprise/utils/MoneyMath';
import { formatDistanceToNow } from 'date-fns';
import {
  DetailPageLayout,
  DetailSection,
  DetailKeyValue,
  DetailTimeline,
  DonationDetailSidebar,
} from '@/components/admin/detail';
import { adminDataService } from '@/lib/services/AdminDataService';
import { DonationData } from '@/lib/data-table/donation-columns';
import { Skeleton } from '@/components/ui/skeleton';
import { useDetailPageBreadcrumbs } from '@/hooks/useDetailPageBreadcrumbs';
import { ConfirmActionDialog } from '@/components/admin/dialogs/ConfirmActionDialog';
import { ReallocationDialog } from '@/components/admin/donations/ReallocationDialog';
import { useRBAC } from '@/contexts/RBACContext';

export default function DonationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { isSuperAdmin } = useRBAC();
  const [donation, setDonation] = useState<DonationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [showReallocationDialog, setShowReallocationDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const initialActionRef = useRef<string | null>(null);

  // Capture initial action from URL once (before we potentially mutate search params)
  useEffect(() => {
    if (initialActionRef.current === null) {
      initialActionRef.current = searchParams.get('action');
    }
  }, [searchParams]);

  // Open reallocation dialog if action=reallocate was present on entry
  useEffect(() => {
    if (initialActionRef.current === 'reallocate' && donation && !loading) {
      setShowReallocationDialog(true);

      // Clear the action param from URL
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('action');
      setSearchParams(newParams, { replace: true });

      // Prevent re-trigger on future renders
      initialActionRef.current = null;
    }
  }, [donation, loading, searchParams, setSearchParams]);

  // Set dynamic breadcrumbs
  useDetailPageBreadcrumbs(
    'Donation Management',
    '/admin/donations',
    donation ? `${MoneyMath.format(MoneyMath.create(donation.amount, donation.currency))} from ${donation.donor_name || 'Anonymous'}` : undefined,
    loading
  );

  useEffect(() => {
    const fetchDonation = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const donationData = await adminDataService.fetchDonationById(id);
        setDonation(donationData);
      } catch (error) {
        console.error('Error fetching donation:', error);
        toast({
          title: 'Failed to load donation',
          description: error instanceof Error ? error.message : 'Donation not found',
          variant: 'destructive',
        });
        navigate('/admin/donations');
      } finally {
        setLoading(false);
      }
    };

    fetchDonation();
  }, [id, navigate, toast]);

  const handleRefund = async () => {
    if (!donation?.receipt_id) return;
    
    setActionLoading(true);
    try {
      // Open Stripe dashboard for refund - actual refund should be done in Stripe
      window.open(`https://dashboard.stripe.com/payments/${donation.receipt_id}`, '_blank');
      toast({
        title: 'Refund in Stripe',
        description: 'Complete the refund in the Stripe dashboard that just opened.',
      });
    } finally {
      setActionLoading(false);
      setShowRefundDialog(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <Skeleton className="h-12 w-64 mb-4" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!donation) {
    return null;
  }

  const statusConfig = {
    paid: { label: 'Succeeded', variant: 'default' as const, icon: Check },
    completed: { label: 'Completed', variant: 'default' as const, icon: Check },
    pending: { label: 'Pending', variant: 'secondary' as const, icon: Clock },
    failed: { label: 'Failed', variant: 'destructive' as const, icon: XCircle },
    refunded: { label: 'Refunded', variant: 'outline' as const, icon: RefreshCw },
  };

  const status = statusConfig[donation.payment_status] || statusConfig.pending;
  const StatusIcon = status.icon;
  const canRefund = donation.receipt_id && (donation.payment_status === 'paid' || donation.payment_status === 'completed');

  // Timeline events
  const timelineEvents = [
    {
      icon: <Check className="h-4 w-4" />,
      title: 'Payment succeeded',
      subtitle: `${MoneyMath.format(MoneyMath.create(donation.amount, donation.currency))} charged`,
      time: formatDistanceToNow(new Date(donation.created_at), { addSuffix: true }),
    },
    {
      icon: <Clock className="h-4 w-4" />,
      title: 'Payment initiated',
      subtitle: donation.donor_name ? `By ${donation.donor_name}` : 'Anonymous donation',
      time: formatDistanceToNow(new Date(donation.created_at), { addSuffix: true }),
    },
  ];

  const handleViewInStripe = () => {
    if (donation.receipt_id) {
      window.open(`https://dashboard.stripe.com/payments/${donation.receipt_id}`, '_blank');
    }
  };

  const handleViewCampaign = () => {
    if (donation.fundraiser_id) {
      navigate(`/admin/campaigns/${donation.fundraiser_id}`);
    }
  };

  const handleViewDonor = () => {
    if (donation.donor_user_id) {
      navigate(`/admin/users/${donation.donor_user_id}`);
    }
  };

  const handleReallocationSuccess = async () => {
    // Refresh donation data after reallocation
    if (!id) return;
    try {
      const donationData = await adminDataService.fetchDonationById(id);
      setDonation(donationData);
    } catch (error) {
      console.error('Error refreshing donation:', error);
    }
  };

  return (
    <>
      <DetailPageLayout
        title={MoneyMath.format(MoneyMath.create(donation.amount, donation.currency))}
        subtitle={`Charged to ${donation.donor_name || 'Anonymous donor'}`}
        backUrl="/admin/donations"
        backLabel="Donations"
        status={
          <Badge variant={status.variant} className="gap-1">
            <StatusIcon className="h-3 w-3" />
            {status.label}
          </Badge>
        }
        actions={
          <div className="flex flex-wrap gap-2">
            {isSuperAdmin() && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowReallocationDialog(true)}
              >
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                Reallocate
              </Button>
            )}
            {canRefund && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowRefundDialog(true)}
                disabled={actionLoading}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Refund
              </Button>
            )}
            {donation.fundraiser_id && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewCampaign}
              >
                <Eye className="h-4 w-4 mr-2" />
                View Campaign
              </Button>
            )}
            {donation.donor_user_id && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewDonor}
              >
                <Eye className="h-4 w-4 mr-2" />
                View Donor
              </Button>
            )}
            {donation.receipt_id && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewInStripe}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View in Stripe
              </Button>
            )}
          </div>
        }
        mainContent={
          <>
            {/* Recent Activity */}
            <DetailSection title="Recent Activity">
              <DetailTimeline events={timelineEvents} />
            </DetailSection>

            {/* Payment Breakdown */}
            <DetailSection title="Payment Breakdown">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[14px] text-foreground">Donation amount</span>
                  <span className="text-[14px] font-medium text-foreground">
                    {MoneyMath.format(MoneyMath.create(donation.amount, donation.currency))}
                  </span>
                </div>
                
                {donation.tip_amount && donation.tip_amount > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-[14px] text-foreground">Platform tip</span>
                    <span className="text-[14px] font-medium text-foreground">
                      {MoneyMath.format(MoneyMath.create(donation.tip_amount, donation.currency))}
                    </span>
                  </div>
                )}

                {donation.fee_amount && (
                  <div className="flex justify-between items-center">
                    <span className="text-[14px] text-muted-foreground">Processing fee</span>
                    <span className="text-[14px] text-muted-foreground">
                      -{MoneyMath.format(MoneyMath.create(donation.fee_amount, donation.currency))}
                    </span>
                  </div>
                )}

                <div className="border-t border-border pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[14px] font-semibold text-foreground">Net amount</span>
                    <span className="text-[16px] font-semibold text-foreground">
                      {MoneyMath.format(MoneyMath.create(donation.net_amount || donation.amount, donation.currency))}
                    </span>
                  </div>
                </div>
              </div>
            </DetailSection>

            {/* Donor Message */}
            {donation.message && (
              <DetailSection title="Donor Message">
                <p className="text-[14px] text-foreground whitespace-pre-wrap">
                  {donation.message}
                </p>
              </DetailSection>
            )}

            {/* Payment Method Details */}
            <DetailSection title="Payment Method">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <DetailKeyValue
                  label="Method"
                  value={donation.payment_method || 'Card'}
                />
                <DetailKeyValue
                  label="Provider"
                  value={donation.payment_provider || 'Stripe'}
                />
                <DetailKeyValue
                  label="Receipt ID"
                  value={donation.receipt_id || '—'}
                  copyable={!!donation.receipt_id}
                />
                <DetailKeyValue
                  label="Status"
                  value={status.label}
                />
              </div>
            </DetailSection>
          </>
        }
        sidebar={<DonationDetailSidebar donation={donation} />}
      />

      {/* Refund Dialog */}
      <ConfirmActionDialog
        open={showRefundDialog}
        onOpenChange={setShowRefundDialog}
        title="Refund Donation"
        description={`This will open Stripe dashboard to refund ${MoneyMath.format(MoneyMath.create(donation.amount, donation.currency))} to ${donation.donor_name || 'the donor'}. Complete the refund in Stripe.`}
        confirmLabel="Open Stripe"
        variant="destructive"
        isLoading={actionLoading}
        onConfirm={handleRefund}
      />

      {/* Reallocation Dialog */}
      <ReallocationDialog
        open={showReallocationDialog}
        onOpenChange={setShowReallocationDialog}
        donations={[donation]}
        onSuccess={handleReallocationSuccess}
      />
    </>
  );
}
