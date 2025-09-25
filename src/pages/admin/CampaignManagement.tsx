import { useState, useEffect } from 'react';
import { useRBAC } from '@/hooks/useRBAC';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  Search, 
  Filter, 
  MoreHorizontal, 
  CheckCircle, 
  XCircle, 
  Clock,
  Star,
  Eye,
  Edit,
  Trash2,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  Flag,
  MessageSquare,
  Download,
  RefreshCw
} from 'lucide-react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { DataTable } from '@/components/ui/data-table';
import { EnhancedPageHeader } from '@/components/admin/EnhancedPageHeader';
import { ContextualHelp, adminHelpContent } from '@/components/admin/ContextualHelp';
import { useOptimisticUpdates, OptimisticUpdateIndicator } from '@/components/admin/OptimisticUpdates';

interface CampaignData {
  id: string;
  title: string;
  slug: string;
  summary: string;
  story_html: string;
  category: string;
  goal_amount: number;
  currency: string;
  status: 'draft' | 'pending' | 'active' | 'closed' | 'paused' | 'ended';
  visibility: 'public' | 'unlisted';
  created_at: string;
  updated_at: string;
  end_date: string | null;
  cover_image: string | null;
  owner_user_id: string;
  location: string | null;
  tags: string[] | null;
  beneficiary_name: string | null;
  beneficiary_contact: string | null;
  owner_profile?: {
    name: string;
    email: string;
    avatar: string;
  };
  stats?: {
    total_raised: number;
    donor_count: number;
    comment_count: number;
    view_count: number;
  };
}

