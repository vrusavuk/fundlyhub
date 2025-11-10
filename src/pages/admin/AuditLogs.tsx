import { useState, useEffect } from 'react';
import { useRBAC } from '@/contexts/RBACContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useDebounce';
import { 
  Activity, 
  Search, 
  Filter, 
  Download,
  User,
  AlertTriangle,
  Clock,
  Database,
  Shield,
  FileText
} from 'lucide-react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';
import { AdminPageLayout, PageSection } from '@/components/admin/unified';

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
  actor_profile?: any;
}

interface AuditFilters {
  search: string;
  action: string;
  resource_type: string;
  actor_id: string;
  date_from: Date | null;
  date_to: Date | null;
  limit: number;
}

const ACTION_CATEGORIES = {
  user: ['user_created', 'user_updated', 'user_suspended', 'user_unsuspended', 'user_deleted'],
  role: ['role_created', 'role_updated', 'role_deleted', 'role_assigned', 'role_unassigned'],
  campaign: ['campaign_created', 'campaign_updated', 'campaign_approved', 'campaign_rejected'],
  system: ['login', 'logout', 'password_changed', 'settings_updated', 'data_exported'],
  security: ['failed_login', 'account_locked', 'suspicious_activity', 'ip_blocked']
};

export function AuditLogs() {
  const { hasPermission, isSuperAdmin } = useRBAC();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<AuditFilters>({
    search: '',
    action: 'all',
    resource_type: 'all',
    actor_id: '',
    date_from: null,
    date_to: null,
    limit: 50
  });

  // Debounce search input for better performance
  const debouncedSearch = useDebounce(filters.search, 500);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('audit_logs')
        .select(`
          *
        `, { count: 'exact' });

      // Apply filters (using debounced search)
      if (debouncedSearch.trim()) {
        query = query.or(`action.ilike.%${debouncedSearch}%,resource_type.ilike.%${debouncedSearch}%`);
      }

      if (filters.action !== 'all') {
        query = query.eq('action', filters.action);
      }

      if (filters.resource_type !== 'all') {
        query = query.eq('resource_type', filters.resource_type);
      }

      if (filters.actor_id.trim()) {
        query = query.eq('actor_id', filters.actor_id);
      }

      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from.toISOString());
      }

      if (filters.date_to) {
        const endDate = new Date(filters.date_to);
        endDate.setHours(23, 59, 59, 999);
        query = query.lte('created_at', endDate.toISOString());
      }

      // Apply pagination
      const offset = (currentPage - 1) * filters.limit;
      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + filters.limit - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      // Fetch profile data for actors
      const actorIds = [...new Set(data?.map(log => log.actor_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('id', actorIds);

      const logsWithProfiles = (data || []).map(log => ({
        ...log,
        actor_profile: profiles?.find(p => p.id === log.actor_id)
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
  };

  const exportLogs = async () => {
    if (!hasPermission('export_audit_logs')) {
      toast({
        title: 'Access Denied',
        description: 'You do not have permission to export audit logs',
        variant: 'destructive'
      });
      return;
    }

    try {
      // For export, get all matching records (up to a reasonable limit)
      let query = supabase
        .from('audit_logs')
        .select(`
          *
        `);

      // Apply same filters as current view
      if (filters.search.trim()) {
        query = query.or(`action.ilike.%${filters.search}%,resource_type.ilike.%${filters.search}%`);
      }

      if (filters.action !== 'all') {
        query = query.eq('action', filters.action);
      }

      if (filters.resource_type !== 'all') {
        query = query.eq('resource_type', filters.resource_type);
      }

      if (filters.actor_id.trim()) {
        query = query.eq('actor_id', filters.actor_id);
      }

      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from.toISOString());
      }

      if (filters.date_to) {
        const endDate = new Date(filters.date_to);
        endDate.setHours(23, 59, 59, 999);
        query = query.lte('created_at', endDate.toISOString());
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(10000); // Reasonable limit for export

      if (error) throw error;

      // Fetch profile data for export
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

      // Log the export action
      await supabase.rpc('log_audit_event', {
        _actor_id: (await supabase.auth.getUser()).data.user?.id,
        _action: 'audit_logs_exported',
        _resource_type: 'system',
        _metadata: { count: csvData.length }
      });

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
      return <Badge variant="default">Create</Badge>;
    }
    if (action.includes('updated') || action.includes('modified')) {
      return <Badge variant="secondary">Update</Badge>;
    }
    if (action.includes('deleted') || action.includes('suspended')) {
      return <Badge variant="destructive">Delete</Badge>;
    }
    if (action.includes('failed') || action.includes('blocked')) {
      return <Badge variant="destructive">Security</Badge>;
    }
    return <Badge variant="outline">{action}</Badge>;
  };

  const formatMetadata = (metadata: Record<string, any>) => {
    if (!metadata || Object.keys(metadata).length === 0) return '';
    
    const key = Object.keys(metadata)[0];
    const value = metadata[key];
    
    if (typeof value === 'string' || typeof value === 'number') {
      return `${key}: ${value}`;
    }
    
    return `${Object.keys(metadata).length} properties`;
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [debouncedSearch, filters.action, filters.resource_type, filters.actor_id, filters.date_from, filters.date_to, currentPage]);

  if (!hasPermission('view_audit_logs')) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          You do not have permission to access audit logs.
        </AlertDescription>
      </Alert>
    );
  }

  const totalPages = Math.ceil(totalCount / filters.limit);

  return (
    <AdminPageLayout
      title="Audit Logs"
      description="Track all administrative actions and system events"
      actions={
        <Button onClick={exportLogs} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      }
    >
      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search actions..."
                className="pl-10"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>
            
            <Select
              value={filters.action}
              onValueChange={(value) => setFilters(prev => ({ ...prev, action: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {Object.entries(ACTION_CATEGORIES).map(([category, actions]) => (
                  <div key={category}>
                    <div className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase">
                      {category}
                    </div>
                    {actions.map(action => (
                      <SelectItem key={action} value={action}>
                        {action.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.resource_type}
              onValueChange={(value) => setFilters(prev => ({ ...prev, resource_type: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Resource" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Resources</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="role">Role</SelectItem>
                <SelectItem value="campaign">Campaign</SelectItem>
                <SelectItem value="organization">Organization</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Actor ID"
              value={filters.actor_id}
              onChange={(e) => setFilters(prev => ({ ...prev, actor_id: e.target.value }))}
            />

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <Calendar className="mr-2 h-4 w-4" />
                  {filters.date_from ? format(filters.date_from, 'MMM dd') : 'From'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filters.date_from}
                  onSelect={(date) => setFilters(prev => ({ ...prev, date_from: date }))}
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <Calendar className="mr-2 h-4 w-4" />
                  {filters.date_to ? format(filters.date_to, 'MMM dd') : 'To'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filters.date_to}
                  onSelect={(date) => setFilters(prev => ({ ...prev, date_to: date }))}
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Activity className="mr-2 h-4 w-4" />
              Audit Logs ({totalCount})
            </CardTitle>
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
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <div className="text-sm">
                          {new Date(log.created_at).toLocaleString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">
                          {(log.actor_profile as any)?.name || 'Unknown User'}
                        </div>
                        <div className="text-muted-foreground">
                          {(log.actor_profile as any)?.email || log.actor_id}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getActionIcon(log.action)}
                        {getActionBadge(log.action)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{log.resource_type}</div>
                        {log.resource_id && (
                          <div className="text-xs text-muted-foreground">
                            {log.resource_id.substring(0, 8)}...
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground max-w-48 truncate">
                        {formatMetadata(log.metadata)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {log.ip_address || 'Unknown'}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AdminPageLayout>
  );
}