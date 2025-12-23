/**
 * Role CRUD Processor
 * Handles role creation, updates, and permission management
 */
import { supabase } from '@/integrations/supabase/client';
import type { EventHandler, DomainEvent } from '../types';
import { eventIdempotency } from '../EventIdempotency';
import { logger } from '@/lib/services/logger.service';

export class RoleCreatedProcessor implements EventHandler {
  readonly eventType = 'admin.role.created';

  async handle(event: DomainEvent): Promise<void> {
    const shouldProcess = await eventIdempotency.shouldProcess(
      event.id,
      'RoleCreatedProcessor'
    );
    
    if (!shouldProcess) return;

    const ctx = { componentName: 'RoleCRUDProcessor', operationName: 'RoleCreatedProcessor' };

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

      logger.info(`Role created: ${name}`, { ...ctx, metadata: { roleId, name } });
      await eventIdempotency.markComplete(event.id, 'RoleCreatedProcessor');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await eventIdempotency.markFailed(event.id, 'RoleCreatedProcessor', errorMessage);
      logger.error('Error creating role', error as Error, ctx);
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

    const ctx = { componentName: 'RoleCRUDProcessor', operationName: 'RolePermissionsUpdatedProcessor' };

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

      logger.info(`Role permissions updated`, { ...ctx, metadata: { roleId, added: addedPermissions.length, removed: removedPermissions.length } });
      await eventIdempotency.markComplete(event.id, 'RolePermissionsUpdatedProcessor');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await eventIdempotency.markFailed(event.id, 'RolePermissionsUpdatedProcessor', errorMessage);
      logger.error('Error updating permissions', error as Error, ctx);
      throw error;
    }
  }
}
