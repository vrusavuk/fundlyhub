import { useState, useEffect } from 'react';
import { useRBAC } from '@/contexts/RBACContext';
import {
  AdminPageLayout,
  AdminFilters,
  AdminDataTable,
  AdminTableControls,
  AdminContentContainer,
  type FilterConfig,
  type BulkAction,
  type TableAction,
} from '@/components/admin/unified';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Eye,
  Check,
  X,
  MessageSquare
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { payoutService, type PayoutRequest } from '@/lib/services/payout.service';
import { PayoutDetailDialog } from '@/components/admin/PayoutDetailDialog';
import { format } from 'date-fns';

export default function PayoutManagement() {
  const { hasPermission } = useRBAC();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [filteredPayouts, setFilteredPayouts] = useState<PayoutRequest[]>([]);
  const [selectedPayout, setSelectedPayout] = useState<PayoutRequest | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  useEffect(() => {
    if (hasPermission('manage_payouts')) {
      fetchPayouts();
    }
  }, [hasPermission]);

  const fetchPayouts = async () => {
    try {
      setLoading(true);
      const data = await payoutService.getAllPayoutRequests();
      setPayouts(data);
      setFilteredPayouts(data);
    } catch (error) {
      console.error('Error fetching payouts:', error);
      toast({
        title: "Error",
        description: "Failed to load payout requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (payout: PayoutRequest) => {
    setSelectedPayout(payout);
    setShowDetailDialog(true);
  };

  const handleApprove = async (payoutId: string) => {
    try {
      await payoutService.approvePayout(payoutId);
      toast({
        title: "Payout Approved",
        description: "The payout has been approved successfully",
      });
      fetchPayouts();
    } catch (error) {
      toast({
        title: "Approval Failed",
        description: error instanceof Error ? error.message : "Failed to approve payout",
        variant: "destructive",
      });
    }
  };

  const handleDeny = async (payoutId: string) => {
    const reason = prompt("Enter denial reason:");
    if (!reason) return;

    try {
      await payoutService.denyPayout(payoutId, reason);
      toast({
        title: "Payout Denied",
        description: "The payout has been denied",
      });
      fetchPayouts();
    } catch (error) {
      toast({
        title: "Denial Failed",
        description: error instanceof Error ? error.message : "Failed to deny payout",
        variant: "destructive",
      });
    }
  };

  const filters: FilterConfig[] = [
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'All Statuses', value: '' },
        { label: 'Pending', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Processing', value: 'processing' },
        { label: 'Completed', value: 'completed' },
        { label: 'Denied', value: 'denied' },
        { label: 'Info Required', value: 'info_required' },
      ],
      defaultValue: '',
    },
    {
      id: 'priority',
      label: 'Priority',
      type: 'select',
      options: [
        { label: 'All Priorities', value: '' },
        { label: 'Normal', value: 'normal' },
        { label: 'High', value: 'high' },
        { label: 'Urgent', value: 'urgent' },
      ],
      defaultValue: '',
    },
  ];

  const handleFilterChange = (filterId: string, value: any) => {
    let filtered = [...payouts];

    // Apply filters
    const activeFilters: Record<string, any> = {};
    filters.forEach(f => {
      if (f.id === filterId) {
        activeFilters[f.id] = value;
      }
    });

    if (activeFilters.status) {
      filtered = filtered.filter(p => p.status === activeFilters.status);
    }
    if (activeFilters.priority) {
      filtered = filtered.filter(p => p.priority === activeFilters.priority);
    }

    setFilteredPayouts(filtered);
  };

  const bulkActions: BulkAction[] = [
    {
      label: 'Approve Selected',
      icon: Check,
      variant: 'default',
      action: async (ids: string[]) => {
        // Implement bulk approve
        console.log('Bulk approve:', ids);
      },
      confirmMessage: 'Are you sure you want to approve the selected payouts?',
    },
  ];

  const tableActions: TableAction[] = [
    {
      label: 'View Details',
      icon: Eye,
      variant: 'ghost',
      action: (row: any) => handleViewDetails(row),
    },
    {
      label: 'Approve',
      icon: Check,
      variant: 'default',
      action: (row: any) => handleApprove(row.id),
      condition: (row: any) => row.status === 'pending',
    },
    {
      label: 'Deny',
      icon: X,
      variant: 'destructive',
      action: (row: any) => handleDeny(row.id),
      condition: (row: any) => row.status === 'pending',
    },
  ];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", icon: any }> = {
      pending: { variant: "outline", icon: Clock },
      approved: { variant: "default", icon: CheckCircle2 },
      processing: { variant: "default", icon: Clock },
      completed: { variant: "secondary", icon: CheckCircle2 },
      denied: { variant: "destructive", icon: AlertTriangle },
      info_required: { variant: "outline", icon: MessageSquare },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const columns = [
    {
      key: 'user_id',
      label: 'User ID',
      render: (value: string) => <span className="font-mono text-xs">{value.slice(0, 8)}...</span>,
    },
    {
      key: 'requested_amount_str',
      label: 'Amount',
      render: (value: string) => <span className="font-semibold">${value}</span>,
    },
    {
      key: 'net_amount_str',
      label: 'Net Amount',
      render: (value: string) => <span className="text-muted-foreground">${value}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => getStatusBadge(value),
    },
    {
      key: 'risk_score',
      label: 'Risk Score',
      render: (value: number | null) => (
        <Badge variant={value && value > 70 ? 'destructive' : 'outline'}>
          {value || 0}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      label: 'Requested',
      render: (value: string) => format(new Date(value), 'MMM d, yyyy'),
    },
  ];

  return (
    <AdminPageLayout
      title="Payout Management"
      description="Review and manage creator payout requests"
      icon={DollarSign}
    >
      <AdminContentContainer>
        <AdminTableControls
          title="Payout Requests"
          totalCount={filteredPayouts.length}
          selectedCount={selectedRows.length}
          onRefresh={fetchPayouts}
          loading={loading}
          bulkActions={bulkActions}
          selectedRows={selectedRows}
        />

        <AdminFilters
          filters={filters}
          onFilterChange={handleFilterChange}
        />

        <AdminDataTable
          data={filteredPayouts}
          columns={columns}
          loading={loading}
          selectedRows={selectedRows}
          onSelectionChange={setSelectedRows}
          actions={tableActions}
          emptyMessage="No payout requests found"
        />
      </AdminContentContainer>

      {selectedPayout && (
        <PayoutDetailDialog
          open={showDetailDialog}
          onClose={() => {
            setShowDetailDialog(false);
            setSelectedPayout(null);
          }}
          onSuccess={fetchPayouts}
          payoutRequest={selectedPayout}
        />
      )}
    </AdminPageLayout>
  );
}
