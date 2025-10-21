/**
 * Project Update Event Subscriber
 * Handles side effects when project updates are created/modified/deleted
 */

import type { EventHandler } from '../types';
import type { ProjectUpdateCreatedEvent } from '../domain/ProjectEvents';
import { supabase } from '@/integrations/supabase/client';

/**
 * Handles analytics tracking when updates are created
 */
export class ProjectUpdateAnalyticsHandler implements EventHandler<ProjectUpdateCreatedEvent> {
  eventType = 'project.update.created' as const;

  async handle(event: ProjectUpdateCreatedEvent): Promise<void> {
    try {
      const { updateId, fundraiserId, authorId, usedAI } = event.payload;
      
      // Log feature usage
      await supabase.rpc('log_feature_usage', {
        _feature_key: 'project_updates',
        _action: 'update_created',
        _metadata: {
          update_id: updateId,
          fundraiser_id: fundraiserId,
          author_id: authorId,
          used_ai: usedAI || false,
          timestamp: event.metadata.timestamp
        }
      });

      // Log AI usage separately if AI was used
      if (usedAI) {
        await supabase.rpc('log_feature_usage', {
          _feature_key: 'ai_text_enhancement',
          _action: 'project_update_generation',
          _metadata: {
            update_id: updateId,
            fundraiser_id: fundraiserId,
            timestamp: event.metadata.timestamp
          }
        });
      }

      console.log(`[ProjectUpdateAnalytics] Tracked update creation: ${updateId}`);
    } catch (error) {
      console.error('[ProjectUpdateAnalytics] Failed to track analytics:', error);
      // Don't throw - analytics failures shouldn't break the flow
    }
  }
}

/**
 * Initialize project update subscribers
 */
export function initializeProjectUpdateSubscribers(eventBus: any) {
  const analyticsHandler = new ProjectUpdateAnalyticsHandler();
  
  eventBus.subscribe('project.update.created', analyticsHandler);
  
  console.log('[ProjectUpdateSubscriber] Project update subscribers registered');
}
