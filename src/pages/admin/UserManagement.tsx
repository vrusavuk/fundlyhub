import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRBAC } from '@/contexts/RBACContext';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from '@/hooks/useDebounce';
import { usePagination } from '@/hooks/usePagination';
import { adminDataService } from '@/lib/services/AdminDataService';
import { Button } from '@/components/ui/button';
import { StripeBadgeExact } from '@/components/ui/stripe-badge-exact';
import { StripeStatusTabs, StatusTab } from '@/components/admin/StripeStatusTabs';
import { StripeInfoBanner } from '@/components/admin/StripeInfoBanner';
import { StripeActionButtons } from '@/components/admin/StripeActionButtons';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useEventSubscriber } from '@/hooks/useEventBus';
import { AdminEventService } from '@/lib/services/AdminEventService';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { CreateUserDialog } from '@/components/admin/CreateUserDialog';
import { UserDetailsDialog } from '@/components/admin/ViewDetailsDialog';
import { DensityToggle, Density } from '@/components/admin/DensityToggle';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Shield,
  AlertTriangle,
  Download,
  RefreshCw,
  Plus
} from 'lucide-react';
import { createUserColumns, UserData as UserColumnData } from '@/lib/data-table/user-columns';
import { useOptimisticUpdates, OptimisticUpdateIndicator } from '@/components/admin/OptimisticUpdates';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  AdminPageLayout, 
  AdminFilters, 
  AdminDataTable, 
  AdvancedSearch,
  BulkOperations,
  QuickActions,
  FilterConfig,
  BulkAction,
  TableAction,
  SearchFilter,
  ActiveFilter,
  BulkOperation,
  QuickAction 
} from '@/components/admin/unified';

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
}

