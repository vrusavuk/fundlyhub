/**
 * Project Mutation Service
 * Handles creating projects with milestones atomically
 */

import { supabase } from '@/integrations/supabase/client';
import type { Milestone } from '@/lib/validation/fundraiserCreation.schema';

interface CreateProjectInput {
  fundraiserId: string;
  milestones: Milestone[];
  createdBy: string;
}

class ProjectMutationService {
  /**
   * Create milestones for a newly created fundraiser
   */
  async createProjectMilestones(input: CreateProjectInput): Promise<void> {
    const { fundraiserId, milestones, createdBy } = input;

    if (!milestones || milestones.length === 0) {
      return;
    }

    const milestoneRecords = milestones.map((m) => ({
      fundraiser_id: fundraiserId,
      title: m.title,
      description: m.description,
      target_amount: m.target_amount,
      currency: m.currency,
      due_date: m.due_date || null,
      status: 'planned' as const,
      created_by: createdBy,
    }));

    const { error } = await supabase
      .from('project_milestones')
      .insert(milestoneRecords);

    if (error) throw error;
  }
}

export const projectMutationService = new ProjectMutationService();
