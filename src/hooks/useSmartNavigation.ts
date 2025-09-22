/**
 * Hook to determine responsive navigation strategy (breadcrumbs vs back button)
 * Implements mobile-first approach with context-aware navigation
 */
import { useLocation } from 'react-router-dom';
import { useNavigation } from '@/contexts/NavigationContext';
import { useIsMobile } from './use-mobile';
import { useEffect } from 'react';

export function useSmartNavigation() {
  const location = useLocation();
  const { setShouldShowBackButton, breadcrumbs } = useNavigation();
  const isMobile = useIsMobile();

  const shouldShowBackButton = (): boolean => {
    const path = location.pathname;
    
    // Mobile-first: Always show back button for detail views and forms
    const mobileBackButtonPaths = [
      '/create',
      '/auth',
      '/fundraiser/',
      '/profile/',
      '/organization/',
    ];

    // Desktop: Back button only for linear workflows
    const desktopBackButtonPaths = [
      '/create',
      '/auth',
    ];

    const pathsToCheck = isMobile ? mobileBackButtonPaths : desktopBackButtonPaths;
    return pathsToCheck.some(backPath => path.startsWith(backPath));
  };

  useEffect(() => {
    const shouldUseBackButton = shouldShowBackButton();
    setShouldShowBackButton(shouldUseBackButton);
  }, [location.pathname, isMobile]);

  const shouldShowBreadcrumbs = (): boolean => {
    const path = location.pathname;
    
    // On mobile: Show breadcrumbs only for deep hierarchical navigation (4+ levels)
    if (isMobile) {
      const deepHierarchyPaths = [
        '/search',
      ];
      return deepHierarchyPaths.some(breadcrumbPath => path.startsWith(breadcrumbPath)) && breadcrumbs.length > 2;
    }
    
    // Desktop: Show breadcrumbs for hierarchical navigation (3+ levels deep)
    const breadcrumbPaths = [
      '/fundraiser/',
      '/profile/',
      '/organization/',
      '/search',
    ];

    return breadcrumbPaths.some(breadcrumbPath => path.startsWith(breadcrumbPath)) && breadcrumbs.length > 1;
  };

  const shouldShowMobileBreadcrumbs = (): boolean => {
    return isMobile && shouldShowBreadcrumbs();
  };

  const getNavigationContext = (): string => {
    const path = location.pathname;
    
    // Provide context for mobile header when breadcrumbs are hidden
    if (path.startsWith('/fundraiser/') && breadcrumbs.length > 1) {
      return breadcrumbs[breadcrumbs.length - 2]?.label || '';
    }
    
    if (path.startsWith('/profile/') && breadcrumbs.length > 1) {
      return 'Profile';
    }
    
    if (path.startsWith('/organization/') && breadcrumbs.length > 1) {
      return 'Organization';
    }
    
    return '';
  };

  return {
    shouldShowBreadcrumbs: shouldShowBreadcrumbs(),
    shouldShowBackButton: shouldShowBackButton(),
    shouldShowMobileBreadcrumbs: shouldShowMobileBreadcrumbs(),
    navigationContext: getNavigationContext(),
    isMobile,
  };
}