/**
 * Organization Detail Page
 * Stripe-inspired detail view for individual organizations
 */
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Building, Check, Clock, XCircle, ShieldCheck, ShieldX, ShieldAlert } from 'lucide-react';
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
import { useDetailPageBreadcrumbs } from '@/hooks/useDetailPageBreadcrumbs';
import { ConfirmActionDialog } from '@/components/admin/dialogs/ConfirmActionDialog';
import { ReasonInputDialog } from '@/components/admin/dialogs/ReasonInputDialog';
import { supabase } from '@/integrations/supabase/client';

export default function OrganizationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [organization, setOrganization] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Dialog states
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showPendingDialog, setShowPendingDialog] = useState(false);

  // Set dynamic breadcrumbs
  useDetailPageBreadcrumbs(
    'Organization Management',
    '/admin/organizations',
    organization?.legal_name,
    loading
  );

  const fetchOrganization = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const orgData = await adminDataService.fetchOrganizationById(id);
      setOrganization(orgData);
    } catch (error) {
      console.error('Error fetching organization:', error);
      toast({
        title: 'Failed to load organization',
        description: error instanceof Error ? error.message : 'Organization not found',
        variant: 'destructive',
      });
      navigate('/admin/organizations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganization();
  }, [id, navigate, toast]);

  const handleVerificationChange = async (newStatus: 'approved' | 'pending' | 'rejected', reason?: string) => {
    if (!id) return;
    
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('organizations')
        .update({ 
          verification_status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      const statusLabel = newStatus === 'approved' ? 'verified' : newStatus;
      toast({
        title: 'Status Updated',
        description: `Organization has been marked as ${statusLabel}.`,
      });
      
      // Refresh data
      await fetchOrganization();
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: error instanceof Error ? error.message : 'Failed to update status',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
      setShowApproveDialog(false);
      setShowRejectDialog(false);
      setShowPendingDialog(false);
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

  if (!organization) {
    return null;
  }

  const verificationConfig = {
    approved: { label: 'Verified', variant: 'default' as const, icon: Check },
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

  const currentStatus = organization.verification_status;

  return (
    <>
      <DetailPageLayout
        title={organization.legal_name}
        subtitle={organization.dba_name || 'No DBA name'}
        backUrl="/admin/organizations"
        backLabel="Organizations"
        status={
          <Badge variant={verification.variant} className="gap-1">
            <VerificationIcon className="h-3 w-3" />
            {verification.label}
          </Badge>
        }
        actions={
          <div className="flex flex-wrap gap-2">
            {currentStatus !== 'approved' && (
              <Button
                size="sm"
                onClick={() => setShowApproveDialog(true)}
                disabled={actionLoading}
              >
                <ShieldCheck className="h-4 w-4 mr-2" />
                Approve
              </Button>
            )}
            {currentStatus !== 'pending' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPendingDialog(true)}
                disabled={actionLoading}
              >
                <ShieldAlert className="h-4 w-4 mr-2" />
                Mark Pending
              </Button>
            )}
            {currentStatus !== 'rejected' && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowRejectDialog(true)}
                disabled={actionLoading}
              >
                <ShieldX className="h-4 w-4 mr-2" />
                Reject
              </Button>
            )}
          </div>
        }
        mainContent={
          <>
            {/* Organization Information */}
            <DetailSection title="Organization Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
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

      {/* Approve Dialog */}
      <ConfirmActionDialog
        open={showApproveDialog}
        onOpenChange={setShowApproveDialog}
        title="Approve Organization"
        description={`Are you sure you want to approve "${organization.legal_name}"? This will mark the organization as verified.`}
        confirmLabel="Approve"
        isLoading={actionLoading}
        onConfirm={() => handleVerificationChange('approved')}
      />

      {/* Pending Dialog */}
      <ConfirmActionDialog
        open={showPendingDialog}
        onOpenChange={setShowPendingDialog}
        title="Mark as Pending"
        description={`Are you sure you want to mark "${organization.legal_name}" as pending review?`}
        confirmLabel="Mark Pending"
        isLoading={actionLoading}
        onConfirm={() => handleVerificationChange('pending')}
      />

      {/* Reject Dialog */}
      <ReasonInputDialog
        open={showRejectDialog}
        onOpenChange={setShowRejectDialog}
        title="Reject Organization"
        description={`Rejecting "${organization.legal_name}" will prevent them from creating campaigns.`}
        reasonLabel="Rejection Reason"
        reasonPlaceholder="Enter reason for rejection..."
        confirmLabel="Reject"
        variant="destructive"
        isLoading={actionLoading}
        onConfirm={(reason) => handleVerificationChange('rejected', reason)}
      />
    </>
  );
}
