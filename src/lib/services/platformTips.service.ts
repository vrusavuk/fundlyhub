/**
 * Platform Tips Service
 * Centralized service for fetching platform tips/revenue data
 * Following SOLID principles - Single Responsibility for tips data operations
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from './logger.service';

export interface PlatformTipsStats {
  totalTips: number;
  tipsThisMonth: number;
  tipsThisWeek: number;
  tipAdoptionRate: number;
  averageTipPercentage: number;
  averageTipAmount: number;
  donationsWithTips: number;
  totalDonations: number;
}

export interface TipRecord {
  id: string;
  donationId: string;
  donorName: string;
  donorEmail: string | null;
  campaignTitle: string;
  campaignId: string;
  creatorName: string;
  creatorId: string;
  donationAmount: number;
  tipAmount: number;
  tipPercentage: number;
  createdAt: string;
  isAnonymous: boolean;
}

export interface CreatorTipStats {
  creatorId: string;
  creatorName: string;
  creatorAvatar: string | null;
  totalTipsReceived: number;
  donationsWithTips: number;
  averageTipAmount: number;
  averageTipPercentage: number;
}

export interface TipsFilterOptions {
  search?: string;
  dateRange?: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'all';
  dateFrom?: Date;
  dateTo?: Date;
  creatorId?: string;
  campaignId?: string;
  tipPercentageRange?: 'all' | 'high' | 'standard' | 'low';
}

export interface PaginationOptions {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

class PlatformTipsService {
  /**
   * Fetch aggregate platform tips statistics
   */
  async fetchTipsStats(): Promise<PlatformTipsStats> {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from('donations')
        .select('amount, tip_amount, created_at')
        .eq('payment_status', 'paid');

      if (error) throw error;

      const donations = data || [];
      const totalDonations = donations.length;
      const donationsWithTips = donations.filter(d => d.tip_amount && Number(d.tip_amount) > 0);
      const totalTips = donationsWithTips.reduce((sum, d) => sum + Number(d.tip_amount || 0), 0);

      const tipsThisMonth = donationsWithTips
        .filter(d => new Date(d.created_at) >= startOfMonth)
        .reduce((sum, d) => sum + Number(d.tip_amount || 0), 0);

      const tipsThisWeek = donationsWithTips
        .filter(d => new Date(d.created_at) >= startOfWeek)
        .reduce((sum, d) => sum + Number(d.tip_amount || 0), 0);

      const tipAdoptionRate = totalDonations > 0 
        ? (donationsWithTips.length / totalDonations) * 100 
        : 0;

      const averageTipAmount = donationsWithTips.length > 0
        ? totalTips / donationsWithTips.length
        : 0;

      const averageTipPercentage = donationsWithTips.length > 0
        ? donationsWithTips.reduce((sum, d) => {
            const amount = Number(d.amount || 0);
            const tip = Number(d.tip_amount || 0);
            return sum + (amount > 0 ? (tip / amount) * 100 : 0);
          }, 0) / donationsWithTips.length
        : 0;

      return {
        totalTips,
        tipsThisMonth,
        tipsThisWeek,
        tipAdoptionRate,
        averageTipPercentage,
        averageTipAmount,
        donationsWithTips: donationsWithTips.length,
        totalDonations,
      };
    } catch (error) {
      logger.error('Failed to fetch tips stats', error, {
        componentName: 'PlatformTipsService',
        operationName: 'fetchTipsStats',
      });
      throw error;
    }
  }

  /**
   * Fetch tips with filtering and pagination
   */
  async fetchTipsWithFilters(
    pagination: PaginationOptions,
    filters: TipsFilterOptions
  ): Promise<{ data: TipRecord[]; total: number; page: number; pageSize: number; totalPages: number }> {
    try {
      let query = supabase
        .from('donations')
        .select(`
          id,
          amount,
          tip_amount,
          donor_name,
          donor_email,
          is_anonymous,
          created_at,
          fundraisers!inner(
            id,
            title,
            owner_user_id,
            profiles!fundraisers_owner_user_id_fkey(
              id,
              name,
              avatar
            )
          )
        `, { count: 'exact' })
        .eq('payment_status', 'paid')
        .gt('tip_amount', 0);

      // Apply search filter
      if (filters.search) {
        query = query.or(`donor_name.ilike.%${filters.search}%,donor_email.ilike.%${filters.search}%`);
      }

      // Apply date range filter
      if (filters.dateRange && filters.dateRange !== 'all') {
        const now = new Date();
        let startDate: Date | null = null;

        switch (filters.dateRange) {
          case 'today':
            startDate = new Date(now.setHours(0, 0, 0, 0));
            break;
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          case 'quarter':
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
          case 'year':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
        }

        if (startDate) {
          query = query.gte('created_at', startDate.toISOString());
        }
      }

      // Apply custom date range
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom.toISOString());
      }
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo.toISOString());
      }

      // Apply creator filter
      if (filters.creatorId) {
        query = query.eq('fundraisers.owner_user_id', filters.creatorId);
      }

      // Apply campaign filter
      if (filters.campaignId) {
        query = query.eq('fundraiser_id', filters.campaignId);
      }

      // Apply pagination
      const { page, pageSize, sortBy = 'created_at', sortOrder = 'desc' } = pagination;
      const offset = (page - 1) * pageSize;

      query = query
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range(offset, offset + pageSize - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      // Transform and filter by tip percentage if needed
      let tipRecords: TipRecord[] = (data || []).map((d: any) => {
        const amount = Number(d.amount || 0);
        const tipAmount = Number(d.tip_amount || 0);
        const tipPercentage = amount > 0 ? (tipAmount / amount) * 100 : 0;

        return {
          id: d.id,
          donationId: d.id,
          donorName: d.is_anonymous ? 'Anonymous' : (d.donor_name || 'Anonymous'),
          donorEmail: d.is_anonymous ? null : d.donor_email,
          campaignTitle: d.fundraisers?.title || 'Unknown Campaign',
          campaignId: d.fundraisers?.id || '',
          creatorName: d.fundraisers?.profiles?.name || 'Unknown Creator',
          creatorId: d.fundraisers?.owner_user_id || '',
          donationAmount: amount,
          tipAmount,
          tipPercentage,
          createdAt: d.created_at,
          isAnonymous: d.is_anonymous,
        };
      });

      // Apply tip percentage range filter (client-side since it's a computed value)
      if (filters.tipPercentageRange && filters.tipPercentageRange !== 'all') {
        tipRecords = tipRecords.filter(tip => {
          switch (filters.tipPercentageRange) {
            case 'high':
              return tip.tipPercentage > 20;
            case 'standard':
              return tip.tipPercentage >= 10 && tip.tipPercentage <= 20;
            case 'low':
              return tip.tipPercentage < 10;
            default:
              return true;
          }
        });
      }

      return {
        data: tipRecords,
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      };
    } catch (error) {
      logger.error('Failed to fetch tips with filters', error, {
        componentName: 'PlatformTipsService',
        operationName: 'fetchTipsWithFilters',
        metadata: { filters },
      });
      throw error;
    }
  }

  /**
   * Fetch creator leaderboard by tips received
   */
  async fetchCreatorLeaderboard(limit: number = 10): Promise<CreatorTipStats[]> {
    try {
      const { data, error } = await supabase
        .from('donations')
        .select(`
          tip_amount,
          amount,
          fundraisers!inner(
            owner_user_id,
            profiles!fundraisers_owner_user_id_fkey(
              id,
              name,
              avatar
            )
          )
        `)
        .eq('payment_status', 'paid')
        .gt('tip_amount', 0);

      if (error) throw error;

      // Group by creator
      const creatorMap = new Map<string, {
        id: string;
        name: string;
        avatar: string | null;
        totalTips: number;
        donationCount: number;
        tipPercentages: number[];
      }>();

      (data || []).forEach((d: any) => {
        const creatorId = d.fundraisers?.owner_user_id;
        if (!creatorId) return;

        const existing = creatorMap.get(creatorId);
        const tipAmount = Number(d.tip_amount || 0);
        const amount = Number(d.amount || 0);
        const tipPercentage = amount > 0 ? (tipAmount / amount) * 100 : 0;

        if (existing) {
          existing.totalTips += tipAmount;
          existing.donationCount += 1;
          existing.tipPercentages.push(tipPercentage);
        } else {
          creatorMap.set(creatorId, {
            id: creatorId,
            name: d.fundraisers?.profiles?.name || 'Unknown',
            avatar: d.fundraisers?.profiles?.avatar || null,
            totalTips: tipAmount,
            donationCount: 1,
            tipPercentages: [tipPercentage],
          });
        }
      });

      // Convert to array and calculate averages
      const leaderboard: CreatorTipStats[] = Array.from(creatorMap.values())
        .map(creator => ({
          creatorId: creator.id,
          creatorName: creator.name,
          creatorAvatar: creator.avatar,
          totalTipsReceived: creator.totalTips,
          donationsWithTips: creator.donationCount,
          averageTipAmount: creator.totalTips / creator.donationCount,
          averageTipPercentage: creator.tipPercentages.reduce((a, b) => a + b, 0) / creator.tipPercentages.length,
        }))
        .sort((a, b) => b.totalTipsReceived - a.totalTipsReceived)
        .slice(0, limit);

      return leaderboard;
    } catch (error) {
      logger.error('Failed to fetch creator leaderboard', error, {
        componentName: 'PlatformTipsService',
        operationName: 'fetchCreatorLeaderboard',
      });
      throw error;
    }
  }

  /**
   * Fetch unique creators for filter dropdown
   */
  async fetchCreatorsForFilter(): Promise<{ id: string; name: string }[]> {
    try {
      const { data, error } = await supabase
        .from('donations')
        .select(`
          fundraisers!inner(
            owner_user_id,
            profiles!fundraisers_owner_user_id_fkey(
              id,
              name
            )
          )
        `)
        .eq('payment_status', 'paid')
        .gt('tip_amount', 0);

      if (error) throw error;

      const creatorMap = new Map<string, string>();
      (data || []).forEach((d: any) => {
        const id = d.fundraisers?.owner_user_id;
        const name = d.fundraisers?.profiles?.name;
        if (id && name && !creatorMap.has(id)) {
          creatorMap.set(id, name);
        }
      });

      return Array.from(creatorMap.entries()).map(([id, name]) => ({ id, name }));
    } catch (error) {
      logger.error('Failed to fetch creators for filter', error, {
        componentName: 'PlatformTipsService',
        operationName: 'fetchCreatorsForFilter',
      });
      return [];
    }
  }

  /**
   * Fetch unique campaigns for filter dropdown
   */
  async fetchCampaignsForFilter(): Promise<{ id: string; title: string }[]> {
    try {
      const { data, error } = await supabase
        .from('donations')
        .select(`
          fundraisers!inner(
            id,
            title
          )
        `)
        .eq('payment_status', 'paid')
        .gt('tip_amount', 0);

      if (error) throw error;

      const campaignMap = new Map<string, string>();
      (data || []).forEach((d: any) => {
        const id = d.fundraisers?.id;
        const title = d.fundraisers?.title;
        if (id && title && !campaignMap.has(id)) {
          campaignMap.set(id, title);
        }
      });

      return Array.from(campaignMap.entries()).map(([id, title]) => ({ id, title }));
    } catch (error) {
      logger.error('Failed to fetch campaigns for filter', error, {
        componentName: 'PlatformTipsService',
        operationName: 'fetchCampaignsForFilter',
      });
      return [];
    }
  }

  /**
   * Fetch tips count by percentage range for status tabs
   */
  async fetchTipsCountByRange(): Promise<{
    all: number;
    high: number;
    standard: number;
    low: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('donations')
        .select('amount, tip_amount')
        .eq('payment_status', 'paid')
        .gt('tip_amount', 0);

      if (error) throw error;

      const donations = data || [];
      let high = 0;
      let standard = 0;
      let low = 0;

      donations.forEach(d => {
        const amount = Number(d.amount || 0);
        const tip = Number(d.tip_amount || 0);
        const percentage = amount > 0 ? (tip / amount) * 100 : 0;

        if (percentage > 20) {
          high++;
        } else if (percentage >= 10) {
          standard++;
        } else {
          low++;
        }
      });

      return {
        all: donations.length,
        high,
        standard,
        low,
      };
    } catch (error) {
      logger.error('Failed to fetch tips count by range', error, {
        componentName: 'PlatformTipsService',
        operationName: 'fetchTipsCountByRange',
      });
      return { all: 0, high: 0, standard: 0, low: 0 };
    }
  }
}

export const platformTipsService = new PlatformTipsService();
