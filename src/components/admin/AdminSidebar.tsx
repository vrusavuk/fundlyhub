import { NavLink, useLocation } from 'react-router-dom';
import {
  BarChart3,
  Users,
  Building2,
  FileText,
  Settings,
  Shield,
  Activity,
  Database,
  AlertTriangle,
  Crown,
  PieChart,
  Bell,
  ChevronDown
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from '@/components/ui/sidebar';
import { useRBAC } from '@/hooks/useRBAC';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface AdminNavItem {
  title: string;
  url: string;
  icon: React.ComponentType<any>;
  permission?: string;
  badge?: string;
}

const navigationItems: AdminNavItem[] = [
  {
    title: 'Dashboard',
    url: '/admin',
    icon: BarChart3
  },
  {
    title: 'Analytics',
    url: '/admin/analytics',
    icon: PieChart,
    permission: 'view_platform_analytics'
  },
  {
    title: 'Users',
    url: '/admin/users',
    icon: Users,
    permission: 'view_all_users'
  },
  {
    title: 'Campaigns',
    url: '/admin/campaigns',
    icon: FileText,
    permission: 'manage_campaigns'
  },
  {
    title: 'Organizations',
    url: '/admin/organizations',
    icon: Building2,
    permission: 'view_all_organizations'
  },
  {
    title: 'Notifications',
    url: '/admin/notifications',
    icon: Bell,
    permission: 'manage_communications'
  },
  {
    title: 'Roles & Permissions',
    url: '/admin/roles',
    icon: Shield,
    permission: 'manage_roles'
  },
  {
    title: 'Audit Logs',
    url: '/admin/audit-logs',
    icon: Activity,
    permission: 'view_audit_logs'
  },
  {
    title: 'System Health',
    url: '/admin/system',
    icon: Database,
    permission: 'manage_system_settings'
  }
];

export function AdminSidebar() {
  const location = useLocation();
  const { hasPermission, isSuperAdmin, getHighestRole } = useRBAC();
  const { state } = useSidebar();
  
  const currentPath = location.pathname;
  const highestRole = getHighestRole();

  const isActive = (path: string) => {
    if (path === '/admin') {
      return currentPath === '/admin';
    }
    return currentPath.startsWith(path);
  };

  // Filter navigation items based on permissions
  const visibleItems = navigationItems.filter(item => 
    !item.permission || hasPermission(item.permission)
  );

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Crown className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Admin Panel</span>
                {highestRole && (
                  <span className="truncate text-xs text-muted-foreground">
                    {highestRole.role_name.replace('_', ' ')}
                  </span>
                )}
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => {
                const isActiveRoute = isActive(item.url);
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild
                      isActive={isActiveRoute}
                      tooltip={state === "collapsed" ? item.title : undefined}
                    >
                      <NavLink to={item.url} end={item.url === '/admin'}>
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                        {item.badge && state === "expanded" && (
                          <Badge variant="destructive" className="ml-auto text-xs">
                            {item.badge}
                          </Badge>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* System Status Section */}
        <SidebarGroup>
          <SidebarGroupLabel>System</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs px-2">
                <span className="text-muted-foreground">Health</span>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-green-500 font-medium">Good</span>
                </div>
              </div>
              
              {state === "expanded" && (
                <>
                  <div className="flex items-center justify-between text-xs px-2">
                    <span className="text-muted-foreground">Active Users</span>
                    <span className="text-foreground font-medium">1,247</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs px-2">
                    <span className="text-muted-foreground">Pending Reviews</span>
                    <Badge variant="secondary" className="text-xs">
                      23
                    </Badge>
                  </div>
                </>
              )}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        {/* Super Admin Warning */}
        {isSuperAdmin() && state === "expanded" && (
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-yellow-500">Super Admin</p>
                <p className="text-xs text-yellow-500/80 mt-1">
                  Full platform access. Use with caution.
                </p>
              </div>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}