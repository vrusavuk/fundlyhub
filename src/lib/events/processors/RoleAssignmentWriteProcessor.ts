/**
 * Role Assignment Write Processor
 * Handles actual database writes for role assignments
 * 
 * Security considerations:
 * - Validates hierarchy levels (admins can only assign roles at or below their level)
 * - Prevents self-assignment of higher roles
 * - Logs all role changes to audit_logs
 * - Uses idempotency to prevent duplicate processing
 */
import { supabase } from '@/integrations/supabase/client';
import type { EventHandler } from '../types';
import type { UserRoleAssignedEvent } from '../domain/AdminEvents';
import { eventIdempotency } from '../EventIdempotency';
import { z } from 'zod';

// Validate UUIDs to prevent injection
const uuidSchema = z.string().uuid();

export class RoleAssignmentWriteProcessor implements EventHandler {
  readonly eventType = 'admin.user.role_assigned';

  async handle(event: UserRoleAssignedEvent): Promise<void> {
    const shouldProcess = await eventIdempotency.shouldProcess(
      event.id,
      'RoleAssignmentWriteProcessor'
    );
    
    if (!shouldProcess) return;

    try {
      const { userId, roleId, assignedBy, contextType, contextId, roleName } = event.payload;

      // Validate UUIDs
      uuidSchema.parse(userId);
      uuidSchema.parse(roleId);
      uuidSchema.parse(assignedBy);
      if (contextId) uuidSchema.parse(contextId);

      // Security: Verify the assigning user has permission to assign this role
      const { data: assignerRoles, error: assignerError } = await supabase
        .from('user_role_assignments')
        .select(`
          role_id,
          roles!inner(hierarchy_level, name)
        `)
        .eq('user_id', assignedBy)
        .eq('is_active', true);

      if (assignerError) throw assignerError;

      // Get the highest hierarchy level of the assigner
      const assignerMaxLevel = Math.max(
        ...((assignerRoles || []).map((r: any) => r.roles?.hierarchy_level || 0)),
        0
      );

      // Get the role being assigned
      const { data: targetRole, error: targetRoleError } = await supabase
        .from('roles')
        .select('hierarchy_level, name')
        .eq('id', roleId)
        .single();

      if (targetRoleError || !targetRole) {
        throw new Error('Target role not found');
      }

      // Security: Check if assigner has highest hierarchy level (100+) OR has a higher/equal level than target
      const assignerHasMaxPrivilege = assignerMaxLevel >= 100;
      
      if (!assignerHasMaxPrivilege && targetRole.hierarchy_level > assignerMaxLevel) {
        throw new Error('Insufficient privileges: Cannot assign role with higher hierarchy level');
      }

      // Security: Prevent self-elevation (users without max privilege can't give themselves higher roles)
      if (userId === assignedBy && !assignerHasMaxPrivilege && targetRole.hierarchy_level >= assignerMaxLevel) {
        throw new Error('Cannot elevate own privileges');
      }

      // Check if assignment already exists
      const { data: existing } = await supabase
        .from('user_role_assignments')
        .select('id, is_active')
        .eq('user_id', userId)
        .eq('role_id', roleId)
        .maybeSingle();

      if (existing) {
        // Reactivate if inactive
        if (!existing.is_active) {
          const { error: updateError } = await supabase
            .from('user_role_assignments')
            .update({ 
              is_active: true,
              assigned_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', existing.id);

          if (updateError) throw updateError;
        }
      } else {
        // Create new assignment
        const { error: insertError } = await supabase
          .from('user_role_assignments')
          .insert({
            user_id: userId,
            role_id: roleId,
            context_type: contextType || 'global',
            context_id: contextId,
            is_active: true,
          });

        if (insertError) throw insertError;
      }

      // Audit log the role assignment
      await supabase.rpc('log_audit_event', {
        _actor_id: assignedBy,
        _action: 'role_assigned',
        _resource_type: 'user_role',
        _resource_id: userId,
        _metadata: {
          role_id: roleId,
          role_name: roleName,
          context_type: contextType || 'global',
          context_id: contextId,
          reactivated: existing?.is_active === false,
        }
      });

      console.log(`[RoleAssignment] Role ${roleName} assigned to user ${userId} by ${assignedBy}`);
      await eventIdempotency.markComplete(event.id, 'RoleAssignmentWriteProcessor');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await eventIdempotency.markFailed(event.id, 'RoleAssignmentWriteProcessor', errorMessage);
      console.error('[RoleAssignment] Error:', error);
      throw error;
    }
  }
}
