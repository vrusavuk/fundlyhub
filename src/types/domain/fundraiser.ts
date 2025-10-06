/**
 * Fundraiser domain types - consolidated and enhanced
 */

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
  description?: string;
  goal_amount: number;
  raised_amount?: number;
  currency: string;
  category_id?: string;
  status: FundraiserStatus;
  visibility: 'public' | 'unlisted' | 'private';
  type?: 'personal' | 'charity';
  link_token?: string;
  passcode_hash?: string;
  is_discoverable?: boolean;
  urgency?: FundraiserUrgency;
  cover_image?: string;
  images?: string[];
  video_url?: string;
  location?: string;
  tags?: string[];
  end_date?: string;
  beneficiary_name?: string;
  beneficiary_contact?: string;
  
  // Relationships
  owner_user_id: string;
  org_id?: string;
  profiles?: import('./user').UserProfile | import('./user').Profile;
  organizations?: import('./organization').Organization;
  
  // Soft delete fields
  deleted_at?: string;
  deleted_by?: string;
  
  // Computed fields
  progress_percentage?: number;
  days_remaining?: number;
  donor_count?: number;
}

export type FundraiserStatus = 
  | 'draft'
  | 'active'
  | 'paused'
  | 'ended'
  | 'closed'
  | 'pending'
  | 'completed'
  | 'cancelled';

export type FundraiserUrgency = 
  | 'low'
  | 'medium'
  | 'high';

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
  urgency?: FundraiserUrgency;
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
  { name: 'Business', emoji: '💼', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  { name: 'Memorial', emoji: '🕯️', color: 'bg-gray-50 text-gray-700 border-gray-200' },
  { name: 'Charity', emoji: '❤️', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  { name: 'Religious', emoji: '⛪', color: 'bg-violet-50 text-violet-700 border-violet-200' },
  { name: 'Travel', emoji: '✈️', color: 'bg-sky-50 text-sky-700 border-sky-200' },
  { name: 'Technology', emoji: '💻', color: 'bg-slate-50 text-slate-700 border-slate-200' },
  { name: 'Family', emoji: '👨‍👩‍👧‍👦', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { name: 'Housing', emoji: '🏠', color: 'bg-stone-50 text-stone-700 border-stone-200' },
] as const;

export type CategoryName = typeof CATEGORIES[number]['name'];