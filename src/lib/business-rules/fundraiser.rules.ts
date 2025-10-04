/**
 * Fundraiser Business Rules
 * Contains all business logic for fundraiser classification and scoring
 * Single Responsibility: Fundraiser business rules and calculations
 * 
 * @example
 * ```typescript
 * // Check if a fundraiser is featured
 * const isFeatured = FundraiserRules.isFeatured(fundraiser, stats, 0);
 * 
 * // Calculate urgency level
 * const urgency = FundraiserRules.calculateUrgency(stats.daysLeft);
 * 
 * // Filter trending fundraisers
 * const trending = FundraiserRules.filterTrending(fundraisers, statsMap);
 * ```
 */

import type { Fundraiser } from '@/types';

// Business rule constants - Single source of truth for all thresholds
export const FUNDRAISER_RULES = {
  // Featured fundraiser thresholds
  FEATURED: {
    TOP_N_COUNT: 3,
    HIGH_FUNDING_THRESHOLD: 10000,
    URGENT_DAYS_THRESHOLD: 7,
  },
  // Trending fundraiser thresholds
  TRENDING: {
    MIN_DONOR_COUNT: 50,
    HIGH_COMPLETION_PERCENTAGE: 75,
  },
  // Urgency levels
  URGENCY: {
    HIGH_DAYS: 7,
    MEDIUM_DAYS: 14,
  },
  // Trust score calculation
  TRUST_SCORE: {
    BASE_SCORE: 85,
    MAX_RANDOM_BONUS: 15,
  },
} as const;

export interface FundraiserStats {
  totalRaised: number;
  donorCount: number;
  daysLeft?: number;
}

export type UrgencyLevel = 'low' | 'medium' | 'high';

/**
 * Fundraiser Business Rules Engine
 */
export class FundraiserRules {
  /**
   * Determine if a fundraiser should be featured
   */
  static isFeatured(
    fundraiser: Fundraiser,
    stats: FundraiserStats,
    index: number
  ): boolean {
    // Top N campaigns are automatically featured
    if (index < FUNDRAISER_RULES.FEATURED.TOP_N_COUNT) {
      return true;
    }

    // High funding campaigns are featured
    if (stats.totalRaised > FUNDRAISER_RULES.FEATURED.HIGH_FUNDING_THRESHOLD) {
      return true;
    }

    // Urgent campaigns are featured
    if (
      stats.daysLeft !== undefined &&
      stats.daysLeft <= FUNDRAISER_RULES.FEATURED.URGENT_DAYS_THRESHOLD
    ) {
      return true;
    }

    return false;
  }

  /**
   * Determine if a fundraiser is trending
   */
  static isTrending(fundraiser: Fundraiser, stats: FundraiserStats): boolean {
    // Many donors indicates trending
    if (stats.donorCount > FUNDRAISER_RULES.TRENDING.MIN_DONOR_COUNT) {
      return true;
    }

    // High completion percentage indicates trending
    const completionPercentage = (stats.totalRaised / fundraiser.goal_amount) * 100;
    if (completionPercentage > FUNDRAISER_RULES.TRENDING.HIGH_COMPLETION_PERCENTAGE) {
      return true;
    }

    return false;
  }

  /**
   * Calculate urgency level based on days remaining
   */
  static calculateUrgency(daysLeft?: number): UrgencyLevel {
    if (daysLeft === undefined) {
      return 'low';
    }

    if (daysLeft <= FUNDRAISER_RULES.URGENCY.HIGH_DAYS) {
      return 'high';
    }

    if (daysLeft <= FUNDRAISER_RULES.URGENCY.MEDIUM_DAYS) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Calculate trust score for a fundraiser
   */
  static calculateTrustScore(fundraiser: Fundraiser, stats: FundraiserStats): number {
    const { BASE_SCORE, MAX_RANDOM_BONUS } = FUNDRAISER_RULES.TRUST_SCORE;
    
    // Base score with random variation for now
    // TODO: Implement proper trust score calculation based on:
    // - Verification status
    // - Organization reputation
    // - Donor count
    // - Campaign history
    // - Social proof
    return BASE_SCORE + Math.floor(Math.random() * MAX_RANDOM_BONUS);
  }

  /**
   * Filter featured fundraisers from a list
   */
  static filterFeatured(
    fundraisers: Fundraiser[],
    statsMap: Record<string, FundraiserStats>
  ): Fundraiser[] {
    return fundraisers.filter((fundraiser, index) => {
      const stats = statsMap[fundraiser.id] || { totalRaised: 0, donorCount: 0 };
      return this.isFeatured(fundraiser, stats, index);
    });
  }

  /**
   * Filter trending fundraisers from a list
   */
  static filterTrending(
    fundraisers: Fundraiser[],
    statsMap: Record<string, FundraiserStats>
  ): Fundraiser[] {
    return fundraisers.filter((fundraiser) => {
      const stats = statsMap[fundraiser.id] || { totalRaised: 0, donorCount: 0 };
      return this.isTrending(fundraiser, stats);
    });
  }

  /**
   * Enrich fundraiser with calculated properties
   */
  static enrichFundraiser(
    fundraiser: Fundraiser,
    stats: FundraiserStats,
    index: number
  ) {
    return {
      ...fundraiser,
      stats,
      isFeatured: this.isFeatured(fundraiser, stats, index),
      isTrending: this.isTrending(fundraiser, stats),
      urgency: this.calculateUrgency(stats.daysLeft),
      trustScore: this.calculateTrustScore(fundraiser, stats),
    };
  }
}
