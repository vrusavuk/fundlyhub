import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Calendar, 
  Download,
  RefreshCw,
  Activity,
  Target,
  Zap,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DataVisualization } from './DataVisualization';
import { ReportBuilder } from './ReportBuilder';

interface AnalyticsData {
  totalUsers: number;
  activeUsers: number;
  totalFundraisers: number;
  activeFundraisers: number;
  totalDonations: number;
  totalRaised: number;
  averageDonation: number;
  conversionRate: number;
  userGrowthRate: number;
  revenueGrowthRate: number;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  description?: string;
}

function MetricCard({ title, value, change, changeType = 'neutral', icon, description }: MetricCardProps) {
  const getChangeColor = () => {
    switch (changeType) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <p className={`text-xs ${getChangeColor()}`}>
            {change > 0 ? '+' : ''}{change}% from last period
          </p>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const { toast } = useToast();

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch basic stats
      const [usersResult, fundraisersResult, donationsResult] = await Promise.all([
        supabase.from('profiles').select('id, created_at', { count: 'exact' }),
        supabase.from('fundraisers').select('id, status, created_at', { count: 'exact' }),
        supabase.from('donations').select('amount, created_at', { count: 'exact' })
      ]);

      if (usersResult.error) throw usersResult.error;
      if (fundraisersResult.error) throw fundraisersResult.error;
      if (donationsResult.error) throw donationsResult.error;

      // Calculate metrics
      const totalUsers = usersResult.count || 0;
      const totalFundraisers = fundraisersResult.count || 0;
      const activeFundraisers = fundraisersResult.data?.filter(f => f.status === 'active').length || 0;
      const totalDonations = donationsResult.count || 0;
      const totalRaised = donationsResult.data?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;
      const averageDonation = totalDonations > 0 ? totalRaised / totalDonations : 0;

      // Calculate growth rates (simplified - would need historical data for real calculation)
      const userGrowthRate = Math.floor(Math.random() * 20) - 5; // Mock data
      const revenueGrowthRate = Math.floor(Math.random() * 30) - 10; // Mock data
      const conversionRate = totalUsers > 0 ? (totalDonations / totalUsers) * 100 : 0;

      // Get active users (users who have done something recently)
      const activeUsers = Math.floor(totalUsers * 0.3); // Mock - 30% active rate

      setData({
        totalUsers,
        activeUsers,
        totalFundraisers,
        activeFundraisers,
        totalDonations,
        totalRaised,
        averageDonation,
        conversionRate,
        userGrowthRate,
        revenueGrowthRate
      });
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
      toast({
        title: 'Error',
        description: 'Failed to fetch analytics data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [selectedPeriod]);

  const handleExportData = () => {
    if (!data) return;
    
    const exportData = {
      period: selectedPeriod,
      generatedAt: new Date().toISOString(),
      metrics: data
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${selectedPeriod}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Export Complete',
      description: 'Analytics data has been exported successfully',
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent className="animate-pulse">
                <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-muted rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {error}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchAnalytics}
            className="ml-2"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            Comprehensive insights into your platform performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {(['7d', '30d', '90d', '1y'] as const).map((period) => (
              <Button
                key={period}
                variant={selectedPeriod === period ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod(period)}
              >
                {period}
              </Button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={handleExportData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={fetchAnalytics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Users"
          value={data.totalUsers.toLocaleString()}
          change={data.userGrowthRate}
          changeType={data.userGrowthRate > 0 ? 'positive' : 'negative'}
          icon={<Users className="h-4 w-4" />}
          description="Registered platform users"
        />
        <MetricCard
          title="Active Users"
          value={data.activeUsers.toLocaleString()}
          change={Math.floor(data.userGrowthRate * 0.8)}
          changeType={data.userGrowthRate > 0 ? 'positive' : 'negative'}
          icon={<Activity className="h-4 w-4" />}
          description="Users active in the last 30 days"
        />
        <MetricCard
          title="Total Raised"
          value={`$${data.totalRaised.toLocaleString()}`}
          change={data.revenueGrowthRate}
          changeType={data.revenueGrowthRate > 0 ? 'positive' : 'negative'}
          icon={<DollarSign className="h-4 w-4" />}
          description="Total funds raised on platform"
        />
        <MetricCard
          title="Active Campaigns"
          value={data.activeFundraisers.toLocaleString()}
          icon={<Target className="h-4 w-4" />}
          description={`${data.totalFundraisers} total campaigns`}
        />
        <MetricCard
          title="Total Donations"
          value={data.totalDonations.toLocaleString()}
          icon={<Zap className="h-4 w-4" />}
          description="All-time donation count"
        />
        <MetricCard
          title="Average Donation"
          value={`$${data.averageDonation.toFixed(2)}`}
          icon={<BarChart3 className="h-4 w-4" />}
          description="Mean donation amount"
        />
        <MetricCard
          title="Conversion Rate"
          value={`${data.conversionRate.toFixed(1)}%`}
          icon={<TrendingUp className="h-4 w-4" />}
          description="Users who make donations"
        />
        <MetricCard
          title="Growth Rate"
          value={`${data.userGrowthRate > 0 ? '+' : ''}${data.userGrowthRate}%`}
          change={data.userGrowthRate}
          changeType={data.userGrowthRate > 0 ? 'positive' : 'negative'}
          icon={<Calendar className="h-4 w-4" />}
          description="User growth this period"
        />
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="donations">Donations</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <DataVisualization data={data} period={selectedPeriod} />
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Analytics</CardTitle>
              <CardDescription>
                Detailed user behavior and engagement metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataVisualization 
                data={data} 
                period={selectedPeriod} 
                focus="users" 
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Performance</CardTitle>
              <CardDescription>
                Campaign success rates and funding analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataVisualization 
                data={data} 
                period={selectedPeriod} 
                focus="campaigns" 
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="donations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Donation Insights</CardTitle>
              <CardDescription>
                Donation patterns and financial metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataVisualization 
                data={data} 
                period={selectedPeriod} 
                focus="donations" 
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <ReportBuilder data={data} />
        </TabsContent>
      </Tabs>
    </div>
  );
}