import { useState, useEffect } from 'react';
import { useRBAC } from '@/hooks/useRBAC';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  CheckCircle, 
  XCircle, 
  Clock,
  Eye,
  Trash2,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Users,
  Flag,
  Download,
  RefreshCw
} from 'lucide-react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { DataTable } from '@/components/ui/data-table';
import { EnhancedPageHeader } from '@/components/admin/EnhancedPageHeader';
import { ContextualHelp, adminHelpContent } from '@/components/admin/ContextualHelp';
import { useOptimisticUpdates, OptimisticUpdateIndicator } from '@/components/admin/OptimisticUpdates';
import { createCampaignColumns } from '@/lib/data-table/campaign-columns';

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
      pending: 'warning',
      active: 'success',
      paused: 'destructive',
      ended: 'destructive',
      closed: 'outline'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        <div className="flex items-center space-x-1">
          {status === 'pending' && <Clock className="h-3 w-3" />}
          {status === 'active' && <CheckCircle className="h-3 w-3" />}
          {(status === 'paused' || status === 'ended') && <XCircle className="h-3 w-3" />}
          {status === 'closed' && <Flag className="h-3 w-3" />}
          <span className="capitalize">{status}</span>
        </div>
      </Badge>
    );
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
        <div className="flex items-center space-x-2 mt-2">
          <span className="text-sm text-muted-foreground">
            Need help? Use keyboard shortcuts or filters to manage campaigns efficiently.
          </span>
        </div>
      </EnhancedPageHeader>

      {/* Enhanced Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search campaigns..."
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="ended">Ended</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <Select value={filters.category} onValueChange={(value) => setFilters({...filters, category: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="medical">Medical</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                  <SelectItem value="animal">Animal</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Date Range</label>
              <Select value={filters.dateRange} onValueChange={(value) => setFilters({...filters, dateRange: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="All time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4" />
                <span className="text-sm text-muted-foreground">
                  {totalCount} campaigns found
                </span>
              </div>
            </div>

            {someSelected && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  {selectedCampaigns.size} selected
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Bulk Actions
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => {
                      setBulkAction({ type: 'approve' });
                      setShowBulkDialog(true);
                    }}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve Selected
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      setBulkAction({ type: 'suspend' });
                      setShowBulkDialog(true);
                    }}>
                      <XCircle className="h-4 w-4 mr-2" />
                      Suspend Selected
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => {
                        setBulkAction({ type: 'delete' });
                        setShowBulkDialog(true);
                      }}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Selected
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Data Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner />
            </div>
          ) : (
            <DataTable
              data={campaigns}
              columns={columns}
              loading={loading}
            />
          )}
        </CardContent>
      </Card>

      {/* Optimistic Update Indicator */}
      <OptimisticUpdateIndicator
        state={optimisticUpdates.state}
        onRollback={optimisticUpdates.rollbackAction}
        onClearCompleted={optimisticUpdates.clearCompleted}
        onClearFailed={optimisticUpdates.clearFailed}
      />

      {/* Campaign Details Dialog */}
      <Dialog open={showCampaignDialog} onOpenChange={setShowCampaignDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Campaign Details</DialogTitle>
            <DialogDescription>
              Detailed information about the selected campaign
            </DialogDescription>
          </DialogHeader>
          
          {selectedCampaign && (
            <div className="space-y-6">
              {/* Campaign Header */}
              <div className="flex items-start space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedCampaign.cover_image} alt={selectedCampaign.title} />
                  <AvatarFallback>{selectedCampaign.title.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{selectedCampaign.title}</h3>
                  <p className="text-muted-foreground mb-2">{selectedCampaign.summary}</p>
                  <div className="flex items-center space-x-4">
                    {getStatusBadge(selectedCampaign.status)}
                    <Badge variant="outline">{selectedCampaign.category}</Badge>
                    <Badge variant="outline">{selectedCampaign.visibility}</Badge>
                  </div>
                </div>
              </div>

              {/* Campaign Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-5 w-5 text-success" />
                      <div>
                        <p className="text-sm text-muted-foreground">Raised</p>
                        <p className="text-lg font-semibold">
                          {formatCurrency(selectedCampaign.stats?.total_raised || 0, selectedCampaign.currency)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Goal</p>
                        <p className="text-lg font-semibold">
                          {formatCurrency(selectedCampaign.goal_amount, selectedCampaign.currency)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Users className="h-5 w-5 text-accent" />
                      <div>
                        <p className="text-sm text-muted-foreground">Donors</p>
                        <p className="text-lg font-semibold">{selectedCampaign.stats?.donor_count || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Eye className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Views</p>
                        <p className="text-lg font-semibold">{selectedCampaign.stats?.view_count || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Admin Actions */}
              {hasPermission('moderate_campaigns') && (
                <div className="space-y-4 p-4 border rounded-lg">
                  <h4 className="font-medium">Admin Actions</h4>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleCampaignStatusChange(selectedCampaign.id, 'active')}
                      disabled={selectedCampaign.status === 'active'}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleCampaignStatusChange(selectedCampaign.id, 'paused')}
                      disabled={selectedCampaign.status === 'paused'}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Suspend
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleCampaignStatusChange(selectedCampaign.id, 'closed')}
                      disabled={selectedCampaign.status === 'closed'}
                    >
                      <Flag className="h-4 w-4 mr-2" />
                      Close
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bulk Action Dialog */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {bulkAction?.type === 'approve' && 'Approve Selected Campaigns'}
              {bulkAction?.type === 'suspend' && 'Suspend Selected Campaigns'}
              {bulkAction?.type === 'delete' && 'Delete Selected Campaigns'}
            </DialogTitle>
            <DialogDescription>
              This action will affect {selectedCampaigns.size} selected campaigns.
              {bulkAction?.type === 'delete' && ' This action cannot be undone.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Reason {bulkAction?.type === 'delete' ? '(Required)' : '(Optional)'}
              </label>
              <Textarea
                value={bulkReason}
                onChange={(e) => setBulkReason(e.target.value)}
                placeholder={`Provide a reason for ${bulkAction?.type}ing these campaigns...`}
                required={bulkAction?.type === 'delete'}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowBulkDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleBulkAction}
                variant={bulkAction?.type === 'delete' ? 'destructive' : 'default'}
                disabled={bulkAction?.type === 'delete' && !bulkReason.trim()}
              >
                {bulkAction?.type === 'approve' && 'Approve'}
                {bulkAction?.type === 'suspend' && 'Suspend'}
                {bulkAction?.type === 'delete' && 'Delete'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}