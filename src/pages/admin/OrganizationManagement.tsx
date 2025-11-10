import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DensityToggle, Density } from '@/components/admin/DensityToggle';
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
import { useRBAC } from '@/contexts/RBACContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useEventSubscriber } from '@/hooks/useEventBus';
import { useDebounce } from '@/hooks/useDebounce';
import { usePagination } from '@/hooks/usePagination';
import { adminDataService } from '@/lib/services/AdminDataService';
import { AdminEventService } from '@/lib/services/AdminEventService';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { createOrganizationColumns, OrganizationData } from '@/lib/data-table/organization-columns';
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
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState<OrganizationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrgs, setSelectedOrgs] = useState<OrganizationData[]>([]);
  const [confirmAction, setConfirmAction] = useState<{
    open: boolean;
    title: string;
    description: string;
    action: () => void;
    variant?: 'default' | 'destructive';
  }>({ open: false, title: '', description: '', action: () => {}, variant: 'default' });
  
  const [filters, setFilters] = useState<OrganizationFilters>({
    search: '',
    status: 'all'
  });
  const [density, setDensity] = useState<Density>('comfortable');
  const { toast } = useToast();
  const { hasPermission } = useRBAC();
  
  const debouncedSearch = useDebounce(filters.search, 500);
  
  // Pagination
  const pagination = usePagination({
    initialPageSize: 20,
    syncWithURL: true,
    onPageChange: () => fetchOrganizations()
  });

  // Enhanced with optimistic updates
  const optimisticUpdates = useOptimisticUpdates({
    onSuccess: () => {
      fetchOrganizations(); // Refresh data after successful operations
    },
    onError: (action, error) => {
      console.error(`Action ${action.type} failed:`, error);
    }
  });

  const fetchOrganizations = useCallback(async () => {
    try {
      setLoading(true);
      
      // Use AdminDataService for optimized fetching with pagination
      const result = await adminDataService.fetchOrganizations(
        {
          page: pagination.state.page,
          pageSize: pagination.state.pageSize,
          sortBy: 'created_at',
          sortOrder: 'desc'
        },
        {
          search: debouncedSearch,
          status: filters.status !== 'all' ? filters.status : undefined
        }
      );

      setOrganizations(result.data as OrganizationData[]);
      pagination.setTotal(result.total);

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load organizations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filters.status, pagination.state.page, pagination.state.pageSize, toast]);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  // Create columns for the data table
  const columns = createOrganizationColumns(
    // onViewDetails
    (org) => {
      navigate(`/admin/organizations/${org.id}`);
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

        const { data: user } = await supabase.auth.getUser();
        const currentUserId = user.user?.id;
        
        if (!currentUserId) throw new Error('User not authenticated');

        // Use AdminEventService which handles DB update + event publishing + audit log
        if (newStatus === 'approved') {
          await AdminEventService.verifyOrganization(orgId, currentUserId);
        } else if (newStatus === 'rejected') {
          await AdminEventService.rejectOrganization(orgId, currentUserId, 'Administrative decision');
        } else {
          await AdminEventService.updateOrganization(orgId, currentUserId, { 
            verification_status: newStatus 
          });
        }

        return { orgId, newStatus };
      }
    );
  };

  // Subscribe to organization events for real-time updates
  useEventSubscriber('organization.verified', (event) => {
    console.log('[OrganizationManagement] Organization verified event:', event);
    fetchOrganizations();
  });

  useEventSubscriber('organization.rejected', (event) => {
    console.log('[OrganizationManagement] Organization rejected event:', event);
    fetchOrganizations();
  });

  useEventSubscriber('organization.updated', (event) => {
    console.log('[OrganizationManagement] Organization updated event:', event);
    fetchOrganizations();
  });

  const handleBulkAction = async (action: string) => {
    if (selectedOrgs.length === 0) return;

    const performBulkAction = async () => {
      try {
        const { data: user } = await supabase.auth.getUser();
        const currentUserId = user.user?.id;
        if (!currentUserId) throw new Error('User not authenticated');

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
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to perform bulk action",
          variant: "destructive"
        });
      }
    };

    // Show confirmation for reject action
    if (action === 'reject') {
      setConfirmAction({
        open: true,
        title: 'Reject Organizations',
        description: `Are you sure you want to reject ${selectedOrgs.length} organizations? They will need to reapply.`,
        action: performBulkAction,
        variant: 'destructive'
      });
    } else {
      performBulkAction();
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
    },
    {
      key: 'density',
      label: 'Density',
      customRender: () => (
        <DensityToggle value={density} onChange={setDensity} />
      )
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

  const handleBulkActionClick = async (actionKey: string, selectedRows: OrganizationData[]) => {
    await handleBulkAction(actionKey);
  };

  return (
    <AdminPageLayout
      title="Organization Management"
      description="Manage and verify organization accounts"
    >
      <AdminFilters
        filters={filterConfig}
        values={filters}
        onChange={(key, value) => setFilters(prev => ({ ...prev, [key]: value }))}
        onClear={() => setFilters({ search: '', status: 'all' })}
        className="mb-6"
      />
      <AdminDataTable
        columns={columns}
        data={organizations}
        loading={loading}
        selectedRows={selectedOrgs}
        onSelectionChange={setSelectedOrgs}
        actions={tableActions}
        bulkActions={bulkActions}
        onBulkAction={handleBulkActionClick}
        density={density}
        
        emptyStateTitle="No organizations found"
        emptyStateDescription="No organizations match your current filters."
        enableSelection={true}
        enableSorting={true}
        enableFiltering={false}
        enableColumnVisibility={true}
        enablePagination={true}
        paginationState={{
          page: pagination.state.page,
          pageSize: pagination.state.pageSize,
          totalCount: pagination.state.total,
          totalPages: pagination.state.totalPages
        }}
        onPageChange={pagination.goToPage}
        onPageSizeChange={pagination.setPageSize}
      />

      <OptimisticUpdateIndicator
        state={optimisticUpdates.state}
        onRollback={optimisticUpdates.rollbackAction}
        onClearCompleted={optimisticUpdates.clearCompleted}
        onClearFailed={optimisticUpdates.clearFailed}
      />

      <ConfirmDialog
        open={confirmAction.open}
        onOpenChange={(open) => setConfirmAction(prev => ({ ...prev, open }))}
        title={confirmAction.title}
        description={confirmAction.description}
        variant={confirmAction.variant}
        onConfirm={() => {
          confirmAction.action();
          setConfirmAction(prev => ({ ...prev, open: false }));
        }}
      />
    </AdminPageLayout>
  );
}