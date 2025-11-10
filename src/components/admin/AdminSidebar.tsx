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
  ChevronDown,
  Home,
  ArrowLeft,
  DollarSign
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
    title: 'Donations',
    url: '/admin/donations',
    icon: DollarSign,
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
  },
  {
    title: 'Settings',
    url: '/admin/settings',
    icon: Settings,
    permission: 'manage_system_settings' as const,
  },
  {
    title: 'Event Monitoring',
    url: '/admin/events',
    icon: Activity,
    permission: 'manage_system_settings' as const,
    badge: 'New',
  },
  {
    title: 'Design System',
    url: '/admin/design-system',
    icon: Settings,
    permission: 'manage_system_settings' as const,
  },
  {
    title: 'Feature Toggles',
    url: '/admin/feature-toggles',
    icon: Shield,
    permission: 'manage_system_settings' as const,
  },
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
    <Sidebar 
      variant="inset" 
      collapsible="icon"
      className="border-r border-[#E3E8EE] bg-[#0A2540]"
    >
      <SidebarHeader className="border-b border-[#1A3A5A]">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="hover:bg-[#1A3A5A]">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-[#635BFF]">
                <Crown className="size-4 text-white" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold text-white">Admin Panel</span>
                {highestRole && (
                  <span className="truncate text-xs text-gray-400">
                    {highestRole.role_name.replace('_', ' ')}
                  </span>
                )}
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="bg-[#0A2540]">
        {/* Return to Site */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild
                  tooltip={state === "collapsed" ? "Return to Site" : undefined}
                  className="text-white hover:bg-[#1A3A5A] mx-2"
                >
                  <NavLink to="/">
                    <ArrowLeft className="size-4" />
                    <span>Return to Site</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Navigation
          </SidebarGroupLabel>
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
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md mx-2",
                        "transition-colors text-white hover:bg-[#1A3A5A]",
                        isActiveRoute && "bg-[#635BFF] text-white font-semibold"
                      )}
                    >
                      <NavLink to={item.url} end={item.url === '/admin'}>
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                        {item.badge && state === "expanded" && (
                          <Badge className="ml-auto text-xs bg-[#DF1B41] text-white border-0">
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

        {/* System Status Section - Only show when expanded */}
        {state === "expanded" && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-gray-400">System</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs px-2">
                  <span className="text-gray-400">Health</span>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-[#00D924] rounded-full"></div>
                    <span className="text-[#00D924] font-medium">Good</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs px-2">
                  <span className="text-gray-400">Active Users</span>
                  <span className="text-white font-medium">1,247</span>
                </div>
                
                <div className="flex items-center justify-between text-xs px-2">
                  <span className="text-gray-400">Pending Reviews</span>
                  <Badge className="text-xs bg-[#E3E8EE] text-[#0A2540] border-0">
                    23
                  </Badge>
                </div>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="bg-[#0A2540] border-t border-[#1A3A5A]">
        {/* Super Admin Warning */}
        {isSuperAdmin() && state === "expanded" && (
          <div className="p-3 bg-[#FFC043]/10 border border-[#FFC043]/20 rounded-lg mx-2">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-[#FFC043] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-[#FFC043]">Super Admin</p>
                <p className="text-xs text-gray-400 mt-1">
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