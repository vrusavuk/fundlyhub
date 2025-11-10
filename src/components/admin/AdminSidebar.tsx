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
  ChevronDown,
  PieChart,
  Bell,
  Home,
  DollarSign,
  Search,
  Palette
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar
} from '@/components/ui/sidebar';
import { useRBAC } from '@/hooks/useRBAC';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface AdminNavItem {
  title: string;
  url: string;
  icon: React.ComponentType<any>;
  permission?: string;
  badge?: string;
}

// Main navigation items
const mainNavItems: AdminNavItem[] = [
  {
    title: 'Home',
    url: '/admin',
    icon: Home
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
];

// Analytics section
const analyticsItems: AdminNavItem[] = [
  {
    title: 'Platform Analytics',
    url: '/admin/analytics',
    icon: PieChart,
    permission: 'view_platform_analytics'
  },
];

// Management section (collapsible)
const managementItems: AdminNavItem[] = [
  {
    title: 'Roles & Permissions',
    url: '/admin/roles',
    icon: Shield,
    permission: 'manage_roles'
  },
  {
    title: 'Notifications',
    url: '/admin/notifications',
    icon: Bell,
    permission: 'manage_communications'
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
    title: 'Event Monitoring',
    url: '/admin/events',
    icon: Activity,
    permission: 'manage_system_settings',
    badge: 'New',
  },
];

// Settings section
const settingsItems: AdminNavItem[] = [
  {
    title: 'System Settings',
    url: '/admin/settings',
    icon: Settings,
    permission: 'manage_system_settings',
  },
  {
    title: 'Feature Toggles',
    url: '/admin/feature-toggles',
    icon: Shield,
    permission: 'manage_system_settings',
  },
  {
    title: 'Design System',
    url: '/admin/design-system',
    icon: Palette,
    permission: 'manage_system_settings',
  },
];

export function AdminSidebar() {
  const location = useLocation();
  const { hasPermission, getHighestRole } = useRBAC();
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
  const visibleMainItems = mainNavItems.filter(item => 
    !item.permission || hasPermission(item.permission)
  );
  
  const visibleAnalyticsItems = analyticsItems.filter(item => 
    !item.permission || hasPermission(item.permission)
  );
  
  const visibleManagementItems = managementItems.filter(item => 
    !item.permission || hasPermission(item.permission)
  );
  
  const visibleSettingsItems = settingsItems.filter(item => 
    !item.permission || hasPermission(item.permission)
  );

  // Check if any management item is active
  const isManagementActive = managementItems.some(item => isActive(item.url));

  return (
    <Sidebar
      variant="sidebar"
      collapsible="icon"
      className="border-r"
    >
      <SidebarHeader className="border-b border-[#E3E8EE]">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="hover:bg-gray-50">
              <div className="flex aspect-square size-8 items-center justify-center rounded-full bg-gray-100 text-gray-700 font-semibold text-sm">
                A
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold text-gray-900">Admin Panel</span>
                {highestRole && (
                  <span className="truncate text-xs text-gray-500 capitalize">
                    {highestRole.role_name.replace('_', ' ')}
                  </span>
                )}
              </div>
              <ChevronDown className="size-4 text-gray-500" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Search Bar */}
      {state === "expanded" && (
        <div className="px-3 py-2 border-b border-[#E3E8EE]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search..."
              className="pl-9 h-9 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500"
            />
          </div>
        </div>
      )}

      <SidebarContent className="bg-white">
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleMainItems.map((item) => {
                const isActiveRoute = isActive(item.url);
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild
                      isActive={isActiveRoute}
                      tooltip={state === "collapsed" ? item.title : undefined}
                      className={cn(
                        "relative flex items-center gap-3 px-3 py-2 text-sm font-medium",
                        "transition-colors hover:bg-gray-50",
                        isActiveRoute 
                          ? "text-blue-600 font-semibold before:absolute before:left-0 before:top-0 before:bottom-0 before:w-0.5 before:bg-blue-600" 
                          : "text-gray-700"
                      )}
                    >
                      <NavLink to={item.url} end={item.url === '/admin'}>
                        <item.icon className={cn(
                          "size-4",
                          isActiveRoute ? "text-blue-600" : "text-gray-500"
                        )} />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Analytics Section */}
        {visibleAnalyticsItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="px-3 text-xs font-normal text-gray-500">
              Analytics
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleAnalyticsItems.map((item) => {
                  const isActiveRoute = isActive(item.url);
                  
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild
                        isActive={isActiveRoute}
                        tooltip={state === "collapsed" ? item.title : undefined}
                        className={cn(
                          "relative flex items-center gap-3 px-3 py-2 text-sm font-medium",
                          "transition-colors hover:bg-gray-50",
                          isActiveRoute 
                            ? "text-blue-600 font-semibold before:absolute before:left-0 before:top-0 before:bottom-0 before:w-0.5 before:bg-blue-600" 
                            : "text-gray-700"
                        )}
                      >
                        <NavLink to={item.url}>
                          <item.icon className={cn(
                            "size-4",
                            isActiveRoute ? "text-blue-600" : "text-gray-500"
                          )} />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Management Section (Collapsible) */}
        {visibleManagementItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="px-3 text-xs font-normal text-gray-500">
              Management
            </SidebarGroupLabel>
            <Collapsible defaultOpen={isManagementActive} className="group/collapsible">
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton className="hover:bg-gray-50">
                    <Shield className="size-4 text-gray-500" />
                    <span className="text-gray-700">Administration</span>
                    <ChevronDown className="ml-auto size-4 text-gray-500 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {visibleManagementItems.map((item) => {
                      const isActiveRoute = isActive(item.url);
                      
                      return (
                        <SidebarMenuSubItem key={item.title}>
                          <SidebarMenuSubButton 
                            asChild
                            isActive={isActiveRoute}
                            className={cn(
                              "relative",
                              isActiveRoute && "text-blue-600 font-semibold"
                            )}
                          >
                            <NavLink to={item.url}>
                              <item.icon className={cn(
                                "size-4",
                                isActiveRoute ? "text-blue-600" : "text-gray-500"
                              )} />
                              <span>{item.title}</span>
                              {item.badge && (
                                <Badge className="ml-auto text-xs bg-blue-100 text-blue-600 border-0">
                                  {item.badge}
                                </Badge>
                              )}
                            </NavLink>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      );
                    })}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          </SidebarGroup>
        )}

        {/* Settings Section */}
        {visibleSettingsItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="px-3 text-xs font-normal text-gray-500">
              Configuration
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleSettingsItems.map((item) => {
                  const isActiveRoute = isActive(item.url);
                  
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild
                        isActive={isActiveRoute}
                        tooltip={state === "collapsed" ? item.title : undefined}
                        className={cn(
                          "relative flex items-center gap-3 px-3 py-2 text-sm font-medium",
                          "transition-colors hover:bg-gray-50",
                          isActiveRoute 
                            ? "text-blue-600 font-semibold before:absolute before:left-0 before:top-0 before:bottom-0 before:w-0.5 before:bg-blue-600" 
                            : "text-gray-700"
                        )}
                      >
                        <NavLink to={item.url}>
                          <item.icon className={cn(
                            "size-4",
                            isActiveRoute ? "text-blue-600" : "text-gray-500"
                          )} />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="bg-white border-t border-[#E3E8EE]">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              asChild 
              className="hover:bg-gray-50"
              tooltip={state === "collapsed" ? "Settings" : undefined}
            >
              <NavLink to="/admin/settings">
                <Settings className="size-4 text-gray-500" />
                <span className="text-gray-700">Settings</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}