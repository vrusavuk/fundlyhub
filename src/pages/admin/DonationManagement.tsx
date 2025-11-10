import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  DollarSign,
  TrendingUp,
  PieChart,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  ExternalLink,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRBAC } from '@/hooks/useRBAC';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDebounce } from '@/hooks/useDebounce';
import { usePagination } from '@/hooks/usePagination';
import { adminDataService } from '@/lib/services/AdminDataService';
import { useEventSubscriber } from '@/hooks/useEventBus';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { DonationDetailsDialog } from '@/components/admin/DonationDetailsDialog';
import { createDonationColumns, DonationData } from '@/lib/data-table/donation-columns';
import { useOptimisticUpdates, OptimisticUpdateIndicator } from '@/components/admin/OptimisticUpdates';
import { AdminStatsGrid } from '@/components/admin/AdminStatsCards';
import { MobileStatsGrid } from '@/components/admin/mobile/MobileStatsGrid';
import { exportDonationsCSV } from '@/lib/utils/exportDonations';
import { MoneyMath } from '@/lib/enterprise/utils/MoneyMath';
import { 
  AdminPageLayout, 
  AdminFilters, 
  AdminDataTable,
  FilterConfig,
  BulkAction,
  TableAction
} from '@/components/admin/unified';

interface DonationFilters {
  search: string;
  paymentStatus: string;
  paymentProvider: string;
  amountRange: string;
  dateRange: string;
  isAnonymous: string;
}

