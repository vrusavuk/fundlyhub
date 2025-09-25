import { useState, useEffect } from 'react';
import { useRBAC } from '@/hooks/useRBAC';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Search, 
  Filter, 
  MoreHorizontal, 
  UserCheck, 
  UserX, 
  Shield, 
  Lock,
  Unlock,
  AlertTriangle,
  Eye,
  Edit,
  Trash2,
  Plus,
  Download,
  RefreshCw
} from 'lucide-react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DataTable } from '@/components/ui/data-table';
import { createUserColumns, UserData as UserColumnData } from '@/lib/data-table/user-columns';
import { EnhancedPageHeader } from '@/components/admin/EnhancedPageHeader';
import { AdminStatsGrid } from '@/components/admin/AdminStatsCards';
import { useOptimisticUpdates, OptimisticUpdateIndicator } from '@/components/admin/OptimisticUpdates';

interface ExtendedProfile {
  id: string;
  name: string | null;
  email: string | null;
  avatar: string | null;
  role: string;
  account_status: string;
  created_at: string;
  last_login_at: string | null;
  suspended_until: string | null;
  suspension_reason: string | null;
  failed_login_attempts: number;
  campaign_count: number;
  total_funds_raised: number;
  follower_count: number;
  user_roles?: Array<{
    role_name: string;
    context_type: string;
    hierarchy_level: number;
  }>;
}

