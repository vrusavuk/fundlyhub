/**
 * Core domain types for the fundraising platform
 */

export interface Profile {
  id?: string;
  name: string;
  email?: string;
  avatar?: string;
  role?: 'visitor' | 'user' | 'admin';
}

export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at?: string;
}

export interface Fundraiser extends BaseEntity {
  title: string;
  slug: string;
  summary?: string;
  story_html?: string;
  goal_amount: number;
  currency: string;
  category?: string;
  status: 'draft' | 'active' | 'paused' | 'ended';
  visibility: 'public' | 'unlisted';
  cover_image?: string;
  images?: string[];
  video_url?: string;
  location?: string;
  tags?: string[];
  end_date?: string;
  beneficiary_name?: string;
  beneficiary_contact?: string;
  owner_user_id: string;
  org_id?: string;
  profiles?: Profile;
}

export interface Donation extends BaseEntity {
  fundraiser_id: string;
  donor_user_id?: string;
  amount: number;
  tip_amount?: number;
  net_amount?: number;
  fee_amount?: number;
  currency: string;
  payment_provider?: string;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  receipt_id?: string;
}

export interface FundraiserCardData {
  id: string;
  title: string;
  summary?: string;
  goalAmount: number;
  raisedAmount: number;
  currency: string;
  coverImage: string;
  category: string;
  organizationName?: string;
  location?: string;
  donorCount: number;
  daysLeft?: number;
  urgency?: 'high' | 'medium' | 'low';
  isVerified?: boolean;
  isOrganization?: boolean;
  avatarUrl?: string;
  slug?: string;
}

export interface CategoryData {
  name: string;
  emoji: string;
  color: string;
}

export const CATEGORIES: readonly CategoryData[] = [
  { name: 'Medical', emoji: '🏥', color: 'bg-red-50 text-red-700 border-red-200' },
  { name: 'Emergency', emoji: '🚨', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { name: 'Education', emoji: '🎓', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { name: 'Community', emoji: '🏘️', color: 'bg-green-50 text-green-700 border-green-200' },
  { name: 'Animal', emoji: '🐾', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { name: 'Environment', emoji: '🌱', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { name: 'Sports', emoji: '⚽', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { name: 'Arts', emoji: '🎨', color: 'bg-pink-50 text-pink-700 border-pink-200' },
] as const;

export type CategoryName = typeof CATEGORIES[number]['name'];