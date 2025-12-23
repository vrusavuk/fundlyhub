/**
 * Custom hooks barrel export
 * Central export point for all application hooks
 */

// Admin hooks
export { useAdminActions } from './useAdminActions';
export { useAdminRealtime, useAdminRealtimeMultiple } from './useAdminRealtime';

// Utility hooks
export { useDebounce } from './useDebounce';
export { usePagination } from './usePagination';

// Auth & RBAC
export { useAuth } from './useAuth';
export { useRBAC } from './useRBAC';

// ===== CONSOLIDATED HOOKS =====

// Unified Search (replaces useSearch, useEnhancedSearch, useOptimizedSearch, useSearchSuggestions)
export { useUnifiedSearch, highlightSearchText } from './useUnifiedSearch';
export type { UseUnifiedSearchOptions, UseUnifiedSearchResult, SearchScope } from './useUnifiedSearch';

// Unified Search UI (replaces useSearchInput, useSearchKeyboard, useSearchModal, useSearchNavigation)
export { useSearchUI } from './useSearchUI';
export type { UseSearchUIOptions, UseSearchUIResult } from './useSearchUI';

// Unified Follow (replaces useFollowUserEventDriven, useFollowOrganizationEventDriven)
export { useFollow, useFollowUser, useFollowOrganization } from './useFollow';
export type { UseFollowOptions, UseFollowResult, FollowEntityType } from './useFollow';

// Unified Realtime (replaces useSupabaseRealtime, useAdminRealtime for generic use)
export { useRealtimeSubscription, useMultipleRealtimeSubscriptions } from './useRealtimeSubscription';
export type { RealtimeSubscriptionConfig, UseRealtimeSubscriptionResult, RealtimeEvent, ConnectionStatus } from './useRealtimeSubscription';

// ===== LEGACY HOOKS (deprecated, use consolidated versions) =====

// Search (deprecated - use useUnifiedSearch)
export { useSearch } from './useSearch';
export { useEnhancedSearch } from './useEnhancedSearch';

// Other
export { useToast } from './use-toast';
export { useIsMobile } from './use-mobile';

// Project hooks
export { useProjectMilestones } from './useProjectMilestones';
export { useProjectUpdates } from './useProjectUpdates';
export { useProjectStats } from './useProjectStats';
