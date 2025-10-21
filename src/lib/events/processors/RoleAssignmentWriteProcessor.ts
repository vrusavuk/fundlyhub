/**
 * Role Assignment Write Processor
 * Handles actual database writes for role assignments
 */
import { supabase } from '@/integrations/supabase/client';
import type { EventHandler } from '../types';
import type { UserRoleAssignedEvent } from '../domain/AdminEvents';
import { eventIdempotency } from '../EventIdempotency';

export class RoleAssignmentWriteProcessor implements EventHandler {
  readonly eventType = 'admin.user.role_assigned';

  async handle(event: UserRoleAssignedEvent): Promise<void> {
    const shouldProcess = await eventIdempotency.shouldProcess(
      event.id,
      'RoleAssignmentWriteProcessor'
    );
    
    if (!shouldProcess) return;

    try {
      const { userId, roleId, contextType, contextId } = event.payload;

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
          await supabase
            .from('user_role_assignments')
            .update({ 
              is_active: true,
              assigned_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', existing.id);
        }
      } else {
        // Create new assignment
        await supabase
          .from('user_role_assignments')
          .insert({
            user_id: userId,
            role_id: roleId,
            context_type: contextType,
            context_id: contextId,
            is_active: true,
          });
      }

      console.log(`[RoleAssignment] Role ${roleId} assigned to user ${userId}`);
      await eventIdempotency.markComplete(event.id, 'RoleAssignmentWriteProcessor');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await eventIdempotency.markFailed(event.id, 'RoleAssignmentWriteProcessor', errorMessage);
      console.error('[RoleAssignment] Error:', error);
      throw error;
    }
  }
}
