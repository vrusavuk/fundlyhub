/**
 * Custom hook for detail pages to set dynamic breadcrumbs
 * Automatically cleans up on unmount and handles loading states
 */
import { useEffect } from 'react';
import { useBreadcrumbContext } from '@/contexts/BreadcrumbContext';
import { BreadcrumbItem } from './useBreadcrumbs';

export function useDetailPageBreadcrumbs(
  section: string,
  sectionPath: string,
  entityName: string | undefined,
  loading: boolean
) {
  const { setCustomBreadcrumbs } = useBreadcrumbContext();

  useEffect(() => {
    // Only set breadcrumbs when data has loaded and entityName is available
    if (!loading && entityName) {
      const breadcrumbs: BreadcrumbItem[] = [
        { label: 'Dashboard', href: '/admin' },
        { label: section, href: sectionPath },
        { label: entityName, href: '' }, // Empty href for current page
      ];
      setCustomBreadcrumbs(breadcrumbs);
    }

    // Cleanup: reset to null when component unmounts
    return () => {
      setCustomBreadcrumbs(null);
    };
  }, [loading, entityName, section, sectionPath, setCustomBreadcrumbs]);
}
