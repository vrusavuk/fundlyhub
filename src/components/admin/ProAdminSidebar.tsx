import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Sidebar,
  Menu,
  MenuItem,
  SubMenu,
  sidebarClasses,
} from 'react-pro-sidebar';
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
  Bell,
  ChevronLeft,
  ChevronRight,
  Menu as MenuIcon
} from 'lucide-react';
import { useRBAC } from '@/hooks/useRBAC';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

interface ProAdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function ProAdminSidebar({ collapsed, onToggle }: ProAdminSidebarProps) {
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

  // Filter navigation items based on permissions
  const visibleItems = navigationItems.filter(item => 
    !item.permission || hasPermission(item.permission)
  );

  return (
    <div className="h-full flex flex-col">
      <Sidebar
        collapsed={collapsed}
        width="260px"
        collapsedWidth="70px"
        backgroundColor="hsl(var(--card))"
        rootStyles={{
          border: 'none',
          borderRight: '1px solid hsl(var(--border))',
          height: '100%',
        }}
        className="h-full"
      >
        {/* Header */}
        <div className={cn(
          "flex items-center justify-between p-4 border-b border-border",
          collapsed ? "px-2" : "px-4"
        )}>
          {!collapsed && (
            <div className="flex items-center space-x-2">
              <Crown className="h-6 w-6 text-primary" />
              <div className="flex flex-col">
                <span className="font-semibold text-foreground text-sm">Admin Panel</span>
                {highestRole && (
                  <Badge variant="secondary" className="text-xs mt-1">
                    {highestRole.role_name.replace('_', ' ')}
                  </Badge>
                )}
              </div>
            </div>
          )}
          {collapsed && (
            <div className="flex justify-center w-full">
              <Crown className="h-6 w-6 text-primary" />
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className={cn(
              "h-8 w-8 p-0 hover:bg-muted",
              collapsed && "absolute -right-3 top-4 bg-background border border-border rounded-full shadow-sm"
            )}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation Menu */}
        <Menu
          menuItemStyles={{
            button: ({ level, active, disabled }) => ({
              color: active ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
              backgroundColor: active ? 'hsl(var(--primary) / 0.1)' : 'transparent',
              borderRight: active ? '2px solid hsl(var(--primary))' : 'none',
              fontWeight: active ? '500' : '400',
              margin: '4px 8px',
              borderRadius: '6px',
              '&:hover': {
                backgroundColor: 'hsl(var(--muted) / 0.5)',
                color: 'hsl(var(--foreground))',
              },
              '&:active': {
                backgroundColor: 'hsl(var(--primary) / 0.1)',
              },
            }),
          }}
          rootStyles={{
            paddingTop: '8px',
          }}
        >
          {visibleItems.map((item) => {
            const isActiveRoute = isActive(item.url);
            
            return (
              <MenuItem
                key={item.title}
                icon={<item.icon size={18} />}
                active={isActiveRoute}
                component={<NavLink to={item.url} end={item.url === '/admin'} />}
                suffix={
                  !collapsed && item.badge ? (
                    <Badge variant="destructive" className="text-xs">
                      {item.badge}
                    </Badge>
                  ) : undefined
                }
              >
                {item.title}
              </MenuItem>
            );
          })}
        </Menu>

        {/* System Status Section */}
        {!collapsed && (
          <div className="mt-auto p-4 border-t border-border">
            <div className="space-y-3">
              <h4 className="text-xs font-medium text-muted-foreground mb-3">
                System Status
              </h4>
              
              <div className="space-y-2">
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

              {/* Super Admin Warning */}
              {isSuperAdmin() && (
                <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
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
            </div>
          </div>
        )}
      </Sidebar>
    </div>
  );
}