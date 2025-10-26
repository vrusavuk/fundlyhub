import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DisplayHeading, Text } from '@/components/ui/typography';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Calendar,
  Download,
  Filter,
  RefreshCw,
  Target,
  Activity,
  PieChart,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileStatsGrid } from '@/components/admin/mobile/MobileStatsGrid';
import { AdminStatsGrid } from '@/components/admin/AdminStatsCards';

interface AnalyticsData {
  totalUsers: number;
  activeUsers: number;
  totalFundraisers: number;
  activeFundraisers: number;
  totalDonations: number;
  totalRaised: number;
  conversionRate: number;
  avgDonation: number;
  userGrowth: number;
  revenueGrowth: number;
}

interface CategoryAnalytics {
  name: string;
  campaigns: number;
  raised: number;
  percentage: number;
}

export function Analytics() {
  const isMobile = useIsMobile();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [categories, setCategories] = useState<CategoryAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const { toast } = useToast();

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Fetch user analytics
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');
      
      if (profilesError) throw profilesError;

      // Fetch fundraiser analytics
      const { data: fundraisers, error: fundraisersError } = await supabase
        .from('fundraisers')
        .select('*, category_id');
      
      if (fundraisersError) throw fundraisersError;

      // Fetch donation analytics
      const { data: donations, error: donationsError } = await supabase
        .from('donations')
        .select('amount, created_at');
      
      if (donationsError) throw donationsError;

      // Fetch category analytics
      const { data: categoryStats, error: categoryError } = await supabase
        .rpc('get_category_stats');
      
      if (categoryError) throw categoryError;

      // Calculate analytics
      const totalUsers = profiles?.length || 0;
      const activeUsers = profiles?.filter(p => p.account_status === 'active').length || 0;
      const totalFundraisers = fundraisers?.length || 0;
      const activeFundraisers = fundraisers?.filter(f => f.status === 'active').length || 0;
      const totalDonations = donations?.length || 0;
      const totalRaised = donations?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;
      const avgDonation = totalDonations > 0 ? totalRaised / totalDonations : 0;
      const conversionRate = totalUsers > 0 ? (totalDonations / totalUsers) * 100 : 0;

      setData({
        totalUsers,
        activeUsers,
        totalFundraisers,
        activeFundraisers,
        totalDonations,
        totalRaised,
        conversionRate,
        avgDonation,
        userGrowth: 12.5, // Mock data for growth
        revenueGrowth: 18.3 // Mock data for growth
      });

      // Process category analytics
      if (categoryStats) {
        const categoryAnalytics = categoryStats.map((cat: any) => ({
          name: cat.category_name,
          campaigns: Number(cat.campaign_count),
          raised: Number(cat.total_raised),
          percentage: (Number(cat.total_raised) / totalRaised) * 100 || 0
        }));
        setCategories(categoryAnalytics);
      }

    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const MetricCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    format = 'number' 
  }: {
    title: string;
    value: number;
    change?: number;
    icon: any;
    format?: 'number' | 'currency' | 'percentage';
  }) => {
    const formatValue = (val: number) => {
      switch (format) {
        case 'currency':
          return `$${val.toLocaleString()}`;
        case 'percentage':
          return `${val.toFixed(1)}%`;
        default:
          return val.toLocaleString();
      }
    };

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatValue(value)}</div>
          {change !== undefined && (
            <p className={`text-xs flex items-center mt-1 ${
              change >= 0 ? 'text-success' : 'text-destructive'
            }`}>
              {change >= 0 ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
              {Math.abs(change)}% from last period
            </p>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-lg" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-64 bg-muted rounded-lg" />
          <div className="h-64 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <DisplayHeading level="sm" as="h1" responsive>Analytics</DisplayHeading>
          <Text size="md" emphasis="low">
            Platform performance metrics and insights
          </Text>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 days</SelectItem>
              <SelectItem value="30d">30 days</SelectItem>
              <SelectItem value="90d">90 days</SelectItem>
              <SelectItem value="1y">1 year</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchAnalytics} className="flex-1 sm:flex-none">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      {isMobile ? (
        <MobileStatsGrid 
          stats={[
            {
              title: 'Total Users',
              value: data?.totalUsers || 0,
              icon: Users,
              description: 'Registered users',
              change: data?.userGrowth ? {
                value: `+${data.userGrowth}%`,
                trend: data.userGrowth > 0 ? 'up' : 'neutral'
              } : undefined
            },
            {
              title: 'Active Campaigns',
              value: data?.activeFundraisers || 0,
              icon: Target,
              description: 'Currently running',
              color: 'success'
            },
            {
              title: 'Total Raised',
              value: `$${(data?.totalRaised || 0).toLocaleString()}`,
              icon: DollarSign,
              description: 'Platform lifetime',
              change: data?.revenueGrowth ? {
                value: `+${data.revenueGrowth}%`,
                trend: data.revenueGrowth > 0 ? 'up' : 'neutral'
              } : undefined,
              color: 'success'
            },
            {
              title: 'Conversion Rate',
              value: `${(data?.conversionRate || 0).toFixed(1)}%`,
              icon: TrendingUp,
              description: 'User to donor',
              change: {
                value: '+2.4%',
                trend: 'up'
              },
              color: 'warning'
            }
          ]}
          loading={loading}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Users"
            value={data?.totalUsers || 0}
            change={data?.userGrowth}
            icon={Users}
          />
          <MetricCard
            title="Active Campaigns"
            value={data?.activeFundraisers || 0}
            icon={Target}
          />
          <MetricCard
            title="Total Raised"
            value={data?.totalRaised || 0}
            change={data?.revenueGrowth}
            icon={DollarSign}
            format="currency"
          />
          <MetricCard
            title="Conversion Rate"
            value={data?.conversionRate || 0}
            change={2.4}
            icon={TrendingUp}
            format="percentage"
          />
        </div>
      )}

      {/* Detailed Analytics */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="w-4 h-4 mr-2" />
                  Platform Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Active Users</span>
                  <Badge variant="secondary">{data?.activeUsers || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Campaigns</span>
                  <Badge variant="secondary">{data?.totalFundraisers || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Donations</span>
                  <Badge variant="secondary">{data?.totalDonations || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Average Donation</span>
                  <Badge variant="secondary">${(data?.avgDonation || 0).toFixed(2)}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="w-4 h-4 mr-2" />
                  Campaign Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Active Campaigns</span>
                    <span>{data?.activeFundraisers || 0}</span>
                  </div>
                  <Progress 
                    value={data?.totalFundraisers ? (data.activeFundraisers / data.totalFundraisers) * 100 : 0} 
                    className="h-2"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total Campaigns</span>
                    <span>{data?.totalFundraisers || 0}</span>
                  </div>
                  <Progress value={100} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Category Performance</CardTitle>
              <CardDescription>
                Breakdown of campaigns and fundraising by category
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categories.map((category) => (
                  <div key={category.name} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{category.name}</span>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{category.campaigns} campaigns</Badge>
                        <Badge variant="secondary">${category.raised.toLocaleString()}</Badge>
                      </div>
                    </div>
                    <Progress value={category.percentage} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {category.percentage.toFixed(1)}% of total funds raised
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">
                  {data?.activeFundraisers && data?.totalFundraisers 
                    ? ((data.activeFundraisers / data.totalFundraisers) * 100).toFixed(1)
                    : '0.0'
                  }%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Active vs total campaigns
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">User Engagement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {data?.totalUsers && data?.activeUsers
                    ? ((data.activeUsers / data.totalUsers) * 100).toFixed(1)
                    : '0.0'
                  }%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Active user ratio
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Platform Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">Good</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Overall system status
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}