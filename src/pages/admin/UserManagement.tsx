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
  Download
} from 'lucide-react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DataTable } from '@/components/ui/data-table';
import { createUserColumns, UserData as UserColumnData } from '@/lib/data-table/user-columns';

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
    // onViewDetails
    (user) => {
      viewUserDetails(user);
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
      canManageUsers: hasPermission('manage_users'),
      canViewDetails: hasPermission('view_user_details'),
      isSuperAdmin: isSuperAdmin(),
    }
  );

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

  return (
    <div className="section-hierarchy">
      {/* Header */}
      <div className="flex items-center justify-between mobile-header-spacing">
        <div className="content-hierarchy">
          <h1 className="heading-large tracking-tight">User Management</h1>
          <p className="body-medium text-muted-foreground">
            Manage platform users, roles, and permissions
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={exportUsers} variant="outline" className="shadow-soft">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          {hasPermission('create_users') && (
            <Button className="cta-primary shadow-medium">
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          )}
        </div>
      </div>

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

      {/* Users Table */}
      <Card className="card-enhanced">
        <CardHeader>
          <CardTitle className="flex items-center caption-medium">
            <Users className="mr-2 h-4 w-4" />
            Users ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
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
            pageSizeOptions={[25, 50, 100]}
          />
        </CardContent>
      </Card>

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
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="roles">Roles</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>
              
              <TabsContent value="profile" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Name</label>
                    <p className="text-sm text-muted-foreground">{selectedUser.name || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Account Status</label>
                    <p className="text-sm">{getStatusBadge(selectedUser)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Role</label>
                    <p className="text-sm">{getRoleBadge(selectedUser.role)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Campaigns Created</label>
                    <p className="text-sm text-muted-foreground">{selectedUser.campaign_count}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Total Funds Raised</label>
                    <p className="text-sm text-muted-foreground">${selectedUser.total_funds_raised.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Followers</label>
                    <p className="text-sm text-muted-foreground">{selectedUser.follower_count}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Member Since</label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedUser.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="roles" className="space-y-4">
                {selectedUser.user_roles && selectedUser.user_roles.length > 0 ? (
                  <div className="space-y-2">
                    {selectedUser.user_roles.map((role, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <div className="font-medium">{role.role_name}</div>
                          <div className="text-sm text-muted-foreground">
                            Context: {role.context_type} | Level: {role.hierarchy_level}
                          </div>
                        </div>
                        <Badge variant="outline">{role.role_name}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No additional roles assigned</p>
                )}
              </TabsContent>
              
              <TabsContent value="activity" className="space-y-4">
                <p className="text-muted-foreground">Activity log would be implemented here</p>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}