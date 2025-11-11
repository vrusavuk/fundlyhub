import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/services/logger.service';

export interface UserRole {
  role_name: string;
  context_type: string;
  context_id: string | null;
  hierarchy_level: number;
}

export interface RoleDefinition {
  name: string;
  hierarchy_level: number;
  context_type: string;
}

export interface RBACState {
  roles: UserRole[];
  permissions: string[];
  roleDefinitions: RoleDefinition[];
  loading: boolean;
  error: string | null;
  activeContext: {
    type: 'global' | 'organization' | 'campaign';
    id?: string;
  };
}

export interface RBACActions {
  hasPermission: (permission: string, contextType?: string, contextId?: string) => boolean;
  hasRole: (roleName: string, contextType?: string, contextId?: string) => boolean;
  hasRoleOrHigher: (roleName: string, contextType?: string, contextId?: string) => boolean;
  getHighestRole: () => UserRole | null;
  switchContext: (contextType: string, contextId?: string) => void;
  refreshRBAC: () => Promise<void>;
  isSuperAdmin: () => boolean;
  isPlatformAdmin: () => boolean;
  canAccessAdmin: () => boolean;
}

export function useRBAC(): RBACState & RBACActions {
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<RBACState>({
    roles: [],
    permissions: [],
    roleDefinitions: [],
    loading: true,
    error: null,
    activeContext: { type: 'global' }
  });

  const fetchUserRoles = useCallback(async (userId: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Fetch role definitions for hierarchy checking
      const { data: roleDefsData, error: roleDefsError } = await supabase
        .from('roles')
        .select('name, hierarchy_level');

      if (roleDefsError) throw roleDefsError;

      // Transform to include context_type (all roles are global)
      const roleDefinitions = roleDefsData?.map(role => ({
        ...role,
        context_type: 'global'
      })) || [];

      // Get user roles using the database function
      const { data: rolesData, error: rolesError } = await supabase
        .rpc('get_user_roles', { 
          _user_id: userId,
          _context_type: 'all'
        });

      if (rolesError) throw rolesError;

      // Get user permissions using a simpler query approach
      const { data: userRoleAssignments, error: assignmentsError } = await supabase
        .from('user_role_assignments')
        .select('role_id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

      if (assignmentsError) throw assignmentsError;

      // Get permissions for all user's roles
      const roleIds = userRoleAssignments?.map(assignment => assignment.role_id) || [];
      
      if (roleIds.length > 0) {
        const { data: permissionsData, error: permissionsError } = await supabase
          .from('role_permissions')
          .select('permissions(name)')
          .in('role_id', roleIds);

        if (permissionsError) throw permissionsError;

        const permissions = permissionsData
          ?.map(rp => rp.permissions?.name)
          .filter((perm): perm is string => Boolean(perm)) || [];

        setState(prev => ({
          ...prev,
          roles: rolesData || [],
          permissions: [...new Set(permissions)],
          roleDefinitions,
          loading: false
        }));
      } else {
        setState(prev => ({
          ...prev,
          roles: rolesData || [],
          permissions: [],
          roleDefinitions,
          loading: false
        }));
      }
    } catch (error) {
      logger.error(
        'Error fetching RBAC data',
        error instanceof Error ? error : new Error(String(error)),
        {
          componentName: 'useRBAC',
          operationName: 'fetchUserRoles'
        }
      );
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load permissions',
        loading: false
      }));
    }
  }, []);

  const refreshRBAC = useCallback(async () => {
    if (user?.id) {
      await fetchUserRoles(user.id);
    }
  }, [user?.id, fetchUserRoles]);

  // Initial load
  useEffect(() => {
    if (user?.id && !authLoading) {
      fetchUserRoles(user.id);
    } else if (!user && !authLoading) {
      setState(prev => ({
        ...prev,
        roles: [],
        permissions: [],
        loading: false
      }));
    }
  }, [user?.id, authLoading, fetchUserRoles]);

  const hasPermission = useCallback((
    permission: string, 
    contextType: string = 'global', 
    contextId?: string
  ): boolean => {
    if (state.loading || !user) return false;

    // Super admins have all permissions
    if (state.permissions.includes('super_admin_access')) return true;

    // Check if user has the specific permission
    if (!state.permissions.includes(permission)) return false;

    // If checking global permission, allow it
    if (contextType === 'global') return true;

    // For context-specific permissions, check if user has role in that context
    return state.roles.some(role => 
      role.context_type === 'global' || 
      (role.context_type === contextType && role.context_id === contextId)
    );
  }, [state.loading, state.permissions, state.roles, user]);

  const hasRole = useCallback((
    roleName: string, 
    contextType: string = 'global', 
    contextId?: string
  ): boolean => {
    if (state.loading) return false;

    return state.roles.some(role => 
      role.role_name === roleName &&
      (role.context_type === 'global' || 
       (role.context_type === contextType && role.context_id === contextId))
    );
  }, [state.loading, state.roles]);

  const hasRoleOrHigher = useCallback((
    roleName: string, 
    contextType: string = 'global', 
    contextId?: string
  ): boolean => {
    if (state.loading) return false;

    // Super admin bypass - they have all roles by hierarchy
    if (state.permissions.includes('super_admin_access')) {
      return true;
    }

    // Get the required role's hierarchy level
    const requiredRole = state.roleDefinitions.find(r => r.name === roleName);
    if (!requiredRole) {
      // If role definition not found, fall back to exact match
      return hasRole(roleName, contextType, contextId);
    }

    // Check if user has this role OR a higher hierarchy role in the same context
    return state.roles.some(userRole => {
      // Check context match
      const contextMatches = userRole.context_type === 'global' || 
                            (userRole.context_type === contextType && userRole.context_id === contextId);
      
      if (!contextMatches) return false;

      // Check if user's role is same or higher in hierarchy
      return userRole.hierarchy_level >= requiredRole.hierarchy_level;
    });
  }, [state.loading, state.roles, state.roleDefinitions, state.permissions, hasRole]);

  const getHighestRole = useCallback((): UserRole | null => {
    if (state.roles.length === 0) return null;
    
    return state.roles.reduce((highest, current) => 
      current.hierarchy_level > highest.hierarchy_level ? current : highest
    );
  }, [state.roles]);

  const switchContext = useCallback((contextType: string, contextId?: string) => {
    setState(prev => ({
      ...prev,
      activeContext: {
        type: contextType as 'global' | 'organization' | 'campaign',
        id: contextId
      }
    }));
  }, []);

  const isSuperAdmin = useCallback((): boolean => {
    return hasPermission('super_admin_access');
  }, [hasPermission]);

  const isPlatformAdmin = useCallback((): boolean => {
    return hasRole('platform_admin') || isSuperAdmin();
  }, [hasRole, isSuperAdmin]);

  const canAccessAdmin = useCallback((): boolean => {
    return hasPermission('view_all_users') || 
           hasPermission('view_all_campaigns') || 
           hasPermission('view_platform_analytics') ||
           isSuperAdmin() ||
           isPlatformAdmin();
  }, [hasPermission, isSuperAdmin, isPlatformAdmin]);

  return {
    ...state,
    loading: state.loading || authLoading,
    hasPermission,
    hasRole,
    hasRoleOrHigher,
    getHighestRole,
    switchContext,
    refreshRBAC,
    isSuperAdmin,
    isPlatformAdmin,
    canAccessAdmin
  };
}