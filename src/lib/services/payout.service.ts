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
   * Add a new bank account
   */
  async addBankAccount(accountData: {
    account_number: string;
    routing_number: string;
    account_holder_name: string;
    account_type?: string;
  }): Promise<BankAccount> {
    const { data, error } = await supabase.functions.invoke('bank-account-verify', {
      body: {
        action: 'add',
        ...accountData,
      },
    });

    if (error) {
      throw new Error(error.message || 'Failed to add bank account');
    }

    if (data.error) {
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
          .single();

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
