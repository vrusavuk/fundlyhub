/**
 * User Detail Page
 * Stripe-inspired detail view for individual users
 */
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Check, XCircle, Ban, UserCheck, UserX, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { usePagination } from '@/hooks/usePagination';
import { formatDistanceToNow } from 'date-fns';
import { ColumnDef, Row, SortingState } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { MoneyMath } from '@/lib/enterprise/utils/MoneyMath';
import {
  DetailPageLayout,
  DetailSection,
  DetailKeyValue,
  DetailTimeline,
  UserDetailSidebar,
} from '@/components/admin/detail';
import { adminDataService } from '@/lib/services/AdminDataService';
import { Skeleton } from '@/components/ui/skeleton';
import { useDetailPageBreadcrumbs } from '@/hooks/useDetailPageBreadcrumbs';
import { ConfirmActionDialog } from '@/components/admin/dialogs/ConfirmActionDialog';
import { ReasonInputDialog } from '@/components/admin/dialogs/ReasonInputDialog';
import { supabase } from '@/integrations/supabase/client';
import { DataTableExact } from '@/components/admin/data-table-exact';
import { StripeCardExact } from '@/components/ui/stripe-card-exact';
import { StripePagination } from '@/components/ui/StripePagination';
import { useIsMobile } from '@/hooks/use-mobile';
import { DonationMobileCard } from '@/components/ui/mobile-card';