interface CampaignFilters {
  search: string;
  status: string;
  category: string;
  visibility: string;
  dateRange: string;
  amountRange: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface BulkAction {
  type: 'approve' | 'suspend' | 'feature' | 'delete' | 'change_status';
  reason?: string;
  status?: string;
}

export function CampaignManagement() {
  const { hasPermission, isSuperAdmin } = useRBAC();
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaigns, setSelectedCampaigns] = useState<Set<string>>(new Set());
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignData | null>(null);
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [bulkAction, setBulkAction] = useState<BulkAction | null>(null);
  const [bulkReason, setBulkReason] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<CampaignFilters>({
    search: '',
    status: 'all',
    category: 'all',
    visibility: 'all',
    dateRange: 'all',
    amountRange: 'all',
    sortBy: 'created_at',
    sortOrder: 'desc'
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

  const ITEMS_PER_PAGE = 25;

  // Create columns for the data table
  const columns = createCampaignColumns(
    // onViewDetails
    (campaign) => {
      setSelectedCampaign(campaign as CampaignData);
      setShowCampaignDialog(true);
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

  const fetchCampaigns = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('fundraisers')
        .select(`
          *,
          owner_profile:profiles!owner_user_id(name, email, avatar)
        `, { count: 'exact' });

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

      // Apply sorting
      query = query.order(filters.sortBy, { ascending: filters.sortOrder === 'asc' });

      // Apply pagination
      const offset = (currentPage - 1) * ITEMS_PER_PAGE;
      query = query.range(offset, offset + ITEMS_PER_PAGE - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      // Fetch campaign stats
      const campaignIds = data?.map(c => c.id) || [];
      const { data: stats } = await supabase
        .rpc('get_fundraiser_totals', { fundraiser_ids: campaignIds });

      const campaignsWithStats: CampaignData[] = (data || []).map(campaign => ({
        ...campaign,
        stats: stats?.find(s => s.fundraiser_id === campaign.id) || {
          total_raised: 0,
          donor_count: 0,
          comment_count: 0,
          view_count: 0
        }
      })) as CampaignData[];

      setCampaigns(campaignsWithStats);
      setTotalCount(count || 0);
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
          // Rollback to original status
          await supabase
            .from('fundraisers')
            .update({ status: campaign.status })
            .eq('id', campaignId);
        }
      },
      async () => {
        // Optimistically update local state first
        setCampaigns(prev => prev.map(c => 
          c.id === campaignId 
            ? { ...c, status: newStatus as any, updated_at: new Date().toISOString() }
            : c
        ));

        const { error } = await supabase
          .from('fundraisers')
          .update({ 
            status: newStatus as any,
            updated_at: new Date().toISOString()
          })
          .eq('id', campaignId);

        if (error) throw error;

        // Get current user
        const { data: user } = await supabase.auth.getUser();
        
        // Log the action
        await supabase.rpc('log_audit_event', {
          _actor_id: user.user?.id,
          _action: `campaign_${newStatus}`,
          _resource_type: 'campaign',
          _resource_id: campaignId,
          _metadata: { reason: reason || 'Administrative action' }
        });

        return { campaignId, newStatus };
      }
    );
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedCampaigns.size === 0) return;

    try {
      const campaignIds = Array.from(selectedCampaigns);
      
      switch (bulkAction.type) {
        case 'approve':
          await Promise.all(campaignIds.map(id => 
            handleCampaignStatusChange(id, 'active', bulkReason)
          ));
          break;
        case 'suspend':
          await Promise.all(campaignIds.map(id => 
            handleCampaignStatusChange(id, 'paused', bulkReason)
          ));
          break;
        case 'delete':
          const { error } = await supabase
            .from('fundraisers')
            .delete()
            .in('id', campaignIds);
          
          if (error) throw error;
          
          // Get current user
          const { data: user } = await supabase.auth.getUser();
          
          // Log bulk delete
          await Promise.all(campaignIds.map(id =>
            supabase.rpc('log_audit_event', {
              _actor_id: user.user?.id,
              _action: 'campaign_deleted',
              _resource_type: 'campaign',
              _resource_id: id,
              _metadata: { reason: bulkReason || 'Bulk delete operation' }
            })
          ));
          break;
        case 'change_status':
          if (bulkAction.status) {
            await Promise.all(campaignIds.map(id => 
              handleCampaignStatusChange(id, bulkAction.status!, bulkReason)
            ));
          }
          break;
      }

      toast({
        title: 'Bulk Action Complete',
        description: `Updated ${campaignIds.length} campaigns`
      });

      setSelectedCampaigns(new Set());
      setShowBulkDialog(false);
      setBulkAction(null);
      setBulkReason('');
      fetchCampaigns();
    } catch (error) {
      console.error('Error performing bulk action:', error);
      toast({
        title: 'Error',
        description: 'Failed to perform bulk action',
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: 'secondary',
      pending: 'default',
      active: 'default',
      paused: 'destructive',
      ended: 'destructive',
      closed: 'outline'
    } as const;

    const colors = {
      draft: 'text-gray-600',
      pending: 'text-yellow-600',
      active: 'text-green-600',
      paused: 'text-red-600',
      ended: 'text-red-600',
      closed: 'text-gray-500'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        <div className={`flex items-center space-x-1 ${colors[status as keyof typeof colors]}`}>
          {status === 'pending' && <Clock className="h-3 w-3" />}
          {status === 'active' && <CheckCircle className="h-3 w-3" />}
          {(status === 'paused' || status === 'ended') && <XCircle className="h-3 w-3" />}
          {status === 'closed' && <Flag className="h-3 w-3" />}
          <span className="capitalize">{status}</span>
        </div>
      </Badge>
    );
  };

  const getProgressPercentage = (raised: number, goal: number) => {
    return goal > 0 ? Math.min((raised / goal) * 100, 100) : 0;
  };

  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const selectAllCampaigns = (checked: boolean) => {
    if (checked) {
      setSelectedCampaigns(new Set(campaigns.map(c => c.id)));
    } else {
      setSelectedCampaigns(new Set());
    }
  };

  const toggleCampaignSelection = (campaignId: string) => {
    const newSelection = new Set(selectedCampaigns);
    if (newSelection.has(campaignId)) {
      newSelection.delete(campaignId);
    } else {
      newSelection.add(campaignId);
    }
    setSelectedCampaigns(newSelection);
  };

  useEffect(() => {
    fetchCampaigns();
  }, [filters, currentPage]);

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

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const allSelected = campaigns.length > 0 && selectedCampaigns.size === campaigns.length;
  const someSelected = selectedCampaigns.size > 0;

  return (
    <div className="section-hierarchy">
      {/* Enhanced Page Header */}
      <EnhancedPageHeader
        title="Campaign Management"
        description="Manage and moderate fundraising campaigns"
        actions={[
          {
            label: 'Refresh',
            onClick: fetchCampaigns,
            icon: RefreshCw,
            variant: 'outline',
            loading: loading
          },
          {
            label: 'Export',
            onClick: () => {
              // TODO: Implement export functionality
              toast({
                title: 'Export Started',
                description: 'Campaign data export will begin shortly'
              });
            },
            icon: Download,
            variant: 'outline'
          }
        ]}
      >
        {/* Contextual Help */}
        <div className="flex items-center space-x-2 mt-2">
          <ContextualHelp
            content={adminHelpContent.campaigns}
            variant="popover"
            placement="bottom"
          />
          <span className="text-sm text-muted-foreground">
            Need help? Click the help icon for tips and shortcuts.
          </span>
        </div>
      </EnhancedPageHeader>

      {/* Enhanced Filters */}
      <Card className="card-enhanced">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center caption-medium">
              <Filter className="mr-2 h-4 w-4" />
              Filters & Search
            </CardTitle>
            <ContextualHelp
              content={{
                title: "Campaign Filters",
                description: "Use these filters to quickly find specific campaigns",
                tips: [
                  "Combine multiple filters for precise results",
                  "Use date ranges to find campaigns by creation time",
                  "Amount ranges help filter by fundraising goals"
                ],
                shortcuts: [
                  { key: "/", description: "Focus search input" },
                  { key: "r", description: "Refresh campaign data" }
                ]
              }}
              variant="tooltip"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
            <div className="relative xl:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search campaigns..."
                className="pl-10"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>
            
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending Review</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="ended">Ended</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.category}
              onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="medical">Medical</SelectItem>
                <SelectItem value="education">Education</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
                <SelectItem value="animal">Animal</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="community">Community</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.visibility}
              onValueChange={(value) => setFilters(prev => ({ ...prev, visibility: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Visibility</SelectItem>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="unlisted">Unlisted</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.dateRange}
              onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.amountRange}
              onValueChange={(value) => setFilters(prev => ({ ...prev, amountRange: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Goal Amount" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Amounts</SelectItem>
                <SelectItem value="under-1k">Under $1K</SelectItem>
                <SelectItem value="1k-5k">$1K - $5K</SelectItem>
                <SelectItem value="5k-10k">$5K - $10K</SelectItem>
                <SelectItem value="10k-50k">$10K - $50K</SelectItem>
                <SelectItem value="over-50k">Over $50K</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.sortBy}
              onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Created Date</SelectItem>
                <SelectItem value="updated_at">Updated Date</SelectItem>
                <SelectItem value="title">Title</SelectItem>
                <SelectItem value="goal_amount">Goal Amount</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {someSelected && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">
                  {selectedCampaigns.size} campaign{selectedCampaigns.size !== 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setBulkAction({ type: 'approve' });
                    setShowBulkDialog(true);
                  }}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setBulkAction({ type: 'suspend' });
                    setShowBulkDialog(true);
                  }}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Suspend
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setBulkAction({ type: 'delete' });
                    setShowBulkDialog(true);
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
        </CardContent>
      </Card>

      {/* Optimistic Update Indicator */}
      <OptimisticUpdateIndicator
        state={optimisticUpdates.state}
        onRollback={optimisticUpdates.rollbackAction}
        onClearCompleted={optimisticUpdates.clearCompleted}
        onClearFailed={optimisticUpdates.clearFailed}
      />
    </div>
  );
}
      <Card className="card-enhanced">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center caption-medium">
              <FileText className="mr-2 h-4 w-4" />
              Campaigns ({totalCount})
            </CardTitle>
            <div className="flex items-center space-x-2">
              {selectedCampaigns.size > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBulkDialog(true)}
                  className="shadow-soft border-primary/10 hover:bg-primary/5"
                >
                  Bulk Actions ({selectedCampaigns.size})
                </Button>
              )}
              <ContextualHelp
                content={{
                  title: "Campaign Actions",
                  description: "Manage individual campaigns or perform bulk operations",
                  tips: [
                    "Click on a row to view campaign details",
                    "Use checkboxes to select multiple campaigns",
                    "Bulk actions appear when campaigns are selected"
                  ]
                }}
                variant="tooltip"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={campaigns}
            loading={loading}
            enableSelection={true}
            enableSorting={true}
            enableFiltering={true}
            enableColumnVisibility={true}
            enablePagination={false}
            searchPlaceholder="Search campaigns..."
            emptyStateTitle="No campaigns found"
            emptyStateDescription="No campaigns match your current filters."
            density="comfortable"
            onSelectionChange={(selectedRows) => {
              setSelectedCampaigns(new Set(selectedRows.map(row => row.id)));
            }}
          />
          
