import { useEffect, useState } from 'react';
import { useRBAC } from '@/hooks/useRBAC';
import { supabase } from '@/integrations/supabase/client';
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

        // Fetch platform statistics
        const [
          usersResult,
          campaignsResult,
          organizationsResult,
          fundsResult
        ] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('fundraisers').select('status', { count: 'exact' }),
          supabase.from('organizations').select('verification_status'),
          supabase.rpc('get_campaign_stats')
        ]);

        // Process campaign data
        const campaignData = campaignsResult.data || [];
        const activeCampaigns = campaignData.filter(c => c.status === 'active').length;
        const pendingCampaigns = campaignData.filter(c => c.status === 'pending').length;

        // Process organization data
        const orgData = organizationsResult.data || [];
        const verifiedOrgs = orgData.filter(o => o.verification_status === 'approved').length;

        // Mock recent activities (in real implementation, this would come from audit logs)
        const recentActivities = [
          {
            id: '1',
            type: 'campaign_approved',
            description: 'Campaign "Help Local Animal Shelter" was approved',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            severity: 'info' as const
          },
          {
            id: '2',
            type: 'user_suspended',
            description: 'User account suspended due to policy violation',
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            severity: 'warning' as const
          },
          {
            id: '3',
            type: 'organization_verified',
            description: 'Non-profit organization "Green Earth Foundation" verified',
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            severity: 'info' as const
          }
        ];

        setStats({
          totalUsers: usersResult.count || 0,
          activeCampaigns,
          pendingCampaigns,
          totalOrganizations: orgData.length,
          verifiedOrganizations: verifiedOrgs,
          totalFundsRaised: fundsResult.data?.[0]?.total_funds_raised || 0,
          monthlyGrowth: 12.5, // Mock data
          recentActivities
        });

        // Mock system health data
        setSystemHealth({
          database: 'healthy',
          api: 'healthy',
          storage: 'healthy',
          lastCheck: new Date().toISOString()
        });

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Platform overview and key performance indicators
          </p>
        </div>
        <Badge variant={isSuperAdmin() ? 'destructive' : 'default'}>
          {isSuperAdmin() ? 'Super Admin' : 'Admin'} Access
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-success">+{stats?.monthlyGrowth}%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <Megaphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeCampaigns}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.pendingCampaigns} pending approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organizations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalOrganizations}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.verifiedOrganizations} verified
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Raised</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.totalFundsRaised || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline w-3 h-3 mr-1" />
              Platform lifetime
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
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
    </div>
  );
}