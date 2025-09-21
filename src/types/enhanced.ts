/**
 * Enhanced type definitions for better type safety
 * Consolidates and improves existing type definitions
 */

// Base entity interface
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

// User profile types
export interface UserProfile extends BaseEntity {
  user_id: string;
  name: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  verified: boolean;
}

// Organization types
export interface Organization extends BaseEntity {
  name: string;
  description?: string;
  logo_url?: string;
  website?: string;
  location?: string;
  verified: boolean;
  type: 'nonprofit' | 'charity' | 'foundation' | 'community';
}

// Enhanced fundraiser types
export interface Fundraiser extends BaseEntity {
  title: string;
  slug: string;
  summary?: string;
  description?: string;
  goal_amount: number;
  raised_amount?: number;
  currency: string;
  category: FundraiserCategory;
  cover_image?: string;
  location?: string;
  status: FundraiserStatus;
  urgency?: FundraiserUrgency;
  end_date?: string;
  
  // Relationships
  user_id: string;
  organization_id?: string;
  profiles?: UserProfile;
  organizations?: Organization;
  
  // Computed fields
  progress_percentage?: number;
  days_remaining?: number;
  donor_count?: number;
}

// Fundraiser enums
export type FundraiserCategory = 
  | 'Medical'
  | 'Emergency' 
  | 'Education'
  | 'Community'
  | 'Animal'
  | 'Environment'
  | 'Sports'
  | 'Arts'
  | 'Memorial'
  | 'Other';

export type FundraiserStatus = 
  | 'draft'
  | 'active'
  | 'paused'
  | 'completed'
  | 'cancelled';

export type FundraiserUrgency = 
  | 'low'
  | 'medium'
  | 'high';

// Donation types
export interface Donation extends BaseEntity {
  amount: number;
  currency: string;
  message?: string;
  anonymous: boolean;
  fundraiser_id: string;
  donor_id?: string;
  donor_name?: string;
  donor_email?: string;
  payment_status: PaymentStatus;
  payment_method?: string;
  
  // Relationships
  fundraiser?: Fundraiser;
  donor?: UserProfile;
}

export type PaymentStatus = 
  | 'pending'
  | 'completed'
  | 'failed'
  | 'refunded';

// Search types
export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle?: string;
  image?: string;
  snippet?: string;
  link: string;
  relevanceScore?: number;
  highlightedTitle?: string;
  highlightedSubtitle?: string;
  matchedFields?: string[];
}

export type SearchResultType = 'campaign' | 'user' | 'organization';

// API response types
export interface ApiResponse<T> {
  data: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  hasMore: boolean;
  page: number;
  limit: number;
}

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

// Form types
export interface CreateFundraiserData {
  title: string;
  summary?: string;
  description?: string;
  goal_amount: number;
  currency: string;
  category: FundraiserCategory;
  cover_image?: File | string;
  location?: string;
  end_date?: string;
  organization_id?: string;
}

export interface UpdateFundraiserData extends Partial<CreateFundraiserData> {
  id: string;
  status?: FundraiserStatus;
}

// Component prop types
export interface ComponentWithChildren {
  children: React.ReactNode;
  className?: string;
}

export interface ComponentWithLoading {
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

// Hook types
export interface UseAsyncResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export interface UsePaginatedResult<T> extends UseAsyncResult<T[]> {
  hasMore: boolean;
  loadMore: () => void;
  page: number;
  total: number;
}