          {/* Custom pagination for server-side pagination */}
          <div className="flex items-center justify-between space-x-2 py-4 border-t">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, totalCount)} to{' '}
                {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount} campaigns
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {Math.ceil(totalCount / ITEMS_PER_PAGE)}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= Math.ceil(totalCount / ITEMS_PER_PAGE)}
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campaign Details Dialog */}
      <Dialog open={showCampaignDialog} onOpenChange={setShowCampaignDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Campaign Details</DialogTitle>
            <DialogDescription>
              Complete information and moderation tools for the selected campaign
            </DialogDescription>
          </DialogHeader>
          {selectedCampaign && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="moderation">Moderation</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Campaign Information</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Title:</span>
                          <span className="text-sm font-medium">{selectedCampaign.title}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Category:</span>
                          <span className="text-sm">{selectedCampaign.category}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Goal:</span>
                          <span className="text-sm font-medium">
                            {formatCurrency(selectedCampaign.goal_amount, selectedCampaign.currency)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Status:</span>
                          {getStatusBadge(selectedCampaign.status)}
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Visibility:</span>
                          <Badge variant="outline">{selectedCampaign.visibility}</Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold mb-2">Beneficiary Information</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Name:</span>
                          <span className="text-sm">{selectedCampaign.beneficiary_name || 'Not specified'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Contact:</span>
                          <span className="text-sm">{selectedCampaign.beneficiary_contact || 'Not specified'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Performance Metrics</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span className="text-sm">Total Raised</span>
                          </div>
                          <span className="font-medium">
                            {formatCurrency(selectedCampaign.stats?.total_raised || 0, selectedCampaign.currency)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-blue-600" />
                            <span className="text-sm">Donors</span>
                          </div>
                          <span className="font-medium">{selectedCampaign.stats?.donor_count || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <MessageSquare className="h-4 w-4 text-purple-600" />
                            <span className="text-sm">Comments</span>
                          </div>
                          <span className="font-medium">{selectedCampaign.stats?.comment_count || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Eye className="h-4 w-4 text-orange-600" />
                            <span className="text-sm">Views</span>
                          </div>
                          <span className="font-medium">{selectedCampaign.stats?.view_count || 0}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold mb-2">Timeline</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Created:</span>
                          <span className="text-sm">
                            {new Date(selectedCampaign.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Updated:</span>
                          <span className="text-sm">
                            {new Date(selectedCampaign.updated_at).toLocaleDateString()}
                          </span>
                        </div>
                        {selectedCampaign.end_date && (
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">End Date:</span>
                            <span className="text-sm">
                              {new Date(selectedCampaign.end_date).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="content" className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Campaign Summary</h3>
                  <p className="text-sm text-muted-foreground">{selectedCampaign.summary}</p>
                </div>
                
                {selectedCampaign.story_html && (
                  <div>
                    <h3 className="font-semibold mb-2">Campaign Story</h3>
                    <div 
                      className="text-sm prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: selectedCampaign.story_html }}
                    />
                  </div>
                )}
                
                {selectedCampaign.tags && selectedCampaign.tags.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedCampaign.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="analytics" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center">
                        <TrendingUp className="mr-2 h-4 w-4" />
                        Funding Progress
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Progress 
                          value={getProgressPercentage(selectedCampaign.stats?.total_raised || 0, selectedCampaign.goal_amount)}
                          className="h-3"
                        />
                        <div className="flex justify-between text-sm">
                          <span>{formatCurrency(selectedCampaign.stats?.total_raised || 0)}</span>
                          <span className="text-muted-foreground">
                            {getProgressPercentage(selectedCampaign.stats?.total_raised || 0, selectedCampaign.goal_amount).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center">
                        <Users className="mr-2 h-4 w-4" />
                        Engagement
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Donors:</span>
                          <span className="font-medium">{selectedCampaign.stats?.donor_count || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Comments:</span>
                          <span className="font-medium">{selectedCampaign.stats?.comment_count || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Views:</span>
                          <span className="font-medium">{selectedCampaign.stats?.view_count || 0}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="moderation" className="space-y-4">
                {hasPermission('moderate_campaigns') && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Moderation Actions</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedCampaign.status === 'pending' && (
                          <Button
                            onClick={() => handleCampaignStatusChange(selectedCampaign.id, 'active')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Approve Campaign
                          </Button>
                        )}
                        {selectedCampaign.status === 'active' && (
                          <Button
                            onClick={() => handleCampaignStatusChange(selectedCampaign.id, 'paused')}
                            variant="destructive"
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Pause Campaign
                          </Button>
                        )}
                        {(selectedCampaign.status === 'paused' || selectedCampaign.status === 'ended') && (
                          <Button
                            onClick={() => handleCampaignStatusChange(selectedCampaign.id, 'active')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Reactivate Campaign
                          </Button>
                        )}
                        <Button
                          onClick={() => handleCampaignStatusChange(selectedCampaign.id, 'closed')}
                          variant="outline"
                        >
                          <Flag className="mr-2 h-4 w-4" />
                          Close Campaign
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold mb-2">Content Review</h3>
                      <div className="space-y-2">
                        <div className="p-3 border rounded">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Content Guidelines Compliance</span>
                            <Badge variant="default">Pending Review</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            This campaign requires manual review for content compliance.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Bulk Action Dialog */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Action</DialogTitle>
            <DialogDescription>
              Perform action on {selectedCampaigns.size} selected campaign{selectedCampaigns.size !== 1 ? 's' : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Reason (optional)</label>
              <Textarea
                placeholder="Enter reason for this action..."
                value={bulkReason}
                onChange={(e) => setBulkReason(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowBulkDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleBulkAction}>
                Confirm Action
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}