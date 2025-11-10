/**
 * Hook for generating smart breadcrumbs based on current route and context
 */
import { useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useNavigation, BreadcrumbItem } from '@/contexts/NavigationContext';
import { supabase } from '@/integrations/supabase/client';

export function useBreadcrumbs() {
  const location = useLocation();
  const params = useParams();
  const { setBreadcrumbs } = useNavigation();

  useEffect(() => {
    generateBreadcrumbs();
  }, [location.pathname]);

  const generateBreadcrumbs = async () => {
    const breadcrumbs: BreadcrumbItem[] = [];

    const pathSegments = location.pathname.slice(1).split('/');
    const [firstSegment, secondSegment] = pathSegments;

    switch (firstSegment) {
      case 'campaigns':
        breadcrumbs.push({ label: 'Campaigns', href: '/campaigns' });
        break;

      case 'fundraiser':
        if (params.slug) {
          breadcrumbs.push({ label: 'Campaigns', href: '/campaigns' });
          
          // Add category breadcrumb if available
          const categoryFromState = (location.state as any)?.category;
          if (categoryFromState) {
            breadcrumbs.push({ 
              label: categoryFromState, 
              href: `/campaigns?category=${encodeURIComponent(categoryFromState)}` 
            });
          }

          // Add fundraiser title (loading initially)
          breadcrumbs.push({ 
            label: 'Loading...', 
            href: location.pathname,
            isLoading: true 
          });

          // Fetch fundraiser title
          fetchFundraiserTitle(params.slug, breadcrumbs, setBreadcrumbs);
        }
        break;

      case 'profile':
        if (params.userId) {
          breadcrumbs.push({ label: 'Users', href: '/campaigns' });
          breadcrumbs.push({ 
            label: 'Loading...', 
            href: location.pathname,
            isLoading: true 
          });
          
          // Fetch user name
          fetchUserName(params.userId, breadcrumbs, setBreadcrumbs);
        }
        break;

      case 'organization':
        if (params.orgId) {
          breadcrumbs.push({ label: 'Organizations', href: '/campaigns' });
          breadcrumbs.push({ 
            label: 'Loading...', 
            href: location.pathname,
            isLoading: true 
          });
          
          // Fetch organization name
          fetchOrganizationName(params.orgId, breadcrumbs, setBreadcrumbs);
        }
        break;

      case 'search':
        const query = new URLSearchParams(location.search).get('q');
        breadcrumbs.push({ 
          label: query ? `Search: "${query}"` : 'Search Results', 
          href: location.pathname + location.search 
        });
        break;

      case 'fundly-give':
        breadcrumbs.push({ label: 'Fundly Give', href: '/fundly-give' });
        break;

      case 'admin':
        // Handle admin routes
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
          
          const routeLabel = adminRoutes[secondSegment] || secondSegment.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
          breadcrumbs.push({ 
            label: routeLabel, 
            href: location.pathname 
          });
        }
        break;

      default:
        // For other routes, don't add breadcrumbs (they'll use back button or no navigation)
        return;
    }

    setBreadcrumbs(breadcrumbs);
  };

  const fetchFundraiserTitle = async (slug: string, currentBreadcrumbs: BreadcrumbItem[], setBreadcrumbs: (items: BreadcrumbItem[]) => void) => {
    try {
      const { data } = await supabase
        .from('fundraisers')
        .select(`
          title,
          category_id,
          categories!fundraisers_category_id_fkey (
            id,
            name,
            emoji
          )
        `)
        .eq('slug', slug)
        .single();

      if (data) {
        const updatedBreadcrumbs = [...currentBreadcrumbs];
        
        // Update category if not already present and we have category data
        const categoryData = data.categories;
        if (categoryData && !updatedBreadcrumbs.find(b => b.label.toLowerCase() === categoryData.name?.toLowerCase())) {
          updatedBreadcrumbs.splice(-1, 0, { 
            label: categoryData.name, 
            href: `/campaigns?category=${encodeURIComponent(categoryData.name)}` 
          });
        }
        
        // Update title
        updatedBreadcrumbs[updatedBreadcrumbs.length - 1] = {
          label: data.title,
          href: currentBreadcrumbs[currentBreadcrumbs.length - 1].href,
          isLoading: false
        };
        
        setBreadcrumbs(updatedBreadcrumbs);
      }
    } catch (error) {
      console.error('Error fetching fundraiser title:', error);
    }
  };

  const fetchUserName = async (userId: string, currentBreadcrumbs: BreadcrumbItem[], setBreadcrumbs: (items: BreadcrumbItem[]) => void) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', userId)
        .single();

      if (data) {
        const updatedBreadcrumbs = [...currentBreadcrumbs];
        updatedBreadcrumbs[updatedBreadcrumbs.length - 1] = {
          label: data.name,
          href: currentBreadcrumbs[currentBreadcrumbs.length - 1].href,
          isLoading: false
        };
        setBreadcrumbs(updatedBreadcrumbs);
      }
    } catch (error) {
      console.error('Error fetching user name:', error);
    }
  };

  const fetchOrganizationName = async (orgId: string, currentBreadcrumbs: BreadcrumbItem[], setBreadcrumbs: (items: BreadcrumbItem[]) => void) => {
    try {
      const { data } = await supabase
        .from('organizations')
        .select('legal_name, dba_name')
        .eq('id', orgId)
        .single();

      if (data) {
        const updatedBreadcrumbs = [...currentBreadcrumbs];
        updatedBreadcrumbs[updatedBreadcrumbs.length - 1] = {
          label: data.dba_name || data.legal_name,
          href: currentBreadcrumbs[currentBreadcrumbs.length - 1].href,
          isLoading: false
        };
        setBreadcrumbs(updatedBreadcrumbs);
      }
    } catch (error) {
      console.error('Error fetching organization name:', error);
    }
  };
}