import { useState, useEffect, useCallback, useMemo } from 'react';
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
  Users,
  Megaphone,
  Plus,
  Eye,
  Edit,
  Trash2,
  Archive,
  Calendar,
  Search,
  Filter,
  Upload,
  Mail,
  Settings
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRBAC } from '@/hooks/useRBAC';
import { useIsMobile } from '@/hooks/use-mobile';
import { useEventSubscriber } from '@/hooks/useEventBus';
import { AdminEventService } from '@/lib/services/AdminEventService';
import { createCampaignColumns, CampaignData } from '@/lib/data-table/campaign-columns';
import { useOptimisticUpdates, OptimisticUpdateIndicator } from '@/components/admin/OptimisticUpdates';
import { AdminStatsGrid } from '@/components/admin/AdminStatsCards';
import { MobileStatsGrid } from '@/components/admin/mobile/MobileStatsGrid';
import { 
  AdminPageLayout, 
  AdminFilters, 
  AdminDataTable,
  AdvancedSearch,
  BulkOperations,
  QuickActions,
  RealTimeIndicator,
  PerformanceMonitor,
  FilterConfig,
  BulkAction,
  TableAction,
  SearchFilter,
  ActiveFilter,
  BulkOperation,
  QuickAction
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
  
  // Enhanced state for Phase 4
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaigns, setSelectedCampaigns] = useState<CampaignData[]>([]);
  
  // Legacy filters for compatibility
  const [filters, setFilters] = useState<CampaignFilters>({
    search: '',
    status: 'all',
    category: 'all',
    visibility: 'all',
    dateRange: 'all',
    amountRange: 'all'
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

  const fetchCampaigns = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('fundraisers')
        .select(`
          *,
          owner_profile:profiles!owner_user_id(name, email, avatar)
        `);

      // Apply filters
      if (filters.search.trim()) {
        query = query.or(`title.ilike.%${filters.search}%,summary.ilike.%${filters.search}%,beneficiary_name.ilike.%${filters.search}%`);
      }

      if (filters.status !== 'all') {
        query = query.eq('status', filters.status as any);
      }

      if (filters.category !== 'all') {
        query = query.eq('category', filters.category);
      }

      if (filters.visibility !== 'all') {
        query = query.eq('visibility', filters.visibility as any);
      }

      // Date range filter
      if (filters.dateRange !== 'all') {
        const now = new Date();
        let startDate: Date;
        
        switch (filters.dateRange) {
          case 'today':
            startDate = new Date(now.setHours(0, 0, 0, 0));
            break;
          case 'week':
            startDate = new Date(now.setDate(now.getDate() - 7));
            break;
          case 'month':
            startDate = new Date(now.setMonth(now.getMonth() - 1));
            break;
          case 'quarter':
            startDate = new Date(now.setMonth(now.getMonth() - 3));
            break;
          default:
            startDate = new Date(0);
        }
        
        query = query.gte('created_at', startDate.toISOString());
      }

      // Amount range filter
      if (filters.amountRange !== 'all') {
        const ranges = {
          'under-1k': [0, 1000],
          '1k-5k': [1000, 5000],
          '5k-10k': [5000, 10000],
          '10k-50k': [10000, 50000],
          'over-50k': [50000, Number.MAX_SAFE_INTEGER]
        };
        
        const range = ranges[filters.amountRange as keyof typeof ranges];
        if (range) {
          query = query.gte('goal_amount', range[0]).lt('goal_amount', range[1]);
        }
      }

      // Apply sorting and pagination
      query = query.order('created_at', { ascending: false }).limit(100);

      const { data, error } = await query;

      if (error) throw error;

      // Fetch campaign stats
      const campaignIds = data?.map(c => c.id) || [];
      let campaignsWithStats: CampaignData[] = data || [];

      if (campaignIds.length > 0) {
        try {
          const { data: stats } = await supabase
            .rpc('get_fundraiser_totals', { fundraiser_ids: campaignIds });

          campaignsWithStats = (data || []).map(campaign => ({
            ...campaign,
            stats: stats?.find(s => s.fundraiser_id === campaign.id) || {
              total_raised: 0,
              donor_count: 0,
              comment_count: 0,
              view_count: 0
            }
          })) as CampaignData[];
        } catch (statsError) {
          console.warn('Failed to fetch campaign stats:', statsError);
          // Continue with campaigns without stats
        }
      }

      setCampaigns(campaignsWithStats);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast({
        title: 'Error',
        description: 'Failed to load campaigns',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

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

  useEffect(() => {
    fetchCampaigns();
  }, [filters]);

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
      console.log('View campaign details:', campaign);
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

  // Calculate stats
  const stats = [
    {
      title: "Total Campaigns",
      value: campaigns.length,
      icon: Flag,
      description: "All fundraising campaigns"
    },
    {
      title: "Active Campaigns",
      value: campaigns.filter(c => c.status === 'active').length,
      icon: CheckCircle,
      iconClassName: "text-success",
      description: "Currently fundraising"
    },
    {
      title: "Pending Review",
      value: campaigns.filter(c => c.status === 'pending').length,
      icon: Clock,
      iconClassName: "text-warning",
      description: "Awaiting approval"
    },
    {
      title: "Total Raised",
      value: `$${campaigns.reduce((sum, c) => sum + (c.stats?.total_raised || 0), 0).toLocaleString()}`,
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