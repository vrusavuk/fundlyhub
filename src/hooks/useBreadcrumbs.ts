/**
 * Simplified breadcrumb generation hook
 * Returns breadcrumbs synchronously based on current route
 */
import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  href: string;
}

export function useBreadcrumbs(): BreadcrumbItem[] {
  const location = useLocation();

  return useMemo(() => {
    const breadcrumbs: BreadcrumbItem[] = [];
    const pathSegments = location.pathname.slice(1).split('/');
    const [firstSegment, secondSegment, thirdSegment] = pathSegments;

    // Only handle admin routes (other routes don't need breadcrumbs)
    if (firstSegment !== 'admin') {
      return breadcrumbs;
    }

    // Always add Dashboard as root
    breadcrumbs.push({ label: 'Dashboard', href: '/admin' });

    if (secondSegment) {
      const adminRoutes: Record<string, string> = {
        'users': 'User Management',
        'campaigns': 'Campaign Management',
        'donations': 'Donation Management',
        'organizations': 'Organization Management',
        'roles': 'Role Management',
        'analytics': 'Analytics',
        'settings': 'System Settings',
        'audit-logs': 'Audit Logs',
        'notifications': 'Notification Center',
        'system-health': 'System Health',
        'system': 'System Health',
        'design-system': 'Design System'
      };

      const routeLabel = adminRoutes[secondSegment] || 
        secondSegment
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

      breadcrumbs.push({
        label: routeLabel,
        href: `/admin/${secondSegment}`
      });

      // Handle detail pages if needed
      if (thirdSegment) {
        breadcrumbs.push({
          label: thirdSegment.charAt(0).toUpperCase() + thirdSegment.slice(1),
          href: location.pathname
        });
      }
    }

    return breadcrumbs;
  }, [location.pathname]);
}