interface UserFilters {
  search: string;
  status: string;
  role: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export function UserManagement() {
  const { hasPermission, isSuperAdmin } = useRBAC();
  const { toast } = useToast();
  const [users, setUsers] = useState<ExtendedProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<ExtendedProfile | null>(null);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    status: 'all',
    role: 'all',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });

  // Enhanced with optimistic updates
  const optimisticUpdates = useOptimisticUpdates({
    onSuccess: () => {
      fetchUsers(); // Refresh data after successful operations
    },
    onError: (action, error) => {
      console.error(`Action ${action.type} failed:`, error);
    }
  });

  // Create columns for the data table
  // Create columns for the enhanced data table
  const userColumns = createUserColumns(
    // onViewDetails
    (user) => {
      viewUserDetails(user as ExtendedProfile);
    },
    // onSuspendUser
    (userId, reason, duration) => {
      suspendUser(userId, reason, duration);
    },
    // onUnsuspendUser
    (userId) => {
      unsuspendUser(userId);
    },
    // permissions
    {
      canManageUsers: hasPermission('manage_user_accounts'),
      canViewDetails: hasPermission('view_user_details'),
      isSuperAdmin: isSuperAdmin(),
    }
  );

  const fetchUsers = async () => {
    try {
      setLoading(true);

      // Build query with filters
      let query = supabase
        .from('profiles')
        .select(`
          id,
          name,
          email,
          avatar,
          role,
          account_status,
          created_at,
          last_login_at,
          suspended_until,
          suspension_reason,
          failed_login_attempts,
          campaign_count,
          total_funds_raised,
          follower_count
        `);

      // Apply search filter
      if (filters.search.trim()) {
        query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      // Apply status filter
      if (filters.status !== 'all') {
        query = query.eq('account_status', filters.status);
      }

      // Apply role filter
      if (filters.role !== 'all') {
        query = query.eq('role', filters.role as any);
      }

      // Apply sorting
      query = query.order(filters.sortBy, { ascending: filters.sortOrder === 'asc' });

      const { data, error } = await query.limit(100);

      if (error) throw error;

      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Create columns for the data table
  const columns = userColumns;

  const suspendUser = async (userId: string, reason: string, duration: number) => {
    if (!hasPermission('manage_user_accounts')) {
      toast({
        title: 'Access Denied',
        description: 'You do not have permission to suspend users',
        variant: 'destructive'
      });
      return;
    }

    try {
      const suspendUntil = new Date();
      suspendUntil.setDate(suspendUntil.getDate() + duration);

      const { error } = await supabase
        .from('profiles')
        .update({
          account_status: 'suspended',
          suspended_until: suspendUntil.toISOString(),
          suspension_reason: reason
        })
        .eq('id', userId);

      if (error) throw error;

      // Log the action
      await supabase.rpc('log_audit_event', {
        _actor_id: (await supabase.auth.getUser()).data.user?.id,
        _action: 'user_suspended',
        _resource_type: 'user',
        _resource_id: userId,
        _metadata: {}
      });

      toast({
        title: 'User Suspended',
        description: 'User has been suspended successfully'
      });

      fetchUsers();
    } catch (error) {
      console.error('Error suspending user:', error);
      toast({
        title: 'Error',
        description: 'Failed to suspend user',
        variant: 'destructive'
      });
    }
  };

  const unsuspendUser = async (userId: string) => {
    if (!hasPermission('manage_user_accounts')) {
      toast({
        title: 'Access Denied',
        description: 'You do not have permission to unsuspend users',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          account_status: 'active',
          suspended_until: null,
          suspension_reason: null
        })
        .eq('id', userId);

      if (error) throw error;

      // Log the action
      await supabase.rpc('log_audit_event', {
        _actor_id: (await supabase.auth.getUser()).data.user?.id,
        _action: 'user_unsuspended',
        _resource_type: 'user',
        _resource_id: userId
      });

      toast({
        title: 'User Unsuspended',
        description: 'User has been unsuspended successfully'
      });

      fetchUsers();
    } catch (error) {
      console.error('Error unsuspending user:', error);
      toast({
        title: 'Error',
        description: 'Failed to unsuspend user',
        variant: 'destructive'
      });
    }
  };

  const viewUserDetails = async (user: ExtendedProfile) => {
    try {
      // Fetch user roles
      const { data: userRoles } = await supabase
        .rpc('get_user_roles', {
          _user_id: user.id,
          _context_type: 'all'
        });

      setSelectedUser({
        ...user,
        user_roles: userRoles || []
      });
      setShowUserDialog(true);
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  const exportUsers = async () => {
    if (!hasPermission('export_user_data')) {
      toast({
        title: 'Access Denied',
        description: 'You do not have permission to export user data',
        variant: 'destructive'
      });
      return;
    }

    try {
      const csvData = users.map(user => ({
        ID: user.id,
        Name: user.name || '',
        Email: user.email || '',
        Role: user.role,
        Status: user.account_status,
        'Created At': user.created_at,
        'Last Login': user.last_login_at || '',
        'Campaign Count': user.campaign_count,
        'Total Raised': user.total_funds_raised,
        'Followers': user.follower_count
      }));

      const csv = [
        Object.keys(csvData[0]).join(','),
        ...csvData.map(row => Object.values(row).join(','))
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      // Log the export action
      await supabase.rpc('log_audit_event', {
        _actor_id: (await supabase.auth.getUser()).data.user?.id,
        _action: 'user_data_exported',
        _resource_type: 'system',
        _metadata: { count: users.length }
      });
    } catch (error) {
      console.error('Error exporting users:', error);
      toast({
        title: 'Error',
        description: 'Failed to export user data',
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const getStatusBadge = (user: ExtendedProfile) => {
    if (user.account_status === 'suspended') {
      return <Badge variant="destructive">Suspended</Badge>;
    }
    if (user.account_status === 'inactive') {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    return <Badge variant="default">Active</Badge>;
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      'super_admin': 'destructive',
      'platform_admin': 'destructive',
      'moderator': 'default',
      'creator': 'secondary',
      'visitor': 'outline'
    };
    return <Badge variant={variants[role] || 'outline'}>{role.replace('_', ' ')}</Badge>;
  };

  if (!hasPermission('view_all_users')) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          You do not have permission to access user management.
        </AlertDescription>
      </Alert>
    );
  }

  // Calculate user stats
  const userStats = [
    {
      title: "Total Users",
      value: users.length,
      icon: Users,
      description: "All registered users"
    },
    {
      title: "Active Users",
      value: users.filter(u => u.account_status === 'active').length,
      icon: UserCheck,
      iconClassName: "text-success",
      description: "Currently active accounts"
    },
    {
      title: "Suspended Users", 
      value: users.filter(u => u.account_status === 'suspended').length,
      icon: UserX,
      iconClassName: "text-destructive",
      description: "Temporarily suspended"
    },
    {
      title: "Platform Admins",
      value: users.filter(u => u.role === 'platform_admin' || u.role === 'super_admin').length,
      icon: Shield,
      iconClassName: "text-warning",
      description: "Administrators"
    },
  ];

  return (
    <div className="section-hierarchy">
      {/* Enhanced Page Header */}
      <EnhancedPageHeader
        title="User Management"
        description="Manage platform users, roles, and permissions"
        actions={[
          {
            label: 'Refresh',
            onClick: fetchUsers,
            icon: RefreshCw,
            variant: 'outline',
            loading: loading
          },
          {
            label: 'Export',
            onClick: exportUsers,
            icon: Download,
            variant: 'outline'
          },
          ...(hasPermission('create_users') ? [{
            label: 'Add User',
            onClick: () => {
              toast({
                title: 'Feature Coming Soon',
                description: 'User creation interface will be available soon'
              });
            },
            icon: Plus,
            variant: 'default' as const
          }] : [])
        ]}
      />

      {/* Enhanced Stats */}
      <AdminStatsGrid stats={userStats} />

      {/* Filters */}
      <Card className="card-enhanced">
        <CardHeader>
          <CardTitle className="flex items-center caption-medium">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mobile-grid grid-cols-1 md:grid-cols-5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="pl-10 mobile-input-padding"
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
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.role}
              onValueChange={(value) => setFilters(prev => ({ ...prev, role: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="visitor">Visitor</SelectItem>
                <SelectItem value="creator">Creator</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
                <SelectItem value="platform_admin">Platform Admin</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.sortBy}
              onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Created Date</SelectItem>
                <SelectItem value="last_login_at">Last Login</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="campaign_count">Campaigns</SelectItem>
                <SelectItem value="total_funds_raised">Funds Raised</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.sortOrder}
              onValueChange={(value: 'asc' | 'desc') => setFilters(prev => ({ ...prev, sortOrder: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Descending</SelectItem>
                <SelectItem value="asc">Ascending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Users Table */}
      <div className="flex items-center mb-4">
        <Users className="mr-2 h-4 w-4" />
        <h2 className="text-lg font-semibold">Users ({users.length})</h2>
      </div>
      
      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        enableSelection={true}
        enableSorting={true}
        enableFiltering={true}
        enableColumnVisibility={true}
        enablePagination={true}
        searchPlaceholder="Search users..."
        emptyStateTitle="No users found"
        emptyStateDescription="No users match your current filters."
        density="comfortable"
        className="border rounded-lg"
      />

      {/* Optimistic Update Indicator */}
      <OptimisticUpdateIndicator
        state={optimisticUpdates.state}
        onRollback={optimisticUpdates.rollbackAction}
        onClearCompleted={optimisticUpdates.clearCompleted}
        onClearFailed={optimisticUpdates.clearFailed}
      />

      {/* User Details Dialog */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Complete information about the selected user
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedUser.avatar} alt={selectedUser.name} />
                  <AvatarFallback>{selectedUser.name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{selectedUser.name || 'Unnamed User'}</h3>
                  <p className="text-muted-foreground mb-2">{selectedUser.email}</p>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(selectedUser)}
                    {getRoleBadge(selectedUser.role)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Campaigns</label>
                  <p className="text-sm text-muted-foreground">{selectedUser.campaign_count}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Funds Raised</label>
                  <p className="text-sm text-muted-foreground">${selectedUser.total_funds_raised?.toLocaleString() || '0'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Followers</label>
                  <p className="text-sm text-muted-foreground">{selectedUser.follower_count}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Joined</label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedUser.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {selectedUser.user_roles && selectedUser.user_roles.length > 0 && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Roles</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedUser.user_roles.map((role, index) => (
                      <Badge key={index} variant="outline">
                        {role.role_name} ({role.context_type})
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}