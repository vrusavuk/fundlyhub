/**
 * Project-specific domain types
 * Extends the fundraiser model with structured milestones, updates, and transparency features
 */

export interface ProjectMilestone {
  id: string;
  fundraiser_id: string;
  title: string;
  description?: string;
  target_amount: number;
  currency: string;
  due_date?: string;
  status: MilestoneStatus;
  proof_urls?: string[];
  created_at: string;
  updated_at: string;
  created_by: string;
}

export type MilestoneStatus = 
  | 'planned' 
  | 'in_progress' 
  | 'submitted' 
  | 'approved' 
  | 'completed' 
  | 'canceled';

export interface ProjectUpdate {
  id: string;
  fundraiser_id: string;
  milestone_id?: string;
  author_id: string;
  title: string;
  body: string;
  attachments?: Array<{ type: string; url: string }>;
  visibility: 'public' | 'donors_only';
  created_at: string;
}

/**
 * Extended update with populated relationships (for read operations)
 */
export interface ProjectUpdateWithRelations extends ProjectUpdate {
  author?: {
    id: string;
    name: string;
    avatar?: string;
  };
  milestone?: {
    id: string;
    title: string;
    status: MilestoneStatus;
    due_date?: string;
  } | null;
}

export interface ProjectAllocation {
  id: string;
  fundraiser_id: string;
  milestone_id: string;
  amount: number;
  allocated_by: string;
  allocated_at: string;
  notes?: string;
}

export interface ProjectDisbursement {
  id: string;
  fundraiser_id: string;
  milestone_id: string;
  amount: number;
  currency: string;
  destination: string;
  evidence: Array<{ type: string; url: string }>;
  status: DisbursementStatus;
  requested_by: string;
  processed_by?: string;
  processed_at?: string;
  created_at: string;
}

export type DisbursementStatus = 
  | 'requested' 
  | 'approved' 
  | 'sent' 
  | 'reconciled' 
  | 'rejected';

export interface ProjectStats {
  totalAllocated: number;
  totalDisbursed: number;
  unallocated: number;
  milestones: {
    total: number;
    planned?: number;
    in_progress?: number;
    completed?: number;
    [key: string]: number | undefined;
  };
}
