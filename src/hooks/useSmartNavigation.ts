/**
 * Hook to determine whether to show breadcrumbs vs back button
 */
import { useLocation } from 'react-router-dom';
import { useNavigation } from '@/contexts/NavigationContext';
import { useEffect } from 'react';

export function useSmartNavigation() {
  const location = useLocation();
  const { setShouldShowBackButton, breadcrumbs } = useNavigation();

  useEffect(() => {
    const shouldUseBackButton = shouldShowBackButton();
    setShouldShowBackButton(shouldUseBackButton);
  }, [location.pathname]);

  const shouldShowBackButton = (): boolean => {
    const path = location.pathname;
    
    // Back button for linear workflows and creation flows
    const backButtonPaths = [
      '/create',
      '/auth',
    ];

    // Check if current path should use back button
    return backButtonPaths.some(backPath => path.startsWith(backPath));
  };

  const shouldShowBreadcrumbs = (): boolean => {
    const path = location.pathname;
    
    // Breadcrumbs for hierarchical navigation (3+ levels deep)
    const breadcrumbPaths = [
      '/fundraiser/',
      '/profile/',
      '/organization/',
      '/search',
    ];

    return breadcrumbPaths.some(breadcrumbPath => path.startsWith(breadcrumbPath)) && breadcrumbs.length > 2;
  };

  return {
    shouldShowBreadcrumbs: shouldShowBreadcrumbs(),
    shouldShowBackButton: shouldShowBackButton(),
  };
}