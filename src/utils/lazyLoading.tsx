/**
 * Lazy loading utilities with error boundaries and loading states
 */
import React, { Suspense, lazy } from 'react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

interface LazyComponentProps {
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * LazyWrapper - Error boundary only, no loading spinner
 * Pages handle their own skeleton states
 */
export function LazyWrapper({ fallback = null, children }: LazyComponentProps) {
  return (
    <ErrorBoundary>
      <Suspense fallback={fallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

// Lazy load main pages for better performance
export const LazyAllCampaigns = lazy(() => import('@/pages/AllCampaigns'));
export const LazySearchResults = lazy(() => import('@/pages/SearchResults'));
export const LazyFundraiserDetail = lazy(() => import('@/pages/FundraiserDetail'));
export const LazyCreateFundraiser = lazy(() => import('@/pages/CreateFundraiser'));
export const LazyUserProfile = lazy(() => import('@/pages/UserProfile').then(module => ({ default: module.UserProfile })));
export const LazyOrganizationProfile = lazy(() => import('@/pages/OrganizationProfile').then(module => ({ default: module.OrganizationProfile })));
export const LazyApiDocs = lazy(() => import('@/pages/ApiDocs'));
export const LazyFundlyGive = lazy(() => import('@/pages/FundlyGive'));
export const LazyNotFound = lazy(() => import('@/pages/NotFound'));
export const LazyErrorRecovery = lazy(() => import('@/pages/ErrorRecovery'));

// Lazy load admin pages - heavy components that benefit from code splitting
export const LazyAdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
export const LazyAnalytics = lazy(() => import('@/pages/admin/Analytics').then(m => ({ default: m.Analytics })));
export const LazyUserManagement = lazy(() => import('@/pages/admin/UserManagement').then(m => ({ default: m.UserManagement })));
export const LazyCampaignManagement = lazy(() => import('@/pages/admin/CampaignManagement').then(m => ({ default: m.CampaignManagement })));
export const LazyOrganizationManagement = lazy(() => import('@/pages/admin/OrganizationManagement').then(m => ({ default: m.OrganizationManagement })));
export const LazyRoleManagement = lazy(() => import('@/pages/admin/RoleManagement').then(m => ({ default: m.RoleManagement })));
export const LazyAuditLogs = lazy(() => import('@/pages/admin/AuditLogs').then(m => ({ default: m.AuditLogs })));
export const LazySystemHealth = lazy(() => import('@/pages/admin/SystemHealth').then(m => ({ default: m.SystemHealth })));
export const LazySystemSettings = lazy(() => import('@/pages/admin/SystemSettings').then(m => ({ default: m.SystemSettings })));
export const LazyAdminNotificationCenter = lazy(() => import('@/pages/admin/NotificationCenter'));
export const LazyEventMonitoring = lazy(() => import('@/pages/admin/EventMonitoring'));
export const LazyDesignSystemDocs = lazy(() => import('@/pages/admin/DesignSystemDocs').then(m => ({ default: m.DesignSystemDocs })));
export const LazyFeatureToggles = lazy(() => import('@/pages/admin/FeatureToggles'));

// Lazy load heavy components - Skip for now due to export issues
// export const LazyFundraiserGrid = lazy(() => import('@/components/fundraisers/FundraiserGrid'));
// export const LazyEnhancedSearchDropdown = lazy(() => import('@/components/search/EnhancedSearchDropdown').then(module => ({ default: module.EnhancedSearchDropdown })));

// HOC for lazy loading with enhanced error handling
export function withLazyLoading<T extends object>(
  Component: React.ComponentType<T>,
  fallback?: React.ReactNode
) {
  return React.memo((props: T) => (
    <LazyWrapper fallback={fallback}>
      <Component {...props} />
    </LazyWrapper>
  ));
}