/**
 * Payout Service
 * Handles creator payout requests, bank account management, and admin payout operations
 */

import { supabase } from '@/integrations/supabase/client';
import { unifiedApi } from './unified-api.service';

export interface PayoutRequest {
  id: string;
  user_id: string;
  fundraiser_id: string | null;
  bank_account_id: string;
  requested_amount_str: string;
  fee_amount_str: string;
  net_amount_str: string;
  currency: string;
  status: string;
  priority: string | null;
  risk_score: number | null;
  risk_factors: any;
  requires_manual_review: boolean;
  creator_notes: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  estimated_arrival_date: string | null;
}

export interface BankAccount {
  id: string;
  user_id: string;
  account_number_last4: string;
  routing_number_last4: string | null;
  account_holder_name: string;
  bank_name: string | null;
  account_type: string | null;
  verification_status: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
}

export interface AvailableBalance {
  fundraiser_id: string;
  available_balance_str: string;
  pending_balance_str: string;
  held_balance_str: string;
  currency: string;
}

export interface KYCStatus {
  status: string;
  verification_level: string | null;
  risk_level: string | null;
  requires_info_details: string | null;
  rejection_reason: string | null;
}

export interface UserEarnings {
  total_earnings: string;
  total_payouts: string;
  pending_payouts: string;
  available_balance: string;
  held_balance: string;
  currency: string;
  fundraiser_count: number;
  donation_count: number;
}

class PayoutService {
  /**
   * Request a payout for a fundraiser
   */
  async requestPayout(
    fundraiserId: string,
    bankAccountId: string,
    amount: number,
    notes?: string
  ): Promise<PayoutRequest> {
    const { data, error } = await supabase.functions.invoke('payout-request-create', {
      body: {
        fundraiser_id: fundraiserId,
        bank_account_id: bankAccountId,
        amount_cents: Math.round(amount * 100),
        currency: 'USD',
        creator_notes: notes,
      },
    });

    if (error) {
      throw new Error(error.message || 'Failed to create payout request');
    }

    if (data.error) {
      throw new Error(data.error);
    }

    return data.payout_request;
  }

  /**
   * Get payout requests for a fundraiser or user
   */
  async getPayoutRequests(
    filters?: {
      fundraiserId?: string;
      userId?: string;
      status?: string;
    }
  ): Promise<PayoutRequest[]> {
    return unifiedApi.query(
      async () => {
        let query = supabase
          .from('payout_requests')
          .select('*')
          .order('created_at', { ascending: false });

        if (filters?.fundraiserId) {
          query = query.eq('fundraiser_id', filters.fundraiserId);
        }
        if (filters?.userId) {
          query = query.eq('user_id', filters.userId);
        }
        if (filters?.status) {
          query = query.eq('status', filters.status as any);
        }

        const { data, error } = await query;
        return { data, error };
      },
      {
        cache: {
          key: `payout-requests:${filters?.fundraiserId || filters?.userId || 'all'}:${filters?.status || 'all'}`,
          ttl: 60, // 1 minute cache
        },
      }
    );
  }

  /**
   * Get available balance for a fundraiser
   */
  async getAvailableBalance(fundraiserId: string, userId: string): Promise<AvailableBalance> {
    const result = await unifiedApi.query(
      async () => {
        const { data, error } = await supabase.rpc('calculate_available_balance', {
          _fundraiser_id: fundraiserId,
          _user_id: userId,
        });
        return { data, error };
      },
      {
        cache: {
          key: `available-balance:${fundraiserId}`,
          ttl: 30, // 30 seconds cache
        },
      }
    );

    // Transform the result from RPC to match our interface
    if (result && result.length > 0) {
      const row = result[0];
      return {
        fundraiser_id: fundraiserId,
        available_balance_str: row.available_balance.toString(),
        pending_balance_str: '0.00',
        held_balance_str: row.total_holds.toString(),
        currency: 'USD',
      };
    }

    return {
      fundraiser_id: fundraiserId,
      available_balance_str: '0.00',
      pending_balance_str: '0.00',
      held_balance_str: '0.00',
      currency: 'USD',
    };
  }