export function DonationManagement() {
  const { hasPermission, isSuperAdmin } = useRBAC();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const [donations, setDonations] = useState<DonationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDonations, setSelectedDonations] = useState<DonationData[]>([]);
  const [selectedDonation, setSelectedDonation] = useState<DonationData | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    open: boolean;
    title: string;
    description: string;
    action: () => void;
    variant?: 'default' | 'destructive';
  }>({ open: false, title: '', description: '', action: () => {}, variant: 'default' });
  
  // Database-level statistics
  const [dbStats, setDbStats] = useState({
    total: 0,
    totalAmount: 0,
    averageAmount: 0,
    totalTips: 0,
    totalFees: 0,
    byStatus: {
      pending: 0,
      paid: 0,
      failed: 0,
      refunded: 0,
    },
    byProvider: {
      stripe: 0,
    },
    recentDonations: 0,
  });
  
  const [filters, setFilters] = useState<DonationFilters>({
    search: '',
    paymentStatus: 'all',
    paymentProvider: 'all',
    amountRange: 'all',
    dateRange: 'all',
    isAnonymous: 'all'
  });
  
  const debouncedSearch = useDebounce(filters.search, 500);
  
  const pagination = usePagination({
    initialPageSize: 25,
    syncWithURL: true
  });

  const optimisticUpdates = useOptimisticUpdates({
    onSuccess: () => {
      fetchDonations();
    },
    onError: (action, error) => {
      console.error(`Action ${action.type} failed:`, error);
      toast({
        variant: "destructive",
        title: "Operation failed",
        description: error instanceof Error ? error.message : "An error occurred. Please try again.",
      });
    }
  });

  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // Fetch donation statistics
  const fetchDonationStats = useCallback(async () => {
    try {
      const stats = await adminDataService.fetchDonationStats({
        search: debouncedSearch,
        status: filters.paymentStatus !== 'all' ? filters.paymentStatus : undefined,
      });
      
      setDbStats(stats);
    } catch (error: any) {
      console.error('Error fetching donation stats:', error);
    }
  }, [debouncedSearch, filters.paymentStatus]);

  const fetchDonations = useCallback(async () => {
    if (abortController) {
      abortController.abort();
    }

    const newAbortController = new AbortController();
    setAbortController(newAbortController);

    try {
      setLoading(true);

      const result = await adminDataService.fetchDonations(
        {
          page: pagination.state.page,
          pageSize: pagination.state.pageSize,
          sortBy: 'created_at',
          sortOrder: 'desc'
        },
        {
          search: debouncedSearch,
          status: filters.paymentStatus !== 'all' ? filters.paymentStatus : undefined,
        }
      );

      if (!newAbortController.signal.aborted) {
        setDonations(result.data as DonationData[]);
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Error fetching donations:', error);
        toast({
          variant: "destructive",
          title: "Error loading donations",
          description: "Failed to load donations. Please try again.",
        });
      }
    } finally {
      if (!newAbortController.signal.aborted) {
        setLoading(false);
      }
    }

    return () => newAbortController.abort();
  }, [pagination.state.page, pagination.state.pageSize, debouncedSearch, filters.paymentStatus, toast]);

  // Real-time event subscribers
  useEventSubscriber('donation.completed', (event) => {
    console.log('[DonationManagement] New donation:', event);
    adminDataService.invalidateCache('donations');
    fetchDonations();
    fetchDonationStats();
    
    toast({
      title: "New Donation",
      description: `${(event.payload as any).donorName || 'Anonymous'} donated ${MoneyMath.format(MoneyMath.create((event.payload as any).amount, 'USD'))}`,
    });
  });

  useEventSubscriber('donation.refunded', (event) => {
    console.log('[DonationManagement] Donation refunded:', event);
    adminDataService.invalidateCache('donations');
    fetchDonations();
    fetchDonationStats();
  });

  useEventSubscriber('donation.failed', (event) => {
    console.log('[DonationManagement] Donation failed:', event);
    fetchDonations();
    fetchDonationStats();
  });

  // Fetch data on mount and when dependencies change
  useEffect(() => {
    fetchDonations();
    fetchDonationStats();
  }, [fetchDonations, fetchDonationStats]);

  // Reset to page 1 when filters change
  useEffect(() => {
    if (pagination.state.page !== 1) {
      pagination.goToPage(1);
    }
  }, [debouncedSearch, filters.paymentStatus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortController) {
        abortController.abort();
      }
    };
  }, [abortController]);

  // Permission check
  const canViewDonations = hasPermission('view_donations') || hasPermission('manage_campaigns');
  const canRefund = isSuperAdmin();

  if (!canViewDonations) {
    return (
      <AdminPageLayout title="Donation Management">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to view donations. Please contact your administrator.
          </AlertDescription>
        </Alert>
      </AdminPageLayout>
    );
  }

  // Event handlers
  const handleViewDetails = (donation: DonationData) => {
    setSelectedDonation(donation);
    setShowDetailsDialog(true);
  };

  const handleViewCampaign = (fundraiserId: string) => {
    window.open(`/fundraiser/${fundraiserId}`, '_blank');
  };

  const handleRefund = (donationId: string) => {
    setConfirmAction({
      open: true,
      title: 'Refund Donation',
      description: 'Are you sure you want to refund this donation? This action cannot be undone.',
      variant: 'destructive',
      action: async () => {
        toast({
          title: "Refund Not Implemented",
          description: "Refund functionality requires Stripe API integration via Edge Function.",
          variant: "default",
        });
        setConfirmAction({ ...confirmAction, open: false });
      }
    });
  };

  const handleExport = () => {
    exportDonationsCSV(donations, 'donations-export');
    toast({
      title: "Export Complete",
      description: `Exported ${donations.length} donations to CSV`,
    });
  };

  const handleBulkActionClick = (actionKey: string) => {
    if (selectedDonations.length === 0) {
      toast({
        variant: "destructive",
        title: "No donations selected",
        description: "Please select at least one donation to perform this action.",
      });
      return;
    }

    switch (actionKey) {
      case 'export-selected':
        exportDonationsCSV(selectedDonations, 'selected-donations-export');
        toast({
          title: "Export Complete",
          description: `Exported ${selectedDonations.length} donations to CSV`,
        });
        break;
      case 'resend-receipts':
        toast({
          title: "Not Implemented",
          description: "Receipt resending requires email integration.",
        });
        break;
      case 'refund':
        if (!canRefund) {
          toast({
            variant: "destructive",
            title: "Permission Denied",
            description: "Only super admins can refund donations.",
          });
          return;
        }
        setConfirmAction({
          open: true,
          title: 'Refund Multiple Donations',
          description: `Are you sure you want to refund ${selectedDonations.length} donations? This action cannot be undone.`,
          variant: 'destructive',
          action: async () => {
            toast({
              title: "Refund Not Implemented",
              description: "Bulk refund functionality requires Stripe API integration.",
            });
            setConfirmAction({ ...confirmAction, open: false });
          }
        });
        break;
    }
  };

  // Column definitions
  const columns = createDonationColumns(
    handleViewDetails,
    handleViewCampaign,
    handleRefund,
    {
      canRefund,
      isSuperAdmin: isSuperAdmin()
    }
  );

  // Filter configuration
  const filterConfig: FilterConfig[] = [
    {
      key: 'search',
      label: 'Search',
      type: 'search',
      placeholder: 'Search by donor, email, receipt ID, or campaign...',
    },
    {
      key: 'paymentStatus',
      label: 'Payment Status',
      type: 'select',
      options: [
        { value: 'all', label: 'All Statuses' },
        { value: 'pending', label: 'Pending' },
        { value: 'paid', label: 'Paid' },
        { value: 'completed', label: 'Completed' },
        { value: 'failed', label: 'Failed' },
        { value: 'refunded', label: 'Refunded' }
      ]
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
        { value: 'year', label: 'This Year' }
      ]
    }
  ];

  // Table actions
  const tableActions: TableAction[] = [
    {
      key: 'refresh',
      label: 'Refresh',
      icon: RefreshCw,
      variant: 'outline',
      onClick: () => {
        adminDataService.invalidateCache('donations');
        fetchDonations();
        fetchDonationStats();
      }
    },
    {
      key: 'export',
      label: 'Export CSV',
      icon: Download,
      variant: 'outline',
      onClick: handleExport
    },
    {
      key: 'stripe',
      label: 'View in Stripe',
      icon: ExternalLink,
      variant: 'outline',
      onClick: () => window.open('https://dashboard.stripe.com/payments', '_blank')
    }
  ];

  // Bulk actions
  const bulkActions: BulkAction[] = [
    {
      key: 'export-selected',
      label: 'Export Selected',
      icon: Download,
      variant: 'outline'
    },
    ...(canRefund ? [{
      key: 'refund',
      label: 'Refund (Super Admin)',
      icon: RefreshCw,
      variant: 'destructive' as const,
      requiresConfirmation: true
    }] : [])
  ];

  // Statistics
  const successRate = dbStats.total > 0 
    ? ((dbStats.byStatus.paid / dbStats.total) * 100).toFixed(1) 
    : '0.0';

  const stats = [
    {
      title: "Total Donations",
      value: dbStats.total.toLocaleString(),
      icon: DollarSign,
      description: "All-time donations"
    },
    {
      title: "Total Amount",
      value: MoneyMath.format(MoneyMath.create(dbStats.totalAmount, 'USD')),
      icon: TrendingUp,
      iconClassName: "text-success",
      description: "Gross amount raised"
    },
    {
      title: "Average Donation",
      value: MoneyMath.format(MoneyMath.create(dbStats.averageAmount, 'USD')),
      icon: PieChart,
      description: "Per donation average"
    },
    {
      title: "Success Rate",
      value: `${successRate}%`,
      icon: CheckCircle,
      iconClassName: "text-success",
      description: "Payment success rate"
    },
    {
      title: "Failed Payments",
      value: dbStats.byStatus.failed.toLocaleString(),
      icon: XCircle,
      iconClassName: "text-destructive",
      description: "Requires attention"
    },
    {
      title: "Refunded",
      value: dbStats.byStatus.refunded.toLocaleString(),
      icon: RefreshCw,
      iconClassName: "text-warning",
      description: "Total refunds"
    }
  ];

  return (
    <AdminPageLayout
      title="Donation Management"
      description="Monitor and manage all donations across the platform"
      badge={{ 
        text: `${dbStats.recentDonations} new today`, 
        variant: 'default' 
      }}
      stats={
        isMobile 
          ? <MobileStatsGrid stats={stats} /> 
          : <AdminStatsGrid stats={stats} />
      }
      filters={<AdminFilters filters={filterConfig} values={filters} onChange={(key, value) => setFilters(prev => ({ ...prev, [key]: value }))} />}
    >
      <AdminDataTable
        columns={columns}
        data={donations}
        loading={loading}
        title="Donations"
        selectedRows={selectedDonations}
        onSelectionChange={setSelectedDonations}
        actions={tableActions}
        bulkActions={bulkActions}
        onBulkAction={handleBulkActionClick}
        enableSelection={true}
        enableSorting={true}
        enableColumnVisibility={true}
        enablePagination={true}
        paginationState={pagination.state}
        onPageChange={pagination.goToPage}
        onPageSizeChange={pagination.setPageSize}
        emptyStateTitle="No donations found"
        emptyStateDescription="No donations match your current filters."
      />

      <DonationDetailsDialog
        donation={selectedDonation}
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
        onViewCampaign={handleViewCampaign}
        onRefund={handleRefund}
        canRefund={canRefund}
      />

      <ConfirmDialog
        open={confirmAction.open}
        onOpenChange={(open) => setConfirmAction({ ...confirmAction, open })}
        title={confirmAction.title}
        description={confirmAction.description}
        onConfirm={confirmAction.action}
        variant={confirmAction.variant}
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
