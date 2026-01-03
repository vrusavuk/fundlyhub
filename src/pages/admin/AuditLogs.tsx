import { useState, useEffect, useCallback } from 'react';
import { useRBAC } from '@/contexts/RBACContext';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useDebounce';
import { ColumnDef } from '@tanstack/react-table';
import { 
  Activity, 
  Download,
  User,
  AlertTriangle,
  Clock,
  Database,
  Shield,
  FileText,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  AdminPageLayout,
  AdminFilters,
  AdminDataTable,
  FilterConfig
} from '@/components/admin/unified';
import { StripeCardExact } from '@/components/ui/stripe-card-exact';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface AuditLog {
  id: string;
  actor_id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  metadata: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  actor_profile?: {
    name?: string;
    email?: string;
  };
}

interface AuditFilters {
  search: string;
  action: string;
  resource_type: string;
}

const ACTION_OPTIONS = [
  { value: 'all', label: 'All Actions' },
  { value: 'user_created', label: 'User Created' },
  { value: 'user_updated', label: 'User Updated' },
  { value: 'user_suspended', label: 'User Suspended' },
  { value: 'role_assigned', label: 'Role Assigned' },
  { value: 'role_unassigned', label: 'Role Unassigned' },
  { value: 'campaign_created', label: 'Campaign Created' },
  { value: 'campaign_updated', label: 'Campaign Updated' },
  { value: 'donation_reallocated', label: 'Donation Reallocated' },
  { value: 'settings_updated', label: 'Settings Updated' },
  { value: 'login', label: 'Login' },
  { value: 'logout', label: 'Logout' },
];

const RESOURCE_OPTIONS = [
  { value: 'all', label: 'All Resources' },
  { value: 'user', label: 'User' },
  { value: 'role', label: 'Role' },
  { value: 'campaign', label: 'Campaign' },
  { value: 'donation', label: 'Donation' },
  { value: 'organization', label: 'Organization' },
  { value: 'system', label: 'System' },
  { value: 'profile', label: 'Profile' },
];

