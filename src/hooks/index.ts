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

// Search
export { useSearch } from './useSearch';
export { useEnhancedSearch } from './useEnhancedSearch';

// Follow/Unfollow (Event-driven)
export { useFollowUserEventDriven as useFollowUser } from './useFollowUserEventDriven';
export { useFollowOrganizationEventDriven as useFollowOrganization } from './useFollowOrganizationEventDriven';

// Other
export { useToast } from './use-toast';
export { useIsMobile } from './use-mobile';

// Project hooks
export { useProjectMilestones } from './useProjectMilestones';
export { useProjectUpdates } from './useProjectUpdates';
export { useProjectStats } from './useProjectStats';