  /**
   * Get user's bank accounts
   */
  async getBankAccounts(userId: string): Promise<BankAccount[]> {
    return unifiedApi.query(
      async () => {
        const { data, error } = await supabase
          .from('payout_bank_accounts')
          .select('*')
          .eq('user_id', userId)
          .is('deleted_at', null)
          .order('is_default', { ascending: false })
          .order('created_at', { ascending: false });

        return { data, error };
      },
      {
        cache: {
          key: `bank-accounts:${userId}`,
          ttl: 120, // 2 minutes cache
        },
      }
    );
  }

  /**
   * Lookup bank name by routing number
   */
  async lookupBankByRoutingNumber(routingNumber: string): Promise<{
    bank_name: string;
  } | null> {
    try {
      const { data, error } = await supabase.functions.invoke('routing-lookup', {
        body: { routing_number: routingNumber },
      });

      if (error) {
        console.error('Bank lookup error:', error);
        return null;
      }

      if (data.error) {
        console.error('Bank lookup failed:', data.error);
        return null;
      }

      return { bank_name: data.bank_name };
    } catch (error) {
      console.error('Failed to lookup bank:', error);
      return null;
    }
  }

  /**
   * Add a new bank account
   */
  async addBankAccount(accountData: {
    account_number: string;
    routing_number: string;
    account_holder_name: string;
    account_type?: string;
    bank_name?: string;
    // Compliance fields for progressive KYC
    date_of_birth?: string;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    ssn_last4?: string;
  }): Promise<BankAccount> {
    // Transform snake_case to camelCase for edge function
    const { data, error } = await supabase.functions.invoke('bank-account-verify', {
      body: {
        accountHolderName: accountData.account_holder_name,
        accountNumber: accountData.account_number,
        routingNumber: accountData.routing_number,
        accountType: accountData.account_type || 'checking',
        bankName: accountData.bank_name,
        // Compliance fields
        dateOfBirth: accountData.date_of_birth,
        addressLine1: accountData.address_line1,
        addressLine2: accountData.address_line2,
        city: accountData.city,
        state: accountData.state,
        postalCode: accountData.postal_code,
        ssnLast4: accountData.ssn_last4,
      },
    });

    if (error) {
      console.error('Edge function invocation error:', error);
      throw new Error(error.message || 'Failed to add bank account');
    }

    if (data.error) {
      console.error('Edge function returned error:', data.error);
      throw new Error(data.error);
    }

    // Invalidate cache
    await unifiedApi.clearCache('bank-accounts:*');

    return data.bank_account;
  }

  /**
   * Verify a bank account (micro-deposits)
   */
  async verifyBankAccount(
    bankAccountId: string,
    amount1: number,
    amount2: number
  ): Promise<void> {
    const { data, error } = await supabase.functions.invoke('bank-account-verify', {
      body: {
        action: 'verify',
        bank_account_id: bankAccountId,
        amount1,
        amount2,
      },
    });

    if (error) {
      throw new Error(error.message || 'Failed to verify bank account');
    }

    if (data.error) {
      throw new Error(data.error);
    }

    // Invalidate cache
    await unifiedApi.clearCache('bank-accounts:*');
  }

  /**
   * Get KYC verification status
   */
  async getKYCStatus(userId: string): Promise<KYCStatus | null> {
    return unifiedApi.query(
      async () => {
        const { data, error } = await supabase
          .from('creator_kyc_verification')
          .select('status, verification_level, risk_level, requires_info_details, rejection_reason')
          .eq('user_id', userId)
          .maybeSingle();

        return { data, error };
      },
      {
        cache: {
          key: `kyc-status:${userId}`,
          ttl: 300, // 5 minutes cache
        },
      }
    );
  }

