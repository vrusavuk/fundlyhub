/**
 * useRoles Hook
 * Single source of truth for role definitions fetched from the database
 * Replaces all hardcoded role arrays throughout the application
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RoleDefinition {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  hierarchy_level: number;
  is_system_role: boolean;
}

/**
 * Fetch all roles from the database - the single source of truth
 */
async function fetchRoles(): Promise<RoleDefinition[]> {
  const { data, error } = await supabase
    .from('roles')
    .select('id, name, display_name, description, hierarchy_level, is_system_role')
    .order('hierarchy_level', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Hook to access role definitions from the database
 */
export function useRoles() {
  const { data: roles = [], isLoading, error } = useQuery({
    queryKey: ['roles-definitions'],
    queryFn: fetchRoles,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  /**
   * Get badge variant based on hierarchy level (not hardcoded role names)
   */
  const getHierarchyBadgeVariant = (hierarchyLevel: number): "success" | "neutral" | "error" | "warning" | "info" => {
    if (hierarchyLevel >= 90) return 'error';      // Super admin level
    if (hierarchyLevel >= 70) return 'warning';    // Platform admin level
    if (hierarchyLevel >= 50) return 'info';       // Moderator level
    if (hierarchyLevel >= 30) return 'success';    // Creator level
    return 'neutral';                               // Visitor/default
  };

  /**
   * Get badge variant for a role by name (looks up hierarchy)
   */
  const getRoleBadgeVariant = (roleName: string): "success" | "neutral" | "error" | "warning" | "info" => {
    const role = roles.find(r => r.name === roleName);
    if (!role) return 'neutral';
    return getHierarchyBadgeVariant(role.hierarchy_level);
  };

  /**
   * Format role name for display
   */
  const formatRoleName = (roleName: string): string => {
    const role = roles.find(r => r.name === roleName);
    return role?.display_name || roleName.replace(/_/g, ' ');
  };

  /**
   * Get roles as filter options for dropdowns
   */
  const getRoleFilterOptions = () => {
    return roles.map(role => ({
      value: role.name,
      label: role.display_name,
    }));
  };

  /**
   * Get roles that can be assigned (excludes super_admin for non-super-admins)
   */
  const getAssignableRoles = (maxHierarchyLevel: number, includeSuperAdmin: boolean = false) => {
    return roles.filter(role => {
      if (!includeSuperAdmin && role.hierarchy_level >= 100) return false;
      return role.hierarchy_level <= maxHierarchyLevel;
    });
  };

  /**
   * Check if a role name represents a high-privilege role
   */
  const isHighPrivilegeRole = (hierarchyLevel: number): boolean => {
    return hierarchyLevel >= 70; // Platform admin and above
  };

  return {
    roles,
    isLoading,
    error,
    getHierarchyBadgeVariant,
    getRoleBadgeVariant,
    formatRoleName,
    getRoleFilterOptions,
    getAssignableRoles,
    isHighPrivilegeRole,
  };
}
