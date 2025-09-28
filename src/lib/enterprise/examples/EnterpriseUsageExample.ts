/**
 * Example service demonstrating enterprise-grade API features
 * Shows proper usage of money math, idempotency, pagination, and rate limiting
 */

import { enterpriseApi } from '../EnterpriseApi';
import { MoneyMath } from '../utils/MoneyMath';
import type { CreateFundraiserData } from '@/types';

export class EnterpriseUsageExample {
  
  /**
   * Example: Create fundraiser with precise money handling and idempotency
   */
  async createFundraiserWithPrecision(
    data: CreateFundraiserData,
    idempotencyKey?: string
  ) {
    // Create precise money objects
    const goalMoney = MoneyMath.create(data.goal_amount, data.currency);
    
    // Validate minimum goal amount
    const minimumGoal = MoneyMath.create(100, data.currency);
    if (MoneyMath.compare(goalMoney, minimumGoal) < 0) {
      throw new Error('Minimum goal amount is $100');
    }

    return enterpriseApi.createFundraiser(
      {
        ...data,
        goal_amount: MoneyMath.toNumber(goalMoney) // Store as number but calculations were precise
      },
      {
        idempotencyKey,
        cache: {
          tags: ['fundraisers', 'user_data']
        },
        validation: {
          schema: (input) => {
            // Additional validation here
            if (!input.title || input.title.length < 5) {
              throw new Error('Title must be at least 5 characters');
            }
            return input;
          }
        }
      }
    );
  }

  /**
   * Example: Process donation with precise fee calculations
   */
  async processDonationWithFees(donationData: {
    fundraiser_id: string;
    amount: number;
    currency: string;
    tip_percent?: number;
    processing_fee_percent?: number;
  }) {
    // Create precise money objects
    const donationAmount = MoneyMath.create(donationData.amount, donationData.currency);
    
    // Calculate tip amount
    const tipAmount = donationData.tip_percent 
      ? MoneyMath.percentage(donationAmount, donationData.tip_percent)
      : MoneyMath.create(0, donationData.currency);
    
    // Calculate processing fee (typically 2.9% + $0.30)
    const processingFeePercent = donationData.processing_fee_percent || 2.9;
    const percentageFee = MoneyMath.percentage(donationAmount, processingFeePercent);
    const fixedFee = MoneyMath.create(0.30, donationData.currency);
    const totalProcessingFee = MoneyMath.add(percentageFee, fixedFee);
    
    // Calculate net amount (donation - tip - processing fee)
    const grossAmount = MoneyMath.add(donationAmount, tipAmount);
    const netAmount = MoneyMath.subtract(donationAmount, totalProcessingFee);

    return enterpriseApi.createDonation(
      {
        fundraiser_id: donationData.fundraiser_id,
        amount: MoneyMath.toNumber(grossAmount),
        net_amount: MoneyMath.toNumber(netAmount),
        tip_amount: MoneyMath.toNumber(tipAmount),
        processing_fee: MoneyMath.toNumber(totalProcessingFee),
        currency: donationData.currency,
        payment_status: 'pending'
      },
      {
        cache: {
          tags: ['donations', 'fundraiser_stats']
        }
      }
    );
  }

  /**
   * Example: Get fundraisers with cursor pagination
   */
  async getFundraisersWithPagination(
    cursor?: string,
    limit: number = 20,
    category?: string
  ) {
    return enterpriseApi.queryWithPagination(
      () => {
        let query = enterpriseApi['supabase'] // Access private supabase instance
          .from('fundraisers')
          .select(`
            *,
            categories(name, emoji, color_class),
            profiles(name, avatar),
            public_fundraiser_stats(total_raised, donor_count)
          `)
          .eq('visibility', 'public')
          .eq('status', 'active');

        if (category) {
          query = query.eq('category_id', category);
        }

        return query;
      },
      'get_fundraisers_paginated',
      {
        cursor,
        limit,
        sortField: 'created_at',
        sortOrder: 'desc'
      },
      {
        cache: {
          key: `fundraisers_page_${cursor || 'first'}_${limit}_${category || 'all'}`,
          ttl: 300000, // 5 minutes
          tags: ['fundraisers', 'public_data']
        }
      }
    );
  }

  /**
   * Example: Money calculations for fundraiser progress
   */
  calculateFundraiserProgress(
    raised: number,
    goal: number,
    currency: string = 'USD'
  ) {
    const raisedMoney = MoneyMath.create(raised, currency);
    const goalMoney = MoneyMath.create(goal, currency);
    
    // Calculate percentage (safe from floating point errors)
    const percentage = MoneyMath.toNumber(
      MoneyMath.multiply(
        MoneyMath.create(MoneyMath.toNumber(raisedMoney) / MoneyMath.toNumber(goalMoney), currency),
        100
      )
    );
    
    // Calculate remaining amount
    const remaining = MoneyMath.subtract(goalMoney, raisedMoney);
    
    return {
      raised: MoneyMath.format(raisedMoney),
      goal: MoneyMath.format(goalMoney),
      remaining: MoneyMath.format(remaining),
      percentage: Math.min(percentage, 100),
      isComplete: MoneyMath.compare(raisedMoney, goalMoney) >= 0
    };
  }

  /**
   * Example: Bulk operations with rate limiting awareness
   */
  async bulkProcessDonations(donations: any[]) {
    const results = [];
    
    for (const donation of donations) {
      try {
        // Small delay to respect rate limits
        await this.sleep(100);
        
        const result = await this.processDonationWithFees(donation);
        results.push({ success: true, data: result });
      } catch (error) {
        if (error instanceof Error && error.message.includes('Rate limit')) {
          // Wait and retry
          await this.sleep(5000);
          try {
            const result = await this.processDonationWithFees(donation);
            results.push({ success: true, data: result });
          } catch (retryError) {
            results.push({ success: false, error: retryError });
          }
        } else {
          results.push({ success: false, error });
        }
      }
    }
    
    return results;
  }

  /**
   * Example: Health check with business metrics
   */
  async getSystemHealth() {
    const health = await enterpriseApi.healthCheck();
    
    // Add business-specific metrics
    const businessMetrics = await this.calculateBusinessMetrics();
    
    return {
      ...health,
      businessMetrics
    };
  }

  private async calculateBusinessMetrics() {
    // Example business metrics calculation
    return {
      activeFundraisers: 0, // Would fetch from database
      totalRaised: MoneyMath.format(MoneyMath.create(0, 'USD')),
      averageDonation: MoneyMath.format(MoneyMath.create(0, 'USD')),
      conversionRate: 0
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const enterpriseUsageExample = new EnterpriseUsageExample();