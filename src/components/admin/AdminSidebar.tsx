import { NavLink, useLocation } from 'react-router-dom';
import {
  BarChart3,
  Users,
  Building2,
  Megaphone,
  Settings,
  Shield,
  Activity,
  Database,
  AlertTriangle,
  UserCheck,
  Crown,
  PieChart,
  FileText,
  Bell
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  SidebarHeader,
  useSidebar
} from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useRBAC } from '@/hooks/useRBAC';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface AdminNavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
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
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const { hasPermission, isSuperAdmin, getHighestRole } = useRBAC();
  
  const currentPath = location.pathname;
  const highestRole = getHighestRole();

  const isActive = (path: string) => {
    if (path === '/admin') {
      return currentPath === '/admin';
    }
    return currentPath.startsWith(path);
  };

  const getNavClassName = (isActive: boolean) => 
    `group relative transition-all duration-200 ${
      isActive 
        ? 'bg-sidebar-accent text-sidebar-accent-foreground border-r-2 border-primary' 
        : 'hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
    }`;

  // Filter navigation items based on permissions
  const visibleItems = navigationItems.filter(item => 
    !item.permission || hasPermission(item.permission)
  );

  return (
    <TooltipProvider>
      <Sidebar 
        variant="sidebar" 
        collapsible="icon"
        className="border-r border-border bg-card"
      >
        <SidebarHeader className="border-b border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Crown className="h-6 w-6 text-primary" />
              {!collapsed && (
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground">Admin Panel</span>
                  {highestRole && (
                    <Badge variant="secondary" className="text-xs mt-1">
                      {highestRole.role_name.replace('_', ' ')}
                    </Badge>
                  )}
                </div>
              )}
            </div>
            <SidebarTrigger className="h-8 w-8" />
          </div>
        </SidebarHeader>

        <SidebarContent className="px-2">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {visibleItems.map((item) => {
                  const isActiveRoute = isActive(item.url);
                  
                  return (
                    <SidebarMenuItem key={item.title}>
                      <Tooltip delayDuration={collapsed ? 300 : 0}>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton 
                            asChild 
                            className={cn(
                              "w-full justify-start transition-colors duration-200",
                              isActiveRoute 
                                ? "bg-primary/10 text-primary border-r-2 border-primary font-medium" 
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            )}
                          >
                            <NavLink 
                              to={item.url}
                              end={item.url === '/admin'}
                              className="flex items-center gap-3 px-3 py-2 rounded-md"
                            >
                              <item.icon className="h-4 w-4 flex-shrink-0" />
                              {!collapsed && (
                                <>
                                  <span className="flex-1">{item.title}</span>
                                  {item.badge && (
                                    <Badge variant="destructive" className="text-xs ml-auto">
                                      {item.badge}
                                    </Badge>
                                  )}
                                </>
                              )}
                            </NavLink>
                          </SidebarMenuButton>
                        </TooltipTrigger>
                        {collapsed && (
                          <TooltipContent side="right" className="font-medium">
                            {item.title}
                            {item.badge && (
                              <span className="ml-2 px-2 py-1 text-xs bg-destructive text-destructive-foreground rounded-full">
                                {item.badge}
                              </span>
                            )}
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* System Status */}
          {!collapsed && (
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-medium text-muted-foreground px-4 mb-2">
                System Status
              </SidebarGroupLabel>
              
              <div className="px-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">System Health</span>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-green-500 font-medium">Good</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Active Users</span>
                  <span className="text-foreground font-medium">1,247</span>
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Pending Reviews</span>
                  <Badge variant="secondary" className="text-xs">
                    23
                  </Badge>
                </div>
              </div>
            </SidebarGroup>
          )}

          {/* Super Admin Warning */}
          {isSuperAdmin() && !collapsed && (
            <div className="px-4 py-3 mx-4 mb-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-yellow-500">Super Admin</p>
                  <p className="text-xs text-yellow-500/80 mt-1">
                    You have full platform access. Use with caution.
                  </p>
                </div>
              </div>
            </div>
          )}
        </SidebarContent>
      </Sidebar>
    </TooltipProvider>
  );
}