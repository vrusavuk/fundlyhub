/**
 * Donation domain types
 */
import type { BaseEntity } from './fundraiser';
import type { Fundraiser } from './fundraiser';
import type { UserProfile } from './user';

export interface Donation extends BaseEntity {
  fundraiser_id: string;
  donor_user_id?: string;
  amount: number;
  tip_amount?: number;
  net_amount?: number;
  fee_amount?: number;
  currency: string;
  payment_provider?: string;
  payment_status: PaymentStatus;
  receipt_id?: string;
  
  // Additional fields from enhanced types
  message?: string;
  anonymous: boolean;
  donor_name?: string;
  donor_email?: string;
  payment_method?: string;
  
  // Relationships
  fundraiser?: Fundraiser;
  donor?: UserProfile;
}

export type PaymentStatus = 
  | 'pending'
  | 'paid'
  | 'completed'
  | 'failed'
  | 'refunded';