import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  CheckCircle,
  XCircle,
  Clock,
  Download,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRBAC } from '@/hooks/useRBAC';
import { useIsMobile } from '@/hooks/use-mobile';
import { createOrganizationColumns, OrganizationData } from '@/lib/data-table/organization-columns';
import { AdminStatsGrid } from '@/components/admin/AdminStatsCards';
import { MobileStatsGrid } from '@/components/admin/mobile/MobileStatsGrid';
import { useOptimisticUpdates, OptimisticUpdateIndicator } from '@/components/admin/OptimisticUpdates';
import { 
  AdminPageLayout, 
  AdminFilters, 
  AdminDataTable, 
  FilterConfig,
  BulkAction,
  TableAction 
} from '@/components/admin/unified';

interface OrganizationFilters {
  search: string;
  status: string;
}

export function OrganizationManagement() {
  const isMobile = useIsMobile();
  const [organizations, setOrganizations] = useState<OrganizationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrgs, setSelectedOrgs] = useState<OrganizationData[]>([]);
  const [filters, setFilters] = useState<OrganizationFilters>({
    search: '',
    status: 'all'
  });
  const { toast } = useToast();
  const { hasPermission } = useRBAC();

  // Enhanced with optimistic updates
  const optimisticUpdates = useOptimisticUpdates({
    onSuccess: () => {
      fetchOrganizations(); // Refresh data after successful operations
    },
    onError: (action, error) => {
      console.error(`Action ${action.type} failed:`, error);
    }
  });

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply search filter
      if (filters.search.trim()) {
        query = query.or(`legal_name.ilike.%${filters.search}%,dba_name.ilike.%${filters.search}%`);
      }

      // Apply status filter
      if (filters.status !== 'all') {
        query = query.eq('verification_status', filters.status as 'pending' | 'approved' | 'rejected');
      }

      const { data: orgsData, error: orgsError } = await query;

      if (orgsError) throw orgsError;

      // For each organization, get member count and campaign count
      const enrichedOrgs = await Promise.all(
        (orgsData || []).map(async (org) => {
          // Get member count
          const { count: memberCount } = await supabase
            .from('org_members')
            .select('*', { count: 'exact', head: true })
            .eq('org_id', org.id);

          // Get campaign count and total raised
          const { data: campaigns } = await supabase
            .from('fundraisers')
            .select('id, goal_amount')
            .eq('org_id', org.id);

          const campaignCount = campaigns?.length || 0;
          const totalRaised = campaigns?.reduce((sum, c) => sum + Number(c.goal_amount || 0), 0) || 0;

          return {
            ...org,
            member_count: memberCount || 0,
            campaign_count: campaignCount,
            total_raised: totalRaised
          } as OrganizationData;
        })
      );

      setOrganizations(enrichedOrgs);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      toast({
        title: "Error",
        description: "Failed to load organizations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, [filters]);

  // Create columns for the data table
  const columns = createOrganizationColumns(
    // onViewDetails
    (org) => {
      console.log('View details for:', org);
    },
    // onStatusUpdate
    (orgId, status) => {
      handleStatusUpdate(orgId, status);
    },
    // permissions
    {
      canManageOrganizations: hasPermission('manage_organizations'),
      canViewDetails: hasPermission('view_organization_details'),
    }
  );

  const handleStatusUpdate = async (orgId: string, newStatus: 'approved' | 'rejected' | 'pending') => {
    const organization = organizations.find(org => org.id === orgId);
    if (!organization) return;

    return optimisticUpdates.executeAction(
      {
        type: 'update',
        description: `Change organization "${organization.legal_name}" status to ${newStatus}`,
        originalData: { ...organization },
        rollbackFn: async () => {
          await supabase
            .from('organizations')
            .update({ verification_status: organization.verification_status })
            .eq('id', orgId);
        }
      },
      async () => {
        setOrganizations(prev => 
          prev.map(org => 
            org.id === orgId 
              ? { ...org, verification_status: newStatus, updated_at: new Date().toISOString() }
              : org
          )
        );

        const { error } = await supabase
          .from('organizations')
          .update({ 
            verification_status: newStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', orgId);

        if (error) throw error;

        const { data: user } = await supabase.auth.getUser();
        
        await supabase.rpc('log_audit_event', {
          _actor_id: user.user?.id,
          _action: `organization_${newStatus}`,
          _resource_type: 'organization',
          _resource_id: orgId,
          _metadata: { previous_status: organization.verification_status }
        });

        return { orgId, newStatus };
      }
    );
  };

  const handleBulkAction = async (action: string) => {
    if (selectedOrgs.length === 0) return;

    try {
      let updateData: any = {};
      const orgIds = selectedOrgs.map(org => org.id);
      
      switch (action) {
        case 'approve':
          updateData = { verification_status: 'approved' };
          break;
        case 'reject':
          updateData = { verification_status: 'rejected' };
          break;
        case 'pending':
          updateData = { verification_status: 'pending' };
          break;
        default:
          return;
      }

      const { error } = await supabase
        .from('organizations')
        .update({ ...updateData, updated_at: new Date().toISOString() })
        .in('id', orgIds);

      if (error) throw error;

      setOrganizations(prev => 
        prev.map(org => 
          orgIds.includes(org.id)
            ? { ...org, ...updateData }
            : org
        )
      );

      setSelectedOrgs([]);
      
      toast({
        title: "Bulk Action Completed",
        description: `Updated ${orgIds.length} organizations`,
      });
    } catch (error) {
      console.error('Error performing bulk action:', error);
      toast({
        title: "Error",
        description: "Failed to perform bulk action",
        variant: "destructive"
      });
    }
  };

  // Define filter configuration
  const filterConfig: FilterConfig[] = [
    {
      key: 'search',
      label: 'Search',
      type: 'search',
      placeholder: 'Search organizations by name...'
    },
    {
      key: 'status',
      label: 'Verification Status',
      type: 'select',
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'approved', label: 'Approved' },
        { value: 'rejected', label: 'Rejected' }
      ]
    }
  ];

  const tableActions: TableAction[] = [
    {
      key: 'refresh',
      label: 'Refresh',
      icon: RefreshCw,
      variant: 'outline',
      onClick: fetchOrganizations,
      loading: loading
    },
    {
      key: 'export',
      label: 'Export',
      icon: Download,
      variant: 'outline',
      onClick: () => {
        toast({
          title: 'Export Started',
          description: 'Organization data export will begin shortly'
        });
      }
    }
  ];

  const bulkActions: BulkAction[] = [
    {
      key: 'approve',
      label: 'Approve All',
      icon: CheckCircle,
      variant: 'default'
    },
    {
      key: 'reject',
      label: 'Reject All',
      icon: XCircle,
      variant: 'destructive',
      requiresConfirmation: true
    },
    {
      key: 'pending',
      label: 'Mark as Pending',
      icon: Clock,
      variant: 'outline'
    }
  ];

  const stats = [
    {
      title: "Total Organizations",
      value: organizations.length,
      icon: Building2,
      description: "All registered organizations"
    },
    {
      title: "Approved",
      value: organizations.filter(o => o.verification_status === 'approved').length,
      icon: CheckCircle,
      description: "Verified organizations",
      color: 'success' as const
    },
    {
      title: "Pending Review",
      value: organizations.filter(o => o.verification_status === 'pending').length,
      icon: Clock,
      description: "Awaiting verification",
      color: 'warning' as const
    },
    {
      title: "Rejected",
      value: organizations.filter(o => o.verification_status === 'rejected').length,
      icon: XCircle,
      description: "Verification failed",
      color: 'destructive' as const
    },
  ];

  const desktopStats = [
    {
      title: "Total Organizations",
      value: organizations.length,
      icon: Building2,
      description: "All registered organizations"
    },
    {
      title: "Approved",
      value: organizations.filter(o => o.verification_status === 'approved').length,
      icon: CheckCircle,
      iconClassName: "text-success",
      description: "Verified organizations"
    },
    {
      title: "Pending Review",
      value: organizations.filter(o => o.verification_status === 'pending').length,
      icon: Clock,
      iconClassName: "text-warning",
      description: "Awaiting verification"
    },
    {
      title: "Rejected",
      value: organizations.filter(o => o.verification_status === 'rejected').length,
      icon: XCircle,
      iconClassName: "text-destructive",
      description: "Verification failed"
    },
  ];

  const handleBulkActionClick = async (actionKey: string, selectedRows: OrganizationData[]) => {
    await handleBulkAction(actionKey);
  };

  return (
    <AdminPageLayout
      title="Organization Management"
      description="Manage and verify organization accounts"
      stats={
        isMobile ? (
          <MobileStatsGrid stats={stats} loading={loading} />
        ) : (
          <AdminStatsGrid stats={desktopStats} />
        )
      }
      filters={
        <AdminFilters
          filters={filterConfig}
          values={filters}
          onChange={(key, value) => setFilters(prev => ({ ...prev, [key]: value }))}
          onClear={() => setFilters({ search: '', status: 'all' })}
        />
      }
    >
      <AdminDataTable
        columns={columns}
        data={organizations}
        loading={loading}
        title="Organizations"
        selectedRows={selectedOrgs}
        onSelectionChange={setSelectedOrgs}
        actions={tableActions}
        bulkActions={bulkActions}
        onBulkAction={handleBulkActionClick}
        searchPlaceholder="Search organizations by name..."
        emptyStateTitle="No organizations found"
        emptyStateDescription="No organizations match your current filters."
        enableSelection={true}
        enableSorting={true}
        enableFiltering={true}
        enableColumnVisibility={true}
        enablePagination={true}
        density="comfortable"
      />

      <OptimisticUpdateIndicator
        state={optimisticUpdates.state}
        onRollback={optimisticUpdates.rollbackAction}
        onClearCompleted={optimisticUpdates.clearCompleted}
        onClearFailed={optimisticUpdates.clearFailed}
      />
    </AdminPageLayout>
  );
}