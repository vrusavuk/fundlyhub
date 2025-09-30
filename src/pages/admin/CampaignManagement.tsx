import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  Clock,
  Flag,
  Download,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Megaphone
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRBAC } from '@/hooks/useRBAC';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDebounce } from '@/hooks/useDebounce';
import { usePagination } from '@/hooks/usePagination';
import { adminDataService } from '@/lib/services/AdminDataService';
import { useEventSubscriber } from '@/hooks/useEventBus';
import { AdminEventService } from '@/lib/services/AdminEventService';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { CampaignDetailsDialog } from '@/components/admin/ViewDetailsDialog';
import { createCampaignColumns, CampaignData } from '@/lib/data-table/campaign-columns';
import { useOptimisticUpdates, OptimisticUpdateIndicator } from '@/components/admin/OptimisticUpdates';
import { AdminStatsGrid } from '@/components/admin/AdminStatsCards';
import { MobileStatsGrid } from '@/components/admin/mobile/MobileStatsGrid';
import { 
  AdminPageLayout, 
  AdminFilters, 
  AdminDataTable,
  FilterConfig,
  BulkAction,
  TableAction
} from '@/components/admin/unified';


interface CampaignFilters {
  search: string;
  status: string;
  category: string;
  visibility: string;
  dateRange: string;
  amountRange: string;
}

