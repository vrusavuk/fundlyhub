/**
 * Donation Detail Page
 * Stripe-inspired detail view for individual donations
 */
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, XCircle, Clock, DollarSign, RefreshCw, ExternalLink } from 'lucide-react';
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
  DetailCard,
  DonationDetailSidebar,
} from '@/components/admin/detail';
import { adminDataService } from '@/lib/services/AdminDataService';
import { DonationData } from '@/lib/data-table/donation-columns';
import { Skeleton } from '@/components/ui/skeleton';
import { useDetailPageBreadcrumbs } from '@/hooks/useDetailPageBreadcrumbs';

export default function DonationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [donation, setDonation] = useState<DonationData | null>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <DetailPageLayout
      title={MoneyMath.format(MoneyMath.create(donation.amount, donation.currency))}
      subtitle={`Charged to ${donation.donor_name || 'Anonymous donor'}`}
      status={
        <Badge variant={status.variant} className="gap-1">
          <StatusIcon className="h-3 w-3" />
          {status.label}
        </Badge>
      }
      actions={
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin/donations')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Donations
          </Button>
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
        </>
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
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
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
  );
}
