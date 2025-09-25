import { useState, useEffect } from 'react';
import { useRBAC } from '@/hooks/useRBAC';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Shield, 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Key,
  AlertTriangle,
  Save,
  X
} from 'lucide-react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useIsMobile } from '@/hooks/use-mobile';

interface Role {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  hierarchy_level: number;
  is_system_role: boolean;
  created_at: string;
  updated_at: string;
  user_count?: number;
  permissions?: Permission[];
}

interface Permission {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  category: string;
  created_at: string;
}

interface RolePermission {
  role_id: string;
  permission_id: string;
}

export function RoleManagement() {
  const { hasPermission, isSuperAdmin } = useRBAC();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<Partial<Role>>({});
  const [editingPermission, setEditingPermission] = useState<Partial<Permission>>({});

  const fetchRolesAndPermissions = async () => {
    try {
      setLoading(true);

      // Fetch roles with user counts
      const { data: rolesData, error: rolesError } = await supabase
        .from('roles')
        .select(`
          *,
          user_role_assignments!inner(count)
        `)
        .order('hierarchy_level', { ascending: false });

      if (rolesError) throw rolesError;

      // Fetch permissions
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('permissions')
        .select('*')
        .order('category', { ascending: true });

      if (permissionsError) throw permissionsError;

      // Fetch role-permission mappings
      const { data: mappingsData, error: mappingsError } = await supabase
        .from('role_permissions')
        .select('role_id, permission_id');

      if (mappingsError) throw mappingsError;

      // Count users for each role
      const rolesWithCounts = await Promise.all(
        (rolesData || []).map(async (role) => {
          const { count, error } = await supabase
            .from('user_role_assignments')
            .select('*', { count: 'exact', head: true })
            .eq('role_id', role.id)
            .eq('is_active', true);

          return {
            ...role,
            user_count: count || 0
          };
        })
      );

      setRoles(rolesWithCounts);
      setPermissions(permissionsData || []);
      setRolePermissions(mappingsData || []);
    } catch (error) {
      console.error('Error fetching roles and permissions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load roles and permissions',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const createRole = async () => {
    try {
      const { data, error } = await supabase
        .from('roles')
        .insert([{
          name: editingRole.name,
          display_name: editingRole.display_name,
          description: editingRole.description,
          hierarchy_level: editingRole.hierarchy_level || 0,
          is_system_role: false
        }])
        .select()
        .single();

      if (error) throw error;

      // Log the action
      await supabase.rpc('log_audit_event', {
        _actor_id: (await supabase.auth.getUser()).data.user?.id,
        _action: 'role_created',
        _resource_type: 'role',
        _resource_id: data.id,
        _metadata: { role_name: data.name }
      });

      toast({
        title: 'Success',
        description: 'Role created successfully'
      });

      setShowRoleDialog(false);
      setEditingRole({});
      fetchRolesAndPermissions();
    } catch (error) {
      console.error('Error creating role:', error);
      toast({
        title: 'Error',
        description: 'Failed to create role',
        variant: 'destructive'
      });
    }
  };

  const updateRole = async () => {
    if (!selectedRole) return;

    try {
      const { data, error } = await supabase
        .from('roles')
        .update({
          display_name: editingRole.display_name,
          description: editingRole.description,
          hierarchy_level: editingRole.hierarchy_level
        })
        .eq('id', selectedRole.id)
        .select()
        .single();

      if (error) throw error;

      // Log the action
      await supabase.rpc('log_audit_event', {
        _actor_id: (await supabase.auth.getUser()).data.user?.id,
        _action: 'role_updated',
        _resource_type: 'role',
        _resource_id: data.id,
        _metadata: { role_name: data.name }
      });

      toast({
        title: 'Success',
        description: 'Role updated successfully'
      });

      setShowRoleDialog(false);
      setEditingRole({});
      setSelectedRole(null);
      fetchRolesAndPermissions();
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update role',
        variant: 'destructive'
      });
    }
  };

  const deleteRole = async (roleId: string) => {
    try {
      // Check if role has active assignments
      const { count } = await supabase
        .from('user_role_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('role_id', roleId)
        .eq('is_active', true);

      if (count && count > 0) {
        toast({
          title: 'Cannot Delete Role',
          description: 'This role has active user assignments. Please remove all assignments first.',
          variant: 'destructive'
        });
        return;
      }

      const { error } = await supabase
        .from('roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;

      // Log the action
      await supabase.rpc('log_audit_event', {
        _actor_id: (await supabase.auth.getUser()).data.user?.id,
        _action: 'role_deleted',
        _resource_type: 'role',
        _resource_id: roleId
      });

      toast({
        title: 'Success',
        description: 'Role deleted successfully'
      });

      fetchRolesAndPermissions();
    } catch (error) {
      console.error('Error deleting role:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete role',
        variant: 'destructive'
      });
    }
  };

  const updateRolePermissions = async (roleId: string, permissionIds: string[]) => {
    try {
      // Remove existing permissions
      await supabase
        .from('role_permissions')
        .delete()
        .eq('role_id', roleId);

      // Add new permissions
      if (permissionIds.length > 0) {
        const newPermissions = permissionIds.map(permissionId => ({
          role_id: roleId,
          permission_id: permissionId
        }));

        const { error } = await supabase
          .from('role_permissions')
          .insert(newPermissions);

        if (error) throw error;
      }

      // Log the action
      await supabase.rpc('log_audit_event', {
        _actor_id: (await supabase.auth.getUser()).data.user?.id,
        _action: 'role_permissions_updated',
        _resource_type: 'role',
        _resource_id: roleId,
        _metadata: { permission_count: permissionIds.length }
      });

      toast({
        title: 'Success',
        description: 'Role permissions updated successfully'
      });

      fetchRolesAndPermissions();
    } catch (error) {
      console.error('Error updating role permissions:', error);
      toast({
        title: 'Error',
        description: 'Failed to update role permissions',
        variant: 'destructive'
      });
    }
  };

  const getRolePermissions = (roleId: string): string[] => {
    return rolePermissions
      .filter(rp => rp.role_id === roleId)
      .map(rp => rp.permission_id);
  };

  const getPermissionsByCategory = () => {
    const grouped = permissions.reduce((acc, permission) => {
      if (!acc[permission.category]) {
        acc[permission.category] = [];
      }
      acc[permission.category].push(permission);
      return acc;
    }, {} as Record<string, Permission[]>);

    return grouped;
  };

  useEffect(() => {
    fetchRolesAndPermissions();
  }, []);

  if (!hasPermission('manage_roles')) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          You do not have permission to access role management.
        </AlertDescription>
      </Alert>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Role Management</h1>
          <p className="text-muted-foreground">
            Manage platform roles and permissions
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Dialog open={showPermissionDialog} onOpenChange={setShowPermissionDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Key className="mr-2 h-4 w-4" />
                Manage Permissions
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Permission Management</DialogTitle>
                <DialogDescription>
                  View and manage system permissions by category
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                {Object.entries(getPermissionsByCategory()).map(([category, categoryPermissions]) => (
                  <div key={category}>
                    <h3 className="text-lg font-semibold mb-3 capitalize">{category}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {categoryPermissions.map((permission) => (
                        <div key={permission.id} className="p-3 border rounded-lg">
                          <div className="font-medium">{permission.display_name}</div>
                          <div className="text-sm text-muted-foreground">{permission.name}</div>
                          {permission.description && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {permission.description}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => {
                  setSelectedRole(null);
                  setEditingRole({});
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Role
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {selectedRole ? 'Edit Role' : 'Create New Role'}
                </DialogTitle>
                <DialogDescription>
                  {selectedRole ? 'Update role details and permissions' : 'Create a new role with specific permissions'}
                </DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="details">Role Details</TabsTrigger>
                  <TabsTrigger value="permissions">Permissions</TabsTrigger>
                </TabsList>
                
                <TabsContent value="details" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Role Name</Label>
                      <Input
                        id="name"
                        value={editingRole.name || ''}
                        onChange={(e) => setEditingRole(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., content_moderator"
                        disabled={selectedRole?.is_system_role}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="display_name">Display Name</Label>
                      <Input
                        id="display_name"
                        value={editingRole.display_name || ''}
                        onChange={(e) => setEditingRole(prev => ({ ...prev, display_name: e.target.value }))}
                        placeholder="e.g., Content Moderator"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={editingRole.description || ''}
                        onChange={(e) => setEditingRole(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Role description..."
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="hierarchy_level">Hierarchy Level</Label>
                      <Input
                        id="hierarchy_level"
                        type="number"
                        value={editingRole.hierarchy_level || 0}
                        onChange={(e) => setEditingRole(prev => ({ ...prev, hierarchy_level: parseInt(e.target.value) }))}
                        placeholder="0"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Higher numbers indicate higher authority
                      </p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="permissions" className="space-y-4">
                  {selectedRole && (
                    <RolePermissionsEditor
                      role={selectedRole}
                      permissions={permissions}
                      currentPermissions={getRolePermissions(selectedRole.id)}
                      onUpdate={(permissionIds) => updateRolePermissions(selectedRole.id, permissionIds)}
                    />
                  )}
                </TabsContent>
              </Tabs>
              
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowRoleDialog(false);
                    setEditingRole({});
                    setSelectedRole(null);
                  }}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button onClick={selectedRole ? updateRole : createRole}>
                  <Save className="mr-2 h-4 w-4" />
                  {selectedRole ? 'Update' : 'Create'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Roles Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="mr-2 h-4 w-4" />
            Platform Roles
          </CardTitle>
          <CardDescription>
            Manage roles and their associated permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Hierarchy</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{role.display_name}</div>
                      <div className="text-sm text-muted-foreground">{role.name}</div>
                      {role.description && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {role.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      <Users className="mr-1 h-3 w-3" />
                      {role.user_count || 0}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getRolePermissions(role.id).length} permissions
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={role.hierarchy_level > 50 ? 'destructive' : 'default'}>
                      Level {role.hierarchy_level}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedRole(role);
                          setEditingRole(role);
                          setShowRoleDialog(true);
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      {!role.is_system_role && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteRole(role.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

interface RolePermissionsEditorProps {
  role: Role;
  permissions: Permission[];
  currentPermissions: string[];
  onUpdate: (permissionIds: string[]) => void;
}

function RolePermissionsEditor({ 
  role, 
  permissions, 
  currentPermissions, 
  onUpdate 
}: RolePermissionsEditorProps) {
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(currentPermissions);

  const handlePermissionToggle = (permissionId: string, checked: boolean) => {
    if (checked) {
      setSelectedPermissions(prev => [...prev, permissionId]);
    } else {
      setSelectedPermissions(prev => prev.filter(id => id !== permissionId));
    }
  };

  const handleSave = () => {
    onUpdate(selectedPermissions);
  };

  const getPermissionsByCategory = () => {
    return permissions.reduce((acc, permission) => {
      if (!acc[permission.category]) {
        acc[permission.category] = [];
      }
      acc[permission.category].push(permission);
      return acc;
    }, {} as Record<string, Permission[]>);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Permissions for {role.display_name}</h4>
        <Button onClick={handleSave} size="sm">
          Save Changes
        </Button>
      </div>
      
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {Object.entries(getPermissionsByCategory()).map(([category, categoryPermissions]) => (
          <div key={category}>
            <h5 className="text-sm font-medium mb-2 capitalize">{category}</h5>
            <div className="space-y-2 pl-4">
              {categoryPermissions.map((permission) => (
                <div key={permission.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={permission.id}
                    checked={selectedPermissions.includes(permission.id)}
                    onCheckedChange={(checked) => 
                      handlePermissionToggle(permission.id, checked as boolean)
                    }
                  />
                  <Label htmlFor={permission.id} className="text-sm">
                    {permission.display_name}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}