export function CampaignManagement() {
  const { hasPermission, isSuperAdmin } = useRBAC();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaigns, setSelectedCampaigns] = useState<CampaignData[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignData | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    open: boolean;
    title: string;
    description: string;
    action: () => void;
    variant?: 'default' | 'destructive';
  }>({ open: false, title: '', description: '', action: () => {}, variant: 'default' });
  
  // Database-level statistics (not page-level)
  const [dbStats, setDbStats] = useState({
    total: 0,
    active: 0,
    closed: 0,
    pending: 0,
    paused: 0,
    draft: 0,
    ended: 0,
    totalRaised: 0
  });
  
  const [filters, setFilters] = useState<CampaignFilters>({
    search: '',
    status: 'all',
    category: 'all',
    visibility: 'all',
    dateRange: 'all',
    amountRange: 'all'
  });
  
  const debouncedSearch = useDebounce(filters.search, 500);
  
  // Pagination with correct default page size
  const pagination = usePagination({
    initialPageSize: 25,
    syncWithURL: true
  });

  // Enhanced with optimistic updates
  const optimisticUpdates = useOptimisticUpdates({
    onSuccess: () => {
      fetchCampaigns(); // Refresh data after successful operations
    },
    onError: (action, error) => {
      console.error(`Action ${action.type} failed:`, error);
    }
  });

  // AbortController for request cancellation
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // Fetch database-level statistics (separate from paginated data)
  const fetchCampaignStats = useCallback(async () => {
    try {
      const stats = await adminDataService.fetchCampaignStats({
        search: debouncedSearch,
        status: filters.status !== 'all' ? filters.status : undefined,
        category: filters.category !== 'all' ? filters.category : undefined,
        visibility: filters.visibility !== 'all' ? filters.visibility : undefined,
        dateRange: filters.dateRange !== 'all' ? filters.dateRange : undefined
      });
      
      setDbStats(stats);
    } catch (error: any) {
      console.error('Error fetching campaign stats:', error);
      // Don't show error toast for stats, they're not critical
    }
  }, [debouncedSearch, filters]);

  const fetchCampaigns = useCallback(async () => {
    // Cancel any in-flight requests
    if (abortController) {
      abortController.abort();
    }

    const newAbortController = new AbortController();
    setAbortController(newAbortController);

    try {
      setLoading(true);

      // Fetch paginated data
      const result = await adminDataService.fetchCampaigns(
        {
          page: pagination.state.page,
          pageSize: pagination.state.pageSize,
          sortBy: 'created_at',
          sortOrder: 'desc'
        },
        {
          search: debouncedSearch,
          status: filters.status !== 'all' ? filters.status : undefined,
          category: filters.category !== 'all' ? filters.category : undefined,
          visibility: filters.visibility !== 'all' ? filters.visibility : undefined,
          dateRange: filters.dateRange !== 'all' ? filters.dateRange : undefined
        }
      );

      if (!newAbortController.signal.aborted) {
        setCampaigns(result.data as CampaignData[]);
        pagination.setTotal(result.total);
      }

    } catch (error: any) {
      if (error.name !== 'AbortError') {
        toast({
          title: "Error",
          description: error.message || "Failed to load campaigns",
          variant: "destructive"
        });
      }
    } finally {
      if (!newAbortController.signal.aborted) {
        setLoading(false);
      }
    }
  }, [pagination.state.page, pagination.state.pageSize, debouncedSearch, filters, toast]);

  const handleCampaignStatusChange = async (campaignId: string, newStatus: string, reason?: string) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign) return;

    return optimisticUpdates.executeAction(
      {
        type: 'update',
        description: `Change campaign "${campaign.title}" status to ${newStatus}`,
        originalData: { ...campaign },
        rollbackFn: async () => {
          await supabase
            .from('fundraisers')
            .update({ status: campaign.status })
            .eq('id', campaignId);
        }
      },
      async () => {
        setCampaigns(prev => prev.map(c => 
          c.id === campaignId 
            ? { ...c, status: newStatus as CampaignData['status'], updated_at: new Date().toISOString() }
            : c
        ));

        const { data: user } = await supabase.auth.getUser();
        const userId = user.user?.id;
        
        if (!userId) throw new Error('User not authenticated');

        // Use AdminEventService which handles DB update + event publishing + audit log
        await AdminEventService.updateCampaignStatus(
          campaignId,
          userId,
          newStatus as 'active' | 'pending' | 'paused' | 'closed'
        );

        return { campaignId, newStatus };
      }
    );
  };

  // Subscribe to campaign events for real-time updates
  useEventSubscriber('campaign.updated', (event) => {
    console.log('[CampaignManagement] Campaign updated event:', event);
    fetchCampaigns(); // Refresh campaigns when any update occurs
  });

  useEventSubscriber('admin.campaign.approved', (event) => {
    console.log('[CampaignManagement] Campaign approved event:', event);
    fetchCampaigns();
  });

  useEventSubscriber('admin.campaign.rejected', (event) => {
    console.log('[CampaignManagement] Campaign rejected event:', event);
    fetchCampaigns();
  });

  useEventSubscriber('admin.campaign.paused', (event) => {
    console.log('[CampaignManagement] Campaign paused event:', event);
    fetchCampaigns();
  });

  useEventSubscriber('admin.campaign.closed', (event) => {
    console.log('[CampaignManagement] Campaign closed event:', event);
    fetchCampaigns();
  });

  // Fetch campaigns when dependencies change
  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // Fetch stats separately (not in fetchCampaigns to avoid circular dependency)
  useEffect(() => {
    fetchCampaignStats();
  }, [fetchCampaignStats]);

  // Reset to page 1 when filters change
  useEffect(() => {
    pagination.goToPage(1);
  }, [debouncedSearch, filters.status, filters.category, filters.visibility, filters.dateRange]);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortController) {
        abortController.abort();
      }
    };
  }, [abortController]);

  if (!hasPermission('manage_campaigns')) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          You do not have permission to manage campaigns.
        </AlertDescription>
      </Alert>
    );
  }

  // Create columns for the data table
  const columns = createCampaignColumns(
    // onViewDetails
    (campaign) => {
      setSelectedCampaign(campaign);
      setShowDetailsDialog(true);
    },
    // onStatusChange
    (campaignId, status) => {
      handleCampaignStatusChange(campaignId, status);
    },
    // permissions
    {
      canModerate: hasPermission('moderate_campaigns'),
      isSuperAdmin: isSuperAdmin(),
    }
  );

  // Define filter configuration
  const filterConfig: FilterConfig[] = [
    {
      key: 'search',
      label: 'Search',
      type: 'search',
      placeholder: 'Search campaigns by title, summary, or beneficiary...'
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'draft', label: 'Draft' },
        { value: 'pending', label: 'Pending Review' },
        { value: 'active', label: 'Active' },
        { value: 'paused', label: 'Paused' },
        { value: 'ended', label: 'Ended' },
        { value: 'closed', label: 'Closed' }
      ]
    },
    {
      key: 'visibility',
      label: 'Visibility',
      type: 'select',
      options: [
        { value: 'public', label: 'Public' },
        { value: 'unlisted', label: 'Unlisted' }
      ]
    },
    {
      key: 'dateRange',
      label: 'Date Range',
      type: 'select',
      options: [
        { value: 'today', label: 'Today' },
        { value: 'week', label: 'This Week' },
        { value: 'month', label: 'This Month' },
        { value: 'quarter', label: 'This Quarter' }
      ]
    }
  ];

  // Define table actions
  const tableActions: TableAction[] = [
    {
      key: 'refresh',
      label: 'Refresh',
      icon: RefreshCw,
      variant: 'outline',
      onClick: fetchCampaigns,
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
          description: 'Campaign data export will begin shortly'
        });
      }
    }
  ];

  // Define bulk actions
  const bulkActions: BulkAction[] = [
    {
      key: 'approve',
      label: 'Approve Campaigns',
      icon: CheckCircle,
      variant: 'default'
    },
    {
      key: 'pause',
      label: 'Pause Campaigns',
      icon: Clock,
      variant: 'destructive',
      requiresConfirmation: true
    },
    {
      key: 'close',
      label: 'Close Campaigns',
      icon: XCircle,
      variant: 'destructive',
      requiresConfirmation: true
    }
  ];

  // Calculate stats from database-level data (not page-level)
  const stats = [
    {
      title: "Total Campaigns",
      value: dbStats.total,
      icon: Flag,
      description: "All fundraising campaigns"
    },
    {
      title: "Active Campaigns",
      value: dbStats.active,
      icon: CheckCircle,
      iconClassName: "text-success",
      description: "Currently fundraising"
    },
    {
      title: "Pending Review",
      value: dbStats.pending,
      icon: Clock,
      iconClassName: "text-warning",
      description: "Awaiting approval"
    },
    {
      title: "Total Raised",
      value: `$${dbStats.totalRaised.toLocaleString()}`,
      icon: DollarSign,
      iconClassName: "text-success",
      description: "Across all campaigns"
    },
  ];

  // Handle bulk operations
  const handleBulkActionClick = async (actionKey: string, selectedRows: CampaignData[]) => {
    if (selectedRows.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select campaigns to perform bulk actions",
        variant: "destructive"
      });
      return;
    }

    switch (actionKey) {
      case 'approve':
        await Promise.all(selectedRows.map(campaign => 
          handleCampaignStatusChange(campaign.id, 'active', 'Bulk approval')
        ));
        break;
      case 'pause':
        await Promise.all(selectedRows.map(campaign => 
          handleCampaignStatusChange(campaign.id, 'paused', 'Bulk pause')
        ));
        break;
      case 'close':
        await Promise.all(selectedRows.map(campaign => 
          handleCampaignStatusChange(campaign.id, 'closed', 'Bulk closure')
        ));
        break;
    }

    setSelectedCampaigns([]);
  };

  return (
    <AdminPageLayout
      title="Campaign Management"
      description="Manage and moderate fundraising campaigns"
      stats={
        isMobile ? (
          <MobileStatsGrid stats={stats} loading={loading} />
        ) : (
          <AdminStatsGrid stats={stats} />
        )
      }
      filters={
        <AdminFilters
          filters={filterConfig}
          values={filters}
          onChange={(key, value) => setFilters(prev => ({ ...prev, [key]: value }))}
          onClear={() => setFilters({ 
            search: '', 
            status: 'all', 
            category: 'all', 
            visibility: 'all', 
            dateRange: 'all', 
            amountRange: 'all' 
          })}
        />
      }
    >
      <AdminDataTable
        columns={columns}
        data={campaigns}
        loading={loading}
        title="Campaigns"
        selectedRows={selectedCampaigns}
        onSelectionChange={setSelectedCampaigns}
        actions={tableActions}
        bulkActions={bulkActions}
        onBulkAction={handleBulkActionClick}
        searchPlaceholder="Search campaigns by title, summary, or beneficiary..."
        emptyStateTitle="No campaigns found"
        emptyStateDescription="No campaigns match your current filters."
        enableSelection={true}
        enableSorting={true}
        enableFiltering={true}
        enableColumnVisibility={true}
        enablePagination={true}
        density="comfortable"
        paginationState={pagination.state}
        onPageChange={pagination.goToPage}
        onPageSizeChange={pagination.setPageSize}
      />

      <OptimisticUpdateIndicator
        state={optimisticUpdates.state}
        onRollback={optimisticUpdates.rollbackAction}
        onClearCompleted={optimisticUpdates.clearCompleted}
        onClearFailed={optimisticUpdates.clearFailed}
      />

      <CampaignDetailsDialog
        campaign={selectedCampaign}
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
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