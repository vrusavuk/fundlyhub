/**
 * Organization Detail Page
 * Stripe-inspired detail view for individual organizations
 */
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building, Check, Clock, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import {
  DetailPageLayout,
  DetailSection,
  DetailKeyValue,
  DetailTimeline,
  OrganizationDetailSidebar,
} from '@/components/admin/detail';
import { adminDataService } from '@/lib/services/AdminDataService';
import { Skeleton } from '@/components/ui/skeleton';

export default function OrganizationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [organization, setOrganization] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrganization = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const result = await adminDataService.fetchOrganizations(
          { page: 1, pageSize: 1000 },
          {}
        );
        const found = result.data.find((o: any) => o.id === id);
        
        if (found) {
          setOrganization(found);
        } else {
          toast({
            title: 'Organization not found',
            variant: 'destructive',
          });
          navigate('/admin/organizations');
        }
      } catch (error) {
        toast({
          title: 'Failed to load organization',
          variant: 'destructive',
        });
        navigate('/admin/organizations');
      } finally {
        setLoading(false);
      }
    };

    fetchOrganization();
  }, [id, navigate, toast]);

  if (loading) {
    return (
      <div className="p-8">
        <Skeleton className="h-12 w-64 mb-4" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!organization) {
    return null;
  }

  const verificationConfig = {
    verified: { label: 'Verified', variant: 'default' as const, icon: Check },
    pending: { label: 'Pending', variant: 'secondary' as const, icon: Clock },
    rejected: { label: 'Rejected', variant: 'destructive' as const, icon: XCircle },
    unverified: { label: 'Unverified', variant: 'outline' as const, icon: XCircle },
  };

  const verification = verificationConfig[organization.verification_status as keyof typeof verificationConfig] || verificationConfig.unverified;
  const VerificationIcon = verification.icon;

  const timelineEvents = [
    {
      icon: <Building className="h-4 w-4" />,
      title: 'Organization created',
      subtitle: organization.legal_name,
      time: formatDistanceToNow(new Date(organization.created_at), { addSuffix: true }),
    },
  ];

  if (organization.updated_at !== organization.created_at) {
    timelineEvents.unshift({
      icon: <Check className="h-4 w-4" />,
      title: 'Last updated',
      subtitle: 'Organization details modified',
      time: formatDistanceToNow(new Date(organization.updated_at), { addSuffix: true }),
    });
  }

  return (
    <DetailPageLayout
      title={organization.legal_name}
      subtitle={organization.dba_name || 'No DBA name'}
      status={
        <Badge variant={verification.variant} className="gap-1">
          <VerificationIcon className="h-3 w-3" />
          {verification.label}
        </Badge>
      }
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/admin/organizations')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Organizations
        </Button>
      }
      mainContent={
        <>
          {/* Organization Information */}
          <DetailSection title="Organization Information">
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <DetailKeyValue
                label="Legal Name"
                value={organization.legal_name}
              />
              {organization.dba_name && (
                <DetailKeyValue
                  label="DBA Name"
                  value={organization.dba_name}
                />
              )}
              {organization.ein && (
                <DetailKeyValue
                  label="EIN"
                  value={organization.ein}
                  copyable
                />
              )}
              {organization.country && (
                <DetailKeyValue
                  label="Country"
                  value={organization.country}
                />
              )}
              {organization.website && (
                <DetailKeyValue
                  label="Website"
                  value={
                    <a
                      href={organization.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {organization.website}
                    </a>
                  }
                />
              )}
            </div>
          </DetailSection>

          {/* Recent Activity */}
          <DetailSection title="Recent Activity">
            <DetailTimeline events={timelineEvents} />
          </DetailSection>

          {/* Statistics */}
          <DetailSection title="Statistics">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-[12px] text-muted-foreground mb-1">Campaigns</div>
                <div className="text-[24px] font-semibold text-foreground">
                  {organization.campaign_count || 0}
                </div>
              </div>
              <div>
                <div className="text-[12px] text-muted-foreground mb-1">Members</div>
                <div className="text-[24px] font-semibold text-foreground">
                  {organization.member_count || 0}
                </div>
              </div>
              <div>
                <div className="text-[12px] text-muted-foreground mb-1">Total Raised</div>
                <div className="text-[24px] font-semibold text-foreground">
                  ${Number(organization.total_raised || 0).toLocaleString()}
                </div>
              </div>
            </div>
          </DetailSection>

          {/* Payment Integration */}
          {(organization.stripe_connect_id || organization.paypal_merchant_id) && (
            <DetailSection title="Payment Integration">
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                {organization.stripe_connect_id && (
                  <DetailKeyValue
                    label="Stripe Connect ID"
                    value={organization.stripe_connect_id}
                    copyable
                  />
                )}
                {organization.paypal_merchant_id && (
                  <DetailKeyValue
                    label="PayPal Merchant ID"
                    value={organization.paypal_merchant_id}
                    copyable
                  />
                )}
              </div>
            </DetailSection>
          )}

          {/* Categories */}
          {organization.categories && organization.categories.length > 0 && (
            <DetailSection title="Categories">
              <div className="flex flex-wrap gap-2">
                {organization.categories.map((category: string, index: number) => (
                  <Badge key={index} variant="secondary">
                    {category}
                  </Badge>
                ))}
              </div>
            </DetailSection>
          )}
        </>
      }
      sidebar={<OrganizationDetailSidebar organization={organization} />}
    />
  );
}
