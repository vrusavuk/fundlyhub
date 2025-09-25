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
  useSidebar
} from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useRBAC } from '@/hooks/useRBAC';
import { Badge } from '@/components/ui/badge';

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
      <Sidebar className={`${collapsed ? 'w-18' : 'w-64'} border-r bg-sidebar`}>
        <SidebarContent>
        {/* Header */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Crown className="w-4 h-4 text-primary-foreground" />
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-semibold text-sidebar-foreground truncate">
                  Admin Panel
                </h2>
                {highestRole && (
                  <Badge variant="secondary" className="text-xs mt-1">
                    {highestRole.role_name.replace('_', ' ')}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-sidebar-foreground/70 px-4 mb-2">
            Administration
          </SidebarGroupLabel>
          
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    {collapsed ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <NavLink 
                            to={item.url} 
                            end={item.url === '/admin'}
                            className={`${getNavClassName(isActive(item.url))} justify-center`}
                          >
                            <item.icon className="w-4 h-4 flex-shrink-0" />
                          </NavLink>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <p>{item.title}</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <NavLink 
                        to={item.url} 
                        end={item.url === '/admin'}
                        className={getNavClassName(isActive(item.url))}
                      >
                        <item.icon className="w-4 h-4 flex-shrink-0" />
                        <span className="font-medium">{item.title}</span>
                        {item.badge && (
                          <Badge variant="destructive" className="text-xs ml-auto">
                            {item.badge}
                          </Badge>
                        )}
                      </NavLink>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* System Status */}
        {!collapsed && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-medium text-sidebar-foreground/70 px-4 mb-2">
              System Status
            </SidebarGroupLabel>
            
            <div className="px-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-sidebar-foreground/60">System Health</span>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-success rounded-full"></div>
                  <span className="text-success font-medium">Good</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <span className="text-sidebar-foreground/60">Active Users</span>
                <span className="text-sidebar-foreground font-medium">1,247</span>
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <span className="text-sidebar-foreground/60">Pending Reviews</span>
                <Badge variant="secondary" className="text-xs">
                  23
                </Badge>
              </div>
            </div>
          </SidebarGroup>
        )}

        {/* Super Admin Warning */}
        {isSuperAdmin() && !collapsed && (
          <div className="px-4 py-3 mx-4 mb-4 bg-warning/10 border border-warning/20 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-warning">Super Admin</p>
                <p className="text-xs text-warning/80 mt-1">
                  You have full platform access. Use with caution.
                </p>
              </div>
            </div>
          </div>
        )}
        </SidebarContent>

        {/* Toggle button */}
        <div className="p-2 border-t border-sidebar-border">
          <SidebarTrigger className="w-full" />
        </div>
      </Sidebar>
    </TooltipProvider>
  );
}