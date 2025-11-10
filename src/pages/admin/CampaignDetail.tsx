/**
 * Campaign Detail Page
 * Stripe-inspired detail view for individual campaigns
 */
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Check, Clock, TrendingUp } from 'lucide-react';
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
  CampaignDetailSidebar,
} from '@/components/admin/detail';
import { adminDataService } from '@/lib/services/AdminDataService';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [campaign, setCampaign] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCampaign = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const result = await adminDataService.fetchCampaigns(
          { page: 1, pageSize: 1000 },
          {}
        );
        const found = result.data.find((c: any) => c.id === id);
        
        if (found) {
          setCampaign(found);
        } else {
          toast({
            title: 'Campaign not found',
            variant: 'destructive',
          });
          navigate('/admin/campaigns');
        }
      } catch (error) {
        toast({
          title: 'Failed to load campaign',
          variant: 'destructive',
        });
        navigate('/admin/campaigns');
      } finally {
        setLoading(false);
      }
    };

    fetchCampaign();
  }, [id, navigate, toast]);

  if (loading) {
    return (
      <div className="p-8">
        <Skeleton className="h-12 w-64 mb-4" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!campaign) {
    return null;
  }

  const totalRaised = campaign.stats?.total_raised || 0;
  const goalAmount = campaign.goal_amount || 0;
  const progressPercentage = goalAmount > 0 ? Math.min((totalRaised / goalAmount) * 100, 100) : 0;

  const statusConfig = {
    active: { label: 'Active', variant: 'default' as const, icon: Check },
    paused: { label: 'Paused', variant: 'secondary' as const, icon: Clock },
    ended: { label: 'Ended', variant: 'outline' as const, icon: Clock },
    closed: { label: 'Closed', variant: 'outline' as const, icon: Clock },
    draft: { label: 'Draft', variant: 'secondary' as const, icon: Clock },
  };

  const status = statusConfig[campaign.status as keyof typeof statusConfig] || statusConfig.draft;
  const StatusIcon = status.icon;

  const timelineEvents = [
    {
      icon: <Check className="h-4 w-4" />,
      title: 'Campaign created',
      subtitle: `By ${campaign.owner_name || 'Unknown'}`,
      time: formatDistanceToNow(new Date(campaign.created_at), { addSuffix: true }),
    },
  ];

  if (campaign.stats?.last_donation_at) {
    timelineEvents.unshift({
      icon: <TrendingUp className="h-4 w-4" />,
      title: 'Latest donation received',
      subtitle: `${campaign.stats.donor_count} total donations`,
      time: formatDistanceToNow(new Date(campaign.stats.last_donation_at), { addSuffix: true }),
    });
  }

  return (
    <DetailPageLayout
      title={campaign.title}
      subtitle={campaign.summary || 'No summary provided'}
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
            onClick={() => navigate('/admin/campaigns')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Campaigns
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`/fundraiser/${campaign.slug}`, '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View Public Page
          </Button>
        </>
      }
      mainContent={
        <>
          {/* Funding Progress */}
          <DetailSection title="Funding Progress">
            <div className="space-y-4">
              <div className="flex justify-between items-baseline">
                <div>
                  <div className="text-[32px] font-semibold text-foreground">
                    {MoneyMath.format(MoneyMath.create(totalRaised, campaign.currency))}
                  </div>
                  <div className="text-[14px] text-muted-foreground">
                    raised of {MoneyMath.format(MoneyMath.create(goalAmount, campaign.currency))} goal
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[24px] font-semibold text-foreground">
                    {progressPercentage.toFixed(0)}%
                  </div>
                  <div className="text-[12px] text-muted-foreground">
                    funded
                  </div>
                </div>
              </div>
              <Progress value={progressPercentage} className="h-2" />
              <div className="grid grid-cols-3 gap-4 pt-2">
                <div>
                  <div className="text-[12px] text-muted-foreground">Donors</div>
                  <div className="text-[18px] font-semibold text-foreground">
                    {campaign.stats?.donor_count || 0}
                  </div>
                </div>
                <div>
                  <div className="text-[12px] text-muted-foreground">Unique Donors</div>
                  <div className="text-[18px] font-semibold text-foreground">
                    {campaign.stats?.unique_donors || 0}
                  </div>
                </div>
                <div>
                  <div className="text-[12px] text-muted-foreground">Avg Donation</div>
                  <div className="text-[18px] font-semibold text-foreground">
                    {campaign.stats?.average_donation 
                      ? MoneyMath.format(MoneyMath.create(campaign.stats.average_donation, campaign.currency))
                      : '$0'}
                  </div>
                </div>
              </div>
            </div>
          </DetailSection>

          {/* Recent Activity */}
          <DetailSection title="Recent Activity">
            <DetailTimeline events={timelineEvents} />
          </DetailSection>

          {/* Campaign Details */}
          <DetailSection title="Campaign Information">
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <DetailKeyValue
                label="Campaign ID"
                value={campaign.id}
                copyable
              />
              <DetailKeyValue
                label="Slug"
                value={campaign.slug}
                copyable
              />
              <DetailKeyValue
                label="Type"
                value={campaign.type || 'personal'}
              />
              <DetailKeyValue
                label="Currency"
                value={campaign.currency}
              />
              {campaign.location && (
                <DetailKeyValue
                  label="Location"
                  value={campaign.location}
                />
              )}
              {campaign.end_date && (
                <DetailKeyValue
                  label="End Date"
                  value={new Date(campaign.end_date).toLocaleDateString()}
                />
              )}
            </div>
          </DetailSection>

          {/* Story */}
          {campaign.summary && (
            <DetailSection title="Summary">
              <p className="text-[14px] text-foreground whitespace-pre-wrap">
                {campaign.summary}
              </p>
            </DetailSection>
          )}
        </>
      }
      sidebar={<CampaignDetailSidebar campaign={campaign} />}
    />
  );
}