  /**
   * Get user's total earnings across all fundraisers
   * This is the SINGLE SOURCE OF TRUTH for user earnings
   */
  async getUserEarnings(userId: string): Promise<UserEarnings> {
    return unifiedApi.query(
      async () => {
        const { data, error } = await supabase.rpc('get_user_earnings', {
          _user_id: userId,
        });

        if (error) throw new Error(error.message || 'Failed to fetch user earnings');

        // RPC returns array, get first result
        if (data && data.length > 0) {
          const row = data[0];
          return {
            data: {
              total_earnings: row.total_earnings.toString(),
              total_payouts: row.total_payouts.toString(),
              pending_payouts: row.pending_payouts.toString(),
              available_balance: row.available_balance.toString(),
              held_balance: row.held_balance.toString(),
              currency: row.currency,
              fundraiser_count: row.fundraiser_count,
              donation_count: row.donation_count,
            },
            error: null,
          };
        }

        // User has no earnings yet - return zeros
        return {
          data: {
            total_earnings: '0.00',
            total_payouts: '0.00',
            pending_payouts: '0.00',
            available_balance: '0.00',
            held_balance: '0.00',
            currency: 'USD',
            fundraiser_count: 0,
            donation_count: 0,
          },
          error: null,
        };
      },
      {
        cache: {
          key: `user-earnings:${userId}`,
          ttl: 60, // 1 minute cache
          tags: ['user-earnings', `user-${userId}`],
        },
      }
    );
  }

  // ============= ADMIN METHODS =============

  /**
   * Get all payout requests (admin)
   */
  async getAllPayoutRequests(filters?: {
    status?: string;
    priority?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PayoutRequest[]> {
    return unifiedApi.query(
      async () => {
        let query = supabase
          .from('payout_requests')
          .select('*')
          .order('created_at', { ascending: false });

        if (filters?.status) {
          query = query.eq('status', filters.status as any);
        }
        if (filters?.priority) {
          query = query.eq('priority', filters.priority as any);
        }
        if (filters?.startDate) {
          query = query.gte('created_at', filters.startDate);
        }
        if (filters?.endDate) {
          query = query.lte('created_at', filters.endDate);
        }

        const { data, error } = await query;
        return { data, error };
      },
      {
        cache: {
          key: `admin-payouts:${JSON.stringify(filters)}`,
          ttl: 30, // 30 seconds cache
        },
      }
    );
  }

  /**
   * Approve a payout request (admin)
   */
  async approvePayout(payoutId: string, adminNotes?: string): Promise<void> {
    const { data, error } = await supabase.functions.invoke('payout-process', {
      body: {
        action: 'approve',
        payout_id: payoutId,
        admin_notes: adminNotes,
      },
    });

    if (error) {
      throw new Error(error.message || 'Failed to approve payout');
    }

    if (data.error) {
      throw new Error(data.error);
    }

    // Invalidate cache
    await unifiedApi.clearCache('admin-payouts:*');
    await unifiedApi.clearCache('payout-requests:*');
  }

  /**
   * Deny a payout request (admin)
   */
  async denyPayout(payoutId: string, denialReason: string): Promise<void> {
    const { data, error } = await supabase.functions.invoke('payout-process', {
      body: {
        action: 'deny',
        payout_id: payoutId,
        denial_reason: denialReason,
      },
    });

    if (error) {
      throw new Error(error.message || 'Failed to deny payout');
    }

    if (data.error) {
      throw new Error(data.error);
    }

    // Invalidate cache
    await unifiedApi.clearCache('admin-payouts:*');
    await unifiedApi.clearCache('payout-requests:*');
  }

  /**
   * Request more information (admin)
   */
  async requestMoreInfo(payoutId: string, message: string): Promise<void> {
    const { data, error } = await supabase.functions.invoke('payout-process', {
      body: {
        action: 'request_info',
        payout_id: payoutId,
        info_message: message,
      },
    });

    if (error) {
      throw new Error(error.message || 'Failed to request information');
    }

    if (data.error) {
      throw new Error(data.error);
    }

    // Invalidate cache
    await unifiedApi.clearCache('admin-payouts:*');
    await unifiedApi.clearCache('payout-requests:*');
  }
}

// Export singleton instance
export const payoutService = new PayoutService();
