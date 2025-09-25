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

export function MobileSidebar() {
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
    `flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
      isActive 
        ? 'bg-primary text-primary-foreground' 
        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
    }`;

  // Filter navigation items based on permissions
  const visibleItems = navigationItems.filter(item => 
    !item.permission || hasPermission(item.permission)
  );

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Crown className="w-4 h-4 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-foreground truncate">
              Admin Panel
            </h2>
            {highestRole && (
              <Badge variant="secondary" className="text-xs mt-1">
                {highestRole.role_name.replace('_', ' ')}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-1">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Administration
          </div>
          
          {visibleItems.map((item) => (
            <NavLink 
              key={item.title}
              to={item.url} 
              end={item.url === '/admin'}
              className={getNavClassName(isActive(item.url))}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="block truncate">{item.title}</span>
              </div>
              {item.badge && (
                <Badge variant="destructive" className="text-xs">
                  {item.badge}
                </Badge>
              )}
            </NavLink>
          ))}
        </div>
      </div>

      {/* System Status */}
      <div className="p-4 border-t">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          System Status
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">System Health</span>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-green-600 font-medium">Good</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Active Users</span>
            <span className="font-medium">1,247</span>
          </div>
          
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Pending Reviews</span>
            <Badge variant="secondary" className="text-xs">
              23
            </Badge>
          </div>
        </div>
      </div>

      {/* Super Admin Warning */}
      {isSuperAdmin() && (
        <div className="p-4 mx-4 mb-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-yellow-800 dark:text-yellow-200">Super Admin</p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                You have full platform access. Use with caution.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}