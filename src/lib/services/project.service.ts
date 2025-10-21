/**
 * Project Service
 * Handles all project-specific operations (milestones, updates, allocations, disbursements)
 */

import { supabase } from '@/integrations/supabase/client';
import type { 
  ProjectMilestone, 
  ProjectUpdate, 
  ProjectAllocation,
  ProjectDisbursement,
  ProjectStats 
} from '@/types/domain/project';

class ProjectService {
  /**
   * Get all milestones for a fundraiser
   */
  async getMilestones(fundraiserId: string): Promise<ProjectMilestone[]> {
    const { data, error } = await supabase
      .from('project_milestones')
      .select('*')
      .eq('fundraiser_id', fundraiserId)
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data || []) as ProjectMilestone[];
  }

  /**
   * Create a new milestone
   */
  async createMilestone(milestone: Omit<ProjectMilestone, 'id' | 'created_at' | 'updated_at'>): Promise<ProjectMilestone> {
    const { data, error } = await supabase
      .from('project_milestones')
      .insert(milestone)
      .select()
      .single();

    if (error) throw error;
    return data as ProjectMilestone;
  }

  /**
   * Update milestone status
   */
  async updateMilestoneStatus(milestoneId: string, status: ProjectMilestone['status'], proofUrls?: string[]): Promise<ProjectMilestone> {
    const updates: any = { status };
    if (proofUrls) {
      updates.proof_urls = proofUrls;
    }

    const { data, error } = await supabase
      .from('project_milestones')
      .update(updates)
      .eq('id', milestoneId)
      .select()
      .single();

    if (error) throw error;
    return data as ProjectMilestone;
  }

  /**
   * Get all updates for a fundraiser
   */
  async getUpdates(fundraiserId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('project_updates')
      .select(`
        *,
        author:profiles!project_updates_author_id_fkey(id, name, avatar)
      `)
      .eq('fundraiser_id', fundraiserId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Create a new project update
   */
  async createUpdate(update: Omit<ProjectUpdate, 'id' | 'created_at'>): Promise<ProjectUpdate> {
    // Verify user is fundraiser owner or authorized
    const { data: fundraiser } = await supabase
      .from('fundraisers')
      .select('owner_user_id, org_id')
      .eq('id', update.fundraiser_id)
      .single();

    if (!fundraiser) {
      throw new Error('Fundraiser not found');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Unauthorized: Must be logged in');
    }

    const isOwner = fundraiser.owner_user_id === update.author_id;
    // Note: org membership check would go here if needed
    
    if (!isOwner && user.id !== update.author_id) {
      throw new Error('Unauthorized: Only fundraiser owners can post updates');
    }

    const { data, error } = await supabase
      .from('project_updates')
      .insert(update)
      .select()
      .single();

    if (error) throw error;
    return data as ProjectUpdate;
  }

  /**
   * Get project statistics
   */
  async getProjectStats(fundraiserId: string): Promise<ProjectStats> {
    // Get milestones
    const { data: milestones, error: milestonesError } = await supabase
      .from('project_milestones')
      .select('status, target_amount')
      .eq('fundraiser_id', fundraiserId);

    if (milestonesError) throw milestonesError;

    // Get allocations
    const { data: allocations, error: allocationsError } = await supabase
      .from('project_allocations')
      .select('amount')
      .eq('fundraiser_id', fundraiserId);

    if (allocationsError) throw allocationsError;

    // Get disbursements
    const { data: disbursements, error: disbursementsError } = await supabase
      .from('project_disbursements')
      .select('amount, status')
      .eq('fundraiser_id', fundraiserId)
      .in('status', ['approved', 'sent', 'reconciled']);

    if (disbursementsError) throw disbursementsError;

    // Calculate stats
    const totalAllocated = allocations?.reduce((sum, a) => sum + Number(a.amount), 0) || 0;
    const totalDisbursed = disbursements?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;

    // Count milestones by status
    const milestoneStats = (milestones || []).reduce((acc, m) => {
      acc[m.status] = (acc[m.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalAllocated,
      totalDisbursed,
      unallocated: totalAllocated - totalDisbursed,
      milestones: {
        total: milestones?.length || 0,
        ...milestoneStats
      }
    };
  }

  /**
   * Allocate funds to a milestone
   */
  async allocateFunds(allocation: Omit<ProjectAllocation, 'id' | 'allocated_at'>): Promise<ProjectAllocation> {
    const { data, error } = await supabase
      .from('project_allocations')
      .insert(allocation)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Request disbursement
   */
  async requestDisbursement(disbursement: Omit<ProjectDisbursement, 'id' | 'created_at' | 'processed_by' | 'processed_at'>): Promise<ProjectDisbursement> {
    const { data, error } = await supabase
      .from('project_disbursements')
      .insert(disbursement)
      .select()
      .single();

    if (error) throw error;
    return data as ProjectDisbursement;
  }
}

export const projectService = new ProjectService();
