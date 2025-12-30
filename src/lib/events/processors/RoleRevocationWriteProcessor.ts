/**
 * Role Revocation Write Processor
 * Handles actual database writes for role revocations
 */
import { supabase } from '@/integrations/supabase/client';
import type { EventHandler } from '../types';
import type { UserRoleRevokedEvent } from '../domain/AdminEvents';
import { eventIdempotency } from '../EventIdempotency';

export class RoleRevocationWriteProcessor implements EventHandler {
  readonly eventType = 'admin.user.role_revoked';

  async handle(event: UserRoleRevokedEvent): Promise<void> {
    const shouldProcess = await eventIdempotency.shouldProcess(
      event.id,
      'RoleRevocationWriteProcessor'
    );
    
    if (!shouldProcess) return;

    try {
      const { userId, roleId, revokedBy } = event.payload;

      // Find and deactivate the assignment
      const { error } = await supabase
        .from('user_role_assignments')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('role_id', roleId)
        .eq('is_active', true);

      if (error) throw error;

      console.log(`[RoleRevocation] Role ${roleId} revoked from user ${userId} by ${revokedBy}`);
      await eventIdempotency.markComplete(event.id, 'RoleRevocationWriteProcessor');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await eventIdempotency.markFailed(event.id, 'RoleRevocationWriteProcessor', errorMessage);
      console.error('[RoleRevocation] Error:', error);
      throw error;
    }
  }
}
