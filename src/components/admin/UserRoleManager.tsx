/**
 * User Role Manager Component
 * Allows super admins to assign and revoke roles for users
 */
import React, { useState, useEffect } from 'react';
import { Shield, Plus, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useRBAC } from '@/contexts/RBACContext';
import { useEventPublisher } from '@/hooks/useEventBus';
import { createUserRoleAssignedEvent, createUserRoleRevokedEvent } from '@/lib/events/domain/AdminEvents';
import { adminDataService } from '@/lib/services/AdminDataService';
import { ConfirmActionDialog } from './dialogs/ConfirmActionDialog';
import { useIsMobile } from '@/hooks/use-mobile';

interface UserRole {
  id: string;
  role_id: string;
  role_name: string;
  display_name: string;
  hierarchy_level: number;
  is_system_role: boolean;
  assigned_at: string;
  context_type?: string;
  context_id?: string;
}

interface AssignableRole {
  id: string;
  name: string;
  display_name: string;
  hierarchy_level: number;
  is_system_role: boolean;
}

interface UserRoleManagerProps {
  userId: string;
  userName?: string;
  onRolesChange?: () => void;
}

export function UserRoleManager({ userId, userName, onRolesChange }: UserRoleManagerProps) {
  const { user } = useAuth();
  const { isSuperAdmin, getHighestRole } = useRBAC();
  const { publish } = useEventPublisher();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [assignableRoles, setAssignableRoles] = useState<AssignableRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [assigning, setAssigning] = useState(false);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [roleToRevoke, setRoleToRevoke] = useState<UserRole | null>(null);
  const [revoking, setRevoking] = useState(false);

  const canManageRoles = isSuperAdmin();
  const adminHighestRole = getHighestRole();
  const adminHierarchyLevel = adminHighestRole?.hierarchy_level ?? 0;

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rolesData, assignableData] = await Promise.all([
        adminDataService.fetchUserRoleAssignments(userId),
        adminDataService.fetchAssignableRoles(adminHierarchyLevel)
      ]);
      
      setUserRoles(rolesData);
      
      // Filter out already assigned roles
      const assignedRoleIds = new Set(rolesData.map(r => r.role_id));
      const available = assignableData.filter(r => !assignedRoleIds.has(r.id));
      setAssignableRoles(available);
    } catch (error) {
      console.error('Failed to fetch role data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load role data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRole = async () => {
    if (!selectedRoleId || !user) return;

    // Security: Prevent self-elevation 
    if (userId === user.id) {
      toast({
        title: 'Not Allowed',
        description: 'You cannot assign roles to yourself',
        variant: 'destructive',
      });
      return;
    }

    setAssigning(true);
    try {
      const role = assignableRoles.find(r => r.id === selectedRoleId);
      if (!role) throw new Error('Role not found');

      // Security: Verify hierarchy level client-side (server also validates)
      if (role.hierarchy_level > adminHierarchyLevel && !isSuperAdmin()) {
        throw new Error('Cannot assign role with higher hierarchy level');
      }

      const event = createUserRoleAssignedEvent({
        userId,
        roleId: selectedRoleId,
        roleName: role.name,
        assignedBy: user.id,
      });

      await publish(event);

      toast({
        title: 'Role Assigned',
        description: `${role.display_name} has been assigned to ${userName || 'user'}`,
      });

      setAssignDialogOpen(false);
      setSelectedRoleId('');
      
      // Refresh data after a short delay for event processing
      setTimeout(() => {
        fetchData();
        onRolesChange?.();
      }, 500);
    } catch (error) {
      console.error('Failed to assign role:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to assign role',
        variant: 'destructive',
      });
    } finally {
      setAssigning(false);
    }
  };

  const handleRevokeRole = async () => {
    if (!roleToRevoke || !user) return;

    // Security: Prevent revoking your own super_admin role
    if (userId === user.id && roleToRevoke.role_name === 'super_admin') {
      toast({
        title: 'Not Allowed',
        description: 'You cannot revoke your own super_admin role',
        variant: 'destructive',
      });
      setRevokeDialogOpen(false);
      setRoleToRevoke(null);
      return;
    }

    // Security: Verify hierarchy level client-side (server also validates)
    if (roleToRevoke.hierarchy_level > adminHierarchyLevel && !isSuperAdmin()) {
      toast({
        title: 'Not Allowed',
        description: 'Cannot revoke role with higher hierarchy level',
        variant: 'destructive',
      });
      setRevokeDialogOpen(false);
      setRoleToRevoke(null);
      return;
    }

    setRevoking(true);
    try {
      const event = createUserRoleRevokedEvent({
        userId,
        roleId: roleToRevoke.role_id,
        roleName: roleToRevoke.role_name,
        revokedBy: user.id,
      });

      await publish(event);

      toast({
        title: 'Role Revoked',
        description: `${roleToRevoke.display_name} has been revoked from ${userName || 'user'}`,
      });

      setRevokeDialogOpen(false);
      setRoleToRevoke(null);
      
      // Refresh data after a short delay for event processing
      setTimeout(() => {
        fetchData();
        onRolesChange?.();
      }, 500);
    } catch (error) {
      console.error('Failed to revoke role:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to revoke role',
        variant: 'destructive',
      });
    } finally {
      setRevoking(false);
    }
  };

  const getHierarchyBadgeVariant = (level: number) => {
    if (level >= 90) return 'destructive';
    if (level >= 70) return 'default';
    if (level >= 50) return 'secondary';
    return 'outline';
  };

  if (!canManageRoles) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Assigned Roles
        </h3>
        
        <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" disabled={loading || assignableRoles.length === 0}>
              <Plus className="h-4 w-4 mr-1" />
              Assign Role
            </Button>
          </DialogTrigger>
          <DialogContent className={isMobile ? "max-w-[95vw]" : ""}>
            <DialogHeader>
              <DialogTitle>Assign Role</DialogTitle>
              <DialogDescription>
                Select a role to assign to {userName || 'this user'}. You can only assign roles at or below your hierarchy level.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role..." />
                </SelectTrigger>
                <SelectContent>
                  {assignableRoles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      <div className="flex items-center gap-2">
                        <span>{role.display_name}</span>
                        <Badge variant={getHierarchyBadgeVariant(role.hierarchy_level)} className="text-[10px]">
                          Level {role.hierarchy_level}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAssignRole} 
                disabled={!selectedRoleId || assigning}
              >
                {assigning && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Assign Role
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : userRoles.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">No roles assigned</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {userRoles.map((role) => (
            <Badge 
              key={role.id} 
              variant={getHierarchyBadgeVariant(role.hierarchy_level)}
              className="flex items-center gap-1 pr-1"
            >
              <span>{role.display_name}</span>
              {!role.is_system_role && (
                <button
                  onClick={() => {
                    setRoleToRevoke(role);
                    setRevokeDialogOpen(true);
                  }}
                  className="ml-1 rounded-full p-0.5 hover:bg-background/20 transition-colors"
                  title="Revoke role"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}

      {/* Revoke Confirmation Dialog */}
      <ConfirmActionDialog
        open={revokeDialogOpen}
        onOpenChange={setRevokeDialogOpen}
        title="Revoke Role"
        description={`Are you sure you want to revoke the "${roleToRevoke?.display_name}" role from ${userName || 'this user'}? This action can be undone by reassigning the role.`}
        confirmLabel="Revoke Role"
        variant="destructive"
        isLoading={revoking}
        onConfirm={handleRevokeRole}
      />
    </div>
  );
}