export default function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [donations, setDonations] = useState<any[]>([]);
  const [donationsLoading, setDonationsLoading] = useState(true);
  const [totalDonations, setTotalDonations] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Dialog states
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [showUnsuspendDialog, setShowUnsuspendDialog] = useState(false);
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [showUnbanDialog, setShowUnbanDialog] = useState(false);
  
  const donationPagination = usePagination({
    initialPageSize: 10,
    syncWithURL: false
  });

  // Sorting state for donations table
  const [donationSorting, setDonationSorting] = useState<SortingState>([
    { id: 'created_at', desc: true }
  ]);

  // Set dynamic breadcrumbs
  useDetailPageBreadcrumbs(
    'User Management',
    '/admin/users',
    user?.name,
    loading
  );

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'paid':
      case 'completed':
        return 'stripe-success';
      case 'pending':
        return 'stripe-warning';
      case 'failed':
        return 'destructive';
      case 'refunded':
        return 'stripe-neutral';
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Succeeded';
      case 'completed':
        return 'Completed';
      case 'pending':
        return 'Pending';
      case 'failed':
        return 'Failed';
      case 'refunded':
        return 'Refunded';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  // Column definitions for donation table - must be before any early returns
  const donationColumns: ColumnDef<any, any>[] = useMemo(() => [
    {
      accessorKey: 'amount',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Amount" />
      ),
      cell: ({ row }) => (
        <span className="font-medium">
          {MoneyMath.format(MoneyMath.create(row.original.amount, row.original.currency))}
        </span>
      ),
      sortingFn: (rowA, rowB) => rowA.original.amount - rowB.original.amount,
    },
    {
      accessorKey: 'campaign',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Campaign" />
      ),
      cell: ({ row }) => row.original.fundraisers?.title || 'Unknown Campaign',
      sortingFn: (rowA, rowB) => {
        const a = rowA.original.fundraisers?.title || '';
        const b = rowB.original.fundraisers?.title || '';
        return a.localeCompare(b);
      },
    },
    {
      accessorKey: 'payment_status',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => (
        <Badge variant={getStatusVariant(row.original.payment_status) as any}>
          {getStatusLabel(row.original.payment_status)}
        </Badge>
      ),
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Date" />
      ),
      cell: ({ row }) => formatDistanceToNow(new Date(row.original.created_at), { addSuffix: true }),
    },
    {
      id: 'actions',
      header: '',
      cell: () => (
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      ),
    },
  ], []);

  const fetchUser = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const userData = await adminDataService.fetchUserById(id);
      setUser(userData);
    } catch (error) {
      console.error('Error fetching user:', error);
      toast({
        title: 'Failed to load user',
        description: error instanceof Error ? error.message : 'User not found',
        variant: 'destructive',
      });
      navigate('/admin/users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [id, navigate, toast]);

  useEffect(() => {
    const fetchDonations = async () => {
      if (!id) return;
      
      try {
        setDonationsLoading(true);
        
        // Convert sorting state to API format
        const sortBy = donationSorting.length > 0 ? donationSorting[0].id : 'created_at';
        const sortOrder = donationSorting.length > 0 && donationSorting[0].desc ? 'desc' : 'asc';
        
        const result = await adminDataService.fetchUserDonationsPaginated(
          id,
          {
            page: donationPagination.state.page,
            pageSize: donationPagination.state.pageSize
          },
          { sortBy, sortOrder }
        );
        setDonations(result.data);
        setTotalDonations(result.total);
        donationPagination.setTotal(result.total);
      } catch (error) {
        console.error('Error fetching user donations:', error);
      } finally {
        setDonationsLoading(false);
      }
    };

    if (user) {
      fetchDonations();
    }
  }, [id, user, donationPagination.state.page, donationPagination.state.pageSize, donationSorting]);

  // Handle sorting change - reset to first page when sorting changes
  const handleDonationSortingChange = useCallback((newSorting: SortingState) => {
    setDonationSorting(newSorting);
    donationPagination.goToPage(1);
  }, [donationPagination]);

  const handleStatusChange = async (newStatus: 'active' | 'suspended' | 'banned', reason?: string) => {
    if (!id) return;
    
    setActionLoading(true);
    try {
      const updateData: any = {
        account_status: newStatus,
        updated_at: new Date().toISOString()
      };
      
      if (newStatus === 'suspended') {
        updateData.suspension_reason = reason;
        updateData.suspended_until = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
      } else if (newStatus === 'banned') {
        updateData.ban_reason = reason;
        updateData.banned_at = new Date().toISOString();
      } else if (newStatus === 'active') {
        updateData.suspension_reason = null;
        updateData.suspended_until = null;
        updateData.ban_reason = null;
        updateData.banned_at = null;
      }
      
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Status Updated',
        description: `User has been ${newStatus === 'active' ? 'activated' : newStatus}.`,
      });
      
      // Refresh data
      await fetchUser();
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: error instanceof Error ? error.message : 'Failed to update status',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
      setShowSuspendDialog(false);
      setShowUnsuspendDialog(false);
      setShowBanDialog(false);
      setShowUnbanDialog(false);
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

  if (!user) {
    return null;
  }

  const statusConfig = {
    active: { label: 'Active', variant: 'default' as const, icon: Check },
    suspended: { label: 'Suspended', variant: 'secondary' as const, icon: XCircle },
    banned: { label: 'Banned', variant: 'destructive' as const, icon: XCircle },
    deleted: { label: 'Deleted', variant: 'outline' as const, icon: XCircle },
  };

  const status = statusConfig[user.account_status as keyof typeof statusConfig] || statusConfig.active;
  const StatusIcon = status.icon;
  const currentStatus = user.account_status || 'active';

  const timelineEvents = [
    {
      icon: <User className="h-4 w-4" />,
      title: 'Account created',
      subtitle: user.email,
      time: formatDistanceToNow(new Date(user.created_at), { addSuffix: true }),
    },
  ];

  if (user.last_login_at) {
    timelineEvents.unshift({
      icon: <Check className="h-4 w-4" />,
      title: 'Last login',
      subtitle: 'User session',
      time: formatDistanceToNow(new Date(user.last_login_at), { addSuffix: true }),
    });
  }

  const getInitials = (name?: string): string => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };


  const handleDonationRowClick = (row: Row<any>) => {
    navigate(`/admin/donations/${row.original.id}`);
  };

  return (
    <>
      <DetailPageLayout
        title={
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            <span>{user.name || 'Unnamed User'}</span>
          </div>
        }
        subtitle={user.email}
        backUrl="/admin/users"
        backLabel="Users"
        status={
          <Badge variant={status.variant} className="gap-1">
            <StatusIcon className="h-3 w-3" />
            {status.label}
          </Badge>
        }
        actions={
          <div className="flex flex-wrap gap-2">
            {currentStatus === 'suspended' && (
              <Button
                size="sm"
                onClick={() => setShowUnsuspendDialog(true)}
                disabled={actionLoading}
              >
                <UserCheck className="h-4 w-4 mr-2" />
                Unsuspend
              </Button>
            )}
            {currentStatus === 'banned' && (
              <Button
                size="sm"
                onClick={() => setShowUnbanDialog(true)}
                disabled={actionLoading}
              >
                <UserCheck className="h-4 w-4 mr-2" />
                Unban
              </Button>
            )}
            {currentStatus === 'active' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSuspendDialog(true)}
                  disabled={actionLoading}
                >
                  <UserX className="h-4 w-4 mr-2" />
                  Suspend
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowBanDialog(true)}
                  disabled={actionLoading}
                >
                  <Ban className="h-4 w-4 mr-2" />
                  Ban
                </Button>
              </>
            )}
          </div>
        }
        mainContent={
          <>
            {/* Profile Information */}
            <DetailSection title="Profile Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <DetailKeyValue
                  label="Name"
                  value={user.name || 'Not set'}
                />
                <DetailKeyValue
                  label="Email"
                  value={user.email}
                  copyable
                />
                {user.bio && (
                  <div className="col-span-1 md:col-span-2">
                    <DetailKeyValue
                      label="Bio"
                      value={user.bio}
                    />
                  </div>
                )}
                {user.location && (
                  <DetailKeyValue
                    label="Location"
                    value={user.location}
                  />
                )}
                {user.website && (
                  <DetailKeyValue
                    label="Website"
                    value={
                      <a
                        href={user.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {user.website}
                      </a>
                    }
                  />
                )}
              </div>
            </DetailSection>

            {/* Account Activity */}
            <DetailSection title="Recent Activity">
              <DetailTimeline events={timelineEvents} />
            </DetailSection>

            {/* Statistics */}
            <DetailSection title="Statistics">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-[12px] text-muted-foreground mb-1">Campaigns</div>
                  <div className="text-[24px] font-semibold text-foreground">
                    {user.campaign_count || 0}
                  </div>
                </div>
                <div>
                  <div className="text-[12px] text-muted-foreground mb-1">Total Raised</div>
                  <div className="text-[24px] font-semibold text-foreground">
                    ${Number(user.total_funds_raised || 0).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-[12px] text-muted-foreground mb-1">Followers</div>
                  <div className="text-[24px] font-semibold text-foreground">
                    {user.follower_count || 0}
                  </div>
                </div>
                <div>
                  <div className="text-[12px] text-muted-foreground mb-1">Following</div>
                  <div className="text-[24px] font-semibold text-foreground">
                    {user.following_count || 0}
                  </div>
                </div>
              </div>
            </DetailSection>

            {/* Security & Account */}
            <DetailSection title="Security & Account">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <DetailKeyValue
                  label="2FA Status"
                  value={user.twofa_enabled ? <Badge>Enabled</Badge> : <Badge variant="outline">Disabled</Badge>}
                />
                <DetailKeyValue
                  label="Email Verified"
                  value={user.verified_at ? <Badge>Verified</Badge> : <Badge variant="outline">Not Verified</Badge>}
                />
                <DetailKeyValue
                  label="Failed Login Attempts"
                  value={user.failed_login_attempts || 0}
                />
                {user.account_locked_until && (
                  <DetailKeyValue
                    label="Account Locked Until"
                    value={new Date(user.account_locked_until).toLocaleString()}
                  />
                )}
                {user.suspension_reason && (
                  <div className="col-span-1 md:col-span-2">
                    <DetailKeyValue
                      label="Suspension Reason"
                      value={user.suspension_reason}
                    />
                  </div>
                )}
                {user.ban_reason && (
                  <div className="col-span-1 md:col-span-2">
                    <DetailKeyValue
                      label="Ban Reason"
                      value={user.ban_reason}
                    />
                  </div>
                )}
              </div>
            </DetailSection>

            {/* Donation History */}
            <DetailSection 
              title="Donation History"
              noPadding
              borderless
              actions={
                totalDonations > 0 && (
                  <span className="text-[12px] text-muted-foreground">
                    {totalDonations} total donation{totalDonations !== 1 ? 's' : ''}
                  </span>
                )
              }
            >
              {donationsLoading ? (
                <div className="px-6 py-4 space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : donations.length === 0 ? (
                <div className="px-6 py-8 text-center">
                  <p className="text-[14px] text-muted-foreground">
                    No donations yet
                  </p>
                </div>
              ) : isMobile ? (
                // Mobile: Card list
                <div className="space-y-3 p-4">
                  {donations.map((donation) => (
                    <div
                      key={donation.id}
                      onClick={() => navigate(`/admin/donations/${donation.id}`)}
                    >
                      <DonationMobileCard
                        donation={{
                          id: donation.id,
                          amount: donation.amount,
                          currency: donation.currency,
                          payment_status: donation.payment_status,
                          donor_name: donation.donor_name,
                          donor_email: donation.donor_email,
                          is_anonymous: donation.is_anonymous,
                          tip_amount: donation.tip_amount,
                          created_at: donation.created_at,
                          fundraiser: donation.fundraisers ? { title: donation.fundraisers.title } : undefined,
                        }}
                      />
                    </div>
                  ))}
                  {/* Always show pagination when there's data */}
                  {totalDonations > 0 && (
                    <StripePagination
                      page={donationPagination.state.page}
                      pageSize={donationPagination.state.pageSize}
                      totalItems={totalDonations}
                      totalPages={donationPagination.state.totalPages}
                      onPageChange={donationPagination.goToPage}
                      onPageSizeChange={donationPagination.setPageSize}
                    />
                  )}
                </div>
              ) : (
                // Desktop: Borderless table with sticky checkbox + actions columns
                <StripeCardExact noPadding borderless>
                  <DataTableExact
                    columns={donationColumns}
                    data={donations}
                    onRowClick={handleDonationRowClick}
                    enableSelection={true}
                    density="comfortable"
                    pinFirstColumn={true}
                    pinLastColumn={true}
                    sorting={donationSorting}
                    onSortingChange={handleDonationSortingChange}
                    manualSorting={true}
                  />
                  {/* Always show pagination when there's data */}
                  {totalDonations > 0 && (
                    <StripePagination
                      page={donationPagination.state.page}
                      pageSize={donationPagination.state.pageSize}
                      totalItems={totalDonations}
                      totalPages={donationPagination.state.totalPages}
                      onPageChange={donationPagination.goToPage}
                      onPageSizeChange={donationPagination.setPageSize}
                    />
                  )}
                </StripeCardExact>
              )}
            </DetailSection>
          </>
        }
        sidebar={<UserDetailSidebar user={user} />}
      />

      {/* Suspend Dialog */}
      <ReasonInputDialog
        open={showSuspendDialog}
        onOpenChange={setShowSuspendDialog}
        title="Suspend User"
        description={`Suspending "${user.name || user.email}" will temporarily prevent them from accessing their account.`}
        reasonLabel="Suspension Reason"
        reasonPlaceholder="Enter reason for suspension..."
        confirmLabel="Suspend User"
        variant="destructive"
        isLoading={actionLoading}
        onConfirm={(reason) => handleStatusChange('suspended', reason)}
      />

      {/* Unsuspend Dialog */}
      <ConfirmActionDialog
        open={showUnsuspendDialog}
        onOpenChange={setShowUnsuspendDialog}
        title="Unsuspend User"
        description={`Are you sure you want to unsuspend "${user.name || user.email}"? They will regain access to their account.`}
        confirmLabel="Unsuspend"
        isLoading={actionLoading}
        onConfirm={() => handleStatusChange('active')}
      />

      {/* Ban Dialog */}
      <ReasonInputDialog
        open={showBanDialog}
        onOpenChange={setShowBanDialog}
        title="Ban User"
        description={`Banning "${user.name || user.email}" will permanently prevent them from accessing the platform.`}
        reasonLabel="Ban Reason"
        reasonPlaceholder="Enter reason for ban..."
        confirmLabel="Ban User"
        variant="destructive"
        isLoading={actionLoading}
        onConfirm={(reason) => handleStatusChange('banned', reason)}
      />

      {/* Unban Dialog */}
      <ConfirmActionDialog
        open={showUnbanDialog}
        onOpenChange={setShowUnbanDialog}
        title="Unban User"
        description={`Are you sure you want to unban "${user.name || user.email}"? They will regain access to their account.`}
        confirmLabel="Unban"
        isLoading={actionLoading}
        onConfirm={() => handleStatusChange('active')}
      />
    </>
  );
}
