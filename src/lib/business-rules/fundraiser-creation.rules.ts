/**
 * Fundraiser Creation Business Rules
 * Following Single Responsibility Principle
 */

import { supabase } from '@/integrations/supabase/client';

export class FundraiserCreationRules {
  /**
   * Generate a unique slug from title
   */
  static generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Validate slug uniqueness
   */
  static async validateSlugUniqueness(slug: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('fundraisers')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (error) throw error;
    return !data; // Returns true if slug is unique
  }

  /**
   * Generate unique slug with counter if needed
   */
  static async ensureUniqueSlug(baseSlug: string): Promise<string> {
    let slug = baseSlug;
    let counter = 1;
    
    while (!(await this.validateSlugUniqueness(slug))) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    return slug;
  }

  /**
   * Determine initial status based on user role (uses RBAC role names)
   * Hierarchy: super_admin (1000) > platform_admin (90) > org_admin (80) > creator (0) > visitor (1)
   */
  static determineInitialStatus(userRole: string): 'draft' | 'pending' | 'active' {
    // Admins and verified creators can publish directly
    const autoApproveRoles = ['super_admin', 'platform_admin', 'org_admin', 'creator', 'admin'];
    if (autoApproveRoles.includes(userRole)) {
      return 'active';
    }
    return 'pending'; // New users (visitor, user) need approval
  }

  /**
   * Validate goal amount is reasonable for category
   */
  static validateGoalAmount(amount: number, categoryName?: string): boolean {
    // Medical and Emergency can have higher goals
    const highGoalCategories = ['Medical', 'Emergency'];
    const maxStandardGoal = 1000000; // $1M
    const maxHighGoal = 5000000; // $5M

    if (categoryName && highGoalCategories.includes(categoryName)) {
      return amount <= maxHighGoal;
    }

    return amount <= maxStandardGoal;
  }

  /**
   * Calculate recommended summary length based on title
   */
  static getRecommendedSummaryLength(title: string): number {
    const titleLength = title.length;
    // Summary should be 3-5x the title length, max 150
    return Math.min(Math.max(titleLength * 3, 50), 150);
  }

  /**
   * Validate story quality (basic checks)
   */
  static validateStoryQuality(story: string): {
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];
    
    // Check for repeated characters
    if (/(.)\1{10,}/.test(story)) {
      issues.push('Story contains too many repeated characters');
    }
    
    // Check for minimum word count (roughly 30 words for 150 chars)
    const wordCount = story.trim().split(/\s+/).length;
    if (wordCount < 25) {
      issues.push('Story should contain at least 25 words');
    }
    
    // Check for ALL CAPS (more than 70% caps)
    const capsRatio = (story.match(/[A-Z]/g) || []).length / story.length;
    if (capsRatio > 0.7) {
      issues.push('Story should not be written in all capitals');
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }
}

/**
 * Helper function to generate fundraiser slug
 * Exported for use in event processors
 */
export async function generateFundraiserSlug(title: string): Promise<string> {
  const baseSlug = FundraiserCreationRules.generateSlug(title);
  return FundraiserCreationRules.ensureUniqueSlug(baseSlug);
}
