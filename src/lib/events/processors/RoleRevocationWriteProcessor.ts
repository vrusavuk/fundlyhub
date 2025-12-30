/**
 * Role Revocation Write Processor
 * Handles actual database writes for role revocations
 * 
 * Security considerations:
 * - Validates hierarchy levels (admins can only revoke roles at or below their level)
 * - Prevents self-revocation of critical roles
 * - Logs all role changes to audit_logs
 * - Uses idempotency to prevent duplicate processing
 */
import { supabase } from '@/integrations/supabase/client';
import type { EventHandler } from '../types';
import type { UserRoleRevokedEvent } from '../domain/AdminEvents';
import { eventIdempotency } from '../EventIdempotency';
import { z } from 'zod';

// Validate UUIDs to prevent injection
const uuidSchema = z.string().uuid();

export class RoleRevocationWriteProcessor implements EventHandler {
  readonly eventType = 'admin.user.role_revoked';

  async handle(event: UserRoleRevokedEvent): Promise<void> {
    const shouldProcess = await eventIdempotency.shouldProcess(
      event.id,
      'RoleRevocationWriteProcessor'
    );
    
    if (!shouldProcess) return;

    try {
      const { userId, roleId, revokedBy, roleName } = event.payload;

      // Validate UUIDs
      uuidSchema.parse(userId);
      uuidSchema.parse(roleId);
      uuidSchema.parse(revokedBy);

      // Security: Verify the revoking user has permission
      const { data: revokerRoles, error: revokerError } = await supabase
        .from('user_role_assignments')
        .select(`
          role_id,
          roles!inner(hierarchy_level, name)
        `)
        .eq('user_id', revokedBy)
        .eq('is_active', true);

      if (revokerError) throw revokerError;

      // Get the highest hierarchy level of the revoker
      const revokerMaxLevel = Math.max(
        ...((revokerRoles || []).map((r: any) => r.roles?.hierarchy_level || 0)),
        0
      );

      // Get the role being revoked
      const { data: targetRole, error: targetRoleError } = await supabase
        .from('roles')
        .select('hierarchy_level, name')
        .eq('id', roleId)
        .single();

      if (targetRoleError || !targetRole) {
        throw new Error('Target role not found');
      }

      // Security: Check if revoker is a super admin OR has a higher/equal level
      const isSuperAdmin = (revokerRoles || []).some((r: any) => r.roles?.name === 'super_admin');
      
      if (!isSuperAdmin && targetRole.hierarchy_level > revokerMaxLevel) {
        throw new Error('Insufficient privileges: Cannot revoke role with higher hierarchy level');
      }

      // Security: Prevent super admins from removing their own super_admin role
      // (would lock them out, requires another super admin)
      if (userId === revokedBy && targetRole.name === 'super_admin') {
        throw new Error('Cannot revoke your own super_admin role');
      }

      // Find and deactivate the assignment
      const { data: assignment, error: findError } = await supabase
        .from('user_role_assignments')
        .select('id')
        .eq('user_id', userId)
        .eq('role_id', roleId)
        .eq('is_active', true)
        .maybeSingle();

      if (findError) throw findError;

      if (!assignment) {
        console.warn(`[RoleRevocation] No active assignment found for user ${userId}, role ${roleId}`);
        await eventIdempotency.markComplete(event.id, 'RoleRevocationWriteProcessor');
        return;
      }

      const { error: updateError } = await supabase
        .from('user_role_assignments')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', assignment.id);

      if (updateError) throw updateError;

      // Audit log the role revocation
      await supabase.rpc('log_audit_event', {
        _actor_id: revokedBy,
        _action: 'role_revoked',
        _resource_type: 'user_role',
        _resource_id: userId,
        _metadata: {
          role_id: roleId,
          role_name: roleName,
          assignment_id: assignment.id,
        }
      });

      console.log(`[RoleRevocation] Role ${roleName} revoked from user ${userId} by ${revokedBy}`);
      await eventIdempotency.markComplete(event.id, 'RoleRevocationWriteProcessor');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await eventIdempotency.markFailed(event.id, 'RoleRevocationWriteProcessor', errorMessage);
      console.error('[RoleRevocation] Error:', error);
      throw error;
    }
  }
}
