import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  History, 
  User, 
  Clock, 
  Search, 
  Filter,
  RefreshCw,
  AlertTriangle,
  Eye,
  Undo2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRBAC } from '@/hooks/useRBAC';

interface AuditLogEntry {
  id: string;
  setting_key: string;
  old_value: any;
  new_value: any;
  changed_by: string;
  change_reason?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
}

interface AuditTrailProps {
  settingKey?: string;
}

export function AuditTrail({ settingKey }: AuditTrailProps) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const { toast } = useToast();
  const { hasPermission, isSuperAdmin } = useRBAC();

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('settings_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (settingKey) {
        query = query.eq('setting_key', settingKey);
      }

      if (selectedUser !== 'all') {
        query = query.eq('changed_by', selectedUser);
      }

      if (dateFilter !== 'all') {
        const now = new Date();
        let startDate: Date;
        
        switch (dateFilter) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          default:
            startDate = new Date(0);
        }
        
        query = query.gte('created_at', startDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      const processedData = (data || []).map(entry => ({
        ...entry,
        ip_address: entry.ip_address as string | null,
        user_agent: entry.user_agent as string | null,
        change_reason: entry.change_reason as string | null
      }));
      setLogs(processedData);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast({
        title: "Error",
        description: "Failed to load audit logs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasPermission('view_audit_logs') || isSuperAdmin()) {
      fetchAuditLogs();
    }
  }, [selectedUser, dateFilter, settingKey, hasPermission, isSuperAdmin]);

  const filteredLogs = logs.filter(log => 
    log.setting_key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.change_reason?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatValue = (value: any) => {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  const getChangeType = (oldValue: any, newValue: any) => {
    if (oldValue === null || oldValue === undefined) return 'created';
    if (newValue === null || newValue === undefined) return 'deleted';
    return 'updated';
  };

  if (!hasPermission('view_audit_logs') && !isSuperAdmin()) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          You don't have permission to view audit logs.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <History className="w-5 h-5 mr-2" />
            Settings Audit Trail
          </CardTitle>
          <CardDescription>
            Track all changes made to system settings with full audit trail
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search settings or reasons..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Date filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Past week</SelectItem>
                <SelectItem value="month">Past month</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={fetchAuditLogs}
              disabled={loading}
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Audit Log Entries */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No audit logs found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLogs.map((log) => {
                const changeType = getChangeType(log.old_value, log.new_value);
                
                return (
                  <Card key={log.id} className="border-l-4 border-l-primary/20">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium">{log.setting_key}</h4>
                            <Badge 
                              variant={
                                changeType === 'created' ? 'default' :
                                changeType === 'deleted' ? 'destructive' :
                                'secondary'
                              }
                            >
                              {changeType}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {log.change_reason || 'No reason provided'}
                          </p>
                        </div>
                        
                        <div className="text-right text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1 mb-1">
                            <User className="w-3 h-3" />
                            <span>{log.changed_by}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(log.created_at).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Value Changes */}
                      <div className="grid gap-4 md:grid-cols-2">
                        {log.old_value && (
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-status-error">
                              Previous Value
                            </label>
                            <pre className="bg-status-error-light border border-status-error-border rounded p-3 text-sm overflow-auto max-h-32">
                              {formatValue(log.old_value)}
                            </pre>
                          </div>
                        )}
                        
                        {log.new_value && (
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-status-success">
                              New Value
                            </label>
                            <pre className="bg-status-success-light border border-status-success-border rounded p-3 text-sm overflow-auto max-h-32">
                              {formatValue(log.new_value)}
                            </pre>
                          </div>
                        )}
                      </div>

                      {/* Additional Info */}
                      {(log.ip_address || log.user_agent) && (
                        <div className="mt-4 pt-3 border-t border-border">
                          <div className="text-xs text-muted-foreground space-y-1">
                            {log.ip_address && (
                              <div>IP Address: {log.ip_address}</div>
                            )}
                            {log.user_agent && (
                              <div>User Agent: {log.user_agent}</div>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}