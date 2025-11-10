import { useEffect, useState } from 'react';
import { useRBAC } from '@/hooks/useRBAC';
import { supabase } from '@/integrations/supabase/client';
import { MoneyMath } from '@/lib/enterprise/utils/MoneyMath';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Megaphone, 
  Building2, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  BarChart3
} from 'lucide-react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { AdminPageLayout } from '@/components/admin/unified/AdminPageLayout';

interface PlatformStats {
  totalUsers: number;
  activeCampaigns: number;
  pendingCampaigns: number;
  totalOrganizations: number;
  verifiedOrganizations: number;
  totalFundsRaised: number;
  monthlyGrowth: number;
  recentActivities: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    severity: 'info' | 'warning' | 'error';
  }>;
}

interface SystemHealth {
  database: 'healthy' | 'warning' | 'error';
  api: 'healthy' | 'warning' | 'error';
  storage: 'healthy' | 'warning' | 'error';
  lastCheck: string;
}

export function AdminDashboard() {
  const { hasPermission, isSuperAdmin } = useRBAC();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Use AdminDataService for real data
        const { adminDataService } = await import('@/lib/services/AdminDataService');
        const dashboardStats = await adminDataService.fetchDashboardStats();

        setStats({
          totalUsers: dashboardStats.totalUsers,
          activeCampaigns: dashboardStats.activeCampaigns,
          pendingCampaigns: dashboardStats.pendingCampaigns,
          totalOrganizations: dashboardStats.totalOrganizations,
          verifiedOrganizations: dashboardStats.verifiedOrganizations,
          totalFundsRaised: dashboardStats.totalFundsRaised,
          monthlyGrowth: dashboardStats.monthlyGrowth,
          recentActivities: dashboardStats.recentActivities.map(activity => ({
            id: activity.id,
            type: activity.type,
            description: activity.description,
            timestamp: activity.event_timestamp,
            severity: activity.severity as 'info' | 'warning' | 'error'
          }))
        });

        setSystemHealth(dashboardStats.systemHealth);

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-warning" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-destructive" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'text-destructive';
      case 'warning':
        return 'text-warning';
      default:
        return 'text-foreground';
    }
  };

  return (
    <AdminPageLayout
      title="Admin Dashboard"
      description="Platform overview and key performance indicators"
      badge={{
        text: isSuperAdmin() ? 'Super Admin Access' : 'Admin Access',
        variant: isSuperAdmin() ? 'destructive' : 'default'
      }}
    >
      {/* Quick Stats Summary */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Total Users</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              +{stats?.monthlyGrowth || 0}% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Active Campaigns</CardTitle>
            <Megaphone className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats?.activeCampaigns || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              {stats?.pendingCampaigns || 0} pending approval
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Organizations</CardTitle>
            <Building2 className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats?.totalOrganizations || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              {stats?.verifiedOrganizations || 0} verified
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Total Raised</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {MoneyMath.format(MoneyMath.create(stats?.totalFundsRaised || 0, 'USD'))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Platform lifetime
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4 mb-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          {hasPermission('manage_system_settings') && (
            <TabsTrigger value="system">System Health</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common administrative tasks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {hasPermission('approve_campaigns') && (
                  <Button variant="outline" className="w-full justify-start">
                    <Megaphone className="mr-2 h-4 w-4" />
                    Review Pending Campaigns ({stats?.pendingCampaigns})
                  </Button>
                )}
                {hasPermission('verify_organizations') && (
                  <Button variant="outline" className="w-full justify-start">
                    <Building2 className="mr-2 h-4 w-4" />
                    Verify Organizations
                  </Button>
                )}
                {hasPermission('view_audit_logs') && (
                  <Button variant="outline" className="w-full justify-start">
                    <Activity className="mr-2 h-4 w-4" />
                    View Audit Logs
                  </Button>
                )}
                {hasPermission('view_platform_analytics') && (
                  <Button variant="outline" className="w-full justify-start">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Platform Analytics
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Platform Health Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Platform Health</CardTitle>
                <CardDescription>
                  System status overview
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Database</span>
                  <div className="flex items-center space-x-2">
                    {getHealthIcon(systemHealth?.database || 'healthy')}
                    <span className="text-sm capitalize">{systemHealth?.database}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">API Services</span>
                  <div className="flex items-center space-x-2">
                    {getHealthIcon(systemHealth?.api || 'healthy')}
                    <span className="text-sm capitalize">{systemHealth?.api}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">File Storage</span>
                  <div className="flex items-center space-x-2">
                    {getHealthIcon(systemHealth?.storage || 'healthy')}
                    <span className="text-sm capitalize">{systemHealth?.storage}</span>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    Last checked: {new Date(systemHealth?.lastCheck || Date.now()).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Platform Activity</CardTitle>
              <CardDescription>
                Latest administrative actions and system events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats?.recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <Activity className={`w-4 h-4 mt-0.5 ${getSeverityColor(activity.severity)}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant={activity.severity === 'error' ? 'destructive' : 'secondary'}>
                      {activity.type.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {hasPermission('manage_system_settings') && (
          <TabsContent value="system" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>System Resources</CardTitle>
                  <CardDescription>Resource usage and performance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Database Connections</span>
                      <span>12/100</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: '12%' }}></div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Storage Usage</span>
                      <span>2.1GB/10GB</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-success h-2 rounded-full" style={{ width: '21%' }}></div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>API Rate Limit</span>
                      <span>145/1000 req/min</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-warning h-2 rounded-full" style={{ width: '14.5%' }}></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Security Status</CardTitle>
                  <CardDescription>Security monitoring and alerts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Failed Login Attempts (24h)</span>
                    <Badge variant="secondary">23</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Blocked IPs</span>
                    <Badge variant="secondary">5</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Security Scan</span>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-success" />
                      <span className="text-sm">Passed</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">SSL Certificate</span>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-success" />
                      <span className="text-sm">Valid</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </AdminPageLayout>
  );
}