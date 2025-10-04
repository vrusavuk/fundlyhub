/**
 * Campaign Creation Saga
 * Orchestrates multi-step campaign creation with compensation
 */

import { supabase } from '@/integrations/supabase/client';
import type { CampaignCreatedEvent } from '../domain/CampaignEvents';

export interface SagaStep {
  name: string;
  execute: () => Promise<void>;
  compensate: () => Promise<void>;
}

export class CampaignCreationSaga {
  private sagaId: string | null = null;
  private steps: SagaStep[] = [];
  private completedSteps: number = 0;

  constructor(private event: CampaignCreatedEvent) {
    this.setupSteps();
  }

  private setupSteps(): void {
    this.steps = [
      {
        name: 'validate_and_reserve_slug',
        execute: async () => {
          console.log('[Saga] Step 1: Validating and reserving slug');
          // Slug validation happens in CampaignWriteProcessor
        },
        compensate: async () => {
          console.log('[Saga] Compensating: Remove slug reservation');
        },
      },
      {
        name: 'create_campaign_record',
        execute: async () => {
          console.log('[Saga] Step 2: Creating campaign record');
          // Campaign creation happens in CampaignWriteProcessor
        },
        compensate: async () => {
          console.log('[Saga] Compensating: Delete campaign record');
          await supabase
            .from('fundraisers')
            .delete()
            .eq('owner_user_id', this.event.payload.userId)
            .order('created_at', { ascending: false })
            .limit(1);
        },
      },
      {
        name: 'update_user_role',
        execute: async () => {
          console.log('[Saga] Step 3: Updating user role to creator');
          // Role update happens in CampaignRoleProcessor
        },
        compensate: async () => {
          console.log('[Saga] Compensating: Revert user role');
          await supabase
            .from('profiles')
            .update({ role: 'visitor' })
            .eq('id', this.event.payload.userId);
        },
      },
      {
        name: 'create_projections',
        execute: async () => {
          console.log('[Saga] Step 4: Creating CQRS projections');
          // Projections created in CampaignProjectionProcessor
        },
        compensate: async () => {
          console.log('[Saga] Compensating: Delete projections');
          // Cascade delete handles this
        },
      },
      {
        name: 'update_profile_stats',
        execute: async () => {
          console.log('[Saga] Step 5: Updating profile statistics');
          const { data: stats } = await supabase
            .rpc('get_user_profile_stats', { target_user_id: this.event.payload.userId }) as any;
          
          if (stats && stats.length > 0) {
            const userStats = stats[0];
            await supabase
              .from('profiles')
              .update({
                campaign_count: userStats.campaign_count,
                total_funds_raised: userStats.total_funds_raised,
              })
              .eq('id', this.event.payload.userId);
          }
        },
        compensate: async () => {
          console.log('[Saga] Compensating: Revert profile stats');
          // Stats will be recalculated on next query
        },
      },
    ];
  }

  async execute(): Promise<void> {
    try {
      // Create saga instance
      const { data: saga, error: sagaError } = await supabase
        .from('saga_instances')
        .insert({
          saga_type: 'campaign_creation',
          aggregate_id: this.event.id,
          current_step: 0,
          status: 'in_progress',
          data: this.event.payload,
        })
        .select()
        .single();

      if (sagaError) {
        console.error('[Saga] Failed to create saga instance:', sagaError);
        throw sagaError;
      }

      this.sagaId = saga.id;

      // Execute steps sequentially
      for (let i = 0; i < this.steps.length; i++) {
        const step = this.steps[i];
        
        try {
          // Record step start
          await supabase
            .from('saga_steps')
            .insert({
              saga_id: this.sagaId,
              step_number: i + 1,
              step_name: step.name,
              status: 'pending',
            });

          // Execute step
          await step.execute();

          // Mark step as completed
          await supabase
            .from('saga_steps')
            .update({
              status: 'completed',
              executed_at: new Date().toISOString(),
            })
            .eq('saga_id', this.sagaId)
            .eq('step_number', i + 1);

          this.completedSteps++;

          // Update saga progress
          await supabase
            .from('saga_instances')
            .update({
              current_step: i + 1,
              status: 'in_progress',
            })
            .eq('id', this.sagaId);

        } catch (error) {
          console.error(`[Saga] Step ${i + 1} failed:`, error);
          
          // Mark step as failed
          await supabase
            .from('saga_steps')
            .update({
              status: 'failed',
              error_message: error instanceof Error ? error.message : 'Unknown error',
            })
            .eq('saga_id', this.sagaId)
            .eq('step_number', i + 1);

          // Trigger compensation
          await this.compensate();
          throw error;
        }
      }

      // Mark saga as completed
      await supabase
        .from('saga_instances')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', this.sagaId);

      console.log('[Saga] Campaign creation saga completed successfully');

    } catch (error) {
      console.error('[Saga] Campaign creation saga failed:', error);
      throw error;
    }
  }

  private async compensate(): Promise<void> {
    if (!this.sagaId) return;

    console.log(`[Saga] Starting compensation for ${this.completedSteps} completed steps`);

    // Update saga status
    await supabase
      .from('saga_instances')
      .update({
        status: 'compensating',
      })
      .eq('id', this.sagaId);

    // Execute compensation in reverse order
    for (let i = this.completedSteps - 1; i >= 0; i--) {
      const step = this.steps[i];
      
      try {
        await step.compensate();
        
        // Mark step as compensated
        await supabase
          .from('saga_steps')
          .update({
            status: 'compensated',
            compensated_at: new Date().toISOString(),
          })
          .eq('saga_id', this.sagaId)
          .eq('step_number', i + 1);

      } catch (error) {
        console.error(`[Saga] Compensation failed for step ${i + 1}:`, error);
      }
    }

    // Mark saga as failed after compensation
    await supabase
      .from('saga_instances')
      .update({
        status: 'failed',
      })
      .eq('id', this.sagaId);

    console.log('[Saga] Compensation completed');
  }
}
