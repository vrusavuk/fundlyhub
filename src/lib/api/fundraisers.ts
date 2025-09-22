/**
 * API layer for fundraiser operations
 */
import { supabase } from '@/integrations/supabase/client';
import type { Fundraiser, Donation } from '@/types/fundraiser';

export interface FundraiserQueryOptions {
  limit?: number;
  offset?: number;
  category?: string;
  searchTerm?: string;
  status?: 'active' | 'draft' | 'ended';
  visibility?: 'public' | 'unlisted';
}

export interface FundraiserWithDonations extends Fundraiser {
  totalRaised: number;
  donorCount: number;
}

/**
 * Fetches fundraisers with optional filtering and pagination
 */
export async function fetchFundraisers(options: FundraiserQueryOptions = {}) {
  const {
    limit = 12,
    offset = 0,
    category,
    searchTerm,
    status = 'active',
    visibility = 'public'
  } = options;

  let query = supabase
    .from('fundraisers')
    .select(`
      *,
      profiles!fundraisers_owner_user_id_fkey(name, avatar)
    `)
    .eq('status', status)
    .eq('visibility', visibility)
    .order('created_at', { ascending: false });

  if (category && category !== 'All') {
    query = query.eq('category', category);
  }

  if (searchTerm) {
    query = query.or(
      `title.ilike.%${searchTerm}%,summary.ilike.%${searchTerm}%`
    );
  }

  const { data, error } = await query.range(offset, offset + limit - 1);

  if (error) {
    throw new Error(`Failed to fetch fundraisers: ${error.message}`);
  }

  return data || [];
}

/**
 * Fetches donation totals for given fundraiser IDs using aggregated view
 */
export async function fetchDonationTotals(fundraiserIds: string[]) {
  if (fundraiserIds.length === 0) return {};

  const { data, error } = await supabase
    .rpc('get_fundraiser_totals', { fundraiser_ids: fundraiserIds });

  if (error) {
    throw new Error(`Failed to fetch donation totals: ${error.message}`);
  }

  return (data || []).reduce((totals, row) => {
    totals[row.fundraiser_id] = Number(row.total_raised);
    return totals;
  }, {} as Record<string, number>);
}

/**
 * Fetches a single fundraiser by slug
 */
export async function fetchFundraiserBySlug(slug: string) {
  const { data, error } = await supabase
    .from('fundraisers')
    .select(`
      *,
      profiles!fundraisers_owner_user_id_fkey(name, avatar)
    `)
    .eq('slug', slug)
    .eq('visibility', 'public')
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch fundraiser: ${error.message}`);
  }

  return data;
}

/**
 * Creates a new fundraiser
 */
export async function createFundraiser(fundraiserData: any) {
  const { data, error } = await supabase
    .from('fundraisers')
    .insert(fundraiserData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create fundraiser: ${error.message}`);
  }

  return data;
}

/**
 * Updates an existing fundraiser
 */
export async function updateFundraiser(id: string, updates: any) {
  const { data, error } = await supabase
    .from('fundraisers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update fundraiser: ${error.message}`);
  }

  return data;
}