import { useState, useEffect } from 'react';
import { useRBAC } from '@/contexts/RBACContext';
import { createColumnHelper } from '@tanstack/react-table';
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
  MessageSquare,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { payoutService, type PayoutRequest } from '@/lib/services/payout.service';
import { PayoutDetailDialog } from '@/components/admin/PayoutDetailDialog';
import { format } from 'date-fns';

const columnHelper = createColumnHelper<PayoutRequest>();

export default function PayoutManagement() {
  const { hasPermission } = useRBAC();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [filteredPayouts, setFilteredPayouts] = useState<PayoutRequest[]>([]);
  const [selectedPayout, setSelectedPayout] = useState<PayoutRequest | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedRows, setSelectedRows] = useState<PayoutRequest[]>([]);
  const [filterValues, setFilterValues] = useState<Record<string, any>>({
    status: '',
    priority: ''
  });

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
      key: 'status',
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
    },
    {
      key: 'priority',
      label: 'Priority',
      type: 'select',
      options: [
        { label: 'All Priorities', value: '' },
        { label: 'Normal', value: 'normal' },
        { label: 'High', value: 'high' },
        { label: 'Urgent', value: 'urgent' },
      ],
    },
  ];

  const handleFilterChange = (key: string, value: any) => {
    const newValues = { ...filterValues, [key]: value };
    setFilterValues(newValues);
    
    let filtered = [...payouts];

    if (newValues.status) {
      filtered = filtered.filter(p => p.status === newValues.status);
    }
    if (newValues.priority) {
      filtered = filtered.filter(p => p.priority === newValues.priority);
    }

    setFilteredPayouts(filtered);
  };

  const handleBulkAction = (actionKey: string) => {
    if (actionKey === 'approve') {
      console.log('Bulk approve:', selectedRows.map(r => r.id));
      toast({
        title: "Bulk Action",
        description: `Approving ${selectedRows.length} payouts...`,
      });
    }
  };

  const bulkActions: BulkAction[] = [
    {
      key: 'approve',
      label: 'Approve Selected',
      icon: Check,
      variant: 'default',
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
    columnHelper.accessor('user_id', {
      header: 'User ID',
      cell: (info) => <span className="font-mono text-xs">{info.getValue().slice(0, 8)}...</span>,
    }),
    columnHelper.accessor('requested_amount_str', {
      header: 'Amount',
      cell: (info) => <span className="font-semibold">${info.getValue()}</span>,
    }),
    columnHelper.accessor('net_amount_str', {
      header: 'Net Amount',
      cell: (info) => <span className="text-muted-foreground">${info.getValue()}</span>,
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: (info) => getStatusBadge(info.getValue()),
    }),
    columnHelper.accessor('risk_score', {
      header: 'Risk Score',
      cell: (info) => {
        const value = info.getValue();
        return (
          <Badge variant={value && value > 70 ? 'destructive' : 'outline'}>
            {value || 0}
          </Badge>
        );
      },
    }),
    columnHelper.accessor('created_at', {
      header: 'Requested',
      cell: (info) => format(new Date(info.getValue()), 'MMM d, yyyy'),
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: (info) => {
        const payout = info.row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleViewDetails(payout)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            {payout.status === 'pending' && (
              <>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleApprove(payout.id)}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDeny(payout.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        );
      },
    }),
  ];

  const tableActions: TableAction[] = [
    {
      key: 'refresh',
      label: 'Refresh',
      icon: RefreshCw,
      variant: 'outline',
      onClick: fetchPayouts,
      loading,
    },
  ];

  return (
    <AdminPageLayout
      title="Payout Management"
      description="Review and manage creator payout requests"
    >
      <AdminContentContainer>
        <AdminTableControls
          title="Payout Requests"
          totalCount={filteredPayouts.length}
          selectedCount={selectedRows.length}
          bulkActions={bulkActions}
          onBulkAction={handleBulkAction}
          onClearSelection={() => setSelectedRows([])}
          loading={loading}
          actions={tableActions}
        />

        <AdminFilters
          filters={filters}
          values={filterValues}
          onChange={handleFilterChange}
          onClear={() => {
            setFilterValues({ status: '', priority: '' });
            setFilteredPayouts(payouts);
          }}
        />

        <AdminDataTable
          data={filteredPayouts}
          columns={columns}
          loading={loading}
          selectedRows={selectedRows}
          onSelectionChange={setSelectedRows}
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