export function AuditLogs() {
  const { hasPermission, isSuperAdmin } = useRBAC();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  
  const [filters, setFilters] = useState<AuditFilters>({
    search: '',
    action: 'all',
    resource_type: 'all',
  });

  const debouncedSearch = useDebounce(filters.search, 500);

  const fetchAuditLogs = useCallback(async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' });

      if (debouncedSearch.trim()) {
        query = query.or(`action.ilike.%${debouncedSearch}%,resource_type.ilike.%${debouncedSearch}%`);
      }

      if (filters.action !== 'all') {
        query = query.eq('action', filters.action);
      }

      if (filters.resource_type !== 'all') {
        query = query.eq('resource_type', filters.resource_type);
      }

      if (dateFrom) {
        query = query.gte('created_at', dateFrom.toISOString());
      }

      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        query = query.lte('created_at', endDate.toISOString());
      }

      const offset = (currentPage - 1) * pageSize;
      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      // Fetch profile data for actors
      const actorIds = [...new Set(data?.map(log => log.actor_id) || [])];
      let profiles: { id: string; name: string; email: string }[] = [];
      
      if (actorIds.length > 0) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, name, email')
          .in('id', actorIds);
        profiles = profileData || [];
      }

      const logsWithProfiles = (data || []).map(log => ({
        ...log,
        actor_profile: profiles.find(p => p.id === log.actor_id)
      }));

      setLogs(logsWithProfiles as AuditLog[]);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load audit logs',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filters.action, filters.resource_type, dateFrom, dateTo, currentPage, pageSize, toast]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  const exportLogs = async () => {
    if (!hasPermission('export_audit_logs') && !isSuperAdmin()) {
      toast({
        title: 'Access Denied',
        description: 'You do not have permission to export audit logs',
        variant: 'destructive'
      });
      return;
    }

    try {
      let query = supabase.from('audit_logs').select('*');

      if (filters.search.trim()) {
        query = query.or(`action.ilike.%${filters.search}%,resource_type.ilike.%${filters.search}%`);
      }
      if (filters.action !== 'all') query = query.eq('action', filters.action);
      if (filters.resource_type !== 'all') query = query.eq('resource_type', filters.resource_type);
      if (dateFrom) query = query.gte('created_at', dateFrom.toISOString());
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        query = query.lte('created_at', endDate.toISOString());
      }

      const { data, error } = await query.order('created_at', { ascending: false }).limit(10000);

      if (error) throw error;

      const actorIds = [...new Set(data?.map(log => log.actor_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('id', actorIds);

      const csvData = (data || []).map(log => {
        const actorProfile = profiles?.find(p => p.id === log.actor_id);
        return {
          Timestamp: log.created_at,
          Actor: actorProfile?.name || actorProfile?.email || log.actor_id,
          Action: log.action,
          Resource: log.resource_type,
          'Resource ID': log.resource_id || '',
          'IP Address': log.ip_address || '',
          Metadata: JSON.stringify(log.metadata || {})
        };
      });

      const csv = [
        Object.keys(csvData[0] || {}).join(','),
        ...csvData.map(row => Object.values(row).map(value => 
          typeof value === 'string' && value.includes(',') ? `"${value}"` : value
        ).join(','))
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: 'Export Complete',
        description: `Exported ${csvData.length} audit log entries`
      });
    } catch (error) {
      console.error('Error exporting audit logs:', error);
      toast({
        title: 'Error',
        description: 'Failed to export audit logs',
        variant: 'destructive'
      });
    }
  };

  const getActionIcon = (action: string) => {
    if (action.includes('login') || action.includes('auth')) {
      return <Shield className="h-4 w-4 text-blue-500" />;
    }
    if (action.includes('user') || action.includes('role')) {
      return <User className="h-4 w-4 text-green-500" />;
    }
    if (action.includes('campaign') || action.includes('fundraiser')) {
      return <FileText className="h-4 w-4 text-purple-500" />;
    }
    if (action.includes('system') || action.includes('settings')) {
      return <Database className="h-4 w-4 text-orange-500" />;
    }
    return <Activity className="h-4 w-4 text-muted-foreground" />;
  };

  const getActionBadge = (action: string) => {
    if (action.includes('created') || action.includes('approved')) {
      return <Badge variant="default" className="text-xs">Create</Badge>;
    }
    if (action.includes('updated') || action.includes('modified')) {
      return <Badge variant="secondary" className="text-xs">Update</Badge>;
    }
    if (action.includes('deleted') || action.includes('suspended')) {
      return <Badge variant="destructive" className="text-xs">Delete</Badge>;
    }
    if (action.includes('failed') || action.includes('blocked')) {
      return <Badge variant="destructive" className="text-xs">Security</Badge>;
    }
    return <Badge variant="outline" className="text-xs">{action.replace(/_/g, ' ')}</Badge>;
  };

  const formatMetadata = (metadata: Record<string, any>) => {
    if (!metadata || Object.keys(metadata).length === 0) return '-';
    const key = Object.keys(metadata)[0];
    const value = metadata[key];
    if (typeof value === 'string' || typeof value === 'number') {
      return `${key}: ${value}`;
    }
    return `${Object.keys(metadata).length} properties`;
  };

  // Define columns for the data table
  const columns: ColumnDef<AuditLog>[] = [
    {
      accessorKey: 'created_at',
      header: 'Time',
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
          <span className="whitespace-nowrap">{format(new Date(row.original.created_at), 'MMM d, yyyy HH:mm')}</span>
        </div>
      ),
      size: 160,
    },
    {
      accessorKey: 'actor',
      header: 'Actor',
      cell: ({ row }) => (
        <div className="text-sm min-w-0">
          <div className="font-medium truncate">
            {row.original.actor_profile?.name || 'Unknown User'}
          </div>
          <div className="text-muted-foreground text-xs truncate">
            {row.original.actor_profile?.email || row.original.actor_id.substring(0, 8) + '...'}
          </div>
        </div>
      ),
      size: 180,
    },
    {
      accessorKey: 'action',
      header: 'Action',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {getActionIcon(row.original.action)}
          {getActionBadge(row.original.action)}
        </div>
      ),
      size: 160,
    },
    {
      accessorKey: 'resource_type',
      header: 'Resource',
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-sm">{row.original.resource_type}</div>
          {row.original.resource_id && (
            <div className="text-xs text-muted-foreground">
              {row.original.resource_id.substring(0, 8)}...
            </div>
          )}
        </div>
      ),
      size: 120,
    },
    {
      accessorKey: 'metadata',
      header: 'Details',
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground max-w-[200px] truncate">
          {formatMetadata(row.original.metadata)}
        </div>
      ),
      size: 200,
    },
    {
      accessorKey: 'ip_address',
      header: 'IP Address',
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {row.original.ip_address || 'Unknown'}
        </div>
      ),
      size: 120,
    },
  ];

  // Filter configuration
  const filterConfigs: FilterConfig[] = [
    {
      key: 'search',
      label: 'Search',
      type: 'search',
      placeholder: 'Search actions...',
    },
    {
      key: 'action',
      label: 'Action',
      type: 'select',
      options: ACTION_OPTIONS,
    },
    {
      key: 'resource_type',
      label: 'Resource',
      type: 'select',
      options: RESOURCE_OPTIONS,
    },
  ];

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({ search: '', action: 'all', resource_type: 'all' });
    setDateFrom(undefined);
    setDateTo(undefined);
    setCurrentPage(1);
  };

  // Mobile card renderer
  const renderMobileCard = (log: AuditLog) => (
    <StripeCardExact key={log.id} className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {getActionIcon(log.action)}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              {getActionBadge(log.action)}
              <span className="text-xs text-muted-foreground">{log.resource_type}</span>
            </div>
            <div className="text-sm font-medium mt-1 truncate">
              {log.actor_profile?.name || 'Unknown User'}
            </div>
            <div className="text-xs text-muted-foreground">
              {format(new Date(log.created_at), 'MMM d, yyyy HH:mm')}
            </div>
          </div>
        </div>
      </div>
      {log.metadata && Object.keys(log.metadata).length > 0 && (
        <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
          {formatMetadata(log.metadata)}
        </div>
      )}
    </StripeCardExact>
  );

  if (!hasPermission('view_audit_logs') && !isSuperAdmin()) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          You do not have permission to access audit logs.
        </AlertDescription>
      </Alert>
    );
  }

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <AdminPageLayout
      title="Audit Logs"
      description="Track all administrative actions and system events"
      actions={
        <Button onClick={exportLogs} variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      }
    >
      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <AdminFilters
          filters={filterConfigs}
          values={filters}
          onChange={handleFilterChange}
          onClear={handleClearFilters}
        />
        
        {/* Date From Picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9">
              <Calendar className="mr-2 h-3.5 w-3.5" />
              {dateFrom ? format(dateFrom, 'MMM d') : 'From'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 z-50" align="start">
            <CalendarComponent
              mode="single"
              selected={dateFrom}
              onSelect={setDateFrom}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* Date To Picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9">
              <Calendar className="mr-2 h-3.5 w-3.5" />
              {dateTo ? format(dateTo, 'MMM d') : 'To'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 z-50" align="start">
            <CalendarComponent
              mode="single"
              selected={dateTo}
              onSelect={setDateTo}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {(dateFrom || dateTo) && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => { setDateFrom(undefined); setDateTo(undefined); }}
            className="h-9 text-muted-foreground"
          >
            Clear dates
          </Button>
        )}
      </div>

      {/* Data Table */}
      <AdminDataTable
        columns={columns}
        data={logs}
        loading={loading}
        title={`Audit Logs (${totalCount})`}
        enableSelection={false}
        enableSorting={false}
        mobileCardRenderer={renderMobileCard}
        paginationState={{
          page: currentPage,
          pageSize,
          totalCount,
          totalPages,
        }}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setCurrentPage(1);
        }}
        emptyStateTitle="No audit logs found"
        emptyStateDescription="No activity logs match your current filters."
        error={null}
        retry={fetchAuditLogs}
      />
    </AdminPageLayout>
  );
}