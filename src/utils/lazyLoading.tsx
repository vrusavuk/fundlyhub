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

export function LazyWrapper({ fallback, children }: LazyComponentProps) {
  return (
    <ErrorBoundary>
      <Suspense fallback={fallback || <LoadingSpinner size="lg" />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

// Lazy load pages for better performance
export const LazyAllCampaigns = lazy(() => import('@/pages/AllCampaigns'));
export const LazySearchResults = lazy(() => import('@/pages/SearchResults'));
export const LazyFundraiserDetail = lazy(() => import('@/pages/FundraiserDetail'));
export const LazyCreateFundraiser = lazy(() => import('@/pages/CreateFundraiser'));
export const LazyUserProfile = lazy(() => import('@/pages/UserProfile').then(module => ({ default: module.UserProfile })));
export const LazyOrganizationProfile = lazy(() => import('@/pages/OrganizationProfile').then(module => ({ default: module.OrganizationProfile })));
export const LazyApiDocs = lazy(() => import('@/pages/ApiDocs'));

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