export function UserManagement() {
  const { hasPermission, isSuperAdmin } = useRBAC();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [users, setUsers] = useState<ExtendedProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<ExtendedProfile | null>(null);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    open: boolean;
    title: string;
    description: string;
    action: () => void;
    variant?: 'default' | 'destructive';
  }>({ open: false, title: '', description: '', action: () => {}, variant: 'default' });
  
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    status: 'all',
    role: 'all'
  });
  const [selectedUsers, setSelectedUsers] = useState<ExtendedProfile[]>([]);
  const [density, setDensity] = useState<Density>('comfortable');
  
  // Pagination
  const pagination = usePagination({
    initialPageSize: 20,
    syncWithURL: true,
    onPageChange: () => fetchUsers()
  });
  
  // Debounce search to prevent excessive queries
  const debouncedSearch = useDebounce(filters.search, 500);

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
      navigate(`/admin/users/${user.id}`);
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

  const fetchUsers = useCallback(async () => {
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
        `, { count: 'exact' });

      // Apply search filter
      if (debouncedSearch.trim()) {
        query = query.or(`name.ilike.%${debouncedSearch}%,email.ilike.%${debouncedSearch}%`);
      }

      // Apply status filter
      if (filters.status !== 'all') {
        query = query.eq('account_status', filters.status);
      }

      // Apply role filter
      if (filters.role !== 'all') {
        query = query.eq('role', filters.role as any);
      }

      // Apply sorting and pagination
      query = query
        .order('created_at', { ascending: false })
        .range(0, 99); // Limit to 100 for now, will add pagination later

      const { data, error } = await query;

      if (error) throw error;

      setUsers(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load users',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filters.status, filters.role, toast]);

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
      const { data: user } = await supabase.auth.getUser();
      const currentUserId = user.user?.id;
      
      if (!currentUserId) throw new Error('User not authenticated');

      // Use AdminEventService which handles DB update + event publishing + audit log
      await AdminEventService.suspendUser(userId, currentUserId, reason, duration);

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
      const { data: user } = await supabase.auth.getUser();
      const currentUserId = user.user?.id;
      
      if (!currentUserId) throw new Error('User not authenticated');

      // Use AdminEventService which handles DB update + event publishing + audit log
      await AdminEventService.unsuspendUser(userId, currentUserId);

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

  // Subscribe to user events for real-time updates
  useEventSubscriber('admin.user.suspended', (event) => {
    console.log('[UserManagement] User suspended event:', event);
    fetchUsers();
  });

  useEventSubscriber('admin.user.unsuspended', (event) => {
    console.log('[UserManagement] User unsuspended event:', event);
    fetchUsers();
  });

  useEventSubscriber('user.profile_updated', (event) => {
    console.log('[UserManagement] User profile updated event:', event);
    fetchUsers();
  });

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
  }, [fetchUsers]);

  const getStatusBadge = (user: ExtendedProfile) => {
    if (user.account_status === 'suspended') {
      return <StripeBadgeExact variant="error">Suspended</StripeBadgeExact>;
    }
    if (user.account_status === 'inactive') {
      return <StripeBadgeExact variant="neutral">Inactive</StripeBadgeExact>;
    }
    return <StripeBadgeExact variant="success">Active</StripeBadgeExact>;
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, "success" | "neutral" | "error" | "warning" | "info"> = {
      'super_admin': 'error',
      'platform_admin': 'warning',
      'moderator': 'info',
      'creator': 'success',
      'visitor': 'neutral'
    };
    return <StripeBadgeExact variant={variants[role] || 'neutral'}>{role.replace('_', ' ')}</StripeBadgeExact>;
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

  // Define filter configuration
  const filterConfig: FilterConfig[] = [
    {
      key: 'search',
      label: 'Search',
      type: 'search',
      placeholder: 'Search users by name or email...'
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'suspended', label: 'Suspended' }
      ]
    },
    {
      key: 'role',
      label: 'Role', 
      type: 'select',
      options: [
        { value: 'visitor', label: 'Visitor' },
        { value: 'creator', label: 'Creator' },
        { value: 'moderator', label: 'Moderator' },
        { value: 'platform_admin', label: 'Platform Admin' },
        { value: 'super_admin', label: 'Super Admin' }
      ]
    }
  ];

  // Define table actions
  const tableActions: TableAction[] = [
    {
      key: 'refresh',
      label: 'Refresh',
      icon: RefreshCw,
      variant: 'outline',
      onClick: fetchUsers,
      loading: loading
    },
    {
      key: 'export',
      label: 'Export',
      icon: Download,
      variant: 'outline',
      onClick: exportUsers
    },
    {
      key: 'density',
      label: 'Density',
      customRender: () => (
        <DensityToggle value={density} onChange={setDensity} />
      )
    },
    ...(hasPermission('create_users') ? [{
      key: 'add',
      label: 'Add User',
      icon: Plus,
      variant: 'default' as const,
      onClick: () => setShowCreateDialog(true)
    }] : [])
  ];

  // Define bulk actions
  const bulkActions: BulkAction[] = [
    {
      key: 'suspend',
      label: 'Suspend Users',
      icon: UserX,
      variant: 'destructive',
      requiresConfirmation: true
    },
    {
      key: 'activate',
      label: 'Activate Users',
      icon: UserCheck,
      variant: 'default'
    },
    {
      key: 'export_selected',
      label: 'Export Selected',
      icon: Download,
      variant: 'outline'
    }
  ];

  // Handle bulk operations with confirmation
  const handleBulkAction = async (actionKey: string, selectedRows: ExtendedProfile[]) => {
    if (selectedRows.length === 0) return;

    const performBulkAction = async () => {
      try {
        const { data: user } = await supabase.auth.getUser();
        const currentUserId = user.user?.id;
        if (!currentUserId) throw new Error('User not authenticated');

        const userIds = selectedRows.map(u => u.id);

        switch (actionKey) {
          case 'suspend':
            await AdminEventService.bulkOperation(
              (userId: string) => AdminEventService.suspendUser(userId, currentUserId, 'Bulk suspension', 24),
              userIds
            );
            toast({
              title: 'Users Suspended',
              description: `Successfully suspended ${userIds.length} users`
            });
            break;
          case 'activate':
            const { error } = await supabase
              .from('profiles')
              .update({ account_status: 'active', suspended_until: null })
              .in('id', userIds);
            if (error) throw error;
            toast({
              title: 'Users Activated',
              description: `Successfully activated ${userIds.length} users`
            });
            break;
          case 'export_selected':
            exportUsers();
            return;
        }

        fetchUsers();
        setSelectedUsers([]);
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to perform bulk action',
          variant: 'destructive'
        });
      }
    };

    // Show confirmation for destructive actions
    if (actionKey === 'suspend') {
      setConfirmAction({
        open: true,
        title: 'Suspend Users',
        description: `Are you sure you want to suspend ${selectedRows.length} users? This action can be reversed.`,
        action: performBulkAction,
        variant: 'destructive'
      });
    } else {
      performBulkAction();
    }
  };

  // Status tabs configuration
  const statusTabs: StatusTab[] = [
    { key: 'all', label: 'All', count: users.length },
    { key: 'active', label: 'Active', count: users.filter(u => u.account_status === 'active').length, icon: UserCheck },
    { key: 'inactive', label: 'Inactive', count: users.filter(u => u.account_status === 'inactive').length },
    { key: 'suspended', label: 'Suspended', count: users.filter(u => u.account_status === 'suspended').length, icon: UserX },
  ];

  return (
    <AdminPageLayout
      title="User Management"
      description="Manage platform users, roles, and permissions"
    >
      <StripeStatusTabs
        tabs={statusTabs}
        activeTab={filters.status}
        onTabChange={(key) => setFilters(prev => ({ ...prev, status: key }))}
        className="mb-6"
      />

      <StripeInfoBanner
        variant="info"
        message="New role management features available! Granular permissions for better access control"
        actionLabel="Explore features"
        onAction={() => window.open('https://docs.lovable.dev', '_blank')}
        className="mb-6"
      />

      <AdminFilters
        filters={filterConfig}
        values={filters}
        onChange={(key, value) => setFilters(prev => ({ ...prev, [key]: value }))}
        onClear={() => setFilters({ search: '', status: 'all', role: 'all' })}
        className="mb-6"
      />
    
      <AdminDataTable
        columns={columns}
        data={users}
        loading={loading}
        selectedRows={selectedUsers}
        onSelectionChange={setSelectedUsers}
        onRowClick={(row) => viewUserDetails(row.original as ExtendedProfile)}
        actions={tableActions}
        bulkActions={bulkActions}
        onBulkAction={handleBulkAction}
        density={density}
        
        emptyStateTitle="No users found"
        emptyStateDescription="No users match your current filters. Try adjusting your search criteria."
        error={null}
        retry={fetchUsers}
        enableSelection={true}
        enableSorting={true}
        enableFiltering={false}
        enableColumnVisibility={true}
        enablePagination={true}
      />

      {/* Optimistic Update Indicator */}
      <OptimisticUpdateIndicator
        state={optimisticUpdates.state}
        onRollback={optimisticUpdates.rollbackAction}
        onClearCompleted={optimisticUpdates.clearCompleted}
        onClearFailed={optimisticUpdates.clearFailed}
      />

      {/* User Details Dialog */}
      <UserDetailsDialog
        user={selectedUser}
        open={showUserDialog}
        onOpenChange={setShowUserDialog}
      />

      {/* Create User Dialog */}
      <CreateUserDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={fetchUsers}
      />

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmAction.open}
        onOpenChange={(open) => setConfirmAction(prev => ({ ...prev, open }))}
        title={confirmAction.title}
        description={confirmAction.description}
        variant={confirmAction.variant}
        onConfirm={() => {
          confirmAction.action();
          setConfirmAction(prev => ({ ...prev, open: false }));
        }}
      />
    </AdminPageLayout>
  );
}