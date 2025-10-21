/**
 * Role CRUD Processor
 * Handles role creation, updates, and permission management
 */
import { supabase } from '@/integrations/supabase/client';
import type { EventHandler, DomainEvent } from '../types';
import { eventIdempotency } from '../EventIdempotency';

export class RoleCreatedProcessor implements EventHandler {
  readonly eventType = 'admin.role.created';

  async handle(event: DomainEvent): Promise<void> {
    const shouldProcess = await eventIdempotency.shouldProcess(
      event.id,
      'RoleCreatedProcessor'
    );
    
    if (!shouldProcess) return;

    try {
      const { roleId, name, displayName, description, hierarchyLevel, isSystemRole } = event.payload;

      await supabase
        .from('roles')
        .insert({
          id: roleId,
          name,
          display_name: displayName,
          description,
          hierarchy_level: hierarchyLevel,
          is_system_role: isSystemRole,
        });

      console.log(`[RoleCRUD] Role created: ${name} (${roleId})`);
      await eventIdempotency.markComplete(event.id, 'RoleCreatedProcessor');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await eventIdempotency.markFailed(event.id, 'RoleCreatedProcessor', errorMessage);
      console.error('[RoleCRUD] Error creating role:', error);
      throw error;
    }
  }
}

export class RolePermissionsUpdatedProcessor implements EventHandler {
  readonly eventType = 'admin.role.permissions_updated';

  async handle(event: DomainEvent): Promise<void> {
    const shouldProcess = await eventIdempotency.shouldProcess(
      event.id,
      'RolePermissionsUpdatedProcessor'
    );
    
    if (!shouldProcess) return;

    try {
      const { roleId, addedPermissions, removedPermissions } = event.payload;

      // Remove old permissions (if any)
      if (removedPermissions.length > 0) {
        await supabase
          .from('role_permissions')
          .delete()
          .eq('role_id', roleId)
          .in('permission_id', removedPermissions);
      }

      // Add new permissions
      if (addedPermissions.length > 0) {
        const newPerms = addedPermissions.map((permId: string) => ({
          role_id: roleId,
          permission_id: permId,
        }));

        await supabase
          .from('role_permissions')
          .insert(newPerms);
      }

      console.log(`[RoleCRUD] Role permissions updated for ${roleId}: +${addedPermissions.length} -${removedPermissions.length}`);
      await eventIdempotency.markComplete(event.id, 'RolePermissionsUpdatedProcessor');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await eventIdempotency.markFailed(event.id, 'RolePermissionsUpdatedProcessor', errorMessage);
      console.error('[RoleCRUD] Error updating permissions:', error);
      throw error;
    }
  }
}
