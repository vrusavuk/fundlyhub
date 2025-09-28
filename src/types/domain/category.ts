/**
 * Database-driven category types
 */
export interface Category {
  id: string;
  name: string;
  emoji: string;
  color_class: string;
  description?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CategoryStats {
  category_id: string;
  category_name: string;
  emoji: string;
  color_class: string;
  active_campaigns: number;
  closed_campaigns: number;
  total_raised: number;
  campaign_count: number;
}

export interface CategoryFilters {
  selectedCategory: string;
  urgency?: 'high' | 'medium' | 'low';
  minAmount?: number;
  maxAmount?: number;
  status?: 'active' | 'paused' | 'ended';
}