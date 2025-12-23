/**
 * Platform Revenue Page
 * Comprehensive view of platform tips with filtering and analytics
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  RefreshCw, 
  Download, 
  TrendingUp,
  Crown,
  Heart
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useDebounce';
import { usePagination } from '@/hooks/usePagination';
import { MoneyMath } from '@/lib/enterprise/utils/MoneyMath';
import { 
  platformTipsService, 
  type PlatformTipsStats, 
  type TipRecord, 
  type CreatorTipStats,
  type TipsFilterOptions 
} from '@/lib/services/platformTips.service';
import { createPlatformTipsColumns } from '@/lib/data-table/platform-tips-columns';
import { PlatformTipsStatsCards } from '@/components/admin/PlatformTipsStats';
import { 
  AdminPageLayout, 
  AdminFilters, 
  AdminDataTable,
  FilterConfig,
  TableAction
} from '@/components/admin/unified';
import { StripeStatusTabs, StatusTab } from '@/components/admin/StripeStatusTabs';

interface TipsFilters {
  search: string;
  dateRange: 'all' | 'today' | 'week' | 'month' | 'quarter' | 'year';
  creatorId: string;
  campaignId: string;
  tipPercentageRange: 'all' | 'high' | 'standard' | 'low';
}

export default function PlatformRevenue() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // State
  const [stats, setStats] = useState<PlatformTipsStats | null>(null);
  const [tips, setTips] = useState<TipRecord[]>([]);
  const [leaderboard, setLeaderboard] = useState<CreatorTipStats[]>([]);
  const [creators, setCreators] = useState<{ id: string; name: string }[]>([]);
  const [campaigns, setCampaigns] = useState<{ id: string; title: string }[]>([]);
  const [rangeCounts, setRangeCounts] = useState({ all: 0, high: 0, standard: 0, low: 0 });
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  const [filters, setFilters] = useState<TipsFilters>({
    search: '',
    dateRange: 'all',
    creatorId: 'all',
    campaignId: 'all',
    tipPercentageRange: 'all',
  });

  const debouncedSearch = useDebounce(filters.search, 500);

  const pagination = usePagination({
    initialPageSize: 25,
    syncWithURL: true,
  });

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const [statsData, counts] = await Promise.all([
        platformTipsService.fetchTipsStats(),
        platformTipsService.fetchTipsCountByRange(),
      ]);
      setStats(statsData);
      setRangeCounts(counts);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Fetch tips
  const fetchTips = useCallback(async () => {
    try {
      setLoading(true);
      
      const filterOptions: TipsFilterOptions = {
        search: debouncedSearch || undefined,
        dateRange: filters.dateRange !== 'all' ? filters.dateRange : undefined,
        creatorId: filters.creatorId !== 'all' ? filters.creatorId : undefined,
        campaignId: filters.campaignId !== 'all' ? filters.campaignId : undefined,
        tipPercentageRange: filters.tipPercentageRange !== 'all' ? filters.tipPercentageRange : undefined,
      };

      const result = await platformTipsService.fetchTipsWithFilters(
        {
          page: pagination.state.page,
          pageSize: pagination.state.pageSize,
          sortBy: 'created_at',
          sortOrder: 'desc',
        },
        filterOptions
      );

      setTips(result.data);
      pagination.setTotal(result.total);
    } catch (error) {
      console.error('Error fetching tips:', error);
      toast({
        variant: 'destructive',
        title: 'Error loading tips',
        description: 'Failed to load platform tips data.',
      });
    } finally {
      setLoading(false);
    }
  }, [pagination.state.page, pagination.state.pageSize, debouncedSearch, filters, toast]);

  // Fetch leaderboard and filter options
  const fetchSupportingData = useCallback(async () => {
    try {
      const [leaderboardData, creatorsData, campaignsData] = await Promise.all([
        platformTipsService.fetchCreatorLeaderboard(5),
        platformTipsService.fetchCreatorsForFilter(),
        platformTipsService.fetchCampaignsForFilter(),
      ]);
      setLeaderboard(leaderboardData);
      setCreators(creatorsData);
      setCampaigns(campaignsData);
    } catch (error) {
      console.error('Error fetching supporting data:', error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchStats();
    fetchSupportingData();
  }, [fetchStats, fetchSupportingData]);

  // Fetch tips when filters/pagination change
  useEffect(() => {
    fetchTips();
  }, [fetchTips]);

  // Handlers
  const handleViewDonation = (donationId: string) => {
    navigate(`/admin/donations/${donationId}`);
  };

  const handleViewCampaign = (campaignId: string) => {
    window.open(`/fundraiser/${campaignId}`, '_blank');
  };

  const handleExport = () => {
    const csvContent = [
      ['Date', 'Donor', 'Campaign', 'Creator', 'Donation', 'Tip', 'Tip %'].join(','),
      ...tips.map(tip => [
        tip.createdAt,
        tip.donorName,
        `"${tip.campaignTitle}"`,
        tip.creatorName,
        tip.donationAmount.toFixed(2),
        tip.tipAmount.toFixed(2),
        tip.tipPercentage.toFixed(2),
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `platform-tips-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Export Complete',
      description: `Exported ${tips.length} tips to CSV`,
    });
  };

  const handleRefresh = () => {
    fetchStats();
    fetchTips();
    fetchSupportingData();
  };

  // Column definitions
  const columns = createPlatformTipsColumns(handleViewDonation, handleViewCampaign);

  // Filter configuration
  const filterConfig: FilterConfig[] = [
    {
      key: 'search',
      label: 'Search',
      type: 'search',
      placeholder: 'Search by donor name or email...',
    },
    {
      key: 'dateRange',
      label: 'Date Range',
      type: 'select',
      options: [
        { value: 'all', label: 'All Time' },
        { value: 'today', label: 'Today' },
        { value: 'week', label: 'This Week' },
        { value: 'month', label: 'This Month' },
        { value: 'quarter', label: 'This Quarter' },
        { value: 'year', label: 'This Year' },
      ],
    },
    {
      key: 'creatorId',
      label: 'Creator',
      type: 'select',
      options: [
        { value: 'all', label: 'All Creators' },
        ...creators.map(c => ({ value: c.id, label: c.name })),
      ],
    },
    {
      key: 'campaignId',
      label: 'Campaign',
      type: 'select',
      options: [
        { value: 'all', label: 'All Campaigns' },
        ...campaigns.map(c => ({ value: c.id, label: c.title })),
      ],
    },
  ];

  // Table actions
  const tableActions: TableAction[] = [
    {
      key: 'refresh',
      label: 'Refresh',
      icon: RefreshCw,
      variant: 'outline',
      onClick: handleRefresh,
    },
    {
      key: 'export',
      label: 'Export CSV',
      icon: Download,
      variant: 'outline',
      onClick: handleExport,
    },
  ];

  // Status tabs
  const statusTabs: StatusTab[] = [
    { key: 'all', label: 'All Tips', count: rangeCounts.all },
    { key: 'high', label: 'High (>20%)', count: rangeCounts.high, icon: TrendingUp },
    { key: 'standard', label: 'Standard (10-20%)', count: rangeCounts.standard },
    { key: 'low', label: 'Low (<10%)', count: rangeCounts.low },
  ];

  return (
    <AdminPageLayout
      title="Platform Revenue"
      description="Track platform tips and revenue from donations"
      badge={{ text: 'Revenue', variant: 'default' }}
      actions={
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      }
    >
      {/* Stats Cards */}
      <PlatformTipsStatsCards stats={stats} loading={statsLoading} variant="full" />

      {/* Status Tabs */}
      <StripeStatusTabs
        tabs={statusTabs}
        activeTab={filters.tipPercentageRange}
        onTabChange={(key) => setFilters(prev => ({ ...prev, tipPercentageRange: key as TipsFilters['tipPercentageRange'] }))}
        className="mt-6 mb-6"
      />

      {/* Filters */}
      <AdminFilters
        filters={filterConfig}
        values={filters}
        onChange={(key, value) => setFilters(prev => ({ ...prev, [key]: value }))}
        className="mb-6"
      />

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Tips Table */}
        <div className="lg:col-span-2">
          <AdminDataTable
            columns={columns}
            data={tips}
            loading={loading}
            actions={tableActions}
            enableSorting={true}
            enableColumnVisibility={true}
            enablePagination={true}
            pinFirstColumn={true}
            pinLastColumn={true}
            paginationState={pagination.state}
            onPageChange={pagination.goToPage}
            onPageSizeChange={pagination.setPageSize}
            emptyStateTitle="No tips found"
            emptyStateDescription="No tips match your current filters."
          />
        </div>

        {/* Creator Leaderboard */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Crown className="h-4 w-4 text-amber-500" />
                Top Creators by Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-24 mb-1" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                      <Skeleton className="h-5 w-12" />
                    </div>
                  ))}
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Heart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No tip data yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {leaderboard.map((creator, index) => (
                    <div key={creator.creatorId} className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          {creator.creatorAvatar ? (
                            <AvatarImage src={creator.creatorAvatar} alt={creator.creatorName} />
                          ) : null}
                          <AvatarFallback className="text-xs">
                            {creator.creatorName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {index < 3 && (
                          <Badge 
                            className={`absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] ${
                              index === 0 ? 'bg-amber-500' : 
                              index === 1 ? 'bg-slate-400' : 
                              'bg-amber-700'
                            }`}
                          >
                            {index + 1}
                          </Badge>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{creator.creatorName}</p>
                        <p className="text-xs text-muted-foreground">
                          {creator.donationsWithTips} tips • avg {creator.averageTipPercentage.toFixed(1)}%
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-emerald-600">
                          {MoneyMath.format(MoneyMath.create(creator.totalTipsReceived, 'USD'))}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats Summary */}
          <Card className="mt-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Donations</span>
                <span className="font-medium">{stats?.totalDonations || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Donations with Tips</span>
                <span className="font-medium">{stats?.donationsWithTips || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Tips This Week</span>
                <span className="font-medium text-emerald-600">
                  {MoneyMath.format(MoneyMath.create(stats?.tipsThisWeek || 0, 'USD'))}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminPageLayout>
  );
}
