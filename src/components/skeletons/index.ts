/**
 * Centralized skeleton exports
 */

// Enhanced skeleton components
export { Skeleton, SkeletonText, SkeletonImage, SkeletonAvatar, SkeletonButton } from '@/components/ui/enhanced-skeleton';

// Specific skeleton screens
export { FundraiserCardSkeleton } from './FundraiserCardSkeleton';
export { ActivityItemSkeleton } from './ActivityItemSkeleton';
export { ProfileHeaderSkeleton } from './ProfileHeaderSkeleton';
export { SearchResultSkeleton } from './SearchResultSkeleton';
export { SearchPageSkeleton } from './SearchPageSkeleton';
export { SearchFiltersSkeleton } from './SearchFiltersSkeleton';
export { SearchStatsSkeleton } from './SearchStatsSkeleton';

// Page-level skeletons
export { 
  ProfilePageSkeleton, 
  ProfileHeaderSkeleton as ProfilePageHeader,
  ProfileTabContentSkeleton,
  ProfileCampaignCardSkeleton,
  ProfileFollowerItemSkeleton
} from './ProfilePageSkeleton';
export { CampaignPageSkeleton } from './CampaignPageSkeleton';

// Loading state variants
export type SkeletonVariant = 
  | 'default' 
  | 'fundraiser-cards' 
  | 'activity-items' 
  | 'profile-header' 
  | 'profile-page'
  | 'campaign-page'
  | 'search-results'
  | 'search-page'
  | 'table'
  | 'cards';

// Skeleton count configurations
export const SKELETON_COUNTS = {
  FUNDRAISER_CARDS: 6,
  ACTIVITY_ITEMS: 5,
  SEARCH_RESULTS: 8,
  TABLE_ROWS: 10,
  COMMENTS: 3,
} as const;